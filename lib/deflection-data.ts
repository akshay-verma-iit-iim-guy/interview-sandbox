// Self-service deflection data: one source for the Overview and Insights tabs.
// Every inbound question ends in exactly one outcome, so the four counts sum to total.

export type Outcome = "deflected" | "gap" | "downvoted" | "critical";

export const OUTCOMES: { key: Outcome; label: string; detail: string; color: string }[] = [
  { key: "deflected", label: "Correctly deflected", detail: "Answered by approved knowledge, no case raised", color: "var(--o-deflected)" },
  { key: "gap", label: "Knowledge gap", detail: "No confident article, so a case was raised", color: "var(--o-gap)" },
  { key: "downvoted", label: "Tried, downvoted", detail: "Article shown, employee downvoted it and raised a case", color: "var(--o-downvoted)" },
  { key: "critical", label: "Critical, direct escalation", detail: "Sensitive or urgent, sent straight to a specialist", color: "var(--o-critical)" },
];

export type WeekOutcomes = { week: string } & Record<Outcome, number>;

export const weeklyOutcomes: WeekOutcomes[] = [
  { week: "Aug 24", deflected: 162, gap: 46, downvoted: 30, critical: 12 },
  { week: "Aug 31", deflected: 168, gap: 44, downvoted: 31, critical: 11 },
  { week: "Sep 7", deflected: 175, gap: 45, downvoted: 28, critical: 13 },
  { week: "Sep 14", deflected: 181, gap: 41, downvoted: 29, critical: 12 },
  { week: "Sep 21", deflected: 190, gap: 38, downvoted: 27, critical: 14 },
  { week: "Sep 28", deflected: 196, gap: 36, downvoted: 24, critical: 12 },
  { week: "Oct 5", deflected: 204, gap: 33, downvoted: 23, critical: 13 },
  { week: "Oct 12", deflected: 211, gap: 31, downvoted: 21, critical: 12 },
];

// Last 4 weeks by category.
export const categoryOutcomes: ({ category: string } & Record<Outcome, number>)[] = [
  { category: "Payroll", deflected: 118, gap: 46, downvoted: 31, critical: 9 },
  { category: "Leave", deflected: 214, gap: 22, downvoted: 24, critical: 6 },
  { category: "Benefits", deflected: 156, gap: 25, downvoted: 15, critical: 4 },
  { category: "Onboarding", deflected: 97, gap: 18, downvoted: 9, critical: 3 },
  { category: "Access", deflected: 132, gap: 9, downvoted: 6, critical: 2 },
  { category: "Policy", deflected: 84, gap: 18, downvoted: 10, critical: 27 },
];

export const knowledgeGaps = [
  { topic: "Mid-year tax projection changes", category: "Payroll", requests: 21 },
  { topic: "Adoption and surrogacy leave", category: "Leave", requests: 11 },
  { topic: "Relocation bonus tax treatment", category: "Policy", requests: 9 },
  { topic: "Adding parents to dental cover", category: "Benefits", requests: 8 },
  { topic: "Asset delivery for remote joiners", category: "Onboarding", requests: 7 },
];

export const downvotedArticles = [
  { article: "Understanding your payslip", category: "Payroll", views: 236, downvotes: 19 },
  { article: "Leave policy 2026", category: "Leave", views: 412, downvotes: 14 },
  { article: "Health insurance enrolment guide", category: "Benefits", views: 188, downvotes: 9 },
  { article: "Remote work policy", category: "Policy", views: 97, downvotes: 6 },
];

/* ---------- Derived metrics ---------- */

const sum = (rows: WeekOutcomes[], k: Outcome) => rows.reduce((a, r) => a + r[k], 0);

function windowStats(rows: WeekOutcomes[]) {
  const t = { deflected: sum(rows, "deflected"), gap: sum(rows, "gap"), downvoted: sum(rows, "downvoted"), critical: sum(rows, "critical") };
  const total = t.deflected + t.gap + t.downvoted + t.critical;
  const attempted = t.deflected + t.downvoted; // an article was shown
  return {
    ...t,
    total,
    deflectionRate: t.deflected / total,
    gapRate: t.gap / total,
    downvoteRate: t.downvoted / attempted,
    criticalShare: t.critical / total,
  };
}

export const current = windowStats(weeklyOutcomes.slice(-4));
export const previous = windowStats(weeklyOutcomes.slice(-8, -4));

export const pct = (n: number) => `${Math.round(n * 100)}%`;
export const pts = (now: number, before: number) => {
  const d = Math.round((now - before) * 1000) / 10;
  return `${d > 0 ? "+" : ""}${d} pts`;
};

/** Rule-based summary standing in for an LLM call: same inputs, deterministic output. */
export function overviewInsights() {
  const worstGapCategory = [...categoryOutcomes].sort((a, b) => b.gap - a.gap)[0];
  const topGap = knowledgeGaps[0];
  const worstArticle = [...downvotedArticles].sort((a, b) => b.downvotes / b.views - a.downvotes / a.views)[0];
  const policy = categoryOutcomes.find((c) => c.category === "Policy")!;
  const policyCriticalShare = policy.critical / (policy.deflected + policy.gap + policy.downvoted + policy.critical);
  const gapsClosable = knowledgeGaps.slice(0, 3).reduce((a, g) => a + g.requests, 0);

  return [
    `Deflection reached ${pct(current.deflectionRate)} over the last 4 weeks, ${pts(current.deflectionRate, previous.deflectionRate)} on the 4 weeks before, as knowledge gaps fell from ${pct(previous.gapRate)} to ${pct(current.gapRate)} of requests.`,
    `${worstGapCategory.category} has the most gaps (${worstGapCategory.gap} cases). The biggest single gap is "${topGap.topic}" with ${topGap.requests} unanswered requests; articles for the top 3 gaps would cover ${gapsClosable} requests a month.`,
    `"${worstArticle.article}" is the least trusted article: ${pct(worstArticle.downvotes / worstArticle.views)} of views end in a downvote and a case. Review its accuracy before adding new content.`,
    `Critical routing is working: ${current.critical} sensitive requests went straight to specialists. Policy is ${pct(policyCriticalShare)} critical, so keep it out of self-service deflection.`,
  ];
}
