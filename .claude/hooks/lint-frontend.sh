#!/usr/bin/env bash
# PostToolUse hook: auto-lint (eslint --fix) frontend files after Edit/Write.
# This repo installs frontend deps only inside the Docker container (see
# docker-compose.yml's frontend_node_modules volume), so run eslint via
# `docker compose exec` in the frontend service rather than expecting a
# host-side node_modules to exist.
set -euo pipefail

input="$(cat)"
file_path="$(echo "$input" | jq -r '.tool_input.file_path // empty')"

[ -z "$file_path" ] && exit 0

case "$file_path" in
  */frontend/src/*.js|*/frontend/src/*.jsx) ;;
  *) exit 0 ;;
esac

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
rel_path="${file_path#*/frontend/}"

cd "$repo_root" || exit 0

# Only attempt if the frontend container is actually up; never block or
# fail the edit if Docker/compose isn't running right now.
if ! docker compose ps --status running frontend 2>/dev/null | grep -q frontend; then
  exit 0
fi

docker compose exec -T frontend npx eslint --fix "$rel_path" 2>&1 | tail -n 40 || true

exit 0
