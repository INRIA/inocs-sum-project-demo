import { useState } from "react";
import type { DynamicPricingVariant } from "../../../domain/dynamicPricing";
import DynamicPricingVariantSelector from "../shared/DynamicPricingVariantSelector";
import MetricsDashboard from "./MetricsDashboard";
import DynamicPricingUserSimulator from "../simulator/DynamicPricingUserSimulator";

export default function DynamicPricingPage() {
  const [variant, setVariant] = useState<DynamicPricingVariant>(
    "geneva_1km_monday08",
  );

  return (
    <div className="flex-1 flex flex-col gap-4 px-4 py-4">
      <div className="rounded-lg border border-border bg-surface px-4 py-3">
        <DynamicPricingVariantSelector value={variant} onChange={setVariant} />
      </div>
      <MetricsDashboard variant={variant} />

      <DynamicPricingUserSimulator variant={variant} />
    </div>
  );
}
