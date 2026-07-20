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

## 3. Add Upstash Redis

1. In the project, open the **Storage** tab.
2. **Create Database → Upstash → Redis** (Marketplace).
3. Pick a region close to you, accept the free plan, and connect it to
   this project.

This sets `KV_REST_API_URL` and `KV_REST_API_TOKEN` on the project
automatically. The API reads either those or the `UPSTASH_REDIS_REST_*`
pair, so no manual configuration is needed.

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
