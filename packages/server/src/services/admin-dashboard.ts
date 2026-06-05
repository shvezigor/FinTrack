import { IntegrationProvider } from "@prisma/client";
import { getDb } from "../db.js";
import { serializeUser } from "./auth.js";
import { getConfiguredStatus } from "./settings.js";

export type AdminWorkspaceData = {
  alerts: Array<{
    message: string;
    severity: "critical" | "info" | "warning";
    title: string;
  }>;
  generatedAt: string;
  integrations: Array<{
    connected: number;
    disconnected: number;
    lastSyncAt: string | null;
    linkedUsers: number;
    needsAttention: number;
    provider: string;
  }>;
  jobs: Array<{
    attempts: number;
    id: string;
    lastError: string | null;
    runAfter: string;
    status: string;
    type: string;
    updatedAt: string;
  }>;
  recentActivity: Array<{
    action: string;
    actorEmail: string | null;
    actorName: string | null;
    createdAt: string;
    entityId: string | null;
    entityType: string | null;
    id: string;
  }>;
  settings: Array<{
    hasValue: boolean;
    isSecret: boolean;
    key: string;
    storage: "encrypted" | "missing" | "plain";
    updatedAt: string;
  }>;
  summary: {
    activeSessions: number;
    activeSubscriptions: number;
    admins: number;
    failedJobs: number;
    failedTelegramNotifications: number;
    integrationsNeedAttention: number;
    pendingJobs: number;
    pendingTelegramNotifications: number;
    settingsConfigured: number;
    totalUsers: number;
    usersNeedingAttention: number;
    usersSeenToday: number;
  };
  users: Array<{
    accountsCount: number;
    activeSessionCount: number;
    categoriesCount: number;
    createdAt: string;
    currencyCode: number;
    email: string;
    expensesCount: number;
    flags: string[];
    id: string;
    integrationsConnected: number;
    integrationsNeedAttention: number;
    lastSeenAt: string | null;
    locale: string;
    name: string | null;
    oauthProviders: string[];
    planStatus: string;
    planTier: string;
    role: string;
    secretsCount: number;
    telegramConnected: boolean;
    timezone: string;
  }>;
};

const ALL_INTEGRATION_PROVIDERS = Object.values(IntegrationProvider);
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function getAdminWorkspaceData(): Promise<AdminWorkspaceData> {
  const db = getDb();
  const now = new Date();
  const activeSince = new Date(now.getTime() - ONE_DAY_MS);

  const [
    users,
    auditLogs,
    integrationConnections,
    appSettings,
    jobs,
    pendingTelegramNotifications,
    failedTelegramNotifications,
    globalConnections,
  ] = await Promise.all([
    db.user.findMany({
      include: {
        _count: {
          select: {
            accounts: true,
            categories: true,
            expenses: true,
            integrations: true,
            secrets: true,
            telegramAccounts: true,
          },
        },
        oauthAccounts: {
          select: {
            provider: true,
          },
        },
        preferences: true,
        roles: {
          include: { role: true },
          orderBy: { assignedAt: "asc" },
        },
        sessions: {
          orderBy: [{ lastSeenAt: "desc" }, { updatedAt: "desc" }],
          select: {
            createdAt: true,
            expiresAt: true,
            lastSeenAt: true,
            source: true,
            updatedAt: true,
          },
        },
        subscription: true,
        telegramAccounts: {
          select: {
            id: true,
            telegramChatId: true,
          },
        },
        integrations: {
          select: {
            lastSyncAt: true,
            provider: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.auditLog.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    db.integrationConnection.findMany({
      select: {
        lastSyncAt: true,
        provider: true,
        status: true,
        userId: true,
      },
    }),
    db.appSetting.findMany({
      orderBy: [{ isSecret: "desc" }, { updatedAt: "desc" }],
      select: {
        isSecret: true,
        key: true,
        updatedAt: true,
        valueEncrypted: true,
        valuePlain: true,
      },
    }),
    db.job.findMany({
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: 30,
    }),
    db.userNotification.count({
      where: {
        deliverTelegram: true,
        telegramSentAt: null,
      },
    }),
    db.userNotification.count({
      where: {
        telegramError: {
          not: null,
        },
      },
    }),
    getConfiguredStatus(),
  ]);

  const userRows = users.map((user) => {
    const serialized = serializeUser(user);
    const activeSessions = user.sessions.filter((session) => session.expiresAt > now);
    const lastSeen = latestDate(
      user.sessions.map((session) => session.lastSeenAt ?? session.updatedAt ?? session.createdAt),
    );
    const integrationsConnected = user.integrations.filter((item) => item.status === "CONNECTED").length;
    const integrationsNeedAttention = user.integrations.filter((item) => item.status === "NEEDS_ATTENTION").length;
    const flags: string[] = [];

    if (integrationsNeedAttention) {
      flags.push("Інтеграції потребують уваги");
    }
    if (!user.telegramAccounts.length) {
      flags.push("Telegram не підключений");
    }
    if (!activeSessions.length) {
      flags.push("Немає активної сесії");
    }
    if (!user.subscription || user.subscription.status !== "ACTIVE") {
      flags.push("План неактивний");
    }
    if (!user.oauthAccounts.length && !activeSessions.length) {
      flags.push("Потрібна перевірка доступу");
    }

    return {
      accountsCount: user._count.accounts,
      activeSessionCount: activeSessions.length,
      categoriesCount: user._count.categories,
      createdAt: user.createdAt.toISOString(),
      currencyCode: serialized.currencyCode,
      email: serialized.email,
      expensesCount: user._count.expenses,
      flags,
      id: user.id,
      integrationsConnected,
      integrationsNeedAttention,
      lastSeenAt: lastSeen?.toISOString() ?? null,
      locale: serialized.locale,
      name: serialized.name,
      oauthProviders: Array.from(new Set(user.oauthAccounts.map((item) => item.provider))),
      planStatus: serialized.subscription?.status ?? "NONE",
      planTier: serialized.subscription?.tier ?? "FREE",
      role: serialized.role,
      secretsCount: user._count.secrets,
      telegramConnected: Boolean(user.telegramAccounts.length),
      timezone: serialized.timezone,
    };
  });

  const integrationRows = ALL_INTEGRATION_PROVIDERS.map((provider) => {
    const items = integrationConnections.filter((connection) => connection.provider === provider);
    return {
      connected: items.filter((item) => item.status === "CONNECTED").length,
      disconnected: items.filter((item) => item.status === "DISCONNECTED").length,
      lastSyncAt: latestDate(items.map((item) => item.lastSyncAt))?.toISOString() ?? null,
      linkedUsers: new Set(items.map((item) => item.userId).filter(Boolean)).size,
      needsAttention: items.filter((item) => item.status === "NEEDS_ATTENTION").length,
      provider,
    };
  }).filter((row) => row.connected || row.disconnected || row.needsAttention || row.linkedUsers);

  const settingsRows = appSettings.map((setting) => {
    const hasPlainValue = Boolean(setting.valuePlain?.trim());
    const hasEncryptedValue = Boolean(setting.valueEncrypted?.trim());
    const storage = hasEncryptedValue ? "encrypted" : hasPlainValue ? "plain" : "missing";
    return {
      hasValue: hasPlainValue || hasEncryptedValue,
      isSecret: setting.isSecret,
      key: setting.key,
      storage,
      updatedAt: setting.updatedAt.toISOString(),
    } as const;
  });

  const pendingJobs = jobs.filter((job) => job.status === "PENDING" || job.status === "RUNNING").length;
  const failedJobs = jobs.filter((job) => job.status === "FAILED").length;
  const usersSeenToday = userRows.filter((user) => user.lastSeenAt && new Date(user.lastSeenAt) >= activeSince).length;
  const usersNeedingAttention = userRows.filter((user) => user.flags.length > 0).length;
  const integrationsNeedAttention = integrationRows.reduce((sum, item) => sum + item.needsAttention, 0);

  const alerts: AdminWorkspaceData["alerts"] = [];
  if (failedJobs) {
    alerts.push({
      message: `${failedJobs} фонових задач завершились із помилкою.`,
      severity: "critical",
      title: "Потрібна перевірка worker-процесів",
    });
  }
  if (integrationsNeedAttention) {
    alerts.push({
      message: `${integrationsNeedAttention} інтеграцій мають статус NEEDS_ATTENTION.`,
      severity: "warning",
      title: "Є проблеми з інтеграціями",
    });
  }
  if (failedTelegramNotifications) {
    alerts.push({
      message: `${failedTelegramNotifications} Telegram-сповіщень не були доставлені.`,
      severity: "warning",
      title: "Сповіщення потребують уваги",
    });
  }
  if (!globalConnections.monobank || !globalConnections.openai || !globalConnections.googleSheets) {
    const missing = [
      !globalConnections.monobank ? "Monobank" : null,
      !globalConnections.openai ? "OpenAI" : null,
      !globalConnections.googleSheets ? "Google Sheets" : null,
    ].filter(Boolean);
    alerts.push({
      message: `Не всі глобальні інтеграції налаштовані: ${missing.join(", ")}.`,
      severity: "info",
      title: "Конфігурація середовища неповна",
    });
  }

  return {
    alerts,
    generatedAt: now.toISOString(),
    integrations: integrationRows,
    jobs: jobs.map((job) => ({
      attempts: job.attempts,
      id: job.id,
      lastError: job.lastError,
      runAfter: job.runAfter.toISOString(),
      status: job.status,
      type: job.type,
      updatedAt: job.updatedAt.toISOString(),
    })),
    recentActivity: auditLogs.map((log) => ({
      action: log.action,
      actorEmail: log.user?.email ?? null,
      actorName: log.user?.name ?? null,
      createdAt: log.createdAt.toISOString(),
      entityId: log.entityId ?? null,
      entityType: log.entityType ?? null,
      id: log.id,
    })),
    settings: settingsRows,
    summary: {
      activeSessions: userRows.reduce((sum, user) => sum + user.activeSessionCount, 0),
      activeSubscriptions: userRows.filter((user) => user.planStatus === "ACTIVE").length,
      admins: userRows.filter((user) => user.role === "OWNER" || user.role === "ADMIN").length,
      failedJobs,
      failedTelegramNotifications,
      integrationsNeedAttention,
      pendingJobs,
      pendingTelegramNotifications,
      settingsConfigured: settingsRows.filter((setting) => setting.hasValue).length,
      totalUsers: userRows.length,
      usersNeedingAttention,
      usersSeenToday,
    },
    users: userRows,
  };
}

function latestDate(values: Array<Date | null | undefined>) {
  return values.reduce<Date | null>((latest, value) => {
    if (!value) return latest;
    if (!latest || value.getTime() > latest.getTime()) {
      return value;
    }
    return latest;
  }, null);
}
