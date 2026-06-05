import { Prisma } from "@prisma/client";
import { normalizeAlias, normalizeText } from "@resource-manager/shared";
import { config } from "../config.js";
import { getDb } from "../db.js";
import { getOpenAIClient } from "./openai.js";

type ExpenseForClassification = Prisma.ExpenseGetPayload<{
  include: {
    monoTransaction: true;
  };
}>;

type AiCategoryAssignment = {
  aliases?: string[];
  categoryName?: string;
  confidence?: number;
  dashboardGroup?: string;
  expenseId?: string;
  icon?: string;
  reason?: string;
};

type AiCategoryResponse = {
  assignments?: AiCategoryAssignment[];
};

type ClassificationResult = {
  classified: number;
  createdCategories: number;
  skipped: boolean;
};

const CLASSIFICATION_BATCH_SIZE = 20;
const AI_CLASSIFICATION_TIMEOUT_MS = 45_000;
const MIN_CONFIDENCE_TO_APPLY = 0.45;
const CATEGORY_ICONS = new Set([
  "book",
  "car",
  "cart",
  "expenses",
  "fuel",
  "gift",
  "heart",
  "home",
  "income",
  "lightbulb",
  "medical",
  "openai",
  "pet",
  "phone",
  "plane",
  "receipt",
  "shirt",
  "smile",
  "subscriptions",
  "wallet",
]);

/**
 * Fast-path: match uncategorized monobank expenses against existing category aliases.
 * Runs before AI so that user-learned and seed aliases are applied immediately.
 * Returns number of expenses matched.
 */
export async function applyAliasCategories(input: {
  expenseIds?: string[];
  userId?: string | null;
} = {}): Promise<number> {
  const userId = input.userId ?? null;

  const aliasRows = await getDb().categoryAlias.findMany({
    select: { categoryId: true, normalizedAlias: true },
    where: {
      category: {
        isActive: true,
        ...(userId ? { OR: [{ userId }, { userId: null }] } : {}),
      },
    },
  });

  if (!aliasRows.length) return 0;

  const expenses = await getDb().expense.findMany({
    include: { monoTransaction: true },
    where: {
      categoryId: null,
      manualOverride: false,
      monoTransactionId: { not: null },
      ...(input.expenseIds?.length ? { id: { in: input.expenseIds } } : {}),
      ...(userId ? { userId } : {}),
    },
  });

  if (!expenses.length) return 0;

  let matched = 0;

  for (const expense of expenses) {
    const candidateTexts = [
      expense.monoTransaction?.counterName,
      expense.description,
      expense.monoTransaction?.comment,
    ].filter((v): v is string => Boolean(v));

    let matchedCategoryId: string | null = null;

    outer: for (const text of candidateTexts) {
      const normalizedText = normalizeAlias(text);
      if (!normalizedText) continue;
      for (const { normalizedAlias, categoryId } of aliasRows) {
        if (!normalizedAlias) continue;
        // Exact match or alias is a meaningful substring of the description
        if (
          normalizedText === normalizedAlias ||
          (normalizedAlias.length >= 4 && normalizedText.includes(normalizedAlias))
        ) {
          matchedCategoryId = categoryId;
          break outer;
        }
      }
    }

    if (matchedCategoryId) {
      await getDb().expense.update({
        data: { categoryId: matchedCategoryId, confidence: new Prisma.Decimal(95) },
        where: { id: expense.id },
      });
      matched++;
    }
  }

  return matched;
}

/**
 * When a user manually categorizes a monobank expense, save the merchant
 * description and counterName as aliases so future similar transactions
 * are matched automatically (without AI).
 */
export async function recordManualCategoryAlias(expenseId: string, categoryId: string): Promise<void> {
  const expense = await getDb().expense.findUnique({
    where: { id: expenseId },
    include: { monoTransaction: { select: { counterName: true } } },
  });
  if (!expense?.monoTransactionId) return;

  const aliases = [
    expense.monoTransaction?.counterName,
    expense.description,
  ].filter((v): v is string => Boolean(v && v.trim()));

  await ensureCategoryAliases(categoryId, aliases);
}

export async function classifyMonobankExpenses(input: {
  expenseIds?: string[];
  limit?: number;
  userId?: string | null;
} = {}): Promise<ClassificationResult> {
  const userId = input.userId ?? null;
  const limit = input.limit ?? CLASSIFICATION_BATCH_SIZE;

  // Fast-path: assign categories by alias matching before calling AI
  await applyAliasCategories({ expenseIds: input.expenseIds, userId });

  const expenses = await getDb().expense.findMany({
    include: { monoTransaction: true },
    orderBy: { date: "desc" },
    take: limit,
    where: {
      categoryId: null,
      manualOverride: false,
      monoTransactionId: { not: null },
      sourceStatus: { in: ["MONO_ONLY", "NEEDS_REVIEW"] },
      ...(input.expenseIds?.length ? { id: { in: input.expenseIds } } : {}),
      ...(userId ? { userId } : {}),
    },
  });

  if (!expenses.length) {
    return { classified: 0, createdCategories: 0, skipped: false };
  }

  let client;
  try {
    client = await getOpenAIClient(userId);
  } catch (error) {
    if (isConfigurationError(error)) {
      return { classified: 0, createdCategories: 0, skipped: true };
    }
    throw error;
  }

  const categories = await getDb().category.findMany({
    include: { aliases: true },
    orderBy: { name: "asc" },
    where: {
      isActive: true,
      ...(userId ? { OR: [{ userId }, { userId: null }] } : {}),
    },
  });

  const parsed = await requestAiCategoryResponse(client, expenses, categories);
  const assignments = parsed.assignments ?? [];
  let classified = 0;
  let createdCategories = 0;

  for (const assignment of assignments) {
    if (!assignment.expenseId || !assignment.categoryName) {
      continue;
    }

    const expense = expenses.find((item) => item.id === assignment.expenseId);
    if (!expense) {
      continue;
    }

    const confidence = normalizeConfidence(assignment.confidence);
    if (confidence < MIN_CONFIDENCE_TO_APPLY) {
      await getDb().expense.update({
        data: { confidence: new Prisma.Decimal(Math.round(confidence * 100)) },
        where: { id: expense.id },
      });
      continue;
    }

    const category = await ensureAiCategory({
      aliases: merchantAliases(expense, assignment.aliases),
      dashboardGroup: assignment.dashboardGroup,
      icon: assignment.icon,
      name: assignment.categoryName,
      userId,
    });
    if (category.created) {
      createdCategories += 1;
    }

    await getDb().expense.update({
      data: {
        categoryId: category.id,
        confidence: new Prisma.Decimal(Math.round(confidence * 100)),
      },
      where: { id: expense.id },
    });
    classified += 1;
  }

  let skipped = false;
  if (!input.expenseIds?.length && expenses.length === limit && classified > 0) {
    const next = await classifyMonobankExpenses({ limit, userId }).catch((error) => {
      if (isTimeoutError(error)) {
        return { classified: 0, createdCategories: 0, skipped: true };
      }
      throw error;
    });
    classified += next.classified;
    createdCategories += next.createdCategories;
    skipped = next.skipped;
  }

  return { classified, createdCategories, skipped };
}

async function requestAiCategoryResponse(
  client: Awaited<ReturnType<typeof getOpenAIClient>>,
  expenses: ExpenseForClassification[],
  categories: Array<{
    aliases: Array<{ alias: string }>;
    dashboardGroup: string;
    icon: string;
    name: string;
    slug: string;
  }>,
) {
  const response = await client.responses.create(
    {
      input: buildClassificationPrompt(expenses, categories),
      model: config.OPENAI_MODEL,
    },
    {
      maxRetries: 0,
      timeout: AI_CLASSIFICATION_TIMEOUT_MS,
    },
  );
  return parseAiCategoryResponse(response.output_text);
}

function buildClassificationPrompt(
  expenses: ExpenseForClassification[],
  categories: Array<{
    aliases: Array<{ alias: string }>;
    dashboardGroup: string;
    icon: string;
    name: string;
    slug: string;
  }>,
) {
  return [
    {
      role: "system" as const,
      content:
        "Ти класифікатор банківських витрат FinTrack. Працюй українською. Твоє завдання: згрупувати monobank-транзакції у зрозумілі категорії витрат, підібрати або запропонувати назви груп, і повернути тільки валідний JSON без markdown.",
    },
    {
      role: "user" as const,
      content: JSON.stringify({
        allowedIcons: Array.from(CATEGORY_ICONS),
        existingCategories: categories.map((category) => ({
          aliases: category.aliases.map((alias) => alias.alias),
          dashboardGroup: category.dashboardGroup,
          icon: category.icon,
          name: category.name,
          slug: category.slug,
        })),
        instructions: [
          "Використовуй поля description і counterName як основний сигнал для визначення категорії транзакції.",
          "Якщо витрата добре підходить до існуючої категорії — використай її name.",
          "Якщо кілька схожих merchant/description добре підходять до нової категорії — запропонуй коротку нову categoryName українською.",
          "Якщо категорія незрозуміла або транзакція одинична і нетипова — поверни confidence нижче 0.45. НЕ використовуй 'Інше' як замінник: краще залишити витрату без категорії.",
          "confidence має бути від 0 до 1; присвоюй лише коли впевнений (>= 0.45).",
          "dashboardGroup має бути короткою групою, наприклад: Побутові витрати, Транспорт, Робота / софт, Догляд, Здоров'я, Розваги, Інше.",
          "icon обери тільки з allowedIcons.",
        ],
        responseShape: {
          assignments: [
            {
              aliases: ["merchant alias"],
              categoryName: "Їжа",
              confidence: 0.92,
              dashboardGroup: "Побутові витрати",
              expenseId: "expense id",
              icon: "cart",
              reason: "short reason",
            },
          ],
        },
        transactions: expenses.map((expense) => ({
          amount: Number(expense.amount),
          comment: expense.monoTransaction?.comment ?? null,
          counterName: expense.monoTransaction?.counterName ?? null,
          currencyCode: expense.currencyCode,
          date: expense.date.toISOString(),
          description: expense.description,
          expenseId: expense.id,
          mcc: expense.monoTransaction?.mcc ?? null,
          originalMcc: expense.monoTransaction?.originalMcc ?? null,
        })),
      }),
    },
  ];
}

async function ensureAiCategory(input: {
  aliases: string[];
  dashboardGroup?: string;
  icon?: string;
  name: string;
  userId: string | null;
}): Promise<{ created: boolean; id: string }> {
  const db = getDb();
  const name = sanitizeCategoryName(input.name);
  const normalizedName = normalizeText(name);
  const existing = await db.category.findFirst({
    where: {
      AND: [
        { isActive: true },
        input.userId ? { OR: [{ userId: input.userId }, { userId: null }] } : {},
        {
          OR: [
            { name: { equals: name, mode: "insensitive" } },
            { aliases: { some: { normalizedAlias: normalizedName } } },
          ],
        },
      ],
    },
  });

  if (existing) {
    await ensureCategoryAliases(existing.id, input.aliases);
    return { created: false, id: existing.id };
  }

  const icon = normalizeIcon(input.icon, name);
  const category = await db.category.create({
    data: {
      color: categoryColorForIcon(icon),
      dashboardGroup: input.dashboardGroup?.trim() || "Користувацькі",
      icon,
      name,
      slug: `${slugify(name)}-${randomSuffix()}`,
      userId: input.userId,
    },
  });
  await ensureCategoryAliases(category.id, [name, ...input.aliases]);
  return { created: true, id: category.id };
}

async function ensureCategoryAliases(categoryId: string, aliases: string[]) {
  for (const alias of uniqueClean(aliases)) {
    const normalizedAlias = normalizeAlias(alias);
    if (!normalizedAlias) {
      continue;
    }
    const existing = await getDb().categoryAlias.findUnique({
      where: { normalizedAlias },
    });
    if (existing) {
      continue;
    }
    await getDb().categoryAlias.create({
      data: {
        alias,
        categoryId,
        normalizedAlias,
      },
    });
  }
}

function parseAiCategoryResponse(text: string): AiCategoryResponse {
  const source = text.trim();
  const json = source.startsWith("{") ? source : source.match(/\{[\s\S]*\}/)?.[0];
  if (!json) {
    throw new Error("AI categorization returned no JSON");
  }

  const parsed = JSON.parse(json) as AiCategoryResponse;
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.assignments)) {
    throw new Error("AI categorization JSON has invalid shape");
  }
  return parsed;
}

function merchantAliases(expense: ExpenseForClassification, aliases?: string[]) {
  return uniqueClean([
    ...(aliases ?? []),
    expense.description ?? "",
    expense.monoTransaction?.counterName ?? "",
  ]).slice(0, 5);
}

function sanitizeCategoryName(value: string) {
  const name = value.trim().replace(/\s+/g, " ").slice(0, 80);
  return name || "Інше";
}

function normalizeConfidence(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return 0.5;
  }
  if (numeric > 1) {
    return Math.max(0, Math.min(1, numeric / 100));
  }
  return Math.max(0, Math.min(1, numeric));
}

function isConfigurationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /not configured|api key/i.test(message);
}

function isTimeoutError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /abort|aborted|timeout|timed out/i.test(message);
}

function uniqueClean(values: string[]) {
  const map = new Map<string, string>();
  for (const value of values) {
    const clean = value.trim().replace(/\s+/g, " ");
    const normalized = normalizeText(clean);
    if (clean && normalized && !map.has(normalized)) {
      map.set(normalized, clean.slice(0, 80));
    }
  }
  return Array.from(map.values());
}

function normalizeIcon(icon?: string | null, name?: string) {
  if (icon && CATEGORY_ICONS.has(icon)) {
    return icon;
  }
  return inferCategoryIcon(name ?? "");
}

function inferCategoryIcon(category: string | null) {
  const normalized = normalizeText(category ?? "");
  if (includesAny(normalized, ["їж", "хав", "продукт", "кафе", "ресторан", "сільпо", "novus", "атб"])) return "cart";
  if (includesAny(normalized, ["транспорт", "авто", "bolt", "таксі", "метро"])) return "car";
  if (includesAny(normalized, ["палив", "wog", "окко", "бенз"])) return "fuel";
  if (includesAny(normalized, ["комун", "дім", "житло", "київгаз", "електро"])) return "home";
  if (includesAny(normalized, ["підпис", "ai", "аі", "софт", "saas"])) return "subscriptions";
  if (includesAny(normalized, ["лік", "аптек", "здоров"])) return "medical";
  if (includesAny(normalized, ["донат", "збір", "благод"])) return "heart";
  if (includesAny(normalized, ["свято", "подар"])) return "gift";
  if (includesAny(normalized, ["подорож", "відпуст", "готель"])) return "plane";
  if (includesAny(normalized, ["освіт", "навчан", "курс"])) return "book";
  if (includesAny(normalized, ["звяз", "телефон", "мобіль"])) return "phone";
  if (includesAny(normalized, ["розва", "кіно", "відпоч", "netflix", "spotify"])) return "smile";
  return "expenses";
}

function categoryColorForIcon(icon?: string | null) {
  const colors: Record<string, string> = {
    book: "#7c3aed",
    car: "#06b6d4",
    cart: "#22c55e",
    expenses: "#64748b",
    fuel: "#64748b",
    gift: "#f97316",
    heart: "#ec4899",
    home: "#3b82f6",
    income: "#22c55e",
    lightbulb: "#f59e0b",
    medical: "#ef4444",
    openai: "#0ea5e9",
    pet: "#a855f7",
    phone: "#84cc16",
    plane: "#2563eb",
    receipt: "#64748b",
    shirt: "#14b8a6",
    smile: "#8b5cf6",
    subscriptions: "#f59e0b",
    wallet: "#22c55e",
  };
  return colors[normalizeIcon(icon)] ?? "#22c55e";
}

function includesAny(value: string, needles: string[]) {
  return needles.some((needle) => value.includes(needle));
}

function slugify(value: string) {
  const normalized = normalizeText(value)
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "category";
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}
