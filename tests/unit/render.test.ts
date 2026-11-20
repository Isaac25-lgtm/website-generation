import { describe, it, expect } from "vitest";
import { TEMPLATES, TEMPLATE_MAP } from "../../src/shared/templates";
import { PERSONAS, demoProductViews } from "../../src/shared/demo";
import { generateSiteDoc } from "../../src/shared/generate";
import { renderSite } from "../../src/shared/render";
import { parseSiteDoc } from "../../src/shared/schema";

function ctxFor(projectId: string, store?: ReturnType<typeof demoProductViews>) {
  return { mode: "template" as const, basePath: "/s/x", projectId, apiBase: "", assetUrl: (id: string) => `/media/${id}`, store, platformName: "ImprintSites AI", platformUrl: "https://example.test", renderedAt: 0 };
}

describe("templates", () => {
  it("ships at least 18 templates, 6 per site type, unique ids", () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(18);
    for (const t of ["personal", "business", "ecommerce"]) expect(TEMPLATES.filter((x) => x.type === t).length).toBeGreaterThanOrEqual(6);
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(TEMPLATES.length);
  });

  for (const tpl of TEMPLATES) {
    it(`renders every page of ${tpl.id} with its sample content`, () => {
      const persona = PERSONAS[tpl.id];
      expect(persona, `persona for ${tpl.id}`).toBeTruthy();
      const doc = generateSiteDoc(tpl.type, tpl.id, persona.answers);
      expect(parseSiteDoc(doc).ok).toBe(true);
      const store = tpl.type === "ecommerce" ? demoProductViews(persona, doc.store!.currency) : undefined;
      const paths = doc.pages.map((p) => p.slug);
      if (store) paths.push(`product/${store.products[0].handle}`, "cart", "checkout", "policies/returns");
      for (const path of paths) {
        const r = renderSite(doc, tpl, ctxFor("p1", store), path);
        expect(r.status, `${tpl.id} /${path}`).toBe(200);
        expect(r.html).not.toMatch(/undefined|NaN|\[object Object\]/);
        expect(r.html).toContain("<h1");
        expect(r.html).toContain('lang="en"');
      }
      const nf = renderSite(doc, tpl, ctxFor("p1", store), "does-not-exist");
      expect(nf.status).toBe(404);
    });
  }
});

describe("security of rendered output", () => {
  it("escapes user content and drops dangerous links", () => {
    const doc = generateSiteDoc("business", "b-meridian", {
      businessName: `<script>alert(1)</script>`, tagline: `"><img src=x onerror=alert(1)>`,
      services: [{ title: "x", description: "</style><script>bad()</script>" }],
      socials: [{ network: "evil", url: "javascript:alert(1)" }], bookingUrl: "javascript:alert(2)", primaryGoal: "booking",
    });
    const html = renderSite(doc, TEMPLATE_MAP["b-meridian"], ctxFor("p1"), "").html;
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain("<img src=x onerror");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("</style><script>bad");
    // only the platform runtime + config scripts exist
    expect(html.match(/<script/g)!.length).toBe(2);
  });

  it("never invents testimonials or hours when none supplied", () => {
    const doc = generateSiteDoc("business", "b-localpro", { businessName: "Acme" });
    const kinds = doc.pages.flatMap((p) => p.sections.map((s) => s.kind));
    expect(kinds).not.toContain("testimonials");
    expect(kinds).not.toContain("hours");
    expect(kinds).not.toContain("team");
  });
});

describe("page headings", () => {
  it("never repeats the page title as the first section heading", () => {
    const doc = generateSiteDoc("business", "b-savanna", PERSONAS["b-savanna"].answers);
    const html = renderSite(doc, TEMPLATE_MAP["b-savanna"], ctxFor("p1"), "services").html;
    expect(html.match(/>Services<\/h[12]>/g)?.length).toBe(1);
    expect(html.match(/<h1/g)?.length).toBe(1);
  });
  it("renders platform stock photos with a safe path and alt text", () => {
    const doc = generateSiteDoc("business", "b-savanna", PERSONAS["b-savanna"].answers);
    const html = renderSite(doc, TEMPLATE_MAP["b-savanna"], ctxFor("p1"), "").html;
    expect(html).toContain('src="/stock/safari-hero.webp"');
    expect(html).toContain('alt="A traveller watching elephants from a safari vehicle"');
  });
});
