import { Prisma } from "@prisma/client";
import { normalizeText } from "@resource-manager/shared";
import { getDb } from "../db.js";
import { recordManualCategoryAlias } from "./ai-categorization.js";
import { ensureDefaultUser, serializeUser } from "./auth.js";
import { countUnreadNotifications, listUserNotifications, maybeCreateExpenseAlert } from "./notifications.js";
import { getAiProviderSettings } from "./openai.js";
import { getConfiguredStatus } from "./settings.js";
import { getTelegramConnectionState } from "./telegram-link.js";
import { listUserSecrets } from "./user-secrets.js";
import {
  calculateActualIncomeTotal,
  calculateBudgetLimitTotal,
  calculateBudgetSavings,
  calculateBudgetUsage,
  calculateGoalProgress,
  calculatePlannedIncomeTotal,
  normalizeIncomeStatus,
} from "./portfolio-calculations.js";

type MoneyInput = number | string;

export type CreateExpenseInput = {
  amount: MoneyInput;
  categoryId?: string;
  categoryName?: string;
  date?: string;
  description?: string;
  financialAccountId?: string;
  paymentType?: "CARD" | "CASH" | "UNKNOWN";
  sourceStatus?: "MATCHED" | "MONO_ONLY" | "NEEDS_REVIEW" | "TELEGRAM_ONLY";
  tags?: string[];
  telegramEntryId?: string;
  userId?: string;
};

export type UpdateExpenseInput = Partial<CreateExpenseInput>;

export type CreateIncomeInput = {
  amount: MoneyInput;
  date?: string;
  description?: string;
  financialAccountId?: string;
  source: string;
  status?: string;
  tags?: string[];
  userId?: string;
};

export type UpdateIncomeInput = Partial<CreateIncomeInput>;

export type CreateBudgetInput = {
  categoryId?: string;
  categoryName?: string;
  color?: string;
  limit: MoneyInput;
  month?: string;
  name?: string;
  userId?: string;
};

export type UpdateBudgetInput = Partial<CreateBudgetInput>;

export type CreateGoalInput = {
  color?: string;
  deadline?: string;
  description?: string;
  imageUrl?: string;
  name: string;
  savedAmount?: MoneyInput;
  targetAmount: MoneyInput;
  userId?: string;
};

export type UpdateGoalInput = Partial<CreateGoalInput>;

export type CreateLiabilityInput = {
  currentBalance: MoneyInput;
  creditor?: string;
  description?: string;
  financialAccountId?: string;
  interestRate?: MoneyInput;
  kind:
    | "LOAN"
    | "CREDIT_CARD"
    | "INSTALLMENT"
    | "MORTGAGE"
    | "PERSONAL_DEBT"
    | "TAX"
    | "OTHER";
  minimumPayment?: MoneyInput;
  name: string;
  originalAmount: MoneyInput;
  paymentDay?: number;
  startDate?: string;
  status?: "ACTIVE" | "PAUSED" | "PAID" | "ARCHIVED";
  targetCloseDate?: string;
  userId?: string;
};

export type UpdateLiabilityInput = Partial<CreateLiabilityInput>;

export type CreateLiabilityPaymentInput = {
  amount: MoneyInput;
  date?: string;
  note?: string;
  userId?: string;
};

export type CategoryInput = {
  color?: string;
  dashboardGroup?: string;
  icon?: string;
  name: string;
  userId?: string;
};

const categoryIconNames = new Set([
  "analytics",
  "bank",
  "bell",
  "book",
  "briefcase",
  "calendar",
  "car",
  "cart",
  "chart",
  "expenses",
  "fuel",
  "gift",
  "goals",
  "heart",
  "home",
  "income",
  "lightbulb",
  "medical",
  "openai",
  "pet",
  "phone",
  "piggy",
  "plane",
  "receipt",
  "shield",
  "shirt",
  "smile",
  "spark",
  "subscriptions",
  "transactions",
  "user",
  "wallet",
]);

export async function getFinanceWorkspaceData(userId?: string) {
  const owner = await getWorkspaceOwner(userId);
  const resolvedUserId = owner?.id;
  const month = startOfMonth(new Date());
  const nextMonth = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1));
  const prevMonth = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1));

  const [expenses, incomes, categories, budgets, goals, liabilities, liabilityPayments, accounts, tags, integrations, connections, secrets, ai, telegram, notifications, unreadNotificationCount] = await Promise.all([
    getDb().expense.findMany({
      include: { category: true, financialAccount: true, tags: { include: { tag: true } } },
      orderBy: { date: "desc" },
      take: 2000,
      where: ownerScoped(resolvedUserId),
    }),
    getDb().income.findMany({
      include: { financialAccount: true, tags: { include: { tag: true } } },
      orderBy: { date: "desc" },
      take: 1000,
      where: ownerScoped(resolvedUserId),
    }),
    getDb().category.findMany({
      orderBy: { name: "asc" },
      where: {
        isActive: true,
        ...ownerScoped(resolvedUserId),
      },
    }),
    getDb().budget.findMany({
      include: { category: true },
      orderBy: { name: "asc" },
      where: {
        ...ownerScoped(resolvedUserId),
        month: {
          gte: month,
          lt: nextMonth,
        },
      },
    }),
    getDb().goal.findMany({
      include: { contributions: true },
      orderBy: [{ status: "asc" }, { deadline: "asc" }],
      where: ownerScoped(resolvedUserId),
    }),
    getDb().liability.findMany({
      include: { financialAccount: true, payments: true },
      orderBy: [{ status: "asc" }, { paymentDay: "asc" }, { name: "asc" }],
      where: ownerScoped(resolvedUserId),
    }),
    getDb().liabilityPayment.findMany({
      include: { liability: true },
      orderBy: { date: "desc" },
      take: 500,
      where: ownerScoped(resolvedUserId),
    }),
    getDb().financialAccount.findMany({
      orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
      where: {
        ...ownerScoped(resolvedUserId),
        isActive: true,
      },
    }),
    getDb().tag.findMany({
      orderBy: { name: "asc" },
      where: ownerScoped(resolvedUserId),
    }),
    getDb().integrationConnection.findMany({
      orderBy: { provider: "asc" },
      where: ownerScoped(resolvedUserId),
    }),
    getConfiguredStatus(resolvedUserId),
    resolvedUserId ? listUserSecrets(resolvedUserId) : Promise.resolve([]),
    resolvedUserId ? getAiProviderSettings(resolvedUserId) : Promise.resolve(null),
    resolvedUserId
      ? getTelegramConnectionState(resolvedUserId)
      : Promise.resolve({ botUrl: null, connectCommand: null, connected: false, username: null }),
    resolvedUserId ? listUserNotifications(resolvedUserId, 12) : Promise.resolve([]),
    resolvedUserId ? countUnreadNotifications(resolvedUserId) : Promise.resolve(0),
  ]);

  const monthExpenses = expenses.filter((expense) => expense.date >= month && expense.date < nextMonth);
  const prevMonthExpenses = expenses.filter((expense) => expense.date >= prevMonth && expense.date < month);
  const monthIncomes = incomes.filter((income) => income.date >= month && income.date < nextMonth);
  const monthExpenseTotal = monthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const prevMonthExpenseTotal = prevMonthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const monthActualIncomeTotal = calculateActualIncomeTotal(monthIncomes);
  const monthPlannedIncomeTotal = calculatePlannedIncomeTotal(monthIncomes);
  const monthIncomeTotal = monthIncomes.reduce((sum, income) => sum + Number(income.amount), 0);
  const monthBudgetTotal = calculateBudgetLimitTotal(budgets);
  const accountBalance = accounts.reduce((sum, account) => sum + Number(account.balance), 0);
  const byCategory = groupExpensesByCategory(monthExpenses);
  const categoryTotals = new Map(byCategory.map((category) => [category.name, category.total]));
  const activeLiabilities = liabilities.filter((liability) => liability.status === "ACTIVE");
  const liabilityTotal = activeLiabilities.reduce((sum, liability) => sum + Number(liability.currentBalance), 0);
  const liabilityMinimumTotal = activeLiabilities.reduce((sum, liability) => sum + Number(liability.minimumPayment), 0);
  const liabilityDueSoonCount = activeLiabilities.filter((liability) => {
    if (!liability.paymentDay) return false;
    const today = new Date();
    const currentDay = today.getUTCDate();
    return liability.paymentDay >= currentDay && liability.paymentDay <= currentDay + 7;
  }).length;

  return {
    accounts: accounts.map(serializeAccount),
    budgets: budgets.map((budget) => serializeBudget(budget, monthExpenses)),
    categories: categories.map((category) => serializeCategory(category, categoryTotals.get(category.name) ?? 0)),
    connections: {
      ...connections,
      ai,
      integrations: integrations.map(serializeIntegration),
      secrets,
      telegramConnectCommand: telegram.connectCommand,
      telegramBotUrl: telegram.botUrl,
      telegramBotUsername: telegram.username,
      telegramConnected: telegram.connected,
    },
    goals: goals.map(serializeGoal),
    incomes: incomes.map(serializeIncome),
    liabilities: liabilities.map(serializeLiability),
    liabilityPayments: liabilityPayments.map(serializeLiabilityPayment),
    notifications,
    tags: tags.map((tag) => ({ id: tag.id, name: tag.name })),
    overview: {
      accountBalance,
      byCategory,
      activeLiabilityCount: activeLiabilities.length,
      liabilityDueSoonCount,
      liabilityMinimumTotal,
      liabilityTotal,
      monthActualIncomeTotal,
      monthBudgetTotal,
      monthExpenseTotal,
      monthIncomeTotal,
      monthPlannedIncomeTotal,
      needsReviewCount: expenses.filter((expense) => expense.sourceStatus === "NEEDS_REVIEW").length,
      prevMonthExpenseTotal,
      savings: calculateBudgetSavings(monthBudgetTotal, monthExpenseTotal),
      unreadNotificationCount,
    },
    profile: owner
      ? {
          ...serializeUser(owner),
          notifications: owner.notificationPreferences.map((item) => ({
            enabled: item.enabled,
            key: item.key,
          })),
          security: {
            actionConfirmationEnabled: owner.securitySettings?.actionConfirmationEnabled ?? true,
            autoLogoutMinutes: owner.securitySettings?.autoLogoutMinutes ?? 30,
            hasPassword: Boolean(owner.passwordCredential),
            passwordChangedAt: owner.passwordCredential?.updatedAt?.toISOString() ?? null,
            twoFactorEnabled: owner.securitySettings?.twoFactorEnabled ?? false,
          },
        }
      : null,
    transactions: [
      ...expenses.map(serializeExpense),
      ...incomes.map((income) => ({ ...serializeIncome(income), type: "INCOME" as const })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  };
}

export async function createManualExpense(input: CreateExpenseInput) {
  const userId = await resolveUserId(input.userId);
  const categoryId = await resolveCategoryId(input.categoryId, input.categoryName, userId);

  const createdExpense = await getDb().expense.create({
    data: {
      amount: decimal(input.amount),
      categoryId,
      date: input.date ? new Date(input.date) : new Date(),
      description: input.description,
      financialAccountId: input.financialAccountId,
      paymentType: input.paymentType ?? "UNKNOWN",
      sourceStatus: input.sourceStatus ?? "TELEGRAM_ONLY",
      telegramEntryId: input.telegramEntryId,
      userId,
    },
  });

  await syncExpenseTags(createdExpense.id, userId, input.tags);

  const expense = await getDb().expense.findUniqueOrThrow({
    where: { id: createdExpense.id },
    include: { category: true, financialAccount: true, tags: { include: { tag: true } } },
  });

  await maybeCreateExpenseAlert(expense.id, userId);
  return serializeExpense(expense);
}

export async function createIncome(input: CreateIncomeInput) {
  const userId = await resolveUserId(input.userId);
  const createdIncome = await getDb().income.create({
    data: {
      amount: decimal(input.amount),
      date: input.date ? new Date(input.date) : new Date(),
      description: input.description,
      financialAccountId: input.financialAccountId,
      source: input.source,
      status: normalizeIncomeStatus(input.status),
      userId,
    },
  });

  await syncIncomeTags(createdIncome.id, userId, input.tags);

  const income = await getDb().income.findUniqueOrThrow({
    where: { id: createdIncome.id },
    include: { financialAccount: true, tags: { include: { tag: true } } },
  });
  return serializeIncome(income);
}

export async function createBudget(input: CreateBudgetInput) {
  const userId = await resolveUserId(input.userId);
  const categoryId = await resolveCategoryId(input.categoryId, input.categoryName, userId);
  const month = startOfMonth(input.month ? new Date(input.month) : new Date());
  const name = input.name ?? input.categoryName ?? "Новий бюджет";
  const budget = await getDb().budget.create({
    data: {
      categoryId,
      color: input.color ?? "#22c55e",
      limit: decimal(input.limit),
      month,
      name,
      userId,
    },
    include: { category: true },
  });

  return serializeBudget(budget, []);
}

export async function createGoal(input: CreateGoalInput) {
  const userId = await resolveUserId(input.userId);
  const goal = await getDb().goal.create({
    data: {
      color: input.color ?? "#22c55e",
      deadline: input.deadline ? new Date(input.deadline) : undefined,
      description: input.description,
      imageUrl: input.imageUrl,
      name: input.name,
      savedAmount: decimal(input.savedAmount ?? 0),
      targetAmount: decimal(input.targetAmount),
      userId,
    },
    include: { contributions: true },
  });
  return serializeGoal(goal);
}

export async function createLiability(input: CreateLiabilityInput) {
  const userId = await resolveUserId(input.userId);
  const liability = await getDb().liability.create({
    data: {
      creditor: input.creditor?.trim() || null,
      currentBalance: decimal(input.currentBalance),
      description: input.description?.trim() || null,
      financialAccountId: input.financialAccountId || null,
      interestRate: input.interestRate === undefined || input.interestRate === null || input.interestRate === ""
        ? undefined
        : decimal(input.interestRate),
      kind: input.kind,
      minimumPayment: decimal(input.minimumPayment ?? 0),
      name: input.name.trim(),
      originalAmount: decimal(input.originalAmount),
      paymentDay: input.paymentDay ?? null,
      startDate: input.startDate ? new Date(input.startDate) : new Date(),
      status: input.status ?? "ACTIVE",
      targetCloseDate: input.targetCloseDate ? new Date(input.targetCloseDate) : null,
      userId,
    },
    include: { financialAccount: true, payments: true },
  });
  return serializeLiability(liability);
}

export async function addGoalContribution(goalId: string, amount: MoneyInput, userId?: string, note?: string) {
  const contribution = await getDb().goalContribution.create({
    data: {
      amount: decimal(amount),
      goalId,
      note,
      userId,
    },
  });

  const goal = await getDb().goal.update({
    data: {
      savedAmount: {
        increment: decimal(amount),
      },
    },
    include: { contributions: true },
    where: { id: goalId },
  });

  return {
    contribution: {
      amount: Number(contribution.amount),
      date: contribution.date.toISOString(),
      id: contribution.id,
      note: contribution.note,
    },
    goal: serializeGoal(goal),
  };
}

export async function createFinancialAccount(input: {
  balance?: MoneyInput;
  isPrimary?: boolean;
  maskedPan?: string;
  name: string;
  type?: "BANK" | "CARD" | "CASH" | "INVESTMENT" | "OTHER" | "SAVINGS";
  userId?: string;
}) {
  const userId = await resolveUserId(input.userId);
  const account = await getDb().financialAccount.create({
    data: {
      balance: decimal(input.balance ?? 0),
      isPrimary: input.isPrimary ?? false,
      maskedPan: input.maskedPan,
      name: input.name,
      type: input.type ?? "CARD",
      userId,
    },
  });
  return serializeAccount(account);
}

export async function updateManualExpense(id: string, input: UpdateExpenseInput) {
  const userId = await resolveUserId(input.userId);
  await assertRecordAccess("expense", id, userId);
  const categoryId =
    input.categoryId !== undefined || input.categoryName !== undefined
      ? await resolveCategoryId(input.categoryId, input.categoryName, userId)
      : undefined;
  const updatedExpense = await getDb().expense.update({
    data: {
      amount: input.amount === undefined ? undefined : decimal(input.amount),
      categoryId,
      date: input.date ? new Date(input.date) : undefined,
      description: input.description,
      financialAccountId: input.financialAccountId,
      manualOverride: true,
      paymentType: input.paymentType,
    },
    where: { id },
  });
  if (input.tags !== undefined) {
    await syncExpenseTags(updatedExpense.id, userId, input.tags);
  }
  const expense = await getDb().expense.findUniqueOrThrow({
    where: { id },
    include: { category: true, financialAccount: true, tags: { include: { tag: true } } },
  });
  // Learn from manual categorization: save merchant as alias for future auto-matching
  if (categoryId && expense.monoTransactionId) {
    await recordManualCategoryAlias(id, categoryId).catch(() => { /* non-critical */ });
  }
  await maybeCreateExpenseAlert(expense.id, userId);
  return serializeExpense(expense);
}

export async function updateIncome(id: string, input: UpdateIncomeInput) {
  const userId = await resolveUserId(input.userId);
  await assertRecordAccess("income", id, userId);
  const updatedIncome = await getDb().income.update({
    data: {
      amount: input.amount === undefined ? undefined : decimal(input.amount),
      date: input.date ? new Date(input.date) : undefined,
      description: input.description,
      financialAccountId: input.financialAccountId,
      manualOverride: true,
      source: input.source,
      status: input.status === undefined ? undefined : normalizeIncomeStatus(input.status),
    },
    where: { id },
  });
  if (input.tags !== undefined) {
    await syncIncomeTags(updatedIncome.id, userId, input.tags);
  }
  const income = await getDb().income.findUniqueOrThrow({
    where: { id },
    include: { financialAccount: true, tags: { include: { tag: true } } },
  });
  return serializeIncome(income);
}

export async function deleteExpense(id: string, userId?: string) {
  const resolvedUserId = await resolveUserId(userId);
  await assertRecordAccess("expense", id, resolvedUserId);
  await getDb().expense.delete({ where: { id } });
  return { deleted: true, id };
}

export async function deleteIncome(id: string, userId?: string) {
  const resolvedUserId = await resolveUserId(userId);
  await assertRecordAccess("income", id, resolvedUserId);
  await getDb().income.delete({ where: { id } });
  return { deleted: true, id };
}

export async function updateBudget(id: string, input: UpdateBudgetInput) {
  const userId = await resolveUserId(input.userId);
  await assertRecordAccess("budget", id, userId);
  const categoryId =
    input.categoryId !== undefined || input.categoryName !== undefined
      ? await resolveCategoryId(input.categoryId, input.categoryName, userId)
      : undefined;
  const budget = await getDb().budget.update({
    data: {
      categoryId,
      color: input.color,
      limit: input.limit === undefined ? undefined : decimal(input.limit),
      month: input.month ? startOfMonth(new Date(input.month)) : undefined,
      name: input.name,
    },
    include: { category: true },
    where: { id },
  });
  return serializeBudget(budget, []);
}

export async function updateGoal(id: string, input: UpdateGoalInput) {
  const userId = await resolveUserId(input.userId);
  await assertRecordAccess("goal", id, userId);
  const goal = await getDb().goal.update({
    data: {
      color: input.color,
      deadline: input.deadline ? new Date(input.deadline) : undefined,
      description: input.description,
      imageUrl: input.imageUrl,
      name: input.name,
      savedAmount: input.savedAmount === undefined ? undefined : decimal(input.savedAmount),
      targetAmount: input.targetAmount === undefined ? undefined : decimal(input.targetAmount),
    },
    include: { contributions: true },
    where: { id },
  });
  return serializeGoal(goal);
}

export async function updateLiability(id: string, input: UpdateLiabilityInput) {
  const userId = await resolveUserId(input.userId);
  await assertRecordAccess("liability", id, userId);
  const liability = await getDb().liability.update({
    data: {
      creditor: input.creditor === undefined ? undefined : input.creditor?.trim() || null,
      currentBalance: input.currentBalance === undefined ? undefined : decimal(input.currentBalance),
      description: input.description === undefined ? undefined : input.description?.trim() || null,
      financialAccountId: input.financialAccountId === undefined ? undefined : input.financialAccountId || null,
      interestRate:
        input.interestRate === undefined
          ? undefined
          : input.interestRate === null || input.interestRate === ""
            ? null
            : decimal(input.interestRate),
      kind: input.kind,
      minimumPayment: input.minimumPayment === undefined ? undefined : decimal(input.minimumPayment),
      name: input.name?.trim(),
      originalAmount: input.originalAmount === undefined ? undefined : decimal(input.originalAmount),
      paymentDay: input.paymentDay === undefined ? undefined : input.paymentDay,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      status: input.status,
      targetCloseDate:
        input.targetCloseDate === undefined
          ? undefined
          : input.targetCloseDate
            ? new Date(input.targetCloseDate)
            : null,
    },
    include: { financialAccount: true, payments: true },
    where: { id },
  });
  return serializeLiability(liability);
}

export async function deleteLiability(id: string, userId?: string) {
  const resolvedUserId = await resolveUserId(userId);
  await assertRecordAccess("liability", id, resolvedUserId);
  await getDb().liability.delete({ where: { id } });
  return { deleted: true, id };
}

export async function addLiabilityPayment(id: string, input: CreateLiabilityPaymentInput) {
  const userId = await resolveUserId(input.userId);
  await assertRecordAccess("liability", id, userId);
  const amount = decimal(input.amount);
  const payment = await getDb().liabilityPayment.create({
    data: {
      amount,
      date: input.date ? new Date(input.date) : new Date(),
      liabilityId: id,
      note: input.note?.trim() || null,
      userId,
    },
  });
  const existing = await getDb().liability.findUniqueOrThrow({ where: { id } });
  const nextBalance = Math.max(Number(existing.currentBalance) - Number(amount), 0);
  const liability = await getDb().liability.update({
    data: {
      currentBalance: decimal(nextBalance),
      status: nextBalance === 0 ? "PAID" : existing.status,
    },
    include: { financialAccount: true, payments: true },
    where: { id },
  });
  return {
    liability: serializeLiability(liability),
    payment: serializeLiabilityPayment({
      ...payment,
      liability: existing,
    }),
  };
}

export async function updateFinancialAccount(
  id: string,
  input: {
    balance?: MoneyInput;
    isPrimary?: boolean;
    maskedPan?: string;
    name?: string;
    type?: "BANK" | "CARD" | "CASH" | "INVESTMENT" | "OTHER" | "SAVINGS";
    userId?: string;
  },
) {
  const userId = await resolveUserId(input.userId);
  await assertRecordAccess("financialAccount", id, userId);
  const account = await getDb().financialAccount.update({
    data: {
      balance: input.balance === undefined ? undefined : decimal(input.balance),
      isPrimary: input.isPrimary,
      maskedPan: input.maskedPan,
      name: input.name,
      type: input.type,
    },
    where: { id },
  });
  return serializeAccount(account);
}

export async function deleteFinancialAccount(id: string, userId?: string) {
  const resolvedUserId = await resolveUserId(userId);
  await assertRecordAccess("financialAccount", id, resolvedUserId);
  await getDb().financialAccount.update({
    data: {
      isActive: false,
      isPrimary: false,
    },
    where: { id },
  });
  return { deleted: true, id };
}

export async function deleteBudget(id: string, userId?: string) {
  const resolvedUserId = await resolveUserId(userId);
  await assertRecordAccess("budget", id, resolvedUserId);
  await getDb().budget.delete({ where: { id } });
  return { deleted: true, id };
}

export async function createCategory(input: CategoryInput) {
  const userId = await resolveUserId(input.userId);
  const name = input.name.trim();
  const icon = normalizeCategoryIcon(input.icon, name);
  const category = await getDb().category.create({
    data: {
      color: input.color ?? categoryColorForIcon(icon),
      dashboardGroup: input.dashboardGroup?.trim() || "Користувацькі",
      icon,
      name,
      slug: `${slugify(name)}-${randomSuffix()}`,
      userId,
    },
  });
  return serializeCategory(category, 0);
}

export async function updateCategory(id: string, input: Partial<CategoryInput>) {
  const userId = await resolveUserId(input.userId);
  await assertRecordAccess("category", id, userId);
  const icon = input.icon === undefined ? undefined : normalizeCategoryIcon(input.icon, input.name);
  const category = await getDb().category.update({
    data: {
      color: input.color ?? (icon ? categoryColorForIcon(icon) : undefined),
      dashboardGroup: input.dashboardGroup,
      icon,
      name: input.name,
    },
    where: { id },
  });
  return serializeCategory(category, 0);
}

export async function deleteCategory(id: string, userId?: string) {
  const resolvedUserId = await resolveUserId(userId);
  await assertRecordAccess("category", id, resolvedUserId);
  await getDb().category.update({
    data: { isActive: false },
    where: { id },
  });
  return { deleted: true, id };
}

function groupExpensesByCategory(
  expenses: Array<{ amount: Prisma.Decimal; category: { color: string; dashboardGroup: string; icon: string; name: string } | null }>,
) {
  const groups = new Map<string, { color: string; group: string; icon: string; name: string; total: number }>();
  for (const expense of expenses) {
    const key = expense.category?.name ?? "Без категорії";
    const current = groups.get(key) ?? {
      color: expense.category?.color ?? "#94a3b8",
      group: expense.category?.dashboardGroup ?? "Review",
      icon: expense.category?.icon ?? inferCategoryIcon(key),
      name: key,
      total: 0,
    };
    current.total += Number(expense.amount);
    groups.set(key, current);
  }
  return Array.from(groups.values()).sort((a, b) => b.total - a.total);
}

async function getWorkspaceOwner(userId?: string) {
  if (userId) {
    return getDb().user.findUnique({
      include: {
        notificationPreferences: true,
        passwordCredential: true,
        preferences: true,
        roles: {
          include: { role: true },
          orderBy: { assignedAt: "asc" },
        },
        securitySettings: true,
        subscription: true,
        telegramAccounts: true,
      },
      where: { id: userId },
    });
  }

  const defaultUser = await ensureDefaultUser();
  return getDb().user.findUnique({
    include: {
      notificationPreferences: true,
      passwordCredential: true,
      preferences: true,
      roles: {
        include: { role: true },
        orderBy: { assignedAt: "asc" },
      },
      securitySettings: true,
      subscription: true,
      telegramAccounts: true,
    },
    where: { id: defaultUser.id },
  });
}

async function resolveCategoryId(categoryId?: string, categoryName?: string, userId?: string) {
  if (categoryId) {
    return categoryId;
  }

  const name = categoryName?.trim();
  if (!name) {
    return undefined;
  }

  const existing = await getDb().category.findFirst({
    where: {
      ...ownerScoped(userId),
      isActive: true,
      OR: [{ name }, { slug: slugify(name) }],
    },
  });
  if (existing) {
    return existing.id;
  }

  const category = await getDb().category.create({
    data: {
      color: categoryColorForIcon(inferCategoryIcon(name)),
      dashboardGroup: "Користувацькі",
      icon: inferCategoryIcon(name),
      name,
      slug: `${slugify(name)}-${randomSuffix()}`,
      userId,
    },
  });
  return category.id;
}

async function assertRecordAccess(
  model: "budget" | "category" | "expense" | "financialAccount" | "goal" | "income" | "liability",
  id: string,
  userId: string,
) {
  const where = {
    id,
    OR: [{ userId }, { userId: null }],
  };
  const record =
    model === "expense"
      ? await getDb().expense.findFirst({ where })
      : model === "income"
        ? await getDb().income.findFirst({ where })
        : model === "budget"
          ? await getDb().budget.findFirst({ where })
        : model === "goal"
          ? await getDb().goal.findFirst({ where })
          : model === "financialAccount"
            ? await getDb().financialAccount.findFirst({ where })
            : model === "liability"
              ? await getDb().liability.findFirst({ where })
              : await getDb().category.findFirst({ where });

  if (!record) {
    throw new Error("Record was not found or is not available for this user");
  }
}

function serializeExpense(
  expense: Prisma.ExpenseGetPayload<{
    include: {
      category: true;
      financialAccount: true;
      tags: { include: { tag: true } };
    };
  }>,
) {
  return {
    accountId: expense.financialAccountId ?? null,
    account: expense.financialAccount?.name ?? null,
    amount: Number(expense.amount),
    categoryId: expense.categoryId ?? null,
    category: expense.category?.name ?? null,
    categoryColor: expense.category?.color ?? null,
    categoryIcon: expense.category?.icon ?? null,
    date: expense.date.toISOString(),
    description: expense.description,
    id: expense.id,
    paymentType: expense.paymentType,
    confidence: expense.confidence ? Number(expense.confidence) : null,
    sourceStatus: expense.sourceStatus,
    tags: expense.tags.map((item) => item.tag.name),
    type: "EXPENSE" as const,
  };
}

function serializeIncome(
  income: Prisma.IncomeGetPayload<{
    include: { financialAccount: true; tags: { include: { tag: true } } };
  }>,
) {
  return {
    accountId: income.financialAccountId ?? null,
    account: income.financialAccount?.name ?? null,
    amount: Number(income.amount),
    date: income.date.toISOString(),
    description: income.description,
    id: income.id,
    source: income.source,
    status: income.status,
    tags: income.tags.map((item) => item.tag.name),
  };
}

function normalizeTagNames(tags?: string[] | null) {
  return Array.from(
    new Set(
      (tags ?? [])
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 12),
    ),
  );
}

async function ensureUserTags(userId: string, names: string[]) {
  const db = getDb();
  const tags = [];
  for (const name of names) {
    const tag = await db.tag.upsert({
      where: {
        userId_name: {
          name,
          userId,
        },
      },
      update: {},
      create: {
        name,
        userId,
      },
    });
    tags.push(tag);
  }
  return tags;
}

async function syncExpenseTags(expenseId: string, userId: string, tags?: string[] | null) {
  const db = getDb();
  const names = normalizeTagNames(tags);
  await db.expenseTag.deleteMany({ where: { expenseId } });
  if (!names.length) return;
  const userTags = await ensureUserTags(userId, names);
  await db.expenseTag.createMany({
    data: userTags.map((tag) => ({
      expenseId,
      tagId: tag.id,
    })),
    skipDuplicates: true,
  });
}

async function syncIncomeTags(incomeId: string, userId: string, tags?: string[] | null) {
  const db = getDb();
  const names = normalizeTagNames(tags);
  await db.incomeTag.deleteMany({ where: { incomeId } });
  if (!names.length) return;
  const userTags = await ensureUserTags(userId, names);
  await db.incomeTag.createMany({
    data: userTags.map((tag) => ({
      incomeId,
      tagId: tag.id,
    })),
    skipDuplicates: true,
  });
}

function serializeBudget(
  budget: Prisma.BudgetGetPayload<{ include: { category: true } }>,
  expenses: Array<{ amount: Prisma.Decimal; categoryId: string | null }>,
) {
  const usage = calculateBudgetUsage(budget, expenses);
  return {
    category: budget.category?.name ?? budget.name,
    categoryColor: budget.category?.color ?? budget.color,
    categoryIcon: budget.category?.icon ?? inferCategoryIcon(budget.category?.name ?? budget.name),
    categoryId: budget.categoryId ?? null,
    id: budget.id,
    limit: usage.limit,
    month: budget.month.toISOString(),
    name: budget.name,
    percent: usage.percent,
    remaining: usage.remaining,
    spent: usage.spent,
  };
}

function serializeGoal(goal: Prisma.GoalGetPayload<{ include: { contributions: true } }>) {
  const progress = calculateGoalProgress(goal);
  return {
    color: goal.color,
    contributions: goal.contributions.map((item) => ({
      amount: Number(item.amount),
      date: item.date.toISOString(),
      id: item.id,
      note: item.note,
    })),
    deadline: goal.deadline?.toISOString() ?? null,
    description: goal.description,
    id: goal.id,
    imageUrl: goal.imageUrl,
    name: goal.name,
    percent: progress.percent,
    savedAmount: progress.saved,
    status: goal.status,
    targetAmount: progress.target,
  };
}

function serializeLiability(
  liability: Prisma.LiabilityGetPayload<{
    include: { financialAccount: true; payments: true };
  }>,
) {
  const currentBalance = Number(liability.currentBalance);
  const originalAmount = Number(liability.originalAmount);
  return {
    creditor: liability.creditor,
    currentBalance,
    description: liability.description,
    financialAccountId: liability.financialAccountId ?? null,
    id: liability.id,
    interestRate: liability.interestRate ? Number(liability.interestRate) : null,
    kind: liability.kind,
    minimumPayment: Number(liability.minimumPayment),
    name: liability.name,
    originalAmount,
    paymentDay: liability.paymentDay,
    payments: liability.payments.map((payment) => ({
      amount: Number(payment.amount),
      date: payment.date.toISOString(),
      id: payment.id,
      note: payment.note,
    })),
    percentPaid: originalAmount > 0 ? Math.round(((originalAmount - currentBalance) / originalAmount) * 100) : 0,
    remainingPercent: originalAmount > 0 ? Math.round((currentBalance / originalAmount) * 100) : 0,
    startDate: liability.startDate.toISOString(),
    status: liability.status,
    targetCloseDate: liability.targetCloseDate?.toISOString() ?? null,
    account: liability.financialAccount?.name ?? null,
  };
}

function serializeLiabilityPayment(
  payment: Prisma.LiabilityPaymentGetPayload<{ include: { liability: true } }>,
) {
  return {
    amount: Number(payment.amount),
    date: payment.date.toISOString(),
    id: payment.id,
    liabilityId: payment.liabilityId,
    liabilityName: payment.liability?.name ?? null,
    note: payment.note,
  };
}

function serializeAccount(account: {
  balance: Prisma.Decimal;
  id: string;
  isPrimary: boolean;
  maskedPan: string | null;
  name: string;
  provider: string;
  type: string;
}) {
  return {
    balance: Number(account.balance),
    id: account.id,
    isPrimary: account.isPrimary,
    maskedPan: account.maskedPan,
    name: account.name,
    provider: account.provider,
    type: account.type,
  };
}

function serializeCategory(category: {
  color: string;
  dashboardGroup: string;
  icon?: string | null;
  id: string;
  name: string;
  slug: string;
}, total: number) {
  return {
    color: category.color,
    dashboardGroup: category.dashboardGroup,
    group: category.dashboardGroup,
    icon: category.icon ?? inferCategoryIcon(category.name),
    id: category.id,
    name: category.name,
    slug: category.slug,
    total,
  };
}

function normalizeCategoryIcon(icon?: string | null, name?: string) {
  if (icon && categoryIconNames.has(icon)) {
    return icon;
  }
  return inferCategoryIcon(name ?? "");
}

function inferCategoryIcon(category: string | null) {
  const normalized = (category ?? "").toLocaleLowerCase("uk-UA");
  if (normalized.includes("їж") || normalized.includes("хав") || normalized.includes("продукт") || normalized.includes("кафе") || normalized.includes("ресторан")) return "cart";
  if (normalized.includes("транспорт") || normalized.includes("авто") || normalized.includes("bolt") || normalized.includes("таксі")) return "car";
  if (normalized.includes("палив") || normalized.includes("wog") || normalized.includes("окко")) return "fuel";
  if (normalized.includes("комун") || normalized.includes("дім") || normalized.includes("житло")) return "home";
  if (normalized.includes("підпис") || normalized.includes("ai") || normalized.includes("аі")) return "subscriptions";
  if (normalized.includes("лік") || normalized.includes("здоров")) return "medical";
  if (normalized.includes("донат") || normalized.includes("благод")) return "heart";
  if (normalized.includes("свято") || normalized.includes("подар")) return "gift";
  if (normalized.includes("подорож") || normalized.includes("відпуст")) return "plane";
  if (normalized.includes("освіт") || normalized.includes("навчан")) return "book";
  if (normalized.includes("зв'яз") || normalized.includes("звʼяз") || normalized.includes("телефон")) return "phone";
  if (normalized.includes("розва") || normalized.includes("кіно") || normalized.includes("відпоч")) return "smile";
  if (normalized.includes("зарп") || normalized.includes("дох") || normalized.includes("фриланс")) return "income";
  return "expenses";
}

function categoryColorForIcon(icon?: string | null) {
  const normalized = normalizeCategoryIcon(icon);
  const colors: Record<string, string> = {
    analytics: "#0f766e",
    bank: "#1d4ed8",
    bell: "#2563eb",
    book: "#7c3aed",
    briefcase: "#7c3aed",
    calendar: "#475569",
    car: "#06b6d4",
    cart: "#22c55e",
    chart: "#16a34a",
    expenses: "#64748b",
    fuel: "#64748b",
    gift: "#f97316",
    goals: "#7c3aed",
    heart: "#ec4899",
    home: "#3b82f6",
    income: "#22c55e",
    lightbulb: "#f59e0b",
    medical: "#ef4444",
    openai: "#0ea5e9",
    pet: "#a855f7",
    phone: "#84cc16",
    piggy: "#f43f5e",
    plane: "#2563eb",
    receipt: "#64748b",
    shield: "#0284c7",
    shirt: "#14b8a6",
    smile: "#8b5cf6",
    spark: "#8b5cf6",
    subscriptions: "#f59e0b",
    transactions: "#64748b",
    user: "#64748b",
    wallet: "#22c55e",
  };
  return colors[normalized] ?? "#22c55e";
}

function serializeIntegration(integration: {
  externalAccountId: string | null;
  id: string;
  label: string;
  lastSyncAt: Date | null;
  provider: string;
  status: string;
}) {
  return {
    externalAccountId: integration.externalAccountId,
    id: integration.id,
    label: integration.label,
    lastSyncAt: integration.lastSyncAt?.toISOString() ?? null,
    provider: integration.provider,
    status: integration.status,
  };
}

function ownerScoped(userId?: string) {
  return userId ? { OR: [{ userId }, { userId: null }] } : {};
}

async function resolveUserId(userId?: string) {
  if (userId) {
    return userId;
  }
  return (await ensureDefaultUser()).id;
}

function decimal(value: MoneyInput) {
  return new Prisma.Decimal(value);
}

function startOfMonth(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
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
