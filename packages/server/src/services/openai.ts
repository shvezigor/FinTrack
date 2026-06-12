import OpenAI, { toFile } from "openai";
import { Prisma, type IntegrationProvider } from "@prisma/client";
import { config } from "../config.js";
import { getDb } from "../db.js";
import { monthlySummary } from "./expenses.js";
import { getSecretSetting } from "./settings.js";
import { getUserSecret, upsertUserSecret } from "./user-secrets.js";

type AiKeyMode = "SYSTEM" | "USER";
type AiProvider = "OPENAI" | "ANTHROPIC" | "GEMINI" | "OPENROUTER";

const AI_PROVIDER_CODES = ["OPENAI", "ANTHROPIC", "GEMINI", "OPENROUTER"] as const;

const AI_TOKEN_URLS: Record<AiProvider, string> = {
  ANTHROPIC: "https://console.anthropic.com/settings/keys",
  GEMINI: "https://aistudio.google.com/app/apikey",
  OPENAI: "https://platform.openai.com/api-keys",
  OPENROUTER: "https://openrouter.ai/keys",
};

const AI_PROVIDER_LABELS: Record<AiProvider, string> = {
  ANTHROPIC: "Anthropic / Claude API",
  GEMINI: "Google Gemini API",
  OPENAI: "OpenAI / ChatGPT API",
  OPENROUTER: "OpenRouter API",
};

const AI_SECRET_KEYS: Record<AiProvider, string> = {
  ANTHROPIC: "ANTHROPIC_API_KEY",
  GEMINI: "GEMINI_API_KEY",
  OPENAI: "OPENAI_API_KEY",
  OPENROUTER: "OPENROUTER_API_KEY",
};

const AI_DEFAULT_MODELS: Record<AiProvider, string> = {
  ANTHROPIC: "claude-3-7-sonnet-latest",
  GEMINI: "gemini-2.5-pro",
  OPENAI: config.OPENAI_MODEL,
  OPENROUTER: "openrouter/auto",
};

export async function getOpenAIClient(userId?: string | null): Promise<OpenAI> {
  const { keyMode, systemKey, userKey } = await resolveOpenAiRuntimeAccess(userId);
  const apiKey = keyMode === "USER" ? userKey : systemKey;

  if (!apiKey) {
    throw new Error(
      keyMode === "USER"
        ? "OpenAI API key is not configured for this user"
        : "System OpenAI API key is not configured",
    );
  }

  return new OpenAI({ apiKey });
}

export async function getAiProviderSettings(userId?: string | null) {
  const systemKey = await getSecretSetting("OPENAI_API_KEY", config.OPENAI_API_KEY);
  const connections = userId
    ? await getDb().integrationConnection.findMany({
        orderBy: [{ provider: "asc" }, { updatedAt: "desc" }],
        where: {
          provider: {
            in: AI_PROVIDER_CODES as unknown as IntegrationProvider[],
          },
          userId,
        },
      })
    : [];

  const rows = await Promise.all(
    AI_PROVIDER_CODES.map(async (provider) => {
      const connection = connections.find((item) => item.provider === provider) ?? null;
      const metadata = parseAiMetadata(connection?.metadata);
      const userKeyConfigured = await hasUserProviderKey(userId, provider);
      const systemSupported = provider === "OPENAI";
      const keyMode = systemSupported
        ? normalizeAiKeyMode(metadata.keyMode, userKeyConfigured ? "USER" : "SYSTEM")
        : "USER";
      const connected = keyMode === "SYSTEM" ? Boolean(systemKey) : Boolean(userKeyConfigured);

      return {
        connected,
        keyMode,
        model:
          typeof metadata.model === "string" && metadata.model.trim()
            ? metadata.model
            : AI_DEFAULT_MODELS[provider],
        provider,
        providerLabel: AI_PROVIDER_LABELS[provider],
        runtimeReady: provider === "OPENAI" ? connected : false,
        status: connection?.status ?? (connected ? "CONNECTED" : "DISCONNECTED"),
        systemAvailable: Boolean(systemKey),
        systemSupported,
        tokenUrl: AI_TOKEN_URLS[provider],
        userKeyConfigured,
      };
    }),
  );

  const primary = rows.find((row) => row.provider === "OPENAI") ?? rows[0];
  return primary ? { ...primary, providers: rows } : null;
}

export async function configureAiProvider(input: {
  apiKey?: string;
  keyMode: string;
  provider: string;
  userId: string;
}) {
  const provider = normalizeAiProvider(input.provider);
  const systemSupported = provider === "OPENAI";
  const keyMode = systemSupported ? normalizeAiKeyMode(input.keyMode, "SYSTEM") : "USER";
  const systemKey = await getSecretSetting("OPENAI_API_KEY", config.OPENAI_API_KEY);
  const secretKeyName = AI_SECRET_KEYS[provider];
  const userKeyLabel = `${AI_PROVIDER_LABELS[provider]} personal API key`;

  if (keyMode === "SYSTEM" && !systemSupported) {
    throw new Error("System mode is currently available only for OpenAI");
  }

  if (keyMode === "SYSTEM" && !systemKey) {
    throw new Error("System OpenAI API key is not configured");
  }

  if (keyMode === "USER") {
    const value = input.apiKey?.trim();
    const existingUserKey = await getUserSecret(input.userId, provider, secretKeyName, null);
    if (!value && !existingUserKey) {
      throw new Error(`${AI_PROVIDER_LABELS[provider]} API key is required for personal mode`);
    }
    if (value) {
      if (provider === "OPENAI") {
        validateOpenAiKeyShape(value);
        await assertOpenAiKeyWorks(value);
      }
      await upsertUserSecret({
        keyName: secretKeyName,
        label: userKeyLabel,
        provider,
        userId: input.userId,
        value,
      });
    }
  } else if (systemKey) {
    await assertOpenAiKeyWorks(systemKey);
  }

  const connection = await getDb().integrationConnection.findFirst({
    orderBy: { updatedAt: "desc" },
    where: {
      provider: getIntegrationProvider(provider),
      userId: input.userId,
    },
  });
  const metadata = {
    dataRouting:
      keyMode === "SYSTEM"
        ? "Requests use the platform owner OpenAI key. Financial context is still scoped by FinTrack userId."
        : `Requests use this user's encrypted ${AI_PROVIDER_LABELS[provider]} key.`,
    keyMode,
    model: AI_DEFAULT_MODELS[provider],
    provider,
    tokenUrl: AI_TOKEN_URLS[provider],
  };
  const data = {
    externalAccountId: null,
    label: AI_PROVIDER_LABELS[provider],
    lastSyncAt: new Date(),
    metadata: metadata as Prisma.InputJsonValue,
    provider: getIntegrationProvider(provider),
    status: "CONNECTED" as const,
    userId: input.userId,
  };

  if (connection) {
    await getDb().integrationConnection.update({
      data,
      where: { id: connection.id },
    });
  } else {
    await getDb().integrationConnection.create({ data });
  }

  return getAiProviderSettings(input.userId);
}

export async function answerFinanceQuestion(question: string, userId?: string | null): Promise<string> {
  const client = await getOpenAIClient(userId);
  const [summary, recentExpenses] = await Promise.all([
    monthlySummary(new Date(), userId),
    getDb().expense.findMany({
      include: { category: true },
      orderBy: { date: "desc" },
      take: 50,
      where: userId ? { userId } : undefined,
    }),
  ]);

  const input = [
    {
      role: "system" as const,
      content:
        "Ти фінансовий асистент користувача. Відповідай українською. Використовуй тільки надані дані, не вигадуй витрати, не проси секрети.",
    },
    {
      role: "user" as const,
      content: JSON.stringify({
        monthlySummary: summary,
        question,
        recentExpenses: recentExpenses.map((expense) => ({
          amount: Number(expense.amount),
          category: expense.category?.name ?? null,
          date: expense.date.toISOString(),
          description: expense.description,
          source: expense.sourceStatus,
        })),
      }),
    },
  ];

  const response = await client.responses.create({
    input,
    model: config.OPENAI_MODEL,
  });

  return response.output_text || "Не вдалося сформувати відповідь.";
}

export async function testOpenAI(userId?: string | null) {
  const client = await getOpenAIClient(userId);
  const response = await client.responses.create({
    input: "Відповідай одним коротким реченням українською: API працює.",
    model: config.OPENAI_MODEL,
  });
  return response.output_text;
}

export async function transcribeFinanceVoice(input: {
  buffer: Buffer;
  fileName?: string;
  mimeType?: string;
  userId?: string | null;
}) {
  const client = await getOpenAIClient(input.userId);
  const file = await toFile(input.buffer, input.fileName ?? "telegram-voice.ogg", {
    type: input.mimeType ?? "audio/ogg",
  });
  const response = await client.audio.transcriptions.create({
    file,
    language: "uk",
    model: config.OPENAI_TRANSCRIBE_MODEL,
    prompt: "Українська голосова нотатка про особисті фінанси: витрати, доходи, категорії, суми у гривнях.",
  });
  return typeof response === "string" ? response : response.text;
}

export async function generateGoalImage(input: {
  title: string;
  description?: string | null;
  userId?: string | null;
}) {
  const client = await getOpenAIClient(input.userId);
  const prompt = [
    "Create a polished square visual for a personal finance savings goal card.",
    `Goal title: ${input.title}.`,
    input.description?.trim() ? `Goal description: ${input.description.trim()}.` : null,
    "Style: clean modern lifestyle illustration or photoreal scene, bright natural lighting, simple composition, motivating, suitable for a finance dashboard.",
    "Important: no text, no numbers, no logos, no watermark, no UI, no collage.",
  ]
    .filter(Boolean)
    .join(" ");

  const response = await client.images.generate({
    model: config.OPENAI_IMAGE_MODEL,
    prompt,
    quality: "low",
    size: "1024x1024",
  });

  const imageBase64 = response.data?.[0]?.b64_json;
  if (!imageBase64) {
    throw new Error("OpenAI did not return image data");
  }

  return Buffer.from(imageBase64, "base64");
}

function normalizeAiProvider(provider?: unknown): AiProvider {
  return AI_PROVIDER_CODES.includes(provider as AiProvider) ? (provider as AiProvider) : "OPENAI";
}

function normalizeAiKeyMode(value: unknown, fallback: AiKeyMode): AiKeyMode {
  return value === "USER" || value === "SYSTEM" ? value : fallback;
}

function parseAiMetadata(metadata: Prisma.JsonValue | null | undefined) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }
  return metadata as { keyMode?: unknown; model?: unknown; provider?: unknown; tokenUrl?: unknown };
}

function validateOpenAiKeyShape(value: string) {
  if (!/^sk-[A-Za-z0-9_\-]{20,}$/.test(value)) {
    throw new Error("OpenAI API key має починатися з sk- і виглядати як секретний API key.");
  }
}

async function assertOpenAiKeyWorks(apiKey: string) {
  const client = new OpenAI({ apiKey });
  await client.models.list();
}

function getIntegrationProvider(provider: AiProvider): IntegrationProvider {
  return provider as IntegrationProvider;
}

async function resolveOpenAiRuntimeAccess(userId?: string | null) {
  const [systemKey, userKey, connection] = await Promise.all([
    getSecretSetting("OPENAI_API_KEY", config.OPENAI_API_KEY),
    getUserSecret(userId, "OPENAI", "OPENAI_API_KEY", null),
    userId
      ? getDb().integrationConnection.findFirst({
          orderBy: { updatedAt: "desc" },
          where: { provider: "OPENAI", userId },
        })
      : Promise.resolve(null),
  ]);
  const metadata = parseAiMetadata(connection?.metadata);
  const keyMode = normalizeAiKeyMode(metadata.keyMode, userKey ? "USER" : "SYSTEM");
  return { keyMode, systemKey, userKey };
}

async function hasUserProviderKey(userId: string | null | undefined, provider: AiProvider) {
  if (!userId) {
    return false;
  }
  const secret = await getDb().userSecret.findUnique({
    select: { revokedAt: true },
    where: {
      userId_provider_keyName: {
        keyName: AI_SECRET_KEYS[provider],
        provider: getIntegrationProvider(provider),
        userId,
      },
    },
  });
  return Boolean(secret && !secret.revokedAt);
}
