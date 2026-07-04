"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { SpendSummary } from "@/lib/api";

type CostChartProps = {
  data: SpendSummary[];
};

const barGradientId = "cost-chart-gradient";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatLabel(item: SpendSummary) {
  return item.service ?? item.project_id ?? "Unknown";
}

function TooltipContent({ active, payload }: { active?: boolean; payload?: Array<{ payload: SpendSummary; value?: number }> }) {
  if (!active || !payload?.length) {
    return null;
  }

  const row = payload[0].payload;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="font-medium text-white">{formatLabel(row)}</div>
      <div className="mt-1 text-slate-300">{formatCurrency(row.total_cost)}</div>
    </div>
  );
}

export default function CostChart({ data }: CostChartProps) {
  const chartData = [...data]
    .sort((left, right) => right.total_cost - left.total_cost)
    .slice(0, 8);

  if (chartData.length === 0) {
    return (
      <div className="flex h-[340px] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[linear-gradient(180deg,rgba(7,10,18,0.92),rgba(8,12,24,0.78))] p-6 text-center">
        <div className="max-w-sm space-y-3">
          <div className="text-3xl">◌</div>
          <div className="text-base font-medium text-white">No cost data yet</div>
          <div className="text-sm leading-6 text-slate-400">
            Once billing records arrive, the service mix chart will populate here automatically.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[340px] rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(7,10,18,0.92),rgba(8,12,24,0.78))] p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
          <defs>
            <linearGradient id={barGradientId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" strokeDasharray="4 6" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(value) => `$${Number(value).toLocaleString()}`}
            stroke="#94a3b8"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey={(item: SpendSummary) => formatLabel(item)}
            width={150}
            stroke="#cbd5e1"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<TooltipContent />} cursor={{ fill: "rgba(59, 130, 246, 0.08)" }} />
          <Bar dataKey="total_cost" radius={[0, 14, 14, 0]} barSize={18}>
            {chartData.map((entry) => (
              <Cell key={`${formatLabel(entry)}-${entry.total_cost}`} fill={`url(#${barGradientId})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}