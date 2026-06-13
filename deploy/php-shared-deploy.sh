#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_ROOT"

if [ ! -f public/index.html ]; then
  echo "public/index.html tidak ditemukan."
  echo "Jalankan npm run build di komputer lokal, commit folder public, lalu push ulang."
  exit 1
fi

if [ ! -f api/config.local.php ]; then
  echo "api/config.local.php belum tersedia."
  echo "Buat file tersebut dari api/config.example.php melalui File Manager cPanel."
  exit 1
fi

chmod 750 api 2>/dev/null || true
chmod 640 api/config.local.php 2>/dev/null || true

echo "Source PHP dan frontend Dashboard EPI siap digunakan."
