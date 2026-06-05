$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $projectRoot "backups"
$targetDir = Join-Path $backupRoot $timestamp

New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

$dumpFile = Join-Path $targetDir "resource-manager.sql"
$uploadsArchive = Join-Path $targetDir "uploads.zip"

Write-Host "Creating PostgreSQL dump..."
docker compose exec -T postgres pg_dump -U resource_manager -d resource_manager | Out-File -Encoding utf8 $dumpFile

$appDataRoot = $env:APP_DATA_ROOT
if ([string]::IsNullOrWhiteSpace($appDataRoot)) {
  $appDataRoot = Join-Path $projectRoot ".data"
}

$uploadsDir = Join-Path $appDataRoot "uploads"
if (Test-Path $uploadsDir) {
  Write-Host "Archiving uploads..."
  Compress-Archive -Path (Join-Path $uploadsDir "*") -DestinationPath $uploadsArchive -Force
} else {
  Write-Host "Uploads directory not found, skipping archive."
}

Write-Host "Backup completed at $targetDir"
