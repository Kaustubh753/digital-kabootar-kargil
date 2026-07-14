# Getting a live URL

The GitHub repo is **source code**, not a running website. To get a link you can
open in a browser, deploy it to a host (or run it locally). Node **22+** is
required — the app uses the built-in `node:sqlite` module.

---

## Fastest: run it locally (works right now, ~2 min)

```bash
git clone https://github.com/Kaustubh753/digital-kabootar-kargil.git
cd digital-kabootar-kargil
npm install
npm run dev
```

Open **http://localhost:3000**. Admin is at **/admin** — the dev password is
`kargil-admin-dev` (override with `ADMIN_PASSWORD` in a `.env.local`). This link
only works on your own machine.

---

## Public URL — Option A: Render (free, all in the browser)

Best if you just want a shareable link fast. (Free tier sleeps after ~15 min
idle and its disk is ephemeral, so **submitted letters reset on restart** —
fine for a demo. Use Option B for durable data.)

1. Push this branch to GitHub (already done) and, if you want the repo private,
   that's fine — Render can access private repos once you connect GitHub.
2. Go to **https://render.com** → sign up / log in → **New +** → **Blueprint**.
3. Connect your GitHub and pick **`digital-kabootar-kargil`**. Render reads
   `render.yaml` automatically.
4. Click **Apply**. First build takes ~3–5 min.
5. You get a URL like **`https://digital-kabootar-kargil.onrender.com`**.
6. To log into `/admin`: open the service in Render → **Environment** tab →
   copy the generated **`ADMIN_PASSWORD`** value.

## Public URL — Option B: Railway (durable data via a volume)

Use this if letters should persist. Railway supports a mounted volume, which the
on-disk SQLite database needs.

1. **https://railway.app** → **New Project** → **Deploy from GitHub repo** →
   pick this repo.
2. In the service: **Variables** → add `SESSION_SECRET` (any long random string)
   and `ADMIN_PASSWORD` (your choice). Railway sets Node from `.node-version`.
3. **Settings → Volumes** → add a volume mounted at `/app/data`, then add
   variable `DATABASE_PATH=/app/data/kabootar.db` so the DB lives on the volume.
4. Deploy → open the generated **`*.up.railway.app`** URL.

## A note on Vercel

Vercel's serverless filesystem is read-only/ephemeral, so the on-disk SQLite
database won't persist writes there. To use Vercel, swap `src/lib/db.ts` for a
hosted database (e.g. Turso/libSQL or Postgres). Happy to do that swap if you
want Vercel specifically — just ask.

---

## After deploying — load real martyr data

The app seeds **placeholder** martyrs on first run. Replace them with the
verified dataset (see README §"Martyr data") by running the seeder against your
verified JSON, or by committing it as `data/martyrs.sample.json` before deploy.
