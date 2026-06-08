// @ts-nocheck
"use client";
/* __next_internal_client_entry_do_not_use__ DashboardShell auto */ import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import * as XLSX from "xlsx";
import { emptySnapshot, fallbackBudgets, fallbackCategories, fallbackExpenses, fallbackGoals, fallbackIncomes, heatmapRows, navItems, trendData } from "./finance-data";
import { apiOrigin, authErrorText, authHeaders, defaultEmail } from "./dashboard-api";
import { dateRangeKey, daysInRange, endOfDay, formatDayLabel, formatMonthLabel, formatRangeLabel, formatTableDate, isDateInRange, isSameCalendarDay, matchesDateRange, monthRangeFromDate, normalizeDateRange, startOfDay } from "./dashboard-date-utils";
import { budgetColumns, dashboardTransactionColumns, defaultBudgetColumnWidths, defaultDashboardTransactionColumnWidths, defaultIncomeColumnWidths, defaultTransactionColumnWidths, incomeColumns, transactionColumns } from "./dashboard-table-config";
import { Icon } from "./icons";
import { LanguageSwitcher, useI18n } from "./i18n";
import { getCurrencyOptions, getLocaleOptions, getNumberFormatOptions, getTimeZoneOptions } from "./preferences-options";
import { emitAppToast, handleValidationCapture, ToastPopup, useAppToastHost } from "./toast-feedback";
const indicatorTooltips = {
    en: {
        dashboard: {
            actualIncome: "Shows completed income received in the current month. Planned or pending income is excluded.",
            plannedIncome: "Shows income planned for the current month that has not been confirmed as received yet.",
            expenses: "Shows all expense transactions recorded in the current month after the active filters are applied.",
            savings: "Shows the remaining amount after subtracting monthly expenses from actual monthly income."
        },
        income: {
            totalPeriod: "Shows the total actual income for the selected period after account, status, and source filters are applied.",
            topSource: "Shows the income source that brought the largest total amount in the selected period.",
            averageIncome: "Shows the average amount per actual income record in the current filtered selection.",
            sourceCount: "Shows how many unique income sources are present in the selected period."
        },
        expenses: {
            totalPeriod: "Shows the full expense amount for the selected period after filters are applied.",
            averageDaily: "Shows how much you spend on average per day in the selected date range.",
            topCategory: "Shows the category with the largest expense share in the current filtered selection.",
            aiSignals: "Shows expense records that may need review: unusual amounts, low-confidence categorization, or missing category mapping."
        },
        budgets: {
            monthlyBudget: "Shows the total spending limit you set for the selected budgeting period across all budget categories.",
            spentNow: "Shows how much of the current budget has already been spent based on actual expense records.",
            remaining: "Shows how much budget is still available before limits are reached.",
            budgetScore: "Shows a quick health score for your budget based on overspending, reserve left, and category discipline."
        },
        goals: {
            activeGoals: "Shows how many goals are currently active and not yet completed.",
            savedToGoals: "Shows the total amount already recorded as real contributions across all active goals.",
            monthlyContribution: "Shows how much you contributed to goals during the current month.",
            estimatedCompletion: "Shows the nearest estimated completion date based on your saved amount, target amount, and current contribution pace."
        },
        analytics: {
            savingsRate: "Shows what share of actual income remained after expenses in the selected period.",
            expenseIncomeRatio: "Shows how large your expenses are relative to actual income in the selected period.",
            netFlowChange: "Shows how much the net cash flow changed compared with the previous equivalent period.",
            cashflowScore: "Shows a synthetic score of cash-flow stability based on income, expenses, savings rate, and review signals.",
            financialHealth: "Shows a higher-level reading of financial stability based on current cash flow, expense pressure, and savings behavior.",
            nextMonthForecast: "Shows the estimated net cash flow for the next month based on recent income and expense dynamics.",
            periodComparison: "Shows how income, expenses, and net result changed compared with the previous equivalent period.",
            cashflowTrend: "Shows income, expenses, and net flow across the selected period so you can spot spikes and unstable days.",
            expensesByCategory: "Shows how total expenses are split across categories in the selected period.",
            insights: "Shows short, data-based observations generated from your current spending and income patterns.",
            incomeVsExpenses: "Shows how income and expenses move against each other over time in the selected period.",
            spendingPatterns: "Shows which days and time windows concentrate the most spending activity.",
            topCategoryChange: "Shows which expense categories changed the most versus the previous equivalent period.",
            goalProgress: "Shows the current progress of your financial goals relative to their targets."
        },
        transactions: {
            total: "Shows the number of transactions visible under the current tab and filters.",
            income: "Shows only actual completed income records visible under the current filters.",
            expenses: "Shows expense records visible under the current filters.",
            transfers: "Shows transfer-type expense records visible under the current filters.",
            averageCheck: "Shows the average transaction amount in the current filtered selection.",
            list: "Shows the detailed transaction list for the active tab and filters."
        },
        liabilities: {
            totalDebt: "Shows the total outstanding balance across all active obligations.",
            activeCount: "Shows the number of active obligations currently being tracked.",
            minimumPayment: "Shows the sum of minimum monthly payments due across all active obligations.",
            dueSoon: "Shows obligations with a payment day falling within the next 7 days."
        },
        loans: {
            totalLoaned: "Shows the total amount of money you have lent out that is still outstanding.",
            activeCount: "Shows the number of active loans you have made to others.",
            overdue: "Shows loans where the planned return date has passed.",
            dueNext: "Shows loans with a planned return date within the next 7 days."
        }
    },
    uk: {
        dashboard: {
            actualIncome: "Показує лише фактичні доходи, які реально надійшли в поточному місяці. Прогнозовані та очікувані доходи сюди не входять.",
            plannedIncome: "Показує доходи, які заплановані на поточний місяць, але ще не підтверджені як отримані.",
            expenses: "Показує всі витрати за поточний місяць з урахуванням активних фільтрів.",
            savings: "Показує залишок після віднімання місячних витрат від фактичного доходу за місяць."
        },
        income: {
            totalPeriod: "Показує суму всіх фактичних доходів за вибраний період з урахуванням фільтрів за джерелом, рахунком і статусом.",
            topSource: "Показує джерело доходу, яке принесло найбільшу суму за вибраний період.",
            averageIncome: "Показує середню суму одного фактичного запису доходу в поточній вибірці.",
            sourceCount: "Показує кількість унікальних джерел доходу у вибраному періоді."
        },
        expenses: {
            totalPeriod: "Показує загальну суму витрат за вибраний період після застосування фільтрів.",
            averageDaily: "Показує, скільки ви в середньому витрачаєте за день у вибраному діапазоні дат.",
            topCategory: "Показує категорію з найбільшою часткою витрат у поточній вибірці.",
            aiSignals: "Показує витрати, які варто перевірити: незвичні суми, слабке розпізнавання або відсутню категорію."
        },
        budgets: {
            monthlyBudget: "Показує сумарний ліміт витрат, який ви задали на вибраний бюджетний період по всіх категоріях.",
            spentNow: "Показує, скільки бюджету вже витрачено на основі фактичних витрат.",
            remaining: "Показує, скільки бюджету ще доступно до вичерпання лімітів.",
            budgetScore: "Показує швидку оцінку стану бюджету з урахуванням перевищень, запасу та дисципліни по категоріях."
        },
        goals: {
            activeGoals: "Показує кількість цілей, які зараз активні й ще не досягнуті.",
            savedToGoals: "Показує загальну суму реальних внесків, уже зафіксованих по всіх активних цілях.",
            monthlyContribution: "Показує, скільки ви внесли в цілі протягом поточного місяця.",
            estimatedCompletion: "Показує найближчу очікувану дату завершення на основі накопиченої суми, цільової суми та поточного темпу внесків."
        },
        analytics: {
            savingsRate: "Показує, яка частка фактичного доходу залишилась після витрат за вибраний період.",
            expenseIncomeRatio: "Показує, яку частину фактичного доходу з’їдають витрати за вибраний період.",
            netFlowChange: "Показує, як змінився чистий грошовий потік відносно попереднього аналогічного періоду.",
            cashflowScore: "Показує зведену оцінку стабільності грошового потоку на основі доходів, витрат, рівня заощаджень і сигналів перевірки.",
            financialHealth: "Показує загальну оцінку фінансової стійкості з урахуванням поточного cash flow, тиску витрат і поведінки заощаджень.",
            nextMonthForecast: "Показує очікуваний чистий потік на наступний місяць на основі останньої динаміки доходів і витрат.",
            periodComparison: "Показує, як змінились доходи, витрати та чистий результат відносно попереднього аналогічного періоду.",
            cashflowTrend: "Показує доходи, витрати та чистий потік у розрізі вибраного періоду, щоб бачити стрибки та нестабільні дні.",
            expensesByCategory: "Показує, як загальні витрати розподіляються між категоріями у вибраному періоді.",
            insights: "Показує короткі висновки на основі ваших поточних патернів доходів і витрат.",
            incomeVsExpenses: "Показує, як доходи та витрати рухаються відносно одне одного у часі.",
            spendingPatterns: "Показує, у які дні та часові вікна концентрується найбільше витрат.",
            topCategoryChange: "Показує, які категорії витрат змінилися найбільше відносно попереднього аналогічного періоду.",
            goalProgress: "Показує поточний прогрес ваших фінансових цілей відносно їхніх цільових сум."
        },
        transactions: {
            total: "Показує кількість транзакцій, які зараз видно у вибраному табі та під поточними фільтрами.",
            income: "Показує лише фактичні завершені доходи, які потрапили в поточну вибірку.",
            expenses: "Показує витрати, які потрапили в поточну вибірку.",
            transfers: "Показує транзакції типу переказ, які зараз видно під поточними фільтрами.",
            averageCheck: "Показує середню суму транзакції в поточній відфільтрованій вибірці.",
            list: "Показує детальний список транзакцій для активного табу та поточних фільтрів."
        },
        liabilities: {
            totalDebt: "Показує загальний залишок по всіх активних зобовʼязаннях.",
            activeCount: "Показує кількість активних зобовʼязань, які зараз відстежуються.",
            minimumPayment: "Показує суму мінімальних щомісячних платежів по всіх активних зобовʼязаннях.",
            dueSoon: "Показує зобовʼязання, день платежу яких настає протягом наступних 7 днів."
        },
        loans: {
            totalLoaned: "Показує загальну суму грошей, які ви позичили, і які ще не повернулись.",
            activeCount: "Показує кількість активних позик, які ви видали іншим людям.",
            overdue: "Показує позики, де запланована дата повернення вже пройшла.",
            dueNext: "Показує позики з запланованою датою повернення протягом наступних 7 днів."
        }
    }
};
function useIndicatorTooltips() {
    const { lang } = useI18n();
    return indicatorTooltips[lang] ?? indicatorTooltips.en;
}
const categoryIconOptions = [
    { color: "#22c55e", icon: "cart", label: "Продукти" },
    { color: "#3b82f6", icon: "home", label: "Дім / комунальні" },
    { color: "#06b6d4", icon: "car", label: "Транспорт" },
    { color: "#64748b", icon: "fuel", label: "Пальне" },
    { color: "#8b5cf6", icon: "smile", label: "Розваги" },
    { color: "#f59e0b", icon: "subscriptions", label: "Підписки" },
    { color: "#ef4444", icon: "medical", label: "Ліки" },
    { color: "#ec4899", icon: "heart", label: "Донати" },
    { color: "#f97316", icon: "gift", label: "Свята" },
    { color: "#0ea5e9", icon: "openai", label: "AI / софт" },
    { color: "#14b8a6", icon: "shirt", label: "Одяг" },
    { color: "#2563eb", icon: "plane", label: "Подорожі" },
    { color: "#7c3aed", icon: "book", label: "Освіта" },
    { color: "#84cc16", icon: "phone", label: "Зв'язок" },
    { color: "#a855f7", icon: "pet", label: "Тварини" },
    { color: "#64748b", icon: "expenses", label: "Інше" },
    { color: "#1d4ed8", icon: "bank", label: "Банк" },
    { color: "#0891b2", icon: "wallet", label: "Гаманець" },
    { color: "#059669", icon: "income", label: "Доходи" },
    { color: "#d97706", icon: "receipt", label: "Рахунки" },
    { color: "#7c3aed", icon: "briefcase", label: "Робота" },
    { color: "#16a34a", icon: "chart", label: "Інвестиції" },
    { color: "#f43f5e", icon: "piggy", label: "Заощадження" },
    { color: "#8b5cf6", icon: "spark", label: "Бонуси" },
    { color: "#0284c7", icon: "shield", label: "Страхування" },
    { color: "#ca8a04", icon: "lightbulb", label: "Ідеї" },
    { color: "#0f766e", icon: "analytics", label: "Аналітика" },
    { color: "#7c3aed", icon: "goals", label: "Цілі" },
    { color: "#475569", icon: "calendar", label: "Регулярні" },
    { color: "#64748b", icon: "transactions", label: "Транзакції" },
    { color: "#2563eb", icon: "bell", label: "Сповіщення" },
    { color: "#64748b", icon: "user", label: "Особисте" }
];
const categoryIconSet = new Set(categoryIconOptions.map((option)=>option.icon));
const userNavItems = navItems.filter((item)=>item.key !== "admin");
const adminNavItems = [
    {
        icon: "shield",
        key: "adminDashboard",
        label: "Огляд",
        labelEn: "Overview"
    },
    {
        icon: "user",
        key: "adminUsers",
        label: "Користувачі",
        labelEn: "Users"
    },
    {
        icon: "spark",
        key: "adminIntegrations",
        label: "Інтеграції",
        labelEn: "Integrations"
    },
    {
        icon: "settings",
        key: "adminPlatform",
        label: "Платформа",
        labelEn: "Platform"
    },
    {
        icon: "refresh",
        key: "adminMonitoring",
        label: "Моніторинг",
        labelEn: "Monitoring"
    },
    {
        icon: "analytics",
        key: "adminActivity",
        label: "Активність",
        labelEn: "Activity"
    },
    {
        icon: "telegram",
        key: "adminTelegram",
        label: "Telegram",
        labelEn: "Telegram"
    }
];
const allNavigablePageKeys = new Set([
    ...userNavItems.map((item)=>item.key),
    ...adminNavItems.map((item)=>item.key),
    "admin"
]);
function isAdminSection(value) {
    return adminNavItems.some((item)=>item.key === value);
}
const fallbackExchangeRates = [
    {
        changePercent: 0,
        code: "USD",
        date: "",
        name: "Долар США",
        previousRate: null,
        rate: 39.65,
        source: "NBU"
    },
    {
        changePercent: 0,
        code: "EUR",
        date: "",
        name: "Євро",
        previousRate: null,
        rate: 42.8,
        source: "NBU"
    }
];
export function DashboardShell() {
    const { lang, t } = useI18n();
    const [activePage, setActivePage] = useState("dashboard");
    const [answer, setAnswer] = useState("");
    const [authChecked, setAuthChecked] = useState(false);
    const [authError, setAuthError] = useState(null);
    const [email, setEmail] = useState(defaultEmail);
    const [error, setError] = useState(null);
    const [exchangeRates, setExchangeRates] = useState(fallbackExchangeRates);
    const [legacyPassword, setLegacyPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [goalImageGeneratingId, setGoalImageGeneratingId] = useState("");
    const [modal, setModal] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [password, setPassword] = useState("");
    const [profileMenuTarget, setProfileMenuTarget] = useState(null);
    const [question, setQuestion] = useState("");
    const [sessionToken, setSessionToken] = useState("");
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [adminOverview, setAdminOverview] = useState(null);
    const [budgetInsights, setBudgetInsights] = useState(null);
    const [snapshot, setSnapshot] = useState(emptySnapshot);
    const [telegramAdmin, setTelegramAdmin] = useState(null);
    const [transactionTab, setTransactionTab] = useState("all");
    const desktopNotificationPanelRef = useRef(null);
    const desktopProfileMenuRef = useRef(null);
    const mobileProfileMenuRef = useRef(null);
    const mobileNotificationPanelRef = useRef(null);
    const { dismissToast, showToast, toast } = useAppToastHost();
    useEffect(()=>{
        const params = new URLSearchParams(window.location.search);
        const googleError = params.get("authError");
        const storedPassword = window.sessionStorage.getItem("dashboardPassword") ?? "";
        const hashPage = normalizePage(window.location.hash.replace("#", ""));
        if (hashPage) {
            setActivePage(hashPage);
        }
        if (googleError) {
            setAuthError(authErrorText(googleError));
            window.history.replaceState({}, "", window.location.pathname + window.location.hash);
        }
        if (storedPassword && isHeaderSafe(storedPassword)) {
            setLegacyPassword(storedPassword);
            void loadSnapshot("", storedPassword);
        } else if (storedPassword) {
            window.sessionStorage.removeItem("dashboardPassword");
            setAuthError(t("auth.oldPassword"));
            setAuthChecked(true);
        } else {
            void loadSnapshot("", "");
        }
        const onHashChange = ()=>{
            const page = normalizePage(window.location.hash.replace("#", ""));
            if (page) {
                setActivePage(page);
            }
        };
        window.addEventListener("hashchange", onHashChange);
        return ()=>window.removeEventListener("hashchange", onHashChange);
    }, []);
    const categories = useMemo(()=>snapshot.overview.byCategory.length ? snapshot.overview.byCategory : fallbackCategories, [
        snapshot.overview.byCategory
    ]);
    const categoryCatalog = useMemo(()=>{
        if (snapshot.categories.length) {
            return snapshot.categories.map((category)=>({
                    color: category.color,
                    dashboardGroup: category.dashboardGroup,
                    group: category.group ?? category.dashboardGroup,
                    icon: category.icon,
                    id: category.id,
                    name: category.name,
                    slug: category.slug,
                    total: category.total ?? 0
                }));
        }
        return fallbackCategories;
    }, [
        snapshot.categories
    ]);
    const expenses = useMemo(()=>{
        const rows = snapshot.transactions.filter(isExpenseRow);
        return rows.length ? rows : fallbackExpenses;
    }, [
        snapshot.transactions
    ]);
    const incomes = snapshot.incomes.length ? snapshot.incomes : fallbackIncomes;
    const hasRealBudgets = snapshot.budgets.length > 0;
    const budgets = hasRealBudgets ? snapshot.budgets : fallbackBudgets;
    // Use API month-filtered values when snapshot is loaded; fall back to demo totals only before auth
    const isSnapshotLoaded = snapshot.profile !== null;
    const goals = isSnapshotLoaded ? snapshot.goals : fallbackGoals;
    const accounts = (isSnapshotLoaded ? snapshot.accounts : []).filter((account)=>account.isActive !== false);
    const monthExpense = isSnapshotLoaded ? snapshot.overview.monthExpenseTotal : sum(expenses.map((item)=>item.amount));
    const monthIncome = isSnapshotLoaded ? snapshot.overview.monthActualIncomeTotal ?? snapshot.overview.monthIncomeTotal : sum(incomes.filter((item)=>isActualIncomeStatus(item.status)).map((item)=>item.amount));
    const monthPlannedIncome = isSnapshotLoaded ? snapshot.overview.monthPlannedIncomeTotal ?? 0 : sum(incomes.filter((item)=>!isActualIncomeStatus(item.status)).map((item)=>item.amount));
    const unreadNotificationCount = snapshot.overview.unreadNotificationCount ?? snapshot.notifications.filter((item)=>!item.isRead).length;
    const savings = isSnapshotLoaded ? snapshot.overview.savings : Math.max(monthIncome - monthExpense, 0);
    const currentUser = snapshot.profile?.name ?? (lang === "en" ? "Alex" : "Олександр");
    const isWorkspaceAdmin = [
        "ADMIN",
        "OWNER"
    ].includes((snapshot.profile?.role ?? "").toUpperCase());
    const actionConfirmationEnabled = snapshot.profile?.security?.actionConfirmationEnabled ?? true;
    const mobileSecondPage = activePage === "analytics" ? "analytics" : "transactions";
    const mobileSecondLabel = activePage === "analytics" ? t("nav.analytics") : t("nav.transactions");
    const visibleNavItems = isWorkspaceAdmin ? adminNavItems : userNavItems;
    const mobilePrimaryAction = activePage === "income" ? "income" : activePage === "budgets" ? "budget" : activePage === "goals" ? "goal" : activePage === "liabilities" ? "liability" : activePage === "loans" ? "loan" : activePage === "settings" ? "account" : "expense";
    useEffect(()=>{
        if (isWorkspaceAdmin) {
            if (!isAdminSection(activePage)) {
                openPage("adminDashboard");
            }
            return;
        }
        if (activePage === "admin" || isAdminSection(activePage)) {
            openPage("dashboard");
        }
    }, [
        activePage,
        isWorkspaceAdmin
    ]);
    async function loadSnapshot(token = sessionToken, dashboardPassword = legacyPassword, options = {}) {
        if (!options.silent) {
            setLoading(true);
            setError(null);
        }
        try {
            const response = await fetch("/api/proxy/dashboard/snapshot", {
                headers: authHeaders(token, dashboardPassword)
            });
            if (response.status === 401) {
                setAdminOverview(null);
                setSnapshot(emptySnapshot);
                setSessionToken("");
                setLegacyPassword("");
                window.sessionStorage.removeItem("dashboardPassword");
                if (token || dashboardPassword) {
                    setAuthError(t("toast.sessionExpired"));
                }
                return;
            }
            if (!response.ok) {
                throw new Error(t("dashboard.error.connect"));
            }
            setSnapshot(await response.json());
            if (!token) {
                setSessionToken("__cookie__");
            }
            await loadExchangeRates(token, dashboardPassword);
        } catch (loadError) {
            if (!options.silent) {
                showToast(loadError instanceof Error ? loadError.message : t("dashboard.error.unknown"), "error");
            }
        } finally{
            setAuthChecked(true);
            if (!options.silent) {
                setLoading(false);
            }
        }
    }
    async function loadExchangeRates(token = sessionToken, dashboardPassword = legacyPassword) {
        try {
            const response = await fetch("/api/proxy/exchange-rates?codes=USD,EUR", {
                headers: authHeaders(token, dashboardPassword)
            });
            if (!response.ok) return;
            const payload = await response.json();
            if (payload.rates?.length) {
                setExchangeRates(payload.rates);
            }
        } catch  {
            setExchangeRates(fallbackExchangeRates);
        }
    }
    async function handleLogin(event) {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setAuthError(null);
        try {
            const response = await fetch("/api/proxy/auth/login", {
                body: JSON.stringify({
                    email,
                    password
                }),
                headers: {
                    "Content-Type": "application/json"
                },
                method: "POST"
            });
            if (!response.ok) {
                throw new Error(t("auth.invalid"));
            }
            await response.json();
            setSessionToken("__cookie__");
            await loadSnapshot("", "");
        } catch (loginError) {
            showToast(loginError instanceof Error ? loginError.message : t("auth.invalid"), "error");
        } finally{
            setLoading(false);
        }
    }
    async function submitQuickForm(event) {
        event.preventDefault();
        if (!modal) return;
        const data = new FormData(event.currentTarget);
        const endpointByModal = {
            account: "accounts",
            budget: "budgets",
            category: "categories",
            expense: "expenses",
            goal: "goals",
            goalContribution: "goals",
            income: "incomes",
            liability: "liabilities",
            liabilityPayment: "liabilities"
        };
        const itemId = modal.item && "id" in modal.item ? modal.item.id : null;
        const modalKind = modal.kind;
        setLoading(true);
        setError(null);
        try {
            if (modalKind === "budget" && !itemId) {
                const budgetPayloads = payloadsFromBudgetForm(data);
                if (!budgetPayloads.length) {
                    throw new Error(t("toast.budgetNeedCategory"));
                }
                const savedBudgets = [];
                for (const budgetPayload of budgetPayloads) {
                    const response = await fetch(`/api/proxy/budgets${budgetPayload.id ? `/${budgetPayload.id}` : ""}`, {
                        body: JSON.stringify(budgetPayload),
                        headers: authHeaders(sessionToken, legacyPassword, true),
                        method: budgetPayload.id ? "PATCH" : "POST"
                    });
                    const savedRecord = await response.json().catch(()=>null);
                    if (!response.ok) {
                        throw new Error(savedRecord?.error ?? t("dashboard.error.save"));
                    }
                    if (savedRecord) {
                        savedBudgets.push(savedRecord);
                    }
                }
                if (savedBudgets.length) {
                    setSnapshot((current)=>({
                            ...current,
                            budgets: [
                                ...savedBudgets,
                                ...current.budgets.filter((row)=>!savedBudgets.some((savedBudget)=>savedBudget.id === row.id))
                            ]
                        }));
                }
                setModal(null);
                await loadSnapshot(sessionToken, legacyPassword, {
                    silent: true
                });
                showToast(t("toast.budgetsCreated").replace("{count}", String(savedBudgets.length)), "success");
                return;
            }
            if (modalKind === "goalContribution") {
                if (!itemId) {
                    throw new Error(t("toast.goalNotFound"));
                }
                const amount = String(data.get("amount") ?? "").trim();
                const note = String(data.get("note") ?? "").trim();
                if (Number(amount) <= 0) {
                    throw new Error(t("toast.goalContributionInvalid"));
                }
                const response = await fetch(`/api/proxy/goals/${itemId}/contributions`, {
                    body: JSON.stringify({
                        amount,
                        note: note || undefined
                    }),
                    headers: authHeaders(sessionToken, legacyPassword, true),
                    method: "POST"
                });
                const savedRecord = await response.json().catch(()=>null);
                if (!response.ok) {
                    throw new Error(savedRecord?.error ?? t("dashboard.error.save"));
                }
                if (savedRecord?.goal) {
                    setSnapshot((current)=>({
                            ...current,
                            goals: [
                                savedRecord.goal,
                                ...current.goals.filter((row)=>row.id !== savedRecord.goal.id)
                            ]
                        }));
                }
                setModal(null);
                await loadSnapshot(sessionToken, legacyPassword, {
                    silent: true
                });
                showToast(t("toast.goalContributionSaved"), "success");
                return;
            }
            if (modalKind === "liabilityPayment") {
                if (!itemId) {
                    throw new Error(t("toast.liabilityDeleteError"));
                }
                const amount = String(data.get("amount") ?? "").trim();
                const note = String(data.get("note") ?? "").trim();
                const paymentDate = String(data.get("date") ?? "").trim();
                if (Number(amount) <= 0) {
                    throw new Error(t("dashboard.error.save"));
                }
                const response = await fetch(`/api/proxy/liabilities/${itemId}/payments`, {
                    body: JSON.stringify({
                        amount,
                        date: paymentDate || undefined,
                        note: note || undefined
                    }),
                    headers: authHeaders(sessionToken, legacyPassword, true),
                    method: "POST"
                });
                const savedRecord = await response.json().catch(()=>null);
                if (!response.ok) {
                    throw new Error(savedRecord?.error ?? t("dashboard.error.save"));
                }
                if (savedRecord?.liability) {
                    setSnapshot((current)=>({
                            ...current,
                            liabilities: [
                                savedRecord.liability,
                                ...current.liabilities.filter((row)=>row.id !== savedRecord.liability.id)
                            ],
                            liabilityPayments: savedRecord.payment ? [
                                savedRecord.payment,
                                ...current.liabilityPayments
                            ] : current.liabilityPayments
                        }));
                }
                setModal(null);
                await loadSnapshot(sessionToken, legacyPassword, {
                    silent: true
                });
                showToast(t("toast.liabilityPaymentSaved"), "success");
                return;
            }
            let uploadedGoalImageUrl = "";
            if (modalKind === "goal") {
                const goalImage = data.get("goalImage");
                if (goalImage instanceof File && goalImage.size > 0) {
                    uploadedGoalImageUrl = await uploadGoalImage(goalImage) || "";
                }
            }
            const payload = payloadFromForm(modal.kind, data, {
                goalImageUrl: uploadedGoalImageUrl
            });
            const response = await fetch(`/api/proxy/${endpointByModal[modal.kind]}${itemId ? `/${itemId}` : ""}`, {
                body: JSON.stringify(payload),
                headers: authHeaders(sessionToken, legacyPassword, true),
                method: itemId ? "PATCH" : "POST"
            });
            const savedRecord = await response.json().catch(()=>null);
            if (!response.ok) throw new Error(savedRecord?.error ?? t("dashboard.error.save"));
            if (modalKind === "expense" && savedRecord) {
                setSnapshot((current)=>({
                        ...current,
                        transactions: [
                            savedRecord,
                            ...current.transactions.filter((row)=>row.id !== savedRecord.id)
                        ]
                    }));
            }
            if (modalKind === "income" && savedRecord) {
                setSnapshot((current)=>({
                        ...current,
                        incomes: [
                            savedRecord,
                            ...current.incomes.filter((row)=>row.id !== savedRecord.id)
                        ]
                    }));
            }
            if (modalKind === "goal" && savedRecord) {
                setSnapshot((current)=>({
                        ...current,
                        goals: [
                            savedRecord,
                            ...current.goals.filter((row)=>row.id !== savedRecord.id)
                        ]
                    }));
            }
            if (modalKind === "liability" && savedRecord) {
                setSnapshot((current)=>({
                        ...current,
                        liabilities: [
                            savedRecord,
                            ...current.liabilities.filter((row)=>row.id !== savedRecord.id)
                        ]
                    }));
            }
            if (modalKind === "budget" && savedRecord && itemId) {
                setSnapshot((current)=>({
                        ...current,
                        budgets: [
                            savedRecord,
                            ...current.budgets.filter((row)=>row.id !== savedRecord.id)
                        ]
                    }));
            }
            setModal(null);
            await loadSnapshot(sessionToken, legacyPassword, {
                silent: true
            });
            showToast(t("toast.savedSuccess"), "success");
        } catch (submitError) {
            showToast(submitError instanceof Error ? submitError.message : t("dashboard.error.save"), "error");
        } finally{
            setLoading(false);
        }
    }
    async function deleteTransactionRecord(row) {
        const expense = isExpenseRow(row);
        if (actionConfirmationEnabled) {
            appConfirm(expense ? t("confirm.deleteExpense") : t("confirm.deleteIncome"), ()=>void _deleteTransactionRecord(row));
            return;
        }
        await _deleteTransactionRecord(row);
    }
    async function _deleteTransactionRecord(row) {
        const expense = isExpenseRow(row);
        const endpoint = expense ? "expenses" : "incomes";
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/proxy/${endpoint}/${row.id}`, {
                headers: authHeaders(sessionToken, legacyPassword),
                method: "DELETE"
            });
            const result = await response.json().catch(()=>({}));
            if (!response.ok) throw new Error(result.error ?? (expense ? "Не вдалося видалити витрату." : "Не вдалося видалити дохід."));
            setModal(null);
            setSnapshot((current)=>expense ? {
                    ...current,
                    transactions: current.transactions.filter((item)=>item.id !== row.id)
                } : {
                    ...current,
                    incomes: current.incomes.filter((item)=>item.id !== row.id)
                });
            await loadSnapshot(sessionToken, legacyPassword, {
                silent: true
            });
            showToast(expense ? t("toast.accountDeleted") : t("toast.accountDeleted"), "success");
        } catch (deleteError) {
            showToast(deleteError instanceof Error ? deleteError.message : t("dashboard.error.save"), "error");
        } finally{
            setLoading(false);
        }
    }
    async function askAi(event) {
        event.preventDefault();
        if (!question.trim()) return;
        setAnswer(t("ui.thinking"));
        try {
            const response = await fetch("/api/proxy/ask", {
                body: JSON.stringify({
                    question
                }),
                headers: authHeaders(sessionToken, legacyPassword, true),
                method: "POST"
            });
            const payload = await response.json();
            setAnswer(payload.answer ?? payload.error ?? t("dashboard.answer.empty"));
        } catch  {
            setAnswer(t("toast.aiUnavailable"));
        }
    }
    async function queueAction(path) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/proxy/${path}`, {
                headers: authHeaders(sessionToken, legacyPassword, true),
                method: "POST"
            });
            if (!response.ok) throw new Error(t("toast.actionError"));
            await loadSnapshot();
            showToast(t("toast.actionCompleted"), "success");
        } catch (actionError) {
            showToast(actionError instanceof Error ? actionError.message : t("toast.actionError"), "error");
        } finally{
            setLoading(false);
        }
    }
    async function connectMonobank(payload) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/proxy/monobank/connect", {
                body: JSON.stringify(payload),
                headers: authHeaders(sessionToken, legacyPassword, true),
                method: "POST"
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error ?? t("toast.monobankConnectError"));
            }
            await loadSnapshot();
            const accountsCount = result.accounts?.length ?? 0;
            const webhookNote = result.webhook?.status === "enabled" ? t("toast.monobankWebhookEnabled") : result.webhook?.reason ? ` ${result.webhook.reason}` : "";
            showToast(t("toast.monobankConnected").replace("{count}", String(accountsCount)) + webhookNote, "success");
        } catch (monobankError) {
            showToast(monobankError instanceof Error ? monobankError.message : t("dashboard.error.save"), "error");
        } finally{
            setLoading(false);
        }
    }
    async function syncMonobankNow(range = null) {
        setLoading(true);
        setError(null);
        try {
            const normalizedRange = range ? normalizeDateRange(range) : null;
            const response = await fetch("/api/proxy/monobank/sync", {
                body: JSON.stringify(normalizedRange ? {
                    from: normalizedRange.from.toISOString(),
                    to: normalizedRange.to.toISOString()
                } : {}),
                headers: authHeaders(sessionToken, legacyPassword, true),
                method: "POST"
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error ?? t("toast.monobankSyncError"));
            }
            await loadSnapshot();
            if (result.queued) {
                const etaMin = result.estimatedMinutes ?? 0;
                const etaPart = etaMin > 0 ? t("toast.monobankEta").replace("{min}", String(etaMin)) : "";
                const queuedText = t("toast.monobankQueued").replace("{jobs}", String(result.queuedJobs)).replace("{accounts}", String(result.accounts)) + etaPart;
                showToast(queuedText, "success");
            } else {
                const imported = typeof result.importedStatementItems === "number" ? result.importedStatementItems : 0;
                showToast(t("toast.monobankSynced").replace("{count}", String(imported)), "success");
            }
        } catch (monobankError) {
            showToast(monobankError instanceof Error ? monobankError.message : t("dashboard.error.save"), "error");
        } finally{
            setLoading(false);
        }
    }
    async function exportExpensesToGoogleSheetsNow(filters) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/proxy/export/expenses/google-sheets", {
                body: JSON.stringify(filters ?? {}),
                headers: authHeaders(sessionToken, legacyPassword, true),
                method: "POST"
            });
            const result = await response.json().catch(()=>({}));
            if (!response.ok) {
                throw new Error(result.error ?? t("toast.sheetsExportError"));
            }
            showToast(t("toast.sheetsExported").replace("{count}", String(result.exported ?? 0)), "success");
        } catch (exportError) {
            showToast(exportError instanceof Error ? exportError.message : t("toast.sheetsExportError"), "error");
        } finally{
            setLoading(false);
        }
    }
    async function loadBudgetInsights(token = sessionToken, dashboardPassword = legacyPassword, options = {}) {
        if (isWorkspaceAdmin) {
            setBudgetInsights(null);
            return;
        }
        if (!options.silent) {
            setLoading(true);
            setError(null);
        }
        try {
            const response = await fetch("/api/proxy/budgets/insights", {
                headers: authHeaders(token, dashboardPassword)
            });
            const result = await response.json().catch(()=>null);
            if (!response.ok) {
                throw new Error(result?.error ?? t("toast.budgetInsightsError"));
            }
            setBudgetInsights(result);
        } catch (insightsError) {
            if (!options.silent) {
                showToast(insightsError instanceof Error ? insightsError.message : t("toast.budgetInsightsError"), "error");
            }
        } finally{
            if (!options.silent) {
                setLoading(false);
            }
        }
    }
    async function saveAiSettings(payload) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/proxy/ai/settings", {
                body: JSON.stringify(payload),
                headers: authHeaders(sessionToken, legacyPassword, true),
                method: "POST"
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error ?? t("toast.aiSettingsError"));
            }
            await loadSnapshot();
            showToast(t("toast.aiSaved").replace("{mode}", result.keyMode === "SYSTEM" ? t("toast.aiKeySystem") : t("toast.aiKeyPersonal")), "success");
        } catch (aiError) {
            showToast(aiError instanceof Error ? aiError.message : t("dashboard.error.save"), "error");
        } finally{
            setLoading(false);
        }
    }
    async function loadAdminOverview(options = {}) {
        if (!isWorkspaceAdmin) {
            setAdminOverview(null);
            return;
        }
        if (!options.silent) {
            setLoading(true);
            setError(null);
        }
        try {
            const response = await fetch("/api/proxy/admin/overview", {
                headers: authHeaders(sessionToken, legacyPassword)
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error ?? t("dashboard.error.save"));
            }
            setAdminOverview(result);
        } catch (adminError) {
            if (!options.silent) {
                showToast(adminError instanceof Error ? adminError.message : t("dashboard.error.save"), "error");
            }
        } finally{
            if (!options.silent) {
                setLoading(false);
            }
        }
    }
    async function loadTelegramAdminSettings(options = {}) {
        if (!isWorkspaceAdmin) {
            setTelegramAdmin(null);
            return;
        }
        if (!options.silent) {
            setLoading(true);
            setError(null);
        }
        try {
            const response = await fetch("/api/proxy/admin/telegram", {
                headers: authHeaders(sessionToken, legacyPassword)
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error ?? t("dashboard.error.save"));
            }
            setTelegramAdmin(result);
        } catch (adminError) {
            if (!options.silent) {
                showToast(adminError instanceof Error ? adminError.message : t("dashboard.error.save"), "error");
            }
        } finally{
            if (!options.silent) {
                setLoading(false);
            }
        }
    }
    async function refreshAdminConsole(options = {}) {
        if (!isWorkspaceAdmin) {
            setAdminOverview(null);
            setTelegramAdmin(null);
            return;
        }
        if (!options.silent) {
            setLoading(true);
            setError(null);
        }
        try {
            const [overviewResponse, telegramResponse] = await Promise.all([
                fetch("/api/proxy/admin/overview", {
                    headers: authHeaders(sessionToken, legacyPassword)
                }),
                fetch("/api/proxy/admin/telegram", {
                    headers: authHeaders(sessionToken, legacyPassword)
                })
            ]);
            const overviewResult = await overviewResponse.json();
            const telegramResult = await telegramResponse.json();
            if (!overviewResponse.ok) {
                throw new Error(overviewResult.error ?? t("dashboard.error.save"));
            }
            if (!telegramResponse.ok) {
                throw new Error(telegramResult.error ?? t("dashboard.error.save"));
            }
            setAdminOverview(overviewResult);
            setTelegramAdmin(telegramResult);
            if (!options.silent) {
                showToast(t("toast.adminRefreshed"), "success");
            }
        } catch (adminError) {
            if (!options.silent) {
                showToast(adminError instanceof Error ? adminError.message : t("dashboard.error.save"), "error");
            }
        } finally{
            if (!options.silent) {
                setLoading(false);
            }
        }
    }
    async function saveTelegramAdmin(payload) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/proxy/admin/telegram", {
                body: JSON.stringify(payload),
                headers: authHeaders(sessionToken, legacyPassword, true),
                method: "PATCH"
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error ?? t("dashboard.error.save"));
            }
            setTelegramAdmin(result);
            await loadSnapshot(sessionToken, legacyPassword, {
                silent: true
            });
            showToast(t("toast.telegramAdminSaved"), "success");
        } catch (adminError) {
            showToast(adminError instanceof Error ? adminError.message : t("dashboard.error.save"), "error");
        } finally{
            setLoading(false);
        }
    }
    async function enableTelegramWebhookNow() {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/proxy/admin/telegram/webhook-enable", {
                body: "{}",
                headers: authHeaders(sessionToken, legacyPassword, true),
                method: "POST"
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error ?? t("dashboard.error.save"));
            }
            setTelegramAdmin(result);
            showToast(t("toast.telegramWebhookEnabled"), "success");
        } catch (adminError) {
            showToast(adminError instanceof Error ? adminError.message : t("dashboard.error.save"), "error");
        } finally{
            setLoading(false);
        }
    }
    async function saveProfile(payload) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/proxy/profile", {
                body: JSON.stringify(payload),
                headers: authHeaders(sessionToken, legacyPassword, true),
                method: "PATCH"
            });
            if (!response.ok) throw new Error(t("dashboard.error.save"));
            await loadSnapshot();
            showToast(t("toast.profileUpdated"), "success");
        } catch (profileError) {
            showToast(profileError instanceof Error ? profileError.message : t("dashboard.error.save"), "error");
        } finally{
            setLoading(false);
        }
    }
    async function uploadAvatar(file) {
        const allowedTypes = new Set([
            "image/jpeg",
            "image/png",
            "image/webp"
        ]);
        if (!allowedTypes.has(file.type)) {
            showToast(t("toast.imageTypeError"), "error");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast(t("toast.imageSizeError"), "error");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const body = new FormData();
            body.append("avatar", file);
            const response = await fetch("/api/proxy/profile/avatar", {
                body,
                headers: authHeaders(sessionToken, legacyPassword),
                method: "POST"
            });
            const result = await response.json().catch(()=>({}));
            if (!response.ok) throw new Error(result.error ?? t("dashboard.error.save"));
            await loadSnapshot();
            showToast(t("toast.avatarUpdated"), "success");
        } catch (avatarError) {
            showToast(avatarError instanceof Error ? avatarError.message : t("dashboard.error.save"), "error");
        } finally{
            setLoading(false);
        }
    }
    async function uploadGoalImage(file) {
        const allowedTypes = new Set([
            "image/jpeg",
            "image/png",
            "image/webp"
        ]);
        if (!allowedTypes.has(file.type)) {
            showToast(t("toast.imageTypeError"), "error");
            return "";
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast(t("toast.imageSizeError"), "error");
            return "";
        }
        const body = new FormData();
        body.append("goalImage", file);
        const response = await fetch("/api/proxy/goals/image", {
            body,
            headers: authHeaders(sessionToken, legacyPassword),
            method: "POST"
        });
        const result = await response.json().catch(()=>({}));
        if (!response.ok) throw new Error(result.error ?? t("dashboard.error.save"));
        return typeof result.imageUrl === "string" ? result.imageUrl : "";
    }
    async function generateGoalImageForGoal(goal) {
        if (!goal?.id) {
            showToast(t("toast.goalImageFirst"), "error");
            return;
        }
        setGoalImageGeneratingId(goal.id);
        try {
            const response = await fetch(`/api/proxy/goals/${goal.id}/generate-image`, {
                headers: authHeaders(sessionToken, legacyPassword, true),
                method: "POST"
            });
            const result = await response.json().catch(()=>null);
            if (!response.ok) {
                throw new Error(result?.error ?? t("toast.goalImageError"));
            }
            if (result?.id) {
                setSnapshot((current)=>({
                        ...current,
                        goals: [
                            result,
                            ...current.goals.filter((row)=>row.id !== result.id)
                        ]
                    }));
            }
            if (modal?.kind === "goal" && modal.item?.id === goal.id) {
                setModal({
                    ...modal,
                    item: result
                });
            }
            showToast(t("toast.goalImageGenerated"), "success");
            await loadSnapshot(sessionToken, legacyPassword, {
                silent: true
            });
        } catch (goalImageError) {
            showToast(goalImageError instanceof Error ? goalImageError.message : t("toast.goalImageError"), "error");
        } finally{
            setGoalImageGeneratingId("");
        }
    }
    async function saveSecuritySettings(payload) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/proxy/profile/security", {
                body: JSON.stringify(payload),
                headers: authHeaders(sessionToken, legacyPassword, true),
                method: "PATCH"
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error ?? t("dashboard.error.save"));
            await loadSnapshot();
            showToast(t("toast.securityUpdated"), "success");
        } catch (securityError) {
            showToast(securityError instanceof Error ? securityError.message : t("dashboard.error.save"), "error");
        } finally{
            setLoading(false);
        }
    }
    async function changePassword(payload) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/proxy/profile/password-change", {
                body: JSON.stringify(payload),
                headers: authHeaders(sessionToken, legacyPassword, true),
                method: "POST"
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error ?? t("dashboard.error.save"));
            await loadSnapshot();
            showToast(t("toast.passwordUpdated"), "success");
        } catch (passwordError) {
            const message = passwordError instanceof Error ? passwordError.message : t("dashboard.error.save");
            showToast(message, "error");
            throw new Error(message);
        } finally{
            setLoading(false);
        }
    }
    async function saveNotification(key, enabled) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/proxy/notifications/${encodeURIComponent(key)}`, {
                body: JSON.stringify({
                    enabled
                }),
                headers: authHeaders(sessionToken, legacyPassword, true),
                method: "PATCH"
            });
            if (!response.ok) throw new Error(t("dashboard.error.save"));
            await loadSnapshot();
            showToast(t("toast.notificationsUpdated"), "success");
        } catch (notificationError) {
            showToast(notificationError instanceof Error ? notificationError.message : t("dashboard.error.save"), "error");
        } finally{
            setLoading(false);
        }
    }
    async function readNotification(notificationId, actionUrl) {
        try {
            const response = await fetch(`/api/proxy/notifications/feed/${encodeURIComponent(notificationId)}/read`, {
                body: "{}",
                headers: authHeaders(sessionToken, legacyPassword, true),
                method: "POST"
            });
            if (!response.ok) throw new Error(t("dashboard.error.save"));
            await loadSnapshot(sessionToken, legacyPassword, {
                silent: true
            });
            if (actionUrl) {
                openNotificationTarget(actionUrl);
            }
        } catch (notificationError) {
            showToast(notificationError instanceof Error ? notificationError.message : t("dashboard.error.save"), "error");
        }
    }
    async function readAllNotifications() {
        try {
            const response = await fetch("/api/proxy/notifications/feed/read-all", {
                body: "{}",
                headers: authHeaders(sessionToken, legacyPassword, true),
                method: "POST"
            });
            if (!response.ok) throw new Error(t("dashboard.error.save"));
            await loadSnapshot(sessionToken, legacyPassword, {
                silent: true
            });
        } catch (notificationError) {
            showToast(notificationError instanceof Error ? notificationError.message : t("dashboard.error.save"), "error");
        }
    }
    async function saveSecret(payload) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/proxy/secrets", {
                body: JSON.stringify(payload),
                headers: authHeaders(sessionToken, legacyPassword, true),
                method: "POST"
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error ?? t("dashboard.error.save"));
            await loadSnapshot();
            showToast(t("toast.secretSaved"), "success");
        } catch (secretError) {
            showToast(secretError instanceof Error ? secretError.message : t("dashboard.error.save"), "error");
        } finally{
            setLoading(false);
        }
    }
    async function deleteLedgerAccount(id, name) {
        if (actionConfirmationEnabled) {
            appConfirm(t("confirm.deleteAccount").replace("{name}", name), ()=>void _deleteLedgerAccount(id, name));
            return;
        }
        await _deleteLedgerAccount(id, name);
    }
    async function _deleteLedgerAccount(id, name) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/proxy/accounts/${id}`, {
                headers: authHeaders(sessionToken, legacyPassword),
                method: "DELETE"
            });
            const result = await response.json().catch(()=>({}));
            if (!response.ok) throw new Error(result.error ?? t("toast.accountDeleteError"));
            await loadSnapshot();
            showToast(t("toast.accountDeleted"), "success");
        } catch (deleteError) {
            showToast(deleteError instanceof Error ? deleteError.message : t("dashboard.error.save"), "error");
        } finally{
            setLoading(false);
        }
    }
    async function deleteCategoryRecord(id, name) {
        if (actionConfirmationEnabled) {
            appConfirm(t("confirm.deleteCategory").replace("{name}", name), ()=>void _deleteCategoryRecord(id, name));
            return;
        }
        await _deleteCategoryRecord(id, name);
    }
    async function _deleteCategoryRecord(id, name) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/proxy/categories/${id}`, {
                headers: authHeaders(sessionToken, legacyPassword),
                method: "DELETE"
            });
            const result = await response.json().catch(()=>({}));
            if (!response.ok) throw new Error(result.error ?? t("toast.categoryDeleteError"));
            await loadSnapshot();
            showToast(t("toast.categoryDeleted"), "success");
        } catch (deleteError) {
            showToast(deleteError instanceof Error ? deleteError.message : t("dashboard.error.save"), "error");
        } finally{
            setLoading(false);
        }
    }
    async function importFromTemplates(slugs) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/proxy/category-templates/import", {
                body: JSON.stringify({ slugs }),
                headers: authHeaders(sessionToken, legacyPassword, true),
                method: "POST"
            });
            if (!response.ok) throw new Error(t("toast.templatesImportError"));
            await loadSnapshot();
            showToast(t("toast.categoriesAdded"), "success");
        } catch (importError) {
            showToast(importError instanceof Error ? importError.message : t("dashboard.error.save"), "error");
        } finally {
            setLoading(false);
        }
    }
    async function deleteBudgetRecord(id, name) {
        if (actionConfirmationEnabled) {
            appConfirm(t("confirm.deleteBudget").replace("{name}", name), ()=>void _deleteBudgetRecord(id, name));
            return;
        }
        await _deleteBudgetRecord(id, name);
    }
    async function _deleteBudgetRecord(id, name) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/proxy/budgets/${id}`, {
                headers: {
                    ...authHeaders(sessionToken, legacyPassword),
                    "x-budget-name": name
                },
                method: "DELETE"
            });
            const result = await response.json().catch(()=>({}));
            if (!response.ok) throw new Error(result.error ?? t("toast.budgetDeleteError"));
            setModal(null);
            await loadSnapshot();
            showToast(t("toast.budgetDeleted"), "success");
        } catch (deleteError) {
            showToast(deleteError instanceof Error ? deleteError.message : t("dashboard.error.save"), "error");
        } finally{
            setLoading(false);
        }
    }
    async function deleteLiabilityRecord(id, name) {
        if (actionConfirmationEnabled) {
            appConfirm(t("confirm.deleteLiability").replace("{name}", name), ()=>void _deleteLiabilityRecord(id, name));
            return;
        }
        await _deleteLiabilityRecord(id, name);
    }
    async function _deleteLiabilityRecord(id, name) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/proxy/liabilities/${id}`, {
                headers: authHeaders(sessionToken, legacyPassword),
                method: "DELETE"
            });
            const result = await response.json().catch(()=>({}));
            if (!response.ok) throw new Error(result.error ?? t("toast.liabilityDeleteError"));
            setModal(null);
            setSnapshot((current)=>({
                    ...current,
                    liabilities: current.liabilities.filter((item)=>item.id !== id)
                }));
            await loadSnapshot(sessionToken, legacyPassword, {
                silent: true
            });
            showToast(t("toast.liabilityDeleted"), "success");
        } catch (deleteError) {
            showToast(deleteError instanceof Error ? deleteError.message : t("dashboard.error.save"), "error");
        } finally{
            setLoading(false);
        }
    }
    async function deleteLoanRecord(id, recipientName) {
        if (actionConfirmationEnabled) {
            appConfirm(t("confirm.deleteLoan").replace("{name}", recipientName), ()=>void _deleteLoanRecord(id, recipientName));
            return;
        }
        await _deleteLoanRecord(id, recipientName);
    }
    async function _deleteLoanRecord(id, recipientName) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/proxy/loans/${id}`, {
                headers: authHeaders(sessionToken, legacyPassword),
                method: "DELETE"
            });
            const result = await response.json().catch(()=>({}));
            if (!response.ok) throw new Error(result.error ?? t("toast.loanDeleteError"));
            setModal(null);
            setSnapshot((current)=>({
                    ...current,
                    loans: current.loans.filter((item)=>item.id !== id)
                }));
            await loadSnapshot(sessionToken, legacyPassword, {
                silent: true
            });
            showToast(t("toast.loanDeleted"), "success");
        } catch (deleteError) {
            showToast(deleteError instanceof Error ? deleteError.message : t("dashboard.error.save"), "error");
        } finally{
            setLoading(false);
        }
    }
    async function revokeSecret(provider, keyName) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/proxy/secrets/${encodeURIComponent(provider)}/${encodeURIComponent(keyName)}`, {
                headers: authHeaders(sessionToken, legacyPassword),
                method: "DELETE"
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error ?? t("dashboard.error.save"));
            await loadSnapshot();
            showToast(t("toast.secretRevoked"), "success");
        } catch (secretError) {
            showToast(secretError instanceof Error ? secretError.message : t("dashboard.error.save"), "error");
        } finally{
            setLoading(false);
        }
    }
    function exportPrivacyData() {
        window.location.href = "/api/proxy/privacy/export";
    }
    async function deleteAccount() {
        if (actionConfirmationEnabled) {
            appConfirm(t("confirm.deleteUserAccount"), ()=>void _deleteAccount(), true);
            return;
        }
        await _deleteAccount();
    }
    async function _deleteAccount() {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/proxy/privacy/account", {
                body: JSON.stringify({
                    confirmation: "DELETE"
                }),
                headers: authHeaders(sessionToken, legacyPassword, true),
                method: "DELETE"
            });
            const result = await response.json();
            if (!response.ok || !result.deleted) {
                throw new Error(result.error ?? t("dashboard.error.save"));
            }
            window.sessionStorage.removeItem("dashboardPassword");
            setLegacyPassword("");
            setSessionToken("");
            setAdminOverview(null);
            setSnapshot(emptySnapshot);
            window.location.href = "/";
        } catch (deleteError) {
            showToast(deleteError instanceof Error ? deleteError.message : t("dashboard.error.save"), "error");
        } finally{
            setLoading(false);
        }
    }
    async function logout() {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/proxy/auth/logout", {
                body: "{}",
                headers: authHeaders(sessionToken, legacyPassword, true),
                method: "POST"
            });
            if (!response.ok) {
                const result = await response.json().catch(()=>({
                        error: t("dashboard.error.save")
                    }));
                throw new Error(result.error ?? t("dashboard.error.save"));
            }
            window.sessionStorage.removeItem("dashboardPassword");
            setLegacyPassword("");
            setSessionToken("");
            setAdminOverview(null);
            setSnapshot(emptySnapshot);
            setTelegramAdmin(null);
            setNotificationsOpen(false);
            setProfileMenuTarget(null);
            window.location.href = "/";
        } catch (logoutError) {
            showToast(logoutError instanceof Error ? logoutError.message : t("dashboard.error.save"), "error");
        } finally{
            setLoading(false);
        }
    }
    function openPage(page) {
        setActivePage(page);
        window.history.replaceState({}, "", `#${page}`);
    }
    function openModal(kind, item) {
        setModal({
            item,
            kind
        });
    }
    function appConfirm(message, onConfirm, danger = true) {
        setConfirmDialog({ message, onConfirm, danger });
    }
    function openNotificationTarget(target) {
        setNotificationsOpen(false);
        if (!target.startsWith("#")) {
            window.location.href = target;
            return;
        }
        const page = normalizePage(target.replace("#", ""));
        if (page) {
            openPage(page);
        }
    }
    useEffect(()=>{
        if (!sessionToken && !legacyPassword) return;
        const intervalId = window.setInterval(()=>{
            void loadSnapshot(sessionToken, legacyPassword, {
                silent: true
            });
        }, 60000);
        return ()=>window.clearInterval(intervalId);
    }, [
        legacyPassword,
        sessionToken
    ]);
    useEffect(()=>{
        if (!isWorkspaceAdmin || !sessionToken && !legacyPassword) {
            setAdminOverview(null);
            setTelegramAdmin(null);
            return;
        }
        void refreshAdminConsole({
            silent: true
        });
    }, [
        isWorkspaceAdmin,
        legacyPassword,
        sessionToken
    ]);
    useEffect(()=>{
        if (isWorkspaceAdmin || !authChecked || !snapshot.profile) {
            setBudgetInsights(null);
            return;
        }
        if (activePage !== "budgets") {
            return;
        }
        void loadBudgetInsights(sessionToken, legacyPassword, {
            silent: true
        });
    }, [
        activePage,
        authChecked,
        isWorkspaceAdmin,
        legacyPassword,
        sessionToken,
        snapshot.budgets,
        snapshot.overview.monthExpenseTotal,
        snapshot.profile,
        snapshot.transactions
    ]);
    useEffect(()=>{
        if (!notificationsOpen) return;
        function onPointerDown(event) {
            const target = event.target;
            const insideDesktop = Boolean(desktopNotificationPanelRef.current && target && desktopNotificationPanelRef.current.contains(target));
            const insideMobile = Boolean(mobileNotificationPanelRef.current && target && mobileNotificationPanelRef.current.contains(target));
            if (!insideDesktop && !insideMobile) {
                setNotificationsOpen(false);
            }
        }
        window.addEventListener("mousedown", onPointerDown);
        return ()=>window.removeEventListener("mousedown", onPointerDown);
    }, [
        notificationsOpen
    ]);
    useEffect(()=>{
        if (!profileMenuTarget) return;
        function onPointerDown(event) {
            const target = event.target;
            const insideDesktop = Boolean(desktopProfileMenuRef.current && target && desktopProfileMenuRef.current.contains(target));
            const insideMobile = Boolean(mobileProfileMenuRef.current && target && mobileProfileMenuRef.current.contains(target));
            if (!insideDesktop && !insideMobile) {
                setProfileMenuTarget(null);
            }
        }
        window.addEventListener("mousedown", onPointerDown);
        return ()=>window.removeEventListener("mousedown", onPointerDown);
    }, [
        profileMenuTarget
    ]);
    useEffect(()=>{
        if (!error) return;
        showToast(error, "error");
        setError(null);
    }, [
        error,
        showToast
    ]);
    useEffect(()=>{
        if (!authError) return;
        showToast(authError, "error");
        setAuthError(null);
    }, [
        authError,
        showToast
    ]);
    useEffect(()=>{
        setMobileNavOpen(false);
        setProfileMenuTarget(null);
    }, [
        activePage
    ]);
    useEffect(()=>{
        if (typeof window === "undefined") return;
        const saved = window.localStorage.getItem("fintrack.sidebarCollapsed");
        setSidebarCollapsed(saved === "1");
    }, []);
    useEffect(()=>{
        if (typeof window === "undefined") return;
        window.localStorage.setItem("fintrack.sidebarCollapsed", sidebarCollapsed ? "1" : "0");
    }, [
        sidebarCollapsed
    ]);
    const toastNode = toast ? /*#__PURE__*/ _jsx(ToastPopup, {
        message: toast.message,
        onDismiss: dismissToast,
        tone: toast.tone
    }) : null;
    if (!authChecked && !sessionToken && !legacyPassword) {
        return /*#__PURE__*/ _jsxs(_Fragment, {
            children: [
                toastNode,
                /*#__PURE__*/ _jsx("main", {
                    className: "login-shell",
                    children: /*#__PURE__*/ _jsx("section", {
                        className: "login-panel",
                        children: /*#__PURE__*/ _jsx("p", {
                            children: t("dashboard.loading")
                        })
                    })
                })
            ]
        });
    }
    if (!sessionToken && !legacyPassword) {
        return /*#__PURE__*/ _jsxs(_Fragment, {
            children: [
                toastNode,
                /*#__PURE__*/ _jsxs("main", {
                    className: "login-shell",
                    children: [
                        /*#__PURE__*/ _jsxs("section", {
                            className: "login-copy",
                            children: [
                                /*#__PURE__*/ _jsx("p", {
                                    className: "eyebrow",
                                    children: "FinTrack"
                                }),
                                /*#__PURE__*/ _jsx("h1", {
                                    children: t("landing.hero.title")
                                }),
                                /*#__PURE__*/ _jsx("p", {
                                    children: t("landing.hero.body")
                                }),
                                /*#__PURE__*/ _jsx("img", {
                                    alt: "Робочий стіл з нотатками про фінанси",
                                    src: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=80"
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("form", {
                            className: "login-panel",
                            onInvalidCapture: (event)=>handleValidationCapture(event, lang),
                            onSubmit: handleLogin,
                            children: [
                                /*#__PURE__*/ _jsx(LanguageSwitcher, {}),
                                /*#__PURE__*/ _jsxs("div", {
                                    children: [
                                        /*#__PURE__*/ _jsx("p", {
                                            className: "eyebrow",
                                            children: t("app.login")
                                        }),
                                        /*#__PURE__*/ _jsx("h2", {
                                            children: t("auth.title")
                                        }),
                                        /*#__PURE__*/ _jsx("small", {
                                            children: t("auth.helper")
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ _jsx("label", {
                                    htmlFor: "email",
                                    children: t("auth.email")
                                }),
                                /*#__PURE__*/ _jsx("input", {
                                    id: "email",
                                    onChange: (event)=>setEmail(event.target.value),
                                    required: true,
                                    type: "email",
                                    value: email
                                }),
                                /*#__PURE__*/ _jsx("label", {
                                    htmlFor: "password",
                                    children: t("auth.password")
                                }),
                                /*#__PURE__*/ _jsx("input", {
                                    id: "password",
                                    onChange: (event)=>setPassword(event.target.value),
                                    placeholder: "DASHBOARD_ADMIN_PASSWORD",
                                    required: true,
                                    type: "password",
                                    value: password
                                }),
                                /*#__PURE__*/ _jsx("button", {
                                    disabled: loading,
                                    type: "submit",
                                    children: t("auth.signIn")
                                }),
                                /*#__PURE__*/ _jsxs("a", {
                                    className: "google-login",
                                    href: `${apiOrigin}/api/auth/google/start?redirectTo=${encodeURIComponent("http://localhost:3000/dashboard")}`,
                                    children: [
                                        /*#__PURE__*/ _jsx(Icon, {
                                            name: "google"
                                        }),
                                        t("auth.google")
                                    ]
                                }),
                                /*#__PURE__*/ _jsx("a", {
                                    className: "auth-register-link",
                                    href: "/register",
                                    children: t("app.register")
                                })
                            ]
                        })
                    ]
                })
            ]
        });
    }
    return /*#__PURE__*/ _jsxs(_Fragment, {
        children: [
            toastNode,
            /*#__PURE__*/ _jsxs("main", {
                className: sidebarCollapsed ? "finance-app sidebar-collapsed" : "finance-app",
                children: [
                    mobileNavOpen ? /*#__PURE__*/ _jsx("button", {
                        "aria-label": t("nav.closeMenu"),
                        className: "mobile-drawer-backdrop",
                        onClick: ()=>setMobileNavOpen(false),
                        type: "button"
                    }) : null,
                    /*#__PURE__*/ _jsxs("aside", {
                        className: `${mobileNavOpen ? "finance-sidebar open" : "finance-sidebar"}${sidebarCollapsed ? " collapsed" : ""}`,
                        children: [
                            /*#__PURE__*/ _jsxs("div", {
                                className: "sidebar-header",
                                children: [
                                    /*#__PURE__*/ _jsxs("a", {
                                        "aria-label": "FinTrack",
                                        className: "brand",
                                        href: "/",
                                        title: "FinTrack",
                                        children: [
                                            /*#__PURE__*/ _jsxs("span", {
                                                className: "brand-mark",
                                                children: [
                                                    /*#__PURE__*/ _jsx("i", {}),
                                                    /*#__PURE__*/ _jsx("i", {}),
                                                    /*#__PURE__*/ _jsx("i", {})
                                                ]
                                            }),
                                            /*#__PURE__*/ _jsx("strong", {
                                                children: "FinTrack"
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ _jsx("button", {
                                        "aria-label": sidebarCollapsed ? t("nav.expandMenu") : t("nav.collapseMenu"),
                                        className: "sidebar-toggle",
                                        onClick: ()=>setSidebarCollapsed((current)=>!current),
                                        type: "button",
                                        children: /*#__PURE__*/ _jsx(Icon, {
                                            name: "chevronRight"
                                        })
                                    })
                                ]
                            }),
                            /*#__PURE__*/ _jsxs("div", {
                                className: "sidebar-scroll",
                                children: [
                                    /*#__PURE__*/ _jsx("nav", {
                                        className: "side-nav",
                                        children: visibleNavItems.map((item)=>{
                                            const navLabel = isWorkspaceAdmin && "labelEn" in item ? lang === "en" ? item.labelEn : item.label : t(`nav.${item.key}`);
                                            return /*#__PURE__*/ _jsxs("a", {
                                                className: activePage === item.key ? "active" : "",
                                                href: `#${item.key}`,
                                                onClick: ()=>openPage(item.key),
                                                title: sidebarCollapsed ? navLabel : undefined,
                                                children: [
                                                    /*#__PURE__*/ _jsx("span", {
                                                        className: "nav-icon",
                                                        children: /*#__PURE__*/ _jsx(Icon, {
                                                            name: item.icon
                                                        })
                                                    }),
                                                    /*#__PURE__*/ _jsx("span", {
                                                        className: "nav-label",
                                                        children: navLabel
                                                    })
                                                ]
                                            }, item.key);
                                        })
                                    }),
                                    !isWorkspaceAdmin ? /*#__PURE__*/ _jsxs(_Fragment, {
                                        children: [
                                            /*#__PURE__*/ _jsxs("section", {
                                                className: "upgrade-panel",
                                                children: [
                                                    /*#__PURE__*/ _jsx("div", {
                                                        className: "shield",
                                                        children: /*#__PURE__*/ _jsx(Icon, {
                                                            name: "shield"
                                                        })
                                                    }),
                                                    /*#__PURE__*/ _jsx("strong", {
                                                        children: t("sidebar.premium.title")
                                                    }),
                                                    /*#__PURE__*/ _jsx("p", {
                                                        children: t("sidebar.premium.body")
                                                    }),
                                                    /*#__PURE__*/ _jsx("button", {
                                                        type: "button",
                                                        children: t("sidebar.premium.button")
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ _jsxs("section", {
                                                className: "rates-panel",
                                                children: [
                                                    /*#__PURE__*/ _jsxs("div", {
                                                        className: "panel-title",
                                                        children: [
                                                            /*#__PURE__*/ _jsx("strong", {
                                                                children: t("sidebar.currency")
                                                            }),
                                                            /*#__PURE__*/ _jsx(Icon, {
                                                                name: "settings"
                                                            })
                                                        ]
                                                    }),
                                                    exchangeRates.map((rate)=>/*#__PURE__*/ _jsx(RateRow, {
                                                            rate: rate
                                                        }, rate.code)),
                                                    /*#__PURE__*/ _jsxs("small", {
                                                        className: "rates-source",
                                                        children: [
                                                            t("rates.source"),
                                                            exchangeRates[0]?.date && !exchangeRates[0].fallback ? ` · ${exchangeRates[0].date}` : ` · ${t("rates.fallback")}`
                                                        ]
                                                    })
                                                ]
                                            })
                                        ]
                                    }) : null
                                ]
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("section", {
                        className: "finance-workspace",
                        children: [
                            /*#__PURE__*/ _jsxs("div", {
                                className: "mobile-topbar",
                                children: [
                                    /*#__PURE__*/ _jsx("button", {
                                        "aria-label": t("nav.openMenu"),
                                        className: "mobile-menu-button",
                                        onClick: ()=>setMobileNavOpen(true),
                                        type: "button",
                                        children: /*#__PURE__*/ _jsx(Icon, {
                                            name: "menu"
                                        })
                                    }),
                                    /*#__PURE__*/ _jsxs("a", {
                                        "aria-label": "FinTrack",
                                        className: "mobile-brand",
                                        href: "/",
                                        children: [
                                            /*#__PURE__*/ _jsxs("span", {
                                                className: "brand-mark compact-mark",
                                                children: [
                                                    /*#__PURE__*/ _jsx("i", {}),
                                                    /*#__PURE__*/ _jsx("i", {}),
                                                    /*#__PURE__*/ _jsx("i", {})
                                                ]
                                            }),
                                            /*#__PURE__*/ _jsx("strong", {
                                                children: "FinTrack"
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ _jsxs("div", {
                                        className: "mobile-topbar-actions",
                                        children: [
                                            /*#__PURE__*/ _jsx(NotificationBell, {
                                                notifications: snapshot.notifications,
                                                onMarkAllRead: readAllNotifications,
                                                onMarkRead: readNotification,
                                                open: notificationsOpen,
                                                panelRef: mobileNotificationPanelRef,
                                                setOpen: (nextOpen)=>{
                                                    setProfileMenuTarget(null);
                                                    setNotificationsOpen(nextOpen);
                                                },
                                                unreadCount: unreadNotificationCount
                                            }),
                                            /*#__PURE__*/ _jsx(ProfileMenu, {
                                                avatarUrl: snapshot.profile?.avatarUrl ?? "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80",
                                                compact: true,
                                                menuRef: mobileProfileMenuRef,
                                                onLogout: logout,
                                                onOpenProfile: ()=>openPage("settings"),
                                                open: profileMenuTarget === "mobile",
                                                logoutLabel: t("nav.logout"),
                                                planLabel: t("app.premium"),
                                                profileLabel: t("nav.profile"),
                                                showProfileAction: !isWorkspaceAdmin,
                                                setOpen: (nextOpen)=>{
                                                    setNotificationsOpen(false);
                                                    setProfileMenuTarget(nextOpen ? "mobile" : null);
                                                },
                                                userName: currentUser
                                            })
                                        ]
                                    })
                                ]
                            }),
                            /*#__PURE__*/ _jsxs("header", {
                                className: "topbar",
                                children: [
                                    /*#__PURE__*/ _jsx("div", {
                                        className: "topbar-spacer",
                                        "aria-hidden": "true"
                                    }),
                                    /*#__PURE__*/ _jsxs("div", {
                                        className: "top-icons",
                                        children: [
                                            /*#__PURE__*/ _jsx(LanguageSwitcher, {
                                                compact: true
                                            }),
                                            /*#__PURE__*/ _jsx(NotificationBell, {
                                                notifications: snapshot.notifications,
                                                onMarkAllRead: readAllNotifications,
                                                onMarkRead: readNotification,
                                                open: notificationsOpen,
                                                panelRef: desktopNotificationPanelRef,
                                                setOpen: (nextOpen)=>{
                                                    setProfileMenuTarget(null);
                                                    setNotificationsOpen(nextOpen);
                                                },
                                                unreadCount: unreadNotificationCount
                                            }),
                                            /*#__PURE__*/ _jsx("span", {
                                                children: /*#__PURE__*/ _jsx(Icon, {
                                                    name: "help"
                                                })
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ _jsx("div", {
                                        className: "profile",
                                        children: /*#__PURE__*/ _jsx(ProfileMenu, {
                                            avatarUrl: snapshot.profile?.avatarUrl ?? "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80",
                                            menuRef: desktopProfileMenuRef,
                                            onLogout: logout,
                                            onOpenProfile: ()=>openPage("settings"),
                                            open: profileMenuTarget === "desktop",
                                            logoutLabel: t("nav.logout"),
                                            planLabel: t("app.premium"),
                                            profileLabel: t("nav.profile"),
                                            showProfileAction: !isWorkspaceAdmin,
                                            setOpen: (nextOpen)=>{
                                                setNotificationsOpen(false);
                                                setProfileMenuTarget(nextOpen ? "desktop" : null);
                                            },
                                            userName: currentUser
                                        })
                                    })
                                ]
                            }),
                            activePage === "dashboard" ? /*#__PURE__*/ _jsx(DashboardPage, {
                                answer: answer,
                                askAi: askAi,
                                budgets: budgets,
                                byCategory: snapshot.overview.byCategory,
                                categories: categories,
                                expenses: expenses,
                                hasRealBudgets: hasRealBudgets,
                                incomes: incomes,
                                loading: loading,
                                monthExpense: monthExpense,
                                monthIncome: monthIncome,
                                monthPlannedIncome: monthPlannedIncome,
                                onAction: queueAction,
                                onAskChange: setQuestion,
                                onNavigate: openPage,
                                onOpenModal: openModal,
                                prevMonthExpense: snapshot.overview.prevMonthExpenseTotal,
                                question: question,
                                savings: savings
                            }) : null,
                            activePage === "income" ? /*#__PURE__*/ _jsx(IncomePage, {
                                accounts: accounts,
                                incomes: incomes,
                                loading: loading,
                                onDeleteIncome: deleteTransactionRecord,
                                onOpenModal: openModal
                            }) : null,
                            activePage === "expenses" ? /*#__PURE__*/ _jsx(ExpensesPage, {
                                accounts: accounts,
                                categories: categoryCatalog,
                                expenses: expenses,
                                loading: loading,
                                onDeleteExpense: deleteTransactionRecord,
                                onExportExpensesToGoogleSheets: exportExpensesToGoogleSheetsNow,
                                onOpenModal: openModal
                            }) : null,
                            activePage === "budgets" ? /*#__PURE__*/ _jsx(BudgetsPage, {
                                budgets: budgets,
                                budgetInsights: budgetInsights,
                                hasRealBudgets: hasRealBudgets,
                                monthExpense: monthExpense,
                                onDeleteBudget: deleteBudgetRecord,
                                onOpenModal: openModal
                            }) : null,
                            activePage === "goals" ? /*#__PURE__*/ _jsx(GoalsPage, {
                                goalImageGeneratingId: goalImageGeneratingId,
                                goals: goals,
                                onGenerateImage: generateGoalImageForGoal,
                                onOpenModal: openModal,
                                savings: savings
                            }) : null,
                            activePage === "liabilities" ? /*#__PURE__*/ _jsx(LiabilitiesPage, {
                                liabilities: snapshot.liabilities ?? [],
                                liabilityPayments: snapshot.liabilityPayments ?? [],
                                loading: loading,
                                onDeleteLiability: deleteLiabilityRecord,
                                onOpenModal: openModal,
                                overview: snapshot.overview
                            }) : null,
                            activePage === "loans" ? /*#__PURE__*/ _jsx(LoansPage, {
                                loans: snapshot.loans ?? [],
                                loading: loading,
                                onDeleteLoan: deleteLoanRecord,
                                onOpenModal: openModal,
                                overview: snapshot.overview
                            }) : null,
                            activePage === "analytics" ? /*#__PURE__*/ _jsx(AnalyticsPage, {
                                accounts: accounts,
                                categories: categoryCatalog,
                                expenses: expenses,
                                goals: goals,
                                incomes: incomes,
                                tags: snapshot.tags ?? []
                            }) : null,
                            activePage === "transactions" ? /*#__PURE__*/ _jsx(TransactionsPage, {
                                accounts: accounts,
                                categories: categoryCatalog,
                                expenses: expenses,
                                incomes: incomes,
                                loading: loading,
                                onDeleteTransaction: deleteTransactionRecord,
                                onOpenModal: openModal,
                                onSyncTransactions: syncMonobankNow,
                                setTab: setTransactionTab,
                                tab: transactionTab
                            }) : null,
                            activePage === "settings" ? /*#__PURE__*/ _jsx(SettingsPage, {
                                accounts: accounts,
                                categories: categoryCatalog,
                                connections: snapshot.connections,
                                isWorkspaceAdmin: isWorkspaceAdmin,
                                onConnectMonobank: connectMonobank,
                                onAction: queueAction,
                                onDeleteAccount: deleteAccount,
                                onDeleteCategoryRecord: deleteCategoryRecord,
                                onDeleteLedgerAccount: deleteLedgerAccount,
                                onImportTemplates: importFromTemplates,
                                onOpenModal: openModal,
                                onOpenTelegramAdmin: ()=>openPage("adminTelegram"),
                                onRefreshTelegramConnection: ()=>loadSnapshot(sessionToken, legacyPassword, {
                                        silent: true
                                    }),
                                onChangePassword: changePassword,
                                onExportData: exportPrivacyData,
                                onSaveNotification: saveNotification,
                                onSaveAiSettings: saveAiSettings,
                                onSaveProfile: saveProfile,
                                onSaveSecuritySettings: saveSecuritySettings,
                                onSyncMonobank: syncMonobankNow,
                                onUploadAvatar: uploadAvatar,
                                onRevokeSecret: revokeSecret,
                                onSaveSecret: saveSecret,
                                profile: snapshot.profile,
                                userName: currentUser
                            }) : null,
                            isWorkspaceAdmin && isAdminSection(activePage) ? /*#__PURE__*/ _jsx(TelegramAdminPage, {
                                section: activePage,
                                onRefreshAll: ()=>refreshAdminConsole(),
                                onEnableWebhook: enableTelegramWebhookNow,
                                onOpenBot: ()=>{
                                    if (telegramAdmin?.botUrl) {
                                        window.open(telegramAdmin.botUrl, "_blank", "noopener,noreferrer");
                                    }
                                },
                                onRefresh: ()=>loadTelegramAdminSettings(),
                                overview: adminOverview,
                                onSave: saveTelegramAdmin,
                                settings: telegramAdmin
                            }) : null
                        ]
                    }),
                    !isWorkspaceAdmin ? /*#__PURE__*/ _jsxs("nav", {
                        className: "mobile-bottom-nav",
                        children: [
                            /*#__PURE__*/ _jsxs("button", {
                                className: activePage === "dashboard" ? "active" : "",
                                onClick: ()=>openPage("dashboard"),
                                type: "button",
                                children: [
                                    /*#__PURE__*/ _jsx(Icon, {
                                        name: "home"
                                    }),
                                    /*#__PURE__*/ _jsx("span", {
                                        children: t("nav.dashboard")
                                    })
                                ]
                            }),
                            /*#__PURE__*/ _jsxs("button", {
                                className: activePage === mobileSecondPage ? "active" : "",
                                onClick: ()=>openPage(mobileSecondPage),
                                type: "button",
                                children: [
                                    /*#__PURE__*/ _jsx(Icon, {
                                        name: mobileSecondPage === "analytics" ? "analytics" : "transactions"
                                    }),
                                    /*#__PURE__*/ _jsx("span", {
                                        children: mobileSecondLabel
                                    })
                                ]
                            }),
                            /*#__PURE__*/ _jsx("button", {
                                "aria-label": t("nav.quickAdd"),
                                className: "mobile-fab",
                                onClick: ()=>openModal(mobilePrimaryAction),
                                type: "button",
                                children: /*#__PURE__*/ _jsx(Icon, {
                                    name: "plus"
                                })
                            }),
                            /*#__PURE__*/ _jsxs("button", {
                                className: activePage === "budgets" ? "active" : "",
                                onClick: ()=>openPage("budgets"),
                                type: "button",
                                children: [
                                    /*#__PURE__*/ _jsx(Icon, {
                                        name: "briefcase"
                                    }),
                                    /*#__PURE__*/ _jsx("span", {
                                        children: t("nav.budgets")
                                    })
                                ]
                            }),
                            /*#__PURE__*/ _jsxs("button", {
                                className: activePage === "settings" ? "active" : "",
                                onClick: ()=>openPage("settings"),
                                type: "button",
                                children: [
                                    /*#__PURE__*/ _jsx(Icon, {
                                        name: "user"
                                    }),
                                    /*#__PURE__*/ _jsx("span", {
                                        children: t("settings.tabs.profile")
                                    })
                                ]
                            })
                        ]
                    }) : null,
                    modal ? /*#__PURE__*/ _jsx(QuickModal, {
                        accounts: accounts,
                        budgets: budgets,
                        categories: categoryCatalog,
                        generatingGoalImage: goalImageGeneratingId !== "" && goalImageGeneratingId === modal.item?.id,
                        item: modal.item,
                        kind: modal.kind,
                        loading: loading,
                        onClose: ()=>setModal(null),
                        onDelete: modal.kind === "budget" && modal.item?.id ? ()=>deleteBudgetRecord(modal.item.id, modal.item.name) : modal.kind === "liability" && modal.item?.id ? ()=>deleteLiabilityRecord(modal.item.id, modal.item.name) : modal.kind === "expense" || modal.kind === "income" ? modal.item?.id ? ()=>deleteTransactionRecord(modal.item) : undefined : undefined,
                        onGenerateGoalImage: generateGoalImageForGoal,
                        onSubmit: submitQuickForm
                    }) : null,
                    confirmDialog ? /*#__PURE__*/ _jsx(ConfirmDialog, {
                        danger: confirmDialog.danger,
                        message: confirmDialog.message,
                        onCancel: ()=>setConfirmDialog(null),
                        onConfirm: ()=>{ setConfirmDialog(null); confirmDialog.onConfirm(); }
                    }) : null
                ]
            })
        ]
    });
}
function DashboardPage({ answer, askAi, budgets, byCategory, categories, expenses, hasRealBudgets, incomes, loading, monthExpense, monthIncome, monthPlannedIncome, onAction, onAskChange, onNavigate, onOpenModal, prevMonthExpense, question, savings }) {
    const { t } = useI18n();
    const tips = useIndicatorTooltips();
    const [trendPeriodMonths, setTrendPeriodMonths] = useState(6);
    const [dashboardTransactionSort, setDashboardTransactionSort] = useState({
        direction: "desc",
        key: "date"
    });
    const recentExpenseRows = useMemo(()=>sortDashboardTransactionRows(expenses, dashboardTransactionSort).slice(0, 5), [
        dashboardTransactionSort,
        expenses
    ]);
    const trendChartData = useMemo(() => {
        const now = new Date();
        const result = [];
        for (let i = trendPeriodMonths - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const year = d.getFullYear();
            const month = d.getMonth();
            const rawLabel = d.toLocaleDateString("uk-UA", { month: "short" });
            const monthLabel = (rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1)).replace(".", "");
            const income = (incomes.length ? incomes : []).filter((row) => {
                const rd = new Date(row.date);
                return rd.getFullYear() === year && rd.getMonth() === month && isActualIncomeStatus(row.status);
            }).reduce((s, row) => s + row.amount, 0);
            const expense = expenses.filter((row) => {
                const rd = new Date(row.date);
                return rd.getFullYear() === year && rd.getMonth() === month;
            }).reduce((s, row) => s + row.amount, 0);
            result.push({ month: monthLabel, income, expense });
        }
        return result;
    }, [expenses, incomes, trendPeriodMonths]);
    // Dynamic insights from real data
    const expenseChangePercent = prevMonthExpense > 0
        ? Math.round((monthExpense - prevMonthExpense) / prevMonthExpense * 100)
        : null;
    const topCategory = byCategory && byCategory.length > 0 ? byCategory[0] : null;
    const insightExpenseTitle = expenseChangePercent === null
        ? "Перший місяць"
        : expenseChangePercent < 0
            ? `Витрати зменшились на ${Math.abs(expenseChangePercent)}%`
            : expenseChangePercent > 0
                ? `Витрати зросли на ${expenseChangePercent}%`
                : "Витрати без змін";
    const insightExpenseText = expenseChangePercent === null
        ? t("expense.trend.noDataPrev")
        : expenseChangePercent < 0
            ? t("expense.trend.great")
            : expenseChangePercent > 0
                ? t("expense.trend.higher")
                : t("expense.trend.sameLevel");
    const insightCategoryTitle = topCategory
        ? `Найбільша категорія: ${topCategory.name}`
        : t("expense.trend.noExpenses");
    const insightCategoryText = topCategory
        ? `${topCategory.name} — ${formatMoney(topCategory.total)}, найбільша частка витрат цього місяця.`
        : t("expense.trend.addExpenses");
    const savingsRate = monthIncome > 0 ? Math.round(savings / monthIncome * 100) : 0;
    const expenseTrendText = expenseChangePercent === null ? t("expense.trend.current") : expenseChangePercent === 0 ? t("expense.trend.noChange") : `${expenseChangePercent > 0 ? "+" : ""}${expenseChangePercent}% до минулого місяця`;
    return /*#__PURE__*/ _jsxs(_Fragment, {
        children: [
            /*#__PURE__*/ _jsxs("section", {
                className: "ai-bar",
                children: [
                    /*#__PURE__*/ _jsxs("div", {
                        className: "insight-strip",
                        children: [
                            /*#__PURE__*/ _jsx(Insight, {
                                title: insightExpenseTitle,
                                text: insightExpenseText
                            }),
                            /*#__PURE__*/ _jsx(Insight, {
                                title: insightCategoryTitle,
                                text: insightCategoryText
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        className: "ai-panel",
                        children: [
                            /*#__PURE__*/ _jsxs("form", {
                                className: "ai-question",
                                onSubmit: askAi,
                                children: [
                                    /*#__PURE__*/ _jsx("input", {
                                        onChange: (event)=>onAskChange(event.target.value),
                                        placeholder: t("dashboard.actions.askAi"),
                                        value: question
                                    }),
                                    /*#__PURE__*/ _jsx("button", {
                                        disabled: loading,
                                        type: "submit",
                                        children: t("dashboard.actions.ask")
                                    })
                                ]
                            }),
                            answer ? /*#__PURE__*/ _jsx("p", {
                                className: "answer",
                                children: answer
                            }) : null
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("section", {
                className: "metric-grid",
                children: [
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: "green",
                        icon: "wallet",
                        label: t("dashboard.metrics.income"),
                        tooltip: tips.dashboard.actualIncome,
                        trend: t("dashboard.metrics.incomeReceived"),
                        value: monthIncome
                    }),
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: "blue",
                        icon: "chart",
                        label: t("dashboard.metrics.plannedIncome"),
                        tooltip: tips.dashboard.plannedIncome,
                        trend: monthPlannedIncome > 0 ? t("dashboard.metrics.plannedReceipts") : t("dashboard.metrics.noPlannedIncome"),
                        value: monthPlannedIncome
                    }),
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: "red",
                        icon: "arrowUp",
                        label: t("dashboard.metrics.expenses"),
                        tooltip: tips.dashboard.expenses,
                        trend: expenseTrendText,
                        value: monthExpense
                    }),
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: "lime",
                        icon: "piggy",
                        label: t("dashboard.metrics.savings"),
                        tooltip: tips.dashboard.savings,
                        trend: monthIncome > 0 ? `${savingsRate}% ${t("dashboard.metrics.ofActualIncome")}` : t("dashboard.metrics.noIncomeYet"),
                        value: savings
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("section", {
                className: "content-grid",
                children: [
                    /*#__PURE__*/ _jsxs(Panel, {
                        actionNode: /*#__PURE__*/ _jsxs("select", {
                            className: "panel-period-select",
                            onChange: (e) => setTrendPeriodMonths(Number(e.target.value)),
                            value: trendPeriodMonths,
                            children: [
                                /*#__PURE__*/ _jsx("option", { value: 3, children: t("period.3months") }),
                                /*#__PURE__*/ _jsx("option", { value: 6, children: t("period.6months") }),
                                /*#__PURE__*/ _jsx("option", { value: 12, children: t("period.12months") })
                            ]
                        }),
                        className: "income-panel",
                        title: t("dashboard.trend"),
                        children: [
                            /*#__PURE__*/ _jsx(Legend, {
                                items: [
                                    [
                                        t("dashboard.metrics.income"),
                                        "#22c55e"
                                    ],
                                    [
                                        t("dashboard.metrics.expenses"),
                                        "#3b82f6"
                                    ]
                                ]
                            }),
                            /*#__PURE__*/ _jsx(ResponsiveContainer, {
                                height: 255,
                                width: "100%",
                                children: /*#__PURE__*/ _jsxs(AreaChart, {
                                    data: trendChartData,
                                    children: [
                                        /*#__PURE__*/ _jsxs("defs", {
                                            children: [
                                                /*#__PURE__*/ _jsxs("linearGradient", {
                                                    id: "incomeGradient",
                                                    x1: "0",
                                                    x2: "0",
                                                    y1: "0",
                                                    y2: "1",
                                                    children: [
                                                        /*#__PURE__*/ _jsx("stop", {
                                                            offset: "0%",
                                                            stopColor: "#22c55e",
                                                            stopOpacity: 0.22
                                                        }),
                                                        /*#__PURE__*/ _jsx("stop", {
                                                            offset: "100%",
                                                            stopColor: "#22c55e",
                                                            stopOpacity: 0.02
                                                        })
                                                    ]
                                                }),
                                                /*#__PURE__*/ _jsxs("linearGradient", {
                                                    id: "expenseGradient",
                                                    x1: "0",
                                                    x2: "0",
                                                    y1: "0",
                                                    y2: "1",
                                                    children: [
                                                        /*#__PURE__*/ _jsx("stop", {
                                                            offset: "0%",
                                                            stopColor: "#3b82f6",
                                                            stopOpacity: 0.22
                                                        }),
                                                        /*#__PURE__*/ _jsx("stop", {
                                                            offset: "100%",
                                                            stopColor: "#3b82f6",
                                                            stopOpacity: 0.02
                                                        })
                                                    ]
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ _jsx(CartesianGrid, {
                                            stroke: "#edf1f6",
                                            vertical: false
                                        }),
                                        /*#__PURE__*/ _jsx(XAxis, {
                                            axisLine: false,
                                            dataKey: "month",
                                            tickLine: false
                                        }),
                                        /*#__PURE__*/ _jsx(YAxis, {
                                            axisLine: false,
                                            tickFormatter: (value)=>`${Number(value) / 1000}K`,
                                            tickLine: false
                                        }),
                                        /*#__PURE__*/ _jsx(Tooltip, {
                                            formatter: (value)=>formatMoney(Number(value))
                                        }),
                                        /*#__PURE__*/ _jsx(Area, {
                                            dataKey: "income",
                                            fill: "url(#incomeGradient)",
                                            stroke: "#22c55e",
                                            strokeWidth: 3,
                                            type: "monotone"
                                        }),
                                        /*#__PURE__*/ _jsx(Area, {
                                            dataKey: "expense",
                                            fill: "url(#expenseGradient)",
                                            stroke: "#3b82f6",
                                            strokeWidth: 3,
                                            type: "monotone"
                                        })
                                    ]
                                })
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsx(CategoryPanel, {
                        allAccounts: [],
                        allExpenses: expenses,
                        categories: categories,
                        title: t("dashboard.categories"),
                        total: monthExpense
                    }),
                    /*#__PURE__*/ _jsxs(Panel, {
                        className: "transactions-panel",
                        title: t("dashboard.recentTransactions"),
                        children: [
                            /*#__PURE__*/ _jsx(TransactionTable, {
                                onSortChange: setDashboardTransactionSort,
                                rows: recentExpenseRows,
                                sortState: dashboardTransactionSort
                            }),
                            /*#__PURE__*/ _jsxs("button", {
                                className: "ghost-button",
                                onClick: ()=>onNavigate("transactions"),
                                type: "button",
                                children: [
                                    t("dashboard.viewTransactions"),
                                    " ",
                                    /*#__PURE__*/ _jsx(Icon, {
                                        name: "chevronRight"
                                    })
                                ]
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        className: "right-stack",
                        children: [
                            /*#__PURE__*/ _jsx(BudgetMiniPanel, {
                                budgets: budgets,
                                hasRealBudgets: hasRealBudgets,
                                onNavigate: onNavigate,
                                onOpenModal: onOpenModal
                            })
                        ]
                    })
                ]
            })
        ]
    });
}
function IncomePage({ accounts, incomes, loading, onDeleteIncome, onOpenModal }) {
    const { lang, t } = useI18n();
    const tips = useIndicatorTooltips();
    const [query, setQuery] = useState("");
    const defaultRange = useMemo(()=>latestRangeFromRows(incomes), [
        incomes
    ]);
    const [selectedRange, setSelectedRange] = useState(defaultRange);
    const [selectedSource, setSelectedSource] = useState("all");
    const [selectedAccount, setSelectedAccount] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [incomeSort, setIncomeSort] = useState({
        direction: "desc",
        key: "date"
    });
    const [visibleRows, setVisibleRows] = useState(40);
    const incomeScrollRef = useRef(null);
    const incomeLoadMoreRef = useRef(null);
    const selectedRangeKey = dateRangeKey(selectedRange);
    const defaultRangeKey = dateRangeKey(defaultRange);
    const sourceOptions = useMemo(()=>[
            {
                label: t("filters.allSources"),
                value: "all"
            },
            ...Array.from(new Set(incomes.map((income)=>income.source).filter(Boolean))).map((source)=>({
                    label: source,
                    value: source
                }))
        ], [
        incomes,
        t
    ]);
    const accountOptions = useMemo(()=>[
            {
                label: t("filters.allAccounts"),
                value: "all"
            },
            ...accounts.map((account)=>({
                    label: account.name,
                    value: account.id
                }))
        ], [
        accounts,
        t
    ]);
    const statusOptions = useMemo(()=>{
        const uniqueStatuses = Array.from(new Set(incomes.map((income)=>getIncomeStatusValue(income.status))));
        return [
            {
                label: t("filters.allStatuses"),
                value: "all"
            },
            ...uniqueStatuses.map((status)=>({
                    label: t(formatIncomeStatus(status)),
                    value: status
                }))
        ];
    }, [
        incomes,
        t
    ]);
    const filteredIncomes = useMemo(()=>incomes.filter((income)=>{
            const haystack = `${income.source ?? ""} ${income.description ?? ""} ${income.account ?? ""}`.toLocaleLowerCase("uk-UA");
            const matchesQuery = !query.trim() || haystack.includes(query.trim().toLocaleLowerCase("uk-UA"));
            const matchesSource = selectedSource === "all" || income.source === selectedSource;
            const rowAccount = income.accountId ?? income.account ?? "";
            const selectedAccountRecord = accounts.find((account)=>account.id === selectedAccount || account.name === selectedAccount);
            const matchesAccount = selectedAccount === "all" || rowAccount === selectedAccount || income.account === selectedAccountRecord?.name;
            const matchesStatus = selectedStatus === "all" || getIncomeStatusValue(income.status) === selectedStatus;
            const matchesPeriod = matchesDateRange(income.date, selectedRange);
            return matchesQuery && matchesSource && matchesAccount && matchesStatus && matchesPeriod;
        }), [
        accounts,
        incomes,
        query,
        selectedAccount,
        selectedRangeKey,
        selectedSource,
        selectedStatus
    ]);
    const rows = useMemo(()=>sortIncomeRows(filteredIncomes, incomeSort), [
        filteredIncomes,
        incomeSort
    ]);
    const visibleIncomeRows = rows.slice(0, visibleRows);
    const remainingRows = Math.max(rows.length - visibleRows, 0);
    const periodIncome = sum(filteredIncomes.map((income)=>income.amount));
    const actualFilteredIncomes = filteredIncomes.filter((income)=>isActualIncomeStatus(income.status));
    const plannedFilteredIncomes = filteredIncomes.filter((income)=>!isActualIncomeStatus(income.status));
    const actualPeriodIncome = sum(actualFilteredIncomes.map((income)=>income.amount));
    const plannedPeriodIncome = sum(plannedFilteredIncomes.map((income)=>income.amount));
    const sources = groupIncomesBySource(filteredIncomes);
    const averageIncome = actualFilteredIncomes.length ? Math.round(actualPeriodIncome / actualFilteredIncomes.length) : 0;
    const topSource = sources[0] ?? {
        name: "Немає даних",
        total: 0
    };
    const incomeTrend = useMemo(()=>buildIncomeTrendData(filteredIncomes, selectedRange), [
        filteredIncomes,
        selectedRangeKey
    ]);
    useEffect(()=>{
        setSelectedRange(defaultRange);
    }, [
        defaultRangeKey
    ]);
    useEffect(()=>{
        setVisibleRows(40);
    }, [
        incomeSort.direction,
        incomeSort.key,
        query,
        selectedAccount,
        selectedRangeKey,
        selectedSource,
        selectedStatus
    ]);
    useEffect(()=>{
        const node = incomeLoadMoreRef.current;
        const scrollRoot = incomeScrollRef.current;
        if (!node || !scrollRoot || visibleRows >= rows.length) return undefined;
        const observer = new IntersectionObserver((entries)=>{
            if (entries.some((entry)=>entry.isIntersecting)) {
                setVisibleRows((current)=>Math.min(current + 30, rows.length));
            }
        }, {
            root: scrollRoot,
            rootMargin: "160px 0px"
        });
        observer.observe(node);
        return ()=>observer.disconnect();
    }, [
        rows.length,
        visibleRows
    ]);
    function resetFilters() {
        setQuery("");
        setSelectedSource("all");
        setSelectedAccount("all");
        setSelectedStatus("all");
        setSelectedRange(defaultRange);
    }
    return /*#__PURE__*/ _jsxs(Page, {
        className: "transactions-page income-page",
        title: t("pages.income.title"),
        subtitle: t("pages.income.subtitle"),
        children: [
            /*#__PURE__*/ _jsx(InteractiveFilterBar, {
                filters: [
                    {
                        label: "",
                        onChange: setSelectedSource,
                        options: sourceOptions,
                        value: selectedSource
                    },
                    {
                        label: "",
                        onChange: setSelectedAccount,
                        options: accountOptions,
                        value: selectedAccount
                    },
                    {
                        label: "",
                        onChange: setSelectedStatus,
                        options: statusOptions,
                        value: selectedStatus
                    },
                    {
                        label: "",
                        onRangeChange: setSelectedRange,
                        range: selectedRange
                    }
                ],
                onReset: resetFilters,
                onSearchChange: setQuery,
                searchPlaceholder: t("filters.searchIncome"),
                searchValue: query
            }),
            /*#__PURE__*/ _jsxs("section", {
                className: "metric-grid",
                children: [
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: "green",
                        icon: "wallet",
                        label: t("metrics.incomePeriod"),
                        tooltip: tips.income.totalPeriod,
                        trend: t("metrics.records").replace("{count}", String(actualFilteredIncomes.length)),
                        value: actualPeriodIncome
                    }),
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: "blue",
                        icon: "income",
                        label: t("dashboard.metrics.plannedIncome"),
                        tooltip: tips.income.topSource,
                        trend: t("metrics.records").replace("{count}", String(plannedFilteredIncomes.length)),
                        value: plannedPeriodIncome
                    }),
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: "violet",
                        icon: "chart",
                        label: t("metrics.avgIncome"),
                        tooltip: tips.income.averageIncome,
                        trend: t("metrics.perRecord"),
                        value: averageIncome
                    }),
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: "lime",
                        icon: "spark",
                        label: t("metrics.incomeSources"),
                        tooltip: tips.income.sourceCount,
                        trend: formatRangeLabel(selectedRange, lang),
                        value: sources.length || 0
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("section", {
                className: "two-column",
                children: [
                    /*#__PURE__*/ _jsx(Panel, {
                        action: formatRangeLabel(selectedRange, lang),
                        titleTooltip: tips.analytics.incomeVsExpenses,
                        title: t("panels.incomeTrend"),
                        children: /*#__PURE__*/ _jsx(SimpleArea, {
                            color: "#22c55e",
                            data: incomeTrend,
                            dataKey: "total",
                            xKey: "label"
                        })
                    }),
                    /*#__PURE__*/ _jsx(CategoryPanel, {
                        categories: sources,
                        title: t("panels.incomeBySource"),
                        titleTooltip: tips.income.sourceCount,
                        total: periodIncome
                    })
                ]
            }),
            /*#__PURE__*/ _jsx(Panel, {
                actionNode: /*#__PURE__*/ _jsx("button", {
                    "aria-label": t("dashboard.actions.addIncome"),
                    className: "icon-button",
                    onClick: ()=>onOpenModal("income"),
                    type: "button",
                    children: /*#__PURE__*/ _jsx(Icon, {
                        name: "plus"
                    })
                }),
                className: "transaction-list-panel",
                titleTooltip: tips.transactions.list,
                title: t("panels.incomeList"),
                children: /*#__PURE__*/ _jsxs("div", {
                    className: "transaction-scroll-area",
                    ref: incomeScrollRef,
                    children: [
                        /*#__PURE__*/ _jsx(UnifiedIncomeTable, {
                            onDelete: onDeleteIncome,
                            onEdit: (income)=>onOpenModal("income", income),
                            onSortChange: setIncomeSort,
                            rows: visibleIncomeRows,
                            sortState: incomeSort
                        }),
                        /*#__PURE__*/ _jsx("div", {
                            className: "transaction-load-state",
                            ref: incomeLoadMoreRef,
                            children: remainingRows > 0 ? /*#__PURE__*/ _jsxs("button", {
                                className: "secondary-button compact",
                                onClick: ()=>setVisibleRows((current)=>Math.min(current + 30, rows.length)),
                                type: "button",
                                children: [
                                    t("actions.showMoreOf").replace("{count}", String(Math.min(30, remainingRows))).replace("{remaining}", String(remainingRows))
                                ]
                            }) : rows.length ? /*#__PURE__*/ _jsx("span", {
                                children: t("actions.showAllIncome")
                            }) : /*#__PURE__*/ _jsx("span", {
                                children: t("empty.incomeFiltered")
                            })
                        })
                    ]
                })
            })
        ]
    });
}
function ExpensesPage({ accounts, categories, expenses, loading, onDeleteExpense, onExportExpensesToGoogleSheets, onOpenModal }) {
    const { lang, t } = useI18n();
    const tips = useIndicatorTooltips();
    const [query, setQuery] = useState("");
    const defaultRange = useMemo(()=>latestRangeFromRows(expenses), [
        expenses
    ]);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedAccount, setSelectedAccount] = useState("all");
    const [selectedMode, setSelectedMode] = useState("all");
    const [selectedRange, setSelectedRange] = useState(defaultRange);
    const [expenseSort, setExpenseSort] = useState({
        direction: "desc",
        key: "date"
    });
    const [visibleRows, setVisibleRows] = useState(40);
    const expenseScrollRef = useRef(null);
    const expenseLoadMoreRef = useRef(null);
    const selectedRangeKey = dateRangeKey(selectedRange);
    const defaultRangeKey = dateRangeKey(defaultRange);
    const accountOptions = useMemo(()=>[
            {
                label: t("filters.allAccounts"),
                value: "all"
            },
            ...accounts.map((account)=>({
                    label: account.name,
                    value: account.id
                }))
        ], [
        accounts,
        t
    ]);
    const categoryOptions = useMemo(()=>[
            {
                label: t("filters.allCategories"),
                value: "all"
            },
            ...categories.map((category)=>({
                    label: category.name,
                    value: category.id ?? category.name
                }))
        ], [
        categories,
        t
    ]);
    const filteredExpenses = useMemo(()=>expenses.filter((expense)=>{
            const haystack = `${expense.description ?? ""} ${expense.category ?? ""} ${expense.account ?? ""}`.toLocaleLowerCase("uk-UA");
            const matchesQuery = !query.trim() || haystack.includes(query.trim().toLocaleLowerCase("uk-UA"));
            const expenseCategoryValue = expense.categoryId ?? expense.category ?? "";
            const expenseAccountValue = expense.accountId ?? expense.account ?? "";
            const matchesCategory = selectedCategory === "all" || expenseCategoryValue === selectedCategory;
            const selectedAccountRecord = accounts.find((account)=>account.id === selectedAccount || account.name === selectedAccount);
            const matchesAccount = selectedAccount === "all" || expenseAccountValue === selectedAccount || expense.account === selectedAccountRecord?.name;
            const matchesPeriod = matchesDateRange(expense.date, selectedRange);
            const matchesMode = selectedMode === "all" || selectedMode === "card" && expense.paymentType === "CARD" || selectedMode === "cash" && expense.paymentType === "CASH" || selectedMode === "review" && expense.sourceStatus === "NEEDS_REVIEW";
            return matchesQuery && matchesCategory && matchesAccount && matchesPeriod && matchesMode;
        }), [
        accounts,
        expenses,
        query,
        selectedAccount,
        selectedCategory,
        selectedMode,
        selectedRangeKey
    ]);
    const rows = useMemo(()=>sortTransactionRows(filteredExpenses, expenseSort), [
        expenseSort,
        filteredExpenses
    ]);
    const visibleExpenseRows = rows.slice(0, visibleRows);
    const remainingRows = Math.max(rows.length - visibleRows, 0);
    const filteredExpenseTotal = sum(filteredExpenses.map((expense)=>expense.amount));
    const dominantCategory = topCategory(filteredExpenses, categories);
    const expenseSignals = useMemo(()=>buildExpenseSignals(filteredExpenses), [
        filteredExpenses
    ]);
    const filteredCategories = useMemo(()=>groupCategoriesFromExpenses(filteredExpenses, categories), [
        categories,
        filteredExpenses
    ]);
    const expenseTrend = useMemo(()=>buildExpenseTrendData(filteredExpenses, selectedRange), [
        filteredExpenses,
        selectedRangeKey
    ]);
    useEffect(()=>{
        setSelectedRange(defaultRange);
    }, [
        defaultRangeKey
    ]);
    useEffect(()=>{
        setVisibleRows(40);
    }, [
        expenseSort.direction,
        expenseSort.key,
        query,
        selectedAccount,
        selectedCategory,
        selectedMode,
        selectedRangeKey
    ]);
    useEffect(()=>{
        const node = expenseLoadMoreRef.current;
        const scrollRoot = expenseScrollRef.current;
        if (!node || !scrollRoot || visibleRows >= rows.length) return undefined;
        const observer = new IntersectionObserver((entries)=>{
            if (entries.some((entry)=>entry.isIntersecting)) {
                setVisibleRows((current)=>Math.min(current + 30, rows.length));
            }
        }, {
            root: scrollRoot,
            rootMargin: "160px 0px"
        });
        observer.observe(node);
        return ()=>observer.disconnect();
    }, [
        rows.length,
        visibleRows
    ]);
    async function exportExcel() {
        try {
            exportExpenseRowsToWorkbook(rows, selectedRange);
            emitAppToast(t("expenses.excelExported"), "success");
        } catch (error) {
            emitAppToast(error instanceof Error ? error.message : t("expenses.excelError"), "error");
        }
    }
    async function exportGoogleSheets() {
        await onExportExpensesToGoogleSheets?.({
            accountId: selectedAccount === "all" ? null : selectedAccount,
            categoryId: selectedCategory === "all" ? null : selectedCategory,
            mode: selectedMode,
            query,
            range: {
                from: normalizeDateRange(selectedRange).from.toISOString(),
                to: normalizeDateRange(selectedRange).to.toISOString()
            },
            status: selectedMode === "review" ? "review" : "all"
        });
    }
    function resetFilters() {
        setQuery("");
        setSelectedCategory("all");
        setSelectedAccount("all");
        setSelectedMode("all");
        setSelectedRange(defaultRange);
    }
    return /*#__PURE__*/ _jsxs(Page, {
        className: "transactions-page expenses-page",
        title: t("pages.expenses.title"),
        subtitle: t("pages.expenses.subtitle"),
        children: [
            /*#__PURE__*/ _jsx(InteractiveFilterBar, {
                filters: [
                    {
                        label: "",
                        onChange: setSelectedCategory,
                        options: categoryOptions,
                        value: selectedCategory
                    },
                    {
                        label: "",
                        onChange: setSelectedAccount,
                        options: accountOptions,
                        value: selectedAccount
                    },
                    {
                        label: "",
                        onChange: setSelectedMode,
                        options: [
                            {
                                label: t("expenses.allFilters"),
                                value: "all"
                            },
                            {
                                label: t("expenses.card"),
                                value: "card"
                            },
                            {
                                label: t("expenses.cash"),
                                value: "cash"
                            },
                            {
                                label: t("expenses.aiReview"),
                                value: "review"
                            }
                        ],
                        value: selectedMode
                    },
                    {
                        label: "",
                        onRangeChange: setSelectedRange,
                        range: selectedRange
                    }
                ],
                onReset: resetFilters,
                onSearchChange: setQuery,
                searchPlaceholder: t("expenses.searchPlaceholder"),
                searchValue: query
            }),
            /*#__PURE__*/ _jsxs("section", {
                className: "metric-grid",
                children: [
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: "red",
                        icon: "arrowUp",
                        label: t("expenses.totalPeriod"),
                        tooltip: tips.expenses.totalPeriod,
                        trend: t("expenses.records").replace("{n}", rows.length),
                        value: filteredExpenseTotal
                    }),
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: "blue",
                        icon: "chart",
                        label: t("expenses.avgDaily"),
                        tooltip: tips.expenses.averageDaily,
                        trend: t("expenses.forPeriod"),
                        value: Math.round(filteredExpenseTotal / Math.max(daysInRange(selectedRange), 1))
                    }),
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: "green",
                        icon: "expenses",
                        label: t("expenses.topCategory"),
                        tooltip: tips.expenses.topCategory,
                        suffix: dominantCategory.name,
                        trend: `${formatMoney(dominantCategory.total)} (${dominantCategory.percent}%)`,
                        value: dominantCategory.total
                    }),
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: "yellow",
                        icon: "spark",
                        label: t("expenses.aiSignals"),
                        tooltip: tips.expenses.aiSignals,
                        trend: t("expenses.aiSignalsHint"),
                        value: expenseSignals.length
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("section", {
                className: "two-column",
                children: [
                    /*#__PURE__*/ _jsx(Panel, {
                        action: formatRangeLabel(selectedRange, lang),
                        titleTooltip: tips.expenses.averageDaily,
                        title: t("expenses.trendTitle"),
                        children: /*#__PURE__*/ _jsx(SimpleArea, {
                            color: "#3b82f6",
                            data: expenseTrend,
                            dataKey: "total",
                            xKey: "label"
                        })
                    }),
                    /*#__PURE__*/ _jsx(CategoryPanel, {
                        allAccounts: accounts,
                        allExpenses: filteredExpenses,
                        categories: filteredCategories,
                        title: t("dashboard.categories"),
                        titleTooltip: tips.analytics.expensesByCategory,
                        total: filteredExpenseTotal
                    })
                ]
            }),
            /*#__PURE__*/ _jsx(Panel, {
                actionNode: /*#__PURE__*/ _jsxs("div", {
                    className: "panel-header-actions",
                    children: [
                        /*#__PURE__*/ _jsxs("button", {
                            className: "secondary-button compact",
                            disabled: !rows.length,
                            onClick: exportExcel,
                            type: "button",
                            children: [
                                /*#__PURE__*/ _jsx(Icon, {
                                    name: "download"
                                }),
                                " Excel"
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("button", {
                            className: "secondary-button compact",
                            disabled: loading || !rows.length,
                            onClick: exportGoogleSheets,
                            type: "button",
                            children: [
                                /*#__PURE__*/ _jsx(Icon, {
                                    name: "spark"
                                }),
                                " Google Sheets"
                            ]
                        }),
                        /*#__PURE__*/ _jsx("button", {
                            className: "icon-button",
                            disabled: loading,
                            onClick: ()=>onOpenModal("expense"),
                            title: t("expenses.addTitle"),
                            type: "button",
                            children: /*#__PURE__*/ _jsx(Icon, {
                                name: "plus"
                            })
                        })
                    ]
                }),
                className: "transaction-list-panel",
                titleTooltip: tips.transactions.list,
                title: t("expenses.listTitle"),
                children: /*#__PURE__*/ _jsxs("div", {
                    className: "transaction-scroll-area",
                    ref: expenseScrollRef,
                    children: [
                        /*#__PURE__*/ _jsx(UnifiedTransactionTable, {
                            onDelete: onDeleteExpense,
                            onEdit: (expense)=>onOpenModal("expense", expense),
                            onSortChange: setExpenseSort,
                            rows: visibleExpenseRows,
                            sortState: expenseSort
                        }),
                        /*#__PURE__*/ _jsx("div", {
                            className: "transaction-load-state",
                            ref: expenseLoadMoreRef,
                            children: remainingRows > 0 ? /*#__PURE__*/ _jsxs("button", {
                                className: "secondary-button compact",
                                onClick: ()=>setVisibleRows((current)=>Math.min(current + 30, rows.length)),
                                type: "button",
                                children: [
                                    "Показати ще ",
                                    Math.min(30, remainingRows),
                                    " з ",
                                    remainingRows
                                ]
                            }) : rows.length ? /*#__PURE__*/ _jsx("span", {
                                children: t("expenses.allShown")
                            }) : /*#__PURE__*/ _jsx("span", {
                                children: t("expenses.emptyFilter")
                            })
                        })
                    ]
                })
            }),
            /*#__PURE__*/ _jsx(Panel, {
                titleTooltip: tips.expenses.aiSignals,
                title: t("expenses.aiSignalsTitle"),
                children: /*#__PURE__*/ _jsx(AlertList, {
                    rows: filteredExpenses
                })
            })
        ]
    });
}
function BudgetsPage({ budgets, budgetInsights, hasRealBudgets, monthExpense, onDeleteBudget, onOpenModal }) {
    const { t } = useI18n();
    const [budgetSort, setBudgetSort] = useState({
        direction: "desc",
        key: "spent"
    });
    const rows = useMemo(()=>sortBudgetRows(hasRealBudgets ? budgets : [], budgetSort), [
        budgetSort,
        budgets,
        hasRealBudgets
    ]);
    const budgetTotal = sum(rows.map((budget)=>budget.limit));
    const remaining = budgetTotal - monthExpense;
    const monthLabel = new Intl.DateTimeFormat("uk-UA", {
        month: "long",
        year: "numeric"
    }).format(new Date());
    const health = budgetInsights?.health ?? buildClientBudgetHealth(rows, budgetTotal, monthExpense);
    const chartRows = buildBudgetChartData(rows);
    const chartHeight = Math.max(280, chartRows.length * 54);
    const overBudgetItems = budgetInsights?.overBudget?.length ? budgetInsights.overBudget.map((item)=>`${item.category} — перевищення на ${formatMoney(item.amount)}`) : buildBudgetOverrunItems(rows);
    const recommendationItems = budgetInsights?.recommendations?.length ? budgetInsights.recommendations : buildBudgetRecommendationFallback(rows, budgetTotal, monthExpense);
    const recentActivityItems = budgetInsights?.recentActivity?.length ? budgetInsights.recentActivity : [
        t("budgets.noHistory")
    ];
    return /*#__PURE__*/ _jsxs(Page, {
        title: t("pages.budgets.title"),
        subtitle: t("pages.budgets.subtitle"),
        children: [
            /*#__PURE__*/ _jsxs("section", {
                className: "metric-grid",
                children: [
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: "green",
                        icon: "wallet",
                        label: t("budgets.monthlyBudget"),
                        trend: t("budgets.limitFor").replace("{month}", monthLabel),
                        value: budgetTotal
                    }),
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: "blue",
                        icon: "arrowDown",
                        label: t("budgets.spentNow"),
                        trend: budgetTotal > 0 ? `${Math.round(monthExpense / budgetTotal * 100)}% від бюджету` : t("budgets.notConfigured"),
                        value: monthExpense
                    }),
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: remaining >= 0 ? "red" : "orange",
                        icon: "wallet",
                        label: t("budgets.remaining"),
                        trend: budgetTotal > 0 ? `${Math.round(Math.max(remaining, 0) / budgetTotal * 100)}% від бюджету` : t("budgets.addBudget"),
                        value: remaining
                    }),
                    /*#__PURE__*/ _jsxs("article", {
                        className: "metric-card health-card",
                        children: [
                            /*#__PURE__*/ _jsx(Gauge, {
                                value: health.score
                            }),
                            /*#__PURE__*/ _jsxs("div", {
                                children: [
                                    /*#__PURE__*/ _jsx("span", {
                                        children: t("budgets.score")
                                    }),
                                    /*#__PURE__*/ _jsx("strong", {
                                        children: t(health.label)
                                    }),
                                    /*#__PURE__*/ _jsx("small", {
                                        children: t(health.message)
                                    })
                                ]
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("section", {
                className: "two-column",
                children: [
                    /*#__PURE__*/ _jsx(Panel, {
                        actionNode: /*#__PURE__*/ _jsx("button", {
                            "aria-label": t("budgets.createBudget"),
                            className: "icon-button",
                            onClick: ()=>onOpenModal("budget"),
                            type: "button",
                            children: /*#__PURE__*/ _jsx(Icon, {
                                name: "plus"
                            })
                        }),
                        title: t("budgets.byCategory"),
                        children: /*#__PURE__*/ _jsx(BudgetTable, {
                            onDelete: hasRealBudgets ? (budget)=>onDeleteBudget(budget.id, budget.name) : undefined,
                            onEdit: hasRealBudgets ? (budget)=>onOpenModal("budget", budget) : undefined,
                            onSortChange: setBudgetSort,
                            rows: rows,
                            sortState: budgetSort
                        })
                    }),
                    /*#__PURE__*/ _jsx(Panel, {
                        action: monthLabel,
                        title: t("budgets.vsActual"),
                        children: chartRows.length ? /*#__PURE__*/ _jsxs(_Fragment, {
                            children: [
                                /*#__PURE__*/ _jsx("div", {
                                    className: "chart-legend compact",
                                    children: /*#__PURE__*/ _jsx(Legend, {
                                        items: [
                                            [
                                                t("budgets.budget"),
                                                "#22c55e"
                                            ],
                                            [
                                                t("budgets.actual"),
                                                "#3b82f6"
                                            ]
                                        ]
                                    })
                                }),
                                /*#__PURE__*/ _jsx("div", {
                                    className: "budget-comparison-chart-scroll",
                                    children: /*#__PURE__*/ _jsx(ResponsiveContainer, {
                                        height: chartHeight,
                                        width: "100%",
                                        children: /*#__PURE__*/ _jsxs(BarChart, {
                                            barCategoryGap: "28%",
                                            data: chartRows,
                                            layout: "vertical",
                                            margin: {
                                                bottom: 8,
                                                left: 4,
                                                right: 12,
                                                top: 8
                                            },
                                            children: [
                                                /*#__PURE__*/ _jsx(CartesianGrid, {
                                                    horizontal: false,
                                                    stroke: "#edf1f6"
                                                }),
                                                /*#__PURE__*/ _jsx(XAxis, {
                                                    axisLine: false,
                                                    tickFormatter: (value)=>Number(value) >= 1000 ? `${Math.round(Number(value) / 100) / 10}K` : Number(value).toLocaleString("uk-UA"),
                                                    tickLine: false,
                                                    type: "number"
                                                }),
                                                /*#__PURE__*/ _jsx(YAxis, {
                                                    axisLine: false,
                                                    dataKey: "category",
                                                    tickLine: false,
                                                    type: "category",
                                                    width: 156
                                                }),
                                                /*#__PURE__*/ _jsx(Tooltip, {
                                                    formatter: (value, name)=>[
                                                            formatMoney(Number(value)),
                                                            name === "budget" ? t("budgets.budget") : t("budgets.actual")
                                                        ]
                                                }),
                                                /*#__PURE__*/ _jsx(Bar, {
                                                    dataKey: "budget",
                                                    fill: "#22c55e",
                                                    maxBarSize: 18,
                                                    radius: [
                                                        0,
                                                        4,
                                                        4,
                                                        0
                                                    ]
                                                }),
                                                /*#__PURE__*/ _jsx(Bar, {
                                                    dataKey: "expense",
                                                    fill: "#3b82f6",
                                                    maxBarSize: 18,
                                                    radius: [
                                                        0,
                                                        4,
                                                        4,
                                                        0
                                                    ]
                                                })
                                            ]
                                        })
                                    })
                                }),
                                chartRows.length > 7 ? /*#__PURE__*/ _jsx("p", {
                                    className: "chart-footnote",
                                    children: t("budgets.chartNote")
                                }) : null
                            ]
                        }) : /*#__PURE__*/ _jsx("p", {
                            className: "empty-note",
                            children: t("budgets.chartEmpty")
                        })
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("section", {
                className: "three-column",
                children: [
                    /*#__PURE__*/ _jsx(Panel, {
                        title: t("budgets.overBudget"),
                        children: /*#__PURE__*/ _jsx(CompactList, {
                            items: overBudgetItems.length ? overBudgetItems : [
                                t("budgets.allInLimits")
                            ]
                        })
                    }),
                    /*#__PURE__*/ _jsx(Panel, {
                        actionNode: /*#__PURE__*/ _jsx("span", {
                            className: "panel-badge",
                            children: budgetInsights?.aiGenerated ? t("budgets.ai") : t("budgets.data")
                        }),
                        title: t("budgets.recommendations"),
                        children: /*#__PURE__*/ _jsx(CompactList, {
                            items: recommendationItems
                        })
                    }),
                    /*#__PURE__*/ _jsx(Panel, {
                        title: t("budgets.recentActions"),
                        children: /*#__PURE__*/ _jsx(CompactList, {
                            items: recentActivityItems
                        })
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("p", {
                className: "tip",
                children: [
                    /*#__PURE__*/ _jsx(Icon, {
                        name: "help"
                    }),
                    t("budgets.insightNote")
                ]
            })
        ]
    });
}
function GoalsPage({ goalImageGeneratingId, goals, onGenerateImage, onOpenModal, savings }) {
    const { t } = useI18n();
    const hasGoals = goals.length > 0;
    const activeGoals = goals.filter((goal)=>goal.savedAmount < goal.targetAmount && String(goal.status || "ACTIVE").toUpperCase() !== "COMPLETED");
    const saved = sum(goals.map((goal)=>goal.savedAmount));
    const target = sum(goals.map((goal)=>goal.targetAmount));
    const contributionRows = buildGoalContributionRows(goals);
    const currentMonthContribution = sum(contributionRows.filter((item)=>isCurrentMonth(item.date)).map((item)=>item.amount));
    const previousMonthContribution = sum(contributionRows.filter((item)=>isPreviousMonth(item.date)).map((item)=>item.amount));
    const contributionDelta = buildDeltaPercent(currentMonthContribution, previousMonthContribution);
    const shareOfTargets = target > 0 ? Math.round(saved / target * 1000) / 10 : 0;
    const historyRows = buildGoalContributionHistory(goals);
    const nearestGoal = findNearestGoal(activeGoals);
    const nearestCompletionText = nearestGoal?.deadline ? formatMonthYear(nearestGoal.deadline) : "Без дедлайну";
    const nearestCompletionHint = nearestGoal ? `${nearestGoal.name} — ${goalTimeLeftLabel(nearestGoal)}` : "Додайте хоча б одну ціль із дедлайном";
    const goalRecommendations = buildGoalRecommendations({
        goals: activeGoals,
        monthlyContribution: currentMonthContribution,
        savings
    });
    const contributionTip = savings > 0 ? `За поточний місяць у вас є ${formatMoney(savings)} вільного залишку. Частину цієї суми можна зафіксувати як внесок у цілі.` : "Щойно з'явиться позитивний залишок місяця, його можна буде розподіляти між цілями як окремі внески.";
    return /*#__PURE__*/ _jsxs(Page, {
        title: t("pages.goals.title"),
        subtitle: t("pages.goals.subtitle"),
        children: [
            /*#__PURE__*/ _jsx("div", {
                className: "page-actions",
                children: /*#__PURE__*/ _jsxs("button", {
                    onClick: ()=>onOpenModal("goal"),
                    type: "button",
                    children: [
                        /*#__PURE__*/ _jsx(Icon, {
                            name: "plus"
                        }),
                        " ",
                        t("modal.goal")
                    ]
                })
            }),
            /*#__PURE__*/ _jsxs("section", {
                className: "metric-grid",
                children: [
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: "green",
                        icon: "goals",
                        label: t("goals.activeGoals"),
                        trend: activeGoals.length ? t("goals.activeCount").replace("{n}", activeGoals.length) : t("goals.noActive"),
                        value: activeGoals.length
                    }),
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: "green",
                        icon: "wallet",
                        label: t("goals.savedToGoals"),
                        trend: target > 0 ? t("goals.ofTotalTargets").replace("{pct}", shareOfTargets) : t("goals.addGoalsFirst"),
                        value: saved
                    }),
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: "blue",
                        icon: "arrowUp",
                        label: t("goals.monthlyContribution"),
                        trend: formatSignedPercent(contributionDelta),
                        value: currentMonthContribution
                    }),
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: "red",
                        icon: "calendar",
                        label: t("goals.nearestCompletion"),
                        suffix: nearestCompletionText,
                        trend: nearestCompletionHint,
                        value: 0
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("section", {
                className: hasGoals ? "two-column goals-layout" : "goals-layout-empty",
                children: [
                    /*#__PURE__*/ _jsxs(Panel, {
                        className: hasGoals ? "" : "goals-empty-main",
                        title: t("goals.yourGoals"),
                        children: [
                            hasGoals ? /*#__PURE__*/ _jsx("div", {
                                className: "goal-card-grid",
                                children: goals.map((goal)=>/*#__PURE__*/ _jsx(GoalCard, {
                                        generatingImage: goalImageGeneratingId === goal.id,
                                        goal: goal,
                                        onContribute: (item)=>onOpenModal("goalContribution", item),
                                        onDetails: (item)=>onOpenModal("goal", item),
                                        onEdit: (item)=>onOpenModal("goal", item),
                                        onGenerateImage: onGenerateImage
                                    }, goal.id))
                            }) : /*#__PURE__*/ _jsxs("div", {
                                className: "goals-empty-state",
                                children: [
                                    /*#__PURE__*/ _jsxs("div", {
                                        className: "goals-empty-hero",
                                        children: [
                                            /*#__PURE__*/ _jsxs("div", {
                                                children: [
                                                    /*#__PURE__*/ _jsx("strong", {
                                                        children: "Почніть з першої цілі і прив’яжіть її до реальних грошей"
                                                    }),
                                                    /*#__PURE__*/ _jsx("p", {
                                                        children: "У FinTrack ціль росте не від прогнозів і не від абстрактної економії, а від реальних внесків. Ви створюєте ціль, а потім окремо фіксуєте кожне поповнення."
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ _jsxs("button", {
                                                onClick: ()=>onOpenModal("goal"),
                                                type: "button",
                                                children: [
                                                    /*#__PURE__*/ _jsx(Icon, {
                                                        name: "plus"
                                                    }),
                                                    " Додати першу ціль"
                                                ]
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ _jsxs("div", {
                                        className: "goals-empty-steps",
                                        children: [
                                            /*#__PURE__*/ _jsxs("div", {
                                                className: "goal-empty-step",
                                                children: [
                                                    /*#__PURE__*/ _jsx("span", {
                                                        children: "1"
                                                    }),
                                                    /*#__PURE__*/ _jsxs("div", {
                                                        children: [
                                                            /*#__PURE__*/ _jsx("strong", {
                                                                children: t("goals.howStep1Title")
                                                            }),
                                                            /*#__PURE__*/ _jsx("small", {
                                                                children: t("goals.howStep1")
                                                            })
                                                        ]
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ _jsxs("div", {
                                                className: "goal-empty-step",
                                                children: [
                                                    /*#__PURE__*/ _jsx("span", {
                                                        children: "2"
                                                    }),
                                                    /*#__PURE__*/ _jsxs("div", {
                                                        children: [
                                                            /*#__PURE__*/ _jsx("strong", {
                                                                children: t("goals.howStep2Title")
                                                            }),
                                                            /*#__PURE__*/ _jsx("small", {
                                                                children: "Це може бути частина зарплати, окремий переказ на savings-рахунок, кешбек або інший дохід, який ви дійсно відокремили."
                                                            })
                                                        ]
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ _jsxs("div", {
                                                className: "goal-empty-step",
                                                children: [
                                                    /*#__PURE__*/ _jsx("span", {
                                                        children: "3"
                                                    }),
                                                    /*#__PURE__*/ _jsxs("div", {
                                                        children: [
                                                            /*#__PURE__*/ _jsx("strong", {
                                                                children: t("goals.howStep3Title")
                                                            }),
                                                            /*#__PURE__*/ _jsx("small", {
                                                                children: "Саме кнопка “Поповнити” формує історію накопичення, прогрес і прогноз завершення."
                                                            })
                                                        ]
                                                    })
                                                ]
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ _jsxs("div", {
                                        className: "goal-principles",
                                        children: [
                                            /*#__PURE__*/ _jsxs("div", {
                                                className: "goal-principle-card",
                                                children: [
                                                    /*#__PURE__*/ _jsx("strong", {
                                                        children: t("goals.howStep4Title")
                                                    }),
                                                    /*#__PURE__*/ _jsx("small", {
                                                        children: "Тільки гроші, які ви реально відклали: переказали на окремий рахунок, залишили готівкою під ціль або свідомо зарезервували під неї."
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ _jsxs("div", {
                                                className: "goal-principle-card",
                                                children: [
                                                    /*#__PURE__*/ _jsx("strong", {
                                                        children: t("goals.howStep5Title")
                                                    }),
                                                    /*#__PURE__*/ _jsx("small", {
                                                        children: contributionTip
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ _jsxs("div", {
                                                className: "goal-principle-card",
                                                children: [
                                                    /*#__PURE__*/ _jsx("strong", {
                                                        children: "Навіщо дедлайн"
                                                    }),
                                                    /*#__PURE__*/ _jsx("small", {
                                                        children: "Дедлайн не обов’язковий, але він допомагає порахувати реальний темп накопичення і не розтягувати ціль на невизначений час."
                                                    })
                                                ]
                                            })
                                        ]
                                    }),
                                    null
                                ]
                            }),
                            /*#__PURE__*/ _jsxs("div", {
                                className: "automation-tip",
                                children: [
                                    /*#__PURE__*/ _jsx(Icon, {
                                        name: "spark"
                                    }),
                                    /*#__PURE__*/ _jsxs("div", {
                                        children: [
                                            /*#__PURE__*/ _jsx("strong", {
                                                children: t("goals.howToLink")
                                            }),
                                            /*#__PURE__*/ _jsx("small", {
                                                children: contributionTip
                                            })
                                        ]
                                    }),
                                    nearestGoal ? /*#__PURE__*/ _jsxs("button", {
                                        className: "secondary-button",
                                        onClick: ()=>onOpenModal("goalContribution", nearestGoal),
                                        type: "button",
                                        children: [
                                            t("goals.topUpNearest"),
                                            /*#__PURE__*/ _jsx(Icon, {
                                                name: "chevronRight"
                                            })
                                        ]
                                    }) : null
                                ]
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        className: "right-stack goals-side-stack",
                        children: hasGoals ? [
                            /*#__PURE__*/ _jsx(CategoryPanel, {
                                categories: goalsToCategories(goals),
                                title: t("goals.distribution"),
                                total: saved
                            }, "goals-distribution"),
                            /*#__PURE__*/ _jsx(Panel, {
                                action: "6 місяців",
                                title: t("goals.contributionHistory"),
                                children: historyRows.length ? /*#__PURE__*/ _jsx(ResponsiveContainer, {
                                    height: 190,
                                    width: "100%",
                                    children: /*#__PURE__*/ _jsxs(BarChart, {
                                        data: historyRows,
                                        children: [
                                            /*#__PURE__*/ _jsx(CartesianGrid, {
                                                stroke: "#edf1f6",
                                                vertical: false
                                            }),
                                            /*#__PURE__*/ _jsx(XAxis, {
                                                axisLine: false,
                                                dataKey: "label",
                                                tickLine: false
                                            }),
                                            /*#__PURE__*/ _jsx(YAxis, {
                                                axisLine: false,
                                                tickFormatter: (value)=>`${Number(value) / 1000}K`,
                                                tickLine: false
                                            }),
                                            /*#__PURE__*/ _jsx(Bar, {
                                                dataKey: "amount",
                                                fill: "#22c55e",
                                                radius: [
                                                    3,
                                                    3,
                                                    0,
                                                    0
                                                ]
                                            })
                                        ]
                                    })
                                }) : /*#__PURE__*/ _jsx("p", {
                                    className: "empty-note",
                                    children: t("goals.noContributions")
                                })
                            }, "goals-history"),
                            /*#__PURE__*/ _jsx(Panel, {
                                title: t("goals.nearestCompletion2"),
                                children: /*#__PURE__*/ _jsx(CompactList, {
                                    items: buildGoalDeadlineItems(activeGoals)
                                })
                            }, "goals-nearest")
                        ] : [
                            /*#__PURE__*/ _jsx(Panel, {
                                title: t("goals.howItWorks"),
                                children: /*#__PURE__*/ _jsx(CompactList, {
                                    items: [
                                        t("goals.howRule1"),
                                        t("goals.howRule2"),
                                        t("goals.howRule3")
                                    ]
                                })
                            }, "goals-empty-how"),
                            /*#__PURE__*/ _jsx(Panel, {
                                title: t("goals.whenToTopUp"),
                                children: /*#__PURE__*/ _jsx(CompactList, {
                                    items: [
                                        t("goals.whenRule1"),
                                        t("goals.whenRule2"),
                                        t("goals.whenRule3")
                                    ]
                                })
                            }, "goals-empty-when")
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("section", {
                className: hasGoals ? "three-column" : "goal-empty-footer",
                children: [
                    goalRecommendations.map((item, index)=>/*#__PURE__*/ _jsx(Idea, {
                            icon: index === 0 ? "piggy" : index === 1 ? "chart" : "goals",
                            text: item.text,
                            title: item.title
                        }, item.title))
                ]
            })
        ]
    });
}
function LiabilitiesPage({ liabilities, liabilityPayments, loading, onDeleteLiability, onOpenModal, overview }) {
    const { t } = useI18n();
    const tooltips = useIndicatorTooltips();
    const liabilityTooltips = tooltips.liabilities || {};
    const activeLiabilities = liabilities.filter((lib)=>lib.status === "ACTIVE" || lib.status === "PAUSED");
    const totalDebt = overview?.liabilityTotal ?? activeLiabilities.reduce((sum, lib)=>sum + Number(lib.currentBalance || 0), 0);
    const activeCount = overview?.activeLiabilityCount ?? activeLiabilities.length;
    const minimumTotal = overview?.liabilityMinimumTotal ?? activeLiabilities.reduce((sum, lib)=>sum + Number(lib.minimumPayment || 0), 0);
    const dueSoonCount = overview?.liabilityDueSoonCount ?? 0;
    const predictClose = (balance, monthly) => {
        const b = Number(balance);
        const m = Number(monthly);
        if (!m || m <= 0 || b <= 0) return null;
        const months = Math.ceil(b / m);
        const d = new Date();
        d.setMonth(d.getMonth() + months);
        return d;
    };
    const allCloseDate = minimumTotal > 0 ? predictClose(totalDebt, minimumTotal) : null;
    const kindLabel = (kind)=>t(`liabilities.kind.${kind}`) || kind;
    const statusLabel = (status)=>t(`liabilities.status.${status}`) || status;
    const statusAccent = (status)=>{
        if (status === "PAID") return "paid";
        if (status === "PAUSED") return "paused";
        if (status === "ARCHIVED") return "archived";
        return "active";
    };
    return /*#__PURE__*/ _jsxs(Page, {
        subtitle: t("pages.liabilities.subtitle"),
        title: t("pages.liabilities.title"),
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: "metrics-grid",
                children: [
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: totalDebt > 0 ? "red" : "neutral",
                        icon: "creditCard",
                        label: t("liabilities.totalDebt"),
                        suffix: formatMoney(totalDebt),
                        tooltip: liabilityTooltips.totalDebt,
                        trend: t("liabilities.balance"),
                        value: totalDebt
                    }),
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: activeCount > 0 ? "amber" : "neutral",
                        icon: "briefcase",
                        label: t("liabilities.activeCount"),
                        suffix: String(activeCount),
                        tooltip: liabilityTooltips.activeCount,
                        trend: activeCount > 0 ? t("liabilities.activeHint").replace("{n}", String(activeCount)) : t("liabilities.noActive"),
                        value: activeCount
                    }),
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: minimumTotal > 0 ? "amber" : "neutral",
                        icon: "calendar",
                        label: t("liabilities.minPayment"),
                        suffix: minimumTotal > 0 ? formatMoney(minimumTotal) : "—",
                        tooltip: liabilityTooltips.minimumPayment,
                        trend: t("liabilities.minPaymentHint"),
                        value: minimumTotal
                    }),
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: dueSoonCount > 0 ? "red" : "neutral",
                        icon: "bell",
                        label: t("liabilities.dueSoon"),
                        suffix: dueSoonCount > 0 ? String(dueSoonCount) : "0",
                        tooltip: liabilityTooltips.dueSoon,
                        trend: dueSoonCount > 0 ? t("liabilities.dueSoonHint").replace("{n}", String(dueSoonCount)) : t("liabilities.noDueSoon"),
                        value: dueSoonCount
                    }),
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: allCloseDate ? "blue" : "neutral",
                        icon: "calendar",
                        label: t("liabilities.predictedClose"),
                        suffix: allCloseDate ? formatDate(allCloseDate.toISOString()) : "—",
                        tooltip: t("liabilities.predictedCloseHint"),
                        trend: allCloseDate ? t("liabilities.predictedCloseHint") : t("liabilities.cannotPredict"),
                        value: 0
                    })
                ]
            }),
            /*#__PURE__*/ _jsx(Panel, {
                actionNode: /*#__PURE__*/ _jsxs("button", {
                    className: "icon-button",
                    onClick: ()=>onOpenModal("liability"),
                    type: "button",
                    title: t("liabilities.addFirst"),
                    children: [
                        /*#__PURE__*/ _jsx(Icon, { name: "plus" })
                    ]
                }),
                title: t("liabilities.yourObligations"),
                children: liabilities.length === 0 ? /*#__PURE__*/ _jsxs("div", {
                    className: "goals-empty-state",
                    children: [
                        /*#__PURE__*/ _jsxs("div", {
                            className: "goals-empty-hero",
                            children: [
                                /*#__PURE__*/ _jsxs("div", {
                                    children: [
                                        /*#__PURE__*/ _jsx("strong", { children: t("liabilities.noItems") }),
                                        /*#__PURE__*/ _jsx("p", { children: t("liabilities.emptyHint") })
                                    ]
                                }),
                                /*#__PURE__*/ _jsxs("button", {
                                    onClick: ()=>onOpenModal("liability"),
                                    type: "button",
                                    children: [
                                        /*#__PURE__*/ _jsx(Icon, { name: "plus" }),
                                        " ",
                                        t("liabilities.addFirst")
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "goals-empty-steps",
                            children: [
                                /*#__PURE__*/ _jsxs("div", {
                                    className: "goal-empty-step",
                                    children: [
                                        /*#__PURE__*/ _jsx("span", { children: "1" }),
                                        /*#__PURE__*/ _jsxs("div", {
                                            children: [
                                                /*#__PURE__*/ _jsx("strong", { children: t("liabilities.howStep1Title") }),
                                                /*#__PURE__*/ _jsx("small", { children: t("liabilities.howStep1") })
                                            ]
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ _jsxs("div", {
                                    className: "goal-empty-step",
                                    children: [
                                        /*#__PURE__*/ _jsx("span", { children: "2" }),
                                        /*#__PURE__*/ _jsxs("div", {
                                            children: [
                                                /*#__PURE__*/ _jsx("strong", { children: t("liabilities.howStep2Title") }),
                                                /*#__PURE__*/ _jsx("small", { children: t("liabilities.howStep2") })
                                            ]
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ _jsxs("div", {
                                    className: "goal-empty-step",
                                    children: [
                                        /*#__PURE__*/ _jsx("span", { children: "3" }),
                                        /*#__PURE__*/ _jsxs("div", {
                                            children: [
                                                /*#__PURE__*/ _jsx("strong", { children: t("liabilities.howStep3Title") }),
                                                /*#__PURE__*/ _jsx("small", { children: t("liabilities.howStep3") })
                                            ]
                                        })
                                    ]
                                })
                            ]
                        })
                    ]
                }) : /*#__PURE__*/ _jsx("div", {
                    className: "liability-list",
                    children: liabilities.map((lib)=>/*#__PURE__*/ _jsxs("div", {
                            className: "liability-row",
                            children: [
                                /*#__PURE__*/ _jsxs("div", {
                                    className: "liability-row-top",
                                    children: [
                                        /*#__PURE__*/ _jsxs("div", {
                                            className: "liability-row-name",
                                            children: [
                                                /*#__PURE__*/ _jsx(Icon, { name: "creditCard" }),
                                                /*#__PURE__*/ _jsxs("div", {
                                                    children: [
                                                        /*#__PURE__*/ _jsx("strong", { children: lib.name }),
                                                        /*#__PURE__*/ _jsxs("small", {
                                                            children: [
                                                                kindLabel(lib.kind),
                                                                lib.creditor ? ` · ${lib.creditor}` : ""
                                                            ]
                                                        })
                                                    ]
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ _jsxs("div", {
                                            className: "liability-row-meta",
                                            children: [
                                                /*#__PURE__*/ _jsx("span", {
                                                    className: `status-pill status-pill--${statusAccent(lib.status)}`,
                                                    children: statusLabel(lib.status)
                                                }),
                                                lib.status !== "PAID" && lib.status !== "ARCHIVED" ? /*#__PURE__*/ _jsxs("button", {
                                                    className: "icon-button",
                                                    onClick: ()=>onOpenModal("liabilityPayment", lib),
                                                    title: t("liabilities.addPayment"),
                                                    type: "button",
                                                    children: [
                                                        /*#__PURE__*/ _jsx(Icon, { name: "plus" })
                                                    ]
                                                }) : null,
                                                /*#__PURE__*/ _jsx("button", {
                                                    className: "icon-button",
                                                    onClick: ()=>onOpenModal("liability", lib),
                                                    title: "Edit",
                                                    type: "button",
                                                    children: /*#__PURE__*/ _jsx(Icon, { name: "edit" })
                                                }),
                                                /*#__PURE__*/ _jsx("button", {
                                                    className: "icon-button icon-button--danger",
                                                    onClick: ()=>onDeleteLiability(lib.id, lib.name),
                                                    title: "Delete",
                                                    type: "button",
                                                    children: /*#__PURE__*/ _jsx(Icon, { name: "trash" })
                                                })
                                            ]
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ _jsxs("div", {
                                    className: "liability-row-amounts",
                                    children: [
                                        /*#__PURE__*/ _jsxs("div", {
                                            className: "liability-amount-cell",
                                            children: [
                                                /*#__PURE__*/ _jsx("small", { children: t("liabilities.balance") }),
                                                /*#__PURE__*/ _jsx("strong", { className: "amount-negative", children: formatMoney(Number(lib.currentBalance)) })
                                            ]
                                        }),
                                        /*#__PURE__*/ _jsxs("div", {
                                            className: "liability-amount-cell",
                                            children: [
                                                /*#__PURE__*/ _jsx("small", { children: t("liabilities.originalAmount") }),
                                                /*#__PURE__*/ _jsx("strong", { children: formatMoney(Number(lib.originalAmount)) })
                                            ]
                                        }),
                                        Number(lib.minimumPayment) > 0 ? /*#__PURE__*/ _jsxs("div", {
                                            className: "liability-amount-cell",
                                            children: [
                                                /*#__PURE__*/ _jsx("small", { children: t("liabilities.minimumPayment") }),
                                                /*#__PURE__*/ _jsx("strong", { children: formatMoney(Number(lib.minimumPayment)) })
                                            ]
                                        }) : null
                                    ]
                                }),
                                /*#__PURE__*/ _jsxs("div", {
                                    className: "progress-with-value",
                                    children: [
                                        /*#__PURE__*/ _jsxs("div", {
                                            className: "progress-with-value-labels",
                                            children: [
                                                /*#__PURE__*/ _jsx("span", { children: t("liabilities.percentPaid").replace("{n}", String(lib.percentPaid ?? 0)) }),
                                                /*#__PURE__*/ _jsx("span", {
                                                    children: lib.interestRate ? t("liabilities.interest").replace("{rate}", String(lib.interestRate)) : t("liabilities.noInterest")
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ _jsx("div", {
                                            className: "progress",
                                            children: /*#__PURE__*/ _jsx("span", {
                                                style: { width: `${Math.min(100, lib.percentPaid ?? 0)}%`, background: lib.status === "PAID" ? "var(--green)" : "var(--blue)" }
                                            })
                                        }),
                                        /*#__PURE__*/ _jsxs("div", {
                                            className: "progress-with-value-labels",
                                            children: [
                                                lib.paymentDay ? /*#__PURE__*/ _jsx("span", { children: t("liabilities.paymentDay").replace("{day}", String(lib.paymentDay)) }) : /*#__PURE__*/ _jsx("span", { children: "" }),
                                                lib.status !== "PAID" && Number(lib.minimumPayment) > 0 && predictClose(lib.currentBalance, lib.minimumPayment) ? /*#__PURE__*/ _jsx("span", { children: t("liabilities.predictedCloseRow").replace("{date}", formatDate(predictClose(lib.currentBalance, lib.minimumPayment).toISOString())) }) : lib.targetCloseDate ? /*#__PURE__*/ _jsx("span", { children: t("liabilities.targetClose").replace("{date}", formatDate(lib.targetCloseDate)) }) : /*#__PURE__*/ _jsx("span", { children: "" })
                                            ]
                                        })
                                    ]
                                })
                            ]
                        }, lib.id))
                })
            }),
            liabilityPayments.length > 0 ? /*#__PURE__*/ _jsx(Panel, {
                title: t("liabilities.paymentHistory"),
                children: /*#__PURE__*/ _jsxs("table", {
                    className: "data-table",
                    children: [
                        /*#__PURE__*/ _jsx("thead", {
                            children: /*#__PURE__*/ _jsxs("tr", {
                                children: [
                                    /*#__PURE__*/ _jsx("th", { children: t("table.date") }),
                                    /*#__PURE__*/ _jsx("th", { children: t("liabilities.yourObligations") }),
                                    /*#__PURE__*/ _jsx("th", { children: t("form.comment") }),
                                    /*#__PURE__*/ _jsx("th", { className: "col-right", children: t("table.amount") })
                                ]
                            })
                        }),
                        /*#__PURE__*/ _jsx("tbody", {
                            children: liabilityPayments.slice(0, 20).map((payment)=>/*#__PURE__*/ _jsxs("tr", {
                                    children: [
                                        /*#__PURE__*/ _jsx("td", { children: payment.date ? formatDate(payment.date) : "—" }),
                                        /*#__PURE__*/ _jsx("td", { children: payment.liabilityName || "—" }),
                                        /*#__PURE__*/ _jsx("td", { children: payment.note || "—" }),
                                        /*#__PURE__*/ _jsx("td", {
                                            className: "col-right amount-positive",
                                            children: formatMoney(Number(payment.amount))
                                        })
                                    ]
                                }, payment.id))
                        })
                    ]
                })
            }) : null
        ]
    });
}
function LoansPage({ loans, loading, onDeleteLoan, onOpenModal, overview }) {
    const { t } = useI18n();
    const tooltips = useIndicatorTooltips();
    const loanTooltips = tooltips.loans || {};
    const activeLoans = loans.filter((loan)=>loan.status === "ACTIVE");
    const totalLoaned = activeLoans.reduce((sum, loan)=>sum + Number(loan.amount || 0), 0);
    const activeCount = activeLoans.length;
    const overdueLoans = activeLoans.filter((loan)=>{
        if (!loan.plannedReturnDate) return false;
        return new Date(loan.plannedReturnDate) < new Date();
    });
    const overdueCount = overdueLoans.length;
    const dueNextCount = activeLoans.filter((loan)=>{
        if (!loan.plannedReturnDate) return false;
        const dueDate = new Date(loan.plannedReturnDate);
        const today = new Date();
        const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        return dueDate >= today && dueDate <= sevenDaysFromNow;
    }).length;
    const statusLabel = (status)=>t(`loans.status.${status}`) || status;
    const statusAccent = (status)=>{
        if (status === "RETURNED") return "paid";
        if (status === "OVERDUE") return "overdue";
        if (status === "CANCELLED") return "archived";
        return "active";
    };
    const isOverdue = (loan)=>loan.status === "ACTIVE" && loan.plannedReturnDate && new Date(loan.plannedReturnDate) < new Date();
    return /*#__PURE__*/ _jsxs(Page, {
        subtitle: t("pages.loans.subtitle"),
        title: t("pages.loans.title"),
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: "metrics-grid",
                children: [
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: totalLoaned > 0 ? "blue" : "neutral",
                        icon: "wallet",
                        label: t("loans.totalLoaned"),
                        suffix: formatMoney(totalLoaned),
                        tooltip: loanTooltips.totalLoaned,
                        trend: t("loans.toOthers"),
                        value: totalLoaned
                    }),
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: activeCount > 0 ? "amber" : "neutral",
                        icon: "user",
                        label: t("loans.activeCount"),
                        suffix: String(activeCount),
                        tooltip: loanTooltips.activeCount,
                        trend: activeCount > 0 ? t("loans.activeHint").replace("{n}", String(activeCount)) : t("loans.noActive"),
                        value: activeCount
                    }),
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: overdueCount > 0 ? "red" : "neutral",
                        icon: "bell",
                        label: t("loans.overdue"),
                        suffix: overdueCount > 0 ? String(overdueCount) : "0",
                        tooltip: loanTooltips.overdue,
                        trend: overdueCount > 0 ? t("loans.overdueHint").replace("{n}", String(overdueCount)) : t("loans.noOverdue"),
                        value: overdueCount
                    }),
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: dueNextCount > 0 ? "orange" : "neutral",
                        icon: "calendar",
                        label: t("loans.dueNext"),
                        suffix: dueNextCount > 0 ? String(dueNextCount) : "0",
                        tooltip: loanTooltips.dueNext,
                        trend: dueNextCount > 0 ? t("loans.dueNextHint").replace("{n}", String(dueNextCount)) : t("loans.noDueNext"),
                        value: dueNextCount
                    })
                ]
            }),
            /*#__PURE__*/ _jsx(Panel, {
                actionNode: /*#__PURE__*/ _jsxs("button", {
                    className: "icon-button",
                    onClick: ()=>onOpenModal("loan"),
                    type: "button",
                    title: t("loans.addNew"),
                    children: [
                        /*#__PURE__*/ _jsx(Icon, { name: "plus" })
                    ]
                }),
                title: t("loans.yourLoans"),
                children: loans.length === 0 ? /*#__PURE__*/ _jsxs("div", {
                    className: "goals-empty-state",
                    children: [
                        /*#__PURE__*/ _jsxs("div", {
                            className: "goals-empty-hero",
                            children: [
                                /*#__PURE__*/ _jsxs("div", {
                                    children: [
                                        /*#__PURE__*/ _jsx("strong", { children: t("loans.noItems") }),
                                        /*#__PURE__*/ _jsx("p", { children: t("loans.emptyHint") })
                                    ]
                                }),
                                /*#__PURE__*/ _jsxs("button", {
                                    onClick: ()=>onOpenModal("loan"),
                                    type: "button",
                                    children: [
                                        /*#__PURE__*/ _jsx(Icon, { name: "plus" }),
                                        " ",
                                        t("loans.addNew")
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "goals-empty-steps",
                            children: [
                                /*#__PURE__*/ _jsxs("div", {
                                    className: "goal-empty-step",
                                    children: [
                                        /*#__PURE__*/ _jsx("span", { children: "1" }),
                                        /*#__PURE__*/ _jsxs("div", {
                                            children: [
                                                /*#__PURE__*/ _jsx("strong", { children: t("loans.howStep1Title") }),
                                                /*#__PURE__*/ _jsx("small", { children: t("loans.howStep1") })
                                            ]
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ _jsxs("div", {
                                    className: "goal-empty-step",
                                    children: [
                                        /*#__PURE__*/ _jsx("span", { children: "2" }),
                                        /*#__PURE__*/ _jsxs("div", {
                                            children: [
                                                /*#__PURE__*/ _jsx("strong", { children: t("loans.howStep2Title") }),
                                                /*#__PURE__*/ _jsx("small", { children: t("loans.howStep2") })
                                            ]
                                        })
                                    ]
                                })
                            ]
                        })
                    ]
                }) : /*#__PURE__*/ _jsx("div", {
                    className: "loan-list",
                    children: loans.map((loan)=>/*#__PURE__*/ _jsxs("div", {
                            className: `loan-row${isOverdue(loan) ? " loan-row--overdue" : ""}`,
                            children: [
                                /*#__PURE__*/ _jsxs("div", {
                                    className: "loan-row-top",
                                    children: [
                                        /*#__PURE__*/ _jsxs("div", {
                                            className: "loan-row-name",
                                            children: [
                                                /*#__PURE__*/ _jsx(Icon, { name: "wallet" }),
                                                /*#__PURE__*/ _jsxs("div", {
                                                    children: [
                                                        /*#__PURE__*/ _jsx("strong", { children: loan.recipientName }),
                                                        /*#__PURE__*/ _jsx("small", {
                                                            children: loan.description || "—"
                                                        })
                                                    ]
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ _jsxs("div", {
                                            className: "loan-row-meta",
                                            children: [
                                                /*#__PURE__*/ _jsx("span", {
                                                    className: `status-pill status-pill--${statusAccent(loan.status)}`,
                                                    children: statusLabel(loan.status)
                                                }),
                                                /*#__PURE__*/ _jsx("button", {
                                                    className: "icon-button",
                                                    onClick: ()=>onOpenModal("loan", loan),
                                                    title: "Edit",
                                                    type: "button",
                                                    children: /*#__PURE__*/ _jsx(Icon, { name: "edit" })
                                                }),
                                                /*#__PURE__*/ _jsx("button", {
                                                    className: "icon-button icon-button--danger",
                                                    onClick: ()=>onDeleteLoan(loan.id, loan.recipientName),
                                                    title: "Delete",
                                                    type: "button",
                                                    children: /*#__PURE__*/ _jsx(Icon, { name: "trash" })
                                                })
                                            ]
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ _jsxs("div", {
                                    className: "loan-row-amounts",
                                    children: [
                                        /*#__PURE__*/ _jsxs("div", {
                                            className: "loan-amount-cell",
                                            children: [
                                                /*#__PURE__*/ _jsx("small", { children: t("loans.amount") }),
                                                /*#__PURE__*/ _jsx("strong", { className: "amount-positive", children: formatMoney(Number(loan.amount)) })
                                            ]
                                        }),
                                        /*#__PURE__*/ _jsxs("div", {
                                            className: "loan-amount-cell",
                                            children: [
                                                /*#__PURE__*/ _jsx("small", { children: t("loans.dateLent") }),
                                                /*#__PURE__*/ _jsx("strong", { children: loan.dateLent ? formatDate(loan.dateLent) : "—" })
                                            ]
                                        }),
                                        /*#__PURE__*/ _jsxs("div", {
                                            className: "loan-amount-cell",
                                            children: [
                                                /*#__PURE__*/ _jsx("small", { children: t("loans.plannedReturn") }),
                                                /*#__PURE__*/ _jsx("strong", { className: isOverdue(loan) ? "amount-negative" : "", children: loan.plannedReturnDate ? formatDate(loan.plannedReturnDate) : "—" })
                                            ]
                                        }),
                                        loan.actualReturnDate ? /*#__PURE__*/ _jsxs("div", {
                                            className: "loan-amount-cell",
                                            children: [
                                                /*#__PURE__*/ _jsx("small", { children: t("loans.actualReturn") }),
                                                /*#__PURE__*/ _jsx("strong", { className: "amount-positive", children: formatDate(loan.actualReturnDate) })
                                            ]
                                        }) : null
                                    ]
                                })
                            ]
                        }, loan.id))
                })
            })
        ]
    });
}
function AnalyticsPage({ accounts, categories, expenses, goals, incomes, tags = [] }) {
    const { lang, t } = useI18n();
    const actualIncomes = useMemo(()=>incomes.filter((income)=>isActualIncomeStatus(income.status)), [
        incomes
    ]);
    const defaultRange = useMemo(() => latestRangeFromRows([
            ...expenses,
            ...actualIncomes
        ]), [
        actualIncomes,
        expenses,
    ]);
    const [selectedRange, setSelectedRange] = useState(defaultRange);
    const [selectedAccount, setSelectedAccount] = useState("all");
    const [selectedTag, setSelectedTag] = useState("all");
    const selectedRangeKey = dateRangeKey(selectedRange);
    const defaultRangeKey = dateRangeKey(defaultRange);
    const previousRange = useMemo(() => previousRangeFromRange(selectedRange), [
        selectedRangeKey
    ]);
    const previousRangeKey = dateRangeKey(previousRange);
    const accountOptions = useMemo(() => [
            {
                label: t("filters.allAccounts"),
                value: "all"
            },
            ...accounts.map((account) => ({
                    label: account.name,
                    value: account.id
                }))
        ], [
        accounts
    ]);
    const tagOptions = useMemo(() => {
        const tagNames = Array.from(new Set([
            ...tags.map((tag)=>tag.name),
            ...expenses.flatMap((expense)=>expense.tags ?? []),
            ...actualIncomes.flatMap((income)=>income.tags ?? [])
        ].filter(Boolean))).sort((left, right)=>left.localeCompare(right, "uk-UA"));
        return [
            {
                label: tagNames.length ? t("filters.allTags") : t("filters.noTags"),
                value: "all"
            },
            ...tagNames.map((tag)=>({
                    label: tag,
                    value: tag
                }))
        ];
    }, [
        tags,
        expenses,
        actualIncomes,
        t
    ]);
    const selectedAccountRecord = useMemo(() => accounts.find((account)=>account.id === selectedAccount || account.name === selectedAccount), [
        accounts,
        selectedAccount
    ]);
    const periodExpenses = useMemo(() => expenses.filter((expense)=>{
            const matchesPeriod = matchesDateRange(expense.date, selectedRange);
            const rowAccount = expense.accountId ?? expense.account ?? "";
            const matchesAccount = selectedAccount === "all" || rowAccount === selectedAccount || expense.account === selectedAccountRecord?.name;
            const matchesTag = selectedTag === "all" || (expense.tags ?? []).includes(selectedTag);
            return matchesPeriod && matchesAccount && matchesTag;
        }), [
        expenses,
        selectedAccount,
        selectedAccountRecord,
        selectedRangeKey,
        selectedTag
    ]);
    const periodIncomes = useMemo(() => actualIncomes.filter((income)=>{
            const matchesPeriod = matchesDateRange(income.date, selectedRange);
            const rowAccount = income.accountId ?? income.account ?? "";
            const matchesAccount = selectedAccount === "all" || rowAccount === selectedAccount || income.account === selectedAccountRecord?.name;
            const matchesTag = selectedTag === "all" || (income.tags ?? []).includes(selectedTag);
            return matchesPeriod && matchesAccount && matchesTag;
        }), [
        actualIncomes,
        selectedAccount,
        selectedAccountRecord,
        selectedRangeKey,
        selectedTag
    ]);
    const previousExpenses = useMemo(() => expenses.filter((expense)=>{
            const matchesPeriod = matchesDateRange(expense.date, previousRange);
            const rowAccount = expense.accountId ?? expense.account ?? "";
            const matchesAccount = selectedAccount === "all" || rowAccount === selectedAccount || expense.account === selectedAccountRecord?.name;
            const matchesTag = selectedTag === "all" || (expense.tags ?? []).includes(selectedTag);
            return matchesPeriod && matchesAccount && matchesTag;
        }), [
        expenses,
        previousRangeKey,
        selectedAccount,
        selectedAccountRecord,
        selectedTag
    ]);
    const previousIncomes = useMemo(() => actualIncomes.filter((income)=>{
            const matchesPeriod = matchesDateRange(income.date, previousRange);
            const rowAccount = income.accountId ?? income.account ?? "";
            const matchesAccount = selectedAccount === "all" || rowAccount === selectedAccount || income.account === selectedAccountRecord?.name;
            const matchesTag = selectedTag === "all" || (income.tags ?? []).includes(selectedTag);
            return matchesPeriod && matchesAccount && matchesTag;
        }), [
        actualIncomes,
        previousRangeKey,
        selectedAccount,
        selectedAccountRecord,
        selectedTag
    ]);
    const periodExpenseTotal = sum(periodExpenses.map((expense)=>expense.amount));
    const periodIncomeTotal = sum(periodIncomes.map((income)=>income.amount));
    const periodNet = periodIncomeTotal - periodExpenseTotal;
    const previousExpenseTotal = sum(previousExpenses.map((expense)=>expense.amount));
    const previousIncomeTotal = sum(previousIncomes.map((income)=>income.amount));
    const previousNet = previousIncomeTotal - previousExpenseTotal;
    const periodSavings = Math.max(periodNet, 0);
    const savingsRate = periodIncomeTotal ? Math.round(periodSavings / periodIncomeTotal * 100) : 0;
    const expenseRatio = periodIncomeTotal ? Math.round(periodExpenseTotal / periodIncomeTotal * 1000) / 10 : 0;
    const growthPercent = buildDeltaPercent(periodNet, previousNet);
    const cashflowScore = buildCashflowScore({
        expenseRatio,
        periodExpenseTotal,
        periodIncomeTotal,
        reviewCount: buildExpenseSignals(periodExpenses).length,
        savingsRate
    });
    const cashflowHealth = cashflowHealthSummary(cashflowScore);
    const periodCategories = useMemo(() => groupCategoriesFromExpenses(periodExpenses, categories), [
        categories,
        periodExpenses
    ]);
    const cashflowTrend = useMemo(() => buildCashflowTrendData(periodExpenses, periodIncomes, selectedRange), [
        periodExpenses,
        periodIncomes,
        selectedRangeKey
    ]);
    const categoryChangeItems = useMemo(() => buildCategoryChangeItems(periodExpenses, previousExpenses, categories), [
        categories,
        periodExpenses,
        previousExpenses
    ]);
    const heatmapRowsData = useMemo(() => buildExpenseHeatmapRows(periodExpenses), [
        periodExpenses
    ]);
    const analyticsInsights = useMemo(() => buildAnalyticsInsights({
        categories: periodCategories,
        currentExpenseTotal: periodExpenseTotal,
        currentIncomeTotal: periodIncomeTotal,
        expenseRatio,
        previousExpenseTotal,
        previousIncomeTotal,
        reviewCount: buildExpenseSignals(periodExpenses).length,
        savingsRate
    }), [
        expenseRatio,
        periodCategories,
        periodExpenseTotal,
        periodExpenses,
        periodIncomeTotal,
        previousExpenseTotal,
        previousIncomeTotal,
        savingsRate
    ]);
    const forecastNet = useMemo(() => buildForecastNet(periodExpenses, periodIncomes, selectedRange), [
        periodExpenses,
        periodIncomes,
        selectedRangeKey
    ]);
    const comparisonItems = useMemo(() => buildComparisonItems({
        currentExpenseTotal: periodExpenseTotal,
        currentIncomeTotal: periodIncomeTotal,
        currentNet: periodNet,
        previousExpenseTotal,
        previousIncomeTotal,
        previousNet
    }, t), [
        periodExpenseTotal,
        periodIncomeTotal,
        periodNet,
        previousExpenseTotal,
        previousIncomeTotal,
        previousNet
    ]);
    useEffect(()=>{
        setSelectedRange(defaultRange);
    }, [
        defaultRangeKey
    ]);
    async function exportAnalyticsWorkbook() {
        try {
            exportAnalyticsToWorkbook({
                categories: periodCategories,
                comparisonItems,
                expenses: periodExpenses,
                incomes: periodIncomes,
                insights: analyticsInsights,
                range: selectedRange,
                summary: {
                    cashflowScore,
                    expenseRatio,
                    expenseTotal: periodExpenseTotal,
                    incomeTotal: periodIncomeTotal,
                    net: periodNet,
                    savingsRate
                },
                trend: cashflowTrend
            });
            emitAppToast(t("analytics.exportSuccess"), "success");
        } catch (error) {
            emitAppToast(error instanceof Error ? error.message : t("analytics.exportError"), "error");
        }
    }
    return <Page className="analytics-page" title={t("pages.analytics.title")} subtitle={t("pages.analytics.subtitle")}>
      <div className="filter-bar analytics-filter-bar">
        <DateRangeButton className="select-like" label="" onChange={setSelectedRange} range={selectedRange}/>
        <FilterSelect label="" onChange={setSelectedAccount} options={accountOptions} value={selectedAccount}/>
        <FilterSelect disabled={tagOptions.length <= 1} label="" onChange={setSelectedTag} options={tagOptions} value={selectedTag}/>
        <button className="secondary-button compact" onClick={exportAnalyticsWorkbook} type="button">
          <Icon name="download"/> {t("actions.export")}
        </button>
      </div>

      <section className="metric-grid">
        <MetricCard accent="lime" icon="piggy" label={t("panels.savingsRate")} suffix={`${savingsRate}%`} trend={`${formatMoney(periodSavings)} ${t("dashboard.metrics.savings").toLocaleLowerCase(lang === "en" ? "en-US" : "uk-UA")}`} value={0}/>
        <MetricCard accent="blue" icon="chart" label={t("panels.expenseIncomeRatio")} suffix={`${expenseRatio}%`} trend={expenseRatio <= 70 ? t("analytics.norm70") : t("analytics.expenseTooHigh")} value={0}/>
        <MetricCard accent="violet" icon="arrowUp" label={t("panels.netFlowChange")} suffix={formatSignedPercent(growthPercent)} trend={`${formatSignedMoney(periodNet - previousNet)} ${t("analytics.vsPrevPeriod")}`} value={0}/>
        <MetricCard accent="green" icon="chart" label={t("panels.cashflowScore")} suffix={`${cashflowScore} / 100`} trend={t(cashflowHealth.label)} value={0}/>
      </section>

      <section className="analytics-summary-grid">
        <Panel className="analytics-health-panel" title={t("panels.financialHealth")}>
          <div className="metric-card health-card analytics-health-card">
            <Gauge label={t(cashflowHealth.label)} value={cashflowScore}/>
            <div>
              <span>{t("panels.stabilityScore")}</span>
              <strong>{t(cashflowHealth.label)}</strong>
              <small>{t(cashflowHealth.message)}</small>
            </div>
          </div>
        </Panel>

        <Panel className="analytics-forecast-panel" title={t("panels.nextMonthForecast")}>
          <MetricInline label={t("panels.expectedNetFlow")} value={forecastNet}/>
        </Panel>

        <Panel className="analytics-comparison-panel" title={t("panels.periodComparison")}>
          <CompactList items={comparisonItems}/>
        </Panel>
      </section>

      <section className="analytics-grid">
        <Panel className="span-2 analytics-primary-chart" action={formatRangeLabel(selectedRange, lang)} title={t("panels.cashflowTrend")}>
          <ResponsiveContainer height={272} width="100%">
            <ComposedChart data={cashflowTrend}>
              <CartesianGrid stroke="#edf1f6" vertical={false}/>
              <XAxis axisLine={false} dataKey="label" minTickGap={20} tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} tickMargin={8}/>
              <YAxis axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={(value)=>`${Math.round(Number(value) / 1000)}K`} tickLine={false} tickMargin={10}/>
              <Tooltip formatter={(value)=>formatMoney(Number(value))}/>
              <Bar dataKey="income" fill="#22c55e" radius={[3, 3, 0, 0]}/>
              <Bar dataKey="expense" fill="#3b82f6" radius={[3, 3, 0, 0]}/>
              <Line dataKey="net" dot={false} stroke="#0f172a" strokeWidth={2.25} type="monotone"/>
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>

        <CategoryPanel allAccounts={accounts} allExpenses={periodExpenses} categories={periodCategories} className="analytics-category-panel" title={t("dashboard.categories")} total={periodExpenseTotal}/>

        <Panel className="analytics-insights-panel" title={t("panels.expenseInsights")}>
          <CompactList items={analyticsInsights}/>
        </Panel>

        <Panel className="span-2 analytics-secondary-chart" title={t("panels.incomeVsExpenses")}>
          <ResponsiveContainer height={248} width="100%">
            <AreaChart data={cashflowTrend}>
              <defs>
                <linearGradient id="analytics-income-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.22}/>
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02}/>
                </linearGradient>
                <linearGradient id="analytics-expense-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.22}/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#edf1f6" vertical={false}/>
              <XAxis axisLine={false} dataKey="label" minTickGap={22} tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} tickMargin={8}/>
              <YAxis axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={(value)=>`${Math.round(Number(value) / 1000)}K`} tickLine={false} tickMargin={10}/>
              <Tooltip formatter={(value)=>formatMoney(Number(value))}/>
              <Area dataKey="income" fill="url(#analytics-income-fill)" stroke="#22c55e" strokeWidth={2} type="monotone"/>
              <Area dataKey="expense" fill="url(#analytics-expense-fill)" stroke="#3b82f6" strokeWidth={2} type="monotone"/>
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel className="span-2 analytics-heatmap-panel" title={t("panels.spendingPatterns")}>
          <Heatmap rows={heatmapRowsData}/>
        </Panel>

        <Panel title={t("panels.topCategoryChange")}>
          <CompactList items={categoryChangeItems}/>
        </Panel>

        <Panel title={t("panels.goalProgress")}>
          <GoalMiniList goals={goals}/>
        </Panel>
      </section>
    </Page>;
}
function TransactionsPage({ accounts, categories, expenses, incomes, loading, onDeleteTransaction, onOpenModal, onSyncTransactions, setTab, tab }) {
    const { t } = useI18n();
    const [query, setQuery] = useState("");
    const defaultRange = useMemo(()=>latestRangeFromRows([
            ...expenses,
            ...incomes
        ]), [
        expenses,
        incomes
    ]);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedAccount, setSelectedAccount] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [selectedRange, setSelectedRange] = useState(defaultRange);
    const [transactionSort, setTransactionSort] = useState({
        direction: "desc",
        key: "date"
    });
    const [visibleRows, setVisibleRows] = useState(40);
    const transactionScrollRef = useRef(null);
    const transactionLoadMoreRef = useRef(null);
    const selectedRangeKey = dateRangeKey(selectedRange);
    const defaultRangeKey = dateRangeKey(defaultRange);
    useEffect(()=>{
        setSelectedRange(defaultRange);
    }, [
        defaultRangeKey
    ]);
    const filteredRows = useMemo(()=>[
            ...expenses,
            ...incomes
        ].filter((row)=>{
            const expense = isExpenseRow(row);
            const actualIncome = !expense && isActualIncomeStatus(row.status);
            const haystack = `${row.description ?? ""} ${expense ? row.category ?? "" : row.source} ${row.account ?? ""}`.toLocaleLowerCase("uk-UA");
            const matchesSearch = !query.trim() || haystack.includes(query.trim().toLocaleLowerCase("uk-UA"));
            const transfer = expense && isTransferExpense(row);
            const matchesTab = tab === "all" || tab === "expense" && expense && !transfer || tab === "income" && actualIncome || tab === "transfer" && transfer;
            const rowCategory = expense ? row.categoryId ?? row.category ?? "" : "";
            const rowAccount = row.accountId ?? row.account ?? "";
            const rowStatus = expense ? row.sourceStatus === "NEEDS_REVIEW" ? "review" : "completed" : "completed";
            const matchesCategory = selectedCategory === "all" || rowCategory === selectedCategory;
            const selectedAccountRecord = accounts.find((account)=>account.id === selectedAccount || account.name === selectedAccount);
            const matchesAccount = selectedAccount === "all" || rowAccount === selectedAccount || row.account === selectedAccountRecord?.name;
            const matchesStatus = selectedStatus === "all" || rowStatus === selectedStatus;
            const matchesPeriod = matchesDateRange(row.date, selectedRange);
            return matchesTab && matchesSearch && matchesCategory && matchesAccount && matchesStatus && matchesPeriod;
        }), [
        accounts,
        expenses,
        incomes,
        query,
        selectedAccount,
        selectedCategory,
        selectedRangeKey,
        selectedStatus,
        tab
    ]);
    const rows = useMemo(()=>sortTransactionRows(filteredRows, transactionSort), [
        filteredRows,
        transactionSort
    ]);
    const visibleTransactionRows = rows.slice(0, visibleRows);
    const remainingRows = Math.max(rows.length - visibleRows, 0);
    useEffect(()=>{
        setVisibleRows(40);
    }, [
        query,
        selectedAccount,
        selectedCategory,
        selectedRangeKey,
        selectedStatus,
        tab,
        transactionSort.direction,
        transactionSort.key
    ]);
    useEffect(()=>{
        const node = transactionLoadMoreRef.current;
        const scrollRoot = transactionScrollRef.current;
        if (!node || !scrollRoot || visibleRows >= rows.length) return undefined;
        const observer = new IntersectionObserver((entries)=>{
            if (entries.some((entry)=>entry.isIntersecting)) {
                setVisibleRows((current)=>Math.min(current + 30, rows.length));
            }
        }, {
            root: scrollRoot,
            rootMargin: "160px 0px"
        });
        observer.observe(node);
        return ()=>observer.disconnect();
    }, [
        rows.length,
        visibleRows
    ]);
    const actualIncomeRows = rows.filter((row)=>!isExpenseRow(row) && isActualIncomeStatus(row.status));
    const incomeTotal = sum(actualIncomeRows.map((row)=>row.amount));
    const actualIncomeCount = actualIncomeRows.length;
    const expenseTotal = sum(rows.filter((row)=>isExpenseRow(row)).map((row)=>row.amount));
    const transferTotal = sum(rows.filter((row)=>isExpenseRow(row) && isTransferExpense(row)).map((row)=>row.amount));
    const transferCount = rows.filter((row)=>isExpenseRow(row) && isTransferExpense(row)).length;
    const avgCheck = rows.length ? Math.round(sum(rows.map((row)=>row.amount)) / rows.length) : 0;
    function resetFilters() {
        setQuery("");
        setSelectedCategory("all");
        setSelectedAccount("all");
        setSelectedStatus("all");
        setSelectedRange(defaultRange);
        setTab("all");
    }
    return /*#__PURE__*/ _jsxs(Page, {
        className: "transactions-page",
        title: t("pages.transactions.title"),
        children: [
            /*#__PURE__*/ _jsx("div", {
                className: "tabs",
                children: [
                    [
                        "all",
                        t("pages.transactions.tabs.all")
                    ],
                    [
                        "income",
                        t("pages.transactions.tabs.income")
                    ],
                    [
                        "expense",
                        t("pages.transactions.tabs.expenses")
                    ],
                    [
                        "transfer",
                        t("pages.transactions.tabs.transfers")
                    ]
                ].map(([key, label])=>/*#__PURE__*/ _jsx("button", {
                        className: tab === key ? "active" : "",
                        onClick: ()=>setTab(key),
                        type: "button",
                        children: label
                    }, key))
            }),
            /*#__PURE__*/ _jsx(InteractiveFilterBar, {
                filters: [
                    {
                        label: "",
                        onChange: setSelectedCategory,
                        options: [
                            {
                                label: t("filters.allCategories"),
                                value: "all"
                            },
                            ...categories.map((category)=>({
                                    label: category.name,
                                    value: category.id ?? category.name
                                }))
                        ],
                        value: selectedCategory
                    },
                    {
                        label: "",
                        onChange: setSelectedAccount,
                        options: [
                            {
                                label: t("filters.allAccounts"),
                                value: "all"
                            },
                            ...accounts.map((account)=>({
                                    label: account.name,
                                    value: account.id
                                }))
                        ],
                        value: selectedAccount
                    },
                    {
                        label: "",
                        onChange: setSelectedStatus,
                        options: [
                            {
                                label: t("filters.allStatuses"),
                                value: "all"
                            },
                            {
                                label: t("filters.status.completed"),
                                value: "completed"
                            },
                            {
                                label: t("filters.status.review"),
                                value: "review"
                            }
                        ],
                        value: selectedStatus
                    },
                    {
                        label: "",
                        onRangeChange: setSelectedRange,
                        range: selectedRange
                    }
                ],
                onReset: resetFilters,
                onSearchChange: setQuery,
                searchPlaceholder: t("filters.searchTransactions"),
                searchValue: query,
                trailingAction: /*#__PURE__*/ _jsxs("button", {
                    className: "secondary-button",
                    disabled: loading,
                    onClick: ()=>void onSyncTransactions(),
                    type: "button",
                    children: [
                        /*#__PURE__*/ _jsx(Icon, {
                            name: "refresh"
                        }),
                        ` ${t("actions.sync")}`
                    ]
                })
            }),
            /*#__PURE__*/ _jsxs("section", {
                className: "metric-grid five",
                children: [
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: "green",
                        icon: "chart",
                        label: t("metrics.totalTransactions"),
                        trend: tab === "all" ? t("metrics.allTypes") : t("metrics.selectedType"),
                        value: rows.length
                    }),
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: "green",
                        icon: "wallet",
                        label: t("pages.transactions.tabs.income"),
                        trend: t("metrics.records").replace("{count}", String(actualIncomeCount)),
                        value: incomeTotal
                    }),
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: "red",
                        icon: "arrowUp",
                        label: t("pages.transactions.tabs.expenses"),
                        trend: t("metrics.records").replace("{count}", String(rows.filter((row)=>isExpenseRow(row)).length)),
                        value: expenseTotal
                    }),
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: "blue",
                        icon: "transactions",
                        label: t("pages.transactions.tabs.transfers"),
                        trend: t("metrics.records").replace("{count}", String(transferCount)),
                        value: transferTotal
                    }),
                    /*#__PURE__*/ _jsx(MetricCard, {
                        accent: "violet",
                        icon: "expenses",
                        label: t("metrics.avgCheck"),
                        trend: t("metrics.currentFilter"),
                        value: avgCheck
                    })
                ]
            }),
            /*#__PURE__*/ _jsx(Panel, {
                actionNode: /*#__PURE__*/ _jsx("button", {
                    "aria-label": t("dashboard.actions.addExpense"),
                    className: "icon-button",
                    onClick: ()=>onOpenModal("expense"),
                    type: "button",
                    children: /*#__PURE__*/ _jsx(Icon, {
                        name: "plus"
                    })
                }),
                className: "transaction-list-panel",
                title: t("panels.transactionList"),
                children: /*#__PURE__*/ _jsxs("div", {
                    className: "transaction-scroll-area",
                    ref: transactionScrollRef,
                    children: [
                        /*#__PURE__*/ _jsx(UnifiedTransactionTable, {
                            onDelete: onDeleteTransaction,
                            onEdit: (row)=>onOpenModal(isExpenseRow(row) ? "expense" : "income", row),
                            onSortChange: setTransactionSort,
                            rows: visibleTransactionRows,
                            sortState: transactionSort
                        }),
                        /*#__PURE__*/ _jsx("div", {
                            className: "transaction-load-state",
                            ref: transactionLoadMoreRef,
                            children: remainingRows > 0 ? /*#__PURE__*/ _jsxs("button", {
                                className: "secondary-button compact",
                                onClick: ()=>setVisibleRows((current)=>Math.min(current + 30, rows.length)),
                                type: "button",
                                children: t("actions.showMoreOf").replace("{count}", String(Math.min(30, remainingRows))).replace("{remaining}", String(remainingRows))
                            }) : rows.length ? /*#__PURE__*/ _jsx("span", {
                                children: t("actions.showAllTransactions")
                            }) : /*#__PURE__*/ _jsx("span", {
                                children: t("empty.transactionsFiltered")
                            })
                        })
                    ]
                })
            })
        ]
    });
}
function SettingsPage({ accounts, categories, connections, isWorkspaceAdmin, onConnectMonobank, onAction, onDeleteAccount, onDeleteCategoryRecord, onDeleteLedgerAccount, onChangePassword, onExportData, onImportTemplates, onOpenModal, onOpenTelegramAdmin, onRefreshTelegramConnection, onSaveNotification, onSaveAiSettings, onSaveProfile, onSaveSecuritySettings, onSyncMonobank, onUploadAvatar, onRevokeSecret, onSaveSecret, profile, userName }) {
    const { t } = useI18n();
    const [settingsTab, setSettingsTab] = useState("profile");
    const [openIntegrationId, setOpenIntegrationId] = useState(null);
    const notifications = notificationRows(profile?.notifications, t);
    const subscription = profile?.subscription;
    const planName = subscription?.tier === "TEAM" ? "Командний" : subscription?.tier === "PREMIUM" ? "Преміум" : "Безкоштовний";
    const aiProviders = connections.ai?.providers?.length ? connections.ai.providers : [
        {
            connected: Boolean(connections.openai),
            keyMode: connections.ai?.keyMode ?? "SYSTEM",
            model: connections.ai?.model ?? "gpt-5",
            provider: "OPENAI",
            providerLabel: t("ai.provider.openai"),
            runtimeReady: Boolean(connections.openai),
            status: connections.openai ? "CONNECTED" : "DISCONNECTED",
            systemAvailable: Boolean(connections.openai),
            systemSupported: true,
            tokenUrl: "https://platform.openai.com/api-keys",
            userKeyConfigured: Boolean(connections.ai?.userKeyConfigured)
        },
        {
            connected: false,
            keyMode: "USER",
            model: "claude-3-7-sonnet-latest",
            provider: "ANTHROPIC",
            providerLabel: t("ai.provider.anthropic"),
            runtimeReady: false,
            status: "DISCONNECTED",
            systemAvailable: false,
            systemSupported: false,
            tokenUrl: "https://console.anthropic.com/settings/keys",
            userKeyConfigured: false
        },
        {
            connected: false,
            keyMode: "USER",
            model: "gemini-2.5-pro",
            provider: "GEMINI",
            providerLabel: t("ai.provider.gemini"),
            runtimeReady: false,
            status: "DISCONNECTED",
            systemAvailable: false,
            systemSupported: false,
            tokenUrl: "https://aistudio.google.com/app/apikey",
            userKeyConfigured: false
        },
        {
            connected: false,
            keyMode: "USER",
            model: "openrouter/auto",
            provider: "OPENROUTER",
            providerLabel: t("ai.provider.openrouter"),
            runtimeReady: false,
            status: "DISCONNECTED",
            systemAvailable: false,
            systemSupported: false,
            tokenUrl: "https://openrouter.ai/keys",
            userKeyConfigured: false
        }
    ];
    function aiProviderIcon(provider) {
        switch(provider){
            case "ANTHROPIC":
                return "spark";
            case "GEMINI":
                return "google";
            case "OPENROUTER":
                return "chart";
            case "OPENAI":
            default:
                return "openai";
        }
    }
    return /*#__PURE__*/ _jsx(Page, {
        title: t("pages.settings.title"),
        subtitle: t("pages.settings.subtitle"),
        children: /*#__PURE__*/ _jsxs("div", {
            className: "settings-layout",
            children: [
                /*#__PURE__*/ _jsxs("nav", {
                    className: "settings-tabs",
                    children: [
                        /*#__PURE__*/ _jsx("button", {
                            className: settingsTab === "profile" ? "active" : "",
                            onClick: ()=>setSettingsTab("profile"),
                            type: "button",
                            children: t("settings.tabs.profile")
                        }),
                        /*#__PURE__*/ _jsx("button", {
                            className: settingsTab === "finance" ? "active" : "",
                            onClick: ()=>setSettingsTab("finance"),
                            type: "button",
                            children: t("settings.tabs.finance")
                        }),
                        /*#__PURE__*/ _jsx("button", {
                            className: settingsTab === "integrations" ? "active" : "",
                            onClick: ()=>setSettingsTab("integrations"),
                            type: "button",
                            children: t("settings.tabs.integrations")
                        })
                    ]
                }),
                settingsTab === "profile" ? /*#__PURE__*/ _jsxs("section", {
                    className: "settings-grid",
                    children: [
                        /*#__PURE__*/ _jsx(Panel, {
                            title: t("settings.tabs.profile"),
                            children: /*#__PURE__*/ _jsx(ProfileSettingsForm, {
                                onSave: onSaveProfile,
                                onUploadAvatar: onUploadAvatar,
                                profile: profile,
                                userName: userName
                            })
                        }),
                        /*#__PURE__*/ _jsx(Panel, {
                            title: t("settings.notifExpenses").replace(" про витрати", ""),
                            children: notifications.map((notification)=>/*#__PURE__*/ _jsx(ToggleRow, {
                                    enabled: notification.enabled,
                                    label: notification.label,
                                    onChange: (enabled)=>void onSaveNotification(notification.key, enabled),
                                    text: notification.text
                                }, notification.key))
                        }),
                        /*#__PURE__*/ _jsx(Panel, {
                            title: t("settings.tabs.security"),
                            children: /*#__PURE__*/ _jsx(SecuritySettingsPanel, {
                                onChangePassword: onChangePassword,
                                onSave: onSaveSecuritySettings,
                                profile: profile
                            })
                        }),
                        /*#__PURE__*/ _jsxs(Panel, {
                            title: t("settings.tabs.subscription"),
                            children: [
                                /*#__PURE__*/ _jsxs("div", {
                                    className: "plan-box",
                                    children: [
                                        /*#__PURE__*/ _jsx(Icon, {
                                            name: "shield"
                                        }),
                                        /*#__PURE__*/ _jsx("strong", {
                                            children: planName
                                        }),
                                        /*#__PURE__*/ _jsx("small", {
                                            children: subscription?.status === "ACTIVE" ? "Активний план" : t("settings.planInactive")
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ _jsx(CompactList, {
                                    items: [
                                        t("settings.unlimitedAccounts"),
                                        t("settings.advancedAnalytics"),
                                        t("settings.budgetPlanning"),
                                        t("settings.dataExport"),
                                        t("settings.prioritySupport")
                                    ]
                                }),
                                /*#__PURE__*/ _jsxs("strong", {
                                    children: [
                                        subscription?.priceMonthly ? formatMoney(subscription.priceMonthly) : "0 ₴",
                                        t("settings.perMonth")
                                    ]
                                }),
                                /*#__PURE__*/ _jsx("button", {
                                    className: "secondary-button",
                                    type: "button",
                                    children: t("settings.manageSubscription")
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsx(Panel, {
                            title: t("settings.tabs.privacy"),
                            children: /*#__PURE__*/ _jsx(PrivacyPanel, {
                                onDeleteAccount: onDeleteAccount,
                                onExportData: onExportData
                            })
                        })
                    ]
                }) : null,
                settingsTab === "finance" ? /*#__PURE__*/ _jsxs("section", {
                    className: "settings-grid",
                    children: [
                        /*#__PURE__*/ _jsxs(Panel, {
                            title: t("settings.tabs.finance"),
                            children: [
                                /*#__PURE__*/ _jsxs("button", {
                                    className: "tiny-action",
                                    onClick: ()=>onOpenModal("account"),
                                    type: "button",
                                    children: [
                                        /*#__PURE__*/ _jsx(Icon, {
                                            name: "plus"
                                        }),
                                        t("settings.addAccount")
                                    ]
                                }),
                                /*#__PURE__*/ _jsx(AccountList, {
                                    accounts: accounts,
                                    onDelete: onDeleteLedgerAccount,
                                    onEdit: (account)=>onOpenModal("account", account)
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsx(Panel, {
                            title: t("settings.tabs.region"),
                            children: /*#__PURE__*/ _jsx(LocaleRegionSettingsForm, {
                                onSave: onSaveProfile,
                                profile: profile
                            })
                        }),
                        /*#__PURE__*/ _jsx(CategorySettingsPanel, {
                            categories: categories,
                            onDelete: onDeleteCategoryRecord,
                            onEdit: (category)=>onOpenModal("category", category),
                            onImportTemplates: onImportTemplates,
                            onNew: ()=>onOpenModal("category")
                        })
                    ]
                }) : null,
                settingsTab === "integrations" ? /*#__PURE__*/ _jsxs("section", {
                    className: "settings-grid",
                    children: [
                        /*#__PURE__*/ _jsx(Panel, {
                            title: t("settings.tabs.telegram"),
                            children: /*#__PURE__*/ _jsx(TelegramConnectPanel, {
                                botUrl: connections.telegramBotUrl ?? null,
                                connected: Boolean(connections.telegramConnected),
                                isWorkspaceAdmin: isWorkspaceAdmin,
                                onOpenAdmin: onOpenTelegramAdmin,
                                onRefreshConnection: onRefreshTelegramConnection,
                                username: connections.telegramBotUsername ?? null
                            })
                        }),
                        /*#__PURE__*/ _jsx(Panel, {
                            title: t("settings.tabs.integrations"),
                            children: /*#__PURE__*/ _jsxs("div", {
                                className: "integration-accordion-list",
                                children: [
                                    /*#__PURE__*/ _jsx(IntegrationAccordionItem, {
                                        connected: connections.monobank,
                                        icon: "bank",
                                        id: "monobank",
                                        label: "monobank",
                                        onToggle: ()=>setOpenIntegrationId((current)=>current === "monobank" ? null : "monobank"),
                                        open: openIntegrationId === "monobank",
                                        text: connections.monobank ? t("mono.connectedNote") : t("mono.notConnectedNote"),
                                        children: /*#__PURE__*/ _jsx(MonobankConnectPanel, {
                                            accounts: accounts.filter((account)=>account.provider === "MONOBANK"),
                                            connected: connections.monobank,
                                            hideHeader: true,
                                            onConnect: onConnectMonobank,
                                            onEnableWebhook: ()=>onAction("monobank/webhook-enable"),
                                            onSync: onSyncMonobank
                                        })
                                    }),
                                    /*#__PURE__*/ _jsx(IntegrationAccordionItem, {
                                        connected: connections.googleSheets,
                                        icon: "google",
                                        id: "google-drive",
                                        label: "Google Drive",
                                        onToggle: ()=>setOpenIntegrationId((current)=>current === "google-drive" ? null : "google-drive"),
                                        open: openIntegrationId === "google-drive",
                                        text: t("integration.googleDriveDescription"),
                                        children: /*#__PURE__*/ _jsx(GoogleDriveConnectPanel, {
                                            connected: connections.googleSheets
                                        })
                                    })
                                ]
                            })
                        }),
                        /*#__PURE__*/ _jsx(Panel, {
                            title: t("settings.tabs.ai"),
                            children: /*#__PURE__*/ _jsx("div", {
                                className: "integration-accordion-list",
                                children: aiProviders.map((providerConfig)=>{
                                    const providerId = `ai-${providerConfig.provider.toLowerCase()}`;
                                    return /*#__PURE__*/ _jsx(IntegrationAccordionItem, {
                                        connected: providerConfig.connected,
                                        icon: aiProviderIcon(providerConfig.provider),
                                        id: providerId,
                                        label: providerConfig.providerLabel,
                                        onToggle: ()=>setOpenIntegrationId((current)=>current === providerId ? null : providerId),
                                        open: openIntegrationId === providerId,
                                        text: t(`ai.description.${providerConfig.provider.toLowerCase()}`),
                                        children: /*#__PURE__*/ _jsx(AiProviderPanel, {
                                            icon: aiProviderIcon(providerConfig.provider),
                                            onSave: onSaveAiSettings,
                                            providerConfig: providerConfig
                                        })
                                    }, providerId);
                                })
                            })
                        }),
                        /*#__PURE__*/ _jsx(Panel, {
                            title: t("settings.tabs.secrets"),
                            children: /*#__PURE__*/ _jsx(SecretVaultPanel, {
                                onRevoke: onRevokeSecret,
                                onSave: onSaveSecret,
                                secrets: connections.secrets ?? []
                            })
                        })
                    ]
                }) : null
            ]
        })
    });
}
function AiProviderPanel({ icon, onSave, providerConfig }) {
    const { lang, t } = useI18n();
    const provider = providerConfig.provider;
    const supportsSystemMode = providerConfig.systemSupported !== false;
    const effectiveInitialMode = supportsSystemMode ? providerConfig.keyMode ?? "SYSTEM" : "USER";
    const [keyMode, setKeyMode] = useState(effectiveInitialMode);
    const [apiKey, setApiKey] = useState("");
    const tokenUrl = providerConfig.tokenUrl ?? "https://platform.openai.com/api-keys";
    useEffect(()=>{
        setKeyMode(supportsSystemMode ? providerConfig.keyMode ?? "SYSTEM" : "USER");
    }, [
        providerConfig.keyMode,
        supportsSystemMode
    ]);
    function submit(event) {
        event.preventDefault();
        const resolvedKeyMode = supportsSystemMode ? keyMode : "USER";
        void onSave({
            apiKey: apiKey.trim() || undefined,
            keyMode: resolvedKeyMode,
            provider
        }).then(()=>setApiKey(""));
    }
    const statusLabel = providerConfig.connected ? t("ai.providerConnected") : t("ai.providerNotConnected");
    const providerDescription = t(`ai.description.${provider.toLowerCase()}`);
    const keyModeLabel = keyMode === "SYSTEM" ? t("ai.systemKeyMode") : t("ai.myKeyMode");
    const isUserMode = !supportsSystemMode || keyMode === "USER";
    const helperCopy = providerConfig.connected ? `${keyModeLabel}. ${providerConfig.model ? `Model: ${providerConfig.model}.` : ""}` : providerDescription;
    return /*#__PURE__*/ _jsxs("div", {
        className: "ai-provider-panel",
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: "integration-row ai-status-row",
                children: [
                    /*#__PURE__*/ _jsx("span", {
                        children: /*#__PURE__*/ _jsx(Icon, {
                            name: icon
                        })
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        children: [
                            /*#__PURE__*/ _jsx("strong", {
                                children: providerConfig.providerLabel
                            }),
                            /*#__PURE__*/ _jsx("small", {
                                children: helperCopy
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsx("small", {
                        className: providerConfig.connected ? "positive" : "",
                        children: statusLabel
                    })
                ]
            }),
            supportsSystemMode ? /*#__PURE__*/ _jsxs("div", {
                className: "ai-mode-toggle",
                role: "group",
                "aria-label": "AI key mode",
                children: [
                    /*#__PURE__*/ _jsx("button", {
                        className: keyMode === "SYSTEM" ? "active" : "",
                        onClick: ()=>setKeyMode("SYSTEM"),
                        type: "button",
                        children: t("ai.systemKey")
                    }),
                    /*#__PURE__*/ _jsx("button", {
                        className: keyMode === "USER" ? "active" : "",
                        onClick: ()=>setKeyMode("USER"),
                        type: "button",
                        children: t("ai.myKey")
                    })
                ]
            }) : /*#__PURE__*/ _jsx("p", {
                className: "ai-provider-note",
                children: t("ai.userOnlyMode")
            }),
            /*#__PURE__*/ _jsx("p", {
                className: keyMode === "SYSTEM" ? "ai-disclaimer warning" : "ai-disclaimer",
                children: keyMode === "SYSTEM" ? t("ai.systemKeyNote") : t("ai.runtimeOpenAiOnly")
            }),
            /*#__PURE__*/ _jsxs("form", {
                className: "ai-provider-form",
                onInvalidCapture: (event)=>handleValidationCapture(event, lang),
                onSubmit: submit,
                children: [
                    supportsSystemMode ? /*#__PURE__*/ _jsx("div", {
                        className: "form-grid two",
                        children: /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("ai.keySource"),
                                /*#__PURE__*/ _jsxs("select", {
                                    value: keyMode,
                                    onChange: (event)=>setKeyMode(event.target.value),
                                    name: "keyMode",
                                    children: [
                                        /*#__PURE__*/ _jsx("option", {
                                            value: "SYSTEM",
                                            children: t("ai.systemKey")
                                        }),
                                        /*#__PURE__*/ _jsx("option", {
                                            value: "USER",
                                            children: t("ai.myKey")
                                        })
                                    ]
                                })
                            ]
                        })
                    }) : /*#__PURE__*/ _jsxs("div", {
                        className: "form-grid two",
                        children: [
                            /*#__PURE__*/ _jsxs("label", {
                                children: [
                                    t("ai.keySource"),
                                    /*#__PURE__*/ _jsx("div", {
                                        className: "ai-provider-readonly",
                                        children: t("ai.myKey")
                                    })
                                ]
                            }),
                            /*#__PURE__*/ _jsx("p", {
                                className: "ai-provider-note",
                                children: t("ai.systemModeUnavailable")
                            })
                        ]
                    }),
                    isUserMode ? /*#__PURE__*/ _jsxs("label", {
                        children: [
                            t(`ai.personalKeyLabel.${provider.toLowerCase()}`),
                            /*#__PURE__*/ _jsx("input", {
                                autoComplete: "off",
                                minLength: 20,
                                onChange: (event)=>setApiKey(event.target.value),
                                placeholder: providerConfig.userKeyConfigured ? "Ключ уже збережено. Вставте новий, щоб замінити." : "sk-...",
                                required: !providerConfig.userKeyConfigured,
                                type: "password",
                                value: apiKey
                            })
                        ]
                    }) : null,
                    /*#__PURE__*/ _jsxs("div", {
                        className: "ai-provider-actions",
                        children: [
                            /*#__PURE__*/ _jsxs("a", {
                                className: "secondary-button",
                                href: tokenUrl,
                                rel: "noreferrer",
                                target: "_blank",
                                children: [
                                    /*#__PURE__*/ _jsx(Icon, {
                                        name: "import"
                                    }),
                                    t("ai.getToken")
                                ]
                            }),
                            /*#__PURE__*/ _jsxs("button", {
                                disabled: isUserMode && !apiKey.trim() && !providerConfig.userKeyConfigured,
                                type: "submit",
                                children: [
                                    /*#__PURE__*/ _jsx(Icon, {
                                        name: icon
                                    }),
                                    t("ai.saveProvider")
                                ]
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "ai-provider-meta",
                children: [
                    /*#__PURE__*/ _jsxs("span", {
                        children: [
                            t("ai.systemKeyLabel"),
                            providerConfig.systemAvailable && supportsSystemMode ? t("ai.systemAvailable") : t("ai.systemUnavailable")
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("span", {
                        children: [
                            t("ai.myKeyLabel"),
                            providerConfig.userKeyConfigured ? t("ai.myKeySaved") : t("ai.myKeyNotAdded")
                        ]
                    })
                ]
            })
        ]
    });
}
function MonobankConnectPanel({ accounts, connected, hideHeader = false, onConnect, onEnableWebhook, onSync }) {
    const { lang, t } = useI18n();
    const [enableWebhook, setEnableWebhook] = useState(false);
    const [historyRange, setHistoryRange] = useState(()=>monthRangeFromDate(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)));
    const [token, setToken] = useState("");
    const [syncing, setSyncing] = useState(false);
    const monoTokenUrl = "https://api.monobank.ua/";
    async function handleSync(range) {
        if (syncing) return;
        setSyncing(true);
        try {
            await onSync(range);
        } finally {
            setSyncing(false);
        }
    }
    function submit(event) {
        event.preventDefault();
        void onConnect({
            enableWebhook,
            token
        }).then(()=>setToken(""));
    }
    return /*#__PURE__*/ _jsxs("div", {
        className: "monobank-connect-panel",
        children: [
            !hideHeader ? /*#__PURE__*/ _jsxs("div", {
                className: "integration-row monobank-status-row",
                children: [
                    /*#__PURE__*/ _jsx("span", {
                        children: /*#__PURE__*/ _jsx(Icon, {
                            name: "bank"
                        })
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        children: [
                            /*#__PURE__*/ _jsx("strong", {
                                children: "monobank"
                            }),
                            /*#__PURE__*/ _jsx("small", {
                                children: connected ? "Токен збережено зашифровано. Картки і баланс синхронізуються з Monobank API." : "Підключіть personal API token, щоб підтягнути картки, баланси і витрати."
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsx("small", {
                        className: connected ? "positive" : "",
                        children: connected ? t("mono.connected") : t("mono.notConnected")
                    })
                ]
            }) : null,
            accounts.length ? /*#__PURE__*/ _jsx("div", {
                className: "mono-account-list",
                children: accounts.slice(0, 4).map((account)=>/*#__PURE__*/ _jsxs("div", {
                        className: "mono-account-pill",
                        children: [
                            /*#__PURE__*/ _jsx("span", {
                                children: account.name
                            }),
                            /*#__PURE__*/ _jsx("strong", {
                                children: formatMoney(account.balance)
                            })
                        ]
                    }, account.id))
            }) : null,
            /*#__PURE__*/ _jsxs("form", {
                className: "monobank-connect-form",
                onInvalidCapture: (event)=>handleValidationCapture(event, lang),
                onSubmit: submit,
                children: [
                    /*#__PURE__*/ _jsxs("label", {
                        children: [
                            "Monobank personal token",
                            /*#__PURE__*/ _jsx("input", {
                                autoComplete: "off",
                                minLength: 20,
                                onChange: (event)=>setToken(event.target.value),
                                placeholder: t("mono.tokenPlaceholder"),
                                required: !connected,
                                type: "password",
                                value: token
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("label", {
                        className: "checkbox-line",
                        children: [
                            /*#__PURE__*/ _jsx("input", {
                                checked: enableWebhook,
                                onChange: (event)=>setEnableWebhook(event.target.checked),
                                type: "checkbox"
                            }),
                            /*#__PURE__*/ _jsx("span", {
                                children: t("mono.enableWebhook")
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        className: "monobank-actions",
                        children: [
                            /*#__PURE__*/ _jsxs("a", {
                                className: "secondary-button",
                                href: monoTokenUrl,
                                rel: "noreferrer",
                                target: "_blank",
                                children: [
                                    /*#__PURE__*/ _jsx(Icon, {
                                        name: "import"
                                    }),
                                    t("ai.getToken")
                                ]
                            }),
                            /*#__PURE__*/ _jsxs("button", {
                                disabled: !token.trim(),
                                type: "submit",
                                children: [
                                    /*#__PURE__*/ _jsx(Icon, {
                                        name: "bank"
                                    }),
                                    " ",
                                    connected ? t("mono.updateAndSync") : t("mono.connect")
                                ]
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "monobank-actions",
                children: [
                            /*#__PURE__*/ _jsxs("button", {
                                className: "secondary-button",
                                disabled: !connected || syncing,
                                onClick: ()=>void handleSync(),
                                type: "button",
                                children: [
                                    /*#__PURE__*/ _jsx(Icon, {
                                        name: "refresh"
                                    }),
                                    syncing ? t("mono.syncing") : t("mono.syncLastMonth")
                                ]
                            }),
                    /*#__PURE__*/ _jsx("button", {
                        className: "ghost-button",
                        disabled: !connected,
                        onClick: ()=>void onEnableWebhook(),
                        type: "button",
                        children: t("mono.enableWebhookBtn")
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "monobank-history-sync",
                children: [
                    /*#__PURE__*/ _jsxs("div", {
                        children: [
                            /*#__PURE__*/ _jsx("strong", {
                                children: t("mono.importHistory")
                            }),
                            /*#__PURE__*/ _jsx("small", {
                                children: "Для старих даних оберіть період. Довгі періоди FinTrack поставить у чергу й завантажить частинами за лімітами Monobank."
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        className: "monobank-history-controls",
                        children: [
                            /*#__PURE__*/ _jsx(DateRangeButton, {
                                className: "select-like",
                                label: t("mono.period"),
                                onChange: setHistoryRange,
                                range: historyRange
                            }),
                            /*#__PURE__*/ _jsxs("button", {
                                className: "secondary-button",
                                disabled: !connected || syncing,
                                onClick: ()=>void handleSync(historyRange),
                                type: "button",
                                children: [
                                    /*#__PURE__*/ _jsx("span", {
                                        className: syncing ? "icon-spin" : undefined,
                                        children: /*#__PURE__*/ _jsx(Icon, {
                                            name: syncing ? "refresh" : "download"
                                        })
                                    }),
                                    syncing ? t("mono.loading") : t("mono.loadHistory")
                                ]
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ _jsx("small", {
                className: "form-note",
                children: "Повністю автоматичне підтвердження в застосунку Monobank доступне лише через provider API після погодження з банком. Для персонального API найкоротший шлях зараз: відкрити сторінку token, вставити token тут, далі FinTrack усе синхронізує сам."
            })
        ]
    });
}
function IntegrationAccordionItem({ children, connected, icon, id, label, onToggle, open, text }) {
    const { t } = useI18n();
    const buttonId = `${id}-accordion-button`;
    const panelId = `${id}-accordion-panel`;
    return /*#__PURE__*/ _jsxs("div", {
        className: open ? "integration-accordion is-open" : "integration-accordion",
        children: [
            /*#__PURE__*/ _jsxs("h3", {
                className: "integration-accordion-heading",
                children: [
                    /*#__PURE__*/ _jsxs("button", {
                        "aria-controls": panelId,
                        "aria-expanded": open,
                        className: "integration-accordion-trigger",
                        id: buttonId,
                        onClick: onToggle,
                        type: "button",
                        children: [
                            /*#__PURE__*/ _jsx("span", {
                                className: "integration-accordion-icon",
                                children: /*#__PURE__*/ _jsx(Icon, {
                                    name: icon
                                })
                            }),
                            /*#__PURE__*/ _jsxs("span", {
                                className: "integration-accordion-copy",
                                children: [
                                    /*#__PURE__*/ _jsx("strong", {
                                        children: label
                                    }),
                                    /*#__PURE__*/ _jsx("small", {
                                        children: text
                                    })
                                ]
                            }),
                            /*#__PURE__*/ _jsx("small", {
                                className: connected ? "integration-accordion-status positive" : "integration-accordion-status",
                                children: connected ? t("integration.connected") : t("integration.connect")
                            }),
                            /*#__PURE__*/ _jsx("span", {
                                className: "integration-accordion-chevron",
                                "aria-hidden": "true",
                                children: /*#__PURE__*/ _jsx(Icon, {
                                    name: open ? "chevronDown" : "chevronRight"
                                })
                            })
                        ]
                    })
                ]
            }),
            open ? /*#__PURE__*/ _jsx("div", {
                "aria-labelledby": buttonId,
                className: "integration-accordion-panel",
                id: panelId,
                role: "region",
                children: children
            }) : null
        ]
    });
}
function GoogleDriveConnectPanel({ connected }) {
    const { t } = useI18n();
    return /*#__PURE__*/ _jsxs("div", {
        className: "integration-info-panel",
        children: [
            /*#__PURE__*/ _jsx("p", {
                className: "empty-note",
                children: t("integration.googleDriveHelp")
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "integration-info-meta",
                children: [
                    /*#__PURE__*/ _jsx("strong", {
                        children: connected ? t("integration.connected") : t("integration.connect")
                    }),
                    /*#__PURE__*/ _jsx("small", {
                        children: connected ? t("integration.googleDriveConnected") : t("integration.googleDriveNotConnected")
                    })
                ]
            })
        ]
    });
}
function TelegramConnectPanel({ botUrl, connected, isWorkspaceAdmin, onOpenAdmin, onRefreshConnection, username }) {
    const { t } = useI18n();
    const refreshSoon = ()=>{
        for (const delayMs of [
            2000,
            6000,
            12000,
            20000
        ]){
            window.setTimeout(()=>void onRefreshConnection(), delayMs);
        }
    };
    const openBot = ()=>{
        if (!botUrl) return;
        window.open(botUrl, "_blank", "noopener,noreferrer");
        if (!connected) {
            refreshSoon();
        }
    };
    return /*#__PURE__*/ _jsxs("div", {
        className: "telegram-connect-panel",
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: "telegram-connect-copy",
                children: [
                    /*#__PURE__*/ _jsxs("div", {
                        className: "telegram-connect-badge",
                        children: [
                            /*#__PURE__*/ _jsx("span", {
                                className: connected ? "status-dot connected" : "status-dot"
                            }),
                            /*#__PURE__*/ _jsx("strong", {
                                children: connected ? t("telegram.connected") : t("telegram.notConnected")
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsx("p", {
                        children: connected ? "Бот уже привʼязаний до вашого акаунта. Через нього можна додавати витрати, дивитися звіти та запускати синхронізацію." : username ? `Натисніть кнопку нижче, відкрийте @${username} у Telegram і підтвердьте старт.` : "Власник ще не налаштував спільного Telegram-бота для продукту."
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "telegram-connect-actions",
                children: [
                    botUrl ? /*#__PURE__*/ _jsxs("button", {
                        className: "wide",
                        onClick: openBot,
                        type: "button",
                        children: [
                            /*#__PURE__*/ _jsx(Icon, {
                                name: "telegram"
                            }),
                            " ",
                            connected ? t("telegram.openBot") : t("telegram.addBot")
                        ]
                    }) : null,
                    botUrl && !connected ? /*#__PURE__*/ _jsxs("button", {
                        className: "secondary-button",
                        onClick: ()=>void onRefreshConnection(),
                        type: "button",
                        children: [
                            /*#__PURE__*/ _jsx(Icon, {
                                name: "refresh"
                            }),
                            t("telegram.checkStatus")
                        ]
                    }) : null,
                    isWorkspaceAdmin ? /*#__PURE__*/ _jsxs("button", {
                        className: botUrl ? "secondary-button" : "wide",
                        onClick: onOpenAdmin,
                        type: "button",
                        children: [
                            /*#__PURE__*/ _jsx(Icon, {
                                name: "shield"
                            }),
                            t("telegram.adminPanel")
                        ]
                    }) : null
                ]
            })
        ]
    });
}
function TelegramAdminPage({ section, onRefreshAll, onEnableWebhook, onOpenBot, onRefresh, overview, onSave, settings }) {
    const { lang, t } = useI18n();
    const users = overview?.users ?? [];
    const integrations = overview?.integrations ?? [];
    const jobs = overview?.jobs ?? [];
    const recentActivity = overview?.recentActivity ?? [];
    const settingsRows = overview?.settings ?? [];
    const alerts = overview?.alerts ?? [];
    const usersNeedingAttention = users.filter((row)=>row.flags.length || row.integrationsNeedAttention > 0 || !row.telegramConnected);
    const integrationsNeedingAttention = integrations.filter((row)=>row.needsAttention > 0 || row.disconnected > 0);
    const jobsNeedingAttention = jobs.filter((row)=>row.lastError || row.status.toUpperCase().includes("FAIL"));
    const usersWithTelegram = users.filter((row)=>row.telegramConnected).length;
    const configuredSettings = settingsRows.filter((row)=>row.hasValue).length;
    const copy = {
        activity: t("admin.activity"),
        activitySubtitle: t("admin.activitySubtitle"),
        alerts: t("admin.alerts"),
        alertsEmpty: t("admin.alertsEmpty"),
        attentionUsers: t("admin.attentionUsers"),
        botSettings: t("admin.botSettings"),
        botStatus: t("admin.botStatus"),
        dashboardSubtitle: t("admin.dashboardSubtitle"),
        dashboardTitle: t("admin.dashboardTitle"),
        generatedAt: t("admin.generatedAt"),
        helpTitle: t("admin.helpTitle"),
        helpText: t("admin.helpText"),
        integrations: t("admin.integrations"),
        integrationsSubtitle: t("admin.integrationsSubtitle"),
        integrationsTitle: t("admin.integrationsTitle"),
        jobs: t("admin.jobs"),
        monitoringSubtitle: t("admin.monitoringSubtitle"),
        monitoringTitle: t("admin.monitoringTitle"),
        openBot: t("admin.openBot"),
        platformSubtitle: t("admin.platformSubtitle"),
        platformTitle: t("admin.platformTitle"),
        refresh: t("admin.refresh"),
        refreshTelegram: t("admin.refreshTelegram"),
        runtimeHealthy: t("admin.runtimeHealthy"),
        settings: t("admin.settings"),
        telegramSubtitle: t("admin.telegramSubtitle"),
        telegramTitle: t("admin.telegramTitle"),
        userSubtitle: t("admin.userSubtitle"),
        users: t("admin.users"),
        usersTitle: t("admin.usersTitle"),
        webhook: t("admin.webhook"),
        workspace: t("admin.workspace")
    };
    const pageMeta = {
        adminActivity: {
            subtitle: copy.activitySubtitle,
            title: copy.activity
        },
        adminDashboard: {
            subtitle: copy.dashboardSubtitle,
            title: copy.dashboardTitle
        },
        adminIntegrations: {
            subtitle: copy.integrationsSubtitle,
            title: copy.integrationsTitle
        },
        adminMonitoring: {
            subtitle: copy.monitoringSubtitle,
            title: copy.monitoringTitle
        },
        adminPlatform: {
            subtitle: copy.platformSubtitle,
            title: copy.platformTitle
        },
        adminTelegram: {
            subtitle: copy.telegramSubtitle,
            title: copy.telegramTitle
        },
        adminUsers: {
            subtitle: copy.userSubtitle,
            title: copy.usersTitle
        }
    };
    function submit(event) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        void onSave({
            adminTelegramUserIds: String(data.get("adminTelegramUserIds") ?? "").trim(),
            botToken: String(data.get("botToken") ?? "").trim(),
            botUsername: String(data.get("botUsername") ?? "").trim()
        });
    }
    const refreshAction = /*#__PURE__*/ _jsxs("button", {
        className: "secondary-button",
        onClick: ()=>void onRefreshAll(),
        type: "button",
        children: [
            /*#__PURE__*/ _jsx(Icon, {
                name: "refresh"
            }),
            " ",
            copy.refresh
        ]
    });
    const telegramActions = /*#__PURE__*/ _jsxs(_Fragment, {
        children: [
            /*#__PURE__*/ _jsxs("button", {
                className: "secondary-button",
                onClick: ()=>window.open("https://t.me/BotFather", "_blank", "noopener,noreferrer"),
                type: "button",
                children: [
                    /*#__PURE__*/ _jsx(Icon, {
                        name: "telegram"
                    }),
                    " BotFather"
                ]
            }),
            /*#__PURE__*/ _jsxs("button", {
                className: "secondary-button",
                onClick: ()=>void onRefresh(),
                type: "button",
                children: [
                    /*#__PURE__*/ _jsx(Icon, {
                        name: "refresh"
                    }),
                    " ",
                    copy.refreshTelegram
                ]
            }),
            /*#__PURE__*/ _jsxs("button", {
                className: "secondary-button",
                disabled: !settings?.botUrl,
                onClick: onOpenBot,
                type: "button",
                children: [
                    /*#__PURE__*/ _jsx(Icon, {
                        name: "telegram"
                    }),
                    " ",
                    copy.openBot
                ]
            }),
            /*#__PURE__*/ _jsxs("button", {
                disabled: !settings?.botTokenConfigured || settings?.runtimeMode !== "webhook",
                onClick: ()=>void onEnableWebhook(),
                type: "button",
                children: [
                    /*#__PURE__*/ _jsx(Icon, {
                        name: "upload"
                    }),
                    " ",
                    copy.webhook
                ]
            })
        ]
    });
    const workspaceSnapshotPanel = /*#__PURE__*/ _jsxs(Panel, {
        className: "span-2",
        title: copy.workspace,
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: "admin-metric-grid admin-metric-grid-five",
                children: [
                    /*#__PURE__*/ _jsx(AdminStatCard, {
                        label: t("admin.metric.users"),
                        value: overview?.summary.totalUsers ?? "—"
                    }),
                    /*#__PURE__*/ _jsx(AdminStatCard, {
                        label: t("admin.metric.admins"),
                        value: overview?.summary.admins ?? "—"
                    }),
                    /*#__PURE__*/ _jsx(AdminStatCard, {
                        label: t("admin.metric.sessions"),
                        value: overview?.summary.activeSessions ?? "—"
                    }),
                    /*#__PURE__*/ _jsx(AdminStatCard, {
                        label: t("admin.metric.seenIn24h"),
                        value: overview?.summary.usersSeenToday ?? "—"
                    }),
                    /*#__PURE__*/ _jsx(AdminStatCard, {
                        label: t("admin.metric.attention"),
                        value: overview?.summary.usersNeedingAttention ?? "—"
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "admin-metric-grid admin-metric-grid-five",
                children: [
                    /*#__PURE__*/ _jsx(AdminStatCard, {
                        label: t("admin.metric.activePlans"),
                        value: overview?.summary.activeSubscriptions ?? "—"
                    }),
                    /*#__PURE__*/ _jsx(AdminStatCard, {
                        label: t("admin.metric.pendingJobs"),
                        value: overview?.summary.pendingJobs ?? "—"
                    }),
                    /*#__PURE__*/ _jsx(AdminStatCard, {
                        label: t("admin.metric.failedJobs"),
                        value: overview?.summary.failedJobs ?? "—"
                    }),
                    /*#__PURE__*/ _jsx(AdminStatCard, {
                        label: t("admin.metric.telegramQueue"),
                        value: overview?.summary.pendingTelegramNotifications ?? "—"
                    }),
                    /*#__PURE__*/ _jsx(AdminStatCard, {
                        label: t("admin.metric.configuredSettings"),
                        value: overview?.summary.settingsConfigured ?? "—"
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("p", {
                className: "admin-ok-note",
                children: [
                    copy.generatedAt,
                    ": ",
                    overview?.generatedAt ? formatDateTime(overview.generatedAt) : "—"
                ]
            })
        ]
    });
    const runtimePanel = /*#__PURE__*/ _jsxs(Panel, {
        title: copy.botStatus,
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: "admin-metric-grid",
                children: [
                    /*#__PURE__*/ _jsx(AdminStatCard, {
                        label: t("admin.bot"),
                        value: settings?.botConfigured ? t("admin.botReady") : t("admin.botNotReady")
                    }),
                    /*#__PURE__*/ _jsx(AdminStatCard, {
                        label: t("admin.mode"),
                        value: settings?.runtimeMode === "webhook" ? "Webhook" : "Polling"
                    }),
                    /*#__PURE__*/ _jsx(AdminStatCard, {
                        label: t("admin.connectedUsers"),
                        value: settings?.connectedUserCount ?? 0
                    }),
                    /*#__PURE__*/ _jsx(AdminStatCard, {
                        label: t("admin.activeChats"),
                        value: settings?.connectedAccountCount ?? 0
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "admin-status-list",
                children: [
                    /*#__PURE__*/ _jsx(StatusRow, {
                        label: t("admin.publicBot"),
                        value: settings?.botUrl ? settings.botUrl : t("admin.notReady")
                    }),
                    /*#__PURE__*/ _jsx(StatusRow, {
                        label: "Username",
                        value: settings?.botUsername ? `@${settings.botUsername}` : t("admin.notDefined")
                    }),
                    /*#__PURE__*/ _jsx(StatusRow, {
                        label: t("admin.tokenSource"),
                        value: settings?.botTokenSource === "database" ? t("admin.tokenSourceDb") : settings?.botTokenSource === "environment" ? t("admin.tokenSourceEnv") : t("admin.tokenSourceNone")
                    }),
                    /*#__PURE__*/ _jsx(StatusRow, {
                        label: t("admin.webhookLabel"),
                        value: formatWebhookStatus(settings, t)
                    }),
                    /*#__PURE__*/ _jsx(StatusRow, {
                        label: t("admin.secretSetup"),
                        value: settings?.secretSetupEnabled ? t("admin.enabled") : t("admin.disabled")
                    })
                ]
            }),
            settings?.warnings.length ? /*#__PURE__*/ _jsx("div", {
                className: "admin-warning-list",
                children: settings.warnings.map((warning)=>/*#__PURE__*/ _jsxs("div", {
                        className: "admin-warning-row",
                        children: [
                            /*#__PURE__*/ _jsx(Icon, {
                                name: "warning"
                            }),
                            /*#__PURE__*/ _jsx("span", {
                                children: warning
                            })
                        ]
                    }, warning))
            }) : /*#__PURE__*/ _jsx("p", {
                className: "admin-ok-note",
                children: copy.runtimeHealthy
            })
        ]
    });
    const telegramSettingsPanel = /*#__PURE__*/ _jsx(Panel, {
        title: copy.botSettings,
        children: /*#__PURE__*/ _jsxs("form", {
            className: "admin-form",
            onInvalidCapture: (event)=>handleValidationCapture(event, lang),
            onSubmit: submit,
            children: [
                /*#__PURE__*/ _jsxs("label", {
                    children: [
                        t("admin.botUsername"),
                        /*#__PURE__*/ _jsx("input", {
                            defaultValue: settings?.botUsername ?? "",
                            maxLength: 64,
                            name: "botUsername",
                            pattern: "^@?[A-Za-z0-9_]{5,64}$",
                            placeholder: "@fintrack_bot"
                        })
                    ]
                }),
                /*#__PURE__*/ _jsxs("label", {
                    children: [
                        t("admin.botToken"),
                        /*#__PURE__*/ _jsx("input", {
                            autoComplete: "off",
                            maxLength: 160,
                            minLength: 20,
                            name: "botToken",
                            placeholder: "123456:AA...",
                            type: "password"
                        })
                    ]
                }),
                /*#__PURE__*/ _jsxs("label", {
                    children: [
                        t("admin.adminTelegramIds"),
                        /*#__PURE__*/ _jsx("textarea", {
                            defaultValue: settings?.adminTelegramUserIds.join(", ") ?? "",
                            name: "adminTelegramUserIds",
                            placeholder: "123456789, 987654321",
                            rows: 4
                        })
                    ]
                }),
                /*#__PURE__*/ _jsx("small", {
                    className: "form-note",
                    children: t("admin.botTokenNote")
                }),
                /*#__PURE__*/ _jsx("button", {
                    className: "wide",
                    type: "submit",
                    children: t("admin.saveTelegramSettings")
                })
            ]
        })
    });
    const telegramHowItWorksPanel = /*#__PURE__*/ _jsxs(Panel, {
        title: copy.helpTitle,
        children: [
            /*#__PURE__*/ _jsxs("ol", {
                className: "admin-steps",
                children: [
                    /*#__PURE__*/ _jsx("li", {
                        children: t("admin.howOne")
                    }),
                    /*#__PURE__*/ _jsx("li", {
                        children: t("admin.howTwo")
                    }),
                    /*#__PURE__*/ _jsx("li", {
                        children: t("admin.howThree")
                    }),
                    /*#__PURE__*/ _jsx("li", {
                        children: t("admin.howFour")
                    })
                ]
            }),
            /*#__PURE__*/ _jsx("p", {
                className: "form-note",
                children: copy.helpText
            })
        ]
    });
    let content;
    if (section === "adminDashboard") {
        content = /*#__PURE__*/ _jsxs(_Fragment, {
            children: [
                /*#__PURE__*/ _jsxs("section", {
                    className: "admin-overview-grid",
                    children: [
                        workspaceSnapshotPanel,
                        /*#__PURE__*/ _jsx(Panel, {
                            title: copy.alerts,
                            children: /*#__PURE__*/ _jsx(AdminAlertList, {
                                alerts: alerts,
                                emptyText: copy.alertsEmpty
                            })
                        })
                    ]
                }),
                /*#__PURE__*/ _jsxs("section", {
                    className: "admin-grid",
                    children: [
                        /*#__PURE__*/ _jsx(Panel, {
                            className: "span-2",
                            title: copy.attentionUsers,
                            children: /*#__PURE__*/ _jsx(AdminUsersTable, {
                                rows: (usersNeedingAttention.length ? usersNeedingAttention : users).slice(0, 6)
                            })
                        }),
                        /*#__PURE__*/ _jsx(Panel, {
                            title: copy.integrations,
                            children: /*#__PURE__*/ _jsx(AdminIntegrationTable, {
                                rows: (integrationsNeedingAttention.length ? integrationsNeedingAttention : integrations).slice(0, 6)
                            })
                        }),
                        /*#__PURE__*/ _jsx(Panel, {
                            title: copy.jobs,
                            children: /*#__PURE__*/ _jsx(AdminJobsTable, {
                                rows: (jobsNeedingAttention.length ? jobsNeedingAttention : jobs).slice(0, 6)
                            })
                        }),
                        /*#__PURE__*/ _jsx(Panel, {
                            className: "span-2",
                            title: copy.activity,
                            children: /*#__PURE__*/ _jsx(AdminActivityTable, {
                                rows: recentActivity.slice(0, 10)
                            })
                        })
                    ]
                })
            ]
        });
    } else if (section === "adminUsers") {
        content = /*#__PURE__*/ _jsxs(_Fragment, {
            children: [
                /*#__PURE__*/ _jsxs("section", {
                    className: "admin-overview-grid",
                    children: [
                        /*#__PURE__*/ _jsx(Panel, {
                            className: "span-2",
                        title: t("admin.snapshot.users"),
                            children: /*#__PURE__*/ _jsxs("div", {
                                className: "admin-metric-grid admin-metric-grid-five",
                                children: [
                                    /*#__PURE__*/ _jsx(AdminStatCard, {
                                        label: t("admin.metric.totalUsers"),
                                        value: overview?.summary.totalUsers ?? "—"
                                    }),
                                    /*#__PURE__*/ _jsx(AdminStatCard, {
                                        label: t("admin.metric.admins"),
                                        value: overview?.summary.admins ?? "—"
                                    }),
                                    /*#__PURE__*/ _jsx(AdminStatCard, {
                                        label: t("admin.metric.seenToday"),
                                        value: overview?.summary.usersSeenToday ?? "—"
                                    }),
                                    /*#__PURE__*/ _jsx(AdminStatCard, {
                                        label: t("admin.metric.needAttention"),
                                        value: overview?.summary.usersNeedingAttention ?? "—"
                                    }),
                                    /*#__PURE__*/ _jsx(AdminStatCard, {
                                        label: t("admin.metric.telegramLinked"),
                                        value: usersWithTelegram
                                    })
                                ]
                            })
                        }),
                        /*#__PURE__*/ _jsx(Panel, {
                            title: copy.alerts,
                            children: /*#__PURE__*/ _jsx(AdminAlertList, {
                                alerts: alerts,
                                emptyText: copy.alertsEmpty
                            })
                        })
                    ]
                }),
                /*#__PURE__*/ _jsxs("section", {
                    className: "admin-grid",
                    children: [
                        /*#__PURE__*/ _jsx(Panel, {
                            className: "span-2",
                            title: copy.users,
                            children: /*#__PURE__*/ _jsx(AdminUsersTable, {
                                rows: users
                            })
                        }),
                        /*#__PURE__*/ _jsx(Panel, {
                            title: copy.activity,
                            children: /*#__PURE__*/ _jsx(AdminActivityTable, {
                                rows: recentActivity.slice(0, 8)
                            })
                        })
                    ]
                })
            ]
        });
    } else if (section === "adminIntegrations") {
        content = /*#__PURE__*/ _jsxs(_Fragment, {
            children: [
                /*#__PURE__*/ _jsxs("section", {
                    className: "admin-overview-grid",
                    children: [
                        /*#__PURE__*/ _jsx(Panel, {
                            className: "span-2",
                        title: t("admin.snapshot.integrations"),
                            children: /*#__PURE__*/ _jsxs("div", {
                                className: "admin-metric-grid admin-metric-grid-five",
                                children: [
                                    /*#__PURE__*/ _jsx(AdminStatCard, {
                                        label: t("admin.metric.providers"),
                                        value: integrations.length
                                    }),
                                    /*#__PURE__*/ _jsx(AdminStatCard, {
                                        label: t("admin.metric.needAttention"),
                                        value: overview?.summary.integrationsNeedAttention ?? 0
                                    }),
                                    /*#__PURE__*/ _jsx(AdminStatCard, {
                                        label: t("admin.metric.telegramLinked"),
                                        value: usersWithTelegram
                                    }),
                                    /*#__PURE__*/ _jsx(AdminStatCard, {
                                        label: t("admin.metric.configuredKeys"),
                                        value: configuredSettings
                                    }),
                                    /*#__PURE__*/ _jsx(AdminStatCard, {
                                        label: t("admin.metric.botUsers"),
                                        value: settings?.connectedUserCount ?? 0
                                    })
                                ]
                            })
                        }),
                        runtimePanel
                    ]
                }),
                /*#__PURE__*/ _jsxs("section", {
                    className: "admin-grid",
                    children: [
                        /*#__PURE__*/ _jsx(Panel, {
                            className: "span-2",
                            title: copy.integrations,
                            children: /*#__PURE__*/ _jsx(AdminIntegrationTable, {
                                rows: integrations
                            })
                        }),
                        /*#__PURE__*/ _jsx(Panel, {
                            title: copy.alerts,
                            children: /*#__PURE__*/ _jsx(AdminAlertList, {
                                alerts: alerts,
                                emptyText: copy.alertsEmpty
                            })
                        })
                    ]
                })
            ]
        });
    } else if (section === "adminPlatform") {
        content = /*#__PURE__*/ _jsxs(_Fragment, {
            children: [
                /*#__PURE__*/ _jsxs("section", {
                    className: "admin-overview-grid",
                    children: [
                        /*#__PURE__*/ _jsx(Panel, {
                            className: "span-2",
                        title: t("admin.snapshot.platform"),
                            children: /*#__PURE__*/ _jsxs("div", {
                                className: "admin-metric-grid admin-metric-grid-five",
                                children: [
                                    /*#__PURE__*/ _jsx(AdminStatCard, {
                                        label: t("admin.metric.configured"),
                                        value: configuredSettings
                                    }),
                                    /*#__PURE__*/ _jsx(AdminStatCard, {
                                        label: t("admin.metric.activePlans"),
                                        value: overview?.summary.activeSubscriptions ?? 0
                                    }),
                                    /*#__PURE__*/ _jsx(AdminStatCard, {
                                        label: t("admin.metric.sessions"),
                                        value: overview?.summary.activeSessions ?? 0
                                    }),
                                    /*#__PURE__*/ _jsx(AdminStatCard, {
                                        label: t("admin.metric.telegramQueue"),
                                        value: overview?.summary.pendingTelegramNotifications ?? 0
                                    }),
                                    /*#__PURE__*/ _jsx(AdminStatCard, {
                                        label: t("admin.metric.telegramFailed"),
                                        value: overview?.summary.failedTelegramNotifications ?? 0
                                    })
                                ]
                            })
                        }),
                        /*#__PURE__*/ _jsx(Panel, {
                            title: copy.alerts,
                            children: /*#__PURE__*/ _jsx(AdminAlertList, {
                                alerts: alerts,
                                emptyText: copy.alertsEmpty
                            })
                        })
                    ]
                }),
                /*#__PURE__*/ _jsxs("section", {
                    className: "admin-grid",
                    children: [
                        /*#__PURE__*/ _jsx(Panel, {
                            className: "span-2",
                            title: copy.settings,
                            children: /*#__PURE__*/ _jsx(AdminSettingsTable, {
                                rows: settingsRows
                            })
                        }),
                        runtimePanel
                    ]
                })
            ]
        });
    } else if (section === "adminMonitoring") {
        content = /*#__PURE__*/ _jsxs(_Fragment, {
            children: [
                /*#__PURE__*/ _jsxs("section", {
                    className: "admin-overview-grid",
                    children: [
                        /*#__PURE__*/ _jsx(Panel, {
                            className: "span-2",
                        title: t("admin.snapshot.monitoring"),
                            children: /*#__PURE__*/ _jsxs("div", {
                                className: "admin-metric-grid admin-metric-grid-five",
                                children: [
                                    /*#__PURE__*/ _jsx(AdminStatCard, {
                                        label: t("admin.metric.pendingJobs"),
                                        value: overview?.summary.pendingJobs ?? 0
                                    }),
                                    /*#__PURE__*/ _jsx(AdminStatCard, {
                                        label: t("admin.metric.failedJobs"),
                                        value: overview?.summary.failedJobs ?? 0
                                    }),
                                    /*#__PURE__*/ _jsx(AdminStatCard, {
                                        label: t("admin.metric.telegramPending"),
                                        value: overview?.summary.pendingTelegramNotifications ?? 0
                                    }),
                                    /*#__PURE__*/ _jsx(AdminStatCard, {
                                        label: t("admin.metric.telegramFailed"),
                                        value: overview?.summary.failedTelegramNotifications ?? 0
                                    }),
                                    /*#__PURE__*/ _jsx(AdminStatCard, {
                                        label: t("admin.metric.integrationAlerts"),
                                        value: overview?.summary.integrationsNeedAttention ?? 0
                                    })
                                ]
                            })
                        }),
                        /*#__PURE__*/ _jsx(Panel, {
                            title: copy.alerts,
                            children: /*#__PURE__*/ _jsx(AdminAlertList, {
                                alerts: alerts,
                                emptyText: copy.alertsEmpty
                            })
                        })
                    ]
                }),
                /*#__PURE__*/ _jsxs("section", {
                    className: "admin-grid",
                    children: [
                        /*#__PURE__*/ _jsx(Panel, {
                            className: "span-2",
                            title: copy.jobs,
                            children: /*#__PURE__*/ _jsx(AdminJobsTable, {
                                rows: jobs
                            })
                        }),
                        runtimePanel
                    ]
                })
            ]
        });
    } else if (section === "adminActivity") {
        content = /*#__PURE__*/ _jsxs(_Fragment, {
            children: [
                /*#__PURE__*/ _jsxs("section", {
                    className: "admin-overview-grid",
                    children: [
                        /*#__PURE__*/ _jsx(Panel, {
                            className: "span-2",
                        title: t("admin.snapshot.activity"),
                            children: /*#__PURE__*/ _jsxs("div", {
                                className: "admin-metric-grid admin-metric-grid-five",
                                children: [
                                    /*#__PURE__*/ _jsx(AdminStatCard, {
                                        label: t("admin.metric.eventsShown"),
                                        value: recentActivity.length
                                    }),
                                    /*#__PURE__*/ _jsx(AdminStatCard, {
                                        label: t("admin.metric.usersSeenToday"),
                                        value: overview?.summary.usersSeenToday ?? 0
                                    }),
                                    /*#__PURE__*/ _jsx(AdminStatCard, {
                                        label: t("admin.metric.sessions"),
                                        value: overview?.summary.activeSessions ?? 0
                                    }),
                                    /*#__PURE__*/ _jsx(AdminStatCard, {
                                        label: t("admin.metric.needsAttention"),
                                        value: overview?.summary.usersNeedingAttention ?? 0
                                    }),
                                    /*#__PURE__*/ _jsx(AdminStatCard, {
                                        label: t("admin.metric.alerts"),
                                        value: alerts.length
                                    })
                                ]
                            })
                        }),
                        /*#__PURE__*/ _jsx(Panel, {
                            title: copy.alerts,
                            children: /*#__PURE__*/ _jsx(AdminAlertList, {
                                alerts: alerts,
                                emptyText: copy.alertsEmpty
                            })
                        })
                    ]
                }),
                /*#__PURE__*/ _jsxs("section", {
                    className: "admin-grid",
                    children: [
                        /*#__PURE__*/ _jsx(Panel, {
                            className: "span-2",
                            title: copy.activity,
                            children: /*#__PURE__*/ _jsx(AdminActivityTable, {
                                rows: recentActivity
                            })
                        }),
                        /*#__PURE__*/ _jsx(Panel, {
                            title: copy.attentionUsers,
                            children: /*#__PURE__*/ _jsx(AdminUsersTable, {
                                rows: (usersNeedingAttention.length ? usersNeedingAttention : users).slice(0, 6)
                            })
                        })
                    ]
                })
            ]
        });
    } else {
        content = /*#__PURE__*/ _jsxs("section", {
            className: "admin-grid",
            children: [
                runtimePanel,
                /*#__PURE__*/ _jsx(Panel, {
                    title: copy.alerts,
                    children: /*#__PURE__*/ _jsx(AdminAlertList, {
                        alerts: alerts,
                        emptyText: copy.alertsEmpty
                    })
                }),
                telegramSettingsPanel,
                telegramHowItWorksPanel
            ]
        });
    }
    return /*#__PURE__*/ _jsxs(Page, {
        subtitle: pageMeta[section].subtitle,
        title: pageMeta[section].title,
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: "page-actions",
                children: [
                    refreshAction,
                    section === "adminTelegram" ? telegramActions : null
                ]
            }),
            content
        ]
    });
}
function AdminStatCard({ label, value }) {
    return /*#__PURE__*/ _jsxs("div", {
        className: "admin-stat-card",
        children: [
            /*#__PURE__*/ _jsx("small", {
                children: label
            }),
            /*#__PURE__*/ _jsx("strong", {
                children: value
            })
        ]
    });
}
function StatusRow({ label, value }) {
    return /*#__PURE__*/ _jsxs("div", {
        className: "admin-status-row",
        children: [
            /*#__PURE__*/ _jsx("span", {
                children: label
            }),
            /*#__PURE__*/ _jsx("strong", {
                children: value
            })
        ]
    });
}
function AdminAlertList({ alerts, emptyText }) {
    if (!alerts.length) {
        return /*#__PURE__*/ _jsx("p", {
            className: "admin-ok-note",
            children: emptyText
        });
    }
    return /*#__PURE__*/ _jsx("div", {
        className: "admin-alert-list",
        children: alerts.map((alert)=>/*#__PURE__*/ _jsxs("div", {
                className: `admin-alert ${alert.severity}`,
                children: [
                    /*#__PURE__*/ _jsx("div", {
                        className: "admin-alert-icon",
                        children: /*#__PURE__*/ _jsx(Icon, {
                            name: alert.severity === "critical" ? "warning" : alert.severity === "warning" ? "help" : "spark"
                        })
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        children: [
                            /*#__PURE__*/ _jsx("strong", {
                                children: alert.title
                            }),
                            /*#__PURE__*/ _jsx("p", {
                                children: alert.message
                            })
                        ]
                    })
                ]
            }, `${alert.severity}-${alert.title}`))
    });
}
function AdminUsersTable({ rows }) {
    const { t } = useI18n();
    return /*#__PURE__*/ _jsxs("div", {
        className: "wide-table admin-users-table",
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: "wide-head",
                children: [
                    /*#__PURE__*/ _jsx("span", {
                        children: t("admin.table.user")
                    }),
                    /*#__PURE__*/ _jsx("span", {
                        children: t("admin.table.role")
                    }),
                    /*#__PURE__*/ _jsx("span", {
                        children: t("admin.table.plan")
                    }),
                    /*#__PURE__*/ _jsx("span", {
                        children: t("admin.table.region")
                    }),
                    /*#__PURE__*/ _jsx("span", {
                        children: t("admin.table.connection")
                    }),
                    /*#__PURE__*/ _jsx("span", {
                        children: t("admin.table.activity")
                    }),
                    /*#__PURE__*/ _jsx("span", {
                        children: t("admin.table.flags")
                    })
                ]
            }),
            rows.length ? rows.map((row)=>/*#__PURE__*/ _jsxs("div", {
                    className: "wide-row",
                    children: [
                        /*#__PURE__*/ _jsxs("div", {
                            className: "admin-user-cell",
                            children: [
                                /*#__PURE__*/ _jsx("strong", {
                                    children: row.name ?? t("admin.table.noName")
                                }),
                                /*#__PURE__*/ _jsx("small", {
                                    children: row.email
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            className: `pill ${row.role === "OWNER" || row.role === "ADMIN" ? "success" : "neutral"}`,
                            children: row.role
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "admin-user-cell",
                            children: [
                                /*#__PURE__*/ _jsx("strong", {
                                    children: row.planTier
                                }),
                                /*#__PURE__*/ _jsx("small", {
                                    children: row.planStatus
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "admin-user-cell",
                            children: [
                                /*#__PURE__*/ _jsxs("strong", {
                                    children: [
                                        row.locale.toUpperCase(),
                                        " / ",
                                        row.currencyCode
                                    ]
                                }),
                                /*#__PURE__*/ _jsx("small", {
                                    children: row.timezone
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "admin-user-cell",
                            children: [
                                /*#__PURE__*/ _jsxs("strong", {
                                    children: [
                                        row.integrationsConnected,
                                        " інт. / ",
                                        row.accountsCount,
                                        " рах."
                                    ]
                                }),
                                /*#__PURE__*/ _jsx("small", {
                                    children: row.telegramConnected ? t("admin.table.telegramConnected") : t("admin.table.telegramAbsent")
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "admin-user-cell",
                            children: [
                                /*#__PURE__*/ _jsx("strong", {
                                    children: row.lastSeenAt ? formatDateTime(row.lastSeenAt) : t("admin.table.neverLoggedIn")
                                }),
                                /*#__PURE__*/ _jsxs("small", {
                                    children: [
                                        row.activeSessionCount,
                                        t("admin.table.activeSessions")
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsx("div", {
                            className: "admin-flags-cell",
                            children: row.flags.length ? row.flags.map((flag)=>/*#__PURE__*/ _jsx("span", {
                                    className: "pill warning",
                                    children: flag
                                }, flag)) : /*#__PURE__*/ _jsx("span", {
                                className: "pill success",
                                children: t("admin.table.ok")
                            })
                        })
                    ]
                }, row.id)) : /*#__PURE__*/ _jsx("p", {
                className: "admin-empty-note",
                children: t("admin.table.noUsers")
            })
        ]
    });
}
function AdminIntegrationTable({ rows }) {
    const { t } = useI18n();
    return /*#__PURE__*/ _jsxs("div", {
        className: "wide-table admin-integrations-table",
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: "wide-head",
                children: [
                    /*#__PURE__*/ _jsx("span", {
                        children: t("settings.provider")
                    }),
                    /*#__PURE__*/ _jsx("span", {
                        children: t("admin.integ.connected")
                    }),
                    /*#__PURE__*/ _jsx("span", {
                        children: t("admin.integ.attention")
                    }),
                    /*#__PURE__*/ _jsx("span", {
                        children: t("admin.integ.disconnected")
                    }),
                    /*#__PURE__*/ _jsx("span", {
                        children: t("admin.integ.users")
                    }),
                    /*#__PURE__*/ _jsx("span", {
                        children: t("admin.integ.lastSync")
                    })
                ]
            }),
            rows.length ? rows.map((row)=>/*#__PURE__*/ _jsxs("div", {
                    className: "wide-row",
                    children: [
                        /*#__PURE__*/ _jsx("strong", {
                            children: formatProviderName(row.provider)
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            children: row.connected
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            className: row.needsAttention ? "negative" : "",
                            children: row.needsAttention
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            children: row.disconnected
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            children: row.linkedUsers
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            children: row.lastSyncAt ? formatDateTime(row.lastSyncAt) : "—"
                        })
                    ]
                }, row.provider)) : /*#__PURE__*/ _jsx("p", {
                className: "admin-empty-note",
                children: t("admin.integ.empty")
            })
        ]
    });
}
function AdminSettingsTable({ rows }) {
    const { t } = useI18n();
    return /*#__PURE__*/ _jsxs("div", {
        className: "wide-table admin-settings-table",
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: "wide-head",
                children: [
                    /*#__PURE__*/ _jsx("span", {
                        children: t("admin.settings.key")
                    }),
                    /*#__PURE__*/ _jsx("span", {
                        children: t("admin.settings.type")
                    }),
                    /*#__PURE__*/ _jsx("span", {
                        children: t("admin.settings.storage")
                    }),
                    /*#__PURE__*/ _jsx("span", {
                        children: t("admin.settings.state")
                    }),
                    /*#__PURE__*/ _jsx("span", {
                        children: t("admin.settings.updated")
                    })
                ]
            }),
            rows.length ? rows.map((row)=>/*#__PURE__*/ _jsxs("div", {
                    className: "wide-row",
                    children: [
                        /*#__PURE__*/ _jsx("strong", {
                            children: row.key
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            className: `pill ${row.isSecret ? "warning" : "neutral"}`,
                            children: row.isSecret ? "Secret" : "Plain"
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            children: formatStorageLabel(row.storage)
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            className: row.hasValue ? "positive" : "negative",
                            children: row.hasValue ? t("admin.settings.configured") : t("admin.settings.empty")
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            children: formatDateTime(row.updatedAt)
                        })
                    ]
                }, row.key)) : /*#__PURE__*/ _jsx("p", {
                className: "admin-empty-note",
                children: t("admin.settings.noRecords")
            })
        ]
    });
}
function AdminJobsTable({ rows }) {
    const { t } = useI18n();
    return /*#__PURE__*/ _jsxs("div", {
        className: "wide-table admin-jobs-table",
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: "wide-head",
                children: [
                    /*#__PURE__*/ _jsx("span", {
                        children: t("admin.settings.type")
                    }),
                    /*#__PURE__*/ _jsx("span", {
                        children: t("admin.jobs.status")
                    }),
                    /*#__PURE__*/ _jsx("span", {
                        children: t("admin.jobs.retries")
                    }),
                    /*#__PURE__*/ _jsx("span", {
                        children: "Run after"
                    }),
                    /*#__PURE__*/ _jsx("span", {
                        children: t("admin.settings.updated")
                    }),
                    /*#__PURE__*/ _jsx("span", {
                        children: t("admin.jobs.error")
                    })
                ]
            }),
            rows.length ? rows.map((row)=>/*#__PURE__*/ _jsxs("div", {
                    className: "wide-row",
                    children: [
                        /*#__PURE__*/ _jsx("strong", {
                            children: row.type
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            className: `pill ${jobStatusTone(row.status)}`,
                            children: row.status
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            children: row.attempts
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            children: formatDateTime(row.runAfter)
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            children: formatDateTime(row.updatedAt)
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            children: row.lastError ?? "—"
                        })
                    ]
                }, row.id)) : /*#__PURE__*/ _jsx("p", {
                className: "admin-empty-note",
                children: t("admin.jobs.empty")
            })
        ]
    });
}
function AdminActivityTable({ rows }) {
    const { t } = useI18n();
    return /*#__PURE__*/ _jsxs("div", {
        className: "wide-table admin-audit-table",
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: "wide-head",
                children: [
                    /*#__PURE__*/ _jsx("span", {
                        children: t("admin.activity.time")
                    }),
                    /*#__PURE__*/ _jsx("span", {
                        children: t("admin.table.user")
                    }),
                    /*#__PURE__*/ _jsx("span", {
                        children: t("admin.activity.action")
                    }),
                    /*#__PURE__*/ _jsx("span", {
                        children: t("admin.activity.entity")
                    }),
                    /*#__PURE__*/ _jsx("span", {
                        children: "ID"
                    })
                ]
            }),
            rows.length ? rows.map((row)=>/*#__PURE__*/ _jsxs("div", {
                    className: "wide-row",
                    children: [
                        /*#__PURE__*/ _jsx("span", {
                            children: formatDateTime(row.createdAt)
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "admin-user-cell",
                            children: [
                                /*#__PURE__*/ _jsx("strong", {
                                    children: row.actorName ?? "System"
                                }),
                                /*#__PURE__*/ _jsx("small", {
                                    children: row.actorEmail ?? "system@local"
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsx("strong", {
                            children: row.action
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            children: row.entityType ?? "—"
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            children: row.entityId ?? "—"
                        })
                    ]
                }, row.id)) : /*#__PURE__*/ _jsx("p", {
                className: "admin-empty-note",
                children: t("admin.activity.empty")
            })
        ]
    });
}
function formatWebhookStatus(settings) {
    if (!settings) return "Завантаження...";
    if (settings.runtimeMode === "polling") return "Polling (локальний режим)";
    if (settings.webhookStatus === "active") {
        const pending = settings.webhookPendingUpdateCount ?? 0;
        return pending ? `Активний, pending: ${pending}` : "Активний";
    }
    if (settings.webhookStatus === "unknown") return "Стан невідомий";
    return "Ще не активований";
}
function ProfileSettingsForm({ onSave, onUploadAvatar, profile, userName }) {
    const { lang, t } = useI18n();
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    async function handleAvatarChange(event) {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = "";
        if (!file) return;
        setUploadingAvatar(true);
        try {
            await onUploadAvatar(file);
        } finally{
            setUploadingAvatar(false);
        }
    }
    function submit(event) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        void onSave({
            email: String(data.get("email") ?? "").trim(),
            name: String(data.get("name") ?? "").trim(),
            phone: String(data.get("phone") ?? "").trim()
        });
    }
    return /*#__PURE__*/ _jsxs("form", {
        onInvalidCapture: (event)=>handleValidationCapture(event, lang),
        onSubmit: submit,
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: "profile-settings",
                children: [
                    /*#__PURE__*/ _jsxs("label", {
                        className: `avatar-upload${uploadingAvatar ? " is-uploading" : ""}`,
                        children: [
                            /*#__PURE__*/ _jsx("input", {
                                accept: "image/jpeg,image/png,image/webp",
                                "aria-label": t("profile.uploadPhoto"),
                                disabled: uploadingAvatar,
                                onChange: handleAvatarChange,
                                type: "file"
                            }),
                            /*#__PURE__*/ _jsx("img", {
                                alt: t("profile.avatarAlt"),
                                src: profile?.avatarUrl ?? "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=180&q=80"
                            }),
                            /*#__PURE__*/ _jsx("span", {
                                children: uploadingAvatar ? t("profile.uploading") : t("profile.changePhoto")
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        className: "form-grid",
                        children: [
                            /*#__PURE__*/ _jsxs("label", {
                                children: [
                                    t("profile.fullName"),
                                    /*#__PURE__*/ _jsx("input", {
                                        defaultValue: profile?.name ?? userName,
                                        maxLength: 80,
                                        minLength: 2,
                                        name: "name",
                                        required: true
                                    })
                                ]
                            }),
                            /*#__PURE__*/ _jsxs("label", {
                                children: [
                                    "Email",
                                    /*#__PURE__*/ _jsx("input", {
                                        defaultValue: profile?.email ?? "",
                                        maxLength: 120,
                                        name: "email",
                                        required: true,
                                        type: "email"
                                    })
                                ]
                            }),
                            /*#__PURE__*/ _jsxs("label", {
                                children: [
                                    t("profile.phone"),
                                    /*#__PURE__*/ _jsx("input", {
                                        defaultValue: profile?.phone ?? "",
                                        maxLength: 20,
                                        name: "phone",
                                        pattern: "^\\\\+?[0-9()\\\\-\\\\s]{7,20}$",
                                        placeholder: "+380 97 123 45 67"
                                    })
                                ]
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ _jsx("button", {
                className: "wide",
                type: "submit",
                children: t("profile.saveChanges")
            })
        ]
    });
}
function SecuritySettingsPanel({ onChangePassword, onSave, profile }) {
    const { lang, t } = useI18n();
    const security = profile?.security;
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(security?.twoFactorEnabled ?? false);
    const [actionConfirmationEnabled, setActionConfirmationEnabled] = useState(security?.actionConfirmationEnabled ?? true);
    const [autoLogoutMinutes, setAutoLogoutMinutes] = useState(security?.autoLogoutMinutes ?? 30);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordMessage, setPasswordMessage] = useState(null);
    useEffect(()=>{
        setTwoFactorEnabled(security?.twoFactorEnabled ?? false);
        setActionConfirmationEnabled(security?.actionConfirmationEnabled ?? true);
        setAutoLogoutMinutes(security?.autoLogoutMinutes ?? 30);
    }, [
        security?.actionConfirmationEnabled,
        security?.autoLogoutMinutes,
        security?.twoFactorEnabled
    ]);
    async function toggleTwoFactor(nextValue) {
        setTwoFactorEnabled(nextValue);
        await onSave({
            twoFactorEnabled: nextValue
        });
    }
    async function toggleActionConfirmation(nextValue) {
        setActionConfirmationEnabled(nextValue);
        await onSave({
            actionConfirmationEnabled: nextValue
        });
    }
    async function updateAutoLogout(nextValue) {
        setAutoLogoutMinutes(nextValue);
        await onSave({
            autoLogoutMinutes: nextValue
        });
    }
    async function submitPassword(event) {
        event.preventDefault();
        setPasswordMessage(null);
        if (!newPassword.trim() || newPassword.trim().length < 8) {
            const msg = t("password.tooShort");
            setPasswordMessage(msg);
            emitAppToast(msg, "error");
            return;
        }
        if (security?.hasPassword && !currentPassword.trim()) {
            const message = t("password.enterCurrent");
            setPasswordMessage(message);
            emitAppToast(message, "error");
            return;
        }
        if (newPassword !== confirmPassword) {
            const msg = t("password.confirmMismatch");
            setPasswordMessage(msg);
            emitAppToast(msg, "error");
            return;
        }
        try {
            await onChangePassword({
                currentPassword: currentPassword.trim() || undefined,
                newPassword
            });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setPasswordMessage(t("security.passwordUpdated"));
        } catch (error) {
            setPasswordMessage(error instanceof Error ? error.message : t("security.passwordError"));
        }
    }
    const passwordLabel = security?.hasPassword ? t("security.changePassword") : t("security.createPassword");
    const passwordDateText = security?.passwordChangedAt ? formatDate(security.passwordChangedAt) : t("security.neverChanged");
    return /*#__PURE__*/ _jsxs("div", {
        className: "security-settings",
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: "security-header",
                children: [
                    /*#__PURE__*/ _jsx("strong", {
                        children: passwordLabel
                    }),
                    /*#__PURE__*/ _jsxs("small", {
                        children: [
                            t("security.lastChanged"),
                            passwordDateText
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("form", {
                className: "security-password-form",
                onInvalidCapture: (event)=>handleValidationCapture(event, lang),
                onSubmit: submitPassword,
                children: [
                    security?.hasPassword ? /*#__PURE__*/ _jsxs("label", {
                        children: [
                            t("security.currentPassword"),
                            /*#__PURE__*/ _jsx("input", {
                                name: "currentPassword",
                                onChange: (event)=>setCurrentPassword(event.target.value),
                                type: "password",
                                value: currentPassword
                            })
                        ]
                    }) : null,
                    /*#__PURE__*/ _jsxs("label", {
                        children: [
                            t("security.newPassword"),
                            /*#__PURE__*/ _jsx("input", {
                                maxLength: 128,
                                minLength: 8,
                                name: "newPassword",
                                onChange: (event)=>setNewPassword(event.target.value),
                                required: true,
                                type: "password",
                                value: newPassword
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("label", {
                        children: [
                            t("security.confirmPassword"),
                            /*#__PURE__*/ _jsx("input", {
                                maxLength: 128,
                                minLength: 8,
                                name: "confirmPassword",
                                onChange: (event)=>setConfirmPassword(event.target.value),
                                required: true,
                                type: "password",
                                value: confirmPassword
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsx("button", {
                        className: "secondary-button",
                        type: "submit",
                        children: passwordLabel
                    }),
                    passwordMessage ? /*#__PURE__*/ _jsx("small", {
                        children: passwordMessage
                    }) : null
                ]
            }),
            /*#__PURE__*/ _jsx(ToggleRow, {
                enabled: twoFactorEnabled,
                label: t("security.twoFactor"),
                onChange: (enabled)=>void toggleTwoFactor(enabled),
                text: t("security.twoFactorHint")
            }),
            /*#__PURE__*/ _jsx(ToggleRow, {
                enabled: actionConfirmationEnabled,
                label: t("security.actionConfirm"),
                onChange: (enabled)=>void toggleActionConfirmation(enabled),
                text: t("security.actionConfirmHint")
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "security-select-row",
                children: [
                    /*#__PURE__*/ _jsxs("div", {
                        children: [
                            /*#__PURE__*/ _jsx("strong", {
                                children: t("security.autoLogout")
                            }),
                            /*#__PURE__*/ _jsx("small", {
                                children: t("security.autoLogoutHint")
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsx("select", {
                        name: "autoLogoutMinutes",
                        onChange: (event)=>void updateAutoLogout(Number(event.target.value)),
                        value: autoLogoutMinutes,
                        children: [
                            {
                                label: t("security.5min"),
                                value: 5
                            },
                            {
                                label: t("security.10min"),
                                value: 10
                            },
                            {
                                label: t("security.15min"),
                                value: 15
                            },
                            {
                                label: t("security.30min"),
                                value: 30
                            },
                            {
                                label: t("security.1hour"),
                                value: 60
                            },
                            {
                                label: t("security.2hours"),
                                value: 120
                            },
                            {
                                label: t("security.4hours"),
                                value: 240
                            },
                            {
                                label: t("security.8hours"),
                                value: 480
                            },
                            {
                                label: t("security.24hours"),
                                value: 1440
                            }
                        ].map((option)=>/*#__PURE__*/ _jsx("option", {
                                value: option.value,
                                children: option.label
                            }, option.value))
                    })
                ]
            })
        ]
    });
}
function RegionSettingsForm({ onSave, profile }) {
    const { t } = useI18n();
    function submit(event) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        void onSave({
            currencyCode: Number(data.get("currencyCode") ?? 980),
            locale: String(data.get("locale") ?? "uk").trim(),
            timezone: String(data.get("timezone") ?? "Europe/Kyiv").trim()
        });
    }
    return /*#__PURE__*/ _jsxs("form", {
        onSubmit: submit,
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: "form-grid two",
                children: [
                    /*#__PURE__*/ _jsxs("label", {
                        children: [
                            t("settings.currency"),
                            /*#__PURE__*/ _jsx("input", {
                                defaultValue: profile?.currencyCode ?? 980,
                                name: "currencyCode",
                                type: "number"
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("label", {
                        children: [
                            t("settings.language"),
                            /*#__PURE__*/ _jsx("input", {
                                defaultValue: profile?.locale ?? "uk",
                                name: "locale"
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("label", {
                        children: [
                            t("settings.timezone"),
                            /*#__PURE__*/ _jsx("input", {
                                defaultValue: profile?.timezone ?? "Europe/Kyiv",
                                name: "timezone"
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("label", {
                        children: [
                            t("settings.numberFormat"),
                            /*#__PURE__*/ _jsx("input", {
                                disabled: true,
                                readOnly: true,
                                value: "41 234,56"
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ _jsx("button", {
                className: "wide",
                type: "submit",
                children: t("settings.saveChanges")
            })
        ]
    });
}
function LocaleRegionSettingsForm({ onSave, profile }) {
    const { lang, t } = useI18n();
    const currencyOptions = getCurrencyOptions(profile?.currencyCode ?? 980);
    const localeOptions = getLocaleOptions();
    const timeZoneOptions = getTimeZoneOptions(profile?.timezone ?? "Europe/Kyiv");
    const numberFormatOptions = getNumberFormatOptions();
    function submit(event) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        void onSave({
            currencyCode: Number(data.get("currencyCode") ?? profile?.currencyCode ?? 980),
            locale: String(data.get("locale") ?? profile?.locale ?? "uk").trim(),
            numberFormat: String(data.get("numberFormat") ?? profile?.numberFormat ?? "SPACE_COMMA").trim(),
            timezone: String(data.get("timezone") ?? profile?.timezone ?? "Europe/Kyiv").trim()
        });
    }
    return /*#__PURE__*/ _jsxs("form", {
        onInvalidCapture: (event)=>handleValidationCapture(event, lang),
        onSubmit: submit,
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: "form-grid two",
                children: [
                    /*#__PURE__*/ _jsxs("label", {
                        children: [
                            t("settings.currency"),
                            /*#__PURE__*/ _jsx("select", {
                                defaultValue: String(profile?.currencyCode ?? 980),
                                name: "currencyCode",
                                children: currencyOptions.map((option)=>/*#__PURE__*/ _jsx("option", {
                                        value: option.value,
                                        children: option.label
                                    }, option.value))
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("label", {
                        children: [
                            t("settings.language"),
                            /*#__PURE__*/ _jsx("select", {
                                defaultValue: profile?.locale ?? "uk",
                                name: "locale",
                                children: localeOptions.map((option)=>/*#__PURE__*/ _jsx("option", {
                                        value: option.value,
                                        children: option.label
                                    }, option.value))
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("label", {
                        children: [
                            t("settings.timezone"),
                            /*#__PURE__*/ _jsx("select", {
                                defaultValue: profile?.timezone ?? "Europe/Kyiv",
                                name: "timezone",
                                children: timeZoneOptions.map((option)=>/*#__PURE__*/ _jsx("option", {
                                        value: option.value,
                                        children: option.label
                                    }, option.value))
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("label", {
                        children: [
                            t("settings.numberFormat"),
                            /*#__PURE__*/ _jsx("select", {
                                defaultValue: profile?.numberFormat ?? "SPACE_COMMA",
                                name: "numberFormat",
                                children: numberFormatOptions.map((option)=>/*#__PURE__*/ _jsx("option", {
                                        value: option.value,
                                        children: option.label
                                    }, option.value))
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ _jsx("button", {
                className: "wide",
                type: "submit",
                children: t("settings.saveChanges")
            })
        ]
    });
}
function SecretVaultPanel({ onRevoke, onSave, secrets }) {
    const { lang, t } = useI18n();
    function submit(event) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        void onSave({
            keyName: String(data.get("keyName") ?? "").trim(),
            label: String(data.get("label") ?? "").trim(),
            provider: String(data.get("provider") ?? "").trim(),
            value: String(data.get("value") ?? "")
        });
        event.currentTarget.reset();
    }
    return /*#__PURE__*/ _jsxs("div", {
        className: "secret-vault",
        children: [
            /*#__PURE__*/ _jsxs("form", {
                className: "form-grid",
                onInvalidCapture: (event)=>handleValidationCapture(event, lang),
                onSubmit: submit,
                children: [
                    /*#__PURE__*/ _jsxs("div", {
                        className: "form-grid two",
                        children: [
                            /*#__PURE__*/ _jsxs("label", {
                                children: [
                                    t("settings.provider"),
                                    /*#__PURE__*/ _jsxs("select", {
                                        defaultValue: "OPENAI",
                                        name: "provider",
                                        children: [
                                            /*#__PURE__*/ _jsx("option", {
                                                value: "OPENAI",
                                                children: "OpenAI"
                                            }),
                                            /*#__PURE__*/ _jsx("option", {
                                                value: "MONOBANK",
                                                children: "Monobank"
                                            }),
                                            /*#__PURE__*/ _jsx("option", {
                                                value: "GOOGLE_SHEETS",
                                                children: "Google Sheets"
                                            })
                                        ]
                                    })
                                ]
                            }),
                            /*#__PURE__*/ _jsxs("label", {
                                children: [
                                    t("settings.keyLabel"),
                                    /*#__PURE__*/ _jsxs("select", {
                                        defaultValue: "OPENAI_API_KEY",
                                        name: "keyName",
                                        children: [
                                            /*#__PURE__*/ _jsx("option", {
                                                value: "OPENAI_API_KEY",
                                                children: "OPENAI_API_KEY"
                                            }),
                                            /*#__PURE__*/ _jsx("option", {
                                                value: "MONOBANK_TOKEN",
                                                children: "MONOBANK_TOKEN"
                                            }),
                                            /*#__PURE__*/ _jsx("option", {
                                                value: "GOOGLE_SERVICE_ACCOUNT_JSON",
                                                children: "GOOGLE_SERVICE_ACCOUNT_JSON"
                                            }),
                                            /*#__PURE__*/ _jsx("option", {
                                                value: "GOOGLE_SHEETS_SPREADSHEET_ID",
                                                children: "GOOGLE_SHEETS_SPREADSHEET_ID"
                                            })
                                        ]
                                    })
                                ]
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("label", {
                        children: [
                            t("settings.keyName"),
                            /*#__PURE__*/ _jsx("input", {
                                maxLength: 60,
                                name: "label",
                                placeholder: t("settings.keyPlaceholder")
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("label", {
                        children: [
                            t("settings.keyValue"),
                            /*#__PURE__*/ _jsx("input", {
                                minLength: 3,
                                name: "value",
                                placeholder: "sk-... / JSON / spreadsheet id",
                                required: true,
                                type: "password"
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsx("button", {
                        className: "wide",
                        type: "submit",
                        children: t("settings.saveSecret")
                    })
                ]
            }),
            /*#__PURE__*/ _jsx("div", {
                className: "secret-list",
                children: secrets.length ? secrets.map((secret)=>/*#__PURE__*/ _jsxs("div", {
                        className: "secret-row",
                        children: [
                            /*#__PURE__*/ _jsxs("div", {
                                children: [
                                    /*#__PURE__*/ _jsx("strong", {
                                        children: secret.label || secret.keyName
                                    }),
                                    /*#__PURE__*/ _jsxs("small", {
                                        children: [
                                            secret.provider,
                                            " \xb7 ",
                                            secret.keyName
                                        ]
                                    }),
                                    /*#__PURE__*/ _jsx("small", {
                                        children: secret.revokedAt ? "Відкликано" : secret.lastUsedAt ? `Останнє використання: ${formatDate(secret.lastUsedAt)}` : "Ще не використовувався"
                                    })
                                ]
                            }),
                            /*#__PURE__*/ _jsx("button", {
                                className: "ghost-button",
                                onClick: ()=>void onRevoke(secret.provider, secret.keyName),
                                type: "button",
                                children: t("settings.revoke")
                            })
                        ]
                    }, `${secret.provider}-${secret.keyName}`)) : /*#__PURE__*/ _jsx("p", {
                    className: "muted",
                    children: t("settings.noSecrets")
                })
            })
        ]
    });
}
function PrivacyPanel({ onDeleteAccount, onExportData }) {
    const { t } = useI18n();
    return /*#__PURE__*/ _jsxs("div", {
        className: "privacy-panel",
        children: [
            /*#__PURE__*/ _jsx(CompactList, {
                items: [
                    t("settings.exportData"),
                    t("settings.deleteAccount"),
                    t("settings.sessionsCleared"),
                    t("settings.keysEncrypted")
                ]
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "privacy-actions",
                children: [
                    /*#__PURE__*/ _jsx("button", {
                        className: "secondary-button",
                        onClick: onExportData,
                        type: "button",
                        children: t("settings.exportBtn")
                    }),
                    /*#__PURE__*/ _jsx("button", {
                        className: "danger-button",
                        onClick: ()=>void onDeleteAccount(),
                        type: "button",
                        children: t("settings.deleteBtn")
                    })
                ]
            })
        ]
    });
}
function notificationRows(saved, t) {
    const savedMap = new Map((saved ?? []).map((item)=>[
            item.key,
            item.enabled
        ]));
    return [
        {
            key: "expense_alerts",
            label: t("settings.notifExpenses"),
            text: t("settings.notifExpensesHint")
        },
        {
            key: "weekly_report",
            label: t("settings.notifWeekly"),
            text: t("settings.notifWeeklyHint")
        },
        {
            key: "budget_reminders",
            label: t("settings.notifBudgets"),
            text: t("settings.notifBudgetsHint")
        },
        {
            key: "goal_progress",
            label: t("settings.notifGoals"),
            text: t("settings.notifGoalsHint")
        },
        {
            key: "marketing",
            label: t("settings.notifMarketing"),
            text: t("settings.notifMarketingHint")
        }
    ].map((row)=>({
            ...row,
            enabled: savedMap.get(row.key) ?? row.key !== "marketing"
        }));
}
function ProfileMenu({ avatarUrl, compact = false, menuRef, onLogout, onOpenProfile, open, planLabel, profileLabel, showProfileAction, logoutLabel, setOpen, userName }) {
    const { t } = useI18n();
    return /*#__PURE__*/ _jsxs("div", {
        className: compact ? "profile-menu-shell compact" : "profile-menu-shell",
        ref: menuRef,
        children: [
            /*#__PURE__*/ _jsxs("button", {
                "aria-expanded": open,
                "aria-haspopup": "menu",
                className: compact ? "mobile-avatar-link profile-trigger compact" : "profile profile-trigger",
                onClick: ()=>setOpen(!open),
                type: "button",
                children: [
                    /*#__PURE__*/ _jsx("img", {
                        alt: t("ui.profilePhoto"),
                        src: avatarUrl
                    }),
                    compact ? null : /*#__PURE__*/ _jsxs(_Fragment, {
                        children: [
                            /*#__PURE__*/ _jsxs("div", {
                                children: [
                                    /*#__PURE__*/ _jsx("strong", {
                                        children: userName
                                    }),
                                    /*#__PURE__*/ _jsx("small", {
                                        children: planLabel
                                    })
                                ]
                            }),
                            /*#__PURE__*/ _jsx("span", {
                                className: "profile-trigger-icon",
                                children: /*#__PURE__*/ _jsx(Icon, {
                                    name: "arrowDown"
                                })
                            })
                        ]
                    })
                ]
            }),
            open ? /*#__PURE__*/ _jsxs("div", {
                "aria-label": t("ui.profileMenu"),
                className: "profile-popover",
                role: "menu",
                children: [
                    showProfileAction === false ? null : /*#__PURE__*/ _jsxs("button", {
                        className: "profile-menu-item",
                        onClick: ()=>{
                            setOpen(false);
                            onOpenProfile();
                        },
                        type: "button",
                        children: [
                            /*#__PURE__*/ _jsx(Icon, {
                                name: "user"
                            }),
                            profileLabel
                        ]
                    }),
                    /*#__PURE__*/ _jsx("button", {
                        className: "profile-menu-item logout",
                        onClick: ()=>{
                            setOpen(false);
                            void onLogout();
                        },
                        type: "button",
                        children: logoutLabel
                    })
                ]
            }) : null
        ]
    });
}
function NotificationBell({ notifications, onMarkAllRead, onMarkRead, open, panelRef, setOpen, unreadCount }) {
    const { t } = useI18n();
    return /*#__PURE__*/ _jsxs("div", {
        className: "notification-shell",
        ref: panelRef,
        children: [
            /*#__PURE__*/ _jsxs("button", {
                className: unreadCount ? "bell bell-button has-unread" : "bell bell-button",
                onClick: ()=>setOpen(!open),
                type: "button",
                children: [
                    /*#__PURE__*/ _jsx(Icon, {
                        name: "bell"
                    }),
                    unreadCount ? /*#__PURE__*/ _jsx("span", {
                        children: unreadCount
                    }) : null
                ]
            }),
            open ? /*#__PURE__*/ _jsxs("div", {
                className: "notification-popover",
                children: [
                    /*#__PURE__*/ _jsxs("div", {
                        className: "notification-head",
                        children: [
                            /*#__PURE__*/ _jsx("strong", {
                                children: t("notif.title")
                            }),
                            /*#__PURE__*/ _jsx("button", {
                                className: "tiny-action",
                                onClick: ()=>void onMarkAllRead(),
                                type: "button",
                                children: t("notif.markAll")
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsx("div", {
                        className: "notification-list",
                        children: notifications.length ? notifications.map((notification)=>/*#__PURE__*/ _jsxs("button", {
                                className: notification.isRead ? "notification-item" : "notification-item unread",
                                onClick: ()=>void onMarkRead(notification.id, notification.actionUrl),
                                type: "button",
                                children: [
                                    /*#__PURE__*/ _jsx("span", {
                                        className: `notification-icon ${notification.severity ?? "info"}`,
                                        children: /*#__PURE__*/ _jsx(Icon, {
                                            name: notificationIcon(notification.severity)
                                        })
                                    }),
                                    /*#__PURE__*/ _jsxs("div", {
                                        children: [
                                            /*#__PURE__*/ _jsx("strong", {
                                                children: notification.title
                                            }),
                                            /*#__PURE__*/ _jsx("p", {
                                                children: notification.message
                                            }),
                                            /*#__PURE__*/ _jsx("small", {
                                                children: formatDateTime(notification.createdAt)
                                            })
                                        ]
                                    })
                                ]
                            }, notification.id)) : /*#__PURE__*/ _jsx("p", {
                            className: "muted",
                            children: t("notif.empty")
                        })
                    })
                ]
            }) : null
        ]
    });
}
function Page({ children, className = "", subtitle, title }) {
    return /*#__PURE__*/ _jsxs("section", {
        className: `app-page ${className}`.trim(),
        children: [
            /*#__PURE__*/ _jsx("div", {
                className: "page-head",
                children: /*#__PURE__*/ _jsxs("div", {
                    children: [
                        /*#__PURE__*/ _jsx("h1", {
                            children: title
                        }),
                        subtitle ? /*#__PURE__*/ _jsx("p", {
                            children: subtitle
                        }) : null
                    ]
                })
            }),
            children
        ]
    });
}
function IndicatorTooltip({ text }) {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({
        left: 0,
        top: 0
    });
    const triggerRef = useRef(null);
    const syncPosition = ()=>{
        const trigger = triggerRef.current;
        if (!trigger) return;
        const rect = trigger.getBoundingClientRect();
        setPosition({
            left: rect.left + rect.width / 2,
            top: rect.top - 10
        });
    };
    useEffect(()=>{
        if (!open) return;
        syncPosition();
        const handleWindowChange = ()=>syncPosition();
        window.addEventListener("scroll", handleWindowChange, true);
        window.addEventListener("resize", handleWindowChange);
        return ()=>{
            window.removeEventListener("scroll", handleWindowChange, true);
            window.removeEventListener("resize", handleWindowChange);
        };
    }, [
        open
    ]);
    return text ? /*#__PURE__*/ _jsxs("span", {
        className: "indicator-tooltip",
        style: {
            display: "inline-flex",
            position: "relative",
            verticalAlign: "middle"
        },
        children: [
            /*#__PURE__*/ _jsx("button", {
                "aria-label": text,
                className: "indicator-tooltip-trigger",
                ref: triggerRef,
                onBlur: ()=>setOpen(false),
                onFocus: ()=>{
                    syncPosition();
                    setOpen(true);
                },
                onMouseEnter: ()=>{
                    syncPosition();
                    setOpen(true);
                },
                onMouseLeave: ()=>setOpen(false),
                type: "button",
                children: /*#__PURE__*/ _jsx(Icon, {
                    name: "help"
                })
            }),
            open && typeof document !== "undefined" ? createPortal(/*#__PURE__*/ _jsx("span", {
                className: "indicator-tooltip-portal",
                role: "tooltip",
                style: {
                    left: position.left,
                    top: position.top
                },
                children: text
            }), document.body) : null
        ]
    }) : null;
}
function Panel({ action, actionNode, children, className = "", onMore, title, titleTooltip }) {
    const { t } = useI18n();
    return /*#__PURE__*/ _jsxs("section", {
        className: `finance-panel ${className}`,
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: "panel-title",
                children: [
                    /*#__PURE__*/ _jsxs("div", {
                        className: "panel-title-copy",
                        children: [
                            /*#__PURE__*/ _jsx("h2", {
                                children: title
                            }),
                            /*#__PURE__*/ _jsx(IndicatorTooltip, {
                                text: titleTooltip
                            })
                        ]
                    }),
                    actionNode || action || onMore ? /*#__PURE__*/ _jsx("span", {
                        children: actionNode ? actionNode : action ? /*#__PURE__*/ _jsx(CalendarButton, {
                            className: "panel-calendar-button",
                            value: action
                        }) : onMore ? /*#__PURE__*/ _jsx("button", {
                            "aria-label": t("ui.actions"),
                            className: "icon-button",
                            onClick: onMore,
                            type: "button",
                            children: /*#__PURE__*/ _jsx(Icon, {
                                name: "more"
                            })
                        }) : null
                    }) : null
                ]
            }),
            children
        ]
    });
}
function MetricCard({ accent, icon, label, suffix, tooltip, trend, value }) {
    return /*#__PURE__*/ _jsxs("article", {
        className: "metric-card",
        children: [
            /*#__PURE__*/ _jsxs("div", {
                children: [
                    /*#__PURE__*/ _jsxs("div", {
                        className: "metric-card-header",
                        children: [
                            /*#__PURE__*/ _jsx("span", {
                                children: label
                            }),
                            /*#__PURE__*/ _jsx(IndicatorTooltip, {
                                text: tooltip
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsx("strong", {
                        children: suffix ?? (value ? formatMoney(value) : "—")
                    }),
                    /*#__PURE__*/ _jsx("small", {
                        className: trend.startsWith("-") ? "down" : "up",
                        children: trend
                    })
                ]
            }),
            /*#__PURE__*/ _jsx("i", {
                className: `metric-icon ${accent}`,
                children: /*#__PURE__*/ _jsx(Icon, {
                    name: icon
                })
            })
        ]
    });
}
function CategoryPanel({ allAccounts, allExpenses, categories, className = "", title, titleTooltip, total }) {
    const { t } = useI18n();
    const [detailsOpen, setDetailsOpen] = useState(false);
    const chartCategories = categories.filter((category)=>Number(category.total) > 0);
    return /*#__PURE__*/ _jsxs(Panel, {
        className: `category-panel ${className}`.trim(),
        title: title,
        titleTooltip: titleTooltip,
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: "donut-layout",
                children: [
                    /*#__PURE__*/ _jsxs("div", {
                        className: "donut-chart",
                        children: [
                            /*#__PURE__*/ _jsx(ResponsiveContainer, {
                                height: 220,
                                width: "100%",
                                children: /*#__PURE__*/ _jsxs(PieChart, {
                                    children: [
                                        /*#__PURE__*/ _jsx(Pie, {
                                            data: chartCategories,
                                            dataKey: "total",
                                            innerRadius: 64,
                                            nameKey: "name",
                                            outerRadius: 96,
                                            paddingAngle: 1,
                                            children: chartCategories.map((category)=>/*#__PURE__*/ _jsx(Cell, {
                                                    fill: category.color
                                                }, category.name))
                                        }),
                                        /*#__PURE__*/ _jsx(Tooltip, {
                                            formatter: (value)=>formatMoney(Number(value))
                                        })
                                    ]
                                })
                            }),
                            /*#__PURE__*/ _jsxs("div", {
                                className: "donut-center",
                                children: [
                                    /*#__PURE__*/ _jsx("strong", {
                                        children: formatMoney(total)
                                    }),
                                    /*#__PURE__*/ _jsx("small", {
                                        children: t("ui.total")
                                    })
                                ]
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsx("div", {
                        className: "category-list",
                        children: chartCategories.slice(0, 6).map((category)=>/*#__PURE__*/ _jsx(CategoryLine, {
                                category: category,
                                total: total
                            }, category.name))
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("button", {
                className: "ghost-button",
                onClick: ()=>setDetailsOpen(true),
                type: "button",
                children: [
                    t("ui.viewDetails"),
                    /*#__PURE__*/ _jsx(Icon, {
                        name: "chevronRight"
                    })
                ]
            }),
            detailsOpen ? /*#__PURE__*/ _jsx(CategoryDetailsModal, {
                allAccounts: allAccounts,
                allExpenses: allExpenses,
                categories: chartCategories,
                onClose: ()=>setDetailsOpen(false),
                title: title,
                total: total
            }) : null
        ]
    });
}
function AppModal({ children, className = "", onClose, title, wide = false }) {
    const { t } = useI18n();
    useEffect(()=>{
        const closeOnEscape = (event)=>{
            if (event.key === "Escape") onClose();
        };
        document.addEventListener("keydown", closeOnEscape);
        return ()=>document.removeEventListener("keydown", closeOnEscape);
    }, [
        onClose
    ]);
    return /*#__PURE__*/ _jsx("div", {
        className: "modal-backdrop app-modal-backdrop",
        onMouseDown: (event)=>{
            if (event.target === event.currentTarget) onClose();
        },
        children: /*#__PURE__*/ _jsxs("section", {
            "aria-modal": "true",
            className: `app-modal ${wide ? "wide" : ""} ${className}`,
            role: "dialog",
            children: [
                /*#__PURE__*/ _jsxs("div", {
                    className: "modal-head",
                    children: [
                        /*#__PURE__*/ _jsx("h2", {
                            children: title
                        }),
                        /*#__PURE__*/ _jsx("button", {
                            "aria-label": t("ui.close"),
                            className: "icon-button modal-close",
                            onClick: onClose,
                            type: "button",
                            children: /*#__PURE__*/ _jsx(Icon, {
                                name: "close"
                            })
                        })
                    ]
                }),
                children
            ]
        })
    });
}
function CategoryDetailsModal({ allAccounts, allExpenses, categories, onClose, title, total }) {
    const { lang, t } = useI18n();
    // Build available months from raw expenses (if provided)
    const monthOptions = useMemo(()=>{
        if (!allExpenses || !allExpenses.length) return [];
        const seen = new Map();
        [...allExpenses].sort((a, b)=>new Date(b.date).getTime() - new Date(a.date).getTime()).forEach((expense)=>{
            const d = new Date(expense.date);
            const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
            if (!seen.has(key)) seen.set(key, { key, date: new Date(d.getFullYear(), d.getMonth(), 1), label: formatMonthLabel(new Date(d.getFullYear(), d.getMonth(), 1), lang) });
        });
        return Array.from(seen.values());
    }, [allExpenses, lang]);
    const defaultMonthKey = monthOptions.length ? monthOptions[0].key : "";
    const [selectedMonthKey, setSelectedMonthKey] = useState(defaultMonthKey);
    const [selectedAccount, setSelectedAccount] = useState("all");
    const [monthMenuOpen, setMonthMenuOpen] = useState(false);
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    // When allExpenses change, reset to latest month
    useEffect(()=>{
        if (defaultMonthKey) setSelectedMonthKey(defaultMonthKey);
    }, [defaultMonthKey]);
    const activeMonth = monthOptions.find((m)=>m.key === selectedMonthKey) ?? monthOptions[0];
    // Compute display categories: either filtered from allExpenses or use passed categories
    const { displayCategories, displayTotal } = useMemo(()=>{
        if (!allExpenses || !allExpenses.length || !activeMonth) {
            const sorted = [...categories].sort((a, b)=>b.total - a.total).filter((c)=>Number(c.total) > 0);
            return { displayCategories: sorted, displayTotal: total };
        }
        const range = monthRangeFromDate(activeMonth.date);
        const filtered = allExpenses.filter((expense)=>{
            const matchesPeriod = matchesDateRange(expense.date, range);
            if (!matchesPeriod) return false;
            if (selectedAccount === "all") return true;
            const acctRecord = allAccounts?.find((a)=>a.id === selectedAccount || a.name === selectedAccount);
            return expense.accountId === selectedAccount || expense.account === selectedAccount || (acctRecord && expense.account === acctRecord.name);
        });
        const grouped = groupCategoriesFromExpenses(filtered, categories).filter((c)=>c.total > 0);
        const t2 = grouped.reduce((s, c)=>s + c.total, 0);
        return { displayCategories: grouped, displayTotal: t2 };
    }, [allExpenses, allAccounts, activeMonth, selectedAccount, categories, total]);
    const sortedCategories = displayCategories;
    const topCategory = sortedCategories[0];
    const topPercent = displayTotal && topCategory ? Math.round(topCategory.total / displayTotal * 1000) / 10 : 0;
    const accountOptions = useMemo(()=>[
        { label: t("filters.allAccounts"), value: "all" },
        ...(allAccounts ?? []).map((a)=>({ label: a.name, value: a.id }))
    ], [allAccounts, t]);
    const activeAccountLabel = accountOptions.find((o)=>o.value === selectedAccount)?.label ?? t("filters.allAccounts");
    const activeMonthLabel = activeMonth?.label ?? title;
    useEffect(()=>{
        const closeOnEscape = (event)=>{
            if (event.key === "Escape") onClose();
        };
        document.addEventListener("keydown", closeOnEscape);
        return ()=>document.removeEventListener("keydown", closeOnEscape);
    }, [
        onClose
    ]);
    return /*#__PURE__*/ _jsx("div", {
        className: "modal-backdrop app-modal-backdrop",
        onMouseDown: (event)=>{
            if (event.target === event.currentTarget) onClose();
        },
        children: /*#__PURE__*/ _jsxs("section", {
            "aria-modal": "true",
            className: "app-modal wide category-detail-modal",
            role: "dialog",
            children: [
                /*#__PURE__*/ _jsxs("div", {
                    className: "cdm-header",
                    children: [
                        /*#__PURE__*/ _jsxs("div", {
                            className: "cdm-header-left",
                            children: [
                                /*#__PURE__*/ _jsx("span", {
                                    className: "cdm-header-icon",
                                    children: /*#__PURE__*/ _jsx(Icon, { name: "chart" })
                                }),
                                /*#__PURE__*/ _jsxs("div", {
                                    children: [
                                        /*#__PURE__*/ _jsx("h2", { children: title }),
                                        /*#__PURE__*/ _jsx("p", { children: t("category.expenseBreakdown") })
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsx("button", {
                            "aria-label": t("ui.close"),
                            className: "icon-button modal-close",
                            onClick: onClose,
                            type: "button",
                            children: /*#__PURE__*/ _jsx(Icon, { name: "close" })
                        })
                    ]
                }),
                /*#__PURE__*/ _jsxs("div", {
                    className: "cdm-filters",
                    children: [
                        /*#__PURE__*/ _jsxs("div", {
                            className: "cdm-filter-wrap",
                            children: [
                                /*#__PURE__*/ _jsxs("button", {
                                    className: "cdm-filter-btn",
                                    onClick: ()=>{ setMonthMenuOpen((v)=>!v); setAccountMenuOpen(false); },
                                    type: "button",
                                    children: [
                                        /*#__PURE__*/ _jsx(Icon, { name: "calendar" }),
                                        activeMonthLabel,
                                        /*#__PURE__*/ _jsx(Icon, { name: "chevronDown" })
                                    ]
                                }),
                                monthMenuOpen && monthOptions.length ? /*#__PURE__*/ _jsx("div", {
                                    className: "cdm-dropdown",
                                    children: monthOptions.map((m)=>/*#__PURE__*/ _jsx("button", {
                                        className: `cdm-dropdown-item${m.key === selectedMonthKey ? " active" : ""}`,
                                        onClick: ()=>{ setSelectedMonthKey(m.key); setMonthMenuOpen(false); },
                                        type: "button",
                                        children: m.label
                                    }, m.key))
                                }) : null
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "cdm-filter-wrap",
                            children: [
                                /*#__PURE__*/ _jsxs("button", {
                                    className: "cdm-filter-btn",
                                    onClick: ()=>{ setAccountMenuOpen((v)=>!v); setMonthMenuOpen(false); },
                                    type: "button",
                                    children: [
                                        /*#__PURE__*/ _jsx(Icon, { name: "wallet" }),
                                        activeAccountLabel,
                                        /*#__PURE__*/ _jsx(Icon, { name: "chevronDown" })
                                    ]
                                }),
                                accountMenuOpen && accountOptions.length > 1 ? /*#__PURE__*/ _jsx("div", {
                                    className: "cdm-dropdown",
                                    children: accountOptions.map((o)=>/*#__PURE__*/ _jsx("button", {
                                        className: `cdm-dropdown-item${o.value === selectedAccount ? " active" : ""}`,
                                        onClick: ()=>{ setSelectedAccount(o.value); setAccountMenuOpen(false); },
                                        type: "button",
                                        children: o.label
                                    }, o.value))
                                }) : null
                            ]
                        })
                    ]
                }),
                /*#__PURE__*/ _jsxs("div", {
                    className: "cdm-body",
                    children: [
                        /*#__PURE__*/ _jsxs("div", {
                            className: "cdm-left",
                            children: [
                                /*#__PURE__*/ _jsxs("div", {
                                    className: "category-detail-chart",
                                    children: [
                                        /*#__PURE__*/ _jsx(ResponsiveContainer, {
                                            height: 280,
                                            width: "100%",
                                            children: /*#__PURE__*/ _jsxs(PieChart, {
                                                children: [
                                                    /*#__PURE__*/ _jsx(Pie, {
                                                        data: sortedCategories,
                                                        dataKey: "total",
                                                        innerRadius: 84,
                                                        nameKey: "name",
                                                        outerRadius: 124,
                                                        paddingAngle: 1,
                                                        children: sortedCategories.map((category)=>/*#__PURE__*/ _jsx(Cell, {
                                                                fill: category.color
                                                            }, category.name))
                                                    }),
                                                    /*#__PURE__*/ _jsx(Tooltip, {
                                                        formatter: (value)=>formatMoney(Number(value))
                                                    })
                                                ]
                                            })
                                        }),
                                        /*#__PURE__*/ _jsxs("div", {
                                            className: "donut-center detail",
                                            children: [
                                                /*#__PURE__*/ _jsx("strong", { children: formatMoney(displayTotal) }),
                                                /*#__PURE__*/ _jsx("small", { children: t("ui.total") })
                                            ]
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ _jsxs("div", {
                                    className: "cdm-stats",
                                    children: [
                                        /*#__PURE__*/ _jsxs("div", {
                                            className: "cdm-stat-chip",
                                            children: [
                                                /*#__PURE__*/ _jsx("span", {
                                                    className: "cdm-stat-icon",
                                                    style: { background: "#3b82f6" },
                                                    children: /*#__PURE__*/ _jsx(Icon, { name: "goals" })
                                                }),
                                                /*#__PURE__*/ _jsxs("div", {
                                                    children: [
                                                        /*#__PURE__*/ _jsx("small", { children: t("category.topCategory") }),
                                                        /*#__PURE__*/ _jsx("strong", { children: topCategory ? topCategory.name : "—" }),
                                                        /*#__PURE__*/ _jsxs("small", { children: [topPercent, "%"] })
                                                    ]
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ _jsxs("div", {
                                            className: "cdm-stat-chip",
                                            children: [
                                                /*#__PURE__*/ _jsx("span", {
                                                    className: "cdm-stat-icon",
                                                    style: { background: "#8b5cf6" },
                                                    children: /*#__PURE__*/ _jsx(Icon, { name: "analytics" })
                                                }),
                                                /*#__PURE__*/ _jsxs("div", {
                                                    children: [
                                                        /*#__PURE__*/ _jsx("small", { children: t("category.categories") }),
                                                        /*#__PURE__*/ _jsx("strong", { children: String(sortedCategories.length) }),
                                                        /*#__PURE__*/ _jsx("small", { children: t("category.groups") })
                                                    ]
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ _jsxs("div", {
                                            className: "cdm-stat-chip",
                                            children: [
                                                /*#__PURE__*/ _jsx("span", {
                                                    className: "cdm-stat-icon",
                                                    style: { background: "#f97316" },
                                                    children: /*#__PURE__*/ _jsx(Icon, { name: "refresh" })
                                                }),
                                                /*#__PURE__*/ _jsxs("div", {
                                                    children: [
                                                        /*#__PURE__*/ _jsx("small", { children: t("admin.settings.updated") }),
                                                        /*#__PURE__*/ _jsx("strong", { children: t("category.justNow") })
                                                    ]
                                                })
                                            ]
                                        })
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "category-detail-list",
                            children: [
                                /*#__PURE__*/ _jsxs("div", {
                                    className: "category-detail-list-head",
                                    children: [
                                        /*#__PURE__*/ _jsx("strong", { children: t("category.categories") }),
                                        /*#__PURE__*/ _jsxs("span", { children: [sortedCategories.length, " ", t("category.groups")] })
                                    ]
                                }),
                                sortedCategories.length ? sortedCategories.map((category)=>/*#__PURE__*/ _jsx(CategoryDetailLine, {
                                        category: category,
                                        total: total
                                    }, category.name)) : /*#__PURE__*/ _jsx("p", {
                                    className: "muted-text",
                                    children: t("category.noExpenses")
                                })
                            ]
                        })
                    ]
                }),
                /*#__PURE__*/ _jsxs("div", {
                    className: "cdm-footer",
                    children: [
                        /*#__PURE__*/ _jsxs("span", {
                            className: "cdm-footer-info",
                            children: [
                                /*#__PURE__*/ _jsx(Icon, { name: "shield" }),
                                t("category.realtimeNote")
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("button", {
                            className: "cdm-export-btn",
                            type: "button",
                            children: [
                                /*#__PURE__*/ _jsx(Icon, { name: "download" }),
                                t("settings.dataExport")
                            ]
                        })
                    ]
                })
            ]
        })
    });
}
function BudgetMiniPanel({ budgets, hasRealBudgets, onNavigate, onOpenModal }) {
    const { t } = useI18n();
    const sortedBudgets = useMemo(() => [
        ...budgets
    ].sort((left, right)=>right.spent - left.spent || right.percent - left.percent || left.category.localeCompare(right.category, "uk")), [
        budgets
    ]);
    return /*#__PURE__*/ _jsxs(Panel, {
        onMore: onOpenModal ? ()=>onOpenModal("budget") : undefined,
        title: t("dashboard.budget"),
        children: [
            /*#__PURE__*/ _jsx("div", {
                className: "budget-list",
                children: sortedBudgets.slice(0, 5).map((budget)=>/*#__PURE__*/ _jsx(BudgetProgress, {
                        budget: budget,
                        onEdit: (onOpenModal && hasRealBudgets) ? (b)=>onOpenModal("budget", b) : undefined
                    }, budget.id))
            }),
            onNavigate ? /*#__PURE__*/ _jsxs("button", {
                className: "ghost-button",
                onClick: ()=>onNavigate("budgets"),
                type: "button",
                children: [
                    t("dashboard.viewBudgets"),
                    " ",
                    /*#__PURE__*/ _jsx(Icon, {
                        name: "chevronRight"
                    })
                ]
            }) : null
        ]
    });
}
function GoalsMiniPanel() {
    const { t } = useI18n();
    return /*#__PURE__*/ _jsx(Panel, {
        title: t("dashboard.goals"),
        children: /*#__PURE__*/ _jsxs("div", {
            className: "goal-row",
            children: [
                /*#__PURE__*/ _jsx("img", {
                    alt: "Морський берег для фінансової цілі",
                    src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=220&q=80"
                }),
                /*#__PURE__*/ _jsxs("div", {
                    children: [
                        /*#__PURE__*/ _jsx("strong", {
                            children: "Відпустка в Греції"
                        }),
                        /*#__PURE__*/ _jsxs("small", {
                            children: [
                                t("goals.savedToGoals") + " ",
                                formatMoney(28500),
                                " з ",
                                formatMoney(60000)
                            ]
                        }),
                        /*#__PURE__*/ _jsx("div", {
                            className: "progress",
                            children: /*#__PURE__*/ _jsx("span", {
                                style: {
                                    width: "48%"
                                }
                            })
                        })
                    ]
                }),
                /*#__PURE__*/ _jsx("button", {
                    className: "add-goal",
                    type: "button",
                    children: t("goals.addFirst").trim()
                })
            ]
        })
    });
}
function TransactionTable({ onSortChange, rows, sortState }) {
    const { t } = useI18n();
    const [columnWidths, setColumnWidths] = useState(defaultDashboardTransactionColumnWidths);
    const gridTemplateColumns = useMemo(()=>dashboardTransactionColumns.map((column)=>`${Math.max(column.minWidth, columnWidths[column.key] ?? column.defaultWidth)}px`).join(" "), [
        columnWidths
    ]);
    function resizeColumn(column, event) {
        event.preventDefault();
        event.stopPropagation();
        const startX = event.clientX;
        const startWidth = columnWidths[column.key] ?? column.defaultWidth;
        const maxWidth = column.key === "description" ? 520 : 260;
        function handlePointerMove(moveEvent) {
            const nextWidth = Math.min(maxWidth, Math.max(column.minWidth, startWidth + moveEvent.clientX - startX));
            setColumnWidths((current)=>({
                    ...current,
                    [column.key]: nextWidth
                }));
        }
        function stopResize() {
            document.body.classList.remove("is-resizing-table");
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", stopResize);
            window.removeEventListener("pointercancel", stopResize);
        }
        document.body.classList.add("is-resizing-table");
        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", stopResize);
        window.addEventListener("pointercancel", stopResize);
    }
    return /*#__PURE__*/ _jsxs("div", {
        className: "transaction-table wide-table",
        children: [
            /*#__PURE__*/ _jsx("div", {
                className: "table-head wide-head resizable-table-head",
                style: {
                    gridTemplateColumns
                },
                children: dashboardTransactionColumns.map((column)=>{
                    const active = sortState.key === column.key;
                    const sortLabel = active ? sortState.direction === "asc" ? t("table.sortAsc") : t("table.sortDesc") : t("table.sortNone");
                    return /*#__PURE__*/ _jsxs("span", {
                        className: column.align === "end" ? "table-head-cell align-end" : "table-head-cell",
                        "aria-sort": active ? sortState.direction === "asc" ? "ascending" : "descending" : "none",
                        children: [
                            /*#__PURE__*/ _jsxs("button", {
                                "aria-label": `${t("table.sortBy")} ${t(column.label)}, ${sortLabel}`,
                                className: active ? "table-sort active" : "table-sort",
                                onClick: ()=>onSortChange(nextDashboardTransactionSort(sortState, column.key)),
                                type: "button",
                                children: [
                                    /*#__PURE__*/ _jsx("span", {
                                        children: t(column.label)
                                    }),
                                    /*#__PURE__*/ _jsx("i", {
                                        "aria-hidden": "true",
                                        children: active ? sortState.direction === "asc" ? "↑" : "↓" : "↕"
                                    })
                                ]
                            }),
                            /*#__PURE__*/ _jsx("span", {
                                "aria-label": `${t("table.resizeCol")} ${t(column.label)}`,
                                className: "column-resizer",
                                onPointerDown: (event)=>resizeColumn(column, event),
                                role: "separator",
                                tabIndex: -1,
                                title: t("table.dragResize")
                            })
                        ]
                    }, column.key);
                })
            }),
            rows.map((expense)=>/*#__PURE__*/ _jsxs("div", {
                    className: "transaction-row wide-row",
                    style: {
                        gridTemplateColumns
                    },
                    children: [
                        /*#__PURE__*/ _jsx("span", {
                            title: formatDateTime(expense.date),
                            children: formatTableDate(expense.date)
                        }),
                        /*#__PURE__*/ _jsxs("span", {
                            className: "category-chip",
                            children: [
                                /*#__PURE__*/ _jsx("i", {
                                    style: {
                                        background: expense.categoryColor ?? "#94a3b8"
                                    },
                                    children: /*#__PURE__*/ _jsx(Icon, {
                                        name: iconForCategory(expense.category, expense.categoryIcon)
                                    })
                                }),
                                expense.category ?? t("tx.noCategory")
                            ]
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            children: expense.description ?? expense.sourceStatus
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            className: "expense-type",
                            children: t("tx.expense")
                        }),
                        /*#__PURE__*/ _jsxs("strong", {
                            className: "negative align-end",
                            children: [
                                "-",
                                formatMoney(expense.amount)
                            ]
                        })
                    ]
                }, expense.id))
        ]
    });
}
function nextDashboardTransactionSort(current, key) {
    if (current.key === key) {
        return {
            direction: current.direction === "asc" ? "desc" : "asc",
            key
        };
    }
    return {
        direction: key === "date" || key === "amount" ? "desc" : "asc",
        key
    };
}
function sortDashboardTransactionRows(rows, sortState) {
    return [
        ...rows
    ].sort((left, right)=>{
        const leftValue = getDashboardTransactionSortValue(left, sortState.key);
        const rightValue = getDashboardTransactionSortValue(right, sortState.key);
        const result = typeof leftValue === "number" && typeof rightValue === "number" ? leftValue - rightValue : String(leftValue).localeCompare(String(rightValue), "uk-UA", {
            numeric: true,
            sensitivity: "base"
        });
        return sortState.direction === "asc" ? result : -result;
    });
}
function getDashboardTransactionSortValue(row, key) {
    switch(key){
        case "date":
            return new Date(row.date).getTime();
        case "category":
            return row.category ?? "";
        case "description":
            return row.description ?? row.sourceStatus ?? "";
        case "type":
            return "Витрата";
        case "amount":
            return row.amount ?? 0;
        default:
            return "";
    }
}
function UnifiedIncomeTable({ onDelete, onEdit, onSortChange, rows, sortState }) {
    const { t } = useI18n();
    const [columnWidths, setColumnWidths] = useState(defaultIncomeColumnWidths);
    const gridTemplateColumns = useMemo(()=>incomeColumns.map((column)=>`${Math.max(column.minWidth, columnWidths[column.key] ?? column.defaultWidth)}px`).join(" "), [
        columnWidths
    ]);
    function resizeColumn(column, event) {
        event.preventDefault();
        event.stopPropagation();
        const startX = event.clientX;
        const startWidth = columnWidths[column.key] ?? column.defaultWidth;
        const maxWidth = column.key === "description" ? 680 : 360;
        function handlePointerMove(moveEvent) {
            const nextWidth = Math.min(maxWidth, Math.max(column.minWidth, startWidth + moveEvent.clientX - startX));
            setColumnWidths((current)=>({
                    ...current,
                    [column.key]: nextWidth
                }));
        }
        function stopResize() {
            document.body.classList.remove("is-resizing-table");
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", stopResize);
            window.removeEventListener("pointercancel", stopResize);
        }
        document.body.classList.add("is-resizing-table");
        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", stopResize);
        window.addEventListener("pointercancel", stopResize);
    }
    return /*#__PURE__*/ _jsxs("div", {
        className: "wide-table unified-table income-unified-table",
        children: [
            /*#__PURE__*/ _jsx("div", {
                className: "wide-head resizable-table-head",
                style: {
                    gridTemplateColumns
                },
                children: incomeColumns.map((column)=>{
                    const active = sortState.key === column.key;
                    const sortLabel = active ? sortState.direction === "asc" ? t("table.sortAsc") : t("table.sortDesc") : t("table.sortNone");
                    return /*#__PURE__*/ _jsxs("span", {
                        className: column.align === "end" ? "table-head-cell align-end" : "table-head-cell",
                        "aria-sort": active ? sortState.direction === "asc" ? "ascending" : "descending" : "none",
                        children: [
                            column.sortable ? /*#__PURE__*/ _jsxs("button", {
                                "aria-label": `${t("table.sortBy")} ${t(column.label)}, ${sortLabel}`,
                                className: active ? "table-sort active" : "table-sort",
                                onClick: ()=>onSortChange(nextIncomeSort(sortState, column.key)),
                                type: "button",
                                children: [
                                    /*#__PURE__*/ _jsx("span", {
                                        children: t(column.label)
                                    }),
                                    /*#__PURE__*/ _jsx("i", {
                                        "aria-hidden": "true",
                                        children: active ? sortState.direction === "asc" ? "↑" : "↓" : "↕"
                                    })
                                ]
                            }) : /*#__PURE__*/ _jsx("span", {
                                className: "table-sort static",
                                children: t(column.label)
                            }),
                            column.key !== "actions" ? /*#__PURE__*/ _jsx("span", {
                                "aria-label": `${t("table.resizeCol")} ${t(column.label)}`,
                                className: "column-resizer",
                                onPointerDown: (event)=>resizeColumn(column, event),
                                role: "separator",
                                tabIndex: -1,
                                title: t("table.dragResize")
                            }) : null
                        ]
                    }, column.key);
                })
            }),
            rows.map((income)=>/*#__PURE__*/ _jsxs("div", {
                    className: "wide-row",
                    style: {
                        gridTemplateColumns
                    },
                    children: [
                        /*#__PURE__*/ _jsx("span", {
                            title: formatDateTime(income.date),
                            children: formatTableDate(income.date)
                        }),
                        /*#__PURE__*/ _jsxs("span", {
                            className: "category-chip",
                            children: [
                                /*#__PURE__*/ _jsx("i", {
                                    style: {
                                        background: colorForSource(income.source)
                                    },
                                    children: /*#__PURE__*/ _jsx(Icon, {
                                        name: "income"
                                    })
                                }),
                                income.source
                            ]
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            children: income.description || income.source
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            children: income.account ?? t("tx.autoSelect")
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            children: getIncomeStatusValue(income.status) === "PLANNED" || getIncomeStatusValue(income.status) === "PENDING" ? t("form.planned") : t("form.actual")
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            className: incomeStatusClassName(income.status),
                            children: t(formatIncomeStatus(income.status))
                        }),
                        /*#__PURE__*/ _jsxs("strong", {
                            className: "positive align-end",
                            children: [
                                "+",
                                formatMoney(income.amount)
                            ]
                        }),
                        onEdit || onDelete ? /*#__PURE__*/ _jsxs("div", {
                            className: "row-actions",
                            children: [
                                onEdit ? /*#__PURE__*/ _jsx("button", {
                                    className: "row-action",
                                    onClick: ()=>onEdit(income),
                                    title: t("tx.editIncome"),
                                    type: "button",
                                    children: /*#__PURE__*/ _jsx(Icon, {
                                        name: "edit"
                                    })
                                }) : null,
                                onDelete ? /*#__PURE__*/ _jsx("button", {
                                    className: "row-action danger",
                                    onClick: ()=>onDelete(income),
                                    title: t("tx.deleteIncome"),
                                    type: "button",
                                    children: /*#__PURE__*/ _jsx(Icon, {
                                        name: "trash"
                                    })
                                }) : null
                            ]
                        }) : /*#__PURE__*/ _jsx(Icon, {
                            name: "more"
                        })
                    ]
                }, income.id))
        ]
    });
}
function ExpenseMerchantTable({ onEdit, rows }) {
    const { t } = useI18n();
    return /*#__PURE__*/ _jsxs("div", {
        className: "wide-table merchant-table",
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: "wide-head",
                children: [
                    /*#__PURE__*/ _jsx("span", {
                        children: t("table.description")
                    }),
                    /*#__PURE__*/ _jsx("span", {
                        children: t("table.category")
                    }),
                    /*#__PURE__*/ _jsx("span", {
                        children: t("table.account")
                    }),
                    /*#__PURE__*/ _jsx("span", {
                        children: t("table.date")
                    }),
                    /*#__PURE__*/ _jsx("span", {
                        children: t("table.amount")
                    }),
                    /*#__PURE__*/ _jsx("span", {})
                ]
            }),
            rows.slice(0, 6).map((expense)=>/*#__PURE__*/ _jsxs("div", {
                    className: "wide-row",
                    children: [
                        /*#__PURE__*/ _jsx("span", {
                            children: expense.description?.split(",")[0] ?? t("table.description")
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            className: "pill",
                            style: {
                                color: expense.categoryColor ?? "#64748b"
                            },
                            children: expense.category
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            children: expense.account ?? t("tx.monoCard")
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            children: formatDate(expense.date)
                        }),
                        /*#__PURE__*/ _jsxs("strong", {
                            className: "negative",
                            children: [
                                "-",
                                formatMoney(expense.amount)
                            ]
                        }),
                        onEdit ? /*#__PURE__*/ _jsx("button", {
                            className: "row-action",
                            onClick: ()=>onEdit(expense),
                            type: "button",
                            children: /*#__PURE__*/ _jsx(Icon, {
                                name: "edit"
                            })
                        }) : null
                    ]
                }, expense.id))
        ]
    });
}
function UnifiedTransactionTable({ onDelete, onEdit, onSortChange, rows, sortState }) {
    const { t } = useI18n();
    const [columnWidths, setColumnWidths] = useState(defaultTransactionColumnWidths);
    const gridTemplateColumns = useMemo(()=>transactionColumns.map((column)=>`${Math.max(column.minWidth, columnWidths[column.key] ?? column.defaultWidth)}px`).join(" "), [
        columnWidths
    ]);
    function resizeColumn(column, event) {
        event.preventDefault();
        event.stopPropagation();
        const startX = event.clientX;
        const startWidth = columnWidths[column.key] ?? column.defaultWidth;
        const maxWidth = column.key === "description" ? 680 : 360;
        function handlePointerMove(moveEvent) {
            const nextWidth = Math.min(maxWidth, Math.max(column.minWidth, startWidth + moveEvent.clientX - startX));
            setColumnWidths((current)=>({
                    ...current,
                    [column.key]: nextWidth
                }));
        }
        function stopResize() {
            document.body.classList.remove("is-resizing-table");
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", stopResize);
            window.removeEventListener("pointercancel", stopResize);
        }
        document.body.classList.add("is-resizing-table");
        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", stopResize);
        window.addEventListener("pointercancel", stopResize);
    }
    return /*#__PURE__*/ _jsxs("div", {
        className: "wide-table unified-table",
        children: [
            /*#__PURE__*/ _jsx("div", {
                className: "wide-head resizable-table-head",
                style: {
                    gridTemplateColumns
                },
                children: transactionColumns.map((column)=>{
                    const active = sortState.key === column.key;
                    const sortLabel = active ? sortState.direction === "asc" ? t("table.sortAsc") : t("table.sortDesc") : t("table.sortNone");
                    return /*#__PURE__*/ _jsxs("span", {
                        className: column.align === "end" ? "table-head-cell align-end" : "table-head-cell",
                        "aria-sort": active ? sortState.direction === "asc" ? "ascending" : "descending" : "none",
                        children: [
                            column.sortable ? /*#__PURE__*/ _jsxs("button", {
                                "aria-label": `${t("table.sortBy")} ${t(column.label)}, ${sortLabel}`,
                                className: active ? "table-sort active" : "table-sort",
                                onClick: ()=>onSortChange(nextTransactionSort(sortState, column.key)),
                                type: "button",
                                children: [
                                    /*#__PURE__*/ _jsx("span", {
                                        children: t(column.label)
                                    }),
                                    /*#__PURE__*/ _jsx("i", {
                                        "aria-hidden": "true",
                                        children: active ? sortState.direction === "asc" ? "↑" : "↓" : "↕"
                                    })
                                ]
                            }) : /*#__PURE__*/ _jsx("span", {
                                className: "table-sort static",
                                children: t(column.label)
                            }),
                            column.key !== "actions" ? /*#__PURE__*/ _jsx("span", {
                                "aria-label": `${t("table.resizeCol")} ${t(column.label)}`,
                                className: "column-resizer",
                                onPointerDown: (event)=>resizeColumn(column, event),
                                role: "separator",
                                tabIndex: -1,
                                title: t("table.dragResize")
                            }) : null
                        ]
                    }, column.key);
                })
            }),
            rows.map((row)=>{
                const expense = isExpenseRow(row);
                const transfer = expense && isTransferExpense(row);
                const status = getTransactionStatus(row);
                const tag = row.tags?.[0] ?? t("tx.work");
                return /*#__PURE__*/ _jsxs("div", {
                    className: "wide-row",
                    style: {
                        gridTemplateColumns
                    },
                    children: [
                        /*#__PURE__*/ _jsx("span", {
                            title: formatDateTime(row.date),
                            children: formatTableDate(row.date)
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            className: transfer ? "transfer-type" : expense ? "expense-type" : "income-type",
                            children: transfer ? t("tx.transfer") : expense ? t("tx.expense") : t("tx.income")
                        }),
                        /*#__PURE__*/ _jsxs("span", {
                            className: "category-chip",
                            children: expense ? [
                                /*#__PURE__*/ _jsx("i", {
                                    style: { background: row.categoryColor ?? "#94a3b8" },
                                    children: /*#__PURE__*/ _jsx(Icon, {
                                        name: iconForCategory(row.category, row.categoryIcon)
                                    })
                                }),
                                row.category ?? t("tx.noCategory")
                            ] : row.source
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            children: row.description
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            children: row.account ?? t("tx.mainAccount")
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            className: status === "tx.status.needsReview" ? "review-type" : "income-type",
                            children: t(status)
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            children: tag
                        }),
                        /*#__PURE__*/ _jsxs("strong", {
                            className: expense ? "negative align-end" : "positive align-end",
                            children: [
                                expense ? "-" : "+",
                                formatMoney(row.amount)
                            ]
                        }),
                        onEdit || onDelete ? /*#__PURE__*/ _jsxs("div", {
                            className: "row-actions",
                            children: [
                                onEdit ? /*#__PURE__*/ _jsx("button", {
                                    className: "row-action",
                                    onClick: ()=>onEdit(row),
                                    title: t("tx.editRecord"),
                                    type: "button",
                                    children: /*#__PURE__*/ _jsx(Icon, {
                                        name: "edit"
                                    })
                                }) : null,
                                onDelete ? /*#__PURE__*/ _jsx("button", {
                                    className: "row-action danger",
                                    onClick: ()=>onDelete(row),
                                    title: t("tx.deleteRecord"),
                                    type: "button",
                                    children: /*#__PURE__*/ _jsx(Icon, {
                                        name: "trash"
                                    })
                                }) : null
                            ]
                        }) : /*#__PURE__*/ _jsx(Icon, {
                            name: "more"
                        })
                    ]
                }, row.id);
            })
        ]
    });
}
function nextTransactionSort(current, key) {
    if (current.key === key) {
        return {
            direction: current.direction === "asc" ? "desc" : "asc",
            key
        };
    }
    return {
        direction: key === "date" || key === "amount" ? "desc" : "asc",
        key
    };
}
function sortTransactionRows(rows, sortState) {
    return [
        ...rows
    ].sort((left, right)=>{
        const leftValue = getTransactionSortValue(left, sortState.key);
        const rightValue = getTransactionSortValue(right, sortState.key);
        const result = typeof leftValue === "number" && typeof rightValue === "number" ? leftValue - rightValue : String(leftValue).localeCompare(String(rightValue), "uk-UA", {
            numeric: true,
            sensitivity: "base"
        });
        return sortState.direction === "asc" ? result : -result;
    });
}
function getTransactionSortValue(row, key) {
    const expense = isExpenseRow(row);
    const transfer = expense && isTransferExpense(row);
    switch(key){
        case "date":
            return new Date(row.date).getTime();
        case "type":
            return transfer ? "Переказ" : expense ? "Витрата" : "Дохід";
        case "category":
            return expense ? row.category : row.source;
        case "description":
            return row.description ?? "";
        case "account":
            return row.account ?? "Основний рахунок";
        case "status":
            return getTransactionStatus(row);
        case "tag":
            return row.tags?.[0] ?? "Робота";
        case "amount":
            return row.amount;
        default:
            return "";
    }
}
function nextIncomeSort(current, key) {
    if (current.key === key) {
        return {
            direction: current.direction === "asc" ? "desc" : "asc",
            key
        };
    }
    return {
        direction: key === "date" || key === "amount" ? "desc" : "asc",
        key
    };
}
function sortIncomeRows(rows, sortState) {
    return [
        ...rows
    ].sort((left, right)=>{
        const leftValue = getIncomeSortValue(left, sortState.key);
        const rightValue = getIncomeSortValue(right, sortState.key);
        const result = typeof leftValue === "number" && typeof rightValue === "number" ? leftValue - rightValue : String(leftValue).localeCompare(String(rightValue), "uk-UA", {
            numeric: true,
            sensitivity: "base"
        });
        return sortState.direction === "asc" ? result : -result;
    });
}
function getIncomeSortValue(row, key) {
    switch(key){
        case "date":
            return new Date(row.date).getTime();
        case "source":
            return row.source ?? "";
        case "description":
            return row.description ?? "";
        case "account":
            return row.account ?? "";
        case "incomeType":
            return getIncomeStatusValue(row.status) === "PLANNED" || getIncomeStatusValue(row.status) === "PENDING" ? "planned" : "actual";
        case "status":
            return formatIncomeStatus(row.status);
        case "amount":
            return row.amount;
        default:
            return "";
    }
}
function getTransactionStatus(row) {
    return isExpenseRow(row) && row.sourceStatus === "NEEDS_REVIEW" ? "tx.status.needsReview" : "tx.status.completed";
}
function BudgetTable({ onDelete, onEdit, onSortChange, rows, sortState }) {
    const { t } = useI18n();
    const [columnWidths, setColumnWidths] = useState(defaultBudgetColumnWidths);
    const gridTemplateColumns = useMemo(()=>budgetColumns.map((column)=>`${Math.max(column.minWidth, columnWidths[column.key] ?? column.defaultWidth)}px`).join(" "), [
        columnWidths
    ]);
    function resizeColumn(column, event) {
        event.preventDefault();
        event.stopPropagation();
        const startX = event.clientX;
        const startWidth = columnWidths[column.key] ?? column.defaultWidth;
        const maxWidth = column.key === "category" ? 360 : column.key === "progress" ? 320 : 180;
        function handlePointerMove(moveEvent) {
            const nextWidth = Math.min(maxWidth, Math.max(column.minWidth, startWidth + moveEvent.clientX - startX));
            setColumnWidths((current)=>({
                    ...current,
                    [column.key]: nextWidth
                }));
        }
        function stopResize() {
            document.body.classList.remove("is-resizing-table");
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", stopResize);
            window.removeEventListener("pointercancel", stopResize);
        }
        document.body.classList.add("is-resizing-table");
        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", stopResize);
        window.addEventListener("pointercancel", stopResize);
    }
    return /*#__PURE__*/ _jsxs("div", {
        className: "budget-table wide-table",
        children: [
            /*#__PURE__*/ _jsx("div", {
                className: "budget-head wide-head resizable-table-head",
                style: {
                    gridTemplateColumns
                },
                children: budgetColumns.map((column)=>{
                    const active = sortState.key === column.key;
                    const sortLabel = active ? sortState.direction === "asc" ? t("table.sortAsc") : t("table.sortDesc") : t("table.sortNone");
                    return /*#__PURE__*/ _jsxs("span", {
                        className: column.align === "end" ? "table-head-cell align-end" : "table-head-cell",
                        "aria-sort": active ? sortState.direction === "asc" ? "ascending" : "descending" : "none",
                        children: [
                            column.sortable ? /*#__PURE__*/ _jsxs("button", {
                                "aria-label": `${t("table.sortBy")} ${t(column.label)}, ${sortLabel}`,
                                className: active ? "table-sort active" : "table-sort",
                                onClick: ()=>onSortChange(nextBudgetSort(sortState, column.key)),
                                type: "button",
                                children: [
                                    /*#__PURE__*/ _jsx("span", {
                                        children: t(column.label)
                                    }),
                                    /*#__PURE__*/ _jsx("i", {
                                        "aria-hidden": "true",
                                        children: active ? sortState.direction === "asc" ? "↑" : "↓" : "↕"
                                    })
                                ]
                            }) : /*#__PURE__*/ _jsx("span", {
                                className: "table-sort static",
                                children: t(column.label)
                            }),
                            column.key !== "actions" ? /*#__PURE__*/ _jsx("span", {
                                "aria-label": `${t("table.resizeCol")} ${t(column.label)}`,
                                className: "column-resizer",
                                onPointerDown: (event)=>resizeColumn(column, event),
                                role: "separator",
                                tabIndex: -1,
                                title: t("table.dragResize")
                            }) : null
                        ]
                    }, column.key);
                })
            }),
            !rows.length ? /*#__PURE__*/ _jsx("p", {
                className: "empty-note budget-empty-note",
                children: t("budgets.empty")
            }) : null,
            rows.map((budget)=>/*#__PURE__*/ _jsxs("div", {
                    className: onEdit ? "budget-line wide-row budget-row-clickable" : "budget-line wide-row",
                    onClick: onEdit ? ()=>onEdit(budget) : undefined,
                    role: onEdit ? "button" : undefined,
                    tabIndex: onEdit ? 0 : undefined,
                    onKeyDown: onEdit ? (e)=>{ if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onEdit(budget); } } : undefined,
                    style: {
                        gridTemplateColumns
                    },
                    children: [
                        /*#__PURE__*/ _jsxs("span", {
                            className: "category-chip",
                            children: [
                                /*#__PURE__*/ _jsx("i", {
                                    style: {
                                        background: budget.categoryColor
                                    },
                                    children: /*#__PURE__*/ _jsx(Icon, {
                                        name: iconForCategory(budget.category, budget.categoryIcon)
                                    })
                                }),
                                budget.category
                            ]
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            className: "align-end",
                            children: formatMoney(budget.limit)
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            className: "align-end",
                            children: formatMoney(budget.spent)
                        }),
                        /*#__PURE__*/ _jsx("span", {
                            className: budget.remaining < 0 ? "negative align-end" : "align-end",
                            children: formatMoney(budget.remaining)
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "progress-with-value",
                            children: [
                                /*#__PURE__*/ _jsx("div", {
                                    className: "progress",
                                    children: /*#__PURE__*/ _jsx("span", {
                                        style: {
                                            background: budget.categoryColor,
                                            width: `${Math.min(budget.percent, 120)}%`
                                        }
                                    })
                                }),
                                /*#__PURE__*/ _jsxs("strong", {
                                    className: "align-end",
                                    children: [
                                        budget.percent,
                                        "%"
                                    ]
                                })
                            ]
                        }),
                        onEdit || onDelete ? /*#__PURE__*/ _jsxs("div", {
                            className: "row-actions",
                            onClick: (e)=>e.stopPropagation(),
                            children: [
                                onEdit ? /*#__PURE__*/ _jsx("button", {
                                    className: "row-action",
                                    onClick: (e)=>{ e.stopPropagation(); onEdit(budget); },
                                    type: "button",
                                    children: /*#__PURE__*/ _jsx(Icon, {
                                        name: "edit"
                                    })
                                }) : null,
                                onDelete ? /*#__PURE__*/ _jsx("button", {
                                    className: "row-action danger",
                                    onClick: (e)=>{ e.stopPropagation(); onDelete(budget); },
                                    type: "button",
                                    children: /*#__PURE__*/ _jsx(Icon, {
                                        name: "trash"
                                    })
                                }) : null
                            ]
                        }) : null
                    ]
                }, budget.id))
        ]
    });
}
function nextBudgetSort(current, key) {
    if (current.key === key) {
        return {
            direction: current.direction === "asc" ? "desc" : "asc",
            key
        };
    }
    return {
        direction: key === "category" ? "asc" : "desc",
        key
    };
}
function sortBudgetRows(rows, sortState) {
    return [
        ...rows
    ].sort((left, right)=>{
        const leftValue = getBudgetSortValue(left, sortState.key);
        const rightValue = getBudgetSortValue(right, sortState.key);
        const result = typeof leftValue === "number" && typeof rightValue === "number" ? leftValue - rightValue : String(leftValue).localeCompare(String(rightValue), "uk-UA", {
            numeric: true,
            sensitivity: "base"
        });
        return sortState.direction === "asc" ? result : -result;
    });
}
function getBudgetSortValue(row, key) {
    switch(key){
        case "category":
            return row.category ?? "";
        case "limit":
            return row.limit ?? 0;
        case "spent":
            return row.spent ?? 0;
        case "remaining":
            return row.remaining ?? 0;
        case "progress":
            return row.percent ?? 0;
        default:
            return "";
    }
}
function GoalCard({ generatingImage, goal, onContribute, onDetails, onEdit, onGenerateImage }) {
    const { t } = useI18n();
    const monthlyNeed = goalMonthlyNeed(goal);
    return /*#__PURE__*/ _jsxs("article", {
        className: "goal-card",
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: "goal-image-wrapper",
                children: [
                    goal.imageUrl ? /*#__PURE__*/ _jsx("img", {
                        alt: goal.name,
                        src: goal.imageUrl
                    }) : /*#__PURE__*/ _jsx("div", {
                        className: "goal-card-media goal-card-media-placeholder",
                        children: /*#__PURE__*/ _jsx(Icon, {
                            name: "goals"
                        })
                    }),
                    generatingImage ? /*#__PURE__*/ _jsx("div", {
                        className: "goal-image-overlay",
                        children: /*#__PURE__*/ _jsx(Icon, {
                            className: "icon-spin",
                            name: "refresh"
                        })
                    }) : null
                ]
            }),
            /*#__PURE__*/ _jsxs("div", {
                children: [
                    /*#__PURE__*/ _jsxs("div", {
                        className: "goal-title",
                        children: [
                            /*#__PURE__*/ _jsx("strong", {
                                children: goal.name
                            }),
                            onEdit ? /*#__PURE__*/ _jsx("button", {
                                className: "row-action",
                                onClick: ()=>onEdit(goal),
                                type: "button",
                                children: /*#__PURE__*/ _jsx(Icon, {
                                    name: "edit"
                                })
                            }) : /*#__PURE__*/ _jsx(Icon, {
                                name: "more"
                            })
                        ]
                    }),
                    goal.description ? /*#__PURE__*/ _jsx("small", {
                        children: goal.description
                    }) : /*#__PURE__*/ _jsx("small", {
                        children: t("form.addFirstGoal")
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        className: "goal-money",
                        children: [
                            /*#__PURE__*/ _jsxs("strong", {
                                children: [
                                    formatMoney(goal.savedAmount),
                                    " / ",
                                    formatMoney(goal.targetAmount)
                                ]
                            }),
                            /*#__PURE__*/ _jsxs("span", {
                                children: [
                                    goal.percent,
                                    "%"
                                ]
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsx("div", {
                        className: "progress",
                        children: /*#__PURE__*/ _jsx("span", {
                            style: {
                                background: goal.color,
                                width: `${Math.min(goal.percent, 100)}%`
                            }
                        })
                    }),
                    /*#__PURE__*/ _jsxs("small", {
                        children: [
                            "до ",
                            goal.deadline ? formatMonthYear(goal.deadline) : "ціль без дати"
                        ]
                    }),
                    monthlyNeed > 0 ? /*#__PURE__*/ _jsxs("small", {
                        className: "goal-need",
                        children: [
                            "Щоб вкластися в термін, потрібно приблизно ",
                            formatMoney(monthlyNeed),
                            " / міс."
                        ]
                    }) : null,
                    /*#__PURE__*/ _jsxs("div", {
                        className: "goal-actions",
                        children: [
                            /*#__PURE__*/ _jsx("button", {
                                className: "soft-button",
                                onClick: ()=>onContribute?.(goal),
                                type: "button",
                                children: t("goals.topUpNearest").trim()
                            }),
                            /*#__PURE__*/ _jsx("button", {
                                className: "secondary-button",
                                disabled: generatingImage,
                                onClick: ()=>onGenerateImage?.(goal),
                                type: "button",
                                children: generatingImage ? t("goals.generating") : t("form.generatePhoto")
                            }),
                            /*#__PURE__*/ _jsx("button", {
                                className: "secondary-button",
                                onClick: ()=>onDetails?.(goal),
                                type: "button",
                                children: t("ui.viewDetails").trim()
                            })
                        ]
                    })
                ]
            })
        ]
    });
}
function ConfirmDialog({ message, onConfirm, onCancel, danger }) {
    return /*#__PURE__*/ _jsx("div", {
        className: "modal-backdrop",
        onClick: (e)=>{ if (e.target === e.currentTarget) onCancel(); },
        children: /*#__PURE__*/ _jsxs("div", {
            className: "confirm-dialog",
            children: [
                /*#__PURE__*/ _jsx("p", { className: "confirm-dialog-message", children: message }),
                /*#__PURE__*/ _jsxs("div", {
                    className: "confirm-dialog-actions",
                    children: [
                        /*#__PURE__*/ _jsx("button", {
                            className: "secondary-button",
                            onClick: onCancel,
                            type: "button",
                            children: "\u0421\u043a\u0430\u0441\u0443\u0432\u0430\u0442\u0438"
                        }),
                        /*#__PURE__*/ _jsx("button", {
                            className: danger ? "danger-button" : "primary-button",
                            onClick: onConfirm,
                            type: "button",
                            children: "\u041f\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0438"
                        })
                    ]
                })
            ]
        })
    });
}
function QuickModal({ accounts, budgets = [], categories, generatingGoalImage, item, kind, loading, onClose, onDelete, onGenerateGoalImage, onSubmit }) {
    const { lang, t } = useI18n();
    const editing = Boolean(item);
    const [selectedCategoryIcon, setSelectedCategoryIcon] = useState(()=>categoryIconFromItem(item));
    const [expenseAccountId, setExpenseAccountId] = useState(()=>field(item, "accountId") || "");
    const [expensePaymentType, setExpensePaymentType] = useState(()=>field(item, "paymentType") || "UNKNOWN");
    const currentBudgetMonth = field(item, "month").slice(0, 7) || new Date().toISOString().slice(0, 7);
    const [budgetMonth, setBudgetMonth] = useState(currentBudgetMonth);
    const [budgetDraftRows, setBudgetDraftRows] = useState([]);
    const [goalImagePreview, setGoalImagePreview] = useState(()=>field(item, "imageUrl") || "");
    useEffect(()=>{
        setSelectedCategoryIcon(categoryIconFromItem(item));
    }, [
        item,
        kind
    ]);
    useEffect(()=>{
        setExpenseAccountId(field(item, "accountId") || "");
        setExpensePaymentType(field(item, "paymentType") || "UNKNOWN");
    }, [
        item,
        kind
    ]);
    useEffect(()=>{
        if (kind === "goal") {
            setGoalImagePreview(field(item, "imageUrl") || "");
        }
    }, [
        item,
        kind
    ]);
    useEffect(()=>{
        if (kind === "expense" && expensePaymentType === "CASH") {
            setExpenseAccountId("");
        }
    }, [
        expensePaymentType,
        kind
    ]);
    useEffect(()=>{
        if (kind !== "budget" || editing) return;
        const nextMonth = field(item, "month").slice(0, 7) || new Date().toISOString().slice(0, 7);
        setBudgetMonth(nextMonth);
    }, [
        editing,
        item,
        kind
    ]);
    useEffect(()=>{
        if (kind !== "budget" || editing) return;
        setBudgetDraftRows([]);
    }, [
        budgetMonth,
        budgets,
        categories,
        editing,
        kind
    ]);
    const selectedCategoryColor = categoryColorForIcon(selectedCategoryIcon);
    const expenseAccountDisabled = kind === "expense" && expensePaymentType === "CASH";
    const titleByKind = {
        account: t("modal.account"),
        budget: editing ? t("modal.editBudget") : t("modal.budget"),
        category: "Категорія",
        expense: t("modal.expense"),
        goal: t("modal.goal"),
        goalContribution: "Поповнити ціль",
        income: t("modal.income"),
        liability: t("modal.liability"),
        liabilityPayment: t("modal.liabilityPayment")
    };
    const accountOptions = accounts;
    const categoryOptions = categories.length ? categories : fallbackCategories;
    const budgetCategoryOptions = uniqueBudgetCategories(categoryOptions);
    const budgetDraftHasRows = budgetDraftRows.length > 0;
    function handleAutofillBudgetRows() {
        setBudgetDraftRows(buildBudgetDraftRows(budgetCategoryOptions, budgets, budgetMonth));
    }
    function handleAddBudgetCategoryRow() {
        setBudgetDraftRows((current)=>{
            const usedNames = new Set(current.map((row)=>row.categoryName.toLocaleLowerCase("uk-UA")));
            const nextCategory = budgetCategoryOptions.find((category)=>!usedNames.has(category.name.toLocaleLowerCase("uk-UA"))) ?? budgetCategoryOptions[0];
            if (!nextCategory) return current;
            return [
                ...current,
                {
                    categoryName: nextCategory.name,
                    existing: false,
                    icon: nextCategory.icon,
                    id: "",
                    limit: "",
                    name: nextCategory.name
                }
            ];
        });
    }
    function handleBudgetRowChange(index, categoryName) {
        const nextCategory = budgetCategoryOptions.find((category)=>category.name === categoryName);
        setBudgetDraftRows((current)=>current.map((row, rowIndex)=>{
                if (rowIndex !== index) return row;
                return {
                    ...row,
                    categoryName,
                    icon: nextCategory?.icon || row.icon,
                    name: categoryName
                };
            }));
    }
    function handleGoalImageChange(event) {
        const file = event.target.files?.[0];
        if (!file) {
            setGoalImagePreview(field(item, "imageUrl") || "");
            return;
        }
        setGoalImagePreview(URL.createObjectURL(file));
    }
    return /*#__PURE__*/ _jsx("div", {
        className: "modal-backdrop",
        children: /*#__PURE__*/ _jsxs("form", {
            className: kind === "budget" && !editing || kind === "goal" ? "quick-modal quick-modal-wide" : "quick-modal",
            onInvalidCapture: (event)=>handleValidationCapture(event, lang),
            onSubmit: onSubmit,
            children: [
                /*#__PURE__*/ _jsxs("div", {
                    className: "modal-head",
                    children: [
                        /*#__PURE__*/ _jsx("h2", {
                            children: titleByKind[kind] ?? (editing ? t("modal.editBudget") : t("modal.budget"))
                        }),
                        /*#__PURE__*/ _jsx("button", {
                            "aria-label": t("ui.close"),
                            className: "icon-button modal-close",
                            onClick: onClose,
                            type: "button",
                            children: /*#__PURE__*/ _jsx(Icon, {
                                name: "close"
                            })
                        })
                    ]
                }),
                kind === "expense" ? /*#__PURE__*/ _jsxs(_Fragment, {
                    children: [
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("forms.amount"),
                                /*#__PURE__*/ _jsx("input", {
                                    defaultValue: field(item, "amount"),
                                    min: "0.01",
                                    name: "amount",
                                    placeholder: "520",
                                    required: true,
                                    step: "0.01",
                                    type: "number"
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("forms.category"),
                                /*#__PURE__*/ _jsxs("select", {
                                    defaultValue: field(item, "category") || "",
                                    name: "categoryName",
                                    children: [
                                        /*#__PURE__*/ _jsx("option", {
                                            value: "",
                                            children: "— " + t("filters.allCategories")
                                        }),
                                        ...categoryOptions.map((category)=>/*#__PURE__*/ _jsx("option", {
                                            value: category.name,
                                            children: category.name
                                        }, category.id ?? category.name))
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("form.paymentType"),
                                /*#__PURE__*/ _jsxs("select", {
                                    name: "paymentType",
                                    onChange: (event)=>setExpensePaymentType(event.target.value),
                                    value: expensePaymentType,
                                    children: [
                                        /*#__PURE__*/ _jsx("option", {
                                            value: "UNKNOWN",
                                            children: t("form.unknown")
                                        }),
                                        /*#__PURE__*/ _jsx("option", {
                                            value: "CARD",
                                            children: t("form.card")
                                        }),
                                        /*#__PURE__*/ _jsx("option", {
                                            value: "CASH",
                                            children: t("form.cash")
                                        })
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("form.account"),
                                /*#__PURE__*/ _jsxs("select", {
                                    disabled: expenseAccountDisabled,
                                    name: "financialAccountId",
                                    onChange: (event)=>setExpenseAccountId(event.target.value),
                                    value: expenseAccountDisabled ? "" : expenseAccountId,
                                    children: [
                                        /*#__PURE__*/ _jsx("option", {
                                            value: "",
                                            children: expenseAccountDisabled ? "Для готівки рахунок не потрібен" : "Автовибір"
                                        }),
                                        accountOptions.map((account)=>/*#__PURE__*/ _jsx("option", {
                                                value: account.id,
                                                children: account.name
                                            }, account.id))
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("form.date"),
                                /*#__PURE__*/ _jsx("input", {
                                    defaultValue: field(item, "date").slice(0, 10),
                                    name: "date",
                                    required: true,
                                    type: "date"
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("forms.description"),
                                /*#__PURE__*/ _jsx("input", {
                                    defaultValue: field(item, "description"),
                                    maxLength: 160,
                                    name: "description",
                                    placeholder: t("form.descPlaceholder")
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("form.tags"),
                                /*#__PURE__*/ _jsx("input", {
                                    defaultValue: Array.isArray(item?.tags) ? item.tags.join(", ") : "",
                                    maxLength: 180,
                                    name: "tags",
                                    placeholder: t("form.tagsPlaceholder")
                                })
                            ]
                        })
                    ]
                }) : null,
                kind === "income" ? /*#__PURE__*/ _jsxs(_Fragment, {
                    children: [
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("forms.amount"),
                                /*#__PURE__*/ _jsx("input", {
                                    defaultValue: field(item, "amount"),
                                    min: "0.01",
                                    name: "amount",
                                    placeholder: "42000",
                                    required: true,
                                    step: "0.01",
                                    type: "number"
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("forms.income.source"),
                                /*#__PURE__*/ _jsx("input", {
                                    defaultValue: field(item, "source"),
                                    maxLength: 80,
                                    minLength: 2,
                                    name: "source",
                                    placeholder: t("form.sourcePlaceholder"),
                                    required: true
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("form.incomeType"),
                                /*#__PURE__*/ _jsxs("select", {
                                    defaultValue: getIncomeStatusValue(field(item, "status")) === "PLANNED" || getIncomeStatusValue(field(item, "status")) === "PENDING" ? "PLANNED" : "RECEIVED",
                                    name: "status",
                                    children: [
                                        /*#__PURE__*/ _jsx("option", {
                                            value: "RECEIVED",
                                            children: t("form.actual")
                                        }),
                                        /*#__PURE__*/ _jsx("option", {
                                            value: "PLANNED",
                                            children: t("form.planned")
                                        })
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("form.account"),
                                /*#__PURE__*/ _jsxs("select", {
                                    defaultValue: field(item, "accountId") || "",
                                    name: "financialAccountId",
                                    children: [
                                        /*#__PURE__*/ _jsx("option", {
                                            value: "",
                                            children: "Автовибір"
                                        }),
                                        accountOptions.map((account)=>/*#__PURE__*/ _jsx("option", {
                                                value: account.id,
                                                children: account.name
                                            }, account.id))
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("form.date"),
                                /*#__PURE__*/ _jsx("input", {
                                    defaultValue: field(item, "date").slice(0, 10),
                                    name: "date",
                                    required: true,
                                    type: "date"
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("forms.description"),
                                /*#__PURE__*/ _jsx("input", {
                                    defaultValue: field(item, "description"),
                                    maxLength: 160,
                                    name: "description",
                                    placeholder: t("form.incomePlaceholder")
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("form.tags"),
                                /*#__PURE__*/ _jsx("input", {
                                    defaultValue: Array.isArray(item?.tags) ? item.tags.join(", ") : "",
                                    maxLength: 180,
                                    name: "tags",
                                    placeholder: t("form.incomeTagsPlaceholder")
                                })
                            ]
                        })
                    ]
                }) : null,
                kind === "budget" && editing ? /*#__PURE__*/ _jsxs(_Fragment, {
                    children: [
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("forms.budget.name"),
                                /*#__PURE__*/ _jsx("input", {
                                    defaultValue: field(item, "name"),
                                    maxLength: 80,
                                    minLength: 2,
                                    name: "name",
                                    placeholder: t("form.namePlaceholder"),
                                    required: true
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("forms.budget.category"),
                                /*#__PURE__*/ _jsx("select", {
                                    defaultValue: field(item, "category") || categoryOptions[0]?.name || "",
                                    name: "categoryName",
                                    children: categoryOptions.map((category)=>/*#__PURE__*/ _jsx("option", {
                                            value: category.name,
                                            children: category.name
                                        }, category.id ?? category.name))
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("forms.budget.limit"),
                                /*#__PURE__*/ _jsx("input", {
                                    defaultValue: field(item, "limit"),
                                    min: "0.01",
                                    name: "limit",
                                    placeholder: "12000",
                                    required: true,
                                    step: "0.01",
                                    type: "number"
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("form.month"),
                                /*#__PURE__*/ _jsx("input", {
                                    defaultValue: currentBudgetMonth,
                                    name: "month",
                                    required: true,
                                    type: "month"
                                })
                            ]
                        })
                    ]
                }) : null,
                kind === "budget" && !editing ? /*#__PURE__*/ _jsxs(_Fragment, {
                    children: [
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("form.month"),
                                /*#__PURE__*/ _jsx("input", {
                                    name: "month",
                                    onChange: (event)=>setBudgetMonth(event.target.value),
                                    required: true,
                                    type: "month",
                                    value: budgetMonth
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "budget-batch-actions",
                            children: [
                                /*#__PURE__*/ _jsxs("button", {
                                    className: "secondary-button compact",
                                    onClick: handleAddBudgetCategoryRow,
                                    type: "button",
                                    children: [
                                        /*#__PURE__*/ _jsx(Icon, {
                                            name: "plus"
                                        }),
                                        t("form.addCategory")
                                    ]
                                }),
                                /*#__PURE__*/ _jsxs("button", {
                                    className: "secondary-button compact",
                                    onClick: handleAutofillBudgetRows,
                                    type: "button",
                                    children: [
                                        /*#__PURE__*/ _jsx(Icon, {
                                            name: "refresh"
                                        }),
                                        t("form.autofill")
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "budget-batch-header",
                            children: [
                                /*#__PURE__*/ _jsx("strong", {
                                    children: t("form.categoriesTitle")
                                }),
                                /*#__PURE__*/ _jsx("small", {
                                    children: t("form.categoriesHint")
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "budget-batch-list",
                            children: [
                                budgetDraftRows.map((row, index)=>/*#__PURE__*/ _jsxs("div", {
                                        className: "budget-batch-row",
                                        children: [
                                            /*#__PURE__*/ _jsxs("div", {
                                                className: "budget-batch-category",
                                                children: [
                                                    /*#__PURE__*/ _jsx("input", {
                                                        name: `budgetRows[${index}][id]`,
                                                        readOnly: true,
                                                        type: "hidden",
                                                        value: row.id || ""
                                                    }),
                                                    /*#__PURE__*/ _jsx("input", {
                                                        name: `budgetRows[${index}][categoryName]`,
                                                        readOnly: true,
                                                        type: "hidden",
                                                        value: row.categoryName
                                                    }),
                                                    /*#__PURE__*/ _jsx("input", {
                                                        name: `budgetRows[${index}][name]`,
                                                        readOnly: true,
                                                        type: "hidden",
                                                        value: row.name
                                                    }),
                                                    /*#__PURE__*/ _jsx("span", {
                                                        className: "budget-batch-icon",
                                                        children: /*#__PURE__*/ _jsx(Icon, {
                                                            name: row.icon || "budget"
                                                        })
                                                    }),
                                                    /*#__PURE__*/ _jsxs("label", {
                                                        className: "budget-batch-copy",
                                                        children: [
                                                            /*#__PURE__*/ _jsx("span", {
                                                                className: "sr-only",
                                                                children: t("table.category")
                                                            }),
                                                            /*#__PURE__*/ _jsx("select", {
                                                                name: `budgetRows[${index}][categoryName]`,
                                                                onChange: (event)=>handleBudgetRowChange(index, event.target.value),
                                                                value: row.categoryName,
                                                                children: budgetCategoryOptions.map((category)=>/*#__PURE__*/ _jsx("option", {
                                                                        value: category.name,
                                                                        children: category.name
                                                                    }, category.id ?? category.name))
                                                            }),
                                                            row.existing ? /*#__PURE__*/ _jsx("small", {
                                                                children: t("form.duplicateBudget")
                                                            }) : /*#__PURE__*/ _jsx("small", {
                                                                children: t("form.setLimit")
                                                            })
                                                        ]
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ _jsx("label", {
                                                className: "budget-batch-amount",
                                                children: /*#__PURE__*/ _jsx("input", {
                                                    defaultValue: row.limit,
                                                    min: "0",
                                                    name: `budgetRows[${index}][limit]`,
                                                    placeholder: "0",
                                                    step: "0.01",
                                                    type: "number"
                                                })
                                            }),
                                            /*#__PURE__*/ _jsx("button", {
                                                "aria-label": `Прибрати ${row.name}`,
                                                className: "row-action danger",
                                                onClick: ()=>setBudgetDraftRows((current)=>current.filter((_, currentIndex)=>currentIndex !== index)),
                                                type: "button",
                                                children: /*#__PURE__*/ _jsx(Icon, {
                                                    name: "trash"
                                                })
                                            })
                                        ]
                                    }, `${row.categoryName}-${index}`)),
                                !budgetDraftHasRows ? /*#__PURE__*/ _jsx("p", {
                                    className: "empty-note budget-empty-note",
                                    children: t("form.emptyTable")
                                }) : null
                            ]
                        })
                    ]
                }) : null,
                kind === "goal" ? /*#__PURE__*/ _jsxs(_Fragment, {
                    children: [
                        /*#__PURE__*/ _jsxs("div", {
                            className: "goal-form-grid",
                            children: [
                                /*#__PURE__*/ _jsxs("div", {
                                    className: "goal-photo-upload",
                                    children: [
                                        /*#__PURE__*/ _jsx("input", {
                                            name: "existingImageUrl",
                                            type: "hidden",
                                            defaultValue: field(item, "imageUrl")
                                        }),
                                        /*#__PURE__*/ _jsxs("div", {
                                            className: "goal-photo-frame-wrapper",
                                            children: [
                                                goalImagePreview ? /*#__PURE__*/ _jsx("img", {
                                                    alt: field(item, "name") || t("form.goalPhoto"),
                                                    className: "goal-photo-frame",
                                                    src: goalImagePreview
                                                }) : /*#__PURE__*/ _jsx("div", {
                                                    className: "goal-photo-frame goal-photo-placeholder",
                                                    children: /*#__PURE__*/ _jsx(Icon, {
                                                        name: "goals"
                                                    })
                                                }),
                                                generatingGoalImage ? /*#__PURE__*/ _jsxs("div", {
                                                    className: "goal-photo-overlay",
                                                    children: [
                                                        /*#__PURE__*/ _jsx(Icon, {
                                                            className: "icon-spin",
                                                            name: "refresh"
                                                        }),
                                                        /*#__PURE__*/ _jsx("span", {
                                                            children: t("goals.generating")
                                                        })
                                                    ]
                                                }) : null
                                            ]
                                        }),
                                        /*#__PURE__*/ _jsxs("label", {
                                            className: "goal-photo-input",
                                            children: [
                                                t("form.goalPhoto"),
                                                /*#__PURE__*/ _jsx("input", {
                                                    accept: "image/jpeg,image/png,image/webp",
                                                    name: "goalImage",
                                                    onChange: handleGoalImageChange,
                                                    type: "file"
                                                })
                                            ]
                                        }),
                                        editing ? /*#__PURE__*/ _jsxs("button", {
                                            className: "secondary-button compact goal-generate-button",
                                            disabled: loading || generatingGoalImage,
                                            onClick: ()=>onGenerateGoalImage?.(item),
                                            type: "button",
                                            children: [
                                                generatingGoalImage ? /*#__PURE__*/ _jsx(Icon, {
                                                    className: "icon-spin",
                                                    name: "refresh"
                                                }) : null,
                                                generatingGoalImage ? t("goals.generating") : t("form.generatePhoto")
                                            ]
                                        }) : null,
                                        /*#__PURE__*/ _jsx("small", {
                                            children: editing ? t("form.goalPhotoHintEdit") : t("form.goalPhotoHint")
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ _jsxs("div", {
                                    className: "goal-form-fields",
                                    children: [
                                        /*#__PURE__*/ _jsxs("label", {
                                            children: [
                                                t("forms.goal.name"),
                                                /*#__PURE__*/ _jsx("input", {
                                                    defaultValue: field(item, "name"),
                                                    maxLength: 80,
                                                    minLength: 2,
                                                    name: "name",
                                                    placeholder: t("form.goalNamePlaceholder"),
                                                    required: true
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ _jsxs("div", {
                                            className: "form-grid two",
                                            children: [
                                                /*#__PURE__*/ _jsxs("label", {
                                                    children: [
                                                        t("forms.goal.target"),
                                                        /*#__PURE__*/ _jsx("input", {
                                                            defaultValue: field(item, "targetAmount"),
                                                            min: "0.01",
                                                            name: "targetAmount",
                                                            placeholder: "60000",
                                                            required: true,
                                                            step: "0.01",
                                                            type: "number"
                                                        })
                                                    ]
                                                }),
                                                /*#__PURE__*/ _jsxs("label", {
                                                    children: [
                                                        t("forms.goal.saved"),
                                                        /*#__PURE__*/ _jsx("input", {
                                                            defaultValue: field(item, "savedAmount"),
                                                            min: "0",
                                                            name: "savedAmount",
                                                            placeholder: "0",
                                                            step: "0.01",
                                                            type: "number"
                                                        })
                                                    ]
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ _jsxs("label", {
                                            children: [
                                                t("form.goalDeadline"),
                                                /*#__PURE__*/ _jsx("input", {
                                                    defaultValue: formatDateInputValue(field(item, "deadline")),
                                                    name: "deadline",
                                                    type: "date"
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ _jsxs("label", {
                                            children: [
                                                t("forms.goal.description"),
                                                /*#__PURE__*/ _jsx("input", {
                                                    defaultValue: field(item, "description"),
                                                    maxLength: 160,
                                                    name: "description",
                                                    placeholder: t("form.goalDescPlaceholder")
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ _jsx("div", {
                                            className: "goal-form-tip",
                                            children: "Дохід сам по собі не поповнює ціль. Прогрес з’являється лише після реальних внесків через кнопку “Поповнити”."
                                        })
                                    ]
                                })
                            ]
                        })
                    ]
                }) : null,
                kind === "goalContribution" ? /*#__PURE__*/ _jsxs(_Fragment, {
                    children: [
                        /*#__PURE__*/ _jsxs("div", {
                            className: "goal-contribution-heading",
                            children: [
                                /*#__PURE__*/ _jsx("strong", {
                                    children: field(item, "name") || "Ціль"
                                }),
                                /*#__PURE__*/ _jsxs("small", {
                                    children: [
                                        formatMoney(Number(field(item, "savedAmount") || 0)),
                                        " / ",
                                        formatMoney(Number(field(item, "targetAmount") || 0))
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("form.contributionAmount"),
                                /*#__PURE__*/ _jsx("input", {
                                    min: "0.01",
                                    name: "amount",
                                    placeholder: "2000",
                                    required: true,
                                    step: "0.01",
                                    type: "number"
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("form.comment"),
                                /*#__PURE__*/ _jsx("input", {
                                    maxLength: 120,
                                    name: "note",
                                    placeholder: t("form.commentPlaceholder")
                                })
                            ]
                        })
                    ]
                }) : null,
                kind === "liabilityPayment" ? /*#__PURE__*/ _jsxs(_Fragment, {
                    children: [
                        /*#__PURE__*/ _jsxs("div", {
                            className: "goal-contribution-heading",
                            children: [
                                /*#__PURE__*/ _jsx("strong", {
                                    children: field(item, "name") || t("modal.liabilityPayment")
                                }),
                                /*#__PURE__*/ _jsxs("small", {
                                    children: [
                                        t("liabilities.balance"),
                                        ": ",
                                        formatMoney(Number(field(item, "currentBalance") || 0))
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("form.liability.paymentAmount"),
                                /*#__PURE__*/ _jsx("input", {
                                    min: "0.01",
                                    name: "amount",
                                    placeholder: String(field(item, "minimumPayment") || "0"),
                                    required: true,
                                    step: "0.01",
                                    type: "number"
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("form.liability.paymentDate"),
                                /*#__PURE__*/ _jsx("input", {
                                    defaultValue: new Date().toISOString().slice(0, 10),
                                    name: "date",
                                    type: "date"
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("form.liability.paymentNote"),
                                /*#__PURE__*/ _jsx("input", {
                                    maxLength: 120,
                                    name: "note",
                                    placeholder: t("form.liability.paymentNotePlaceholder")
                                })
                            ]
                        })
                    ]
                }) : null,
                kind === "liability" ? /*#__PURE__*/ _jsxs(_Fragment, {
                    children: [
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("form.liability.name"),
                                /*#__PURE__*/ _jsx("input", {
                                    defaultValue: field(item, "name"),
                                    maxLength: 100,
                                    name: "name",
                                    placeholder: t("form.liability.namePlaceholder"),
                                    required: true
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("form.liability.kind"),
                                /*#__PURE__*/ _jsxs("select", {
                                    defaultValue: field(item, "kind") || "OTHER",
                                    name: "kind",
                                    children: [
                                        /*#__PURE__*/ _jsx("option", { value: "LOAN", children: t("liabilities.kind.LOAN") }),
                                        /*#__PURE__*/ _jsx("option", { value: "CREDIT_CARD", children: t("liabilities.kind.CREDIT_CARD") }),
                                        /*#__PURE__*/ _jsx("option", { value: "INSTALLMENT", children: t("liabilities.kind.INSTALLMENT") }),
                                        /*#__PURE__*/ _jsx("option", { value: "MORTGAGE", children: t("liabilities.kind.MORTGAGE") }),
                                        /*#__PURE__*/ _jsx("option", { value: "PERSONAL_DEBT", children: t("liabilities.kind.PERSONAL_DEBT") }),
                                        /*#__PURE__*/ _jsx("option", { value: "TAX", children: t("liabilities.kind.TAX") }),
                                        /*#__PURE__*/ _jsx("option", { value: "OTHER", children: t("liabilities.kind.OTHER") })
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("form.liability.creditor"),
                                /*#__PURE__*/ _jsx("input", {
                                    defaultValue: field(item, "creditor"),
                                    maxLength: 100,
                                    name: "creditor",
                                    placeholder: t("form.liability.creditorPlaceholder")
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("form.liability.amount"),
                                /*#__PURE__*/ _jsx("input", {
                                    defaultValue: field(item, "currentBalance"),
                                    min: "0",
                                    name: "currentBalance",
                                    placeholder: "5000",
                                    required: true,
                                    step: "0.01",
                                    type: "number"
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("form.liability.minimumPayment"),
                                /*#__PURE__*/ _jsx("input", {
                                    defaultValue: field(item, "minimumPayment"),
                                    min: "0",
                                    name: "minimumPayment",
                                    placeholder: "0",
                                    step: "0.01",
                                    type: "number"
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("form.liability.status"),
                                /*#__PURE__*/ _jsxs("select", {
                                    defaultValue: field(item, "status") || "ACTIVE",
                                    name: "status",
                                    children: [
                                        /*#__PURE__*/ _jsx("option", { value: "ACTIVE", children: t("liabilities.status.ACTIVE") }),
                                        /*#__PURE__*/ _jsx("option", { value: "PAUSED", children: t("liabilities.status.PAUSED") }),
                                        /*#__PURE__*/ _jsx("option", { value: "PAID", children: t("liabilities.status.PAID") }),
                                        /*#__PURE__*/ _jsx("option", { value: "ARCHIVED", children: t("liabilities.status.ARCHIVED") })
                                    ]
                                })
                            ]
                        })
                    ]
                }) : null,
                kind === "account" ? /*#__PURE__*/ _jsxs(_Fragment, {
                    children: [
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("forms.account.name"),
                                /*#__PURE__*/ _jsx("input", {
                                    defaultValue: field(item, "name"),
                                    maxLength: 80,
                                    minLength: 2,
                                    name: "name",
                                    placeholder: t("form.accountPlaceholder"),
                                    required: true
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("forms.account.balance"),
                                /*#__PURE__*/ _jsx("input", {
                                    defaultValue: field(item, "balance"),
                                    name: "balance",
                                    placeholder: "24560",
                                    step: "0.01",
                                    type: "number"
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("form.accountType"),
                                /*#__PURE__*/ _jsxs("select", {
                                    defaultValue: field(item, "type") || "CARD",
                                    name: "type",
                                    children: [
                                        /*#__PURE__*/ _jsx("option", {
                                            value: "CARD",
                                            children: t("form.card")
                                        }),
                                        /*#__PURE__*/ _jsx("option", {
                                            value: "BANK",
                                            children: t("form.bankAccount")
                                        }),
                                        /*#__PURE__*/ _jsx("option", {
                                            value: "CASH",
                                            children: t("form.cash")
                                        }),
                                        /*#__PURE__*/ _jsx("option", {
                                            value: "SAVINGS",
                                            children: t("form.savings")
                                        }),
                                        /*#__PURE__*/ _jsx("option", {
                                            value: "INVESTMENT",
                                            children: t("form.investment")
                                        }),
                                        /*#__PURE__*/ _jsx("option", {
                                            value: "OTHER",
                                            children: t("form.other")
                                        })
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("forms.account.maskedPan"),
                                /*#__PURE__*/ _jsx("input", {
                                    defaultValue: field(item, "maskedPan"),
                                    maxLength: 24,
                                    name: "maskedPan",
                                    pattern: "^[0-9*\\\\s]{4,24}$",
                                    placeholder: "5168 **** **** 1234"
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("label", {
                            className: "checkbox-field",
                            children: [
                                /*#__PURE__*/ _jsx("input", {
                                    defaultChecked: field(item, "isPrimary") === "true",
                                    name: "isPrimary",
                                    type: "checkbox"
                                }),
                                t("form.mainAccount")
                            ]
                        })
                    ]
                }) : null,
                kind === "category" ? /*#__PURE__*/ _jsxs(_Fragment, {
                    children: [
                        /*#__PURE__*/ _jsxs("label", {
                            children: [
                                t("form.name"),
                                /*#__PURE__*/ _jsx("input", {
                                    defaultValue: field(item, "name"),
                                    maxLength: 80,
                                    minLength: 2,
                                    name: "name",
                                    placeholder: t("form.namePlaceholder"),
                                    required: true
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsx("input", {
                            name: "dashboardGroup",
                            type: "hidden",
                            value: "Користувацькі"
                        }),
                        /*#__PURE__*/ _jsx("input", {
                            name: "color",
                            readOnly: true,
                            type: "hidden",
                            value: selectedCategoryColor
                        }),
                        /*#__PURE__*/ _jsx("input", {
                            name: "icon",
                            readOnly: true,
                            type: "hidden",
                            value: selectedCategoryIcon
                        }),
                        /*#__PURE__*/ _jsx(IconPicker, {
                            onChange: setSelectedCategoryIcon,
                            value: selectedCategoryIcon
                        })
                    ]
                }) : null,
                /*#__PURE__*/ _jsxs("div", {
                    className: "modal-actions",
                    children: [
                        onDelete ? /*#__PURE__*/ _jsx("button", {
                            className: "danger-button",
                            disabled: loading,
                            onClick: onDelete,
                            type: "button",
                            children: t("forms.delete")
                        }) : null,
                        /*#__PURE__*/ _jsx("button", {
                            disabled: loading,
                            type: "submit",
                            children: t("forms.save")
                        })
                    ]
                })
            ]
        })
    });
}
function IconPicker({ onChange, value }) {
    return /*#__PURE__*/ _jsxs("fieldset", {
        className: "icon-picker",
        children: [
            /*#__PURE__*/ _jsx("legend", {
                children: "Піктограма"
            }),
            /*#__PURE__*/ _jsx("div", {
                className: "icon-picker-grid",
                children: categoryIconOptions.map((option)=>/*#__PURE__*/ _jsx("button", {
                        "aria-label": option.label,
                        "aria-pressed": value === option.icon,
                        className: `icon-choice${value === option.icon ? " active" : ""}`,
                        onClick: ()=>onChange(option.icon),
                        style: {
                            "--icon-color": option.color
                        },
                        title: option.label,
                        type: "button",
                        children: /*#__PURE__*/ _jsx(Icon, {
                            name: option.icon
                        })
                    }, option.icon))
            })
        ]
    });
}
function payloadFromForm(kind, data, options = {}) {
    const value = (key)=>String(data.get(key) ?? "").trim();
    const tags = value("tags").split(",").map((tag)=>tag.trim()).filter(Boolean);
    if (kind === "expense") {
        const paymentType = value("paymentType") || "UNKNOWN";
        return {
            amount: value("amount"),
            categoryName: value("categoryName"),
            date: value("date") || undefined,
            description: value("description"),
            financialAccountId: paymentType === "CASH" ? undefined : value("financialAccountId") || undefined,
            paymentType,
            tags
        };
    }
    if (kind === "income") {
        return {
            amount: value("amount"),
            date: value("date") || undefined,
            description: value("description"),
            financialAccountId: value("financialAccountId") || undefined,
            source: value("source"),
            status: value("status") || "RECEIVED",
            tags
        };
    }
    if (kind === "budget") {
        return {
            categoryName: value("categoryName") || value("name"),
            limit: value("limit"),
            month: value("month") || undefined,
            name: value("name")
        };
    }
    if (kind === "goal") {
        return {
            deadline: value("deadline") || undefined,
            description: value("description"),
            imageUrl: options.goalImageUrl || value("existingImageUrl") || undefined,
            name: value("name"),
            savedAmount: value("savedAmount") || "0",
            targetAmount: value("targetAmount")
        };
    }
    if (kind === "category") {
        const icon = toCategoryIconName(value("icon"));
        return {
            color: value("color") || categoryColorForIcon(icon),
            dashboardGroup: value("dashboardGroup") || "Користувацькі",
            icon,
            name: value("name")
        };
    }
    if (kind === "liability") {
        const currentBalance = value("currentBalance");
        return {
            name: value("name"),
            kind: value("kind") || "OTHER",
            creditor: value("creditor") || undefined,
            originalAmount: currentBalance,
            currentBalance: currentBalance,
            minimumPayment: value("minimumPayment") || "0",
            status: value("status") || "ACTIVE"
        };
    }
    return {
        balance: value("balance") || "0",
        isPrimary: data.get("isPrimary") === "on",
        maskedPan: value("maskedPan"),
        name: value("name"),
        type: value("type") || "CARD"
    };
}
function payloadsFromBudgetForm(data) {
    const month = String(data.get("month") ?? "").trim();
    const rows = [];
    for (const [key, raw] of data.entries()){
        const match = /^budgetRows\[(\d+)\]\[(id|name|categoryName|limit)\]$/.exec(key);
        if (!match) continue;
        const index = Number(match[1]);
        rows[index] ||= {
            id: "",
            categoryName: "",
            limit: "",
            name: ""
        };
        rows[index][match[2]] = String(raw ?? "").trim();
    }
    return rows.filter((row)=>row?.categoryName && Number(row.limit) > 0).map((row)=>({
            id: row.id || undefined,
            categoryName: row.categoryName || row.name,
            limit: row.limit,
            month: month || undefined,
            name: row.name || row.categoryName
        }));
}
function buildBudgetDraftRows(categories, budgets, month) {
    const monthKey = String(month || new Date().toISOString().slice(0, 7)).slice(0, 7);
    const existingByCategory = new Map((budgets || []).filter((budget)=>field(budget, "month").slice(0, 7) === monthKey).map((budget)=>[
            field(budget, "category") || field(budget, "name"),
            budget
        ]));
    return (categories || []).map((category)=>({
            categoryName: category.name,
            existing: existingByCategory.has(category.name),
            id: field(existingByCategory.get(category.name), "id"),
            icon: category.icon,
            limit: field(existingByCategory.get(category.name), "limit"),
            name: field(existingByCategory.get(category.name), "name") || category.name
        }));
}
function uniqueBudgetCategories(categories) {
    const seen = new Set();
    return (categories || []).filter((category)=>{
        const key = category.name.trim().toLocaleLowerCase("uk-UA");
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
function field(item, key) {
    const value = item?.[key];
    return value === null || value === undefined ? "" : String(value);
}
function CalendarButton({ className, date, icon = false, label, onSelect, value }) {
    const { lang } = useI18n();
    const rootRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [pickedDate, setPickedDate] = useState(date ?? null);
    const [viewDate, setViewDate] = useState(date ?? pickedDate ?? new Date(2024, 4, 1));
    const selectedDate = date ?? pickedDate ?? viewDate;
    const displayValue = date ? value ?? formatMonthLabel(date, lang) : pickedDate ? formatDayLabel(pickedDate, lang) : value ?? formatMonthLabel(selectedDate, lang);
    useEffect(()=>{
        if (!open) return;
        const closeOnOutside = (event)=>{
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        const closeOnEscape = (event)=>{
            if (event.key === "Escape") setOpen(false);
        };
        document.addEventListener("pointerdown", closeOnOutside);
        document.addEventListener("keydown", closeOnEscape);
        return ()=>{
            document.removeEventListener("pointerdown", closeOnOutside);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [
        open
    ]);
    useEffect(()=>{
        if (date) {
            setPickedDate(date);
            setViewDate(date);
        }
    }, [
        date
    ]);
    function handleSelect(nextDate) {
        setPickedDate(nextDate);
        setViewDate(nextDate);
        onSelect?.(nextDate);
        setOpen(false);
    }
    return /*#__PURE__*/ _jsxs("div", {
        className: "calendar-control",
        ref: rootRef,
        children: [
            /*#__PURE__*/ _jsxs("button", {
                "aria-expanded": open,
                className: className,
                onClick: ()=>setOpen((current)=>!current),
                type: "button",
                children: [
                    icon ? /*#__PURE__*/ _jsxs("span", {
                        children: [
                            /*#__PURE__*/ _jsx(Icon, {
                                name: "calendar"
                            }),
                            displayValue
                        ]
                    }) : /*#__PURE__*/ _jsxs(_Fragment, {
                        children: [
                            label ? /*#__PURE__*/ _jsx("small", {
                                children: label
                            }) : null,
                            /*#__PURE__*/ _jsx("span", {
                                children: displayValue
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsx(Icon, {
                        name: "chevronDown"
                    })
                ]
            }),
            open ? /*#__PURE__*/ _jsx(CalendarPanel, {
                lang: lang,
                onSelect: handleSelect,
                selectedDate: selectedDate,
                setViewDate: (nextDate)=>setViewDate(nextDate),
                viewDate: viewDate
            }) : null
        ]
    });
}
function DateRangeButton({ className, label, onChange, range }) {
    const { lang, t } = useI18n();
    const rootRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [draftRange, setDraftRange] = useState(()=>normalizeDateRange(range));
    const [activeEdge, setActiveEdge] = useState("from");
    const [viewDate, setViewDate] = useState(range.from);
    useEffect(()=>{
        const normalized = normalizeDateRange(range);
        setDraftRange(normalized);
        setViewDate(normalized.from);
    }, [
        dateRangeKey(range)
    ]);
    useEffect(()=>{
        if (!open) return;
        const closeOnOutside = (event)=>{
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        const closeOnEscape = (event)=>{
            if (event.key === "Escape") setOpen(false);
        };
        document.addEventListener("pointerdown", closeOnOutside);
        document.addEventListener("keydown", closeOnEscape);
        return ()=>{
            document.removeEventListener("pointerdown", closeOnOutside);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [
        open
    ]);
    function applyQuickRange(kind) {
        const now = new Date();
        const nextRange = kind === "current" ? monthRangeFromDate(now) : kind === "previous" ? monthRangeFromDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)) : {
            from: startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)),
            to: endOfDay(now)
        };
        const normalized = normalizeDateRange(nextRange);
        setDraftRange(normalized);
        setViewDate(normalized.from);
    }
    function handleSelectDate(date) {
        if (activeEdge === "from") {
            const nextFrom = startOfDay(date);
            const nextTo = draftRange.to.getTime() < nextFrom.getTime() ? endOfDay(date) : draftRange.to;
            setDraftRange({
                from: nextFrom,
                to: nextTo
            });
            setActiveEdge("to");
            return;
        }
        const nextTo = endOfDay(date);
        const nextFrom = draftRange.from.getTime() > nextTo.getTime() ? startOfDay(date) : draftRange.from;
        setDraftRange({
            from: nextFrom,
            to: nextTo
        });
    }
    function applyRange() {
        onChange(normalizeDateRange(draftRange));
        setOpen(false);
    }
    return /*#__PURE__*/ _jsxs("div", {
        className: "calendar-control range-control",
        ref: rootRef,
        children: [
            /*#__PURE__*/ _jsxs("button", {
                "aria-expanded": open,
                className: className,
                onClick: ()=>setOpen((current)=>!current),
                type: "button",
                children: [
                    label ? /*#__PURE__*/ _jsx("small", {
                        children: label
                    }) : null,
                    /*#__PURE__*/ _jsx("span", {
                        children: formatRangeLabel(range, lang)
                    }),
                    /*#__PURE__*/ _jsx(Icon, {
                        name: "chevronDown"
                    })
                ]
            }),
            open ? /*#__PURE__*/ _jsxs("div", {
                className: "calendar-popover range-popover",
                children: [
                    /*#__PURE__*/ _jsxs("div", {
                        className: "range-fields",
                        children: [
                            /*#__PURE__*/ _jsxs("button", {
                                className: activeEdge === "from" ? "range-field active" : "range-field",
                                onClick: ()=>setActiveEdge("from"),
                                type: "button",
                                children: [
                                    /*#__PURE__*/ _jsx("small", {
                                        children: t("dateRange.from")
                                    }),
                                    /*#__PURE__*/ _jsx("strong", {
                                        children: formatTableDate(draftRange.from.toISOString())
                                    })
                                ]
                            }),
                            /*#__PURE__*/ _jsxs("button", {
                                className: activeEdge === "to" ? "range-field active" : "range-field",
                                onClick: ()=>setActiveEdge("to"),
                                type: "button",
                                children: [
                                    /*#__PURE__*/ _jsx("small", {
                                        children: t("dateRange.to")
                                    }),
                                    /*#__PURE__*/ _jsx("strong", {
                                        children: formatTableDate(draftRange.to.toISOString())
                                    })
                                ]
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        className: "range-quick-actions",
                        children: [
                            /*#__PURE__*/ _jsx("button", {
                                onClick: ()=>applyQuickRange("current"),
                                type: "button",
                                children: t("dateRange.thisMonth")
                            }),
                            /*#__PURE__*/ _jsx("button", {
                                onClick: ()=>applyQuickRange("previous"),
                                type: "button",
                                children: t("dateRange.previous")
                            }),
                            /*#__PURE__*/ _jsx("button", {
                                onClick: ()=>applyQuickRange("last30"),
                                type: "button",
                                children: t("dateRange.last30")
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsx(CalendarPanel, {
                        highlightedRange: draftRange,
                        lang: lang,
                        onSelect: handleSelectDate,
                        selectedDate: activeEdge === "from" ? draftRange.from : draftRange.to,
                        setViewDate: (nextDate)=>setViewDate(nextDate),
                        viewDate: viewDate
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        className: "range-actions",
                        children: [
                            /*#__PURE__*/ _jsx("button", {
                                className: "secondary-button compact",
                                onClick: ()=>setOpen(false),
                                type: "button",
                                children: t("dateRange.cancel")
                            }),
                            /*#__PURE__*/ _jsx("button", {
                                className: "compact",
                                onClick: applyRange,
                                type: "button",
                                children: t("dateRange.apply")
                            })
                        ]
                    })
                ]
            }) : null
        ]
    });
}
function CalendarPanel({ highlightedRange, lang, onSelect, selectedDate, setViewDate, viewDate }) {
    const weekdays = lang === "en" ? [
        "Mo",
        "Tu",
        "We",
        "Th",
        "Fr",
        "Sa",
        "Su"
    ] : [
        "Пн",
        "Вт",
        "Ср",
        "Чт",
        "Пт",
        "Сб",
        "Нд"
    ];
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const leadingEmptyDays = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [
        ...Array.from({
            length: leadingEmptyDays
        }, (_, index)=>({
                day: 0,
                key: `empty-${index}`
            })),
        ...Array.from({
            length: daysInMonth
        }, (_, index)=>({
                day: index + 1,
                key: `day-${index + 1}`
            }))
    ];
    return /*#__PURE__*/ _jsxs("div", {
        className: "calendar-popover",
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: "calendar-head",
                children: [
                    /*#__PURE__*/ _jsx("button", {
                        className: "calendar-nav",
                        onClick: ()=>setViewDate(new Date(year, month - 1, 1)),
                        type: "button",
                        children: "‹"
                    }),
                    /*#__PURE__*/ _jsx("strong", {
                        children: formatMonthLabel(viewDate, lang)
                    }),
                    /*#__PURE__*/ _jsx("button", {
                        className: "calendar-nav",
                        onClick: ()=>setViewDate(new Date(year, month + 1, 1)),
                        type: "button",
                        children: "›"
                    })
                ]
            }),
            /*#__PURE__*/ _jsx("div", {
                className: "calendar-weekdays",
                children: weekdays.map((day)=>/*#__PURE__*/ _jsx("small", {
                        children: day
                    }, day))
            }),
            /*#__PURE__*/ _jsx("div", {
                className: "calendar-grid",
                children: cells.map((cell)=>{
                    if (!cell.day) return /*#__PURE__*/ _jsx("span", {
                        "aria-hidden": "true"
                    }, cell.key);
                    const cellDate = new Date(year, month, cell.day);
                    const active = isSameCalendarDay(cellDate, selectedDate);
                    const highlighted = highlightedRange ? isDateInRange(cellDate, highlightedRange) : false;
                    const rangeStart = highlightedRange ? isSameCalendarDay(cellDate, highlightedRange.from) : false;
                    const rangeEnd = highlightedRange ? isSameCalendarDay(cellDate, highlightedRange.to) : false;
                    const className = [
                        "calendar-day",
                        active ? "active" : "",
                        highlighted ? "in-range" : "",
                        rangeStart ? "range-start" : "",
                        rangeEnd ? "range-end" : ""
                    ].filter(Boolean).join(" ");
                    return /*#__PURE__*/ _jsx("button", {
                        className: className,
                        onClick: ()=>onSelect(cellDate),
                        type: "button",
                        children: cell.day
                    }, cell.key);
                })
            })
        ]
    });
}
function InteractiveFilterBar({ filters, onReset, onSearchChange, searchPlaceholder, searchValue, trailingAction }) {
    const { t } = useI18n();
    return /*#__PURE__*/ _jsxs("div", {
        className: trailingAction ? "filter-bar has-trailing-action" : "filter-bar",
        children: [
            /*#__PURE__*/ _jsxs("label", {
                className: "search-box compact",
                children: [
                    /*#__PURE__*/ _jsx(Icon, {
                        name: "search"
                    }),
                    /*#__PURE__*/ _jsx("input", {
                        onChange: (event)=>onSearchChange(event.target.value),
                        placeholder: searchPlaceholder,
                        value: searchValue
                    })
                ]
            }),
            filters.map((filter)=>{
                if (filter.range) {
                    return /*#__PURE__*/ _jsx(DateRangeButton, {
                        className: "select-like",
                        label: filter.label,
                        onChange: (range)=>filter.onRangeChange?.(range),
                        range: filter.range
                    }, filter.label);
                }
                if (filter.calendar) {
                    return /*#__PURE__*/ _jsx(CalendarButton, {
                        className: "select-like",
                        date: filter.date,
                        label: filter.label,
                        onSelect: (date)=>filter.onDateChange?.(date),
                        value: filter.options?.find((option)=>option.value === filter.value)?.label ?? formatMonthLabel(filter.date ?? new Date(), "uk")
                    }, filter.label);
                }
                return /*#__PURE__*/ _jsx(FilterSelect, {
                    label: filter.label,
                    onChange: (value)=>filter.onChange?.(value),
                    options: filter.options ?? [],
                    value: filter.value ?? ""
                }, filter.label);
            }),
            /*#__PURE__*/ _jsxs("button", {
                className: "secondary-button",
                onClick: onReset,
                type: "button",
                children: [
                    /*#__PURE__*/ _jsx(Icon, {
                        name: "refresh"
                    }),
                    ` ${t("actions.reset")}`
                ]
            }),
            trailingAction
        ]
    });
}
function SelectLike({ calendar = false, label, value }) {
    if (calendar) {
        return /*#__PURE__*/ _jsx(CalendarButton, {
            className: "select-like",
            label: label,
            value: value
        });
    }
    return /*#__PURE__*/ _jsxs("button", {
        className: "select-like",
        type: "button",
        children: [
            label ? /*#__PURE__*/ _jsx("small", {
                children: label
            }) : null,
            /*#__PURE__*/ _jsx("span", {
                children: value
            }),
            /*#__PURE__*/ _jsx(Icon, {
                name: "chevronDown"
            })
        ]
    });
}
function FilterSelect({ disabled = false, label, onChange, options, value }) {
    return /*#__PURE__*/ _jsxs("label", {
        className: "select-like filter-select",
        children: [
            label ? /*#__PURE__*/ _jsx("small", {
                children: label
            }) : null,
            /*#__PURE__*/ _jsx("select", {
                className: "select-input",
                disabled: disabled,
                onChange: (event)=>onChange(event.target.value),
                value: value,
                children: options.map((option)=>/*#__PURE__*/ _jsx("option", {
                        value: option.value,
                        children: option.label
                    }, option.value))
            }),
            /*#__PURE__*/ _jsx(Icon, {
                name: "chevronDown"
            })
        ]
    });
}
function SimpleArea({ color, data = trendData, dataKey, xKey = "month" }) {
    return /*#__PURE__*/ _jsx(ResponsiveContainer, {
        height: 245,
        width: "100%",
        children: /*#__PURE__*/ _jsxs(AreaChart, {
            data: data,
            children: [
                /*#__PURE__*/ _jsx("defs", {
                    children: /*#__PURE__*/ _jsxs("linearGradient", {
                        id: `gradient-${dataKey}`,
                        x1: "0",
                        x2: "0",
                        y1: "0",
                        y2: "1",
                        children: [
                            /*#__PURE__*/ _jsx("stop", {
                                offset: "0%",
                                stopColor: color,
                                stopOpacity: 0.22
                            }),
                            /*#__PURE__*/ _jsx("stop", {
                                offset: "100%",
                                stopColor: color,
                                stopOpacity: 0.02
                            })
                        ]
                    })
                }),
                /*#__PURE__*/ _jsx(CartesianGrid, {
                    stroke: "#edf1f6",
                    vertical: false
                }),
                /*#__PURE__*/ _jsx(XAxis, {
                    axisLine: false,
                    dataKey: xKey,
                    tickLine: false
                }),
                /*#__PURE__*/ _jsx(YAxis, {
                    axisLine: false,
                    tickFormatter: (value)=>Number(value) >= 1000 ? `${Math.round(Number(value) / 100) / 10}K` : Number(value).toLocaleString("uk-UA"),
                    tickLine: false
                }),
                /*#__PURE__*/ _jsx(Tooltip, {
                    formatter: (value)=>formatMoney(Number(value))
                }),
                /*#__PURE__*/ _jsx(Area, {
                    dataKey: dataKey,
                    fill: `url(#gradient-${dataKey})`,
                    stroke: color,
                    strokeWidth: 3,
                    type: "monotone"
                })
            ]
        })
    });
}
function Legend({ items }) {
    return /*#__PURE__*/ _jsx("div", {
        className: "legend",
        children: items.map(([label, color])=>/*#__PURE__*/ _jsxs("span", {
                children: [
                    /*#__PURE__*/ _jsx("i", {
                        style: {
                            background: color
                        }
                    }),
                    label
                ]
            }, label))
    });
}
function CategoryLine({ category, total }) {
    const percent = total ? Math.round(category.total / total * 1000) / 10 : 0;
    return /*#__PURE__*/ _jsxs("div", {
        className: "category-row",
        children: [
            /*#__PURE__*/ _jsx("span", {
                className: "dot",
                style: {
                    background: category.color
                }
            }),
            /*#__PURE__*/ _jsx("strong", {
                children: category.name
            }),
            /*#__PURE__*/ _jsx("span", {
                children: formatMoney(category.total)
            }),
            /*#__PURE__*/ _jsxs("small", {
                children: [
                    percent,
                    "%"
                ]
            })
        ]
    });
}
function CategoryDetailLine({ category, total }) {
    const percent = total ? Math.round(category.total / total * 1000) / 10 : 0;
    return /*#__PURE__*/ _jsxs("div", {
        className: "category-detail-row",
        children: [
            /*#__PURE__*/ _jsx("span", {
                className: "cat-dot",
                style: { background: category.color }
            }),
            /*#__PURE__*/ _jsx("span", {
                className: "cat-name",
                children: category.name
            }),
            /*#__PURE__*/ _jsxs("span", {
                className: "cat-pct",
                children: [percent, "%"]
            }),
            /*#__PURE__*/ _jsx("span", {
                className: "cat-amount",
                children: formatMoney(category.total)
            }),
            /*#__PURE__*/ _jsx("div", {
                className: "cat-bar",
                children: /*#__PURE__*/ _jsx("span", {
                    style: {
                        width: `${Math.min(percent, 100)}%`,
                        background: category.color
                    }
                })
            })
        ]
    });
}
function BudgetProgress({ budget, onEdit }) {
    const { t } = useI18n();
    return /*#__PURE__*/ _jsxs("div", {
        className: "budget-row",
        children: [
            /*#__PURE__*/ _jsx("span", {
                className: "budget-icon",
                style: {
                    color: budget.categoryColor
                },
                children: /*#__PURE__*/ _jsx(Icon, {
                    name: iconForCategory(budget.category, budget.categoryIcon)
                })
            }),
            /*#__PURE__*/ _jsx("strong", {
                children: budget.category
            }),
            /*#__PURE__*/ _jsxs("span", {
                children: [
                    formatMoney(budget.spent),
                    " / ",
                    formatMoney(budget.limit)
                ]
            }),
            /*#__PURE__*/ _jsxs("small", {
                children: [
                    budget.percent,
                    "%"
                ]
            }),
            onEdit ? /*#__PURE__*/ _jsx("button", {
                "aria-label": t("tx.editRecord"),
                className: "icon-button budget-edit-btn",
                onClick: ()=>onEdit(budget),
                type: "button",
                children: /*#__PURE__*/ _jsx(Icon, {
                    name: "edit"
                })
            }) : null,
            /*#__PURE__*/ _jsx("div", {
                className: "budget-track",
                children: /*#__PURE__*/ _jsx("i", {
                    style: {
                        background: budget.categoryColor,
                        width: `${Math.min(budget.percent, 100)}%`
                    }
                })
            })
        ]
    });
}
function Insight({ text, title }) {
    return /*#__PURE__*/ _jsxs("article", {
        className: "insight",
        children: [
            /*#__PURE__*/ _jsx("span", {
                children: /*#__PURE__*/ _jsx(Icon, {
                    name: "goals"
                })
            }),
            /*#__PURE__*/ _jsxs("div", {
                children: [
                    /*#__PURE__*/ _jsx("strong", {
                        children: title
                    }),
                    /*#__PURE__*/ _jsx("small", {
                        children: text
                    })
                ]
            })
        ]
    });
}
function AlertList({ rows = [] }) {
    const { t } = useI18n();
    const alerts = buildExpenseSignals(rows).slice(0, 6).map((row)=>{
        const reasons = [];
        if (row.sourceStatus === "NEEDS_REVIEW") reasons.push("AI позначив для перевірки");
        if (!row.categoryId && !row.category) reasons.push("без категорії");
        if (typeof row.confidence === "number" && row.confidence > 0 && row.confidence < 0.6) reasons.push(`низька впевненість AI (${Math.round(row.confidence * 100)}%)`);
        return `${row.category ?? "Без категорії"} — ${formatMoney(row.amount)}${row.description ? ` · ${row.description}` : ""}${reasons.length ? ` · ${reasons.join(", ")}` : ""}`;
    });
    return /*#__PURE__*/ _jsx(CompactList, {
        items: alerts.length ? alerts : [
            t("ai.signals.empty")
        ]
    });
}
function CompactList({ items }) {
    return /*#__PURE__*/ _jsx("div", {
        className: "compact-list",
        children: items.map((item)=>/*#__PURE__*/ _jsxs("div", {
                className: "compact-item",
                children: [
                    /*#__PURE__*/ _jsx("span", {
                        children: /*#__PURE__*/ _jsx(Icon, {
                            name: "chevronRight"
                        })
                    }),
                    /*#__PURE__*/ _jsx("p", {
                        children: item
                    })
                ]
            }, item))
    });
}
function Idea({ icon, text, title }) {
    return /*#__PURE__*/ _jsxs("article", {
        className: "idea-card",
        children: [
            /*#__PURE__*/ _jsx("span", {
                children: /*#__PURE__*/ _jsx(Icon, {
                    name: icon
                })
            }),
            /*#__PURE__*/ _jsxs("div", {
                children: [
                    /*#__PURE__*/ _jsx("strong", {
                        children: title
                    }),
                    /*#__PURE__*/ _jsx("small", {
                        children: text
                    })
                ]
            }),
            /*#__PURE__*/ _jsx(Icon, {
                name: "chevronRight"
            })
        ]
    });
}
function Gauge({ label, value }) {
    return /*#__PURE__*/ _jsxs("div", {
        className: "gauge",
        style: {
            "--value": `${value * 3.6}deg`
        },
        children: [
            /*#__PURE__*/ _jsxs("strong", {
                children: [
                    value,
                    "%"
                ]
            }),
            /*#__PURE__*/ _jsx("small", {
                children: label
            })
        ]
    });
}
function Heatmap({ rows = [] }) {
    const slotLabels = rows[0]?.values?.map((value)=>value.label) ?? [
        "00-03",
        "03-06",
        "06-09",
        "09-12",
        "12-15",
        "15-18",
        "18-21",
        "21-24"
    ];
    return /*#__PURE__*/ _jsxs("div", {
        className: "heatmap",
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: "heatmap-hours",
                children: [
                    /*#__PURE__*/ _jsx("span", {}),
                    slotLabels.map((item)=>/*#__PURE__*/ _jsx("small", {
                            children: item
                        }, item))
                ]
            }),
            rows.map(({ day, values })=>/*#__PURE__*/ _jsxs("div", {
                    className: "heatmap-row",
                    children: [
                        /*#__PURE__*/ _jsx("small", {
                            children: day
                        }),
                        values.map((value, index)=>/*#__PURE__*/ _jsx("i", {
                                style: {
                                    opacity: value.intensity
                                },
                                title: value.count > 0 ? `${value.label}: ${value.count} операц. · ${formatMoney(value.amount)}` : `${value.label}: без витрат`
                            }, `${day}-${index}`))
                    ]
                }, day)),
            /*#__PURE__*/ _jsxs("div", {
                className: "heatmap-legend",
                children: [
                    /*#__PURE__*/ _jsx("span", {
                        children: "Низька активність"
                    }),
                    /*#__PURE__*/ _jsx("i", {}),
                    /*#__PURE__*/ _jsx("i", {}),
                    /*#__PURE__*/ _jsx("i", {}),
                    /*#__PURE__*/ _jsx("span", {
                        children: "Висока активність"
                    })
                ]
            })
        ]
    });
}
function MetricInline({ label, value }) {
    return /*#__PURE__*/ _jsxs("div", {
        className: "metric-inline",
        children: [
            /*#__PURE__*/ _jsx(Icon, {
                name: "chart"
            }),
            /*#__PURE__*/ _jsx("small", {
                children: label
            }),
            /*#__PURE__*/ _jsx("strong", {
                children: formatMoney(value)
            })
        ]
    });
}
function GoalMiniList({ goals }) {
    return /*#__PURE__*/ _jsx("div", {
        className: "goal-mini-list",
        children: goals.slice(0, 2).map((goal)=>/*#__PURE__*/ _jsxs("div", {
                children: [
                    /*#__PURE__*/ _jsx("img", {
                        alt: goal.name,
                        src: goal.imageUrl ?? ""
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        children: [
                            /*#__PURE__*/ _jsx("strong", {
                                children: goal.name
                            }),
                            /*#__PURE__*/ _jsx("div", {
                                className: "progress",
                                children: /*#__PURE__*/ _jsx("span", {
                                    style: {
                                        width: `${goal.percent}%`
                                    }
                                })
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("small", {
                        children: [
                            goal.percent,
                            "%"
                        ]
                    })
                ]
            }, goal.id))
    });
}
function AccountList({ accounts, onDelete, onEdit }) {
    return /*#__PURE__*/ _jsx("div", {
        className: "account-list",
        children: accounts.map((account)=>/*#__PURE__*/ _jsxs("div", {
                className: "account-row",
                children: [
                    /*#__PURE__*/ _jsx("span", {
                        children: /*#__PURE__*/ _jsx(Icon, {
                            name: "bank"
                        })
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        children: [
                            /*#__PURE__*/ _jsx("strong", {
                                children: account.name
                            }),
                            /*#__PURE__*/ _jsx("small", {
                                children: account.maskedPan ?? "Рахунок"
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsx("strong", {
                        children: formatMoney(account.balance)
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        className: "row-actions",
                        children: [
                            onEdit ? /*#__PURE__*/ _jsx("button", {
                                className: "row-action",
                                onClick: ()=>onEdit(account),
                                type: "button",
                                children: /*#__PURE__*/ _jsx(Icon, {
                                    name: "edit"
                                })
                            }) : null,
                            onDelete ? /*#__PURE__*/ _jsx("button", {
                                className: "row-action danger",
                                onClick: ()=>onDelete(account.id, account.name),
                                type: "button",
                                children: /*#__PURE__*/ _jsx(Icon, {
                                    name: "trash"
                                })
                            }) : null
                        ]
                    })
                ]
            }, account.id))
    });
}
function CategorySettingsPanel({ categories, onDelete, onEdit, onImportTemplates, onNew }) {
    const [showTemplates, setShowTemplates] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [selectedSlugs, setSelectedSlugs] = useState([]);
    const [templatesLoading, setTemplatesLoading] = useState(false);
    const ownedCategories = categories.filter((c)=>c.ownedByUser !== false);
    async function openTemplates() {
        setTemplatesLoading(true);
        setShowTemplates(true);
        try {
            const response = await fetch("/api/proxy/category-templates");
            if (response.ok) {
                setTemplates(await response.json());
            }
        } catch  {}
        setTemplatesLoading(false);
    }
    function toggleSlug(slug) {
        setSelectedSlugs((prev)=>prev.includes(slug) ? prev.filter((s)=>s !== slug) : [...prev, slug]);
    }
    async function importSelected() {
        if (selectedSlugs.length === 0) return;
        await onImportTemplates(selectedSlugs);
        setShowTemplates(false);
        setSelectedSlugs([]);
    }
    const templateGroups = templates.reduce((acc, tpl)=>{
        if (!acc[tpl.group]) acc[tpl.group] = [];
        acc[tpl.group].push(tpl);
        return acc;
    }, {});
    return /*#__PURE__*/ _jsxs(_Fragment, {
        children: [
            /*#__PURE__*/ _jsx(Panel, {
                className: "span-full",
                title: "\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0456\u0457",
                children: /*#__PURE__*/ _jsxs(_Fragment, {
                    children: [
                        /*#__PURE__*/ _jsxs("div", {
                            className: "category-panel-actions",
                            children: [
                                /*#__PURE__*/ _jsxs("button", {
                                    className: "tiny-action",
                                    onClick: onNew,
                                    type: "button",
                                    children: [/*#__PURE__*/ _jsx(Icon, { name: "plus" }), " \u0414\u043e\u0434\u0430\u0442\u0438"]
                                }),
                                /*#__PURE__*/ _jsxs("button", {
                                    className: "tiny-action secondary",
                                    onClick: openTemplates,
                                    type: "button",
                                    children: [/*#__PURE__*/ _jsx(Icon, { name: "spark" }), " \u0428\u0430\u0431\u043b\u043e\u043d\u0438"]
                                })
                            ]
                        }),
                        ownedCategories.length === 0 ? /*#__PURE__*/ _jsxs("div", {
                            className: "categories-empty",
                            children: [
                                /*#__PURE__*/ _jsx("p", { children: "\u0423 \u0432\u0430\u0441 \u0449\u0435 \u043d\u0435\u043c\u0430\u0454 \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0456\u0439. \u0414\u043e\u0434\u0430\u0439\u0442\u0435 \u0432\u043b\u0430\u0441\u043d\u0456 \u0430\u0431\u043e \u043e\u0431\u0435\u0440\u0456\u0442\u044c \u0437 \u0448\u0430\u0431\u043b\u043e\u043d\u0456\u0432." }),
                                /*#__PURE__*/ _jsxs("button", {
                                    className: "primary-button",
                                    onClick: openTemplates,
                                    type: "button",
                                    children: [/*#__PURE__*/ _jsx(Icon, { name: "spark" }), " \u0412\u0438\u0431\u0440\u0430\u0442\u0438 \u0437 \u0448\u0430\u0431\u043b\u043e\u043d\u0456\u0432"]
                                })
                            ]
                        }) : /*#__PURE__*/ _jsx(CategorySettings, {
                            categories: ownedCategories,
                            onDelete: onDelete,
                            onEdit: onEdit
                        })
                    ]
                })
            }),
            showTemplates ? /*#__PURE__*/ _jsxs("div", {
                className: "modal-backdrop",
                onClick: (e)=>{ if (e.target === e.currentTarget) setShowTemplates(false); },
                children: [
                    /*#__PURE__*/ _jsxs("div", {
                        className: "template-modal",
                        children: [
                            /*#__PURE__*/ _jsxs("div", {
                                className: "modal-header",
                                children: [
                                    /*#__PURE__*/ _jsxs("div", {
                                        className: "modal-header-text",
                                        children: [
                                            /*#__PURE__*/ _jsx("h2", { children: "\u0428\u0430\u0431\u043b\u043e\u043d\u0438 \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0456\u0439" }),
                                            /*#__PURE__*/ _jsx("p", { className: "modal-subtitle", children: "\u041e\u0431\u0435\u0440\u0456\u0442\u044c \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0456\u0457 \u0434\u043b\u044f \u0434\u043e\u0434\u0430\u0432\u0430\u043d\u043d\u044f \u0434\u043e \u0432\u0430\u0448\u043e\u0433\u043e \u0441\u043f\u0438\u0441\u043a\u0443" })
                                        ]
                                    }),
                                    /*#__PURE__*/ _jsx("button", {
                                        "aria-label": "\u0417\u0430\u043a\u0440\u0438\u0442\u0438",
                                        className: "modal-close",
                                        onClick: ()=>setShowTemplates(false),
                                        type: "button",
                                        children: /*#__PURE__*/ _jsx(Icon, { name: "close" })
                                    })
                                ]
                            }),
                            /*#__PURE__*/ _jsx("div", {
                                className: "template-modal-body",
                                children: templatesLoading ? /*#__PURE__*/ _jsx("div", { className: "template-loading", children: "\u0417\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0435\u043d\u043d\u044f\u2026" }) : templates.length === 0 ? /*#__PURE__*/ _jsx("div", { className: "template-loading", children: "\u0423\u0441\u0456 \u0448\u0430\u0431\u043b\u043e\u043d\u0438 \u0432\u0436\u0435 \u0434\u043e\u0434\u0430\u043d\u043e." }) : Object.entries(templateGroups).map(([group, items])=>/*#__PURE__*/ _jsxs("div", {
                                    className: "template-group",
                                    children: [
                                        /*#__PURE__*/ _jsx("h3", { children: group }),
                                        /*#__PURE__*/ _jsx("div", {
                                            className: "template-list",
                                            children: items.map((tpl)=>/*#__PURE__*/ _jsxs("label", {
                                                className: "template-item" + (selectedSlugs.includes(tpl.slug) ? " selected" : ""),
                                                key: tpl.slug,
                                                children: [
                                                    /*#__PURE__*/ _jsx("input", {
                                                        checked: selectedSlugs.includes(tpl.slug),
                                                        onChange: ()=>toggleSlug(tpl.slug),
                                                        type: "checkbox"
                                                    }),
                                                    /*#__PURE__*/ _jsx("span", {
                                                        className: "template-icon",
                                                        style: { color: tpl.color },
                                                        children: /*#__PURE__*/ _jsx(Icon, { name: tpl.icon })
                                                    }),
                                                    /*#__PURE__*/ _jsx("span", { children: tpl.name })
                                                ]
                                            }))
                                        })
                                    ]
                                }, group))
                            }),
                            /*#__PURE__*/ _jsxs("div", {
                                className: "modal-actions",
                                children: [
                                    /*#__PURE__*/ _jsx("button", {
                                        className: "secondary-button",
                                        onClick: ()=>setShowTemplates(false),
                                        type: "button",
                                        children: "\u0421\u043a\u0430\u0441\u0443\u0432\u0430\u0442\u0438"
                                    }),
                                    /*#__PURE__*/ _jsxs("button", {
                                        className: "primary-button",
                                        disabled: selectedSlugs.length === 0,
                                        onClick: importSelected,
                                        type: "button",
                                        children: ["\u0414\u043e\u0434\u0430\u0442\u0438 \u0432\u0438\u0431\u0440\u0430\u043d\u0456 (", selectedSlugs.length, ")"]
                                    })
                                ]
                            })
                        ]
                    })
                ]
            }) : null
        ]
    });
}
function CategorySettings({ categories, onDelete, onEdit }) {
    return /*#__PURE__*/ _jsx("div", {
        className: "category-grid",
        children: categories.map((category)=>/*#__PURE__*/ _jsxs("div", {
                className: "account-row",
                children: [
                    /*#__PURE__*/ _jsx("span", {
                        style: {
                            color: category.color
                        },
                        children: /*#__PURE__*/ _jsx(Icon, {
                            name: iconForCategory(category.name, category.icon)
                        })
                    }),
                    /*#__PURE__*/ _jsx("strong", {
                        children: category.name
                    }),
                    /*#__PURE__*/ _jsxs("small", {
                        children: [
                            Math.round(category.total / 31780 * 100),
                            "%"
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        className: "row-actions",
                        children: [
                            onEdit ? /*#__PURE__*/ _jsx("button", {
                                className: "row-action",
                                onClick: ()=>onEdit(category),
                                type: "button",
                                children: /*#__PURE__*/ _jsx(Icon, {
                                    name: "edit"
                                })
                            }) : null,
                            onDelete && category.id ? /*#__PURE__*/ _jsx("button", {
                                className: "row-action danger",
                                onClick: ()=>onDelete(category.id, category.name),
                                type: "button",
                                children: /*#__PURE__*/ _jsx(Icon, {
                                    name: "trash"
                                })
                            }) : null
                        ]
                    })
                ]
            }, category.id ?? category.name))
    });
}
function ToggleRow({ enabled, label, onChange, text }) {
    return /*#__PURE__*/ _jsxs("div", {
        className: "toggle-row",
        children: [
            /*#__PURE__*/ _jsxs("div", {
                children: [
                    /*#__PURE__*/ _jsx("strong", {
                        children: label
                    }),
                    /*#__PURE__*/ _jsx("small", {
                        children: text
                    })
                ]
            }),
            /*#__PURE__*/ _jsx("button", {
                className: enabled ? "toggle on" : "toggle",
                onClick: ()=>onChange(!enabled),
                type: "button",
                children: /*#__PURE__*/ _jsx("span", {})
            })
        ]
    });
}
function IntegrationRow({ actionHref, actionLabel, connected, icon, label, text }) {
    const { t } = useI18n();
    return /*#__PURE__*/ _jsxs("div", {
        className: "integration-row",
        children: [
            /*#__PURE__*/ _jsx("span", {
                children: /*#__PURE__*/ _jsx(Icon, {
                    name: icon
                })
            }),
            /*#__PURE__*/ _jsxs("div", {
                children: [
                    /*#__PURE__*/ _jsx("strong", {
                        children: label
                    }),
                    /*#__PURE__*/ _jsx("small", {
                        children: text
                    })
                ]
            }),
            /*#__PURE__*/ _jsx("small", {
                className: connected ? "positive" : "",
                children: connected ? t("integration.connected") : t("integration.connect")
            }),
            actionHref ? /*#__PURE__*/ _jsx("a", {
                className: "tiny-action integration-link",
                href: actionHref,
                rel: "noreferrer",
                target: "_blank",
                children: actionLabel ?? t("integration.open")
            }) : /*#__PURE__*/ _jsx(Icon, {
                name: "more"
            })
        ]
    });
}
function RateRow({ rate }) {
    const isUp = rate.changePercent >= 0;
    return /*#__PURE__*/ _jsxs("div", {
        className: "rate-row",
        children: [
            /*#__PURE__*/ _jsx("strong", {
                children: rate.code
            }),
            /*#__PURE__*/ _jsx("span", {
                children: rate.rate.toLocaleString("uk-UA", {
                    maximumFractionDigits: 4,
                    minimumFractionDigits: 2
                })
            }),
            /*#__PURE__*/ _jsxs("small", {
                className: isUp ? "positive" : "negative",
                children: [
                    isUp ? "+" : "",
                    rate.changePercent.toFixed(2),
                    "%"
                ]
            })
        ]
    });
}
function latestDateFromRows(rows) {
    const latest = rows.reduce((current, row)=>{
        const candidate = new Date(row.date);
        return candidate.getTime() > current.getTime() ? candidate : current;
    }, new Date(2024, 4, 1));
    return new Date(latest.getFullYear(), latest.getMonth(), 1);
}
function latestRangeFromRows(rows) {
    return monthRangeFromDate(latestDateFromRows(rows));
}
function groupIncomesBySource(incomes) {
    const colors = [
        "#22c55e",
        "#3b82f6",
        "#64748b",
        "#f59e0b",
        "#9ca3af"
    ];
    const map = new Map();
    incomes.forEach((income)=>map.set(income.source, (map.get(income.source) ?? 0) + income.amount));
    return Array.from(map.entries()).map(([name, total], index)=>({
            color: colors[index % colors.length],
            name,
            total
        })).sort((left, right)=>right.total - left.total);
}
function buildIncomeTrendData(incomes, range) {
    const normalized = normalizeDateRange(range);
    const totalDays = daysInRange(normalized);
    if (totalDays <= 45) {
        const dayMap = new Map();
        incomes.forEach((income)=>{
            const date = startOfDay(new Date(income.date));
            const key = date.toISOString().slice(0, 10);
            dayMap.set(key, (dayMap.get(key) ?? 0) + income.amount);
        });
        const result = [];
        for(let cursor = new Date(normalized.from); cursor.getTime() <= normalized.to.getTime(); cursor.setDate(cursor.getDate() + 1)){
            const key = cursor.toISOString().slice(0, 10);
            result.push({
                label: `${String(cursor.getDate()).padStart(2, "0")}.${String(cursor.getMonth() + 1).padStart(2, "0")}`,
                total: dayMap.get(key) ?? 0
            });
        }
        return result;
    }
    const monthMap = new Map();
    incomes.forEach((income)=>{
        const date = new Date(income.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthMap.set(key, (monthMap.get(key) ?? 0) + income.amount);
    });
    const result = [];
    const cursor = new Date(normalized.from.getFullYear(), normalized.from.getMonth(), 1);
    const endCursor = new Date(normalized.to.getFullYear(), normalized.to.getMonth(), 1);
    while(cursor.getTime() <= endCursor.getTime()){
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
        result.push({
            label: monthShortLabel(cursor),
            total: monthMap.get(key) ?? 0
        });
        cursor.setMonth(cursor.getMonth() + 1);
    }
    return result;
}
function buildExpenseTrendData(expenses, range) {
    const normalized = normalizeDateRange(range);
    const dayMap = new Map();
    expenses.forEach((expense)=>{
        const date = startOfDay(new Date(expense.date));
        const key = date.toISOString().slice(0, 10);
        dayMap.set(key, (dayMap.get(key) ?? 0) + expense.amount);
    });
    const result = [];
    for(let cursor = new Date(normalized.from); cursor.getTime() <= normalized.to.getTime(); cursor.setDate(cursor.getDate() + 1)){
        const key = cursor.toISOString().slice(0, 10);
        result.push({
            label: `${String(cursor.getDate()).padStart(2, "0")}.${String(cursor.getMonth() + 1).padStart(2, "0")}`,
            total: dayMap.get(key) ?? 0
        });
    }
    return result;
}
function previousRangeFromRange(range) {
    const normalized = normalizeDateRange(range);
    const totalDays = daysInRange(normalized);
    const previousTo = new Date(normalized.from);
    previousTo.setDate(previousTo.getDate() - 1);
    const previousFrom = new Date(previousTo);
    previousFrom.setDate(previousFrom.getDate() - totalDays + 1);
    return {
        from: startOfDay(previousFrom),
        to: endOfDay(previousTo)
    };
}
function buildDeltaPercent(current, previous) {
    if (previous === 0 && current === 0) return 0;
    if (previous === 0) return current > 0 ? 100 : -100;
    return Math.round((current - previous) / Math.abs(previous) * 1000) / 10;
}
function buildCashflowTrendData(expenses, incomes, range) {
    const normalized = normalizeDateRange(range);
    const totalDays = daysInRange(normalized);
    if (totalDays <= 45) {
        const incomeMap = new Map();
        const expenseMap = new Map();
        incomes.forEach((income)=>{
            const key = startOfDay(new Date(income.date)).toISOString().slice(0, 10);
            incomeMap.set(key, (incomeMap.get(key) ?? 0) + income.amount);
        });
        expenses.forEach((expense)=>{
            const key = startOfDay(new Date(expense.date)).toISOString().slice(0, 10);
            expenseMap.set(key, (expenseMap.get(key) ?? 0) + expense.amount);
        });
        const result = [];
        for(let cursor = new Date(normalized.from); cursor.getTime() <= normalized.to.getTime(); cursor.setDate(cursor.getDate() + 1)){
            const key = cursor.toISOString().slice(0, 10);
            const income = incomeMap.get(key) ?? 0;
            const expense = expenseMap.get(key) ?? 0;
            result.push({
                expense,
                income,
                label: `${String(cursor.getDate()).padStart(2, "0")}.${String(cursor.getMonth() + 1).padStart(2, "0")}`,
                net: income - expense
            });
        }
        return result;
    }
    const incomeMap = new Map();
    const expenseMap = new Map();
    incomes.forEach((income)=>{
        const date = new Date(income.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        incomeMap.set(key, (incomeMap.get(key) ?? 0) + income.amount);
    });
    expenses.forEach((expense)=>{
        const date = new Date(expense.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        expenseMap.set(key, (expenseMap.get(key) ?? 0) + expense.amount);
    });
    const result = [];
    const cursor = new Date(normalized.from.getFullYear(), normalized.from.getMonth(), 1);
    const endCursor = new Date(normalized.to.getFullYear(), normalized.to.getMonth(), 1);
    while(cursor.getTime() <= endCursor.getTime()){
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
        const income = incomeMap.get(key) ?? 0;
        const expense = expenseMap.get(key) ?? 0;
        result.push({
            expense,
            income,
            label: monthShortLabel(cursor),
            net: income - expense
        });
        cursor.setMonth(cursor.getMonth() + 1);
    }
    return result;
}
function buildExpenseHeatmapRows(expenses) {
    const dayLabels = [
        "Пн",
        "Вт",
        "Ср",
        "Чт",
        "Пт",
        "Сб",
        "Нд"
    ];
    const slotLabels = [
        "00-03",
        "03-06",
        "06-09",
        "09-12",
        "12-15",
        "15-18",
        "18-21",
        "21-24"
    ];
    const matrix = dayLabels.map(()=>slotLabels.map(()=>({
                amount: 0,
                count: 0
            })));
    expenses.forEach((expense)=>{
        const date = new Date(expense.date);
        const dayIndex = (date.getDay() + 6) % 7;
        const slotIndex = Math.min(slotLabels.length - 1, Math.floor(date.getHours() / 3));
        matrix[dayIndex][slotIndex].amount += expense.amount;
        matrix[dayIndex][slotIndex].count += 1;
    });
    const maxAmount = Math.max(0, ...matrix.flat().map((cell)=>cell.amount));
    return dayLabels.map((day, dayIndex)=>({
            day,
            values: matrix[dayIndex].map((cell, slotIndex)=>({
                    amount: cell.amount,
                    count: cell.count,
                    intensity: maxAmount > 0 ? Math.max(0.12, cell.amount / maxAmount) : 0.12,
                    label: slotLabels[slotIndex]
                }))
        }));
}
function buildCashflowScore({ expenseRatio, periodExpenseTotal, periodIncomeTotal, reviewCount, savingsRate }) {
    if (periodExpenseTotal <= 0 && periodIncomeTotal <= 0) return 0;
    if (periodIncomeTotal <= 0 && periodExpenseTotal > 0) return 18;
    const baseScore = 100 - Math.max(0, expenseRatio - 55) * 0.9 + savingsRate * 0.45 - reviewCount * 6;
    return Math.max(18, Math.min(98, Math.round(baseScore)));
}
function cashflowHealthSummary(score) {
    if (score >= 85) {
        return {
            label: "health.great",
            message: "health.greatMsg"
        };
    }
    if (score >= 70) {
        return {
            label: "health.good",
            message: "health.goodMsg"
        };
    }
    if (score >= 50) {
        return {
            label: "health.warning",
            message: "health.warningMsg"
        };
    }
    return {
        label: "health.risk",
        message: "health.riskMsg"
    };
}
function buildAnalyticsInsights({ categories, currentExpenseTotal, currentIncomeTotal, expenseRatio, previousExpenseTotal, previousIncomeTotal, reviewCount, savingsRate }) {
    const items = [];
    const top = categories[0];
    const subscriptionCategory = categories.find((category)=>category.name.toLocaleLowerCase("uk-UA").includes("підпис") || category.name.toLocaleLowerCase("uk-UA").includes("ai"));
    const expenseDelta = buildDeltaPercent(currentExpenseTotal, previousExpenseTotal);
    const incomeDelta = buildDeltaPercent(currentIncomeTotal, previousIncomeTotal);
    if (top && currentExpenseTotal > 0) {
        const share = Math.round(top.total / currentExpenseTotal * 1000) / 10;
        items.push(`Найбільший тиск на бюджет дає категорія "${top.name}" — ${formatMoney(top.total)} (${share}%).`);
    }
    if (subscriptionCategory && subscriptionCategory.total > 0) {
        items.push(`На підписки та AI зараз іде ${formatMoney(subscriptionCategory.total)}. Це хороший кандидат для оптимізації.`);
    }
    if (reviewCount > 0) {
        items.push(`${reviewCount} витрат ще потребують перевірки AI або ручного підтвердження категорії.`);
    }
    if (currentIncomeTotal > 0) {
        items.push(expenseRatio <= 70 ? `Співвідношення витрат до доходів тримається в зеленій зоні: ${expenseRatio}%.` : `Витрати вже зʼїдають ${expenseRatio}% доходів. Тут варто трохи пригальмувати.`);
    }
    if (currentExpenseTotal > 0 && previousExpenseTotal > 0) {
        items.push(`Порівняно з попереднім періодом витрати змінились на ${formatSignedPercent(expenseDelta)}, а доходи — на ${formatSignedPercent(incomeDelta)}.`);
    }
    if (savingsRate > 0) {
        items.push(`Рівень заощаджень за період — ${savingsRate}%. Це твій поточний запас міцності.`);
    }
    if (!items.length) {
        items.push("Щойно зʼявиться більше витрат і доходів у вибраному періоді, тут збереться жива аналітика без демо-даних.");
    }
    return items.slice(0, 5);
}
function buildCategoryChangeItems(currentExpenses, previousExpenses, categories) {
    const currentMap = new Map(groupCategoriesFromExpenses(currentExpenses, categories).map((item)=>[
            item.name,
            item.total
        ]));
    const previousMap = new Map(groupCategoriesFromExpenses(previousExpenses, categories).map((item)=>[
            item.name,
            item.total
        ]));
    const keys = Array.from(new Set([
        ...currentMap.keys(),
        ...previousMap.keys()
    ]));
    const items = keys.map((key)=>{
        const current = currentMap.get(key) ?? 0;
        const previous = previousMap.get(key) ?? 0;
        return {
            delta: current - previous,
            name: key,
            percent: buildDeltaPercent(current, previous)
        };
    }).filter((item)=>item.delta !== 0 || item.percent !== 0).sort((left, right)=>Math.abs(right.delta) - Math.abs(left.delta)).slice(0, 5).map((item)=>`${item.name} ${formatSignedPercent(item.percent)} ${formatSignedMoney(item.delta)}`);
    return items.length ? items : [
        "За вибраний період немає достатньо змін по категоріях для порівняння."
    ];
}
function buildForecastNet(expenses, incomes, range) {
    const normalized = normalizeDateRange(range);
    const totalDays = daysInRange(normalized);
    const averageDailyNet = (sum(incomes.map((income)=>income.amount)) - sum(expenses.map((expense)=>expense.amount))) / Math.max(totalDays, 1);
    const nextMonth = new Date(normalized.to.getFullYear(), normalized.to.getMonth() + 1, 1);
    const nextMonthDays = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
    return Math.round(averageDailyNet * nextMonthDays);
}
function buildComparisonItems({ currentExpenseTotal, currentIncomeTotal, currentNet, previousExpenseTotal, previousIncomeTotal, previousNet }, t) {
    return [
        `${t("analytics.comparisonIncome")} ${formatMoney(currentIncomeTotal)} (${formatSignedPercent(buildDeltaPercent(currentIncomeTotal, previousIncomeTotal))})`,
        `${t("analytics.comparisonExpenses")} ${formatMoney(currentExpenseTotal)} (${formatSignedPercent(buildDeltaPercent(currentExpenseTotal, previousExpenseTotal))})`,
        `${t("analytics.comparisonNet")} ${formatMoney(currentNet)} (${formatSignedPercent(buildDeltaPercent(currentNet, previousNet))})`
    ];
}
function formatSignedPercent(value) {
    if (value === 0) return "0%";
    return `${value > 0 ? "+" : ""}${value.toLocaleString("uk-UA", {
        maximumFractionDigits: 1,
        minimumFractionDigits: Number.isInteger(value) ? 0 : 1
    })}%`;
}
function formatSignedMoney(value) {
    if (value === 0) return formatMoney(0);
    return `${value > 0 ? "+" : "-"}${formatMoney(Math.abs(value))}`;
}
function buildBudgetChartData(rows) {
    return rows.slice().sort((left, right)=>right.spent - left.spent || right.limit - left.limit || left.category.localeCompare(right.category, "uk")).map((row)=>({
            budget: row.limit,
            category: row.category,
            expense: row.spent
        }));
}
function buildBudgetOverrunItems(rows) {
    return rows.filter((row)=>row.spent > row.limit).sort((left, right)=>right.spent - right.limit - (left.spent - left.limit)).map((row)=>`${row.category} — перевищення на ${formatMoney(row.spent - row.limit)}`);
}
function buildBudgetRecommendationFallback(rows, budgetTotal, monthExpense) {
    const items = [];
    const mostOver = rows.filter((row)=>row.spent > row.limit).sort((left, right)=>right.spent - right.limit - (left.spent - left.limit))[0];
    const nearLimit = rows.filter((row)=>row.percent >= 85 && row.spent <= row.limit).sort((left, right)=>right.percent - left.percent)[0];
    const mostEfficient = rows.filter((row)=>row.percent > 0 && row.percent <= 60).sort((left, right)=>left.percent - right.percent)[0];
    if (mostOver) {
        items.push(`${mostOver.category} уже перевищив ліміт на ${formatMoney(mostOver.spent - mostOver.limit)}. Варто скоротити витрати або збільшити бюджет цієї категорії.`);
    }
    if (nearLimit) {
        items.push(`${nearLimit.category} майже вичерпав бюджет: використано ${nearLimit.percent}%, залишилось ${formatMoney(Math.max(nearLimit.remaining, 0))}.`);
    }
    if (mostEfficient) {
        items.push(`${mostEfficient.category} тримається найкраще: використано ${mostEfficient.percent}% бюджету. Тут є запас до кінця місяця.`);
    }
    if (!items.length) {
        items.push(budgetTotal > 0 ? `Поточне використання бюджету складає ${Math.round(monthExpense / budgetTotal * 100)}%. Структура витрат виглядає контрольованою.` : "Додайте бюджети для категорій з найбільшими витратами, щоб отримати персональні рекомендації.");
    }
    return items.slice(0, 3);
}
function buildClientBudgetHealth(rows, budgetTotal, monthExpense) {
    if (!rows.length || budgetTotal <= 0) {
        return {
            label: "budgetHealth.none",
            message: "budgetHealth.noneMsg",
            score: 0
        };
    }
    const overCount = rows.filter((row)=>row.spent > row.limit).length;
    const nearLimitCount = rows.filter((row)=>row.percent >= 85 && row.spent <= row.limit).length;
    const utilization = monthExpense / budgetTotal;
    const score = Math.max(18, Math.min(98, Math.round(100 - Math.max(0, utilization - 1) * 55 - overCount * 10 - nearLimitCount * 4)));
    if (score >= 85) {
        return {
            label: "budgetHealth.great",
            message: "budgetHealth.greatMsg",
            score
        };
    }
    if (score >= 70) {
        return {
            label: "budgetHealth.good",
            message: "budgetHealth.goodMsg",
            score
        };
    }
    if (score >= 50) {
        return {
            label: "budgetHealth.warning",
            message: "budgetHealth.warningMsg",
            score
        };
    }
    return {
        label: "budgetHealth.risk",
        message: "budgetHealth.riskMsg",
        score
    };
}
function buildGoalContributionRows(goals) {
    return goals.flatMap((goal)=>(goal.contributions || []).map((item)=>({
                amount: Number(item.amount || 0),
                date: item.date,
                goalId: goal.id,
                goalName: goal.name,
                note: item.note || ""
            }))).filter((item)=>item.amount > 0 && item.date).sort((left, right)=>new Date(right.date).getTime() - new Date(left.date).getTime());
}
function buildGoalContributionHistory(goals) {
    const rows = buildGoalContributionRows(goals);
    const now = new Date();
    const months = [];
    for(let index = 5; index >= 0; index--){
        const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
        months.push({
            amount: 0,
            key: date.toISOString().slice(0, 7),
            label: formatMonthLabel(date, "uk")
        });
    }
    const monthMap = new Map(months.map((item)=>[
            item.key,
            item
        ]));
    rows.forEach((item)=>{
        const date = new Date(item.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const bucket = monthMap.get(key);
        if (bucket) {
            bucket.amount += item.amount;
        }
    });
    return months;
}
function goalMonthlyNeed(goal) {
    if (!goal?.deadline || goal.savedAmount >= goal.targetAmount) return 0;
    const monthsLeft = monthsUntil(goal.deadline);
    if (monthsLeft <= 0) return Math.max(goal.targetAmount - goal.savedAmount, 0);
    return Math.ceil(Math.max(goal.targetAmount - goal.savedAmount, 0) / monthsLeft);
}
function findNearestGoal(goals) {
    return goals.filter((goal)=>goal.deadline).slice().sort((left, right)=>new Date(left.deadline).getTime() - new Date(right.deadline).getTime())[0] ?? goals.slice().sort((left, right)=>goalMonthlyNeed(left) - goalMonthlyNeed(right))[0] ?? null;
}
function goalTimeLeftLabel(goal) {
    if (!goal?.deadline) return "без дедлайну";
    const monthsLeft = monthsUntil(goal.deadline);
    if (monthsLeft <= 0) return "термін уже настав";
    if (monthsLeft === 1) return "1 місяць залишився";
    if (monthsLeft < 5) return `${monthsLeft} місяці залишилось`;
    return `${monthsLeft} місяців залишилось`;
}
function buildGoalDeadlineItems(goals) {
    const items = goals.filter((goal)=>goal.deadline).slice().sort((left, right)=>new Date(left.deadline).getTime() - new Date(right.deadline).getTime()).slice(0, 4).map((goal)=>`${goal.name} — ${goalTimeLeftLabel(goal)}`);
    return items.length ? items : [
        "Додайте дедлайн хоча б для однієї цілі, щоб бачити реальний горизонт накопичення."
    ];
}
function buildGoalRecommendations({ goals, monthlyContribution, savings }) {
    const items = [];
    const nearestGoal = findNearestGoal(goals);
    const mostUnderfunded = goals.slice().sort((left, right)=>goalMonthlyNeed(right) - goalMonthlyNeed(left))[0];
    if (nearestGoal) {
        const monthlyNeed = goalMonthlyNeed(nearestGoal);
        items.push({
            text: monthlyNeed > 0 ? `Для цілі "${nearestGoal.name}" зараз потрібно близько ${formatMoney(monthlyNeed)} на місяць, щоб вкластися у дедлайн.` : `Ціль "${nearestGoal.name}" вже майже готова — залишилось закрити фінальний крок.`,
            title: "Фокус на найближчій цілі"
        });
    }
    if (savings > 0) {
        items.push({
            text: `У вас є ${formatMoney(savings)} вільного залишку за місяць. Найпростіший сценарій — розподілити його між 1-2 пріоритетними цілями як окремі внески.`,
            title: "Використайте вільний залишок"
        });
    }
    if (mostUnderfunded && monthlyContribution > 0) {
        items.push({
            text: `Поточний темп внесків — ${formatMoney(monthlyContribution)} за місяць. Для цілі "${mostUnderfunded.name}" цього може бути замало, якщо вона в пріоритеті.`,
            title: "Звірте темп накопичення"
        });
    }
    if (!items.length) {
        items.push({
            text: "Додайте першу ціль, а потім фіксуйте реальні поповнення через кнопку «Поповнити». Саме вони формують живу історію накопичення.",
            title: "Почніть з першого внеску"
        });
    }
    return items.slice(0, 3);
}
function monthsUntil(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 0;
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const targetMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    return Math.max(0, (targetMonth.getFullYear() - currentMonth.getFullYear()) * 12 + targetMonth.getMonth() - currentMonth.getMonth());
}
function isCurrentMonth(value) {
    const date = new Date(value);
    const now = new Date();
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}
function isPreviousMonth(value) {
    const date = new Date(value);
    const now = new Date();
    const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return date.getFullYear() === previous.getFullYear() && date.getMonth() === previous.getMonth();
}
function monthShortLabel(date) {
    return new Intl.DateTimeFormat("uk-UA", {
        month: "short"
    }).format(date).replace(".", "");
}
function getIncomeStatusValue(status) {
    return String(status || "COMPLETED").trim().toUpperCase();
}
function isActualIncomeStatus(status) {
    const value = getIncomeStatusValue(status);
    return value === "COMPLETED" || value === "RECEIVED";
}
function formatIncomeStatus(status) {
    const value = getIncomeStatusValue(status);
    if (value === "PLANNED") return "income.status.planned";
    if (value === "PENDING") return "income.status.pending";
    if (value === "FAILED") return "income.status.failed";
    if (value === "CANCELLED") return "income.status.cancelled";
    return "income.status.received";
}
function incomeStatusClassName(status) {
    const value = getIncomeStatusValue(status);
    if (value === "PLANNED" || value === "PENDING") return "review-type";
    if (value === "FAILED" || value === "CANCELLED") return "expense-type";
    return "income-type";
}
function goalsToCategories(goals) {
    return goals.map((goal)=>({
            color: goal.color,
            name: goal.name,
            total: goal.savedAmount
        }));
}
function categoryIconFromItem(item) {
    const itemRecord = item;
    return iconForCategory(typeof itemRecord?.name === "string" ? itemRecord.name : null, typeof itemRecord?.icon === "string" ? itemRecord.icon : null);
}
function toCategoryIconName(value) {
    return typeof value === "string" && categoryIconSet.has(value) ? value : "expenses";
}
function categoryColorForIcon(icon) {
    return categoryIconOptions.find((option)=>option.icon === icon)?.color ?? "#22c55e";
}
function iconForCategory(category, preferredIcon) {
    if (preferredIcon) {
        const icon = toCategoryIconName(preferredIcon);
        if (icon !== "expenses" || preferredIcon === "expenses") return icon;
    }
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
function colorForSource(source) {
    if (source.toLocaleLowerCase("uk-UA").includes("зарп")) return "#22c55e";
    if (source.toLocaleLowerCase("uk-UA").includes("фриланс")) return "#3b82f6";
    if (source.toLocaleLowerCase("uk-UA").includes("інвест")) return "#8b5cf6";
    return "#f59e0b";
}
function notificationIcon(severity) {
    if (severity === "success") return "check";
    if (severity === "warning") return "warning";
    return "bell";
}
function groupCategoriesFromExpenses(expenses, categories) {
    const map = new Map();
    expenses.forEach((expense)=>{
        const key = expense.category ?? "Без категорії";
        const base = categories.find((category)=>category.id === expense.categoryId || category.name === expense.category);
        const current = map.get(key) ?? {
            color: expense.categoryColor ?? base?.color ?? "#94a3b8",
            icon: expense.categoryIcon ?? base?.icon ?? iconForCategory(key),
            id: expense.categoryId ?? undefined,
            name: key,
            total: 0
        };
        current.total += expense.amount;
        map.set(key, current);
    });
    return Array.from(map.values()).sort((left, right)=>right.total - left.total);
}
function topCategory(expenses, categories) {
    const grouped = groupCategoriesFromExpenses(expenses, categories);
    const total = sum(grouped.map((category)=>category.total));
    const top = grouped[0] ?? {
        color: "#94a3b8",
        name: "Немає даних",
        total: 0
    };
    return {
        ...top,
        percent: total ? Math.round(top.total / total * 1000) / 10 : 0
    };
}
function unusualExpenseCount(expenses) {
    return buildExpenseSignals(expenses).length;
}
function buildExpenseSignals(expenses) {
    return expenses.filter((expense)=>expense.sourceStatus === "NEEDS_REVIEW" || !expense.categoryId && !expense.category || typeof expense.confidence === "number" && expense.confidence > 0 && expense.confidence < 0.6);
}
function isExpenseRow(row) {
    return "category" in row;
}
function isTransferExpense(row) {
    const category = `${row.category ?? ""}`.toLocaleLowerCase("uk-UA");
    const description = `${row.description ?? ""}`.toLocaleLowerCase("uk-UA");
    return category.includes("переказ") || description.includes("iban") || description.includes("між своїми") || /^[0-9*]{8,}$/.test((row.description ?? "").replace(/\s+/g, ""));
}
function normalizePage(value) {
    if (value === "admin") {
        return "adminDashboard";
    }
    return allNavigablePageKeys.has(value) ? value : null;
}
function sum(values) {
    return values.reduce((total, value)=>total + value, 0);
}
function formatMoney(value) {
    return `${Math.round(value).toLocaleString("uk-UA")} ₴`;
}
function formatDate(value) {
    return new Intl.DateTimeFormat("uk-UA", {
        day: "numeric",
        month: "short",
        year: "numeric"
    }).format(new Date(value));
}
function formatDateTime(value) {
    return new Intl.DateTimeFormat("uk-UA", {
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
        year: "numeric"
    }).format(new Date(value));
}
function exportExpenseRowsToWorkbook(rows, range) {
    const worksheet = XLSX.utils.json_to_sheet(rows.map((row)=>({
            "Дата": formatTableDate(row.date),
            "Категорія": row.category ?? "Без категорії",
            "Опис": row.description ?? "",
            "Рахунок": row.account ?? "Без рахунку",
            "Тип оплати": row.paymentType === "CASH" ? "Готівка" : row.paymentType === "CARD" ? "Картка" : "Невідомо",
            "Статус AI": row.sourceStatus === "NEEDS_REVIEW" ? "Потребує перевірки" : "Завершено",
            "Впевненість AI": typeof row.confidence === "number" ? `${Math.round(row.confidence * 100)}%` : "",
            "Сума": -Math.round(row.amount)
        })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
    const normalized = normalizeDateRange(range);
    const fileName = `fintrack-expenses-${normalized.from.toISOString().slice(0, 10)}-${normalized.to.toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}
function exportAnalyticsToWorkbook({ categories, comparisonItems, expenses, incomes, insights, range, summary, trend }) {
    const workbook = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.json_to_sheet([
        {
            "Період": formatRangeLabel(range, "uk"),
            "Доходи": Math.round(summary.incomeTotal),
            "Витрати": Math.round(summary.expenseTotal),
            "Чистий потік": Math.round(summary.net),
            "Рівень заощаджень %": summary.savingsRate,
            "Співвідношення витрат до доходів %": summary.expenseRatio,
            "Оцінка грошового потоку": summary.cashflowScore
        }
    ]);
    const categorySheet = XLSX.utils.json_to_sheet(categories.map((category)=>({
            "Категорія": category.name,
            "Сума": Math.round(category.total),
            "Частка %": summary.expenseTotal > 0 ? Math.round(category.total / summary.expenseTotal * 1000) / 10 : 0
        })));
    const trendSheet = XLSX.utils.json_to_sheet(trend.map((item)=>({
            "Період": item.label,
            "Доходи": Math.round(item.income),
            "Витрати": Math.round(item.expense),
            "Чистий потік": Math.round(item.net)
        })));
    const expenseSheet = XLSX.utils.json_to_sheet(expenses.map((row)=>({
            "Дата": formatTableDate(row.date),
            "Категорія": row.category ?? "Без категорії",
            "Опис": row.description ?? "",
            "Рахунок": row.account ?? "Без рахунку",
            "Теги": (row.tags ?? []).join(", "),
            "Сума": -Math.round(row.amount)
        })));
    const incomeSheet = XLSX.utils.json_to_sheet(incomes.map((row)=>({
            "Дата": formatTableDate(row.date),
            "Джерело": row.source,
            "Опис": row.description ?? "",
            "Рахунок": row.account ?? "Без рахунку",
            "Теги": (row.tags ?? []).join(", "),
            "Сума": Math.round(row.amount)
        })));
    const insightSheet = XLSX.utils.json_to_sheet([
        ...insights.map((item)=>({
                "Тип": "Інсайт",
                "Значення": item
            })),
        ...comparisonItems.map((item)=>({
                "Тип": "Порівняння",
                "Значення": item
            }))
    ]);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
    XLSX.utils.book_append_sheet(workbook, categorySheet, "Categories");
    XLSX.utils.book_append_sheet(workbook, trendSheet, "Cashflow");
    XLSX.utils.book_append_sheet(workbook, expenseSheet, "Expenses");
    XLSX.utils.book_append_sheet(workbook, incomeSheet, "Incomes");
    XLSX.utils.book_append_sheet(workbook, insightSheet, "Insights");
    const normalized = normalizeDateRange(range);
    const fileName = `fintrack-analytics-${normalized.from.toISOString().slice(0, 10)}-${normalized.to.toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}
function formatProviderName(value) {
    const names = {
        DROPBOX: "Dropbox",
        GOOGLE_DRIVE: "Google Drive",
        GOOGLE_SHEETS: "Google Sheets",
        MANUAL: "Manual",
        MONOBANK: "Monobank",
        OPENAI: "OpenAI",
        PRIVATBANK: "ПриватБанк",
        TELEGRAM: "Telegram"
    };
    return names[value] ?? value;
}
function formatStorageLabel(value) {
    if (value === "encrypted") return "Encrypted";
    if (value === "plain") return "Plain";
    return "Missing";
}
function jobStatusTone(status) {
    if (status === "FAILED") return "danger";
    if (status === "DONE") return "success";
    if (status === "RUNNING") return "warning";
    return "neutral";
}
function formatMonthYear(value) {
    return new Intl.DateTimeFormat("uk-UA", {
        month: "long",
        year: "numeric"
    }).format(new Date(value));
}
function formatDateInputValue(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
}
