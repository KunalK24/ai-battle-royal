export type Session =
  | {
      role: "spectator";
      username: string;
    }
  | {
      role: "admin";
      username: string;
      adminPassword: string;
    };

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

export type BattleStatus = "waiting" | "active" | "finished";

export type CompetitorStatus = "alive" | "eliminated";

export type BattleCompetitor = {
  id: string;
  name: string;
  status: CompetitorStatus;
};

export type ChallengeStatus =
  | "queued"
  | "running"
  | "completed"
  | "canceled";

export type Challenge = {
  id: string;
  submittedBy: string;
  question: string;
  status: ChallengeStatus;
  submittedAt: string;
};

export type BattleEventType =
  | "battle_configured"
  | "battle_started"
  | "battle_reset"
  | "queue_cleared"
  | "challenge_queued"
  | "skirmish_started"
  | "skirmish_completed"
  | "battle_finished";

export type BattleEvent = {
  id: string;
  type: BattleEventType;
  message: string;
  createdAt: string;
};

export type BattleConfig = {
  competitorCount: number | null;
};

export type SkirmishStatus = "running" | "completed" | "canceled";

export type Skirmish = {
  id: string;
  challengeId: string;
  competitorIds: string[];
  status: SkirmishStatus;
  startedAt: string;
  finishedAt: string | null;
  results: AgentResult[];
  decision: EliminationDecision | null;
};

export type BattleState = {
  battleId: string | null;
  status: BattleStatus;
  config: BattleConfig;
  competitors: BattleCompetitor[];
  queuedChallenges: Challenge[];
  skirmishes: Skirmish[];
  eventLog: BattleEvent[];
  startedAt: string | null;
  finishedAt: string | null;
  winnerCompetitorId: string | null;
};

export type SubmitChallengeInput = {
  submittedBy: string;
  question: string;
  expectedAnswer: string;
};

export type ConfigureBattleInput = {
  competitorCount: number;
};
