import { randomUUID } from "node:crypto";

import { getBattleState, setBattleState, updateBattleState } from "../store.js";
import type {
  BattleCompetitor,
  BattleCompetitorConfig,
  BattleEvent,
  BattleState,
  Challenge,
  ChallengeStatus,
  Skirmish,
} from "../types.js";
import { DEFAULT_COMPETITOR_MODEL, OPENAI_MODELS } from "../config.js";
import {
  selectAliveCompetitors,
  selectCanConfigureBattle,
  selectHasActiveBattle,
  selectRandomSkirmishCompetitors,
} from "./selectors.js";
import { runSkirmish } from "./skirmishRunner.js";

const MAX_CHALLENGE_TEXT_LENGTH = 1000;
const MAX_COMPETITOR_NAME_LENGTH = 40;
const MAX_COMPETITOR_COUNT = 24;

let queueProcessor: Promise<void> | null = null;
let nextBattleId = 1;
let nextSkirmishId = 1;

function createBattleId(): string {
  return String(nextBattleId++);
}

function createSkirmishId(): string {
  return String(nextSkirmishId++);
}

function createEvent(type: BattleEvent["type"], message: string): BattleEvent {
  return {
    id: randomUUID(),
    type,
    message,
    createdAt: new Date().toISOString(),
  };
}

function createCompetitors(configs: BattleCompetitorConfig[]): BattleCompetitor[] {
  return configs.map((config) => ({
    id: randomUUID(),
    name: config.name,
    model: config.model,
    status: "alive" as const,
  }));
}

function normalizeSubmittedBy(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "Anonymous";
  }

  return trimmed.slice(0, 40);
}

function validateChallengeText(value: string, fieldName: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error(`${fieldName} is required.`);
  }
  if (trimmed.length > MAX_CHALLENGE_TEXT_LENGTH) {
    throw new Error(`${fieldName} must be 1,000 characters or fewer.`);
  }
  return trimmed;
}

function normalizeCompetitorName(value: unknown, index: number): string {
  if (typeof value !== "string") {
    throw new Error(`Competitor ${index + 1} name is required.`);
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error(`Competitor ${index + 1} name is required.`);
  }

  return trimmed.slice(0, MAX_COMPETITOR_NAME_LENGTH);
}

function normalizeCompetitorModel(value: unknown, index: number): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return DEFAULT_COMPETITOR_MODEL;
  }

  const model = value.trim();
  if (!OPENAI_MODELS.includes(model)) {
    throw new Error(
      `Competitor ${index + 1} model must be one of: ${OPENAI_MODELS.join(", ")}.`,
    );
  }

  return model;
}

function normalizeCompetitorConfigs(
  competitorConfigs: Array<{ name?: unknown; model?: unknown }>,
): BattleCompetitorConfig[] {
  if (competitorConfigs.length < 2 || competitorConfigs.length > MAX_COMPETITOR_COUNT) {
    throw new Error("competitorConfigs must contain between 2 and 24 competitors.");
  }

  return competitorConfigs.map((competitorConfig, index) => ({
    name: normalizeCompetitorName(competitorConfig.name, index),
    model: normalizeCompetitorModel(competitorConfig.model, index),
  }));
}

function createChallenge(input: {
  submittedBy: string;
  question: string;
  expectedAnswer: string;
}): Challenge {
  return {
    id: randomUUID(),
    submittedBy: input.submittedBy,
    question: input.question,
    expectedAnswer: input.expectedAnswer,
    status: "queued",
    submittedAt: new Date().toISOString(),
  };
}

function createRunningSkirmish(input: {
  challenge: Challenge;
  competitors: BattleCompetitor[];
}): Skirmish {
  return {
    id: createSkirmishId(),
    challengeId: input.challenge.id,
    competitorIds: input.competitors.map((competitor) => competitor.id),
    status: "running",
    startedAt: new Date().toISOString(),
    finishedAt: null,
    results: [],
    decision: null,
  };
}

function assertCanConfigureBattle(state: BattleState): void {
  if (!selectCanConfigureBattle(state)) {
    throw new Error("Battle configuration cannot be changed while active.");
  }
}

function assertBattleNotActive(state: BattleState): void {
  if (selectHasActiveBattle(state)) {
    throw new Error("Battle is already active.");
  }
}

function selectQueuedChallenge(state: BattleState): Challenge | undefined {
  return state.queuedChallenges.find((challenge) => challenge.status === "queued");
}

function hasRunningSkirmish(state: BattleState): boolean {
  return state.skirmishes.some((skirmish) => skirmish.status === "running");
}

function finalizeBattleIfNeeded(state: BattleState): BattleState {
  const aliveCompetitors = selectAliveCompetitors(state);

  if (aliveCompetitors.length !== 1) {
    return state;
  }

  const winner = aliveCompetitors[0];

  return {
    ...state,
    status: "finished",
    finishedAt: new Date().toISOString(),
    winnerCompetitorId: winner.id,
    eventLog: [
      ...state.eventLog,
      createEvent("battle_finished", `Battle finished. ${winner.name} is the winner.`),
    ],
  };
}

function applySkirmishOutcome(
  state: BattleState,
  runningSkirmish: Skirmish,
  results: Skirmish["results"],
  decision: NonNullable<Skirmish["decision"]>,
): BattleState {
  const finishedAt = new Date().toISOString();
  const challengeStatus: ChallengeStatus = decision.canceled
    ? "canceled"
    : "completed";
  const updatedChallenges = state.queuedChallenges.map((challenge) =>
    challenge.id === runningSkirmish.challengeId
      ? {
          ...challenge,
          status: challengeStatus,
        }
      : challenge,
  );
  const completedSkirmish: Skirmish = {
    ...runningSkirmish,
    status: decision.canceled ? "canceled" : "completed",
    finishedAt,
    results,
    decision,
  };

  const nextCompetitors = decision.canceled
    ? state.competitors
    : state.competitors.map((competitor) =>
        decision.eliminatedCompetitorIds.includes(competitor.id)
          ? { ...competitor, status: "eliminated" as const }
          : competitor,
      );

  const nextState: BattleState = {
    ...state,
    competitors: nextCompetitors,
    queuedChallenges: updatedChallenges,
    skirmishes: state.skirmishes.map((skirmish) =>
      skirmish.id === runningSkirmish.id ? completedSkirmish : skirmish,
    ),
    eventLog: [
      ...state.eventLog,
      createEvent(
        "skirmish_completed",
        decision.canceled
          ? `Skirmish canceled: ${decision.reason}`
          : `Skirmish completed. Eliminated ${decision.eliminatedCompetitorIds.join(", ")}.`,
      ),
    ],
  };

  return finalizeBattleIfNeeded(nextState);
}

function requestQueueProcessing(): void {
  if (queueProcessor) {
    return;
  }

  queueProcessor = processBattleQueue()
    .catch((error: unknown) => {
      console.error(error);
    })
    .finally(() => {
      queueProcessor = null;

      const state = getBattleState();
      if (state.status === "active" && state.queuedChallenges.some((challenge) => challenge.status === "queued")) {
        requestQueueProcessing();
      }
    });
}

async function processBattleQueue(): Promise<void> {
  while (true) {
    const snapshot = getBattleState();

    if (snapshot.status !== "active") {
      return;
    }

    if (hasRunningSkirmish(snapshot)) {
      return;
    }

    const aliveCompetitors = selectAliveCompetitors(snapshot);
    if (aliveCompetitors.length <= 1) {
      updateBattleState((state) => finalizeBattleIfNeeded(state));
      return;
    }

    const nextChallenge = selectQueuedChallenge(snapshot);
    if (!nextChallenge) {
      return;
    }

    const skirmishCompetitors = selectRandomSkirmishCompetitors(snapshot);
    if (skirmishCompetitors.length < 2) {
      return;
    }

    const runningSkirmish = createRunningSkirmish({
      challenge: nextChallenge,
      competitors: skirmishCompetitors,
    });
    const battleId = snapshot.battleId;

    updateBattleState((state) => ({
      ...state,
      queuedChallenges: state.queuedChallenges.map((challenge) =>
        challenge.id === nextChallenge.id
          ? { ...challenge, status: "running" as const }
          : challenge,
      ),
      skirmishes: [...state.skirmishes, runningSkirmish],
      eventLog: [
        ...state.eventLog,
        createEvent(
          "skirmish_started",
          `Skirmish ${runningSkirmish.id} started with ${skirmishCompetitors.length} competitors.`,
        ),
      ],
    }));

    const { results, decision } = await runSkirmish({
      challenge: nextChallenge,
      competitors: skirmishCompetitors,
    });

    const currentState = getBattleState();
    if (currentState.battleId !== battleId || currentState.status !== "active") {
      return;
    }

    updateBattleState((state) => applySkirmishOutcome(state, runningSkirmish, results, decision));
  }
}

export function getBattleSnapshot(): BattleState {
  return getBattleState();
}

export function configureBattle(competitorConfigs: Array<{ name?: unknown; model?: unknown }>): BattleState {
  return updateBattleState((state) => {
    assertCanConfigureBattle(state);

    const normalizedCompetitorConfigs = normalizeCompetitorConfigs(competitorConfigs);

    return {
      ...state,
      config: { competitorConfigs: normalizedCompetitorConfigs },
      eventLog: [
        ...state.eventLog,
        createEvent(
          "battle_configured",
          `Battle configured for ${normalizedCompetitorConfigs.length} competitors.`,
        ),
      ],
    };
  });
}

export function startBattle(): BattleState {
  const nextState = updateBattleState((state) => {
    assertBattleNotActive(state);

    if (state.config.competitorConfigs === null) {
      throw new Error("Battle must be configured before it can start.");
    }

    const competitorConfigs = state.config.competitorConfigs;
    nextSkirmishId = 1;

    return {
      ...state,
      battleId: createBattleId(),
      status: "active",
      competitors: createCompetitors(competitorConfigs),
      queuedChallenges: state.queuedChallenges.filter(
        (challenge) => challenge.status === "queued",
      ),
      skirmishes: [],
      startedAt: new Date().toISOString(),
      finishedAt: null,
      winnerCompetitorId: null,
      eventLog: [
        ...state.eventLog,
        createEvent(
          "battle_started",
          `Battle started with ${competitorConfigs.length} competitors.`,
        ),
      ],
    };
  });

  requestQueueProcessing();
  return nextState;
}

export function resetBattle(): BattleState {
  const previousState = getBattleState();
  const nextState = setBattleState({
    battleId: null,
    status: "waiting",
    config: previousState.config,
    competitors: [],
    queuedChallenges: [],
    skirmishes: [],
    eventLog: [
      ...previousState.eventLog,
      createEvent("battle_reset", "Battle was reset."),
    ],
    startedAt: null,
    finishedAt: null,
    winnerCompetitorId: null,
  });

  nextSkirmishId = 1;
  return nextState;
}

export function clearQueuedChallenges(): BattleState {
  return updateBattleState((state) => {
    const queuedCount = state.queuedChallenges.filter(
      (challenge) => challenge.status === "queued",
    ).length;

    return {
      ...state,
      queuedChallenges: state.queuedChallenges.filter(
        (challenge) => challenge.status !== "queued",
      ),
      eventLog: [
        ...state.eventLog,
        createEvent(
          "queue_cleared",
          queuedCount === 0
            ? "No queued challenges were waiting."
            : `Cleared ${queuedCount} queued challenge${queuedCount === 1 ? "" : "s"}.`,
        ),
      ],
    };
  });
}

export function submitChallenge(input: {
  submittedBy: string;
  question: string;
  expectedAnswer: string;
}): BattleState {
  const submittedBy = normalizeSubmittedBy(input.submittedBy);
  const question = validateChallengeText(input.question, "question");
  const expectedAnswer = validateChallengeText(
    input.expectedAnswer,
    "expectedAnswer",
  );

  const nextState = updateBattleState((state) => {
    const challenge = createChallenge({
      submittedBy: normalizeSubmittedBy(input.submittedBy),
      question,
      expectedAnswer,
    });
    const queueLabel = state.status === "active" ? "active battle" : "next battle";

    return {
      ...state,
      queuedChallenges: [...state.queuedChallenges, challenge],
      eventLog: [
        ...state.eventLog,
        createEvent(
          "challenge_queued",
          `Challenge queued by ${submittedBy} for the ${queueLabel}.`,
        ),
      ],
    };
  });

  if (nextState.status === "active") {
    requestQueueProcessing();
  }

  return nextState;
}
