import { useEffect, useMemo, useState } from "react";

import {
  clearQueuedChallenges,
  configureBattle,
  ApiError,
  getAvailableModels,
  resetBattle,
  startBattle,
  submitChallenge,
} from "../api";
import { useBattlePolling } from "../hooks/useBattlePolling";
import type { BattleCompetitorConfig, Session } from "../types/game";
import { AdminPanel } from "./AdminPanel";
import { Badge } from "./Badge";
import { BattleStatusPanel } from "./BattleStatusPanel";
import { ChallengeBoard } from "./ChallengeBoard";
import { ChallengeForm } from "./ChallengeForm";
import { CompetitorGrid } from "./CompetitorGrid";
import { EventLog } from "./EventLog";
import { Section } from "./Section";
import { SkirmishFeed } from "./SkirmishFeed";

type BattleArenaPageProps = {
  session: Session;
  onAuthExpired: (message: string) => void;
  onLogout: () => void;
};

function buildLookup<T extends { id: string }>(items: T[]) {
  return items.reduce<Record<string, T>>((accumulator, item) => {
    accumulator[item.id] = item;
    return accumulator;
  }, {});
}

export function BattleArenaPage({ session, onAuthExpired, onLogout }: BattleArenaPageProps) {
  const { battleState, isLoading, error: pollingError, lastUpdatedAt, refresh } = useBattlePolling();
  const [actionError, setActionError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>(["gpt-4.1"]);

  useEffect(() => {
    let isMounted = true;

    void getAvailableModels()
      .then((models) => {
        if (isMounted && models.length > 0) {
          setAvailableModels(models);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAvailableModels(["gpt-4.1"]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const competitorsById = useMemo(
    () => buildLookup(battleState?.competitors ?? []),
    [battleState?.competitors],
  );
  const challengesById = useMemo(
    () => buildLookup(battleState?.queuedChallenges ?? []),
    [battleState?.queuedChallenges],
  );

  const messageError = actionError ?? pollingError;
  const isAdmin = session.role === "admin";

  const runAction = async (action: () => Promise<void>) => {
    setActionError(null);

    try {
      await action();
      await refresh();
    } catch (nextError) {
      if (nextError instanceof ApiError && nextError.status === 401) {
        onAuthExpired("Your admin session expired. Please log in again.");
        return;
      }

      setActionError(
        nextError instanceof Error ? nextError.message : "Action failed.",
      );
    }
  };

  const handleSubmitChallenge = async (input: {
    submittedBy: string;
    question: string;
    expectedAnswer: string;
  }) => {
    await runAction(async () => {
      await submitChallenge(input);
    });
  };

  const handleConfigureBattle = async (competitorConfigs: BattleCompetitorConfig[]) => {
    if (!isAdmin) {
      return;
    }

    await runAction(async () => {
      await configureBattle({ competitorConfigs }, session.adminPassword);
    });
  };

  const handleStartBattle = async () => {
    if (!isAdmin) {
      return;
    }

    await runAction(async () => {
      await startBattle(session.adminPassword);
    });
  };

  const handleResetBattle = async () => {
    if (!isAdmin) {
      return;
    }

    await runAction(async () => {
      await resetBattle(session.adminPassword);
    });
  };

  const handleClearQueue = async () => {
    if (!isAdmin) {
      return;
    }

    await runAction(async () => {
      await clearQueuedChallenges(session.adminPassword);
    });
  };

  const challengeFormDefaultSubmittedBy = session.username;
  const winnerCompetitor = battleState?.winnerCompetitorId
    ? competitorsById[battleState.winnerCompetitorId] ?? null
    : null;

  return (
    <main className="arena-shell">
      <header className="arena-topbar panel">
        <div className="arena-topbar__brand">
          <p className="eyebrow">Battle Arena</p>
          <h1>AI Coding Agent Battle Royale</h1>
          <p className="arena-topbar__lede">
            Live battle loop with agents, queued challenges, and elimination rounds.
          </p>
        </div>

        <div className="arena-topbar__meta">
          <Badge tone={isAdmin ? "accent" : "good"}>
            {isAdmin ? "Admin" : "Spectator"}
          </Badge>
          <div className="arena-topbar__session">
            <span className="label">Signed in as</span>
            <strong>{session.username}</strong>
          </div>
          <button type="button" className="button button--secondary" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      {messageError ? (
        <Section
          eyebrow="System"
          title="API error"
          description="The UI is still usable. Fix the issue below and try again."
        >
          <p className="field-error">{messageError}</p>
        </Section>
      ) : null}

      <div className="arena-layout">
        <section className="arena-main">
          <BattleStatusPanel
            battleState={battleState}
            isLoading={isLoading}
            lastUpdatedAt={lastUpdatedAt}
            winnerCompetitor={winnerCompetitor}
          />

          <ChallengeForm
            defaultSubmittedBy={challengeFormDefaultSubmittedBy}
            disabled={false}
            onSubmit={handleSubmitChallenge}
          />

          <ChallengeBoard challenges={battleState?.queuedChallenges ?? []} />

          <SkirmishFeed
            skirmishes={battleState?.skirmishes ?? []}
            challengesById={challengesById}
            competitorsById={competitorsById}
          />

          <EventLog events={battleState?.eventLog ?? []} />
        </section>

        <aside className="arena-rail">
          <CompetitorGrid
            competitors={battleState?.competitors ?? []}
            winnerCompetitorId={battleState?.winnerCompetitorId ?? null}
          />

          {isAdmin ? (
            <AdminPanel
              battleState={battleState}
              disabled={false}
              availableModels={availableModels}
              onConfigure={handleConfigureBattle}
              onStart={handleStartBattle}
              onReset={handleResetBattle}
              onClearQueue={handleClearQueue}
            />
          ) : (
            <Section
              eyebrow="Access"
              title="Spectator controls"
              description="Spectators can submit challenges and watch the battle unfold."
            >
              <p className="muted">
                Admin controls are hidden for spectators.
              </p>
            </Section>
          )}
        </aside>
      </div>
    </main>
  );
}
