export type AgentResultStatus = "answered" | "timeout" | "error";

export type AgentResult = {
  competitorId: string;
  status: AgentResultStatus;
  answer: string | null;
  durationMs: number;
  code?: string;
  stdout?: string;
  stderr?: string;
  errorMessage?: string;
};

export type EliminationDecision = {
  canceled: boolean;
  eliminatedCompetitorIds: string[];
  reason: string;
};
