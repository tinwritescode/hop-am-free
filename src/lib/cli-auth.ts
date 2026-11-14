import { createHash, randomBytes, randomInt } from "node:crypto";

// No 0/O, 1/I: people read the code off a terminal and type it into a browser.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function newUserCode(): string {
  const chars = Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]);
  return `${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
}

export function normalizeUserCode(input: string): string | null {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (raw.length !== 8 || [...raw].some((c) => !ALPHABET.includes(c))) return null;
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

/** 256 random bits, base64url. Only `hashSecret` of it is ever stored. */
export function newSecret(prefix: string): string {
  return prefix + randomBytes(32).toString("base64url");
}

export function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

export function bearerToken(header: string | null): string | null {
  const m = /^bearer\s+(\S+)\s*$/i.exec(header ?? "");
  return m ? m[1] : null;
}

/** A same-site path to return to after sign-in; anything that could leave the site is dropped. */
export function safeReturnTo(path: string | null): string | null {
  return path && /^\/(?![/\\])/.test(path) ? path : null;
}
