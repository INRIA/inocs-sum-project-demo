/**
 * Presentation: DatasetSelector
 * Radius toggle for choosing which Geneva dataset to visualise.
 */
import type { DatasetVariant } from '../../../domain/transit';
import { DATASET_VARIANTS } from '../../../domain/transit';

interface Props {
  value: DatasetVariant;
  onChange: (v: DatasetVariant) => void;
}

export default function DatasetSelector({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 text-sm" role="radiogroup" aria-label="Dataset radius">
      <span className="text-muted text-xs uppercase tracking-wider">Radius</span>
      {DATASET_VARIANTS.map((v) => (
        <button
          key={v}
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
            value === v
              ? 'bg-secondary border-secondary text-secondary-foreground'
              : 'bg-foreground border-border text-text hover:border-secondary hover:text-secondary'
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
