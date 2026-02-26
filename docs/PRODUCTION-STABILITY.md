# Production Stability: 404 and Cold Start

This document explains **root causes** and **concrete fixes** for:

1. **Browser console:** `register?_rsc=XXXX Failed to load resource: 404`
2. **Slow first visit** after 4–5 hours of inactivity (cold start).

---

## 1. Root causes

### 1.1 Why `register?_rsc=...` returns 404

- **What `?_rsc` is:** Next.js App Router uses React Server Components (RSC). When the client navigates (e.g. via `<Link href="/en/register">`), it requests the RSC payload for that route with a query like `?_rsc=...`. The server must respond with the RSC stream for that path.
- **Why 404:** The route **`/[locale]/register` did not exist**. The app had links to `/${locale}/register` (home, header, CTA) but there was no `(auth)/register/page.tsx`. So:
  - Request: `GET /en/register?_rsc=...`
  - Next.js: no matching page → **404**.
- **Not caused by:** case sensitivity (paths are consistent), rewrites/redirects (none that affect `/register`), or static vs dynamic rendering. The only issue was the **missing route**.

### 1.2 Why the first visit is slow after 4–5 hours

Three layers contribute:

| Layer | Behavior | Impact |
|--------|----------|--------|
| **Vercel (Next.js)** | Serverless functions and edge may be cold; first request runs a new instance. | First request can add ~1–3+ s. |
| **Render (NestJS, free tier)** | Service **spins down after ~15 min** of no traffic. Next request triggers a full **cold start** (boot + DB connect). | Often **30–60+ seconds** for the first request. |
| **Neon (PostgreSQL, free tier)** | DB can suspend after inactivity; first connection after suspend has higher latency. | Adds ~1–5 s on first DB use. |

So the “first visit slow, then fine” pattern is mostly **Render cold start** plus **Neon cold connection**, with some **Vercel serverless cold** on the frontend.

---

## 2. Fixes (step-by-step)

### 2.1 Fix `register?_rsc` 404

**Done in this repo:** A real **register** page was added so the route exists and RSC requests return 200.

- **File:** `apps/web/src/app/[locale]/(auth)/register/page.tsx`
- The page is a client component that:
  - Redirects authenticated users to their dashboard.
  - Shows a “Sign up” message and links to **Login** and **Back to Home** (account creation is admin-managed).
- **Translations:** `auth.registerTitle`, `auth.registerDescription`, `auth.registerBackHome` in `languages/en.json` and `languages/hy.json`.

**Check:**

- Deploy and open the site, click “Sign Up” (or go to `/en/register`). No 404 for `register?_rsc=...` in the console.
- If you later add a real sign-up form, keep this route and replace the content.

---

### 2.2 Next.js: data fetching and caching (Vercel)

Goals: make the **first paint** fast and reduce dependency on a cold backend.

- **Prefer client-side fetching for API-dependent UI**  
  You already use React Query and `getApiBaseUrl()` for the NestJS API. That’s good: the first HTML can be cached or static, and data loads after hydration. No change required for that pattern.

- **Optional: ISR or cache for static/semi-static pages**  
  If you add server-side data fetching (e.g. for the homepage), use revalidate so the first request can be served from cache:

```ts
// Example: app/[locale]/page.tsx (if you fetch something on the server)
export const revalidate = 60; // revalidate at most every 60 seconds

export default async function HomePage() {
  // ...
}
```

- **Optional: `vercel.json`**  
  You can add caching/headers; no need for rewrites for `_rsc` if the route exists.

```json
{
  "framework": "nextjs",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-DNS-Prefetch-Control", "value": "on" }
      ]
    }
  ]
}
```

---

### 2.3 Cold start: final solution (Vercel Cron + backend warmup)

**Implemented in this repo.** No external cron service needed.

1. **Vercel Cron** runs every **10 minutes** and calls the Next.js API route `GET /api/cron/warmup`.
2. That route (server-side) calls your **NestJS backend** `GET /api/warmup`, so Render stays awake and does not spin down.
3. **Frontend** still has `WarmupRequest` in the root layout: when a user opens the site, one extra request warms the backend if it was just woken by cron.

**Files:**

- `apps/web/src/app/api/cron/warmup/route.ts` – verifies `CRON_SECRET`, fetches `BACKEND_URL/warmup`, returns 200.
- `apps/web/vercel.json` – `crons[].path: "/api/cron/warmup"`, `schedule: "*/10 * * * *"` (every 10 min).

**Vercel environment variables (Production):**

| Variable | Required | Description |
|----------|----------|-------------|
| `BACKEND_URL` or `NEXT_PUBLIC_API_URL` | Yes | Backend base URL, e.g. `https://YOUR-SERVICE.onrender.com/api`. Cron uses `BACKEND_URL` first, then `NEXT_PUBLIC_API_URL`. |
| `CRON_SECRET` | Recommended | Random string (e.g. `openssl rand -hex 32`). When set, Vercel sends it as `Authorization: Bearer <CRON_SECRET>`; the route rejects requests without it. |

After deploy, Vercel will invoke `/api/cron/warmup` every 10 minutes automatically. No cron-job.org or UptimeRobot needed.

**Optional: Render health check**

In Render dashboard → Service → Settings → **Health Check Path:** `/api/health/db`. Does not prevent spin-down but helps detect failed deploys.

---

### 2.4 Neon (PostgreSQL): connection string and pooling

Neon’s free tier can suspend the database after inactivity. Use the **pooled** connection string and, if available, **serverless driver** options so that the first connection after suspend is handled efficiently.

- **Neon dashboard:** Use the **pooled** connection string (e.g. branch `ep-...-pooler` or parameter `?pgbouncer=true`), not the direct connection string.
- **Recommended `DATABASE_URL` format** (conceptually):

```env
# Pooled (recommended for serverless / Render)
DATABASE_URL="postgresql://user:pass@ep-xxx-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
```

If Neon documents a **connection timeout** or **max connections** for the free tier, keep `connection_limit` in Prisma within that (e.g. 5–10). Your PrismaService already uses retries and health checks; no code change is strictly required if you switch to the pooled URL.

**Prisma schema (optional):**

In `schema.prisma` you can pass pool settings via the URL:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // optional: for migrations; use non-pooled
}
```

Use pooled URL in `DATABASE_URL` for the app; use direct URL in `DIRECT_URL` only for migrations if Neon requires it.

---

## 3. Final recommended architecture for production stability

| Goal | Recommendation |
|------|----------------|
| **No 404 for `_rsc`** | Keep the **register** route (`(auth)/register/page.tsx`). All links to `/${locale}/register` now resolve. |
| **Fast(er) first load** | 1) **Vercel Cron** (every 10 min) → `/api/cron/warmup` → backend `/api/warmup`. 2) Keep `WarmupRequest` in the root layout. 3) Prefer client-side API calls for dynamic data. |
| **Backend cold start** | **Solved in-repo:** Vercel Cron pings the backend every 10 minutes so Render does not spin down. Set `CRON_SECRET` and `BACKEND_URL` (or `NEXT_PUBLIC_API_URL`) in Vercel. |
| **DB cold start** | Use Neon **pooled** `DATABASE_URL`; keep Prisma retries and health checks. |
| **Vercel** | Rely on default caching; add `revalidate` on any server-fetched pages; optional `vercel.json` headers. |

Summary:

- **404:** Fixed by adding the register page.
- **Cold start:** Solved by Vercel Cron (in-repo) calling backend warmup every 10 minutes, plus `WarmupRequest` and Neon pooling.

---

## 4. Checklist

- [x] Add `apps/web/src/app/[locale]/(auth)/register/page.tsx` so `register?_rsc=...` returns 200.
- [x] Add translations for the register page (en, hy).
- [x] **Vercel Cron** – `apps/web/vercel.json` (cron) + `apps/web/src/app/api/cron/warmup/route.ts` (warmup backend every 10 min).
- [ ] In **Vercel** project: set `CRON_SECRET` (random string) and `BACKEND_URL` or `NEXT_PUBLIC_API_URL` to your Render API URL.
- [ ] Ensure **Neon** `DATABASE_URL` on Render is the **pooled** connection string.
- [ ] (Optional) Set Render **Health Check Path** to `/api/health/db`.

---

## 5. Environment (reference)

**Vercel (Next.js):**

- `NEXT_PUBLIC_API_URL` = `https://YOUR-RENDER-SERVICE.onrender.com/api` (client and frontend warmup).
- `BACKEND_URL` = same URL (optional; used by cron route if set; otherwise cron uses `NEXT_PUBLIC_API_URL`).
- `CRON_SECRET` = random secret (e.g. `openssl rand -hex 32`); secures `/api/cron/warmup` so only Vercel Cron can call it.

**Render (NestJS):**

- `DATABASE_URL` = Neon **pooled** URL (see Neon dashboard).
- `CORS_ORIGIN` = your Vercel origin, e.g. `https://your-app.vercel.app`.
- `NODE_ENV` = `production`.

**Neon:**

- Use the **pooled** connection string for the app. Use direct URL only for migrations if required by Neon.
