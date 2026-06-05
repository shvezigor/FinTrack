import type { IconName } from "./icons";

export type PageKey =
  | "admin"
  | "analytics"
  | "budgets"
  | "dashboard"
  | "expenses"
  | "goals"
  | "income"
  | "liabilities"
  | "loans"
  | "settings"
  | "transactions";

export type CategoryRow = {
  color: string;
  dashboardGroup?: string;
  group?: string;
  icon?: string | null;
  id?: string;
  name: string;
  slug?: string;
  total: number;
};

export type ExpenseRow = {
  account?: string | null;
  accountId?: string | null;
  amount: number;
  category: string | null;
  categoryColor: string | null;
  categoryIcon?: string | null;
  categoryId?: string | null;
  date: string;
  description: string | null;
  id: string;
  paymentType?: string;
  sourceStatus?: string;
  tags?: string[];
  type?: "EXPENSE";
};

export type IncomeRow = {
  account?: string | null;
  accountId?: string | null;
  amount: number;
  date: string;
  description: string | null;
  id: string;
  source: string;
  status?: string;
  tags?: string[];
  type?: "INCOME";
};

export type BudgetRow = {
  category: string;
  categoryColor: string;
  categoryIcon?: string | null;
  categoryId?: string | null;
  id: string;
  limit: number;
  month?: string;
  name: string;
  percent: number;
  remaining: number;
  spent: number;
};

export type GoalRow = {
  color: string;
  deadline: string | null;
  description: string | null;
  id: string;
  imageUrl: string | null;
  name: string;
  percent: number;
  savedAmount: number;
  status: string;
  targetAmount: number;
};

export type TagRow = {
  id: string;
  name: string;
};

export type AiProviderCode = "OPENAI" | "ANTHROPIC" | "GEMINI" | "OPENROUTER";

export type AiProviderConnectionRow = {
  connected: boolean;
  keyMode: "SYSTEM" | "USER";
  model: string;
  provider: AiProviderCode;
  providerLabel: string;
  runtimeReady?: boolean;
  status: string;
  systemAvailable: boolean;
  systemSupported?: boolean;
  tokenUrl: string;
  userKeyConfigured: boolean;
};

export type LiabilityPaymentRow = {
  amount: number;
  date: string;
  id: string;
  liabilityId: string;
  liabilityName: string | null;
  note: string | null;
};

export type LiabilityRow = {
  account: string | null;
  creditor: string | null;
  currentBalance: number;
  description: string | null;
  financialAccountId: string | null;
  id: string;
  interestRate: number | null;
  kind: string;
  minimumPayment: number;
  name: string;
  originalAmount: number;
  paymentDay: number | null;
  payments: LiabilityPaymentRow[];
  percentPaid: number;
  remainingPercent: number;
  startDate: string;
  status: string;
  targetCloseDate: string | null;
};

export type LoanRow = {
  id: string;
  recipientName: string;
  amount: number;
  dateLent: string;
  plannedReturnDate: string | null;
  actualReturnDate: string | null;
  description: string | null;
  status: string;
};

export type AccountRow = {
  balance: number;
  id: string;
  isPrimary: boolean;
  maskedPan: string | null;
  name: string;
  provider: string;
  type: string;
};

export type NotificationRow = {
  actionLabel?: string | null;
  actionUrl?: string | null;
  createdAt: string;
  id: string;
  isRead: boolean;
  key: string;
  message: string;
  severity: string;
  telegramSentAt?: string | null;
  title: string;
};

export type Snapshot = {
  accounts: AccountRow[];
  budgets: BudgetRow[];
  categories: CategoryRow[];
  connections: {
    ai?: (AiProviderConnectionRow & { providers?: AiProviderConnectionRow[] }) | null;
    googleSheets: boolean;
    integrations?: Array<{ id: string; label: string; provider: string; status: string }>;
    monobank: boolean;
    openai: boolean;
    telegramBotUrl?: string | null;
    telegramBotUsername?: string | null;
    telegramConnected?: boolean;
    secrets?: Array<{
      createdAt: string;
      hasValue: boolean;
      keyName: string;
      label: string | null;
      lastUsedAt: string | null;
      provider: string;
      revokedAt: string | null;
      updatedAt: string;
    }>;
  };
  goals: GoalRow[];
  incomes: IncomeRow[];
  liabilities: LiabilityRow[];
  liabilityPayments: LiabilityPaymentRow[];
  loans: LoanRow[];
  notifications: NotificationRow[];
  tags?: TagRow[];
  overview: {
    accountBalance: number;
    activeLiabilityCount: number;
    byCategory: CategoryRow[];
    liabilityDueSoonCount: number;
    liabilityMinimumTotal: number;
    liabilityTotal: number;
    monthActualIncomeTotal: number;
    monthExpenseTotal: number;
    monthIncomeTotal: number;
    monthPlannedIncomeTotal?: number;
    needsReviewCount: number;
    prevMonthExpenseTotal: number;
    savings: number;
    unreadNotificationCount?: number;
  };
  profile: {
    avatarUrl: string | null;
    currencyCode: number;
    email: string;
    locale: string;
    name: string | null;
    numberFormat: string;
    notifications?: Array<{ enabled: boolean; key: string }>;
    phone: string | null;
    role: string;
    security?: {
      actionConfirmationEnabled: boolean;
      autoLogoutMinutes: number;
      hasPassword: boolean;
      passwordChangedAt: string | null;
      twoFactorEnabled: boolean;
    };
    subscription?: {
      currencyCode: number;
      priceMonthly: number;
      renewsAt: string | null;
      status: string;
      tier: string;
    } | null;
    timezone: string;
  } | null;
  transactions: Array<ExpenseRow | IncomeRow>;
};

export const navItems: Array<{ icon: IconName; key: PageKey; label: string }> = [
  { icon: "dashboard", key: "dashboard", label: "Дашборд" },
  { icon: "transactions", key: "transactions", label: "Транзакції" },
  { icon: "wallet", key: "income", label: "Доходи" },
  { icon: "expenses", key: "expenses", label: "Витрати" },
  { icon: "briefcase", key: "budgets", label: "Бюджети" },
  { icon: "goals", key: "goals", label: "Цілі" },
  { icon: "creditCard", key: "liabilities", label: "Зобовʼязання" },
  { icon: "piggy", key: "loans", label: "Позики" },
  { icon: "analytics", key: "analytics", label: "Аналітика" },
  { icon: "settings", key: "settings", label: "Налаштування" },
  { icon: "shield", key: "admin", label: "Адмін" },
];

export const trendData = [
  { budget: 29000, expense: 19500, income: 48000, month: "Гру", net: 22000 },
  { budget: 25000, expense: 24000, income: 55000, month: "Січ", net: 33000 },
  { budget: 28500, expense: 21000, income: 47000, month: "Лют", net: 12500 },
  { budget: 32500, expense: 34500, income: 68000, month: "Бер", net: 36000 },
  { budget: 29200, expense: 28500, income: 58000, month: "Кві", net: 17000 },
  { budget: 42300, expense: 31780, income: 61000, month: "Тра", net: 30000 },
];

export const fallbackCategories: CategoryRow[] = [
  { color: "#22c55e", group: "Побут", icon: "cart", name: "Продукти", total: 9450 },
  { color: "#3b82f6", group: "Обовʼязкові", icon: "home", name: "Комунальні", total: 6240 },
  { color: "#06b6d4", group: "Рух", icon: "car", name: "Транспорт", total: 5150 },
  { color: "#8b5cf6", group: "Події", icon: "smile", name: "Розваги", total: 4280 },
  { color: "#f59e0b", group: "Сервіси", icon: "subscriptions", name: "Підписки", total: 3120 },
  { color: "#9ca3af", group: "Інше", icon: "expenses", name: "Інше", total: 1540 },
];

export const fallbackExpenses: ExpenseRow[] = [
  {
    account: "Картка monobank",
    amount: 1248,
    category: "Продукти",
    categoryColor: "#22c55e",
    date: "2024-05-16T14:20:00.000Z",
    description: "Сільпо, вул. Хрещатик 15",
    id: "demo-expense-1",
    tags: ["Їжа"],
    type: "EXPENSE",
  },
  {
    account: "Картка monobank",
    amount: 320,
    category: "Транспорт",
    categoryColor: "#06b6d4",
    date: "2024-05-16T11:05:00.000Z",
    description: "Метро, поповнення картки",
    id: "demo-expense-2",
    tags: ["Транспорт"],
    type: "EXPENSE",
  },
  {
    account: "Картка monobank",
    amount: 1560,
    category: "Комунальні",
    categoryColor: "#3b82f6",
    date: "2024-05-14T13:37:00.000Z",
    description: "Київгаз, квітень",
    id: "demo-expense-3",
    tags: ["Комунальні"],
    type: "EXPENSE",
  },
  {
    account: "Картка monobank",
    amount: 199,
    category: "Підписки",
    categoryColor: "#f59e0b",
    date: "2024-05-14T09:21:00.000Z",
    description: "YouTube Premium",
    id: "demo-expense-4",
    tags: ["Підписки"],
    type: "EXPENSE",
  },
  {
    account: "Картка monobank",
    amount: 420,
    category: "Розваги",
    categoryColor: "#8b5cf6",
    date: "2024-05-13T21:15:00.000Z",
    description: "Кінотеатр Multiplex",
    id: "demo-expense-5",
    tags: ["Відпочинок"],
    type: "EXPENSE",
  },
  {
    account: "Готівка",
    amount: 860,
    category: "Інше",
    categoryColor: "#9ca3af",
    date: "2024-05-13T18:10:00.000Z",
    description: "Rozetka",
    id: "demo-expense-6",
    tags: ["Дім"],
    type: "EXPENSE",
  },
];

export const fallbackIncomes: IncomeRow[] = [
  {
    account: "Основний рахунок",
    amount: 23600,
    date: "2024-05-16T18:42:00.000Z",
    description: "Зарплата за травень",
    id: "demo-income-1",
    source: "Зарплата",
    status: "Отримано",
    tags: ["Робота"],
    type: "INCOME",
  },
  {
    account: "Бізнес-рахунок",
    amount: 7200,
    date: "2024-05-15T19:10:00.000Z",
    description: "Проект для компанії Digital Solutions",
    id: "demo-income-2",
    source: "Фриланс",
    status: "Отримано",
    tags: ["Фриланс"],
    type: "INCOME",
  },
  {
    account: "Основний рахунок",
    amount: 3200,
    date: "2024-05-14T11:00:00.000Z",
    description: "Повернення податку за 2023 рік",
    id: "demo-income-3",
    source: "Повернення",
    status: "Отримано",
    tags: ["Повернення"],
    type: "INCOME",
  },
  {
    account: "Інвестиційний рахунок",
    amount: 1800,
    date: "2024-05-12T09:00:00.000Z",
    description: "Дивіденди від акцій",
    id: "demo-income-4",
    source: "Інвестиції",
    status: "Отримано",
    tags: ["Інвестиції"],
    type: "INCOME",
  },
];

export const fallbackBudgets: BudgetRow[] = [
  { category: "Продукти", categoryColor: "#22c55e", id: "budget-1", limit: 12000, name: "Продукти", percent: 79, remaining: 2550, spent: 9450 },
  { category: "Комунальні", categoryColor: "#3b82f6", id: "budget-2", limit: 8000, name: "Комунальні", percent: 78, remaining: 1760, spent: 6240 },
  { category: "Транспорт", categoryColor: "#06b6d4", id: "budget-3", limit: 6000, name: "Транспорт", percent: 86, remaining: 850, spent: 5150 },
  { category: "Розваги", categoryColor: "#8b5cf6", id: "budget-4", limit: 6000, name: "Розваги", percent: 71, remaining: 1720, spent: 4280 },
  { category: "Підписки", categoryColor: "#f59e0b", id: "budget-5", limit: 4000, name: "Підписки", percent: 78, remaining: 880, spent: 3120 },
  { category: "Дім", categoryColor: "#fb7185", id: "budget-6", limit: 6060, name: "Дім", percent: 61, remaining: 2370, spent: 3690 },
];

export const fallbackGoals: GoalRow[] = [
  {
    color: "#22c55e",
    deadline: "2024-12-01T00:00:00.000Z",
    description: "Фінансова подушка безпеки",
    id: "goal-1",
    imageUrl: "https://images.unsplash.com/photo-1615485737651-580c9159c89f?auto=format&fit=crop&w=320&q=80",
    name: "Резервний фонд",
    percent: 64,
    savedAmount: 38450,
    status: "ACTIVE",
    targetAmount: 60000,
  },
  {
    color: "#3b82f6",
    deadline: "2024-09-01T00:00:00.000Z",
    description: "10 днів відпочинку на островах",
    id: "goal-2",
    imageUrl: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=320&q=80",
    name: "Відпустка в Греції",
    percent: 48,
    savedAmount: 28500,
    status: "ACTIVE",
    targetAmount: 60000,
  },
  {
    color: "#f59e0b",
    deadline: "2025-02-01T00:00:00.000Z",
    description: "Для роботи та навчання",
    id: "goal-3",
    imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=320&q=80",
    name: "Новий ноутбук",
    percent: 22,
    savedAmount: 7800,
    status: "ACTIVE",
    targetAmount: 35000,
  },
  {
    color: "#8b5cf6",
    deadline: "2026-04-01T00:00:00.000Z",
    description: "Мрія про нове авто",
    id: "goal-4",
    imageUrl: "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=320&q=80",
    name: "Авто",
    percent: 1,
    savedAmount: 3700,
    status: "ACTIVE",
    targetAmount: 300000,
  },
];

export const fallbackAccounts: AccountRow[] = [
  { balance: 18240, id: "account-2", isPrimary: false, maskedPan: "5375 **** **** 5678", name: "monobank", provider: "MONOBANK", type: "CARD" },
  { balance: 8700, id: "account-3", isPrimary: false, maskedPan: "4149 **** **** 9101", name: "Райффайзен Банк", provider: "BANK", type: "BANK" },
  { balance: 3450, id: "account-4", isPrimary: false, maskedPan: "Готівка", name: "Кеш", provider: "MANUAL", type: "CASH" },
];

export const fallbackLiabilities: LiabilityRow[] = [
  {
    account: "monobank",
    creditor: "ПриватБанк",
    currentBalance: 18000,
    description: "Кредит на ноутбук",
    financialAccountId: null,
    id: "liability-1",
    interestRate: 24,
    kind: "INSTALLMENT",
    minimumPayment: 1800,
    name: "Розстрочка ноутбук",
    originalAmount: 24000,
    paymentDay: 15,
    payments: [],
    percentPaid: 25,
    remainingPercent: 75,
    startDate: "2024-01-01T00:00:00.000Z",
    status: "ACTIVE",
    targetCloseDate: "2025-01-01T00:00:00.000Z",
  },
  {
    account: null,
    creditor: "Друг Ігор",
    currentBalance: 5000,
    description: "Позика до зарплати",
    financialAccountId: null,
    id: "liability-2",
    interestRate: null,
    kind: "PERSONAL_DEBT",
    minimumPayment: 0,
    name: "Борг Ігорю",
    originalAmount: 5000,
    paymentDay: null,
    payments: [],
    percentPaid: 0,
    remainingPercent: 100,
    startDate: "2024-04-01T00:00:00.000Z",
    status: "ACTIVE",
    targetCloseDate: null,
  },
  {
    account: "monobank",
    creditor: "monobank",
    currentBalance: 0,
    description: "Кредитна картка погашена",
    financialAccountId: null,
    id: "liability-3",
    interestRate: 36,
    kind: "CREDIT_CARD",
    minimumPayment: 0,
    name: "Кредитна картка Mono",
    originalAmount: 10000,
    paymentDay: null,
    payments: [],
    percentPaid: 100,
    remainingPercent: 0,
    startDate: "2023-06-01T00:00:00.000Z",
    status: "PAID",
    targetCloseDate: "2024-03-01T00:00:00.000Z",
  },
];

export const fallbackLoans: LoanRow[] = [
  {
    id: "loan-1",
    recipientName: "Інна Коваль",
    amount: 5000,
    dateLent: "2024-03-15T00:00:00.000Z",
    plannedReturnDate: "2024-05-15T00:00:00.000Z",
    actualReturnDate: null,
    description: "Борг на подорож до Болгарії",
    status: "ACTIVE",
  },
  {
    id: "loan-2",
    recipientName: "Марко Лучик",
    amount: 3000,
    dateLent: "2024-02-01T00:00:00.000Z",
    plannedReturnDate: "2024-04-01T00:00:00.000Z",
    actualReturnDate: "2024-04-05T00:00:00.000Z",
    description: "Допомога з ремонтом",
    status: "RETURNED",
  },
  {
    id: "loan-3",
    recipientName: "Ольга Проценко",
    amount: 7500,
    dateLent: "2023-12-10T00:00:00.000Z",
    plannedReturnDate: "2024-03-10T00:00:00.000Z",
    actualReturnDate: null,
    description: "Купівля новорічних подарунків",
    status: "OVERDUE",
  },
];

export const heatmapRows = [
  ["Пн", 1, 2, 1, 3, 4, 5, 6],
  ["Вт", 2, 2, 3, 4, 4, 5, 7],
  ["Ср", 1, 2, 3, 5, 4, 6, 8],
  ["Чт", 2, 2, 3, 4, 5, 7, 9],
  ["Пт", 1, 2, 2, 4, 5, 8, 10],
  ["Сб", 2, 3, 2, 3, 4, 6, 7],
  ["Нд", 1, 2, 2, 3, 4, 5, 6],
];

export const emptySnapshot: Snapshot = {
  accounts: [],
  budgets: [],
  categories: [],
  connections: {
    googleSheets: false,
    monobank: false,
    openai: false,
    telegramBotUrl: null,
    telegramBotUsername: null,
    telegramConnected: false,
  },
  goals: [],
  incomes: [],
  liabilities: [],
  liabilityPayments: [],
  loans: [],
  notifications: [],
  tags: [],
  overview: {
    accountBalance: 0,
    activeLiabilityCount: 0,
    byCategory: [],
    liabilityDueSoonCount: 0,
    liabilityMinimumTotal: 0,
    liabilityTotal: 0,
    monthActualIncomeTotal: 0,
    monthExpenseTotal: 0,
    monthIncomeTotal: 0,
    monthPlannedIncomeTotal: 0,
    needsReviewCount: 0,
    prevMonthExpenseTotal: 0,
    savings: 0,
    unreadNotificationCount: 0,
  },
  profile: null,
  transactions: [],
};
