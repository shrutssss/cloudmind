type ActivityItem = {
  agent: string;
  status: "working" | "done";
  message: string;
};

type PermissionBadge = {
  label: string;
  tone: string;
};

type AgentActivityProps = {
  activities: ActivityItem[];
};

const agentColors: Record<string, string> = {
  orchestrator: "from-sky-400 to-cyan-300",
  anomaly_detection: "from-rose-400 to-orange-300",
  rightsizing: "from-emerald-400 to-lime-300",
  forecast: "from-violet-400 to-fuchsia-300",
  report: "from-amber-400 to-yellow-300",
  cost_analysis: "from-blue-400 to-indigo-300",
};

const agentPermissions: Record<string, PermissionBadge> = {
  cost_analysis: {
    label: "READ ONLY",
    tone: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  },
  anomaly_detection: {
    label: "READ + FLAG",
    tone: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  },
  rightsizing: {
    label: "READ + FLAG",
    tone: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  },
  forecast: {
    label: "READ ONLY",
    tone: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  },
  report: {
    label: "READ ONLY",
    tone: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  },
};

function getAgentGradient(agent: string) {
  return agentColors[agent] ?? "from-slate-400 to-slate-200";
}

export default function AgentActivity({ activities }: AgentActivityProps) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.26)] backdrop-blur-xl">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Agent activity</h2>
        <p className="text-sm text-slate-400">Real-time orchestration timeline</p>
      </div>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-500">
            Agent steps will appear here while a request is running.
          </div>
        ) : (
          activities.map((activity, index) => (
            <div key={`${activity.agent}-${index}`} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br ${getAgentGradient(activity.agent)} text-sm font-semibold text-slate-950`}
                >
                  {activity.status === "working" ? (
                    <span className="inline-block animate-spin">◌</span>
                  ) : (
                    "✓"
                  )}
                </div>
                {index < activities.length - 1 ? <div className="mt-2 h-full w-px bg-white/10" /> : null}
              </div>

              <div className="min-w-0 flex-1 pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-medium text-white">{activity.agent.replace(/_/g, " ")}</div>
                  {agentPermissions[activity.agent] ? (
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${agentPermissions[activity.agent].tone}`}
                    >
                      {agentPermissions[activity.agent].label}
                    </span>
                  ) : null}
                </div>
                <div className="text-sm text-slate-400">{activity.message}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}