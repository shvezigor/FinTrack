import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { Prisma } from "@prisma/client";
import { normalizeAlias } from "@resource-manager/shared";
import { getDb } from "../db.js";
import { applyAliasCategories } from "./ai-categorization.js";
import { upsertMonobankTransaction } from "./monobank.js";
import { updateIncome, updateManualExpense } from "./portfolio.js";

const testRunId = `mono-sync-${Date.now()}`;
const testEmail = `${testRunId}@fintrack.test`;
let testUserId = "";
let manualCategoryId = "";

async function cleanupTestData() {
  const db = getDb();
  if (testUserId) {
    await db.categoryAlias.deleteMany({ where: { category: { userId: testUserId } } });
    await db.category.deleteMany({ where: { userId: testUserId } });
    await db.income.deleteMany({ where: { userId: testUserId } });
    await db.expense.deleteMany({ where: { userId: testUserId } });
    await db.monoTransaction.deleteMany({ where: { userId: testUserId } });
    await db.financialAccount.deleteMany({ where: { userId: testUserId } });
    await db.user.deleteMany({ where: { id: testUserId } });
    return;
  }

  await db.user.deleteMany({ where: { email: testEmail } });
}

before(async () => {
  await cleanupTestData();
  const db = getDb();
  const user = await db.user.create({
    data: {
      email: testEmail,
      name: "Monobank Sync Test",
      preferences: {
        create: {
          currencyCode: 980,
          locale: "uk",
          numberFormat: "SPACE_COMMA",
          timezone: "Europe/Kyiv",
        },
      },
    },
  });
  testUserId = user.id;

  const category = await db.category.create({
    data: {
      color: "#22c55e",
      dashboardGroup: "Їжа",
      icon: "cart",
      name: "Їжа",
      slug: `${testRunId}-food`,
      userId: testUserId,
      aliases: {
        create: [{ alias: "АТБ", normalizedAlias: `атб-${testRunId}` }],
      },
    },
  });
  manualCategoryId = category.id;
});

after(async () => {
  await cleanupTestData();
  await getDb().$disconnect();
});

test("re-sync does not overwrite an existing bank income edited by the user", async () => {
  const item = {
    amount: 12_345_00,
    balance: 50_000_00,
    counterName: "Company",
    currencyCode: 980,
    description: "Payroll",
    hold: false,
    id: `${testRunId}-income-1`,
    time: Math.floor(new Date("2026-05-07T09:00:00+03:00").getTime() / 1000),
  };

  const firstSync = await upsertMonobankTransaction("mono-account-income", item, testUserId, { suppressAlerts: true });
  assert.equal(firstSync?.isNew, true);

  const db = getDb();
  const createdIncome = await db.income.findFirst({
    where: { monoTransactionId: firstSync?.tx.id },
  });
  assert.ok(createdIncome);

  await updateIncome(createdIncome.id, {
    amount: 999,
    description: "Manual override",
    status: "PLANNED",
    userId: testUserId,
  });

  const secondSync = await upsertMonobankTransaction(
    "mono-account-income",
    {
      ...item,
      amount: 88_888_00,
      description: "Bank changed description",
      hold: true,
    },
    testUserId,
    { suppressAlerts: true },
  );

  assert.equal(secondSync?.isNew, false);
  const afterSyncIncome = await db.income.findUnique({
    where: { id: createdIncome.id },
  });
  assert.ok(afterSyncIncome);
  assert.equal(Number(afterSyncIncome.amount), 999);
  assert.equal(afterSyncIncome.description, "Manual override");
  assert.equal(afterSyncIncome.manualOverride, true);
  assert.equal(afterSyncIncome.status, "PLANNED");
});

test("re-sync does not overwrite an existing bank expense edited by the user", async () => {
  const item = {
    amount: -2_345_00,
    balance: 40_000_00,
    counterName: "Store",
    currencyCode: 980,
    description: "Groceries",
    hold: false,
    id: `${testRunId}-expense-1`,
    time: Math.floor(new Date("2026-05-07T10:00:00+03:00").getTime() / 1000),
  };

  const firstSync = await upsertMonobankTransaction("mono-account-expense", item, testUserId, { suppressAlerts: true });
  assert.equal(firstSync?.isNew, true);

  const db = getDb();
  const createdExpense = await db.expense.findFirst({
    where: { monoTransactionId: firstSync?.tx.id },
  });
  assert.ok(createdExpense);

  await updateManualExpense(createdExpense.id, {
    amount: 321,
    categoryId: manualCategoryId,
    description: "Manual expense override",
    userId: testUserId,
  });

  const secondSync = await upsertMonobankTransaction(
    "mono-account-expense",
    {
      ...item,
      amount: -9_999_00,
      description: "Bank changed expense description",
    },
    testUserId,
    { suppressAlerts: true },
  );

  assert.equal(secondSync?.isNew, false);
  const afterSyncExpense = await db.expense.findUnique({
    where: { id: createdExpense.id },
  });
  assert.ok(afterSyncExpense);
  assert.equal(Number(afterSyncExpense.amount), 321);
  assert.equal(afterSyncExpense.description, "Manual expense override");
  assert.equal(afterSyncExpense.manualOverride, true);
});

test("re-sync is insert-only for an existing monobank expense transaction", async () => {
  const item = {
    amount: -1_111_00,
    balance: 33_000_00,
    counterName: "Insert Only Store",
    currencyCode: 980,
    description: "Original bank description",
    hold: false,
    id: `${testRunId}-expense-insert-only`,
    time: Math.floor(new Date("2026-05-08T10:00:00+03:00").getTime() / 1000),
  };

  const firstSync = await upsertMonobankTransaction("mono-account-insert-only", item, testUserId, { suppressAlerts: true });
  assert.equal(firstSync?.isNew, true);

  const secondSync = await upsertMonobankTransaction(
    "mono-account-insert-only",
    {
      ...item,
      amount: -9_999_00,
      description: "Changed by bank on second sync",
    },
    testUserId,
    { suppressAlerts: true },
  );

  assert.equal(secondSync?.isNew, false);

  const db = getDb();
  const txCount = await db.monoTransaction.count({
    where: { monoTransactionId: item.id, userId: testUserId },
  });
  assert.equal(txCount, 1);

  const expense = await db.expense.findFirstOrThrow({
    where: { monoTransactionId: firstSync?.tx.id, userId: testUserId },
  });
  assert.equal(Number(expense.amount), 1111);
  assert.equal(expense.description, "Original bank description");

  const expenseCount = await db.expense.count({
    where: { monoTransactionId: firstSync?.tx.id, userId: testUserId },
  });
  assert.equal(expenseCount, 1);
});

test("re-sync surfaces existing uncategorized monobank expense for categorization", async () => {
  const db = getDb();
  const category = await db.category.create({
    data: {
      color: "#0ea5e9",
      dashboardGroup: "Food",
      icon: "cart",
      name: "Existing Cafe",
      slug: `${testRunId}-existing-cafe`,
      userId: testUserId,
      aliases: {
        create: [{ alias: "Existing Cafe Merchant", normalizedAlias: normalizeAlias("Existing Cafe Merchant") }],
      },
    },
  });
  const item = {
    amount: -555_00,
    balance: 20_000_00,
    counterName: "Existing Cafe Merchant",
    currencyCode: 980,
    description: "Existing Cafe Merchant",
    hold: false,
    id: `${testRunId}-expense-existing-uncategorized`,
    time: Math.floor(new Date("2026-05-09T10:00:00+03:00").getTime() / 1000),
  };

  const firstSync = await upsertMonobankTransaction("mono-account-existing-uncategorized", item, testUserId, { suppressAlerts: true });
  assert.equal(firstSync?.isNew, true);

  const createdExpense = await db.expense.findFirstOrThrow({
    where: { monoTransactionId: firstSync?.tx.id, userId: testUserId },
  });
  assert.equal(createdExpense.categoryId, null);

  const secondSync = await upsertMonobankTransaction("mono-account-existing-uncategorized", item, testUserId, { suppressAlerts: true });
  assert.equal(secondSync?.isNew, false);
  assert.equal(secondSync?.uncategorizedExpenseId, createdExpense.id);
  assert.ok(secondSync?.uncategorizedExpenseId);

  const matchedCount = await applyAliasCategories({
    expenseIds: [secondSync.uncategorizedExpenseId],
    userId: testUserId,
  });

  assert.equal(matchedCount, 1);
  const afterCategorization = await db.expense.findUniqueOrThrow({
    where: { id: createdExpense.id },
  });
  assert.equal(afterCategorization.categoryId, category.id);
  assert.equal(Number(afterCategorization.amount), 555);
  assert.equal(afterCategorization.description, "Existing Cafe Merchant");
});

test("manual override blocks alias-based AI categorization for bank expenses", async () => {
  const item = {
    amount: -777_00,
    balance: 10_000_00,
    counterName: "АТБ",
    currencyCode: 980,
    description: "АТБ",
    hold: false,
    id: `${testRunId}-expense-manual-lock`,
    time: Math.floor(new Date("2026-05-07T11:00:00+03:00").getTime() / 1000),
  };

  const created = await upsertMonobankTransaction("mono-account-manual-lock", item, testUserId, { suppressAlerts: true });
  assert.equal(created?.isNew, true);

  const db = getDb();
  const expense = await db.expense.findFirstOrThrow({
    where: { monoTransactionId: created?.tx.id },
  });

  await updateManualExpense(expense.id, {
    amount: 777,
    description: "Locked by user",
    userId: testUserId,
  });

  const matchedCount = await applyAliasCategories({
    expenseIds: [expense.id],
    userId: testUserId,
  });

  assert.equal(matchedCount, 0);
  const afterAliasAttempt = await db.expense.findUniqueOrThrow({
    where: { id: expense.id },
  });
  assert.equal(afterAliasAttempt.manualOverride, true);
  assert.equal(afterAliasAttempt.categoryId, null);
});
