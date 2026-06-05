# Функціональність скидання пароля

## Описание

Була додана повнофункціональна система скидання пароля з можливістю відправки посилання на email. Користувач може запросити скидання пароля, отримати посилання на пошту і скинути пароль через безпечне посилання.

## Компоненти, які були додані

### 1. Модель бази даних (Prisma)

**Файл**: `prisma/schema.prisma`

Додана нова модель `PasswordReset`:
```prisma
model PasswordReset {
  id        String   @id @default(cuid())
  userId    String
  tokenHash String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, expiresAt])
}
```

А також додана відношення до користувача:
```prisma
passwordResets PasswordReset[]
```

### 2. Сервіс відправки email

**Файл**: `packages/server/src/services/email.ts`

Реалізовано сервіс для відправки email за допомогою nodemailer:
- Функція `sendEmail()` - відправляє email
- Функція `formatPasswordResetEmail()` - форматує email для скидання пароля

### 3. Функціональність скидання пароля в auth.ts

**Файл**: `packages/server/src/services/auth.ts`

Додані три нові функції:

- `requestPasswordReset(email: string)` - запрос на скидання пароля
  - Генерує токен скидання пароля
  - Відправляє email з посиланням для скидання
  - Видаляє попередні токени

- `verifyPasswordResetToken(token: string)` - перевіряє валідність токена
  - Перевіряє, чи токен існує і ще не закінчився
  - Повертає користувача або null

- `resetPasswordWithToken(token: string, newPassword: string)` - скидає пароль
  - Перевіряє токен
  - Оновлює пароль користувача
  - Видаляє токен скидання
  - Скасовує всі існуючі сесії для безпеки

### 4. API Endpoints

**Файл**: `apps/api/src/index.ts`

Додані три нові API-маршрути:

#### POST `/api/auth/password-reset`
Запрос на скидання пароля.

**Request body**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "sent": true
}
```

#### GET `/api/auth/password-reset/verify`
Перевірка валідності токена скидання пароля.

**Query parameters**:
- `token` - токен скидання пароля

**Response (успішно)**:
```json
{
  "valid": true,
  "email": "user@example.com"
}
```

**Response (помилка)**:
```json
{
  "error": "Invalid or expired reset token"
}
```

#### POST `/api/auth/password-reset/confirm`
Підтвердження скидання пароля і встановлення нового пароля.

**Request body**:
```json
{
  "token": "...",
  "password": "новий_пароль_мінімум_8_символів"
}
```

**Response (успішно)**:
```json
{
  "user": {
    "id": "...",
    "email": "user@example.com",
    ...
  }
}
```

### 5. Конфігурація

**Файл**: `packages/server/src/config.ts`

Додані нові змінні оточення:

```env
# SMTP Configuration for email sending
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@fintrack.local
SMTP_FROM_NAME=FinTrack
PASSWORD_RESET_EXPIRY_MINUTES=60
```

## Як використовувати

### 1. Встановлення залежностей

```bash
npm install nodemailer
npm install -D @types/nodemailer
```

### 2. Налаштування SMTP

Налаштуйте змінні оточення в `.env`:

**Приклад для Gmail**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=FinTrack
```

**Приклад для іншого SMTP сервера**:
```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=username
SMTP_PASSWORD=password
SMTP_FROM_EMAIL=noreply@example.com
SMTP_FROM_NAME=MyApp
```

### 3. Створення міграції Prisma

```bash
cd resource-manager
npx prisma migrate dev --name add_password_reset
```

### 4. Фронтенд інтеграція

На фронтенді потрібно створити сторінку для скидання пароля. Приклад:

```typescript
// 1. Запрос на скидання пароля
async function requestPasswordReset(email: string) {
  const response = await fetch('/api/auth/password-reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return response.json();
}

// 2. Перевірка токена
async function verifyToken(token: string) {
  const response = await fetch(`/api/auth/password-reset/verify?token=${token}`);
  return response.json();
}

// 3. Встановлення нового пароля
async function resetPassword(token: string, newPassword: string) {
  const response = await fetch('/api/auth/password-reset/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  return response.json();
}
```

## Функції безпеки

1. **Токени мають час закінчення**: За умовчанням 60 хвилин
2. **Хешування токенів**: Токени зберігаються в базі як хеші, а не в відкритому вигляді
3. **Однократне використання**: Токен видаляється після використання
4. **Скасування сесій**: Після скидання пароля всі існуючі сесії скасовуються
5. **Таймування безпеки**: Використовується `timingSafeEqual` для порівняння паролів
6. **Невідкриття інформації**: API не розкриває, чи існує користувач з даною поштою

## Тестування

### Тест 1: Запрос на скидання пароля
```bash
curl -X POST http://localhost:3001/api/auth/password-reset \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@fintrack.local"}'
```

### Тест 2: Перевірка токена
```bash
curl http://localhost:3001/api/auth/password-reset/verify?token=YOUR_TOKEN
```

### Тест 3: Встановлення нового пароля
```bash
curl -X POST http://localhost:3001/api/auth/password-reset/confirm \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_TOKEN", "password": "новий_пароль_123"}'
```

## Структура папок

```
resource-manager/
├── prisma/
│   └── schema.prisma              # Оновлена зі PasswordReset моделлю
├── packages/
│   └── server/
│       └── src/
│           ├── services/
│           │   ├── auth.ts        # Оновлена з функціями скидання пароля
│           │   └── email.ts       # Новий сервіс для email
│           ├── config.ts          # Оновлена з конфігурацією email
│           └── index.ts           # Оновлена для експорту email сервісу
├── apps/
│   └── api/
│       └── src/
│           └── index.ts           # Оновлена з API endpoints
└── package.json                   # Оновлена з nodemailer залежністю
```

## Наступні кроки

1. Встановити `nodemailer` пакет
2. Налаштувати SMTP змінні оточення
3. Запустити Prisma міграцію
4. Створити сторінку для скидання пароля на фронтенді
5. Протестувати функціональність

## Примітки

- Email сервіс автоматично вимикається, якщо SMTP не налаштовано
- Вся комунікація через API забезпечена HTTPS в продакшені
- Токени скидання пароля генеруються за допомогою криптографічно безпечного генератора
