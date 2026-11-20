import { beforeAll, describe, expect, it } from "vitest";
import { execFileSync, execSync } from "node:child_process";

// Worker ↔ Python parity for the migrated read path. Runs only when PY_API_URL points at the Django server
// (for example PY_API_URL=http://127.0.0.1:8000) and TEST_BASE_URL is a local Worker started WITHOUT PY_API.
// The project is created through the Worker, copied with `manage.py import_d1`, then read from both.
// The copy REPLACES the target tables, so both Django and this test must use a disposable database
// (export DATABASE_URL=…/imprintsites_parity before starting Django and this test). Anything else is refused.
const BASE = (process.env.TEST_BASE_URL || "http://localhost:8788").replace(/\/$/, "");
const PY = (process.env.PY_API_URL || "").replace(/\/$/, "");
const PYTHON = process.platform === "win32" ? "backend/.venv/Scripts/python.exe" : "backend/.venv/bin/python";
const run = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

async function call(base: string, path: string, opts: { method?: string; body?: unknown; cookie?: string } = {}) {
  const headers: Record<string, string> = { "x-requested-with": "test" };
  if (opts.cookie) headers.cookie = opts.cookie;
  if (opts.body !== undefined) headers["content-type"] = "application/json";
  const init = { method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"), headers, body: opts.body === undefined ? undefined : JSON.stringify(opts.body) };
  // One retry: the local Worker briefly resets connections right after `wrangler d1 execute` (same as the other suites).
  let res: Response;
  try { res = await fetch(base + path, init); } catch { await new Promise((r) => setTimeout(r, 800)); res = await fetch(base + path, init); }
  const cookie = res.headers.get("set-cookie")?.match(/is_session=([^;]*)/)?.[1];
  return { status: res.status, headers: res.headers, json: await res.json().catch(() => ({})) as any, cookie: cookie ? `is_session=${cookie}` : undefined };
}

const sql = (q: string) => execSync(`npx wrangler d1 execute DB --local --command "${q.replace(/"/g, '\\"')}"`, { stdio: "ignore" });
// ai.available reports each server's own AI provider (Worker binding vs Workers AI REST credentials in Python).
const comparable = (b: any) => { const c = structuredClone(b); delete c.ai?.available; return c; };

describe.skipIf(!PY)("Python read path matches the Worker", () => {
  let owner = "", stranger = "", id = "";

  beforeAll(async () => {
    const ready = await call(PY, "/readyz");
    expect(ready.json.dataset, "Start Django with DATABASE_URL pointing at a disposable database (e.g. …/imprintsites_parity)").toBe("disposable");
    sql("DELETE FROM rate_limits");
    const signup = async (who: string) => (await call(BASE, "/api/auth/signup", { body: { name: who, email: `${who}-${run}@test.example`, password: "Sup3r-Secret-Pass", acceptTerms: true } })).cookie!;
    owner = await signup("pyowner");
    stranger = await signup("pystranger");
    const admin = await signup("pyadmin");
    sql(`UPDATE users SET role='admin' WHERE email='pyadmin-${run}@test.example'`);
    const worker = await call(BASE, "/api/health-check-none", { cookie: owner });
    expect(worker.headers.get("x-served-by"), "TEST_BASE_URL must be the Worker without PY_API").toBeNull();

    id = (await call(BASE, "/api/projects", { body: { type: "business", name: `Parity ${run}` }, cookie: owner })).json.id;
    await call(BASE, `/api/projects/${id}/intake`, { method: "PUT", body: { step: 2, answers: { businessName: "Kijani Trails", tagline: "Guided walks", city: "Kampala" } }, cookie: owner });
    expect((await call(BASE, `/api/projects/${id}/generate`, { body: {}, cookie: owner })).status).toBe(200);
    await call(BASE, `/api/admin/projects/${id}/entitlement`, { body: { reason: "Parity test" }, cookie: admin });
    expect((await call(BASE, `/api/projects/${id}/publish`, { body: { contentRightsAck: true }, cookie: owner })).status).toBe(200);

    execFileSync(PYTHON, ["backend/manage.py", "import_d1", "--yes", "--disposable-only"], { stdio: "pipe" });
  }, 240_000);

  it("returns the same project document, intake, publication and entitlement", async () => {
    const [w, p] = await Promise.all([call(BASE, `/api/projects/${id}`, { cookie: owner }), call(PY, `/api/projects/${id}`, { cookie: owner })]);
    expect(w.status).toBe(200);
    expect(p.status).toBe(200);
    expect(p.headers.get("x-served-by")).toBe("python");
    expect(p.json.publish?.status).toBe("live");
    expect(comparable(p.json)).toEqual(comparable(w.json));
  });

  it("returns the same errors for anonymous, other users and unknown projects", async () => {
    for (const [path, cookie] of [[`/api/projects/${id}`, undefined], [`/api/projects/${id}`, stranger], ["/api/projects/prj_doesnotexist00", owner]] as const) {
      const [w, p] = await Promise.all([call(BASE, path, { cookie }), call(PY, path, { cookie })]);
      expect([p.status, p.json]).toEqual([w.status, w.json]);
    }
  });

  it("returns the same public configuration for prices, hosting, operator and demos", async () => {
    const [w, p] = await Promise.all([call(BASE, "/api/config"), call(PY, "/api/config")]);
    for (const k of ["appName", "prices", "payments", "hosting", "operator", "demos"]) expect(p.json[k], k).toEqual(w.json[k]);
  });
});
