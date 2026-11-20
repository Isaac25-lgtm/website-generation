// Pure helpers shared by the Worker and the browser bundle.

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "`": "&#96;",
};

/** Escape untrusted text for HTML text nodes and quoted attribute values. */
export function esc(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"'`]/g, (c) => HTML_ESCAPES[c]);
}

/** Render plain text with paragraph + line breaks, escaped. */
export function paragraphs(text: string | undefined, cls = ""): string {
  if (!text) return "";
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p${cls ? ` class="${cls}"` : ""}>${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function slugify(input: string, max = 48): string {
  const s = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/g, "");
  return s || "site";
}

/**
 * Allow only safe link targets in generated sites: http(s), mailto, tel, wa.me
 * and same-site relative paths/anchors. Anything else (javascript:, data:, etc.) is dropped.
 */
export function safeHref(url: string | undefined | null): string | null {
  if (!url) return null;
  const u = url.trim();
  if (!u) return null;
  if (u.startsWith("#")) return u;
  if (u.startsWith("/") && !u.startsWith("//")) return u;
  if (/^mailto:[^\s]+$/i.test(u)) return u;
  if (/^tel:[+0-9()\-\s]+$/i.test(u)) return u.replace(/\s/g, "");
  try {
    const parsed = new URL(u);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    if (parsed.username || parsed.password) return null;
    return parsed.toString();
  } catch {
    // bare domain like "example.com/path"
    if (/^[a-z0-9.-]+\.[a-z]{2,}(\/[^\s]*)?$/i.test(u)) return `https://${u}`;
    return null;
  }
}

export function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

const ZERO_DECIMAL = new Set(["UGX", "JPY", "KRW", "RWF", "XOF", "XAF", "VND", "BIF", "CLP", "GNF", "PYG"]);

export function currencyDecimals(currency: string): number {
  return ZERO_DECIMAL.has(currency.toUpperCase()) ? 0 : 2;
}

/** Format integer minor units. For zero-decimal currencies the minor unit IS the major unit. */
export function formatMoney(minor: number, currency: string): string {
  const decimals = currencyDecimals(currency);
  const major = decimals === 0 ? minor : minor / 100;
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(major);
  } catch {
    return `${currency.toUpperCase()} ${major.toFixed(decimals)}`;
  }
}

/** Parse a user-entered major-unit price ("12.50") into minor units. */
export function parseMoney(input: string | number, currency: string): number | null {
  const n = typeof input === "number" ? input : Number(String(input).replace(/[, ]/g, ""));
  if (!Number.isFinite(n) || n < 0 || n > 1e9) return null;
  const decimals = currencyDecimals(currency);
  return Math.round(decimals === 0 ? n : n * 100);
}

export function digitsOnly(phone: string | undefined): string {
  return (phone || "").replace(/[^0-9]/g, "");
}

export function whatsappLink(number: string | undefined, text?: string): string | null {
  const d = digitsOnly(number);
  if (d.length < 8) return null;
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** Deterministic 32-bit hash for seeding generated art. */
export function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Pick black or white text for a background, whichever has the better contrast. */
export function readableOn(bg: string): string {
  return contrastRatio(bg, "#ffffff") >= contrastRatio(bg, "#111111") ? "#ffffff" : "#111111";
}

export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

export function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + "…";
}

export function uid(prefix = ""): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let s = "";
  for (const b of bytes) s += "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36];
  return prefix ? `${prefix}_${s}` : s;
}

/** Minimal RFC 4180 CSV parser (quoted fields, escaped quotes, CRLF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let i = 0;
  let inQuotes = false;
  const src = text.replace(/^﻿/, "");
  while (i < src.length) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\r" || c === "\n") {
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
      if (c === "\r" && src[i + 1] === "\n") i++;
      i++;
      continue;
    }
    field += c;
    i++;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}
