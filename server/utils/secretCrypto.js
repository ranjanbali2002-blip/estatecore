const crypto = require('crypto');

/**
 * AES-256-GCM encryption for secrets at rest (e.g. Meta Page Access Tokens).
 * Key is derived from META_ENCRYPTION_KEY (any string) via SHA-256 → 32 bytes.
 * Output format: "enc:v1:" + base64(iv[12] || authTag[16] || ciphertext)
 */
const PREFIX = 'enc:v1:';

function key() {
  const secret = process.env.META_ENCRYPTION_KEY;
  if (!secret) throw new Error('META_ENCRYPTION_KEY is not set');
  return crypto.createHash('sha256').update(secret).digest(); // 32 bytes
}

function encrypt(plaintext) {
  if (plaintext == null) return plaintext;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const ct = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, ct]).toString('base64');
}

function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

function decrypt(value) {
  if (!isEncrypted(value)) return value; // tolerate legacy plaintext
  const raw = Buffer.from(value.slice(PREFIX.length), 'base64');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const ct = raw.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}

module.exports = { encrypt, decrypt, isEncrypted };
