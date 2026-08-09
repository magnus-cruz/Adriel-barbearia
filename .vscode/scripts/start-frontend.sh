#!/usr/bin/env bash
set -euo pipefail

workspace_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
frontend_path="$workspace_root/barbearia-site/frontend"

if [[ ! -d "$frontend_path" ]]; then
  echo "Pasta do frontend nao encontrada: $frontend_path" >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 nao encontrado no PATH. Instale python3 e tente novamente." >&2
  exit 1
fi

cd "$frontend_path"
python3 -m http.server 5500