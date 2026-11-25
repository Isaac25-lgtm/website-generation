import { describe, expect, it, vi } from "vitest";
import { TEMPLATES, TEMPLATE_MAP } from "../../src/shared/templates";
import { PERSONAS, demoProductViews } from "../../src/shared/demo";
import { generateSiteDoc } from "../../src/shared/generate";
import { renderSite } from "../../src/shared/render";
import { thumbnailDoc } from "../../src/worker/routes/sites";
import type { RenderCtx } from "../../src/shared/render/types";

// Regression tests for the Codex integrity review of 5a23f67 (template-library findings).

const ctxFor = (mode: RenderCtx["mode"], store?: RenderCtx["store"]): RenderCtx => ({
  mode, basePath: "/s/x", projectId: "p1", apiBase: "", assetUrl: (id: string) => `/media/${id}`, platformName: "ImprintSites AI", platformUrl: "https://example.test", renderedAt: 0, store,
});

function demo(id: string) {
  const tpl = TEMPLATE_MAP[id];
  const persona = PERSONAS[id];
  const doc = generateSiteDoc(tpl.type, id, persona.answers);
  const store = tpl.type === "ecommerce" ? demoProductViews(persona, doc.store!.currency) : undefined;
  return { tpl, doc, store };
}

describe("finding 1: signed-out gallery thumbnails are deliberately limited", () => {
  it("keeps only the home page's first section and empties every other page", () => {
    const { doc } = demo("e-runway");
    const t = thumbnailDoc(doc);
    expect(t.pages.find((p) => p.slug === "")!.sections.map((s) => s.kind)).toEqual(["hero"]);
    for (const p of t.pages.filter((p) => p.slug !== "")) expect(p.sections).toEqual([]);
    expect(doc.pages.find((p) => p.slug === "")!.sections.length).toBeGreaterThan(1); // the original is untouched
  });
});

describe("finding 2: owner-only photos never render outside template previews", () => {
  it("renders an owner photo in a template preview but not in published, preview or export output, including product images", () => {
    const { tpl, doc, store } = demo("e-runway");
    const home = doc.pages.find((p) => p.slug === "")!;
    (home.sections[0].data as any).image = { stock: "owner-ats-steel", alt: "" };
    const owned = { ...store!, products: store!.products.map((p, i) => (i === 0 ? { ...p, images: [{ stock: "owner-mi-laptop", alt: "x" } as any] } : p)) };
    expect(renderSite(doc, tpl, ctxFor("template", owned), "").html).toContain("/stock/owner-");
    for (const mode of ["published", "preview", "export"] as const) {
      for (const path of ["", "shop", `product/${owned.products[0].handle}`]) {
        expect(renderSite(doc, tpl, ctxFor(mode, owned), path).html, `${mode} /${path}`).not.toContain("owner-");
      }
    }
    // Ordinary stock photos still render everywhere.
    expect(renderSite(doc, tpl, ctxFor("published", owned), "shop").html).toContain("/stock/");
  });
});

describe("finding 3: templates make no offers the site owner didn't supply", () => {
  const sparse = (type: string) => (type === "ecommerce"
    ? { storeName: "Test Pots", tagline: "Pots.", description: "We make pots.", currency: "USD", country: "United States" }
    : type === "business" ? { businessName: "Test Co", tagline: "We do things.", description: "A small company." } : { name: "Sam Test", tagline: "I make things." });
  const heroes = new Set(["workbench", "handnote", "keynote", "catalogue"]);
  const picked = TEMPLATES.filter((t) => heroes.has(t.variants.hero ?? ""));
  it("covers each hero that used to add an offer", () => {
    expect(new Set(picked.map((t) => t.variants.hero))).toEqual(heroes);
  });
  for (const t of picked) {
    it(`${t.id} (${t.variants.hero}) with sparse customer content`, () => {
      const doc = generateSiteDoc(t.type, t.id, sparse(t.type) as never);
      const html = renderSite(doc, t, ctxFor("published", t.type === "ecommerce" ? { products: [], collections: [] } : undefined), "").html;
      for (const claim of ["Made to order", "commission", "lead times", ">Available<", ">Speaker<", "Request our catalogue", "press enquiries"]) expect(html, claim).not.toContain(claim);
    });
  }
});

describe("finding 11: every same-page and cross-page fragment link resolves", () => {
  for (const t of TEMPLATES) {
    it(`${t.id}`, () => {
      const { tpl, doc, store } = demo(t.id);
      const ctx = ctxFor("template", store);
      const pages = new Map(doc.pages.map((p) => [p.slug, renderSite(doc, tpl, ctx, p.slug).html]));
      const ids = (html: string) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
      for (const [slug, html] of pages) {
        for (const m of html.matchAll(/href="([^"]*#[^"]+)"/g)) {
          const href = m[1].replace(/&amp;/g, "&");
          const [path, frag] = href.split("#");
          if (/^(https?:|mailto:|tel:)/.test(path)) continue;
          const target = path === "" ? slug : path.replace(/^\/s\/x\/?/, "").replace(/\/$/, "");
          const targetHtml = pages.get(target);
          expect(targetHtml, `${t.id} /${slug}: ${href} (page)`).toBeDefined();
          expect(ids(targetHtml!).has(frag), `${t.id} /${slug}: ${href} (fragment)`).toBe(true);
        }
      }
    });
  }
});

describe("hero identity: every template renders the hero it declares", () => {
  // Two heroes render under a renamed class so they don't collide with base CSS (.tiles, .badge).
  const CLASS: Record<string, string> = { tiles: "tilehub", badge: "idbadge" };
  for (const t of TEMPLATES.filter((x) => x.variants.hero)) {
    it(`${t.id} → ${t.variants.hero}`, () => {
      const { tpl, doc, store } = demo(t.id);
      const html = renderSite(doc, tpl, ctxFor("template", store), "").html;
      const cls = CLASS[t.variants.hero!] ?? t.variants.hero;
      expect(html).toMatch(new RegExp(`class="hero ${cls}[ "]`));
      expect((html.match(/<h1[\s>]/g) ?? []).length).toBe(1);
    });
  }
});

describe("finding 16: product grids survive any stored variant string", () => {
  it("prototype-like variant names fall back to the default card", () => {
    const { tpl, doc, store } = demo("e-runway");
    const home = doc.pages.find((p) => p.slug === "")!;
    for (const variant of ["constructor", "toString", "__proto__", "hasOwnProperty", "nonsense"]) {
      for (const sec of home.sections) if (sec.kind === "products") sec.variant = variant;
      const html = renderSite(doc, tpl, ctxFor("published", store), "").html;
      expect(html).not.toMatch(/width="(undefined|NaN)"|height="(undefined|NaN)"/);
      expect(html).toContain('class="product-card"');
    }
  });
});

describe("finding 17: decorative classes don't reuse platform class names", () => {
  it("the Bookcover bookmark no longer uses the preview-label class", () => {
    const id = TEMPLATES.find((t) => t.variants.hero === "bookcover")!.id;
    const { tpl, doc } = demo(id);
    const html = renderSite(doc, tpl, ctxFor("published"), "").html;
    expect(html).toContain('class="bk-mark"');
    expect(html).not.toContain('<span class="ribbon"');
  });
});

describe("finding 14: shop batches load on their own and in any order", () => {
  it("imports batch 3 before batch 2 in a fresh module graph", async () => {
    vi.resetModules();
    const b3 = await import("../../src/shared/demo-store3");
    const b2 = await import("../../src/shared/demo-store2");
    expect(Object.keys(b3.STORE3_PERSONAS).length).toBe(76);
    expect(Object.keys(b2.STORE2_PERSONAS).length).toBe(36);
    expect(b3.STORE3_PERSONAS["e-kiln"]).toEqual(PERSONAS["e-kiln"]);
  });
});
