# JobTrack

A job-application kanban you can actually finish in a weekend — built as a
production-shaped Next.js 16 app, not a tutorial toy.

Track applications across **Saved → Applied → Interview → Offer → Rejected**
with native HTML5 drag & drop, optimistic UI with rollback, and a typed
REST API.

## Stack

- **Next.js 16** (App Router, `cacheComponents` / PPR-style streaming,
  Turbopack build)
- **TypeScript** throughout — typed route handlers, discriminated `Stage` union
- **React 19** client component with `useTransition` optimistic updates
- **File-backed store** (`data/board.json`) — zero external dependencies,
  trivially swappable for Postgres/SQLite (the store module is the seam)

## Features

- Kanban board, 5 stages, drag & drop **and** a select fallback (mobile-safe)
- Optimistic moves: UI updates instantly, reverts with an error banner if the
  API call fails
- Typed API:
  - `GET  /api/jobs` — list
  - `POST /api/jobs` — create (validates title/company)
  - `PATCH /api/jobs/:id` — stage transition (validates stage enum)
  - `DELETE /api/jobs/:id`
- Server Component page reads the store directly (no client fetch on first paint)
- `connection()` + `instant = false` used correctly under `cacheComponents` —
  the dynamic-data escape hatch Next 16 actually requires
- Dark, dense, phone-friendly CSS (no UI framework)

## Run

```bash
npm install
npm run build && npm start     # or: npm run dev
```

Tests (node built-in runner, TypeScript stripped natively):

```bash
npm test        # 5 store tests: create/move/delete/sort/404
```

## Design notes

- **Store as a seam**: `lib/store.ts` is the only module touching the disk.
  Swapping to a real DB is one file.
- **cacheComponents**: the default Next 16 scaffold enables it; this repo
  documents the correct migration (`instant = false` + `connection()`,
  `turbopackIgnore` for runtime fs paths) — most scaffolds break here.
- **No fake auth**: deliberately small. The point is clean typed boundaries,
  not a login wall.

MIT © Mohd Hafizi Mohammad Nor
