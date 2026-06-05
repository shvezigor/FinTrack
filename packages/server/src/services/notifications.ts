import { Prisma } from "@prisma/client";
import { config } from "../config.js";
import { getDb } from "../db.js";

const LARGE_EXPENSE_THRESHOLD = 1000;
const BUDGET_WARNING_THRESHOLD = 80;
const MARKETING_TIP_HOUR = 10;
const WEEKLY_REPORT_HOUR = 9;

const NOTIFICATION_DEFAULTS = {
  budget_reminders: true,
  expense_alerts: true,
  goal_progress: true,
  marketing: false,
  weekly_report: true,
} as const;

type NotificationKey = keyof typeof NOTIFICATION_DEFAULTS;
type NotificationSeverity = "info" | "success" | "warning";

type CreateNotificationInput = {
  actionLabel?: string;
  actionUrl?: string;
  dedupeKey?: string;
  key: NotificationKey;
  message: string;
  metadata?: Record<string, unknown>;
  severity?: NotificationSeverity;
  title: string;
  userId: string;
};

export async function listUserNotifications(userId: string, limit = 12) {
  return fetchNotificationFeed(userId, limit);
}

export async function countUnreadNotifications(userId: string) {
  return getDb().userNotification.count({
    where: {
      isRead: false,
      userId,
    },
  });
}

export async function markNotificationRead(userId: string, notificationId: string) {
  await getDb().userNotification.updateMany({
    data: {
      isRead: true,
      readAt: new Date(),
    },
    where: {
      id: notificationId,
      userId,
    },
  });
  return { ok: true };
}

export async function markAllNotificationsRead(userId: string) {
  await getDb().userNotification.updateMany({
    data: {
      isRead: true,
      readAt: new Date(),
    },
    where: {
      isRead: false,
      userId,
    },
  });
  return { ok: true };
}

export async function maybeCreateExpenseAlert(expenseId: string, userId?: string | null) {
  const expense = await getDb().expense.findFirst({
    include: { category: true },
    where: {
      id: expenseId,
      ...(userId ? { userId } : {}),
    },
  });

  if (!expense?.userId || Number(expense.amount) < LARGE_EXPENSE_THRESHOLD) {
    return null;
  }

  const preferences = await getNotificationPreferences(expense.userId);
  if (!preferences.expense_alerts) {
    return null;
  }

  const categoryName = expense.category?.name ?? "Без категорії";
  return createNotification({
    actionLabel: "Відкрити витрати",
    actionUrl: "#expenses",
    dedupeKey: `expense_alert:${expense.id}`,
    key: "expense_alerts",
    message: `${categoryName}: ${formatMoney(Number(expense.amount))}`,
    metadata: {
      amount: Number(expense.amount),
      category: categoryName,
      expenseId: expense.id,
    },
    severity: "warning",
    title: "Велика витрата",
    userId: expense.userId,
  });
}

export async function runNotificationSweep(now = new Date()) {
  const users = await getDb().user.findMany({
    select: {
      id: true,
      notificationPreferences: {
        select: {
          enabled: true,
          key: true,
        },
      },
      preferences: {
        select: {
          timezone: true,
        },
      },
    },
  });

  let created = 0;
  for (const user of users) {
    const preferences = mergeNotificationPreferences(user.notificationPreferences);
    const timeZone = user.preferences?.timezone ?? config.TIMEZONE;

    created += await maybeCreateWeeklyReport(user.id, preferences, timeZone, now);
    created += await maybeCreateBudgetReminders(user.id, preferences, now);
    created += await maybeCreateGoalProgress(user.id, preferences);
    created += await maybeCreateMarketingTip(user.id, preferences, timeZone, now);
  }

  return created;
}

export async function deliverPendingTelegramNotifications(limit = 20) {
  if (!config.TELEGRAM_BOT_TOKEN.trim()) {
    return 0;
  }

  const pending = await getDb().userNotification.findMany({
    include: {
      user: {
        select: {
          telegramAccounts: {
            orderBy: { updatedAt: "desc" },
            select: {
              telegramChatId: true,
            },
            where: {
              telegramChatId: { not: null },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
    where: {
      deliverTelegram: true,
      telegramSentAt: null,
    },
  });

  let delivered = 0;
  for (const notification of pending) {
    const chatId = notification.user.telegramAccounts[0]?.telegramChatId;
    if (!chatId) {
      await getDb().userNotification.update({
        data: {
          deliverTelegram: false,
          telegramError: "Linked Telegram chat was not found",
        },
        where: { id: notification.id },
      });
      continue;
    }

    try {
      await sendTelegramNotification(chatId, notification);
      await getDb().userNotification.update({
        data: {
          telegramError: null,
          telegramSentAt: new Date(),
        },
        where: { id: notification.id },
      });
      delivered += 1;
    } catch (error) {
      await getDb().userNotification.update({
        data: {
          telegramError: error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500),
        },
        where: { id: notification.id },
      });
    }
  }

  return delivered;
}

async function maybeCreateWeeklyReport(userId: string, preferences: Record<NotificationKey, boolean>, timeZone: string, now: Date) {
  if (!preferences.weekly_report) {
    return 0;
  }

  const local = localDateInfo(now, timeZone);
  if (local.weekday !== "Mon" || local.hour < WEEKLY_REPORT_HOUR) {
    return 0;
  }

  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const expenses = await getDb().expense.findMany({
    include: { category: true },
    where: {
      date: { gte: start },
      userId,
    },
  });

  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const byCategory = new Map<string, number>();
  for (const expense of expenses) {
    const key = expense.category?.name ?? "Без категорії";
    byCategory.set(key, (byCategory.get(key) ?? 0) + Number(expense.amount));
  }

  const topCategory = Array.from(byCategory.entries()).sort((left, right) => right[1] - left[1])[0];
  const message = expenses.length
    ? `За 7 днів: ${formatMoney(total)}. Найбільше у "${topCategory?.[0] ?? "Без категорії"}".`
    : "За останні 7 днів нових витрат не було.";

  const created = await createNotification({
    actionLabel: "Відкрити аналітику",
    actionUrl: "#analytics",
    dedupeKey: `weekly_report:${local.year}-${local.month}-${local.day}`,
    key: "weekly_report",
    message,
    metadata: {
      expenseCount: expenses.length,
      total,
    },
    title: "Щотижневий звіт",
    userId,
  });

  return created ? 1 : 0;
}

async function maybeCreateBudgetReminders(userId: string, preferences: Record<NotificationKey, boolean>, now: Date) {
  if (!preferences.budget_reminders) {
    return 0;
  }

  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const budgets = await getDb().budget.findMany({
    include: { category: true },
    where: {
      month: {
        gte: monthStart,
        lt: monthEnd,
      },
      userId,
    },
  });

  if (!budgets.length) {
    return 0;
  }

  const expenses = await getDb().expense.findMany({
    select: {
      amount: true,
      categoryId: true,
    },
    where: {
      categoryId: {
        in: budgets.map((budget) => budget.categoryId).filter((value): value is string => Boolean(value)),
      },
      date: {
        gte: monthStart,
        lt: monthEnd,
      },
      userId,
    },
  });

  const spentByCategory = new Map<string, number>();
  expenses.forEach((expense) => {
    if (!expense.categoryId) return;
    spentByCategory.set(expense.categoryId, (spentByCategory.get(expense.categoryId) ?? 0) + Number(expense.amount));
  });

  let created = 0;
  for (const budget of budgets) {
    const limit = Number(budget.limit);
    if (!limit || !budget.categoryId) continue;
    const spent = spentByCategory.get(budget.categoryId) ?? 0;
    const percent = Math.round((spent / limit) * 100);
    if (percent < BUDGET_WARNING_THRESHOLD) continue;

    const level = percent >= 100 ? "limit" : "warning";
    const notification = await createNotification({
      actionLabel: "Відкрити бюджети",
      actionUrl: "#budgets",
      dedupeKey: `budget_reminder:${budget.id}:${monthStart.toISOString().slice(0, 7)}:${level}`,
      key: "budget_reminders",
      message:
        percent >= 100
          ? `${budget.name}: витрачено ${formatMoney(spent)} при ліміті ${formatMoney(limit)}.`
          : `${budget.name}: використано ${percent}% бюджету (${formatMoney(spent)} з ${formatMoney(limit)}).`,
      metadata: {
        budgetId: budget.id,
        percent,
        spent,
      },
      severity: percent >= 100 ? "warning" : "info",
      title: percent >= 100 ? "Бюджет перевищено" : "Бюджет наближається до ліміту",
      userId,
    });

    if (notification) {
      created += 1;
    }
  }

  return created;
}

async function maybeCreateGoalProgress(userId: string, preferences: Record<NotificationKey, boolean>) {
  if (!preferences.goal_progress) {
    return 0;
  }

  const goals = await getDb().goal.findMany({
    where: {
      status: {
        in: ["ACTIVE", "COMPLETED"],
      },
      userId,
    },
  });

  let created = 0;
  for (const goal of goals) {
    const target = Number(goal.targetAmount);
    if (!target) continue;
    const saved = Number(goal.savedAmount);
    const percent = Math.round((saved / target) * 100);
    const milestone = [100, 75, 50, 25].find((value) => percent >= value);
    if (!milestone) continue;

    const notification = await createNotification({
      actionLabel: "Відкрити цілі",
      actionUrl: "#goals",
      dedupeKey: `goal_progress:${goal.id}:${milestone}`,
      key: "goal_progress",
      message:
        milestone >= 100
          ? `${goal.name}: ціль досягнута, зібрано ${formatMoney(saved)}.`
          : `${goal.name}: ви досягли ${milestone}% (${formatMoney(saved)} з ${formatMoney(target)}).`,
      metadata: {
        goalId: goal.id,
        milestone,
        percent,
      },
      severity: milestone >= 100 ? "success" : "info",
      title: milestone >= 100 ? "Ціль досягнута" : "Прогрес по цілі",
      userId,
    });

    if (notification) {
      created += 1;
    }
  }

  return created;
}

async function maybeCreateMarketingTip(userId: string, preferences: Record<NotificationKey, boolean>, timeZone: string, now: Date) {
  if (!preferences.marketing) {
    return 0;
  }

  const local = localDateInfo(now, timeZone);
  if (local.day !== 1 || local.hour < MARKETING_TIP_HOUR) {
    return 0;
  }

  const created = await createNotification({
    actionLabel: "Відкрити аналітику",
    actionUrl: "#analytics",
    dedupeKey: `marketing_tip:${local.year}-${local.month}`,
    key: "marketing",
    message: "Спробуйте переглянути аналітику та оновити бюджети на новий місяць.",
    metadata: {
      month: `${local.year}-${String(local.month).padStart(2, "0")}`,
    },
    title: "Порада від FinTrack",
    userId,
  });

  return created ? 1 : 0;
}

async function createNotification(input: CreateNotificationInput) {
  if (input.dedupeKey) {
    const existing = await getDb().userNotification.findFirst({
      where: {
        dedupeKey: input.dedupeKey,
        userId: input.userId,
      },
    });
    if (existing) {
      return null;
    }
  }

  const telegramAccount = await getDb().telegramAccount.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { telegramChatId: true },
    where: {
      telegramChatId: { not: null },
      userId: input.userId,
    },
  });

  return getDb().userNotification.create({
    data: {
      actionLabel: input.actionLabel,
      actionUrl: input.actionUrl,
      dedupeKey: input.dedupeKey,
      deliverTelegram: Boolean(telegramAccount?.telegramChatId),
      key: input.key,
      message: input.message,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      severity: input.severity ?? "info",
      title: input.title,
      userId: input.userId,
    },
  });
}

async function fetchNotificationFeed(userId: string, limit: number) {
  const notifications = await getDb().userNotification.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    where: { userId },
  });

  return notifications.map((notification) => ({
    actionLabel: notification.actionLabel,
    actionUrl: notification.actionUrl,
    createdAt: notification.createdAt.toISOString(),
    id: notification.id,
    isRead: notification.isRead,
    key: notification.key,
    message: notification.message,
    severity: notification.severity,
    telegramSentAt: notification.telegramSentAt?.toISOString() ?? null,
    title: notification.title,
  }));
}

async function getNotificationPreferences(userId: string) {
  const preferences = await getDb().notificationPreference.findMany({
    select: {
      enabled: true,
      key: true,
    },
    where: { userId },
  });

  return mergeNotificationPreferences(preferences);
}

function mergeNotificationPreferences(rows: Array<{ enabled: boolean; key: string }>) {
  const state: Record<NotificationKey, boolean> = { ...NOTIFICATION_DEFAULTS };
  rows.forEach((row) => {
    if (row.key in state) {
      state[row.key as NotificationKey] = row.enabled;
    }
  });
  return state;
}

function localDateInfo(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    month: "2-digit",
    timeZone,
    weekday: "short",
    year: "numeric",
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    day: Number(read("day")),
    hour: Number(read("hour")),
    month: Number(read("month")),
    weekday: read("weekday"),
    year: Number(read("year")),
  };
}

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString("uk-UA")} ₴`;
}

async function sendTelegramNotification(
  chatId: string,
  notification: { actionUrl?: string | null; message: string; title: string },
) {
  const response = await fetch(`https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    body: JSON.stringify({
      chat_id: chatId,
      text: telegramMessage(notification),
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Telegram send failed: ${response.status}`);
  }
}

function telegramMessage(notification: { actionUrl?: string | null; message: string; title: string }) {
  const lines = [`FinTrack`, notification.title, notification.message];
  if (notification.actionUrl) {
    lines.push(`Відкрити: ${config.DASHBOARD_PUBLIC_URL}/dashboard${notification.actionUrl}`);
  }
  return lines.join("\n");
}
