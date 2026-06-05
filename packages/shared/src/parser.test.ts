import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_CATEGORIES, type CategoryLookup } from "./categories.js";
import { parseTelegramExpense } from "./parser.js";

const categories: CategoryLookup[] = DEFAULT_CATEGORIES.map((category) => ({
  aliases: category.aliases,
  dashboardGroup: category.dashboardGroup,
  id: category.slug,
  name: category.name,
  slug: category.slug,
}));

describe("parseTelegramExpense", () => {
  it("parses existing expense prefix", () => {
    const parsed = parseTelegramExpense("Витрати: Комун 458", categories);
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal(parsed.amount, 458);
      assert.equal(parsed.category?.slug, "utilities");
    }
  });

  it("parses short food entry", () => {
    const parsed = parseTelegramExpense("Хав 140", categories);
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal(parsed.amount, 140);
      assert.equal(parsed.category?.slug, "food");
      assert.equal(parsed.paymentHint, "unknown");
    }
  });

  it("keeps cash hint", () => {
    const parsed = parseTelegramExpense("кеш Хав 140", categories);
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal(parsed.paymentHint, "cash");
    }
  });

  it("maps typo alias to holiday", () => {
    const parsed = parseTelegramExpense("Саято 200", categories);
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal(parsed.category?.slug, "holiday");
    }
  });

  it("keeps description after amount", () => {
    const parsed = parseTelegramExpense("картка Дім 2730 епіцентр", categories);
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal(parsed.paymentHint, "card");
      assert.equal(parsed.description, "епіцентр");
    }
  });
});
