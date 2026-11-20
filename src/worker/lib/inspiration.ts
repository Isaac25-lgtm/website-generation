import type { AppEnv } from "../env";
import { HttpError } from "../env";
import { FONT_KEYS, type FontKey } from "../../shared/schema";
import { TEMPLATES } from "../../shared/templates";
import type { SiteType } from "../../shared/pricing";
import type { StyleAnswers } from "../../shared/generate";
import { contrastRatio, hexToRgb, luminance, rgbToHex } from "../../shared/util";
import { robotsAllowed, safeFetch, validatePublicUrl } from "./ssrf";

// Browser globals used only inside page.evaluate() (runs in the remote browser, not the Worker).
declare const document: any;
declare const getComputedStyle: (el: any) => any;

// Produces a HIGH-LEVEL design brief (palette, type feel, density, shape, layout
// rhythm). It never stores or reproduces the reference site's text, images,
// logos or code. Output feeds the generator as style tokens for an original design.

export interface InspirationBrief {
  sourceHost: string;
  method: "browser" | "html" | "screenshot" | "manual";
  palette: { hex: string; weight: number }[];
  mode: "light" | "dark";
  suggested: StyleAnswers;
  typography: { headingFamilies: string[]; bodyFamilies: string[]; feel: string };
  shape: { radius: string; glass: boolean; shadows: boolean };
  layout: { navLinks: number; sections: number; images: number; imageHeavy: boolean; hasVideo: boolean; uppercaseHeadings: boolean };
  mood: string[];
  recommendedTemplates: string[];
  uncertainties: string[];
}

const NAMED: Record<string, string> = { white: "#ffffff", black: "#000000" };

function normColor(raw: string): string | null {
  const s = raw.trim().toLowerCase();
  if (NAMED[s]) return NAMED[s];
  let m = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (m) return m[1].length === 3 ? "#" + m[1].split("").map((c) => c + c).join("") : "#" + m[1];
  m = s.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:[\s,/]+([\d.]+%?))?\s*\)$/);
  if (m) {
    if (m[4] !== undefined) { const a = m[4].endsWith("%") ? Number(m[4].slice(0, -1)) / 100 : Number(m[4]); if (a < 0.5) return null; }
    return rgbToHex(Number(m[1]), Number(m[2]), Number(m[3]));
  }
  return null;
}

function saturation(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

function mapFont(families: string[], fallback: FontKey): FontKey {
  for (const f of families) {
    const n = f.toLowerCase().replace(/["']/g, "").trim();
    const direct = (FONT_KEYS as readonly string[]).find((k) => n.replace(/\s+/g, "-").startsWith(k));
    if (direct) return direct as FontKey;
    if (/mono|code|courier/.test(n)) return "jetbrains-mono";
    if (/playfair|didot|bodoni/.test(n)) return "playfair";
    if (/garamond|cormorant|caslon/.test(n)) return "cormorant";
    if (/serif|georgia|times|baskerville|lora|merriweather|tiempos|freight|canela|recoleta/.test(n) && !/sans/.test(n)) return "fraunces";
    if (/poppins|montserrat|futura|gotham|avenir|circular|outfit|lexend|urbanist/.test(n)) return "outfit";
    if (/grotesk|neue|haas|helvetica|aeonik|satoshi|general sans|switzer/.test(n)) return "space-grotesk";
    if (/inter|roboto|arial|system|segoe|sf pro|-apple-system|open sans|lato|source sans|noto sans|ibm plex sans/.test(n)) return "inter";
    if (/syne|clash|cabinet|archivo|anton|bebas|oswald|impact/.test(n)) return "syne";
  }
  return fallback;
}

interface RawSignals {
  colors: Map<string, number>;
  bgColors: Map<string, number>;
  fontFamilies: string[];
  headingFamilies: string[];
  radii: number[];
  glass: boolean;
  shadows: number;
  uppercase: number;
  navLinks: number;
  sections: number;
  images: number;
  hasVideo: boolean;
  themeColor?: string;
}

function emptySignals(): RawSignals {
  return { colors: new Map(), bgColors: new Map(), fontFamilies: [], headingFamilies: [], radii: [], glass: false, shadows: 0, uppercase: 0, navLinks: 0, sections: 0, images: 0, hasVideo: false };
}

function scanCss(css: string, sig: RawSignals) {
  const text = css.slice(0, 400_000);
  for (const m of text.matchAll(/(#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgba?\([^)]{5,40}\))/g)) {
    const c = normColor(m[1]); if (c) sig.colors.set(c, (sig.colors.get(c) ?? 0) + 1);
  }
  for (const m of text.matchAll(/background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6}\b|rgba?\([^)]{5,40}\)|white|black)/g)) {
    const c = normColor(m[1]); if (c) sig.bgColors.set(c, (sig.bgColors.get(c) ?? 0) + 1);
  }
  for (const m of text.matchAll(/font-family\s*:\s*([^;}{]{2,120})/g)) sig.fontFamilies.push(m[1].split(",")[0].trim());
  for (const m of text.matchAll(/h1[^{]{0,40}\{[^}]*font-family\s*:\s*([^;}]+)/g)) sig.headingFamilies.push(m[1].split(",")[0].trim());
  for (const m of text.matchAll(/border-radius\s*:\s*(\d+(?:\.\d+)?)(px|rem)/g)) sig.radii.push(m[2] === "rem" ? Number(m[1]) * 16 : Number(m[1]));
  if (/backdrop-filter\s*:\s*blur/.test(text)) sig.glass = true;
  sig.shadows += (text.match(/box-shadow\s*:/g) || []).length;
  sig.uppercase += (text.match(/text-transform\s*:\s*uppercase/g) || []).length;
}

async function scanHtml(html: string, sig: RawSignals, baseUrl: URL): Promise<string[]> {
  const stylesheets: string[] = [];
  let inlineCss = "";
  let navDepth = 0;
  const rewriter = new HTMLRewriter()
    .on('meta[name="theme-color"]', { element(e) { const c = normColor(e.getAttribute("content") || ""); if (c) sig.themeColor = c; } })
    .on('link[rel="stylesheet"]', { element(e) { const h = e.getAttribute("href"); if (h && stylesheets.length < 3) { try { stylesheets.push(new URL(h, baseUrl).toString()); } catch { /* ignore */ } } } })
    .on("style", { text(t) { if (inlineCss.length < 300_000) inlineCss += t.text; } })
    .on("[style]", { element(e) { inlineCss += `x{${e.getAttribute("style")}}`; } })
    .on("nav", { element(e) { navDepth++; e.onEndTag(() => { navDepth--; }); } })
    .on("nav a", { element() { sig.navLinks++; } })
    .on("section", { element() { sig.sections++; } })
    .on("img", { element() { sig.images++; } })
    .on("video, iframe[src*='youtube'], iframe[src*='vimeo']", { element() { sig.hasVideo = true; } })
    .on('link[href*="fonts.googleapis.com"]', { element(e) {
      const h = e.getAttribute("href") || "";
      for (const m of h.matchAll(/family=([^:&]+)/g)) sig.fontFamilies.unshift(decodeURIComponent(m[1]).replace(/\+/g, " "));
    } });
  await rewriter.transform(new Response(html)).text();
  scanCss(inlineCss, sig);
  return stylesheets;
}

function buildBrief(host: string, method: InspirationBrief["method"], sig: RawSignals, type: SiteType, computed?: { bg?: string; text?: string; buttons?: string[]; h1Font?: string; bodyFont?: string }): InspirationBrief {
  const uncertainties: string[] = [];
  const all = [...sig.colors.entries()].sort((a, b) => b[1] - a[1]);
  const bgCandidates = [...sig.bgColors.entries()].sort((a, b) => b[1] - a[1]).map((x) => x[0]);
  let bg = computed?.bg || bgCandidates[0] || "#ffffff";
  const darkVotes = bgCandidates.slice(0, 3).filter((c) => luminance(c) < 0.2).length;
  if (!computed?.bg && darkVotes >= 2) bg = bgCandidates.find((c) => luminance(c) < 0.2) || bg;
  const mode: "light" | "dark" = luminance(bg) < 0.25 ? "dark" : "light";
  const chroma = all.map((x) => x[0]).filter((c) => saturation(c) > 0.35 && luminance(c) > 0.04 && luminance(c) < 0.9);
  const btn = (computed?.buttons ?? []).map(normColor).filter((c): c is string => !!c && saturation(c) > 0.25);
  const primary = btn[0] || sig.themeColor && saturation(sig.themeColor) > 0.25 && sig.themeColor || chroma[0];
  const accent = chroma.find((c) => c !== primary && Math.abs(luminance(c) - luminance(primary || "#000000")) > 0.05) || undefined;
  if (!primary) uncertainties.push("No strong brand colour detected; template colours kept.");
  let text = computed?.text || (mode === "dark" ? "#f1f3f6" : "#15181d");
  if (contrastRatio(text, bg) < 4.5) text = mode === "dark" ? "#f1f3f6" : "#15181d";

  const headingFams = computed?.h1Font ? [computed.h1Font, ...sig.headingFamilies] : sig.headingFamilies.length ? sig.headingFamilies : sig.fontFamilies;
  const bodyFams = computed?.bodyFont ? [computed.bodyFont, ...sig.fontFamilies] : sig.fontFamilies;
  if (!headingFams.length) uncertainties.push("Fonts could not be detected; template typography kept.");
  const fontHeading = mapFont(headingFams, mode === "dark" ? "space-grotesk" : "inter");
  let fontBody = mapFont(bodyFams, "inter");
  if (["syne", "archivo-black", "cormorant", "instrument-serif", "dm-serif"].includes(fontBody)) fontBody = "inter";
  const serif = ["fraunces", "playfair", "cormorant", "lora", "libre-baskerville", "dm-serif", "instrument-serif"].includes(fontHeading);
  const mono = fontHeading === "jetbrains-mono";

  const medRadius = sig.radii.length ? sig.radii.sort((a, b) => a - b)[Math.floor(sig.radii.length / 2)] : 8;
  const radius = medRadius <= 1 ? "none" : medRadius <= 6 ? "sm" : medRadius <= 12 ? "md" : medRadius <= 20 ? "lg" : "xl";
  const imageHeavy = sig.images >= 12;
  const density = sig.sections >= 8 ? "comfortable" : imageHeavy ? "airy" : "comfortable";

  const mood: string[] = [];
  if (mode === "dark") mood.push("dark");
  if (serif) mood.push("editorial");
  if (mono) mood.push("technical");
  if (sig.glass) mood.push("glassy");
  if (sig.uppercase > 6) mood.push("bold");
  if (chroma.length <= 1) mood.push("minimal");
  if (imageHeavy) mood.push("image-led");
  if (radius === "xl" || radius === "lg") mood.push("soft");
  if (!mood.length) mood.push("clean");

  const scored = TEMPLATES.filter((t) => t.type === type).map((t) => {
    let score = 0;
    if (t.theme.mode === mode) score += 3;
    const tSerif = ["fraunces", "playfair", "cormorant", "lora", "libre-baskerville", "dm-serif"].includes(t.theme.fontHeading);
    if (tSerif === serif) score += 2;
    if (t.theme.radius === radius) score += 1;
    if (sig.glass && t.theme.cardStyle === "glass") score += 2;
    if (imageHeavy && ["fullbleed", "editorial", "mosaic"].includes(t.variants.hero ?? "")) score += 2;
    if (mono && t.theme.fontHeading === "jetbrains-mono") score += 3;
    if (mood.includes("bold") && ["archivo-black", "syne"].includes(t.theme.fontHeading)) score += 2;
    if (mood.includes("minimal") && t.theme.ornament === "none") score += 1;
    return { id: t.id, score };
  }).sort((a, b) => b.score - a.score);

  const palette = all.slice(0, 8).map(([hex, n]) => ({ hex, weight: n }));
  if (method === "html") uncertainties.push("Analysed from the page's HTML and CSS without rendering; colours from scripts or images may be missed.");
  return {
    sourceHost: host, method, palette, mode,
    suggested: {
      mode, ...(primary ? { primary } : {}), ...(accent ? { accent } : {}),
      fontHeading, fontBody, radius: radius as StyleAnswers["radius"], density,
      animation: sig.glass ? "lively" : "subtle",
    },
    typography: { headingFamilies: [...new Set(headingFams)].slice(0, 3), bodyFamilies: [...new Set(bodyFams)].slice(0, 3), feel: serif ? "serif / editorial" : mono ? "monospace / technical" : "sans-serif / modern" },
    shape: { radius, glass: sig.glass, shadows: sig.shadows > 4 },
    layout: { navLinks: sig.navLinks, sections: sig.sections, images: sig.images, imageHeavy, hasVideo: sig.hasVideo, uppercaseHeadings: sig.uppercase > 6 },
    mood, recommendedTemplates: scored.slice(0, 3).map((s) => s.id), uncertainties,
  };
}

export async function analyzeUrl(env: AppEnv, rawUrl: string, type: SiteType): Promise<{ brief: InspirationBrief; screenshot?: Uint8Array }> {
  const url = await validatePublicUrl(rawUrl);
  if (!(await robotsAllowed(url))) throw new HttpError(422, "This website asks automated tools not to visit this page (robots.txt). Upload a screenshot instead, or describe the style you like.", "robots_disallowed");

  // 1) Try Browser Run for a real rendered view + screenshot.
  if (env.BROWSER) {
    let browser: { close: () => Promise<void>; newPage: () => Promise<any> } | null = null;
    try {
      const puppeteer = (await import("@cloudflare/puppeteer")).default;
      browser = (await puppeteer.launch(env.BROWSER as any)) as any;
      const page = await browser!.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      const resp = await page.goto(url.toString(), { waitUntil: "networkidle2", timeout: 20000 });
      const finalUrl = new URL(page.url());
      await validatePublicUrl(finalUrl.toString());
      if (resp && resp.status() >= 400) throw new Error(`HTTP ${resp.status()}`);
      const computed = await page.evaluate(() => {
        const cs = (el: Element | null) => (el ? getComputedStyle(el) : null);
        const body = cs(document.body);
        let bg = body?.backgroundColor || "";
        if (!bg || bg === "rgba(0, 0, 0, 0)") bg = cs(document.documentElement)?.backgroundColor || "rgb(255,255,255)";
        const h1 = cs(document.querySelector("h1, h2"));
        const buttons = Array.from(document.querySelectorAll("a[class*=btn], button, a[class*=button], [role=button]")).slice(0, 12)
          .map((b) => getComputedStyle(b).backgroundColor).filter((c) => c && c !== "rgba(0, 0, 0, 0)");
        return {
          bg, text: body?.color || "", buttons,
          h1Font: h1?.fontFamily?.split(",")[0] || "", bodyFont: body?.fontFamily?.split(",")[0] || "",
          html: document.documentElement.outerHTML.slice(0, 600000),
        };
      });
      const shot = (await page.screenshot({ type: "jpeg", quality: 60 })) as Uint8Array;
      const sig = emptySignals();
      await scanHtml(computed.html, sig, finalUrl);
      const brief = buildBrief(finalUrl.hostname, "browser", sig, type, {
        bg: normColor(computed.bg) ?? undefined, text: normColor(computed.text) ?? undefined,
        buttons: computed.buttons, h1Font: computed.h1Font, bodyFont: computed.bodyFont,
      });
      return { brief, screenshot: shot };
    } catch (e) {
      console.log("browser-run fallback:", (e as Error)?.message?.slice(0, 200));
    } finally {
      try { await browser?.close(); } catch { /* ignore */ }
    }
  }

  // 2) Fallback: fetch HTML + up to 3 stylesheets, analyse statically.
  const page = await safeFetch(url, { maxBytes: 1_500_000, timeoutMs: 10000 });
  if (page.status >= 400) throw new HttpError(422, `The website responded with an error (HTTP ${page.status}). Try another page, or upload a screenshot.`, "fetch_status");
  if (!/html/i.test(page.contentType)) throw new HttpError(422, "That link isn't a web page. Paste a website address, or upload a screenshot.", "not_html");
  const html = new TextDecoder().decode(page.bytes);
  const sig = emptySignals();
  const sheets = await scanHtml(html, sig, page.url);
  for (const href of sheets.slice(0, 3)) {
    try {
      const css = await safeFetch(href, { maxBytes: 400_000, timeoutMs: 6000, accept: "text/css" });
      if (css.status < 400) scanCss(new TextDecoder().decode(css.bytes), sig);
    } catch { /* stylesheet unavailable */ }
  }
  const brief = buildBrief(page.url.hostname, "html", sig, type);
  if (sig.colors.size === 0 && sig.fontFamilies.length === 0) brief.uncertainties.push("This site builds its design with JavaScript, so little could be read. A screenshot will give better results.");
  return { brief };
}

/** Brief from colours sampled client-side from an uploaded screenshot (canvas pixel analysis). */
export function briefFromSampledColors(colors: string[], type: SiteType, notes: string): InspirationBrief {
  const sig = emptySignals();
  colors.slice(0, 16).forEach((c, i) => {
    const n = normColor(c); if (!n) return;
    sig.colors.set(n, 16 - i);
    if (i < 2) sig.bgColors.set(n, 16 - i);
  });
  const brief = buildBrief("uploaded screenshot", "screenshot", sig, type);
  brief.uncertainties.push("Typography and layout can't be read from a screenshot; choose fonts in the next step.");
  if (notes) brief.mood.push(...notes.toLowerCase().match(/\b(minimal|bold|elegant|dark|playful|modern|warm|luxury|clean)\b/g) ?? []);
  return brief;
}
