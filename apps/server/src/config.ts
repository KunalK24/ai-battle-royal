import "dotenv/config";

const DEFAULT_PORT = 3000;
const DEFAULT_ADMIN_PASSWORD = "dev-admin-password";
const DEFAULT_AGENT_MODE = "mock";
const DEFAULT_OPENAI_MODEL = "gpt-5.2";
const DEFAULT_PYTHON_COMMAND = "python3";
const DEFAULT_CODE_TIMEOUT_MS = 3000;
const DEFAULT_MAX_OUTPUT_BYTES = 4096;
const DEFAULT_MAX_GENERATED_CODE_CHARS = 12000;

function parsePort(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeAgentMode(value: string | undefined): string {
  const normalized = value?.trim().toLowerCase();
  return normalized === "llm" ? "llm" : DEFAULT_AGENT_MODE;
}

export const PORT = parsePort(process.env.PORT);
export const HOST = "0.0.0.0";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;
export const AGENT_MODE = normalizeAgentMode(process.env.AGENT_MODE);
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim() ?? "";
export const OPENAI_MODEL = process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
export const PYTHON_COMMAND = process.env.PYTHON_COMMAND?.trim() || DEFAULT_PYTHON_COMMAND;
export const CODE_TIMEOUT_MS = parsePositiveInteger(
  process.env.CODE_TIMEOUT_MS,
  DEFAULT_CODE_TIMEOUT_MS,
);
export const MAX_OUTPUT_BYTES = parsePositiveInteger(
  process.env.MAX_OUTPUT_BYTES,
  DEFAULT_MAX_OUTPUT_BYTES,
);
export const MAX_GENERATED_CODE_CHARS = parsePositiveInteger(
  process.env.MAX_GENERATED_CODE_CHARS,
  DEFAULT_MAX_GENERATED_CODE_CHARS,
);
