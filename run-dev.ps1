param(
    [switch]$Install
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendPath = Join-Path $Root "backend"
$FrontendPath = Join-Path $Root "frontend"
$VenvPath = Join-Path $BackendPath ".venv"
$PythonExe = Join-Path $VenvPath "Scripts\python.exe"
$PipExe = Join-Path $VenvPath "Scripts\pip.exe"
$PythonLauncher = "py -3.13"

function Ensure-Command($Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Comando obrigatorio nao encontrado: $Name"
    }
}

Ensure-Command py
Ensure-Command npm

if ($Install -and -not (Test-Path $PythonExe)) {
    Write-Host "Criando ambiente virtual do backend..."
    & py -3.13 -m venv $VenvPath
}

if ($Install) {
    Write-Host "Instalando dependencias do backend..."
    & $PythonExe -m pip install --upgrade pip
    & $PipExe install -r (Join-Path $BackendPath "requirements.txt")

    Write-Host "Instalando dependencias do frontend..."
    Push-Location $FrontendPath
    npm install
    Pop-Location
}

if (-not (Test-Path $PythonExe)) {
    throw "Ambiente virtual nao encontrado em backend\.venv. Rode .\run-dev.ps1 -Install"
}

if (-not (Test-Path (Join-Path $FrontendPath "node_modules"))) {
    throw "Dependencias do frontend nao encontradas. Rode .\run-dev.ps1 -Install"
}

Write-Host "Subindo backend em http://localhost:8000 ..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$BackendPath'; & '$PythonExe' -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

Write-Host "Subindo frontend em http://localhost:5173 ..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$FrontendPath'; npm run dev -- --host 0.0.0.0 --port 5173"

Write-Host "Ambiente iniciado."
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend:  http://localhost:8000"
Write-Host "Docs:     http://localhost:8000/docs"
