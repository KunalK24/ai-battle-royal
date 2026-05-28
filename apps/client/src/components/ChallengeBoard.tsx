import type { Challenge, ChallengeStatus } from "../types/game";
import { Badge } from "./Badge";
import { Section } from "./Section";

type ChallengeBoardProps = {
  challenges: Challenge[];
};

type StatusGroup = {
  title: string;
  tone: "neutral" | "good" | "warn" | "bad" | "accent";
  statuses: ChallengeStatus[];
};

const challengeGroups: StatusGroup[] = [
  { title: "Queued", tone: "accent", statuses: ["queued"] },
  { title: "Running", tone: "warn", statuses: ["running"] },
  { title: "Completed", tone: "good", statuses: ["completed"] },
  { title: "Canceled", tone: "bad", statuses: ["canceled"] },
];

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ChallengeBoard({ challenges }: ChallengeBoardProps) {
  return (
    <Section
      eyebrow="Challenge queue"
      title="Challenge lifecycle"
      description="Queued challenges move through skirmishes. Completed and canceled items stay visible for context."
    >
      <div className="challenge-board">
        {challengeGroups.map((group) => {
          const items = challenges.filter((challenge) =>
            group.statuses.includes(challenge.status),
          );

          return (
            <article key={group.title} className="card challenge-column">
              <div className="card__topline">
                <h3>{group.title}</h3>
                <Badge tone={group.tone}>{items.length.toString()}</Badge>
              </div>
              <div className="stack stack--tight">
                {items.length > 0 ? (
                  items.map((challenge) => (
                    <div key={challenge.id} className="challenge-item">
                      <div className="card__topline">
                        <strong>{challenge.submittedBy}</strong>
                        <Badge tone={group.tone}>{challenge.status}</Badge>
                      </div>
                      <p>{challenge.question}</p>
                      <p className="muted mono">{formatTimestamp(challenge.submittedAt)}</p>
                    </div>
                  ))
                ) : (
                  <p className="muted">Nothing here yet.</p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
