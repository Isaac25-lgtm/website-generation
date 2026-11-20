import { describe, expect, it } from "vitest";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { SiteDoc, parseSiteDoc } from "../../src/shared/schema";
import { PLANS } from "../../src/shared/pricing";
import { PERSONAS, PUBLIC_DEMOS } from "../../src/shared/demo";
import { TEMPLATES } from "../../src/shared/templates";
import { generateSiteDoc } from "../../src/shared/generate";

// Contracts shared with the Python backend (backend/). TypeScript is the source of truth:
//  - contracts/sitedoc.schema.json and contracts/public-config.json are checked on every run (update with `vitest -u`).
//  - The fixture corpus under contracts/fixtures/sitedoc/ is written once (ids are random) and then validated on
//    every run here and in backend/tests/test_contracts.py. Regenerate with UPDATE_CONTRACTS=1.
const root = fileURLToPath(new URL("../../contracts/", import.meta.url));
const json = (v: unknown) => JSON.stringify(v, null, 2) + "\n";
const UPDATE = process.env.UPDATE_CONTRACTS === "1";

function writeFixture(dir: "valid" | "invalid", name: string, doc: unknown) {
  const d = `${root}fixtures/sitedoc/${dir}`;
  mkdirSync(d, { recursive: true });
  const f = `${d}/${name}.json`;
  if (UPDATE || !existsSync(f)) writeFileSync(f, json(doc));
}

describe("contracts shared with the Python backend", () => {
  it("SiteDoc JSON Schema matches src/shared/schema.ts", async () => {
    await expect(json(z.toJSONSchema(SiteDoc, { io: "output", unrepresentable: "throw" }))).toMatchFileSnapshot("../../contracts/sitedoc.schema.json");
  });

  it("public configuration (locked prices and demo sites) matches the source", async () => {
    const contract = {
      plans: Object.values(PLANS).map((p) => ({ type: p.type, name: p.name, priceCents: p.priceCents, currency: p.currency, billing: p.billing })),
      demos: PUBLIC_DEMOS.map((d) => ({ slug: d.slug, type: d.type, url: `/s/${d.slug}/` })),
    };
    await expect(json(contract)).toMatchFileSnapshot("../../contracts/public-config.json");
  });

  it("writes the fixture corpus when missing", () => {
    for (const tpl of TEMPLATES) writeFixture("valid", tpl.id, generateSiteDoc(tpl.type, tpl.id, PERSONAS[tpl.id].answers));
    const base = () => generateSiteDoc("business", "b-savanna", PERSONAS["b-savanna"].answers) as any;
    const cases: Record<string, (d: any) => void> = {
      "no-home-page": (d) => { d.pages[0].slug = "start"; },
      "duplicate-page-slug": (d) => { d.pages[1].slug = d.pages[0].slug; },
      "duplicate-page-id": (d) => { d.pages[1].id = d.pages[0].id; },
      "unknown-site-type": (d) => { d.type = "blog"; },
      "brand-name-too-long": (d) => { d.brand.name = "x".repeat(81); },
      "no-pages": (d) => { d.pages = []; },
      "wrong-schema-version": (d) => { d.schemaVersion = 2; },
      "bad-language-code": (d) => { d.seo.lang = "english"; },
    };
    for (const [name, mutate] of Object.entries(cases)) { const d = base(); mutate(d); writeFixture("invalid", name, d); }
  });

  it("every valid fixture parses and is already in stored (normalized) form", () => {
    const files = readdirSync(`${root}fixtures/sitedoc/valid`).filter((f) => f.endsWith(".json"));
    expect(files.length).toBeGreaterThanOrEqual(18);
    for (const f of files) {
      const doc = JSON.parse(readFileSync(`${root}fixtures/sitedoc/valid/${f}`, "utf8"));
      const r = parseSiteDoc(doc);
      expect(r.ok, `${f}: ${!r.ok && r.error}`).toBe(true);
      // Python serves stored drafts as-is, so a stored document must equal its parsed form.
      if (r.ok) expect(JSON.parse(JSON.stringify(r.doc)), f).toEqual(doc);
    }
  });

  it("every invalid fixture is rejected", () => {
    const files = readdirSync(`${root}fixtures/sitedoc/invalid`).filter((f) => f.endsWith(".json"));
    expect(files.length).toBeGreaterThanOrEqual(8);
    for (const f of files) expect(parseSiteDoc(JSON.parse(readFileSync(`${root}fixtures/sitedoc/invalid/${f}`, "utf8"))).ok, f).toBe(false);
  });
});
