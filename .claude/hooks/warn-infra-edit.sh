#!/usr/bin/env bash
# PostToolUse hook: remind about known gotchas after editing docker-compose.yml
# or backend/medusa-config.ts — these two files caused most of the trouble
# bringing this stack up in Docker the first time (port conflicts, Postgres
# version mismatch, admin dev-server HMR). Informational only, never blocks.
set -euo pipefail

input="$(cat)"
file_path="$(echo "$input" | jq -r '.tool_input.file_path // empty')"

[ -z "$file_path" ] && exit 0

case "$file_path" in
  */docker-compose.yml)
    cat >&2 <<'EOF'
[reminder] docker-compose.yml changed. Before restarting containers, double-check:
- Host ports: another project on this machine may already hold a port you just (re)used — `docker ps --format '{{.Names}}: {{.Ports}}'` to check.
- postgres image tag vs backend/scripts/init_schema.sql's dump version (transaction_timeout needs pg17+; pg18+ needs the volume mounted at /var/lib/postgresql, not .../data).
- env_file / environment changes on `backend`/`frontend` need `docker compose up -d <service>` (recreate) — a plain `restart` keeps the old baked-in env.
- Full runbook: .claude/skills/docker-env-ops/SKILL.md
EOF
    ;;
  */backend/medusa-config.ts)
    cat >&2 <<'EOF'
[reminder] backend/medusa-config.ts changed. Note:
- The Admin dashboard's embedded dev-server HMR (random internal port) does not appear controllable via the `admin.vite` config hook in Docker (server.port / hmr.clientPort / hmr:false were all tried and didn't fix the blank /app screen) — don't assume a config tweak here will fix Docker admin-UI issues without re-verifying end to end.
- `useRedis` / CORS / module registration here are read from process.env — a change here often also needs a matching change in backend/.env or docker-compose.yml's backend environment block.
- Full runbook: .claude/skills/docker-env-ops/SKILL.md
EOF
    ;;
  *)
    exit 0
    ;;
esac

exit 0
