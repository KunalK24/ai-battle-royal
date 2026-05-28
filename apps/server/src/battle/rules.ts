import type { AgentResult, EliminationDecision } from "../types.js";
import { normalizeAnswer } from "../utils/normalize.js";

function isCorrectAnswer(result: AgentResult, expectedAnswer: string): boolean {
  return (
    result.status === "answered" &&
    result.answer !== null &&
    normalizeAnswer(result.answer) === normalizeAnswer(expectedAnswer)
  );
}

export function decideEliminations(results: AgentResult[], expectedAnswer: string,): EliminationDecision {
  if (results.length === 0) {
    return {
      canceled: true,
      eliminatedCompetitorIds: [],
      reason: "No agent results were submitted for this skirmish.",
    };
  }

  const evaluatedResults = results.map((result) => ({
    ...result,
    isCorrect: isCorrectAnswer(result, expectedAnswer),
  }));

  const allCorrect = evaluatedResults.every((result) => result.isCorrect);

  const eliminatedCompetitorIds = allCorrect
    ? [
        evaluatedResults.reduce((slowest, current) =>
          current.durationMs > slowest.durationMs ? current : slowest,
        ).competitorId,
      ]
    : evaluatedResults
        .filter((result) => !result.isCorrect)
        .map((result) => result.competitorId);

  if (eliminatedCompetitorIds.length === results.length) {
    return {
      canceled: true,
      eliminatedCompetitorIds: [],
      reason:
        "All selected competitors would have been eliminated, so the skirmish was canceled.",
    };
  }

  return {
    canceled: false,
    eliminatedCompetitorIds,
    reason: allCorrect
      ? "All selected competitors answered correctly, so the slowest competitor was eliminated."
      : "One or more selected competitors answered incorrectly, timed out, or errored.",
  };
}