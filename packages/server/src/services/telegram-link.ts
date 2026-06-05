import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "../config.js";
import { getDb } from "../db.js";
import { getTelegramBotUsername } from "./telegram-admin.js";

const CONNECT_TOKEN_TTL_SECONDS = 24 * 60 * 60;

export async function getTelegramConnectLink(userId: string): Promise<string | null> {
  const username = await getTelegramBotUsername();
  if (!username) {
    return null;
  }

  return `https://t.me/${username}?start=${createTelegramConnectStartParam(userId)}`;
}

export async function getTelegramConnectionState(userId?: string | null) {
  const [username, linkedCount] = await Promise.all([
    getTelegramBotUsername(),
    userId ? getDb().telegramAccount.count({ where: { telegramChatId: { not: null }, userId } }) : Promise.resolve(0),
  ]);

  return {
    botUrl: userId && username ? `https://t.me/${username}?start=${createTelegramConnectStartParam(userId)}` : null,
    connected: linkedCount > 0,
    username,
  };
}

export async function getLinkedTelegramAccount(telegramUserId: string) {
  return getDb().telegramAccount.findUnique({
    where: { telegramUserId },
  });
}

export async function linkTelegramAccountFromStartParam(input: {
  firstName?: string | null;
  lastName?: string | null;
  startParam: string;
  telegramChatId?: string | null;
  telegramUserId: string;
  username?: string | null;
}) {
  const userId = resolveTelegramConnectUserId(input.startParam);
  if (!userId) {
    return null;
  }

  return getDb().telegramAccount.upsert({
    where: { telegramUserId: input.telegramUserId },
    update: {
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      telegramChatId: input.telegramChatId ?? null,
      userId,
      username: input.username ?? null,
    },
    create: {
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      telegramChatId: input.telegramChatId ?? null,
      telegramUserId: input.telegramUserId,
      userId,
      username: input.username ?? null,
    },
  });
}

export function resolveTelegramConnectUserId(startParam: string) {
  return parseTelegramConnectStartParam(startParam);
}

export async function touchTelegramAccount(input: {
  firstName?: string | null;
  lastName?: string | null;
  telegramChatId?: string | null;
  telegramUserId: string;
  userId?: string | null;
  username?: string | null;
}) {
  const existing = await getDb().telegramAccount.findUnique({
    where: { telegramUserId: input.telegramUserId },
  });

  return getDb().telegramAccount.upsert({
    where: { telegramUserId: input.telegramUserId },
    update: {
      firstName: input.firstName ?? existing?.firstName ?? null,
      lastName: input.lastName ?? existing?.lastName ?? null,
      telegramChatId: input.telegramChatId ?? existing?.telegramChatId ?? null,
      userId: input.userId ?? existing?.userId ?? null,
      username: input.username ?? existing?.username ?? null,
    },
    create: {
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      telegramChatId: input.telegramChatId ?? null,
      telegramUserId: input.telegramUserId,
      userId: input.userId ?? null,
      username: input.username ?? null,
    },
  });
}

function createTelegramConnectStartParam(userId: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + CONNECT_TOKEN_TTL_SECONDS;
  const payload = `${userId}.${expiresAt.toString(36)}`;
  return `ft_${payload}.${signTelegramPayload(payload)}`;
}

function parseTelegramConnectStartParam(startParam: string) {
  const normalized = startParam.trim();
  if (!normalized.startsWith("ft_")) {
    return null;
  }

  const raw = normalized.slice(3);
  const lastDot = raw.lastIndexOf(".");
  if (lastDot <= 0) {
    return null;
  }

  const payload = raw.slice(0, lastDot);
  const signature = raw.slice(lastDot + 1);
  const expectedSignature = signTelegramPayload(payload);
  if (!safeCompare(signature, expectedSignature)) {
    return null;
  }

  const [userId, expiresAtRaw] = payload.split(".");
  const expiresAt = Number.parseInt(expiresAtRaw ?? "", 36);
  if (!userId || !Number.isFinite(expiresAt) || expiresAt * 1000 < Date.now()) {
    return null;
  }

  return userId;
}

function signTelegramPayload(payload: string) {
  return createHmac("sha256", telegramConnectSecret()).update(payload).digest("base64url").slice(0, 22);
}

function telegramConnectSecret() {
  return config.APP_SECRET_KEY.trim() || config.TELEGRAM_BOT_TOKEN.trim() || "fintrack-telegram";
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
