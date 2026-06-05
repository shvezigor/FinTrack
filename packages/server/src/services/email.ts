import nodemailer from "nodemailer";
import { config } from "../config.js";

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  // Check if SMTP is configured
  if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASSWORD) {
    console.warn("SMTP not configured. Email functionality disabled.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: parseInt(config.SMTP_PORT),
    secure: parseInt(config.SMTP_PORT) === 465,
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASSWORD,
    },
  });

  return transporter;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const emailTransporter = getTransporter();
  if (!emailTransporter) {
    console.warn(`Email not sent to ${options.to}: SMTP not configured`);
    return false;
  }

  try {
    await emailTransporter.sendMail({
      from: `${config.SMTP_FROM_NAME} <${config.SMTP_FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${options.to}:`, error);
    return false;
  }
}

export function formatPasswordResetEmail(resetUrl: string, userName: string): {
  subject: string;
  html: string;
  text: string;
} {
  return {
    subject: "Скидання пароля - FinTrack",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Запит на скидання пароля</h2>
        <p>Привіт ${userName},</p>
        <p>Ви запросили скидання вашого пароля. Натисніть на кнопку нижче, щоб скинути пароль:</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${resetUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Скинути пароль
          </a>
        </div>
        <p>Або скопіюйте цей URL у ваш браузер:</p>
        <p style="word-break: break-all; color: #666; font-size: 12px;">
          ${resetUrl}
        </p>
        <p style="color: #666; font-size: 12px;">Посилання на скидання пароля дійсне протягом 60 хвилин.</p>
        <p style="color: #999; font-size: 12px; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px;">
          Якщо ви не запросили скидання пароля, просто ігноруйте цей лист.
        </p>
      </div>
    `,
    text: `Запит на скидання пароля

Привіт ${userName},

Ви запросили скидання вашого пароля. Перейдіть за цим посиланням, щоб скинути пароль:

${resetUrl}

Посилання дійсне протягом 60 хвилин.

Якщо ви не запросили скидання пароля, просто ігноруйте цей лист.`,
  };
}
