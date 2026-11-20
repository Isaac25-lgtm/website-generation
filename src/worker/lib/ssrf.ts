import { HttpError } from "../env";

// Hardened outbound fetching for user-supplied URLs (inspiration analysis,
// licensed image import). Blocks private/loopback/link-local/metadata targets,
// credentials in URLs, non-HTTP schemes, odd ports, and re-validates redirects.

export class UrlRejected extends HttpError {
  constructor(message: string) { super(400, message, "url_rejected"); }
}

function ipv4Private(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = p;
  return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19)) ||
    (a === 192 && b === 0) || a >= 224;
}

function ipv6Private(ip: string): boolean {
  const x = ip.toLowerCase().replace(/^\[|\]$/g, "");
  if (x === "::1" || x === "::" ) return true;
  if (x.startsWith("fc") || x.startsWith("fd") || x.startsWith("fe8") || x.startsWith("fe9") || x.startsWith("fea") || x.startsWith("feb")) return true;
  const mapped = x.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return ipv4Private(mapped[1]);
  if (x.startsWith("::ffff:")) return true;
  return false;
}

export function isIpLiteral(host: string): boolean {
  return /^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(":") || /^\[.*\]$/.test(host);
}

/** Synchronous checks on URL shape. */
export function checkUrlShape(raw: string): URL {
  let u: URL;
  try { u = new URL(raw.trim().match(/^https?:\/\//i) ? raw.trim() : `https://${raw.trim()}`); }
  catch { throw new UrlRejected("That doesn't look like a valid web address."); }
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new UrlRejected("Only http and https links are supported.");
  if (u.username || u.password) throw new UrlRejected("Links containing usernames or passwords are not allowed.");
  if (u.port && !["80", "443"].includes(u.port)) throw new UrlRejected("Links with custom ports are not supported.");
  const host = u.hostname.toLowerCase().replace(/\.$/, "");
  if (!host.includes(".") || host === "localhost" || /\.(localhost|local|internal|lan|home|corp|intranet)$/.test(host)) throw new UrlRejected("Private or local addresses are not allowed.");
  if (/^\d+$/.test(host) || /^0x/i.test(host)) throw new UrlRejected("Numeric host names are not allowed.");
  if (isIpLiteral(host)) {
    if (host.includes(":") ? ipv6Private(host) : ipv4Private(host)) throw new UrlRejected("Private or reserved IP addresses are not allowed.");
  }
  if (raw.length > 2000) throw new UrlRejected("That link is too long.");
  u.hash = "";
  return u;
}

/** DNS check via DNS-over-HTTPS: refuse names that resolve to private ranges. */
export async function checkDns(host: string): Promise<void> {
  if (isIpLiteral(host)) return;
  for (const type of ["A", "AAAA"]) {
    let data: { Answer?: { type: number; data: string }[]; Status?: number } | null = null;
    try {
      const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${type}`, { headers: { accept: "application/dns-json" }, signal: AbortSignal.timeout(4000) });
      data = await r.json();
    } catch { throw new UrlRejected("We couldn't look up that website's address. Please check the link."); }
    for (const ans of data?.Answer ?? []) {
      if (ans.type === 1 && ipv4Private(ans.data)) throw new UrlRejected("That website resolves to a private network address.");
      if (ans.type === 28 && ipv6Private(ans.data)) throw new UrlRejected("That website resolves to a private network address.");
    }
    if (type === "A" && data?.Status === 3) throw new UrlRejected("That website address does not exist.");
  }
}

export async function validatePublicUrl(raw: string): Promise<URL> {
  const u = checkUrlShape(raw);
  await checkDns(u.hostname);
  return u;
}

export interface SafeFetchResult { url: URL; status: number; contentType: string; bytes: Uint8Array; truncated: boolean }

export async function safeFetch(raw: string | URL, opts: { maxBytes: number; timeoutMs: number; maxRedirects?: number; accept?: string }): Promise<SafeFetchResult> {
  let url = typeof raw === "string" ? await validatePublicUrl(raw) : raw;
  const deadline = AbortSignal.timeout(opts.timeoutMs);
  for (let hop = 0; hop <= (opts.maxRedirects ?? 3); hop++) {
    let res: Response;
    try {
      res = await fetch(url.toString(), {
        redirect: "manual", signal: deadline,
        headers: { "user-agent": "ImprintSitesBot/1.0 (+design inspiration preview; respects robots)", accept: opts.accept ?? "text/html,application/xhtml+xml,text/css;q=0.9,*/*;q=0.5" },
      });
    } catch (e) {
      throw new HttpError(502, (e as Error)?.name === "TimeoutError" ? "The website took too long to respond." : "We couldn't reach that website.", "fetch_failed");
    }
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) throw new HttpError(502, "The website sent an invalid redirect.", "fetch_failed");
      url = await validatePublicUrl(new URL(loc, url).toString());
      continue;
    }
    const reader = res.body?.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0, truncated = false;
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > opts.maxBytes) { chunks.push(value.slice(0, value.byteLength - (total - opts.maxBytes))); truncated = true; await reader.cancel(); break; }
        chunks.push(value);
      }
    }
    const bytes = new Uint8Array(Math.min(total, opts.maxBytes));
    let off = 0;
    for (const ch of chunks) { bytes.set(ch, off); off += ch.byteLength; }
    return { url, status: res.status, contentType: res.headers.get("content-type") || "", bytes, truncated };
  }
  throw new HttpError(502, "Too many redirects.", "fetch_failed");
}

/** Respect robots.txt Disallow rules for our user agent or "*". */
export async function robotsAllowed(u: URL): Promise<boolean> {
  try {
    const r = await safeFetch(new URL("/robots.txt", u), { maxBytes: 64_000, timeoutMs: 4000, accept: "text/plain" });
    if (r.status >= 400) return true;
    const text = new TextDecoder().decode(r.bytes);
    let applies = false;
    const disallows: string[] = [];
    for (const line of text.split(/\r?\n/)) {
      const m = line.replace(/#.*/, "").trim().match(/^([a-z-]+)\s*:\s*(.*)$/i);
      if (!m) continue;
      const [, k, v] = m;
      if (k.toLowerCase() === "user-agent") applies = v === "*" || v.toLowerCase().includes("imprintsites");
      else if (applies && k.toLowerCase() === "disallow" && v) disallows.push(v);
    }
    const path = u.pathname || "/";
    return !disallows.some((d) => path.startsWith(d));
  } catch { return true; }
}
