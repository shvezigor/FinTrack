"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { InvalidEvent } from "react";
import { Icon } from "./icons";

const APP_TOAST_EVENT = "fintrack:toast";

export type ToastTone = "error" | "success";
export type ToastState = {
  id: number;
  message: string;
  tone: ToastTone;
} | null;

type ToastDetail = {
  message: string;
  tone: ToastTone;
};

export function emitAppToast(message: string, tone: ToastTone = "error") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastDetail>(APP_TOAST_EVENT, { detail: { message, tone } }));
}

export function useAppToastHost() {
  const [toast, setToast] = useState<ToastState>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastDetail>).detail;
      if (!detail?.message) return;
      setToast({
        id: Date.now(),
        message: detail.message,
        tone: detail.tone,
      });
    };

    window.addEventListener(APP_TOAST_EVENT, onToast as EventListener);
    return () => window.removeEventListener(APP_TOAST_EVENT, onToast as EventListener);
  }, []);

  useEffect(() => {
    if (!toast) return;
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current));
      timerRef.current = null;
    }, 4200);
  }, [toast]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const dismissToast = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback((message: string, tone: ToastTone) => {
    setToast({
      id: Date.now(),
      message,
      tone,
    });
  }, []);

  return { dismissToast, showToast, toast };
}

export function ToastPopup({
  message,
  onDismiss,
  tone,
}: {
  message: string;
  onDismiss: () => void;
  tone: ToastTone;
}) {
  return (
    <div aria-live="polite" className="toast-viewport">
      <div className={`toast toast-${tone}`} role="status">
        <span className={`toast-icon${tone === "success" ? " success" : ""}`} aria-hidden="true">
          <Icon name={tone === "success" ? "check" : "warning"} />
        </span>
        <p>{message}</p>
        <button aria-label="Закрити повідомлення" className="toast-close" onClick={onDismiss} type="button">
          x
        </button>
      </div>
    </div>
  );
}

export function handleValidationCapture(
  event: InvalidEvent<HTMLFormElement>,
  lang: "en" | "uk",
) {
  event.preventDefault();
  const control = event.target;
  if (
    !(control instanceof HTMLInputElement) &&
    !(control instanceof HTMLSelectElement) &&
    !(control instanceof HTMLTextAreaElement)
  ) {
    return;
  }

  emitAppToast(validationMessageForControl(control, lang), "error");
}

function validationMessageForControl(
  control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  lang: "en" | "uk",
) {
  const label = fieldLabel(control.name, lang);
  const textControl = control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement ? control : null;
  const numericControl = control instanceof HTMLInputElement ? control : null;

  if (control.validity.valueMissing) {
    return lang === "en" ? `${label} is required.` : `Поле "${label}" є обовʼязковим.`;
  }

  if (control.validity.typeMismatch && control.type === "email") {
    return lang === "en" ? "Enter a valid email address." : "Введіть коректну email-адресу.";
  }

  if (control.validity.patternMismatch) {
    return lang === "en"
      ? `Enter a valid value for ${label.toLowerCase()}.`
      : `Введіть коректне значення для поля "${label}".`;
  }

  if (control.validity.tooShort) {
    const minLength = textControl && textControl.minLength > 0 ? textControl.minLength : undefined;
    return lang === "en"
      ? `${label} must contain at least ${minLength ?? "the required number of"} characters.`
      : `${label} має містити щонайменше ${minLength ?? "потрібну кількість"} символів.`;
  }

  if (control.validity.tooLong) {
    const maxLength = textControl && textControl.maxLength > 0 ? textControl.maxLength : undefined;
    return lang === "en"
      ? `${label} must contain no more than ${maxLength ?? "the allowed number of"} characters.`
      : `${label} має містити не більше ${maxLength ?? "допустимої кількості"} символів.`;
  }

  if (control.validity.rangeUnderflow) {
    return lang === "en"
      ? `${label} must be greater than or equal to ${numericControl?.min ?? ""}.`
      : `${label} має бути не менше ${numericControl?.min ?? ""}.`;
  }

  if (control.validity.rangeOverflow) {
    return lang === "en"
      ? `${label} must be less than or equal to ${numericControl?.max ?? ""}.`
      : `${label} має бути не більше ${numericControl?.max ?? ""}.`;
  }

  if (control.validity.stepMismatch) {
    return lang === "en"
      ? `${label} has an invalid numeric format.`
      : `${label} має некоректний числовий формат.`;
  }

  return control.validationMessage || (lang === "en" ? "Please correct the field." : "Перевірте правильність заповнення поля.");
}

function fieldLabel(name: string, lang: "en" | "uk") {
  const labels: Record<string, { en: string; uk: string }> = {
    amount: { en: "Amount", uk: "Сума" },
    autoLogoutMinutes: { en: "Auto logout", uk: "Автоматичний вихід" },
    balance: { en: "Balance", uk: "Баланс" },
    categoryName: { en: "Category", uk: "Категорія" },
    color: { en: "Color", uk: "Колір" },
    confirmPassword: { en: "Password confirmation", uk: "Підтвердження пароля" },
    currentPassword: { en: "Current password", uk: "Поточний пароль" },
    currencyCode: { en: "Currency", uk: "Валюта" },
    dashboardGroup: { en: "Group", uk: "Група" },
    date: { en: "Date", uk: "Дата" },
    description: { en: "Description", uk: "Опис" },
    email: { en: "Email", uk: "Email" },
    financialAccountId: { en: "Account", uk: "Рахунок" },
    keyName: { en: "Key", uk: "Ключ" },
    label: { en: "Label", uk: "Назва" },
    limit: { en: "Limit", uk: "Ліміт" },
    locale: { en: "Language", uk: "Мова" },
    maskedPan: { en: "Card mask", uk: "Маска картки" },
    month: { en: "Month", uk: "Місяць" },
    name: { en: "Name", uk: "Назва" },
    newPassword: { en: "New password", uk: "Новий пароль" },
    numberFormat: { en: "Number format", uk: "Формат чисел" },
    password: { en: "Password", uk: "Пароль" },
    paymentType: { en: "Payment type", uk: "Тип оплати" },
    phone: { en: "Phone", uk: "Телефон" },
    provider: { en: "Provider", uk: "Провайдер" },
    savedAmount: { en: "Saved amount", uk: "Накопичено" },
    source: { en: "Source", uk: "Джерело" },
    targetAmount: { en: "Target amount", uk: "Цільова сума" },
    timezone: { en: "Time zone", uk: "Часовий пояс" },
    type: { en: "Type", uk: "Тип" },
    value: { en: "Value", uk: "Значення" },
  };

  return labels[name]?.[lang] ?? (lang === "en" ? "Field" : "Поле");
}
