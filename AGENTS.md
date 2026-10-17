## Project notes

- Blank starting point for a timed PM build round. Build the app the prompt asks for from scratch.
- Keep changes small and readable. Use mock data unless persistence is asked for.
- Optional helpers already wired: `track(event_name, properties)` in `lib/track.ts` logs product events
  (console + Supabase `events` table when configured); `lib/supabase.ts` gives a server-side client;
  `/api/events` and `/api/health` exist.
- This is Next.js 16 with Cache Components: read `node_modules/next/dist/docs/` before using unfamiliar APIs.
