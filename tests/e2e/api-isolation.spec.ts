import { expect, test } from "@playwright/test";

import { cleanupFintrackE2eData, E2E_PASSWORD, makeE2eEmail, seedFinanceFixture } from "./support/test-data";

test.describe("API-backed finance data isolation", () => {
  let firstEmail: string;
  let secondEmail: string;

  test.afterEach(async () => {
    await cleanupFintrackE2eData(firstEmail);
    await cleanupFintrackE2eData(secondEmail);
  });

  test("shows only records that belong to the current session user", async ({ browser }) => {
    firstEmail = makeE2eEmail("owner");
    secondEmail = makeE2eEmail("other");

    const firstContext = await browser.newContext({ baseURL: "http://127.0.0.1:3100" });
    const secondContext = await browser.newContext({ baseURL: "http://127.0.0.1:3100" });

    await firstContext.request.post("/api/proxy/auth/register", {
      data: { email: firstEmail, name: "First E2E User", password: E2E_PASSWORD },
    });
    await secondContext.request.post("/api/proxy/auth/register", {
      data: { email: secondEmail, name: "Second E2E User", password: E2E_PASSWORD },
    });

    await seedFinanceFixture(firstEmail);

    const firstPage = await firstContext.newPage();
    await firstPage.goto("/dashboard#transactions");
    await expect(firstPage.getByText("E2E coffee expense")).toBeVisible();

    const secondPage = await secondContext.newPage();
    await secondPage.goto("/dashboard#transactions");
    await expect(secondPage.getByText("E2E coffee expense")).toHaveCount(0);

    await firstContext.close();
    await secondContext.close();
  });
});
