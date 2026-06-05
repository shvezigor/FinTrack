import { google } from "googleapis";
import { config } from "../config.js";
import { getDb } from "../db.js";
import { getPlainSetting, getSecretSetting } from "./settings.js";
import { getUserPlainSecret, getUserSecret } from "./user-secrets.js";

const EXPENSES_TAB = "Expenses";

export type ExpenseSheetExportFilters = {
  accountId?: string | null;
  categoryId?: string | null;
  mode?: "all" | "card" | "cash" | "review" | null;
  query?: string | null;
  range?: {
    from?: string | null;
    to?: string | null;
  } | null;
  status?: "all" | "completed" | "review" | null;
};

export async function exportExpensesToGoogleSheets(
  userId?: string | null,
  filters?: ExpenseSheetExportFilters | null,
) {
  const spreadsheetId =
    (await getUserPlainSecret(
      userId,
      "GOOGLE_SHEETS",
      "GOOGLE_SHEETS_SPREADSHEET_ID",
      await getPlainSetting("GOOGLE_SHEETS_SPREADSHEET_ID").then((value) => value ?? config.GOOGLE_SHEETS_SPREADSHEET_ID),
    )) ?? "";
  const serviceAccountJson =
    (await getUserSecret(
      userId,
      "GOOGLE_SHEETS",
      "GOOGLE_SERVICE_ACCOUNT_JSON",
      await getSecretSetting("GOOGLE_SERVICE_ACCOUNT_JSON", config.GOOGLE_SERVICE_ACCOUNT_JSON),
    )) ?? "";

  if (!spreadsheetId || !serviceAccountJson) {
    throw new Error("Google Sheets credentials are not configured");
  }

  const credentials = JSON.parse(serviceAccountJson) as {
    client_email: string;
    private_key: string;
  };
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ auth, version: "v4" });

  await ensureExpensesSheet(sheets, spreadsheetId);

  const normalizedQuery = (filters?.query ?? "").trim().toLocaleLowerCase("uk-UA");
  const rangeFrom = filters?.range?.from ? new Date(filters.range.from) : null;
  const rangeTo = filters?.range?.to ? new Date(filters.range.to) : null;
  const expenses = await getDb().expense.findMany({
    include: { category: true, financialAccount: true, monoTransaction: true, telegramEntry: true },
    orderBy: { date: "asc" },
    where: {
      ...(userId ? { userId } : {}),
      ...(filters?.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters?.accountId ? { financialAccountId: filters.accountId } : {}),
      ...(rangeFrom || rangeTo
        ? {
            date: {
              ...(rangeFrom ? { gte: rangeFrom } : {}),
              ...(rangeTo ? { lte: rangeTo } : {}),
            },
          }
        : {}),
      ...(filters?.mode === "card"
        ? { paymentType: "CARD" }
        : filters?.mode === "cash"
          ? { paymentType: "CASH" }
          : {}),
      ...(filters?.status === "review" || filters?.mode === "review"
        ? { sourceStatus: "NEEDS_REVIEW" }
        : {}),
    },
  });

  const filteredExpenses = normalizedQuery
    ? expenses.filter((expense) => {
        const haystack = `${expense.description ?? ""} ${expense.category?.name ?? ""} ${expense.financialAccount?.name ?? ""}`
          .toLocaleLowerCase("uk-UA");
        return haystack.includes(normalizedQuery);
      })
    : expenses;

  const values = [
    [
      "Date",
      "Amount",
      "Currency",
      "Category",
      "Group",
      "Description",
      "Account",
      "Payment Type",
      "Source",
      "Mono ID",
      "Telegram ID",
      "Confidence",
      "Updated At",
    ],
    ...filteredExpenses.map((expense) => [
      expense.date.toISOString(),
      Number(expense.amount),
      expense.currencyCode,
      expense.category?.name ?? "",
      expense.category?.dashboardGroup ?? "",
      expense.description ?? "",
      expense.financialAccount?.name ?? "",
      expense.paymentType,
      expense.sourceStatus,
      expense.monoTransaction?.monoTransactionId ?? "",
      expense.telegramEntry?.telegramMessageId ?? "",
      expense.confidence ? Number(expense.confidence) : "",
      expense.updatedAt.toISOString(),
    ]),
  ];

  await sheets.spreadsheets.values.clear({
    range: `${EXPENSES_TAB}!A:L`,
    spreadsheetId,
  });
  await sheets.spreadsheets.values.update({
    range: `${EXPENSES_TAB}!A1`,
    requestBody: { values },
    spreadsheetId,
    valueInputOption: "USER_ENTERED",
  });

  await getDb().expense.updateMany({
    data: { exportedToSheetsAt: new Date() },
    where: filteredExpenses.length
      ? {
          id: {
            in: filteredExpenses.map((expense) => expense.id),
          },
        }
      : { id: "__none__" },
  });

  return filteredExpenses.length;
}

async function ensureExpensesSheet(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
) {
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const hasExpensesTab = spreadsheet.data.sheets?.some(
    (sheet) => sheet.properties?.title === EXPENSES_TAB,
  );

  if (hasExpensesTab) {
    return;
  }

  await sheets.spreadsheets.batchUpdate({
    requestBody: {
      requests: [{ addSheet: { properties: { title: EXPENSES_TAB } } }],
    },
    spreadsheetId,
  });
}
