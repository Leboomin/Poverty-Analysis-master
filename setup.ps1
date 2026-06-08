$ErrorActionPreference = "Stop"

function Get-NodeMajorVersion {
  $versionText = node --version
  return [int]($versionText.TrimStart("v").Split(".")[0])
}

function Install-NodeProject {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  Write-Host ""
  Write-Host "Installing $Name dependencies..." -ForegroundColor Cyan
  Push-Location $Path
  try {
    if (Test-Path "package-lock.json") {
      npm ci
    } else {
      npm install
    }
  } finally {
    Pop-Location
  }
}

Write-Host "Poverty Insights setup" -ForegroundColor Green
Write-Host "Checking local tools..."

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js is not installed. Install Node.js 22 or newer, then run this script again."
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "npm is not installed. Install Node.js 22 or newer, then run this script again."
}

$nodeMajor = Get-NodeMajorVersion
if ($nodeMajor -lt 22) {
  throw "Node.js 22 or newer is required. Current version: $(node --version)"
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $root "backend"
$frontendPath = Join-Path $root "frontend"
$backendEnvPath = Join-Path $backendPath ".env"
$backendEnvExamplePath = Join-Path $backendPath ".env.example"

Install-NodeProject -Path $backendPath -Name "backend"
Install-NodeProject -Path $frontendPath -Name "frontend"

if (-not (Test-Path $backendEnvPath) -and (Test-Path $backendEnvExamplePath)) {
  Copy-Item $backendEnvExamplePath $backendEnvPath
  Write-Host ""
  Write-Host "Created backend\.env from backend\.env.example." -ForegroundColor Yellow
  Write-Host "Edit backend\.env and set GEMINI_API_KEY before using Talk to Data." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Initializing SQLite database..." -ForegroundColor Cyan
Push-Location $backendPath
try {
  npm run db:init
} finally {
  Pop-Location
}

Write-Host ""
Write-Host "Setup complete." -ForegroundColor Green
Write-Host "Run the backend in one terminal:"
Write-Host '  cd "backend"; npm run dev'
Write-Host "Run the frontend in another terminal:"
Write-Host '  cd "frontend"; npm run dev'
Write-Host "Then open http://localhost:3000"
