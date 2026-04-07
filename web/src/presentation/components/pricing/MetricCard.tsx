interface Props {
  label: string;
  value: string;
  subtitle?: string;
}

export default function MetricCard({ label, value, subtitle }: Props) {
  return (
    <article className="rounded-xl border border-border bg-surface px-6 py-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-2 text-4xl font-extrabold text-primary leading-none">
        {value}
      </p>
      {subtitle && <p className="mt-3 text-sm text-text">{subtitle}</p>}
    </article>
  );
}
