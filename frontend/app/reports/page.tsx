"use client";

import { useMemo, useState } from "react";

import { generateReport, type ReportResponse } from "@/lib/api";

type ReportMode = "cfo" | "engineering";

const projects = [
  { value: "proj-prod-ecommerce", label: "Production Ecommerce" },
  { value: "proj-staging-ml-platform", label: "Staging ML Platform" },
  { value: "proj-dev-internal-tools", label: "Dev Internal Tools" },
];

function formatProjectLabel(projectId: string) {
  return projects.find((project) => project.value === projectId)?.label ?? projectId;
}

function renderMarkdown(markdown: string) {
  return markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br />");
}

function Skeleton() {
  return (
    <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="h-4 w-32 animate-pulse rounded-full bg-white/10" />
      <div className="h-8 w-64 animate-pulse rounded-full bg-white/10" />
      <div className="h-4 w-full animate-pulse rounded-full bg-white/10" />
      <div className="h-4 w-11/12 animate-pulse rounded-full bg-white/10" />
      <div className="h-4 w-10/12 animate-pulse rounded-full bg-white/10" />
    </div>
  );
}

export default function ReportsPage() {
  const [mode, setMode] = useState<ReportMode>("cfo");
  const [projectId, setProjectId] = useState(projects[0].value);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(
    () => (mode === "cfo" ? "CFO Report" : "Engineering Report"),
    [mode],
  );

  async function handleGenerate() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await generateReport(mode, projectId);
      setReport(response);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load data — try again");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <section className="rounded-[32px] border border-white/10 bg-white/[0.04] shadow-[0_24px_70px_rgba(0,0,0,0.26)] backdrop-blur-xl">
        <div className="page-header-surface rounded-[32px] px-6 py-6 sm:px-8">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.28em] text-sky-200">Reports</div>
            <h1 className="text-3xl font-semibold text-white">Generate executive-ready reports</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-200/80">
              Switch between CFO and Engineering views, then generate a markdown-formatted report for the selected project.
            </p>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
                {(["cfo", "engineering"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setMode(item)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      mode === item
                        ? "bg-[linear-gradient(135deg,#3b82f6,#8b5cf6)] text-white"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    {item === "cfo" ? "CFO Report" : "Engineering Report"}
                  </button>
                ))}
              </div>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Project</span>
                <select
                  value={projectId}
                  onChange={(event) => setProjectId(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/15 sm:w-[320px]"
                >
                  {projects.map((project) => (
                    <option key={project.value} value={project.value}>
                      {project.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#3b82f6,#8b5cf6)] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-[0_18px_35px_rgba(59,130,246,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Generating..." : "Generate Report"}
            </button>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <Skeleton />
          ) : report ? (
            <article className="overflow-hidden rounded-[30px] border border-white/10 bg-[rgba(10,12,22,0.92)] shadow-[0_20px_60px_rgba(0,0,0,0.32)]">
              <div className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(59,130,246,0.22),rgba(139,92,246,0.16))] px-5 py-4">
                <div className="text-xs uppercase tracking-[0.24em] text-sky-100/80">{title}</div>
                <div className="mt-2 text-lg font-semibold text-white">{formatProjectLabel(report.project_id)}</div>
              </div>

              <div className="p-5 sm:p-6">
                <div
                  className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-white prose-a:text-sky-300"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(report.report) }}
                />
              </div>
            </article>
          ) : (
            <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-8 text-sm text-slate-400">
              Pick a report mode and project, then generate a formatted summary.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}