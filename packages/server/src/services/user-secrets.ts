import { IntegrationProvider } from "@prisma/client";
import { decryptSecret, encryptSecret } from "@resource-manager/shared";
import { config } from "../config.js";
import { getDb } from "../db.js";

const allowedProviders = new Set<string>(Object.values(IntegrationProvider));

export type UserSecretStatus = {
  createdAt: string;
  hasValue: boolean;
  keyName: string;
  label: string | null;
  lastUsedAt: string | null;
  provider: IntegrationProvider;
  revokedAt: string | null;
  updatedAt: string;
};

export async function listUserSecrets(userId: string): Promise<UserSecretStatus[]> {
  const rows = await getDb().userSecret.findMany({
    orderBy: [{ provider: "asc" }, { keyName: "asc" }],
    where: { userId },
  });
  return rows.map(serializeUserSecret);
}

export async function upsertUserSecret(input: {
  keyName: string;
  label?: string | null;
  provider: string;
  userId: string;
  value: string;
}) {
  const provider = normalizeProvider(input.provider);
  const keyName = normalizeKeyName(input.keyName);
  const value = input.value.trim();
  if (!value) {
    throw new Error("Secret value is required");
  }
  if (!config.APP_SECRET_KEY.trim()) {
    throw new Error("APP_SECRET_KEY is required before saving encrypted user secrets");
  }

  const row = await getDb().userSecret.upsert({
    create: {
      keyName,
      label: input.label?.trim() || keyName,
      provider,
      userId: input.userId,
      valueEncrypted: encryptSecret(value, config.APP_SECRET_KEY),
    },
    update: {
      keyVersion: { increment: 1 },
      label: input.label?.trim() || keyName,
      revokedAt: null,
      valueEncrypted: encryptSecret(value, config.APP_SECRET_KEY),
    },
    where: {
      userId_provider_keyName: {
        keyName,
        provider,
        userId: input.userId,
      },
    },
  });

  return serializeUserSecret(row);
}

export async function revokeUserSecret(userId: string, providerInput: string, keyNameInput: string) {
  const provider = normalizeProvider(providerInput);
  const keyName = normalizeKeyName(keyNameInput);
  const row = await getDb().userSecret.update({
    data: { revokedAt: new Date() },
    where: {
      userId_provider_keyName: {
        keyName,
        provider,
        userId,
      },
    },
  });
  return serializeUserSecret(row);
}

export async function getUserSecret(
  userId: string | null | undefined,
  providerInput: string,
  keyNameInput: string,
  fallback?: string | null,
) {
  if (!userId) {
    return fallback?.trim() ? fallback : null;
  }

  const provider = normalizeProvider(providerInput);
  const keyName = normalizeKeyName(keyNameInput);
  const row = await getDb().userSecret.findUnique({
    where: {
      userId_provider_keyName: {
        keyName,
        provider,
        userId,
      },
    },
  });

  if (!row || row.revokedAt) {
    return fallback?.trim() ? fallback : null;
  }

  await getDb().userSecret
    .update({ data: { lastUsedAt: new Date() }, where: { id: row.id } })
    .catch(() => undefined);

  return decryptSecret(row.valueEncrypted, config.APP_SECRET_KEY);
}

export async function getUserPlainSecret(
  userId: string | null | undefined,
  providerInput: string,
  keyNameInput: string,
  fallback?: string | null,
) {
  if (!userId) {
    return fallback?.trim() ? fallback : null;
  }

  const provider = normalizeProvider(providerInput);
  const keyName = normalizeKeyName(keyNameInput);
  const row = await getDb().userSecret.findUnique({
    where: {
      userId_provider_keyName: {
        keyName,
        provider,
        userId,
      },
    },
  });

  if (!row || row.revokedAt) {
    return fallback?.trim() ? fallback : null;
  }

  await getDb().userSecret
    .update({ data: { lastUsedAt: new Date() }, where: { id: row.id } })
    .catch(() => undefined);

  return decryptSecret(row.valueEncrypted, config.APP_SECRET_KEY);
}

export function normalizeProvider(provider: string): IntegrationProvider {
  const normalized = provider.trim().toUpperCase();
  if (!allowedProviders.has(normalized)) {
    throw new Error("Unsupported integration provider");
  }
  return normalized as IntegrationProvider;
}

export function normalizeKeyName(keyName: string) {
  const normalized = keyName.trim().toUpperCase();
  if (!/^[A-Z0-9_]{2,80}$/.test(normalized)) {
    throw new Error("Secret key name must contain only A-Z, 0-9 and underscore");
  }
  return normalized;
}

function serializeUserSecret(row: {
  createdAt: Date;
  keyName: string;
  label: string | null;
  lastUsedAt: Date | null;
  provider: IntegrationProvider;
  revokedAt: Date | null;
  updatedAt: Date;
}) {
  return {
    createdAt: row.createdAt.toISOString(),
    hasValue: true,
    keyName: row.keyName,
    label: row.label,
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
    provider: row.provider,
    revokedAt: row.revokedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}
