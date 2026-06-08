export const MONO_STATEMENT_MAX_SECONDS = 31 * 24 * 60 * 60 + 60 * 60;
export const MONO_STATEMENT_MAX_QUEUED_DAYS = 366;

export type MonobankStatementRangeInput = {
  accountId?: string | null;
  from: Date | number | string;
  source?: string;
  to: Date | number | string;
  userId?: string | null;
};

export type NormalizedStatementRange = {
  days: number;
  fromDate: Date;
  fromUnix: number;
  toDate: Date;
  toUnix: number;
};

export function normalizeMonobankStatementRange(input: MonobankStatementRangeInput): NormalizedStatementRange {
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

export function parseStatementDate(value: Date | number | string, fieldName: string) {
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

export function assertMonobankStatementWindow(range: NormalizedStatementRange) {
  if (range.toUnix - range.fromUnix > MONO_STATEMENT_MAX_SECONDS) {
    throw new Error("Monobank statement API allows up to 31 days plus 1 hour per request.");
  }
}

export function splitMonobankStatementRange(range: NormalizedStatementRange) {
  const chunks: Array<{ fromUnix: number; toUnix: number }> = [];
  let fromUnix = range.fromUnix;

  while (fromUnix <= range.toUnix) {
    const toUnix = Math.min(fromUnix + MONO_STATEMENT_MAX_SECONDS, range.toUnix);
    chunks.push({ fromUnix, toUnix });
    fromUnix = toUnix + 1;
  }

  return chunks;
}
