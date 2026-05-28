import type { BattleState } from "./types.js";

function cloneBattleState(state: BattleState): BattleState {
  return {
    ...state,
    config: { ...state.config },
    competitors: state.competitors.map((competitor) => ({ ...competitor })),
    queuedChallenges: state.queuedChallenges.map((challenge) => ({
      ...challenge,
    })),
    eventLog: state.eventLog.map((event) => ({ ...event })),
  };
}

function createInitialBattleState(): BattleState {
  return {
    battleId: null,
    status: "waiting",
    config: {
      competitorCount: null,
    },
    competitors: [],
    queuedChallenges: [],
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
