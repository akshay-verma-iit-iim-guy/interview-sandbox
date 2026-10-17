"use client";

import { AlertTriangle, BookOpenCheck, ShieldAlert, Sparkles, ThumbsDown } from "lucide-react";
import {
  OUTCOMES,
  categoryOutcomes,
  current,
  downvotedArticles,
  knowledgeGaps,
  overviewInsights,
  pct,
  previous,
  pts,
  weeklyOutcomes,
} from "@/lib/deflection-data";
import { track } from "@/lib/track";
import { CategoryMixChart, OutcomeWeeklyChart } from "./charts";

export function AiInsightsCard() {
  const insights = overviewInsights();
  return (
    <section className="rounded-lg border border-accent/25 bg-accent-soft p-5" aria-labelledby="ai-insights">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="ai-insights" className="flex items-center gap-2 text-base font-semibold">
          <Sparkles size={18} className="text-accent" aria-hidden /> AI insights
        </h2>
        <span className="text-xs text-muted">Summarised from the last 4 weeks of self-service data</span>
      </div>
      <ul className="grid gap-x-8 gap-y-2.5 text-sm leading-relaxed md:grid-cols-2">
        {insights.map((t) => (
          <li key={t} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

const icons = { deflected: BookOpenCheck, gap: AlertTriangle, downvoted: ThumbsDown, critical: ShieldAlert } as const;

export function DeflectionOverview() {
  // Lower is better for gaps and downvotes, so their improvement shows as a fall.
  const kpis = [
    { key: "deflected" as const, label: "Correctly deflected", value: pct(current.deflectionRate), sub: `${current.deflected} of ${current.total} requests`, delta: pts(current.deflectionRate, previous.deflectionRate), good: current.deflectionRate >= previous.deflectionRate },
    { key: "gap" as const, label: "Knowledge gaps", value: pct(current.gapRate), sub: `${current.gap} cases with no article`, delta: pts(current.gapRate, previous.gapRate), good: current.gapRate <= previous.gapRate },
    { key: "downvoted" as const, label: "Downvoted answers", value: pct(current.downvoteRate), sub: `${current.downvoted} of ${current.deflected + current.downvoted} articles shown`, delta: pts(current.downvoteRate, previous.downvoteRate), good: current.downvoteRate <= previous.downvoteRate },
    { key: "critical" as const, label: "Critical, direct escalation", value: String(current.critical), sub: `${pct(current.criticalShare)} of requests, never deflected`, delta: `${current.critical - previous.critical >= 0 ? "+" : ""}${current.critical - previous.critical} requests`, good: true },
  ];

  return (
    <div className="space-y-6">
      <section aria-labelledby="deflection-kpis">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="deflection-kpis" className="text-base font-semibold">Self-service deflection</h2>
          <span className="text-xs text-muted">Last 4 weeks vs the 4 weeks before · {current.total} requests</span>
        </div>
        <div className="grid grid-cols-2 rounded-lg border border-line md:grid-cols-4 md:divide-x md:divide-line">
          {kpis.map((k) => {
            const Icon = icons[k.key];
            const color = OUTCOMES.find((o) => o.key === k.key)!.color;
            return (
              <div key={k.key} className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Icon size={16} style={{ color }} aria-hidden /> {k.label}
                </div>
                <div className="tabular mt-1 text-2xl font-semibold">{k.value}</div>
                <div className="text-xs text-muted">{k.sub}</div>
                <div className={`tabular mt-1 text-xs font-medium ${k.good ? "text-accent" : "text-danger"}`}>{k.delta}</div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <section className="rounded-lg border border-line p-4" aria-labelledby="weekly-outcomes">
          <h3 id="weekly-outcomes" className="text-sm font-semibold">Where requests ended up, by week</h3>
          <p className="mb-2 text-xs text-muted">Deflection grows while gaps and downvotes shrink.</p>
          <Legend />
          <OutcomeWeeklyChart data={weeklyOutcomes} outcomes={OUTCOMES} />
        </section>
        <section className="rounded-lg border border-line p-4" aria-labelledby="category-mix">
          <h3 id="category-mix" className="text-sm font-semibold">Outcome mix by category</h3>
          <p className="mb-2 text-xs text-muted">Payroll leaks to gaps; Policy is mostly critical by design.</p>
          <Legend />
          <CategoryMixChart data={categoryOutcomes} outcomes={OUTCOMES} />
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ActionTable
          title="Top knowledge gaps"
          caption="Questions with no confident article. Write these first."
          head={["Topic", "Category", "Requests"]}
          rows={knowledgeGaps.map((g) => [g.topic, g.category, String(g.requests)])}
          onRow={(i) => track("knowledge_gap_opened", { topic: knowledgeGaps[i].topic })}
        />
        <ActionTable
          title="Most downvoted articles"
          caption="Shown, then rejected. Fix accuracy before adding content."
          head={["Article", "Category", "Downvote rate"]}
          rows={[...downvotedArticles]
            .sort((a, b) => b.downvotes / b.views - a.downvotes / a.views)
            .map((a) => [a.article, a.category, `${pct(a.downvotes / a.views)} (${a.downvotes})`])}
          onRow={(i) => track("downvoted_article_opened", { rank: i + 1 })}
        />
      </div>
    </div>
  );
}

function Legend() {
  return (
    <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label="Legend">
      {OUTCOMES.map((o) => (
        <li key={o.key} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: o.color }} aria-hidden />
          {o.label}
        </li>
      ))}
    </ul>
  );
}

function ActionTable({ title, caption, head, rows, onRow }: { title: string; caption: string; head: string[]; rows: string[][]; onRow: (i: number) => void }) {
  return (
    <section className="rounded-lg border border-line">
      <div className="border-b border-line px-4 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted">{caption}</p>
      </div>
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-muted">
          <tr>
            {head.map((h, i) => (
              <th key={h} className={`px-4 py-2 font-medium ${i === head.length - 1 ? "text-right" : ""}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r[0]} onClick={() => onRow(i)} className="cursor-pointer border-t border-line hover:bg-surface-2">
              {r.map((c, j) => (
                <td key={j} className={`px-4 py-2 ${j === r.length - 1 ? "tabular text-right" : ""} ${j === 1 ? "text-muted" : ""}`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
