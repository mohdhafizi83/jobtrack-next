# Contributing

Thanks for your interest in improving JobTrack!

## Development setup

```bash
git clone https://github.com/mohdhafizi83/jobtrack-next.git
cd jobtrack-next
npm install
npm run dev        # http://localhost:3000
```

## Before opening a PR

All of these must pass locally (CI runs the same):

```bash
npm run lint
npx tsc -p tsconfig.json --noEmit
npm test
npm run build
```

## Conventions

- **TypeScript everywhere**; API payloads are validated in
  `lib/validation.ts` — never trust the client.
- The board store lives behind `lib/store.ts`. Keep it the only module that
  touches `board.json`; that seam is what makes a Postgres/SQLite swap cheap.
- Styling uses the shared Fixzy design tokens (see `app/globals.css`
  `:root` variables): primary `#6366f1`, 8px radius, Inter.
- Update `CHANGELOG.md` under **Unreleased** with your change.

## Reporting security issues

Do not open a public issue — see [SECURITY.md](SECURITY.md).
