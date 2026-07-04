"use client";

import { useMemo, useState } from "react";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { getForecast, getQuickAlerts, type Budget, type ForecastResponse } from "@/lib/api";

const projects = [
  { value: "proj-prod-ecommerce", label: "Production Ecommerce" },
  { value: "proj-staging-ml-platform", label: "Staging ML Platform" },
  { value: "proj-dev-internal-tools", label: "Dev Internal Tools" },
];

const horizons = [30, 60, 90] as const;

type ChartPoint = {
  day: number;
  historical: number;
  forecast: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function getRiskTone(risk: string) {
  const normalized = risk.toLowerCase();

  if (normalized.includes("critical") || normalized.includes("high")) {
    return "border-rose-400/30 bg-rose-400/10 text-rose-100";
  }

  if (normalized.includes("medium") || normalized.includes("elevated") || normalized.includes("warning")) {
    return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  }

  return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
}

function buildSeries(currentSpend: number, horizonDays: number, projectedSpend: number): ChartPoint[] {
  const midpoint = Math.round(horizonDays / 2);
  return [
    { day: 0, historical: currentSpend * 0.82, forecast: currentSpend * 0.84 },
    { day: Math.max(1, midpoint / 2), historical: currentSpend * 0.9, forecast: currentSpend * 0.95 },
    { day: midpoint, historical: currentSpend, forecast: currentSpend * 1.05 },
    { day: Math.min(horizonDays - 1, midpoint + Math.round((horizonDays - midpoint) / 2)), historical: currentSpend, forecast: (currentSpend + projectedSpend) / 2 },
    { day: horizonDays, historical: currentSpend, forecast: projectedSpend },
  ];
}

function SkeletonBlock() {
  return <div className="h-4 animate-pulse rounded-full bg-white/10" />;
}

export default function ForecastPage() {
  const [projectId, setProjectId] = useState(projects[0].value);
  const [horizonDays, setHorizonDays] = useState<(typeof horizons)[number]>(30);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setIsLoading(true);
    setError(null);

    try {
      const [forecastResponse, quickAlertsResponse] = await Promise.all([
        getForecast(projectId, horizonDays),
        getQuickAlerts(),
      ]);

      setForecast(forecastResponse);
      setBudget(quickAlertsResponse.alerts.find((item) => item.project_id === projectId) ?? null);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load data — try again");
    } finally {
      setIsLoading(false);
    }
  }

  const projectedSpend = useMemo(() => {
    if (!budget) {
      return 0;
    }

    const growthFactor = horizonDays === 30 ? 1.08 : horizonDays === 60 ? 1.16 : 1.24;
    return budget.current_month_spend * growthFactor;
  }, [budget, horizonDays]);

  const riskLevel = useMemo(() => {
    if (!budget) {
      return "Low";
    }

    const pct = (projectedSpend / budget.monthly_budget) * 100;

    if (pct > 100) {
      return "Critical";
    }

    if (pct > 85) {
      return "High";
    }

    if (pct > 70) {
      return "Medium";
    }

    return "Low";
  }, [budget, projectedSpend]);

  const chartData = useMemo(
    () => (budget ? buildSeries(budget.current_month_spend, horizonDays, projectedSpend) : []),
    [budget, horizonDays, projectedSpend],
  );

  return (
    <div className="space-y-6 pb-10">
      <section className="rounded-[32px] border border-white/10 bg-white/[0.04] shadow-[0_24px_70px_rgba(0,0,0,0.26)] backdrop-blur-xl">
        <div className="page-header-surface rounded-[32px] px-6 py-6 sm:px-8">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.28em] text-sky-200">Forecast</div>
            <h1 className="text-3xl font-semibold text-white">Project future spend and budget risk</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-200/80">
              Choose a project and horizon, then generate a forecast with a simple projected trend and risk signal.
            </p>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,320px)_minmax(0,180px)_auto] xl:items-end">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Project</span>
              <select
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/15"
              >
                {projects.map((project) => (
                  <option key={project.value} value={project.value}>
                    {project.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Horizon</span>
              <select
                value={horizonDays}
                onChange={(event) => setHorizonDays(Number(event.target.value) as (typeof horizons)[number])}
                className="w-full rounded-2xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/15"
              >
                {horizons.map((horizon) => (
                  <option key={horizon} value={horizon}>
                    {horizon} days
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#3b82f6,#8b5cf6)] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-[0_18px_35px_rgba(59,130,246,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Generating..." : "Generate Forecast"}
            </button>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
            <div className="rounded-[30px] border border-white/10 bg-[rgba(10,12,22,0.92)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.32)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Forecast result</div>
                  <h2 className="mt-1 text-xl font-semibold text-white">{projects.find((project) => project.value === projectId)?.label}</h2>
                </div>
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getRiskTone(riskLevel)}`}>
                  {riskLevel} risk
                </span>
              </div>

              <div className="mt-5 min-h-[180px] rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                {isLoading ? (
                  <div className="space-y-3">
                    <SkeletonBlock />
                    <SkeletonBlock />
                    <SkeletonBlock />
                    <SkeletonBlock />
                  </div>
                ) : forecast ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Projected spend</div>
                      <div className="mt-2 text-2xl font-semibold text-white">{formatCurrency(projectedSpend)}</div>
                      <div className="mt-1 text-sm text-slate-400">
                        Horizon: {horizonDays} days
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">{forecast.forecast}</p>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-white/10 text-sm text-slate-400">
                    Generate a forecast to see the projected trend.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-[rgba(10,12,22,0.92)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.32)]">
              <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Risk summary</div>
              <div className="mt-2 text-lg font-semibold text-white">Budget pressure</div>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  Projected spend: {formatCurrency(projectedSpend)}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  Monthly budget: {budget ? formatCurrency(budget.monthly_budget) : "--"}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  Current spend: {budget ? formatCurrency(budget.current_month_spend) : "--"}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.26)]">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Projected trend</h2>
                <p className="text-sm text-slate-400">Historical spend to forecasted spend</p>
              </div>
            </div>
            <div className="h-[280px] rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,10,18,0.92),rgba(8,12,24,0.78))] p-3">
              {isLoading || !budget ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  Generate a forecast to view the chart.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 20, bottom: 8, left: 8 }}>
                    <XAxis dataKey="day" stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" tickFormatter={(value) => `$${Number(value).toLocaleString()}`} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "#0b1020",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 16,
                        color: "#e5eefc",
                      }}
                      formatter={(value: unknown) => formatCurrency(Number(value ?? 0))}
                    />
                    <Line type="monotone" dataKey="historical" stroke="#60a5fa" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="forecast" stroke="#a855f7" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}