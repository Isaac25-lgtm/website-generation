import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const SHOTS = process.env.SHOTS_DIR || "tests/e2e/screenshots";
const run = Date.now().toString(36);
const MOBILE = { width: 390, height: 844 };

async function noSeriousA11y(page: Page, label: string) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).disableRules(["color-contrast"]).analyze();
  const bad = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(bad.map((v) => `${label}: ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target}`)).toEqual([]);
}

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon|fonts\.g|ERR_BLOCKED|ERR_NAME_NOT_RESOLVED|google\.com\/maps|404 \(Not Found\)/i.test(m.text())) errors.push(m.text()); });
  return errors;
}

test.describe("public marketing site", () => {
  test("homepage desktop: hero prompt, prices, demos, accessibility", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Imagine it. Build it. Launch it.");
    await expect(page.getByLabel("Describe your website")).toBeVisible();
    for (const p of ["$20", "$30", "$100"]) await expect(page.getByText(p).first()).toBeVisible();
    for (const fee of ["+ $3 / month hosting & maintenance", "+ $4 / month hosting & maintenance", "+ $5 / month hosting & maintenance"]) await expect(page.getByText(fee).first()).toBeAttached();
    await expect(page.getByText(/Hosting and maintenance are then \$3–\$5 per site per month, depending on the site type/)).toBeAttached();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${SHOTS}/01-home-desktop.png` });
    await page.screenshot({ path: `${SHOTS}/01b-home-desktop-full.png`, fullPage: true });
    await noSeriousA11y(page, "home");
    expect(errors).toEqual([]);
  });

  test("homepage mobile + prompt leads to sign-up", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/");
    await page.screenshot({ path: `${SHOTS}/02-home-mobile.png` });
    await page.getByLabel("Describe your website").fill("A bakery in Lisbon with our menu and online orders");
    await page.getByRole("button", { name: /Start building/ }).click();
    await expect(page).toHaveURL(/\/signup\?next=/);
    await expect(page.getByRole("heading", { name: /Create your free account/ })).toBeVisible();
  });

  test("pricing, legal and contact pages", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByText("$20").first()).toBeVisible();
    await expect(page.getByText("$30").first()).toBeVisible();
    await expect(page.getByText("$100").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Hosting & maintenance: \$3–\$5 per site per month/ })).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/03-pricing.png`, fullPage: true });
    await noSeriousA11y(page, "pricing");
    for (const [path, h] of [["/terms", "Terms of Service"], ["/privacy", "Privacy Policy"], ["/refunds", "Refund & Cancellation Policy"]]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(h);
      if (path === "/terms") await expect(page.getByText(/costs \$3 per month for a personal site, \$4 for a business site and \$5 for an online store/)).toBeVisible();
      await expect(page.locator("main")).not.toContainText(/lorem|TODO|\[company\]/i);
    }
    await page.goto("/contact");
    await page.getByLabel("Your name").fill("E2E Tester");
    await page.getByLabel("Email").fill("e2e@example.com");
    await page.getByLabel("Subject").fill("Testing the form");
    await page.waitForTimeout(2700);
    await page.getByLabel("Message").fill("This is an automated end-to-end test message.");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText(/message has been received/)).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/04-contact.png` });
  });

  test("template gallery and examples", async ({ page }) => {
    await page.goto("/templates");
    await expect(page.getByText(/member templates unlock/)).toBeVisible();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${SHOTS}/05-templates-public.png` });
    await page.goto("/examples");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SHOTS}/06-examples.png` });
  });
});

test.describe("demo sites", () => {
  for (const [slug, label] of [["demo-portfolio", "personal"], ["demo-business", "business"], ["demo-store", "ecommerce"]]) {
    test(`${label} demo renders on desktop and mobile with no serious a11y issues`, async ({ page }) => {
      const errors = trackErrors(page);
      await page.goto(`/s/${slug}/`);
      await expect(page.getByText("Demonstration site")).toBeVisible();
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${SHOTS}/10-demo-${label}-desktop.png`, fullPage: true });
      await noSeriousA11y(page, slug);
      await page.setViewportSize(MOBILE);
      await page.reload();
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${SHOTS}/11-demo-${label}-mobile.png` });
      const menu = page.getByRole("button", { name: "Menu" });
      if (await menu.isVisible()) { await menu.click(); await expect(page.locator("#site-nav")).toHaveClass(/open/); }
      expect(errors).toEqual([]);
    });
  }

  test("demo store: search, variant, cart, checkout, confirmation", async ({ page }) => {
    await page.goto("/s/demo-store/shop");
    await page.getByRole("searchbox", { name: "Search" }).fill("dress");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText(/products? matching/)).toBeVisible();
    await page.getByRole("link", { name: /Floral wrap dress/ }).click();
    await page.getByLabel("Size").selectOption("M");
    await page.getByLabel("Colour").selectOption("Navy");
    await expect(page.locator("[data-stock]")).toContainText(/stock|left/);
    await page.getByRole("button", { name: "Add to cart" }).click();
    await expect(page.getByText("Added to your cart")).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/12-store-product.png` });
    await page.goto("/s/demo-store/cart");
    await expect(page.getByRole("link", { name: "Floral wrap dress" })).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/13-store-cart.png` });
    await page.getByRole("link", { name: "Continue to checkout" }).click();
    await page.getByLabel("Full name").fill("E2E Buyer");
    await page.getByLabel(/^Phone/).fill("+33 1 99 00 12 34");
    await page.getByLabel("Street address").fill("12 Rue de la Paix");
    await page.getByLabel("Town / city").fill("Paris");
    await expect(page.locator("[data-summary]")).toContainText("Total");
    await page.screenshot({ path: `${SHOTS}/14-store-checkout.png`, fullPage: true });
    await page.waitForTimeout(2600);
    await page.getByLabel(/I agree that/).check();
    await page.getByRole("button", { name: "Place order" }).click();
    await expect(page).toHaveURL(/\/order\/ord_/);
    await expect(page.getByText(/Thank you, E2E/)).toBeVisible();
    await expect(page.getByText(/demonstration store/)).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/15-store-order-confirmation.png`, fullPage: true });
  });
});

test.describe("builder flows (signed in)", () => {
  test("sign up, build a personal site with the wizard, edit and preview on devices", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/signup");
    await page.getByLabel("Your name").fill("E2E Person");
    await page.getByLabel("Email").fill(`e2e-${run}@test.example`);
    await page.getByLabel("Password").fill("Sup3r-Secret-Pass");
    await page.getByLabel(/I agree to the/).check();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.screenshot({ path: `${SHOTS}/20-dashboard-empty.png` });

    await page.goto("/templates");
    await expect(page.getByText(/member templates unlock/)).toHaveCount(0);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${SHOTS}/21-templates-member.png` });

    await page.goto("/dashboard/new?type=personal");
    await page.getByLabel("Your name").fill("Nia Achieng");
    await expect(page.getByText(/^Available\./)).toBeVisible({ timeout: 10000 });
    // Suggestions use -2 … -6, then a random suffix once those are taken (repeated local runs).
    await expect(page.getByLabel("Web address")).toHaveValue(/^nia-achieng(-[a-z0-9]+)?$/);
    await page.screenshot({ path: `${SHOTS}/21b-new-site-address.png` });
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/setup$/);
    await page.getByLabel(/Professional title/).fill("UX designer");
    await page.getByLabel("Location").fill("Toronto, Canada");
    await page.getByLabel("Your bio").fill("I design calm, useful digital products for health and education teams.");
    await page.screenshot({ path: `${SHOTS}/22-wizard-personal.png` });
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Public email").fill("nia@example.com");
    await page.getByRole("button", { name: /Review & generate/ }).click();
    await page.getByLabel(/I confirm that I own/).check();
    await page.screenshot({ path: `${SHOTS}/23-wizard-review.png` });
    await page.getByRole("button", { name: /Generate my website/ }).click();
    await expect(page).toHaveURL(/\/editor$/, { timeout: 30000 });
    const frame = page.frameLocator('iframe[title="Site preview"]');
    await expect(frame.getByRole("heading", { level: 1 })).toContainText(/Nia Achieng|UX designer/);
    await page.screenshot({ path: `${SHOTS}/24-editor-personal.png` });

    await page.getByLabel("Describe a design change").fill("dark mode with more space");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText(/^(AI|Rule-based designer):/)).toBeVisible({ timeout: 30000 });
    await page.getByRole("button", { name: "Mobile" }).click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SHOTS}/25-editor-mobile-dark.png` });
    await page.getByRole("button", { name: "Undo" }).click();
    await page.getByRole("button", { name: "Tablet" }).click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SHOTS}/26-editor-tablet.png` });

    await page.getByRole("link", { name: /Publish/ }).click();
    await expect(page.getByText(/Online checkout is opening soon|Pay \$20/)).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/27-publish-gate.png` });
    expect(errors).toEqual([]);
  });

  test("business wizard and e-commerce product manager", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Your name").fill("E2E Biz");
    await page.getByLabel("Email").fill(`e2e-biz-${run}@test.example`);
    await page.getByLabel("Password").fill("Sup3r-Secret-Pass");
    await page.getByLabel(/I agree to the/).check();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/dashboard/new?type=business");
    await page.getByLabel("Business name").fill("Kijiji Coffee");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Tagline").fill("Single-origin coffee, roasted in Melbourne");
    await page.getByLabel(/Short description/).fill("A neighbourhood café and roastery.");
    await page.getByRole("button", { name: /Review & generate/ }).click();
    await page.getByLabel(/I confirm that I own/).check();
    await page.getByRole("button", { name: /Generate my website/ }).click();
    await expect(page).toHaveURL(/\/editor$/, { timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SHOTS}/30-editor-business.png` });
    await page.getByRole("button", { name: /Change template/ }).click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SHOTS}/31-editor-template-switch.png` });
    await page.keyboard.press("Escape");

    await page.goto("/dashboard/new?type=ecommerce");
    await page.getByLabel("Store name").fill("Kijiji Market");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: /Products & categories/ }).click();
    await page.getByRole("button", { name: "+ Add product" }).click();
    await page.getByLabel("Product name").fill("Arabica beans 500g");
    await page.getByRole("textbox", { name: "Price (USD)" }).fill("12.5");
    await page.getByPlaceholder("Size").fill("Grind");
    await page.getByPlaceholder("S, M, L").fill("Whole, Ground");
    await page.screenshot({ path: `${SHOTS}/32-product-editor.png` });
    await page.getByRole("button", { name: "Save product" }).click();
    await expect(page.getByRole("cell", { name: /Arabica beans/ })).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/33-products-list.png` });
    await page.getByRole("button", { name: /Checkout & payments/ }).click();
    await page.screenshot({ path: `${SHOTS}/34-store-payments-step.png`, fullPage: true });
  });

  test("all 18 templates render for members", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Your name").fill("E2E Member");
    await page.getByLabel("Email").fill(`e2e-member-${Date.now().toString(36)}@test.example`);
    await page.getByLabel("Password").fill("Sup3r-Secret-Pass");
    await page.getByLabel(/I agree to the/).check();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    const r = await page.request.get("/api/templates");
    const list = (await r.json()).templates as { id: string; type: string }[];
    expect(list.length).toBe(18);
    for (const t of list) {
      await page.goto(`/api/templates/${t.id}/preview/`);
      await expect(page.locator("h1").first()).toBeVisible();
      await page.screenshot({ path: `${SHOTS}/40-template-${t.id}.png` });
    }
    await page.setViewportSize(MOBILE);
    for (const id of ["p-kernel", "b-savanna", "e-maison"]) {
      await page.goto(`/api/templates/${id}/preview/`);
      await page.screenshot({ path: `${SHOTS}/41-template-${id}-mobile.png` });
    }
  });
});
