# Security Implementation Status

**Source of truth:** `Security/Security/` folder (minimal P0 checklist, WAF Cloudflare, Data-DB, Secrets, Observability, Dependency scanning, Upstash Redis).  
**Scope:** Next.js + NestJS API + Neon Postgres + optional Upstash Redis.  
**Last audit:** Based on codebase and security docs review.

---

## 1) Overview

The `@security` folder defines a **minimal P0 security checklist** covering: edge/network (headers, rate limit, HTTPS, WAF, DDoS), auth and sessions (cookies, CSRF, RBAC, logout, MFA, password policy), API security (validation, XSS, no stack traces, CORS, idempotency, webhooks, parameterized queries), Data/DB (pooling, TLS, least privilege, backups), secrets and config (.gitignore, env-only secrets, rotation runbook), observability (logs + request-id, no PII/tokens in logs), optional Redis (TTL, no PII), and dependency scanning in CI.  

This report maps each required control to **DONE** (with evidence in code/config) or **NOT DONE** (missing or unclear), and adds risks and an action plan.

---

## 2) What is implemented (DONE)

| Security item / control | Evidence (file + section/snippet) | Where implemented | Status |
|------------------------|------------------------------------|-------------------|--------|
| **2.4 RBAC server-side** | `RolesGuard` checks `ROLES_KEY`, `user.role`; `JwtAuthGuard` global. `Security/Security/0 Security List.md`: "2.4 RBAC server-side". | `apps/api/src/common/guards/roles.guard.ts`, `app.module.ts` (APP_GUARD) | ✅ DONE |
| **2.7 Logout invalidates session/token** | Refresh token is validated server-side; no server-side session store—logout is client-side token discard. JWT expiry enforced. | Auth flow (JWT); no Clerk/session store | ✅ DONE (JWT model) |
| **3.1 Input validation** | Global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`; DTOs use `class-validator`. | `apps/api/src/main.ts`; DTOs across `apps/api/src/modules/*/dto/` | ✅ DONE |
| **3.3 Strict CORS** | Production: `origin: corsOrigin.split(',').map(...)`, from `CORS_ORIGIN` env. | `apps/api/src/main.ts` (CORS config) | ✅ DONE |
| **3.6 Parameterized queries / no raw SQL with user input** | Prisma used everywhere; no `$queryRaw` with string interpolation of user input. | `apps/api/src` (Prisma only) | ✅ DONE |
| **4.2 DB pooling + connection limits** | Prisma service documents pooled `DATABASE_URL` (Neon with pgbouncer, `connection_limit`, `pool_timeout`). | `apps/api/src/modules/prisma/prisma.service.ts` (comments + Prisma pool) | ✅ DONE |
| **5.3 .env in .gitignore, no secrets in repo** | `.gitignore`: `.env`, `.env.local`, `.env.*.local`. No hardcoded secrets in code; config from `ConfigService`/`process.env`. | `.gitignore`; `apps/api/src` (env-based config) | ✅ DONE |
| **6.1 Logs + request-id** | `CorrelationIdMiddleware` sets `x-request-id`; `LoggingInterceptor` logs `correlationId` with each request. | `apps/api/src/common/middleware/correlation-id.middleware.ts`, `logging.interceptor.ts`, `app.module.ts` | ✅ DONE |
| **6.3 (reasonable) No tokens/PII in logs** | Logging interceptor logs method, path, statusCode, durationMs, correlationId, error.message—no body or auth headers. | `apps/api/src/common/interceptors/logging.interceptor.ts` | ✅ DONE |

**Note:** Security headers (1.5) are only partially present (X-DNS-Prefetch-Control in `vercel.json`); X-Content-Type-Options, X-Frame-Options, CSP are in §3. Items that are **manual (👤)** in the checklist (HTTPS, WAF, DDoS, DB TLS, backups, secrets in env, rotation runbook, alerts, Redis TLS) are not verified in code and are listed in §3 as NOT DONE or Unclear.

---

## 3) What is NOT implemented (MISSING)

| Security item / control | Evidence that it's required | What is missing | Proposed approach | Priority | Status |
|-------------------------|-----------------------------|-----------------|-------------------|----------|--------|
| **1.5 Security headers (full)** | `0 Security List.md`: "X-Content-Type-Options, X-Frame-Options, CSP baseline". WAF doc §9.5: "security headers (helmet/next headers)". | X-Content-Type-Options, X-Frame-Options, CSP not set. Only X-DNS-Prefetch-Control in `vercel.json`. Nest has no `helmet`. | Add security headers in Next: `next.config.js` headers or `vercel.json`. Add `helmet` in Nest `main.ts`. | P1 | ❌ NOT DONE |
| **1.4 Rate limit auth/API/webhooks/forms** | `0 Security List.md`: "Rate limit auth/API/webhooks/forms в коде (если не через Cloudflare)". WAF §3: rate limits per endpoint class. | No `ThrottlerModule` or rate-limit middleware in API; no rate limit in Next API routes. | Add `@nestjs/throttler` (or Upstash rate limit) for auth and critical routes; or rely on Cloudflare and document. | P0 | ❌ NOT DONE |
| **1.1–1.3, 2.1, 2.5–2.6 (manual)** | Checklist: HTTPS + HSTS, WAF managed rules, DDoS (Cloudflare); ADR auth, Admin MFA, password policy. | Not verifiable in repo; depend on Cloudflare/Vercel/Clerk. | Confirm in Cloudflare/Vercel: proxy ON, SSL Full (strict), HSTS, WAF + OWASP CRS, DDoS; document ADR and MFA/password policy. | P0 (infra) | ❌ NOT DONE (manual) |
| **2.2 Secure cookies + session TTL/rotation** | `0 Security List.md`: "Secure cookies + session TTL/rotation (Clerk/Auth.js)". | App uses JWT; refresh token sent in body, not httpOnly cookie. No Clerk/Auth.js. | Either document as "JWT-only, no cookie session" and ensure TTL/rotation in JWT; or move refresh token to httpOnly, secure, SameSite cookie. | P1 | ❌ NOT DONE |
| **2.3 CSRF protection** | `0 Security List.md`: "CSRF protection (Code)". | No CSRF middleware or double-submit cookie / token for state-changing requests. | Add CSRF token for web forms/API used by browser (e.g. SameSite cookies + custom header or token). | P1 | ❌ NOT DONE |
| **3.1a XSS: sanitize user content** | `0 Security List.md`: "XSS: sanitize user content, no unsafe HTML render". | No explicit sanitization layer documented for user-generated content (e.g. chat, feedback). | Sanitize/escape on output; avoid `dangerouslySetInnerHTML` with user input; add DOMPurify or similar if rendering HTML. | P1 | Unclear (needs code review) |
| **3.2 No stack traces in prod** | `0 Security List.md`: "No stack traces in prod". | No global exception filter; Nest default can send `stack` in error response. Some code logs `error.stack` (server-side only). | Add global `ExceptionFilter` that in production returns generic message and does not include `stack` in response. | P0 | ❌ NOT DONE |
| **3.2a No sensitive data in error responses** | `0 Security List.md`: "No sensitive data in error responses". | Not systematically enforced; DB/validation errors might leak details. | Same filter: sanitize error response in prod (message only, no internal details). | P1 | ❌ NOT DONE |
| **3.4 Idempotency for critical POST** | `0 Security List.md`: "Idempotency for critical POST". Quality Checklist: idempotency for payments/creations. | Payments use (studentId, month) internally; no `Idempotency-Key` header support for generic critical POST. | Accept `Idempotency-Key` on payment/critical endpoints; store key → result; return cached result on replay. | P1 | ❌ NOT DONE |
| **3.5 Webhook signature + replay protection** | `0 Security List.md`: "Webhook signature + replay protection". WAF §5.3: verify webhook signature. | No webhook endpoints found in `apps/`; no signature verification. | When adding webhooks (Stripe, etc.): verify signature (e.g. Stripe `constructEvent`), optional replay window. | P1 | ❌ NOT DONE (no webhooks yet) |
| **4.1, 4.3, 4.4 (manual)** | `4 Data-DB (Neon Postgres).md`: DB TLS, least privilege, backups + restore test. | Env and Neon panel; not in code. | Ensure `DATABASE_URL` has `sslmode=require`; separate app vs migration role; enable backups and test restore. | P0 (DB) | ❌ NOT DONE (manual) |
| **5.1, 5.2 (manual)** | `5 Secrets & Config hygiene.md`: secrets only in env, rotation runbook. | Runbook and env separation not in repo. | Add `docs/runbook-secret-rotation.md`; confirm Vercel/env separation. | P1 | ❌ NOT DONE |
| **6.2 Alerts (manual)** | `0 Security List.md`: "Alerts for 5xx/latency/webhooks/db". | No observability tool config in repo. | Configure alerts in Vercel/Cloudflare/Neon or external APM. | P2 | ❌ NOT DONE (manual) |
| **7.x Redis (if used)** | `0 Security List.md` + `7 Upstash Redis`: TTL + namespaces, no PII in Redis, Redis TLS. | Redis not used in API (in-memory cache only). | If Redis is introduced: use TTL and key namespaces; avoid PII; use `rediss://`. | P2 | N/A (Redis not used) |
| **8.1 Dependency scanning in CI** | `0 Security List.md` + `8 Dependency scanning.md`: npm audit / Dependabot. | No `.github/workflows` with `npm audit`; Dependabot not verified. | Add CI step `pnpm audit --audit-level=high` (fail on high/critical); enable Dependabot security updates. | P0 | ❌ NOT DONE |

---

## 4) Risks & Impact

| Missing item | Risk | Affected area | Impact |
|--------------|------|----------------|--------|
| **1.4 Rate limit** | Brute-force on login, DoS on API, billing spike (Vercel/Render). | Auth, API, infra | High |
| **3.2 Stack traces in prod** | Information disclosure; easier exploitation. | API | High |
| **4.1 DB TLS** | DB traffic sniffed or tampered. | Data/DB | High |
| **4.3 Least privilege** | Compromised app can drop tables or access other objects. | Data/DB | High |
| **8.1 Dependency scanning** | Known CVEs in dependencies not caught before deploy. | CI/CD, API, Web | High |
| **1.5 Security headers** | Clickjacking, MIME sniffing, XSS without CSP. | UI, Web | Medium |
| **2.2 Secure cookies / 2.3 CSRF** | Token theft (XSS), CSRF on state-changing actions. | Auth, API | Medium |
| **3.2a Sensitive errors** | Leak of DB schema or internal paths. | API | Medium |
| **5.1/5.2 Secrets** | Rotating secrets ad hoc; mistakes or delay in incident response. | Infra, Config | Medium |

---

## 5) Action Plan

### P0 (blockers and quick wins)

1. **Rate limiting (1.4)**  
   - **Files:** `apps/api/src/app.module.ts`, new throttle config/guard.  
   - **Acceptance:** Auth endpoints (e.g. `POST .../auth/login`, `.../auth/refresh`) and optionally other API routes have rate limits; 429 returned when exceeded.

2. **No stack traces / safe errors in prod (3.2, 3.2a)**  
   - **Files:** `apps/api/src/main.ts`, new global exception filter (e.g. `apps/api/src/common/filters/http-exception.filter.ts`).  
   - **Acceptance:** In production, API error responses do not include `stack` or sensitive details; logs may still contain stack server-side.

3. **Dependency scanning in CI (8.1)**  
   - **Files:** New `.github/workflows/security.yml` (or add to existing CI).  
   - **Acceptance:** CI runs `pnpm audit --audit-level=high` and fails on high/critical; Dependabot security updates enabled (manual check in GitHub).

4. **DB TLS and least privilege (4.1, 4.3 – manual)**  
   - **Action:** Verify `DATABASE_URL` uses `sslmode=require` in prod; create app role with minimal privileges; document in runbook.  
   - **Acceptance:** Connection string uses TLS; app role cannot DROP or access unrelated objects.

5. **Edge/infra (1.1–1.3, 2.1, 2.5–2.6 – manual)**  
   - **Action:** Confirm Cloudflare proxy ON, SSL Full (strict), HSTS, WAF + OWASP CRS, DDoS; document auth scheme and MFA/password policy where applicable.  
   - **Acceptance:** Checklist in docs or runbook confirmed.

### P1

6. **Security headers (1.5)**  
   - **Files:** `apps/web/vercel.json` or `next.config.js`; `apps/api/src/main.ts` (add `helmet`).  
   - **Acceptance:** Responses include X-Content-Type-Options, X-Frame-Options, and a baseline CSP.

7. **Secure cookies / refresh token (2.2)**  
   - **Files:** `apps/api` auth controller/service; web client (cookie handling).  
   - **Acceptance:** Refresh token in httpOnly, secure, SameSite cookie (or documented JWT-only + TTL/rotation).

8. **CSRF (2.3)**  
   - **Files:** Nest middleware or guard; web forms/API client.  
   - **Acceptance:** State-changing requests from browser require valid CSRF token or SameSite + custom header.

9. **Idempotency (3.4)**  
   - **Files:** Payment/critical POST controllers and services.  
   - **Acceptance:** `Idempotency-Key` supported; duplicate key returns cached result without duplicate side effect.

10. **Error response sanitization (3.2a)**  
    - **Files:** Same global exception filter as 3.2.  
    - **Acceptance:** No DB or internal paths in production error payloads.

11. **Secrets runbook (5.2)**  
    - **Files:** `docs/runbook-secret-rotation.md`.  
    - **Acceptance:** Step-by-step rotation for JWT secret, DB, and any third-party keys.

### P2

12. **XSS audit (3.1a)**  
    - **Files:** Chat, feedback, any user-rendered HTML.  
    - **Acceptance:** No unsafe HTML render of user input; sanitization documented or implemented.

13. **Webhook signature (3.5)**  
    - **Files:** New or existing webhook controller.  
    - **Acceptance:** When webhooks exist, signature verification and optional replay protection.

14. **Alerts (6.2)**  
    - **Action:** Configure 5xx/latency/DB alerts in Vercel/Neon/Cloudflare or APM.  
    - **Acceptance:** Alerts created and tested.

---

## Unclear / to confirm

- **Auth scheme (2.1):** Docs mention Clerk; app uses JWT. Confirm whether Clerk is planned for web and how it aligns with Nest JWT.
- **3.1a XSS:** Need a pass over all user-generated content (chat, feedback, rich text) to confirm no `dangerouslySetInnerHTML` or unsanitized output.
- **Redis (7.x):** Currently not used; if Upstash is added, apply 7.1–7.3 from security docs.
