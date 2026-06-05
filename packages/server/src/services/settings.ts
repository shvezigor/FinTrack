import { decryptSecret, encryptSecret } from "@resource-manager/shared";
import { config } from "../config.js";
import { getDb } from "../db.js";

export async function getPlainSetting(key: string): Promise<string | null> {
  const setting = await getDb().appSetting.findUnique({ where: { key } });
  return setting?.valuePlain ?? null;
}

export async function setPlainSetting(key: string, value: string): Promise<void> {
  await getDb().appSetting.upsert({
    where: { key },
    update: {
      isSecret: false,
      valueEncrypted: null,
      valuePlain: value,
    },
    create: {
      isSecret: false,
      key,
      valuePlain: value,
    },
  });
}

export async function getSecretSetting(key: string, envFallback?: string): Promise<string | null> {
  const setting = await getDb().appSetting.findUnique({ where: { key } });

  if (setting?.valueEncrypted) {
    return decryptSecret(setting.valueEncrypted, config.APP_SECRET_KEY);
  }

  return envFallback?.trim() ? envFallback : null;
}

export async function setSecretSetting(key: string, value: string): Promise<void> {
  if (!config.APP_SECRET_KEY.trim()) {
    throw new Error("APP_SECRET_KEY is required before saving secrets in Telegram setup");
  }

  await getDb().appSetting.upsert({
    where: { key },
    update: {
      isSecret: true,
      valueEncrypted: encryptSecret(value, config.APP_SECRET_KEY),
      valuePlain: null,
    },
    create: {
      isSecret: true,
      key,
      valueEncrypted: encryptSecret(value, config.APP_SECRET_KEY),
    },
  });
}

export async function deleteSetting(key: string): Promise<void> {
  await getDb().appSetting.delete({ where: { key } }).catch(() => undefined);
}

export async function getConfiguredStatus(userId?: string) {
  const [openai, mono, googleJson, googleSheet, userSecrets] = await Promise.all([
    getSecretSetting("OPENAI_API_KEY", config.OPENAI_API_KEY),
    getSecretSetting("MONOBANK_TOKEN", config.MONOBANK_TOKEN),
    getSecretSetting("GOOGLE_SERVICE_ACCOUNT_JSON", config.GOOGLE_SERVICE_ACCOUNT_JSON),
    getPlainSetting("GOOGLE_SHEETS_SPREADSHEET_ID").then(
      (value) => value ?? config.GOOGLE_SHEETS_SPREADSHEET_ID,
    ),
    userId
      ? getDb().userSecret.findMany({
          select: { keyName: true, provider: true },
          where: { revokedAt: null, userId },
        })
      : Promise.resolve([]),
  ]);
  const hasUserSecret = (provider: string, keyName: string) =>
    userSecrets.some((secret) => secret.provider === provider && secret.keyName === keyName);

  return {
    googleSheets:
      Boolean(googleJson && googleSheet) ||
      (hasUserSecret("GOOGLE_SHEETS", "GOOGLE_SERVICE_ACCOUNT_JSON") &&
        hasUserSecret("GOOGLE_SHEETS", "GOOGLE_SHEETS_SPREADSHEET_ID")),
    monobank: Boolean(mono) || hasUserSecret("MONOBANK", "MONOBANK_TOKEN"),
    openai: Boolean(openai) || hasUserSecret("OPENAI", "OPENAI_API_KEY"),
  };
}
