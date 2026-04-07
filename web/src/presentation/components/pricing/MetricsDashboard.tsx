import { useMemo } from "react";
import type { DynamicPricingVariant } from "../../../domain/dynamicPricing";
import { useData } from "../../../application/hooks/useData";
import { dynamicPricingOptimizationRepository } from "../../../infrastructure/dataRepository";
import LoadingSpinner from "../shared/LoadingSpinner";
import MetricCard from "./MetricCard";
import MetricsTable from "./MetricsTable";
import ModalSplitChart from "./ModalSplitChart";

interface Props {
  variant: DynamicPricingVariant;
}

function toContextDateLabel(timestamp: string): {
  value: string;
  subtitle: string;
} {
  const dt = new Date(timestamp);
  const value = dt.toLocaleString("en-US", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
  const hour = dt.getUTCHours();
  const subtitle =
    hour >= 7 && hour <= 10
      ? "Morning Peak"
      : hour >= 16 && hour <= 19
        ? "Evening Peak"
        : "Off-Peak";
  return { value, subtitle };
}

export default function MetricsDashboard({ variant }: Props) {
  const loader = useMemo(
    () => () => dynamicPricingOptimizationRepository.fetchMetrics(variant),
    [variant],
  );
  const { data, loading, error } = useData(loader);

  if (loading) {
    return (
      <div className="min-h-75">
        <LoadingSpinner message="Loading optimization metrics..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">
        Failed to load optimization metrics for {variant}:{" "}
        {error?.message ?? "Unknown error"}
      </div>
    );
  }

  const { instance_config, optimization_parameters, optimization_metrics } =
    data;
  const timeLabel = toContextDateLabel(instance_config.otp_timestamp);
  const city = variant.startsWith("geneva") ? "Geneva" : "Unknown";

  const modelMetrics = [
    {
      label: "City Area",
      value: city,
      subtitle: `Radius: ${(instance_config.radius_m / 1000).toFixed(0)}km`,
    },
    {
      label: "Time Generation",
      value: timeLabel.value,
      subtitle: timeLabel.subtitle,
    },
    {
      label: "Clustering",
      value: `${instance_config.clustering_threshold_m.toFixed(0)}m`,
      subtitle: "Threshold",
    },
    {
      label: "Public Transport Pricing",
      value: `${optimization_parameters.pt_price.toFixed(2)} CHF`,
      subtitle: "Fixed PT Ticket Price",
    },
    {
      label: "Parking Fee",
      value: `${optimization_parameters.parking_fee.toFixed(2)} CHF`,
      subtitle: "Simulated Parking Fee",
    },
    {
      label: "Bike Cost",
      value: `${optimization_parameters.cost_bike.toFixed(2)} CHF`,
      subtitle: "Simulated Bike Maintenance Cost",
    },
    {
      label: "P BAR",
      value: `${optimization_parameters.P_bar}`,
      subtitle: "??",
    },
    {
      label: "Theta",
      value: `${optimization_parameters.theta}`,
      subtitle: "??",
    },
  ];

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center gap-2 mb-3 text-primary">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/15 text-xs">
            i
          </span>
          <h2 className="text-lg font-semibold">Model Context</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {modelMetrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              subtitle={metric.subtitle}
            />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[0.95fr_2fr] gap-4">
        <MetricsTable
          metrics={optimization_metrics}
          parameters={optimization_parameters}
        />
        <ModalSplitChart metrics={optimization_metrics} />
      </section>
    </div>
  );
}
