import type { DynamicPricingVariant } from "../../../domain/dynamicPricing";
import { DYNAMIC_PRICING_VARIANTS } from "../../../domain/dynamicPricing";

interface Props {
  value: DynamicPricingVariant;
  onChange: (v: DynamicPricingVariant) => void;
}

const LABELS: Record<DynamicPricingVariant, string> = {
  geneva_1km_monday08: "Geneva 1km Mon 08h",
  geneva_3km_monday08: "Geneva 3km Mon 08h",
};

export default function DynamicPricingVariantSelector({
  value,
  onChange,
}: Props) {
  return (
    <div
      className="flex flex-wrap items-center gap-2 text-sm"
      role="radiogroup"
      aria-label="Dynamic pricing setup"
    >
      <span className="text-muted text-xs uppercase tracking-wider">
        Setup
      </span>
      {DYNAMIC_PRICING_VARIANTS.map((variant) => (
        <button
          key={variant}
          role="radio"
          aria-checked={value === variant}
          onClick={() => onChange(variant)}
          className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
            value === variant
              ? "bg-secondary border-secondary text-secondary-foreground"
              : "bg-foreground border-border text-text hover:border-secondary hover:text-secondary"
          }`}
        >
          {LABELS[variant]}
        </button>
      ))}
    </div>
  );
}
