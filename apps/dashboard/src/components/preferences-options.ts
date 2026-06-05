import { supportedLanguages } from "./i18n";

type SelectOption = {
  label: string;
  value: string;
};

type CurrencyDefinition = {
  alpha: string;
  name: string;
  numeric: number;
};

const ISO_CURRENCIES: CurrencyDefinition[] = [
  { alpha: "UAH", name: "Ukrainian hryvnia", numeric: 980 },
  { alpha: "USD", name: "US dollar", numeric: 840 },
  { alpha: "EUR", name: "Euro", numeric: 978 },
  { alpha: "GBP", name: "Pound sterling", numeric: 826 },
  { alpha: "PLN", name: "Polish zloty", numeric: 985 },
  { alpha: "CHF", name: "Swiss franc", numeric: 756 },
  { alpha: "CZK", name: "Czech koruna", numeric: 203 },
  { alpha: "HUF", name: "Hungarian forint", numeric: 348 },
  { alpha: "RON", name: "Romanian leu", numeric: 946 },
  { alpha: "BGN", name: "Bulgarian lev", numeric: 975 },
  { alpha: "SEK", name: "Swedish krona", numeric: 752 },
  { alpha: "NOK", name: "Norwegian krone", numeric: 578 },
  { alpha: "DKK", name: "Danish krone", numeric: 208 },
  { alpha: "TRY", name: "Turkish lira", numeric: 949 },
  { alpha: "GEL", name: "Georgian lari", numeric: 981 },
  { alpha: "AMD", name: "Armenian dram", numeric: 51 },
  { alpha: "AZN", name: "Azerbaijan manat", numeric: 944 },
  { alpha: "MDL", name: "Moldovan leu", numeric: 498 },
  { alpha: "RSD", name: "Serbian dinar", numeric: 941 },
  { alpha: "AED", name: "UAE dirham", numeric: 784 },
  { alpha: "SAR", name: "Saudi riyal", numeric: 682 },
  { alpha: "QAR", name: "Qatari riyal", numeric: 634 },
  { alpha: "KWD", name: "Kuwaiti dinar", numeric: 414 },
  { alpha: "BHD", name: "Bahraini dinar", numeric: 48 },
  { alpha: "ILS", name: "Israeli new shekel", numeric: 376 },
  { alpha: "EGP", name: "Egyptian pound", numeric: 818 },
  { alpha: "ZAR", name: "South African rand", numeric: 710 },
  { alpha: "CAD", name: "Canadian dollar", numeric: 124 },
  { alpha: "AUD", name: "Australian dollar", numeric: 36 },
  { alpha: "NZD", name: "New Zealand dollar", numeric: 554 },
  { alpha: "MXN", name: "Mexican peso", numeric: 484 },
  { alpha: "BRL", name: "Brazilian real", numeric: 986 },
  { alpha: "ARS", name: "Argentine peso", numeric: 32 },
  { alpha: "CLP", name: "Chilean peso", numeric: 152 },
  { alpha: "COP", name: "Colombian peso", numeric: 170 },
  { alpha: "PEN", name: "Peruvian sol", numeric: 604 },
  { alpha: "UYU", name: "Uruguayan peso", numeric: 858 },
  { alpha: "JPY", name: "Japanese yen", numeric: 392 },
  { alpha: "CNY", name: "Yuan renminbi", numeric: 156 },
  { alpha: "HKD", name: "Hong Kong dollar", numeric: 344 },
  { alpha: "SGD", name: "Singapore dollar", numeric: 702 },
  { alpha: "KRW", name: "South Korean won", numeric: 410 },
  { alpha: "INR", name: "Indian rupee", numeric: 356 },
  { alpha: "THB", name: "Thai baht", numeric: 764 },
  { alpha: "MYR", name: "Malaysian ringgit", numeric: 458 },
  { alpha: "IDR", name: "Indonesian rupiah", numeric: 360 },
  { alpha: "PHP", name: "Philippine peso", numeric: 608 },
  { alpha: "VND", name: "Vietnamese dong", numeric: 704 },
  { alpha: "KZT", name: "Kazakhstani tenge", numeric: 398 },
];

const fallbackTimeZones = [
  "UTC",
  "Europe/Kyiv",
  "Europe/Warsaw",
  "Europe/Berlin",
  "Europe/London",
  "Europe/Paris",
  "Europe/Prague",
  "Europe/Rome",
  "Europe/Vilnius",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Jerusalem",
  "Asia/Almaty",
  "Asia/Tbilisi",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
];

type IntlWithSupportedValues = typeof Intl & {
  supportedValuesOf?: (key: "timeZone") => string[];
};

const localeOptions: SelectOption[] = supportedLanguages.map((language) => ({
  label: language.label,
  value: language.code,
}));

const numberFormatOptions: SelectOption[] = [
  { label: "41 234,56", value: "SPACE_COMMA" },
  { label: "41,234.56", value: "COMMA_DOT" },
  { label: "41.234,56", value: "DOT_COMMA" },
];

export function getCurrencyOptions(selectedCode?: number | null): SelectOption[] {
  const options = ISO_CURRENCIES.map((currency) => ({
    label: `${currency.alpha} - ${currency.name} (${String(currency.numeric).padStart(3, "0")})`,
    value: String(currency.numeric),
  }));
  return ensureSelectOption(options, selectedCode ? String(selectedCode) : null, (value) => `${value} - Custom currency`);
}

export function getLocaleOptions() {
  return localeOptions;
}

export function getNumberFormatOptions() {
  return numberFormatOptions;
}

export function getTimeZoneOptions(selectedTimeZone?: string | null): SelectOption[] {
  const intlWithSupportedValues = Intl as IntlWithSupportedValues;
  const zones = typeof intlWithSupportedValues.supportedValuesOf === "function"
    ? intlWithSupportedValues.supportedValuesOf("timeZone")
    : fallbackTimeZones;
  const options = Array.from(new Set(["UTC", "Europe/Kyiv", ...zones]))
    .sort((left, right) => left.localeCompare(right))
    .map((zone) => ({ label: zone, value: zone }));
  return ensureSelectOption(options, selectedTimeZone ?? null, (value) => value);
}

function ensureSelectOption(
  options: SelectOption[],
  selectedValue: string | null,
  makeLabel: (value: string) => string,
) {
  if (!selectedValue || options.some((option) => option.value === selectedValue)) {
    return options;
  }
  return [{ label: makeLabel(selectedValue), value: selectedValue }, ...options];
}
