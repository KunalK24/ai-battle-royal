import express, { type ErrorRequestHandler, type Response } from "express";
import cors from "cors";
import { HOST, PORT } from "./config.js";
import { requireAdminPassword } from "./middleware.js";
import {
  clearQueuedChallenges,
  configureBattle,
  getBattleSnapshot,
  resetBattle,
  startBattle,
  submitChallenge,
} from "./battle/battleService.js";
import type { BattleState, Challenge } from "./types.js";
import { AGENT_MODE, DEFAULT_COMPETITOR_MODEL, OPENAI_MODELS } from "./config.js";

type PublicChallenge = Omit<Challenge, "expectedAnswer">;

type PublicBattleState = Omit<BattleState, "queuedChallenges"> & {
  queuedChallenges: PublicChallenge[];
};

const app = express();
app.use(cors());
app.use(express.json());

function toPublicBattleState(state: BattleState): PublicBattleState {
  return {
    ...state,
    queuedChallenges: state.queuedChallenges.map(
      ({ expectedAnswer, ...challenge }) => challenge,
    ),
  };
}

function respondWithError(res: Response, error: unknown): void {
  if (error instanceof Error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(500).json({ error: "Internal server error" });
}

function readTextField(value: unknown): string {
  return typeof value === "string" ? value : "";
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    agentMode: AGENT_MODE,
    defaultModel: DEFAULT_COMPETITOR_MODEL,
    allowedModels: OPENAI_MODELS,
  });
});

app.get("/api/models", (_req, res) => {
  res.json({
    models: OPENAI_MODELS,
  });
});

app.get("/api/state", (_req, res) => {
  res.json(toPublicBattleState(getBattleSnapshot()));
});

app.post("/api/challenges", (req, res) => {
  try {
    const nextState = submitChallenge({
      submittedBy: readTextField(req.body?.submittedBy),
      question: readTextField(req.body?.question),
      expectedAnswer: readTextField(req.body?.expectedAnswer),
    });

    res.json(toPublicBattleState(nextState));
  } catch (error) {
    respondWithError(res, error);
  }
});

app.post("/api/admin/config", requireAdminPassword, (req, res) => {
  try {
    const nextState = configureBattle(Array.isArray(req.body?.competitorConfigs) ? req.body.competitorConfigs : []);
    res.json(toPublicBattleState(nextState));
  } catch (error) {
    respondWithError(res, error);
  }
});

app.post("/api/admin/start", requireAdminPassword, (_req, res) => {
  try {
    const nextState = startBattle();
    res.json(toPublicBattleState(nextState));
  } catch (error) {
    respondWithError(res, error);
  }
});

app.post("/api/admin/reset", requireAdminPassword, (_req, res) => {
  try {
    const nextState = resetBattle();
    res.json(toPublicBattleState(nextState));
  } catch (error) {
    respondWithError(res, error);
  }
});

app.post("/api/admin/clear-queue", requireAdminPassword, (_req, res) => {
  try {
    const nextState = clearQueuedChallenges();
    res.json(toPublicBattleState(nextState));
  } catch (error) {
    respondWithError(res, error);
  }
});

const jsonErrorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  console.error(error);
  res.status(500).json({ error: "Internal server error" });
};

app.use(jsonErrorHandler);

app.listen(PORT, HOST, () => {
  console.log(`Server listening on ${HOST}:${PORT}`);
});

export { app };
