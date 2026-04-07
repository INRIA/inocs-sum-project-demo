import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import type { OptimizationMetrics } from "../../../domain/dynamicPricing";
import { COLORS } from "../../lib/colors";

interface Props {
  metrics: OptimizationMetrics;
}

type ChartRow = {
  label: string;
  value: number;
  color: string;
};

function formatCompact(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toFixed(0);
}

export default function ModalSplitChart({ metrics }: Props) {
  const totalDemand = metrics["Total Demand"] || 1;
  const multimodal = metrics["Total Flow (Multimodal)"];

  const data: ChartRow[] = [
    {
      label: "Car",
      value: (metrics["Total Flow (Car)"] / totalDemand) * 100,
      color: COLORS.GRAY,
    },
    {
      label: "PT Only",
      value: (metrics["Total Flow (PT Only)"] / totalDemand) * 100,
      color: COLORS.BLUE_LIGHT,
    },
    {
      label: "Multimodal",
      value: (multimodal / totalDemand) * 100,
      color: COLORS.GREEN,
    },
  ];

  const metricsImpact = [
    {
      label: "Estimated Revenue",
      value: `${formatCompact(metrics.Revenue)} CHF`,
      color: COLORS.ORANGE,
    },
    {
      label: "Average Bike Price",
      value: `${metrics["Avg Bike Price (for all offered arcs)"].toFixed(2)} CHF`,
      color: COLORS.ORANGE,
    },
    {
      label: "Average Multi-Modal Price",
      value: `${metrics["Avg Bike Price (Multimodal, Flow ≥ 1)"].toFixed(2)} CHF`,
      color: COLORS.ORANGE,
    },
  ];

  return (
    <section className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
      <header className="px-6 py-5 border-b border-border flex items-center gap-3">
        <h2 className="text-2xl font-bold text-primary">
          Dynamic pricing - impact on Modal Split
        </h2>
      </header>
      <div className="p-6 flex flex-col gap-6">
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 border border-border rounded-lg overflow-hidden">
          {metricsImpact.map((metric) => (
            <div
              key={metric.label}
              className="px-4 py-3 border-b sm:border-b-0 sm:border-r border-border"
            >
              <p className="text-xs uppercase tracking-wide text-muted">
                {metric.label}
              </p>
              <p
                className="text-2xl font-bold mt-1"
                style={{ color: metric.color }}
              >
                {metric.value}
              </p>
            </div>
          ))}
        </div>

        <div className="h-82.5">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
            >
              <XAxis
                dataKey="label"
                tick={{ fill: COLORS.GRAY, fontSize: 14 }}
                axisLine={{ stroke: "#e0e0e0" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fill: COLORS.GRAY, fontSize: 13 }}
                axisLine={false}
                tickLine={false}
                width={46}
              />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(2)}%`}
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid #e0e0e0",
                  background: "#ffffff",
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.label} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
