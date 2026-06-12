# Resource Manager

Docker-first personal finance platform with:

- dashboard for transactions, income, expenses, budgets, goals, analytics, settings, and integrations
- Telegram bot for quick capture of expenses and income
- Monobank sync
- AI categorization and assistant flows
- Google Sheets export

## Project structure

- `apps/dashboard` - Next.js dashboard
- `apps/api` - API server
- `apps/worker` - background jobs
- `packages/server` - shared business logic
- `prisma` - database schema
- `docker` - Dockerfiles

## Quick start

1. Create `.env` from the example:

```powershell
Copy-Item .env.example .env
```

2. Generate a secret key:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

3. Put the generated value into `APP_SECRET_KEY` in `.env`.

4. Fill the required environment variables, at minimum:

```env
DASHBOARD_ADMIN_PASSWORD=change-me
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
OPENAI_API_KEY=
```

5. Start the stack:

```powershell
docker compose up --build
```

Open:

- Dashboard: [http://localhost:3000](http://localhost:3000)
- API health: [http://localhost:3001/health](http://localhost:3001/health)
- Adminer: [http://localhost:8080](http://localhost:8080)

## Telegram examples

Expense examples:

```text
Food 140
Utilities 458
cash Food 140
card Home 2730 epicenter
Gift 200
```

Income examples:

```text
Salary 50000
Project income 12000
```

AI questions:

```text
/ask how much did I spend on food this month?
/ask which categories are the largest?
/ask show expenses by group for this month
```

## Local development

```powershell
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev:api
npm run dev:worker
npm run dev:dashboard
```

## Testing

Fast unit and service tests:

```powershell
npm test
```

Full verification with an isolated test database:

```powershell
npm run test:all
```

`test:all` starts a separate PostgreSQL container from `docker-compose.test.yml` on port `55432`, applies the Prisma schema, runs typecheck, unit tests, build, and Playwright e2e tests. E2E tests create users under `@e2e.fintrack.test`, seed finance data, verify the dashboard through the browser, and clean those test users afterward.

To remove the isolated test database volume:

```powershell
npm run test:db:down
```

Do not point `DATABASE_URL` or `TEST_DATABASE_URL` at the real FinTrack database when running e2e tests.

## Monobank

Use the dashboard or Telegram bot to connect Monobank with a personal API token.

Webhook endpoint:

```text
GET/POST /webhooks/monobank/<MONOBANK_WEBHOOK_SECRET>
```

## Google Sheets

Use a Google service account:

1. Create a service account JSON key.
2. Share the target spreadsheet with the service account `client_email`.
3. Set:
   - `GOOGLE_SERVICE_ACCOUNT_JSON`
   - `GOOGLE_SHEETS_SPREADSHEET_ID`

## Production and persistence

For a real server, use:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

The production override stores persistent data on disk instead of ephemeral container storage:

- `./.data/postgres`
- `./.data/uploads`

Read the full deployment guide here:

- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

## Backups

Linux/macOS:

```bash
./scripts/backup.sh
```

Windows:

```powershell
./scripts/backup.ps1
```

These backups include:

- PostgreSQL SQL dump
- uploaded files archive

## Git

The repository should contain:

- source code
- Docker files
- compose files
- scripts
- docs

The repository should not contain:

- `.env`
- `.data`
- `backups`
- `node_modules`

## Important rule for data safety

Do not delete Docker volumes or the `./.data` directory unless you intentionally want to destroy state.

For normal updates use:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Do not use destructive cleanup on the production server without a backup.
