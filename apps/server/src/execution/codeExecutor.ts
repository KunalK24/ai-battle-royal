import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PYTHON_COMMAND } from "../config.js";

export type CodeExecutionResult = {
  success: boolean;
  stdout: string;
  stderr: string;
  errorMessage?: string;
};

type CommandAttemptResult = CodeExecutionResult & {
  commandNotFound?: boolean;
};

function truncateToBytes(value: string, maxBytes: number): string {
  const buffer = Buffer.from(value, "utf8");
  if (buffer.byteLength <= maxBytes) {
    return value;
  }

  return buffer.subarray(0, maxBytes).toString("utf8");
}

function collectOutput(maxBytes: number) {
  const stdoutChunks: Buffer[] = [];
  const stderrChunks: Buffer[] = [];
  let stdoutBytes = 0;
  let stderrBytes = 0;

  return {
    pushStdout(chunk: Buffer) {
      if (stdoutBytes >= maxBytes) {
        return;
      }

      const remaining = maxBytes - stdoutBytes;
      const nextChunk = chunk.subarray(0, remaining);
      stdoutChunks.push(nextChunk);
      stdoutBytes += nextChunk.length;
    },
    pushStderr(chunk: Buffer) {
      if (stderrBytes >= maxBytes) {
        return;
      }

      const remaining = maxBytes - stderrBytes;
      const nextChunk = chunk.subarray(0, remaining);
      stderrChunks.push(nextChunk);
      stderrBytes += nextChunk.length;
    },
    readStdout() {
      return Buffer.concat(stdoutChunks, stdoutBytes).toString("utf8");
    },
    readStderr() {
      return Buffer.concat(stderrChunks, stderrBytes).toString("utf8");
    },
  };
}

function buildChildEnvironment(): NodeJS.ProcessEnv {
  const systemRoot = process.env.SYSTEMROOT ?? process.env.SystemRoot ?? "";
  const windir = process.env.WINDIR ?? process.env.Windir ?? systemRoot;
  const comspec = process.env.COMSPEC ?? process.env.ComSpec ?? "";

  return {
    SYSTEMROOT: systemRoot,
    SystemRoot: systemRoot,
    WINDIR: windir,
    Windir: windir,
    COMSPEC: comspec,
    ComSpec: comspec,
    TEMP: process.env.TEMP ?? "",
    TMP: process.env.TMP ?? "",
  };
}

async function runPythonCommand(
  command: string,
  codeFilePath: string,
  timeoutMs: number,
  maxOutputBytes: number,
  useShellFallback = false,
): Promise<CommandAttemptResult> {
  return await new Promise((resolve) => {
    const output = collectOutput(maxOutputBytes);
    let settled = false;
    let timedOut = false;

    const child = spawn(command, [codeFilePath], {
      stdio: ["ignore", "pipe", "pipe"],
      env: buildChildEnvironment(),
      shell: useShellFallback,
      windowsHide: true,
    });

    const timeoutId = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      output.pushStdout(chunk);
    });

    child.stderr.on("data", (chunk: Buffer) => {
      output.pushStderr(chunk);
    });

    child.on("error", (error: NodeJS.ErrnoException) => {
      if (settled) {
        return;
      }

      clearTimeout(timeoutId);
      settled = true;

      if (error.code === "ENOENT") {
        resolve({
          success: false,
          stdout: "",
          stderr: "",
          commandNotFound: true,
        });
        return;
      }

      if (error.code === "EPERM" && !useShellFallback && process.platform === "win32") {
        void runPythonCommand(command, codeFilePath, timeoutMs, maxOutputBytes, true).then(
          resolve,
        );
        return;
      }

      resolve({
        success: false,
        stdout: output.readStdout(),
        stderr: output.readStderr(),
        errorMessage: error.message,
      });
    });

    child.on("close", (exitCode, signal) => {
      if (settled) {
        return;
      }

      clearTimeout(timeoutId);
      settled = true;

      const stdout = truncateToBytes(output.readStdout(), maxOutputBytes);
      const stderr = truncateToBytes(output.readStderr(), maxOutputBytes);

      if (timedOut) {
        resolve({
          success: false,
          stdout,
          stderr,
          errorMessage: `Code execution timed out after ${timeoutMs}ms.`,
        });
        return;
      }

      if (exitCode === 0) {
        resolve({
          success: true,
          stdout,
          stderr,
        });
        return;
      }

      resolve({
        success: false,
        stdout,
        stderr,
        errorMessage: `Python exited with code ${exitCode ?? "unknown"}${signal ? ` (${signal})` : ""}.`,
      });
    });
  });
}

async function executeWithPythonCommand(
  command: string,
  code: string,
  timeoutMs: number,
  maxOutputBytes: number,
): Promise<CommandAttemptResult> {
  const tempDirectory = await mkdtemp(join(tmpdir(), "ai-battle-"));
  const codeFilePath = join(tempDirectory, "main.py");

  try {
    await writeFile(codeFilePath, code, "utf8");
    return await runPythonCommand(command, codeFilePath, timeoutMs, maxOutputBytes);
  } catch (error) {
    return {
      success: false,
      stdout: "",
      stderr: "",
      errorMessage: error instanceof Error ? error.message : "Code execution failed.",
    };
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}

export async function executePythonCode(input: {
  code: string;
  timeoutMs: number;
  maxOutputBytes: number;
}): Promise<CodeExecutionResult> {
  const result = await executeWithPythonCommand(
    PYTHON_COMMAND,
    input.code,
    input.timeoutMs,
    input.maxOutputBytes,
  );

  if (result.commandNotFound) {
    return {
      success: false,
      stdout: "",
      stderr: "",
      errorMessage: `Python command not found: ${PYTHON_COMMAND}.`,
    };
  }

  const { commandNotFound: _commandNotFound, ...cleanResult } = result;
  return cleanResult;
}
