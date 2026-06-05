#!/usr/bin/env sh
set -eu

if [ $# -lt 1 ]; then
  echo "Usage: ./scripts/restore.sh <backup-folder>"
  exit 1
fi

BACKUP_DIR="$1"
SQL_DUMP="$BACKUP_DIR/resource-manager.sql"

if [ ! -f "$SQL_DUMP" ]; then
  echo "SQL dump not found: $SQL_DUMP"
  exit 1
fi

echo "Restoring PostgreSQL dump..."
docker compose exec -T postgres psql -U resource_manager -d resource_manager < "$SQL_DUMP"

APP_DATA_ROOT="${APP_DATA_ROOT:-$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)/.data}"
UPLOADS_DIR="$APP_DATA_ROOT/uploads"
mkdir -p "$UPLOADS_DIR"

if [ -f "$BACKUP_DIR/uploads.tar.gz" ]; then
  echo "Restoring uploads..."
  tar -xzf "$BACKUP_DIR/uploads.tar.gz" -C "$UPLOADS_DIR"
fi

echo "Restore completed."
