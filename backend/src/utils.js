const crypto = require('crypto');
const { z } = require('zod');
const config = require('./config');

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Validates `data` with a zod schema and throws a 400 with a readable message if it's invalid. */
function validate(schema, data) {
  const result = schema.safeParse(data ?? {});
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue.path.join('.');
    throw new HttpError(400, field ? `${field}: ${issue.message}` : issue.message);
  }
  return result.data;
}

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

/** Today's date as YYYY-MM-DD in the shop timezone (used for daily tokens and stats). */
function dayKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: config.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function lastDayKeys(count) {
  const keys = [];
  for (let i = count - 1; i >= 0; i--) keys.push(dayKey(new Date(Date.now() - i * 86400000)));
  return keys;
}

function slugify(text) {
  return (
    String(text)
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'shop'
  );
}

// No 0/O/1/I/L so codes are easy to read out loud
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function randomCode(length = 10) {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return code;
}

/** Turns a "data:image/jpeg;base64,..." upload into { data: Buffer, contentType } for MongoDB. */
function parseImageDataUrl(dataUrl, maxBytes = 1.5 * 1024 * 1024) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl));
  if (!match) throw new HttpError(400, 'Photo must be a JPG, PNG or WEBP image');
  const data = Buffer.from(match[2], 'base64');
  if (data.length > maxBytes) throw new HttpError(413, `Photo is too large (max ${Math.round(maxBytes / 1024 / 1024 * 10) / 10} MB)`);
  return { data, contentType: match[1] };
}

// Key for secrets we keep in the database (vendors' Razorpay secrets), derived from JWT_SECRET.
// If JWT_SECRET changes, old secrets can't be read anymore and vendors have to enter them again.
const secretKey = Buffer.from(crypto.hkdfSync('sha256', config.jwtSecret, '', 'vendor-secrets', 32));

/** Encrypts a secret (AES-256-GCM) so a leaked database doesn't leak vendors' payment keys. */
function encryptSecret(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', secretKey, iv);
  const data = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString('base64')).join('.');
}

/** Returns null if the value can't be decrypted (e.g. JWT_SECRET was changed). */
function decryptSecret(stored) {
  try {
    const [iv, tag, data] = String(stored).split('.').map((part) => Buffer.from(part, 'base64'));
    const decipher = crypto.createDecipheriv('aes-256-gcm', secretKey, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

/** "Rahul Sharma" -> "Rahul S." so public reviews don't expose full names. */
function shortName(name) {
  const parts = String(name).trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0];
}

module.exports = {
  HttpError,
  validate,
  objectId,
  dayKey,
  lastDayKeys,
  slugify,
  randomCode,
  parseImageDataUrl,
  encryptSecret,
  decryptSecret,
  shortName,
  z,
};
