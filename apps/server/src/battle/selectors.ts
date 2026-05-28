import type { BattleCompetitor, BattleState, Challenge } from "../types.js";

export function selectAliveCompetitors(state: BattleState): BattleCompetitor[] {
  return state.competitors.filter((competitor) => competitor.status === "alive");
}

export function selectEliminatedCompetitors(state: BattleState): BattleCompetitor[] {
  return state.competitors.filter(
    (competitor) => competitor.status === "eliminated",
  );
}

export function selectQueuedChallenges(state: BattleState): Challenge[] {
  return state.queuedChallenges;
}

export function selectEventLog(state: BattleState) {
  return state.eventLog;
}

export function selectCanConfigureBattle(state: BattleState): boolean {
  return state.status !== "active";
}

export function selectHasActiveBattle(state: BattleState): boolean {
  return state.status === "active";
}
