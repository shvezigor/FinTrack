/**
 * Password Reset Frontend Integration Example
 * 
 * This file shows how to integrate the password reset functionality
 * into your React/Next.js frontend.
 */

// Step 1: Request password reset
export async function requestPasswordReset(email: string): Promise<{ sent: boolean }> {
  const response = await fetch('/api/auth/password-reset', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to request password reset');
  }

  return response.json();
}

// Step 2: Verify reset token
export async function verifyResetToken(token: string): Promise<{ valid: boolean; email: string }> {
  const response = await fetch(`/api/auth/password-reset/verify?token=${encodeURIComponent(token)}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Invalid token');
  }

  return response.json();
}

// Step 3: Confirm password reset
export async function confirmPasswordReset(token: string, newPassword: string): Promise<{ user: any }> {
  const response = await fetch('/api/auth/password-reset/confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, password: newPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to reset password');
  }

  return response.json();
}

/**
 * Example React Component: Request Password Reset
 */
export function RequestPasswordResetForm() {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await requestPasswordReset(email);
      setSuccess(true);
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="alert alert-success">
        <p>Посилання для скидання пароля було надіслано на вашу пошту.</p>
        <p>Перевірте спам-папку, якщо не бачите лист.</p>
        <button onClick={() => setSuccess(false)} className="btn btn-primary">
          Назад
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={loading}
        />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <button type="submit" disabled={loading} className="btn btn-primary">
        {loading ? 'Відправлення...' : 'Скинути пароль'}
      </button>
    </form>
  );
}

/**
 * Example React Component: Confirm Password Reset
 */
export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [verifying, setVerifying] = React.useState(true);
  const [tokenValid, setTokenValid] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const router = useRouter();

  React.useEffect(() => {
    verifyToken();
  }, [token]);

  async function verifyToken() {
    try {
      const result = await verifyResetToken(token);
      setTokenValid(true);
      setEmail(result.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid token');
      setTokenValid(false);
    } finally {
      setVerifying(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Паролі не збігаються');
      return;
    }

    if (password.length < 8) {
      setError('Пароль повинен бути мінімум 8 символів');
      return;
    }

    setLoading(true);

    try {
      const result = await confirmPasswordReset(token, password);
      // Redirect to dashboard or login
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  if (verifying) {
    return <div className="loading">Перевірка посилання...</div>;
  }

  if (!tokenValid) {
    return (
      <div className="alert alert-error">
        <p>{error}</p>
        <p>Посилання невалідне або закінчилося.</p>
        <a href="/login">Повернутися до входу</a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <p>Введіть новий пароль для {email}</p>

      <div className="form-group">
        <label htmlFor="password">Новий пароль</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Мінімум 8 символів"
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Підтвердіть пароль</label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Повторіть пароль"
          required
          disabled={loading}
        />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <button type="submit" disabled={loading} className="btn btn-primary">
        {loading ? 'Встановлення пароля...' : 'Встановити новий пароль'}
      </button>
    </form>
  );
}

/**
 * Example Route Setup for Next.js
 * 
 * File: app/forgot-password/page.tsx
 */
export function ForgotPasswordPage() {
  return (
    <div className="container">
      <h1>Забули пароль?</h1>
      <RequestPasswordResetForm />
    </div>
  );
}

/**
 * Example Route Setup for Next.js
 * 
 * File: app/reset-password/page.tsx
 */
export function ResetPasswordPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token;

  if (!token) {
    return (
      <div className="container">
        <div className="alert alert-error">
          <p>Посилання невалідне. Будь ласка, запросіть новий лист для скидання пароля.</p>
          <a href="/forgot-password">Запросити нове посилання</a>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Встановити новий пароль</h1>
      <ResetPasswordForm token={token} />
    </div>
  );
}
