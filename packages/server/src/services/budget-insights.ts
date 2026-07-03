import { Prisma } from "@prisma/client";
import { config } from "../config.js";
import { getDb } from "../db.js";
import { getOpenAIClient } from "./openai.js";

const budgetInsightCache = new Map<string, { expiresAt: number; value: string[] }>();

type BudgetInsightRow = {
  budget: number;
  category: string;
  color: string;
  icon: string;
  percent: number;
  remaining: number;
  spent: number;
};

export async function getBudgetInsights(userId?: string | null) {
  if (!userId) {
    return {
      aiGenerated: false,
      health: {
        label: "Налаштуйте бюджети",
        message: "Додайте хоча б один бюджет, щоб бачити контроль витрат.",
        score: 0,
      },
      overBudget: [],
      recentActivity: [],
      recommendations: ["Створіть перший бюджет і прив'яжіть його до категорії витрат."],
    };
  }

  const month = startOfMonth(new Date());
  const nextMonth = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1));

  const [budgets, expenses, auditLogs] = await Promise.all([
    getDb().budget.findMany({
      include: { category: true },
      orderBy: { name: "asc" },
      where: {
        month: {
          gte: month,
          lt: nextMonth,
        },
        userId,
      },
    }),
    getDb().expense.findMany({
      include: { category: true },
      orderBy: { date: "desc" },
      where: {
        date: {
          gte: month,
          lt: nextMonth,
        },
        userId,
      },
    }),
    getDb().auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      where: {
        entityType: "budget",
        userId,
      },
    }),
  ]);

  const rows = budgets.map((budget) => {
    const spent = expenses
      .filter((expense) => expense.categoryId === budget.categoryId)
      .reduce((sum, expense) => sum + Number(expense.amount), 0);
    const limit = Number(budget.limit);
    return {
      budget: limit,
      category: budget.category?.name ?? budget.name,
      color: budget.category?.color ?? budget.color,
      icon: budget.category?.icon ?? "wallet",
      percent: limit ? Math.round((spent / limit) * 100) : 0,
      remaining: limit - spent,
      spent,
    };
  });

  const totalBudget = rows.reduce((sum, row) => sum + row.budget, 0);
  const totalSpent = rows.reduce((sum, row) => sum + row.spent, 0);
  const overBudget = rows
    .filter((row) => row.spent > row.budget)
    .sort((left, right) => right.spent - right.budget - (left.spent - left.budget))
    .map((row) => ({
      amount: row.spent - row.budget,
      category: row.category,
      percent: row.percent,
    }));

  const health = buildBudgetHealth(rows, totalBudget, totalSpent);
  const recentActivity = auditLogs.map((log) => formatBudgetAuditLog(log));
  const aiResult = await buildBudgetRecommendationsWithAi({
    rows,
    totalBudget,
    totalSpent,
    userId,
  }).catch(() => null);

  return {
    aiGenerated: Boolean(aiResult?.length),
    health,
    overBudget,
    recentActivity,
    recommendations: aiResult?.length ? aiResult : buildFallbackBudgetRecommendations(rows, totalBudget, totalSpent),
  };
}

async function buildBudgetRecommendationsWithAi(input: {
  rows: BudgetInsightRow[];
  totalBudget: number;
  totalSpent: number;
  userId: string;
}) {
  if (!input.rows.length) {
    return ["Створіть перший бюджет для ключових категорій, щоб AI міг давати точні поради."];
  }

  const cacheKey = `${input.userId}:${monthKey(new Date())}:${JSON.stringify(
    input.rows.map((row) => [row.category, row.budget, row.spent, row.percent, row.remaining]),
  )}`;
  const cached = budgetInsightCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const client = await getOpenAIClient(input.userId);
  const response = await client.responses.create({
    input: [
      {
        content:
          "You are a budgeting analyst for a personal finance app. Respond in Ukrainian. Return only valid JSON: an array of 3 short recommendation strings. Use only the provided data. No markdown. No code fences.",
        role: "system",
      },
      {
        content: JSON.stringify({
          month: monthKey(new Date()),
          rows: input.rows.map((row) => ({
            budget: row.budget,
            category: row.category,
            percent: row.percent,
            remaining: row.remaining,
            spent: row.spent,
          })),
          totalBudget: input.totalBudget,
          totalSpent: input.totalSpent,
        }),
        role: "user",
      },
    ],
    model: config.OPENAI_MODEL,
  });

  const parsed = parseRecommendationArray(response.output_text ?? "");
  if (parsed.length) {
    const recommendations = parsed.slice(0, 3);
    budgetInsightCache.set(cacheKey, {
      expiresAt: Date.now() + 10 * 60 * 1000,
      value: recommendations,
    });
    return recommendations;
  }
  return null;
}

function parseRecommendationArray(value: string) {
  const trimmed = value.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
  try {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean)
      .slice(0, 3);
  } catch {
    return trimmed
      .split(/\r?\n/)
      .map((line) => line.replace(/^[-*\d.\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 3);
  }
}

function buildFallbackBudgetRecommendations(rows: BudgetInsightRow[], totalBudget: number, totalSpent: number) {
  if (!rows.length) {
    return ["Створіть перший бюджет для категорій з найбільшими витратами, щоб почати контроль."];
  }

  const result: string[] = [];
  const overBudget = rows
    .filter((row) => row.spent > row.budget)
    .sort((left, right) => right.spent - right.budget - (left.spent - left.budget));
  const nearLimit = rows
    .filter((row) => row.percent >= 85 && row.spent <= row.budget)
    .sort((left, right) => right.percent - left.percent);
  const safe = rows
    .filter((row) => row.percent > 0 && row.percent <= 60)
    .sort((left, right) => left.percent - right.percent);

  if (overBudget[0]) {
    result.push(
      `${overBudget[0].category} перевищив бюджет на ${formatMoney(overBudget[0].spent - overBudget[0].budget)}. Варто переглянути ліміт або обмежити витрати до кінця місяця.`,
    );
  }
  if (nearLimit[0]) {
    result.push(
      `${nearLimit[0].category} вже використав ${nearLimit[0].percent}% бюджету. Залишилось ${formatMoney(Math.max(nearLimit[0].remaining, 0))}.`,
    );
  }
  if (safe[0]) {
    result.push(
      `${safe[0].category} тримається в межах плану: використано лише ${safe[0].percent}% бюджету. Це хороший резерв на кінець місяця.`,
    );
  }
  if (!result.length) {
    const utilization = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    result.push(`Загалом використано ${utilization}% місячного бюджету. Поки структура витрат виглядає керованою.`);
  }

  return result.slice(0, 3);
}

function buildBudgetHealth(rows: BudgetInsightRow[], totalBudget: number, totalSpent: number) {
  if (!rows.length || totalBudget <= 0) {
    return {
      label: "Немає бюджету",
      message: "Додайте бюджети для основних категорій, щоб бачити оцінку фінансової дисципліни.",
      score: 0,
    };
  }

  const overCount = rows.filter((row) => row.spent > row.budget).length;
  const nearLimitCount = rows.filter((row) => row.percent >= 85 && row.spent <= row.budget).length;
  const utilization = totalSpent / totalBudget;
  const overspendPenalty = Math.max(0, utilization - 1) * 55;
  const nearLimitPenalty = nearLimitCount * 4;
  const overPenalty = overCount * 10;
  const score = clamp(Math.round(100 - overspendPenalty - nearLimitPenalty - overPenalty), 18, 98);

  if (score >= 85) {
    return {
      label: "Відмінно",
      message: "Більшість категорій іде в межах бюджету, запас до кінця місяця хороший.",
      score,
    };
  }
  if (score >= 70) {
    return {
      label: "Добре",
      message: "Контроль бюджету стабільний, але кілька категорій уже близькі до ліміту.",
      score,
    };
  }
  if (score >= 50) {
    return {
      label: "Увага",
      message: "Є категорії, де бюджет майже вичерпано або вже є перевищення. Краще скоригувати план.",
      score,
    };
  }
  return {
    label: "Ризик",
    message: "Бюджет зараз під тиском: кілька категорій уже перевищені, потрібне швидке коригування.",
    score,
  };
}

function formatBudgetAuditLog(log: {
  action: string;
  createdAt: Date;
  metadata: Prisma.JsonValue | null;
}) {
  const metadata =
    log.metadata && typeof log.metadata === "object" && !Array.isArray(log.metadata)
      ? (log.metadata as Record<string, unknown>)
      : {};
  const budgetName = typeof metadata.name === "string" && metadata.name.trim() ? metadata.name.trim() : "бюджет";
  const actionMap: Record<string, string> = {
    "budget.created": `Створено бюджет ${budgetName}`,
    "budget.deleted": `Видалено бюджет ${budgetName}`,
    "budget.synced": "Синхронізовано бюджети з попереднього місяця",
    "budget.updated": `Оновлено бюджет ${budgetName}`,
  };
  return `${actionMap[log.action] ?? "Оновлено бюджет"} · ${formatDateTime(log.createdAt)}`;
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(value);
}

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString("uk-UA")} ₴`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
