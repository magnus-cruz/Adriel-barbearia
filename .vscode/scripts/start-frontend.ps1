$ErrorActionPreference = 'Stop'

$workspaceRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$frontendPath = Join-Path $workspaceRoot 'barbearia-site\frontend'

Push-Location $frontendPath
try {
    if (Get-Command python -ErrorAction SilentlyContinue) {
        python -m http.server 5500
    }
    elseif (Get-Command py -ErrorAction SilentlyContinue) {
        py -m http.server 5500
    }
    else {
        throw 'Python nao encontrado para servidor estatico. Use Live Server no frontend.'
    }
}
finally {
    Pop-Location
}
