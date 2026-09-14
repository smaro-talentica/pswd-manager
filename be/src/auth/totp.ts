import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const ISSUER = 'Password Manager';
const STEP_SECONDS = 30;

export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

export function totpOtpauthUrl(email: string, secret: string): string {
  const label = encodeURIComponent(`${ISSUER}:${email}`);
  const issuer = encodeURIComponent(ISSUER);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

export function verifyTotp(secret: string, code: string): boolean {
  const trimmed = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(trimmed)) {
    return false;
  }
  const key = base32Decode(secret);
  const step = Math.floor(Date.now() / 1000 / STEP_SECONDS);
  const expected = Buffer.from(trimmed, 'utf8');
  for (const delta of [-1, 0, 1]) {
    const candidate = Buffer.from(hotp(key, BigInt(step + delta)), 'utf8');
    if (candidate.length === expected.length && timingSafeEqual(candidate, expected)) {
      return true;
    }
  }
  return false;
}

function hotp(key: Buffer, counter: bigint): string {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(counter);
  const hmac = createHmac('sha1', key).update(buffer).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const binary =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);
  return String(binary % 1_000_000).padStart(6, '0');
}

function base32Encode(bytes: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32Decode(input: string): Buffer {
  const cleaned = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of cleaned) {
    const index = ALPHABET.indexOf(char);
    if (index < 0) {
      continue;
    }
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}
