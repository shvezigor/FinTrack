"use client";

import { FormEvent, useState } from "react";
import { LanguageSwitcher, useI18n } from "./i18n";
import { Icon, type IconName } from "./icons";
import { handleValidationCapture, ToastPopup, useAppToastHost } from "./toast-feedback";

const dashboardHref = "/dashboard";
const registerHref = "/register";

const benefits: Array<{ icon: IconName; key: string }> = [
  { icon: "expenses", key: "expenses" },
  { icon: "income", key: "income" },
  { icon: "briefcase", key: "budget" },
  { icon: "goals", key: "goals" },
  { icon: "analytics", key: "sheets" },
  { icon: "openai", key: "ai" },
];

const pricing = [
  { amount: "0 ₴", key: "free", points: ["Telegram notes", "Manual expenses", "Basic dashboard"] },
  { amount: "129 ₴", key: "premium", points: ["Monobank sync", "AI insights", "Budgets and goals", "Google Sheets export"], recommended: true },
  { amount: "399 ₴", key: "team", points: ["Shared workspace", "Roles and access", "Advanced exports"] },
];

export function LandingPage() {
  const { lang, t } = useI18n();
  const copy = landingLocalCopy(lang);
  const { dismissToast, showToast, toast } = useAppToastHost();
  const [signupEmail, setSignupEmail] = useState("");
  const [, setSignupError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupPassword, setSignupPassword] = useState("");

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSignupError("");
    setSignupLoading(true);

    try {
      const response = await fetch("/api/proxy/auth/register", {
        body: JSON.stringify({
          email: signupEmail,
          password: signupPassword,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? copy.signupFailed);
      }

      window.location.href = "/dashboard";
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.signupFailed;
      setSignupError(message);
      showToast(message, "error");
    } finally {
      setSignupLoading(false);
    }
  }

  return (
    <main className="landing-page">
      {toast ? <ToastPopup message={toast.message} onDismiss={dismissToast} tone={toast.tone} /> : null}
      <header className="landing-header">
        <a className="landing-brand" href="#top">
          <span className="brand-mark compact-mark">
            <i />
            <i />
            <i />
          </span>
          <strong>FinTrack</strong>
        </a>
        <nav>
          <a href="#features">{t("landing.nav.product")}</a>
          <a href="#how">{t("landing.nav.how")}</a>
          <a href="#pricing">{t("landing.nav.pricing")}</a>
          <a href="#reviews">{t("landing.nav.reviews")}</a>
          <a href="#faq">{t("landing.faq")}</a>
          <a href="#blog">{t("landing.blog")}</a>
        </nav>
        <div className="landing-header-actions">
          <LanguageSwitcher compact />
          <a className="header-login" href={dashboardHref}>{t("app.login")}</a>
          <a className="header-register" href={registerHref}>{t("app.register")}</a>
        </div>
      </header>

      <section className="landing-hero" id="top">
        <div className="hero-copy">
          <p className="landing-badge">{t("landing.hero.badge")}</p>
          <h1>{t("landing.hero.title")}</h1>
          <p>{t("landing.hero.body")}</p>
          <div className="hero-actions">
            <a className="primary-link" href={registerHref}>{t("landing.hero.primary")}</a>
            <a className="secondary-link" href={dashboardHref}>
              <Icon name="chart" />
              {t("landing.hero.secondary")}
            </a>
          </div>
          <form className="landing-signup" onInvalidCapture={(event) => handleValidationCapture(event, lang)} onSubmit={handleSignup}>
            <strong>{t("landing.signup.title")}</strong>
            <label>
              <span>{t("landing.signup.email")}</span>
              <input name="email" onChange={(event) => setSignupEmail(event.target.value)} placeholder="you@email.com" required type="email" value={signupEmail} />
            </label>
            <label>
              <span>{copy.passwordLabel}</span>
              <input minLength={8} name="password" onChange={(event) => setSignupPassword(event.target.value)} placeholder="Test12345!" required type="password" value={signupPassword} />
            </label>
            <button disabled={signupLoading} type="submit">{t("landing.signup.button")}</button>
            <small>{copy.signupHint}</small>
          </form>
        </div>
        <div className="hero-visual" aria-label="FinTrack product preview">
          <FloatingStat label={t("dashboard.metrics.income")} value="42 300 ₴" />
          <FloatingStat label={t("dashboard.metrics.expenses")} value="31 780 ₴" />
          <FloatingStat label={t("dashboard.metrics.savings")} value="10 520 ₴" />
          <div className="laptop">
            <div className="laptop-screen">
              <MiniDashboard />
            </div>
            <div className="laptop-base" />
          </div>
        </div>
      </section>

      <section className="trust-row">
        <TrustItem icon="openai" text={t("landing.trust.ai")} />
        <TrustItem icon="telegram" text={t("landing.trust.telegram")} />
        <TrustItem icon="shield" text={t("landing.trust.security")} />
        <TrustItem icon="upload" text={t("landing.trust.sync")} />
      </section>

      <section className="landing-section" id="features">
        <SectionHead title="FinTrack" eyebrow={t("landing.features")} />
        <div className="benefit-grid">
          {benefits.map((benefit) => (
            <article className="benefit-card" key={benefit.key}>
              <span>
                <Icon name={benefit.icon} />
              </span>
              <strong>{t(`landing.benefit.${benefit.key}.title`)}</strong>
              <p>{t(`landing.benefit.${benefit.key}.body`)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section process-section" id="how">
        <SectionHead title={t("landing.how")} />
        <div className="process-grid">
          {["one", "two", "three"].map((step, index) => (
            <article className="process-step" key={step}>
              <span>{index + 1}</span>
              <div>
                <strong>{t(`landing.how.${step}.title`)}</strong>
                <p>{t(`landing.how.${step}.body`)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="feature-showcase">
        <ProductBlock
          bullets={copy.expenseBullets}
          title={t("landing.benefit.expenses.title")}
        />
        <ProductBlock
          bullets={copy.incomeBullets}
          image="https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=640&q=80"
          title={t("landing.benefit.income.title")}
        />
        <ProductBlock
          bullets={copy.budgetBullets}
          title={t("landing.benefit.budget.title")}
        />
        <ProductBlock
          bullets={copy.goalBullets}
          image="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=640&q=80"
          title={t("landing.benefit.goals.title")}
        />
      </section>

      <section className="landing-section analytics-band">
        <div>
          <p className="landing-badge">{t("landing.analytics.title")}</p>
          <h2>{t("landing.analytics.body")}</h2>
        </div>
        <MiniDashboard compact />
      </section>

      <section className="audience-row">
        <Audience image="https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=220&q=80" text={copy.audienceText} title={copy.audience[0]} />
        <Audience image="https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=220&q=80" text={copy.audienceText} title={copy.audience[1]} />
        <Audience image="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=220&q=80" text={copy.audienceText} title={copy.audience[2]} />
        <Audience image="https://images.unsplash.com/photo-1579621970795-87facc2f976d?auto=format&fit=crop&w=220&q=80" text={copy.audienceText} title={copy.audience[3]} />
      </section>

      <section className="landing-section" id="reviews">
        <SectionHead title={t("landing.reviews")} />
        <div className="review-grid">
          <Review image="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&q=80" name="Андрій Коваль" text={t("landing.testimonial.one")} />
          <Review image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&q=80" name="Марія Шевченко" text={t("landing.testimonial.two")} />
          <Review image="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=128&q=80" name="Олег Денисенко" text={t("landing.testimonial.three")} />
        </div>
      </section>

      <section className="landing-section" id="pricing">
        <SectionHead title={t("landing.pricing.title")} />
        <div className="pricing-grid">
          {pricing.map((plan) => (
            <article className={plan.recommended ? "pricing-card recommended" : "pricing-card"} key={plan.key}>
              {plan.recommended ? <span className="recommend-label">{copy.recommended}</span> : null}
              <strong>{copy.planNames[plan.key as keyof typeof copy.planNames]}</strong>
              <h3>{plan.amount}<small> {copy.perMonth}</small></h3>
              <p>{t(`landing.pricing.${plan.key}`)}</p>
              <ul>
                {plan.points.map((point) => (
                  <li key={point}>
                    <Icon name="check" />
                    {point}
                  </li>
                ))}
              </ul>
              <a className={plan.recommended ? "primary-link wide-link" : "secondary-link wide-link"} href={registerHref}>
                {plan.recommended ? copy.choosePremium : copy.start}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section faq-security" id="faq">
        <div>
          <SectionHead title={copy.faqTitle} />
          {copy.faq.map((question) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{t("landing.cta.body")}</p>
            </details>
          ))}
        </div>
        <div className="security-panel">
          <Icon name="shield" />
          <h3>{t("landing.security.title")}</h3>
          <p>{t("landing.security.ssl")} · {t("landing.security.gdpr")} · {t("landing.security.iso")}</p>
        </div>
      </section>

      <section className="landing-cta">
        <MiniDashboard compact />
        <div>
          <h2>{t("landing.cta.title")}</h2>
          <p>{t("landing.cta.body")}</p>
          <a className="primary-link" href={registerHref}>{t("landing.cta.button")}</a>
        </div>
      </section>

      <footer className="landing-footer">
        <div>
          <a className="landing-brand" href="#top">
            <span className="brand-mark compact-mark">
              <i />
              <i />
              <i />
            </span>
            <strong>FinTrack</strong>
          </a>
          <p>{t("landing.footer.rights")}</p>
        </div>
        <div>
          <strong>{t("landing.footer.product")}</strong>
          <a href="#features">{t("landing.features")}</a>
          <a href="#pricing">{t("landing.pricing")}</a>
          <a href={dashboardHref}>{t("app.cabinet")}</a>
        </div>
        <div>
          <strong>{t("landing.footer.resources")}</strong>
          <a href="#faq">{t("landing.faq")}</a>
          <a href="#reviews">{t("landing.reviews")}</a>
          <a href="#blog">{t("landing.blog")}</a>
        </div>
      </footer>
    </main>
  );
}

function FloatingStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="floating-stat">
      <small>{label}</small>
      <strong>{value}</strong>
      <span>+4.3%</span>
    </div>
  );
}

function MiniDashboard({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "mini-dashboard compact" : "mini-dashboard"}>
      <div className="mini-sidebar">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="mini-main">
        <div className="mini-top">
          <i />
          <i />
        </div>
        <div className="mini-cards">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="mini-grid">
          <div className="mini-chart">
            <svg viewBox="0 0 320 150">
              <path d="M0 105 C60 86 80 95 130 74 S210 30 320 58" />
              <path d="M0 126 C65 112 105 119 145 96 S230 82 320 90" />
            </svg>
          </div>
          <div className="mini-donut">
            <span />
          </div>
        </div>
        <div className="mini-lines">
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  );
}

function TrustItem({ icon, text }: { icon: IconName; text: string }) {
  return (
    <div>
      <Icon name={icon} />
      <strong>{text}</strong>
    </div>
  );
}

function SectionHead({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="section-head">
      {eyebrow ? <p>{eyebrow}</p> : null}
      <h2>{title}</h2>
    </div>
  );
}

function ProductBlock({ bullets, image, title }: { bullets: string[]; image?: string; title: string }) {
  return (
    <article className="product-block">
      <div>
        <h2>{title}</h2>
        <ul>
          {bullets.map((bullet) => (
            <li key={bullet}>
              <Icon name="check" />
              {bullet}
            </li>
          ))}
        </ul>
      </div>
      {image ? <img alt="" src={image} /> : <MiniDashboard compact />}
    </article>
  );
}

function Audience({ image, text, title }: { image: string; text: string; title: string }) {
  return (
    <article>
      <img alt="" src={image} />
      <strong>{title}</strong>
      <p>{text}</p>
    </article>
  );
}

function Review({ image, name, text }: { image: string; name: string; text: string }) {
  return (
    <article className="review-card">
      <div>
        <img alt="" src={image} />
        <div>
          <strong>{name}</strong>
          <span>★★★★★</span>
        </div>
      </div>
      <p>“{text}”</p>
    </article>
  );
}

function landingLocalCopy(lang: "en" | "uk") {
  if (lang === "en") {
    return {
      audience: ["For families", "For freelancers", "For entrepreneurs", "For personal budgets"],
      audienceText: "Personal finance control without extra noise.",
      budgetBullets: ["Flexible category budgets", "Real-time limit control", "Alerts before you reach the edge"],
      choosePremium: "Choose Premium",
      expenseBullets: ["Automatic transaction categorization", "Cash and card expense filtering", "Visual spending dynamics"],
      faq: ["Is my data safe?", "Is there a free plan?", "How do I connect Monobank?", "How does Google Sheets export work?"],
      faqTitle: "Frequently asked questions",
      goalBullets: ["Personal goal creation", "Saving plan with timeline forecast", "Motivation and transparent progress"],
      incomeBullets: ["Several income sources in one place", "Income history by account", "Income and growth forecast"],
      planNames: { free: "Free", premium: "Premium", team: "Team" },
      perMonth: "/ month",
      passwordLabel: "Password",
      recommended: "Recommended",
      signupFailed: "Could not create an account. Try another email or open the cabinet.",
      signupHint: "Use at least 8 characters. You will enter the cabinet after registration.",
      start: "Start",
    };
  }

  return {
    audience: ["Для сімʼї", "Для фрилансерів", "Для підприємців", "Для особистого бюджету"],
    audienceText: "Персональний фінансовий контроль без зайвого шуму.",
    budgetBullets: ["Гнучкі бюджети за категоріями", "Контроль лімітів у реальному часі", "Сповіщення про наближення до межі"],
    choosePremium: "Обрати Преміум",
    expenseBullets: ["Автоматична категоризація транзакцій", "Фільтрація кешу та карткових витрат", "Візуальна динаміка витрат"],
    faq: ["Чи безпечно зберігати мої дані?", "Чи є безкоштовний тариф?", "Як підключити Monobank?", "Як працює Google Sheets експорт?"],
    faqTitle: "Поширені питання",
    goalBullets: ["Створення особистих цілей", "План накопичення з прогнозом термінів", "Мотивація та прозорий прогрес"],
    incomeBullets: ["Кілька джерел доходу в одному місці", "Історія надходжень по рахунках", "Прогноз доходів і зростання"],
    planNames: { free: "Безкоштовний", premium: "Преміум", team: "Для команди" },
    perMonth: "/ місяць",
    passwordLabel: "Пароль",
    recommended: "Рекомендовано",
    signupFailed: "Не вдалося створити акаунт. Спробуйте інший email або відкрийте кабінет.",
    signupHint: "Використайте щонайменше 8 символів. Після реєстрації відкриється кабінет.",
    start: "Почати",
  };
}
