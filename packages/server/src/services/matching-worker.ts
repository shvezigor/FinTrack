import { Prisma } from "@prisma/client";
import { scoreExpenseMatch } from "@resource-manager/shared";
import { getDb } from "../db.js";

type MatchExpensesInput =
  | string
  | {
      monoTransactionId?: string | null;
      telegramEntryId?: string | null;
      userId?: string | null;
    };

export async function matchExpenses(input?: MatchExpensesInput) {
  const db = getDb();
  const filters =
    typeof input === "string"
      ? { userId: input }
      : {
          monoTransactionId: input?.monoTransactionId ?? undefined,
          telegramEntryId: input?.telegramEntryId ?? undefined,
          userId: input?.userId ?? undefined,
        };
  const telegramExpenses = await db.expense.findMany({
    include: { category: true, telegramEntry: true },
    where: {
      manualOverride: false,
      monoTransactionId: null,
      telegramEntryId: { not: null },
      sourceStatus: { in: ["TELEGRAM_ONLY", "NEEDS_REVIEW"] },
      ...(filters.telegramEntryId ? { telegramEntryId: filters.telegramEntryId } : {}),
      ...(filters.userId ? { userId: filters.userId } : {}),
    },
  });

  let matched = 0;
  for (const telegramExpense of telegramExpenses) {
    const windowStart = new Date(telegramExpense.date.getTime() - 2 * 86_400_000);
    const windowEnd = new Date(telegramExpense.date.getTime() + 2 * 86_400_000);
    const monoExpenses = await db.expense.findMany({
      include: { category: true, monoTransaction: true },
      where: {
        date: { gte: windowStart, lte: windowEnd },
        manualOverride: false,
        monoTransactionId: { not: null },
        sourceStatus: "MONO_ONLY",
        telegramEntryId: null,
        ...(filters.monoTransactionId ? { monoTransactionId: filters.monoTransactionId } : {}),
        ...(filters.userId ? { userId: filters.userId } : {}),
      },
    });

    const candidates = monoExpenses
      .map((monoExpense) => ({
        monoExpense,
        score: scoreExpenseMatch(
          {
            amount: Number(telegramExpense.amount),
            categorySlug: telegramExpense.category?.slug,
            description: telegramExpense.description,
            timestamp: telegramExpense.date,
          },
          {
            amount: Number(monoExpense.amount),
            categorySlug: monoExpense.category?.slug,
            description: monoExpense.description,
            timestamp: monoExpense.date,
          },
        ),
      }))
      .filter((candidate) => candidate.score.score >= 60)
      .sort((a, b) => b.score.score - a.score.score);

    if (!candidates.length) {
      continue;
    }

    const [best, second] = candidates;
    if (!best) {
      continue;
    }

    await db.matchingCandidate.upsert({
      where: {
        telegramEntryId_monoTransactionId: {
          monoTransactionId: best.monoExpense.monoTransactionId!,
          telegramEntryId: telegramExpense.telegramEntryId!,
        },
      },
      update: {
        reason: best.score.reason,
        score: new Prisma.Decimal(best.score.score),
      },
      create: {
        monoTransactionId: best.monoExpense.monoTransactionId!,
        reason: best.score.reason,
        score: new Prisma.Decimal(best.score.score),
        telegramEntryId: telegramExpense.telegramEntryId!,
      },
    });

    const isAutoMatch = best.score.score >= 90 && (!second || best.score.score - second.score.score >= 15);
    if (isAutoMatch) {
      await db.expense.delete({ where: { id: best.monoExpense.id } });
      await db.expense.update({
        data: {
          categoryId: telegramExpense.categoryId,
          confidence: new Prisma.Decimal(best.score.score),
          description: telegramExpense.description ?? best.monoExpense.description,
          monoTransactionId: best.monoExpense.monoTransactionId,
          paymentType: "CARD",
          sourceStatus: "MATCHED",
        },
        where: { id: telegramExpense.id },
      });
      await db.telegramEntry.update({
        data: { status: "MATCHED" },
        where: { id: telegramExpense.telegramEntryId! },
      });
      await db.matchingCandidate.update({
        data: { status: "AUTO_ACCEPTED" },
        where: {
          telegramEntryId_monoTransactionId: {
            monoTransactionId: best.monoExpense.monoTransactionId!,
            telegramEntryId: telegramExpense.telegramEntryId!,
          },
        },
      });
      matched += 1;
    } else {
      await db.expense.update({
        data: { sourceStatus: "NEEDS_REVIEW" },
        where: { id: telegramExpense.id },
      });
    }
  }

  return matched;
}
