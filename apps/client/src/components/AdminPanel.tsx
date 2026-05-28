import { useEffect, useState, type FormEvent } from "react";

import type { BattleState } from "../types/game";
import { Badge } from "./Badge";
import { Section } from "./Section";

type AdminPanelProps = {
  battleState: BattleState | null;
  disabled: boolean;
  onConfigure: (competitorCount: number) => Promise<void>;
  onStart: () => Promise<void>;
  onReset: () => Promise<void>;
  onClearQueue: () => Promise<void>;
};

export function AdminPanel({
  battleState,
  disabled,
  onConfigure,
  onStart,
  onReset,
  onClearQueue,
}: AdminPanelProps) {
  const [competitorCount, setCompetitorCount] = useState(
    battleState?.config.competitorCount?.toString() ?? "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const nextCount = battleState?.config.competitorCount?.toString() ?? "";
    setCompetitorCount(nextCount);
  }, [battleState?.config.competitorCount]);

  const handleConfigure = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedCount = Number.parseInt(competitorCount, 10);
    if (!Number.isInteger(parsedCount)) {
      setError("Enter a competitor count.");
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      await onConfigure(parsedCount);
    } catch (configureError) {
      setError(
        configureError instanceof Error
          ? configureError.message
          : "Unable to configure battle.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const runAction = async (action: () => Promise<void>) => {
    setError(null);
    setIsSaving(true);

    try {
      await action();
    } catch (actionError) {
      setError(
        actionError instanceof Error ? actionError.message : "Action failed.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Section
      eyebrow="Admin"
      title="Battle controls"
      description="Admins can configure the arena, start the battle, reset it, and clear the queue."
      actions={
        <Badge tone={battleState?.status === "active" ? "good" : "neutral"}>
          {battleState?.status ?? "waiting"}
        </Badge>
      }
    >
      <div className="stack">
        <form className="admin-stack" onSubmit={handleConfigure}>
          <label className="field">
            <span>Competitor count</span>
            <input
              inputMode="numeric"
              value={competitorCount}
              onChange={(event) => setCompetitorCount(event.target.value)}
              placeholder="2 - 24"
              disabled={disabled}
            />
          </label>
          <div className="button-row">
            <button type="submit" className="button button--secondary" disabled={disabled || isSaving}>
              Configure
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={() => runAction(onStart)}
              disabled={disabled || isSaving || battleState?.config.competitorCount == null}
            >
              Start battle
            </button>
          </div>
        </form>

        <div className="button-row">
          <button
            type="button"
            className="button button--secondary"
            onClick={() => runAction(onReset)}
            disabled={disabled || isSaving}
          >
            Reset
          </button>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => runAction(onClearQueue)}
            disabled={disabled || isSaving}
          >
            Clear queued challenges
          </button>
        </div>

        {error ? <p className="field-error">{error}</p> : null}
      </div>
    </Section>
  );
}
