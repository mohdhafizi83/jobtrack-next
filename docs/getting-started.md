# Getting Started

## Option A — Docker (one command)

```bash
git clone https://github.com/mohdhafizi83/jobtrack-next.git
cd jobtrack-next
docker compose up -d --build
```

Open <http://localhost:18085> (override with `HOST_PORT=xxxx docker compose up -d`).
The board persists in the `jobtrack-data` named volume across restarts.

Check health:

```bash
docker compose ps            # STATUS should become "healthy"
curl -s localhost:18085/api/jobs   # → {"jobs":[...]}
```

Stop and remove:

```bash
docker compose down          # add -v to also delete the board data
```

## Option B — Local development

Requires Node.js 22+.

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

## Tests

```bash
npm test           # node built-in runner, TypeScript stripped natively
```

## First use

The board starts empty. Add your first application with the form at the top
(title + company are required), then drag cards between columns — or use the
per-card stage dropdown on touch devices. Data is stored in `data/board.json`
(see [configuration.md](configuration.md)).
