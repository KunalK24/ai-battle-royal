import type {
  BattleState,
  ConfigureBattleInput,
  SubmitChallengeInput,
} from "../types/game";

const DEFAULT_API_BASE_URL = "http://localhost:3000";

function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

function buildUrl(path: string): string {
  return `${getApiBaseUrl()}${path}`;
}

async function readErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const body: unknown = await response.json();
      if (
        body &&
        typeof body === "object" &&
        "error" in body &&
        typeof (body as { error?: unknown }).error === "string"
      ) {
        return (body as { error: string }).error;
      }
    } catch {
      // Use the fallback message below.
    }
  }

  return response.statusText || "Request failed";
}

async function requestJson<T>(
  path: string,
  options: {
    method?: "GET" | "POST";
    body?: unknown;
    adminPassword?: string;
  } = {},
): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: options.method ?? "GET",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.adminPassword ? { "x-admin-password": options.adminPassword } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as T;
}

export function getBattleState(): Promise<BattleState> {
  return requestJson<BattleState>("/api/state");
}

export function submitChallenge(input: SubmitChallengeInput): Promise<BattleState> {
  return requestJson<BattleState>("/api/challenges", {
    method: "POST",
    body: input,
  });
}

export function configureBattle(
  input: ConfigureBattleInput,
  adminPassword: string,
): Promise<BattleState> {
  return requestJson<BattleState>("/api/admin/config", {
    method: "POST",
    body: input,
    adminPassword,
  });
}

export function startBattle(adminPassword: string): Promise<BattleState> {
  return requestJson<BattleState>("/api/admin/start", {
    method: "POST",
    adminPassword,
  });
}

export function resetBattle(adminPassword: string): Promise<BattleState> {
  return requestJson<BattleState>("/api/admin/reset", {
    method: "POST",
    adminPassword,
  });
}

export function clearQueuedChallenges(adminPassword: string): Promise<BattleState> {
  return requestJson<BattleState>("/api/admin/clear-queue", {
    method: "POST",
    adminPassword,
  });
}
