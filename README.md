# Interview sandbox

A working starter for live PM vibe coding rounds. Fork the idea, not the code: start every
round from this app instead of a blank page.

## What's inside

| Piece | Where | What it shows in an interview |
| --- | --- | --- |
| Queue with search, filters, sort, empty state | `components/console.tsx` | Core flow + edge cases |
| Detail drawer and validated "new" form | `components/console.tsx` | States and validation |
| AI suggestion with confidence threshold, sources, human handoff | `components/ai-assist.tsx` | AI guardrails |
| Overview KPIs and weekly chart | `components/console.tsx`, `components/charts.tsx` | Metrics thinking |
| On-screen event log + `track()` | `lib/track.ts` | Analytics firing, no dev tools needed |
| Supabase `events` table (optional) | `supabase/migrations/0001_events.sql` | Real persistence |
| Daily keep-alive cron | `vercel.json`, `app/api/health/route.ts` | Free Supabase project never pauses |
| Codespace with Claude Code | `.devcontainer/devcontainer.json` | IDE backup |

Without Supabase variables it runs in **mock mode**. Everything works; events stay in the browser.

## Re-theme for a prompt in one minute

1. `lib/config.ts`: product name, entity name ("case" → "order", "ticket"...), AI feature name, threshold.
2. `lib/mock-data.ts`: rename fields and records to fit the prompt.
3. `app/globals.css`: the colour tokens at the top.

## Run it

| Where | How |
| --- | --- |
| Codespace | Opens ready: `npm run dev`, then the forwarded port 3000 |
| Claude Code (in the codespace) | `claude`, then describe the change |
| v0 | Import this repo from GitHub, linked to the existing Vercel project |
| Vercel | Every push to `main` deploys |

## Environment variables

Set in Vercel (Project → Settings → Environment Variables) and in `.env.local` for the codespace:

- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (the Vercel-Supabase integration's `NEXT_PUBLIC_*` names also work)
- `CRON_SECRET` (any long random string) so the daily cron writes a heartbeat row

## Health check

`/api/health` returns `{"supabase":"connected"}` or `{"supabase":"not_configured"}`.

## Note

The `events` table lets the publishable key insert and read. Good for a sandbox; say in the
interview that production would add auth and stricter Row Level Security.
