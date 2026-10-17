"use client";

import { useSyncExternalStore } from "react";
const USER_ID = "u_demo"; // replace with a real user id if the prompt needs one

export type Delivery = "sending" | "stored" | "local";

export type TrackedEvent = {
  id: string;
  event_name: string;
  properties: Record<string, unknown>;
  user_id: string;
  created_at: string;
  delivery: Delivery;
};

let events: TrackedEvent[] = [];
const listeners = new Set<() => void>();
const EMPTY: TrackedEvent[] = [];

function emit() {
  for (const l of listeners) l();
}

function update(id: string, delivery: Delivery) {
  events = events.map((e) => (e.id === id ? { ...e, delivery } : e));
  emit();
}

/**
 * Log a product analytics event. Always shows in the on-screen event log and the
 * browser console; also stored in Supabase `events` when the database is connected.
 */
export function track(event_name: string, properties: Record<string, unknown> = {}) {
  const event: TrackedEvent = {
    id: crypto.randomUUID(),
    event_name,
    properties,
    user_id: USER_ID,
    created_at: new Date().toISOString(),
    delivery: "sending",
  };
  events = [event, ...events].slice(0, 200);
  emit();
  console.info("[analytics]", event_name, properties);

  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event_name, properties, user_id: event.user_id }),
  })
    .then((r) => r.json())
    .then((r: { stored?: boolean }) => update(event.id, r.stored ? "stored" : "local"))
    .catch(() => update(event.id, "local"));
}

export function useTrackedEvents() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => events,
    () => EMPTY,
  );
}
