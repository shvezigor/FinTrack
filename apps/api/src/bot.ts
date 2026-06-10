import { Bot, InlineKeyboard, Keyboard, webhookCallback } from "grammy";
import { spawn } from "node:child_process";
import {
  adminTelegramUserIds,
  analyzeTelegramFinanceMessage,
  answerFinanceQuestion,
  buildTelegramReport,
  clearTelegramConversationState,
  config,
  deleteSetting,
  ensureDefaultUser,
  getConfiguredStatus,
  getDb,
  getLinkedTelegramAccount,
  getMonobankToken,
  getPlainSetting,
  getSelectedMonobankAccountId,
  getTelegramBotToken,
  getTelegramConversationState,
  linkTelegramAccountFromStartParam,
  quickRange,
  recognizeReceiptImage,
  renderTelegramDraft,
  resolveTelegramConnectUserId,
  saveTelegramOperationDraft,
  selectDefaultMonobankAccount,
  setPlainSetting,
  setSecretSetting,
  setTelegramConversationState,
  shouldUseTelegramPolling,
  testOpenAI,
  touchTelegramAccount,
  transcribeFinanceVoice,
  updateDraftAmount,
  updateDraftCategory,
  updateDraftDate,
  type TelegramConversationPayload,
  type TelegramOperationDraft,
  type TelegramOperationType,
  type TelegramReportType,
} from "@resource-manager/server";
import { maskSecret, normalizeText } from "@resource-manager/shared";

export type FinanceBot = {
  bot: Bot<any>;
  handleUpdate: any | null;
};

const secretSteps = new Set([
  "set_openai_key",
  "set_monobank_token",
  "set_google_service_account_json",
  "set_google_sheet_id",
]);

type BotContext = any;

type TelegramMessageOptions = {
  reply_markup?: InlineKeyboard | Keyboard;
  [key: string]: unknown;
};

const htmlMessageOptions = {
  link_preview_options: { is_disabled: true },
  parse_mode: "HTML" as const,
};

async function replyHtml(ctx: BotContext, text: string, options: TelegramMessageOptions = {}) {
  await ctx.reply(text, { ...htmlMessageOptions, ...options });
}

function escapeTelegramHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function notice(title: string, body?: string) {
  return [`<b>${escapeTelegramHtml(title)}</b>`, body ? `\n${escapeTelegramHtml(body)}` : ""].join("");
}

export async function createFinanceBot(): Promise<FinanceBot | null> {
  const botToken = await getTelegramBotToken();
  if (!botToken) {
    return null;
  }

  const bot = new Bot<any>(botToken);
  const admins = adminTelegramUserIds();

  await bot.api
    .setMyCommands([
      { command: "start", description: "Відкрити меню FinTrack" },
      { command: "help", description: "Підказки та приклади" },
      { command: "today", description: "Витрати за сьогодні" },
      { command: "month", description: "Підсумок за місяць" },
      { command: "ask", description: "Поставити фінансове питання" },
    ])
    .catch(() => undefined);

  bot.catch((error) => {
    console.error("Telegram bot error", error.error);
  });

  bot.use(async (ctx, next) => {
    ctx.state ??= {};
    const telegramUserId = ctx.from?.id?.toString();
    const storedAdmins = await getStoredAdminIds();
    const allowedAdmins = new Set([...admins, ...storedAdmins]);
    const linkedAccount = telegramUserId ? await getLinkedTelegramAccount(telegramUserId) : null;
    const startParam = extractStartParam(ctx.message?.text);
    const pendingLinkUserId = startParam ? resolveTelegramConnectUserId(startParam) : null;
    const isAdmin = Boolean(telegramUserId && allowedAdmins.has(telegramUserId));

    ctx.state.isAdmin = isAdmin;
    ctx.state.linkedWorkspaceUserId = linkedAccount?.userId ?? null;
    ctx.state.pendingLinkUserId = pendingLinkUserId;

    if (!telegramUserId) {
      await replyHtml(ctx, notice("Доступ закритий"));
      return;
    }

    await touchTelegramAccount({
      firstName: ctx.from?.first_name ?? null,
      lastName: ctx.from?.last_name ?? null,
      telegramChatId: ctx.chat?.id?.toString() ?? null,
      telegramUserId,
      userId: linkedAccount?.userId ?? null,
      username: ctx.from?.username ?? null,
    }).catch(() => undefined);

    if (isAdmin || linkedAccount?.userId || pendingLinkUserId) {
      await next();
      return;
    }

    const claimText = ctx.message?.text?.trim();
    if (claimText?.startsWith("/claim")) {
      const secret = claimText.replace(/^\/claim(?:@\w+)?\s*/u, "").trim();
      if (allowedAdmins.size === 0 && config.ADMIN_CLAIM_SECRET && secret === config.ADMIN_CLAIM_SECRET) {
        await setPlainSetting("ADMIN_TELEGRAM_USER_IDS", telegramUserId);
        await replyHtml(ctx, notice("Admin-доступ прив'язано", "Тепер можна відкрити /start."));
        return;
      }

      await replyHtml(
        ctx,
        notice(
          "Потрібне підключення",
          "Щоб прив'язати Telegram до свого акаунта, відкрийте бота кнопкою «Додати бота» у вебкабінеті FinTrack.",
        ),
      );
      return;
    }

    if (allowedAdmins.size === 0) {
      await replyHtml(
        ctx,
        notice(
          "Потрібне підключення",
          "Відкрийте бота кнопкою «Додати бота» у вебкабінеті FinTrack. Звичайним користувачам admin-claim не потрібен.",
        ),
      );
      return;
    }
    await replyHtml(ctx, notice("Потрібне підключення", "Спершу відкрийте бота з кабінету FinTrack, щоб прив'язати Telegram до свого акаунта."));
  });

  bot.command("start", async (ctx) => {
    const telegramUserId = ctx.from?.id?.toString();
    const startParam = ctx.match?.trim() || extractStartParam(ctx.message?.text);

    if (telegramUserId && startParam) {
      const linked = await linkTelegramAccountFromStartParam({
        firstName: ctx.from?.first_name ?? null,
        lastName: ctx.from?.last_name ?? null,
        startParam,
        telegramChatId: ctx.chat?.id?.toString() ?? null,
        telegramUserId,
        username: ctx.from?.username ?? null,
      });

      if (linked?.userId) {
        ctx.state.linkedWorkspaceUserId = linked.userId;
        await replyHtml(ctx, notice("Telegram підключено", "Бот прив'язаний до вашого акаунта FinTrack."));
      }
    }

    const workspaceUserId = await resolveWorkspaceUserId(ctx);
    await replyHtml(ctx, await statusText(workspaceUserId), {
      reply_markup: mainReplyKeyboard(),
    });
    await replyHtml(ctx, "<b>Що зробимо?</b>", {
      reply_markup: mainMenu(Boolean(ctx.state?.isAdmin)),
    });
  });

  bot.command("help", async (ctx) => {
    await replyHtml(ctx, helpText(), { reply_markup: mainMenu(Boolean(ctx.state?.isAdmin)) });
  });

  bot.command("settings", async (ctx) => {
    const workspaceUserId = await resolveWorkspaceUserId(ctx);
    if (isAdminContext(ctx)) {
      await replyHtml(ctx, await statusText(workspaceUserId), { reply_markup: setupMenu() });
      return;
    }
    await replyHtml(ctx, notice("Налаштування", "Акаунт, Monobank, OpenAI та Google Sheets доступні у вебкабінеті. У боті можна швидко додавати операції та дивитись звіти."));
  });

  bot.command("setup", async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    if (ctx.chat?.type !== "private") {
      await replyHtml(ctx, notice("Приватний чат", "Налаштування секретів доступне тільки у приватному чаті."));
      return;
    }
    await replyHtml(ctx, "<b>Налаштування</b>", { reply_markup: setupMenu() });
  });

  bot.command("today", async (ctx) => {
    await sendQuickReport(ctx, "EXPENSES", "today");
  });

  bot.command("month", async (ctx) => {
    await sendQuickReport(ctx, "MONTHLY_SUMMARY", "this_month");
  });

  bot.command("review", async (ctx) => {
    const workspaceUserId = await resolveWorkspaceUserId(ctx);
    const count = await getDb().expense.count({
      where: {
        sourceStatus: "NEEDS_REVIEW",
        ...(workspaceUserId ? { userId: workspaceUserId } : {}),
      },
    });
    await replyHtml(ctx, `<b>Перевірка операцій</b>\n\nПотребують уваги: <b>${count}</b>\nДетальний розбір доступний у вебкабінеті.`);
  });

  bot.command("sync", async (ctx) => {
    const workspaceUserId = await resolveWorkspaceUserId(ctx);
    await getDb().job.create({
      data: {
        payloadJson: {},
        type: "export_google_sheets",
        userId: workspaceUserId ?? undefined,
      },
    });
    await replyHtml(ctx, notice("Синхронізацію запущено", "Google Sheets оновиться у фоновому режимі."));
  });

  bot.command("ask", async (ctx) => {
    const question = ctx.match?.trim();
    if (!question) {
      await replyHtml(ctx, "<b>Питання до фінансового помічника</b>\n\nНапишіть питання після команди.\n\n<code>/ask скільки я витратив на їжу цього місяця?</code>");
      return;
    }

    await replyHtml(ctx, "<b>Готую відповідь...</b>");
    const answer = await answerFinanceQuestion(question, await resolveWorkspaceUserId(ctx));
    await replyHtml(ctx, `<b>Відповідь</b>\n\n${escapeTelegramHtml(answer)}`);
  });

  bot.callbackQuery(/^menu:(.+)$/u, async (ctx) => {
    const action = ctx.match?.[1] ?? "";
    await ctx.answerCallbackQuery();
    await handleMenuAction(ctx, action);
  });

  bot.callbackQuery(/^report:([^:]+):([^:]+)$/u, async (ctx) => {
    const reportType = ctx.match?.[1] as TelegramReportType | undefined;
    const rangeKey = ctx.match?.[2] as Parameters<typeof quickRange>[0] | undefined;
    await ctx.answerCallbackQuery("Готую звіт...");
    if (!reportType || !rangeKey) return;
    await sendQuickReport(ctx, reportType, rangeKey);
  });

  bot.callbackQuery(/^draft:(.+)$/u, async (ctx) => {
    const action = ctx.match?.[1] ?? "";
    await ctx.answerCallbackQuery();
    await handleDraftCallback(ctx, action);
  });

  bot.callbackQuery("setup", async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    await ctx.editMessageText("<b>Налаштування</b>", { ...htmlMessageOptions, reply_markup: setupMenu() });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("setup_openai", async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    await ctx.editMessageText("<b>OpenAI</b>", { ...htmlMessageOptions, reply_markup: openAiMenu() });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("setup_monobank", async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    await ctx.editMessageText("<b>Monobank</b>", { ...htmlMessageOptions, reply_markup: monobankMenu() });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("setup_google", async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    await ctx.editMessageText("<b>Google Sheets</b>", { ...htmlMessageOptions, reply_markup: googleMenu() });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("set_openai_key", async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    await beginSecretStep(ctx, "set_openai_key", "Надішліть OpenAI API key наступним повідомленням.");
  });

  bot.callbackQuery("test_openai", async (ctx) => {
    await ctx.answerCallbackQuery("Тестую...");
    const result = await testOpenAI(await resolveWorkspaceUserId(ctx));
    await replyHtml(ctx, `<b>OpenAI тест</b>\n\n${escapeTelegramHtml(result)}`);
  });

  bot.callbackQuery("set_monobank_token", async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    await beginSecretStep(ctx, "set_monobank_token", "Надішліть Monobank token наступним повідомленням.");
  });

  bot.callbackQuery("select_monobank_account", async (ctx) => {
    await ctx.answerCallbackQuery("Обираю...");
    const accountId = await selectDefaultMonobankAccount(await resolveWorkspaceUserId(ctx));
    await replyHtml(ctx, `<b>Основний рахунок вибрано</b>\n\n<code>${escapeTelegramHtml(maskSecret(accountId))}</code>`);
  });

  bot.callbackQuery("sync_monobank", async (ctx) => {
    await ctx.answerCallbackQuery("Запускаю синхронізацію...");
    const workspaceUserId = await resolveWorkspaceUserId(ctx);
    await getDb().job.create({
      data: {
        payloadJson: { days: 7, userId: workspaceUserId },
        type: "monobank_backfill",
      },
    });
    await replyHtml(ctx, notice("Синхронізацію запущено", "Дані Monobank за останні 7 днів оновляться у фоновому режимі."));
  });

  bot.callbackQuery("set_google_json", async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    await beginSecretStep(ctx, "set_google_service_account_json", "Надішліть JSON service account наступним повідомленням.");
  });

  bot.callbackQuery("set_google_sheet_id", async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    await beginSecretStep(ctx, "set_google_sheet_id", "Надішліть spreadsheet ID наступним повідомленням.");
  });

  bot.callbackQuery("delete_openai_key", async (ctx) => {
    if (!(await requireAdmin(ctx))) return;
    await deleteSetting("OPENAI_API_KEY");
    await ctx.answerCallbackQuery("Видалено");
    await replyHtml(ctx, notice("OpenAI key видалено", "Ключ прибрано з encrypted settings."));
  });

  bot.on("message:voice", async (ctx) => {
    await handleVoiceMessage(ctx, botToken);
  });

  bot.on("message:photo", async (ctx) => {
    await handleReceiptPhotoMessage(ctx, botToken);
  });

  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text.trim();
    const setupState = await getActiveSetupState(ctx.chat.id.toString(), ctx.from.id.toString());
    if (setupState && secretSteps.has(setupState.step)) {
      await handleSetupValue(ctx, setupState.step, text);
      return;
    }

    const handled = await handleConversationInput(ctx, text);
    if (handled) return;

    const menuAction = menuActionFromText(text);
    if (menuAction) {
      await handleMenuAction(ctx, menuAction);
      return;
    }

    await handleFreeText(ctx, text);
  });

  return {
    bot,
    handleUpdate: shouldUseTelegramPolling() ? null : webhookCallback(bot, "fastify"),
  };
}

async function handleFreeText(ctx: BotContext, text: string, forcedType?: TelegramOperationType) {
  const workspaceUserId = await resolveWorkspaceUserId(ctx);
  const intent = await analyzeTelegramFinanceMessage({
    forcedType,
    text,
    userId: workspaceUserId,
  });

  if (intent.kind === "unknown") {
    await replyHtml(ctx, `<b>Не зрозумів запит</b>\n\n${escapeTelegramHtml(intent.text)}`, { reply_markup: mainMenu(Boolean(ctx.state?.isAdmin)) });
    return;
  }

  if (intent.kind === "report") {
    await replyHtml(ctx, await buildTelegramReport(intent, workspaceUserId));
    return;
  }

  await storeDraft(ctx, intent.draft);
  await replyHtml(ctx, renderTelegramDraft(intent.draft), {
    reply_markup: draftKeyboard(intent.draft),
  });
}

async function handleConversationInput(ctx: BotContext, text: string) {
  const state = await getTelegramConversationState(ctx.chat.id.toString(), ctx.from.id.toString());
  if (!state) return false;

  const workspaceUserId = await resolveWorkspaceUserId(ctx);
  const payload = state.payload as TelegramConversationPayload;
  const draftAction = draftTextAction(text);

  try {
    if (state.kind === "awaiting_expense_text" || state.kind === "awaiting_income_text") {
      await handleFreeText(ctx, text, payload.forcedType);
      return true;
    }

    if (!payload.draft) {
      await clearTelegramConversationState(ctx.chat.id.toString(), ctx.from.id.toString());
      return false;
    }

    let draft = payload.draft;
    if (state.kind === "draft" && draftAction === "save") {
      const result = await saveTelegramOperationDraft(draft, workspaceUserId, {
        telegramChatId: ctx.chat?.id?.toString() ?? null,
        telegramMessageId: ctx.message?.message_id?.toString() ?? null,
        telegramUserId: ctx.from?.id?.toString() ?? null,
      });
      await clearTelegramConversationState(ctx.chat.id.toString(), ctx.from.id.toString());
      const label = result.type === "EXPENSE" ? "витрату" : "дохід";
      await replyHtml(ctx, `<b>Збережено</b>\n\n${escapeTelegramHtml(label)}: <b>${formatMoney(draft.amount)}</b>`);
      return true;
    }

    if (state.kind === "draft" && draftAction === "cancel") {
      await clearTelegramConversationState(ctx.chat.id.toString(), ctx.from.id.toString());
      await replyHtml(ctx, notice("Скасовано", "Нічого не зберіг."));
      return true;
    }

    if (state.kind === "draft_edit_amount") {
      draft = updateDraftAmount(draft, text);
    } else if (state.kind === "draft_edit_category") {
      draft = await updateDraftCategory(draft, text, workspaceUserId);
    } else if (state.kind === "draft_edit_date") {
      draft = updateDraftDate(draft, text);
    } else {
      return false;
    }

    await storeDraft(ctx, draft);
    await replyHtml(ctx, renderTelegramDraft(draft), { reply_markup: draftKeyboard(draft) });
    return true;
  } catch (error) {
    await replyHtml(ctx, `<b>Не вдалося оновити чернетку</b>\n\n${escapeTelegramHtml(error instanceof Error ? error.message : "Спробуйте ще раз.")}`);
    return true;
  }
}

async function handleDraftCallback(ctx: BotContext, action: string) {
  const state = await getTelegramConversationState(ctx.chat!.id.toString(), ctx.from!.id.toString());
  const draft = state?.payload?.draft;
  const workspaceUserId = await resolveWorkspaceUserId(ctx);

  if (!draft) {
    await replyHtml(ctx, notice("Чернетка неактивна", "Надішліть операцію ще раз."));
    return;
  }

  try {
    if (action === "save") {
      const result = await saveTelegramOperationDraft(draft, workspaceUserId, {
        telegramChatId: ctx.chat?.id?.toString() ?? null,
        telegramMessageId: ctx.callbackQuery?.message?.message_id?.toString() ?? null,
        telegramUserId: ctx.from?.id?.toString() ?? null,
      });
      await clearTelegramConversationState(ctx.chat!.id.toString(), ctx.from!.id.toString());
      const label = result.type === "EXPENSE" ? "витрату" : "дохід";
      await replaceCallbackMessage(ctx, `<b>Збережено</b>\n\n${escapeTelegramHtml(label)}: <b>${formatMoney(draft.amount)}</b>`);
      return;
    }

    if (action === "cancel") {
      await clearTelegramConversationState(ctx.chat!.id.toString(), ctx.from!.id.toString());
      await replaceCallbackMessage(ctx, notice("Скасовано", "Нічого не зберіг."));
      return;
    }

    if (action === "edit_amount") {
      await setTelegramConversationState({
        chatId: ctx.chat!.id.toString(),
        kind: "draft_edit_amount",
        payload: { draft },
        telegramUserId: ctx.from!.id.toString(),
        userId: workspaceUserId,
      });
      await replyHtml(ctx, "<b>Зміна суми</b>\n\nНадішліть нову суму, наприклад: <code>560</code>.");
      return;
    }

    if (action === "edit_category") {
      await setTelegramConversationState({
        chatId: ctx.chat!.id.toString(),
        kind: "draft_edit_category",
        payload: { draft },
        telegramUserId: ctx.from!.id.toString(),
        userId: workspaceUserId,
      });
      await replyHtml(ctx, draft.type === "EXPENSE" ? "<b>Зміна категорії</b>\n\nНапишіть категорію або оберіть кнопкою." : "<b>Зміна джерела</b>\n\nНапишіть джерело доходу.");
      return;
    }

    if (action === "edit_date") {
      await setTelegramConversationState({
        chatId: ctx.chat!.id.toString(),
        kind: "draft_edit_date",
        payload: { draft },
        telegramUserId: ctx.from!.id.toString(),
        userId: workspaceUserId,
      });
      await replyHtml(ctx, "<b>Зміна дати</b>\n\nНапишіть дату: <code>сьогодні</code>, <code>вчора</code> або <code>21/04/2026</code>.");
      return;
    }

    if (action.startsWith("cat:")) {
      const rawIndex = Number(action.slice("cat:".length));
      const suggestion = draft.suggestions[rawIndex];
      if (!suggestion) {
        await replyHtml(ctx, notice("Категорію не знайдено", "Спробуйте ще раз."));
        return;
      }
      const updatedDraft: TelegramOperationDraft = {
        ...draft,
        categoryId: suggestion.categoryId,
        categoryName: suggestion.name,
        confidence: 0.9,
        needsCategory: false,
      };
      await storeDraft(ctx, updatedDraft);
      await replaceCallbackMessage(ctx, renderTelegramDraft(updatedDraft), draftKeyboard(updatedDraft));
    }
  } catch (error) {
    await replyHtml(ctx, `<b>Не вдалося виконати дію</b>\n\n${escapeTelegramHtml(error instanceof Error ? error.message : "Спробуйте ще раз.")}`);
  }
}

async function handleMenuAction(ctx: BotContext, action: string) {
  const workspaceUserId = await resolveWorkspaceUserId(ctx);
  if (action === "add_expense" || action === "add_income") {
    const forcedType: TelegramOperationType = action === "add_income" ? "INCOME" : "EXPENSE";
    await setTelegramConversationState({
      chatId: ctx.chat!.id.toString(),
      kind: forcedType === "EXPENSE" ? "awaiting_expense_text" : "awaiting_income_text",
      payload: { forcedType },
      telegramUserId: ctx.from!.id.toString(),
      userId: workspaceUserId,
    });
    await replyHtml(ctx, forcedType === "EXPENSE" ? "<b>Додати витрату</b>\n\nНапишіть одним повідомленням, наприклад:\n<code>АТБ продукти 560</code>" : "<b>Додати дохід</b>\n\nНапишіть одним повідомленням, наприклад:\n<code>Зарплата 50000</code>");
    return;
  }

  if (action === "expenses_period") {
    await replyHtml(ctx, "<b>Витрати за період</b>\n\nОберіть період:", { reply_markup: periodMenu("EXPENSES") });
    return;
  }

  if (action === "incomes_period") {
    await replyHtml(ctx, "<b>Доходи за період</b>\n\nОберіть період:", { reply_markup: periodMenu("INCOMES") });
    return;
  }

  if (action === "categories") {
    await replyHtml(ctx, await buildTelegramReport({ kind: "report", range: quickRange("this_month"), reportType: "CATEGORIES" }, workspaceUserId));
    return;
  }

  if (action === "balance") {
    await replyHtml(ctx, await buildTelegramReport({ kind: "report", range: quickRange("this_month"), reportType: "BALANCE" }, workspaceUserId));
    return;
  }

  if (action === "latest") {
    await replyHtml(ctx, await buildTelegramReport({ kind: "report", limit: 10, range: quickRange("this_month"), reportType: "LATEST" }, workspaceUserId));
    return;
  }

  if (action === "summary") {
    await replyHtml(ctx, await buildTelegramReport({ kind: "report", range: quickRange("this_month"), reportType: "MONTHLY_SUMMARY" }, workspaceUserId));
    return;
  }

  if (action === "settings") {
    if (isAdminContext(ctx)) {
      await replyHtml(ctx, await statusText(workspaceUserId), { reply_markup: setupMenu() });
    } else {
      await replyHtml(ctx, notice("Налаштування", "Основні налаштування доступні у вебкабінеті. У боті можна швидко додавати операції, питати про витрати й дивитись звіти."));
    }
    return;
  }

  if (action === "sync_monobank") {
    await replyHtml(ctx, "<b>Запускаю синхронізацію...</b>");
    await getDb().job.create({
      data: {
        payloadJson: { days: 7, userId: workspaceUserId },
        type: "monobank_backfill",
      },
    });
    await replyHtml(ctx, notice("Синхронізацію запущено", "Дані Monobank за останні 7 днів оновляться у фоновому режимі."));
    return;
  }

  if (action === "help") {
    await replyHtml(ctx, helpText(), { reply_markup: mainMenu(Boolean(ctx.state?.isAdmin)) });
  }
}

async function handleReceiptPhotoMessage(ctx: BotContext, botToken: string) {
  const workspaceUserId = await resolveWorkspaceUserId(ctx);
  const photos = ctx.message?.photo ?? [];
  const photo = photos.at(-1);
  if (!photo?.file_id) {
    await replyHtml(ctx, notice("Фото не отримано", "Спробуйте надіслати чек ще раз."));
    return;
  }

  try {
    await ctx.api.sendChatAction(ctx.chat!.id, "typing").catch(() => undefined);
    const file = await ctx.api.getFile(photo.file_id);
    if (!file.file_path) {
      await replyHtml(ctx, notice("Фото недоступне", "Telegram не повернув шлях до фото чека."));
      return;
    }

    const url = `https://api.telegram.org/file/bot${botToken}/${file.file_path}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Не вдалося завантажити фото чека з Telegram.");
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const draft = await recognizeReceiptImage({
      buffer,
      caption: ctx.message?.caption ?? null,
      fileName: telegramFileName(file.file_path),
      mimeType: response.headers.get("content-type") ?? telegramImageMimeType(file.file_path),
      userId: workspaceUserId,
    });

    await storeDraft(ctx, draft);
    await replyHtml(ctx, renderTelegramDraft(draft), {
      reply_markup: draftKeyboard(draft),
    });
  } catch (error) {
    await replyHtml(
      ctx,
      `<b>Не вдалося розпізнати чек</b>\n\n${escapeTelegramHtml(error instanceof Error ? error.message : "Спробуйте ще раз або напишіть суму текстом.")}`,
    );
  }
}

async function handleVoiceMessage(ctx: BotContext, botToken: string) {
  const workspaceUserId = await resolveWorkspaceUserId(ctx);
  const voice = ctx.message?.voice;
  if (!voice?.file_id) {
    await replyHtml(ctx, notice("Голос не отримано", "Спробуйте записати повідомлення ще раз."));
    return;
  }

  try {
    const file = await ctx.api.getFile(voice.file_id);
    if (!file.file_path) {
      await replyHtml(ctx, notice("Голос недоступний", "Telegram не повернув шлях до голосового файлу."));
      return;
    }

    const url = `https://api.telegram.org/file/bot${botToken}/${file.file_path}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Не вдалося завантажити голосове повідомлення з Telegram.");
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const audio = await prepareAudioForTranscription(buffer, voice.mime_type ?? "audio/ogg");
    const transcript = await transcribeFinanceVoice({
      buffer: audio.buffer,
      fileName: audio.fileName,
      mimeType: audio.mimeType,
      userId: workspaceUserId,
    });

    await replyHtml(ctx, `<b>Розпізнаний текст</b>\n\n${escapeTelegramHtml(transcript)}`);
    await handleFreeText(ctx, transcript);
  } catch (error) {
    await replyHtml(
      ctx,
      `<b>Не вдалося розпізнати голос</b>\n\n${escapeTelegramHtml(error instanceof Error ? error.message : "Спробуйте ще раз або напишіть текстом.")}`,
    );
  }
}

async function prepareAudioForTranscription(buffer: Buffer, mimeType: string) {
  if (!/ogg|opus/iu.test(mimeType)) {
    return {
      buffer,
      fileName: mimeType.includes("webm") ? "telegram-voice.webm" : "telegram-voice.mp3",
      mimeType,
    };
  }

  return {
    buffer: await transcodeOggToMp3(buffer),
    fileName: "telegram-voice.mp3",
    mimeType: "audio/mpeg",
  };
}

function telegramFileName(filePath: string) {
  return filePath.split("/").pop() || "telegram-file";
}

function telegramImageMimeType(filePath: string) {
  const fileName = telegramFileName(filePath).toLowerCase();
  if (fileName.endsWith(".png")) return "image/png";
  if (fileName.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

async function transcodeOggToMp3(input: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    const child = spawn("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      "pipe:0",
      "-vn",
      "-f",
      "mp3",
      "pipe:1",
    ]);
    const chunks: Buffer[] = [];
    const errors: Buffer[] = [];

    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => errors.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks));
        return;
      }
      reject(new Error(Buffer.concat(errors).toString("utf8") || "ffmpeg не зміг конвертувати голосове повідомлення."));
    });
    child.stdin.end(input);
  });
}

async function sendQuickReport(ctx: BotContext, reportType: TelegramReportType, rangeKey: Parameters<typeof quickRange>[0]) {
  const workspaceUserId = await resolveWorkspaceUserId(ctx);
  const range = quickRange(rangeKey);
  await replyHtml(ctx, await buildTelegramReport({ kind: "report", range, reportType }, workspaceUserId));
}

async function storeDraft(ctx: BotContext, draft: TelegramOperationDraft) {
  await setTelegramConversationState({
    chatId: ctx.chat!.id.toString(),
    kind: "draft",
    payload: { draft },
    telegramUserId: ctx.from!.id.toString(),
    userId: await resolveWorkspaceUserId(ctx),
  });
}

async function replaceCallbackMessage(ctx: BotContext, text: string, replyMarkup?: InlineKeyboard) {
  const options = replyMarkup ? { ...htmlMessageOptions, reply_markup: replyMarkup } : htmlMessageOptions;
  try {
    await ctx.editMessageText(text, options);
  } catch {
    await ctx.reply(text, options);
  }
}

function draftTextAction(text: string) {
  const normalized = normalizeText(text);
  if (["підтвердити", "підтверджую", "зберегти", "збережи", "так", "ок", "ok", "готово"].includes(normalized)) {
    return "save";
  }
  if (["скасувати", "відміна", "відмінити", "ні", "no", "cancel"].includes(normalized)) {
    return "cancel";
  }
  return null;
}

async function beginSecretStep(ctx: BotContext, step: string, prompt: string) {
  if (!config.ENABLE_TELEGRAM_SECRET_SETUP) {
    await ctx.answerCallbackQuery();
    await replyHtml(ctx, "<b>Telegram-ввід секретів вимкнений</b>\n\nДодайте ключі у <code>.env</code> або увімкніть <code>ENABLE_TELEGRAM_SECRET_SETUP=true</code>.");
    return;
  }

  if (!config.APP_SECRET_KEY.trim()) {
    await ctx.answerCallbackQuery();
    await replyHtml(ctx, "<b>APP_SECRET_KEY не заданий</b>\n\nЯ не можу безпечно зберегти секрет.");
    return;
  }

  await getDb().setupState.upsert({
    where: { id: `${ctx.chat?.id}:${ctx.from?.id}` },
    update: {
      expiresAt: new Date(Date.now() + 5 * 60_000),
      step,
    },
    create: {
      expiresAt: new Date(Date.now() + 5 * 60_000),
      id: `${ctx.chat?.id}:${ctx.from?.id}`,
      step,
      telegramChatId: ctx.chat!.id.toString(),
      telegramUserId: ctx.from!.id.toString(),
    },
  });

  await ctx.answerCallbackQuery();
  await replyHtml(ctx, `<b>Безпечне введення секрету</b>\n\n${escapeTelegramHtml(prompt)}\n\nЯ спробую видалити повідомлення з ключем після збереження.`);
}

async function getActiveSetupState(chatId: string, userId: string) {
  return getDb().setupState.findFirst({
    where: {
      expiresAt: { gt: new Date() },
      telegramChatId: chatId,
      telegramUserId: userId,
    },
  });
}

async function getStoredAdminIds() {
  const value = await getPlainSetting("ADMIN_TELEGRAM_USER_IDS");
  return new Set(
    (value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

async function handleSetupValue(ctx: BotContext, step: string, text: string) {
  if (step === "set_openai_key") {
    await setSecretSetting("OPENAI_API_KEY", text);
    await replyHtml(ctx, `<b>OpenAI key збережено</b>\n\n<code>${escapeTelegramHtml(maskSecret(text))}</code>`);
  } else if (step === "set_monobank_token") {
    await setSecretSetting("MONOBANK_TOKEN", text);
    await replyHtml(ctx, `<b>Monobank token збережено</b>\n\n<code>${escapeTelegramHtml(maskSecret(text))}</code>`);
  } else if (step === "set_google_service_account_json") {
    JSON.parse(text);
    await setSecretSetting("GOOGLE_SERVICE_ACCOUNT_JSON", text);
    await replyHtml(ctx, notice("Google service account JSON збережено"));
  } else if (step === "set_google_sheet_id") {
    await setPlainSetting("GOOGLE_SHEETS_SPREADSHEET_ID", text);
    await replyHtml(ctx, `<b>Google spreadsheet ID збережено</b>\n\n<code>${escapeTelegramHtml(maskSecret(text))}</code>`);
  }

  await getDb().setupState.deleteMany({
    where: {
      telegramChatId: ctx.chat!.id.toString(),
      telegramUserId: ctx.from!.id.toString(),
    },
  });
  await ctx.deleteMessage().catch(() => undefined);
}

async function resolveWorkspaceUserId(ctx: BotContext): Promise<string | null> {
  if (ctx.state?.linkedWorkspaceUserId) {
    return ctx.state.linkedWorkspaceUserId;
  }
  if (ctx.state?.isAdmin) {
    return (await ensureDefaultUser()).id;
  }
  return null;
}

async function requireAdmin(ctx: BotContext) {
  if (isAdminContext(ctx)) {
    return true;
  }
  await ctx.answerCallbackQuery?.().catch(() => undefined);
  await replyHtml(ctx, notice("Недостатньо прав", "Ця команда доступна власнику або адміністратору робочого простору."));
  return false;
}

function isAdminContext(ctx: BotContext) {
  return Boolean(ctx.state?.isAdmin);
}

async function statusText(userId?: string | null) {
  const status = await getConfiguredStatus(userId ?? undefined);
  const monoToken = await getMonobankToken(userId ?? undefined);
  const accountId = await getSelectedMonobankAccountId();
  return [
    "<b>FinTrack бот</b>",
    "────────────",
    "",
    `<b>Підключення</b>`,
    `• Monobank: ${status.monobank ? `підключено (<code>${escapeTelegramHtml(maskSecret(monoToken))}</code>)` : "не підключено"}`,
    `• Основний рахунок: ${accountId ? `<code>${escapeTelegramHtml(maskSecret(accountId))}</code>` : "не вибрано"}`,
    `• Google Sheets: ${status.googleSheets ? "підключено" : "не підключено"}`,
    `• OpenAI: ${status.openai ? "підключено" : "не підключено"}`,
    "",
    "<b>Можна писати вільно</b>",
    "<code>Кава 80</code>",
    "<code>Зарплата 50000</code>",
    "<code>Витрати за сьогодні</code>",
  ].join("\n");
}

function mainReplyKeyboard() {
  return new Keyboard()
    .text("Додати витрату")
    .text("Додати дохід")
    .row()
    .text("Витрати за період")
    .text("Баланс")
    .row()
    .text("Останні операції")
    .text("Синхронізувати дані")
    .row()
    .text("Допомога")
    .resized()
    .persistent();
}

function mainMenu(isAdmin: boolean) {
  const menu = new InlineKeyboard()
    .text("Додати витрату", "menu:add_expense")
    .text("Додати дохід", "menu:add_income")
    .row()
    .text("Витрати за період", "menu:expenses_period")
    .text("Доходи за період", "menu:incomes_period")
    .row()
    .text("Звіт по категоріях", "menu:categories")
    .text("Баланс", "menu:balance")
    .row()
    .text("Останні операції", "menu:latest")
    .text("Місячний підсумок", "menu:summary")
    .row()
    .text("🔄 Синхронізувати дані", "menu:sync_monobank")
    .row()
    .text("Налаштування", "menu:settings")
    .text("Допомога", "menu:help");

  if (isAdmin) {
    menu.row().text("Адмін налаштування", "setup");
  }

  return menu;
}

function periodMenu(reportType: TelegramReportType) {
  return new InlineKeyboard()
    .text("Сьогодні", `report:${reportType}:today`)
    .text("Вчора", `report:${reportType}:yesterday`)
    .row()
    .text("Цей тиждень", `report:${reportType}:this_week`)
    .text("Цей місяць", `report:${reportType}:this_month`)
    .row()
    .text("Минулий місяць", `report:${reportType}:last_month`);
}

function draftKeyboard(draft: TelegramOperationDraft) {
  const keyboard = new InlineKeyboard();
  draft.suggestions.slice(0, 6).forEach((suggestion, index) => {
    keyboard.text(suggestion.name, `draft:cat:${index}`);
    if (index % 2 === 1) keyboard.row();
  });
  if (draft.suggestions.length) keyboard.row();
  return keyboard
    .text("✅ Підтвердити і зберегти", "draft:save")
    .row()
    .text("✏️ Суму", "draft:edit_amount")
    .text(draft.type === "EXPENSE" ? "🏷 Категорію" : "🏷 Джерело", "draft:edit_category")
    .row()
    .text("📅 Дату", "draft:edit_date")
    .row()
    .text("✖️ Скасувати", "draft:cancel");
}

function setupMenu() {
  return new InlineKeyboard()
    .text("Monobank", "setup_monobank")
    .text("Google Sheets", "setup_google")
    .row()
    .text("OpenAI", "setup_openai");
}

function openAiMenu() {
  return new InlineKeyboard()
    .text("Додати API key", "set_openai_key")
    .text("Test OpenAI", "test_openai")
    .row()
    .text("Видалити key", "delete_openai_key")
    .row()
    .text("Назад", "setup");
}

function monobankMenu() {
  return new InlineKeyboard()
    .text("Додати token", "set_monobank_token")
    .row()
    .text("Вибрати основний рахунок", "select_monobank_account")
    .row()
    .text("🔄 Синхронізувати дані", "sync_monobank")
    .row()
    .text("Назад", "setup");
}

function googleMenu() {
  return new InlineKeyboard()
    .text("Service account JSON", "set_google_json")
    .row()
    .text("Spreadsheet ID", "set_google_sheet_id")
    .row()
    .text("Назад", "setup");
}

export const telegramBotTestUtils = {
  draftKeyboard,
  draftTextAction,
  mainMenu,
  periodMenu,
  telegramImageMimeType,
};

function menuActionFromText(text: string) {
  const normalized = normalizeText(text);
  const actions: Record<string, string> = {
    "баланс": "balance",
    "витрати за період": "expenses_period",
    "додати витрату": "add_expense",
    "додати дохід": "add_income",
    "допомога": "help",
    "дохід за період": "incomes_period",
    "доходи за період": "incomes_period",
    "звіт по категоріях": "categories",
    "місячний підсумок": "summary",
    "налаштування": "settings",
    "останні операції": "latest",
    "синхронізувати дані": "sync_monobank",
  };
  return actions[normalized] ?? null;
}

function helpText() {
  return [
    "<b>Як користуватись ботом</b>",
    "────────────",
    "",
    "<b>Додати витрату</b>",
    "Напишіть однією фразою:",
    "<code>Кава 80</code>",
    "<code>АТБ продукти 560</code>",
    "<code>Вчора бензин 1500</code>",
    "",
    "<b>Додати дохід</b>",
    "<code>Зарплата 50000</code>",
    "<code>Дохід від проєкту 12000</code>",
    "",
    "<b>Запити і звіти</b>",
    "• <code>Покажи витрати за сьогодні</code>",
    "• <code>Скільки я витратив у квітні?</code>",
    "• <code>Витрати по категоріях за цей місяць</code>",
    "• <code>Доходи за березень</code>",
    "• <code>Дай виписку з 1 по 15 квітня</code>",
    "• <code>Покажи останні 10 витрат</code>",
    "• <code>Скільки я витратив на їжу цього місяця?</code>",
    "• <code>Порівняй березень і квітень</code>",
    "",
    "<b>Голос і чеки</b>",
    "Можна надсилати голосові повідомлення або фото чека, якщо налаштований OpenAI ключ.",
  ].join("\n");
}

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString("uk-UA")} грн`;
}

function extractStartParam(text?: string) {
  const normalized = text?.trim();
  if (!normalized?.startsWith("/start")) {
    return null;
  }
  const [, ...rest] = normalized.split(/\s+/);
  return rest.join(" ").trim() || null;
}
