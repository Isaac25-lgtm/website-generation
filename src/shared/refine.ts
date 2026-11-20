import { z } from "zod";
import { FONT_KEYS, Theme, type SiteDoc } from "./schema";

// A refinement is a small, validated, reversible patch to the site's design.
// Produced either by the AI model (JSON mode) or by the deterministic rule engine.

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const RefinePatch = z.object({
  theme: z.object({
    mode: z.enum(["light", "dark"]).optional(),
    primary: hex.optional(), accent: hex.optional(), bg: hex.optional(), surface: hex.optional(), text: hex.optional(), muted: hex.optional(),
    fontHeading: z.enum(FONT_KEYS).optional(), fontBody: z.enum(FONT_KEYS).optional(),
    radius: Theme.shape.radius.unwrap().optional(), density: Theme.shape.density.unwrap().optional(),
    headingScale: Theme.shape.headingScale.unwrap().optional(), animation: Theme.shape.animation.unwrap().optional(),
    headerStyle: Theme.shape.headerStyle.unwrap().optional(), cardStyle: Theme.shape.cardStyle.unwrap().optional(),
    ornament: Theme.shape.ornament.unwrap().optional(),
  }).default({}),
  heroVariant: z.enum(["split", "centered", "editorial", "fullbleed", "terminal", "mosaic", "stacked", "poster", "minimal"]).optional(),
  explanation: z.string().max(400).default(""),
});
export type RefinePatch = z.infer<typeof RefinePatch>;

export function applyPatch(doc: SiteDoc, patch: RefinePatch): SiteDoc {
  const t = patch.theme;
  const c = { ...doc.theme.colors };
  if (t.mode && t.mode !== doc.theme.mode) {
    if (t.mode === "dark") Object.assign(c, { bg: "#0e1116", surface: "#171b22", text: "#eef1f5", muted: "#9aa3b1" });
    else Object.assign(c, { bg: "#ffffff", surface: "#f4f5f7", text: "#14171c", muted: "#5b6472" });
  }
  for (const k of ["primary", "accent", "bg", "surface", "text", "muted"] as const) if (t[k]) c[k] = t[k]!;
  const theme = {
    ...doc.theme, colors: c,
    ...(t.mode && { mode: t.mode }), ...(t.fontHeading && { fontHeading: t.fontHeading }), ...(t.fontBody && { fontBody: t.fontBody }),
    ...(t.radius && { radius: t.radius }), ...(t.density && { density: t.density }), ...(t.headingScale && { headingScale: t.headingScale }),
    ...(t.animation && { animation: t.animation }), ...(t.headerStyle && { headerStyle: t.headerStyle }), ...(t.cardStyle && { cardStyle: t.cardStyle }),
    ...(t.ornament && { ornament: t.ornament }),
  };
  const pages = patch.heroVariant
    ? doc.pages.map((p) => ({ ...p, sections: p.sections.map((s) => (s.kind === "hero" ? { ...s, variant: patch.heroVariant! } : s)) }))
    : doc.pages;
  return { ...doc, theme, pages };
}

const COLORS: Record<string, string> = {
  blue: "#1f5fd1", navy: "#13305f", green: "#1f8a4c", teal: "#0f8b8d", red: "#c62828", orange: "#e8590c", gold: "#c39a45",
  yellow: "#e0a800", purple: "#6f42c1", violet: "#7454f6", pink: "#d6336c", black: "#111111", brown: "#7a4b2a", coral: "#ff6b5a",
};
const SCALE = ["sm", "md", "lg", "xl"] as const;
const RADII = ["none", "sm", "md", "lg", "xl"] as const;

/** Deterministic keyword-based refinement used when AI is unavailable (clearly labelled as rule-based). */
export function ruleRefine(doc: SiteDoc, request: string): RefinePatch {
  const r = request.toLowerCase();
  const t: RefinePatch["theme"] = {};
  const notes: string[] = [];
  const has = (...w: string[]) => w.some((x) => r.includes(x));
  if (has("elegant", "luxury", "classy", "premium", "sophisticated")) {
    Object.assign(t, { fontHeading: "cormorant", density: "airy", radius: "sm", animation: "subtle" });
    notes.push("refined serif headings, more breathing room and subtler corners");
  }
  if (has("modern", "clean", "tech")) { Object.assign(t, { fontHeading: "space-grotesk", fontBody: "inter" }); notes.push("modern grotesque typography"); }
  if (has("playful", "fun", "friendly")) { Object.assign(t, { fontHeading: "outfit", radius: "xl", animation: "lively" }); notes.push("rounder shapes and livelier motion"); }
  if (has("bold", "loud", "striking")) { Object.assign(t, { fontHeading: "archivo-black", headingScale: "xl" }); notes.push("bolder, larger headlines"); }
  if (has("minimal", "simple", "less busy", "cleaner")) { Object.assign(t, { ornament: "none", cardStyle: "flat", animation: "subtle" }); notes.push("removed decoration for a calmer look"); }
  if (has("more space", "spacious", "airy", "breathing", "use more space")) { t.density = "airy"; notes.push("more spacing between sections"); }
  if (has("compact", "tighter", "less space", "denser")) { t.density = "compact"; notes.push("tighter spacing"); }
  const cur = SCALE.indexOf(doc.theme.headingScale);
  if (has("header smaller", "smaller header", "smaller heading", "headings smaller", "smaller title", "smaller text")) { t.headingScale = SCALE[Math.max(0, cur - 1)]; notes.push("smaller headings"); }
  if (has("bigger heading", "larger heading", "bigger title", "header bigger", "bigger header")) { t.headingScale = SCALE[Math.min(3, cur + 1)]; notes.push("larger headings"); }
  if (has("dark mode", "darker", "dark theme", "make it dark")) { t.mode = "dark"; notes.push("dark colour scheme"); }
  if (has("light mode", "lighter", "light theme", "make it light", "brighter")) { t.mode = "light"; notes.push("light colour scheme"); }
  const ri = RADII.indexOf(doc.theme.radius);
  if (has("rounded", "rounder", "soft corners")) { t.radius = RADII[Math.min(4, ri + 1)]; notes.push("rounder corners"); }
  if (has("sharp", "square", "no rounded")) { t.radius = "none"; notes.push("square corners"); }
  if (has("no animation", "less animation", "static", "no motion")) { t.animation = "none"; notes.push("animations switched off"); }
  if (has("more animation", "animated", "motion")) { if (!has("no animation", "less animation")) { t.animation = "lively"; notes.push("livelier animations"); } }
  if (has("serif")) { t.fontHeading = "playfair"; notes.push("serif headings"); }
  if (has("glass")) { t.cardStyle = "glass"; notes.push("glass-style cards"); }
  if (has("shadow", "elevated", "depth")) { t.cardStyle = "elevated"; notes.push("cards with depth"); }
  for (const [name, val] of Object.entries(COLORS)) {
    if (new RegExp(`\\b${name}\\b`).test(r)) { t.primary = val; notes.push(`${name} as the main colour`); break; }
  }
  let heroVariant: RefinePatch["heroVariant"];
  if (has("full screen", "fullscreen", "big image", "full-width image", "full bleed")) { heroVariant = "fullbleed"; notes.push("full-bleed hero image"); }
  else if (has("centered", "centred")) { heroVariant = "centered"; notes.push("centred hero"); }
  else if (has("magazine", "editorial")) { heroVariant = "editorial"; notes.push("editorial hero layout"); }
  return RefinePatch.parse({ theme: t, heroVariant, explanation: notes.length ? `Applied: ${notes.join("; ")}.` : "No recognised design instructions were found. Try words like “more elegant”, “more space”, “smaller headings”, “dark mode” or a colour name." });
}
