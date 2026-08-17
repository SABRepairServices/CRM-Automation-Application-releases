import crypto from 'crypto';

// Stores third-party API credentials (WhatsApp Business token) at rest,
// not in plaintext. Requires ENCRYPTION_KEY in the environment — a 32-byte
// key, base64 or hex encoded. Generate one with:
//   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
const ALGORITHM = 'aes-256-gcm';

const getKey = () => {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('ENCRYPTION_KEY is not set — cannot store or read encrypted credentials.');
  }
  const key = Buffer.from(raw, raw.length === 64 ? 'hex' : 'base64');
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must decode to exactly 32 bytes (aes-256).');
  }
  return key;
};

/** Returns `iv:authTag:ciphertext`, all base64 — a single string that
 *  fits in one VARCHAR column. */
const encrypt = (plaintext) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join(':');
};

const decrypt = (stored) => {
  const [ivB64, tagB64, dataB64] = String(stored).split(':');
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('Malformed encrypted value.');
  }
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]);
  return plaintext.toString('utf8');
};

export { encrypt, decrypt };
