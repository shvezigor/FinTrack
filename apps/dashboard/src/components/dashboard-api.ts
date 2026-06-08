export const apiOrigin = process.env.NEXT_PUBLIC_API_PUBLIC_URL ?? "http://localhost:3001";

export const defaultEmail = "admin@fintrack.local";

export function authHeaders(token?: string | null, password?: string | null, json = false) {
  const headers: Record<string, string> = {};
  if (token && token !== "__cookie__") headers.Authorization = `Bearer ${token}`;
  if (password && isHeaderSafe(password)) headers["x-dashboard-password"] = password;
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

export function authErrorText(value?: string | null) {
  if (value === "google_not_configured") return "Google вхід ще не налаштований. Додайте GOOGLE_OAUTH_CLIENT_ID та GOOGLE_OAUTH_CLIENT_SECRET.";
  if (value === "google_invalid_state") return "Google сесія застаріла. Спробуйте увійти ще раз.";
  return "Google вхід не завершився. Спробуйте ще раз.";
}

function isHeaderSafe(value: string) {
  return /^[\u0009\u0020-\u007e\u0080-\u00ff]*$/.test(value);
}
