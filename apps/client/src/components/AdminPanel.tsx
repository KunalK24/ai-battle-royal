import { useEffect, useRef, useState, type FormEvent } from "react";

import type { BattleCompetitorConfig, BattleState } from "../types/game";
import { Badge } from "./Badge";
import { CompetitorList } from "./CompetitorList";
import { Section } from "./Section";

type AdminPanelProps = {
  battleState: BattleState | null;
  disabled: boolean;
  availableModels: string[];
  onConfigure: (competitorConfigs: BattleCompetitorConfig[]) => Promise<void>;
  onStart: () => Promise<void>;
  onReset: () => Promise<void>;
  onClearQueue: () => Promise<void>;
};

const MIN_COMPETITORS = 2;
const MAX_COMPETITORS = 24;
const MAX_COMPETITOR_NAME_LENGTH = 40;
const DEFAULT_MODEL = "gpt-4.1";

function createDefaultCompetitors(model: string): BattleCompetitorConfig[] {
  return Array.from({ length: MIN_COMPETITORS }, (_value, index) => ({
    name: `Competitor ${index + 1}`,
    model,
  }));
}

function normalizeCompetitorName(value: string): string {
  return value.trim().slice(0, MAX_COMPETITOR_NAME_LENGTH);
}

export function AdminPanel({
  battleState,
  disabled,
  availableModels,
  onConfigure,
  onStart,
  onReset,
  onClearQueue,
}: AdminPanelProps) {
  const defaultModel = availableModels.includes(DEFAULT_MODEL)
    ? DEFAULT_MODEL
    : availableModels[0] ?? DEFAULT_MODEL;

  const [competitorConfigs, setCompetitorConfigs] = useState<BattleCompetitorConfig[]>(
    () => battleState?.config.competitorConfigs?.map((competitorConfig) => ({
      ...competitorConfig,
    })) ?? createDefaultCompetitors(defaultModel),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastSyncedConfigRef = useRef<string>("");

  const backendConfigKey = JSON.stringify(battleState?.config.competitorConfigs ?? null);
  const configuredCompetitorCount = battleState?.config.competitorConfigs?.length ?? 0;
  const canStartBattle = configuredCompetitorCount >= MIN_COMPETITORS;

  useEffect(() => {
    if (lastSyncedConfigRef.current === backendConfigKey) {
      return;
    }

    lastSyncedConfigRef.current = backendConfigKey;
    setCompetitorConfigs(
      battleState?.config.competitorConfigs?.map((competitorConfig) => ({
        ...competitorConfig,
      })) ?? createDefaultCompetitors(defaultModel),
    );
  }, [backendConfigKey, battleState?.config.competitorConfigs, defaultModel]);

  const handleConfigure = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const nextCompetitorConfigs = competitorConfigs.map((competitorConfig) => {
        const name = normalizeCompetitorName(competitorConfig.name);
        if (!name) {
          throw new Error("Competitor names are required.");
        }

        return {
          name,
          model: availableModels.includes(competitorConfig.model)
            ? competitorConfig.model
            : defaultModel,
        };
      });

      setError(null);
      setIsSaving(true);
      await onConfigure(nextCompetitorConfigs);
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
      <form className="stack" onSubmit={handleConfigure}>
        <CompetitorList
          competitors={competitorConfigs}
          models={availableModels}
          minCompetitors={MIN_COMPETITORS}
          maxCompetitors={MAX_COMPETITORS}
          onAdd={() => {
            setError(null);
            setCompetitorConfigs((current) => [
              ...current,
              {
                name: `Competitor ${current.length + 1}`,
                model: defaultModel,
              },
            ]);
          }}
          onChange={(index, nextCompetitor) => {
            setError(null);
            setCompetitorConfigs((current) =>
              current.map((competitor, competitorIndex) =>
                competitorIndex === index
                  ? {
                      ...nextCompetitor,
                    }
                  : competitor,
              ),
            );
          }}
          onRemove={(index) => {
            setError(null);
            setCompetitorConfigs((current) =>
              current.length <= MIN_COMPETITORS
                ? current
                : current.filter((_competitor, competitorIndex) => competitorIndex !== index),
            );
          }}
        />

        <div className="button-row">
          <button
            type="submit"
            className="button button--secondary"
            disabled={disabled || isSaving || competitorConfigs.length < MIN_COMPETITORS || competitorConfigs.length > MAX_COMPETITORS}
          >
            Configure
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={() => runAction(onStart)}
            disabled={disabled || isSaving || !canStartBattle}
          >
            Start battle
          </button>
        </div>

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
      </form>
    </Section>
  );
}
