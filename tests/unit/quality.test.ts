import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { STORE_CATEGORIES, TEMPLATES } from "../../src/shared/templates";
import { PERSONAS, demoProductViews } from "../../src/shared/demo";
import { generateSiteDoc } from "../../src/shared/generate";
import { renderSite } from "../../src/shared/render";
import { copySlop, cssSlop } from "../../src/shared/quality";

// Owner rules (24 Nov 2026): no AI slop anywhere, and every template is a complete site.

function strings(v: unknown, out: string[] = []): string[] {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => strings(x, out));
  return out;
}

describe("no-AI-slop rule", () => {
  it("detects slop in copy and CSS", () => {
    expect(copySlop("Elevate your style with our seamless experience")).toMatch(/cliché/);
    expect(copySlop("We repair anything we have made, for life.")).toBeNull();
    expect(copySlop("Fresh flowers 🌸")).toBe("emoji");
    expect(cssSlop(".hero h1{background:linear-gradient(red,blue);-webkit-background-clip:text;background-clip:text}")).toBe("gradient text");
    expect(cssSlop(".btn{box-shadow:0 0 0 1px var(--primary)}")).toBeNull();
    expect(cssSlop(".btn{box-shadow:0 0 24px -6px var(--primary)}")).toBe("neon glow");
  });

  for (const tpl of TEMPLATES) {
    it(`${tpl.id}: template CSS, ornaments and description are clean`, () => {
      expect(cssSlop(tpl.css), `${tpl.id} css`).toBeNull();
      expect(["blobs", "grid"], `${tpl.id} ornament`).not.toContain(tpl.theme.ornament);
      expect(copySlop(tpl.description), `${tpl.id} description`).toBeNull();
    });
    it(`${tpl.id}: demo copy is clean`, () => {
      const p = PERSONAS[tpl.id];
      for (const s of strings([p.answers, p.products, p.collections])) expect(copySlop(s), s).toBeNull();
    });
  }
});

describe("Signature storefronts", () => {
  const sig = TEMPLATES.filter((t) => t.rank === "signature");
  it("has the batch-1 Signature set across fashion, menswear, jewellery, furniture and home", () => {
    expect(sig.length).toBeGreaterThanOrEqual(25);
    for (const c of ["fashion", "menswear", "jewellery", "furniture", "home"]) expect(sig.some((t) => t.category === c), c).toBe(true);
  });

  for (const tpl of TEMPLATES.filter((t) => t.type === "ecommerce")) {
    it(`${tpl.id}: valid category, real photos and a complete site`, () => {
      expect(STORE_CATEGORIES.map((c) => c.key)).toContain(tpl.category);
      const persona = PERSONAS[tpl.id];
      const doc = generateSiteDoc("ecommerce", tpl.id, persona.answers);
      const slugs = doc.pages.map((p) => p.slug);
      // Full site: home, shop, about (story + FAQ) and contact, plus product, cart, checkout and policy pages.
      expect(slugs).toEqual(expect.arrayContaining(["", "shop", "about", "contact"]));
      if (tpl.rank === "signature") {
        const stock = strings([persona.answers.heroImage, persona.answers.gallery, persona.products?.map((p) => [p.image, p.images])]).filter((s) => /^[a-z0-9-]+$/.test(s) && s.includes("-"));
        for (const name of stock) expect(existsSync(`public/stock/${name}.webp`), `${tpl.id} photo ${name}`).toBe(true);
        expect(persona.products!.every((p) => p.image), `${tpl.id} every product has a photo`).toBe(true);
        const store = demoProductViews(persona, doc.store!.currency);
        const ctx = { mode: "template" as const, basePath: "/s/x", projectId: "p1", apiBase: "", assetUrl: (id: string) => `/media/${id}`, store, platformName: "ImprintSites AI", platformUrl: "https://example.test", renderedAt: 0 };
        const home = renderSite(doc, tpl, ctx, "").html;
        expect(home).toContain(`lay-${tpl.layout}`);
        for (const path of ["", "shop", "about", `product/${store.products[0].handle}`]) expect(renderSite(doc, tpl, ctx, path).html, `/${path}`).not.toContain(`src="data:image/svg`); // no generated placeholder art in a Signature demo
        const pdp = renderSite(doc, tpl, ctx, `product/${store.products[0].handle}`).html;
        expect(pdp).toContain('class="sec related"');
      }
    });
  }
});

describe("Signature personal and business sites", () => {
  const sig = TEMPLATES.filter((t) => t.rank === "signature" && t.type !== "ecommerce");
  it("has Signature personal and business templates", () => {
    expect(sig.filter((t) => t.type === "personal").length).toBeGreaterThanOrEqual(8);
    expect(sig.filter((t) => t.type === "business").length).toBeGreaterThanOrEqual(8);
  });
  for (const tpl of sig) {
    it(`${tpl.id}: complete site with real photos only`, () => {
      const persona = PERSONAS[tpl.id];
      const doc = generateSiteDoc(tpl.type, tpl.id, persona.answers);
      const ctx = { mode: "template" as const, basePath: "/s/x", projectId: "p1", apiBase: "", assetUrl: (id: string) => `/media/${id}`, platformName: "ImprintSites AI", platformUrl: "https://example.test", renderedAt: 0 };
      expect(doc.pages.map((p) => p.slug)).toEqual(expect.arrayContaining(["", "contact"]));
      expect(doc.pages.length).toBeGreaterThanOrEqual(3);
      for (const name of strings(persona.answers).filter((s) => /^(pro|biz|stay|make|home|jewel|men|fashion)-[a-z0-9-]+$/.test(s))) expect(existsSync(`public/stock/${name}.webp`), name).toBe(true);
      for (const p of doc.pages) {
        const html = renderSite(doc, tpl, ctx, p.slug).html;
        if (tpl.layout) expect(html, `/${p.slug}`).toContain(`lay-${tpl.layout}`);
        expect(html, `/${p.slug}`).not.toContain(`src="data:image/svg`);
      }
    });
  }
});

describe("owner-supplied photos stay in template previews", () => {
  it("strips owner photos from any customer document", async () => {
    const { stripOwnerPhotos } = await import("../../src/shared/owner-photos");
    const doc = { pages: [{ sections: [{ data: { image: { stock: "owner-ats-steel", alt: "x" }, images: [{ stock: "owner-ats-pipework" }, { stock: "biz-team" }], logo: { assetId: "ast_1234567890", stock: "owner-mi-laptop" } } }] }] };
    const out = stripOwnerPhotos(doc);
    expect(JSON.stringify(out)).not.toContain("owner-");
    expect(out.pages[0].sections[0].data.images).toEqual([{ stock: "biz-team" }]);
    expect(out.pages[0].sections[0].data.logo).toEqual({ assetId: "ast_1234567890" });
  });
  it("only owner-prefixed photos are non-CC0, and every one is recorded in CREDITS", async () => {
    const { readdirSync, readFileSync } = await import("node:fs");
    const credits = readFileSync("public/stock/CREDITS.txt", "utf8");
    for (const f of readdirSync("public/stock").filter((x) => x.endsWith(".webp"))) expect(credits, f).toContain(f);
  });
});

describe("no personal identifiers from the reference sites", () => {
  it("demo content never reuses a word from a source site's domain or owner's name", async () => {
    const { readFileSync } = await import("node:fs");
    const { createHash } = await import("node:crypto");
    const banned = new Set<string>(JSON.parse(readFileSync("tests/unit/source-token-hashes.json", "utf8")).hashes);
    const hash = (w: string) => createHash("sha256").update(w).digest("hex").slice(0, 16);
    const hit = (s: string) => (s.toLowerCase().match(/[a-z]{5,}/g) ?? []).find((w) => banned.has(hash(w))) ?? null;
    for (const tpl of TEMPLATES) {
      const p = PERSONAS[tpl.id];
      for (const s of strings([p.answers, p.products])) {
        if (/^(https?:|[a-z0-9-]+$)/.test(s)) continue; // URLs and photo ids
        expect(hit(s), `${tpl.id}: ${s}`).toBeNull();
      }
      expect(hit(tpl.description), `${tpl.id} description`).toBeNull();
    }
  });
});
