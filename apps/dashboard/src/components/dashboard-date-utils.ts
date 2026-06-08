export type DashboardDateRange = {
  from: Date;
  to: Date;
};

export function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

export function endOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(23, 59, 59, 999);
  return nextDate;
}

export function monthRangeFromDate(date: Date): DashboardDateRange {
  return {
    from: startOfDay(new Date(date.getFullYear(), date.getMonth(), 1)),
    to: endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
  };
}

export function normalizeDateRange(range: DashboardDateRange): DashboardDateRange {
  const from = startOfDay(range.from);
  const to = endOfDay(range.to);
  return from.getTime() <= to.getTime()
    ? { from, to }
    : {
        from: startOfDay(range.to),
        to: endOfDay(range.from),
      };
}

export function dateRangeKey(range: DashboardDateRange) {
  const normalized = normalizeDateRange(range);
  return `${normalized.from.toISOString()}_${normalized.to.toISOString()}`;
}

export function matchesDateRange(value: string | Date, range: DashboardDateRange) {
  const time = new Date(value).getTime();
  const normalized = normalizeDateRange(range);
  return time >= normalized.from.getTime() && time <= normalized.to.getTime();
}

export function daysInRange(range: DashboardDateRange) {
  const normalized = normalizeDateRange(range);
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.ceil((normalized.to.getTime() - normalized.from.getTime() + 1) / dayMs));
}

export function isDateInRange(date: Date, range: DashboardDateRange) {
  const normalized = normalizeDateRange(range);
  const time = startOfDay(date).getTime();
  return time >= normalized.from.getTime() && time <= normalized.to.getTime();
}

export function isSameCalendarDay(first: Date, second: Date) {
  return first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth() && first.getDate() === second.getDate();
}

export function formatMonthLabel(date: Date, lang: string) {
  const locale = lang === "en" ? "en-US" : "uk-UA";
  const value = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(date);
  return value.charAt(0).toLocaleUpperCase(locale) + value.slice(1);
}

export function formatDayLabel(date: Date, lang: string) {
  const locale = lang === "en" ? "en-US" : "uk-UA";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatTableDate(value: string | Date) {
  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${date.getFullYear()}`;
}

export function formatRangeLabel(range: DashboardDateRange, lang: string) {
  const normalized = normalizeDateRange(range);
  if (isSameCalendarDay(normalized.from, normalized.to)) return formatTableDate(normalized.from);
  return `${formatTableDate(normalized.from)} – ${formatTableDate(normalized.to)}`;
}
