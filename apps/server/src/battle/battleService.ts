import { randomUUID } from "node:crypto";

import { getBattleState, setBattleState, updateBattleState } from "../store.js";
import type {
  BattleCompetitor,
  BattleEvent,
  BattleState,
  Challenge,
} from "../types.js";
import {
  selectCanConfigureBattle,
  selectHasActiveBattle,
} from "./selectors.js";

const MAX_CHALLENGE_TEXT_LENGTH = 1000;
const MAX_COMPETITOR_COUNT = 24;

function createEvent(type: BattleEvent["type"], message: string): BattleEvent {
  return {
    id: randomUUID(),
    type,
    message,
    createdAt: new Date().toISOString(),
  };
}

function createCompetitors(count: number): BattleCompetitor[] {
  return Array.from({ length: count }, (_value, index) => ({
    id: randomUUID(),
    name: `Competitor ${index + 1}`,
    status: "alive" as const,
  }));
}

function trimOrThrow(value: string, fieldName: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error(`${fieldName} is required.`);
  }
  return trimmed;
}

function validateChallengeText(value: string, fieldName: string): string {
  const trimmed = trimOrThrow(value, fieldName);
  if (trimmed.length > MAX_CHALLENGE_TEXT_LENGTH) {
    throw new Error(`${fieldName} must be 1,000 characters or fewer.`);
  }
  return trimmed;
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

export function getBattleSnapshot(): BattleState {
  return getBattleState();
}

export function configureBattle(competitorCount: number): BattleState {
  if (
    !Number.isInteger(competitorCount) ||
    competitorCount < 2 ||
    competitorCount > MAX_COMPETITOR_COUNT
  ) {
    throw new Error("competitorCount must be an integer between 2 and 24.");
  }

  return updateBattleState((state) => {
    assertCanConfigureBattle(state);

    return {
      ...state,
      config: { competitorCount },
      eventLog: [
        ...state.eventLog,
        createEvent(
          "battle_configured",
          `Battle configured for ${competitorCount} competitors.`,
        ),
      ],
    };
  });
}

export function startBattle(): BattleState {
  return updateBattleState((state) => {
    assertBattleNotActive(state);

    if (state.config.competitorCount === null) {
      throw new Error("Battle must be configured before it can start.");
    }
    const competitorCount = state.config.competitorCount;

    return {
      ...state,
      battleId: randomUUID(),
      status: "active",
      competitors: createCompetitors(competitorCount),
      startedAt: new Date().toISOString(),
      finishedAt: null,
      winnerCompetitorId: null,
      eventLog: [
        ...state.eventLog,
        createEvent(
          "battle_started",
          `Battle started with ${competitorCount} competitors.`,
        ),
      ],
    };
  });
}

export function resetBattle(): BattleState {
  const previousState = getBattleState();
  return setBattleState({
    battleId: null,
    status: "waiting",
    config: previousState.config,
    competitors: [],
    queuedChallenges: [],
    eventLog: [
      ...previousState.eventLog,
      createEvent("battle_reset", "Battle was reset."),
    ],
    startedAt: null,
    finishedAt: null,
    winnerCompetitorId: null,
  });
}

export function submitChallenge(input: {
  submittedBy: string;
  question: string;
  expectedAnswer: string;
}): BattleState {
  const submittedBy = trimOrThrow(input.submittedBy, "submittedBy");
  const question = validateChallengeText(input.question, "question");
  const expectedAnswer = validateChallengeText(
    input.expectedAnswer,
    "expectedAnswer",
  );

  return updateBattleState((state) => {
    const challenge = createChallenge({
      submittedBy,
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
}
