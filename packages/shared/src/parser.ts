import { CategoryLookup, findCategoryAtStart, normalizeText } from "./categories.js";

export type PaymentHint = "cash" | "card" | "unknown";

export type ParsedTelegramExpense =
  | {
      ok: true;
      amount: number;
      currencyCode: number;
      rawCategory: string | null;
      category: CategoryLookup | null;
      description: string | null;
      paymentHint: PaymentHint;
      normalizedText: string;
    }
  | {
      ok: false;
      reason: "missing_amount" | "empty" | "not_expense";
      normalizedText: string;
    };

const AMOUNT_PATTERN = /(?:^|\s)(\d+(?:[.,]\d{1,2})?)(?:\s*(?:грн|uah|₴))?(?=$|\s)/iu;

export function parseTelegramExpense(
  rawText: string,
  categories: CategoryLookup[],
): ParsedTelegramExpense {
  const withoutPrefix = rawText
    .replace(/^\s*витрати\s*[:\-–—]?\s*/iu, "")
    .replace(/^\s*expense[s]?\s*[:\-–—]?\s*/iu, "")
    .trim();

  if (!withoutPrefix) {
    return { ok: false, reason: "empty", normalizedText: "" };
  }

  if (/^[\s\-–—_]+$/.test(withoutPrefix)) {
    return { ok: false, reason: "not_expense", normalizedText: normalizeText(withoutPrefix) };
  }

  const payment = extractPaymentHint(withoutPrefix);
  const text = payment.text;
  const amountMatch = text.match(AMOUNT_PATTERN);

  if (!amountMatch || !amountMatch[1]) {
    return {
      ok: false,
      reason: "missing_amount",
      normalizedText: normalizeText(withoutPrefix),
    };
  }

  const amount = Number.parseFloat(amountMatch[1].replace(",", "."));
  const amountIndex = amountMatch.index ?? 0;
  const beforeAmount = text.slice(0, amountIndex).trim();
  const afterAmount = text.slice(amountIndex + amountMatch[0].length).trim();
  const categoryMatch = findCategoryAtStart(beforeAmount, categories);
  const rawCategory = categoryMatch?.matchedAlias ?? firstToken(beforeAmount);
  const descriptionParts = [
    categoryMatch ? categoryMatch.rest : beforeAmount.replace(rawCategory ?? "", "").trim(),
    afterAmount,
  ].filter(Boolean);

  return {
    ok: true,
    amount,
    currencyCode: 980,
    rawCategory,
    category: categoryMatch?.category ?? null,
    description: descriptionParts.length ? descriptionParts.join(" ") : null,
    paymentHint: payment.hint,
    normalizedText: normalizeText(withoutPrefix),
  };
}

function extractPaymentHint(text: string): { hint: PaymentHint; text: string } {
  const normalized = normalizeText(text);

  if (normalized.startsWith("кеш ")) {
    return { hint: "cash", text: text.replace(/^\s*кеш\s+/iu, "").trim() };
  }

  if (normalized.startsWith("cash ")) {
    return { hint: "cash", text: text.replace(/^\s*cash\s+/iu, "").trim() };
  }

  if (normalized.startsWith("карта ") || normalized.startsWith("картка ")) {
    return { hint: "card", text: text.replace(/^\s*(карта|картка)\s+/iu, "").trim() };
  }

  if (normalized.startsWith("card ")) {
    return { hint: "card", text: text.replace(/^\s*card\s+/iu, "").trim() };
  }

  return { hint: "unknown", text };
}

function firstToken(value: string): string | null {
  const [token] = value.trim().split(/\s+/);
  return token || null;
}
