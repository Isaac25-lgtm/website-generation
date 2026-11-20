import { parseMoney, parsePrice } from "../shared/util";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

// ── API client ──
export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string, public data?: any) { super(message); }
}

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
  const headers: Record<string, string> = { "x-requested-with": "imprintsites-app" };
  let body: BodyInit | undefined;
  if (opts.form) body = opts.form;
  else if (opts.body !== undefined) { headers["content-type"] = "application/json"; body = JSON.stringify(opts.body); }
  let res: Response;
  try {
    res = await fetch(path, { method: opts.method ?? (body ? "POST" : "GET"), headers, body, credentials: "same-origin" });
  } catch {
    throw new ApiError(0, "Network error. Check your connection and try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || `Request failed (${res.status})`, data.code, data);
  return data as T;
}

// ── Auth + config ──
export interface Me { id: string; email: string; name: string; isAdmin: boolean; emailVerified: boolean; hasPassword: boolean; google: boolean }
export interface Config {
  appName: string;
  prices: { type: string; name: string; priceCents: number }[];
  payments: { configured: boolean; mode: string };
  ai: { available: boolean; perProjectLimit: number };
  google: { enabled: boolean };
  browserRun: { bound: boolean };
  email: { configured: boolean };
  storage: string;
  hosting: { status: string; amount: string; amounts?: Partial<Record<"personal" | "business" | "ecommerce", string>>; currency: string; interval: string };
  operator: { name: string; note: string; supportEmail: string };
  demos: { slug: string; type: string; url: string }[];
}

interface AppCtx { me: Me | null; loading: boolean; config: Config | null; refresh: () => Promise<void>; toast: (msg: string, kind?: "ok" | "err") => void }
const Ctx = createContext<AppCtx>(null as unknown as AppCtx);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<Config | null>(null);
  const [toasts, setToasts] = useState<{ id: number; msg: string; kind: string }[]>([]);
  const refresh = useCallback(async () => {
    try { const r = await api<{ user: Me | null }>("/api/auth/me"); setMe(r.user); } catch { setMe(null); }
    setLoading(false);
  }, []);
  useEffect(() => { refresh(); api<Config>("/api/config").then(setConfig).catch(() => {}); }, [refresh]);
  const toast = useCallback((msg: string, kind: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <Ctx.Provider value={{ me, loading, config, refresh, toast }}>
      {children}
      <div className="toasts" role="status" aria-live="polite">{toasts.map((t) => <div key={t.id} className={`toast ${t.kind === "err" ? "err" : ""}`}>{t.msg}</div>)}</div>
    </Ctx.Provider>
  );
}

export const usd = (cents: number) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;

type SiteKind = "personal" | "business" | "ecommerce";
/** Owner-approved hosting & maintenance per published site per month, used until the admin settings load. */
const HOSTING_DEFAULTS: Record<SiteKind, string> = { personal: "3", business: "4", ecommerce: "5" };

/**
 * Hosting & maintenance price as configured by the admin, per site type (approved: $3 personal, $4 business,
 * $5 online store). `label` is the price for `type` (business when omitted); `range` spans all types, e.g. "$3–$5".
 */
export function hostingPrice(config: Config | null, type?: string): { label: string; range: string; byType: Record<SiteKind, string>; amount: string; interval: string; billingLive: boolean } {
  const h = config?.hosting;
  const cur = h?.currency || "USD";
  const interval = h?.interval || "month";
  const amounts = { ...HOSTING_DEFAULTS };
  for (const k of Object.keys(amounts) as SiteKind[]) { const v = h?.amounts?.[k]; if (v) amounts[k] = v; }
  const fmt = (a: string) => (cur === "USD" ? `$${a}` : `${cur} ${a}`);
  const kind: SiteKind = type === "personal" || type === "ecommerce" ? type : "business";
  const nums = Object.values(amounts).map(Number).filter(Number.isFinite);
  const lo = String(Math.min(...nums)), hi = String(Math.max(...nums));
  const range = lo === hi ? fmt(lo) : cur === "USD" ? `$${lo}–$${hi}` : `${cur} ${lo}–${hi}`;
  const byType = { personal: fmt(amounts.personal), business: fmt(amounts.business), ecommerce: fmt(amounts.ecommerce) };
  return { label: fmt(amounts[kind]), range, byType, amount: amounts[kind], interval, billingLive: h?.status === "active" };
}

export function money(minor: number, currency: string) {
  const zero = ["UGX", "JPY", "KRW", "RWF", "XOF", "XAF", "VND", "BIF", "CLP", "GNF", "PYG"].includes(currency);
  try { return new Intl.NumberFormat("en", { style: "currency", currency, minimumFractionDigits: zero ? 0 : 2, maximumFractionDigits: zero ? 0 : 2 }).format(zero ? minor : minor / 100); }
  catch { return `${currency} ${zero ? minor : (minor / 100).toFixed(2)}`; }
}
export const isZeroDecimal = (c: string) => ["UGX", "JPY", "KRW", "RWF", "XOF", "XAF", "VND", "BIF", "CLP", "GNF", "PYG"].includes(c);
/** Merchant-entered price → minor units, or null when it isn't a valid, unambiguous price (see parsePrice). */
export const toMinor = (major: string | number, c: string): number | null => parseMoney(major, c);
export const priceError = (major: string, c: string): string | null => { const r = parsePrice(major, c); return r.ok ? null : r.error; };
export const toMajor = (minor: number, c: string) => (isZeroDecimal(c) ? String(minor) : (minor / 100).toFixed(2));

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const run = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await fn()); } catch (e) { setError((e as Error).message); }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { run(); }, [run]);
  return { data, error, loading, reload: run, setData };
}

export function fmtDate(ms: number | null | undefined) {
  if (!ms) return "—";
  return new Date(ms).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/** Downscale images in the browser before upload (max 2000px, ~0.86 quality). PDFs/GIFs pass through. */
export async function compressImage(file: File): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 350_000) return file;
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return file;
  const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const type = file.type === "image/png" ? "image/webp" : "image/jpeg";
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, type, 0.86));
  return blob && blob.size < file.size ? blob : file;
}

/** Sample dominant colours from an image (used for screenshot-based inspiration). */
export async function sampleColors(file: Blob): Promise<string[]> {
  const bmp = await createImageBitmap(file);
  const c = document.createElement("canvas");
  c.width = 64; c.height = Math.max(1, Math.round((64 * bmp.height) / bmp.width));
  const ctx = c.getContext("2d")!;
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  const buckets = new Map<string, number>();
  for (let i = 0; i < d.length; i += 4) {
    const k = [d[i], d[i + 1], d[i + 2]].map((v) => Math.min(255, Math.round(v / 24) * 24));
    const hex = "#" + k.map((v) => v.toString(16).padStart(2, "0")).join("");
    buckets.set(hex, (buckets.get(hex) ?? 0) + 1);
  }
  return [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map((x) => x[0]);
}
