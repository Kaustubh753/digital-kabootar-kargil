# Veer Vandan — Citizen Tribute Letters for Kargil War Martyrs

A platform where citizens write short letters of gratitude addressed to
individual soldiers who died in the Kargil War. Each letter is submitted as a
digital postcard and shown in a public gallery **only after it passes
moderation**. Implements the functional scope of the Citizen Tribute Letters
PRD v4.0 (martyr‑focused).

> _Veer Vandan_ (वीर वंदन) = "salute to the brave."

---

## Priorities (from the PRD, in order)

1. **No unmoderated content goes public.** Every letter passes a server‑side
   check; the default state is `pending`.
2. **Someone can actually moderate it.** A working, auth‑gated admin dashboard.
3. **Writing a letter is fast and simple.**
4. **Gallery and profile pages stay accurate and fast at scale.**

## Tech stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 15** (App Router) + React 19 + TypeScript | Server route handlers give an authoritative, un‑bypassable moderation gate; server components for the auth guard. |
| Database | **`node:sqlite`** (built into Node 22) | Zero native compilation, zero external service — the core submission flow has no third‑party dependency (PRD §6). |
| Validation | **zod** | One isomorphic schema shared by client and server. |
| Tests | **vitest** | Fast unit coverage of the moderation pipeline. |

Everything runs from a single process and a single SQLite file. No external
API, embed, or service is on the critical path.

---

## Getting started

```bash
npm install
cp .env.example .env.local     # then edit the secrets
npm run dev                    # http://localhost:3000
```

On first run the DB is created and seeded with the **Kargil Roll of Honour**
(674 martyrs; see [Martyr data](#martyr-data) below).

### Environment

See `.env.example`. Key variables:

| Var | Default | Notes |
|---|---|---|
| `ADMIN_PASSWORD` | `kargil-admin-dev` | Login for `/admin`. **Refuses to start in production with the default.** |
| `SESSION_SECRET` | dev default | HMAC key for admin session cookies + IP hashing. Set a long random value. |
| `DATABASE_PATH` | `./data/kabootar.db` | SQLite file location. |
| `REQUIRE_HUMAN_REVIEW` | `false` | `true` holds **every** letter for human review (see [Open Q #2](#auto-approve-policy-prd-open-question-2)). |
| `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS` | `5` / `60000` | Per‑IP submission limit. |

### Scripts

```bash
npm run dev      # dev server
npm run build    # production build
npm start        # production server
npm test         # run the vitest suite
npm run seed [file.json]   # (re)seed martyrs; no arg = Kargil Roll of Honour
```

---

## How it works

### Submission flow (`POST /api/letters`)

1. **Per‑IP rate limit** (server‑side, cannot be bypassed by the client).
2. **Honeypot** — a hidden `website` field; if filled, the request is silently
   accepted and dropped (bots get no signal). PRD §5.4.
3. **Validation** (zod): required fields, 500‑char message cap, email format.
4. **Martyr must exist.**
5. **Authoritative content check** → decide status:
   - clean **and** `REQUIRE_HUMAN_REVIEW=false` → `approved` (auto, stamped
     `system:auto`) → appears in the gallery immediately.
   - flagged, or human‑review mode → `pending` → held from public view.

Because the server re‑runs the check regardless of the client, disabling
JavaScript cannot bypass the gate. The identical check also runs in the browser
as an **instant advisory warning** while the writer types.

### Moderation engine (`src/lib/moderation.ts`)

Pure, isomorphic, and unit‑tested. It resists common evasion and avoids false
positives:

- **Leetspeak** (`sh1t`, `@ss`, `fu(k`), **character repetition** (`fuuuuck`),
  and **letter spacing** (`f u c k`, `s.h.i.t`) are all normalised and caught.
- **Scunthorpe‑safe**: ambiguous short stems only match as whole tokens, so
  _class_, _therapist_, _assassin_, _retardant_ are **not** flagged.
- **War vocabulary is intentionally allowed** — this is a war‑memorial site, so
  _kill / die / blood / bomb / enemy / sacrifice_ in a heartfelt letter pass
  cleanly. The violence category targets only harassment / self‑harm phrasing.
- Structural signals: links, emails, phone numbers, and shouting → held for
  review.

A flagged letter is **never auto‑rejected** — it goes to `pending` for a human.
Rejection is always a human (or explicit policy) decision.

> The blocklist in `moderation-wordlist.ts` is a small starter list and is the
> extension point. Before launch, replace it with a comprehensive, maintained,
> **localised** list (English + Hindi / Devanagari + romanised) — the matching
> logic doesn't change when the list grows.

### Admin dashboard (`/admin`)

Server‑side auth guard (HMAC‑signed, HttpOnly, `SameSite=Lax`, `Secure` in
production). Features: oldest‑first moderation queue, status/search/date
filters, one‑click and **bulk** approve/reject, per‑status counts + approval
rate, and **CSV export** (formula‑injection‑safe).

### Gallery, directory, profiles

- **Gallery / letters tab**: keyset (cursor) pagination + infinite scroll, so
  performance stays flat at several thousand letters (PRD §6). Only `approved`
  letters are ever returned, and the public shape never includes email/IP.
- **Martyr Directory**: search by name/state/regiment, filter by state.
- **Martyr profile**: About (citation) + Letters tabs.
- **Live counter**, **send animation** (pure CSS carrier pigeon, no external
  embed), and a **bilingual EN/HI toggle** (instant, no reload).

---

## Martyr data

The app ships the **Kargil (Operation Vijay, 1999) Roll of Honour** —
**674 martyrs** in `data/martyrs.json`, parsed from the official Roll of Honour
spreadsheet supplied by the campaign. These are real, sourced records
(`is_placeholder: false`), so no "unverified" banner is shown.

Mapping notes (per PRD §4.2, faithfulness matters):

- **`name`** is recorded verbatim from the Roll (rank prefix + person's name).
  The gallantry‑award suffix (SM, VrC, MVC, VM, SC, PVC, NM) is parsed into
  **`gallantry_award`** (e.g. `Sena Medal`, `Vir Chakra`).
- **`regiment`** is the Unit; the regimental centre / station from the source is
  noted in the **`citation`**.
- **`native_state`, `age_at_martyrdom`, `date_of_martyrdom`** were not present in
  the source and are left `null` rather than guessed.

**To load an updated file** (same JSON shape), run:

```bash
npm run seed data/martyrs.updated.json
```

---

## PRD coverage

| PRD | Status |
|---|---|
| §5.2 Moderation — client advisory + authoritative server check, default pending | ✅ |
| §5.3 Admin dashboard — queue, filters, bulk, counts, CSV | ✅ |
| §5.1 Letter Writer — search→select→info card→write, live counter | ✅ |
| §5.4 Rate limiting + honeypot | ✅ |
| §5.5 Martyr Directory + profiles + letters tab | ✅ |
| §5.6 Gallery — pagination / infinite scroll, expand | ✅ |
| §5.7 Send animation — <2s, no external embed | ✅ |
| §5.8 Live approved‑letter counter | ✅ |
| §5.9 Search (writer / martyr name) | ✅ |
| §5.10 Bilingual EN/HI toggle (mechanism; final copy separate) | ✅ mechanism |
| §6 Accessibility, performance, resilience, moderation test coverage | ✅ |
| §4.2 Martyr dataset | ✅ Kargil Roll of Honour loaded (674 martyrs) |

**Deliberately deferred** (P2 / separate deliverables): visual design polish &
final copy (supplied separately per the PRD scope note), share‑as‑image,
leaderboard, QR‑to‑physical.

### Auto‑approve policy (PRD Open Question #2)

Both interpretations are supported via `REQUIRE_HUMAN_REVIEW`. Default is
auto‑approve on a clean automated check (PRD §3). To run "everything through
human review until the pipeline has a track record," set it to `true` — no code
change.

---

## Testing

```bash
npm test
```

Covers the must‑not‑fail pipeline (PRD §6): content moderation (evasion +
Scunthorpe safety + war‑vocabulary allow‑list), letter status transitions,
keyset pagination, rate limiting, validation, sessions, and CSV.

The API was additionally verified end‑to‑end against a running server
(auto‑approve vs hold, honeypot drop, admin auth + moderation transitions, live
count, stats, CSV, rate‑limit 429).

---

## Security notes

- Admin session cookie is HMAC‑signed, HttpOnly, and `Secure` in production
  (so it is HTTPS‑only — serve the app over TLS).
- Only a **keyed hash** of the submitter IP is stored, never the raw address.
- All SQL uses parameterised queries; `LIKE` inputs are wildcard‑escaped.
- CSV export neutralises spreadsheet formula injection.
- Rate limiting is in‑process (correct for a single instance). A
  horizontally‑scaled deployment should back `src/lib/rate-limit.ts` with a
  shared store (e.g. Redis) — the pure `decide()` function is written so only
  the store changes.
- `npm audit` reports **2 moderate, dev‑only** findings (esbuild dev server /
  postcss stringify) inside the build/test toolchain — they are not on the
  production runtime path. **Do not run `npm audit fix --force`**: its suggested
  "fix" downgrades Next.js to 9.x.

## Project layout

```
src/
  lib/            framework-agnostic core (moderation, db, letters, martyrs,
                  auth, rate-limit, validation, i18n) + *.test.ts
  app/            Next.js App Router: pages + /api route handlers
  components/     React client components
data/             martyrs.json (Kargil Roll of Honour) + runtime SQLite (gitignored)
scripts/seed.ts   CLI seeder
```
