#!/usr/bin/env bash
set -euo pipefail

workspace_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
backend_path="$workspace_root/barbearia-site/backend"
cache_dir="$workspace_root/.vscode/.cache"
use_python_runtime=false

prepare_python_node_bin() {
  local package_bin_dir shim_dir

  if ! command -v python3 >/dev/null 2>&1; then
    return 1
  fi

  package_bin_dir=$(python3 - <<'PY'
import os
import nodejs_wheel

print(os.path.join(os.path.dirname(nodejs_wheel.__file__), 'bin'))
PY
)

  shim_dir="$cache_dir/node-bin"
  mkdir -p "$shim_dir"
  ln -sf "$package_bin_dir/node" "$shim_dir/node"
  export PATH="$shim_dir:$PATH"
}

run_npm_via_python() {
  local npm_command="$1"
  shift

  if ! command -v python3 >/dev/null 2>&1; then
    return 1
  fi

  python3 - "$backend_path" "$npm_command" "$@" <<'PY'
import os
import sys

backend_path = sys.argv[1]
npm_command = sys.argv[2]
args = sys.argv[3:]

from nodejs_wheel import npm

os.chdir(backend_path)
raise SystemExit(npm([npm_command, *args], close_fds=False))
PY
}

if [[ ! -d "$backend_path" ]]; then
  echo "Pasta do backend nao encontrada: $backend_path" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js nao encontrado no PATH. Usando runtime empacotado via Python..."
  prepare_python_node_bin
  use_python_runtime=true
fi

if ! command -v npm >/dev/null 2>&1; then
  use_python_runtime=true
fi

cd "$backend_path"

if [[ ! -d node_modules ]]; then
  echo "Dependencias nao encontradas. Executando npm install..."
  if [[ "$use_python_runtime" == true ]]; then
    run_npm_via_python install
  else
    npm install
  fi
fi

echo "Iniciando API com npm start..."
if [[ "$use_python_runtime" == true ]]; then
  run_npm_via_python start
else
  npm start
fi