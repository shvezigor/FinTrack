import assert from "node:assert/strict";
import { after, before, describe } from "node:test";
import test from "node:test";
import { Prisma } from "@prisma/client";
import { getDb } from "../db.js";
import {
  analyzeTelegramFinanceMessage,
  buildTelegramReport,
  clearTelegramConversationState,
  getTelegramConversationState,
  quickRange,
  receiptAiResultToDraft,
  renderTelegramDraft,
  saveTelegramOperationDraft,
  setTelegramConversationState,
  updateDraftAmount,
  updateDraftCategory,
  updateDraftDate,
  type TelegramOperationDraft,
} from "./telegram-finance-assistant.js";
import { matchExpenses } from "./matching-worker.js";

const now = new Date("2026-04-30T12:00:00+03:00");
const testRunId = `bot-${Date.now()}`;
const testEmail = `${testRunId}@fintrack.test`;
let testUserId = "";
let foodCategoryId = "";
let utilityCategoryId = "";
let aiCategoryId = "";
let accountId = "";

async function cleanupTestData() {
  const db = getDb();
  if (testUserId) {
    const telegramEntryIds = (await db.telegramEntry.findMany({
      select: { id: true },
      where: { userId: testUserId },
    })).map((entry) => entry.id);
    const monoTransactionIds = (await db.monoTransaction.findMany({
      select: { id: true },
      where: { userId: testUserId },
    })).map((tx) => tx.id);
    if (telegramEntryIds.length || monoTransactionIds.length) {
      await db.matchingCandidate.deleteMany({
        where: {
          OR: [
            telegramEntryIds.length ? { telegramEntryId: { in: telegramEntryIds } } : undefined,
            monoTransactionIds.length ? { monoTransactionId: { in: monoTransactionIds } } : undefined,
          ].filter(Boolean) as Array<Record<string, unknown>>,
        },
      });
    }
    await db.botConversationState.deleteMany({ where: { userId: testUserId } });
    await db.income.deleteMany({ where: { userId: testUserId } });
    await db.expense.deleteMany({ where: { userId: testUserId } });
    await db.telegramEntry.deleteMany({ where: { userId: testUserId } });
    await db.monoTransaction.deleteMany({ where: { userId: testUserId } });
    await db.categoryAlias.deleteMany({ where: { category: { userId: testUserId } } });
    await db.category.deleteMany({ where: { userId: testUserId } });
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
      name: "Telegram Bot Test",
      preferences: { create: { currencyCode: 980, locale: "uk", numberFormat: "SPACE_COMMA", timezone: "Europe/Kyiv" } },
    },
  });
  testUserId = user.id;

  accountId = (await db.financialAccount.create({
    data: {
      balance: new Prisma.Decimal(1000),
      currencyCode: 980,
      isPrimary: true,
      name: "Bot test cash",
      provider: "MANUAL",
      type: "CASH",
      userId: testUserId,
    },
  })).id;

  const [food, utilities, ai] = await Promise.all([
    db.category.create({
      data: {
        color: "#22c55e",
        dashboardGroup: "Їжа",
        icon: "cart",
        name: "Їжа",
        slug: `${testRunId}-food`,
        userId: testUserId,
        aliases: { create: [{ alias: "їжа", normalizedAlias: `${testRunId}-їжа` }, { alias: "хав", normalizedAlias: `${testRunId}-хав` }, { alias: "кава", normalizedAlias: `${testRunId}-кава` }] },
      },
    }),
    db.category.create({
      data: {
        color: "#3b82f6",
        dashboardGroup: "Комунальні",
        icon: "receipt",
        name: "Комунальні",
        slug: `${testRunId}-utilities`,
        userId: testUserId,
        aliases: { create: [{ alias: "комун", normalizedAlias: `${testRunId}-комун` }, { alias: "комуналка", normalizedAlias: `${testRunId}-комуналка` }] },
      },
    }),
    db.category.create({
      data: {
        color: "#8b5cf6",
        dashboardGroup: "AI / підписки",
        icon: "openai",
        name: "AI / підписки",
        slug: `${testRunId}-ai`,
        userId: testUserId,
        aliases: { create: [{ alias: "openai", normalizedAlias: `${testRunId}-openai` }, { alias: "чатжпт", normalizedAlias: `${testRunId}-чатжпт` }] },
      },
    }),
  ]);
  foodCategoryId = food.id;
  utilityCategoryId = utilities.id;
  aiCategoryId = ai.id;
});

after(async () => {
  await cleanupTestData();
  await getDb().$disconnect();
});

test("routes explicit add expense command with amount to draft, not report", async () => {
  const result = await analyzeTelegramFinanceMessage({
    now,
    text: "Додай витрату їжа 250.",
    userId: testUserId,
  });

  assert.equal(result.kind, "draft");
  assert.equal(result.draft.type, "EXPENSE");
  assert.equal(result.draft.amount, 250);
  assert.equal(result.draft.categoryId, foodCategoryId);
});

test("routes legacy expense prefix with amount to draft, not report", async () => {
  const result = await analyzeTelegramFinanceMessage({
    now,
    text: "Витрати: Комун 458",
    userId: testUserId,
  });

  assert.equal(result.kind, "draft");
  assert.equal(result.draft.type, "EXPENSE");
  assert.equal(result.draft.amount, 458);
  assert.equal(result.draft.categoryId, utilityCategoryId);
});

test("routes short voice transcript style expense to draft", async () => {
  const result = await analyzeTelegramFinanceMessage({
    now,
    text: "Хав 1000",
    userId: testUserId,
  });

  assert.equal(result.kind, "draft");
  assert.equal(result.draft.type, "EXPENSE");
  assert.equal(result.draft.amount, 1000);
  assert.equal(result.draft.categoryId, foodCategoryId);
  assert.equal(result.draft.needsCategory, false);
});

test("routes income phrases to income draft", async () => {
  const result = await analyzeTelegramFinanceMessage({
    now,
    text: "Зарплата 50000",
    userId: testUserId,
  });

  assert.equal(result.kind, "draft");
  assert.equal(result.draft.type, "INCOME");
  assert.equal(result.draft.amount, 50_000);
  assert.equal(result.draft.categoryName, "Зарплата");
});

test("routes grouped expense requests to category report, not statement", async () => {
  const result = await analyzeTelegramFinanceMessage({
    now,
    text: "Дай мені витрати по групам з сумами за цей місяць",
    userId: testUserId,
  });

  assert.equal(result.kind, "report");
  assert.equal(result.reportType, "CATEGORIES");
  assert.equal(result.categoryName, null);
});

test("routes polite grouped expense request from telegram to category report", async () => {
  const result = await analyzeTelegramFinanceMessage({
    now,
    text: "Давайте витрати по групам за цей місяць.",
    userId: testUserId,
  });

  assert.equal(result.kind, "report");
  assert.equal(result.reportType, "CATEGORIES");
  assert.equal(result.categoryName, null);
});

test("routes latest operations to latest transactions and parses ukrainian number words", async () => {
  const result = await analyzeTelegramFinanceMessage({
    now,
    text: "Останні п'ять операцій",
    userId: testUserId,
  });

  assert.equal(result.kind, "report");
  assert.equal(result.reportType, "LATEST");
  assert.equal(result.limit, 5);
});

test("routes latest transactions phrase from telegram with word limit", async () => {
  const result = await analyzeTelegramFinanceMessage({
    now,
    text: "Дають останні п'ять транзакцій.",
    userId: testUserId,
  });

  assert.equal(result.kind, "report");
  assert.equal(result.reportType, "LATEST");
  assert.equal(result.limit, 5);
});

test("routes abbreviated latest expenses request to latest expenses with limit", async () => {
  const result = await analyzeTelegramFinanceMessage({
    now,
    text: "дай ост 5 витрат",
    userId: testUserId,
  });

  assert.equal(result.kind, "report");
  assert.equal(result.reportType, "LATEST");
  assert.equal(result.limit, 5);
  assert.equal(result.transactionType, "EXPENSE");
});

test("keeps plain monthly expense request as statement", async () => {
  const result = await analyzeTelegramFinanceMessage({
    now,
    text: "Покажи витрати за цей місяць",
    userId: testUserId,
  });

  assert.equal(result.kind, "report");
  assert.equal(result.reportType, "EXPENSES");
});

test("routes category total question to filtered category report", async () => {
  const result = await analyzeTelegramFinanceMessage({
    now,
    text: "Скільки я витратив на їжу цього місяця?",
    userId: testUserId,
  });

  assert.equal(result.kind, "report");
  assert.equal(result.reportType, "CATEGORIES");
  assert.equal(result.categoryName, "їжу");
});

test("routes category comparison request to category comparison report", async () => {
  const result = await analyzeTelegramFinanceMessage({
    now,
    text: "Порівняй витрати по групах за березень і квітень",
    userId: testUserId,
  });

  assert.equal(result.kind, "report");
  assert.equal(result.reportType, "COMPARE_CATEGORIES");
  assert.ok(result.compareRange);
});

test("turns receipt OCR JSON into an expense draft", async () => {
  const categories = await getDb().category.findMany({
    include: { aliases: true },
    where: { userId: testUserId },
  });
  const draft = receiptAiResultToDraft(
    {
      amount: "1 250,50",
      categoryName: "Їжа",
      confidence: 0.91,
      date: "2026-04-30",
      description: "Покупки",
      merchant: "Сільпо",
    },
    categories.map((category) => ({
      aliases: category.aliases.map((alias) => alias.alias),
      dashboardGroup: category.dashboardGroup,
      id: category.id,
      name: category.name,
      slug: category.slug,
    })),
    { now },
  );

  assert.ok(draft);
  assert.equal(draft.type, "EXPENSE");
  assert.equal(draft.amount, 1250.5);
  assert.equal(draft.categoryId, foodCategoryId);
  assert.equal(draft.needsCategory, false);
  assert.equal(draft.date, "2026-04-29T21:00:00.000Z");
});

test("uses receipt merchant and description to infer category when OCR has no category", async () => {
  const categories = await getDb().category.findMany({
    include: { aliases: true },
    where: { userId: testUserId },
  });
  const draft = receiptAiResultToDraft(
    {
      amount: 1050,
      description: "OpenAI API",
      merchant: "OpenAI",
    },
    categories.map((category) => ({
      aliases: category.aliases.map((alias) => alias.alias),
      dashboardGroup: category.dashboardGroup,
      id: category.id,
      name: category.name,
      slug: category.slug,
    })),
    { caption: "OpenAI subscription", now },
  );

  assert.ok(draft);
  assert.equal(draft.categoryId, aiCategoryId);
  assert.equal(draft.description, "OpenAI API");
  assert.equal(draft.sourceText, "Фото чека: OpenAI subscription");
});

test("rejects receipt OCR result without amount", () => {
  const draft = receiptAiResultToDraft(
    { categoryName: "Їжа", merchant: "Сільпо" },
    [],
    { now },
  );

  assert.equal(draft, null);
});

describe("telegram bot persistence and report rendering", () => {
  before(async () => {
    const db = getDb();
    await db.expense.deleteMany({ where: { userId: testUserId } });
    await db.income.deleteMany({ where: { userId: testUserId } });
    await db.expense.createMany({
      data: [
        { amount: new Prisma.Decimal(250), categoryId: foodCategoryId, date: new Date("2026-04-30T09:00:00.000Z"), description: "Кава", financialAccountId: accountId, sourceStatus: "TELEGRAM_ONLY", userId: testUserId },
        { amount: new Prisma.Decimal(560), categoryId: foodCategoryId, date: new Date("2026-04-29T09:00:00.000Z"), description: "АТБ", financialAccountId: accountId, sourceStatus: "TELEGRAM_ONLY", userId: testUserId },
        { amount: new Prisma.Decimal(2200), categoryId: utilityCategoryId, date: new Date("2026-04-28T09:00:00.000Z"), description: "Комуналка", financialAccountId: accountId, sourceStatus: "TELEGRAM_ONLY", userId: testUserId },
        { amount: new Prisma.Decimal(1050), categoryId: aiCategoryId, date: new Date("2026-03-28T09:00:00.000Z"), description: "OpenAI", financialAccountId: accountId, sourceStatus: "TELEGRAM_ONLY", userId: testUserId },
      ],
    });
    await db.income.create({
      data: {
        amount: new Prisma.Decimal(50000),
        date: new Date("2026-04-27T09:00:00.000Z"),
        description: "квітень",
        financialAccountId: accountId,
        source: "Зарплата",
        userId: testUserId,
      },
    });
  });

  test("saves confirmed expense draft to the database with default account", async () => {
    const draft: TelegramOperationDraft = {
      amount: 80,
      categoryId: foodCategoryId,
      categoryName: "Їжа",
      confidence: 0.9,
      currencyCode: 980,
      date: "2026-04-30T10:00:00.000Z",
      description: "Еспресо",
      needsCategory: false,
      sourceText: "Кава 80",
      suggestions: [],
      type: "EXPENSE",
    };

    const saved = await saveTelegramOperationDraft(draft, testUserId);
    const expense = await getDb().expense.findUnique({ where: { id: saved.operation.id } });

    assert.equal(saved.type, "EXPENSE");
    assert.equal(Number(expense?.amount), 80);
    assert.equal(expense?.categoryId, foodCategoryId);
    assert.equal(expense?.financialAccountId, accountId);
    assert.equal(expense?.sourceStatus, "TELEGRAM_ONLY");
  });

  test("saves telegram expense with telegram entry linkage for dedupe", async () => {
    const draft: TelegramOperationDraft = {
      amount: 81,
      categoryId: foodCategoryId,
      categoryName: "Р‡Р¶Р°",
      confidence: 0.9,
      currencyCode: 980,
      date: "2026-03-30T11:00:00.000Z",
      description: "Р›Р°С‚Рµ",
      needsCategory: false,
      sourceText: "РљР°РІР° 81",
      suggestions: [],
      type: "EXPENSE",
    };

    const saved = await saveTelegramOperationDraft(draft, testUserId, {
      telegramChatId: `${testRunId}-chat`,
      telegramMessageId: `${testRunId}-msg-1`,
      telegramUserId: `${testRunId}-tg-user`,
    });
    const expense = await getDb().expense.findUnique({
      where: { id: saved.operation.id },
    });
    const entry = expense?.telegramEntryId
      ? await getDb().telegramEntry.findUnique({ where: { id: expense.telegramEntryId } })
      : null;

    assert.equal(saved.type, "EXPENSE");
    assert.ok(expense?.telegramEntryId);
    assert.equal(entry?.rawText, "РљР°РІР° 81");
    assert.equal(entry?.status, "PARSED");
  });

  test("merges telegram expense with monobank duplicate", async () => {
    const draft: TelegramOperationDraft = {
      amount: 1234,
      categoryId: foodCategoryId,
      categoryName: "Р‡Р¶Р°",
      confidence: 0.92,
      currencyCode: 980,
      date: "2026-03-30T09:15:00.000Z",
      description: "Сільпо",
      needsCategory: false,
      sourceText: "Сільпо 1234",
      suggestions: [],
      type: "EXPENSE",
    };

    const saved = await saveTelegramOperationDraft(draft, testUserId, {
      telegramChatId: `${testRunId}-chat`,
      telegramMessageId: `${testRunId}-msg-2`,
      telegramUserId: `${testRunId}-tg-user`,
    });

    const monoTx = await getDb().monoTransaction.create({
      data: {
        accountId: "mono-test-account",
        amount: -123400,
        currencyCode: 980,
        description: "Сільпо",
        financialAccountId: accountId,
        monoTransactionId: `${testRunId}-mono-1`,
        rawJson: { source: "test" },
        timestamp: new Date("2026-03-30T09:30:00.000Z"),
        userId: testUserId,
      },
    });

    const monoExpense = await getDb().expense.create({
      data: {
        amount: new Prisma.Decimal(1234),
        categoryId: foodCategoryId,
        currencyCode: 980,
        date: new Date("2026-03-30T09:30:00.000Z"),
        description: "Сільпо",
        financialAccountId: accountId,
        monoTransactionId: monoTx.id,
        paymentType: "CARD",
        sourceStatus: "MONO_ONLY",
        userId: testUserId,
      },
    });

    const savedExpense = await getDb().expense.findUnique({ where: { id: saved.operation.id } });
    const matched = await matchExpenses({
      telegramEntryId: savedExpense?.telegramEntryId ?? undefined,
      userId: testUserId,
    });
    const mergedExpense = await getDb().expense.findUnique({ where: { id: saved.operation.id } });
    const deletedMonoExpense = await getDb().expense.findUnique({ where: { id: monoExpense.id } });
    const entry = savedExpense?.telegramEntryId
      ? await getDb().telegramEntry.findUnique({ where: { id: savedExpense.telegramEntryId } })
      : null;

    assert.equal(matched, 1);
    assert.equal(mergedExpense?.sourceStatus, "MATCHED");
    assert.equal(mergedExpense?.monoTransactionId, monoTx.id);
    assert.equal(deletedMonoExpense, null);
    assert.equal(entry?.status, "MATCHED");
  });

  test("renders category report as aggregated rows without transaction descriptions", async () => {
    const report = await buildTelegramReport(
      { kind: "report", range: quickRange("this_month", now), reportType: "CATEGORIES" },
      testUserId,
    );

    assert.match(report, /<b>Витрати по групах<\/b>/u);
    assert.match(report, /Період: цей місяць/u);
    assert.match(report, /<b>Їжа<\/b>\n\s+890 грн \/ 3 операції/u);
    assert.match(report, /<b>Комунальні<\/b>\n\s+2 200 грн \/ 1 операція/u);
    assert.doesNotMatch(report, /АТБ/u);
    assert.doesNotMatch(report, /Кава/u);
  });

  test("renders latest expenses with requested limit and expense-only rows", async () => {
    const report = await buildTelegramReport(
      { kind: "report", limit: 2, range: quickRange("this_month", now), reportType: "LATEST", transactionType: "EXPENSE" },
      testUserId,
    );

    const lines = report.split("\n").filter((line) => line.includes(" · "));
    assert.match(report, /Останні 2 витрат/u);
    assert.equal(lines.length, 2);
    assert.doesNotMatch(report, /Зарплата/u);
  });

  test("renders balance report from database totals", async () => {
    const report = await buildTelegramReport(
      { kind: "report", range: quickRange("this_month", now), reportType: "BALANCE" },
      testUserId,
    );

    assert.match(report, /<b>Доходи:<\/b> \+50 000 грн/u);
    assert.match(report, /<b>Витрати:<\/b> -3 090 грн/u);
    assert.match(report, /<b>Різниця:<\/b> \+46 910 грн/u);
  });
});

describe("telegram bot draft editing and conversation state", () => {
  const baseDraft: TelegramOperationDraft = {
    amount: 250,
    categoryId: foodCategoryId,
    categoryName: "Їжа",
    confidence: 0.9,
    currencyCode: 980,
    date: "2026-04-30T10:00:00.000Z",
    description: "Кава",
    needsCategory: false,
    sourceText: "Кава 250",
    suggestions: [],
    type: "EXPENSE",
  };

  test("renders draft confirmation with amount, category, date and description", () => {
    const text = renderTelegramDraft(baseDraft);
    assert.match(text, /Підтвердити витрату/u);
    assert.match(text, /<b>Сума:<\/b> 250 грн/u);
    assert.match(text, /<b>Категорія:<\/b> Їжа/u);
    assert.match(text, /<b>Опис:<\/b> Кава/u);
  });

  test("updates draft amount, category and date", async () => {
    const amountDraft = updateDraftAmount(baseDraft, "1050 грн");
    assert.equal(amountDraft.amount, 1050);

    const categoryDraft = await updateDraftCategory(baseDraft, "Комун", testUserId);
    assert.equal(categoryDraft.categoryId, utilityCategoryId);
    assert.equal(categoryDraft.categoryName, "Комунальні");

    const dateDraft = updateDraftDate(baseDraft, "вчора", now);
    assert.equal(dateDraft.date, "2026-04-28T21:00:00.000Z");
  });

  test("stores, loads and clears conversation state", async () => {
    const chatId = `${testRunId}-chat`;
    const telegramUserId = `${testRunId}-telegram`;

    await setTelegramConversationState({
      chatId,
      kind: "draft_confirmation",
      payload: { draft: baseDraft },
      telegramUserId,
      userId: testUserId,
    });

    const loaded = await getTelegramConversationState(chatId, telegramUserId);
    assert.equal(loaded?.kind, "draft_confirmation");
    assert.equal(loaded?.payload.draft?.amount, 250);

    await clearTelegramConversationState(chatId, telegramUserId);
    const cleared = await getTelegramConversationState(chatId, telegramUserId);
    assert.equal(cleared, null);
  });
});


