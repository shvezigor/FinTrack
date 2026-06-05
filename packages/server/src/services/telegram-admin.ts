import { decryptSecret } from "@resource-manager/shared";
import { config } from "../config.js";
import { getDb } from "../db.js";
import { deleteSetting, setPlainSetting, setSecretSetting } from "./settings.js";

const TELEGRAM_API_BASE = "https://api.telegram.org";
const TELEGRAM_BOT_TOKEN_KEY = "TELEGRAM_BOT_TOKEN";
const TELEGRAM_BOT_USERNAME_KEY = "TELEGRAM_BOT_USERNAME";
const ADMIN_TELEGRAM_USER_IDS_KEY = "ADMIN_TELEGRAM_USER_IDS";

let cachedBotIdentity:
  | {
      token: string | null;
      username: string | null;
    }
  | undefined;

type TelegramApiResult<T> = {
  description?: string;
  ok?: boolean;
  result?: T;
};

export type TelegramAdminSettings = {
  adminTelegramUserIds: string[];
  botConfigured: boolean;
  botTokenConfigured: boolean;
  botTokenSource: "database" | "environment" | "missing";
  botUrl: string | null;
  botUsername: string | null;
  connectedAccountCount: number;
  connectedUserCount: number;
  localDevelopment: boolean;
  runtimeMode: "polling" | "webhook";
  secretSetupEnabled: boolean;
  telegramAccountsCount: number;
  warnings: string[];
  webhookLastError: string | null;
  webhookPendingUpdateCount: number | null;
  webhookStatus: "active" | "not_configured" | "polling" | "unknown";
  webhookUrl: string | null;
};

export async function getTelegramBotToken(): Promise<string | null> {
  const setting = await getDb().appSetting.findUnique({
    where: { key: TELEGRAM_BOT_TOKEN_KEY },
  });

  if (setting?.valueEncrypted) {
    return decryptSecret(setting.valueEncrypted, config.APP_SECRET_KEY);
  }

  return normalizeSecret(config.TELEGRAM_BOT_TOKEN);
}

export async function getTelegramAdminIds(): Promise<string[]> {
  const stored = await getDb().appSetting.findUnique({
    where: { key: ADMIN_TELEGRAM_USER_IDS_KEY },
  });
  const raw = stored?.valuePlain ?? config.ADMIN_TELEGRAM_USER_IDS;
  return parseTelegramAdminIds(raw);
}

export async function getTelegramBotUsername(): Promise<string | null> {
  const token = await getTelegramBotToken();
  if (cachedBotIdentity && cachedBotIdentity.token === token) {
    return cachedBotIdentity.username;
  }

  const stored = await getDb().appSetting.findUnique({
    where: { key: TELEGRAM_BOT_USERNAME_KEY },
  });
  const override = normalizeTelegramUsername(stored?.valuePlain ?? config.TELEGRAM_BOT_USERNAME);
  if (override) {
    cachedBotIdentity = { token, username: override };
    return override;
  }

  if (!token) {
    cachedBotIdentity = { token: null, username: null };
    return null;
  }

  try {
    const profile = await callTelegramApi<{ username?: string }>(token, "getMe");
    const username = normalizeTelegramUsername(profile.username ?? null);
    cachedBotIdentity = { token, username };
    return username;
  } catch {
    cachedBotIdentity = { token, username: null };
    return null;
  }
}

export function clearTelegramBotIdentityCache() {
  cachedBotIdentity = undefined;
}

export function shouldUseTelegramPolling() {
  return config.TELEGRAM_USE_POLLING || isLoopbackBaseUrl(config.APP_BASE_URL);
}

export async function saveTelegramAdminSettings(input: {
  adminTelegramUserIds?: string[];
  botToken?: string | null;
  botUsername?: string | null;
}) {
  if (input.botToken !== undefined) {
    const normalized = normalizeSecret(input.botToken);
    if (normalized) {
      await setSecretSetting(TELEGRAM_BOT_TOKEN_KEY, normalized);
    }
  }

  if (input.botUsername !== undefined) {
    const normalized = normalizeTelegramUsername(input.botUsername);
    if (normalized) {
      await setPlainSetting(TELEGRAM_BOT_USERNAME_KEY, normalized);
    } else {
      await deleteSetting(TELEGRAM_BOT_USERNAME_KEY);
    }
  }

  if (input.adminTelegramUserIds !== undefined) {
    const normalized = input.adminTelegramUserIds.map((item) => item.trim()).filter(Boolean);
    if (normalized.length) {
      await setPlainSetting(ADMIN_TELEGRAM_USER_IDS_KEY, normalized.join(","));
    } else {
      await deleteSetting(ADMIN_TELEGRAM_USER_IDS_KEY);
    }
  }

  clearTelegramBotIdentityCache();
  return getTelegramAdminSettings();
}

export async function getTelegramAdminSettings(): Promise<TelegramAdminSettings> {
  const [tokenSetting, username, adminTelegramUserIds, telegramAccountsCount, connectedUserCount, connectedAccountCount] =
    await Promise.all([
      getDb().appSetting.findUnique({
        where: { key: TELEGRAM_BOT_TOKEN_KEY },
      }),
      getTelegramBotUsername(),
      getTelegramAdminIds(),
      getDb().telegramAccount.count(),
      getDb().telegramAccount.count({
        where: { userId: { not: null } },
      }),
      getDb().telegramAccount.count({
        where: { telegramChatId: { not: null }, userId: { not: null } },
      }),
    ]);

  const token = tokenSetting?.valueEncrypted
    ? decryptSecret(tokenSetting.valueEncrypted, config.APP_SECRET_KEY)
    : normalizeSecret(config.TELEGRAM_BOT_TOKEN);
  const localDevelopment = isLoopbackBaseUrl(config.APP_BASE_URL);
  const runtimeMode = shouldUseTelegramPolling() ? "polling" : "webhook";
  const warnings: string[] = [];

  if (!token) {
    warnings.push("Bot token is missing. Add a BotFather token to activate Telegram.");
  }
  if (!username && token) {
    warnings.push("Bot username is not resolved yet. Save the username manually if Telegram getMe is blocked.");
  }
  if (localDevelopment) {
    warnings.push("Local development uses polling automatically. Telegram webhooks require a public HTTPS URL.");
  } else if (!config.APP_BASE_URL.startsWith("https://")) {
    warnings.push("Telegram webhooks work reliably only with a public HTTPS APP_BASE_URL.");
  }
  if (!adminTelegramUserIds.length) {
    warnings.push("No admin Telegram user ids are configured yet.");
  }

  const botTokenSource: TelegramAdminSettings["botTokenSource"] = tokenSetting?.valueEncrypted
    ? "database"
    : token
      ? "environment"
      : "missing";

  let webhookStatus: TelegramAdminSettings["webhookStatus"] = runtimeMode === "polling" ? "polling" : "not_configured";
  let webhookLastError: string | null = null;
  let webhookPendingUpdateCount: number | null = null;
  const webhookUrl = runtimeMode === "webhook" && token ? `${config.APP_BASE_URL}/webhooks/telegram` : null;

  if (runtimeMode === "webhook" && token) {
    try {
      const webhookInfo = await callTelegramApi<{
        last_error_message?: string;
        pending_update_count?: number;
        url?: string;
      }>(token, "getWebhookInfo");
      webhookLastError = webhookInfo.last_error_message ?? null;
      webhookPendingUpdateCount = webhookInfo.pending_update_count ?? null;
      webhookStatus = webhookInfo.url ? "active" : "not_configured";
    } catch {
      webhookStatus = "unknown";
    }
  }

  return {
    adminTelegramUserIds,
    botConfigured: Boolean(token && username),
    botTokenConfigured: Boolean(token),
    botTokenSource,
    botUrl: username ? `https://t.me/${username}` : null,
    botUsername: username,
    connectedAccountCount,
    connectedUserCount,
    localDevelopment,
    runtimeMode,
    secretSetupEnabled: config.ENABLE_TELEGRAM_SECRET_SETUP,
    telegramAccountsCount,
    warnings,
    webhookLastError,
    webhookPendingUpdateCount,
    webhookStatus,
    webhookUrl,
  };
}

export async function enableTelegramWebhook() {
  const token = await getTelegramBotToken();
  if (!token) {
    throw new Error("Telegram bot token is not configured yet");
  }
  if (shouldUseTelegramPolling()) {
    throw new Error("Webhook mode is disabled in local development. Use polling or set a public APP_BASE_URL.");
  }
  if (!config.APP_BASE_URL.startsWith("https://")) {
    throw new Error("APP_BASE_URL must be HTTPS before enabling Telegram webhook");
  }

  const payload: Record<string, unknown> = {
    drop_pending_updates: false,
    url: `${config.APP_BASE_URL}/webhooks/telegram`,
  };
  if (config.TELEGRAM_WEBHOOK_SECRET.trim()) {
    payload.secret_token = config.TELEGRAM_WEBHOOK_SECRET.trim();
  }

  await callTelegramApi(token, "setWebhook", payload);
  return getTelegramAdminSettings();
}

function normalizeSecret(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeTelegramUsername(value?: string | null) {
  const normalized = value?.trim().replace(/^@/, "");
  return normalized ? normalized : null;
}

function parseTelegramAdminIds(value?: string | null) {
  return (value ?? "")
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isLoopbackBaseUrl(value: string) {
  try {
    const url = new URL(value);
    return ["0.0.0.0", "127.0.0.1", "localhost"].includes(url.hostname) || url.hostname.endsWith(".local");
  } catch {
    return false;
  }
}

async function callTelegramApi<T = Record<string, unknown>>(token: string, method: string, body?: Record<string, unknown>) {
  const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/${method}`, {
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    method: body ? "POST" : "GET",
  });

  if (!response.ok) {
    throw new Error(`Telegram ${method} failed with ${response.status}`);
  }

  const payload = (await response.json()) as TelegramApiResult<T>;
  if (!payload.ok) {
    throw new Error(payload.description ?? `Telegram ${method} failed`);
  }

  return payload.result as T;
}
