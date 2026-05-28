export function buildLlmPrompt(input: { question: string }): {
  developer: string;
  user: string;
} {
  return {
    developer:
      "You are a coding competitor in a battle royale. Solve the given programming challenge. Write a short Python program. The program must print only the final answer to stdout. No explanations. No markdown. No file access. No network access. No external packages.",
    user: `Programming challenge:\n${input.question}\n\nReturn only Python code.`,
  };
}

export function stripMarkdownFences(value: string): string {
  const trimmed = value.trim();

  const fencedBlock = trimmed.match(/^```(?:python|py)?\s*([\s\S]*?)\s*```$/i);
  if (fencedBlock?.[1]) {
    return fencedBlock[1].trim();
  }

  const firstFencedBlock = trimmed.match(/```(?:python|py)?\s*([\s\S]*?)\s*```/i);
  if (firstFencedBlock?.[1]) {
    return firstFencedBlock[1].trim();
  }

  return trimmed.replace(/^```(?:python|py)?\s*/i, "").replace(/\s*```$/i, "").trim();
}
