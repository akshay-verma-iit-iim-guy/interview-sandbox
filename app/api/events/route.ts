import { connection } from "next/server";
import { getSupabase } from "@/lib/supabase";

// POST /api/events  -> store one analytics event (or acknowledge in mock mode)
export async function POST(req: Request) {
  let body: { event_name?: unknown; properties?: unknown; user_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ stored: false, error: "Body must be JSON" }, { status: 400 });
  }

  const event_name = typeof body.event_name === "string" ? body.event_name.trim() : "";
  if (!event_name || event_name.length > 64) {
    return Response.json({ stored: false, error: "event_name must be 1-64 characters" }, { status: 400 });
  }
  const properties =
    body.properties && typeof body.properties === "object" && !Array.isArray(body.properties) ? body.properties : {};
  const user_id = typeof body.user_id === "string" ? body.user_id.slice(0, 64) : null;

  const supabase = getSupabase();
  if (!supabase) return Response.json({ stored: false, mode: "mock" });

  const { error } = await supabase.from("events").insert({ event_name, properties, user_id });
  if (error) return Response.json({ stored: false, mode: "supabase", error: error.message }, { status: 502 });
  return Response.json({ stored: true, mode: "supabase" });
}

// GET /api/events -> latest 200 stored events
export async function GET() {
  await connection();
  const supabase = getSupabase();
  if (!supabase) return Response.json({ mode: "mock", events: [] });

  const { data, error } = await supabase
    .from("events")
    .select("id, event_name, properties, user_id, created_at")
    .neq("event_name", "keepalive")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return Response.json({ mode: "supabase", error: error.message, events: [] }, { status: 502 });
  return Response.json({ mode: "supabase", events: data });
}
