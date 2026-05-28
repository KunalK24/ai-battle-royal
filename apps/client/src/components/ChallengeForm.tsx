import { useEffect, useState, type FormEvent } from "react";

import type { SubmitChallengeInput } from "../types/game";
import { Section } from "./Section";

type ChallengeFormProps = {
  defaultSubmittedBy: string;
  disabled: boolean;
  onSubmit: (input: SubmitChallengeInput) => Promise<void>;
};

export function ChallengeForm({
  defaultSubmittedBy,
  disabled,
  onSubmit,
}: ChallengeFormProps) {
  const [submittedBy, setSubmittedBy] = useState(defaultSubmittedBy);
  const [question, setQuestion] = useState("");
  const [expectedAnswer, setExpectedAnswer] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSubmittedBy(defaultSubmittedBy);
  }, [defaultSubmittedBy]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      await onSubmit({
        submittedBy: submittedBy.trim() || "Anonymous",
        question,
        expectedAnswer,
      });
      setQuestion("");
      setExpectedAnswer("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit challenge.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Section
      eyebrow="Spectator"
      title="Submit a challenge"
      description="Ask a question with a known answer. The battle loop will queue or skirmish it."
    >
      <form className="stack" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="field">
            <span>Submitted by</span>
            <input
              value={submittedBy}
              onChange={(event) => setSubmittedBy(event.target.value)}
              maxLength={40}
              placeholder="Your username"
              disabled={disabled}
            />
          </label>
          <label className="field field--full">
            <span>Question</span>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={1000}
              placeholder='e.g. What is the md5sum of "AI Battle Royale"?'
              rows={4}
              disabled={disabled}
            />
          </label>
          <label className="field field--full">
            <span>Expected answer</span>
            <textarea
              value={expectedAnswer}
              onChange={(event) => setExpectedAnswer(event.target.value)}
              maxLength={1000}
              placeholder="Enter the exact answer"
              rows={3}
              disabled={disabled}
            />
          </label>
        </div>

        {error ? <p className="field-error">{error}</p> : null}

        <div className="button-row">
          <button type="submit" className="button button--primary" disabled={disabled || isSaving}>
            {isSaving ? "Submitting..." : "Queue challenge"}
          </button>
          <p className="help-text">Answer checks trim whitespace but are otherwise exact.</p>
        </div>
      </form>
    </Section>
  );
}
