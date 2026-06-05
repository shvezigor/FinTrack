import { Prisma } from "@prisma/client";
import { config } from "../config.js";
import { getDb } from "../db.js";
import { enqueueJob } from "./jobs.js";
import { maybeCreateExpenseAlert } from "./notifications.js";
import { getSecretSetting, getPlainSetting, setPlainSetting } from "./settings.js";
import { ensureDefaultUser } from "./auth.js";
import { getUserSecret, upsertUserSecret } from "./user-secrets.js";

type MonoStatementItem = {
  id: string;
  time: number;
  description?: string;
  mcc?: number;
  originalMcc?: number;
  hold?: boolean;
  amount: number;
  operationAmount?: number;
  currencyCode?: number;
  commissionRate?: number;
  cashbackAmount?: number;
  balance?: number;
  comment?: string;
  receiptId?: string;
  counterName?: string;
};

type MonoAccountInfo = {
  id: string;
  sendId?: string;
  balance: number;
  creditLimit?: number;
  type: string;
  currencyCode: number;
  cashbackType?: string;
  maskedPan?: string[];
  iban?: string;
};

type MonoClientInfo = {
  clientId?: string;
  name: string;
  webHookUrl?: string;
  permissions?: string;
  accounts: MonoAccountInfo[];
  jars?: Array<{
    id: string;
    sendId?: string;
    title: string;
    description?: string;
    currencyCode: number;
    balance: number;
    goal?: number;
  }>;
};

type SyncedMonoAccount = {
  balance: number;
  currencyCode: number;
  id: string;
  maskedPan: string | null;
  name: string;
  type: string;
};

type WebhookSetupResult = {
  reason?: string;
  status: "enabled" | "failed" | "skipped";
  url?: string;
};

const MONO_API_BASE = "https://api.monobank.ua";
const MONO_TOKEN_PAGE = "https://api.monobank.ua/";
const MONO_STATEMENT_MAX_SECONDS = 31 * 24 * 60 * 60 + 60 * 60;
const MONO_STATEMENT_JOB_SPACING_MS = 65_000;
const MONO_STATEMENT_MAX_QUEUED_DAYS = 366;

type MonobankStatementRangeInput = {
  accountId?: string | null;
  from: Date | number | string;
  source?: string;
  to: Date | number | string;
  userId?: string | null;
};

type NormalizedStatementRange = {
  days: number;
  fromDate: Date;
  fromUnix: number;
  toDate: Date;
  toUnix: number;
};

export async function getMonobankToken(userId?: string | null): Promise<string | null> {
  return getUserSecret(userId, "MONOBANK", "MONOBANK_TOKEN", await getSecretSetting("MONOBANK_TOKEN", config.MONOBANK_TOKEN));
}

export async function getSelectedMonobankAccountId(): Promise<string | null> {
  return getPlainSetting("MONOBANK_ACCOUNT_ID").then((value) => value ?? config.MONOBANK_ACCOUNT_ID);
}

export async function fetchMonobankClientInfo(userId?: string | null): Promise<MonoClientInfo> {
  return fetchMonobankClientInfoWithToken(await requireMonobankToken(userId));
}

export async function connectMonobankUser(input: {
  enableWebhook?: boolean;
  enqueueBackfill?: boolean;
  token: string;
  userId: string;
}) {
  const token = input.token.trim();
  if (token.length < 20) {
    throw new Error("Monobank token виглядає занадто коротким.");
  }

  const clientInfo = await fetchMonobankClientInfoWithToken(token);
  const syncedAccounts = await syncMonobankAccounts(input.userId, clientInfo);

  await upsertUserSecret({
    keyName: "MONOBANK_TOKEN",
    label: "Monobank personal token",
    provider: "MONOBANK",
    userId: input.userId,
    value: token,
  });

  const webhook =
    input.enableWebhook === false
      ? ({ status: "skipped", reason: "Webhook вимкнений під час підключення." } satisfies WebhookSetupResult)
      : await enableMonobankWebhookForUser(input.userId).catch((error) => ({
          reason: error instanceof Error ? error.message : "Webhook не вдалося увімкнути.",
          status: "failed" as const,
        }));

  await upsertMonobankConnection(input.userId, clientInfo, {
    accountCount: syncedAccounts.length,
    tokenPage: MONO_TOKEN_PAGE,
    webhook,
  });

  if (input.enqueueBackfill !== false) {
    await enqueueJob("monobank_backfill", { days: 31, userId: input.userId });
  }

  return {
    accounts: syncedAccounts,
    clientName: clientInfo.name,
    connected: true,
    queuedBackfill: input.enqueueBackfill !== false,
    tokenPage: MONO_TOKEN_PAGE,
    webhook,
  };
}

export async function syncMonobankUser(userId: string) {
  const clientInfo = await fetchMonobankClientInfo(userId);
  const accounts = await syncMonobankAccounts(userId, clientInfo);
  await upsertMonobankConnection(userId, clientInfo, {
    accountCount: accounts.length,
    syncOnly: true,
  });
  return {
    accounts,
    clientName: clientInfo.name,
    synced: true,
  };
}

export async function selectDefaultMonobankAccount(userId?: string | null): Promise<string> {
  const resolvedUserId = await resolveMonobankUserId(userId);
  const clientInfo = await fetchMonobankClientInfo(resolvedUserId);
  const disabledAccountIds = await getDisabledMonobankExternalIds(resolvedUserId);
  const account = chooseStatementAccount(clientInfo.accounts, await getSelectedMonobankAccountId(), disabledAccountIds);

  if (!account) {
    throw new Error("No active Monobank accounts found");
  }

  await setPlainSetting("MONOBANK_ACCOUNT_ID", account.id);
  return account.id;
}

export async function backfillMonobankStatement(days = 31, userId?: string | null) {
  const to = new Date();
  const from = new Date(to.getTime() - Math.min(days, 31) * 24 * 60 * 60 * 1000);
  return backfillMonobankStatementRange({ from, source: "monobank_backfill", to, userId });
}

export async function backfillMonobankStatementRange(input: MonobankStatementRangeInput) {
  const resolvedUserId = await resolveMonobankUserId(input.userId);
  const range = normalizeMonobankStatementRange(input);
  assertMonobankStatementWindow(range);
  const token = await requireMonobankToken(resolvedUserId);
  const clientInfo = await fetchMonobankClientInfoWithToken(token);
  const activeAccountIds = await getActiveMonobankExternalIds(resolvedUserId);
  const syncedAccounts = await syncMonobankAccounts(resolvedUserId, clientInfo);
  const disabledAccountIds = await getDisabledMonobankExternalIds(resolvedUserId);
  const hasLocalAccountSelection = activeAccountIds.size > 0 || disabledAccountIds.size > 0;
  const accounts = chooseStatementAccounts(clientInfo.accounts, disabledAccountIds, activeAccountIds, hasLocalAccountSelection).filter(
    (account) => !input.accountId || account.id === input.accountId,
  );

  if (!accounts.length) {
    await upsertMonobankConnection(resolvedUserId, clientInfo, {
      accountCount: syncedAccounts.length,
      activeStatementAccounts: activeAccountIds.size,
      requestedStatementAccountId: input.accountId ?? null,
      statementFrom: range.fromDate.toISOString(),
      statementTo: range.toDate.toISOString(),
      importedStatementItems: 0,
      skippedDisabledAccounts: disabledAccountIds.size,
      syncOnly: true,
    });
    return 0;
  }

  let importedStatementItems = 0;
  const statementAccountIds: string[] = [];

  for (const account of accounts) {
    const response = await fetch(`${MONO_API_BASE}/personal/statement/${account.id}/${range.fromUnix}/${range.toUnix}`, {
      headers: { "X-Token": token },
    });

    if (!response.ok) {
      throw new Error(await monobankError(response, `Monobank statement failed for ${monobankAccountName(account)}`));
    }

    const items = (await response.json()) as MonoStatementItem[];
    for (const item of items) {
      const result = await upsertMonobankTransaction(account.id, item, resolvedUserId, { suppressAlerts: true });
      if (result?.isNew) {
        importedStatementItems += 1;
      }
    }
    statementAccountIds.push(account.id);
  }

  await upsertMonobankConnection(resolvedUserId, clientInfo, {
    accountCount: clientInfo.accounts.length,
    activeStatementAccounts: activeAccountIds.size,
    importedStatementItems,
    requestedStatementAccountId: input.accountId ?? null,
    source: input.source ?? "monobank_statement_range",
    statementAccountIds,
    statementFrom: range.fromDate.toISOString(),
    statementTo: range.toDate.toISOString(),
    skippedDisabledAccounts: disabledAccountIds.size,
  });
  await enqueueJob("classify_monobank_expenses", { source: input.source ?? "monobank_statement_range", userId: resolvedUserId });
  await enqueueJob("match_expenses", { source: input.source ?? "monobank_statement_range", userId: resolvedUserId });
  return importedStatementItems;
}

export async function enqueueMonobankStatementBackfillRange(input: Omit<MonobankStatementRangeInput, "accountId">) {
  const resolvedUserId = await resolveMonobankUserId(input.userId);
  const range = normalizeMonobankStatementRange(input);
  if (range.days > MONO_STATEMENT_MAX_QUEUED_DAYS) {
    throw new Error(`Monobank range sync is limited to ${MONO_STATEMENT_MAX_QUEUED_DAYS} days per run.`);
  }

  const token = await requireMonobankToken(resolvedUserId);
  const clientInfo = await fetchMonobankClientInfoWithToken(token);
  const activeAccountIds = await getActiveMonobankExternalIds(resolvedUserId);
  const syncedAccounts = await syncMonobankAccounts(resolvedUserId, clientInfo);
  const disabledAccountIds = await getDisabledMonobankExternalIds(resolvedUserId);
  const hasLocalAccountSelection = activeAccountIds.size > 0 || disabledAccountIds.size > 0;
  const accounts = chooseStatementAccounts(clientInfo.accounts, disabledAccountIds, activeAccountIds, hasLocalAccountSelection);

  if (!accounts.length) {
    await upsertMonobankConnection(resolvedUserId, clientInfo, {
      accountCount: syncedAccounts.length,
      activeStatementAccounts: activeAccountIds.size,
      queuedStatementJobs: 0,
      skippedDisabledAccounts: disabledAccountIds.size,
      statementFrom: range.fromDate.toISOString(),
      statementTo: range.toDate.toISOString(),
      syncOnly: true,
    });
    return {
      accounts: 0,
      chunks: 0,
      from: range.fromDate.toISOString(),
      queued: false,
      queuedJobs: 0,
      to: range.toDate.toISOString(),
    };
  }

  const chunks = splitMonobankStatementRange(range);
  const queuedJobs = chunks.length * accounts.length;
  if (queuedJobs > 120) {
    throw new Error("Selected Monobank period creates too many sync jobs. Please choose a shorter period.");
  }

  let sequence = 0;
  for (const chunk of chunks) {
    for (const account of accounts) {
      await enqueueJob(
        "monobank_backfill",
        {
          accountId: account.id,
          from: new Date(chunk.fromUnix * 1000).toISOString(),
          source: input.source ?? "monobank_range_sync",
          to: new Date(chunk.toUnix * 1000).toISOString(),
          userId: resolvedUserId,
        },
        { runAfter: new Date(Date.now() + sequence * MONO_STATEMENT_JOB_SPACING_MS) },
      );
      sequence += 1;
    }
  }

  await upsertMonobankConnection(resolvedUserId, clientInfo, {
    accountCount: clientInfo.accounts.length,
    activeStatementAccounts: activeAccountIds.size,
    queuedStatementAccounts: accounts.map((account) => account.id),
    queuedStatementChunks: chunks.length,
    queuedStatementJobs: queuedJobs,
    skippedDisabledAccounts: disabledAccountIds.size,
    statementFrom: range.fromDate.toISOString(),
    statementTo: range.toDate.toISOString(),
  });

  return {
    accounts: accounts.length,
    chunks: chunks.length,
    estimatedMinutes: Math.ceil(Math.max(0, queuedJobs - 1) * MONO_STATEMENT_JOB_SPACING_MS / 60_000),
    from: range.fromDate.toISOString(),
    queued: true,
    queuedJobs,
    to: range.toDate.toISOString(),
  };
}

export async function setMonobankWebhook(url: string, userId?: string | null) {
  await postMonobankWebhook(await requireMonobankToken(userId), url);
}

export async function enableMonobankWebhookForUser(userId: string): Promise<WebhookSetupResult> {
  const webhookUrl = buildMonobankWebhookUrl();
  const unusableReason = webhookUrl ? publicWebhookBlocker(webhookUrl) : "APP_BASE_URL не налаштований.";

  if (!webhookUrl || unusableReason) {
    return {
      reason: unusableReason ?? "APP_BASE_URL is not configured.",
      status: "skipped",
      url: webhookUrl ?? undefined,
    };
  }

  await postMonobankWebhook(await requireMonobankToken(userId), webhookUrl);
  const connection = await findMonobankConnection(userId);
  if (connection) {
    await getDb().integrationConnection.update({
      data: {
        metadata: mergeJsonObject(connection.metadata, { webhook: { status: "enabled", url: webhookUrl } }),
        status: "CONNECTED",
      },
      where: { id: connection.id },
    });
  }

  return {
    status: "enabled",
    url: webhookUrl,
  };
}

export async function upsertMonobankWebhookPayload(payload: unknown) {
  const parsed = payload as {
    data?: {
      account?: string;
      statementItem?: MonoStatementItem;
    };
    type?: string;
  };

  if (parsed.type !== "StatementItem" || !parsed.data?.account || !parsed.data.statementItem) {
    return null;
  }

  const userId = await findUserIdByMonoAccount(parsed.data.account);
  const result = await upsertMonobankTransaction(parsed.data.account, parsed.data.statementItem, userId);
  if (!result?.tx) {
    return null;
  }
  if (!result.isNew) {
    return result.tx;
  }
  const expense = await getDb().expense.findUnique({
    select: { id: true },
    where: { monoTransactionId: result.tx.id },
  });
  if (expense) {
    await enqueueJob("classify_monobank_expenses", { expenseIds: [expense.id], source: "monobank_webhook", userId: result.tx.userId ?? null });
  }
  await enqueueJob("match_expenses", { monoTransactionId: result.tx.id, userId: result.tx.userId ?? null });
  return result.tx;
}

export async function upsertMonobankTransaction(
  accountId: string,
  item: MonoStatementItem,
  userId?: string | null,
  options: { suppressAlerts?: boolean } = {},
) {
  const db = getDb();
  const existingTx = await db.monoTransaction.findUnique({
    where: { monoTransactionId: item.id },
  });

  if (existingTx) {
    return { isNew: false, tx: existingTx } as const;
  }

  const resolvedUserId = await resolveMonobankUserId(userId ?? (await findUserIdByMonoAccount(accountId)));
  const financialAccount = await ensureMonobankFinancialAccount(resolvedUserId, accountId, item);
  if (!financialAccount) {
    return null;
  }
  const rawJson = JSON.parse(JSON.stringify(item)) as Prisma.InputJsonValue;

  const tx = await db.monoTransaction.create({
    data: {
      accountId,
      amount: item.amount,
      balance: item.balance,
      cashbackAmount: item.cashbackAmount,
      commissionRate: item.commissionRate,
      comment: item.comment,
      counterName: item.counterName,
      currencyCode: item.currencyCode ?? 980,
      description: item.description,
      financialAccountId: financialAccount.id,
      hold: item.hold ?? false,
      mcc: item.mcc,
      monoTransactionId: item.id,
      operationAmount: item.operationAmount,
      originalMcc: item.originalMcc,
      rawJson,
      receiptId: item.receiptId,
      timestamp: new Date(item.time * 1000),
      userId: resolvedUserId,
    },
  });

  if (item.amount < 0) {
    const existingExpense = await db.expense.findUnique({
      select: { id: true },
      where: { monoTransactionId: tx.id },
    });
    if (!existingExpense) {
      const expense = await db.expense.create({
        data: {
          amount: new Prisma.Decimal(Math.abs(item.amount) / 100),
          currencyCode: item.currencyCode ?? 980,
          date: new Date(item.time * 1000),
          description: item.description ?? item.counterName ?? null,
          financialAccountId: financialAccount.id,
          monoTransactionId: tx.id,
          paymentType: "CARD",
          sourceStatus: "MONO_ONLY",
          userId: resolvedUserId,
        },
      });
      if (!options.suppressAlerts) {
        await maybeCreateExpenseAlert(expense.id, resolvedUserId);
      }
    }
  }

  if (item.amount > 0) {
    const incomeData = {
      amount: new Prisma.Decimal(item.amount / 100),
      currencyCode: item.currencyCode ?? 980,
      date: new Date(item.time * 1000),
      description: item.description ?? item.counterName ?? null,
      financialAccountId: financialAccount.id,
      source: item.counterName ?? item.description ?? "Monobank",
      status: item.hold ? "PENDING" : "RECEIVED",
      userId: resolvedUserId,
    };
    const existingIncome = await db.income.findFirst({
      select: { id: true },
      where: { monoTransactionId: tx.id },
    });

    if (!existingIncome) {
      await db.income.create({
        data: {
          ...incomeData,
          monoTransactionId: tx.id,
        },
      });
    }
  }

  return { isNew: true, tx } as const;
}

function normalizeMonobankStatementRange(input: MonobankStatementRangeInput): NormalizedStatementRange {
  const fromDate = parseStatementDate(input.from, "from");
  const requestedToDate = parseStatementDate(input.to, "to");
  const now = new Date();
  const toDate = requestedToDate.getTime() > now.getTime() ? now : requestedToDate;

  if (fromDate.getTime() > toDate.getTime()) {
    throw new Error("Invalid Monobank sync period.");
  }

  const fromUnix = Math.floor(fromDate.getTime() / 1000);
  const toUnix = Math.floor(toDate.getTime() / 1000);
  const days = Math.max(1, Math.ceil((toUnix - fromUnix + 1) / (24 * 60 * 60)));
  return {
    days,
    fromDate: new Date(fromUnix * 1000),
    fromUnix,
    toDate: new Date(toUnix * 1000),
    toUnix,
  };
}

function parseStatementDate(value: Date | number | string, fieldName: string) {
  const date =
    value instanceof Date
      ? value
      : typeof value === "number"
        ? new Date(value > 10_000_000_000 ? value : value * 1000)
        : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid Monobank ${fieldName} date.`);
  }

  return date;
}

function assertMonobankStatementWindow(range: NormalizedStatementRange) {
  if (range.toUnix - range.fromUnix > MONO_STATEMENT_MAX_SECONDS) {
    throw new Error("Monobank statement API allows up to 31 days plus 1 hour per request.");
  }
}

function splitMonobankStatementRange(range: NormalizedStatementRange) {
  const chunks: Array<{ fromUnix: number; toUnix: number }> = [];
  let fromUnix = range.fromUnix;

  while (fromUnix <= range.toUnix) {
    const toUnix = Math.min(fromUnix + MONO_STATEMENT_MAX_SECONDS, range.toUnix);
    chunks.push({ fromUnix, toUnix });
    fromUnix = toUnix + 1;
  }

  return chunks;
}

async function fetchMonobankClientInfoWithToken(token: string): Promise<MonoClientInfo> {
  const response = await fetch(`${MONO_API_BASE}/personal/client-info`, {
    headers: { "X-Token": token },
  });

  if (!response.ok) {
    throw new Error(await monobankError(response, "Monobank client-info failed"));
  }

  return (await response.json()) as MonoClientInfo;
}

async function syncMonobankAccounts(userId: string, clientInfo: MonoClientInfo): Promise<SyncedMonoAccount[]> {
  const db = getDb();
  const disabledExternalIds = await getDisabledMonobankExternalIds(userId);
  const hasPrimary = await db.financialAccount.count({
    where: {
      isActive: true,
      isPrimary: true,
      userId,
    },
  });
  const synced: SyncedMonoAccount[] = [];

  for (const account of clientInfo.accounts) {
    if (disabledExternalIds.has(account.id)) {
      continue;
    }

    const maskedPan = account.maskedPan?.[0] ?? null;
    const accountName = monobankAccountName(account);
    const existing = await db.financialAccount.findFirst({
      where: {
        externalId: account.id,
        provider: "MONOBANK",
        userId,
      },
    });

    const data = {
      balance: new Prisma.Decimal(account.balance / 100),
      currencyCode: account.currencyCode,
      externalId: account.id,
      isActive: true,
      maskedPan,
      name: accountName,
      provider: "MONOBANK" as const,
      type: "CARD" as const,
      userId,
    };

    const row = existing
      ? await db.financialAccount.update({
          data,
          where: { id: existing.id },
        })
      : await db.financialAccount.create({
          data: {
            ...data,
            isPrimary: hasPrimary === 0 && synced.length === 0,
          },
        });

    synced.push({
      balance: Number(row.balance),
      currencyCode: row.currencyCode,
      id: row.id,
      maskedPan: row.maskedPan,
      name: row.name,
      type: row.type,
    });
  }

  for (const jar of clientInfo.jars ?? []) {
    if (disabledExternalIds.has(`jar:${jar.id}`)) {
      continue;
    }

    const existing = await db.financialAccount.findFirst({
      where: {
        externalId: `jar:${jar.id}`,
        provider: "MONOBANK",
        userId,
      },
    });
    const data = {
      balance: new Prisma.Decimal(jar.balance / 100),
      currencyCode: jar.currencyCode,
      externalId: `jar:${jar.id}`,
      isActive: true,
      maskedPan: null,
      name: jar.title || "monobank jar",
      provider: "MONOBANK" as const,
      type: "SAVINGS" as const,
      userId,
    };
    const row = existing
      ? await db.financialAccount.update({
          data,
          where: { id: existing.id },
        })
      : await db.financialAccount.create({
          data: {
            ...data,
            isPrimary: false,
          },
        });

    synced.push({
      balance: Number(row.balance),
      currencyCode: row.currencyCode,
      id: row.id,
      maskedPan: row.maskedPan,
      name: row.name,
      type: row.type,
    });
  }

  return synced;
}

async function ensureMonobankFinancialAccount(userId: string, accountId: string, item: MonoStatementItem) {
  const db = getDb();
  const existing = await db.financialAccount.findFirst({
    where: {
      externalId: accountId,
      provider: "MONOBANK",
      userId,
    },
  });

  if (existing && !existing.isActive) {
    return null;
  }

  if (existing) {
    return db.financialAccount.update({
      data: {
        balance: item.balance === undefined ? undefined : new Prisma.Decimal(item.balance / 100),
        currencyCode: item.currencyCode ?? existing.currencyCode,
        isActive: true,
      },
      where: { id: existing.id },
    });
  }

  return db.financialAccount.create({
    data: {
      balance: new Prisma.Decimal((item.balance ?? 0) / 100),
      currencyCode: item.currencyCode ?? 980,
      externalId: accountId,
      isPrimary: false,
      name: "monobank",
      provider: "MONOBANK",
      type: "CARD",
      userId,
    },
  });
}

async function upsertMonobankConnection(userId: string, clientInfo: MonoClientInfo, metadata: Record<string, unknown>) {
  const current = await findMonobankConnection(userId);
  const data = {
    externalAccountId: clientInfo.clientId ?? null,
    label: clientInfo.name ? `monobank: ${clientInfo.name}` : "monobank",
    lastSyncAt: new Date(),
    metadata: mergeJsonObject(current?.metadata, {
      clientName: clientInfo.name,
      currentWebhookUrl: clientInfo.webHookUrl ?? null,
      permissions: clientInfo.permissions ?? null,
      ...metadata,
    }),
    provider: "MONOBANK" as const,
    status: "CONNECTED" as const,
    userId,
  };

  return current
    ? getDb().integrationConnection.update({ data, where: { id: current.id } })
    : getDb().integrationConnection.create({ data });
}

async function findMonobankConnection(userId: string) {
  return getDb().integrationConnection.findFirst({
    orderBy: { updatedAt: "desc" },
    where: {
      provider: "MONOBANK",
      userId,
    },
  });
}

async function findUserIdByMonoAccount(accountId: string) {
  const account = await getDb().financialAccount.findFirst({
    select: { userId: true },
    where: {
      externalId: accountId,
      provider: "MONOBANK",
      userId: { not: null },
    },
  });
  return account?.userId ?? null;
}

async function getDisabledMonobankExternalIds(userId: string) {
  const accounts = await getDb().financialAccount.findMany({
    select: { externalId: true },
    where: {
      externalId: { not: null },
      isActive: false,
      provider: "MONOBANK",
      userId,
    },
  });
  return new Set(accounts.map((account) => account.externalId).filter((value): value is string => Boolean(value)));
}

async function getActiveMonobankExternalIds(userId: string) {
  const accounts = await getDb().financialAccount.findMany({
    select: { externalId: true },
    where: {
      externalId: { not: null },
      isActive: true,
      provider: "MONOBANK",
      userId,
    },
  });
  return new Set(accounts.map((account) => account.externalId).filter((value): value is string => Boolean(value)));
}

async function requireMonobankToken(userId?: string | null): Promise<string> {
  const token = await getMonobankToken(userId);
  if (!token) {
    throw new Error("Monobank token is not configured");
  }

  return token;
}

async function postMonobankWebhook(token: string, url: string) {
  const response = await fetch(`${MONO_API_BASE}/personal/webhook`, {
    body: JSON.stringify({ webHookUrl: url }),
    headers: {
      "Content-Type": "application/json",
      "X-Token": token,
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await monobankError(response, "Monobank webhook failed"));
  }
}

async function resolveMonobankUserId(userId?: string | null) {
  if (userId) {
    return userId;
  }
  return (await ensureDefaultUser()).id;
}

function chooseStatementAccount(
  accounts: MonoAccountInfo[],
  selectedAccountId?: string | null,
  disabledAccountIds = new Set<string>(),
) {
  const availableAccounts = accounts.filter((account) => !disabledAccountIds.has(account.id));
  const activeUahCards = availableAccounts
    .filter((account) => account.currencyCode === 980 && (account.maskedPan?.length ?? 0) > 0)
    .sort((left, right) => right.balance - left.balance);
  const activeCards = availableAccounts
    .filter((account) => (account.maskedPan?.length ?? 0) > 0)
    .sort((left, right) => right.balance - left.balance);

  return (
    availableAccounts.find((account) => account.id === selectedAccountId) ??
    activeUahCards[0] ??
    availableAccounts.find((account) => account.currencyCode === 980) ??
    activeCards[0] ??
    availableAccounts[0] ??
    null
  );
}

function chooseStatementAccounts(
  accounts: MonoAccountInfo[],
  disabledAccountIds = new Set<string>(),
  activeAccountIds = new Set<string>(),
  hasLocalAccountSelection = false,
) {
  const enabledAccounts = accounts.filter((account) => !disabledAccountIds.has(account.id));
  if (!hasLocalAccountSelection) {
    return enabledAccounts;
  }
  return enabledAccounts.filter((account) => activeAccountIds.has(account.id));
}

function monobankAccountName(account: MonoAccountInfo) {
  const pan = account.maskedPan?.[0];
  if (pan) {
    const tail = pan.replace(/\D/g, "").slice(-4);
    return tail ? `monobank • ${tail}` : `monobank ${pan}`;
  }
  return account.type ? `monobank ${account.type}` : "monobank";
}

function buildMonobankWebhookUrl() {
  try {
    const secret = config.MONOBANK_WEBHOOK_SECRET || config.TELEGRAM_WEBHOOK_SECRET || "mono";
    const url = new URL(config.APP_BASE_URL);
    url.pathname = `/webhooks/monobank/${encodeURIComponent(secret)}`;
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function publicWebhookBlocker(url: string) {
  const parsed = new URL(url);
  const host = parsed.hostname.toLowerCase();
  if (["localhost", "127.0.0.1", "::1", "0.0.0.0"].includes(host)) {
    return "Webhook потребує публічний HTTPS URL. Для локальної розробки використай tunnel і задай APP_BASE_URL.";
  }
  if (parsed.protocol !== "https:") {
    return "Monobank webhook має бути доступний через HTTPS.";
  }
  return null;
}

function mergeJsonObject(current: Prisma.JsonValue | null | undefined, next: Record<string, unknown>) {
  const base = current && typeof current === "object" && !Array.isArray(current) ? current : {};
  return JSON.parse(JSON.stringify({
    ...base,
    ...next,
  })) as Prisma.InputJsonValue;
}

async function monobankError(response: Response, prefix: string) {
  const body = await response.text().catch(() => "");
  const message = body.trim() ? `: ${body.trim().slice(0, 300)}` : "";
  return `${prefix}: ${response.status}${message}`;
}
