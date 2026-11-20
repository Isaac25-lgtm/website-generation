import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";

// The React editor loads a project from the Python backend through the local single origin.
// Run with the preview server started as `PY_API=http://127.0.0.1:8000 npx vite preview --port 8788`
// and the same PY_API set for this test run (see backend/README.md).
const PYTHON = process.platform === "win32" ? "backend/.venv/Scripts/python.exe" : "backend/.venv/bin/python";
const run = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

test.skip(!process.env.PY_API, "PY_API is not set: the Worker serves every route");

test("the editor loads a project served by Python", async ({ page }) => {
  const h = { "x-requested-with": "test" };
  expect((await page.request.post("/api/auth/signup", { headers: h, data: { name: "Py Reader", email: `pyread-${run}@test.example`, password: "Sup3r-Secret-Pass", acceptTerms: true } })).ok()).toBe(true);
  const name = `Python read ${run}`;
  const id = (await (await page.request.post("/api/projects", { headers: h, data: { type: "business", name } })).json()).id as string;
  await page.request.put(`/api/projects/${id}/intake`, { headers: h, data: { step: 2, answers: { businessName: "Kijani Trails", tagline: "Guided walks in Kampala" } } });
  expect((await page.request.post(`/api/projects/${id}/generate`, { headers: h, data: {} })).ok()).toBe(true);

  execFileSync(PYTHON, ["backend/manage.py", "import_d1", "--yes"], { stdio: "ignore" });

  const read = page.waitForResponse((r) => r.request().method() === "GET" && new URL(r.url()).pathname === `/api/projects/${id}`);
  await page.goto(`/projects/${id}/editor`);
  const res = await read;
  expect(res.status()).toBe(200);
  expect(res.headers()["x-served-by"]).toBe("python");
  await expect(page.getByText(name).first()).toBeVisible();
  await expect(page.frameLocator("iframe").first().getByText("Kijani Trails").first()).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: "tests/e2e/screenshots/90-editor-served-by-python.png" });
});
