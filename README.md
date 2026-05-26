# Movie Recommender — Dockerized Full‑Stack App

A personalized movie recommendation engine. Users answer a preference questionnaire and get matched movies from TMDB using a custom scoring algorithm.

The app runs **entirely inside Docker** — you only need Docker Desktop. The database and auth are provided by **Supabase Cloud**.

---

## Stack

| Layer | Tech | Where it runs | Port |
|------|------|---------------|------|
| Frontend | Next.js 14 (App Router) + TypeScript | Docker container | `3000` |
| Backend | Node.js + Express | Docker container | `4000` |
| Cache | Redis 7 | Docker container | `6379` |
| Database + Auth | Supabase (Postgres + Auth + Storage) | Supabase Cloud | — |

---

## Prerequisites

1. **Docker Desktop** installed and running (whale icon in your system tray).
2. A **Supabase project** at https://supabase.com (free tier is fine).
3. A **TMDB API key** (free) — sign up at https://www.themoviedb.org/signup, then go to Settings → API and request a key.

---

## One‑time setup

### Step 1 — Get your Supabase keys

In the Supabase dashboard, open your project and go to **Settings → API**. Copy these three values:

- `Project URL` (e.g. `https://abcde12345.supabase.co`)
- `anon` public key
- `service_role` secret key — **server-only, never expose to the browser**

### Step 2 — Create the database schema

In the Supabase dashboard, open **SQL Editor → New query**, paste the contents of [`db/schema.sql`](./db/schema.sql), and click **Run**. This creates the `preferences` and `recommendations` tables and enables Row Level Security so each user can only access their own rows.

### Step 3 — Configure environment variables

```powershell
copy .env.example .env
```

Open `.env` and fill in:

```
SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
TMDB_API_KEY=...
```

### Step 4 — Build and start

```powershell
docker compose up --build
```

The first build takes a few minutes (pulling Node and Redis images, installing npm packages). Subsequent runs without `--build` start in seconds.

### Step 5 — Open the app

- Frontend: http://localhost:3000
- Backend health: http://localhost:4000/api/health
- Supabase ping (counts rows in `preferences`): http://localhost:4000/api/ping-db
- Redis ping: http://localhost:4000/api/ping-cache

If the frontend shows `"supabaseConfigured": true` and the DB ping returns a count (0 is fine), **everything is wired up**.

---

## How auth works

- The **frontend** uses `@supabase/supabase-js` with the **anon key** to sign users up / in. Supabase issues a JWT access token.
- For protected calls, the frontend sends `Authorization: Bearer <access_token>` to the Express backend.
- The **backend** uses `supabase.auth.getUser(token)` to verify the token, then uses the **service-role key** to read/write data (bypassing RLS where needed).
- Direct frontend → Supabase reads/writes are protected by **Row Level Security** policies in `db/schema.sql` (users can only touch their own rows).

You get registration, login, password reset, email confirmation, OAuth providers, etc. **for free** from Supabase.

---

## Day‑to‑day commands

| Goal | Command |
|------|---------|
| Start (foreground, see logs) | `docker compose up` |
| Start in background | `docker compose up -d` |
| Stop | `docker compose down` |
| Stop and wipe Redis volume | `docker compose down -v` |
| Rebuild after changing `package.json` or a Dockerfile | `docker compose up --build` |
| Tail logs for one service | `docker compose logs -f backend` |
| Shell into the backend container | `docker compose exec backend sh` |

Source files (`./backend` and `./frontend`) are mounted into the containers, so **edits hot-reload** without rebuilding. Only rebuild when `package.json` or the `Dockerfile` itself changes.

---

## Project structure

```
movie-recommender/
├── docker-compose.yml          # Orchestrates redis + backend + frontend
├── .env.example                # Copy to .env and fill in
├── db/
│   └── schema.sql              # Run once in Supabase SQL Editor
├── backend/                    # Express API
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       └── index.js            # Entry, Supabase + Redis clients, /api/me protected route
└── frontend/                   # Next.js app
    ├── Dockerfile
    ├── package.json
    ├── lib/
    │   └── supabaseClient.ts   # Browser Supabase client (uses anon key)
    └── app/
        ├── layout.tsx
        └── page.tsx
```

---

## Features

- Sign-up / sign-in via Supabase Auth (email + password)
- Preference questionnaire (3 steps): genres, year range, rating, runtime
- Personalized recommendations with a weighted scoring algorithm
  (50% genre · 30% rating · 20% popularity, with ±20 point history modifier
  once you start rating saves)
- Save favorites, give ratings (1–5★), write reviews
- History-aware recommendations: the algorithm boosts genres of your 4★+
  saves and avoids already-saved movies
- Browse by genre · paginated search · movie detail pages with cast, trailer,
  and similar movies
- Personalized home rails: "Picks for you", "Because you loved X", "Trending"
- Mobile-friendly responsive layout · accent color theming · keyboard focus
  rings · skeleton loading states · 404 / error pages

---

## Deployment

The app is built to deploy across three free-tier services:

| Service | Used for | Free? |
|---------|----------|-------|
| **Vercel** | Frontend (Next.js) | Yes |
| **Render** | Backend (Express, via Dockerfile.prod) | Yes (with spin-down after 15min idle) |
| **Upstash** | Redis | Yes (10k commands/day) |
| **Supabase** | Postgres + Auth | Yes (already used in dev) |

See [DEPLOYMENT.md](./DEPLOYMENT.md) for a step-by-step deployment walkthrough.

---

## Troubleshooting

**`supabaseConfigured: false` in `/api/health`** — `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is missing from `.env`. Re-check, then `docker compose restart backend`.

**`db: error` with `relation "preferences" does not exist`** — You haven't run `db/schema.sql` in the Supabase SQL Editor yet (Step 2 above).

**Port already in use** — Something else is on 3000/4000/6379. Either stop the conflicting app or change the host-side port in `docker-compose.yml` (e.g. `"3001:3000"`).

**`docker compose` not found** — Try `docker-compose` (older Docker installs use the hyphenated form).

**Changes to `package.json` aren't picked up** — Rebuild: `docker compose up --build`.
