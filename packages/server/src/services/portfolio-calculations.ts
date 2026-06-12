export type AmountLike = number | string | { toString(): string };

export type BudgetCalculationInput = {
  categoryId: string | null;
  limit: AmountLike;
};

export type BudgetExpenseInput = {
  amount: AmountLike;
  categoryId: string | null;
};

export type GoalCalculationInput = {
  savedAmount: AmountLike;
  targetAmount: AmountLike;
};

export function toNumber(value: AmountLike) {
  return Number(value);
}

export function normalizeIncomeStatus(status?: string) {
  const value = String(status ?? "RECEIVED").trim().toUpperCase();
  if (value === "PLANNED" || value === "PENDING" || value === "FAILED" || value === "CANCELLED") {
    return value;
  }
  return "RECEIVED";
}

export function isPlannedIncomeStatus(status: string) {
  return normalizeIncomeStatus(status) === "PLANNED";
}

export function isActualIncomeStatus(status: string) {
  return normalizeIncomeStatus(status) === "RECEIVED";
}

export function calculateActualIncomeTotal(incomes: Array<{ amount: AmountLike; status: string }>) {
  return incomes.filter((income) => isActualIncomeStatus(income.status)).reduce((sum, income) => sum + toNumber(income.amount), 0);
}

export function calculatePlannedIncomeTotal(incomes: Array<{ amount: AmountLike; status: string }>) {
  return incomes.filter((income) => isPlannedIncomeStatus(income.status)).reduce((sum, income) => sum + toNumber(income.amount), 0);
}

export function calculateBudgetLimitTotal(budgets: Array<{ limit: AmountLike }>) {
  return budgets.reduce((sum, budget) => sum + toNumber(budget.limit), 0);
}

export function calculateBudgetSavings(budgetTotal: AmountLike, expenseTotal: AmountLike) {
  return toNumber(budgetTotal) - toNumber(expenseTotal);
}

export function calculateBudgetUsage(budget: BudgetCalculationInput, expenses: BudgetExpenseInput[]) {
  const spent = expenses
    .filter((expense) => expense.categoryId === budget.categoryId)
    .reduce((sum, expense) => sum + toNumber(expense.amount), 0);
  const limit = toNumber(budget.limit);

  return {
    limit,
    percent: limit ? Math.round((spent / limit) * 100) : 0,
    remaining: limit - spent,
    spent,
  };
}

export function calculateGoalProgress(goal: GoalCalculationInput) {
  const saved = toNumber(goal.savedAmount);
  const target = toNumber(goal.targetAmount);

  return {
    percent: target ? Math.round((saved / target) * 100) : 0,
    saved,
    target,
  };
}
