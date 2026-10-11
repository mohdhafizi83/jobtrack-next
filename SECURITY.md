# Security Policy

## Scope & threat model (honest version)

JobTrack is a **single-user, locally-run demo app**. There is **no
authentication or authorization by design**: the board file
(`data/board.json`) is assumed to be readable only by the OS user running the
server, and the app is expected to bind to localhost or sit behind your own
auth layer if exposed. Anyone who can reach the HTTP port can read and mutate
the board — that is the intended trust boundary, not an oversight.

Within that boundary we harden against:

- **XSS / clickjacking / MIME sniffing** via response headers (below)
- **Malformed or oversized API input** causing crashes, memory pressure, or
  corrupt state
- **Store corruption** from interrupted writes
- **Secret leaks in git history** via gitleaks in CI
- **CI supply-chain tampering** via SHA-pinned actions

Out of scope: multi-tenancy, authN/authZ, transport security (run behind
HTTPS-terminating infrastructure if you expose it), and the file store's
concurrency model (last-writer-wins; atomic writes prevent corruption, not
lost updates).

## Response headers

Set in `next.config.ts` (`headers()`) and `proxy.ts` (nonce CSP):

| Header                | Value                                                        | Where        | Why |
| --------------------- | ------------------------------------------------------------ | ------------ | --- |
| Content-Security-Policy (pages) | `default-src 'self'; script-src 'self' 'nonce-…' 'strict-dynamic'; style-src 'self' 'nonce-…'; img-src 'self' blob: data:; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'` | `proxy.ts`, fresh nonce per request | Next.js ships inline bootstrap scripts on every page; `script-src 'self'` alone breaks hydration. Instead of weakening the policy with `'unsafe-inline'`, a per-request nonce lets Next attach it to its own inline scripts (page is dynamically rendered via `connection()` + `instant = false`). `'unsafe-eval'` appears only in development (React dev error stacks), never in production builds. |
| Content-Security-Policy (API) | `default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'` | `next.config.ts` on `/api/*` | JSON responses need no active content at all. |
| X-Content-Type-Options | `nosniff` | all responses | Blocks MIME-type confusion. |
| X-Frame-Options       | `DENY` | all responses | Clickjacking defense (belt-and-braces with `frame-ancestors 'none'`). |
| Referrer-Policy       | `no-referrer` | all responses | No URL leakage to third parties. |
| X-Powered-By          | removed (`poweredByHeader: false`) | — | Fingerprint reduction. |

## API input validation

All route handlers (`app/api/jobs/*`) funnel through `lib/validation.ts`:

| Rule | Limit | Failure |
| ---- | ----- | ------- |
| Body size (checked on `content-length` **and** counted while streaming, so a lying header can't bypass it) | 64 KB | `413 {"error":"request body too large"}` |
| Body must parse as JSON | — | `400` |
| Parsed body must be a JSON object (not array/string/number/null) | — | `400` |
| `title`, `company` required, non-empty strings | ≤ 200 chars | `400` |
| `url`, `salary`, `location` optional strings | ≤ 200 chars | `400` |
| `notes` optional string | ≤ 2000 chars | `400` |
| `remote` optional boolean | type-checked | `400` |
| `stage` (PATCH) must be one of `saved, applied, interview, offer, rejected` | enum | `400` |
| Unexpected server errors | — | generic `500 {"error":"internal server error"}` — details go to server logs only, never to the client |

## Store integrity

`lib/store.ts` writes `data/board.json` atomically: serialize → unique temp
file in the same directory → `rename()` over the target. A crash mid-write
leaves the previous file byte-identical (covered by a test that simulates the
crash); at worst a stray `.tmp` file remains.

## Known advisories (honest status)

- `npm audit --omit=dev` (runtime deps): **0 vulnerabilities**. This is the CI
  hard gate.
- Full-tree audit reports one **dev-only** high: `braces` (GHSA-vfj7-8cjw-p6xm,
  ReDoS/stack-exhaustion in glob patterns) reached via
  `eslint-config-next → fast-glob → micromatch → braces`. As of this writing
  **no patched `braces` release exists**, and npm's suggested "fix" is a
  downgrade to `eslint-config-next@14`. It is dev-time tooling only (never
  shipped, never processes untrusted globs). CI runs the full-tree audit
  informationally (`continue-on-error`) and will be tightened once upstream
  ships a patch.

## CI supply chain

All GitHub Actions are pinned to full commit SHAs (checkout, setup-node,
gitleaks), `npm ci` installs from the committed lockfile, and package.json
pins direct dependencies to exact versions. Gitleaks scans full git history on
every push/PR.

## Reporting

Open a private security advisory on the GitHub repo
(mohdhafizi83/jobtrack-next → Security → Report a vulnerability).
