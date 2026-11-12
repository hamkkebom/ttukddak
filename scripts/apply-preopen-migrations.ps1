param(
  [string]$DbUrl = $env:SUPABASE_DB_URL,
  [switch]$All
)

$ErrorActionPreference = "Stop"

if (-not $DbUrl) {
  throw "SUPABASE_DB_URL is required. Use a Supabase direct or pooler connection string with the database password."
}

$root = Split-Path -Parent $PSScriptRoot
$migrationDir = Join-Path $root "supabase\migrations"

if ($All) {
  $files = Get-ChildItem -Path $migrationDir -Filter "*.sql" | Sort-Object Name
} else {
  $targetNames = @(
    "20260417000000_v9_portone_integration.sql",
    "20260425120000_v12_deal_offers.sql",
    "20260425130000_v13_preopen_db_drift_fixes.sql"
  )
  $files = $targetNames | ForEach-Object {
    $path = Join-Path $migrationDir $_
    if (-not (Test-Path $path)) { throw "Missing migration file: $_" }
    Get-Item $path
  }
}

docker info *> $null
if ($LASTEXITCODE -ne 0) {
  throw "Docker is required because this script runs psql from postgres:16-alpine."
}

foreach ($file in $files) {
  Write-Host "Applying $($file.Name)"
  Get-Content -Raw -LiteralPath $file.FullName |
    docker run --rm -i postgres:16-alpine psql $DbUrl -v ON_ERROR_STOP=1
  if ($LASTEXITCODE -ne 0) {
    throw "Migration failed: $($file.Name)"
  }
}

Write-Host "Preopen migrations applied."
