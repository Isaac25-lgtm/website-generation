// Limits shared by the help assistant's browser widget and its Worker endpoint, so a reply the server
// returns can always be sent back as conversation history on the next turn.

/** Longest single turn, in characters. Replies are cut to this length too. */
export const ASSISTANT_MAX_TURN = 6000; // room for detailed, step-by-step answers (owner, 25 Nov 2026)
/** Turns kept and forwarded to the model. */
export const ASSISTANT_MAX_HISTORY = 12;
/** Largest request body the endpoint will read, in bytes. */
export const ASSISTANT_MAX_BODY = ASSISTANT_MAX_HISTORY * ASSISTANT_MAX_TURN * 3 + 2048;

/** Server-owned page categories. Only these labels ever reach the model, never visitor-supplied text. */
export const PAGE_CATEGORIES = {
  home: "the home page",
  pricing: "the pricing page",
  templates: "the template gallery",
  "how-it-works": "the how-it-works page",
  contact: "the contact page",
  legal: "a legal page (terms, privacy or refunds)",
  auth: "a sign-in or sign-up page",
  dashboard: "their dashboard",
  setup: "the site setup wizard",
  editor: "the site editor",
  publish: "the publish page",
  store: "their store manager",
  leads: "their enquiries page",
  account: "their account settings",
  admin: "the admin area",
  other: "another page",
} as const;
export type PageCategory = keyof typeof PAGE_CATEGORIES;

export function pageCategory(path: unknown): PageCategory {
  const p = typeof path === "string" ? path.split(/[?#]/)[0] : "";
  if (p === "/" || p === "") return "home";
  const rules: [RegExp, PageCategory][] = [
    [/^\/pricing\/?$/, "pricing"], [/^\/templates\/?$/, "templates"], [/^\/how-it-works\/?$/, "how-it-works"],
    [/^\/contact\/?$/, "contact"], [/^\/(terms|privacy|refunds)\/?$/, "legal"],
    [/^\/(login|signup|forgot-password|reset-password)\/?$/, "auth"], [/^\/dashboard(\/new)?\/?$/, "dashboard"],
    [/^\/projects\/[^/]+\/setup\/?$/, "setup"], [/^\/projects\/[^/]+\/editor\/?$/, "editor"],
    [/^\/projects\/[^/]+\/publish\/?$/, "publish"], [/^\/projects\/[^/]+\/store\/?$/, "store"],
    [/^\/projects\/[^/]+\/leads\/?$/, "leads"], [/^\/account\/?$/, "account"], [/^\/admin\/?$/, "admin"],
  ];
  return rules.find(([re]) => re.test(p))?.[1] ?? "other";
}
