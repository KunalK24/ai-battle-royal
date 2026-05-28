import type { BattleState, Skirmish } from "./types.js";

function cloneSkirmish(skirmish: Skirmish): Skirmish {
  return {
    ...skirmish,
    competitorIds: [...skirmish.competitorIds],
    results: skirmish.results.map((result) => ({ ...result })),
    decision: skirmish.decision
      ? {
          ...skirmish.decision,
          eliminatedCompetitorIds: [...skirmish.decision.eliminatedCompetitorIds],
        }
      : null,
  };
}

function cloneBattleState(state: BattleState): BattleState {
  return {
    ...state,
    config: {
      ...state.config,
      competitorConfigs:
        state.config.competitorConfigs?.map((competitorConfig) => ({
          ...competitorConfig,
        })) ?? null,
    },
    competitors: state.competitors.map((competitor) => ({ ...competitor })),
    queuedChallenges: state.queuedChallenges.map((challenge) => ({
      ...challenge,
    })),
    skirmishes: state.skirmishes.map(cloneSkirmish),
    eventLog: state.eventLog.map((event) => ({ ...event })),
  };
}

function createInitialBattleState(): BattleState {
  return {
    battleId: null,
    status: "waiting",
    config: {
      competitorConfigs: null,
    },
    competitors: [],
    queuedChallenges: [],
    skirmishes: [],
    eventLog: [],
    startedAt: null,
    finishedAt: null,
    winnerCompetitorId: null,
  };
}

let battleState = createInitialBattleState();

export function getBattleState(): BattleState {
  return cloneBattleState(battleState);
}

export function setBattleState(nextState: BattleState): BattleState {
  battleState = cloneBattleState(nextState);
  return getBattleState();
}

export function updateBattleState(
  updater: (state: BattleState) => BattleState,
): BattleState {
  return setBattleState(updater(getBattleState()));
}

export function resetBattleState(): BattleState {
  battleState = createInitialBattleState();
  return getBattleState();
}
