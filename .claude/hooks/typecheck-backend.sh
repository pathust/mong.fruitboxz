#!/usr/bin/env bash
# PostToolUse hook: type-check the edited backend file after Edit/Write.
# backend/tsconfig.json has strict + strictNullChecks on, but there's no CI
# to catch type errors, so check here.
#
# This is a SCOPED, single-file check (tsc --noEmit <file> with explicit
# compiler flags matching tsconfig.json), NOT `tsc -p tsconfig.json`. The
# full-project form was tried first and found to need >6GB of V8 heap on
# this codebase (Medusa v2 core + admin SDK + every custom module checked
# together in one pass) — it OOM-killed even with the Docker VM mostly
# idle. The scoped form only walks the edited file's own transitive import
# graph and finishes in a few seconds on ~2GB heap, at the cost of missing
# type errors that only show up when OTHER files change to become
# incompatible with this one (pure single-file blind spot, not a flakiness
# issue).
set -euo pipefail

input="$(cat)"
file_path="$(echo "$input" | jq -r '.tool_input.file_path // empty')"

[ -z "$file_path" ] && exit 0

case "$file_path" in
  */backend/src/*.ts|*/backend/medusa-config.ts) ;;
  *) exit 0 ;;
esac

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
rel_path="${file_path#*/backend/}"

cd "$repo_root" || exit 0

if ! docker compose ps --status running backend 2>/dev/null | grep -q backend; then
  exit 0
fi

output="$(docker compose exec -T backend npx tsc --noEmit --skipLibCheck \
  --strict --esModuleInterop --module Node16 --moduleResolution Node16 \
  --target ES2021 --jsx react-jsx --experimentalDecorators \
  --emitDecoratorMetadata --resolveJsonModule "$rel_path" 2>&1)" || {
  echo "TypeScript errors in $rel_path (scoped check — a cross-file error caused by changes elsewhere may not show here):" >&2
  echo "$output" | tail -n 60 >&2
}

exit 0
