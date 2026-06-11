import { defineConfig, devices } from "@playwright/test";

const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgresql://resource_manager:resource_manager@127.0.0.1:55432/resource_manager_test?schema=public";

process.env.APP_BASE_URL ??= "http://127.0.0.1:3101";
process.env.DASHBOARD_PUBLIC_URL ??= "http://127.0.0.1:3100";
process.env.DATABASE_URL = testDatabaseUrl;
process.env.DEFAULT_USER_EMAIL ??= "admin@e2e.fintrack.test";
process.env.DEFAULT_USER_NAME ??= "FinTrack Test Admin";
process.env.DASHBOARD_ADMIN_PASSWORD ??= "TestAdmin123!";
process.env.NODE_ENV ??= "test";
process.env.SESSION_COOKIE_NAME ??= "fintrack_e2e_session";
process.env.TELEGRAM_USE_POLLING ??= "false";

export default defineConfig({
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  testDir: "./tests/e2e",
  timeout: 60_000,
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "node node_modules/prisma/build/index.js db push --skip-generate && npm --workspace apps/api run start",
      env: {
        ...process.env,
        APP_BASE_URL: "http://127.0.0.1:3101",
        DASHBOARD_PUBLIC_URL: "http://127.0.0.1:3100",
        DATABASE_URL: testDatabaseUrl,
        PORT: "3101",
        SESSION_COOKIE_NAME: "fintrack_e2e_session",
        TELEGRAM_USE_POLLING: "false",
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: "http://127.0.0.1:3101/health",
    },
    {
      command: "npm --workspace apps/dashboard run dev -- --hostname 127.0.0.1 --port 3100",
      env: {
        ...process.env,
        API_INTERNAL_URL: "http://127.0.0.1:3101",
        NEXT_PUBLIC_API_PUBLIC_URL: "http://127.0.0.1:3101",
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: "http://127.0.0.1:3100",
    },
  ],
});
