import type { AgentResult, BattleCompetitor, Challenge } from "../types.js";
import { AGENT_MODE } from "../config.js";
import { runLlmAgent } from "./llmAgent.js";
import { runMockAgent } from "./mockAgent.js";

export async function runAgent(input: {
  competitor: BattleCompetitor;
  challenge: Challenge;
  timeoutMs: number;
}): Promise<AgentResult> {
  const startedAt = Date.now();

  try {
    switch (AGENT_MODE) {
      case "llm":
        return await runLlmAgent(input);
      case "mock":
      default:
        return await runMockAgent(input);
    }
  } catch (error) {
    return {
      competitorId: input.competitor.id,
      status: "error",
      answer: null,
      durationMs: Date.now() - startedAt,
      errorMessage:
        error instanceof Error ? error.message : "Agent execution failed.",
    };
  }
}
