import { expect, test } from "@playwright/test";

import { cleanupFintrackE2eData, E2E_PASSWORD, makeE2eEmail, seedFinanceFixture } from "./support/test-data";

test.describe("authenticated dashboard", () => {
  let email: string;

  test.beforeEach(async ({ page }) => {
    email = makeE2eEmail("dashboard");
    await cleanupFintrackE2eData(email);
    const response = await page.context().request.post("/api/proxy/auth/register", {
      data: {
        email,
        locale: "uk",
        name: "E2E Dashboard User",
        password: E2E_PASSWORD,
        timezone: "Europe/Kyiv",
      },
    });
    expect(response.ok()).toBeTruthy();
    await seedFinanceFixture(email);
  });

  test.afterEach(async () => {
    await cleanupFintrackE2eData(email);
  });

  test("shows seeded transactions, budgets, and goals for the logged-in user", async ({ page }) => {
    await page.goto("/dashboard#transactions");
    await expect(page.getByText("E2E coffee expense")).toBeVisible();
    await expect(page.getByText("E2E salary income")).toBeVisible();

    await page.goto("/dashboard#budgets");
    await expect(page.getByRole("button", { name: /E2E Food/i }).first()).toBeVisible();

    await page.goto("/dashboard#goals");
    await expect(page.locator("strong").filter({ hasText: /E2E Emergency Fund/i }).first()).toBeVisible();
  });
});
