import type {
  AgentResult,
  BattleCompetitor,
  Challenge,
  EliminationDecision,
} from "../types.js";
import { decideEliminations } from "./rules.js";
import { runAgent } from "../agents/agentRunner.js";

const DEFAULT_SKIRMISH_TIMEOUT_MS = 60_000;

function readSkirmishTimeoutMs(): number {
  const parsed = Number.parseInt(process.env.SKIRMISH_TIMEOUT_MS ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SKIRMISH_TIMEOUT_MS;
}

export async function runSkirmish(input: {
  challenge: Challenge;
  competitors: BattleCompetitor[];
}): Promise<{ results: AgentResult[]; decision: EliminationDecision }> {
  const timeoutMs = readSkirmishTimeoutMs();
  const results = await Promise.all(
    input.competitors.map((competitor) =>
      runAgent({
        competitor,
        challenge: input.challenge,
        timeoutMs,
      }),
    ),
  );

  return {
    results,
    decision: decideEliminations(results, input.challenge.expectedAnswer),
  };
}
