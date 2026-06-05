"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Icon } from "./icons";
import { LanguageSwitcher, useI18n } from "./i18n";
import { emitAppToast, handleValidationCapture, ToastPopup, useAppToastHost } from "./toast-feedback";

const apiOrigin = process.env.NEXT_PUBLIC_API_PUBLIC_URL ?? "http://localhost:3001";

type RegisterPayload = {
  error?: string;
  user?: {
    email: string;
    id: string;
    name: string | null;
  };
};

export function RegisterPage() {
  const { lang } = useI18n();
  const copy = registerCopy(lang);
  const { dismissToast, showToast, toast } = useAppToastHost();
  const [accepted, setAccepted] = useState(true);
  const [email, setEmail] = useState("");
  const [, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError(copy.errors.passwordLength);
      emitAppToast(copy.errors.passwordLength, "error");
      return;
    }
    if (password !== passwordAgain) {
      setError(copy.errors.passwordMatch);
      emitAppToast(copy.errors.passwordMatch, "error");
      return;
    }
    if (!accepted) {
      setError(copy.errors.terms);
      emitAppToast(copy.errors.terms, "error");
      return;
    }

    setLoading(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Kyiv";
      const response = await fetch("/api/proxy/auth/register", {
        body: JSON.stringify({
          email,
          locale: lang,
          name,
          password,
          timezone,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as RegisterPayload;
      if (!response.ok) {
        throw new Error(payload.error ?? copy.errors.generic);
      }

      window.location.href = "/dashboard";
    } catch (registerError) {
      const message = registerError instanceof Error ? normalizeRegisterError(registerError.message, copy) : copy.errors.generic;
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="register-page">
      {toast ? <ToastPopup message={toast.message} onDismiss={dismissToast} tone={toast.tone} /> : null}
      <header className="register-header">
        <a className="landing-brand" href="/">
          <span className="brand-mark compact-mark">
            <i />
            <i />
            <i />
          </span>
          <strong>FinTrack</strong>
        </a>
        <div className="register-header-actions">
          <LanguageSwitcher compact />
          <a className="header-login" href="/dashboard">{copy.signIn}</a>
        </div>
      </header>

      <section className="register-shell">
        <div className="register-copy">
          <p className="landing-badge">{copy.badge}</p>
          <h1>{copy.title}</h1>
          <p>{copy.body}</p>
          <ul>
            {copy.bullets.map((bullet) => (
              <li key={bullet}>
                <Icon name="check" />
                {bullet}
              </li>
            ))}
          </ul>
          <img
            alt=""
            src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=80"
          />
        </div>

        <form className="register-panel" onInvalidCapture={(event) => handleValidationCapture(event, lang)} onSubmit={handleSubmit}>
          <div>
            <p className="eyebrow">FinTrack</p>
            <h2>{copy.formTitle}</h2>
            <small>{copy.formHint}</small>
          </div>

          <a className="google-login" href={`${apiOrigin}/api/auth/google/start?redirectTo=${encodeURIComponent("http://localhost:3000/dashboard")}`}>
            <Icon name="google" />
            {copy.google}
          </a>

          <div className="auth-divider"><span>{copy.or}</span></div>

          <label>
            {copy.name}
            <input autoComplete="name" maxLength={80} minLength={2} onChange={(event) => setName(event.target.value)} placeholder={copy.namePlaceholder} required value={name} />
          </label>
          <label>
            Email
            <input autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder="you@email.com" required type="email" value={email} />
          </label>
          <label>
            {copy.password}
            <input autoComplete="new-password" minLength={8} onChange={(event) => setPassword(event.target.value)} placeholder="Test12345!" required type="password" value={password} />
          </label>
          <label>
            {copy.passwordAgain}
            <input autoComplete="new-password" minLength={8} onChange={(event) => setPasswordAgain(event.target.value)} placeholder="Test12345!" required type="password" value={passwordAgain} />
          </label>

          <label className="terms-row">
            <input checked={accepted} onChange={(event) => setAccepted(event.target.checked)} type="checkbox" />
            <span>{copy.terms}</span>
          </label>

          <button disabled={loading} type="submit">{loading ? copy.loading : copy.submit}</button>
          <small>{copy.existing} <a href="/dashboard">{copy.signIn}</a></small>
        </form>
      </section>
    </main>
  );
}

function normalizeRegisterError(message: string, copy: ReturnType<typeof registerCopy>) {
  if (message.toLowerCase().includes("already exists")) return copy.errors.exists;
  if (message.toLowerCase().includes("8 characters")) return copy.errors.passwordLength;
  return message || copy.errors.generic;
}

function registerCopy(lang: "en" | "uk") {
  if (lang === "en") {
    return {
      badge: "Create your workspace",
      body: "Register once and then manage Telegram expenses, Monobank sync, budgets, goals and Google Sheets export from one account.",
      bullets: ["Personal account and secure password", "Google sign-up ready after OAuth keys are configured", "Language and timezone saved automatically"],
      errors: {
        exists: "A user with this email already exists. Sign in instead.",
        generic: "Could not create an account. Try again.",
        passwordLength: "Password must contain at least 8 characters.",
        passwordMatch: "Passwords do not match.",
        terms: "Confirm the data processing notice to continue.",
      },
      existing: "Already have an account?",
      formHint: "Use email and password now, or connect Google OAuth when keys are ready.",
      formTitle: "Create account",
      google: "Continue with Google",
      loading: "Creating account...",
      name: "Full name",
      namePlaceholder: "Oleksandr Shevchenko",
      or: "or use email",
      password: "Password",
      passwordAgain: "Repeat password",
      signIn: "Sign in",
      submit: "Create account",
      terms: "I understand that FinTrack will store my account and finance workspace data.",
      title: "Start with a clean finance account",
    };
  }

  return {
    badge: "Створіть свій кабінет",
    body: "Зареєструйтеся один раз, а далі керуйте Telegram-витратами, синхронізацією Monobank, бюджетами, цілями та експортом у Google Sheets з одного акаунта.",
    bullets: ["Персональний акаунт і безпечний пароль", "Google-реєстрація готова після налаштування OAuth ключів", "Мова та часовий пояс зберігаються автоматично"],
    errors: {
      exists: "Користувач з таким email уже існує. Увійдіть у кабінет.",
      generic: "Не вдалося створити акаунт. Спробуйте ще раз.",
      passwordLength: "Пароль має містити щонайменше 8 символів.",
      passwordMatch: "Паролі не збігаються.",
      terms: "Підтвердіть обробку даних, щоб продовжити.",
    },
    existing: "Вже маєте акаунт?",
    formHint: "Зараз можна створити email + пароль, а Google OAuth підключиться після додавання ключів.",
    formTitle: "Реєстрація",
    google: "Продовжити з Google",
    loading: "Створюю акаунт...",
    name: "Ім’я та прізвище",
    namePlaceholder: "Олександр Шевченко",
    or: "або через email",
    password: "Пароль",
    passwordAgain: "Повторіть пароль",
    signIn: "Увійти",
    submit: "Створити акаунт",
    terms: "Я розумію, що FinTrack зберігатиме дані мого акаунта і фінансового кабінету.",
    title: "Почніть з чистого фінансового акаунта",
  };
}

