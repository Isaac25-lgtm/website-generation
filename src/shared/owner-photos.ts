// Owner-supplied photos (public/stock/owner-*.webp) may appear ONLY in template previews (owner rule,
// 24 Nov 2026). They are not CC0, so they must never be saved into or published on a customer's site.

export const OWNER_PREFIX = "owner-";

export function isOwnerStock(name: unknown): boolean {
  return typeof name === "string" && name.startsWith(OWNER_PREFIX);
}

/** Returns a copy of any SiteDoc-like value with every owner-only stock photo reference removed. */
export function stripOwnerPhotos<T>(value: T): T {
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk).filter((x) => x !== DROP);
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      if (typeof o.stock === "string" && o.stock.startsWith(OWNER_PREFIX)) {
        const { stock: _s, ...rest } = o;
        // An image that was only an owner photo becomes empty; arrays of images drop it entirely.
        return Object.keys(rest).some((k) => k === "assetId" || k === "art") ? rest : DROP;
      }
      return Object.fromEntries(Object.entries(o).map(([k, x]) => [k, walk(x)]).filter(([, x]) => x !== DROP));
    }
    return v;
  };
  return walk(value) as T;
}

const DROP = Symbol("drop");
