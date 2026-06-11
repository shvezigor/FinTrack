import { PrismaClient } from "@prisma/client";

export const E2E_EMAIL_DOMAIN = "e2e.fintrack.test";
export const E2E_PASSWORD = "TestUser123!";

const prisma = new PrismaClient();

export function makeE2eEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@${E2E_EMAIL_DOMAIN}`;
}

export async function cleanupFintrackE2eData(email?: string) {
  try {
    const users = await prisma.user.findMany({
      select: { id: true },
      where: email ? { email } : { email: { endsWith: `@${E2E_EMAIL_DOMAIN}` } },
    });

    for (const user of users) {
      await cleanupUserById(user.id);
    }
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2021") {
      return;
    }
    throw error;
  }
}

export async function disconnectFintrackE2eDb() {
  await prisma.$disconnect();
}

export async function seedFinanceFixture(email: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  const uniqueSuffix = user.id.slice(-8);
  const account = await prisma.financialAccount.create({
    data: {
      balance: 12345,
      currencyCode: 980,
      isPrimary: true,
      name: `E2E Main Card ${uniqueSuffix}`,
      provider: "MANUAL",
      type: "CARD",
      userId: user.id,
    },
  });
  const category = await prisma.category.create({
    data: {
      color: "#22c55e",
      dashboardGroup: "Food",
      icon: "shopping-cart",
      name: `E2E Food ${uniqueSuffix}`,
      slug: `e2e-food-${uniqueSuffix}`,
      userId: user.id,
    },
  });
  const tag = await prisma.tag.create({
    data: {
      color: "#64748b",
      name: `E2E tag ${uniqueSuffix}`,
      userId: user.id,
    },
  });
  const expense = await prisma.expense.create({
    data: {
      amount: 321,
      categoryId: category.id,
      currencyCode: 980,
      date: new Date("2026-06-10T09:30:00.000Z"),
      description: "E2E coffee expense",
      financialAccountId: account.id,
      paymentType: "CARD",
      sourceStatus: "NEEDS_REVIEW",
      tags: {
        create: {
          tagId: tag.id,
        },
      },
      userId: user.id,
    },
  });
  const income = await prisma.income.create({
    data: {
      amount: 6540,
      currencyCode: 980,
      date: new Date("2026-06-09T12:00:00.000Z"),
      description: "E2E salary income",
      financialAccountId: account.id,
      source: "E2E Salary",
      status: "RECEIVED",
      tags: {
        create: {
          tagId: tag.id,
        },
      },
      userId: user.id,
    },
  });
  await prisma.budget.create({
    data: {
      categoryId: category.id,
      color: category.color,
      limit: 5000,
      month: new Date("2026-06-01T00:00:00.000Z"),
      name: `E2E Food budget ${uniqueSuffix}`,
      period: "MONTHLY",
      userId: user.id,
    },
  });
  await prisma.goal.create({
    data: {
      color: "#22c55e",
      currencyCode: 980,
      description: "E2E goal description",
      name: `E2E Emergency Fund ${uniqueSuffix}`,
      savedAmount: 1000,
      targetAmount: 10000,
      userId: user.id,
    },
  });

  return { account, category, expense, income, tag, user };
}

async function cleanupUserById(userId: string) {
  await prisma.$transaction([
    prisma.expenseTag.deleteMany({ where: { expense: { userId } } }),
    prisma.incomeTag.deleteMany({ where: { income: { userId } } }),
    prisma.goalContribution.deleteMany({ where: { userId } }),
    prisma.liabilityPayment.deleteMany({ where: { userId } }),
    prisma.matchingCandidate.deleteMany({ where: { telegramEntry: { userId } } }),
    prisma.expense.deleteMany({ where: { userId } }),
    prisma.income.deleteMany({ where: { userId } }),
    prisma.goal.deleteMany({ where: { userId } }),
    prisma.budget.deleteMany({ where: { userId } }),
    prisma.liability.deleteMany({ where: { userId } }),
    prisma.loan.deleteMany({ where: { userId } }),
    prisma.monoTransaction.deleteMany({ where: { userId } }),
    prisma.telegramEntry.deleteMany({ where: { userId } }),
    prisma.categoryAlias.deleteMany({ where: { category: { userId } } }),
    prisma.category.deleteMany({ where: { userId } }),
    prisma.financialAccount.deleteMany({ where: { userId } }),
    prisma.integrationConnection.deleteMany({ where: { userId } }),
    prisma.notificationPreference.deleteMany({ where: { userId } }),
    prisma.userNotification.deleteMany({ where: { userId } }),
    prisma.userSecret.deleteMany({ where: { userId } }),
    prisma.tag.deleteMany({ where: { userId } }),
    prisma.telegramAccount.deleteMany({ where: { userId } }),
    prisma.botConversationState.deleteMany({ where: { userId } }),
    prisma.oAuthAccount.deleteMany({ where: { userId } }),
    prisma.passwordReset.deleteMany({ where: { userId } }),
    prisma.userSession.deleteMany({ where: { userId } }),
    prisma.userRoleAssignment.deleteMany({ where: { userId } }),
    prisma.userSecuritySettings.deleteMany({ where: { userId } }),
    prisma.userPreference.deleteMany({ where: { userId } }),
    prisma.userSubscription.deleteMany({ where: { userId } }),
    prisma.auditLog.deleteMany({ where: { userId } }),
    prisma.user.deleteMany({ where: { id: userId } }),
  ]);
}
