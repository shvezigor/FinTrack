import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import Fastify from "fastify";
import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { access, mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Prisma } from "@prisma/client";
import {
  answerFinanceQuestion,
  backfillMonobankStatement,
  backfillMonobankStatementRange,
  buildTelegramReport,
  config,
  configureAiProvider,
  cleanupExpiredSecurityRecords,
  changeUserPassword,
  connectMonobankUser,
  getBudgetInsights,
  addGoalContribution,
  addLiabilityPayment,
  authenticatePassword,
  consumeGoogleOAuthState,
  createBudget,
  deleteBudget,
  createCategory,
  createFinancialAccount,
  createGoal,
  createGoogleOAuthState,
  deleteExpense,
  createIncome,
  createLiability,
  createManualExpense,
  deleteIncome,
  deleteLiability,
  deleteUserAccount,
  enableMonobankWebhookForUser,
  deleteCategory,
  deleteFinancialAccount,
  enqueueMonobankStatementBackfillRange,
  enqueueJob,
  exportExpensesToGoogleSheets,
  exportUserData,
  finishGoogleOAuth,
  generateGoalImage,
  getAdminWorkspaceData,
  getAuthProfile,
  getAiProviderSettings,
  getCategoryLookup,
  getCategoryTemplates,
  importCategoryTemplates,
  getConfiguredStatus,
  getDashboardOverview,
  getExchangeRates,
  getFinanceWorkspaceData,
  getTelegramAdminSettings,
  getExpenses,
  getNeedsReview,
  getDb,
  listUserSecrets,
  listUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  registerPasswordUser,
  requestPasswordReset,
  verifyPasswordResetToken,
  resetPasswordWithToken,
  revokeSession,
  revokeUserSecret,
  saveTelegramAdminSettings,
  shouldUseTelegramPolling,
  testOpenAI,
  updateBudget,
  updateCategory,
  updateFinancialAccount,
  updateGoal,
  updateIncome,
  updateLiability,
  updateManualExpense,
  updateNotificationPreference,
  updateUserSecuritySettings,
  updateUserProfile,
  upsertUserSecret,
  upsertMonobankWebhookPayload,
  enableTelegramWebhook,
  quickRange,
  writeAuditLog,
} from "@resource-manager/server";
import { redactSecrets } from "@resource-manager/shared";
import { getRequestUserId, requireDashboardAdmin, requireDashboardAuth } from "./auth.js";
import { createFinanceBot as createTelegramFinanceBot } from "./bot.js";

const app = Fastify({
  logger: {
    redact: ["req.headers.authorization", "req.headers.x-dashboard-password"],
  },
});

await app.register(cors, {
  credentials: true,
  origin: true,
});

await app.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

let financeBot: Awaited<ReturnType<typeof createTelegramFinanceBot>> = null;
const sessionMaxAgeSeconds = 30 * 24 * 60 * 60;
let lastSecurityCleanupAt = 0;
let telegramRuntimeGeneration = 0;
const avatarMimeExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const uploadRoot = path.resolve(config.UPLOAD_DIR);
const avatarUploadDir = path.join(uploadRoot, "avatars");
const goalUploadDir = path.join(uploadRoot, "goals");

app.get("/health", async () => ({
  ok: true,
  service: "resource-manager-api",
}));

app.addHook("onRequest", async (request) => {
  if (Date.now() - lastSecurityCleanupAt > 60_000) {
    lastSecurityCleanupAt = Date.now();
    await cleanupExpiredSecurityRecords().catch(() => undefined);
  }
  const sessionCookie = request.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${config.SESSION_COOKIE_NAME}=`))
    ?.slice(config.SESSION_COOKIE_NAME.length + 1);

  if (sessionCookie && !request.headers.authorization) {
    request.headers.authorization = `Bearer ${decodeURIComponent(sessionCookie)}`;
  }
});

app.post("/api/auth/login", async (request, reply) => {
  const body = request.body as { email?: string; password?: string };
  if (!body.email?.trim() || !body.password) {
    return reply.status(400).send({ error: "email and password are required" });
  }

  const session = await authenticatePassword(body.email, body.password);
  if (!session) {
    return reply.status(401).send({ error: "Invalid email or password" });
  }

  reply.header("Set-Cookie", buildSessionCookie(session.sessionToken));
  await logRequestAction(request, {
    action: "auth.login",
    entityType: "user",
    entityId: session.user.id,
    userId: session.user.id,
  });
  return {
    user: session.user,
  };
});

app.post("/api/auth/register", async (request, reply) => {
  const body = request.body as { email?: string; locale?: string; name?: string; password?: string; timezone?: string };
  if (!body.email?.trim() || !body.password) {
    return reply.status(400).send({ error: "email and password are required" });
  }

  try {
    const session = await registerPasswordUser({
      email: body.email,
      locale: body.locale,
      name: body.name,
      password: body.password,
      timezone: body.timezone,
    });
    reply.header("Set-Cookie", buildSessionCookie(session.sessionToken));
    await logRequestAction(request, {
      action: "auth.register",
      entityType: "user",
      entityId: session.user.id,
      metadata: { email: session.user.email },
      userId: session.user.id,
    });
    return {
      user: session.user,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return reply.status(message.includes("already exists") ? 409 : 400).send({ error: message });
  }
});

app.post("/api/auth/logout", async (request, reply) => {
  const token = request.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const userId = getRequestUserId(request);
  await revokeSession(token);
  reply.header("Set-Cookie", clearSessionCookie());
  if (userId) {
    await logRequestAction(request, {
      action: "auth.logout",
      entityType: "user",
      entityId: userId,
      userId,
    });
  }
  return { ok: true };
});

app.post("/api/auth/password-reset", async (request, reply) => {
  const body = request.body as { email?: string };
  if (!body.email?.trim()) {
    return reply.status(400).send({ error: "email is required" });
  }

  try {
    await requestPasswordReset(body.email);
    // Always return success for security reasons
    return { sent: true };
  } catch (error) {
    return reply.status(400).send({ error: "Failed to request password reset" });
  }
});

app.get("/api/auth/password-reset/verify", async (request, reply) => {
  const query = request.query as { token?: string };
  const token = query.token;
  if (!token) {
    return reply.status(400).send({ error: "token is required" });
  }

  const user = await verifyPasswordResetToken(token);
  if (!user) {
    return reply.status(401).send({ error: "Invalid or expired reset token" });
  }

  return {
    valid: true,
    email: user.email,
  };
});

app.post("/api/auth/password-reset/confirm", async (request, reply) => {
  const body = request.body as { token?: string; password?: string };
  if (!body.token?.trim() || !body.password) {
    return reply.status(400).send({ error: "token and password are required" });
  }

  try {
    const session = await resetPasswordWithToken(body.token, body.password);
    reply.header("Set-Cookie", buildSessionCookie(session.sessionToken));
    await logRequestAction(request, {
      action: "auth.password_reset",
      entityType: "user",
      entityId: session.user.id,
      userId: session.user.id,
    });
    return {
      user: session.user,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Password reset failed";
    return reply.status(400).send({ error: message });
  }
});

app.get("/api/auth/me", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  return getAuthProfile(getRequestUserId(request)!);
});

app.get("/api/admin/overview", async (request, reply) => {
  if (!(await requireDashboardAdmin(request, reply))) return;
  return getAdminWorkspaceData();
});

app.get("/api/admin/telegram", async (request, reply) => {
  if (!(await requireDashboardAdmin(request, reply))) return;
  return getTelegramAdminSettings();
});

app.patch("/api/admin/telegram", async (request, reply) => {
  if (!(await requireDashboardAdmin(request, reply))) return;
  try {
    const userId = getRequestUserId(request)!;
    const body = request.body as {
      adminTelegramUserIds?: string | string[];
      botToken?: string;
      botUsername?: string | null;
    };
    const adminTelegramUserIds =
      body.adminTelegramUserIds === undefined
        ? undefined
        : Array.isArray(body.adminTelegramUserIds)
          ? body.adminTelegramUserIds
          : body.adminTelegramUserIds
              .split(/[,\n]/)
              .map((item) => item.trim())
              .filter(Boolean);

    const settings = await saveTelegramAdminSettings({
      adminTelegramUserIds,
      botToken: body.botToken?.trim() ? body.botToken : undefined,
      botUsername: body.botUsername ?? undefined,
    });
    await reloadTelegramBotRuntime();
    await logRequestAction(request, {
      action: "admin.telegram.updated",
      entityType: "appSetting",
      metadata: {
        adminTelegramUserIds,
        botUsername: body.botUsername?.trim() ?? null,
        updatedToken: Boolean(body.botToken?.trim()),
      },
      userId,
    });
    return settings;
  } catch (error) {
    return reply.status(400).send({ error: error instanceof Error ? error.message : "Telegram settings update failed" });
  }
});

app.post("/api/admin/telegram/webhook-enable", async (request, reply) => {
  if (!(await requireDashboardAdmin(request, reply))) return;
  try {
    const result = await enableTelegramWebhook();
    await logRequestAction(request, {
      action: "admin.telegram.webhook_enabled",
      entityType: "appSetting",
      metadata: { webhookUrl: result.webhookUrl },
      userId: getRequestUserId(request),
    });
    return result;
  } catch (error) {
    return reply.status(400).send({ error: error instanceof Error ? error.message : "Telegram webhook enable failed" });
  }
});

app.patch("/api/profile", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  try {
    const userId = getRequestUserId(request)!;
    const result = await updateUserProfile(userId, request.body as Parameters<typeof updateUserProfile>[1]);
    await logRequestAction(request, {
      action: "profile.updated",
      entityType: "user",
      entityId: userId,
      metadata: {
        changedFields: Object.keys((request.body as Record<string, unknown>) ?? {}),
      },
      userId,
    });
    return result;
  } catch (error) {
    return reply.status(400).send({ error: error instanceof Error ? error.message : "Profile update failed" });
  }
});

app.post("/api/profile/avatar", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  try {
    const userId = getRequestUserId(request)!;
    const file = await request.file();
    if (!file) {
      return reply.status(400).send({ error: "Avatar file is required" });
    }

    const extension = avatarMimeExtensions[file.mimetype];
    if (!extension) {
      return reply.status(415).send({ error: "Only JPG, PNG or WebP images are supported" });
    }

    const buffer = await file.toBuffer();
    if (!buffer.length) {
      return reply.status(400).send({ error: "Avatar file is empty" });
    }

    await mkdir(avatarUploadDir, { recursive: true });
    const currentUser = await getDb().user.findUnique({
      select: { avatarUrl: true },
      where: { id: userId },
    });
    const fileName = `${userId}-${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
    const filePath = path.join(avatarUploadDir, fileName);
    await writeFile(filePath, buffer, { flag: "wx" });

    const avatarUrl = avatarUrlFor(fileName);
    await getDb().user.update({
      data: { avatarUrl },
      where: { id: userId },
    });
    await deletePreviousLocalAvatar(userId, currentUser?.avatarUrl);
    await logRequestAction(request, {
      action: "profile.avatar.updated",
      entityType: "user",
      entityId: userId,
      metadata: {
        mimeType: file.mimetype,
        size: buffer.length,
      },
      userId,
    });
    return { avatarUrl };
  } catch (error) {
    request.log.error(redactSecrets(error));
    return reply.status(400).send({ error: error instanceof Error ? error.message : "Avatar upload failed" });
  }
});

app.post("/api/goals/image", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  try {
    const userId = getRequestUserId(request)!;
    const file = await request.file();
    if (!file) {
      return reply.status(400).send({ error: "Goal image is required" });
    }

    const extension = avatarMimeExtensions[file.mimetype];
    if (!extension) {
      return reply.status(415).send({ error: "Only JPG, PNG or WebP images are supported" });
    }

    const buffer = await file.toBuffer();
    if (!buffer.length) {
      return reply.status(400).send({ error: "Goal image is empty" });
    }

    await mkdir(goalUploadDir, { recursive: true });
    const fileName = `${userId}-goal-${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
    const filePath = path.join(goalUploadDir, fileName);
    await writeFile(filePath, buffer, { flag: "wx" });

    await logRequestAction(request, {
      action: "goal.image.uploaded",
      entityType: "goalImage",
      entityId: fileName,
      metadata: {
        mimeType: file.mimetype,
        size: buffer.length,
      },
      userId,
    });
    return { imageUrl: goalImageUrlFor(fileName) };
  } catch (error) {
    request.log.error(redactSecrets(error));
    return reply.status(400).send({ error: error instanceof Error ? error.message : "Goal image upload failed" });
  }
});

app.patch("/api/profile/security", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  try {
    const userId = getRequestUserId(request)!;
    const result = await updateUserSecuritySettings(userId, request.body as Parameters<typeof updateUserSecuritySettings>[1]);
    await logRequestAction(request, {
      action: "profile.security.updated",
      entityType: "userSecuritySettings",
      entityId: userId,
      metadata: {
        changedFields: Object.keys((request.body as Record<string, unknown>) ?? {}),
      },
      userId,
    });
    return result;
  } catch (error) {
    return reply.status(400).send({ error: error instanceof Error ? error.message : "Security settings update failed" });
  }
});

app.post("/api/profile/password-change", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  try {
    const userId = getRequestUserId(request)!;
    const body = request.body as { currentPassword?: string; newPassword?: string };
    if (!body.newPassword) {
      return reply.status(400).send({ error: "newPassword is required" });
    }
    const result = await changeUserPassword(userId, {
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    });
    await logRequestAction(request, {
      action: "profile.password.changed",
      entityType: "passwordCredential",
      entityId: userId,
      userId,
    });
    return result;
  } catch (error) {
    return reply.status(400).send({ error: error instanceof Error ? error.message : "Password change failed" });
  }
});

app.patch("/api/notifications/:key", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const params = request.params as { key: string };
  const body = request.body as { enabled?: boolean };
  const userId = getRequestUserId(request)!;
  const result = await updateNotificationPreference(userId, params.key, Boolean(body.enabled));
  await logRequestAction(request, {
    action: "profile.notifications.updated",
    entityType: "notificationPreference",
    metadata: { enabled: result.enabled, key: result.key },
    userId,
  });
  return result;
});

app.get("/api/notifications/feed", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const userId = getRequestUserId(request)!;
  return {
    notifications: await listUserNotifications(userId, 20),
  };
});

app.post("/api/notifications/feed/read-all", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const userId = getRequestUserId(request)!;
  await markAllNotificationsRead(userId);
  await logRequestAction(request, {
    action: "notifications.read_all",
    entityType: "userNotification",
    userId,
  });
  return { ok: true };
});

app.post("/api/notifications/feed/:id/read", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const userId = getRequestUserId(request)!;
  const params = request.params as { id: string };
  await markNotificationRead(userId, params.id);
  await logRequestAction(request, {
    action: "notifications.read_one",
    entityType: "userNotification",
    entityId: params.id,
    userId,
  });
  return { ok: true };
});

app.get("/api/auth/google/start", async (request, reply) => {
  if (!config.GOOGLE_OAUTH_CLIENT_ID || !config.GOOGLE_OAUTH_CLIENT_SECRET) {
    return reply.redirect(`${config.DASHBOARD_PUBLIC_URL}?authError=google_not_configured`);
  }

  const query = request.query as { redirectTo?: string };
  const state = await createGoogleOAuthState(query.redirectTo);
  const redirectUri = `${config.APP_BASE_URL}/api/auth/google/callback`;
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("client_id", config.GOOGLE_OAUTH_CLIENT_ID);
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  return reply.redirect(url.toString());
});

app.get("/api/auth/google/callback", async (request, reply) => {
  const query = request.query as { code?: string; state?: string };
  if (!query.code || !query.state) {
    return reply.redirect(`${config.DASHBOARD_PUBLIC_URL}?authError=google_missing_code`);
  }

  const state = await consumeGoogleOAuthState(query.state);
  if (!state) {
    return reply.redirect(`${config.DASHBOARD_PUBLIC_URL}?authError=google_invalid_state`);
  }

  try {
    const redirectUri = `${config.APP_BASE_URL}/api/auth/google/callback`;
    const session = await finishGoogleOAuth(query.code, redirectUri);
    const redirectTo = state.redirectTo || config.DASHBOARD_PUBLIC_URL;
    reply.header("Set-Cookie", buildSessionCookie(session.sessionToken));
    return reply.redirect(redirectTo);
  } catch (error) {
    app.log.error(redactSecrets(error));
    return reply.redirect(`${config.DASHBOARD_PUBLIC_URL}?authError=google_failed`);
  }
});

app.get("/api/dashboard/overview", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  return {
    ...(await getDashboardOverview()),
    connections: await getConfiguredStatus(),
  };
});

app.get("/api/dashboard/snapshot", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  return getFinanceWorkspaceData(getRequestUserId(request));
});

app.get("/api/exchange-rates", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const query = request.query as { codes?: string };
  const codes = query.codes?.split(",").map((code) => code.trim()).filter(Boolean);
  return {
    rates: await getExchangeRates(codes?.length ? codes : ["USD", "EUR"]),
  };
});

app.get("/api/expenses", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  return getExpenses(100, getRequestUserId(request));
});

app.post("/api/expenses", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const body = request.body as Parameters<typeof createManualExpense>[0];
  return createManualExpense({ ...body, userId: getRequestUserId(request) });
});

app.patch("/api/expenses/:id", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const params = request.params as { id: string };
  const body = request.body as Parameters<typeof updateManualExpense>[1];
  return updateManualExpense(params.id, { ...body, userId: getRequestUserId(request) });
});

app.delete("/api/expenses/:id", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const params = request.params as { id: string };
  return deleteExpense(params.id, getRequestUserId(request));
});

app.post("/api/incomes", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const body = request.body as Parameters<typeof createIncome>[0];
  return createIncome({ ...body, userId: getRequestUserId(request) });
});

app.patch("/api/incomes/:id", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const params = request.params as { id: string };
  const body = request.body as Parameters<typeof updateIncome>[1];
  return updateIncome(params.id, { ...body, userId: getRequestUserId(request) });
});

app.delete("/api/incomes/:id", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const params = request.params as { id: string };
  return deleteIncome(params.id, getRequestUserId(request));
});

app.post("/api/budgets", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const body = request.body as Parameters<typeof createBudget>[0];
  const userId = getRequestUserId(request);
  const budget = await createBudget({ ...body, userId });
  await writeAuditLog({
    action: "budget.created",
    context: {
      ipAddress: request.ip,
      userAgent: request.headers["user-agent"] ?? null,
    },
    entityId: budget.id,
    entityType: "budget",
    metadata: {
      categoryId: budget.categoryId,
      limit: budget.limit,
      month: budget.month,
      name: budget.name,
    },
    userId,
  });
  return budget;
});

app.get("/api/budgets/insights", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  return getBudgetInsights(getRequestUserId(request));
});

app.patch("/api/budgets/:id", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const params = request.params as { id: string };
  const body = request.body as Parameters<typeof updateBudget>[1];
  const userId = getRequestUserId(request);
  const budget = await updateBudget(params.id, { ...body, userId });
  await writeAuditLog({
    action: "budget.updated",
    context: {
      ipAddress: request.ip,
      userAgent: request.headers["user-agent"] ?? null,
    },
    entityId: budget.id,
    entityType: "budget",
    metadata: {
      categoryId: budget.categoryId,
      limit: budget.limit,
      month: budget.month,
      name: budget.name,
    },
    userId,
  });
  return budget;
});

app.delete("/api/budgets/:id", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const params = request.params as { id: string };
  const userId = getRequestUserId(request);
  const result = await deleteBudget(params.id, userId);
  await writeAuditLog({
    action: "budget.deleted",
    context: {
      ipAddress: request.ip,
      userAgent: request.headers["user-agent"] ?? null,
    },
    entityId: params.id,
    entityType: "budget",
    metadata: {
      name: request.headers["x-budget-name"] ?? null,
    },
    userId,
  });
  return result;
});

app.post("/api/goals", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const userId = getRequestUserId(request)!;
  const body = request.body as Parameters<typeof createGoal>[0];
  let imageUrl = body.imageUrl;

  if (!imageUrl && body.name?.trim()) {
    try {
      imageUrl = await createGeneratedGoalImageUrl({
        description: body.description,
        title: body.name,
        userId,
      });
      await logRequestAction(request, {
        action: "goal.image.generated",
        entityType: "goalImage",
        metadata: {
          generated: true,
          goalName: body.name,
        },
        userId,
      });
    } catch (error) {
      request.log.warn(
        `Goal image generation failed, continuing without image: ${
          error instanceof Error ? redactSecrets(error.message) : "unknown error"
        }`,
      );
    }
  }

  return createGoal({ ...body, imageUrl, userId });
});

app.post("/api/goals/:id/generate-image", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const params = request.params as { id: string };
  const userId = getRequestUserId(request)!;

  try {
    const goal = await getDb().goal.findFirst({
      select: {
        description: true,
        id: true,
        name: true,
      },
      where: {
        id: params.id,
        userId,
      },
    });

    if (!goal) {
      return reply.status(404).send({ error: "Goal not found" });
    }

    const imageUrl = await createGeneratedGoalImageUrl({
      description: goal.description,
      title: goal.name,
      userId,
    });

    const updatedGoal = await updateGoal(params.id, {
      imageUrl,
      userId,
    });

    await logRequestAction(request, {
      action: "goal.image.generated",
      entityType: "goal",
      entityId: params.id,
      metadata: {
        generated: true,
        goalName: goal.name,
      },
      userId,
    });

    return updatedGoal;
  } catch (error) {
    request.log.warn(
      `Goal image generation failed: ${
        error instanceof Error ? redactSecrets(error.message) : "unknown error"
      }`,
    );
    return reply.status(400).send({
      error:
        error instanceof Error
          ? redactSecrets(error.message)
          : "Goal image generation failed",
    });
  }
});

app.patch("/api/goals/:id", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const params = request.params as { id: string };
  const body = request.body as Parameters<typeof updateGoal>[1];
  return updateGoal(params.id, { ...body, userId: getRequestUserId(request) });
});

app.post("/api/goals/:id/contributions", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const params = request.params as { id: string };
  const body = request.body as { amount?: number | string; note?: string };
  if (!body.amount) {
    return reply.status(400).send({ error: "amount is required" });
  }
  return addGoalContribution(params.id, body.amount, getRequestUserId(request), body.note);
});

app.post("/api/liabilities", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const body = request.body as Parameters<typeof createLiability>[0];
  return createLiability({ ...body, userId: getRequestUserId(request) });
});

app.patch("/api/liabilities/:id", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const params = request.params as { id: string };
  const body = request.body as Parameters<typeof updateLiability>[1];
  return updateLiability(params.id, { ...body, userId: getRequestUserId(request) });
});

app.delete("/api/liabilities/:id", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const params = request.params as { id: string };
  return deleteLiability(params.id, getRequestUserId(request));
});

app.post("/api/liabilities/:id/payments", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const params = request.params as { id: string };
  const body = request.body as Parameters<typeof addLiabilityPayment>[1];
  return addLiabilityPayment(params.id, { ...body, userId: getRequestUserId(request) });
});

app.post("/api/accounts", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const body = request.body as Parameters<typeof createFinancialAccount>[0];
  return createFinancialAccount({ ...body, userId: getRequestUserId(request) });
});

app.patch("/api/accounts/:id", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const params = request.params as { id: string };
  const body = request.body as Parameters<typeof updateFinancialAccount>[1];
  return updateFinancialAccount(params.id, { ...body, userId: getRequestUserId(request) });
});

app.delete("/api/accounts/:id", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const params = request.params as { id: string };
  return deleteFinancialAccount(params.id, getRequestUserId(request));
});

app.post("/api/categories", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const body = request.body as Parameters<typeof createCategory>[0];
  return createCategory({ ...body, userId: getRequestUserId(request) });
});

app.patch("/api/categories/:id", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const params = request.params as { id: string };
  const body = request.body as Parameters<typeof updateCategory>[1];
  return updateCategory(params.id, { ...body, userId: getRequestUserId(request) });
});

app.delete("/api/categories/:id", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const params = request.params as { id: string };
  return deleteCategory(params.id, getRequestUserId(request));
});

app.get("/api/needs-review", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  return getNeedsReview(getRequestUserId(request));
});

app.get("/api/categories", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  return getCategoryLookup(getRequestUserId(request));
});

app.get("/api/category-templates", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  return getCategoryTemplates(getRequestUserId(request));
});

app.post("/api/category-templates/import", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const userId = getRequestUserId(request);
  if (!userId) return reply.status(401).send({ error: "Unauthorized" });
  const { slugs } = request.body as { slugs: string[] };
  if (!Array.isArray(slugs) || slugs.length === 0) return reply.status(400).send({ error: "No slugs provided" });
  return importCategoryTemplates(userId, slugs);
});

app.get("/api/privacy/export", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const userId = getRequestUserId(request)!;
  const payload = await exportUserData(userId);
  await logRequestAction(request, {
    action: "privacy.export_requested",
    entityType: "user",
    entityId: userId,
    metadata: { format: "json" },
    userId,
  });
  reply.header("Content-Disposition", `attachment; filename="fintrack-export-${userId}.json"`);
  return payload;
});

app.delete("/api/privacy/account", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const userId = getRequestUserId(request)!;
  const body = request.body as { confirmation?: string };
  if ((body.confirmation ?? "").trim().toUpperCase() !== "DELETE") {
    return reply.status(400).send({ error: "confirmation must equal DELETE" });
  }
  const result = await deleteUserAccount(userId);
  reply.header("Set-Cookie", clearSessionCookie());
  return result;
});

app.get("/api/secrets", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  return {
    secrets: await listUserSecrets(getRequestUserId(request)!),
  };
});

app.post("/api/secrets", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  try {
    const userId = getRequestUserId(request)!;
    const body = request.body as { keyName?: string; label?: string; provider?: string; value?: string };
    const secret = await upsertUserSecret({
      keyName: body.keyName ?? "",
      label: body.label,
      provider: body.provider ?? "",
      userId,
      value: body.value ?? "",
    });
    await logRequestAction(request, {
      action: "secret.upserted",
      entityType: "userSecret",
      entityId: `${secret.provider}:${secret.keyName}`,
      metadata: { keyName: secret.keyName, provider: secret.provider },
      userId,
    });
    return secret;
  } catch (error) {
    return reply.status(400).send({ error: error instanceof Error ? error.message : "Secret save failed" });
  }
});

app.delete("/api/secrets/:provider/:keyName", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  try {
    const userId = getRequestUserId(request)!;
    const params = request.params as { keyName: string; provider: string };
    const secret = await revokeUserSecret(userId, params.provider, params.keyName);
    await logRequestAction(request, {
      action: "secret.revoked",
      entityType: "userSecret",
      entityId: `${secret.provider}:${secret.keyName}`,
      metadata: { keyName: secret.keyName, provider: secret.provider },
      userId,
    });
    return secret;
  } catch (error) {
    return reply.status(400).send({ error: error instanceof Error ? error.message : "Secret revoke failed" });
  }
});

app.get("/api/ai/settings", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  return getAiProviderSettings(getRequestUserId(request)!);
});

app.post("/api/ai/settings", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  try {
    const userId = getRequestUserId(request)!;
    const body = request.body as { apiKey?: string; keyMode?: string; provider?: string };
    const settings = await configureAiProvider({
      apiKey: body.apiKey,
      keyMode: body.keyMode ?? "SYSTEM",
      provider: body.provider ?? "OPENAI",
      userId,
    });
    if (!settings) {
      return reply.status(400).send({ error: "AI settings update failed" });
    }
    await logRequestAction(request, {
      action: "ai.settings.updated",
      entityType: "integrationConnection",
      metadata: {
        connected: settings.connected,
        keyMode: settings.keyMode,
        provider: settings.provider,
      },
      userId,
    });
    return settings;
  } catch (error) {
    app.log.error(redactSecrets(error));
    return reply.status(400).send({ error: error instanceof Error ? error.message : "AI settings update failed" });
  }
});

app.post("/api/ask", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const body = request.body as { question?: string };
  if (!body.question?.trim()) {
    return reply.status(400).send({ error: "question is required" });
  }
  return { answer: await answerFinanceQuestion(body.question, getRequestUserId(request)) };
});

app.get("/api/reports/expenses", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  return {
    text: await buildTelegramReport(
      { categoryName: (request.query as { category?: string }).category ?? null, kind: "report", range: rangeFromQuery(request.query), reportType: "EXPENSES" },
      getRequestUserId(request),
    ),
  };
});

app.get("/api/reports/incomes", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  return {
    text: await buildTelegramReport(
      { kind: "report", range: rangeFromQuery(request.query), reportType: "INCOMES" },
      getRequestUserId(request),
    ),
  };
});

app.get("/api/reports/categories", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  return {
    text: await buildTelegramReport(
      { kind: "report", range: rangeFromQuery(request.query), reportType: "CATEGORIES" },
      getRequestUserId(request),
    ),
  };
});

app.get("/api/reports/balance", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  return {
    text: await buildTelegramReport(
      { kind: "report", range: rangeFromQuery(request.query), reportType: "BALANCE" },
      getRequestUserId(request),
    ),
  };
});

app.get("/api/transactions/latest", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  const query = request.query as { limit?: string };
  const limit = query.limit ? Number(query.limit) : 10;
  return {
    text: await buildTelegramReport(
      { kind: "report", limit: Number.isFinite(limit) ? limit : 10, range: quickRange("this_month"), reportType: "LATEST" },
      getRequestUserId(request),
    ),
  };
});

app.get("/api/summary/monthly", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  return {
    text: await buildTelegramReport(
      { kind: "report", range: rangeFromQuery(request.query), reportType: "MONTHLY_SUMMARY" },
      getRequestUserId(request),
    ),
  };
});

app.post("/api/sync/google-sheets", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  await enqueueJob("export_google_sheets", { userId: getRequestUserId(request) });
  return { queued: true };
});

app.post("/api/export/expenses/google-sheets", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  try {
    const userId = getRequestUserId(request)!;
    const body = (request.body as Parameters<typeof exportExpensesToGoogleSheets>[1]) ?? null;
    return {
      exported: await exportExpensesToGoogleSheets(userId, body),
    };
  } catch (error) {
    return reply
      .status(400)
      .send({ error: error instanceof Error ? error.message : "Google Sheets export failed" });
  }
});

app.post("/api/monobank/connect", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  try {
    const userId = getRequestUserId(request)!;
    const body = request.body as { enableWebhook?: boolean; token?: string };
    if (!body.token?.trim()) {
      return reply.status(400).send({ error: "Monobank token is required" });
    }

    const result = await connectMonobankUser({
      enableWebhook: body.enableWebhook,
      token: body.token,
      userId,
    });
    await logRequestAction(request, {
      action: "monobank.connected",
      entityType: "integrationConnection",
      metadata: {
        accountCount: result.accounts.length,
        queuedBackfill: result.queuedBackfill,
        webhookStatus: result.webhook.status,
      },
      userId,
    });
    return result;
  } catch (error) {
    app.log.error(redactSecrets(error));
    return reply.status(400).send({ error: error instanceof Error ? error.message : "Monobank connection failed" });
  }
});

app.post("/api/monobank/sync", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  try {
    const userId = getRequestUserId(request)!;
    const body = (request.body ?? {}) as { from?: string; queue?: boolean; to?: string };
    const hasRange = Boolean(body.from || body.to);
    const from = body.from ? new Date(body.from) : new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    const to = body.to ? new Date(body.to) : new Date();
    const rangeDays = Math.max(1, Math.ceil((to.getTime() - from.getTime() + 1) / (24 * 60 * 60 * 1000)));

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from.getTime() > to.getTime()) {
      return reply.status(400).send({ error: "Invalid Monobank sync period" });
    }

    if (hasRange || body.queue || rangeDays > 31) {
      const queued = await enqueueMonobankStatementBackfillRange({
        from,
        source: "monobank_range_sync",
        to,
        userId,
      });
      await logRequestAction(request, {
        action: "monobank.sync_queued",
        entityType: "integrationConnection",
        metadata: queued,
        userId,
      });
      return { ...queued, synced: false };
    }

    const importedStatementItems = hasRange
      ? await backfillMonobankStatementRange({ from, source: "monobank_range_sync", to, userId })
      : await backfillMonobankStatement(31, userId);
    await logRequestAction(request, {
      action: "monobank.sync_requested",
      entityType: "integrationConnection",
      metadata: {
        from: hasRange ? from.toISOString() : null,
        importedStatementItems,
        to: hasRange ? to.toISOString() : null,
      },
      userId,
    });
    return {
      from: hasRange ? from.toISOString() : null,
      importedStatementItems,
      queued: false,
      synced: true,
      to: hasRange ? to.toISOString() : null,
    };
  } catch (error) {
    app.log.error(redactSecrets(error));
    return reply.status(400).send({ error: error instanceof Error ? error.message : "Monobank sync failed" });
  }
});

app.post("/api/monobank/backfill", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  await enqueueJob("monobank_backfill", { days: 31, userId: getRequestUserId(request) });
  return { queued: true };
});

app.post("/api/monobank/webhook-enable", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  try {
    const result = await enableMonobankWebhookForUser(getRequestUserId(request)!);
    await logRequestAction(request, {
      action: "monobank.webhook_enabled",
      entityType: "integrationConnection",
      metadata: result,
      userId: getRequestUserId(request),
    });
    return result;
  } catch (error) {
    app.log.error(redactSecrets(error));
    return reply.status(400).send({ error: error instanceof Error ? error.message : "Monobank webhook failed" });
  }
});

app.post("/api/test/openai", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  return { result: await testOpenAI(getRequestUserId(request)) };
});

app.post("/api/test/google-sheets", async (request, reply) => {
  if (!(await requireDashboardAuth(request, reply))) return;
  return { exported: await exportExpensesToGoogleSheets(getRequestUserId(request)) };
});

app.get("/webhooks/monobank/:secret", async (request, reply) => {
  const { secret } = request.params as { secret: string };
  if (secret !== (config.MONOBANK_WEBHOOK_SECRET || config.TELEGRAM_WEBHOOK_SECRET || "mono")) {
    return reply.status(404).send();
  }
  return reply.status(200).send("ok");
});

app.post("/webhooks/monobank/:secret", async (request, reply) => {
  const { secret } = request.params as { secret: string };
  if (secret !== (config.MONOBANK_WEBHOOK_SECRET || config.TELEGRAM_WEBHOOK_SECRET || "mono")) {
    return reply.status(404).send();
  }

  reply.status(200).send("ok");
  try {
    await upsertMonobankWebhookPayload(request.body);
  } catch (error) {
    app.log.error(redactSecrets(error));
  }
});

app.post("/webhooks/telegram", async (request, reply) => {
  if (
    config.TELEGRAM_WEBHOOK_SECRET &&
    request.headers["x-telegram-bot-api-secret-token"] !== config.TELEGRAM_WEBHOOK_SECRET
  ) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
  if (!financeBot?.handleUpdate) {
    return reply.status(503).send({ error: "Telegram webhook is not active" });
  }
  return financeBot.handleUpdate(request, reply);
});

app.get("/uploads/avatars/:fileName", async (request, reply) => {
  const params = request.params as { fileName: string };
  if (!isSafeAvatarFileName(params.fileName)) {
    return reply.status(404).send();
  }

  const filePath = path.join(avatarUploadDir, params.fileName);
  if (!filePath.startsWith(`${avatarUploadDir}${path.sep}`)) {
    return reply.status(404).send();
  }

  try {
    await access(filePath);
  } catch {
    return reply.status(404).send();
  }

  reply.type(contentTypeForAvatar(params.fileName));
  return reply.send(createReadStream(filePath));
});

app.get("/uploads/goals/:fileName", async (request, reply) => {
  const params = request.params as { fileName: string };
  if (!isSafeAvatarFileName(params.fileName)) {
    return reply.status(404).send();
  }

  const filePath = path.join(goalUploadDir, params.fileName);
  if (!filePath.startsWith(`${goalUploadDir}${path.sep}`)) {
    return reply.status(404).send();
  }

  try {
    await access(filePath);
  } catch {
    return reply.status(404).send();
  }

  reply.type(contentTypeForAvatar(params.fileName));
  return reply.send(createReadStream(filePath));
});

async function shutdown() {
  await getDb().$disconnect();
  await app.close();
}

function buildSessionCookie(token: string) {
  const secure = config.DASHBOARD_PUBLIC_URL.startsWith("https://");
  return [
    `${config.SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${sessionMaxAgeSeconds}`,
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function clearSessionCookie() {
  const secure = config.DASHBOARD_PUBLIC_URL.startsWith("https://");
  return [
    `${config.SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

async function logRequestAction(
  request: Parameters<typeof requireDashboardAuth>[0],
  input: {
    action: string;
    entityId?: string;
    entityType?: string;
    metadata?: Prisma.InputJsonValue;
    userId?: string;
  },
) {
  await writeAuditLog({
    action: input.action,
    context: {
      ipAddress: request.ip,
      userAgent: request.headers["user-agent"] ?? null,
    },
    entityId: input.entityId,
    entityType: input.entityType,
    metadata: input.metadata,
    userId: input.userId,
  });
}

function avatarUrlFor(fileName: string) {
  const baseUrl = (config.PUBLIC_UPLOAD_BASE_URL || config.APP_BASE_URL).replace(/\/$/, "");
  return `${baseUrl}/uploads/avatars/${encodeURIComponent(fileName)}`;
}

function goalImageUrlFor(fileName: string) {
  const baseUrl = (config.PUBLIC_UPLOAD_BASE_URL || config.APP_BASE_URL).replace(/\/$/, "");
  return `${baseUrl}/uploads/goals/${encodeURIComponent(fileName)}`;
}

async function createGeneratedGoalImageUrl(input: {
  description?: string | null;
  title: string;
  userId: string;
}) {
  const buffer = await generateGoalImage({
    description: input.description,
    title: input.title,
    userId: input.userId,
  });
  await mkdir(goalUploadDir, { recursive: true });
  const fileName = `${input.userId}-goal-ai-${Date.now()}-${randomUUID().slice(0, 8)}.png`;
  const filePath = path.join(goalUploadDir, fileName);
  await writeFile(filePath, buffer, { flag: "wx" });
  return goalImageUrlFor(fileName);
}

async function deletePreviousLocalAvatar(userId: string, avatarUrl?: string | null) {
  const fileName = avatarFileNameFromUrl(avatarUrl);
  if (!fileName || !fileName.startsWith(`${userId}-`)) return;

  try {
    await unlink(path.join(avatarUploadDir, fileName));
  } catch {
    // The old avatar is expendable; a failed cleanup should not block profile updates.
  }
}

function avatarFileNameFromUrl(avatarUrl?: string | null) {
  if (!avatarUrl) return null;
  const marker = "/uploads/avatars/";
  const index = avatarUrl.indexOf(marker);
  if (index < 0) return null;
  const fileName = decodeURIComponent(avatarUrl.slice(index + marker.length).split(/[?#]/)[0] ?? "");
  return isSafeAvatarFileName(fileName) ? fileName : null;
}

function isSafeAvatarFileName(fileName: string) {
  return /^[A-Za-z0-9._-]+$/.test(fileName);
}

function contentTypeForAvatar(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  return "image/jpeg";
}

function rangeFromQuery(queryValue: unknown) {
  const query = queryValue as { from?: string; label?: string; to?: string };
  const fallback = quickRange("this_month");
  const from = query.from ? new Date(query.from) : new Date(fallback.from);
  const to = query.to ? new Date(query.to) : new Date(fallback.to);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    return fallback;
  }

  return {
    from: from.toISOString(),
    label: query.label ?? `${from.toLocaleDateString("uk-UA")} - ${to.toLocaleDateString("uk-UA")}`,
    to: to.toISOString(),
  };
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

await app.listen({ host: "0.0.0.0", port: 3001 });

await reloadTelegramBotRuntime();

async function reloadTelegramBotRuntime() {
  telegramRuntimeGeneration += 1;
  const generation = telegramRuntimeGeneration;
  const previousBot = financeBot;
  const nextBot = await createTelegramFinanceBot();

  if (previousBot && previousBot !== nextBot) {
    try {
      previousBot.bot.stop();
    } catch {
      // Telegram polling shutdown is best-effort during reconfiguration.
    }
  }

  financeBot = nextBot;

  if (financeBot && shouldUseTelegramPolling()) {
    void startTelegramPolling(financeBot, generation);
  }
}

async function startTelegramPolling(currentBot: NonNullable<typeof financeBot>, generation: number) {
  while (true) {
    if (financeBot !== currentBot || generation !== telegramRuntimeGeneration) {
      return;
    }
    try {
      app.log.info("Starting Telegram polling mode");
      await currentBot.bot.api.deleteWebhook({ drop_pending_updates: false });
      await currentBot.bot.start({
        drop_pending_updates: false,
        onStart: (botInfo) => app.log.info(`Telegram polling started for @${botInfo.username}`),
      });
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const delayMs = message.includes("409") ? 35_000 : 10_000;
      try {
        currentBot.bot.stop();
      } catch {
        // Stop is best-effort; the retry loop is the durable behavior.
      }
      app.log.error({ error: message }, `Telegram polling failed; retrying in ${delayMs / 1000}s`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
