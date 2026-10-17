<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project notes

- This is an interview sandbox. Keep changes small and readable; prefer mock data unless asked for persistence.
- Re-theme via `lib/config.ts`, `lib/mock-data.ts` and the tokens in `app/globals.css`.
- Log product events with `track()` from `lib/track.ts`; they show in the on-screen event log.
- Supabase access is server-side only, through `lib/supabase.ts` and the routes in `app/api/`.
