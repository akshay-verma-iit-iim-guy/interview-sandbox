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
        <Line type="monotone" dataKey="knowledge" name="Knowledge deflected" stroke="var(--accent)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="gaps" name="Knowledge gaps" stroke="var(--warn)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="downvoted" name="Tried, downvoted" stroke="var(--danger)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="escalated" name="Critical escalations" stroke="var(--muted)" strokeWidth={2} dot={false} />
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
