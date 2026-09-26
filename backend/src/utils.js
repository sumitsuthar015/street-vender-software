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
  shortName,
  z,
};
