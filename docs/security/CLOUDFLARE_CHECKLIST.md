# Cloudflare checklist (required for production)

Traffic must go **Internet → Cloudflare (proxy ON) → your origin (Vercel / Render)**. Do these in the Cloudflare dashboard.

## 1. DNS and TLS

- [ ] **DNS:** All public records (`@`, `www`, `api` if used) are **Proxied** (orange cloud ON). Not "DNS only".
- [ ] **SSL/TLS:** **SSL/TLS** → Encryption mode = **Full (strict)**. Origin (Vercel/Render) must have a valid certificate.
- [ ] **HSTS:** **SSL/TLS** → **Edge Certificates** → Enable **HSTS** (e.g. max-age=31536000). Optional: Include subdomains, Preload when ready.

## 2. WAF (Web Application Firewall)

- [ ] **Security** → **WAF** → **Managed rulesets**:
  - [ ] **Cloudflare Managed Ruleset** — ON.
  - [ ] **OWASP Core Ruleset (CRS)** — ON.
- [ ] Initial action: **Managed Challenge** for high risk. After a few days, change noisy rules to **Block** if needed.

## 3. DDoS and rate limiting

- [ ] **DDoS protection** — ON (default on paid plans).
- [ ] **Rate limiting:** **Security** → **WAF** → **Rate limiting rules**. Add rules for:
  - Auth: e.g. `POST /api/auth/login` — 10 req / 1 min / IP.
  - Public forms (contact, lead): e.g. 10 req / 10 min / IP.
  - Webhooks: do **not** rate limit like normal users; allow by signature or provider headers.

## 4. After you’re done

- Confirm the site loads over HTTPS and the padlock is correct.
- Optional: **Zero Trust** → **Access** to protect `/admin` with email or IP allowlist.

---

**Reference:** `Security/Security/WAF Cloudflare.md`, `docs/security/SECURITY_IMPLEMENTATION_STATUS.md`.
