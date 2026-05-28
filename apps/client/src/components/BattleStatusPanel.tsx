import type { BattleCompetitor, BattleState } from "../types/game";
import { Badge } from "./Badge";
import { Section } from "./Section";

type BattleStatusPanelProps = {
  battleState: BattleState | null;
  isLoading: boolean;
  lastUpdatedAt: string | null;
  winnerCompetitor: BattleCompetitor | null;
};

function formatTimestamp(value: string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function BattleStatusPanel({
  battleState,
  isLoading,
  lastUpdatedAt,
  winnerCompetitor,
}: BattleStatusPanelProps) {
  const aliveCount = battleState?.competitors.filter((competitor) => competitor.status === "alive").length ?? 0;
  const totalCount = battleState?.competitors.length ?? 0;
  const queuedCount = battleState?.queuedChallenges.filter((challenge) => challenge.status === "queued").length ?? 0;
  const completedCount = battleState?.queuedChallenges.filter((challenge) => challenge.status === "completed").length ?? 0;
  const canceledCount = battleState?.queuedChallenges.filter((challenge) => challenge.status === "canceled").length ?? 0;

  return (
    <Section
      eyebrow="Battle status"
      title="Live Battle Snapshot"
      description="Polling keeps the arena updated every two seconds."
      actions={
        <Badge
          tone={battleState?.status === "active" ? "good" : battleState?.status === "finished" ? "accent" : "neutral"}
        >
          {isLoading ? "Loading" : battleState?.status ?? "waiting"}
        </Badge>
      }
    >
      <div className="overview-grid">
        <article className="metric">
          <span className="metric__label">Battle ID</span>
          <strong className="mono">{battleState?.battleId ?? ""}</strong>
        </article>
        <article className="metric">
          <span className="metric__label">Competitors</span>
          <strong>{totalCount}</strong>
        </article>
        <article className="metric">
          <span className="metric__label">Alive</span>
          <strong>{aliveCount}</strong>
        </article>
        <article className="metric">
          <span className="metric__label">Queued</span>
          <strong>{queuedCount}</strong>
        </article>
        <article className="metric">
          <span className="metric__label">Completed</span>
          <strong>{completedCount}</strong>
        </article>
        <article className="metric">
          <span className="metric__label">Canceled</span>
          <strong>{canceledCount}</strong>
        </article>
      </div>

      <div className="status-strip">
        <div>
          <p className="label">Configured competitors</p>
          <p>{battleState?.config.competitorCount ?? ""}</p>
        </div>
        <div>
          <p className="label">Started</p>
          <p>{formatTimestamp(battleState?.startedAt ?? null)}</p>
        </div>
        <div>
          <p className="label">Finished</p>
          <p>{formatTimestamp(battleState?.finishedAt ?? null)}</p>
        </div>
        <div>
          <p className="label">Winner</p>
          <p>{winnerCompetitor?.name ?? ""}</p>
        </div>
        <div>
          <p className="label">Last sync</p>
          <p>{formatTimestamp(lastUpdatedAt)}</p>
        </div>
      </div>
    </Section>
  );
}
