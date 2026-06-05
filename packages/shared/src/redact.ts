export function maskSecret(value: string | null | undefined): string {
  if (!value) {
    return "not set";
  }

  if (value.length <= 8) {
    return "••••";
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function redactSecrets(value: unknown): string {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text
    .replace(/sk-[A-Za-z0-9_-]{12,}/g, "[redacted]")
    .replace(/(X-Token[:=]\s*)[A-Za-z0-9_-]{12,}/gi, "$1[redacted]")
    .replace(/("private_key"\s*:\s*")[^"]+/g, '$1[redacted]')
    .replace(/("token"\s*:\s*")[^"]+/gi, '$1[redacted]');
}
