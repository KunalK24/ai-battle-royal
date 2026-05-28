import type { BattleCompetitorConfig } from "../types/game";
import { CompetitorPanel } from "./CompetitorPanel";

type CompetitorListProps = {
  competitors: BattleCompetitorConfig[];
  models: string[];
  minCompetitors: number;
  maxCompetitors: number;
  onAdd: () => void;
  onChange: (index: number, nextCompetitor: BattleCompetitorConfig) => void;
  onRemove: (index: number) => void;
};

export function CompetitorList({
  competitors,
  models,
  minCompetitors,
  maxCompetitors,
  onAdd,
  onChange,
  onRemove,
}: CompetitorListProps) {
  return (
    <div className="stack">
      <div className="stack stack--tight">
        {competitors.map((competitor, index) => (
          <CompetitorPanel
            key={index}
            competitor={competitor}
            index={index}
            models={models}
            canRemove={competitors.length > minCompetitors}
            onChange={onChange}
            onRemove={onRemove}
          />
        ))}
      </div>

      <div className="button-row">
        <button
          type="button"
          className="button button--secondary"
          onClick={onAdd}
          disabled={competitors.length >= maxCompetitors}
        >
          Add competitor
        </button>
        <p className="help-text">
          {minCompetitors} to {maxCompetitors} competitors
        </p>
      </div>
    </div>
  );
}
