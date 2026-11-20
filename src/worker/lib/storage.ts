import type { AppEnv } from "../env";
import { HttpError } from "../env";

// Uploaded media storage. Uses R2 when the MEDIA binding exists; otherwise
// falls back to chunked BLOBs in D1 so uploads work before R2 is enabled.

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_DOC_BYTES = 10 * 1024 * 1024;
const D1_CHUNK = 1_500_000;

export type AllowedMime = "image/jpeg" | "image/png" | "image/webp" | "image/gif" | "application/pdf";

/** Detect file type from magic bytes. SVG/HTML and anything unknown are rejected. */
export function sniffMime(b: Uint8Array): AllowedMime | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a) return "image/png";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return "image/gif";
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d) return "application/pdf";
  return null;
}

export function extFor(mime: string): string {
  return { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "application/pdf": "pdf" }[mime] ?? "bin";
}

/** Best-effort image dimensions from headers (PNG, GIF, WebP, JPEG). */
export function imageSize(b: Uint8Array, mime: string): { width: number; height: number } | null {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  try {
    if (mime === "image/png") return { width: dv.getUint32(16), height: dv.getUint32(20) };
    if (mime === "image/gif") return { width: dv.getUint16(6, true), height: dv.getUint16(8, true) };
    if (mime === "image/webp") {
      const fmt = String.fromCharCode(b[12], b[13], b[14], b[15]);
      if (fmt === "VP8 ") return { width: dv.getUint16(26, true) & 0x3fff, height: dv.getUint16(28, true) & 0x3fff };
      if (fmt === "VP8L") { const bits = dv.getUint32(21, true); return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }; }
      if (fmt === "VP8X") return { width: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)), height: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)) };
    }
    if (mime === "image/jpeg") {
      let i = 2;
      while (i < b.length - 9) {
        if (b[i] !== 0xff) { i++; continue; }
        const marker = b[i + 1];
        const len = dv.getUint16(i + 2);
        if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
          return { height: dv.getUint16(i + 5), width: dv.getUint16(i + 7) };
        }
        i += 2 + len;
      }
    }
  } catch { /* fall through */ }
  return null;
}

export function storageBackend(env: AppEnv): "r2" | "d1" {
  return env.MEDIA ? "r2" : "d1";
}

export async function putBlob(env: AppEnv, key: string, bytes: Uint8Array, mime: string): Promise<"r2" | "d1"> {
  if (env.MEDIA) {
    await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: mime } });
    return "r2";
  }
  if (bytes.byteLength > 6 * 1024 * 1024) throw new HttpError(413, "Files larger than 6 MB need R2 storage, which is not enabled yet. Please upload a smaller file.");
  const stmts: D1PreparedStatement[] = [];
  for (let i = 0, n = 0; i < bytes.byteLength; i += D1_CHUNK, n++) {
    stmts.push(env.DB.prepare("INSERT INTO asset_blobs (asset_id, chunk, data) VALUES (?, ?, ?)").bind(key, n, bytes.slice(i, i + D1_CHUNK)));
  }
  await env.DB.batch(stmts);
  return "d1";
}

export async function getBlob(env: AppEnv, storage: string, key: string): Promise<ReadableStream | ArrayBuffer | null> {
  if (storage === "r2") {
    if (!env.MEDIA) return null;
    const obj = await env.MEDIA.get(key);
    return obj ? obj.body : null;
  }
  const rows = await env.DB.prepare("SELECT data FROM asset_blobs WHERE asset_id = ? ORDER BY chunk").bind(key).all<{ data: ArrayBuffer | number[] }>();
  if (!rows.results.length) return null;
  const parts = rows.results.map((r) => (r.data instanceof ArrayBuffer ? new Uint8Array(r.data) : new Uint8Array(r.data as number[])));
  const total = parts.reduce((a, p) => a + p.byteLength, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) { out.set(p, off); off += p.byteLength; }
  return out.buffer;
}

export async function deleteBlob(env: AppEnv, storage: string, key: string): Promise<void> {
  if (storage === "r2") { await env.MEDIA?.delete(key); return; }
  await env.DB.prepare("DELETE FROM asset_blobs WHERE asset_id = ?").bind(key).run();
}
