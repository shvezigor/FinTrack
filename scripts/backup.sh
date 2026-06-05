#!/usr/bin/env sh
set -eu

PROJECT_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_ROOT="$PROJECT_ROOT/backups"
TARGET_DIR="$BACKUP_ROOT/$TIMESTAMP"

mkdir -p "$TARGET_DIR"

echo "Creating PostgreSQL dump..."
docker compose exec -T postgres pg_dump -U resource_manager -d resource_manager > "$TARGET_DIR/resource-manager.sql"

APP_DATA_ROOT="${APP_DATA_ROOT:-$PROJECT_ROOT/.data}"
UPLOADS_DIR="$APP_DATA_ROOT/uploads"

if [ -d "$UPLOADS_DIR" ]; then
  echo "Archiving uploads..."
  tar -czf "$TARGET_DIR/uploads.tar.gz" -C "$UPLOADS_DIR" .
else
  echo "Uploads directory not found, skipping archive."
fi

echo "Backup completed at $TARGET_DIR"
