// Captures WebP screenshots of the Motion Imprints team's own live sites for the "Our work" group on the
// home page. They are real client and company sites by the team, shown apart from the builder demos.
// Usage: node scripts/make-ourwork.mjs
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = "public/showcase";
mkdirSync(OUT, { recursive: true });
const SITES = [
  { name: "work-motionimprints", url: "https://motionimprints.online/" },
  { name: "work-jerseyville", url: "https://jerseyville.omodingisaac123.workers.dev/" },
  { name: "work-ats", url: "https://ats-public-web.onrender.com/" },
];
const VIEWS = [{ suffix: "", vp: { width: 1440, height: 1000 }, outW: 1100 }, { suffix: "-m", vp: { width: 390, height: 844 }, outW: 390 }];

const browser = await chromium.launch({ channel: "chrome" });
for (const s of SITES) {
  for (const v of VIEWS) {
    const page = await browser.newPage({ viewport: v.vp, deviceScaleFactor: v.vp.width < 500 ? 2 : 1 });
    try {
      // Render-hosted apps can cold-start slowly; allow time, then let animations settle.
      await page.goto(s.url, { waitUntil: "load", timeout: 120_000 });
      await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
      await page.waitForTimeout(2500);
      const png = await page.screenshot({ type: "png" });
      const webp = await page.evaluate(async ({ b64, outW }) => {
        const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
        const c = document.createElement("canvas"); c.width = outW; c.height = Math.round((img.height * outW) / img.width);
        const x = c.getContext("2d"); x.imageSmoothingQuality = "high"; x.drawImage(img, 0, 0, c.width, c.height);
        return c.toDataURL("image/webp", 0.8).split(",")[1];
      }, { b64: png.toString("base64"), outW: v.outW });
      writeFileSync(`${OUT}/${s.name}${v.suffix}.webp`, Buffer.from(webp, "base64"));
      console.log("captured", s.name + v.suffix, "-", await page.title());
    } catch (e) {
      console.log("FAILED", s.name + v.suffix, e.message.split("\n")[0]);
    }
    await page.close();
  }
}
await browser.close();
