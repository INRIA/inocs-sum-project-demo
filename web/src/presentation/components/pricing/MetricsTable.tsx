import type {
  OptimizationMetrics,
  OptimizationParameters,
} from "../../../domain/dynamicPricing";

interface Props {
  metrics: OptimizationMetrics;
  parameters: OptimizationParameters;
}

function formatNumber(value: number, maximumFractionDigits = 2): string {
  return value.toLocaleString(undefined, { maximumFractionDigits });
}

function formatGap(gap: number): string {
  return `${gap.toFixed(2)}%`;
}

export default function MetricsTable({ metrics, parameters }: Props) {
  const rows = [
    {
      label: "Solution Time",
      value: `${metrics["Solution Time (s)"].toFixed(2)}s`,
    },
    { label: "Objective Value", value: formatNumber(metrics["Obj Value"]) },
    {
      label: "Gap %",
      value: formatGap(metrics["Gap (%)"]),
      highlight: metrics["Gap (%)"] <= 0.05,
    },
    {
      label: "OD Pairs (Clusters)",
      value: formatNumber(metrics["Number of OD Pairs"], 0),
    },
    {
      label: "Total Demand",
      value: `${formatNumber(metrics["Total Demand"], 0)} trips`,
    },
    {
      label: "Average number of transfers (PT Only)",
      value: `${metrics["Avg Number of Transfers (PT Only)"].toFixed(2)}`,
    },
    {
      label: "Average number of transfers (Multimodal)",
      value: `${metrics["Avg Number of Transfers (Multimodal)"].toFixed(2)}`,
    },
  ];

  return (
    <section className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
      <header className="px-6 py-5 border-b border-border">
        <h2 className="text-2xl font-bold text-primary">
          Optimization Model Performance
        </h2>
      </header>

      <div className="px-6 py-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[1fr_auto] items-center py-5 border-b border-border last:border-b-0 gap-4"
          >
            <span className="text-text text-xl">{row.label}</span>
            <span
              className={`text-3xl font-bold ${row.highlight ? "text-emerald-600" : "text-primary"}`}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
