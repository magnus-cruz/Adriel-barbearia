#!/usr/bin/env bash
set -euo pipefail

if command -v xdg-open >/dev/null 2>&1; then
  xdg-open 'http://localhost:5500/index.html'
elif command -v gio >/dev/null 2>&1; then
  gio open 'http://localhost:5500/index.html'
else
  echo 'Abra manualmente: http://localhost:5500/index.html'
fi