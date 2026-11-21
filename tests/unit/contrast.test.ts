import { describe, expect, it } from "vitest";
import { TEMPLATES } from "../../src/shared/templates";
import { themeVars } from "../../src/shared/render/css";
import { contrastRatio, ensureContrast } from "../../src/shared/util";

const vars = (css: string) => Object.fromEntries([...css.matchAll(/--([a-z-]+):(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));

describe("brand colours stay readable on the page background", () => {
  it("ensureContrast leaves passing colours alone and lifts failing ones", () => {
    expect(ensureContrast("#111111", "#ffffff", "#000000", 4.5)).toBe("#111111");
    const lifted = ensureContrast("#13305f", "#0f1115", "#f4f4f5", 4.5); // navy on a dark page
    expect(contrastRatio(lifted, "#0f1115")).toBeGreaterThanOrEqual(4.5);
  });

  for (const tpl of TEMPLATES) {
    for (const mode of ["light", "dark"] as const) {
      it(`${tpl.id} in ${mode} mode: primary text 4.5:1, buttons and accents 3:1`, () => {
        const t = structuredClone(tpl.theme);
        if (mode === "dark" && t.mode !== "dark") {
          // What switching to dark mode does in the editor: dark page and light text, brand colours unchanged.
          t.mode = "dark";
          t.colors = { ...t.colors, bg: "#0f1115", surface: "#171a21", text: "#f4f4f5", muted: "#a1a1aa" };
        }
        const v = vars(themeVars(t));
        expect(contrastRatio(v["primary-ink"], v.bg), "primary-ink").toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(v.primary, v.bg), "primary").toBeGreaterThanOrEqual(3);
        expect(contrastRatio(v.accent, v.bg), "accent").toBeGreaterThanOrEqual(3);
        expect(contrastRatio(v["on-primary"], v.primary), "on-primary").toBeGreaterThanOrEqual(3);
      });
    }
  }
});
