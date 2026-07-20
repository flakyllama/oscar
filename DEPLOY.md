# Deploying Oscar

The app and its sync API deploy together as one Vercel project. The
static site is built by Vite; `api/v1/doc/[accountId].ts` becomes an Edge
Function on the same domain. Storage is Upstash Redis, added through the
Vercel Marketplace so it's provisioned and billed in one place.

Because app and API share an origin there is **no CORS to configure and no
endpoint to enter** — the client defaults to its own origin.

---

## 1. Push the repo to GitHub

CI (`.github/workflows/ci.yml`) needs somewhere to run, and Vercel deploys
on push.

```bash
gh auth status || gh auth login          # if you're not already signed in

gh repo create oscar --private --source=. --remote=origin --push
```

Use `--public` instead of `--private` if you'd rather it be open. Confirm
the workflow starts:

```bash
gh run list --limit 1
```

## 2. Import the project into Vercel

1. Go to **vercel.com → Add New → Project**.
2. Import the `oscar` repository.
3. Vercel detects Vite automatically. Leave the defaults:
   - Build Command `npm run build`
   - Output Directory `dist`
   - Install Command `npm install`
4. Click **Deploy**.

The first deploy will succeed, but **sync won't work yet** — there's no
database. That's the next step.

## 3. Add Redis storage

Note that **the Vercel Marketplace does not list Upstash's free plan** —
its cheapest option is Pay As You Go. That's fine: PAYG has **no minimum
or base fee**, and Oscar's usage costs a few cents a month. Either route
below works; the API reads both variable namings, so neither needs a code
change.

### Option A — Marketplace, Pay As You Go (recommended)

Keeps everything in Vercel and injects the credentials for you.

1. **Storage → Create Database → Upstash → Redis**.
2. Choose **Pay As You Go** ($0.20 per 100K commands; storage free under
   1 GB, bandwidth free under 200 GB).
3. Pick a region near your Vercel region and connect it to the project.

This sets `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.

### Option B — Upstash directly, free tier

A true $0 bill, at the cost of a second account and manual setup.

1. Sign up at [upstash.com](https://upstash.com) → **Create Database →
   Redis** → **Free** (256 MB, 500K commands/month, 10 GB bandwidth; one
   free database per account).
2. On the database page, copy the **REST API** credentials.
3. In Vercel: **Project → Settings → Environment Variables**, add both,
   scoped to *Production, Preview and Development*.

```
UPSTASH_REDIS_REST_URL    = https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN  = AXXXxxxx...
```

### What this actually costs

Each poll is one command; each save is a read plus a write. Oscar polls
every 30s **only while a tab is visible**, so backgrounded tabs cost
nothing.

| Usage | Commands/month | PAYG cost |
| ----- | -------------- | --------- |
| Light — 1h/day, 2 devices | ~7,000 | $0.01 |
| Heavy — 4h/day, 2 devices | ~29,000 | $0.06 |
| Extreme — 12h/day, 3 devices | ~130,000 | $0.26 |

All three sit inside the free tier's 500K too. Storage is one small
encrypted document per account, far below either ceiling.

## 4. Redeploy so the function picks up the variables

Environment variables only reach a deployment built *after* they exist:

```bash
git commit --allow-empty -m "Redeploy with sync storage"
git push
```

Or in the dashboard: **Deployments → ⋯ on the latest → Redeploy**.

## 5. Verify the live API

This is the real check — unit tests mock storage, but the atomic
compare-and-set only runs against actual Redis:

```bash
node scripts/smoke-sync.mjs https://your-app.vercel.app
```

It creates a throwaway account and asserts reads, auth rejection, the
optimistic-concurrency conflict, and cleanup. All checks should pass.

<details>
<summary>If something fails</summary>

- **500 with "Sync storage is not configured"** — the Upstash variables
  aren't on this deployment. Confirm they're in **Settings → Environment
  Variables**, then redeploy (step 4).
- **404 on every request** — the rewrite isn't applying. Try the
  unrewritten path: `https://your-app.vercel.app/api/v1/doc/<id>`. Both
  are supported.
- **Function logs** — `vercel logs <deployment-url>`, or the **Logs** tab.

</details>

## 6. Turn on sync in the app

1. Open your deployed app → **Settings** (`⌥T`).
2. **Set up cloud sync**. There's no endpoint to type.
3. **Copy the sync key** (`oscar1-…`) and store it somewhere safe — a
   password manager is ideal. It is the only way to reach your journal
   from another device, and **it cannot be recovered**: the server only
   ever sees ciphertext.
4. On a second device, open the app → Settings → **I have a sync key** →
   paste. Both devices now converge.

## 7. Optional: a custom domain

**Project → Settings → Domains → Add.** Point your DNS at Vercel as
instructed. Nothing in the app needs changing — the client follows
whatever origin it's served from.

---

## Notes

- **Cost.** Vercel Hobby is free; Redis is either $0 (Upstash free tier)
  or a few cents a month (Pay As You Go). See the table in step 3.
- **Rate limiting.** If you share this publicly, add
  [`@upstash/ratelimit`](https://github.com/upstash/ratelimit) — it can
  reuse the same Redis.
- **Local development.** `npm run dev` serves the app but not the API, so
  cloud sync is inactive locally. To exercise the function locally, run
  `npx vercel dev` with the Upstash variables pulled down via
  `npx vercel env pull`.
- **Splitting the API off.** If you ever host the API elsewhere, set
  `VITE_SYNC_ENDPOINT` at build time and `ALLOWED_ORIGIN` on the API to
  your app's origin.
