export type SeedCategory = {
  slug: string;
  name: string;
  dashboardGroup: string;
  color: string;
  icon: string;
  aliases: string[];
};

export type CategoryTemplate = {
  slug: string;
  name: string;
  group: string;
  color: string;
  icon: string;
};

/** Curated templates based on Monobank, YNAB, Revolut, Toshl, Wallet by BudgetBakers best practices */
export const CATEGORY_TEMPLATES: CategoryTemplate[] = [
  // Їжа та напої
  { color: "#2f9e44", group: "Їжа та напої",    icon: "cart",          name: "Продукти",             slug: "tpl_groceries" },
  { color: "#f59e0b", group: "Їжа та напої",    icon: "smile",         name: "Ресторани та кафе",    slug: "tpl_restaurants" },
  { color: "#f97316", group: "Їжа та напої",    icon: "receipt",       name: "Доставка їжі",        slug: "tpl_food_delivery" },
  // Транспорт
  { color: "#06b6d4", group: "Транспорт",        icon: "car",           name: "Таксі / Uber",         slug: "tpl_taxi" },
  { color: "#64748b", group: "Транспорт",        icon: "fuel",          name: "Пальне",               slug: "tpl_fuel" },
  { color: "#3b82f6", group: "Транспорт",        icon: "transactions",  name: "Громадський транспорт",slug: "tpl_public_transport" },
  // Житло
  { color: "#1971c2", group: "Житло",            icon: "home",          name: "Оренда",               slug: "tpl_rent" },
  { color: "#0284c7", group: "Житло",            icon: "home",          name: "Комунальні послуги",   slug: "tpl_utilities" },
  { color: "#84cc16", group: "Житло",            icon: "phone",         name: "Інтернет / зв'язок",   slug: "tpl_internet" },
  { color: "#8b5cf6", group: "Житло",            icon: "expenses",      name: "Ремонт / облаштування",slug: "tpl_repairs" },
  // Здоров'я
  { color: "#ef4444", group: "Здоров'я",         icon: "medical",       name: "Аптека / ліки",        slug: "tpl_pharmacy" },
  { color: "#0284c7", group: "Здоров'я",         icon: "shield",        name: "Лікар / клініка",      slug: "tpl_doctor" },
  { color: "#22c55e", group: "Здоров'я",         icon: "goals",         name: "Спорт / фітнес",       slug: "tpl_fitness" },
  // Краса та одяг
  { color: "#14b8a6", group: "Краса та одяг",    icon: "shirt",         name: "Одяг",                 slug: "tpl_clothing" },
  { color: "#ec4899", group: "Краса та одяг",    icon: "heart",         name: "Краса / перукарня",    slug: "tpl_beauty" },
  // Розваги
  { color: "#a855f7", group: "Розваги",          icon: "smile",         name: "Кіно / театр",         slug: "tpl_cinema" },
  { color: "#f59e0b", group: "Розваги",          icon: "subscriptions", name: "Стримінг (Netflix…)",  slug: "tpl_streaming" },
  { color: "#6366f1", group: "Розваги",          icon: "spark",         name: "Ігри",                 slug: "tpl_games" },
  { color: "#7c3aed", group: "Розваги",          icon: "book",          name: "Книги",                slug: "tpl_books" },
  // Освіта
  { color: "#2563eb", group: "Освіта",           icon: "book",          name: "Курси / навчання",     slug: "tpl_courses" },
  { color: "#64748b", group: "Освіта",           icon: "receipt",       name: "Канцтовари",           slug: "tpl_stationery" },
  // Технології
  { color: "#0ea5e9", group: "Технології",       icon: "openai",        name: "AI-інструменти",       slug: "tpl_ai_tools" },
  { color: "#f59e0b", group: "Технології",       icon: "subscriptions", name: "Підписки (SaaS)",      slug: "tpl_saas" },
  { color: "#ca8a04", group: "Технології",       icon: "lightbulb",     name: "Гаджети / техніка",    slug: "tpl_gadgets" },
  // Подорожі
  { color: "#2563eb", group: "Подорожі",         icon: "plane",         name: "Авіа / залізниця",     slug: "tpl_flights" },
  { color: "#3b82f6", group: "Подорожі",         icon: "home",          name: "Готелі / проживання",  slug: "tpl_accommodation" },
  // Фінанси
  { color: "#1d4ed8", group: "Фінанси",          icon: "bank",          name: "Банківські послуги",   slug: "tpl_banking" },
  { color: "#16a34a", group: "Фінанси",          icon: "chart",         name: "Інвестиції",           slug: "tpl_investments" },
  { color: "#0284c7", group: "Фінанси",          icon: "shield",        name: "Страхування",          slug: "tpl_insurance" },
  // Сім'я та домашні
  { color: "#ec4899", group: "Сім'я",            icon: "heart",         name: "Діти",                 slug: "tpl_kids" },
  { color: "#a855f7", group: "Сім'я",            icon: "pet",           name: "Домашні тварини",      slug: "tpl_pets" },
  // Робота
  { color: "#7c3aed", group: "Робота",           icon: "briefcase",     name: "Офіс / коворкінг",    slug: "tpl_office" },
  // Благодійність та особисте
  { color: "#d6336c", group: "Благодійність",    icon: "heart",         name: "Донати / збори",       slug: "tpl_donations" },
  { color: "#f97316", group: "Особисте",         icon: "gift",          name: "Подарунки / свята",    slug: "tpl_gifts" },
  { color: "#64748b", group: "Особисте",         icon: "expenses",      name: "Інше",                 slug: "tpl_other" },
];

export type CategoryLookup = {
  id: string;
  slug: string;
  name: string;
  dashboardGroup: string;
  icon?: string;
  aliases: string[];
};

export const DEFAULT_CATEGORIES: SeedCategory[] = [
  {
    aliases: ["Хав", "Хава", "Їжа", "Їда", "Food", "Продукти", "Кафе", "Ресторан"],
    color: "#2f9e44",
    dashboardGroup: "Побутові витрати",
    icon: "cart",
    name: "Їжа",
    slug: "food",
  },
  {
    aliases: ["Комун", "Комуналка", "Комунальні"],
    color: "#1971c2",
    dashboardGroup: "Обов'язкові",
    icon: "home",
    name: "Комунальні",
    slug: "utilities",
  },
  {
    aliases: ["Дім", "Дім/побут", "Дом", "Житло"],
    color: "#5c940d",
    dashboardGroup: "Побутові витрати",
    icon: "home",
    name: "Дім",
    slug: "home",
  },
  {
    aliases: ["Авто", "Машина", "Бенз", "Паливо", "ОККО", "WOG"],
    color: "#e67700",
    dashboardGroup: "Транспорт",
    icon: "car",
    name: "Авто",
    slug: "car",
  },
  {
    aliases: ["Лік", "Ліки", "Аптека", "Здоров'я"],
    color: "#c92a2a",
    dashboardGroup: "Здоров'я",
    icon: "medical",
    name: "Ліки / здоров'я",
    slug: "health",
  },
  {
    aliases: ["Гігієна", "Гігієна/догляд"],
    color: "#0ca678",
    dashboardGroup: "Догляд",
    icon: "receipt",
    name: "Гігієна",
    slug: "hygiene",
  },
  {
    aliases: ["Стрижка", "Барбер", "Перукар"],
    color: "#7048e8",
    dashboardGroup: "Догляд",
    icon: "shirt",
    name: "Стрижка",
    slug: "haircut",
  },
  {
    aliases: ["Донат", "Донати", "Збір"],
    color: "#d6336c",
    dashboardGroup: "Донати",
    icon: "heart",
    name: "Донати",
    slug: "donations",
  },
  {
    aliases: ["Аі", "AI", "Ai", "ШІ", "OpenAI", "Софт", "SaaS"],
    color: "#1098ad",
    dashboardGroup: "Робота / софт",
    icon: "openai",
    name: "AI / підписки",
    slug: "ai_subscriptions",
  },
  {
    aliases: ["Свято", "Саято", "Подарунок", "Подарунки"],
    color: "#f08c00",
    dashboardGroup: "Події",
    icon: "gift",
    name: "Свято / подарунки",
    slug: "holiday",
  },
  {
    aliases: ["Інше", "Інш", "Other"],
    color: "#495057",
    dashboardGroup: "Інше",
    icon: "expenses",
    name: "Інше",
    slug: "other",
  },
];

export function normalizeText(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("uk-UA")
    .replace(/[ʼ'`]/g, "")
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeAlias(value: string): string {
  return normalizeText(value);
}

export function findCategoryByAlias(
  rawCategory: string,
  categories: CategoryLookup[],
): CategoryLookup | null {
  const normalized = normalizeText(rawCategory);
  if (!normalized) {
    return null;
  }

  for (const category of categories) {
    if (normalizeText(category.name) === normalized || normalizeText(category.slug) === normalized) {
      return category;
    }

    if (category.aliases.some((alias) => normalizeText(alias) === normalized)) {
      return category;
    }
  }

  return null;
}

export function findCategoryAtStart(
  value: string,
  categories: CategoryLookup[],
): { category: CategoryLookup; matchedAlias: string; rest: string } | null {
  const trimmed = value.trim();
  const candidates = categories
    .flatMap((category) => [
      { category, alias: category.name },
      { category, alias: category.slug },
      ...category.aliases.map((alias) => ({ category, alias })),
    ])
    .sort((a, b) => b.alias.length - a.alias.length);

  for (const candidate of candidates) {
    const alias = candidate.alias.trim();
    if (!alias) {
      continue;
    }

    const pattern = new RegExp(`^${escapeRegExp(alias)}(?=$|\\s)`, "iu");
    const match = trimmed.match(pattern);
    if (match) {
      return {
        category: candidate.category,
        matchedAlias: match[0],
        rest: trimmed.slice(match[0].length).trim(),
      };
    }
  }

  return null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
