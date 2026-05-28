import type { AgentResult, BattleCompetitor, Challenge } from "../types.js";
import { runMockAgent } from "./mockAgent.js";

export async function runAgent(input: {
  competitor: BattleCompetitor;
  challenge: Challenge;
  timeoutMs: number;
}): Promise<AgentResult> {
  const agentMode = process.env.AGENT_MODE ?? "mock";

  if (agentMode !== "mock") {
    throw new Error(`Unsupported AGENT_MODE: ${agentMode}`);
  }

  return runMockAgent(input);
}
