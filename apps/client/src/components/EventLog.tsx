import type { BattleEvent } from "../types/game";
import { Badge } from "./Badge";
import { Section } from "./Section";

type EventLogProps = {
  events: BattleEvent[];
};

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function toneForEvent(type: BattleEvent["type"]) {
  switch (type) {
    case "battle_started":
      return "good";
    case "battle_finished":
      return "accent";
    case "skirmish_completed":
      return "warn";
    case "battle_reset":
    case "queue_cleared":
      return "bad";
    default:
      return "neutral";
  }
}

export function EventLog({ events }: EventLogProps) {
  const recentEvents = [...events].slice(-5).reverse();

  return (
    <Section
      eyebrow="System"
      title="Event log"
      description="Battle actions, queue changes, skirmishes, and resets appear here."
    >
      <div className="stack stack--tight log-list">
        {recentEvents.length > 0 ? (
          recentEvents.map((event) => (
            <article key={event.id} className="log-item">
              <div className="card__topline">
                <Badge tone={toneForEvent(event.type)}>{event.type}</Badge>
                <span className="muted mono">{formatTimestamp(event.createdAt)}</span>
              </div>
              <p>{event.message}</p>
            </article>
          ))
        ) : (
          <p className="muted">No events yet.</p>
        )}
      </div>
    </Section>
  );
}
