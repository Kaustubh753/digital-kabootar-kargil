# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Next.js dev server at http://localhost:3000
npm run build        # production build
npm start            # production server
npm test             # vitest (all tests)
npx vitest run src/lib/moderation.test.ts   # single test file
npx vitest run -t "test name"              # single test by name
npm run seed [file]  # seed martyrs; no arg = placeholder sample data
```

Environment setup: `cp .env.example .env.local` then edit secrets. The app refuses to start in production with default `ADMIN_PASSWORD` / `SESSION_SECRET`.

## Architecture

**Next.js 15 App Router** + **node:sqlite** (Node 22 built-in). Single-process, single SQLite file, no external services on the critical path.

### Server/client boundary

`src/lib/` is the framework-agnostic core. Most modules are **server-only** (`db.ts`, `auth.ts`, `letters.ts`, `martyrs.ts`, `rate-limit.ts`, `config.ts`, `request.ts`) — never import these from client components. Two modules are **isomorphic** and intentionally shared between client and server:

- `moderation.ts` + `moderation-wordlist.ts` — runs client-side as an advisory warning, server-side as the authoritative gate
- `validation.ts` — Zod schemas shared so rules can't drift between form and API
- `types.ts` — erased at compile time, safe everywhere

### Letter submission pipeline (`POST /api/letters`)

The flow is sequential and each step is an independent concern:

1. **Rate limit** (`rate-limit.ts`) — per-IP, in-process fixed-window counter
2. **Honeypot** (`validation.ts`) — hidden `website` field; triggered = silent accept-and-drop
3. **Zod validation** (`validation.ts`) — shared schema, 500-char message cap
4. **Martyr exists** (`martyrs.ts`)
5. **Content check** (`moderation.ts`) → `decideInitialStatus()`: clean + no human-review-mode = `approved`; otherwise `pending`
6. **Persist** (`letters.ts`) — auto-approvals stamped `system:auto`

The server re-runs the content check regardless of client-side results — disabling JS cannot bypass the gate.

### Moderation engine (`moderation.ts`)

Pure function `checkContent()` with evasion resistance: leetspeak substitution, character repetition collapsing, spaced-letter rejoining, structural spam signals (URLs, emails, phones, shouting). War vocabulary (kill, die, blood, sacrifice) is intentionally allowed. The Scunthorpe problem is handled via `match: "word"` vs `match: "substring"` on blocklist entries.

Flagged letters go to `pending`, never auto-rejected. Rejection is always a human decision in `/admin`.

### Database

SQLite via `node:sqlite` (loaded through `createRequire` to avoid bundler issues). `openDb()` creates schema; `getDb()` returns a lazy singleton that auto-seeds on first use. Data-access functions (`letters.ts`, `martyrs.ts`) take a `db: DB` parameter for testability against `:memory:` databases.

Gallery uses keyset (cursor) pagination on `(created_at, id)` — no OFFSET. Admin uses OFFSET pagination.

### Auth

Admin-only, stateless HMAC-signed session cookie (`auth.ts`). No user/writer accounts. Cookie is HttpOnly, SameSite=Lax, Secure in production. 8-hour TTL. `admin-guard.ts` provides the server-component auth check.

### Key env vars

| Var | Effect |
|---|---|
| `REQUIRE_HUMAN_REVIEW` | `true` = hold every letter for human review; `false` (default) = auto-approve clean letters |
| `ADMIN_PASSWORD` | Login for `/admin`; must be changed for production |
| `SESSION_SECRET` | HMAC key for session cookies + IP hashing |

### API routes

- `GET/POST /api/letters` — public gallery list / submit letter
- `GET /api/letters/count` — approved letter count (live counter)
- `GET /api/martyrs`, `GET /api/martyrs/[id]` — martyr directory/detail
- `/api/admin/*` — auth-gated: login, logout, session check, letter queue, single/bulk moderate, stats, CSV export

### Testing

Tests live alongside source in `src/lib/*.test.ts`. They use in-memory SQLite (`:memory:`) databases — no fixtures or mocking of the DB layer. The `node:sqlite` module must be available (Node 22+).

### Martyr data

The shipped dataset (`data/martyrs.sample.json`) contains unmistakable placeholders (`is_placeholder: true`). Real data must be sourced from official government records and loaded via `npm run seed data/martyrs.verified.json`. The UI shows a visible "unverified placeholder" banner on placeholder records.
