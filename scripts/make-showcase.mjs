// Captures WebP screenshots of the live demo sites for the "Made with ImprintSites" wall.
// Usage: node scripts/make-showcase.mjs http://localhost:8788   (or the production URL)
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = (process.argv[2] || "http://localhost:8788").replace(/\/$/, "");
const OUT = "public/showcase";
mkdirSync(OUT, { recursive: true });

const SHOTS = [
  { name: "store-home", path: "/s/demo-store/", vp: { width: 1440, height: 1000 }, outW: 1100 },
  { name: "business-home", path: "/s/demo-business/", vp: { width: 1440, height: 1000 }, outW: 1100 },
  { name: "portfolio-home", path: "/s/demo-portfolio/", vp: { width: 1440, height: 1000 }, outW: 1100 },
  { name: "store-shop", path: "/s/demo-store/shop", vp: { width: 1440, height: 1000 }, outW: 1100 },
  { name: "store-product-m", path: "/s/demo-store/product/floral-wrap-dress", vp: { width: 390, height: 844 }, outW: 390 },
  { name: "business-services-m", path: "/s/demo-business/services", vp: { width: 390, height: 844 }, outW: 390 },
];

const browser = await chromium.launch({ channel: "chrome" });
for (const s of SHOTS) {
  const page = await browser.newPage({ viewport: s.vp, deviceScaleFactor: s.vp.width < 500 ? 2 : 1 });
  await page.goto(BASE + s.path, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: ".notice,.ribbon,.wa-float{display:none!important}.rv{opacity:1!important;transform:none!important}" });
  await page.waitForTimeout(1200);
  const png = await page.screenshot({ type: "png" });
  const webp = await page.evaluate(async ({ b64, outW }) => {
    const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
    const c = document.createElement("canvas"); c.width = outW; c.height = Math.round((img.height * outW) / img.width);
    const x = c.getContext("2d"); x.imageSmoothingQuality = "high"; x.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/webp", 0.8).split(",")[1];
  }, { b64: png.toString("base64"), outW: s.outW });
  writeFileSync(`${OUT}/${s.name}.webp`, Buffer.from(webp, "base64"));
  await page.close();
  console.log("captured", s.name);
}
await browser.close();
