import "dotenv/config";
import { z } from "zod";

const configSchema = z.object({
  APP_BASE_URL: z.string().url().default("http://localhost:3001"),
  APP_SECRET_KEY: z.string().optional().default(""),
  DATABASE_URL: z.string().min(1),
  DASHBOARD_ADMIN_PASSWORD: z.string().default("change-me"),
  DASHBOARD_PUBLIC_URL: z.string().url().default("http://localhost:3000"),
  DEFAULT_USER_EMAIL: z.string().email().default("admin@fintrack.local"),
  DEFAULT_USER_NAME: z.string().default("Олександр"),
  ENABLE_TELEGRAM_SECRET_SETUP: z
    .string()
    .default("false")
    .transform((value) => value === "true"),
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional().default(""),
  GOOGLE_SERVICE_ACCOUNT_JSON: z.string().optional().default(""),
  GOOGLE_SHEETS_SPREADSHEET_ID: z.string().optional().default(""),
  MONOBANK_ACCOUNT_ID: z.string().optional().default(""),
  MONOBANK_TOKEN: z.string().optional().default(""),
  MONOBANK_WEBHOOK_SECRET: z.string().optional().default(""),
  NODE_ENV: z.string().default("development"),
  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_IMAGE_MODEL: z.string().default("gpt-image-1"),
  OPENAI_MODEL: z.string().default("gpt-4o"),
  OPENAI_TRANSCRIBE_MODEL: z.string().default("gpt-4o-mini-transcribe"),
  PUBLIC_UPLOAD_BASE_URL: z.string().optional().default(""),
  SESSION_COOKIE_NAME: z.string().default("fintrack_session"),
  TELEGRAM_BOT_TOKEN: z.string().optional().default(""),
  TELEGRAM_BOT_USERNAME: z.string().optional().default(""),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional().default(""),
  UPLOAD_DIR: z.string().default("uploads"),
  ADMIN_TELEGRAM_USER_IDS: z.string().optional().default(""),
  ADMIN_CLAIM_SECRET: z.string().optional().default(""),
  TELEGRAM_USE_POLLING: z
    .string()
    .default("false")
    .transform((value) => value === "true"),
  TIMEZONE: z.string().default("Europe/Kyiv"),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.string().optional().default("587"),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASSWORD: z.string().optional().default(""),
  SMTP_FROM_EMAIL: z.string().email().optional().default("noreply@fintrack.local"),
  SMTP_FROM_NAME: z.string().optional().default("FinTrack"),
  PASSWORD_RESET_EXPIRY_MINUTES: z.string().optional().default("60"),
});

export const config = configSchema.parse(process.env);

export function adminTelegramUserIds(): Set<string> {
  return new Set(
    config.ADMIN_TELEGRAM_USER_IDS.split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

export function isProduction(): boolean {
  return config.NODE_ENV === "production";
}
