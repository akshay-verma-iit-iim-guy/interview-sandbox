"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, BarChart3, BookOpenCheck, Inbox, LayoutDashboard, Plus, Search, ShieldAlert, ThumbsDown } from "lucide-react";
import { appConfig } from "@/lib/config";
import {
  CATEGORIES,
  PRIORITIES,
  STATUSES,
  mockRecords,
  type CaseRecord,
  type Priority,
  type Status,
} from "@/lib/mock-data";
import { track, useTrackedEvents, type TrackedEvent } from "@/lib/track";
import { AiAssist } from "./ai-assist";
import { DeflectionOutcomeChart, DeflectionTrendChart, EventCountChart, VolumeChart } from "./charts";
import { Button, Modal, PriorityBadge, StatusBadge, ToastProvider, useToast } from "./ui";

type View = "overview" | "queue" | "insights";
type DataMode = "checking" | "mock" | "connected" | "error";

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
const fmt = (iso: string) => dateFmt.format(new Date(iso));
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function Console() {
  return (
    <ToastProvider>
      <ConsoleInner />
    </ToastProvider>
  );
}

function ConsoleInner() {
  const toast = useToast();
  const [view, setView] = useState<View>("queue");
  const [records, setRecords] = useState<CaseRecord[]>(mockRecords);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [dataMode, setDataMode] = useState<DataMode>("checking");
  const events = useTrackedEvents();

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((h: { supabase?: string }) =>
        setDataMode(h.supabase === "connected" ? "connected" : h.supabase === "not_configured" ? "mock" : "error"),
      )
      .catch(() => setDataMode("error"));
  }, []);

  const selected = records.find((r) => r.id === selectedId) ?? null;

  const go = (v: View) => {
    setView(v);
    track("view_opened", { view: v });
  };

  const updateStatus = (id: string, status: Status) => {
    setRecords((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    track("record_status_changed", { record_id: id, status });
  };

  const nav: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard size={18} /> },
    { id: "queue", label: cap(appConfig.entity.plural), icon: <Inbox size={18} /> },
    { id: "insights", label: "Insights", icon: <BarChart3 size={18} /> },
  ];

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Navigation: left rail on desktop, top tabs on mobile */}
      <nav className="flex shrink-0 gap-1 border-b border-line bg-surface p-2 md:w-52 md:flex-col md:border-b-0 md:border-r md:p-3" aria-label="Main">
        <div className="mb-0 hidden px-2 pb-4 pt-1 text-base font-semibold md:block">{appConfig.productName}</div>
        {nav.map((n) => (
          <button
            key={n.id}
            onClick={() => go(n.id)}
            aria-current={view === n.id ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm ${
              view === n.id ? "bg-accent-soft font-medium text-accent" : "text-muted hover:bg-surface-2 hover:text-ink"
            }`}
          >
            {n.icon}
            {n.label}
          </button>
        ))}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 md:px-6">
          <h1 className="text-lg font-semibold">{nav.find((n) => n.id === view)?.label}</h1>
          <div className="flex items-center gap-2">
            <DataPill mode={dataMode} />
            <Button variant="ghost" onClick={() => setLogOpen((o) => !o)} aria-expanded={logOpen}>
              <Activity size={16} /> Event log <span className="tabular">({events.length})</span>
            </Button>
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus size={16} /> New {appConfig.entity.singular}
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          {view === "overview" && <Overview records={records} onOpen={setSelectedId} />}
          {view === "queue" && <Queue records={records} onOpen={(id) => { setSelectedId(id); track("record_opened", { record_id: id }); }} />}
          {view === "insights" && <Insights sessionEvents={events} dataMode={dataMode} />}
        </main>
      </div>

      <Modal open={Boolean(selected)} onClose={() => setSelectedId(null)} title={selected ? `${selected.id} · ${selected.title}` : ""} side="right">
        {selected && (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Field label="Requester">{selected.requester}</Field>
              <Field label="Category">{selected.category}</Field>
              <Field label="Priority"><PriorityBadge priority={selected.priority} /></Field>
              <Field label="Channel">{selected.channel}</Field>
              <Field label="Opened">{fmt(selected.createdAt)} UTC</Field>
              <Field label="Time left on SLA">
                <span className={`tabular ${selected.slaHoursLeft <= 4 ? "font-medium text-danger" : ""}`}>{selected.slaHoursLeft} h</span>
              </Field>
            </dl>
            <p className="text-sm leading-relaxed">{selected.description}</p>
            <label className="flex items-center gap-3 text-sm">
              <span className="text-muted">Status</span>
              <select
                value={selected.status}
                onChange={(e) => updateStatus(selected.id, e.target.value as Status)}
                className="rounded-md border border-line bg-surface px-2 py-1.5"
              >
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <AiAssist key={selected.id} record={selected} onResolve={(id) => updateStatus(id, "Resolved")} />
          </div>
        )}
      </Modal>

      <NewRecordModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={(r) => {
          setRecords((rs) => [r, ...rs]);
          track("record_created", { record_id: r.id, category: r.category, priority: r.priority });
          toast(`${cap(appConfig.entity.singular)} ${r.id} created`);
          setCreating(false);
          setView("queue");
        }}
        nextId={`CS-${1042 + records.length}`}
      />

      {logOpen && <EventLog events={events} onClose={() => setLogOpen(false)} />}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

function DataPill({ mode }: { mode: DataMode }) {
  const map = {
    checking: { text: "Checking data…", cls: "text-muted" },
    mock: { text: "Mock data", cls: "text-muted" },
    connected: { text: "Supabase connected", cls: "text-accent" },
    error: { text: "Database error", cls: "text-danger" },
  }[mode];
  return <span className={`hidden rounded-full border border-line px-2.5 py-1 text-xs sm:inline ${map.cls}`}>{map.text}</span>;
}

/* ---------- Overview ---------- */

function Overview({ records, onOpen }: { records: CaseRecord[]; onOpen: (id: string) => void }) {
  const open = records.filter((r) => r.status !== "Resolved");
  const breaching = open.filter((r) => r.slaHoursLeft <= 4);
  const resolvedPct = Math.round(((records.length - open.length) / records.length) * 100);
  const stats = [
    { label: `Open ${appConfig.entity.plural}`, value: open.length },
    { label: "Due in 4 hours or less", value: breaching.length, alert: breaching.length > 0 },
    { label: "Resolved", value: `${resolvedPct}%` },
    { label: "Median first reply", value: "2.4 h" },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 divide-line rounded-lg border border-line bg-surface md:grid-cols-4 md:divide-x">
        {stats.map((s) => (
          <div key={s.label} className="p-4">
            <div className={`tabular text-2xl font-semibold ${s.alert ? "text-danger" : ""}`}>{s.value}</div>
            <div className="text-sm text-muted">{s.label}</div>
          </div>
        ))}
      </div>
      <section className="rounded-lg border border-line bg-surface p-4">
        <h2 className="mb-2 text-sm font-semibold">Weekly volume</h2>
        <VolumeChart />
      </section>
      <section className="rounded-lg border border-line bg-surface">
        <h2 className="border-b border-line px-4 py-3 text-sm font-semibold">Closest to SLA breach</h2>
        <ul>
          {[...open].sort((a, b) => a.slaHoursLeft - b.slaHoursLeft).slice(0, 5).map((r) => (
            <li key={r.id} className="border-b border-line last:border-0">
              <button onClick={() => onOpen(r.id)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-surface-2">
                <span className="truncate">{r.title}</span>
                <span className="tabular shrink-0 text-danger">{r.slaHoursLeft} h left</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ---------- Queue ---------- */

function Queue({ records, onOpen }: { records: CaseRecord[]; onOpen: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status | "All">("All");
  const [priority, setPriority] = useState<Priority | "All">("All");
  const [sort, setSort] = useState<"sla" | "newest">("sla");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records
      .filter((r) => status === "All" || r.status === status)
      .filter((r) => priority === "All" || r.priority === priority)
      .filter((r) => !q || [r.id, r.title, r.requester, r.category].some((f) => f.toLowerCase().includes(q)))
      .sort((a, b) => (sort === "sla" ? a.slaHoursLeft - b.slaHoursLeft : b.createdAt.localeCompare(a.createdAt)));
  }, [records, query, status, priority, sort]);

  const clear = () => {
    setQuery("");
    setStatus("All");
    setPriority("All");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-56 flex-1">
          <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={() => query && track("search_used", { query_length: query.length, results: rows.length })}
            placeholder={`Search ${appConfig.entity.plural}, people or IDs`}
            className="w-full rounded-md border border-line bg-surface py-1.5 pl-8 pr-3 text-sm"
            aria-label="Search"
          />
        </label>
        <Select label="Status" value={status} options={["All", ...STATUSES]} onChange={(v) => setStatus(v as Status | "All")} />
        <Select label="Priority" value={priority} options={["All", ...PRIORITIES]} onChange={(v) => setPriority(v as Priority | "All")} />
        <Select label="Sort" value={sort} options={["sla", "newest"]} labels={{ sla: "SLA first", newest: "Newest first" }} onChange={(v) => setSort(v as "sla" | "newest")} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-line text-left text-xs text-muted">
            <tr>
              <th className="px-4 py-2.5 font-medium">ID</th>
              <th className="px-4 py-2.5 font-medium">Title</th>
              <th className="px-4 py-2.5 font-medium">Requester</th>
              <th className="px-4 py-2.5 font-medium">Priority</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">SLA left</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} onClick={() => onOpen(r.id)} className="cursor-pointer border-b border-line last:border-0 hover:bg-surface-2">
                <td className="tabular whitespace-nowrap px-4 py-2.5 text-muted">{r.id}</td>
                <td className="px-4 py-2.5">
                  <button className="text-left font-medium hover:underline" onClick={(e) => { e.stopPropagation(); onOpen(r.id); }}>
                    {r.title}
                  </button>
                  <div className="text-xs text-muted">{r.category} · {r.channel}</div>
                </td>
                <td className="px-4 py-2.5">{r.requester}</td>
                <td className="px-4 py-2.5"><PriorityBadge priority={r.priority} /></td>
                <td className="px-4 py-2.5"><StatusBadge status={r.status} /></td>
                <td className={`tabular px-4 py-2.5 text-right ${r.slaHoursLeft <= 4 && r.status !== "Resolved" ? "font-medium text-danger" : ""}`}>
                  {r.slaHoursLeft} h
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="px-4 py-10 text-center text-sm">
            <p className="font-medium">No {appConfig.entity.plural} match these filters.</p>
            <Button className="mt-3" onClick={clear}>Clear filters</Button>
          </div>
        )}
      </div>
      <p className="text-xs text-muted">{rows.length} of {records.length} {appConfig.entity.plural}</p>
    </div>
  );
}

function Select({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  labels?: Record<string, string>;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-line bg-surface px-2 py-1.5">
        {options.map((o) => <option key={o} value={o}>{labels?.[o] ?? o}</option>)}
      </select>
    </label>
  );
}

/* ---------- New record form with validation ---------- */

function NewRecordModal({
  open,
  onClose,
  onCreate,
  nextId,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (r: CaseRecord) => void;
  nextId: string;
}) {
  const [title, setTitle] = useState("");
  const [requester, setRequester] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [priority, setPriority] = useState<Priority>("Medium");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    title: title.trim().length < 5 ? "Add a title of at least 5 characters." : title.length > 120 ? "Keep the title under 120 characters." : "",
    requester: requester.trim() ? "" : "Add who raised it.",
  };
  const valid = !errors.title && !errors.requester;

  const reset = () => {
    setTitle(""); setRequester(""); setDescription(""); setCategory(CATEGORIES[0]); setPriority("Medium"); setSubmitted(false);
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title={`New ${appConfig.entity.singular}`}>
      <form
        noValidate
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
          if (!valid) {
            track("form_validation_failed", { fields: Object.entries(errors).filter(([, v]) => v).map(([k]) => k) });
            return;
          }
          onCreate({
            id: nextId,
            title: title.trim(),
            requester: requester.trim(),
            category,
            priority,
            status: "New",
            channel: "Portal",
            createdAt: new Date().toISOString(),
            slaHoursLeft: priority === "High" ? 4 : priority === "Medium" ? 24 : 48,
            description: description.trim() || "No description provided.",
          });
          reset();
        }}
      >
        <TextField label="Title" value={title} onChange={setTitle} error={submitted ? errors.title : ""} />
        <TextField label="Requester" value={requester} onChange={setRequester} error={submitted ? errors.requester : ""} />
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-muted">Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-md border border-line bg-surface px-2 py-1.5">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">Priority</span>
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="w-full rounded-md border border-line bg-surface px-2 py-1.5">
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
        </div>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">Description (optional)</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-md border border-line bg-surface p-2" />
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button type="submit" variant="primary">Create {appConfig.entity.singular}</Button>
        </div>
      </form>
    </Modal>
  );
}

function TextField({ label, value, onChange, error }: { label: string; value: string; onChange: (v: string) => void; error: string }) {
  const id = `f-${label.toLowerCase()}`;
  return (
    <div className="text-sm">
      <label htmlFor={id} className="mb-1 block text-muted">{label}</label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : undefined}
        className={`w-full rounded-md border bg-surface px-2 py-1.5 ${error ? "border-danger" : "border-line"}`}
      />
      {error && <p id={`${id}-err`} className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

/* ---------- Insights ---------- */

function Insights({ sessionEvents, dataMode }: { sessionEvents: TrackedEvent[]; dataMode: DataMode }) {
  const [stored, setStored] = useState<{ event_name: string }[]>([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (dataMode !== "connected") return;
    fetch("/api/events")
      .then((r) => r.json())
      .then((r: { events?: { event_name: string }[]; error?: string }) => {
        if (r.error) setLoadError(r.error);
        setStored(r.events ?? []);
      })
      .catch(() => setLoadError("Couldn't load stored events."));
  }, [dataMode, sessionEvents.length]);

  const source = dataMode === "connected" ? stored : sessionEvents;
  const counts = Object.entries(source.reduce<Record<string, number>>((acc, e) => ({ ...acc, [e.event_name]: (acc[e.event_name] ?? 0) + 1 }), {}))
    .map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  const outcomes = [
    { label: "Correctly deflected", value: 68, detail: "Resolved from approved knowledge", icon: BookOpenCheck, tone: "text-accent", bar: "bg-accent" },
    { label: "Knowledge gaps", value: 14, detail: "No confident article match", icon: AlertTriangle, tone: "text-warn", bar: "bg-warn" },
    { label: "Tried, downvoted", value: 11, detail: "Answer shown but rejected", icon: ThumbsDown, tone: "text-danger", bar: "bg-danger" },
    { label: "Direct escalation", value: 7, detail: "Critical or sensitive cases", icon: ShieldAlert, tone: "text-muted", bar: "bg-muted" },
  ];
  const trend = [
    { week: "Sep 14", knowledge: 148, gaps: 22, downvoted: 16, escalated: 8 },
    { week: "Sep 21", knowledge: 163, gaps: 19, downvoted: 14, escalated: 7 },
    { week: "Sep 28", knowledge: 171, gaps: 21, downvoted: 12, escalated: 9 },
    { week: "Oct 5", knowledge: 184, gaps: 17, downvoted: 13, escalated: 6 },
    { week: "Oct 12", knowledge: 196, gaps: 14, downvoted: 11, escalated: 7 },
  ];
  const total = outcomes.reduce((sum, item) => sum + item.value, 0);
  const pie = outcomes.map((item) => ({ name: item.label, value: item.value, color: item.label === "Correctly deflected" ? "var(--accent)" : item.label === "Knowledge gaps" ? "var(--warn)" : item.label === "Tried, downvoted" ? "var(--danger)" : "var(--muted)" }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-sm text-muted">Last 30 days · {dataMode === "connected" ? "stored product events" : "sampled operational data"}</p><p className="mt-1 text-xs text-muted">Deflection outcomes help prioritize content fixes and safe escalation.</p></div>
        {loadError && <p className="text-sm text-danger">{loadError}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {outcomes.map((item) => { const Icon = item.icon; return <div key={item.label} className="rounded-lg border border-line bg-surface p-4"><div className="flex items-center justify-between"><Icon className={item.tone} size={18} aria-hidden /><span className="tabular text-2xl font-semibold">{item.value}%</span></div><p className="mt-3 text-sm font-medium">{item.label}</p><p className="mt-1 text-xs text-muted">{item.detail}</p><div className="mt-3 h-1.5 rounded-full bg-surface-2"><div className={`h-full rounded-full ${item.bar}`} style={{ width: `${item.value / 0.68}%` }} /></div></div>; })}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-lg border border-line bg-surface p-4"><div className="mb-3"><h2 className="text-sm font-semibold">Deflection outcomes over time</h2><p className="text-xs text-muted">Volume by outcome, not just total automation.</p></div><DeflectionTrendChart data={trend} /></section>
        <section className="rounded-lg border border-line bg-surface p-4"><h2 className="text-sm font-semibold">Outcome mix</h2><p className="mt-1 text-xs text-muted">{total}% of routed conversations</p><DeflectionOutcomeChart data={pie} /></section>
      </div>
      <section className="rounded-lg border border-line bg-surface p-4"><div className="mb-3"><h2 className="text-sm font-semibold">Knowledge action queue</h2><p className="text-xs text-muted">Where the team should improve the knowledge base next.</p></div><div className="grid gap-3 md:grid-cols-3"><div className="rounded-md bg-warn-soft p-3"><p className="text-xs font-medium text-warn">Top gap category</p><p className="mt-1 font-semibold">Payroll deductions</p><p className="mt-1 text-xs text-muted">32 unresolved questions</p></div><div className="rounded-md bg-danger-soft p-3"><p className="text-xs font-medium text-danger">Downvote hotspot</p><p className="mt-1 font-semibold">Leave exceptions</p><p className="mt-1 text-xs text-muted">18% answer rejection rate</p></div><div className="rounded-md bg-accent-soft p-3"><p className="text-xs font-medium text-accent">Critical routing</p><p className="mt-1 font-semibold">Compensation disputes</p><p className="mt-1 text-xs text-muted">100% direct escalation</p></div></div></section>
      <section className="rounded-lg border border-line bg-surface p-4"><h2 className="mb-2 text-sm font-semibold">Tracked events by name</h2>{counts.length ? <EventCountChart data={counts} /> : <p className="py-8 text-center text-sm text-muted">No events yet. Open a {appConfig.entity.singular} or create one, then come back here.</p>}</section>
    </div>
  );
}

/* ---------- On-screen event log (analytics you can show without dev tools) ---------- */

function EventLog({ events, onClose }: { events: TrackedEvent[]; onClose: () => void }) {
  const label = { sending: "sending", stored: "stored", local: "local only" } as const;
  return (
    <aside className="fixed bottom-4 right-4 z-40 flex max-h-[60vh] w-[min(420px,calc(100vw-2rem))] flex-col rounded-lg border border-line bg-surface shadow-xl" aria-label="Event log">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <h2 className="text-sm font-semibold">Event log</h2>
        <Button variant="ghost" onClick={onClose}>Hide</Button>
      </div>
      <ol className="overflow-y-auto text-sm">
        {events.length === 0 && <li className="px-4 py-6 text-center text-muted">Events appear here as you use the app.</li>}
        {events.map((e) => (
          <li key={e.id} className="border-b border-line px-4 py-2 last:border-0">
            <div className="flex justify-between gap-2">
              <span className="font-medium">{e.event_name}</span>
              <span className={`text-xs ${e.delivery === "stored" ? "text-accent" : "text-muted"}`}>{label[e.delivery]}</span>
            </div>
            <code className="block truncate text-xs text-muted">{JSON.stringify(e.properties)}</code>
          </li>
        ))}
      </ol>
    </aside>
  );
}
