import { randomInt } from "node:crypto";

import type { BattleCompetitor, BattleState, Challenge } from "../types.js";

export function selectAliveCompetitors(state: BattleState): BattleCompetitor[] {
  return state.competitors.filter((competitor) => competitor.status === "alive");
}

export function selectRandomSkirmishCompetitors(
  state: BattleState,
): BattleCompetitor[] {
  const aliveCompetitors = selectAliveCompetitors(state);

  if (aliveCompetitors.length < 2) {
    return [];
  }

  const maxSkirmishSize = Math.min(4, aliveCompetitors.length);
  const skirmishSize =
    aliveCompetitors.length === 2 ? 2 : randomInt(2, maxSkirmishSize + 1);
  const shuffledCompetitors = [...aliveCompetitors];

  for (let index = shuffledCompetitors.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index + 1);
    [shuffledCompetitors[index], shuffledCompetitors[swapIndex]] = [
      shuffledCompetitors[swapIndex],
      shuffledCompetitors[index],
    ];
  }

  return shuffledCompetitors.slice(0, skirmishSize);
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
