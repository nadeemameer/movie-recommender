# Deployment Guide

Deploying the Movie Recommender to a real URL. Total time: ~30 minutes,
$0/month if you stay on free tiers.

## Architecture in production

```
[ Browser ]
    │
    ▼
[ Vercel ]                       (Next.js frontend)
    │ HTTPS · fetch /api/...
    ▼
[ Render ]                       (Express backend in a Docker container)
    │  │
    │  └─→ [ Upstash Redis ]     (cache layer)
    │
    └─→ [ Supabase ]             (Postgres + Auth)
```

## Prerequisites — accounts (all free)

1. **GitHub** — to host the source code
2. **Vercel** — sign up with your GitHub account at https://vercel.com
3. **Render** — sign up with your GitHub account at https://render.com
4. **Upstash** — sign up at https://upstash.com (GitHub or email)
5. **Supabase** — you already have this from earlier setup

---

## Step 1 — Push to GitHub

From your project root in PowerShell:

```powershell
# Stage everything (.env is excluded by .gitignore)
git add .
git commit -m "Initial commit: full-stack movie recommender"

# Create a new empty repo on https://github.com/new, do NOT initialize it
# with a README. Then copy the URL it gives you and run:
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/movie-recommender.git
git push -u origin main
```

Confirm: open the GitHub repo URL — your code should be visible, and you
should *not* see a `.env` file (only `.env.example`).

---

## Step 2 — Provision Upstash Redis

1. Go to https://console.upstash.com → **Create database**
2. Pick a name (e.g. `movie-recommender-cache`) and the region closest to
   where Render runs (Render's default is Oregon, so pick **us-west-1** or
   **us-east-1**)
3. Enable **TLS** (it's the default)
4. After creation, on the database page, scroll to **Connect to your
   database**, switch to the **Node.js** tab, and copy the connection string —
   it looks like:

```
rediss://default:AbCdE...@us1-perfect-foo-12345.upstash.io:6379
```

(Note the `rediss://` with two s's — that means TLS.)

Save this value, you'll paste it into Render in the next step.

---

## Step 3 — Deploy the backend on Render

1. Go to https://dashboard.render.com → **New +** → **Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Name**: `movie-recommender-backend` (or whatever you like)
   - **Region**: same region as Upstash (us-west or us-east)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: **Docker**
   - **Dockerfile Path**: `Dockerfile` (default — the production Dockerfile)
   - **Plan**: Free
4. Scroll to **Environment** → **Add Environment Variable** and add these
   one by one (paste values from your local `.env`, plus the Upstash URL):

   | Key | Value |
   |-----|-------|
   | `SUPABASE_URL` | (your Supabase project URL) |
   | `SUPABASE_SERVICE_ROLE_KEY` | (your service-role secret) |
   | `SUPABASE_ANON_KEY` | (your anon key — not strictly needed by backend but harmless) |
   | `TMDB_API_KEY` | (your TMDB key) |
   | `REDIS_URL` | (the Upstash `rediss://...` URL) |
   | `FRONTEND_ORIGIN` | leave blank for now — we'll fill after deploying Vercel |
   | `NODE_ENV` | `production` |

5. Click **Create Web Service**. Render starts building the Docker image —
   takes ~3–5 minutes the first time.
6. Once it shows **Live**, copy the URL shown at the top of the page. It will
   look like `https://movie-recommender-backend-abc1.onrender.com`. Save this.
7. Sanity check: open `<your-render-url>/api/health` in a new tab. You should
   see JSON with `"supabaseConfigured": true` and `"tmdbConfigured": true`.

> **Free-tier caveat**: Render's free web services **spin down after 15
> minutes of inactivity** and take ~30 seconds to wake up on the next
> request. Fine for personal projects and demos. Upgrade to the Starter plan
> ($7/month) if you need always-on.

---

## Step 4 — Deploy the frontend on Vercel

1. Go to https://vercel.com/new → **Import Git Repository**
2. Pick your `movie-recommender` repo
3. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: click **Edit** and set to `frontend`
   - Build / Output settings: leave as defaults
4. Expand **Environment Variables** and add:

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | your Render backend URL from Step 3 (e.g. `https://movie-recommender-backend-abc1.onrender.com`) |
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon key |

5. Click **Deploy**. Build takes ~2 minutes.
6. Once it's live, copy your Vercel URL (e.g. `https://movie-recommender-xyz.vercel.app`)

---

## Step 5 — Wire up CORS (back to Render)

The backend currently rejects requests because `FRONTEND_ORIGIN` is empty,
which means it accepts only same-origin. Let's tell it to accept Vercel.

Vercel assigns every deployment **multiple** URLs:

- a canonical production URL: `https://your-app.vercel.app`
- a per-deployment URL that changes on every push:
  `https://your-app-<hash>-<team>-<scope>.vercel.app`
- a per-git-branch URL: `https://your-app-git-<branch>-<team>.vercel.app`

If you only allow the canonical one, anyone visiting via a per-deployment URL
(common when clicking through Vercel's UI) hits a CORS wall. The backend
supports **glob patterns** in `FRONTEND_ORIGIN` to cover all of them.

1. Render dashboard → your backend service → **Environment** tab
2. Edit `FRONTEND_ORIGIN` → set to a comma-separated list combining the
   canonical URL and a wildcard for the others. Example for a Vercel project
   named `movie-recommender-tau-khaki` under team `nadeems-projects`:

   ```
   https://movie-recommender-tau-khaki.vercel.app,https://movie-recommender-*-nadeems-projects-*.vercel.app
   ```

   The first `*` matches the deployment hash (e.g. `egns32oos`), the second
   matches the team scope suffix. Find your exact pattern by visiting your
   Vercel project's **Domains** tab.
3. Click **Save Changes**. Render will redeploy (~30 seconds).

> Tip: if you set up a custom domain later, add it as another literal entry:
> `https://www.yoursite.com,https://your-app.vercel.app,https://your-app-*-team-*.vercel.app`

---

## Step 6 — Update Supabase auth redirect URLs

So that email confirmation links and password-reset emails point to
production:

1. Supabase dashboard → **Authentication → URL Configuration**
2. **Site URL**: set to your Vercel URL
3. **Redirect URLs**: add your Vercel URL with `/*` wildcard, e.g.
   `https://movie-recommender-xyz.vercel.app/**`
4. Save.

---

## Step 7 — Smoke test

Open your Vercel URL and verify:

- [ ] Home page loads, shows the hero and trending rail
- [ ] Sign up with a fresh email — you receive a confirmation email
- [ ] After clicking the email link, you're redirected to your Vercel URL
      and signed in
- [ ] Complete the questionnaire — recommendations show
- [ ] Save a movie (heart turns red and stays red after refresh)
- [ ] Rate that movie 5★ — the recommendations page shows the personalization
      banner ("Tuned to your ratings")
- [ ] Browse by genre, search, view movie details — all work

If any step fails:

- Check **Render Logs** (dashboard → your service → Logs) for backend
  errors
- Check the **Vercel function logs** and browser DevTools Network tab for
  frontend errors
- Verify each env var in both Render and Vercel matches what you intended

---

## Free-tier limits to be aware of

| Service | Free tier limit | What happens after |
|---------|----------------|--------------------|
| Vercel | 100GB bandwidth/month, unlimited builds | Slower / paywall on overage |
| Render | 750 hours/month, sleeps after 15min idle | Service sleeps |
| Upstash | 10k Redis commands/day | Rate limited |
| Supabase | 500MB DB, 50k MAU | Project paused |
| TMDB | ~50 req/sec | Rate limited |

Our backend caches TMDB heavily through Redis, so TMDB rate limits should
never be hit in normal use.

---

## Updates & re-deploys

Both Vercel and Render watch the `main` branch. Every push to GitHub
triggers a redeploy automatically.

```powershell
git add .
git commit -m "Your change"
git push
```

Vercel deploys in seconds. Render takes 2–3 minutes per backend deploy.

---

## Custom domain (optional)

1. Buy a domain (Namecheap, Cloudflare, Porkbun…)
2. Vercel: **Domains** tab → add your domain → follow DNS instructions
3. Render: **Settings → Custom Domain** → add `api.yourdomain.com`
4. Update env vars in both services to reflect new URLs
5. Update Supabase **Site URL** and **Redirect URLs**
