---
name: docker-env-ops
description: Operational runbook for this project's Docker Compose stack (postgres/redis/meilisearch/minio/backend/frontend) — bringing it up from scratch, resetting the database, reseeding demo data, diagnosing port conflicts, and known gotchas already hit once. Use when the user asks to bring up/rebuild the stack, reset the database, reseed, fix a container that won't start, or debug CORS/publishable-key/admin-dashboard issues in the Dockerized dev environment.
disable-model-invocation: true
---

# Docker environment operations

This is a Medusa v2 backend + Vite/React frontend, run via
`docker-compose.yml` at the repo root: `postgres` (pgvector), `redis`,
`meilisearch`, `minio`, `backend`, `frontend`. Everything below reflects
what actually happened bringing this stack up in Docker for the first
time — read it before improvising, and re-verify against the current
`docker-compose.yml` / `backend/.env` since ports and values can drift.

## Current host port mapping (check `docker-compose.yml` for the live truth)

| Service | Container port | Host port | Why not the default |
|---|---|---|---|
| postgres | 5432 | 5432 | — |
| redis | 6379 | **6380** | 6379 was taken by another project's container on this machine |
| meilisearch | 7700 | **7701** | 7700 was taken |
| minio (API) | 9000 | 9001 | — |
| minio (console) | 9002 | 9002 | — |
| backend | 9000 | **9010** | 9000 was taken |
| frontend | 5173 | 5173 | — |

If `docker compose up` fails with "port is already allocated", another
project on this machine owns that port — run
`docker ps --format '{{.Names}}: {{.Ports}}'` to see what, then remap the
**host** side only (left side of `"host:container"`) in `docker-compose.yml`
for the conflicting service. Never assume the ports above are still free;
re-check every time.

## Bringing the stack up from a clean clone

```bash
docker compose build backend frontend
docker compose up -d
```

Watch for these specific failure modes (all hit once building this stack):

1. **`npm error notsup ... @swc/core-darwin-arm64`** during `backend`
   build — a platform-locked dependency doesn't belong in
   `backend/package.json`'s `dependencies` (it should only ever come in
   transitively via `@swc/core`'s own optional deps). If this reappears,
   check nobody re-added a `@swc/core-<platform>` line to `dependencies`.

2. **`postgres` container `unhealthy`, log shows
   `unrecognized configuration parameter "transaction_timeout"`** — the
   Postgres major version in `docker-compose.yml` (`pgvector/pgvector:pgNN`)
   is older than the Postgres version `backend/scripts/init_schema.sql` was
   dumped from (`transaction_timeout` needs Postgres 17+). Fix: bump the
   image tag to match, not edit the dump.

3. **`postgres` container fails on pg18+ with a `PGDATA`/mount-point
   error** — Postgres 18's Docker image expects the volume mounted at
   `/var/lib/postgresql` (not `.../data`). If you bump the image to pg18+,
   also update the `volumes:` entry for `postgres` in `docker-compose.yml`.

4. Either of the above happening on a **second** attempt (after the volume
   already partially initialized) needs a full reset — see "Resetting the
   database" below; a `docker compose restart` alone will NOT re-run the
   init SQL, only a fresh volume does.

## Resetting the database (drop + reapply schema)

`backend/scripts/init_schema.sql` and `init_vector.sql` (mounted to
`/docker-entrypoint-initdb.d`) only run automatically on a **first-ever**
init of the `postgres_data` volume. To force a clean reset:

```bash
docker compose stop backend
docker exec mongfruitboxz-postgres-1 psql -U postgres -d postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='medusa-v2';"
docker exec mongfruitboxz-postgres-1 psql -U postgres -d postgres -c 'DROP DATABASE "medusa-v2";'
docker exec mongfruitboxz-postgres-1 psql -U postgres -d postgres -c 'CREATE DATABASE "medusa-v2";'
docker exec -i mongfruitboxz-postgres-1 psql -U postgres -d medusa-v2 < backend/scripts/init_schema.sql
docker exec -i mongfruitboxz-postgres-1 psql -U postgres -d medusa-v2 < backend/scripts/init_vector.sql
docker compose up -d backend
```

Confirm the container name prefix first with `docker compose ps` — it's
derived from the compose project name (directory name by default), so
`mongfruitboxz-postgres-1` may differ if the repo was cloned into a
different directory name.

Expect ~160 harmless `ERROR: role "taiphan" does not exist` lines from
`init_schema.sql` (it's a `pg_dump` with `ALTER ... OWNER TO <dumper's local
user>` statements) — these don't stop table creation. A genuinely broken
apply shows `0` in `select count(*) from pg_stat_user_tables;` afterward;
~150 tables is the healthy baseline for this schema.

**This is destructive** — confirm with the user before running the drop
step against anything but a disposable local dev database.

## Seeding demo data

```bash
docker exec <backend-container> npm run seed
```

Gotchas:

- `backend/src/scripts/seed.ts` reads `../frontend/src/data/{categories,products}.json`
  relative to its `cwd` — that resolves to `/frontend/src/data` **inside
  the backend container**, which only exists if `docker-compose.yml`'s
  `backend` service mounts `./frontend/src/data:/frontend/src/data:ro`. If
  that volume entry is missing, seeding silently falls back to empty
  arrays (no error, just "Could not read dynamic data files" + zero
  products/categories) — check for that mount before assuming seed failed
  for another reason.
- The seed script is **not idempotent** for the fulfillment/stock-location
  link — running it twice against a partially-seeded DB throws
  `Cannot create multiple links between 'stock_location' and 'fulfillment'`.
  If you need to reseed, do a full database reset (above) first rather than
  re-running seed on top of existing data.
- Seeding creates a fresh publishable API key each time (`api_key` table).
  After seeding, fetch it and update `frontend/.env`:

  ```bash
  docker exec <postgres-container> psql -U postgres -d medusa-v2 -c \
    "select token from api_key where type='publishable';"
  ```

  Put that value in `frontend/.env` as `VITE_MEDUSA_PUBLISHABLE_KEY=...`,
  then `docker compose restart frontend` (Vite only reads `.env` at server
  start, so a plain file save doesn't pick it up — the container must
  restart, and if you *created* the `.env` file for the first time rather
  than edited an existing one, use `docker compose up -d frontend` instead
  of `restart` so the bind-mounted file is definitely visible).

## Frontend `.env` (create if missing — not committed)

```bash
VITE_MEDUSA_URL=http://localhost:<published-backend-port>   # e.g. 9010, must match docker-compose.yml
VITE_MEDUSA_PUBLISHABLE_KEY=<from api_key table, see above>
VITE_MEILI_HOST=http://localhost:<published-meilisearch-port>
```

## Backend CORS (`backend/.env`)

`STORE_CORS` must include the frontend's **browser-facing** origin
(`http://localhost:5173`), not just `localhost:8000`/docs.medusajs.com —
if the frontend shows `blocked by CORS policy` on `/store/*` calls in the
browser console, this is the first thing to check. `env_file` changes to
`backend/.env` need `docker compose up -d backend` (which recreates the
container) — a `restart` does NOT reload `env_file`/`environment` values,
they're baked in at container creation.

## Known limitation: Admin dashboard (`/app`) dev-mode blank screen

Medusa v2's embedded Admin dashboard, under `medusa develop`, runs its own
internal Vite dev server on a **randomly assigned port** for HMR, and the
browser's WebSocket client tries to connect to that exact port directly.
That port isn't published by Docker and isn't controllable via the
`admin.vite` config hook in `medusa-config.ts` in any way that was found to
actually work (`server.port`, `hmr.clientPort`, and `hmr: false` were all
tried against the running dev server and none changed the internal port or
fixed the reload loop). Symptom: `/app` loads all its JS assets with `200`
but the page stays blank because the Vite HMR client can't connect and
loops on "server connection lost. Polling for restart...".

The Admin **API** itself works fine in Docker (confirmed via `curl
http://localhost:<backend-port>/health` and direct API calls) — only the
dev-mode Admin UI's live-reload shell is affected. If the Admin dashboard
UI is actually needed:

- Workaround: run `backend` with `npm run build && npm run start` instead
  of `npm run dev` (serves the Admin as static built assets through the
  main Express server on the one published port, no separate dev server) —
  this loses backend hot-reload, so only do it when someone specifically
  needs to click around the Admin UI in Docker.
- Otherwise: point them at running `npm run dev` on the host directly
  (outside Docker) for Admin UI work, where the random port is reachable
  since everything's on `localhost` together.

## Quick health check after any change

```bash
docker compose ps                                              # all 6 services, 4 with healthchecks should say healthy
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:<backend-port>/health   # expect 200
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5173/                    # expect 200
```

Then actually load `http://localhost:5173/` and check the browser console
for CORS/publishable-key errors before declaring it working — a `200` on
`/` doesn't mean the storefront's API calls are succeeding.
