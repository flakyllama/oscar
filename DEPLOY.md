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

**The Vercel Marketplace does not offer Upstash's free plan** — its
listings start at a paid tier. Upstash's own free tier is alive and well
(256 MB, 500K commands/month, 10 GB bandwidth, one database per account),
so create the database directly with Upstash and hand Vercel the
credentials. The API accepts either variable naming, so this needs no
code change.

1. Sign up at [upstash.com](https://upstash.com) and **Create Database →
   Redis**. Pick a region close to your Vercel region, and the **Free**
   plan.
2. On the database page, find the **REST API** section and copy
   `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
3. In Vercel: **Project → Settings → Environment Variables**, add both,
   scoped to *Production, Preview and Development*.

```
UPSTASH_REDIS_REST_URL    = https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN  = AXXXxxxx...
```

> **Alternatives.** If you'd rather have unified billing and don't mind
> paying, the Marketplace's Upstash or Redis Cloud listings work
> identically — those set `KV_REST_API_URL` / `KV_REST_API_TOKEN`, which
> the API also reads. Redis Cloud has a small free tier (~30 MB) if you
> want free *and* Marketplace-managed.

### Will the free tier actually hold?

Comfortably, for personal use. Each sync is one read; each save is one
write. Oscar polls for remote changes every 30s **only while a tab is
visible** — a backgrounded tab costs nothing. Two devices in active use
for a few hours a day land in the low tens of thousands of commands per
month, well inside 500K. Storage is one small encrypted document per
account, against a 256 MB ceiling.

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

- **Cost.** Vercel Hobby and the Upstash free tier comfortably cover a
  personal journal: one small document per account, written only when you
  edit.
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
