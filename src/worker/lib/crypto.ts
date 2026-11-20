// WebCrypto helpers (Workers runtime + Node 20+ compatible).

const enc = new TextEncoder();

export function b64(bytes: ArrayBuffer | Uint8Array): string {
  const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
  return btoa(s);
}

export function b64url(bytes: ArrayBuffer | Uint8Array): string {
  return b64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromB64(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "="));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function randomToken(bytes = 32): string {
  const b = new Uint8Array(bytes);
  crypto.getRandomValues(b);
  return b64url(b);
}

export function newId(prefix: string): string {
  const b = new Uint8Array(15);
  crypto.getRandomValues(b);
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (const x of b) s += alphabet[x % 36];
  return `${prefix}_${s}`;
}

export async function sha256Hex(input: string | ArrayBuffer | Uint8Array): Promise<string> {
  const data = typeof input === "string" ? enc.encode(input) : input;
  const d = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export async function hmac(keyBytes: Uint8Array, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
}

export async function hmacB64url(secret: string, message: string): Promise<string> {
  return b64url(await hmac(enc.encode(secret), message));
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// Password hashing: PBKDF2-HMAC-SHA256, 100k iterations (Workers' WebCrypto cap), 16-byte salt.
const ITERATIONS = 100_000;

export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const hash = await pbkdf2(password, salt, ITERATIONS);
  return `pbkdf2_sha256$${ITERATIONS}$${b64(salt)}$${b64(hash)}`;
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const [alg, iterStr, saltB64, hashB64] = stored.split("$");
  if (alg !== "pbkdf2_sha256") return false;
  const iter = Number(iterStr);
  if (!Number.isInteger(iter) || iter < 10_000 || iter > ITERATIONS) return false;
  const hash = await pbkdf2(password, fromB64(saltB64), iter);
  return timingSafeEqual(b64(hash), hashB64);
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", enc.encode(password.normalize("NFKC")), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
  return new Uint8Array(bits);
}
