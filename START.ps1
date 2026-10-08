$ErrorActionPreference='Stop'
Write-Host "HealthMemory 360 - startup" -ForegroundColor Cyan
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Node.js is not installed. Install Node.js 20+ first." }
Write-Host "Node: $(node --version)"

if (-not (Test-Path "backend\.env")) {
  Copy-Item "backend\.env.example" "backend\.env"
  Write-Host "Created backend\.env from .env.example" -ForegroundColor Yellow
}

Write-Host "Checking MongoDB..." -ForegroundColor Yellow
$mongo = Get-Service MongoDB -ErrorAction SilentlyContinue
if ($mongo -and $mongo.Status -ne 'Running') {
  Write-Host "MongoDB service is installed but stopped. Attempting to start it..." -ForegroundColor Yellow
  try { Start-Service MongoDB -ErrorAction Stop; Start-Sleep -Seconds 2 } catch { Write-Warning "MongoDB could not be started automatically. Start MongoDB manually before running the seed command." }
}
if ($mongo) { Write-Host "MongoDB service: $((Get-Service MongoDB).Status)" }

Write-Host "Installing root dependencies..." -ForegroundColor Yellow
npm install
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
npm --prefix backend install
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
npm --prefix frontend install

Write-Host "If this is a fresh setup, run: npm run seed" -ForegroundColor Cyan
Write-Host "Starting HealthMemory 360..." -ForegroundColor Green
npm run dev
