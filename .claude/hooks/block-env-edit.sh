#!/usr/bin/env bash
# PreToolUse hook: block Edit/Write on real .env files (secrets), allow
# .env.template / .env.example (no secrets, safe to edit).
set -euo pipefail

input="$(cat)"
file_path="$(echo "$input" | jq -r '.tool_input.file_path // empty')"

[ -z "$file_path" ] && exit 0

base="$(basename "$file_path")"

case "$base" in
  .env.template|.env.example|.env.sample)
    exit 0
    ;;
  .env|.env.*)
    echo "Blocked: '$file_path' looks like a real .env file (may contain secrets: JWT_SECRET, DB creds, API keys)." >&2
    echo "Ask the user to edit it themselves, or confirm explicitly before editing env files with real credentials." >&2
    exit 2
    ;;
  *)
    exit 0
    ;;
esac
