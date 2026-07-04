"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/chat", label: "Chat", icon: "💬" },
  { href: "/reports", label: "Reports", icon: "📊" },
  { href: "/alerts", label: "Alerts", icon: "🚨" },
  { href: "/forecast", label: "Forecast", icon: "📈" },
  { href: "/audit", label: "Audit Log", icon: "📋" },
] as const;

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 h-screen w-[250px] border-r border-white/10 bg-[var(--surface)] px-4 py-5 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.35)]">
      <div className="flex h-full flex-col rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,18,31,0.9),rgba(10,10,15,0.82))] p-4">
        <div className="mb-8 flex items-center gap-3 px-2 py-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--accent-from),var(--accent-to))] text-lg font-semibold text-white shadow-[0_10px_30px_rgba(59,130,246,0.35)]">
            C
          </div>
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">
              CloudMind
            </div>
            <div className="text-xs text-slate-500">AI FinOps Platform</div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname?.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/8 hover:text-white ${
                  isActive
                    ? "bg-[linear-gradient(135deg,rgba(59,130,246,0.24),rgba(139,92,246,0.24))] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_12px_30px_rgba(59,130,246,0.12)]"
                    : "text-slate-300"
                }`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-base transition-colors duration-200 group-hover:bg-white/10">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
            Status
          </div>
          <div className="mt-2 text-sm font-medium text-slate-200">
            Backend online
          </div>
          <div className="mt-1 text-xs text-slate-500">Connected</div>
        </div>

        <div className="mt-3 rounded-3xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">
          Powered by Google ADK
        </div>
      </div>
    </aside>
  );
}