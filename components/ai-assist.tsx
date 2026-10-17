"use client";

import { useEffect, useState } from "react";
import { RefreshCw, UserRound } from "lucide-react";
import { appConfig } from "@/lib/config";
import { suggestionFor, type CaseRecord, type Suggestion } from "@/lib/mock-data";
import { track } from "@/lib/track";
import { Button, useToast } from "./ui";

/**
 * Simulated AI feature with guardrails: confidence, sources, a review threshold,
 * human handoff, and accept / edit / reject logging.
 */
export function AiAssist({ record, onResolve }: { record: CaseRecord; onResolve: (id: string) => void }) {
  const toast = useToast();
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled) return;
      const s = suggestionFor(record.category);
      setSuggestion(s);
      setDraft(s.text);
      setState("ready");
      track("ai_suggestion_shown", { record_id: record.id, confidence: s.confidence, attempt });
    }, 800);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [record.id, record.category, attempt]);

  // Parent remounts this component per record (key), so only regenerate needs a reset.
  const regenerate = () => {
    setState("loading");
    setEditing(false);
    setAttempt((a) => a + 1);
  };

  if (state === "loading") {
    return (
      <div className="rounded-lg border border-line p-4 text-sm text-muted" aria-busy>
        Drafting a {appConfig.aiFeatureName.toLowerCase()}…
      </div>
    );
  }
  if (state === "error" || !suggestion) {
    return (
      <div className="rounded-lg border border-danger p-4 text-sm">
        The suggestion didn&apos;t load. <Button onClick={regenerate}>Try again</Button>
      </div>
    );
  }

  const threshold = appConfig.confidenceThreshold;
  const confident = suggestion.confidence >= threshold;
  const pct = Math.round(suggestion.confidence * 100);

  const act = (action: "accepted" | "edited" | "rejected" | "sent_to_human") => {
    track("ai_suggestion_action", { record_id: record.id, action, confidence: suggestion.confidence });
    if (action === "accepted" || action === "edited") {
      onResolve(record.id);
      toast(action === "edited" ? "Edited reply sent" : "Reply sent");
    } else if (action === "sent_to_human") {
      toast("Sent to a specialist for review");
    } else {
      toast("Suggestion dismissed");
    }
  };

  return (
    <section className="rounded-lg border border-line" aria-label={appConfig.aiFeatureName}>
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <h3 className="text-sm font-semibold">{appConfig.aiFeatureName}</h3>
        <Button variant="ghost" onClick={regenerate} aria-label="Regenerate suggestion">
          <RefreshCw size={14} /> Regenerate
        </Button>
      </div>

      <div className="space-y-4 p-4">
        {/* Confidence meter: the line marks the review threshold. */}
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-muted">Confidence</span>
            <span className={`tabular font-medium ${confident ? "text-accent" : "text-warn"}`}>
              {pct}% {confident ? "" : "· needs review"}
            </span>
          </div>
          <div className="relative h-2.5 rounded-full bg-surface-2" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div
              className={`h-full rounded-full ${confident ? "bg-accent" : "bg-warn"}`}
              style={{ width: `${pct}%` }}
            />
            <div
              className="absolute -top-1 h-4.5 w-0.5 bg-ink"
              style={{ left: `${threshold * 100}%` }}
              title={`Review threshold ${Math.round(threshold * 100)}%`}
            />
          </div>
          <p className="mt-1 text-xs text-muted">
            Below {Math.round(threshold * 100)}%, a person reviews the reply before it goes out.
          </p>
        </div>

        {editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            className="w-full rounded-md border border-line bg-surface-2 p-3 text-sm"
            aria-label="Edit reply"
          />
        ) : (
          <p className="rounded-md bg-surface-2 p-3 text-sm leading-relaxed">{suggestion.text}</p>
        )}

        {suggestion.sources.length > 0 ? (
          <p className="text-xs text-muted">Based on: {suggestion.sources.join(", ")}</p>
        ) : (
          <p className="text-xs text-warn">No source article found.</p>
        )}

        <div className="flex flex-wrap gap-2">
          {editing ? (
            <>
              <Button variant="primary" disabled={!draft.trim()} onClick={() => act("edited")}>
                Send edited reply
              </Button>
              <Button onClick={() => setEditing(false)}>Cancel edit</Button>
            </>
          ) : confident ? (
            <>
              <Button variant="primary" onClick={() => act("accepted")}>Send reply</Button>
              <Button onClick={() => setEditing(true)}>Edit first</Button>
              <Button variant="ghost" onClick={() => act("rejected")}>Dismiss</Button>
            </>
          ) : (
            <>
              <Button variant="warn" onClick={() => act("sent_to_human")}>
                <UserRound size={14} /> Send to specialist
              </Button>
              <Button onClick={() => setEditing(true)}>Edit and send</Button>
              <Button variant="ghost" onClick={() => act("rejected")}>Dismiss</Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
