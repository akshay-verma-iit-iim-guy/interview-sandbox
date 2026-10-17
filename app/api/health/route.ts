import { connection } from "next/server";
import { getSupabase } from "@/lib/supabase";

// GET /api/health
// - Shows whether the sandbox is in mock mode or connected to Supabase.
// - Vercel calls it once a day (vercel.json cron). With CRON_SECRET set, that call also
//   writes a heartbeat row so the free Supabase project never pauses for inactivity.
export async function GET(req: Request) {
  await connection();
  const supabase = getSupabase();
  if (!supabase) return Response.json({ status: "ok", supabase: "not_configured" });

  const secret = process.env.CRON_SECRET;
  const isCron = Boolean(secret) && req.headers.get("authorization") === `Bearer ${secret}`;

  if (isCron) {
    const { error } = await supabase.from("events").insert({ event_name: "keepalive", properties: {}, user_id: "cron" });
    if (error) return Response.json({ status: "error", supabase: "error", message: error.message }, { status: 503 });
  }

  const { count, error } = await supabase.from("events").select("id", { count: "exact", head: true });
  if (error) return Response.json({ status: "error", supabase: "error", message: error.message }, { status: 503 });
  return Response.json({ status: "ok", supabase: "connected", events: count ?? 0, heartbeat: isCron });
}
