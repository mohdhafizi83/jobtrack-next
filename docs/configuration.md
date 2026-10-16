# Configuration

JobTrack runs with zero required configuration. Everything is optional and
read from environment variables.

| Variable | Default | Purpose |
|---|---|---|
| `JOBTRACK_DB` | `<cwd>/data/board.json` | Path to the JSON file backing the board store. The directory is created on first write; writes are atomic (temp file + rename). |
| `PORT` | `3000` | HTTP port the Next.js server listens on (standard Next.js variable). |
| `HOSTNAME` | `0.0.0.0` in Docker | Bind address of the server. |
| `HOST_PORT` | `18085` | Compose-only: host port mapped to the container's 3000. |

Copy `.env.example` to `.env` for local runs, or set variables in your
service manager / compose `environment:` block.

## Docker storage

`docker-compose.yml` mounts a named volume `jobtrack-data` at
`/app/data` and sets `JOBTRACK_DB=/app/data/board.json`. To keep the board
on a host directory instead, replace the volume mount with:

```yaml
volumes:
  - ./board-data:/app/data
```

## Data format

`board.json` is a plain JSON document (`{ "jobs": [...] }`) — safe to edit
by hand, back up with a file copy, or migrate to SQLite/Postgres by swapping
`lib/store.ts` (the store module is the only seam).
