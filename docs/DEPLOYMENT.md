# Deployment and Data Persistence

## Goal

Run the project on a real server with Docker so that:

- containers can be rebuilt safely
- PostgreSQL data is preserved
- uploaded files are preserved
- backups can be created and restored explicitly

## Recommended production layout

Use the base compose file together with the production override:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

The production override stores persistent data on disk:

- `./.data/postgres` - PostgreSQL data directory
- `./.data/uploads` - uploaded avatars and goal images

These directories are intentionally ignored by git.

## Environment

Create `.env` on the server from `.env.example` and set at least:

```env
NODE_ENV=production
APP_BASE_URL=https://your-api-domain
PUBLIC_UPLOAD_BASE_URL=https://your-api-domain
NEXT_PUBLIC_API_PUBLIC_URL=https://your-dashboard-domain-or-api-proxy
DASHBOARD_ADMIN_PASSWORD=strong-password
APP_SECRET_KEY=base64-32-byte-key
TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBHOOK_SECRET=...
OPENAI_API_KEY=...
```

If you use Google Sheets or Monobank, also set their credentials there.

## Data safety model

### What persists automatically

If you use `docker-compose.prod.yml`, the following survive container rebuilds:

- PostgreSQL database
- uploaded files

This works because data lives in `./.data`, not inside ephemeral containers.

### What does not protect you

This does not protect against:

- deleting the `.data` directory
- filesystem failure on the server
- accidental destructive changes in the database

For that you still need backups.

## Backups

### Linux/macOS

Create backup:

```bash
./scripts/backup.sh
```

Restore backup:

```bash
./scripts/restore.sh backups/20260605-120000
```

### Windows

Create backup:

```powershell
./scripts/backup.ps1
```

Backups contain:

- PostgreSQL SQL dump
- uploads archive

## Suggested server routine

1. Keep the project in git.
2. Keep `.env` only on the server.
3. Keep `.data` outside git.
4. Run scheduled backups.
5. Rebuild containers only through compose.
6. Never run destructive Docker cleanup on the production host without a fresh backup.

## Suggested cron for Linux

Daily backup at 02:30:

```cron
30 2 * * * cd /opt/resource-manager && ./scripts/backup.sh
```

## Restore strategy

If you move to a new server:

1. clone the git repository
2. copy `.env`
3. copy `.data` or restore from backup
4. run:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

That is the shortest path to a reproducible deployment with persistent state.

## Notes about Docker commands

Safe update:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Safe stop:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

Do not run `down -v` on the server unless you explicitly want to destroy Docker-managed volumes.
