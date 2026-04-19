$ErrorActionPreference = 'Stop'

$workspaceRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$backendPath = Join-Path $workspaceRoot 'barbearia-site\backend'

$mvnCmd = (Get-Command mvn -ErrorAction SilentlyContinue).Source
if (-not $mvnCmd) {
    $mvnCmd = Join-Path $env:USERPROFILE 'tools\apache-maven-3.9.9\bin\mvn.cmd'
}

if (-not (Test-Path $mvnCmd)) {
    throw 'Maven nao encontrado. Instale o Maven ou ajuste o caminho no script.'
}

$env:JAVA_HOME = [Environment]::GetEnvironmentVariable('JAVA_HOME', 'User')
if ($env:JAVA_HOME) {
    $env:Path = "$env:Path;$env:JAVA_HOME\bin"
}

Push-Location $backendPath
try {
    & $mvnCmd -DskipTests package
    java -jar target\backend-1.0.0.jar
}
finally {
    Pop-Location
}
