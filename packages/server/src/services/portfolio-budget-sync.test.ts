import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import { Prisma } from "@prisma/client";
import { syncBudgetsFromPreviousMonth } from "./portfolio.js";

const globalForPrisma = globalThis as unknown as { prisma?: unknown };

describe("budget month sync", () => {
  afterEach(() => {
    delete globalForPrisma.prisma;
  });

  test("copies names and limits from previous month without duplicating existing current budgets", async () => {
    const createdRows: unknown[] = [];
    const previousMonth = new Date(Date.UTC(2026, 5, 1));
    const currentMonth = new Date(Date.UTC(2026, 6, 1));

    globalForPrisma.prisma = {
      budget: {
        create: async ({ data, include }: { data: unknown; include: unknown }) => {
          const row = {
            ...(data as Record<string, unknown>),
            category: null,
            id: `created-${createdRows.length + 1}`,
          };
          createdRows.push({ data, include });
          return row;
        },
        findMany: async ({ where }: { where: { month: { gte: Date; lt: Date } } }) => {
          const month = where.month.gte.toISOString();
          if (month === previousMonth.toISOString()) {
            return [
              {
                category: { color: "#22c55e", icon: "cart", name: "Продукти" },
                categoryId: "category-food",
                color: "#22c55e",
                id: "previous-food",
                limit: new Prisma.Decimal(12000),
                month: previousMonth,
                name: "Продукти",
              },
              {
                category: null,
                categoryId: null,
                color: "#3b82f6",
                id: "previous-rent",
                limit: new Prisma.Decimal(9000),
                month: previousMonth,
                name: "Оренда",
              },
            ];
          }
          if (month === currentMonth.toISOString()) {
            return [
              {
                category: null,
                categoryId: null,
                color: "#3b82f6",
                id: "current-rent",
                limit: new Prisma.Decimal(8500),
                month: currentMonth,
                name: "Оренда",
              },
            ];
          }
          return [];
        },
      },
    };

    const result = await syncBudgetsFromPreviousMonth({
      month: "2026-07-15T10:00:00.000Z",
      userId: "user-1",
    });

    assert.equal(result.createdCount, 1);
    assert.equal(result.skippedCount, 1);
    assert.equal(result.budgets[0]?.name, "Продукти");
    assert.equal(result.budgets[0]?.limit, 12000);
    assert.equal(result.budgets[0]?.month, currentMonth.toISOString());
    assert.deepEqual(createdRows, [
      {
        data: {
          categoryId: "category-food",
          color: "#22c55e",
          limit: new Prisma.Decimal(12000),
          month: currentMonth,
          name: "Продукти",
          userId: "user-1",
        },
        include: { category: true },
      },
    ]);
  });
});
