import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";

export type EncryptedValue = {
  iv: string;
  tag: string;
  value: string;
};

export function encryptSecret(plainText: string, masterKey: string): string {
  const key = deriveKey(masterKey);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const payload: EncryptedValue = {
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    value: encrypted.toString("base64"),
  };

  return JSON.stringify(payload);
}

export function decryptSecret(encryptedPayload: string, masterKey: string): string {
  const payload = JSON.parse(encryptedPayload) as EncryptedValue;
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    deriveKey(masterKey),
    Buffer.from(payload.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(payload.value, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

function deriveKey(masterKey: string): Buffer {
  if (!masterKey.trim()) {
    throw new Error("APP_SECRET_KEY is required for encrypted settings");
  }

  return crypto.createHash("sha256").update(masterKey).digest();
}
