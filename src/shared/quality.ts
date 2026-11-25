// The no-AI-slop rule (owner rule, 24 Nov 2026). Sites built by ImprintSites must read as
// professionally designed, never as generic AI output. This module is the single source of
// truth for what counts as slop. It is enforced:
//   • by tests over every template's CSS and every demo persona's copy;
//   • at runtime on AI copy polish: a suggestion containing slop is discarded and the
//     customer's own words are kept.

/** Cliché marketing phrases typical of AI-written copy. Matched case-insensitively on word boundaries. */
export const SLOP_PHRASES = [
  "elevate", "elevating", "unleash", "unlock your", "unlock the power", "seamless", "seamlessly", "cutting-edge", "cutting edge",
  "game-changer", "game changer", "revolutionize", "revolutionise", "next-level", "next level", "world-class", "best-in-class",
  "supercharge", "empower", "empowering", "synergy", "leverage", "harness the power", "in today's fast-paced", "fast-paced world",
  "delve", "tapestry", "embark on", "a testament to", "look no further", "to the next level", "transformative",
  "innovative solutions", "state-of-the-art", "unparalleled", "redefine", "redefining", "reimagine", "reimagined", "curated just for you",
  "elevated experience", "crafted with passion", "passionate about excellence", "your one-stop", "one-stop shop", "where innovation meets",
  "meets elegance", "dive into", "immerse yourself", "boundless", "limitless possibilities",
];

const PHRASE_RE = new RegExp(`(^|[^a-z])(${SLOP_PHRASES.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?=$|[^a-z])`, "i");

/** Emoji and pictographs: slop in professional site copy. */
const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/u;

/** Returns the first slop problem in a piece of copy, or null when it is clean. */
export function copySlop(text: string): string | null {
  if (!text) return null;
  const m = PHRASE_RE.exec(text);
  if (m) return `cliché phrase “${m[2]}”`;
  if (EMOJI_RE.test(text)) return "emoji";
  if (/!{2,}/.test(text)) return "repeated exclamation marks";
  return null;
}

/** CSS patterns that make a site look AI-generated. */
const CSS_RULES: [RegExp, string][] = [
  [/background-clip\s*:\s*text/i, "gradient text"],
  [/box-shadow\s*:[^;}]*0 0 ([4-9]|\d{2,})px[^;}]*var\(--(primary|accent)\)/i, "neon glow"],
  [/radial-gradient\([^)]*var\(--(primary|accent)\)/i, "glow backdrop"],
  [/linear-gradient\([^;}]*var\(--primary\)[^;}]*var\(--accent\)/i, "two-colour brand gradient"],
];

/** Returns the first slop problem in template CSS, or null. */
export function cssSlop(css: string): string | null {
  for (const [re, label] of CSS_RULES) if (re.test(css)) return label;
  return null;
}
