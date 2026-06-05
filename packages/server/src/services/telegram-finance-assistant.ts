import { Prisma } from "@prisma/client";
import { findCategoryByAlias, normalizeText, type CategoryLookup } from "@resource-manager/shared";
import { config } from "../config.js";
import { getDb } from "../db.js";
import { getCategoryLookup } from "./categories.js";
import { enqueueJob } from "./jobs.js";
import { getOpenAIClient } from "./openai.js";
import { createIncome, createManualExpense } from "./portfolio.js";

export type TelegramOperationType = "EXPENSE" | "INCOME";
export type TelegramReportType =
  | "BALANCE"
  | "CATEGORIES"
  | "COMPARE"
  | "COMPARE_CATEGORIES"
  | "EXPENSES"
  | "INCOMES"
  | "LATEST"
  | "MONTHLY_SUMMARY";

export type TelegramDateRange = {
  from: string;
  label: string;
  to: string;
};

export type TelegramDraftSuggestion = {
  categoryId: string;
  name: string;
};

export type TelegramOperationDraft = {
  amount: number;
  categoryId?: string | null;
  categoryName?: string | null;
  confidence: number;
  currencyCode: number;
  date: string;
  description: string | null;
  needsCategory: boolean;
  sourceText: string;
  suggestions: TelegramDraftSuggestion[];
  type: TelegramOperationType;
};

export type TelegramConversationPayload = {
  draft?: TelegramOperationDraft;
  forcedType?: TelegramOperationType;
};

export type TelegramSaveContext = {
  telegramChatId?: string | null;
  telegramMessageId?: string | null;
  telegramUserId?: string | null;
};

export type TelegramAssistantIntent =
  | { kind: "draft"; draft: TelegramOperationDraft }
  | { kind: "report"; reportType: TelegramReportType; range: TelegramDateRange; compareRange?: TelegramDateRange; limit?: number; categoryName?: string | null; transactionType?: TelegramOperationType | null }
  | { kind: "unknown"; text: string };

type AiParsedIntent = {
  amount?: unknown;
  categoryId?: unknown;
  categoryName?: unknown;
  category?: unknown;
  date?: unknown;
  description?: unknown;
  filters?: unknown;
  from?: unknown;
  groupBy?: unknown;
  includeDetails?: unknown;
  includeTransactions?: unknown;
  intent?: unknown;
  kind?: unknown;
  limit?: unknown;
  operationType?: unknown;
  period?: unknown;
  periodFrom?: unknown;
  periodTo?: unknown;
  rangeKey?: unknown;
  reportType?: unknown;
  to?: unknown;
  type?: unknown;
};

export type ReceiptAiResult = {
  amount?: unknown;
  category?: unknown;
  categoryId?: unknown;
  categoryName?: unknown;
  confidence?: unknown;
  currencyCode?: unknown;
  date?: unknown;
  description?: unknown;
  merchant?: unknown;
  total?: unknown;
  totalAmount?: unknown;
  vendor?: unknown;
};

const conversationTtlMs = 15 * 60_000;
const amountPattern = /(?:^|\s)(\d{1,3}(?:[\s\u00a0]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)(?:\s*(?:грн|uah|₴|гривень|гривні|гривня))?(?=$|\s|[.,!?:;])/iu;
const explicitDatePattern = /\b(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?\b/u;

const monthNames = [
  ["січень", "січня", "січні"],
  ["лютий", "лютого", "лютому"],
  ["березень", "березня", "березні"],
  ["квітень", "квітня", "квітні"],
  ["травень", "травня", "травні"],
  ["червень", "червня", "червні"],
  ["липень", "липня", "липні"],
  ["серпень", "серпня", "серпні"],
  ["вересень", "вересня", "вересні"],
  ["жовтень", "жовтня", "жовтні"],
  ["листопад", "листопада", "листопаді"],
  ["грудень", "грудня", "грудні"],
] as const;

const expenseCategoryHints: Array<{ keys: string[]; categoryHints: string[] }> = [
  { categoryHints: ["їжа", "продукти", "food"], keys: ["атб", "сільпо", "продукт", "їжа", "їжу", "харч", "хав", "кава", "кафе", "ресторан", "mcdonald", "tam tam", "pekarnia"] },
  { categoryHints: ["авто", "паливо", "транспорт"], keys: ["бензин", "паливо", "wog", "окко", "okko", "upg", "авто", "таксі", "bolt", "uber"] },
  { categoryHints: ["комунальні", "комуналка"], keys: ["комунал", "квартплата", "газ", "вода", "світло", "електро", "київгаз"] },
  { categoryHints: ["ліки", "здоров"], keys: ["ліки", "аптека", "здоров", "лікар", "мед"] },
  { categoryHints: ["підписки", "ai", "софт"], keys: ["openai", "chatgpt", "github", "netflix", "spotify", "youtube", "підпис", "ai", "аі"] },
  { categoryHints: ["донати"], keys: ["донат", "збір", "благод"] },
  { categoryHints: ["дім", "житло"], keys: ["дім", "епіцентр", "побут", "ремонт", "житло"] },
  { categoryHints: ["подорож", "відпуст"], keys: ["airbnb", "booking", "готель", "подорож", "відпуст", "квиток"] },
  { categoryHints: ["одяг"], keys: ["одяг", "colins", "zara", "reserved", "shirt"] },
  { categoryHints: ["розваги"], keys: ["кіно", "multiplex", "розваг", "гра", "brawl"] },
];

const incomeHints = ["зарплата", "дохід", "доход", "фріланс", "проект", "проєкт", "оплата", "кешбек", "повернення", "дивіденди", "бонус"];
const expenseHints = ["витрата", "витрати", "витратив", "купив", "кава", "атб", "сільпо", "бензин", "комуналка", "донат"];
const categoryBreakdownPattern = /(?:категор|груп|розбив|розбий|структур|по кожн|з сумами|суми по|підсумок по|розподіл)/iu;
const latestPattern = /(?:^|\s)(?:ост\.?|останніх?|останнє|недавно|нещодавно)(?:\s|$)/iu;
const transactionListPattern = /(?:виписк|список|операц|транзакц|детал|детально|останні|недавно)/iu;

export async function analyzeTelegramFinanceMessage(input: {
  forcedType?: TelegramOperationType;
  now?: Date;
  text: string;
  userId?: string | null;
}): Promise<TelegramAssistantIntent> {
  const text = input.text.trim();
  const normalized = normalizeText(text);
  const now = input.now ?? new Date();
  if (!normalized) {
    return { kind: "unknown", text: "Напишіть суму операції або запит: наприклад, «Кава 80» чи «Витрати за сьогодні»." };
  }

  const amountMatch = text.match(amountPattern);
  const preferOperation = Boolean(amountMatch?.[1]) && isOperationWriteRequest(normalized, text, input.forcedType);
  if (!preferOperation) {
    const reportIntent = parseReportIntent(text, normalized, now);
    if (reportIntent) {
      return reportIntent;
    }
  }

  if (!amountMatch?.[1]) {
    const aiIntent = await analyzeWithAiFallback({ ...input, now, text }, await getCategoryLookup(input.userId));
    if (aiIntent) {
      return aiIntent;
    }
    return { kind: "unknown", text: "Я не бачу суму. Напишіть, наприклад: «АТБ продукти 560» або «Зарплата 50000»." };
  }

  const amount = Number.parseFloat(amountMatch[1].replace(/\s|\u00a0/g, "").replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) {
    return { kind: "unknown", text: "Сума має бути додатним числом. Наприклад: «Кава 80»." };
  }

  const categories = await getCategoryLookup(input.userId);
  const type = input.forcedType ?? inferOperationType(normalized);
  const date = extractOperationDate(text, normalized, now);
  const withoutAmount = removeAmountAndCurrency(text, amountMatch[0]);
  const cleanedText = removeOperationWords(removeDateWords(withoutAmount)).trim();
  const categoryMatch = type === "EXPENSE" ? resolveExpenseCategory(cleanedText || text, categories) : null;
  const incomeSource = type === "INCOME" ? inferIncomeSource(cleanedText || text) : null;
  const description = buildOperationDescription(cleanedText, categoryMatch?.name ?? incomeSource);
  const suggestions =
    type === "EXPENSE"
      ? buildCategorySuggestions(cleanedText || text, categories, categoryMatch?.id)
      : [];

  const ruleIntent: TelegramAssistantIntent = {
    kind: "draft",
    draft: {
      amount,
      categoryId: categoryMatch?.id ?? null,
      categoryName: type === "EXPENSE" ? categoryMatch?.name ?? null : incomeSource ?? "Дохід",
      confidence: categoryMatch || type === "INCOME" ? 0.82 : 0.42,
      currencyCode: 980,
      date: date.toISOString(),
      description,
      needsCategory: type === "EXPENSE" && !categoryMatch,
      sourceText: text,
      suggestions,
      type,
    },
  };

  if (type === "EXPENSE" && !categoryMatch) {
    const aiIntent = await analyzeWithAiFallback({ ...input, now, text }, categories);
    if (aiIntent?.kind === "draft") {
      return aiIntent;
    }
  }

  return ruleIntent;
}

export async function saveTelegramOperationDraft(
  draft: TelegramOperationDraft,
  userId?: string | null,
  telegram?: TelegramSaveContext,
) {
  const financialAccountId = await resolveDefaultFinancialAccountId(userId);
  if (draft.type === "EXPENSE") {
    if (!draft.categoryId && !draft.categoryName) {
      throw new Error("Оберіть категорію перед збереженням витрати.");
    }
    const telegramEntryId = await upsertTelegramDraftEntry(draft, userId, telegram);
    const operation = await createManualExpense({
      amount: draft.amount,
      categoryId: draft.categoryId ?? undefined,
      categoryName: draft.categoryId ? undefined : draft.categoryName ?? undefined,
      date: draft.date,
      description: draft.description ?? undefined,
      financialAccountId: financialAccountId ?? undefined,
      paymentType: "UNKNOWN",
      sourceStatus: draft.categoryId ? "TELEGRAM_ONLY" : "NEEDS_REVIEW",
      telegramEntryId: telegramEntryId ?? undefined,
      userId: userId ?? undefined,
    });
    if (telegramEntryId) {
      await enqueueJob("match_expenses", { telegramEntryId, userId: userId ?? undefined });
    }
    return {
      operation,
      type: "EXPENSE" as const,
    };
  }

  return {
    operation: await createIncome({
      amount: draft.amount,
      date: draft.date,
      description: draft.description ?? undefined,
      financialAccountId: financialAccountId ?? undefined,
      source: draft.categoryName ?? "Дохід",
      userId: userId ?? undefined,
    }),
    type: "INCOME" as const,
  };
}

async function upsertTelegramDraftEntry(
  draft: TelegramOperationDraft,
  userId?: string | null,
  telegram?: TelegramSaveContext,
) {
  if (!telegram?.telegramChatId || !telegram.telegramMessageId) {
    return null;
  }

  const db = getDb();
  const status = draft.categoryId ? "PARSED" : "NEEDS_REVIEW";
  const timestamp = new Date(draft.date);

  const entry = await db.telegramEntry.upsert({
    where: {
      telegramChatId_telegramMessageId: {
        telegramChatId: telegram.telegramChatId,
        telegramMessageId: telegram.telegramMessageId,
      },
    },
    update: {
      categoryId: draft.categoryId ?? null,
      normalizedCategoryText: draft.categoryName ? normalizeText(draft.categoryName) : null,
      parsedAmount: new Prisma.Decimal(draft.amount),
      parsedCurrency: draft.currencyCode,
      rawCategory: draft.categoryName ?? null,
      rawText: draft.sourceText,
      status,
      telegramUserId: telegram.telegramUserId ?? null,
      timestamp,
      userId: userId ?? null,
    },
    create: {
      categoryId: draft.categoryId ?? null,
      normalizedCategoryText: draft.categoryName ? normalizeText(draft.categoryName) : null,
      parsedAmount: new Prisma.Decimal(draft.amount),
      parsedCurrency: draft.currencyCode,
      rawCategory: draft.categoryName ?? null,
      rawText: draft.sourceText,
      status,
      telegramChatId: telegram.telegramChatId,
      telegramMessageId: telegram.telegramMessageId,
      telegramUserId: telegram.telegramUserId ?? null,
      timestamp,
      userId: userId ?? null,
    },
  });

  return entry.id;
}

async function analyzeWithAiFallback(
  input: { forcedType?: TelegramOperationType; now: Date; text: string; userId?: string | null },
  categories: CategoryLookup[],
): Promise<TelegramAssistantIntent | null> {
  try {
    const client = await getOpenAIClient(input.userId);
    const response = await client.responses.create({
      input: [
        {
          role: "system",
          content: [
            "Ти NLU-парсер для українського фінансового Telegram-бота.",
            "Поверни тільки валідний JSON без markdown.",
            "Не формуй фінальну відповідь користувачу і не вигадуй фінансові дані.",
            "Твоя задача - повернути структурований intent для бекенду.",
            "Якщо користувач просить по групах, по категоріях, з сумами, скільки по кожній групі, розбивку або структуру витрат - це завжди агрегований report CATEGORIES, а не список операцій.",
            "Для operation витягни type EXPENSE/INCOME, amount, categoryName, description, date у форматі YYYY-MM-DD.",
            "Для report витягни reportType: EXPENSES, INCOMES, CATEGORIES, BALANCE, LATEST, MONTHLY_SUMMARY, COMPARE або COMPARE_CATEGORIES.",
            "Для періоду використовуй rangeKey: today, yesterday, this_week, this_month або last_month, якщо це можливо; або from/to у форматі YYYY-MM-DD.",
            "Для останніх операцій використовуй reportType LATEST і limit.",
            "Для CATEGORIES не став includeTransactions true, якщо користувач прямо не просить детально/список/операції.",
            "Не вигадуй суму. Якщо суми немає і це не звіт, kind має бути unknown.",
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify({
            availableCategories: categories.map((category) => ({
              aliases: category.aliases,
              id: category.id,
              name: category.name,
            })),
            forcedType: input.forcedType ?? null,
            now: input.now.toISOString().slice(0, 10),
            text: input.text,
          }),
        },
      ],
      model: config.OPENAI_MODEL,
    });
    const parsed = parseAiJson(response.output_text);
    if (!parsed) return null;
    return coerceAiIntent(parsed, input, categories);
  } catch (error) {
    console.warn("Telegram AI intent fallback failed", error instanceof Error ? error.message : error);
    return null;
  }
}

function coerceAiIntent(
  parsed: AiParsedIntent,
  input: { forcedType?: TelegramOperationType; now: Date; text: string },
  categories: CategoryLookup[],
): TelegramAssistantIntent | null {
  const rawIntent = asString(parsed.intent)?.toLowerCase();
  const kind = asString(parsed.kind)?.toLowerCase();
  if (kind === "report" || rawIntent?.includes("statement") || rawIntent?.includes("category") || rawIntent?.includes("balance") || rawIntent?.includes("latest")) {
    const reportType = normalizeAiReportType(parsed.reportType) ?? reportTypeFromAiIntent(rawIntent);
    if (!reportType) return null;
    const range = aiDateRange(parsed, input.now);
    return {
      ...(reportType === "COMPARE" ? { compareRange: previousSimilarRange(range) } : {}),
      ...(reportType === "COMPARE_CATEGORIES" ? { compareRange: previousSimilarRange(range) } : {}),
      categoryName: asString(parsed.categoryName) ?? asString(parsed.category),
      kind: "report",
      limit: positiveInteger(parsed.limit) ?? undefined,
      range,
      reportType,
      transactionType: normalizeAiOperationType(parsed.operationType ?? parsed.type) ?? inferAiReportTransactionType(rawIntent),
    };
  }

  if (kind !== "operation" && kind !== "draft") {
    return null;
  }

  const amount = positiveAmount(parsed.amount);
  if (!amount) return null;

  const type = input.forcedType ?? normalizeAiOperationType(parsed.type) ?? "EXPENSE";
  const categoryName = asString(parsed.categoryName);
  const categoryId = asString(parsed.categoryId);
  const categoryMatch =
    type === "EXPENSE"
      ? categories.find((category) => category.id === categoryId) ??
        (categoryName ? resolveExpenseCategory(categoryName, categories) : null) ??
        resolveExpenseCategory(input.text, categories)
      : null;
  const description = asString(parsed.description) ?? (firstMeaningfulText(input.text) || null);
  const date = aiOperationDate(parsed.date, input.now) ?? extractOperationDate(input.text, normalizeText(input.text), input.now);
  const resolvedCategoryName = type === "EXPENSE" ? categoryMatch?.name ?? categoryName ?? null : categoryName ?? inferIncomeSource(input.text);
  const suggestions = type === "EXPENSE" ? buildCategorySuggestions(`${categoryName ?? ""} ${description ?? ""} ${input.text}`, categories, categoryMatch?.id) : [];

  return {
    kind: "draft",
    draft: {
      amount,
      categoryId: categoryMatch?.id ?? null,
      categoryName: resolvedCategoryName,
      confidence: 0.86,
      currencyCode: 980,
      date: date.toISOString(),
      description,
      needsCategory: type === "EXPENSE" && !categoryMatch && !resolvedCategoryName,
      sourceText: input.text,
      suggestions,
      type,
    },
  };
}

export async function recognizeReceiptImage(input: {
  buffer: Buffer;
  caption?: string | null;
  fileName?: string;
  mimeType?: string;
  now?: Date;
  userId?: string | null;
}): Promise<TelegramOperationDraft> {
  const now = input.now ?? new Date();
  const categories = await getCategoryLookup(input.userId);
  const client = await getOpenAIClient(input.userId);
  const mimeType = normalizeReceiptMimeType(input.mimeType, input.fileName);
  const dataUrl = `data:${mimeType};base64,${input.buffer.toString("base64")}`;

  const response = await client.responses.create({
    input: [
      {
        role: "system",
        content: [
          "Ти OCR/vision парсер чеків для українського фінансового Telegram-бота.",
          "Поверни тільки валідний JSON без markdown.",
          "Витягни загальну суму до оплати, дату чека, продавця, категорію витрати, короткий опис.",
          "Не вигадуй дані. Якщо суму не видно, поверни amount:null.",
          "Категорію обирай з availableCategories, якщо це можливо.",
        ].join(" "),
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify({
              availableCategories: categories.map((category) => ({
                aliases: category.aliases,
                id: category.id,
                name: category.name,
              })),
              caption: input.caption ?? null,
              fileName: input.fileName ?? null,
              today: now.toISOString().slice(0, 10),
              timezone: "Europe/Kyiv",
              expectedJsonShape: {
                amount: "number|null",
                categoryName: "string|null",
                confidence: "number 0..1",
                currencyCode: 980,
                date: "YYYY-MM-DD|null",
                description: "string|null",
                merchant: "string|null",
              },
            }),
          },
          { type: "input_image", image_url: dataUrl },
        ],
      },
    ],
    model: config.OPENAI_MODEL,
  } as any);

  const parsed = parseAiJson<ReceiptAiResult>(response.output_text);
  const draft = parsed ? receiptAiResultToDraft(parsed, categories, { caption: input.caption, now }) : null;
  if (!draft) {
    throw new Error("Не бачу суму на фото чека. Спробуйте сфотографувати чек ближче або напишіть суму текстом.");
  }
  return draft;
}

export function receiptAiResultToDraft(
  parsed: ReceiptAiResult,
  categories: CategoryLookup[],
  input: { caption?: string | null; now?: Date } = {},
): TelegramOperationDraft | null {
  const now = input.now ?? new Date();
  const amount = positiveAmount(parsed.amount ?? parsed.totalAmount ?? parsed.total);
  if (!amount) return null;

  const categoryId = asString(parsed.categoryId);
  const categoryName = asString(parsed.categoryName) ?? asString(parsed.category);
  const merchant = asString(parsed.merchant) ?? asString(parsed.vendor);
  const description = asString(parsed.description) ?? merchant ?? input.caption?.trim() ?? "Чек";
  const categoryMatch =
    categories.find((category) => category.id === categoryId) ??
    (categoryName ? resolveExpenseCategory(categoryName, categories) : null) ??
    resolveExpenseCategory(`${merchant ?? ""} ${description ?? ""} ${input.caption ?? ""}`, categories);
  const resolvedCategoryName = categoryMatch?.name ?? categoryName ?? null;
  const date = aiOperationDate(parsed.date, now) ?? extractOperationDate(input.caption ?? "", normalizeText(input.caption ?? ""), now);
  const suggestions = buildCategorySuggestions(
    `${categoryName ?? ""} ${merchant ?? ""} ${description ?? ""} ${input.caption ?? ""}`,
    categories,
    categoryMatch?.id,
  );

  return {
    amount,
    categoryId: categoryMatch?.id ?? null,
    categoryName: resolvedCategoryName,
    confidence: normalizeConfidence(parsed.confidence),
    currencyCode: positiveInteger(parsed.currencyCode) ?? 980,
    date: date.toISOString(),
    description,
    needsCategory: !categoryMatch && !resolvedCategoryName,
    sourceText: input.caption?.trim() ? `Фото чека: ${input.caption.trim()}` : "Фото чека",
    suggestions,
    type: "EXPENSE",
  };
}

function parseAiJson<T extends object = AiParsedIntent>(value: string): T | null {
  const cleaned = value
    .trim()
    .replace(/^```(?:json)?/iu, "")
    .replace(/```$/u, "")
    .trim();
  try {
    const parsed = JSON.parse(cleaned);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as T) : null;
  } catch {
    return null;
  }
}

function normalizeAiOperationType(value: unknown): TelegramOperationType | null {
  const normalized = asString(value)?.toUpperCase();
  if (normalized === "INCOME" || normalized === "EXPENSE") return normalized;
  if (normalized === "INCOMES") return "INCOME";
  if (normalized === "EXPENSES") return "EXPENSE";
  return null;
}

function inferAiReportTransactionType(intent?: string | null): TelegramOperationType | null {
  if (!intent) return null;
  if (intent.includes("income")) return "INCOME";
  if (intent.includes("expense")) return "EXPENSE";
  return null;
}

function normalizeAiReportType(value: unknown): TelegramReportType | null {
  const normalized = asString(value)?.toUpperCase();
  const aliases: Record<string, TelegramReportType> = {
    BALANCE: "BALANCE",
    BALANCE_REPORT: "BALANCE",
    CATEGORIES: "CATEGORIES",
    COMPARE: "COMPARE",
    COMPARE_CATEGORIES: "COMPARE_CATEGORIES",
    COMPARE_EXPENSES_BY_CATEGORY: "COMPARE_CATEGORIES",
    EXPENSES: "EXPENSES",
    EXPENSES_BY_CATEGORY: "CATEGORIES",
    EXPENSES_BY_CATEGORY_FILTERED: "CATEGORIES",
    EXPENSES_STATEMENT: "EXPENSES",
    INCOMES: "INCOMES",
    INCOMES_STATEMENT: "INCOMES",
    INCOMES_SUMMARY: "INCOMES",
    LATEST: "LATEST",
    LATEST_TRANSACTIONS: "LATEST",
    MONTHLY_SUMMARY: "MONTHLY_SUMMARY",
  };
  return normalized ? aliases[normalized] ?? null : null;
}

function reportTypeFromAiIntent(value?: string | null): TelegramReportType | null {
  if (!value) return null;
  if (value.includes("compare") && (value.includes("category") || value.includes("group"))) return "COMPARE_CATEGORIES";
  if (value.includes("category") || value.includes("group")) return "CATEGORIES";
  if (value.includes("balance")) return "BALANCE";
  if (value.includes("latest")) return "LATEST";
  if (value.includes("income")) return "INCOMES";
  if (value.includes("expense")) return "EXPENSES";
  return null;
}

function aiDateRange(parsed: AiParsedIntent, now: Date): TelegramDateRange {
  const period = parsed.period && typeof parsed.period === "object" && !Array.isArray(parsed.period) ? parsed.period as { from?: unknown; to?: unknown } : null;
  const rangeKey = asString(parsed.rangeKey);
  if (rangeKey === "today" || rangeKey === "yesterday" || rangeKey === "this_week" || rangeKey === "this_month" || rangeKey === "last_month") {
    return quickRange(rangeKey, now);
  }
  const from = aiOperationDate(parsed.from ?? parsed.periodFrom ?? period?.from, now);
  const to = aiOperationDate(parsed.to ?? parsed.periodTo ?? period?.to, now);
  if (from && to && from <= to) {
    return { from: startOfDay(from).toISOString(), label: `${formatDate(from)} - ${formatDate(to)}`, to: endOfDay(to).toISOString() };
  }
  return quickRange("this_month", now);
}

function aiOperationDate(value: unknown, now: Date): Date | null {
  const raw = asString(value);
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/u.test(raw)) {
    const [year, month, day] = raw.split("-").map(Number);
    const date = kyivDateToUtc(year ?? kyivDateParts(now).year, (month ?? 1) - 1, day ?? 1);
    return validDate(date) ? date : null;
  }
  const date = new Date(raw);
  return validDate(date) ? date : null;
}

function positiveAmount(value: unknown) {
  const amount = typeof value === "number" ? value : Number.parseFloat(asString(value)?.replace(/\s|\u00a0/g, "").replace(",", ".") ?? "");
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function positiveInteger(value: unknown) {
  const amount = typeof value === "number" ? value : Number.parseInt(asString(value) ?? "", 10);
  return Number.isInteger(amount) && amount > 0 ? Math.min(amount, 20) : null;
}

function normalizeConfidence(value: unknown) {
  const confidence = typeof value === "number" ? value : Number.parseFloat(asString(value) ?? "");
  return Number.isFinite(confidence) ? Math.min(Math.max(confidence, 0.1), 0.99) : 0.78;
}

function normalizeReceiptMimeType(mimeType?: string | null, fileName?: string | null) {
  if (mimeType && /^image\/(?:jpeg|jpg|png|webp)$/iu.test(mimeType)) {
    return mimeType.toLowerCase() === "image/jpg" ? "image/jpeg" : mimeType.toLowerCase();
  }
  const lowerName = fileName?.toLowerCase() ?? "";
  if (lowerName.endsWith(".png")) return "image/png";
  if (lowerName.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function resolveDefaultFinancialAccountId(userId?: string | null) {
  if (!userId) return null;
  const db = getDb();
  const primary = await db.financialAccount.findFirst({
    select: { id: true },
    where: { isActive: true, isPrimary: true, userId },
  });
  if (primary) return primary.id;

  const cash = await db.financialAccount.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { id: true },
    where: { isActive: true, type: "CASH", userId },
  });
  if (cash) return cash.id;

  return null;
}

export async function getTelegramConversationState(chatId: string, telegramUserId: string) {
  const state = await getDb().botConversationState.findUnique({
    where: {
      telegramChatId_telegramUserId: {
        telegramChatId: chatId,
        telegramUserId,
      },
    },
  });

  if (!state) {
    return null;
  }

  if (state.expiresAt <= new Date()) {
    await clearTelegramConversationState(chatId, telegramUserId);
    return null;
  }

  return {
    ...state,
    payload: state.payload as TelegramConversationPayload,
  };
}

export async function setTelegramConversationState(input: {
  chatId: string;
  kind: string;
  payload: TelegramConversationPayload;
  telegramUserId: string;
  userId?: string | null;
}) {
  const expiresAt = new Date(Date.now() + conversationTtlMs);
  return getDb().botConversationState.upsert({
    where: {
      telegramChatId_telegramUserId: {
        telegramChatId: input.chatId,
        telegramUserId: input.telegramUserId,
      },
    },
    update: {
      expiresAt,
      kind: input.kind,
      payload: input.payload as Prisma.InputJsonValue,
      userId: input.userId ?? null,
    },
    create: {
      expiresAt,
      kind: input.kind,
      payload: input.payload as Prisma.InputJsonValue,
      telegramChatId: input.chatId,
      telegramUserId: input.telegramUserId,
      userId: input.userId ?? null,
    },
  });
}

export async function clearTelegramConversationState(chatId: string, telegramUserId: string) {
  await getDb().botConversationState.deleteMany({
    where: {
      telegramChatId: chatId,
      telegramUserId,
    },
  });
}

export function renderTelegramDraft(draft: TelegramOperationDraft) {
  const typeLabel = draft.type === "EXPENSE" ? "витрату" : "дохід";
  const categoryLabel = draft.type === "EXPENSE" ? "Категорія" : "Джерело";
  const lines = [
    `<b>Підтвердити ${escapeTelegramHtml(typeLabel)}</b>`,
    "────────────",
    "",
    `• <b>Сума:</b> ${formatMoney(draft.amount)}`,
    `• <b>${escapeTelegramHtml(categoryLabel)}:</b> ${escapeTelegramHtml(draft.categoryName ?? "потрібно вибрати")}`,
    `• <b>Дата:</b> ${escapeTelegramHtml(formatDate(new Date(draft.date)))}`,
    `• <b>Опис:</b> ${escapeTelegramHtml(draft.description || draft.sourceText)}`,
  ];
  if (draft.needsCategory) {
    lines.push("", "<b>Потрібна категорія</b>", "Оберіть варіант кнопкою нижче або напишіть свою.");
  }
  return lines.join("\n");
}

export function updateDraftAmount(draft: TelegramOperationDraft, text: string): TelegramOperationDraft {
  const match = text.match(amountPattern);
  if (!match?.[1]) {
    throw new Error("Не бачу суму. Напишіть число, наприклад 560.");
  }
  const amount = Number.parseFloat(match[1].replace(/\s|\u00a0/g, "").replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Сума має бути додатним числом.");
  }
  return { ...draft, amount };
}

export async function updateDraftCategory(draft: TelegramOperationDraft, text: string, userId?: string | null): Promise<TelegramOperationDraft> {
  if (draft.type === "INCOME") {
    return {
      ...draft,
      categoryName: text.trim() || "Дохід",
      confidence: 0.9,
      needsCategory: false,
    };
  }

  const categories = await getCategoryLookup(userId);
  const match = resolveExpenseCategory(text, categories);
  if (!match) {
    const suggestions = buildCategorySuggestions(text, categories);
    if (!suggestions.length) {
      throw new Error("Не знайшов таку категорію. Спробуйте назву з налаштувань або натисніть одну з кнопок.");
    }
    return { ...draft, suggestions };
  }
  return {
    ...draft,
    categoryId: match.id,
    categoryName: match.name,
    confidence: 0.9,
    needsCategory: false,
  };
}

export function updateDraftDate(draft: TelegramOperationDraft, text: string, now = new Date()): TelegramOperationDraft {
  const normalized = normalizeText(text);
  const date = extractOperationDate(text, normalized, now);
  return { ...draft, date: date.toISOString() };
}

export async function buildTelegramReport(intent: Extract<TelegramAssistantIntent, { kind: "report" }>, userId?: string | null) {
  if (intent.reportType === "LATEST") {
    return renderLatestTransactions(userId, intent.limit ?? 10, intent.transactionType ?? null);
  }

  if (intent.reportType === "COMPARE" && intent.compareRange) {
    return renderComparisonReport(intent.range, intent.compareRange, userId);
  }

  if (intent.reportType === "COMPARE_CATEGORIES" && intent.compareRange) {
    return renderCategoryComparisonReport(intent.range, intent.compareRange, userId);
  }

  if (intent.reportType === "INCOMES") {
    return renderIncomeReport(intent.range, userId);
  }

  if (intent.reportType === "BALANCE") {
    return renderBalanceReport(intent.range, userId);
  }

  if (intent.reportType === "CATEGORIES") {
    return renderCategoryReport(intent.range, userId, intent.categoryName ?? null);
  }

  if (intent.reportType === "MONTHLY_SUMMARY") {
    return renderMonthlySummary(intent.range, userId);
  }

  return renderExpenseReport(intent.range, userId, intent.categoryName ?? null);
}

export function quickRange(key: "last_month" | "this_month" | "this_week" | "today" | "yesterday", now = new Date()): TelegramDateRange {
  if (key === "today") {
    const start = startOfDay(now);
    return { from: start.toISOString(), label: "сьогодні", to: endOfDay(now).toISOString() };
  }
  if (key === "yesterday") {
    const day = addDays(startOfDay(now), -1);
    return { from: day.toISOString(), label: "вчора", to: endOfDay(day).toISOString() };
  }
  if (key === "this_week") {
    const start = startOfWeek(now);
    return { from: start.toISOString(), label: "цей тиждень", to: endOfDay(now).toISOString() };
  }
  if (key === "last_month") {
    const parts = kyivDateParts(now);
    const start = kyivDateToUtc(parts.year, parts.month - 2, 1);
    const end = kyivDateToUtc(parts.year, parts.month - 1, 0, 23, 59, 59, 999);
    return { from: start.toISOString(), label: "минулий місяць", to: end.toISOString() };
  }
  const parts = kyivDateParts(now);
  const start = kyivDateToUtc(parts.year, parts.month - 1, 1);
  return { from: start.toISOString(), label: "цей місяць", to: endOfDay(now).toISOString() };
}

function parseReportIntent(text: string, normalized: string, now: Date): TelegramAssistantIntent | null {
  const hasReportWord =
    latestPattern.test(normalized) ||
    /(?:покажи|дай|скільки|витрат|дохід|доход|баланс|виписк|категор|груп|суми|розбив|розбий|структур|останні|операц|транзакц|підсумок|порівняй)/iu.test(normalized);
  if (!hasReportWord) {
    return null;
  }

  const range = parseDateRange(text, normalized, now);
  const limit = extractLimit(normalized);
  const categoryName = extractRequestedCategory(normalized);
  const wantsCategoryBreakdown = categoryBreakdownPattern.test(normalized) && !transactionListPattern.test(normalized);

  if (normalized.includes("порівняй")) {
    const ranges = parseComparisonRanges(normalized, now);
    if (categoryBreakdownPattern.test(normalized)) {
      return {
        kind: "report",
        compareRange: ranges?.[1] ?? previousSimilarRange(range),
        range: ranges?.[0] ?? range,
        reportType: "COMPARE_CATEGORIES",
      };
    }
    return {
      kind: "report",
      compareRange: ranges?.[1] ?? previousSimilarRange(range),
      range: ranges?.[0] ?? range,
      reportType: "COMPARE",
    };
  }

  if (latestPattern.test(normalized) || normalized.includes("операц") || normalized.includes("транзакц")) {
    return {
      kind: "report",
      limit,
      range,
      reportType: "LATEST",
      transactionType: inferReportTransactionType(normalized),
    };
  }
  if (normalized.includes("баланс")) {
    return { kind: "report", range, reportType: "BALANCE" };
  }
  if (wantsCategoryBreakdown || normalized.includes("категор")) {
    return { categoryName, kind: "report", range, reportType: "CATEGORIES" };
  }
  if (normalized.includes("підсумок")) {
    return { kind: "report", range, reportType: "MONTHLY_SUMMARY" };
  }
  if (normalized.includes("дохід") || normalized.includes("доход")) {
    return { kind: "report", range, reportType: "INCOMES" };
  }
  if (normalized.includes("витрат") || normalized.includes("виписк") || normalized.includes("витратив")) {
    if (isSingleCategoryTotalQuestion(normalized)) {
      return { categoryName, kind: "report", range, reportType: "CATEGORIES" };
    }
    return { categoryName, kind: "report", range, reportType: "EXPENSES" };
  }

  return null;
}

function parseDateRange(rawText: string, normalized: string, now: Date): TelegramDateRange {
  const explicitRange = parseExplicitRange(rawText, now);
  if (explicitRange) {
    return explicitRange;
  }

  if (normalized.includes("сьогодні")) return quickRange("today", now);
  if (normalized.includes("вчора")) return quickRange("yesterday", now);
  if (normalized.includes("минулий тиждень")) {
    const thisWeek = startOfWeek(now);
    const start = addDays(thisWeek, -7);
    const end = addDays(thisWeek, -1);
    return { from: start.toISOString(), label: "минулий тиждень", to: endOfDay(end).toISOString() };
  }
  if (normalized.includes("тиждень")) return quickRange("this_week", now);
  if (normalized.includes("минулий місяць")) return quickRange("last_month", now);

  const monthIndex = findMonthIndex(normalized);
  if (monthIndex >= 0) {
    return rangeForMonth(monthIndex, now);
  }

  return quickRange("this_month", now);
}

function parseExplicitRange(rawText: string, now: Date): TelegramDateRange | null {
  const normalized = normalizeText(rawText);
  const sameMonth = normalized.match(/(?:з\s*)?(\d{1,2})\s*(?:по|-|до)\s*(\d{1,2})\s+([а-яіїєґ]+)/iu);
  if (sameMonth?.[1] && sameMonth[2] && sameMonth[3]) {
    const monthIndex = findMonthIndex(sameMonth[3]);
    if (monthIndex >= 0) {
      const fromDay = Number(sameMonth[1]);
      const toDay = Number(sameMonth[2]);
      const year = kyivDateParts(now).year;
      const from = kyivDateToUtc(year, monthIndex, fromDay);
      const to = kyivDateToUtc(year, monthIndex, toDay, 23, 59, 59, 999);
      if (validDate(from) && validDate(to) && from <= to) {
        return { from: from.toISOString(), label: `${formatDate(from)} - ${formatDate(to)}`, to: to.toISOString() };
      }
    }
  }

  const dateMatches = [...rawText.matchAll(/\b(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?\b/gu)];
  if (dateMatches.length >= 2) {
    const firstMatch = dateMatches[0];
    const secondMatch = dateMatches[1];
    if (!firstMatch || !secondMatch) return null;
    const from = dateFromMatch(firstMatch, now);
    const to = dateFromMatch(secondMatch, now);
    if (from && to && from <= to) {
      return { from: startOfDay(from).toISOString(), label: `${formatDate(from)} - ${formatDate(to)}`, to: endOfDay(to).toISOString() };
    }
  }
  return null;
}

function parseComparisonRanges(normalized: string, now: Date): [TelegramDateRange, TelegramDateRange] | null {
  const months = monthNames
    .map((aliases, index) => ({ aliases, index }))
    .filter((month) => month.aliases.some((alias) => normalized.includes(alias)));
  if (months.length >= 2) {
    const firstMonth = months[0];
    const secondMonth = months[1];
    if (!firstMonth || !secondMonth) return null;
    return [rangeForMonth(firstMonth.index, now), rangeForMonth(secondMonth.index, now)];
  }
  return null;
}

function rangeForMonth(monthIndex: number, now: Date): TelegramDateRange {
  const year = kyivDateParts(now).year;
  const start = kyivDateToUtc(year, monthIndex, 1);
  const end = kyivDateToUtc(year, monthIndex + 1, 0, 23, 59, 59, 999);
  return { from: start.toISOString(), label: `${monthNames[monthIndex]?.[0] ?? "місяць"} ${year}`, to: end.toISOString() };
}

function previousSimilarRange(range: TelegramDateRange): TelegramDateRange {
  const from = new Date(range.from);
  const to = new Date(range.to);
  const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86_400_000));
  const previousTo = addDays(startOfDay(from), -1);
  const previousFrom = addDays(startOfDay(previousTo), -days + 1);
  return {
    from: previousFrom.toISOString(),
    label: `попередній період (${formatDate(previousFrom)} - ${formatDate(previousTo)})`,
    to: endOfDay(previousTo).toISOString(),
  };
}

function inferOperationType(normalized: string): TelegramOperationType {
  if (incomeHints.some((hint) => normalized.includes(hint))) return "INCOME";
  if (expenseHints.some((hint) => normalized.includes(hint))) return "EXPENSE";
  return "EXPENSE";
}

function isOperationWriteRequest(normalized: string, rawText: string, forcedType?: TelegramOperationType) {
  if (forcedType) return true;
  if (/(?:^|\s)(?:додай|додати|добав|добавити|запиши|записати|внеси|внести|створи|створити|зафіксуй|зафіксувати)(?:\s|$)/iu.test(normalized)) {
    return true;
  }
  if (/(?:^|\s)(?:я\s+)?(?:витратив|потратив|заплатив|купив|оплатив|отримав|заробив|прийшли)(?:\s|$)/iu.test(normalized)) {
    return true;
  }
  return /^(?:\s*)(?:витрат[аиу]?|дох(?:ід|оди))\s*[:—-]/iu.test(rawText);
}

function extractOperationDate(rawText: string, normalized: string, now: Date): Date {
  if (normalized.includes("позавчора")) return addDays(startOfDay(now), -2);
  if (normalized.includes("вчора")) return addDays(startOfDay(now), -1);
  const explicit = rawText.match(explicitDatePattern);
  if (explicit) {
    const date = dateFromMatch(explicit, now);
    if (date) return date;
  }
  return now;
}

function dateFromMatch(match: RegExpMatchArray, now: Date): Date | null {
  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const rawYear = match[3];
  const year = rawYear ? (rawYear.length === 2 ? 2000 + Number(rawYear) : Number(rawYear)) : kyivDateParts(now).year;
  const date = kyivDateToUtc(year, month, day);
  const parts = kyivDateParts(date);
  if (!validDate(date) || parts.day !== day || parts.month - 1 !== month || parts.year !== year) {
    return null;
  }
  return date;
}

function removeAmountAndCurrency(text: string, amountText: string) {
  return text.replace(amountText, " ").replace(/\b(?:грн|uah|гривень|гривні|гривня)\b/giu, " ");
}

function removeDateWords(text: string) {
  return text
    .replace(/\b(?:сьогодні|вчора|позавчора)\b/giu, " ")
    .replace(explicitDatePattern, " ");
}

function removeOperationWords(text: string) {
  return text
    .replace(/(?:^|\s)(?:запиши|записати|додай|додати|внеси|внести|витрату|витрати|дохід|доходи|отримав|отримала|зарплата|картка|карта|кеш|cash|card)(?=$|\s|[:\-–—])/giu, " ")
    .replace(/[:\-–—]+/gu, " ");
}

function resolveExpenseCategory(text: string, categories: CategoryLookup[]) {
  const normalized = normalizeText(text);
  const direct = findCategoryByAlias(normalized, categories) ?? findCategoryByAlias(firstToken(normalized), categories);
  if (direct) {
    return direct;
  }

  for (const hint of expenseCategoryHints) {
    if (hint.keys.some((key) => normalized.includes(key))) {
      const category = categories.find((item) => {
        const haystack = [item.name, item.slug, ...item.aliases].map(normalizeText).join(" ");
        return hint.categoryHints.some((categoryHint) => haystack.includes(normalizeText(categoryHint)));
      });
      if (category) return category;
    }
  }

  return null;
}

function buildCategorySuggestions(text: string, categories: CategoryLookup[], selectedId?: string | null) {
  const normalized = normalizeText(text);
  const visibleCategories = categories.filter((category) => !/�|\?{2,}/u.test(category.name));
  const candidates: CategoryLookup[] = [];

  if (selectedId) {
    const selected = visibleCategories.find((category) => category.id === selectedId);
    if (selected) candidates.push(selected);
  }

  for (const hint of expenseCategoryHints) {
    if (!hint.keys.some((key) => normalized.includes(key))) continue;
    for (const category of visibleCategories) {
      const haystack = [category.name, category.slug, ...category.aliases].map(normalizeText).join(" ");
      if (hint.categoryHints.some((categoryHint) => haystack.includes(normalizeText(categoryHint)))) {
        candidates.push(category);
      }
    }
  }

  for (const category of visibleCategories.slice(0, 8)) {
    candidates.push(category);
  }

  const unique = new Map<string, CategoryLookup>();
  for (const category of candidates) {
    unique.set(category.id, category);
  }
  return Array.from(unique.values())
    .slice(0, 6)
    .map((category) => ({
      categoryId: category.id,
      name: category.name,
    }));
}

function inferIncomeSource(text: string) {
  const normalized = normalizeText(text);
  if (normalized.includes("зарплат")) return "Зарплата";
  if (normalized.includes("фріланс")) return "Фріланс";
  if (normalized.includes("проект") || normalized.includes("проєкт")) return "Проєкт";
  if (normalized.includes("кешбек")) return "Кешбек";
  if (normalized.includes("повернення")) return "Повернення";
  if (normalized.includes("дивіденд")) return "Інвестиції";
  return firstMeaningfulText(text) || "Дохід";
}

function buildOperationDescription(cleanedText: string, categoryOrSource?: string | null) {
  const normalizedCategory = categoryOrSource ? normalizeText(categoryOrSource) : "";
  const parts = cleanedText
    .split(/\s+/)
    .filter((part) => part.trim())
    .filter((part) => normalizeText(part) !== normalizedCategory);
  const description = parts.join(" ").replace(/\s+/g, " ").trim();
  return description || null;
}

async function renderExpenseReport(range: TelegramDateRange, userId?: string | null, categoryName?: string | null) {
  const category = categoryName ? await findCategoryForReport(categoryName, userId) : null;
  const expenses = await getDb().expense.findMany({
    include: { category: true },
    orderBy: { date: "desc" },
    where: {
      date: dateWhere(range),
      ...(userId ? { userId } : {}),
      ...(category ? { categoryId: category.id } : {}),
    },
  });
  const total = sumDecimals(expenses.map((expense) => expense.amount));
  const title = category ? `Витрати на ${category.name}` : "Витрати";
  return [
    `<b>${escapeTelegramHtml(title)}</b>`,
    `Період: ${escapeTelegramHtml(range.label)}`,
    `Всього: <b>${formatMoney(total)}</b>`,
    `Операцій: ${expenses.length}`,
    "",
    expenses.length ? "<b>Список</b>" : "За цей період витрат немає.",
    ...expenses.slice(0, 10).map((expense, index) => {
      const label = expense.category?.name ?? "Без категорії";
      const description = expense.description ? `\n   ${escapeTelegramHtml(expense.description)}` : "";
      return `${index + 1}. <b>${escapeTelegramHtml(formatDate(expense.date))}</b> · ${escapeTelegramHtml(label)}\n   ${formatMoney(Number(expense.amount))}${description}`;
    }),
    expenses.length > 10 ? `\nПоказано 10 з ${expenses.length}. Повний список є у вебкабінеті.` : "",
  ].filter(Boolean).join("\n");
}

async function renderIncomeReport(range: TelegramDateRange, userId?: string | null) {
  const incomes = await getDb().income.findMany({
    orderBy: { date: "desc" },
    where: {
      date: dateWhere(range),
      ...(userId ? { userId } : {}),
    },
  });
  const total = sumDecimals(incomes.map((income) => income.amount));
  return [
    "<b>Доходи</b>",
    `Період: ${escapeTelegramHtml(range.label)}`,
    `Всього: <b>${formatMoney(total)}</b>`,
    `Операцій: ${incomes.length}`,
    "",
    incomes.length ? "<b>Список</b>" : "За цей період доходів немає.",
    ...incomes.slice(0, 10).map((income, index) => {
      const description = income.description ? `\n   ${escapeTelegramHtml(income.description)}` : "";
      return `${index + 1}. <b>${escapeTelegramHtml(formatDate(income.date))}</b> · ${escapeTelegramHtml(income.source)}\n   +${formatMoney(Number(income.amount))}${description}`;
    }),
  ].filter(Boolean).join("\n");
}

async function renderCategoryReport(range: TelegramDateRange, userId?: string | null, categoryName?: string | null) {
  const category = categoryName ? await findCategoryForReport(categoryName, userId) : null;
  const expenses = await getDb().expense.findMany({
    include: { category: true },
    where: {
      date: dateWhere(range),
      ...(userId ? { userId } : {}),
      ...(category ? { categoryId: category.id } : {}),
    },
  });
  const total = sumDecimals(expenses.map((expense) => expense.amount));
  const groups = groupBy(expenses, (expense) => expense.category?.name ?? "Без категорії");
  const rows = Array.from(groups.entries())
    .map(([name, rows]) => ({
      count: rows.length,
      name,
      total: sumDecimals(rows.map((expense) => expense.amount)),
    }))
    .sort((a, b) => b.total - a.total);
  const visibleRows = rows.slice(0, 20);

  if (!rows.length) {
    return category
      ? `<b>Витрати на ${escapeTelegramHtml(category.name)}</b>\nПеріод: ${escapeTelegramHtml(range.label)}\n\nЗа цей період витрат немає.`
      : `<b>Витрати по групах</b>\nПеріод: ${escapeTelegramHtml(range.label)}\n\nЗа цей період витрат немає.`;
  }

  const title = category ? `Витрати на ${category.name}` : "Витрати по групах";

  return [
    `<b>${escapeTelegramHtml(title)}</b>`,
    `Період: ${escapeTelegramHtml(range.label)}`,
    `Всього: <b>${formatMoney(total)}</b>`,
    "",
    ...visibleRows.map((row, index) => `${index + 1}. <b>${escapeTelegramHtml(row.name)}</b>\n   ${formatMoney(row.total)} / ${escapeTelegramHtml(formatOperationsCount(row.count))}`),
    "",
    `Разом: <b>${formatMoney(total)}</b>`,
    rows.length > visibleRows.length ? "Повний список доступний у вебкабінеті." : "",
  ].filter(Boolean).join("\n");
}

async function renderBalanceReport(range: TelegramDateRange, userId?: string | null) {
  const [expenses, incomes] = await Promise.all([
    getDb().expense.findMany({ where: { date: dateWhere(range), ...(userId ? { userId } : {}) } }),
    getDb().income.findMany({ where: { date: dateWhere(range), ...(userId ? { userId } : {}) } }),
  ]);
  const expenseTotal = sumDecimals(expenses.map((expense) => expense.amount));
  const incomeTotal = sumDecimals(incomes.map((income) => income.amount));
  return [
    "<b>Баланс</b>",
    `Період: ${escapeTelegramHtml(range.label)}`,
    "",
    `• <b>Доходи:</b> +${formatMoney(incomeTotal)}`,
    `• <b>Витрати:</b> -${formatMoney(expenseTotal)}`,
    `• <b>Різниця:</b> ${formatSignedMoney(incomeTotal - expenseTotal)}`,
  ].join("\n");
}

async function renderMonthlySummary(range: TelegramDateRange, userId?: string | null) {
  const [categoryReport, balanceReport] = await Promise.all([
    renderCategoryReport(range, userId),
    renderBalanceReport(range, userId),
  ]);
  return [`<b>Короткий підсумок</b>`, `Період: ${escapeTelegramHtml(range.label)}`, "", balanceReport, "", categoryReport].join("\n");
}

async function renderComparisonReport(first: TelegramDateRange, second: TelegramDateRange, userId?: string | null) {
  const [firstExpenses, secondExpenses] = await Promise.all([
    getDb().expense.findMany({ where: { date: dateWhere(first), ...(userId ? { userId } : {}) } }),
    getDb().expense.findMany({ where: { date: dateWhere(second), ...(userId ? { userId } : {}) } }),
  ]);
  const firstTotal = sumDecimals(firstExpenses.map((expense) => expense.amount));
  const secondTotal = sumDecimals(secondExpenses.map((expense) => expense.amount));
  const diff = firstTotal - secondTotal;
  const direction = diff > 0 ? "більше" : diff < 0 ? "менше" : "без змін";
  return [
    "<b>Порівняння витрат</b>",
    "",
    `• <b>${escapeTelegramHtml(first.label)}:</b> ${formatMoney(firstTotal)}`,
    `• <b>${escapeTelegramHtml(second.label)}:</b> ${formatMoney(secondTotal)}`,
    `• <b>Різниця:</b> ${formatMoney(Math.abs(diff))} ${escapeTelegramHtml(direction)} (${secondTotal ? Math.round((diff / secondTotal) * 100) : 0}%)`,
  ].join("\n");
}

async function renderCategoryComparisonReport(first: TelegramDateRange, second: TelegramDateRange, userId?: string | null) {
  const [firstExpenses, secondExpenses] = await Promise.all([
    getDb().expense.findMany({ include: { category: true }, where: { date: dateWhere(first), ...(userId ? { userId } : {}) } }),
    getDb().expense.findMany({ include: { category: true }, where: { date: dateWhere(second), ...(userId ? { userId } : {}) } }),
  ]);
  const firstGroups = totalsByCategory(firstExpenses);
  const secondGroups = totalsByCategory(secondExpenses);
  const names = Array.from(new Set([...firstGroups.keys(), ...secondGroups.keys()]));
  const rows = names
    .map((name) => {
      const firstTotal = firstGroups.get(name)?.total ?? 0;
      const secondTotal = secondGroups.get(name)?.total ?? 0;
      return {
        diff: secondTotal - firstTotal,
        firstTotal,
        name,
        secondTotal,
      };
    })
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  const firstTotal = sumDecimals(firstExpenses.map((expense) => expense.amount));
  const secondTotal = sumDecimals(secondExpenses.map((expense) => expense.amount));

  if (!rows.length) {
    return `<b>Порівняння витрат по групах</b>\n\nНемає витрат для порівняння за ${escapeTelegramHtml(first.label)} і ${escapeTelegramHtml(second.label)}.`;
  }

  return [
    "<b>Порівняння витрат по групах</b>",
    `${escapeTelegramHtml(first.label)} vs ${escapeTelegramHtml(second.label)}`,
    "",
    ...rows.slice(0, 20).map((row, index) => `${index + 1}. <b>${escapeTelegramHtml(row.name)}</b>\n   ${formatMoney(row.firstTotal)} / ${formatMoney(row.secondTotal)} / ${formatSignedMoney(row.diff)}`),
    "",
    `Разом: <b>${formatMoney(firstTotal)} / ${formatMoney(secondTotal)} / ${formatSignedMoney(secondTotal - firstTotal)}</b>`,
    rows.length > 20 ? "Повний список доступний у вебкабінеті." : "",
  ].filter(Boolean).join("\n");
}

async function renderLatestTransactions(userId?: string | null, limit = 10, transactionType?: TelegramOperationType | null) {
  const safeLimit = Math.min(Math.max(limit, 1), 20);
  if (transactionType === "EXPENSE") {
    const expenses = await getDb().expense.findMany({
      include: { category: true },
      orderBy: { date: "desc" },
      take: safeLimit,
      where: userId ? { userId } : {},
    });
    return [
      `<b>Останні ${expenses.length} витрат</b>`,
      "",
      ...expenses.map((expense, index) => `${index + 1}. <b>${escapeTelegramHtml(formatDate(expense.date))}</b> · ${escapeTelegramHtml(expense.category?.name ?? expense.description ?? "Витрата")}\n   -${formatMoney(Number(expense.amount))}`),
    ].join("\n");
  }

  if (transactionType === "INCOME") {
    const incomes = await getDb().income.findMany({
      orderBy: { date: "desc" },
      take: safeLimit,
      where: userId ? { userId } : {},
    });
    return [
      `<b>Останні ${incomes.length} доходів</b>`,
      "",
      ...incomes.map((income, index) => `${index + 1}. <b>${escapeTelegramHtml(formatDate(income.date))}</b> · ${escapeTelegramHtml(income.source)}\n   +${formatMoney(Number(income.amount))}`),
    ].join("\n");
  }

  const [expenses, incomes] = await Promise.all([
    getDb().expense.findMany({
      include: { category: true },
      orderBy: { date: "desc" },
      take: safeLimit,
      where: userId ? { userId } : {},
    }),
    getDb().income.findMany({
      orderBy: { date: "desc" },
      take: safeLimit,
      where: userId ? { userId } : {},
    }),
  ]);

  const rows = [
    ...expenses.map((expense) => ({
      amount: -Number(expense.amount),
      date: expense.date,
      label: expense.category?.name ?? expense.description ?? "Витрата",
    })),
    ...incomes.map((income) => ({
      amount: Number(income.amount),
      date: income.date,
      label: income.source,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, safeLimit);

  return [
    `<b>Останні ${rows.length} операцій</b>`,
    "",
    ...rows.map((row, index) => `${index + 1}. <b>${escapeTelegramHtml(formatDate(row.date))}</b> · ${escapeTelegramHtml(row.label)}\n   ${row.amount >= 0 ? "+" : "-"}${formatMoney(Math.abs(row.amount))}`),
  ].join("\n");
}

async function findCategoryForReport(categoryName: string, userId?: string | null) {
  const categories = await getCategoryLookup(userId);
  return resolveExpenseCategory(categoryName, categories);
}

function extractLimit(normalized: string) {
  const match = normalized.match(/\b(\d{1,2})\b/u);
  if (match?.[1]) return Math.min(Math.max(Number(match[1]), 1), 20);
  const wordLimits: Array<[RegExp, number]> = [
    [/(?:^|\s)(?:одну|один|перша?)(?:\s|$)/iu, 1],
    [/(?:^|\s)(?:дві|два)(?:\s|$)/iu, 2],
    [/(?:^|\s)три(?:\s|$)/iu, 3],
    [/(?:^|\s)чотири(?:\s|$)/iu, 4],
    [/(?:^|\s)(?:п'ять|п’ять|пять)(?:\s|$)/iu, 5],
    [/(?:^|\s)шість(?:\s|$)/iu, 6],
    [/(?:^|\s)сім(?:\s|$)/iu, 7],
    [/(?:^|\s)вісім(?:\s|$)/iu, 8],
    [/(?:^|\s)(?:дев'ять|дев’ять|девять)(?:\s|$)/iu, 9],
    [/(?:^|\s)десять(?:\s|$)/iu, 10],
    [/(?:^|\s)двадцять(?:\s|$)/iu, 20],
  ];
  return wordLimits.find(([pattern]) => pattern.test(normalized))?.[1] ?? 10;
}

function inferReportTransactionType(normalized: string): TelegramOperationType | null {
  if (normalized.includes("дохід") || normalized.includes("доход")) return "INCOME";
  if (normalized.includes("витрат") || normalized.includes("витратив") || normalized.includes("списан")) return "EXPENSE";
  return null;
}

function extractRequestedCategory(normalized: string) {
  const match = normalized.match(/(?:на|по)\s+([\p{L}\p{N}\s'’/-]+?)(?:\s+(?:за|цього|минулого|сьогодні|вчора)|$)/iu);
  const value = match?.[1]?.trim() || null;
  if (!value || categoryBreakdownPattern.test(value)) return null;
  return value.replace(/\b(?:з сумами|суми|разом|підсумок)\b/giu, "").trim() || null;
}

function isSingleCategoryTotalQuestion(normalized: string) {
  return normalized.includes("скільки") && /(?:^|\s)(?:на|по)\s+[\p{L}\p{N}'’/-]+/iu.test(normalized);
}

function findMonthIndex(value: string) {
  const normalized = normalizeText(value);
  return monthNames.findIndex((aliases) => aliases.some((alias) => normalized.includes(alias)));
}

function firstToken(value: string) {
  return value.trim().split(/\s+/)[0] ?? "";
}

function firstMeaningfulText(value: string) {
  return removeOperationWords(removeDateWords(value)).replace(amountPattern, "").trim();
}

function dateWhere(range: TelegramDateRange) {
  return {
    gte: new Date(range.from),
    lte: new Date(range.to),
  };
}

function startOfDay(date: Date) {
  const parts = kyivDateParts(date);
  return kyivDateToUtc(parts.year, parts.month - 1, parts.day);
}

function endOfDay(date: Date) {
  const parts = kyivDateParts(date);
  return kyivDateToUtc(parts.year, parts.month - 1, parts.day, 23, 59, 59, 999);
}

function startOfWeek(date: Date) {
  const start = startOfDay(date);
  const day = kyivWeekday(start) || 7;
  return addDays(start, 1 - day);
}

function addDays(date: Date, days: number) {
  const parts = kyivDateParts(date);
  return kyivDateToUtc(parts.year, parts.month - 1, parts.day + days);
}

function validDate(date: Date) {
  return !Number.isNaN(date.getTime());
}

function kyivDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: "Europe/Kyiv",
    year: "numeric",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return {
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    month: value("month"),
    second: value("second"),
    year: value("year"),
  };
}

function kyivDateToUtc(year: number, monthIndex: number, day: number, hour = 0, minute = 0, second = 0, millisecond = 0) {
  const guess = new Date(Date.UTC(year, monthIndex, day, hour, minute, second));
  return new Date(guess.getTime() - kyivOffsetMs(guess) + millisecond);
}

function kyivOffsetMs(date: Date) {
  const parts = kyivDateParts(date);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - date.getTime();
}

function kyivWeekday(date: Date) {
  const parts = kyivDateParts(date);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
}

function formatDate(date: Date) {
  return date.toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Kyiv",
  });
}

function escapeTelegramHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString("uk-UA").replace(/\u00a0/g, " ")} грн`;
}

function formatSignedMoney(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${formatMoney(Math.abs(value))}`;
}

function formatOperationsCount(value: number) {
  const lastTwo = value % 100;
  const last = value % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return `${value} операцій`;
  if (last === 1) return `${value} операція`;
  if (last >= 2 && last <= 4) return `${value} операції`;
  return `${value} операцій`;
}

function sumDecimals(values: Prisma.Decimal[]) {
  return values.reduce((sum, value) => sum + Number(value), 0);
}

function percent(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

function groupBy<T>(rows: T[], key: (row: T) => string) {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const groupKey = key(row);
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), row]);
  }
  return groups;
}

function totalsByCategory(rows: Array<{ amount: Prisma.Decimal; category?: { name: string } | null }>) {
  const totals = new Map<string, { count: number; total: number }>();
  for (const row of rows) {
    const name = row.category?.name ?? "Без категорії";
    const current = totals.get(name) ?? { count: 0, total: 0 };
    totals.set(name, {
      count: current.count + 1,
      total: current.total + Number(row.amount),
    });
  }
  return totals;
}
