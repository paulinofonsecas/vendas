import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * AES-256-GCM para credenciais de perfis (Netflix, etc.).
 * Formato: v1.<iv_b64>.<tag_b64>.<ciphertext_b64>
 *
 * A chave vive em SECRETS_ENC_KEY (env do servidor). Nunca é enviada ao browser
 * e a coluna `secret_ciphertext` nunca é exposta fora do admin.
 */
function getKey(): Buffer {
  const raw = process.env.SECRETS_ENC_KEY;
  if (!raw) throw new Error("SECRETS_ENC_KEY não está definida.");

  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("SECRETS_ENC_KEY tem de ser 32 bytes em base64.");
  }
  return key;
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);

  return [
    "v1",
    iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    ciphertext.toString("base64"),
  ].join(".");
}

export function decryptSecret(payload: string): string {
  const [version, iv, tag, ciphertext] = payload.split(".");
  if (version !== "v1" || !iv || !tag || !ciphertext) {
    throw new Error("Segredo em formato desconhecido.");
  }

  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
