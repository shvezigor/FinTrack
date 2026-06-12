import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Prisma } from "@prisma/client";
import {
  calculateActualIncomeTotal,
  calculateBudgetLimitTotal,
  calculateBudgetSavings,
  calculateBudgetUsage,
  calculateGoalProgress,
  calculatePlannedIncomeTotal,
  isActualIncomeStatus,
  isPlannedIncomeStatus,
  normalizeIncomeStatus,
} from "./portfolio-calculations.js";

describe("portfolio calculations", () => {
  test("separates actual income from forecast-only planned income", () => {
    const incomes = [
      { amount: new Prisma.Decimal(1200), status: "RECEIVED" },
      { amount: new Prisma.Decimal(300), status: "received" },
      { amount: new Prisma.Decimal(5000), status: "PLANNED" },
      { amount: new Prisma.Decimal(700), status: "PENDING" },
      { amount: new Prisma.Decimal(99), status: "FAILED" },
    ];

    assert.equal(calculateActualIncomeTotal(incomes), 1500);
    assert.equal(calculatePlannedIncomeTotal(incomes), 5000);
    assert.equal(isActualIncomeStatus("RECEIVED"), true);
    assert.equal(isActualIncomeStatus("PENDING"), false);
    assert.equal(isPlannedIncomeStatus("PLANNED"), true);
    assert.equal(isPlannedIncomeStatus("PENDING"), false);
    assert.equal(isPlannedIncomeStatus("FAILED"), false);
    assert.equal(normalizeIncomeStatus("unknown"), "RECEIVED");
  });

  test("calculates budget usage only for matching category", () => {
    const usage = calculateBudgetUsage(
      { categoryId: "food", limit: new Prisma.Decimal(1000) },
      [
        { amount: new Prisma.Decimal(250), categoryId: "food" },
        { amount: new Prisma.Decimal(149.5), categoryId: "food" },
        { amount: new Prisma.Decimal(900), categoryId: "transport" },
        { amount: new Prisma.Decimal(33), categoryId: null },
      ],
    );

    assert.deepEqual(usage, {
      limit: 1000,
      percent: 40,
      remaining: 600.5,
      spent: 399.5,
    });
  });

  test("calculates projected expenses from budget limits and budget savings", () => {
    const budgets = [
      { limit: new Prisma.Decimal(12000) },
      { limit: new Prisma.Decimal(3000) },
      { limit: 500 },
    ];

    assert.equal(calculateBudgetLimitTotal(budgets), 15500);
    assert.equal(calculateBudgetSavings(new Prisma.Decimal(15500), new Prisma.Decimal(6200)), 9300);
    assert.equal(calculateBudgetSavings(5000, 6200), -1200);
  });

  test("calculates goal progress with empty target protection", () => {
    assert.deepEqual(calculateGoalProgress({ savedAmount: new Prisma.Decimal(450), targetAmount: new Prisma.Decimal(1000) }), {
      percent: 45,
      saved: 450,
      target: 1000,
    });
    assert.deepEqual(calculateGoalProgress({ savedAmount: 50, targetAmount: 0 }), {
      percent: 0,
      saved: 50,
      target: 0,
    });
  });
});
