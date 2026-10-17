"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { weeklyVolume } from "@/lib/mock-data";

const axis = { stroke: "var(--muted)", fontSize: 12 };
const tooltip = {
  contentStyle: { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, color: "var(--ink)" },
};

export function VolumeChart() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={weeklyVolume} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
        <CartesianGrid stroke="var(--line)" vertical={false} />
        <XAxis dataKey="week" tick={axis} tickLine={false} axisLine={false} />
        <YAxis tick={axis} tickLine={false} axisLine={false} />
        <Tooltip {...tooltip} />
        <Legend wrapperStyle={{ fontSize: 13 }} />
        <Line type="monotone" dataKey="opened" name="Opened" stroke="var(--warn)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="resolved" name="Resolved" stroke="var(--accent)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DeflectionOutcomeChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={3} stroke="var(--surface)">
          {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
        </Pie>
        <Tooltip {...tooltip} formatter={(value) => [`${value ?? 0}%`, "Share"]} />
        <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function DeflectionTrendChart({ data }: { data: { week: string; knowledge: number; gaps: number; downvoted: number; escalated: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
        <CartesianGrid stroke="var(--line)" vertical={false} />
        <XAxis dataKey="week" tick={axis} tickLine={false} axisLine={false} />
        <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip {...tooltip} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="knowledge" name="Knowledge deflected" stroke="var(--o-deflected)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="gaps" name="Knowledge gaps" stroke="var(--o-gap)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="downvoted" name="Tried, downvoted" stroke="var(--o-downvoted)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="escalated" name="Critical escalations" stroke="var(--o-critical)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function EventCountChart({ data }: { data: { name: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 44)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
        <CartesianGrid stroke="var(--line)" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={axis} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="name" width={170} tick={axis} tickLine={false} axisLine={false} />
        <Tooltip {...tooltip} cursor={{ fill: "var(--surface-2)" }} />
        <Bar dataKey="count" name="Events" fill="var(--accent)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ---------- Deflection outcomes (shared data in lib/deflection-data.ts) ---------- */

type OutcomeMeta = { key: string; label: string; color: string };

function OutcomeTooltip({ active, payload, label, percent }: { active?: boolean; payload?: { name?: string; value?: number; color?: string; dataKey?: string; payload?: Record<string, number> }[]; label?: string; percent?: boolean }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((a, p) => a + (p.value ?? 0), 0);
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink shadow-md">
      <p className="mb-1 font-medium">{label}</p>
      {[...payload].reverse().map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} aria-hidden />
          <span className="text-muted">{p.name}</span>
          <span className="tabular ml-auto pl-3">{percent ? `${Math.round(((p.value ?? 0) / total) * 100)}%` : p.value}</span>
        </p>
      ))}
      {!percent && <p className="tabular mt-1 border-t border-line pt-1 text-muted">Total {total}</p>}
    </div>
  );
}

/** Weekly inbound questions split by how each one ended. Segments sum to the week's total. */
export function OutcomeWeeklyChart({ data, outcomes }: { data: Record<string, string | number>[]; outcomes: OutcomeMeta[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid stroke="var(--line)" vertical={false} />
        <XAxis dataKey="week" tick={axis} tickLine={false} axisLine={false} />
        <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip content={<OutcomeTooltip />} cursor={{ fill: "var(--surface-2)" }} />
        {outcomes.map((o, i) => (
          <Bar key={o.key} dataKey={o.key} name={o.label} stackId="w" fill={o.color} stroke="var(--surface)" strokeWidth={2}
            radius={i === outcomes.length - 1 ? [4, 4, 0, 0] : 0} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Outcome mix per category as 100% bars, so categories of different size compare fairly. */
export function CategoryMixChart({ data, outcomes }: { data: Record<string, string | number>[]; outcomes: OutcomeMeta[] }) {
  return (
    <ResponsiveContainer width="100%" height={data.length * 40 + 24}>
      <BarChart data={data} layout="vertical" stackOffset="expand" margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
        <XAxis type="number" tickFormatter={(v: number) => `${Math.round(v * 100)}%`} tick={axis} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="category" width={88} tick={axis} tickLine={false} axisLine={false} />
        <Tooltip content={<OutcomeTooltip percent />} cursor={{ fill: "var(--surface-2)" }} />
        {outcomes.map((o, i) => (
          <Bar key={o.key} dataKey={o.key} name={o.label} stackId="c" fill={o.color} stroke="var(--surface)" strokeWidth={2}
            radius={i === 0 ? [4, 0, 0, 4] : i === outcomes.length - 1 ? [0, 4, 4, 0] : 0} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
