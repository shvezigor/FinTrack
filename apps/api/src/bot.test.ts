import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { telegramBotTestUtils } from "./bot.js";
import type { TelegramOperationDraft } from "@resource-manager/server";

const draft: TelegramOperationDraft = {
  amount: 250,
  categoryId: "food",
  categoryName: "Їжа",
  confidence: 0.9,
  currencyCode: 980,
  date: "2026-04-30T10:00:00.000Z",
  description: "Кава",
  needsCategory: false,
  sourceText: "Кава 250",
  suggestions: [
    { categoryId: "food", name: "Їжа" },
    { categoryId: "ai", name: "AI / підписки" },
  ],
  type: "EXPENSE",
};

function keyboardRows(keyboard: unknown): Array<Array<{ callback_data?: string; text: string }>> {
  return (keyboard as { inline_keyboard?: Array<Array<{ callback_data?: string; text: string }>> }).inline_keyboard ?? [];
}

describe("telegram bot API keyboard helpers", () => {
  test("maps text confirmations and cancellations to draft actions", () => {
    assert.equal(telegramBotTestUtils.draftTextAction("підтвердити"), "save");
    assert.equal(telegramBotTestUtils.draftTextAction("так"), "save");
    assert.equal(telegramBotTestUtils.draftTextAction("ок"), "save");
    assert.equal(telegramBotTestUtils.draftTextAction("скасувати"), "cancel");
    assert.equal(telegramBotTestUtils.draftTextAction("ні"), "cancel");
    assert.equal(telegramBotTestUtils.draftTextAction("щось інше"), null);
  });

  test("keeps confirm button on its own row before edit actions", () => {
    const rows = keyboardRows(telegramBotTestUtils.draftKeyboard(draft));
    const flat = rows.flat();
    const saveRowIndex = rows.findIndex((row) => row.some((button) => button.callback_data === "draft:save"));
    const editAmountRowIndex = rows.findIndex((row) => row.some((button) => button.callback_data === "draft:edit_amount"));
    const cancelRowIndex = rows.findIndex((row) => row.some((button) => button.callback_data === "draft:cancel"));

    assert.ok(saveRowIndex >= 0);
    assert.deepEqual(rows[saveRowIndex]?.map((button) => button.callback_data), ["draft:save"]);
    assert.ok(saveRowIndex < editAmountRowIndex);
    assert.ok(editAmountRowIndex < cancelRowIndex);
    assert.equal(flat.some((button) => button.text.includes("✅ Підтвердити")), true);
    assert.equal(flat.some((button) => button.callback_data === "draft:edit_amount"), true);
    assert.equal(flat.some((button) => button.callback_data === "draft:edit_category"), true);
    assert.equal(flat.some((button) => button.callback_data === "draft:edit_date"), true);
    assert.equal(rows.at(-1)?.[0]?.callback_data, "draft:cancel");
  });

  test("main menu exposes daily bot actions", () => {
    const rows = keyboardRows(telegramBotTestUtils.mainMenu(false));
    const labels = rows.flat().map((button) => button.text);

    assert.equal(labels.includes("Додати витрату"), true);
    assert.equal(labels.includes("Додати дохід"), true);
    assert.equal(labels.includes("Звіт по категоріях"), true);
    assert.equal(labels.includes("Останні операції"), true);
  });

  test("detects telegram image mime type from file path", () => {
    assert.equal(telegramBotTestUtils.telegramImageMimeType("photos/file_1.jpg"), "image/jpeg");
    assert.equal(telegramBotTestUtils.telegramImageMimeType("photos/file_2.png"), "image/png");
    assert.equal(telegramBotTestUtils.telegramImageMimeType("photos/file_3.webp"), "image/webp");
  });
});
