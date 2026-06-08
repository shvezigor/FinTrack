type DashboardTableColumn = {
  align?: "end";
  defaultWidth: number;
  key: string;
  label: string;
  minWidth: number;
  sortable?: boolean;
};

export const transactionColumns: DashboardTableColumn[] = [
  { defaultWidth: 165, key: "date", label: "table.date", minWidth: 135, sortable: true },
  { defaultWidth: 95, key: "type", label: "table.type", minWidth: 86, sortable: true },
  { defaultWidth: 145, key: "category", label: "table.category", minWidth: 112, sortable: true },
  { defaultWidth: 360, key: "description", label: "table.description", minWidth: 170, sortable: true },
  { defaultWidth: 170, key: "account", label: "table.account", minWidth: 135, sortable: true },
  { defaultWidth: 125, key: "status", label: "table.status", minWidth: 112, sortable: true },
  { defaultWidth: 115, key: "tag", label: "table.tags", minWidth: 90, sortable: true },
  { align: "end", defaultWidth: 130, key: "amount", label: "table.amount", minWidth: 100, sortable: true },
  { align: "end", defaultWidth: 76, key: "actions", label: "", minWidth: 72 },
];

export const defaultTransactionColumnWidths = Object.fromEntries(transactionColumns.map((column) => [column.key, column.defaultWidth]));

export const incomeColumns: DashboardTableColumn[] = [
  { defaultWidth: 150, key: "date", label: "table.date", minWidth: 130, sortable: true },
  { defaultWidth: 220, key: "source", label: "table.source", minWidth: 150, sortable: true },
  { defaultWidth: 360, key: "description", label: "table.description", minWidth: 180, sortable: true },
  { defaultWidth: 170, key: "account", label: "table.account", minWidth: 135, sortable: true },
  { defaultWidth: 140, key: "incomeType", label: "form.incomeType", minWidth: 110, sortable: true },
  { defaultWidth: 135, key: "status", label: "table.status", minWidth: 112, sortable: true },
  { align: "end", defaultWidth: 135, key: "amount", label: "table.amount", minWidth: 110, sortable: true },
  { align: "end", defaultWidth: 76, key: "actions", label: "", minWidth: 72 },
];

export const defaultIncomeColumnWidths = Object.fromEntries(incomeColumns.map((column) => [column.key, column.defaultWidth]));

export const budgetColumns: DashboardTableColumn[] = [
  { defaultWidth: 240, key: "category", label: "table.category", minWidth: 170, sortable: true },
  { align: "end", defaultWidth: 120, key: "limit", label: "table.budget", minWidth: 100, sortable: true },
  { align: "end", defaultWidth: 125, key: "spent", label: "table.spent", minWidth: 110, sortable: true },
  { align: "end", defaultWidth: 125, key: "remaining", label: "table.remaining", minWidth: 110, sortable: true },
  { defaultWidth: 220, key: "progress", label: "table.progress", minWidth: 180, sortable: true },
  { align: "end", defaultWidth: 76, key: "actions", label: "", minWidth: 72 },
];

export const defaultBudgetColumnWidths = Object.fromEntries(budgetColumns.map((column) => [column.key, column.defaultWidth]));

export const dashboardTransactionColumns: DashboardTableColumn[] = [
  { defaultWidth: 145, key: "date", label: "table.date", minWidth: 120, sortable: true },
  { defaultWidth: 170, key: "category", label: "table.category", minWidth: 130, sortable: true },
  { defaultWidth: 320, key: "description", label: "table.description", minWidth: 170, sortable: true },
  { defaultWidth: 120, key: "type", label: "table.type", minWidth: 95, sortable: true },
  { align: "end", defaultWidth: 120, key: "amount", label: "table.amount", minWidth: 100, sortable: true },
];

export const defaultDashboardTransactionColumnWidths = Object.fromEntries(dashboardTransactionColumns.map((column) => [column.key, column.defaultWidth]));
