import type { BattleCompetitorConfig } from "../types/game";

type CompetitorPanelProps = {
  competitor: BattleCompetitorConfig;
  index: number;
  models: string[];
  canRemove: boolean;
  onChange: (index: number, nextCompetitor: BattleCompetitorConfig) => void;
  onRemove: (index: number) => void;
};

export function CompetitorPanel({
  competitor,
  index,
  models,
  canRemove,
  onChange,
  onRemove,
}: CompetitorPanelProps) {
  return (
    <article className="card competitor-editor">
      <div className="card__topline">
        <div>
          <h3>Competitor {index + 1}</h3>
          <p className="muted">Configure the competitor name and model.</p>
        </div>
        <button
          type="button"
          className="button button--ghost"
          onClick={() => onRemove(index)}
          disabled={!canRemove}
        >
          Remove
        </button>
      </div>

      <label className="field">
        <span>Name</span>
        <input
          value={competitor.name}
          onChange={(event) =>
            onChange(index, {
              ...competitor,
              name: event.target.value,
            })
          }
          placeholder={`Competitor ${index + 1}`}
          maxLength={40}
        />
      </label>

      <label className="field">
        <span>Model</span>
        <select
          value={competitor.model}
          onChange={(event) =>
            onChange(index, {
              ...competitor,
              model: event.target.value,
            })
          }
        >
          {models.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </label>
    </article>
  );
}
