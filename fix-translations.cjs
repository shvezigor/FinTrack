const fs = require('fs');

// ─── 1. Add new keys to i18n.tsx ─────────────────────────────────────────────
const i18nFile = 'apps/dashboard/src/components/i18n.tsx';
let i18n = fs.readFileSync(i18nFile, 'utf8');

const newEnKeys = `
    // Dashboard metric subtitles
    "dashboard.metrics.incomeReceived": "Received this month",
    "dashboard.metrics.plannedIncome": "Projected income",
    "dashboard.metrics.plannedReceipts": "Planned receipts",
    "dashboard.metrics.noPlannedIncome": "No projected income",
    "dashboard.metrics.ofActualIncome": "of actual income",
    "dashboard.metrics.noIncomeYet": "No income yet this month",
    // Period selector
    "period.3months": "3 months",
    "period.6months": "6 months",
    "period.12months": "12 months",
    // Expense trend
    "expense.trend.firstMonth": "First month",
    "expense.trend.decreased": "Expenses decreased by {pct}%",
    "expense.trend.increased": "Expenses increased by {pct}%",
    "expense.trend.unchanged": "Expenses unchanged",
    "expense.trend.noDataPrev": "Not enough data to compare with last month.",
    "expense.trend.great": "Great! You are spending less than last month.",
    "expense.trend.higher": "This month expenses are higher than usual.",
    "expense.trend.sameLevel": "Expenses are at the same level as last month.",
    "expense.trend.noExpenses": "No expenses this month",
    "expense.trend.addExpenses": "Add expenses to see analysis.",
    "expense.trend.current": "Current month",
    "expense.trend.noChange": "No change vs last month",
    "expense.trend.vsLast": "{pct}% vs last month",
    // Nav/menu
    "nav.logout": "Log out",
    "nav.profile": "Profile",
    "nav.quickAdd": "Quick add",
    "nav.closeMenu": "Close menu",
    "nav.expandMenu": "Expand menu",
    "nav.collapseMenu": "Collapse menu",
    "nav.openMenu": "Open menu",
    // Expenses page
    "expenses.allFilters": "All filters",
    "expenses.card": "Card",
    "expenses.cash": "Cash",
    "expenses.aiReview": "Needs AI review",
    "expenses.searchPlaceholder": "Search expenses...",
    "expenses.totalPeriod": "Total expenses for period",
    "expenses.records": "{n} records",
    "expenses.avgDaily": "Daily average",
    "expenses.forPeriod": "For selected period",
    "expenses.topCategory": "Top category",
    "expenses.aiSignals": "AI signals",
    "expenses.aiSignalsHint": "Need review or retraining",
    "expenses.trendTitle": "Expense dynamics",
    "expenses.addTitle": "Add expense",
    "expenses.listTitle": "Expense list",
    "expenses.showMore": "Show {n} more",
    "expenses.allShown": "All expenses shown",
    "expenses.emptyFilter": "No expenses match the current filter",
    "expenses.aiSignalsTitle": "AI expense signals",
    "expenses.excelExported": "Excel file ready.",
    "expenses.excelError": "Could not generate Excel file.",
    // Budgets page
    "budgets.noHistory": "No budget changes yet. Create or edit a budget to see history here.",
    "budgets.monthlyBudget": "Monthly budget",
    "budgets.limitFor": "Limit for {month}",
    "budgets.spentNow": "Spent so far",
    "budgets.ofBudget": "{pct}% of budget",
    "budgets.notConfigured": "Not configured yet",
    "budgets.remaining": "Budget remaining",
    "budgets.addBudget": "Add budget",
    "budgets.score": "Budget score",
    "budgets.byCategory": "Budgets by category",
    "budgets.createBudget": "Create budget",
    "budgets.vsActual": "Budget vs Actual",
    "budgets.budget": "Budget",
    "budgets.actual": "Actual",
    "budgets.chartNote": "Chart shows all categories sorted by actual expenses. Scroll to see more.",
    "budgets.chartEmpty": "No budgets to display. Add at least one budget.",
    "budgets.overBudget": "Over budget",
    "budgets.allInLimits": "All current budgets are within limits.",
    "budgets.recommendations": "Recommendations",
    "budgets.recentActions": "Recent budget actions",
    "budgets.insightNote": "Recommendations below are generated from your real budgets, current expenses and recent budget changes.",
    "budgets.ai": "AI",
    "budgets.data": "Data",
    // Goals page
    "goals.activeGoals": "Active goals",
    "goals.activeCount": "{n} still in progress",
    "goals.noActive": "No active goals yet",
    "goals.savedToGoals": "Saved to goals",
    "goals.ofTotalTargets": "{pct}% of total goal amount",
    "goals.addGoalsFirst": "Add goals and amounts first",
    "goals.monthlyContribution": "Monthly contribution",
    "goals.nearestCompletion": "Expected completion",
    "goals.noDeadline": "No deadline",
    "goals.yourGoals": "Your goals",
    "goals.firstGoalHint": "Start with your first goal and link it to real money",
    "goals.description": "In FinTrack, a goal grows not from forecasts but from real contributions. You create the goal, then record real deposits.",
    "goals.addFirst": "Add first goal",
    "goals.howStep1Title": "Create a goal",
    "goals.howStep1": "Name, target amount, a photo for motivation, and optionally a deadline.",
    "goals.howStep2Title": "Put the money aside for real",
    "goals.howStep2": "This can be part of your salary, a separate transfer to a savings account, cashback or other income you actually set aside.",
    "goals.howStep3Title": "Record the contribution",
    "goals.howStep3": "The «Top up» button is what builds the accumulation history, progress and completion forecast.",
    "goals.howStep4Title": "What counts as a contribution",
    "goals.howStep4": "Only money you actually set aside: transferred to a separate account, kept as cash for the goal, or consciously set aside.",
    "goals.howStep5Title": "Where to get the money",
    "goals.howStep6Title": "Why set a deadline",
    "goals.howStep6": "A deadline is optional, but it helps calculate the real accumulation rate and keeps the goal from dragging on indefinitely.",
    "goals.howItWorks": "How it should work",
    "goals.howRule1": "The goal is created separately from income and expenses.",
    "goals.howRule2": "Money appears in progress only after a real contribution.",
    "goals.howRule3": "Contribution history shows how quickly you are moving toward the target.",
    "goals.whenToTopUp": "When to top up",
    "goals.whenRule1": "After salary or additional income.",
    "goals.whenRule2": "After a positive monthly balance.",
    "goals.whenRule3": "After transferring to a separate savings account.",
    "goals.howToLink": "How to link goals to real money",
    "goals.topUpNearest": "Top up nearest goal ",
    "goals.distribution": "Goal distribution",
    "goals.contributionHistory": "Contribution history",
    "goals.noContributions": "No contributions yet. Click «Top up» to start the live history.",
    "goals.nearestCompletion2": "Nearest completion",
    "goals.noDeadlineHint": "Add a deadline for at least one goal to see the real accumulation horizon.",
    // Settings page
    "settings.planActive": "Active plan",
    "settings.planInactive": "Plan inactive",
    "settings.unlimitedAccounts": "Unlimited accounts",
    "settings.advancedAnalytics": "Advanced analytics and reports",
    "settings.budgetPlanning": "Budget and goal planning",
    "settings.dataExport": "Data export",
    "settings.prioritySupport": "Priority support",
    "settings.perMonth": " / month",
    "settings.manageSubscription": "Manage subscription",
    "settings.addAccount": " Add account",
    "settings.currency": "Currency",
    "settings.language": "Language",
    "settings.timezone": "Timezone",
    "settings.numberFormat": "Number format",
    "settings.saveChanges": "Save changes",
    "settings.provider": "Provider",
    "settings.keyLabel": "Key",
    "settings.keyName": "Name for yourself",
    "settings.keyValue": "Value",
    "settings.keyPlaceholder": "Main key",
    "settings.saveSecret": "Save encrypted secret",
    "settings.revoke": "Revoke",
    "settings.noSecrets": "No user keys saved yet.",
    "settings.exportData": "Export all your data to JSON",
    "settings.deleteAccount": "Delete account along with personal records",
    "settings.sessionsCleared": "Sessions and temporary state are cleared automatically",
    "settings.keysEncrypted": "Integration keys are stored encrypted",
    "settings.exportBtn": "Export my data",
    "settings.deleteBtn": "Delete account",
    "settings.notifExpenses": "Expense notifications",
    "settings.notifExpensesHint": "Get notifications for large expenses",
    "settings.notifWeekly": "Weekly report",
    "settings.notifWeeklyHint": "Receive weekly expense summaries",
    "settings.notifBudgets": "Budget reminders",
    "settings.notifBudgetsHint": "Remind me when approaching the limit",
    "settings.notifGoals": "Goals and achievements",
    "settings.notifGoalsHint": "Notifications about goal progress and achievements",
    "settings.notifMarketing": "Marketing messages",
    "settings.notifMarketingHint": "News, tips and special offers",
    // Security
    "security.changePassword": "Change password",
    "security.createPassword": "Set password",
    "security.lastChanged": "Last changed: ",
    "security.neverChanged": "never changed",
    "security.currentPassword": "Current password",
    "security.newPassword": "New password",
    "security.confirmPassword": "Confirm password",
    "security.twoFactor": "Two-factor authentication",
    "security.twoFactorHint": "Keeps the actual status of additional account protection.",
    "security.actionConfirm": "Action confirmation",
    "security.actionConfirmHint": "Ask for confirmation before deleting account, accounts and categories.",
    "security.autoLogout": "Auto logout",
    "security.autoLogoutHint": "Session closes after idle for the specified time.",
    "security.5min": "5 min",
    "security.10min": "10 min",
    "security.15min": "15 min",
    "security.30min": "30 min",
    "security.1hour": "1 hour",
    "security.2hours": "2 hours",
    "security.4hours": "4 hours",
    "security.8hours": "8 hours",
    "security.24hours": "24 hours",
    "security.passwordUpdated": "Password updated.",
    "security.passwordError": "Could not change password.",
    // AI settings
    "ai.provider": "AI provider",
    "ai.keySource": "Key source",
    "ai.systemKey": "FinTrack key",
    "ai.myKey": "My key",
    "ai.systemKeyNote": "In this mode, AI requests are paid for and technically go through the system owner\\'s account.",
    "ai.comingSoon.claude": "Anthropic Claude — coming soon",
    "ai.comingSoon.gemini": "Google Gemini — coming soon",
    "ai.getToken": " Get token",
    "ai.save": " Save AI settings",
    "ai.systemKeyLabel": "System key: ",
    "ai.systemAvailable": "available",
    "ai.systemUnavailable": "not configured",
    "ai.myKeyLabel": "My key: ",
    "ai.myKeySaved": "saved",
    "ai.myKeyNotAdded": "not added",
    "ai.connected": "Connected",
    "ai.configure": "Configure",
    "ai.systemKeyMode": "FinTrack key",
    "ai.myKeyMode": "My encrypted key",
    // Monobank
    "mono.connected": "Connected",
    "mono.notConnected": "Not connected",
    "mono.connectedNote": "Token saved encrypted. Cards and balance sync with Monobank API.",
    "mono.connectNote": "Connect your personal token from api.monobank.ua to automatically import transactions.",
    "mono.tokenPlaceholder": "Paste token from api.monobank.ua",
    "mono.enableWebhook": "After connecting, try enabling webhook",
    "mono.getToken": " Get token",
    "mono.updateAndSync": "Update token and sync",
    "mono.connect": "Connect Monobank",
    "mono.syncing": " Syncing…",
    "mono.syncLastMonth": " Sync last month",
    "mono.enableWebhookBtn": "Enable webhook",
    "mono.importHistory": "Import history",
    "mono.importNote": "For old data, select a period. Long periods FinTrack will queue and load in parts within API limits.",
    "mono.period": "Period",
    "mono.loading": " Loading…",
    "mono.loadHistory": " Load history",
    "mono.apiNote": "Fully automatic confirmation in the Monobank app is only available through the provider API after agreement with Monobank.",
    // Telegram settings
    "telegram.connected": "Telegram connected",
    "telegram.notConnected": "Connect Telegram to your account",
    "telegram.connectedNote": "Bot is already linked to your account. Use it to add expenses, view reports and get reminders.",
    "telegram.connectNote": "Connect your personal token from api.monobank.ua to automatically import transactions.",
    "telegram.openBot": "Open bot",
    "telegram.addBot": "Add bot",
    "telegram.checkStatus": " Check status",
    "telegram.adminPanel": " Telegram admin",
    // Admin user table
    "admin.table.user": "User",
    "admin.table.role": "Role",
    "admin.table.plan": "Plan",
    "admin.table.region": "Region",
    "admin.table.connection": "Connection",
    "admin.table.activity": "Activity",
    "admin.table.flags": "Flags",
    "admin.table.noName": "No name",
    "admin.table.noUsers": "No users yet.",
    "admin.table.telegramConnected": "Telegram connected",
    "admin.table.telegramAbsent": "Telegram absent",
    "admin.table.neverLoggedIn": "Never logged in",
    "admin.table.activeSessions": " active sessions",
    "admin.table.ok": "OK",
    // Admin integrations table
    "admin.integ.provider": "Provider",
    "admin.integ.connected": "Connected",
    "admin.integ.attention": "Needs attention",
    "admin.integ.disconnected": "Disconnected",
    "admin.integ.users": "Users",
    "admin.integ.lastSync": "Last sync",
    "admin.integ.empty": "No integration connections yet.",
    // Admin settings table
    "admin.settings.key": "Key",
    "admin.settings.type": "Type",
    "admin.settings.storage": "Storage",
    "admin.settings.state": "State",
    "admin.settings.updated": "Updated",
    "admin.settings.configured": "Configured",
    "admin.settings.empty": "Empty",
    "admin.settings.noRecords": "No configuration records in DB yet.",
    // Admin jobs table
    "admin.jobs.type": "Type",
    "admin.jobs.status": "Status",
    "admin.jobs.retries": "Retries",
    "admin.jobs.updated": "Updated",
    "admin.jobs.error": "Error",
    "admin.jobs.empty": "Job queue is empty.",
    // Admin activity table
    "admin.activity.time": "Time",
    "admin.activity.user": "User",
    "admin.activity.action": "Action",
    "admin.activity.entity": "Entity",
    "admin.activity.empty": "No audit events yet.",
    // Notifications
    "notif.title": "Notifications",
    "notif.markAll": "Mark all",
    "notif.empty": "No new notifications.",
    // Common UI
    "ui.close": "Close",
    "ui.edit": "Edit",
    "ui.actions": "Actions",
    "ui.total": "Total",
    "ui.viewDetails": "View details ",
    "ui.thinking": "Thinking...",
    "ui.noData": "No data",
    "ui.ascending": "ascending",
    "ui.descending": "descending",
    "ui.noSort": "none",
    "ui.sortBy": "Sort by field",
    "ui.resizeCol": "Resize column",
    "ui.dragResize": "Drag to resize column",
    "ui.profilePhoto": "User profile",
    "ui.profileMenu": "Profile menu",
    "ui.all": "All",
    "ui.added": " Add",
    // Transaction table
    "tx.noCategory": "No category",
    "tx.expense": "Expense",
    "tx.income": "Income",
    "tx.transfer": "Transfer",
    "tx.mainAccount": "Main account",
    "tx.needsReview": "Needs review",
    "tx.completed": "Completed",
    "tx.editExpense": "Edit expense",
    "tx.deleteExpense": "Delete expense",
    "tx.editIncome": "Edit income",
    "tx.deleteIncome": "Delete income",
    "tx.editRecord": "Edit record",
    "tx.deleteRecord": "Delete record",
    "tx.noExpenseFilter": "No expenses match the current filter",
    "tx.autoSelect": "Auto select",
    "tx.monoCard": "Monobank card",
    "tx.work": "Work",
    // Quick modal / forms
    "form.paymentType": "Payment type",
    "form.unknown": "Unknown",
    "form.card": "Card",
    "form.cash": "Cash",
    "form.account": "Account",
    "form.date": "Date",
    "form.descPlaceholder": "Silpo, coffee, subscription...",
    "form.tags": "Tags",
    "form.tagsPlaceholder": "Work, Family, Travel",
    "form.sourcePlaceholder": "Salary / Freelance",
    "form.incomeType": "Income type",
    "form.actual": "Actual",
    "form.planned": "Planned",
    "form.incomePlaceholder": "Salary for May",
    "form.incomeTagsPlaceholder": "Salary, Freelance, Bonus",
    "form.budgetCategoryPlaceholder": "Groceries",
    "form.month": "Month",
    "form.addCategory": " Add category",
    "form.autofill": " Autofill from categories",
    "form.categoriesTitle": "Budget categories",
    "form.categoriesHint": "First add rows manually or fill in your categories, then just set the limits.",
    "form.categoryCol": "Category",
    "form.duplicateBudget": "This category already has a budget in the selected month",
    "form.setLimit": "Set limit amount or remove row",
    "form.removeRow": "Remove {name}",
    "form.emptyTable": "Table is empty. Add a category manually or click autofill.",
    "form.goalPhotoAlt": "Goal photo",
    "form.goalPhoto": "Goal photo",
    "form.generatePhoto": "Generate photo",
    "form.goalPhotoHint": "Not required. If no photo is added — the goal still tracks progress, you can add a photo later.",
    "form.goalPhotoHintEdit": "You can upload your own photo or generate one with AI.",
    "form.goalNamePlaceholder": "Vacation in Greece",
    "form.goalDeadline": "Goal deadline",
    "form.goalDescPlaceholder": "10 days of rest",
    "form.goalContributionNote": "Income itself does not top up the goal. Progress appears only after real contributions via the «Top up» button.",
    "form.goalName": "Goal",
    "form.contributionAmount": "Contribution amount",
    "form.comment": "Comment",
    "form.commentPlaceholder": "Part of salary / cashback / additional income",
    "form.accountPlaceholder": "Monobank card",
    "form.accountType": "Account type",
    "form.bankAccount": "Bank account",
    "form.savings": "Savings",
    "form.investment": "Investment",
    "form.other": "Other",
    "form.mainAccount": "Main account",
    "form.name": "Name",
    "form.namePlaceholder": "Groceries",
    "form.icon": "Icon",
    "form.addFirstGoal": "Add short description to make the goal easier to recognize and keep in focus.",
    // Budget empty
    "budgets.empty": "No budgets created yet. Add your first budget to see category control.",
    // Cashflow health levels
    "health.great": "Excellent",
    "health.greatMsg": "Net flow is stable, expenses are controlled, and savings buffer is good.",
    "health.good": "Good",
    "health.goodMsg": "Cash flow is generally healthy, but a few categories are already putting pressure on the budget.",
    "health.warning": "Warning",
    "health.warningMsg": "Expenses are growing faster than desired. Consider trimming expensive categories.",
    "health.risk": "Risk",
    "health.riskMsg": "Current flow is unstable: expenses or AI reviews need quick resolution.",
    // Budget health levels
    "budgetHealth.none": "No budget",
    "budgetHealth.noneMsg": "Add budgets for main categories to see a real control score.",
    "budgetHealth.great": "Excellent",
    "budgetHealth.greatMsg": "Most categories are within budget, and the buffer until end of month is good.",
    "budgetHealth.good": "Good",
    "budgetHealth.goodMsg": "Budget control is stable, but a few categories are already close to the limit.",
    "budgetHealth.warning": "Warning",
    "budgetHealth.warningMsg": "Some categories are almost exhausted or already exceeded. Better to adjust the plan.",
    "budgetHealth.risk": "Risk",
    "budgetHealth.riskMsg": "Budget is under pressure: several categories are already exceeded, quick adjustment needed.",
    // Income status
    "income.status.planned": "Forecast",
    "income.status.pending": "Pending",
    "income.status.failed": "Failed",
    "income.status.cancelled": "Cancelled",
    "income.status.received": "Received",
    // Transaction status  
    "tx.status.needsReview": "Needs review",
    "tx.status.completed": "Completed",
    // Goal time left
    "goals.noDeadline2": "no deadline",
    "goals.deadlinePassed": "deadline has passed",
    "goals.months1": "1 month left",
    "goals.months24": "{n} months left",
    "goals.months5plus": "{n} months left",
    // Category expense breakdown
    "category.expenseBreakdown": "Expense breakdown for selected period",
    "category.updated": "Updated",
    "category.justNow": "just now",
    "category.categories": "Categories",
    "category.groups": "groups",
    "category.noExpenses": "No expenses for the selected period.",
    "category.realtimeNote": "Data updates in real time",
    "category.exportData": "Export data",
    "category.topCategory": "Top category",
    // Monobank card
    "mono.account": "Account",
    // AI signals
    "ai.signals.empty": "No expenses that AI considers suspicious or unrecognized.",
    // Gauge
    "gauge.goodLevel": "Good level",
    "gauge.lowActivity": "Low activity",
    "gauge.highActivity": "High activity",
    // Connectivity
    "integration.connected": "Connected",
    "integration.connect": "Connect",
    "integration.open": "Open",
    // Table sort
    "table.sortAsc": "ascending",
    "table.sortDesc": "descending",
    "table.sortNone": "none",
    "table.sortByField": "Sort by field",
    "table.resizeCol": "Resize column width",
    "table.dragResize": "Drag to resize column width",
    // Admin user stat card labels (already added but checking)
    "admin.table.integCount": " integ. / ",
    "admin.table.accountCount": " acc.",
`;

const newUkKeys = `
    // Dashboard metric subtitles
    "dashboard.metrics.incomeReceived": "Отримано цього місяця",
    "dashboard.metrics.plannedIncome": "Прогнозований дохід",
    "dashboard.metrics.plannedReceipts": "Заплановані надходження",
    "dashboard.metrics.noPlannedIncome": "Немає прогнозованих доходів",
    "dashboard.metrics.ofActualIncome": "від фактичного доходу",
    "dashboard.metrics.noIncomeYet": "Поки без доходів у цьому місяці",
    // Period selector
    "period.3months": "3 місяці",
    "period.6months": "6 місяців",
    "period.12months": "12 місяців",
    // Expense trend
    "expense.trend.firstMonth": "Перший місяць",
    "expense.trend.decreased": "Витрати зменшились на {pct}%",
    "expense.trend.increased": "Витрати зросли на {pct}%",
    "expense.trend.unchanged": "Витрати без змін",
    "expense.trend.noDataPrev": "Недостатньо даних для порівняння з минулим місяцем.",
    "expense.trend.great": "Чудово! Ви витрачаєте менше, ніж минулого місяця.",
    "expense.trend.higher": "Цього місяця витрати вищі ніж зазвичай.",
    "expense.trend.sameLevel": "Витрати на тому ж рівні, що й минулого місяця.",
    "expense.trend.noExpenses": "Немає витрат цього місяця",
    "expense.trend.addExpenses": "Додайте витрати щоб побачити аналіз.",
    "expense.trend.current": "За поточний місяць",
    "expense.trend.noChange": "Без змін до минулого місяця",
    "expense.trend.vsLast": "{pct}% до минулого місяця",
    // Nav/menu
    "nav.logout": "Вийти",
    "nav.profile": "Профіль",
    "nav.quickAdd": "Швидко додати",
    "nav.closeMenu": "Закрити меню",
    "nav.expandMenu": "Розгорнути меню",
    "nav.collapseMenu": "Згорнути меню",
    "nav.openMenu": "Відкрити меню",
    // Expenses page
    "expenses.allFilters": "Усі фільтри",
    "expenses.card": "Картка",
    "expenses.cash": "Готівка",
    "expenses.aiReview": "Потребує перевірки AI",
    "expenses.searchPlaceholder": "Пошук витрат...",
    "expenses.totalPeriod": "Всього витрат за період",
    "expenses.records": "{n} записів",
    "expenses.avgDaily": "Середньоденні витрати",
    "expenses.forPeriod": "За вибраний період",
    "expenses.topCategory": "Найбільша категорія",
    "expenses.aiSignals": "AI-сигнали",
    "expenses.aiSignalsHint": "Потребують перевірки або донавчання",
    "expenses.trendTitle": "Динаміка витрат",
    "expenses.addTitle": "Додати витрату",
    "expenses.listTitle": "Список витрат",
    "expenses.showMore": "Показати ще {n}",
    "expenses.allShown": "Показано всі витрати",
    "expenses.emptyFilter": "За поточним фільтром витрат немає",
    "expenses.aiSignalsTitle": "AI-сигнали по витратах",
    "expenses.excelExported": "Файл Excel сформовано.",
    "expenses.excelError": "Не вдалося зібрати Excel файл.",
    // Budgets page
    "budgets.noHistory": "Поки що немає змін бюджетів. Створіть або відредагуйте бюджет, щоб тут з'явилась історія.",
    "budgets.monthlyBudget": "Місячний бюджет",
    "budgets.limitFor": "Ліміт на {month}",
    "budgets.spentNow": "Витрачено наразі",
    "budgets.ofBudget": "{pct}% від бюджету",
    "budgets.notConfigured": "Ще не налаштовано",
    "budgets.remaining": "Залишок бюджету",
    "budgets.addBudget": "Додайте бюджет",
    "budgets.score": "Оцінка бюджету",
    "budgets.byCategory": "Бюджети за категоріями",
    "budgets.createBudget": "Створити бюджет",
    "budgets.vsActual": "Бюджет vs Фактичні витрати",
    "budgets.budget": "Бюджет",
    "budgets.actual": "Факт",
    "budgets.chartNote": "Графік показує всі категорії за спаданням фактичних витрат. Прокрутіть блок, щоб побачити решту.",
    "budgets.chartEmpty": "Поки що немає бюджетів для побудови графіка. Додайте хоча б один бюджет.",
    "budgets.overBudget": "Перевищено бюджет",
    "budgets.allInLimits": "Усі поточні бюджети поки що в межах лімітів.",
    "budgets.recommendations": "Рекомендації",
    "budgets.recentActions": "Останні дії з бюджетами",
    "budgets.insightNote": " Рекомендації нижче формуються з ваших реальних бюджетів, поточних витрат і останніх змін у бюджетах.",
    "budgets.ai": "AI",
    "budgets.data": "Дані",
    // Goals page
    "goals.activeGoals": "Активні цілі",
    "goals.activeCount": "{n} ще в роботі",
    "goals.noActive": "Ще немає активних цілей",
    "goals.savedToGoals": "Збережено на цілі",
    "goals.ofTotalTargets": "{pct}% від загальної суми цілей",
    "goals.addGoalsFirst": "Спочатку додайте цілі та суми",
    "goals.monthlyContribution": "Щомісячний внесок",
    "goals.nearestCompletion": "Очікуване завершення",
    "goals.noDeadline": "Без дедлайну",
    "goals.yourGoals": "Ваші цілі",
    "goals.firstGoalHint": "Почніть з першої цілі і прив'яжіть її до реальних грошей",
    "goals.description": "У FinTrack ціль росте не від прогнозів і не від абстрактної економії, а від реальних внесків. Ви створюєте ціль, потім фіксуєте реальні поповнення.",
    "goals.addFirst": " Додати першу ціль",
    "goals.howStep1Title": "Створіть ціль",
    "goals.howStep1": "Назва, цільова сума, фото для мотивації і, за бажанням, дедлайн.",
    "goals.howStep2Title": "Відкладіть гроші реально",
    "goals.howStep2": "Це може бути частина зарплати, окремий переказ на savings-рахунок, кешбек або інший дохід, який ви дійсно відкладаєте.",
    "goals.howStep3Title": "Запишіть внесок",
    "goals.howStep3": "Саме кнопка «Поповнити» формує історію накопичення, прогрес і прогноз завершення.",
    "goals.howStep4Title": "Що вважати внеском",
    "goals.howStep4": "Тільки гроші, які ви реально відклали: переказали на окремий рахунок, залишили готівкою під ціль або свідомо відклали.",
    "goals.howStep5Title": "Звідки брати гроші",
    "goals.howStep6Title": "Навіщо дедлайн",
    "goals.howStep6": "Дедлайн не обов'язковий, але він допомагає порахувати реальний темп накопичення і не розтягувати ціль на невизначений час.",
    "goals.howItWorks": "Як це має працювати",
    "goals.howRule1": "Ціль створюється окремо від доходів і витрат.",
    "goals.howRule2": "Гроші потрапляють у прогрес лише після реального внеску.",
    "goals.howRule3": "Історія внесків показує, як швидко ви рухаєтесь до потрібної суми.",
    "goals.whenToTopUp": "Коли варто поповнювати",
    "goals.whenRule1": "Після зарплати або додаткового доходу.",
    "goals.whenRule2": "Після позитивного залишку місяця.",
    "goals.whenRule3": "Після переказу на окремий savings-рахунок.",
    "goals.howToLink": "Як пов'язати цілі з реальними грошима",
    "goals.topUpNearest": "Поповнити найближчу ціль ",
    "goals.distribution": "Розподіл за цілями",
    "goals.contributionHistory": "Історія внесків",
    "goals.noContributions": "Поки що немає внесків у цілі. Натисніть «Поповнити», щоб з'явилась жива історія.",
    "goals.nearestCompletion2": "Найближче завершення",
    "goals.noDeadlineHint": "Додайте дедлайн хоча б для однієї цілі, щоб бачити реальний горизонт накопичення.",
    // Settings page
    "settings.planActive": "Активний план",
    "settings.planInactive": "План не активний",
    "settings.unlimitedAccounts": "Необмежена кількість рахунків",
    "settings.advancedAnalytics": "Розширена аналітика та звіти",
    "settings.budgetPlanning": "Планування бюджетів та цілей",
    "settings.dataExport": "Експорт даних",
    "settings.prioritySupport": "Пріоритетна підтримка",
    "settings.perMonth": " / місяць",
    "settings.manageSubscription": "Керувати підпискою",
    "settings.addAccount": " Додати рахунок",
    "settings.currency": "Основна валюта",
    "settings.language": "Мова інтерфейсу",
    "settings.timezone": "Часовий пояс",
    "settings.numberFormat": "Формат чисел",
    "settings.saveChanges": "Зберегти зміни",
    "settings.provider": "Провайдер",
    "settings.keyLabel": "Ключ",
    "settings.keyName": "Назва для себе",
    "settings.keyValue": "Значення",
    "settings.keyPlaceholder": "Основний ключ",
    "settings.saveSecret": "Зберегти зашифрований секрет",
    "settings.revoke": "Відкликати",
    "settings.noSecrets": "Ще немає збережених користувацьких ключів.",
    "settings.exportData": "Експорт усіх ваших даних у JSON",
    "settings.deleteAccount": "Видалення акаунта разом із персональними записами",
    "settings.sessionsCleared": "Сесії та тимчасові стани очищаються автоматично",
    "settings.keysEncrypted": "Ключі інтеграцій зберігаються зашифрованими",
    "settings.exportBtn": "Експортувати мої дані",
    "settings.deleteBtn": "Видалити акаунт",
    "settings.notifExpenses": "Сповіщення про витрати",
    "settings.notifExpensesHint": "Отримуйте повідомлення про великі витрати",
    "settings.notifWeekly": "Щотижневий звіт",
    "settings.notifWeeklyHint": "Отримуйте підсумки витрат щотижня",
    "settings.notifBudgets": "Нагадування про бюджети",
    "settings.notifBudgetsHint": "Нагадувати, коли наближаюсь до ліміту",
    "settings.notifGoals": "Цілі та досягнення",
    "settings.notifGoalsHint": "Сповіщення про прогрес та досягнення цілей",
    "settings.notifMarketing": "Маркетингові повідомлення",
    "settings.notifMarketingHint": "Новини, поради та спеціальні пропозиції",
    // Security
    "security.changePassword": "Змінити пароль",
    "security.createPassword": "Створити пароль",
    "security.lastChanged": "Остання зміна: ",
    "security.neverChanged": "ще не змінювався",
    "security.currentPassword": "Поточний пароль",
    "security.newPassword": "Новий пароль",
    "security.confirmPassword": "Підтвердьте пароль",
    "security.twoFactor": "Двофакторна автентифікація",
    "security.twoFactorHint": "Зберігає фактичний статус додаткового захисту акаунта.",
    "security.actionConfirm": "Підтвердження дій",
    "security.actionConfirmHint": "Питати підтвердження перед видаленням акаунта, рахунків і категорій.",
    "security.autoLogout": "Автоматичний вихід",
    "security.autoLogoutHint": "Сесія закривається після простою на вказаний час.",
    "security.5min": "5 хв",
    "security.10min": "10 хв",
    "security.15min": "15 хв",
    "security.30min": "30 хв",
    "security.1hour": "1 година",
    "security.2hours": "2 години",
    "security.4hours": "4 години",
    "security.8hours": "8 годин",
    "security.24hours": "24 години",
    "security.passwordUpdated": "Пароль оновлено.",
    "security.passwordError": "Не вдалося змінити пароль.",
    // AI settings
    "ai.provider": "AI провайдер",
    "ai.keySource": "Джерело ключа",
    "ai.systemKey": "Ключ FinTrack",
    "ai.myKey": "Мій ключ",
    "ai.systemKeyNote": "У цьому режимі запити до AI оплачуються і технічно проходять через акаунт власника системи.",
    "ai.comingSoon.claude": "Anthropic Claude — скоро",
    "ai.comingSoon.gemini": "Google Gemini — скоро",
    "ai.getToken": " Отримати token",
    "ai.save": " Зберегти AI налаштування",
    "ai.systemKeyLabel": "Системний ключ: ",
    "ai.systemAvailable": "доступний",
    "ai.systemUnavailable": "не налаштований",
    "ai.myKeyLabel": "Мій ключ: ",
    "ai.myKeySaved": "збережено",
    "ai.myKeyNotAdded": "не додано",
    "ai.connected": "Підключено",
    "ai.configure": "Налаштувати",
    "ai.systemKeyMode": "ключ FinTrack",
    "ai.myKeyMode": "мій зашифрований ключ",
    // Monobank
    "mono.connected": "Підключено",
    "mono.notConnected": "Не підключено",
    "mono.connectedNote": "Токен збережено зашифровано. Картки і баланс синхронізуються з Monobank API.",
    "mono.connectNote": "Підключіть personal token з api.monobank.ua, щоб автоматично імпортувати транзакції.",
    "mono.tokenPlaceholder": "Вставте token з api.monobank.ua",
    "mono.enableWebhook": "Після підключення спробувати увімкнути webhook",
    "mono.getToken": " Отримати token",
    "mono.updateAndSync": "Оновити token і синхронізувати",
    "mono.connect": "Підключити Monobank",
    "mono.syncing": " Синхронізація…",
    "mono.syncLastMonth": " Синхронізувати останній місяць",
    "mono.enableWebhookBtn": "Увімкнути webhook",
    "mono.importHistory": "Імпорт історії",
    "mono.importNote": "Для старих даних оберіть період. Довгі періоди FinTrack поставить у чергу й завантажить частинами за лімітами API.",
    "mono.period": "Період",
    "mono.loading": " Завантаження…",
    "mono.loadHistory": " Завантажити історію",
    "mono.apiNote": "Повністю автоматичне підтвердження в застосунку Monobank доступне лише через provider API після погодження з Monobank.",
    // Telegram settings
    "telegram.connected": "Telegram підключено",
    "telegram.notConnected": "Підключіть Telegram до акаунта",
    "telegram.connectedNote": "Бот уже привʼязаний до вашого акаунта. Через нього можна додавати витрати, дивитися звіти та запускати нагадування.",
    "telegram.connectNote": "Підключіть personal token з api.monobank.ua, щоб автоматично імпортувати транзакції.",
    "telegram.openBot": "Відкрити бота",
    "telegram.addBot": "Додати бота",
    "telegram.checkStatus": " Перевірити статус",
    "telegram.adminPanel": " Адмінка Telegram",
    // Admin user table
    "admin.table.user": "Користувач",
    "admin.table.role": "Роль",
    "admin.table.plan": "План",
    "admin.table.region": "Регіон",
    "admin.table.connection": "Підключення",
    "admin.table.activity": "Активність",
    "admin.table.flags": "Прапорці",
    "admin.table.noName": "Без імені",
    "admin.table.noUsers": "Користувачів поки немає.",
    "admin.table.telegramConnected": "Telegram підключений",
    "admin.table.telegramAbsent": "Telegram відсутній",
    "admin.table.neverLoggedIn": "Ще не входив",
    "admin.table.activeSessions": " активн. сесій",
    "admin.table.ok": "ОК",
    // Admin integrations table
    "admin.integ.provider": "Провайдер",
    "admin.integ.connected": "Підключено",
    "admin.integ.attention": "Потребує уваги",
    "admin.integ.disconnected": "Відключено",
    "admin.integ.users": "Користувачі",
    "admin.integ.lastSync": "Останній sync",
    "admin.integ.empty": "Ще немає інтеграційних підключень.",
    // Admin settings table
    "admin.settings.key": "Ключ",
    "admin.settings.type": "Тип",
    "admin.settings.storage": "Збереження",
    "admin.settings.state": "Стан",
    "admin.settings.updated": "Оновлено",
    "admin.settings.configured": "Налаштовано",
    "admin.settings.empty": "Порожньо",
    "admin.settings.noRecords": "Записів конфігурації в БД ще немає.",
    // Admin jobs table
    "admin.jobs.type": "Тип",
    "admin.jobs.status": "Статус",
    "admin.jobs.retries": "Повторів",
    "admin.jobs.updated": "Оновлено",
    "admin.jobs.error": "Помилка",
    "admin.jobs.empty": "Черга задач поки порожня.",
    // Admin activity table
    "admin.activity.time": "Час",
    "admin.activity.user": "Користувач",
    "admin.activity.action": "Дія",
    "admin.activity.entity": "Сутність",
    "admin.activity.empty": "Аудит-подій поки немає.",
    // Notifications
    "notif.title": "Сповіщення",
    "notif.markAll": "Позначити всі",
    "notif.empty": "Поки немає нових сповіщень.",
    // Common UI
    "ui.close": "Закрити",
    "ui.edit": "Редагувати",
    "ui.actions": "Дії",
    "ui.total": "Всього",
    "ui.viewDetails": "Переглянути деталі ",
    "ui.thinking": "Думаю...",
    "ui.noData": "Немає даних",
    "ui.ascending": "за зростанням",
    "ui.descending": "за спаданням",
    "ui.noSort": "без сортування",
    "ui.sortBy": "Сортувати за полем",
    "ui.resizeCol": "Змінити ширину колонки",
    "ui.dragResize": "Перетягніть, щоб змінити ширину колонки",
    "ui.profilePhoto": "Профіль користувача",
    "ui.profileMenu": "Меню профілю",
    "ui.all": "Всі",
    "ui.added": " Додати",
    // Transaction table
    "tx.noCategory": "Без категорії",
    "tx.expense": "Витрата",
    "tx.income": "Дохід",
    "tx.transfer": "Переказ",
    "tx.mainAccount": "Основний рахунок",
    "tx.needsReview": "Потребує перевірки",
    "tx.completed": "Завершено",
    "tx.editExpense": "Редагувати витрату",
    "tx.deleteExpense": "Видалити витрату",
    "tx.editIncome": "Редагувати дохід",
    "tx.deleteIncome": "Видалити дохід",
    "tx.editRecord": "Редагувати запис",
    "tx.deleteRecord": "Видалити запис",
    "tx.noExpenseFilter": "За поточним фільтром витрат немає",
    "tx.autoSelect": "Автовибір",
    "tx.monoCard": "Картка monobank",
    "tx.work": "Робота",
    // Quick modal / forms
    "form.paymentType": "Тип оплати",
    "form.unknown": "Невідомо",
    "form.card": "Картка",
    "form.cash": "Готівка",
    "form.account": "Рахунок",
    "form.date": "Дата",
    "form.descPlaceholder": "Сільпо, кава, підписка...",
    "form.tags": "Теги",
    "form.tagsPlaceholder": "Робота, Сім'я, Подорожі",
    "form.sourcePlaceholder": "Зарплата / Фриланс",
    "form.incomeType": "Тип доходу",
    "form.actual": "Фактичний",
    "form.planned": "Прогнозований",
    "form.incomePlaceholder": "Зарплата за травень",
    "form.incomeTagsPlaceholder": "Зарплата, Фриланс, Бонус",
    "form.budgetCategoryPlaceholder": "Продукти",
    "form.month": "Місяць",
    "form.addCategory": " Додати категорію",
    "form.autofill": " Автозаповнити з категорій",
    "form.categoriesTitle": "Категорії для бюджету",
    "form.categoriesHint": "Спочатку додай рядки вручну або заповни таблицю своїми категоріями, далі просто вкажи ліміти.",
    "form.categoryCol": "Категорія",
    "form.duplicateBudget": "Для цієї категорії вже є бюджет у вибраному місяці",
    "form.setLimit": "Вкажи суму ліміту або прибери рядок",
    "form.removeRow": "Прибрати {name}",
    "form.emptyTable": "Таблиця порожня. Додай категорію вручну або натисни автозаповнення.",
    "form.goalPhotoAlt": "Фото цілі",
    "form.goalPhoto": "Фото цілі",
    "form.generatePhoto": "Згенерувати фото",
    "form.goalPhotoHint": "Не обов'язково. Якщо фото не додати — ціль все одно відстежує прогрес, фото можна додати пізніше.",
    "form.goalPhotoHintEdit": "Можна завантажити своє фото або згенерувати його через AI.",
    "form.goalNamePlaceholder": "Відпустка в Греції",
    "form.goalDeadline": "Дата цілі",
    "form.goalDescPlaceholder": "10 днів відпочинку",
    "form.goalContributionNote": "Дохід сам по собі не поповнює ціль. Прогрес з'являється лише після реальних внесків через кнопку «Поповнити».",
    "form.goalName": "Ціль",
    "form.contributionAmount": "Сума внеску",
    "form.comment": "Коментар",
    "form.commentPlaceholder": "Частина зарплати / кешбек / додатковий дохід",
    "form.accountPlaceholder": "Картка monobank",
    "form.accountType": "Тип рахунку",
    "form.bankAccount": "Банківський рахунок",
    "form.savings": "Заощадження",
    "form.investment": "Інвестиційний",
    "form.other": "Інше",
    "form.mainAccount": "Основний рахунок",
    "form.name": "Назва",
    "form.namePlaceholder": "Продукти",
    "form.icon": "Піктограма",
    "form.addFirstGoal": "Додайте короткий опис, щоб ціль було легше впізнавати і тримати в фокусі.",
    // Budget empty
    "budgets.empty": "Бюджети ще не створені. Додайте перший бюджет, щоб бачити контроль по категоріях.",
    // Cashflow health levels
    "health.great": "Відмінно",
    "health.greatMsg": "Чистий потік стабільний, витрати контрольовані, а запас на заощадження хороший.",
    "health.good": "Добре",
    "health.goodMsg": "Грошовий потік загалом здоровий, але кілька категорій уже тиснуть на бюджет.",
    "health.warning": "Увага",
    "health.warningMsg": "Витрати зростають швидше, ніж хотілося б. Варто підчистити дорогі категорії.",
    "health.risk": "Ризик",
    "health.riskMsg": "Поточний потік нестабільний: витрати або перевірки AI потребують швидкого розбору.",
    // Budget health levels
    "budgetHealth.none": "Немає бюджету",
    "budgetHealth.noneMsg": "Додайте бюджети для основних категорій, щоб бачити реальну оцінку контролю витрат.",
    "budgetHealth.great": "Відмінно",
    "budgetHealth.greatMsg": "Більшість категорій іде в межах бюджету, запас до кінця місяця хороший.",
    "budgetHealth.good": "Добре",
    "budgetHealth.goodMsg": "Контроль бюджету стабільний, але кілька категорій уже близькі до ліміту.",
    "budgetHealth.warning": "Увага",
    "budgetHealth.warningMsg": "Є категорії, де бюджет майже вичерпано або вже є перевищення. Краще скоригувати план.",
    "budgetHealth.risk": "Ризик",
    "budgetHealth.riskMsg": "Бюджет зараз під тиском: кілька категорій уже перевищені, потрібне швидке коригування.",
    // Income status
    "income.status.planned": "Прогноз",
    "income.status.pending": "Очікується",
    "income.status.failed": "Помилка",
    "income.status.cancelled": "Скасовано",
    "income.status.received": "Отримано",
    // Transaction status
    "tx.status.needsReview": "Потребує перевірки",
    "tx.status.completed": "Завершено",
    // Goal time left
    "goals.noDeadline2": "без дедлайну",
    "goals.deadlinePassed": "термін уже настав",
    "goals.months1": "1 місяць залишився",
    "goals.months24": "{n} місяці залишилось",
    "goals.months5plus": "{n} місяців залишилось",
    // Category expense breakdown
    "category.expenseBreakdown": "Структура витрат за вибраний період",
    "category.updated": "Оновлено",
    "category.justNow": "щойно",
    "category.categories": "Категорії",
    "category.groups": "груп",
    "category.noExpenses": "За обраний період ще немає витрат.",
    "category.realtimeNote": "Дані оновлюються в реальному часі",
    "category.exportData": "Експорт даних",
    "category.topCategory": "Найбільша категорія",
    // Monobank card
    "mono.account": "Рахунок",
    // AI signals
    "ai.signals.empty": "Поки немає витрат, які AI вважає сумнівними або неповністю розпізнаними.",
    // Gauge
    "gauge.goodLevel": "Добрий рівень",
    "gauge.lowActivity": "Низька активність",
    "gauge.highActivity": "Висока активність",
    // Connectivity
    "integration.connected": "Підключено",
    "integration.connect": "Підключити",
    "integration.open": "Відкрити",
    // Table sort
    "table.sortAsc": "за зростанням",
    "table.sortDesc": "за спаданням",
    "table.sortNone": "без сортування",
    "table.sortByField": "Сортувати за полем",
    "table.resizeCol": "Змінити ширину колонки",
    "table.dragResize": "Перетягніть, щоб змінити ширину колонки",
    // Admin user stat card labels
    "admin.table.integCount": " інт. / ",
    "admin.table.accountCount": " рах.",
`;

// Insert new EN keys before closing of en section
i18n = i18n.replace(
  '"profile.avatarAlt": "Avatar",\n  },\n  uk: {',
  `"profile.avatarAlt": "Avatar",${newEnKeys}  },\n  uk: {`
);

// Insert new UK keys before closing of uk section
i18n = i18n.replace(
  '"profile.avatarAlt": "Аватар",\n  },\n};',
  `"profile.avatarAlt": "Аватар",${newUkKeys}  },\n};`
);

fs.writeFileSync(i18nFile, i18n, 'utf8');
console.log('✅ i18n.tsx updated');

// ─── 2. Replace strings in dashboard-shell.tsx ───────────────────────────────
const shellFile = 'apps/dashboard/src/components/dashboard-shell.tsx';
let shell = fs.readFileSync(shellFile, 'utf8');
const orig = shell;

// Helper: exact string replacement (no regex needed for simple cases)
function rep(from, to) {
  if (!shell.includes(from)) {
    console.warn('⚠️  NOT FOUND:', from.substring(0, 80));
    return;
  }
  shell = shell.replaceAll(from, to);
}

// ── Dashboard metric cards ──
rep('label: "Фактичний дохід за місяць"', 'label: t("dashboard.metrics.income")');
rep('trend: "Отримано цього місяця"', 'trend: t("dashboard.metrics.incomeReceived")');
rep('label: "Прогнозований дохід"', 'label: t("dashboard.metrics.plannedIncome")');
rep('"Заплановані надходження" : "Немає прогнозованих доходів"', 't("dashboard.metrics.plannedReceipts") : t("dashboard.metrics.noPlannedIncome")');
rep('`${savingsRate}% від фактичного доходу` : "Поки без доходів у цьому місяці"', '`${savingsRate}% ${t("dashboard.metrics.ofActualIncome")}` : t("dashboard.metrics.noIncomeYet")');

// ── Period selector ──
rep('children: "3 місяці"', 'children: t("period.3months")');
rep('children: "6 місяців"', 'children: t("period.6months")');
rep('children: "12 місяців"', 'children: t("period.12months")');

// ── Expense insight texts ──
rep(': "Перший місяць"', ': t("expense.trend.firstMonth")');
rep('? "Витрати без змін"', '? t("expense.trend.unchanged")');
rep('"Недостатньо даних для порівняння з минулим місяцем."', 't("expense.trend.noDataPrev")');
rep('"Чудово! Ви витрачаєте менше, ніж минулого місяця."', 't("expense.trend.great")');
rep('"Цього місяця витрати вищі ніж зазвичай."', 't("expense.trend.higher")');
rep(': "Витрати на тому ж рівні, що й минулого місяця."', ': t("expense.trend.sameLevel")');
rep(': "Немає витрат цього місяця"', ': t("expense.trend.noExpenses")');
rep(': "Додайте витрати щоб побачити аналіз."', ': t("expense.trend.addExpenses")');

// expense trend text (dynamic)
rep(
  'const expenseTrendText = expenseChangePercent === null ? "За поточний місяць" : expenseChangePercent === 0 ? "Без змін до минулого місяця" :',
  'const expenseTrendText = expenseChangePercent === null ? t("expense.trend.current") : expenseChangePercent === 0 ? t("expense.trend.noChange") :'
);

// ── Nav / menu ──
rep('"aria-label": "Закрити меню"', '"aria-label": t("nav.closeMenu")');
rep('"aria-label": sidebarCollapsed ? "Розгорнути меню" : "Згорнути меню"', '"aria-label": sidebarCollapsed ? t("nav.expandMenu") : t("nav.collapseMenu")');
rep('"aria-label": "Відкрити меню"', '"aria-label": t("nav.openMenu")');
rep('"aria-label": "Швидко додати"', '"aria-label": t("nav.quickAdd")');
rep('logoutLabel: "Вийти",\n                                                logoutLabel: "Вийти"', 'logoutLabel: t("nav.logout"),\n                                                logoutLabel: t("nav.logout")');
rep('logoutLabel: "Вийти",', 'logoutLabel: t("nav.logout"),');
rep('profileLabel: "Профіль",', 'profileLabel: t("nav.profile"),');

// ── Expenses page ──
rep('label: "Усі фільтри"', 'label: t("expenses.allFilters")');
rep('label: "Картка"', 'label: t("expenses.card")');
rep('label: "Готівка"', 'label: t("expenses.cash")');
rep('label: "Потребує перевірки AI"', 'label: t("expenses.aiReview")');
rep('searchPlaceholder: "Пошук витрат..."', 'searchPlaceholder: t("expenses.searchPlaceholder")');
rep('label: "Всього витрат за період"', 'label: t("expenses.totalPeriod")');
rep('trend: `${rows.length} записів`', 'trend: t("expenses.records").replace("{n}", rows.length)');
rep('label: "Середньоденні витрати"', 'label: t("expenses.avgDaily")');
rep('trend: "За вибраний період"', 'trend: t("expenses.forPeriod")');
rep('label: "Найбільша категорія"', 'label: t("expenses.topCategory")');
rep('label: "AI-сигнали"', 'label: t("expenses.aiSignals")');
rep('trend: "Потребують перевірки або донавчання"', 'trend: t("expenses.aiSignalsHint")');
rep('title: "Динаміка витрат"', 'title: t("expenses.trendTitle")');
rep('title: "Додати витрату"', 'title: t("expenses.addTitle")');
rep('title: "Список витрат"', 'title: t("expenses.listTitle")');
// "Показати ще" has complex children array structure, skip
rep('children: "Показано всі витрати"', 'children: t("expenses.allShown")');
rep('children: "За поточним фільтром витрат немає"', 'children: t("expenses.emptyFilter")');
rep('title: "AI-сигнали по витратах"', 'title: t("expenses.aiSignalsTitle")');
rep('emitAppToast("Файл Excel сформовано.", "success")', 'emitAppToast(t("expenses.excelExported"), "success")');
rep('"Не вдалося зібрати Excel файл."', 't("expenses.excelError")');

// ── Budgets page ──
rep('"Поки що немає змін бюджетів. Створіть або відредагуйте бюджет, щоб тут з\'явилась історія."', 't("budgets.noHistory")');
rep('label: "Місячний бюджет"', 'label: t("budgets.monthlyBudget")');
rep('trend: `Ліміт на ${monthLabel}`', 'trend: t("budgets.limitFor").replace("{month}", monthLabel)');
rep('label: "Витрачено наразі"', 'label: t("budgets.spentNow")');
rep('"Ще не налаштовано"', 't("budgets.notConfigured")');
rep('label: "Залишок бюджету"', 'label: t("budgets.remaining")');
rep(': "Додайте бюджет"', ': t("budgets.addBudget")');
rep('children: "Оцінка бюджету"', 'children: t("budgets.score")');
rep('"aria-label": "Створити бюджет"', '"aria-label": t("budgets.createBudget")');
rep('title: "Бюджети за категоріями"', 'title: t("budgets.byCategory")');
rep('title: "Бюджет vs Фактичні витрати"', 'title: t("budgets.vsActual")');
rep('"Бюджет",', 't("budgets.budget"),');
rep('"Факт",', 't("budgets.actual"),');
rep('name === "budget" ? "Бюджет" : "Факт"', 'name === "budget" ? t("budgets.budget") : t("budgets.actual")');
rep('children: "Графік показує всі категорії за спаданням фактичних витрат. Прокрутіть блок, щоб побачити решту."', 'children: t("budgets.chartNote")');
rep('children: "Поки що немає бюджетів для побудови графіка. Додайте хоча б один бюджет."', 'children: t("budgets.chartEmpty")');
rep('title: "Перевищено бюджет"', 'title: t("budgets.overBudget")');
rep('"Усі поточні бюджети поки що в межах лімітів."', 't("budgets.allInLimits")');
rep('children: budgetInsights?.aiGenerated ? "AI" : "Дані"', 'children: budgetInsights?.aiGenerated ? t("budgets.ai") : t("budgets.data")');
rep('title: "Рекомендації"', 'title: t("budgets.recommendations")');
rep('title: "Останні дії з бюджетами"', 'title: t("budgets.recentActions")');
rep('" Рекомендації нижче формуються з ваших реальних бюджетів, поточних витрат і останніх змін у бюджетах."', 't("budgets.insightNote")');

// ── Goals page ──
rep('label: "Активні цілі"', 'label: t("goals.activeGoals")');
rep('trend: activeGoals.length ? `${activeGoals.length} ще в роботі` : "Ще немає активних цілей"', 'trend: activeGoals.length ? t("goals.activeCount").replace("{n}", activeGoals.length) : t("goals.noActive")');
rep('label: "Збережено на цілі"', 'label: t("goals.savedToGoals")');
rep('trend: target > 0 ? `${shareOfTargets}% від загальної суми цілей` : "Спочатку додайте цілі та суми"', 'trend: target > 0 ? t("goals.ofTotalTargets").replace("{pct}", shareOfTargets) : t("goals.addGoalsFirst")');
rep('label: "Щомісячний внесок"', 'label: t("goals.monthlyContribution")');
rep('label: "Очікуване завершення"', 'label: t("goals.nearestCompletion")');
rep('title: "Ваші цілі"', 'title: t("goals.yourGoals")');
rep('children: "Почніть з першої цілі і прив\'яжіть її до реальних грошей"', 'children: t("goals.firstGoalHint")');
rep('children: " Додати першу ціль"', 'children: t("goals.addFirst")');
rep('children: "Створіть ціль"', 'children: t("goals.howStep1Title")');
rep('children: "Назва, цільова сума, фото для мотивації і, за бажанням, дедлайн."', 'children: t("goals.howStep1")');
rep('children: "Відкладіть гроші реально"', 'children: t("goals.howStep2Title")');
rep('children: "Запишіть внесок"', 'children: t("goals.howStep3Title")');
rep('children: "Що вважати внеском"', 'children: t("goals.howStep4Title")');
rep('children: "Звідки брати гроші"', 'children: t("goals.howStep5Title")');
rep('title: "Як це має працювати"', 'title: t("goals.howItWorks")');
rep('"Ціль створюється окремо від доходів і витрат."', 't("goals.howRule1")');
rep('"Гроші потрапляють у прогрес лише після реального внеску."', 't("goals.howRule2")');
rep('"Історія внесків показує, як швидко ви рухаєтесь до потрібної суми."', 't("goals.howRule3")');
rep('title: "Коли варто поповнювати"', 'title: t("goals.whenToTopUp")');
rep('"Після зарплати або додаткового доходу."', 't("goals.whenRule1")');
rep('"Після позитивного залишку місяця."', 't("goals.whenRule2")');
rep('"Після переказу на окремий savings-рахунок."', 't("goals.whenRule3")');
rep('children: "Як пов\'язати цілі з реальними грошима"', 'children: t("goals.howToLink")');
rep('"Поповнити найближчу ціль "', 't("goals.topUpNearest")');
rep('title: "Розподіл за цілями"', 'title: t("goals.distribution")');
rep('title: "Історія внесків"', 'title: t("goals.contributionHistory")');
rep('children: "Поки що немає внесків у цілі. Натисніть «Поповнити», щоб з\'явилась жива історія."', 'children: t("goals.noContributions")');
rep('title: "Найближче завершення"', 'title: t("goals.nearestCompletion2")');

// ── Settings panels ──
rep(': "Активний план"', ': t("settings.planActive")');
rep(': "План не активний"', ': t("settings.planInactive")');
rep('"Необмежена кількість рахунків"', 't("settings.unlimitedAccounts")');
rep('"Розширена аналітика та звіти"', 't("settings.advancedAnalytics")');
rep('"Планування бюджетів та цілей"', 't("settings.budgetPlanning")');
rep('"Експорт даних"', 't("settings.dataExport")');
rep('"Пріоритетна підтримка"', 't("settings.prioritySupport")');
rep('" / місяць"', 't("settings.perMonth")');
rep('children: "Керувати підпискою"', 'children: t("settings.manageSubscription")');
rep('" Додати рахунок"', 't("settings.addAccount")');
rep('"Основна валюта"', 't("settings.currency")');
rep('"Мова інтерфейсу"', 't("settings.language")');
rep('"Часовий пояс"', 't("settings.timezone")');
rep('"Формат чисел"', 't("settings.numberFormat")');
rep('children: "Зберегти зміни"', 'children: t("settings.saveChanges")');
rep('"Провайдер"', 't("settings.provider")');
rep('"Назва для себе"', 't("settings.keyName")');
rep('"Значення"', 't("settings.keyValue")');
rep('placeholder: "Основний ключ"', 'placeholder: t("settings.keyPlaceholder")');
rep('children: "Зберегти зашифрований секрет"', 'children: t("settings.saveSecret")');
rep('children: "Відкликати"', 'children: t("settings.revoke")');
rep('children: "Ще немає збережених користувацьких ключів."', 'children: t("settings.noSecrets")');
rep('"Експорт усіх ваших даних у JSON"', 't("settings.exportData")');
rep('"Видалення акаунта разом із персональними записами"', 't("settings.deleteAccount")');
rep('"Сесії та тимчасові стани очищаються автоматично"', 't("settings.sessionsCleared")');
rep('"Ключі інтеграцій зберігаються зашифрованими"', 't("settings.keysEncrypted")');
rep('children: "Експортувати мої дані"', 'children: t("settings.exportBtn")');
rep('children: "Видалити акаунт"', 'children: t("settings.deleteBtn")');
rep('label: "Сповіщення про витрати"', 'label: t("settings.notifExpenses")');
rep('text: "Отримуйте повідомлення про великі витрати"', 'text: t("settings.notifExpensesHint")');
rep('label: "Щотижневий звіт"', 'label: t("settings.notifWeekly")');
rep('text: "Отримуйте підсумки витрат щотижня"', 'text: t("settings.notifWeeklyHint")');
rep('label: "Нагадування про бюджети"', 'label: t("settings.notifBudgets")');
rep('text: "Нагадувати, коли наближаюсь до ліміту"', 'text: t("settings.notifBudgetsHint")');
rep('label: "Цілі та досягнення"', 'label: t("settings.notifGoals")');
rep('text: "Сповіщення про прогрес та досягнення цілей"', 'text: t("settings.notifGoalsHint")');
rep('label: "Маркетингові повідомлення"', 'label: t("settings.notifMarketing")');
rep('text: "Новини, поради та спеціальні пропозиції"', 'text: t("settings.notifMarketingHint")');

// ── Security ──
rep('const passwordLabel = security?.hasPassword ? "Змінити пароль" : "Створити пароль"', 'const passwordLabel = security?.hasPassword ? t("security.changePassword") : t("security.createPassword")');
rep('const passwordDateText = security?.passwordChangedAt ? formatDate(security.passwordChangedAt) : "ще не змінювався"', 'const passwordDateText = security?.passwordChangedAt ? formatDate(security.passwordChangedAt) : t("security.neverChanged")');
rep('"Остання зміна: "', 't("security.lastChanged")');
rep('"Поточний пароль"', 't("security.currentPassword")');
rep('"Новий пароль"', 't("security.newPassword")');
rep('"Підтвердьте пароль"', 't("security.confirmPassword")');
rep('label: "Двофакторна автентифікація"', 'label: t("security.twoFactor")');
rep('text: "Зберігає фактичний статус додаткового захисту акаунта."', 'text: t("security.twoFactorHint")');
rep('label: "Підтвердження дій"', 'label: t("security.actionConfirm")');
rep('text: "Питати підтвердження перед видаленням акаунта, рахунків і категорій."', 'text: t("security.actionConfirmHint")');
rep('children: "Автоматичний вихід"', 'children: t("security.autoLogout")');
rep('children: "Сесія закривається після простою на вказаний час."', 'children: t("security.autoLogoutHint")');
rep('label: "5 хв"', 'label: t("security.5min")');
rep('label: "10 хв"', 'label: t("security.10min")');
rep('label: "15 хв"', 'label: t("security.15min")');
rep('label: "30 хв"', 'label: t("security.30min")');
rep('label: "1 година"', 'label: t("security.1hour")');
rep('label: "2 години"', 'label: t("security.2hours")');
rep('label: "4 години"', 'label: t("security.4hours")');
rep('label: "8 годин"', 'label: t("security.8hours")');
rep('label: "24 години"', 'label: t("security.24hours")');
rep('setPasswordMessage("Пароль оновлено.")', 'setPasswordMessage(t("security.passwordUpdated"))');
rep('emitAppToast("Пароль оновлено.", "success")', 'emitAppToast(t("security.passwordUpdated"), "success")');
rep('"Не вдалося змінити пароль."', 't("security.passwordError")');

// ── AI settings ──
rep('children: "AI провайдер"', 'children: t("ai.provider")');
rep('"Джерело ключа"', 't("ai.keySource")');
rep('children: "Ключ FinTrack"', 'children: t("ai.systemKey")');
rep('children: "Мій ключ"', 'children: t("ai.myKey")');
rep('"Anthropic Claude — скоро"', 't("ai.comingSoon.claude")');
rep('"Google Gemini — скоро"', 't("ai.comingSoon.gemini")');
rep('" Отримати token"', 't("ai.getToken")');
rep('" Зберегти AI налаштування"', 't("ai.save")');
rep('"Системний ключ: "', 't("ai.systemKeyLabel")');
rep('ai?.systemAvailable ? "доступний" : "не налаштований"', 'ai?.systemAvailable ? t("ai.systemAvailable") : t("ai.systemUnavailable")');
rep('"Мій ключ: "', 't("ai.myKeyLabel")');
rep('ai?.userKeyConfigured ? "збережено" : "не додано"', 'ai?.userKeyConfigured ? t("ai.myKeySaved") : t("ai.myKeyNotAdded")');
rep('children: connected ? "Підключено" : "Налаштувати"', 'children: connected ? t("ai.connected") : t("ai.configure")');

// ── Monobank ──
rep('children: connected ? "Підключено" : "Не підключено"', 'children: connected ? t("mono.connected") : t("mono.notConnected")');
rep('placeholder: "Вставте token з api.monobank.ua"', 'placeholder: t("mono.tokenPlaceholder")');
rep('children: "Після підключення спробувати увімкнути webhook"', 'children: t("mono.enableWebhook")');
rep('connected ? "Оновити token і синхронізувати" : "Підключити Monobank"', 'connected ? t("mono.updateAndSync") : t("mono.connect")');
rep('syncing ? " Синхронізація…" : " Синхронізувати останній місяць"', 'syncing ? t("mono.syncing") : t("mono.syncLastMonth")');
rep('children: "Увімкнути webhook"', 'children: t("mono.enableWebhookBtn")');
rep('children: "Імпорт історії"', 'children: t("mono.importHistory")');
rep('label: "Період"', 'label: t("mono.period")');
rep('syncing ? " Завантаження…" : " Завантажити історію"', 'syncing ? t("mono.loading") : t("mono.loadHistory")');

// ── Telegram settings ──
rep('children: connected ? "Telegram підключено" : "Підключіть Telegram до акаунта"', 'children: connected ? t("telegram.connected") : t("telegram.notConnected")');
rep('connected ? "Відкрити бота" : "Додати бота"', 'connected ? t("telegram.openBot") : t("telegram.addBot")');
rep('" Перевірити статус"', 't("telegram.checkStatus")');
rep('" Адмінка Telegram"', 't("telegram.adminPanel")');

// ── Admin user table ──
rep('children: "Користувач"', 'children: t("admin.table.user")');
rep('children: "Роль"', 'children: t("admin.table.role")');
rep('children: "План"', 'children: t("admin.table.plan")');
rep('children: "Регіон"', 'children: t("admin.table.region")');
rep('children: "Підключення"', 'children: t("admin.table.connection")');
rep('children: "Активність"', 'children: t("admin.table.activity")');
rep('children: "Прапорці"', 'children: t("admin.table.flags")');
rep('children: row.name ?? "Без імені"', 'children: row.name ?? t("admin.table.noName")');
rep('children: "Користувачів поки немає."', 'children: t("admin.table.noUsers")');
rep('children: row.telegramConnected ? "Telegram підключений" : "Telegram відсутній"', 'children: row.telegramConnected ? t("admin.table.telegramConnected") : t("admin.table.telegramAbsent")');
rep('children: row.lastSeenAt ? formatDateTime(row.lastSeenAt) : "Ще не входив"', 'children: row.lastSeenAt ? formatDateTime(row.lastSeenAt) : t("admin.table.neverLoggedIn")');
rep('" активн. сесій"', 't("admin.table.activeSessions")');
rep('children: "ОК"', 'children: t("admin.table.ok")');

// ── Admin integrations table ──
rep('children: "Провайдер"', 'children: t("admin.integ.provider")');
rep('children: "Підключено"', 'children: t("admin.integ.connected")');
rep('children: "Потребує уваги"', 'children: t("admin.integ.attention")');
rep('children: "Відключено"', 'children: t("admin.integ.disconnected")');
rep('children: "Користувачі"', 'children: t("admin.integ.users")');
rep('children: "Останній sync"', 'children: t("admin.integ.lastSync")');
rep('children: "Ще немає інтеграційних підключень."', 'children: t("admin.integ.empty")');

// ── Admin settings table ──
rep('children: "Ключ"', 'children: t("admin.settings.key")');
rep('children: "Тип"', 'children: t("admin.settings.type")');
rep('children: "Збереження"', 'children: t("admin.settings.storage")');
rep('children: "Стан"', 'children: t("admin.settings.state")');
rep('children: "Оновлено"', 'children: t("admin.settings.updated")');
rep('children: row.hasValue ? "Налаштовано" : "Порожньо"', 'children: row.hasValue ? t("admin.settings.configured") : t("admin.settings.empty")');
rep('children: "Записів конфігурації в БД ще немає."', 'children: t("admin.settings.noRecords")');

// ── Admin jobs table ──
rep('children: "Статус"', 'children: t("admin.jobs.status")');
rep('children: "Повторів"', 'children: t("admin.jobs.retries")');
rep('children: "Помилка"', 'children: t("admin.jobs.error")');
rep('children: "Черга задач поки порожня."', 'children: t("admin.jobs.empty")');

// ── Admin activity table ──
rep('children: "Час"', 'children: t("admin.activity.time")');
rep('children: "Дія"', 'children: t("admin.activity.action")');
rep('children: "Сутність"', 'children: t("admin.activity.entity")');
rep('children: "Аудит-подій поки немає."', 'children: t("admin.activity.empty")');

// ── Notifications ──
rep('children: "Сповіщення"', 'children: t("notif.title")');
rep('children: "Позначити всі"', 'children: t("notif.markAll")');
rep('children: "Поки немає нових сповіщень."', 'children: t("notif.empty")');

// ── Common UI ──
rep('"aria-label": "Закрити"', '"aria-label": t("ui.close")');
rep('"aria-label": "Дії"', '"aria-label": t("ui.actions")');
rep('"Переглянути деталі "', 't("ui.viewDetails")');
rep('setAnswer("Думаю...")', 'setAnswer(t("ui.thinking"))');
rep('alt: "Профіль користувача"', 'alt: t("ui.profilePhoto")');
rep('"aria-label": "Меню профілю"', '"aria-label": t("ui.profileMenu")');

// ── Table sort labels ──
rep(
  'const sortLabel = active ? sortState.direction === "asc" ? "за зростанням" : "за спаданням" : "без сортування";',
  'const sortLabel = active ? sortState.direction === "asc" ? t("table.sortAsc") : t("table.sortDesc") : t("table.sortNone");'
);
rep('title: "Перетягніть, щоб змінити ширину колонки"', 'title: t("table.dragResize")');
rep('`Сортувати за полем ${t(column.label)}, ${sortLabel}`', '`${t("table.sortByField")} ${t(column.label)}, ${sortLabel}`');
rep('`${t("table.resizeColumn")} ${t(column.label)}`', '`${t("table.resizeCol")} ${t(column.label)}`');

// ── Transaction cells ──
// Use specific JSX context to avoid matching utility/excel functions (no t() available)
rep(
  'expense.category ?? "Без категорії"\n                            ]\n                        }),',
  'expense.category ?? t("tx.noCategory")\n                            ]\n                        }),'
);
rep(
  'row.category ?? "Без категорії"\n                            ] : row.source',
  'row.category ?? t("tx.noCategory")\n                            ] : row.source'
);
rep('children: "Витрата"', 'children: t("tx.expense")');
// return "Витрата" is inside sort helper functions (no t() available) - leave as-is
rep('children: transfer ? "Переказ" : expense ? "Витрата" : "Дохід"', 'children: transfer ? t("tx.transfer") : expense ? t("tx.expense") : t("tx.income")');
rep('income.account ?? "Автовибір"', 'income.account ?? t("tx.autoSelect")');
rep('title: "Редагувати дохід"', 'title: t("tx.editIncome")');
rep('title: "Видалити дохід"', 'title: t("tx.deleteIncome")');
rep('children: "Мерчант"', 'children: t("table.description")');
rep('children: "Категорія"', 'children: t("table.category")');
rep('children: "Рахунок"', 'children: t("table.account")');
rep('children: "Дата"', 'children: t("table.date")');
rep('children: "Сума"', 'children: t("table.amount")');
// Form section labels (standalone in JSX children arrays – comma terminated, NOT Excel keys)
rep('"Рахунок",', 't("form.account"),');
rep('"Дата",', 't("form.date"),');
rep('"Місяць",', 't("form.month"),');
rep('"Теги",', 't("form.tags"),');
rep('"Назва",', 't("form.name"),');
rep('"Коментар",', 't("form.comment"),');
rep('"Сума внеску",', 't("form.contributionAmount"),');
rep('"Ключ",', 't("settings.keyLabel"),');
rep('"Значення",', 't("settings.keyValue"),');
rep('"Провайдер",', 't("settings.provider"),');
rep('"Назва для себе",', 't("settings.keyName"),');
rep('"Тип рахунку",', 't("form.accountType"),');
rep('"Тип доходу",', 't("form.incomeType"),');
rep('"Тип оплати",', 't("form.paymentType"),');
rep('"Дата цілі",', 't("form.goalDeadline"),');
rep('"Фото цілі",', 't("form.goalPhoto"),');
rep('"Сума внеску",', 't("form.contributionAmount"),');
rep('"Піктограма",', 't("form.icon"),');
rep('children: row.account ?? "Основний рахунок"', 'children: row.account ?? t("tx.mainAccount")');
// Sort helpers have "Основний рахунок" in return statements - leave as-is (no t() available)
rep('"Основний рахунок"\n                            ]\n                        })', 't("form.mainAccount")\n                            ]\n                        })'); // checkbox label
rep('"Основна валюта",', 't("settings.currency"),');
rep('"Мова інтерфейсу",', 't("settings.language"),');
rep('"Часовий пояс",', 't("settings.timezone"),');
rep('"Формат чисел",', 't("settings.numberFormat"),');
rep('expense.description?.split(",")[0] ?? "Транзакція"', 'expense.description?.split(",")[0] ?? t("table.description")');
rep('expense.account ?? "Картка monobank"', 'expense.account ?? t("tx.monoCard")');
rep('const tag = row.tags?.[0] ?? "Робота"', 'const tag = row.tags?.[0] ?? t("tx.work")');
// transfer? bare rep matches sort helpers WITHOUT t() - skip; 'children: transfer...' already handles JSX render
// row.category in excel export at line 11517/11557 - exportExpenseRowsToWorkbook has no t():
// removing dangerous bare rep
// row.account ?? in sort helper at line 8228 - leave as-is (no t() available)
// row.tags?.[0] ?? bare matches sort helper at line 8232 (no t()) - removed, line 8112 already handled by 'const tag =' version above
// return transfer/account in sort helpers - skip (no t() available)
rep('title: "Редагувати запис"', 'title: t("tx.editRecord")');
rep('title: "Видалити запис"', 'title: t("tx.deleteRecord")');
rep('children: "Бюджети ще не створені. Додайте перший бюджет, щоб бачити контроль по категоріях."', 'children: t("budgets.empty")');
rep('"aria-label": "Редагувати бюджет"', '"aria-label": t("tx.editRecord")');

// ── Quick modal forms ──
// "Тип оплати" handled below in form section labels (comma version)
rep('children: "Невідомо"', 'children: t("form.unknown")');
rep('children: "Картка"', 'children: t("form.card")');
rep('children: "Готівка"', 'children: t("form.cash")');
rep('placeholder: "Сільпо, кава, підписка..."', 'placeholder: t("form.descPlaceholder")');
rep('placeholder: "Робота, Сім\'я, Подорожі"', 'placeholder: t("form.tagsPlaceholder")');
rep('placeholder: "Зарплата / Фриланс"', 'placeholder: t("form.sourcePlaceholder")');
rep('children: "Фактичний"', 'children: t("form.actual")');
rep('children: "Прогнозований"', 'children: t("form.planned")');
rep('placeholder: "Зарплата за травень"', 'placeholder: t("form.incomePlaceholder")');
rep('placeholder: "Зарплата, Фриланс, Бонус"', 'placeholder: t("form.incomeTagsPlaceholder")');
rep('placeholder: "Продукти"', 'placeholder: t("form.namePlaceholder")');
rep('children: "Банківський рахунок"', 'children: t("form.bankAccount")');
rep('children: "Заощадження"', 'children: t("form.savings")');
rep('children: "Інвестиційний"', 'children: t("form.investment")');
rep('children: "Інше"', 'children: t("form.other")');
rep('children: "Додайте короткий опис, щоб ціль було легше впізнавати і тримати в фокусі."', 'children: t("form.addFirstGoal")');
rep(' Додати категорію"', ' Додати категорію"'); // no-op placeholder
rep('children: " Додати категорію"', 'children: t("form.addCategory")');
rep('" Додати категорію"', 't("form.addCategory")');
rep('" Автозаповнити з категорій"', 't("form.autofill")');
rep('children: "Категорії для бюджету"', 'children: t("form.categoriesTitle")');
rep('children: "Спочатку додай рядки вручну або заповни таблицю своїми категоріями, далі просто вкажи ліміти."', 'children: t("form.categoriesHint")');
rep('children: "Для цієї категорії вже є бюджет у вибраному місяці"', 'children: t("form.duplicateBudget")');
rep('children: "Вкажи суму ліміту або прибери рядок"', 'children: t("form.setLimit")');
rep('children: "Таблиця порожня. Додай категорію вручну або натисни автозаповнення."', 'children: t("form.emptyTable")');
rep('alt: field(item, "name") || "Фото цілі"', 'alt: field(item, "name") || t("form.goalPhotoAlt")');
rep('placeholder: "Відпустка в Греції"', 'placeholder: t("form.goalNamePlaceholder")');
rep('placeholder: "10 днів відпочинку"', 'placeholder: t("form.goalDescPlaceholder")');
rep('placeholder: "Частина зарплати / кешбек / додатковий дохід"', 'placeholder: t("form.commentPlaceholder")');
rep('placeholder: "Картка monobank"', 'placeholder: t("form.accountPlaceholder")');
rep('children: "Згенерувати фото"', 'children: t("form.generatePhoto")');


// ── Category panel ──
rep('/*#__PURE__*/ _jsx("p", { children: "Структура витрат за вибраний період" })', '/*#__PURE__*/ _jsx("p", { children: t("category.expenseBreakdown") })');
rep('/*#__PURE__*/ _jsx("small", { children: "Всього" })', '/*#__PURE__*/ _jsx("small", { children: t("ui.total") })');
rep('/*#__PURE__*/ _jsx("small", { children: "Найбільша категорія" }),', '/*#__PURE__*/ _jsx("small", { children: t("category.topCategory") }),');
rep('/*#__PURE__*/ _jsx("small", { children: "Категорій" }),', '/*#__PURE__*/ _jsx("small", { children: t("category.categories") }),');
rep('/*#__PURE__*/ _jsx("small", { children: "груп" })', '/*#__PURE__*/ _jsx("small", { children: t("category.groups") })');
rep('/*#__PURE__*/ _jsx("small", { children: "Оновлено" }),', '/*#__PURE__*/ _jsx("small", { children: t("category.updated") }),');
rep('/*#__PURE__*/ _jsx("strong", { children: "щойно" })', '/*#__PURE__*/ _jsx("strong", { children: t("category.justNow") })');
rep('/*#__PURE__*/ _jsx("strong", { children: "Категорії" }),', '/*#__PURE__*/ _jsx("strong", { children: t("category.categories") }),');
rep('/*#__PURE__*/ _jsxs("span", { children: [sortedCategories.length, " груп"] })', '/*#__PURE__*/ _jsxs("span", { children: [sortedCategories.length, " ", t("category.groups")] })');
rep('children: "За обраний період ще немає витрат."', 'children: t("category.noExpenses")');
rep('"Дані оновлюються в реальному часі"', 't("category.realtimeNote")');
rep('"Експорт даних"', 't("category.exportData")');

// ── AI signals ──
rep('"Поки немає витрат, які AI вважає сумнівними або неповністю розпізнаними."', 't("ai.signals.empty")');

// ── Cashflow health ──
// Change function return values to i18n keys
rep(
  'label: "Відмінно",\n            message: "Чистий потік стабільний, витрати контрольовані, а запас на заощадження хороший."',
  'label: "health.great",\n            message: "health.greatMsg"'
);
rep(
  'label: "Добре",\n            message: "Грошовий потік загалом здоровий, але кілька категорій уже тиснуть на бюджет."',
  'label: "health.good",\n            message: "health.goodMsg"'
);
rep(
  'label: "Увага",\n            message: "Витрати зростають швидше, ніж хотілося б. Варто підчистити дорогі категорії."',
  'label: "health.warning",\n            message: "health.warningMsg"'
);
rep(
  'label: "Ризик",\n            message: "Поточний потік нестабільний: витрати або перевірки AI потребують швидкого розбору."',
  'label: "health.risk",\n            message: "health.riskMsg"'
);
// Budget health
rep(
  'label: "Немає бюджету",\n            message: "Додайте бюджети для основних категорій, щоб бачити реальну оцінку контролю витрат.",',
  'label: "budgetHealth.none",\n            message: "budgetHealth.noneMsg",'
);
rep(
  'label: "Відмінно",\n            message: "Більшість категорій іде в межах бюджету, запас до кінця місяця хороший.",',
  'label: "budgetHealth.great",\n            message: "budgetHealth.greatMsg",'
);
rep(
  'label: "Добре",\n            message: "Контроль бюджету стабільний, але кілька категорій уже близькі до ліміту.",',
  'label: "budgetHealth.good",\n            message: "budgetHealth.goodMsg",'
);
rep(
  'label: "Увага",\n            message: "Є категорії, де бюджет майже вичерпано або вже є перевищення. Краще скоригувати план.",',
  'label: "budgetHealth.warning",\n            message: "budgetHealth.warningMsg",'
);
rep(
  'label: "Ризик",\n            message: "Бюджет зараз під тиском: кілька категорій уже перевищені, потрібне швидке коригування.",',
  'label: "budgetHealth.risk",\n            message: "budgetHealth.riskMsg",'
);
// Wrap call sites with t()
rep('trend={cashflowHealth.label}', 'trend={t(cashflowHealth.label)}');
rep('<Gauge label={cashflowHealth.label}', '<Gauge label={t(cashflowHealth.label)}');
rep('{cashflowHealth.label}', '{t(cashflowHealth.label)}');
rep('{cashflowHealth.message}', '{t(cashflowHealth.message)}');
rep('children: health.label', 'children: t(health.label)');
rep('children: health.message', 'children: t(health.message)');

// ── Income status — change function to return i18n keys, wrap call sites ──
rep('if (value === "PLANNED") return "Прогноз"', 'if (value === "PLANNED") return "income.status.planned"');
rep('if (value === "PENDING") return "Очікується"', 'if (value === "PENDING") return "income.status.pending"');
rep('if (value === "FAILED") return "Помилка"', 'if (value === "FAILED") return "income.status.failed"');
rep('if (value === "CANCELLED") return "Скасовано"', 'if (value === "CANCELLED") return "income.status.cancelled"');
rep('return "Отримано"', 'return "income.status.received"');
// Wrap display call sites
rep('label: formatIncomeStatus(status),', 'label: t(formatIncomeStatus(status)),');
rep('children: formatIncomeStatus(income.status)', 'children: t(formatIncomeStatus(income.status))');

// ── Transaction status — change to i18n keys, update comparison and display ──
rep(
  'isExpenseRow(row) && row.sourceStatus === "NEEDS_REVIEW" ? "Потребує перевірки" : "Завершено"',
  'isExpenseRow(row) && row.sourceStatus === "NEEDS_REVIEW" ? "tx.status.needsReview" : "tx.status.completed"'
);
rep(
  'className: status === "Потребує перевірки" ? "review-type" : "income-type"',
  'className: status === "tx.status.needsReview" ? "review-type" : "income-type"'
);
// Also wrap children: status with t() since status is now an i18n key
rep('            children: status\n                        }),', '            children: t(status)\n                        }),');

// ── Connectivity widget ──
rep('children: connected ? "Підключено" : "Підключити"', 'children: connected ? t("integration.connected") : t("integration.connect")');
rep('children: actionLabel ?? "Відкрити"', 'children: actionLabel ?? t("integration.open")');

// ── Goal card ──
rep('"Зібрано "', 't("goals.savedToGoals") + " "');
rep('children: "Поповнити"', 'children: t("goals.topUpNearest").trim()');
rep('children: "Деталі"', 'children: t("ui.viewDetails").trim()');

// ── Notifications panel ──
rep('children: "Всього"', 'children: t("ui.total")');

// ── Gauge ──
rep('function Gauge({ label = "Добрий рівень", value })', 'function Gauge({ label, value })');

// ── Budget mini panel ──
rep('children: "Додати ціль"', 'children: t("goals.addFirst").trim()');

// Settings page panel titles (some already done)
rep('title: "Профіль"', 'title: t("settings.tabs.profile")');
rep('title: "Сповіщення"', 'title: t("settings.notifExpenses").replace(" про витрати", "")');
rep('title: "Безпека"', 'title: t("settings.tabs.security")');
rep('title: "Підписка та план"', 'title: t("settings.tabs.subscription")');
rep('title: "Приватність та дані"', 'title: t("settings.tabs.privacy")');
rep('title: "Рахунки та картки"', 'title: t("settings.tabs.finance")');
rep('title: "Валюта та регіон"', 'title: t("settings.tabs.region")');
rep('title: "Telegram бот"', 'title: t("settings.tabs.telegram")');
rep('title: "Банківські інтеграції"', 'title: t("settings.tabs.integrations")');
rep('title: "AI провайдер"', 'title: t("settings.tabs.ai")');
rep('title: "Секрети та API ключі"', 'title: t("settings.tabs.secrets")');

// ── Delete/save toasts ──
rep('showToast(expense ? "Витрату видалено." : "Дохід видалено.", "success")', 'showToast(expense ? t("toast.accountDeleted") : t("toast.accountDeleted"), "success")');

fs.writeFileSync(shellFile, shell, 'utf8');

const changed = shell.split('').filter((c, i) => c !== orig[i]).length;
console.log('✅ dashboard-shell.tsx updated,', changed > 0 ? 'changes made' : 'no changes');

// Cleanup temp file
fs.unlinkSync('uk_strings.txt');
console.log('✅ Done');
