$ErrorActionPreference = 'Stop'

$workspaceRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$backendPath = Join-Path $workspaceRoot 'barbearia-site\backend'

if (-not (Test-Path $backendPath)) {
    throw "Pasta do backend nao encontrada: $backendPath"
}

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue

if (-not $nodeCmd) {
    throw 'Node.js nao encontrado no PATH. Instale Node.js 18+ e tente novamente.'
}

if (-not $npmCmd) {
    throw 'npm nao encontrado no PATH. Reinstale o Node.js e tente novamente.'
}

Push-Location $backendPath
try {
    if (-not (Test-Path (Join-Path $backendPath 'node_modules'))) {
        Write-Host 'Dependencias nao encontradas. Executando npm install...'
        npm install
    }

    Write-Host 'Iniciando API com npm start...'
    npm start
}
finally {
    Pop-Location
}
