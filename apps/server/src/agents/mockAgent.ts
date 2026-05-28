import type { AgentResult, BattleCompetitor, Challenge } from "../types.js";

const MOCK_DELAY_BASE_MS = 10;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getMockBehavior(competitor: BattleCompetitor): "correct" | "incorrect" | "timeout" | "error" {
  const match = competitor.name.match(/(\d+)$/);
  const competitorNumber = match ? Number.parseInt(match[1], 10) : 1;

  switch ((competitorNumber - 1) % 4) {
    case 0:
      return "correct";
    case 1:
      return "incorrect";
    case 2:
      return "timeout";
    default:
      return "error";
  }
}

export async function runMockAgent(input: {
  competitor: BattleCompetitor;
  challenge: Challenge;
  timeoutMs: number;
}): Promise<AgentResult> {
  const behavior = getMockBehavior(input.competitor);
  const responseDelayMs = MOCK_DELAY_BASE_MS + (input.competitor.name.length % 5) * 5;

  switch (behavior) {
    case "correct":
      await delay(responseDelayMs);
      return {
        competitorId: input.competitor.id,
        status: "answered",
        answer: input.challenge.expectedAnswer,
        durationMs: responseDelayMs,
        stdout: input.challenge.expectedAnswer,
      };
    case "incorrect":
      await delay(responseDelayMs + 5);
      return {
        competitorId: input.competitor.id,
        status: "answered",
        answer: `${input.challenge.expectedAnswer} (mock wrong answer)`,
        durationMs: responseDelayMs + 5,
        stdout: "mock wrong answer",
      };
    case "timeout":
      await delay(5);
      return {
        competitorId: input.competitor.id,
        status: "timeout",
        answer: null,
        durationMs: input.timeoutMs,
      };
    case "error":
      await delay(responseDelayMs);
      return {
        competitorId: input.competitor.id,
        status: "error",
        answer: null,
        durationMs: responseDelayMs,
        errorMessage: "Mock agent error",
      };
  }
}
