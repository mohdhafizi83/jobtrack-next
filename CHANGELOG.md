# Changelog

All notable changes to JobTrack are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `Dockerfile` (multi-stage, Next.js standalone output, non-root runner) and
  `docker-compose.yml` with healthcheck and a named volume for the board store.
- `.github/workflows/release.yml`: tag `v*` → GitHub Release with notes from
  this changelog + Docker image pushed to GHCR.
- `docs/getting-started.md` and `docs/configuration.md`; `.env.example`;
  `CONTRIBUTING.md`.
- `output: "standalone"` in `next.config.ts`.

### Changed
- Design tokens aligned to the Fixzy product-standards dark palette
  (primary `#6366f1`, bg `#0f1117`, border `#2a2f3d`), 8px radius standard,
  Inter font (self-hosted at build time via `next/font`).

## [0.1.0]

### Added
- Kanban board with 5 stages (Saved → Applied → Interview → Offer → Rejected),
  native HTML5 drag & drop plus a select fallback for mobile.
- Typed REST API: `GET/POST /api/jobs`, `PATCH/DELETE /api/jobs/:id` with
  request validation.
- File-backed store (`data/board.json`) with atomic writes (temp file + rename).
- Optimistic client updates with rollback and error banner.
- Security hardening: nonce-based CSP, baseline security headers, security
  documentation (`SECURITY.md`).
- CI: lint, typecheck, tests, production build, `npm audit` gate, gitleaks.
