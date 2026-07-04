"use client";

import { useEffect, useMemo, useState } from "react";

import { getAlerts, getQuickAlerts, type Budget } from "@/lib/api";

type AlertItem = {
  title: string;
  details: string;
  severity: "INFO" | "WARNING" | "HIGH" | "CRITICAL";
};

const severityStyles: Record<AlertItem["severity"], string> = {
  INFO: "border-sky-400/30 bg-sky-400/10 text-sky-100",
  WARNING: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  HIGH: "border-orange-400/30 bg-orange-400/10 text-orange-100",
  CRITICAL: "border-rose-400/30 bg-rose-400/10 text-rose-100",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function getSeverityFromText(text: string): AlertItem["severity"] {
  const normalized = text.toLowerCase();

  if (normalized.includes("critical") || normalized.includes("severe") || normalized.includes("breach")) {
    return "CRITICAL";
  }

  if (normalized.includes("high") || normalized.includes("spike") || normalized.includes("anomaly")) {
    return "HIGH";
  }

  if (normalized.includes("warn") || normalized.includes("budget") || normalized.includes("overspend")) {
    return "WARNING";
  }

  return "INFO";
}

function parseAlerts(text: string): AlertItem[] {
  const normalized = text.trim();

  if (!normalized) {
    return [];
  }

  const lines = normalized
    .split(/\n+/)
    .map((line) => line.replace(/^[-*\d.\s]+/, "").trim())
    .filter(Boolean);

  const candidates = lines.length > 1 ? lines : normalized.split(/(?<=\.)\s+(?=[A-Z])/).filter(Boolean);

  return candidates.map((entry, index) => ({
    title: entry.split(":")[0].slice(0, 80),
    details: entry,
    severity: getSeverityFromText(entry + index),
  }));
}

function SkeletonCard() {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="h-4 w-36 animate-pulse rounded-full bg-white/10" />
      <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-white/10" />
      <div className="mt-3 h-4 w-11/12 animate-pulse rounded-full bg-white/10" />
      <div className="mt-5 h-4 w-24 animate-pulse rounded-full bg-white/10" />
    </div>
  );
}

function BudgetCard({ budget }: { budget: Budget }) {
  const usedPct = Math.round(budget.budget_used_pct);
  const ringColor = usedPct > 85 ? "#fb7185" : usedPct >= 70 ? "#fbbf24" : "#34d399";

  return (
    <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm uppercase tracking-[0.2em] text-slate-400">{budget.project_id}</div>
          <div className="mt-1 text-lg font-semibold text-white">Budget status</div>
          <div className="mt-2 text-sm text-slate-300">
            {usedPct}% of budget used
          </div>
        </div>
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ background: `conic-gradient(${ringColor} ${usedPct}%, rgba(255,255,255,0.08) 0)` }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0b1020]">
            {usedPct}%
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
        <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
          Current: {formatCurrency(budget.current_month_spend)}
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
          Budget: {formatCurrency(budget.monthly_budget)}
        </div>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const [alertText, setAlertText] = useState("");
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      setError(null);

      try {
        const [alertsResponse, quickAlertsResponse] = await Promise.all([getAlerts(), getQuickAlerts()]);

        if (!active) {
          return;
        }

        setAlertText(alertsResponse.alerts);
        setBudgets(quickAlertsResponse.alerts);
      } catch (requestError: unknown) {
        if (!active) {
          return;
        }

        setError(requestError instanceof Error ? requestError.message : "Failed to load data — try again");
      } finally {
        if (active) {
          setIsLoading(false);
          setIsScanning(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const alerts = useMemo(() => parseAlerts(alertText), [alertText]);

  return (
    <div className="space-y-6 pb-10">
      <section className="rounded-[32px] border border-white/10 bg-white/[0.04] shadow-[0_24px_70px_rgba(0,0,0,0.26)] backdrop-blur-xl">
        <div className="page-header-surface rounded-[32px] px-6 py-6 sm:px-8">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.28em] text-sky-200">Alerts</div>
            <h1 className="text-3xl font-semibold text-white">Anomaly detection and budget health</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-200/80">
              Run a fresh scan or review the latest generated alerts and quick budget status cards.
            </p>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIsScanning(true);
                setIsLoading(true);
                setError(null);

                void (async () => {
                  try {
                    const [alertsResponse, quickAlertsResponse] = await Promise.all([getAlerts(), getQuickAlerts()]);
                    setAlertText(alertsResponse.alerts);
                    setBudgets(quickAlertsResponse.alerts);
                  } catch (requestError: unknown) {
                    setError(requestError instanceof Error ? requestError.message : "Failed to load data — try again");
                  } finally {
                    setIsLoading(false);
                    setIsScanning(false);
                  }
                })();
              }}
              className="rounded-2xl bg-[linear-gradient(135deg,#3b82f6,#8b5cf6)] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-[0_18px_35px_rgba(59,130,246,0.28)]"
            >
              {isScanning ? "Scanning..." : "Run Anomaly Scan"}
            </button>
            <div className="text-sm text-slate-400">Latest quick budget view and anomaly summary from the backend.</div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {isLoading
              ? Array.from({ length: 3 }, (_, index) => <SkeletonCard key={index} />)
              : budgets.map((budget) => <BudgetCard key={budget.project_id} budget={budget} />)}
          </div>

          <div className="grid gap-4">
            {isLoading ? (
              <SkeletonCard />
            ) : alerts.length ? (
              alerts.map((alert, index) => {
                const severity = alert.severity;

                return (
                  <div
                    key={`${alert.title}-${index}`}
                    className="animate-[fade-in_240ms_ease-out] rounded-[28px] border border-white/10 bg-[rgba(10,12,22,0.9)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Alert</div>
                        <h2 className="mt-1 text-lg font-semibold text-white">{alert.title}</h2>
                      </div>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${severityStyles[severity]}`}>
                        {severity}
                      </span>
                    </div>

                    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-300">{alert.details}</p>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-8 text-sm text-slate-400">
                No alerts found right now.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}