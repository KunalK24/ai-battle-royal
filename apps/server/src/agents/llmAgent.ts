import OpenAI from "openai";

import { CODE_TIMEOUT_MS, MAX_GENERATED_CODE_CHARS, MAX_OUTPUT_BYTES, OPENAI_API_KEY, OPENAI_MODEL } from "../config.js";
import type { AgentResult, BattleCompetitor, Challenge } from "../types.js";
import { executePythonCode } from "../execution/codeExecutor.js";
import { buildLlmPrompt, stripMarkdownFences } from "./prompts.js";

let openAIClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!OPENAI_API_KEY) {
    return null;
  }

  if (!openAIClient) {
    openAIClient = new OpenAI({ apiKey: OPENAI_API_KEY });
  }

  return openAIClient;
}

function buildErrorResult(input: {
  competitor: BattleCompetitor;
  durationMs: number;
  errorMessage: string;
  code?: string;
  stdout?: string;
  stderr?: string;
}): AgentResult {
  return {
    competitorId: input.competitor.id,
    status: "error",
    answer: null,
    durationMs: input.durationMs,
    errorMessage: input.errorMessage,
    code: input.code,
    stdout: input.stdout,
    stderr: input.stderr,
  };
}

export async function runLlmAgent(input: {
  competitor: BattleCompetitor;
  challenge: Challenge;
  timeoutMs: number;
}): Promise<AgentResult> {
  const startedAt = Date.now();
  const client = getOpenAIClient();

  if (!client) {
    return buildErrorResult({
      competitor: input.competitor,
      durationMs: Date.now() - startedAt,
      errorMessage: "OPENAI_API_KEY is not configured.",
    });
  }

  const prompt = buildLlmPrompt({ question: input.challenge.question });
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, input.timeoutMs);

  let extractedCode = "";

  try {
    const response = await client.responses.create(
      {
        model: OPENAI_MODEL,
        instructions: prompt.developer,
        input: prompt.user,
      },
      { signal: controller.signal },
    );

    const openAiElapsedMs = Date.now() - startedAt;
    const remainingSkirmishMs = input.timeoutMs - openAiElapsedMs;

    if (remainingSkirmishMs <= 0) {
      return buildErrorResult({
        competitor: input.competitor,
        durationMs: Date.now() - startedAt,
        errorMessage: "OpenAI call used the remaining skirmish time.",
      });
    }

    const rawOutput = typeof response.output_text === "string" ? response.output_text.trim() : "";
    extractedCode = stripMarkdownFences(rawOutput);

    if (!extractedCode) {
      return buildErrorResult({
        competitor: input.competitor,
        durationMs: Date.now() - startedAt,
        errorMessage: "Model did not return executable code.",
      });
    }

    if (extractedCode.length > MAX_GENERATED_CODE_CHARS) {
      return buildErrorResult({
        competitor: input.competitor,
        durationMs: Date.now() - startedAt,
        errorMessage: `Generated code exceeded ${MAX_GENERATED_CODE_CHARS} characters.`,
        code: extractedCode,
      });
    }

    const execution = await executePythonCode({
      code: extractedCode,
      timeoutMs: Math.min(CODE_TIMEOUT_MS, remainingSkirmishMs),
      maxOutputBytes: MAX_OUTPUT_BYTES,
    });

    if (!execution.success) {
      return buildErrorResult({
        competitor: input.competitor,
        durationMs: Date.now() - startedAt,
        errorMessage: execution.errorMessage ?? "Code execution failed.",
        code: extractedCode,
        stdout: execution.stdout || undefined,
        stderr: execution.stderr || undefined,
      });
    }

    const answer = execution.stdout.trim();
    if (!answer) {
      return buildErrorResult({
        competitor: input.competitor,
        durationMs: Date.now() - startedAt,
        errorMessage: "Generated code did not print an answer.",
        code: extractedCode,
        stdout: execution.stdout || undefined,
        stderr: execution.stderr || undefined,
      });
    }

    return {
      competitorId: input.competitor.id,
      status: "answered",
      answer,
      durationMs: Date.now() - startedAt,
      code: extractedCode,
      stdout: execution.stdout,
      stderr: execution.stderr || undefined,
    };
  } catch (error) {
    const isAbortError =
      error instanceof Error && (error.name === "AbortError" || error.name === "APIUserAbortError");

    return buildErrorResult({
      competitor: input.competitor,
      durationMs: Date.now() - startedAt,
      errorMessage: isAbortError
        ? "OpenAI request timed out."
        : error instanceof Error
          ? error.message
          : "OpenAI request failed.",
      code: extractedCode || undefined,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
