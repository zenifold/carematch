type Props = {
  spent: number;
  budget: number;
  label?: string;
  className?: string;
};

/**
 * BudgetBar — visualizes month-to-date spend against a plan.
 * Green under budget, amber close, red over. The number leads; the bar reinforces.
 */
export function BudgetBar({ spent, budget, label = "This month", className = "" }: Props) {
  const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
  const over = spent > budget;

  const tone = over
    ? { bar: "bg-destructive", text: "text-destructive", chip: "bg-destructive/10 text-destructive" }
    : pct >= 85
      ? { bar: "bg-warning", text: "text-warning-foreground", chip: "bg-warning/20 text-warning-foreground" }
      : { bar: "bg-success", text: "text-success", chip: "bg-success/10 text-success" };

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  const status = over
    ? `${fmt(spent - budget)} over your plan`
    : pct >= 85
      ? "Close to your plan"
      : "Comfortably within your plan";

  return (
    <div className={className}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-base font-semibold text-muted-foreground">{label}</p>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${tone.chip}`}>{status}</span>
      </div>
      <p className="mt-2 font-serif text-4xl">
        {fmt(spent)}{" "}
        <span className="text-xl text-muted-foreground">of {fmt(budget)}</span>
      </p>
      <div
        className="mt-3 h-4 w-full overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={budget}
        aria-valuenow={spent}
        aria-label={`${label}: ${fmt(spent)} of ${fmt(budget)}`}
      >
        <div className={`h-full rounded-full transition-all ${tone.bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
