import { Prisma } from "@prisma/client";
import { normalizeText, parseTelegramExpense } from "@resource-manager/shared";
import { getDb } from "../db.js";
import { ensureDefaultUser } from "./auth.js";
import { getCategoryLookup } from "./categories.js";
import { enqueueJob } from "./jobs.js";
import { maybeCreateExpenseAlert } from "./notifications.js";

type TelegramExpenseInput = {
  chatId: string;
  messageId: string;
  rawText: string;
  telegramUserId?: string;
  timestamp: Date;
  workspaceUserId?: string;
};

export async function recordTelegramExpense(input: TelegramExpenseInput) {
  const categories = await getCategoryLookup(input.workspaceUserId);
  const parsed = parseTelegramExpense(input.rawText, categories);

  if (!parsed.ok) {
    return {
      parsed,
      telegramEntry: null,
      expense: null,
    };
  }

  const status = parsed.category ? "PARSED" : "NEEDS_REVIEW";
  const paymentHint = mapPaymentHint(parsed.paymentHint);
  const userId = input.workspaceUserId ?? (await ensureDefaultUser()).id;
  const entry = await getDb().telegramEntry.upsert({
    where: {
      telegramChatId_telegramMessageId: {
        telegramChatId: input.chatId,
        telegramMessageId: input.messageId,
      },
    },
    update: {
      categoryId: parsed.category?.id,
      normalizedCategoryText: parsed.rawCategory ? normalizeText(parsed.rawCategory) : null,
      parsedAmount: new Prisma.Decimal(parsed.amount),
      parsedCurrency: parsed.currencyCode,
      paymentHint,
      rawCategory: parsed.rawCategory,
      rawText: input.rawText,
      status,
      timestamp: input.timestamp,
      userId,
    },
    create: {
      categoryId: parsed.category?.id,
      normalizedCategoryText: parsed.rawCategory ? normalizeText(parsed.rawCategory) : null,
      parsedAmount: new Prisma.Decimal(parsed.amount),
      parsedCurrency: parsed.currencyCode,
      paymentHint,
      rawCategory: parsed.rawCategory,
      rawText: input.rawText,
      status,
      telegramChatId: input.chatId,
      telegramMessageId: input.messageId,
      telegramUserId: input.telegramUserId,
      timestamp: input.timestamp,
      userId,
    },
  });

  const expense = await getDb().expense.upsert({
    where: { telegramEntryId: entry.id },
    update: {
      amount: new Prisma.Decimal(parsed.amount),
      categoryId: parsed.category?.id,
      currencyCode: parsed.currencyCode,
      date: input.timestamp,
      description: parsed.description,
      paymentType: paymentHint === "CASH" ? "CASH" : paymentHint === "CARD" ? "CARD" : "UNKNOWN",
      sourceStatus: parsed.category ? "TELEGRAM_ONLY" : "NEEDS_REVIEW",
      userId,
    },
    create: {
      amount: new Prisma.Decimal(parsed.amount),
      categoryId: parsed.category?.id,
      currencyCode: parsed.currencyCode,
      date: input.timestamp,
      description: parsed.description,
      paymentType: paymentHint === "CASH" ? "CASH" : paymentHint === "CARD" ? "CARD" : "UNKNOWN",
      sourceStatus: parsed.category ? "TELEGRAM_ONLY" : "NEEDS_REVIEW",
      telegramEntryId: entry.id,
      userId,
    },
  });

  await enqueueJob("match_expenses", { telegramEntryId: entry.id, userId });
  await maybeCreateExpenseAlert(expense.id, userId);

  return {
    expense,
    parsed,
    telegramEntry: entry,
  };
}

export async function getDashboardOverview() {
  const db = getDb();
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const [expenses, needsReviewCount, categories, recentExpenses] = await Promise.all([
    db.expense.findMany({
      include: { category: true },
      orderBy: { date: "desc" },
      where: { date: { gte: startOfMonth } },
    }),
    db.expense.count({ where: { sourceStatus: "NEEDS_REVIEW" } }),
    db.category.findMany({ orderBy: { name: "asc" }, where: { isActive: true } }),
    db.expense.findMany({
      include: { category: true },
      orderBy: { date: "desc" },
      take: 12,
    }),
  ]);

  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const byCategory = new Map<string, { color: string; group: string; icon: string; name: string; total: number }>();

  for (const expense of expenses) {
    const key = expense.category?.name ?? "Без категорії";
    const current = byCategory.get(key) ?? {
      color: expense.category?.color ?? "#868e96",
      group: expense.category?.dashboardGroup ?? "Review",
      icon: expense.category?.icon ?? "expenses",
      name: key,
      total: 0,
    };
    current.total += Number(expense.amount);
    byCategory.set(key, current);
  }

  return {
    byCategory: Array.from(byCategory.values()).sort((a, b) => b.total - a.total),
    categories: categories.map((category) => ({
      color: category.color,
      dashboardGroup: category.dashboardGroup,
      icon: category.icon,
      id: category.id,
      name: category.name,
      slug: category.slug,
    })),
    needsReviewCount,
    recentExpenses: recentExpenses.map((expense) => serializeExpense(expense)),
    total,
  };
}

export async function getExpenses(limit = 100, userId?: string | null) {
  const expenses = await getDb().expense.findMany({
    include: { category: true },
    orderBy: { date: "desc" },
    take: limit,
    where: userId ? { userId } : undefined,
  });
  return expenses.map((expense) => serializeExpense(expense));
}

export async function getNeedsReview(userId?: string | null) {
  const expenses = await getDb().expense.findMany({
    include: { category: true, monoTransaction: true, telegramEntry: true },
    orderBy: { date: "desc" },
    where: {
      sourceStatus: "NEEDS_REVIEW",
      ...(userId ? { userId } : {}),
    },
  });
  return expenses.map((expense) => ({
    ...serializeExpense(expense),
    monoDescription: expense.monoTransaction?.description ?? null,
    telegramText: expense.telegramEntry?.rawText ?? null,
  }));
}

export async function monthlySummary(referenceDate = new Date(), userId?: string | null) {
  const start = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1));
  const end = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() + 1, 1));
  const expenses = await getDb().expense.findMany({
    include: { category: true },
    where: {
      date: {
        gte: start,
        lt: end,
      },
      ...(userId ? { userId } : {}),
    },
  });

  const byCategory = new Map<string, number>();
  for (const expense of expenses) {
    byCategory.set(
      expense.category?.name ?? "Без категорії",
      (byCategory.get(expense.category?.name ?? "Без категорії") ?? 0) + Number(expense.amount),
    );
  }

  return {
    byCategory: Array.from(byCategory.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total),
    total: expenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
  };
}

function serializeExpense(
  expense: Prisma.ExpenseGetPayload<{ include: { category: true } }>,
) {
  return {
    amount: Number(expense.amount),
    category: expense.category?.name ?? null,
    categoryColor: expense.category?.color ?? null,
    categoryIcon: expense.category?.icon ?? null,
    date: expense.date.toISOString(),
    description: expense.description,
    id: expense.id,
    paymentType: expense.paymentType,
    sourceStatus: expense.sourceStatus,
  };
}

function mapPaymentHint(paymentHint: "cash" | "card" | "unknown") {
  if (paymentHint === "cash") {
    return "CASH";
  }
  if (paymentHint === "card") {
    return "CARD";
  }
  return "UNKNOWN";
}
