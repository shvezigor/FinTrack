import type { ReactNode } from "react";

export type IconName =
  | "analytics"
  | "arrowDown"
  | "arrowUp"
  | "bank"
  | "bell"
  | "briefcase"
  | "calendar"
  | "car"
  | "chart"
  | "check"
  | "chevronDown"
  | "chevronRight"
  | "close"
  | "dashboard"
  | "download"
  | "edit"
  | "expenses"
  | "filter"
  | "fuel"
  | "gift"
  | "goals"
  | "google"
  | "help"
  | "heart"
  | "home"
  | "import"
  | "income"
  | "book"
  | "more"
  | "menu"
  | "medical"
  | "openai"
  | "pet"
  | "piggy"
  | "plane"
  | "plus"
  | "refresh"
  | "receipt"
  | "search"
  | "settings"
  | "shield"
  | "shirt"
  | "smile"
  | "spark"
  | "subscriptions"
  | "telegram"
  | "trash"
  | "transactions"
  | "upload"
  | "user"
  | "wallet"
  | "warning"
  | "cart"
  | "creditCard"
  | "lightbulb"
  | "phone";

export function Icon({ name }: { name: IconName }) {
  const common = {
    fill: "none",
    height: 18,
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
    width: 18,
  };

  const paths: Record<IconName, ReactNode> = {
    analytics: (
      <>
        <path d="M4 19V9" />
        <path d="M10 19V5" />
        <path d="M16 19v-7" />
        <path d="M22 19H2" />
      </>
    ),
    arrowDown: (
      <>
        <path d="M12 5v14" />
        <path d="m19 12-7 7-7-7" />
      </>
    ),
    arrowUp: (
      <>
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </>
    ),
    bank: (
      <>
        <path d="m3 10 9-6 9 6" />
        <path d="M5 10v8" />
        <path d="M9 10v8" />
        <path d="M15 10v8" />
        <path d="M19 10v8" />
        <path d="M4 18h16" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </>
    ),
    briefcase: (
      <>
        <path d="M10 6V5a2 2 0 0 1 4 0v1" />
        <rect height="14" rx="2" width="18" x="3" y="6" />
        <path d="M3 12h18" />
      </>
    ),
    calendar: (
      <>
        <rect height="18" rx="2" width="18" x="3" y="4" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
      </>
    ),
    car: (
      <>
        <path d="m5 11 1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" />
        <path d="M3 11h18v7h-2a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H3z" />
      </>
    ),
    chart: (
      <>
        <path d="M3 3v18h18" />
        <path d="m7 15 4-4 3 3 5-7" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    chevronDown: <path d="m6 9 6 6 6-6" />,
    chevronRight: <path d="m9 6 6 6-6 6" />,
    close: (
      <>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </>
    ),
    book: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" />
        <path d="M8 6h8" />
      </>
    ),
    cart: (
      <>
        <path d="M4 5h2l2.5 10h8.8l2-7H8" />
        <circle cx="10" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
      </>
    ),
    creditCard: (
      <>
        <rect height="16" rx="2" width="22" x="1" y="4" />
        <line x1="1" x2="23" y1="10" y2="10" />
      </>
    ),
    dashboard: (
      <>
        <rect height="7" rx="1.5" width="7" x="3" y="3" />
        <rect height="7" rx="1.5" width="7" x="14" y="3" />
        <rect height="7" rx="1.5" width="7" x="3" y="14" />
        <rect height="7" rx="1.5" width="7" x="14" y="14" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </>
    ),
    expenses: (
      <>
        <path d="M6 3h12l2 7H4z" />
        <path d="M5 10v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9" />
        <path d="M9 15h6" />
      </>
    ),
    filter: (
      <>
        <path d="M4 6h16" />
        <path d="M7 12h10" />
        <path d="M10 18h4" />
      </>
    ),
    fuel: (
      <>
        <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
        <path d="M4 12h12" />
        <path d="M16 7h2l2 2v8a2 2 0 0 0 2 2" />
        <path d="M8 7h4" />
      </>
    ),
    gift: (
      <>
        <path d="m12 3 1.9 4.1 4.6.5-3.4 3.2.9 4.7-4-2.3-4 2.3.9-4.7-3.4-3.2 4.6-.5z" />
        <path d="M19 17.5h.01" />
        <path d="M6 18.5h.01" />
      </>
    ),
    goals: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <path d="m15 9 4-4" />
        <path d="M19 5h-4V1" />
      </>
    ),
    google: (
      <>
        <path d="M21.5 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.3a4.5 4.5 0 0 1-2 3" />
        <path d="M12 22a9.8 9.8 0 0 0 6.8-2.5l-3.5-2.7a6.1 6.1 0 0 1-9-3.2" />
        <path d="M6.3 13.6a6 6 0 0 1 0-3.2L2.7 7.6a10 10 0 0 0 0 8.8z" />
        <path d="M12 5.9c1.6 0 3 .6 4.2 1.6l3.1-3.1A10 10 0 0 0 2.7 7.6" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9a2.7 2.7 0 1 1 4.5 2c-.9.6-2 1.2-2 2.5" />
        <path d="M12 17h.01" />
      </>
    ),
    heart: (
      <>
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
      </>
    ),
    import: (
      <>
        <path d="M12 3v12" />
        <path d="m17 8-5-5-5 5" />
        <path d="M5 21h14" />
      </>
    ),
    income: (
      <>
        <path d="M4 19V5" />
        <path d="M4 5h13a3 3 0 0 1 0 6H4" />
        <path d="M4 11h14a3 3 0 0 1 0 6H4" />
      </>
    ),
    more: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </>
    ),
    medical: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
        <rect height="18" rx="3" width="18" x="3" y="3" />
      </>
    ),
    openai: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3a5 5 0 0 1 4 8" />
        <path d="M21 12a5 5 0 0 1-8 4" />
        <path d="M12 21a5 5 0 0 1-4-8" />
        <path d="M3 12a5 5 0 0 1 8-4" />
      </>
    ),
    piggy: (
      <>
        <path d="M19 9h2v5h-2" />
        <path d="M4 11a7 7 0 0 1 7-6h3a5 5 0 0 1 5 5v4a5 5 0 0 1-5 5H8l-2 2v-3a6 6 0 0 1-2-4z" />
        <path d="M10 9h.01" />
      </>
    ),
    pet: (
      <>
        <circle cx="6" cy="9" r="2" />
        <circle cx="18" cy="9" r="2" />
        <circle cx="10" cy="6" r="2" />
        <circle cx="14" cy="6" r="2" />
        <path d="M8 16a4 4 0 0 1 8 0c0 2-1.8 3-4 3s-4-1-4-3" />
      </>
    ),
    phone: (
      <>
        <rect height="20" rx="2" width="12" x="6" y="2" />
        <path d="M11 18h2" />
      </>
    ),
    plane: (
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 11a8 8 0 0 0-14.5-4" />
        <path d="M4 5v5h5" />
        <path d="M4 13a8 8 0 0 0 14.5 4" />
        <path d="M20 19v-5h-5" />
      </>
    ),
    receipt: (
      <>
        <path d="M6 2h12v20l-3-2-3 2-3-2-3 2z" />
        <path d="M9 7h6" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1-2 3-.2-.1a1.7 1.7 0 0 0-1.9-.1 8 8 0 0 1-1.6.7 1.7 1.7 0 0 0-1.1 1.5V22H9v-.2a1.7 1.7 0 0 0-1.1-1.5 8 8 0 0 1-1.6-.7 1.7 1.7 0 0 0-1.9.1l-.2.1-2-3 .1-.1A1.7 1.7 0 0 0 2.6 15a8 8 0 0 1 0-2 1.7 1.7 0 0 0-.3-1.8l-.1-.1 2-3 .2.1a1.7 1.7 0 0 0 1.9.1 8 8 0 0 1 1.6-.7A1.7 1.7 0 0 0 9 6.2V6h6v.2a1.7 1.7 0 0 0 1.1 1.5 8 8 0 0 1 1.6.7 1.7 1.7 0 0 0 1.9-.1l.2-.1 2 3-.1.1a1.7 1.7 0 0 0-.3 1.8 8 8 0 0 1 0 2Z" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <path d="m9 12 2 2 4-5" />
      </>
    ),
    shirt: (
      <>
        <path d="M8 4 5 6 3 10l4 2v8h10v-8l4-2-2-4-3-2" />
        <path d="M8 4a4 4 0 0 0 8 0" />
      </>
    ),
    smile: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 10h.01" />
        <path d="M16 10h.01" />
        <path d="M8.5 15a5 5 0 0 0 7 0" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8z" />
        <path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />
      </>
    ),
    subscriptions: (
      <>
        <rect height="14" rx="2" width="18" x="3" y="5" />
        <path d="M7 9h10" />
        <path d="M7 13h6" />
      </>
    ),
    telegram: (
      <>
        <path d="m21 4-3 16-6-5-4 4 1-6-6-2z" />
        <path d="M9 13 21 4" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
        <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
        <path d="M9 4h6l1 3H8z" />
      </>
    ),
    transactions: (
      <>
        <path d="M7 7h13" />
        <path d="m16 3 4 4-4 4" />
        <path d="M17 17H4" />
        <path d="m8 21-4-4 4-4" />
      </>
    ),
    upload: (
      <>
        <path d="M12 21V9" />
        <path d="m7 14 5-5 5 5" />
        <path d="M5 3h14" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </>
    ),
    wallet: (
      <>
        <path d="M4 7a2 2 0 0 1 2-2h13v14H6a2 2 0 0 1-2-2z" />
        <path d="M18 11h3v4h-3a2 2 0 0 1 0-4Z" />
      </>
    ),
    warning: (
      <>
        <path d="m12 3 10 18H2z" />
        <path d="M12 9v5" />
        <path d="M12 17h.01" />
      </>
    ),
    lightbulb: (
      <>
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M8.5 14.5a6 6 0 1 1 7 0c-.9.7-1.5 1.5-1.5 2.5h-4c0-1-.6-1.8-1.5-2.5Z" />
      </>
    ),
  };

  return (
    <svg aria-hidden="true" {...common}>
      {paths[name]}
    </svg>
  );
}
