#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_ROOT"

find_npm() {
  if command -v npm >/dev/null 2>&1; then
    command -v npm
    return
  fi

  local candidate
  for candidate in \
    /opt/cpanel/ea-nodejs22/bin/npm \
    /opt/cpanel/ea-nodejs20/bin/npm \
    "$HOME"/nodevenv/*/*/bin/npm; do
    if [ -x "$candidate" ]; then
      printf '%s\n' "$candidate"
      return
    fi
  done

  return 1
}

NPM_BIN="$(find_npm || true)"
if [ -z "$NPM_BIN" ]; then
  echo "npm tidak ditemukan. Aktifkan Node.js 20.19+ pada cPanel dan pastikan binary tersedia."
  exit 1
fi

if [ ! -f .env ]; then
  echo "File .env belum tersedia di $APP_ROOT."
  echo "Buat .env melalui File Manager atau Terminal sebelum deployment pertama."
  exit 1
fi

"$NPM_BIN" ci
"$NPM_BIN" run db:init
"$NPM_BIN" run build
"$NPM_BIN" prune --omit=dev

mkdir -p tmp
touch tmp/restart.txt

echo "Deployment Dashboard EPI selesai."
