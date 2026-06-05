import { execFileSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LEGACY_CONTAINER = "finance-recovery";
const LEGACY_DB = "finance_bot";
const LEGACY_USER_ID = 1;
const TARGET_EMAIL = "shvezigor@gmail.com";
const TARGET_NAME = "Ihor Shvets";
const DEFAULT_TIMEZONE = "Europe/Kyiv";
const DEFAULT_LOCALE = "uk";
const DEFAULT_NUMBER_FORMAT = "SPACE_COMMA";
const DEFAULT_CURRENCY_CODE = 980;

type LegacyTx = {
  amount: number;
  cardInfo: string | null;
  createdAt: string | null;
  currency: string | null;
  description: string | null;
  externalId: string | null;
  id: number;
  operationDate: string;
  rawText: string | null;
  source: string | null;
  telegramMessageId: string | null;
  type: "expense" | "income";
};

type LegacyUser = {
  createdAt: string;
  id: number;
  name: string | null;
  telegramId: string | null;
  updatedAt: string;
};

type AccountRecord = {
  externalId: string | null;
  id: string;
  maskedPan: string | null;
  name: string;
};

function runLegacyQuery(sql: string) {
  return execFileSync(
    "docker",
    [
      "exec",
      LEGACY_CONTAINER,
      "mysql",
      "-uroot",
      "-D",
      LEGACY_DB,
      "--batch",
      "--raw",
      "--skip-column-names",
      "--default-character-set=utf8mb4",
      "-e",
      sql,
    ],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
}

function decodeHex(value: string) {
  if (!value || value.toUpperCase() === "NULL") return null;
  return Buffer.from(value, "hex").toString("utf8");
}

function parseLegacyUsers(raw: string): LegacyUser[] {
  return raw
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [id, telegramId, nameHex, createdAt, updatedAt] = line.split("\t");
      return {
        createdAt,
        id: Number(id),
        name: decodeHex(nameHex),
        telegramId: telegramId === "NULL" ? null : telegramId,
        updatedAt,
      };
    });
}

function parseLegacyTransactions(raw: string): LegacyTx[] {
  return raw
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [
        id,
        type,
        amount,
        currencyHex,
        descriptionHex,
        operationDate,
        telegramMessageId,
        rawTextHex,
        createdAt,
        externalIdHex,
        sourceHex,
        cardInfoHex,
      ] = line.split("\t");

      return {
        amount: Number(amount),
        cardInfo: decodeHex(cardInfoHex),
        createdAt: createdAt === "NULL" ? null : createdAt,
        currency: decodeHex(currencyHex),
        description: decodeHex(descriptionHex),
        externalId: decodeHex(externalIdHex),
        id: Number(id),
        operationDate,
        rawText: decodeHex(rawTextHex),
        source: decodeHex(sourceHex),
        telegramMessageId: telegramMessageId === "NULL" ? null : telegramMessageId,
        type: type as "expense" | "income",
      };
    });
}

function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function toCurrencyCode(currency: string | null) {
  if (!currency) return DEFAULT_CURRENCY_CODE;
  const normalized = currency.trim().toUpperCase();
  if (normalized === "UAH") return 980;
  if (normalized === "USD") return 840;
  if (normalized === "EUR") return 978;
  return DEFAULT_CURRENCY_CODE;
}

function formatAccountName(cardInfo: string) {
  return cardInfo.replace(/^Mono\s+/i, "monobank ");
}

function extractMaskedPan(cardInfo: string | null) {
  if (!cardInfo) return null;
  const match = cardInfo.match(/\(([^)]+)\)/);
  return match?.[1] ?? null;
}

async function ensureRole(key: "USER") {
  return prisma.role.upsert({
    where: { key },
    update: {
      description: "Standard member with access to personal finance data.",
      name: "User",
    },
    create: {
      description: "Standard member with access to personal finance data.",
      key,
      name: "User",
    },
  });
}

async function ensureTargetUser() {
  const role = await ensureRole("USER");
  const user = await prisma.user.upsert({
    where: { email: TARGET_EMAIL },
    update: {
      name: TARGET_NAME,
    },
    create: {
      email: TARGET_EMAIL,
      name: TARGET_NAME,
      preferences: {
        create: {
          currencyCode: DEFAULT_CURRENCY_CODE,
          locale: DEFAULT_LOCALE,
          numberFormat: DEFAULT_NUMBER_FORMAT,
          timezone: DEFAULT_TIMEZONE,
        },
      },
      roles: {
        create: {
          roleId: role.id,
        },
      },
      securitySettings: {
        create: {
          actionConfirmationEnabled: true,
          autoLogoutMinutes: 120,
          twoFactorEnabled: false,
        },
      },
      subscription: {
        create: {
          status: "ACTIVE",
          tier: "FREE",
        },
      },
    },
  });

  await prisma.userPreference.upsert({
    where: { userId: user.id },
    update: {
      currencyCode: DEFAULT_CURRENCY_CODE,
      locale: DEFAULT_LOCALE,
      numberFormat: DEFAULT_NUMBER_FORMAT,
      timezone: DEFAULT_TIMEZONE,
    },
    create: {
      currencyCode: DEFAULT_CURRENCY_CODE,
      locale: DEFAULT_LOCALE,
      numberFormat: DEFAULT_NUMBER_FORMAT,
      timezone: DEFAULT_TIMEZONE,
      userId: user.id,
    },
  });

  await prisma.userSecuritySettings.upsert({
    where: { userId: user.id },
    update: {
      actionConfirmationEnabled: true,
      autoLogoutMinutes: 120,
      twoFactorEnabled: false,
    },
    create: {
      actionConfirmationEnabled: true,
      autoLogoutMinutes: 120,
      twoFactorEnabled: false,
      userId: user.id,
    },
  });

  await prisma.userSubscription.upsert({
    where: { userId: user.id },
    update: {
      status: "ACTIVE",
      tier: "FREE",
    },
    create: {
      status: "ACTIVE",
      tier: "FREE",
      userId: user.id,
    },
  });

  const assignment = await prisma.userRoleAssignment.findUnique({
    where: {
      userId_roleId: {
        roleId: role.id,
        userId: user.id,
      },
    },
  });

  if (!assignment) {
    await prisma.userRoleAssignment.create({
      data: {
        roleId: role.id,
        userId: user.id,
      },
    });
  }

  return user;
}

async function ensureAccounts(userId: string, transactions: LegacyTx[]) {
  const distinctCardInfos = Array.from(
    new Set(transactions.map((item) => item.cardInfo?.trim()).filter((item): item is string => Boolean(item))),
  );

  const accounts = new Map<string, AccountRecord>();
  for (const cardInfo of distinctCardInfos) {
    const name = formatAccountName(cardInfo);
    const maskedPan = extractMaskedPan(cardInfo);
    const externalId = cardInfo;

    let account = await prisma.financialAccount.findFirst({
      where: {
        userId,
        provider: "MONOBANK",
        OR: [{ externalId }, ...(maskedPan ? [{ maskedPan }] : []), { name }],
      },
    });

    if (!account) {
      account = await prisma.financialAccount.create({
        data: {
          balance: 0,
          externalId,
          isActive: true,
          maskedPan,
          name,
          provider: "MONOBANK",
          type: "CARD",
          userId,
        },
      });
    }

    accounts.set(cardInfo, {
      externalId: account.externalId ?? null,
      id: account.id,
      maskedPan: account.maskedPan ?? null,
      name: account.name,
    });
  }

  return accounts;
}

async function ensureUncategorizedCategory(userId: string) {
  const name = "Без категорії";
  const existing = await prisma.category.findFirst({
    where: {
      userId,
      isActive: true,
      name,
    },
  });

  if (existing) return existing;

  return prisma.category.create({
    data: {
      color: "#94a3b8",
      dashboardGroup: "Користувацькі",
      icon: "expenses",
      isActive: true,
      name,
      slug: `legacy-uncategorized-${slugify(userId).slice(0, 10)}`,
      userId,
    },
  });
}

async function main() {
  const legacyUsersRaw = runLegacyQuery(
    "SELECT id, telegram_id, HEX(name), created_at, updated_at FROM users ORDER BY id ASC",
  );
  const legacyUsers = parseLegacyUsers(legacyUsersRaw);
  const legacyUser = legacyUsers.find((item) => item.id === LEGACY_USER_ID);

  if (!legacyUser) {
    throw new Error(`Legacy user ${LEGACY_USER_ID} was not found in ${LEGACY_DB}`);
  }

  const legacyTransactionsRaw = runLegacyQuery(
    [
      "SELECT",
      "id,",
      "type,",
      "amount,",
      "HEX(currency),",
      "HEX(description),",
      "DATE_FORMAT(operation_date, '%Y-%m-%d'),",
      "IFNULL(telegram_message_id, 'NULL'),",
      "HEX(raw_text),",
      "IFNULL(DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s'), 'NULL'),",
      "HEX(external_id),",
      "HEX(source),",
      "HEX(card_info)",
      "FROM transactions",
      `WHERE user_id = ${LEGACY_USER_ID}`,
      "ORDER BY operation_date ASC, id ASC",
    ].join(" "),
  );

  const legacyTransactions = parseLegacyTransactions(legacyTransactionsRaw).filter((item) => item.externalId);
  if (!legacyTransactions.length) {
    console.log("No legacy transactions found to import.");
    return;
  }

  const user = await ensureTargetUser();
  const accounts = await ensureAccounts(user.id, legacyTransactions);
  const fallbackCategory = await ensureUncategorizedCategory(user.id);

  const existingMonoIds = new Set(
    (
      await prisma.monoTransaction.findMany({
        select: { monoTransactionId: true },
        where: {
          monoTransactionId: {
            in: legacyTransactions.map((item) => item.externalId!).filter(Boolean),
          },
        },
      })
    ).map((item) => item.monoTransactionId),
  );

  let importedExpenses = 0;
  let importedIncomes = 0;
  let skipped = 0;

  for (const tx of legacyTransactions) {
    const monoId = tx.externalId!;
    if (existingMonoIds.has(monoId)) {
      skipped += 1;
      continue;
    }

    const account = tx.cardInfo ? accounts.get(tx.cardInfo) ?? null : null;
    const currencyCode = toCurrencyCode(tx.currency);
    const date = new Date(`${tx.operationDate}T12:00:00.000Z`);
    const minorAmount = Math.round(tx.amount * 100);
    const description =
      tx.description?.trim() ||
      tx.rawText?.trim() ||
      (tx.type === "income" ? "Legacy income" : "Legacy expense");

    const monoTransaction = await prisma.monoTransaction.create({
      data: {
        accountId: account?.maskedPan ?? account?.externalId ?? tx.cardInfo ?? "legacy-monobank",
        amount: tx.type === "expense" ? -Math.abs(minorAmount) : Math.abs(minorAmount),
        comment: tx.rawText,
        currencyCode,
        description,
        financialAccountId: account?.id ?? null,
        hold: false,
        monoTransactionId: monoId,
        rawJson: {
          cardInfo: tx.cardInfo,
          createdAt: tx.createdAt,
          legacyId: tx.id,
          rawText: tx.rawText,
          source: tx.source,
          telegramMessageId: tx.telegramMessageId,
        },
        timestamp: date,
        userId: user.id,
      },
    });

    if (tx.type === "expense") {
      await prisma.expense.create({
        data: {
          amount: tx.amount,
          categoryId: fallbackCategory.id,
          currencyCode,
          date,
          description,
          financialAccountId: account?.id ?? null,
          manualOverride: true,
          monoTransactionId: monoTransaction.id,
          paymentType: "CARD",
          sourceStatus: "MONO_ONLY",
          userId: user.id,
        },
      });
      importedExpenses += 1;
    } else {
      await prisma.income.create({
        data: {
          amount: tx.amount,
          currencyCode,
          date,
          description,
          financialAccountId: account?.id ?? null,
          manualOverride: true,
          monoTransactionId: monoTransaction.id,
          source: description,
          status: "RECEIVED",
          userId: user.id,
        },
      });
      importedIncomes += 1;
    }

    existingMonoIds.add(monoId);
  }

  const [expenses, incomes, accountsCount, monoTransactionsCount] = await prisma.$transaction([
    prisma.expense.count({ where: { userId: user.id } }),
    prisma.income.count({ where: { userId: user.id } }),
    prisma.financialAccount.count({ where: { userId: user.id } }),
    prisma.monoTransaction.count({ where: { userId: user.id } }),
  ]);

  console.log(
    JSON.stringify(
      {
        importedExpenses,
        importedIncomes,
        legacyUser,
        skipped,
        targetEmail: TARGET_EMAIL,
        totals: {
          accounts: accountsCount,
          expenses,
          incomes,
          monoTransactions: monoTransactionsCount,
        },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
