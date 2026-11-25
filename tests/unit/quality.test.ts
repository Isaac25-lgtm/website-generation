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
  // Hashes only: the plaintext list of reference sites and names stays outside the repository.
  // "hashes" are single words (5+ letters) from reference domains and owner names; "names" are whole normalised
  // reference names and host labels. Coverage: every persona string (copy, products, collections, URLs and
  // photo file names) plus template names and descriptions.
  it("demo content never reuses a reference site's name, domain or owner's name", async () => {
    const { readFileSync } = await import("node:fs");
    const { createHash } = await import("node:crypto");
    const data = JSON.parse(readFileSync("tests/unit/source-token-hashes.json", "utf8"));
    const words = new Set<string>(data.hashes);
    const names = new Set<string>(data.names);
    const hash = (w: string) => createHash("sha256").update(w).digest("hex").slice(0, 16);
    const norm = (x: string) => x.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");
    const problems: string[] = [];
    const check = (where: string, s: string) => {
      const pieces = new Set<string>();
      for (const m of s.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)) for (const lab of m[1].toLowerCase().split(".")) pieces.add(norm(lab));
      if (/^[a-z0-9-]+$/.test(s)) { pieces.add(norm(s)); for (const part of s.split("-")) pieces.add(part); } // photo ids and slugs
      if (s.length <= 60) pieces.add(norm(s)); // names, titles, collection names
      for (const piece of pieces) if (piece.length >= 5 && names.has(hash(piece))) problems.push(`${where}: "${s}" (name)`);
      const text = /^https?:/.test(s) || /^[a-z0-9-]+$/.test(s) ? "" : s.toLowerCase(); // ids get the whole-name check only
      for (const w of text.match(/[a-z]{5,}/g) ?? []) if (words.has(hash(w))) problems.push(`${where}: "${s}" (word)`);
    };
    for (const tpl of TEMPLATES) {
      check(tpl.id, tpl.name);
      // IDs are persisted keys. Compare the complete identifier, including its site type prefix.
      if (names.has(hash(norm(tpl.id)))) problems.push(tpl.id + " (template id)");
      const p = PERSONAS[tpl.id];
      for (const s of strings([p.answers, p.products, p.collections])) check(tpl.id, s);
      check(`${tpl.id} description`, tpl.description);
    }
    // Check real repository URL hosts and asset/source basenames as identifiers.
    // Ordinary prose and language keywords are not owner or brand names.
    const { readdirSync } = await import("node:fs");
    const { posix, extname, basename } = await import("node:path");
    // Exact existing generic filenames, unrelated to a source brand or a customer identity.
    const genericPaths = new Set(["src/client/components/forms.tsx", "src/client/pages/Marketing.tsx", "docs/screenshots/checkout.jpg"]);
    const scan = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = posix.join(dir, entry.name);
        if (entry.isDirectory()) { scan(path); continue; }
        if (!entry.isFile()) continue;
        const ext = extname(path);
        const stem = norm(basename(path, ext));
        if (!genericPaths.has(path) && stem.length >= 5 && names.has(hash(stem))) problems.push(path + " (filename)");
        if (![".md", ".txt", ".ts", ".tsx", ".css", ".js", ".json", ".svg", ".html"].includes(ext)) continue;
        for (const match of readFileSync(path, "utf8").matchAll(/https?:\/\/([a-z0-9.-]+)/gi)) {
          if (match[1].toLowerCase() === "imprintsites.omodingisaac123.workers.dev") continue; // official product host
          if (match[1].split(".").some(label => label.length >= 5 && names.has(hash(norm(label))))) problems.push(path + " (host)");
        }
      }
    };
    for (const dir of ["src", "public", "docs"]) scan(dir);
    expect(problems).toEqual([]);
  });
});
