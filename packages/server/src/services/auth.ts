import { Prisma } from "@prisma/client";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
import { encryptSecret } from "@resource-manager/shared";
import { config } from "../config.js";
import { getDb } from "../db.js";
import { sendEmail, formatPasswordResetEmail } from "./email.js";

const scrypt = promisify(scryptCallback);
const SESSION_DAYS = 30;
const DEFAULT_LOCALE = "uk";
const DEFAULT_CURRENCY_CODE = 980;
const DEFAULT_NUMBER_FORMAT = "SPACE_COMMA";
const DEFAULT_AUTO_LOGOUT_MINUTES = 30;
const SUPPORTED_LOCALES = new Set(["uk", "en"]);
const SUPPORTED_NUMBER_FORMATS = new Set(["SPACE_COMMA", "COMMA_DOT", "DOT_COMMA"]);
const SUPPORTED_AUTO_LOGOUT_MINUTES = new Set([5, 10, 15, 30, 60, 120, 240, 480, 1440]);
const TIMEZONE_ALIASES: Record<string, string> = {
  "Europe/Kiev": "Europe/Kyiv",
};
const ROLE_DEFINITIONS = [
  {
    description: "Workspace owner with full access to configuration and data.",
    key: "OWNER",
    name: "Owner",
  },
  {
    description: "Administrator with elevated access to workspace operations.",
    key: "ADMIN",
    name: "Administrator",
  },
  {
    description: "Standard member with access to their finance data.",
    key: "USER",
    name: "User",
  },
] as const;
const ROLE_PRIORITY = ROLE_DEFINITIONS.map((item) => item.key);

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  token_type?: string;
};

type GoogleProfile = {
  email?: string;
  family_name?: string;
  given_name?: string;
  id: string;
  name?: string;
  picture?: string;
  verified_email?: boolean;
};

type RoleKey = (typeof ROLE_DEFINITIONS)[number]["key"];
type DbExecutor = Prisma.TransactionClient | ReturnType<typeof getDb>;

const serializedUserInclude = Prisma.validator<Prisma.UserInclude>()({
  preferences: true,
  securitySettings: true,
  roles: {
    include: { role: true },
    orderBy: { assignedAt: "asc" },
  },
  subscription: true,
});

const authUserInclude = Prisma.validator<Prisma.UserInclude>()({
  passwordCredential: true,
  preferences: true,
  securitySettings: true,
  roles: {
    include: { role: true },
    orderBy: { assignedAt: "asc" },
  },
  subscription: true,
});

const authProfileInclude = Prisma.validator<Prisma.UserInclude>()({
  integrations: true,
  notificationPreferences: true,
  oauthAccounts: true,
  passwordCredential: true,
  preferences: true,
  securitySettings: true,
  roles: {
    include: { role: true },
    orderBy: { assignedAt: "asc" },
  },
  subscription: true,
  telegramAccounts: true,
});

type SerializedUserRecord = Prisma.UserGetPayload<{ include: typeof serializedUserInclude }>;
type AuthUserRecord = Prisma.UserGetPayload<{ include: typeof authUserInclude }>;

export async function ensureDefaultUser() {
  const user = await getDb().user.upsert({
    where: { email: config.DEFAULT_USER_EMAIL },
    update: {},
    create: {
      email: config.DEFAULT_USER_EMAIL,
      name: config.DEFAULT_USER_NAME,
    },
    include: authUserInclude,
  });

  await syncNormalizedUserAccess(getDb(), {
    currencyCode: user.preferences?.currencyCode ?? DEFAULT_CURRENCY_CODE,
    id: user.id,
    locale: user.preferences?.locale ?? DEFAULT_LOCALE,
    numberFormat: user.preferences?.numberFormat ?? DEFAULT_NUMBER_FORMAT,
    role: resolvePrimaryRole(user.roles) ?? "OWNER",
    timezone: user.preferences?.timezone ?? config.TIMEZONE,
  });
  await syncNormalizedUserSecuritySettings(getDb(), {
    actionConfirmationEnabled: user.securitySettings?.actionConfirmationEnabled ?? true,
    autoLogoutMinutes: user.securitySettings?.autoLogoutMinutes ?? DEFAULT_AUTO_LOGOUT_MINUTES,
    id: user.id,
    twoFactorEnabled: user.securitySettings?.twoFactorEnabled ?? false,
  });

  await getDb().userSubscription.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      status: "ACTIVE",
      tier: "FREE",
      userId: user.id,
    },
  });

  if (!user.passwordCredential) {
    const password = await hashPassword(config.DASHBOARD_ADMIN_PASSWORD);
    await getDb().passwordCredential.create({
      data: {
        passwordHash: password.hash,
        passwordSalt: password.salt,
        userId: user.id,
      },
    });
  }

  return loadAuthUser(user.id);
}

export async function authenticatePassword(email: string, password: string) {
  await ensureDefaultUser();
  const user = await getDb().user.findUnique({
    include: authUserInclude,
    where: { email: email.trim().toLowerCase() },
  });

  if (!user?.passwordCredential) {
    return null;
  }

  const ok = await verifyPassword(password, user.passwordCredential.passwordSalt, user.passwordCredential.passwordHash);
  if (!ok) {
    return null;
  }

  return createSession(user.id, "WEB_PASSWORD");
}

export async function registerPasswordUser(input: { email: string; locale?: string; name?: string; password: string; timezone?: string }) {
  const email = input.email.trim().toLowerCase();
  if (!email || input.password.length < 8) {
    throw new Error("Email and password with at least 8 characters are required");
  }

  const existing = await getDb().user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("User already exists");
  }

  const password = await hashPassword(input.password);
  const locale = normalizeLocale(input.locale);
  const timezone = normalizeTimezone(input.timezone);
  const user = await getDb().user.create({
    data: {
      email,
      name: input.name?.trim() || email.split("@")[0],
      passwordCredential: {
        create: {
          passwordHash: password.hash,
          passwordSalt: password.salt,
        },
      },
      subscription: {
        create: {
          status: "ACTIVE",
          tier: "FREE",
        },
      },
    },
  });

  await syncNormalizedUserAccess(getDb(), {
    currencyCode: DEFAULT_CURRENCY_CODE,
    id: user.id,
    locale,
    numberFormat: DEFAULT_NUMBER_FORMAT,
    role: "USER",
    timezone,
  });
  await syncNormalizedUserSecuritySettings(getDb(), {
    id: user.id,
  });

  return createSession(user.id, "WEB_PASSWORD");
}

export async function createSession(userId: string, source: "GOOGLE" | "TELEGRAM" | "WEB_PASSWORD") {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await getDb().userSession.create({
    data: {
      expiresAt,
      source,
      tokenHash: hashToken(token),
      userId,
    },
  });

  const user = await loadSerializedUser(userId);
  return {
    sessionToken: token,
    user: serializeUser(user),
  };
}

export async function getUserBySessionToken(token: string | null | undefined) {
  if (!token) {
    return null;
  }

  const session = await getDb().userSession.findUnique({
    include: {
      user: {
        include: serializedUserInclude,
      },
    },
    where: { tokenHash: hashToken(token) },
  });

  if (!session || session.expiresAt <= new Date()) {
    return null;
  }
  const autoLogoutMinutes = normalizeAutoLogoutMinutes(session.user.securitySettings?.autoLogoutMinutes);
  const activityAt = session.lastSeenAt ?? session.createdAt;
  if (Date.now() - activityAt.getTime() > autoLogoutMinutes * 60 * 1000) {
    await getDb().userSession.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  void getDb().userSession
    .update({
      data: { lastSeenAt: new Date() },
      where: { id: session.id },
    })
    .catch(() => undefined);

  return session.user;
}

export async function revokeSession(token: string | null | undefined) {
  if (!token) {
    return;
  }

  await getDb().userSession.delete({ where: { tokenHash: hashToken(token) } }).catch(() => undefined);
}

export async function requestPasswordReset(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await getDb().user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    // Don't reveal if user exists
    return { sent: true };
  }

  // Invalidate any existing reset tokens
  await getDb().passwordReset.deleteMany({
    where: { userId: user.id },
  });

  // Generate a new reset token
  const token = randomBytes(32).toString("base64url");
  const expiryMinutes = parseInt(config.PASSWORD_RESET_EXPIRY_MINUTES) || 60;
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  await getDb().passwordReset.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt,
    },
  });

  // Send reset email
  const resetUrl = `${config.DASHBOARD_PUBLIC_URL}/reset-password?token=${token}`;
  const emailContent = formatPasswordResetEmail(resetUrl, user.name || user.email.split("@")[0]);

  await sendEmail({
    to: user.email,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
  });

  return { sent: true };
}

export async function verifyPasswordResetToken(token: string) {
  if (!token) {
    return null;
  }

  const resetRecord = await getDb().passwordReset.findUnique({
    include: { user: { include: authUserInclude } },
    where: { tokenHash: hashToken(token) },
  });

  if (!resetRecord || resetRecord.expiresAt <= new Date()) {
    return null;
  }

  return resetRecord.user;
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  if (!token || newPassword.length < 8) {
    throw new Error("Invalid token or password");
  }

  const resetRecord = await getDb().passwordReset.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!resetRecord || resetRecord.expiresAt <= new Date()) {
    throw new Error("Reset token expired or invalid");
  }

  const passwordHash = await hashPassword(newPassword);

  // Update password and delete reset token
  await getDb().$transaction(async (tx) => {
    await tx.passwordCredential.update({
      where: { userId: resetRecord.userId },
      data: {
        passwordHash: passwordHash.hash,
        passwordSalt: passwordHash.salt,
      },
    });

    await tx.passwordReset.delete({
      where: { id: resetRecord.id },
    });

    // Revoke all existing sessions
    await tx.userSession.deleteMany({
      where: { userId: resetRecord.userId },
    });
  });

  return createSession(resetRecord.userId, "WEB_PASSWORD");
}

export async function authenticateDashboardRequest(headers: {
  authorization?: string | string[];
  dashboardPassword?: string | string[];
}) {
  const authorization = firstHeader(headers.authorization);
  const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;
  const sessionUser = await getUserBySessionToken(bearerToken);
  if (sessionUser) {
    return sessionUser;
  }

  if (firstHeader(headers.dashboardPassword) === config.DASHBOARD_ADMIN_PASSWORD) {
    return ensureDefaultUser();
  }

  return null;
}

export async function getAuthProfile(userId: string) {
  const user = await getDb().user.findUniqueOrThrow({
    include: authProfileInclude,
    where: { id: userId },
  });

  return {
    ...serializeUser(user),
    integrations: user.integrations.map((item) => ({
      id: item.id,
      label: item.label,
      lastSyncAt: item.lastSyncAt?.toISOString() ?? null,
      provider: item.provider,
      status: item.status,
    })),
    notifications: user.notificationPreferences.map((item) => ({
      enabled: item.enabled,
      key: item.key,
    })),
    oauthProviders: user.oauthAccounts.map((item) => item.provider),
    security: {
      actionConfirmationEnabled: user.securitySettings?.actionConfirmationEnabled ?? true,
      autoLogoutMinutes: normalizeAutoLogoutMinutes(user.securitySettings?.autoLogoutMinutes),
      hasPassword: Boolean(user.passwordCredential),
      passwordChangedAt: user.passwordCredential?.updatedAt?.toISOString() ?? null,
      twoFactorEnabled: user.securitySettings?.twoFactorEnabled ?? false,
    },
    telegram: user.telegramAccounts.map((item) => ({
      isAdmin: item.isAdmin,
      telegramChatId: item.telegramChatId,
      telegramUserId: item.telegramUserId,
      username: item.username,
    })),
  };
}

export async function updateUserProfile(
  userId: string,
  input: {
    currencyCode?: number | string;
    email?: string;
    locale?: string;
    name?: string;
    numberFormat?: string;
    phone?: string;
    timezone?: string;
  },
) {
  const email = input.email?.trim().toLowerCase();
  if (email) {
    const existing = await getDb().user.findFirst({
      where: {
        email,
        NOT: { id: userId },
      },
    });
    if (existing) {
      throw new Error("Email is already used by another user");
    }
  }

  const current = await loadSerializedUser(userId);
  const role = resolvePrimaryRole(current.roles) ?? "USER";
  const locale = normalizeLocale(input.locale, current.preferences?.locale ?? DEFAULT_LOCALE);
  const timezone = normalizeTimezone(input.timezone, current.preferences?.timezone ?? config.TIMEZONE);
  const currencyCode = normalizeCurrencyCode(input.currencyCode, current.preferences?.currencyCode ?? DEFAULT_CURRENCY_CODE);
  const numberFormat = normalizeNumberFormat(input.numberFormat, current.preferences?.numberFormat ?? DEFAULT_NUMBER_FORMAT);

  const user = await getDb().$transaction(async (tx) => {
    await tx.user.update({
      data: {
        email: email || undefined,
        name: input.name?.trim() || undefined,
        phone: input.phone === undefined ? undefined : input.phone.trim() || null,
      },
      where: { id: userId },
    });

    await syncNormalizedUserAccess(tx, {
      currencyCode,
      id: userId,
      locale,
      numberFormat,
      role,
      timezone,
    });

    return tx.user.findUniqueOrThrow({
      include: serializedUserInclude,
      where: { id: userId },
    });
  });

  return serializeUser(user);
}

export async function updateNotificationPreference(userId: string, key: string, enabled: boolean) {
  const preference = await getDb().notificationPreference.upsert({
    where: {
      userId_key: {
        key,
        userId,
      },
    },
    update: { enabled },
    create: {
      enabled,
      key,
      userId,
    },
  });

  return {
    enabled: preference.enabled,
    key: preference.key,
  };
}

export async function updateUserSecuritySettings(
  userId: string,
  input: {
    actionConfirmationEnabled?: boolean;
    autoLogoutMinutes?: number | string;
    twoFactorEnabled?: boolean;
  },
) {
  const current = await getDb().userSecuritySettings.findUnique({ where: { userId } });
  const settings = await syncNormalizedUserSecuritySettings(getDb(), {
    actionConfirmationEnabled: input.actionConfirmationEnabled ?? current?.actionConfirmationEnabled,
    autoLogoutMinutes: input.autoLogoutMinutes ?? current?.autoLogoutMinutes,
    id: userId,
    twoFactorEnabled: input.twoFactorEnabled ?? current?.twoFactorEnabled,
  });

  return {
    actionConfirmationEnabled: settings.actionConfirmationEnabled,
    autoLogoutMinutes: settings.autoLogoutMinutes,
    twoFactorEnabled: settings.twoFactorEnabled,
  };
}

export async function changeUserPassword(
  userId: string,
  input: {
    currentPassword?: string;
    newPassword: string;
  },
) {
  const nextPassword = input.newPassword.trim();
  if (nextPassword.length < 8) {
    throw new Error("New password must contain at least 8 characters");
  }

  const user = await getDb().user.findUniqueOrThrow({
    include: { passwordCredential: true },
    where: { id: userId },
  });

  if (user.passwordCredential) {
    if (!input.currentPassword) {
      throw new Error("Current password is required");
    }
    const ok = await verifyPassword(
      input.currentPassword,
      user.passwordCredential.passwordSalt,
      user.passwordCredential.passwordHash,
    );
    if (!ok) {
      throw new Error("Current password is incorrect");
    }
  }

  const password = await hashPassword(nextPassword);
  const credential = await getDb().passwordCredential.upsert({
    where: { userId },
    update: {
      passwordHash: password.hash,
      passwordSalt: password.salt,
    },
    create: {
      passwordHash: password.hash,
      passwordSalt: password.salt,
      userId,
    },
  });

  return {
    passwordChangedAt: credential.updatedAt.toISOString(),
  };
}

export async function createGoogleOAuthState(redirectTo?: string) {
  const state = randomBytes(24).toString("base64url");
  await getDb().authState.create({
    data: {
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      provider: "GOOGLE",
      redirectTo,
      state,
    },
  });
  return state;
}

export async function consumeGoogleOAuthState(state: string) {
  const row = await getDb().authState.findUnique({ where: { state } });
  if (!row || row.provider !== "GOOGLE" || row.expiresAt <= new Date()) {
    return null;
  }

  await getDb().authState.delete({ where: { state } }).catch(() => undefined);
  return row;
}

export async function finishGoogleOAuth(code: string, redirectUri: string) {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    body: new URLSearchParams({
      client_id: config.GOOGLE_OAUTH_CLIENT_ID,
      client_secret: config.GOOGLE_OAUTH_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    method: "POST",
  });

  if (!tokenResponse.ok) {
    throw new Error(`Google token exchange failed: ${tokenResponse.status}`);
  }

  const tokens = (await tokenResponse.json()) as GoogleTokenResponse;
  if (!tokens.access_token) {
    throw new Error("Google token exchange did not return an access token");
  }

  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileResponse.ok) {
    throw new Error(`Google profile fetch failed: ${profileResponse.status}`);
  }

  const profile = (await profileResponse.json()) as GoogleProfile;
  if (!profile.email) {
    throw new Error("Google profile does not include an email");
  }

  const user = await getDb().user.upsert({
    where: { email: profile.email.toLowerCase() },
    update: {
      avatarUrl: profile.picture,
      name: profile.name ?? profile.email,
    },
    create: {
      avatarUrl: profile.picture,
      email: profile.email.toLowerCase(),
      name: profile.name ?? profile.email,
      subscription: {
        create: {
          status: "ACTIVE",
          tier: "FREE",
        },
      },
    },
  });

  const current = await loadSerializedUser(user.id);
  await syncNormalizedUserAccess(getDb(), {
    currencyCode: current.preferences?.currencyCode ?? DEFAULT_CURRENCY_CODE,
    id: user.id,
    locale: current.preferences?.locale ?? DEFAULT_LOCALE,
    numberFormat: current.preferences?.numberFormat ?? DEFAULT_NUMBER_FORMAT,
    role: resolvePrimaryRole(current.roles) ?? "USER",
    timezone: current.preferences?.timezone ?? config.TIMEZONE,
  });
  await syncNormalizedUserSecuritySettings(getDb(), {
    actionConfirmationEnabled: current.securitySettings?.actionConfirmationEnabled ?? true,
    autoLogoutMinutes: current.securitySettings?.autoLogoutMinutes ?? DEFAULT_AUTO_LOGOUT_MINUTES,
    id: user.id,
    twoFactorEnabled: current.securitySettings?.twoFactorEnabled ?? false,
  });

  await getDb().userSubscription.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      status: "ACTIVE",
      tier: "FREE",
      userId: user.id,
    },
  });

  await getDb().oAuthAccount.upsert({
    where: {
      provider_providerAccountId: {
        provider: "GOOGLE",
        providerAccountId: profile.id,
      },
    },
    update: {
      accessTokenEncrypted: maybeEncrypt(tokens.access_token),
      email: profile.email.toLowerCase(),
      expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
      rawProfile: profile as Prisma.InputJsonValue,
      refreshTokenEncrypted: tokens.refresh_token ? maybeEncrypt(tokens.refresh_token) : undefined,
      userId: user.id,
    },
    create: {
      accessTokenEncrypted: maybeEncrypt(tokens.access_token),
      email: profile.email.toLowerCase(),
      expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
      provider: "GOOGLE",
      providerAccountId: profile.id,
      rawProfile: profile as Prisma.InputJsonValue,
      refreshTokenEncrypted: tokens.refresh_token ? maybeEncrypt(tokens.refresh_token) : null,
      userId: user.id,
    },
  });

  return createSession(user.id, "GOOGLE");
}

export function serializeUser(user: {
  avatarUrl: string | null;
  currencyCode?: number | null;
  email: string;
  id: string;
  locale?: string | null;
  name: string | null;
  phone?: string | null;
  preferences?: {
    currencyCode: number;
    locale: string;
    numberFormat?: string | null;
    timezone: string;
  } | null;
  role?: string | null;
  roles?: Array<{
    role: {
      key: string;
    };
  }>;
  subscription?: {
    currencyCode: number;
    priceMonthly: Prisma.Decimal;
    renewsAt: Date | null;
    status: string;
    tier: string;
  } | null;
  timezone?: string | null;
}) {
  const resolvedRole = resolvePrimaryRole(user.roles) ?? normalizeRoleKey(user.role);
  const resolvedLocale = user.preferences?.locale ?? normalizeLocale(user.locale);
  const resolvedTimezone = user.preferences?.timezone ?? normalizeTimezone(user.timezone);
  const resolvedCurrencyCode = user.preferences?.currencyCode ?? normalizeCurrencyCode(user.currencyCode);
  const resolvedNumberFormat = normalizeNumberFormat(user.preferences?.numberFormat);

  return {
    avatarUrl: user.avatarUrl,
    currencyCode: resolvedCurrencyCode,
    email: user.email,
    id: user.id,
    locale: resolvedLocale,
    name: user.name,
    numberFormat: resolvedNumberFormat,
    phone: user.phone ?? null,
    role: resolvedRole,
    subscription: user.subscription
      ? {
          currencyCode: user.subscription.currencyCode,
          priceMonthly: Number(user.subscription.priceMonthly),
          renewsAt: user.subscription.renewsAt?.toISOString() ?? null,
          status: user.subscription.status,
          tier: user.subscription.tier,
        }
      : null,
    timezone: resolvedTimezone,
  };
}

async function seedSystemRoles(db: DbExecutor = getDb()) {
  for (const role of ROLE_DEFINITIONS) {
    await db.role.upsert({
      where: { key: role.key },
      update: {
        description: role.description,
        name: role.name,
      },
      create: role,
    });
  }
}

async function syncNormalizedUserAccess(
  db: DbExecutor,
  input: {
    currencyCode?: number | string | null;
    id: string;
    locale?: string | null;
    numberFormat?: string | null;
    role?: string | null;
    timezone?: string | null;
  },
) {
  await seedSystemRoles(db);

  const locale = normalizeLocale(input.locale);
  const timezone = normalizeTimezone(input.timezone);
  const currencyCode = normalizeCurrencyCode(input.currencyCode);
  const numberFormat = normalizeNumberFormat(input.numberFormat);
  const roleKey = normalizeRoleKey(input.role);
  const role = await db.role.findUniqueOrThrow({ where: { key: roleKey } });

  await db.userPreference.upsert({
    where: { userId: input.id },
    update: {
      currencyCode,
      locale,
      numberFormat,
      timezone,
    },
    create: {
      currencyCode,
      locale,
      numberFormat,
      timezone,
      userId: input.id,
    },
  });

  await db.userRoleAssignment.deleteMany({
    where: {
      roleId: {
        not: role.id,
      },
      userId: input.id,
    },
  });

  await db.userRoleAssignment.upsert({
    where: {
      userId_roleId: {
        roleId: role.id,
        userId: input.id,
      },
    },
    update: {},
    create: {
      roleId: role.id,
      userId: input.id,
    },
  });
}

async function syncNormalizedUserSecuritySettings(
  db: DbExecutor,
  input: {
    actionConfirmationEnabled?: boolean | null;
    autoLogoutMinutes?: number | string | null;
    id: string;
    twoFactorEnabled?: boolean | null;
  },
) {
  const actionConfirmationEnabled = input.actionConfirmationEnabled ?? true;
  const autoLogoutMinutes = normalizeAutoLogoutMinutes(input.autoLogoutMinutes);
  const twoFactorEnabled = input.twoFactorEnabled ?? false;

  return db.userSecuritySettings.upsert({
    where: { userId: input.id },
    update: {
      actionConfirmationEnabled,
      autoLogoutMinutes,
      twoFactorEnabled,
    },
    create: {
      actionConfirmationEnabled,
      autoLogoutMinutes,
      twoFactorEnabled,
      userId: input.id,
    },
  });
}

async function loadSerializedUser(userId: string): Promise<SerializedUserRecord> {
  return getDb().user.findUniqueOrThrow({
    include: serializedUserInclude,
    where: { id: userId },
  });
}

async function loadAuthUser(userId: string): Promise<AuthUserRecord> {
  return getDb().user.findUniqueOrThrow({
    include: authUserInclude,
    where: { id: userId },
  });
}

async function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return {
    hash: derivedKey.toString("hex"),
    salt,
  };
}

async function verifyPassword(password: string, salt: string, expectedHash: string) {
  const actual = await hashPassword(password, salt);
  const actualBuffer = Buffer.from(actual.hash, "hex");
  const expectedBuffer = Buffer.from(expectedHash, "hex");
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function maybeEncrypt(value: string) {
  return config.APP_SECRET_KEY.trim() ? encryptSecret(value, config.APP_SECRET_KEY) : null;
}

function resolvePrimaryRole(
  assignments:
    | Array<{
        role: {
          key: string;
        };
      }>
    | null
    | undefined,
) {
  const assignedKeys = new Set(assignments?.map((item) => normalizeRoleKey(item.role.key)) ?? []);
  return ROLE_PRIORITY.find((roleKey) => assignedKeys.has(roleKey)) ?? null;
}

function normalizeRoleKey(value?: string | null): RoleKey {
  const normalized = value?.trim().toUpperCase();
  return ROLE_PRIORITY.find((roleKey) => roleKey === normalized) ?? "USER";
}

function normalizeLocale(value?: string | null, fallback = DEFAULT_LOCALE) {
  const normalized = value?.trim().toLowerCase();
  if (normalized && SUPPORTED_LOCALES.has(normalized)) {
    return normalized;
  }
  return fallback;
}

function normalizeTimezone(value?: string | null, fallback = config.TIMEZONE) {
  const normalizedFallback = TIMEZONE_ALIASES[fallback] ?? fallback;
  const candidate = TIMEZONE_ALIASES[value?.trim() ?? ""] ?? value?.trim();
  if (!candidate) {
    return normalizedFallback;
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(new Date());
    return candidate;
  } catch {
    return normalizedFallback;
  }
}

function normalizeCurrencyCode(value?: number | string | null, fallback = DEFAULT_CURRENCY_CODE) {
  const numeric = typeof value === "string" && value.trim() ? Number(value) : typeof value === "number" ? value : NaN;
  return Number.isFinite(numeric) ? Number(numeric) : fallback;
}

function normalizeNumberFormat(value?: string | null, fallback = DEFAULT_NUMBER_FORMAT) {
  const normalized = value?.trim().toUpperCase();
  if (normalized && SUPPORTED_NUMBER_FORMATS.has(normalized)) {
    return normalized;
  }
  return fallback;
}

function normalizeAutoLogoutMinutes(value?: number | string | null, fallback = DEFAULT_AUTO_LOGOUT_MINUTES) {
  const numeric = typeof value === "string" && value.trim() ? Number(value) : typeof value === "number" ? value : NaN;
  return Number.isFinite(numeric) && SUPPORTED_AUTO_LOGOUT_MINUTES.has(Number(numeric)) ? Number(numeric) : fallback;
}

function firstHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
