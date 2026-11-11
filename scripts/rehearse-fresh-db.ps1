param(
  [switch]$IncludeLegacy,
  [switch]$KeepContainer
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$schemaFile = Join-Path $root "supabase\schema.sql"
$migrationDir = Join-Path $root "supabase\migrations"
$container = "ai-market-fresh-db-$(([guid]::NewGuid().ToString("N")).Substring(0, 12))"

function Invoke-DbSql {
  param([string]$Sql)

  $Sql | docker exec -i $container psql -U postgres -d postgres -v ON_ERROR_STOP=1
  if ($LASTEXITCODE -ne 0) {
    throw "SQL execution failed."
  }
}

function Invoke-DbFile {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Missing SQL file: $Path"
  }

  Write-Host "Applying $(Split-Path -Leaf $Path)"
  Get-Content -Raw -LiteralPath $Path | docker exec -i $container psql -U postgres -d postgres -v ON_ERROR_STOP=1
  if ($LASTEXITCODE -ne 0) {
    throw "Migration failed: $Path"
  }
}

docker info *> $null
if ($LASTEXITCODE -ne 0) {
  throw "Docker is required for the fresh DB rehearsal."
}

try {
  docker run --rm --name $container -e POSTGRES_PASSWORD=postgres -d postgres:16-alpine *> $null
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to start temporary Postgres container."
  }

  Start-Sleep -Seconds 3

  $ready = $false
  for ($i = 0; $i -lt 30; $i++) {
    $probe = docker exec $container psql -U postgres -d postgres -tAc "select 1" 2>$null
    if ($LASTEXITCODE -eq 0 -and $probe -match "1") {
      $ready = $true
      break
    }
    Start-Sleep -Seconds 1
  }

  if (-not $ready) {
    throw "Temporary Postgres did not become ready."
  }

  Invoke-DbSql @"
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS `$`$ SELECT NULL::uuid `$`$;

CREATE OR REPLACE FUNCTION auth.role()
RETURNS text
LANGUAGE sql
STABLE
AS `$`$ SELECT 'authenticated'::text `$`$;

-- Supabase API roles (v14 이후 마이그레이션이 GRANT/REVOKE, TO authenticated 정책에서 참조한다)
DO `$`$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
  END IF;
END
`$`$;

DO `$`$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
`$`$;
"@

  Invoke-DbFile $schemaFile

  if ($IncludeLegacy) {
    $legacyFiles = @(
      "migration_v2.sql",
      "migration_v3_nofts.sql",
      "migration_v3_patch.sql"
    )

    foreach ($legacyFile in $legacyFiles) {
      Invoke-DbFile (Join-Path $root "supabase\$legacyFile")
    }
  }

  Get-ChildItem -Path $migrationDir -Filter "*.sql" |
    Sort-Object Name |
    ForEach-Object { Invoke-DbFile $_.FullName }

  Invoke-DbSql @"
DO `$`$
DECLARE
  missing text[];
BEGIN
  SELECT array_agg(name)
  INTO missing
  FROM (
    VALUES
      ('public.profiles'),
      ('public.experts'),
      ('public.services'),
      ('public.conversations'),
      ('public.messages'),
      ('public.quote_requests'),
      ('public.quote_responses'),
      ('public.deal_offers'),
      ('public.orders'),
      ('public.deliveries'),
      ('public.processed_webhooks')
  ) AS required(name)
  WHERE to_regclass(required.name) IS NULL;

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Missing required tables: %', missing;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversations'
      AND column_name = 'quote_request_id'
  ) THEN
    RAISE EXCEPTION 'Missing conversations.quote_request_id';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'quote_responses'
      AND column_name = 'service_id'
  ) THEN
    RAISE EXCEPTION 'Missing quote_responses.service_id';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'deal_offer_id'
  ) THEN
    RAISE EXCEPTION 'Missing orders.deal_offer_id';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'deal_offers_one_accepted_per_conversation'
  ) THEN
    RAISE EXCEPTION 'Missing accepted deal offer uniqueness index';
  END IF;
END
`$`$;
"@

  Write-Host "FRESH_DB_REHEARSAL_OK"
}
finally {
  if ($KeepContainer) {
    Write-Host "Temporary Postgres kept: $container"
  } else {
    docker rm -f $container *> $null
  }
}
