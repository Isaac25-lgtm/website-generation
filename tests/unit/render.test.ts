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

describe("floating WhatsApp button", () => {
  const live = (doc: any, tplId: string) => renderSite(doc, TEMPLATE_MAP[tplId], { ...ctxFor("p1", tplId.startsWith("e-") ? demoProductViews(PERSONAS[tplId], doc.store!.currency) : undefined), mode: "published" as const }, "").html;
  const biz = (extra: Record<string, unknown>) => generateSiteDoc("business", "b-meridian", { ...PERSONAS["b-meridian"].answers, whatsapp: "+15125550142", ...extra });
  it("is off unless the owner ticks it, and on (with a label) when ticked", () => {
    expect(live(biz({}), "b-meridian")).not.toContain('class="wa-float');
    const html = live(biz({ whatsappFloat: true }), "b-meridian");
    expect(html).toContain('class="wa-float"');
    expect(html).toContain('href="https://wa.me/15125550142"');
    expect(html).toMatch(/class="wa-float"[^>]*aria-label="Chat on WhatsApp">[\s\S]*?<span>WhatsApp<\/span><\/a>/);
  });
  it("needs a valid number", () => {
    expect(live(biz({ whatsappFloat: true, whatsapp: "123" }), "b-meridian")).not.toContain('class="wa-float');
  });
  it("can be added to an online store too", () => {
    const tpl = TEMPLATES.find((t) => t.type === "ecommerce")!;
    const doc = generateSiteDoc("ecommerce", tpl.id, { ...PERSONAS[tpl.id].answers, whatsapp: "+447700900123", whatsappFloat: true });
    expect(live(doc, tpl.id)).toContain('class="wa-float"');
  });
  it("keeps the original behaviour for sites made before the option existed", () => {
    const doc = biz({}); delete (doc.contact as any).whatsappFloat;
    expect(parseSiteDoc(doc).ok).toBe(true);
    expect(live(doc, "b-meridian")).toContain('class="wa-float"');
  });
});

describe("logo", () => {
  const logo = { assetId: "ast_logo1", alt: "" };
  const page = (extra: Record<string, unknown>) => renderSite(generateSiteDoc("business", "b-meridian", { ...PERSONAS["b-meridian"].answers, logo, ...extra }), TEMPLATE_MAP["b-meridian"], ctxFor("p1"), "").html;
  it("shows the logo next to the name and as the browser-tab icon", () => {
    const html = page({});
    expect(html).toContain('<link rel="icon" href="/media/ast_logo1">');
    expect(html).toMatch(/<a class="brand" [^>]*>[\s\S]*?\/media\/ast_logo1[\s\S]*?<span>[^<]+<\/span><\/a>/);
  });
  it("can show the logo alone, keeping the name for screen readers", () => {
    const html = page({ logoOnly: true });
    expect(html).toMatch(/<a class="brand logo-only" [^>]*>[\s\S]*?<span class="sr-only">[^<]+<\/span><\/a>/);
  });
  it("ignores 'logo only' when there is no logo", () => {
    const html = renderSite(generateSiteDoc("business", "b-meridian", { ...PERSONAS["b-meridian"].answers, logo: undefined, logoOnly: true }), TEMPLATE_MAP["b-meridian"], ctxFor("p1"), "").html;
    expect(html).not.toContain(`class="brand logo-only"`);
    expect(html).not.toContain('rel="icon"');
  });
  it("personal sites can have a logo too", () => {
    const doc = generateSiteDoc("personal", "p-folio", { ...PERSONAS["p-folio"].answers, logo });
    expect(doc.brand.logo?.assetId).toBe("ast_logo1");
  });
});
