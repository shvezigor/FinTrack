import { createHash } from "node:crypto";
import { getDb } from "../db.js";
import { serializeUser } from "./auth.js";
import { listUserSecrets } from "./user-secrets.js";

export async function exportUserData(userId: string) {
  const db = getDb();
  const user = await db.user.findUniqueOrThrow({
    include: {
      passwordCredential: true,
      preferences: true,
      roles: {
        include: { role: true },
        orderBy: { assignedAt: "asc" },
      },
      securitySettings: true,
    },
    where: { id: userId },
  });

  const [
    accounts,
    auditLogs,
    budgets,
    categories,
    expenses,
    goalContributions,
    goals,
    incomes,
    integrations,
    monoTransactions,
    notifications,
    notificationPreferences,
    oauthAccounts,
    secrets,
    subscription,
    tags,
    telegramAccounts,
    telegramEntries,
  ] = await Promise.all([
    db.financialAccount.findMany({ where: { userId } }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 500, where: { userId } }),
    db.budget.findMany({ where: { userId } }),
    db.category.findMany({ where: { userId } }),
    db.expense.findMany({ include: { category: true, tags: { include: { tag: true } } }, where: { userId } }),
    db.goalContribution.findMany({ where: { userId } }),
    db.goal.findMany({ include: { contributions: true }, where: { userId } }),
    db.income.findMany({ include: { tags: { include: { tag: true } } }, where: { userId } }),
    db.integrationConnection.findMany({ where: { userId } }),
    db.monoTransaction.findMany({ where: { userId } }),
    db.userNotification.findMany({ orderBy: { createdAt: "desc" }, where: { userId } }),
    db.notificationPreference.findMany({ where: { userId } }),
    db.oAuthAccount.findMany({
      select: {
        createdAt: true,
        email: true,
        expiresAt: true,
        id: true,
        provider: true,
        providerAccountId: true,
        updatedAt: true,
      },
      where: { userId },
    }),
    listUserSecrets(userId),
    db.userSubscription.findUnique({ where: { userId } }),
    db.tag.findMany({ where: { userId } }),
    db.telegramAccount.findMany({ where: { userId } }),
    db.telegramEntry.findMany({ where: { userId } }),
  ]);

  return toJsonSafe({
    exportedAt: new Date().toISOString(),
    profile: {
      ...serializeUser(user),
      createdAt: user.createdAt,
      preferences: user.preferences
        ? {
            createdAt: user.preferences.createdAt,
            currencyCode: user.preferences.currencyCode,
            locale: user.preferences.locale,
            timezone: user.preferences.timezone,
            updatedAt: user.preferences.updatedAt,
          }
        : null,
      security: {
        actionConfirmationEnabled: user.securitySettings?.actionConfirmationEnabled ?? true,
        autoLogoutMinutes: user.securitySettings?.autoLogoutMinutes ?? 30,
        hasPassword: Boolean(user.passwordCredential),
        passwordChangedAt: user.passwordCredential?.updatedAt ?? null,
        twoFactorEnabled: user.securitySettings?.twoFactorEnabled ?? false,
      },
      roles: user.roles.map((item) => ({
        assignedAt: item.assignedAt,
        description: item.role.description,
        key: item.role.key,
        name: item.role.name,
      })),
      updatedAt: user.updatedAt,
    },
    records: {
      accounts,
      auditLogs,
      budgets,
      categories,
      expenses,
      goalContributions,
      goals,
      incomes,
      integrations,
      monoTransactions,
      notifications,
      notificationPreferences,
      oauthAccounts,
      secrets,
      subscription,
      tags,
      telegramAccounts,
      telegramEntries,
    },
    redactions: {
      oauthTokens: "OAuth access and refresh tokens are omitted from privacy exports.",
      userSecrets: "Encrypted API key values are omitted; only metadata is exported.",
    },
  });
}

export async function deleteUserAccount(userId: string) {
  const user = await getDb().user.findUnique({ select: { id: true }, where: { id: userId } });
  if (!user) {
    return { deleted: false };
  }

  const userIdHash = createHash("sha256").update(userId).digest("hex");

  await getDb().$transaction(async (tx) => {
    await tx.expense.deleteMany({ where: { userId } });
    await tx.income.deleteMany({ where: { userId } });
    await tx.budget.deleteMany({ where: { userId } });
    await tx.goalContribution.deleteMany({ where: { userId } });
    await tx.goal.deleteMany({ where: { userId } });
    await tx.telegramEntry.deleteMany({ where: { userId } });
    await tx.monoTransaction.deleteMany({ where: { userId } });
    await tx.category.deleteMany({ where: { userId } });
    await tx.tag.deleteMany({ where: { userId } });
    await tx.financialAccount.deleteMany({ where: { userId } });
    await tx.integrationConnection.deleteMany({ where: { userId } });
    await tx.userNotification.deleteMany({ where: { userId } });
    await tx.notificationPreference.deleteMany({ where: { userId } });
    await tx.userPreference.deleteMany({ where: { userId } });
    await tx.userSecuritySettings.deleteMany({ where: { userId } });
    await tx.userRoleAssignment.deleteMany({ where: { userId } });
    await tx.userSecret.deleteMany({ where: { userId } });
    await tx.oAuthAccount.deleteMany({ where: { userId } });
    await tx.userSession.deleteMany({ where: { userId } });
    await tx.passwordCredential.deleteMany({ where: { userId } });
    await tx.userSubscription.deleteMany({ where: { userId } });
    await tx.telegramAccount.deleteMany({ where: { userId } });
    await tx.auditLog.deleteMany({ where: { userId } });
    await tx.user.delete({ where: { id: userId } });
    await tx.auditLog.create({
      data: {
        action: "privacy.account_deleted",
        metadata: { userIdHash },
      },
    });
  });

  return { deleted: true };
}

function toJsonSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
