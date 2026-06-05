type NbuRate = {
  cc: string;
  exchangedate: string;
  rate: number;
  txt: string;
};

type ExchangeRate = {
  changePercent: number;
  code: string;
  date: string;
  fallback?: boolean;
  name: string;
  previousRate: number | null;
  rate: number;
  source: "NBU";
};

const NBU_EXCHANGE_URL = "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchangenew";
const CACHE_MS = 30 * 60 * 1000;
const cache = new Map<string, { expiresAt: number; value: ExchangeRate[] }>();
const fallbackRates: Record<string, Omit<ExchangeRate, "code">> = {
  EUR: {
    changePercent: 0,
    date: "fallback",
    fallback: true,
    name: "Євро",
    previousRate: null,
    rate: 51.5,
    source: "NBU",
  },
  USD: {
    changePercent: 0,
    date: "fallback",
    fallback: true,
    name: "Долар США",
    previousRate: null,
    rate: 43.9,
    source: "NBU",
  },
};

export async function getExchangeRates(codes = ["USD", "EUR"]): Promise<ExchangeRate[]> {
  const normalizedCodes = Array.from(new Set(codes.map((code) => code.toUpperCase())));
  const cacheKey = normalizedCodes.slice().sort().join(",");
  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  try {
    const todayRates = await fetchNbuRates();
    const previousRates = await fetchPreviousRates(todayRates[0]?.exchangedate);
    const result = normalizedCodes.map((code) => {
      const current = todayRates.find((rate) => rate.cc === code);
      if (!current) {
        throw new Error(`NBU exchange rate is missing for ${code}`);
      }

      const previous = previousRates.find((rate) => rate.cc === code);
      const previousRate = previous?.rate ?? null;
      const changePercent = previousRate ? ((current.rate - previousRate) / previousRate) * 100 : 0;

      return {
        changePercent,
        code,
        date: current.exchangedate,
        name: current.txt,
        previousRate,
        rate: current.rate,
        source: "NBU" as const,
      };
    });

    cache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_MS,
      value: result,
    });
    return result;
  } catch {
    if (cached?.value.length) {
      return cached.value;
    }

    return normalizedCodes.map((code) => ({
      code,
      ...(fallbackRates[code] ?? {
        changePercent: 0,
        date: "fallback",
        fallback: true,
        name: code,
        previousRate: null,
        rate: 0,
        source: "NBU" as const,
      }),
    }));
  }
}

async function fetchPreviousRates(currentExchangeDate?: string) {
  const today = parseNbuDate(currentExchangeDate) ?? new Date();

  for (let daysBack = 1; daysBack <= 7; daysBack += 1) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - daysBack);
    const rates = await fetchNbuRates(formatNbuDate(date)).catch(() => []);
    if (rates.length) {
      return rates;
    }
  }

  return [];
}

async function fetchNbuRates(date?: string): Promise<NbuRate[]> {
  const url = `${NBU_EXCHANGE_URL}?json${date ? `&date=${date}` : ""}`;
  const response = await fetchWithTimeout(url, 4_500);

  if (!response.ok) {
    throw new Error(`NBU exchange rates failed: ${response.status}`);
  }

  return (await response.json()) as NbuRate[];
}

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function formatNbuDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function parseNbuDate(value?: string) {
  const match = value?.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) {
    return null;
  }

  return new Date(Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1])));
}
