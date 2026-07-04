"use client";

import { useEffect, useMemo, useState } from "react";

import AnimatedCounter from "@/components/AnimatedCounter";
import { getDashboardSummary, type AuditLogEntry, type DashboardData } from "@/lib/api";
import AlertCard from "@/components/AlertCard";
import CostChart from "@/components/CostChart";

type ProjectStat = {
  projectId: string;
  label: string;
  totalCost: number;
  trendDirection: "up" | "down";
  trendValue: number;
};

const skeletonCards = Array.from({ length: 3 }, (_, index) => index);

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatProjectName(projectId: string) {
  return projectId.replace(/^proj-/, "").replace(/-/g, " ");
}

function buildProjectStats(data: DashboardData): ProjectStat[] {
  const projects = data.spend_by_project
    .filter((item) => typeof item.project_id === "string")
    .sort((left, right) => right.total_cost - left.total_cost);

  const averageSpend = projects.length
    ? projects.reduce((sum, item) => sum + item.total_cost, 0) / projects.length
    : 0;

  return projects.map((item) => {
    const delta = averageSpend > 0 ? ((item.total_cost - averageSpend) / averageSpend) * 100 : 0;

    return {
      projectId: item.project_id ?? "project",
      label: formatProjectName(item.project_id ?? "project"),
      totalCost: item.total_cost,
      trendDirection: delta >= 0 ? "up" : "down",
      trendValue: Math.abs(delta),
    };
  });
}

function getSeverityTone(severity: string) {
  const normalized = severity.toLowerCase();

  if (normalized.includes("critical") || normalized.includes("high")) {
    return "border-rose-400/30 bg-rose-400/10 text-rose-200";
  }

  if (normalized.includes("warn") || normalized.includes("medium")) {
    return "border-amber-400/30 bg-amber-400/10 text-amber-200";
  }

  return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/6 ${className ?? ""}`} />;
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    void getDashboardSummary()
      .then((summary) => {
        if (!mounted) {
          return;
        }

        setData(summary);
      })
      .catch((requestError: unknown) => {
        if (!mounted) {
          return;
        }

        setError(requestError instanceof Error ? requestError.message : "Failed to load dashboard.");
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const projectStats = useMemo(() => (data ? buildProjectStats(data) : []), [data]);
  const auditEntries = data?.recent_audit_logs ?? [];
  const budgets = data?.budgets ?? [];

  return (
    <div className="space-y-8 pb-10">
      <section className="page-header-surface rounded-[32px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:p-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">
              CloudMind dashboard
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Monitor cloud spend, catch anomalies, and act before budgets drift.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Live June spend, service mix, budget pressure, and audit activity across your tracked projects.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/20 px-5 py-4 text-sm text-slate-300">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Resources monitored</div>
            <div className="mt-2 text-3xl font-semibold text-white">
              {isLoading || !data ? "--" : <AnimatedCounter value={data.total_resources} formatValue={(value) => Math.round(value).toLocaleString()} />}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {isLoading
          ? skeletonCards.map((index) => (
              <div key={index} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                <SkeletonBlock className="h-4 w-32" />
                <SkeletonBlock className="mt-4 h-9 w-40" />
                <SkeletonBlock className="mt-3 h-4 w-24" />
              </div>
            ))
          : projectStats.length > 0
            ? projectStats.map((project) => (
                <div
                  key={project.projectId}
                  className="rounded-[28px] border border-white/10 bg-[rgba(15,18,31,0.72)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl"
                >
                  <div className="text-sm uppercase tracking-[0.18em] text-slate-400">{project.label}</div>
                  <div className="mt-3 text-3xl font-semibold text-white">
                    <AnimatedCounter value={project.totalCost} formatValue={formatCurrency} />
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                    <span className={project.trendDirection === "up" ? "text-emerald-300" : "text-sky-300"}>
                      {project.trendDirection === "up" ? "↑" : "↓"} {project.trendValue.toFixed(1)}%
                    </span>
                    <span className="text-slate-500">vs average project spend</span>
                  </div>
                </div>
              ))
            : (
                <div className="md:col-span-3 rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-8 text-center text-slate-400">
                  <div className="text-3xl">◌</div>
                  <div className="mt-3 text-base font-medium text-white">No project spend yet</div>
                  <div className="mt-2 text-sm leading-6 text-slate-400">
                    Billing data will populate these project cards once the backend has monthly spend records.
                  </div>
                </div>
              )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.26)] backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Cost by service</h2>
              <p className="text-sm text-slate-400">June spend distribution across services</p>
            </div>
          </div>
          {isLoading || !data ? (
            <SkeletonBlock className="h-[340px] w-full" />
          ) : (
            <CostChart data={data.spend_by_service} />
          )}
        </div>

        <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.26)] backdrop-blur-xl">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">Budget status</h2>
            <p className="text-sm text-slate-400">Projects approaching or exceeding budget</p>
          </div>
          <div className="space-y-4">
            {isLoading || !data
              ? skeletonCards.map((index) => (
                  <div key={index} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                    <SkeletonBlock className="h-4 w-28" />
                    <SkeletonBlock className="mt-4 h-20 w-full rounded-full" />
                    <SkeletonBlock className="mt-4 h-4 w-40" />
                  </div>
                ))
              : budgets.length > 0
                ? budgets.map((budget) => <AlertCard key={budget.project_id} budget={budget} />)
                : (
                    <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">
                      No budgets are configured yet. Add a budget to watch it light up here.
                    </div>
                  )}
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.26)] backdrop-blur-xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Recent audit log entries</h2>
            <p className="text-sm text-slate-400">Latest activity captured by the platform</p>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        ) : isLoading || !data ? (
          <div className="overflow-hidden rounded-3xl border border-white/10">
            <div className="grid grid-cols-4 gap-4 border-b border-white/10 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.24em] text-slate-500">
              <div>Timestamp</div>
              <div>Agent</div>
              <div>Action</div>
              <div>Severity</div>
            </div>
            {skeletonCards.map((index) => (
              <div key={index} className="grid grid-cols-4 gap-4 border-b border-white/8 px-4 py-4 opacity-80">
                <SkeletonBlock className="h-4 w-32" />
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonBlock className="h-4 w-36" />
                <SkeletonBlock className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : auditEntries.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-8 text-center text-slate-400">
            <div className="text-3xl">◌</div>
            <div className="mt-3 text-base font-medium text-white">No audit entries yet</div>
            <div className="mt-2 text-sm leading-6 text-slate-400">
              Run a chat request or agent workflow and the latest audit activity will appear here.
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-white/10">
            <div className="grid grid-cols-4 gap-4 border-b border-white/10 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.24em] text-slate-500">
              <div>Timestamp</div>
              <div>Agent</div>
              <div>Action</div>
              <div>Severity</div>
            </div>
            {auditEntries.slice(0, 6).map((entry: AuditLogEntry, index: number) => (
              <div
                key={`${entry.timestamp}-${index}`}
                className="grid grid-cols-4 gap-4 border-b border-white/[0.06] px-4 py-4 text-sm text-slate-200 odd:bg-white/[0.02]"
              >
                <div className="text-slate-400">{new Date(entry.timestamp).toLocaleString()}</div>
                <div className="font-medium text-white">{entry.agent_name}</div>
                <div className="text-slate-300">{entry.action}</div>
                <div>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getSeverityTone(entry.severity)}`}>
                    {entry.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
