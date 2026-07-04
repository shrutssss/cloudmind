"use client";

import { useEffect, useMemo, useState } from "react";

import { getAuditLog, type AuditLogEntry } from "@/lib/api";

const severityOptions = ["ALL", "INFO", "WARNING", "HIGH", "CRITICAL"] as const;
const statusStyles: Record<string, string> = {
  ALLOWED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  DENIED: "border-rose-400/30 bg-rose-400/10 text-rose-100",
};

function SkeletonRow() {
  return (
    <tr className="border-b border-white/[0.06]">
      {Array.from({ length: 6 }, (_, index) => (
        <td key={index} className="px-4 py-4">
          <div className="h-4 animate-pulse rounded-full bg-white/10" />
        </td>
      ))}
    </tr>
  );
}

function getAgentOptions(entries: AuditLogEntry[]) {
  const uniqueAgents = Array.from(new Set(entries.map((entry) => entry.agent_name))).sort();
  return ["ALL", ...uniqueAgents];
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [agentFilter, setAgentFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState<(typeof severityOptions)[number]>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      setError(null);
      setIsLoading(true);

      try {
        const response = await getAuditLog(
          200,
          agentFilter === "ALL" ? undefined : agentFilter,
          severityFilter === "ALL" ? undefined : severityFilter,
        );

        if (!active) {
          return;
        }

        setEntries(response.logs);
      } catch (requestError: unknown) {
        if (!active) {
          return;
        }

        setError(requestError instanceof Error ? requestError.message : "Failed to load data — try again");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [agentFilter, severityFilter]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void (async () => {
        try {
          const response = await getAuditLog(
            200,
            agentFilter === "ALL" ? undefined : agentFilter,
            severityFilter === "ALL" ? undefined : severityFilter,
          );
          setEntries(response.logs);
        } catch {
          // Let the next refresh or manual reload recover.
        }
      })();
    }, 10000);

    return () => window.clearInterval(timer);
  }, [agentFilter, severityFilter]);

  const agentOptions = useMemo(() => getAgentOptions(entries), [entries]);

  return (
    <div className="space-y-6 pb-10">
      <section className="rounded-[32px] border border-white/10 bg-white/[0.04] shadow-[0_24px_70px_rgba(0,0,0,0.26)] backdrop-blur-xl">
        <div className="page-header-surface rounded-[32px] px-6 py-6 sm:px-8">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.28em] text-sky-200">Audit log</div>
            <h1 className="text-3xl font-semibold text-white">Review permissions and agent activity</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-200/80">
              Use the filters to isolate agent behavior, severity, and permission denials. The table refreshes automatically every 10 seconds.
            </p>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Agent</span>
                <select
                  value={agentFilter}
                  onChange={(event) => setAgentFilter(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/15"
                >
                  {agentOptions.map((agent) => (
                    <option key={agent} value={agent}>
                      {agent === "ALL" ? "All agents" : agent}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Severity</span>
                <select
                  value={severityFilter}
                  onChange={(event) => setSeverityFilter(event.target.value as (typeof severityOptions)[number])}
                  className="w-full rounded-2xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/15"
                >
                  {severityOptions.map((severity) => (
                    <option key={severity} value={severity}>
                      {severity === "ALL" ? "All severities" : severity}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="button"
              onClick={() => {
                setError(null);
                setIsLoading(true);

                void (async () => {
                  try {
                    const response = await getAuditLog(
                      200,
                      agentFilter === "ALL" ? undefined : agentFilter,
                      severityFilter === "ALL" ? undefined : severityFilter,
                    );
                    setEntries(response.logs);
                  } catch (requestError: unknown) {
                    setError(requestError instanceof Error ? requestError.message : "Failed to load data — try again");
                  } finally {
                    setIsLoading(false);
                  }
                })();
              }}
              className="rounded-2xl bg-[linear-gradient(135deg,#3b82f6,#8b5cf6)] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-[0_18px_35px_rgba(59,130,246,0.28)]"
            >
              Refresh Now
            </button>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(10,12,22,0.92)] shadow-[0_20px_60px_rgba(0,0,0,0.32)]">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="bg-white/5 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th className="px-4 py-4 font-medium">Timestamp</th>
                    <th className="px-4 py-4 font-medium">Agent</th>
                    <th className="px-4 py-4 font-medium">Action</th>
                    <th className="px-4 py-4 font-medium">Resource ID</th>
                    <th className="px-4 py-4 font-medium">Severity</th>
                    <th className="px-4 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading
                    ? Array.from({ length: 8 }, (_, index) => <SkeletonRow key={index} />)
                    : entries.length ? (
                        entries.map((entry, index) => {
                          const denied = entry.status === "DENIED";

                          return (
                            <tr
                              key={`${entry.timestamp}-${index}`}
                              className={`border-b border-white/[0.06] transition ${denied ? "bg-rose-400/5" : index % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"} ${denied ? "ring-1 ring-inset ring-rose-400/20" : ""}`}
                            >
                              <td className="px-4 py-4 text-slate-400">{new Date(entry.timestamp).toLocaleString()}</td>
                              <td className="px-4 py-4 font-medium text-white">{entry.agent_name}</td>
                              <td className="px-4 py-4 text-slate-300">{entry.action}</td>
                              <td className="px-4 py-4 text-slate-400">{entry.resource_id ?? "-"}</td>
                              <td className="px-4 py-4">
                                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${entry.severity === "CRITICAL" ? "border-rose-400/30 bg-rose-400/10 text-rose-100" : entry.severity === "HIGH" ? "border-orange-400/30 bg-orange-400/10 text-orange-100" : entry.severity === "WARNING" ? "border-amber-400/30 bg-amber-400/10 text-amber-100" : "border-sky-400/30 bg-sky-400/10 text-sky-100"}`}>
                                  {entry.severity}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${statusStyles[entry.status] ?? "border-white/10 bg-white/5 text-slate-200"}`}>
                                  {entry.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                            No audit entries match the current filters.
                          </td>
                        </tr>
                      )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}