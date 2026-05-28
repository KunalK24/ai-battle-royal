import type { BattleCompetitor, Challenge, Skirmish } from "../types/game";
import { Badge } from "./Badge";
import { Section } from "./Section";

type SkirmishFeedProps = {
  skirmishes: Skirmish[];
  challengesById: Record<string, Challenge | undefined>;
  competitorsById: Record<string, BattleCompetitor>;
};

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function toneForStatus(status: Skirmish["status"]) {
  switch (status) {
    case "running":
      return "warn";
    case "completed":
      return "good";
    case "canceled":
      return "bad";
  }
}

export function SkirmishFeed({
  skirmishes,
  challengesById,
  competitorsById,
}: SkirmishFeedProps) {
  const recentSkirmishes = [...skirmishes].slice(-5).reverse();

  return (
    <Section
      eyebrow="Skirmishes"
      title="Recent skirmishes"
      description="Each skirmish runs selected agents concurrently and records results, timings, and eliminations."
    >
      <div className="stack stack--tight">
        {recentSkirmishes.length > 0 ? (
          recentSkirmishes.map((skirmish) => {
            const challenge = challengesById[skirmish.challengeId];

            return (
              <article key={skirmish.id} className="card skirmish-card">
                <div className="card__topline">
                  <div>
                    <h3>{challenge?.question ?? "Unknown challenge"}</h3>
                    <p className="muted">
                      {challenge ? `By ${challenge.submittedBy}` : "Challenge unavailable"}
                    </p>
                  </div>
                  <Badge tone={toneForStatus(skirmish.status)}>{skirmish.status}</Badge>
                </div>

                <p className="muted mono">
                  Started {formatTimestamp(skirmish.startedAt)}
                  {skirmish.finishedAt ? ` | Finished ${formatTimestamp(skirmish.finishedAt)}` : ""}
                </p>

                <div className="skirmish-meta">
                  <div>
                    <p className="label">Competitors</p>
                    <p>
                      {skirmish.competitorIds
                        .map((competitorId) => competitorsById[competitorId]?.name ?? competitorId.slice(0, 8))
                        .join(", ")}
                    </p>
                  </div>
                  <div>
                    <p className="label">Decision</p>
                    <p>{skirmish.decision?.reason ?? "Pending"}</p>
                  </div>
                </div>

                <div className="skirmish-results">
                  {skirmish.results.map((result) => {
                    const competitor = competitorsById[result.competitorId];

                    return (
                      <div key={result.competitorId} className="result-row">
                        <div className="card__topline">
                          <strong>{competitor?.name ?? result.competitorId.slice(0, 8)}</strong>
                          <Badge
                            tone={
                              result.status === "answered"
                                ? "good"
                                : result.status === "timeout"
                                  ? "warn"
                                  : "bad"
                            }
                          >
                            {result.status}
                          </Badge>
                        </div>
                        <p className="mono muted">{result.durationMs} ms</p>
                        {result.answer !== null ? <p>{result.answer}</p> : null}
                        {result.errorMessage ? <p className="muted">{result.errorMessage}</p> : null}
                        {result.stdout ? <p className="muted">stdout: {result.stdout}</p> : null}
                        {result.stderr ? <p className="muted">stderr: {result.stderr}</p> : null}
                      </div>
                    );
                  })}
                  {skirmish.results.length === 0 ? <p className="muted">Waiting for agent results.</p> : null}
                </div>
              </article>
            );
          })
        ) : (
          <p className="muted">No skirmishes yet. Submit a challenge to get the battle moving.</p>
        )}
      </div>
    </Section>
  );
}
