import { describe, it, expect } from "vitest";
import { PLANS, priceFor, SITE_TYPES } from "../../src/shared/pricing";
import { checkUrlShape, isIpLiteral } from "../../src/worker/lib/ssrf";
import { verifyWebhook } from "../../src/worker/lib/dodo";
import { b64, hashPassword, hmac, verifyPassword } from "../../src/worker/lib/crypto";
import { sniffMime, imageSize } from "../../src/worker/lib/storage";
import { parseCsv, safeHref, formatMoney, contrastRatio } from "../../src/shared/util";
import { ruleRefine, applyPatch } from "../../src/shared/refine";
import { generateSiteDoc } from "../../src/shared/generate";
import { parseSiteDoc } from "../../src/shared/schema";
import { buildZip, crc32 } from "../../src/worker/lib/zip";
import { TEMPLATES } from "../../src/shared/templates";

describe("locked pricing", () => {
  it("is exactly $20 / $25 / $100 one-time USD", () => {
    expect(priceFor("personal")).toBe(2000);
    expect(priceFor("business")).toBe(2500);
    expect(priceFor("ecommerce")).toBe(10000);
    for (const t of SITE_TYPES) { expect(PLANS[t].currency).toBe("USD"); expect(PLANS[t].billing).toBe("one_time"); }
    expect(Object.isFrozen(PLANS)).toBe(true);
  });
  it("rejects unknown plan types", () => { expect(() => priceFor("enterprise" as any)).toThrow(); });
});

describe("SSRF URL validation", () => {
  const bad = ["http://localhost/", "http://127.0.0.1/", "http://169.254.169.254/latest/meta-data/", "http://10.0.0.5/", "http://192.168.1.1/", "http://[::1]/",
    "http://172.16.0.1/", "http://0.0.0.0/", "file:///etc/passwd", "ftp://example.com/", "https://user:pass@example.com/", "http://example.com:8080/", "http://intranet/",
    "http://printer.local/", "http://2130706433/", "http://0x7f000001/", "http://[::ffff:127.0.0.1]/", "http://100.64.0.1/", "javascript:alert(1)"];
  for (const u of bad) it(`blocks ${u}`, () => { expect(() => checkUrlShape(u)).toThrow(); });
  it("allows normal public sites and adds https when missing", () => {
    expect(checkUrlShape("https://www.example.com/page").hostname).toBe("www.example.com");
    expect(checkUrlShape("example.org").protocol).toBe("https:");
  });
  it("detects IP literals", () => { expect(isIpLiteral("1.2.3.4")).toBe(true); expect(isIpLiteral("example.com")).toBe(false); });
});

describe("Dodo / Standard Webhooks signature", () => {
  const secretBytes = new TextEncoder().encode("super-secret-test-key-123456");
  const secret = "whsec_" + b64(secretBytes);
  const body = JSON.stringify({ type: "payment.succeeded", data: { payment_id: "pay_1" } });
  const sign = async (id: string, ts: string, payload: string) => b64(await hmac(secretBytes, `${id}.${ts}.${payload}`));
  it("accepts a valid signature", async () => {
    const ts = String(Math.floor(Date.now() / 1000));
    expect(await verifyWebhook(secret, { id: "msg_1", timestamp: ts, signature: `v1,${await sign("msg_1", ts, body)}` }, body)).toBe(true);
  });
  it("accepts when one of several signatures matches", async () => {
    const ts = String(Math.floor(Date.now() / 1000));
    expect(await verifyWebhook(secret, { id: "msg_1", timestamp: ts, signature: `v1,AAAA v1,${await sign("msg_1", ts, body)}` }, body)).toBe(true);
  });
  it("rejects tampered body, wrong id, stale timestamp and missing headers", async () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = `v1,${await sign("msg_1", ts, body)}`;
    expect(await verifyWebhook(secret, { id: "msg_1", timestamp: ts, signature: sig }, body + " ")).toBe(false);
    expect(await verifyWebhook(secret, { id: "msg_2", timestamp: ts, signature: sig }, body)).toBe(false);
    const old = String(Math.floor(Date.now() / 1000) - 3600);
    expect(await verifyWebhook(secret, { id: "msg_1", timestamp: old, signature: `v1,${await sign("msg_1", old, body)}` }, body)).toBe(false);
    expect(await verifyWebhook(secret, { id: null, timestamp: ts, signature: sig }, body)).toBe(false);
  });
});

describe("password hashing", () => {
  it("hashes with a salt and verifies", async () => {
    const h1 = await hashPassword("correct horse battery");
    const h2 = await hashPassword("correct horse battery");
    expect(h1).not.toBe(h2);
    expect(h1.startsWith("pbkdf2_sha256$100000$")).toBe(true);
    expect(await verifyPassword("correct horse battery", h1)).toBe(true);
    expect(await verifyPassword("wrong password!!", h1)).toBe(false);
    expect(await verifyPassword("x", null)).toBe(false);
  });
});

describe("upload sniffing", () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 1, 0, 0, 0, 0, 200, 8, 6, 0, 0, 0]);
  it("detects real file types from magic bytes", () => {
    expect(sniffMime(png)).toBe("image/png");
    expect(imageSize(png, "image/png")).toEqual({ width: 256, height: 200 });
    expect(sniffMime(new TextEncoder().encode("%PDF-1.7 hello world"))).toBe("application/pdf");
  });
  it("rejects SVG, HTML and disguised files", () => {
    expect(sniffMime(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'))).toBeNull();
    expect(sniffMime(new TextEncoder().encode("<!doctype html><script>alert(1)</script>"))).toBeNull();
    expect(sniffMime(new TextEncoder().encode("MZ executable pretending.png"))).toBeNull();
  });
});

describe("utilities", () => {
  it("parses CSV with quotes, commas and newlines", () => {
    const rows = parseCsv('name,price,desc\n"Shirt, linen",25,"Says ""hi""\nline2"\r\nCap,10,\n');
    expect(rows).toEqual([["name", "price", "desc"], ["Shirt, linen", "25", 'Says "hi"\nline2'], ["Cap", "10", ""]]);
  });
  it("sanitises links", () => {
    expect(safeHref("javascript:alert(1)")).toBeNull();
    expect(safeHref("data:text/html,x")).toBeNull();
    expect(safeHref("//evil.com")).toBeNull();
    expect(safeHref("/contact")).toBe("/contact");
    expect(safeHref("example.com")).toBe("https://example.com");
    expect(safeHref("tel:+256 700 000 000")).toBe("tel:+256700000000");
  });
  it("formats zero-decimal currencies correctly", () => {
    expect(formatMoney(25000, "UGX")).toContain("25,000");
    expect(formatMoney(2550, "USD")).toBe("$25.50");
  });
  it("builds valid ZIP structure", () => {
    expect(crc32(new TextEncoder().encode("hello"))).toBe(0x3610a686);
    const z = buildZip([{ name: "a.txt", data: new TextEncoder().encode("hi") }]);
    expect(new DataView(z.buffer).getUint32(0, true)).toBe(0x04034b50);
  });
});

describe("design refinement", () => {
  const doc = generateSiteDoc("business", "b-meridian", { businessName: "Acme", tagline: "x", services: [{ title: "A" }] });
  it("maps natural requests to valid token patches", () => {
    const p = ruleRefine(doc, "Make it more elegant and use more space, with smaller headings and a green colour");
    expect(p.theme.density).toBe("airy");
    expect(p.theme.fontHeading).toBe("cormorant");
    expect(p.theme.primary).toBe("#1f8a4c");
    const next = applyPatch(doc, p);
    expect(parseSiteDoc(next).ok).toBe(true);
    expect(next.theme.colors.primary).toBe("#1f8a4c");
  });
  it("explains when nothing matched", () => { expect(ruleRefine(doc, "zzzz").explanation).toMatch(/No recognised/); });
});

describe("template accessibility", () => {
  it("every template keeps readable text/background contrast (WCAG AA 4.5:1)", () => {
    for (const t of TEMPLATES) {
      const c = t.theme.colors;
      expect(contrastRatio(c.text, c.bg), `${t.id} text/bg`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(c.muted, c.bg), `${t.id} muted/bg`).toBeGreaterThanOrEqual(3);
    }
  });
});
