import type { Budget } from "@/lib/api";

type AlertCardProps = {
  budget: Budget;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function getTone(usedPct: number) {
  if (usedPct > 85) {
    return {
      ring: "border-rose-400/35 shadow-[0_0_0_1px_rgba(251,113,133,0.2),0_0_30px_rgba(251,113,133,0.18)]",
      accent: "#fb7185",
      label: "text-rose-200",
    };
  }

  if (usedPct >= 70) {
    return {
      ring: "border-amber-400/35 shadow-[0_0_0_1px_rgba(251,191,36,0.18),0_0_30px_rgba(251,191,36,0.14)]",
      accent: "#fbbf24",
      label: "text-amber-200",
    };
  }

  return {
    ring: "border-emerald-400/35 shadow-[0_0_0_1px_rgba(52,211,153,0.18),0_0_30px_rgba(52,211,153,0.12)]",
    accent: "#34d399",
    label: "text-emerald-200",
  };
}

export default function AlertCard({ budget }: AlertCardProps) {
  const usedPct = budget.budget_used_pct;
  const tone = getTone(usedPct);
  const progress = Math.min(100, Math.max(0, usedPct));
  const budgetAmount = budget.monthly_budget || 1;
  const currentSpend = budget.current_month_spend;

  return (
    <div
      className={`relative overflow-hidden rounded-[24px] border bg-[rgba(12,16,27,0.82)] p-4 backdrop-blur-xl ${tone.ring} ${usedPct > 85 ? "animate-pulse" : ""}`}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at top right, ${tone.accent}20, transparent 50%)`,
        }}
      />

      <div className="relative flex items-start gap-4">
        <div className="relative h-18 w-18 shrink-0 rounded-full bg-[rgba(255,255,255,0.04)] p-1">
          <div
            className="flex h-full w-full items-center justify-center rounded-full bg-[linear-gradient(180deg,rgba(10,10,15,0.9),rgba(10,10,15,0.7))] text-center text-sm font-semibold text-white"
            style={{
              background: `conic-gradient(${tone.accent} ${progress}%, rgba(255,255,255,0.08) 0)`,
            }}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0b1020] text-sm font-semibold text-white">
              {Math.round(progress)}%
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm uppercase tracking-[0.18em] text-slate-400">{budget.project_id}</div>
              <div className={`mt-1 text-lg font-semibold ${tone.label}`}>{Math.round(progress)}% of budget used</div>
            </div>
            <div className="text-right text-sm text-slate-400">
              <div>{formatCurrency(currentSpend)} / {formatCurrency(budgetAmount)}</div>
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/8">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${tone.accent}, #8b5cf6)` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}