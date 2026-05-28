import type { BattleCompetitor } from "../types/game";
import { Section } from "./Section";

type CompetitorGridProps = {
  competitors: BattleCompetitor[];
  winnerCompetitorId: string | null;
};

function getCompetitorTone(status: BattleCompetitor["status"]) {
  return status === "alive" ? "alive" : "eliminated";
}

export function CompetitorGrid({
  competitors,
  winnerCompetitorId,
}: CompetitorGridProps) {
  const aliveCount = competitors.filter((competitor) => competitor.status === "alive").length;

  return (
    <Section
      eyebrow="Competitors"
      title="Battle field"
      description={`${aliveCount} alive, ${competitors.length - aliveCount} eliminated.`}
    >
      <div className="competitor-grid">
        {competitors.length > 0 ? (
          competitors.map((competitor) => {
            const isWinner = competitor.id === winnerCompetitorId;

            return (
              <article
                key={competitor.id}
                className={
                  isWinner
                    ? "card competitor-card competitor-card--winner"
                    : competitor.status === "eliminated"
                      ? "card competitor-card competitor-card--eliminated"
                      : "card competitor-card"
                }
              >
                <div className="card__topline">
                  <h3>{competitor.name}</h3>
                  <span className={`competitor-dot competitor-dot--${getCompetitorTone(competitor.status)}`} aria-label={competitor.status} />
                </div>
                <p className="muted mono">{competitor.id.slice(0, 8)}</p>
                {isWinner ? <p className="winner-note">Winner</p> : null}
              </article>
            );
          })
        ) : (
          <p className="muted">No competitors have been created yet.</p>
        )}
      </div>
    </Section>
  );
}
