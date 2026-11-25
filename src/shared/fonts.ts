import type { FontKey } from "./schema";

// All fonts are open-licensed (SIL Open Font License) and served by Google Fonts.
export const FONTS: Record<FontKey, { label: string; family: string; google: string; stack: string }> = {
  inter: { label: "Inter", family: "Inter", google: "Inter:wght@400;500;600;700", stack: "system-ui, sans-serif" },
  manrope: { label: "Manrope", family: "Manrope", google: "Manrope:wght@400;500;600;700;800", stack: "system-ui, sans-serif" },
  "plus-jakarta": { label: "Plus Jakarta Sans", family: "Plus Jakarta Sans", google: "Plus+Jakarta+Sans:wght@400;500;600;700;800", stack: "system-ui, sans-serif" },
  outfit: { label: "Outfit", family: "Outfit", google: "Outfit:wght@400;500;600;700;800", stack: "system-ui, sans-serif" },
  "space-grotesk": { label: "Space Grotesk", family: "Space Grotesk", google: "Space+Grotesk:wght@400;500;600;700", stack: "system-ui, sans-serif" },
  "dm-sans": { label: "DM Sans", family: "DM Sans", google: "DM+Sans:wght@400;500;600;700", stack: "system-ui, sans-serif" },
  "work-sans": { label: "Work Sans", family: "Work Sans", google: "Work+Sans:wght@400;500;600;700", stack: "system-ui, sans-serif" },
  poppins: { label: "Poppins", family: "Poppins", google: "Poppins:wght@400;500;600;700;800", stack: "system-ui, sans-serif" },
  playfair: { label: "Playfair Display", family: "Playfair Display", google: "Playfair+Display:ital,wght@0,500;0,600;0,700;1,500", stack: "Georgia, serif" },
  fraunces: { label: "Fraunces", family: "Fraunces", google: "Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400", stack: "Georgia, serif" },
  cormorant: { label: "Cormorant Garamond", family: "Cormorant Garamond", google: "Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500", stack: "Georgia, serif" },
  "dm-serif": { label: "DM Serif Display", family: "DM Serif Display", google: "DM+Serif+Display:ital@0;1", stack: "Georgia, serif" },
  "libre-baskerville": { label: "Libre Baskerville", family: "Libre Baskerville", google: "Libre+Baskerville:ital,wght@0,400;0,700;1,400", stack: "Georgia, serif" },
  lora: { label: "Lora", family: "Lora", google: "Lora:ital,wght@0,400;0,600;0,700;1,400", stack: "Georgia, serif" },
  "jetbrains-mono": { label: "JetBrains Mono", family: "JetBrains Mono", google: "JetBrains+Mono:wght@400;500;700", stack: "ui-monospace, monospace" },
  "space-mono": { label: "Space Mono", family: "Space Mono", google: "Space+Mono:wght@400;700", stack: "ui-monospace, monospace" },
  syne: { label: "Syne", family: "Syne", google: "Syne:wght@500;600;700;800", stack: "system-ui, sans-serif" },
  "archivo-black": { label: "Archivo Black", family: "Archivo Black", google: "Archivo+Black", stack: "Impact, system-ui, sans-serif" },
  bricolage: { label: "Bricolage Grotesque", family: "Bricolage Grotesque", google: "Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800", stack: "system-ui, sans-serif" },
  "instrument-serif": { label: "Instrument Serif", family: "Instrument Serif", google: "Instrument+Serif:ital@0;1", stack: "Georgia, serif" },
  "bodoni-moda": { label: "Bodoni Moda", family: "Bodoni Moda", google: "Bodoni+Moda:ital,wght@0,400;0,500;0,600;1,400", stack: "Didot, Georgia, serif" },
  newsreader: { label: "Newsreader", family: "Newsreader", google: "Newsreader:ital,wght@0,400;0,500;0,600;1,400", stack: "Georgia, serif" },
  jost: { label: "Jost", family: "Jost", google: "Jost:wght@300;400;500;600", stack: "system-ui, sans-serif" },
  "inter-tight": { label: "Inter Tight", family: "Inter Tight", google: "Inter+Tight:wght@400;500;600;700", stack: "system-ui, sans-serif" },
  "instrument-sans": { label: "Instrument Sans", family: "Instrument Sans", google: "Instrument+Sans:wght@400;500;600;700", stack: "system-ui, sans-serif" },
  "libre-caslon": { label: "Libre Caslon", family: "Libre Caslon Text", google: "Libre+Caslon+Text:ital,wght@0,400;0,700;1,400", stack: "Georgia, serif" },
  archivo: { label: "Archivo", family: "Archivo", google: "Archivo:wdth,wght@62..125,100..900", stack: "system-ui, sans-serif" },
  unbounded: { label: "Unbounded", family: "Unbounded", google: "Unbounded:wght@400;500;600;700", stack: "system-ui, sans-serif" },
};

export function fontStack(key: FontKey): string {
  const f = FONTS[key] ?? FONTS.inter;
  return `"${f.family}", ${f.stack}`;
}

export function googleFontsHref(keys: FontKey[]): string {
  const uniq = [...new Set(keys)].map((k) => FONTS[k]?.google).filter(Boolean);
  return `https://fonts.googleapis.com/css2?${uniq.map((g) => `family=${g}`).join("&")}&display=swap`;
}
