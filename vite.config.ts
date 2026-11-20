import { defineConfig, type Connect, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import http from "node:http";

// Routes already migrated to the Python backend (backend/). When PY_API is set (for example
// PY_API=http://127.0.0.1:8000), the local dev/preview server forwards exactly these requests to Python and
// everything else to the Worker, behind one origin so cookies and CSRF behave as in production.
// Python responses carry `x-served-by: python`. There is no silent fallback: if Python is down you get a 502.
const PY_ROUTES: { method: string; path: RegExp }[] = [
  { method: "GET", path: /^\/api\/projects\/prj_[a-z0-9]+$/ },
];

function pythonApi(target = process.env.PY_API): Plugin {
  const forward: Connect.NextHandleFunction = (req, res, next) => {
    if (!target) return next();
    const url = new URL(req.url || "/", "http://local");
    const method = req.method === "HEAD" ? "GET" : req.method;
    if (!PY_ROUTES.some((r) => r.method === method && r.path.test(url.pathname))) return next();
    const t = new URL(target);
    const upstream = http.request(
      { host: t.hostname, port: t.port || 80, method: req.method, path: url.pathname + url.search, headers: { ...req.headers, "x-forwarded-proto": "http" } },
      (r) => { res.writeHead(r.statusCode || 502, r.headers); r.pipe(res); },
    );
    upstream.on("error", () => {
      if (!res.headersSent) res.writeHead(502, { "content-type": "application/json", "cache-control": "no-store" });
      res.end(JSON.stringify({ error: "The Python API is not reachable. Start it (see backend/README.md) or unset PY_API.", code: "upstream_unavailable" }));
    });
    req.pipe(upstream);
  };
  return {
    name: "imprint-python-api",
    configureServer(server) { server.middlewares.use(forward); },
    configurePreviewServer(server) { server.middlewares.use(forward); },
  };
}

export default defineConfig({
  // pythonApi() is listed first so its middleware runs before the Worker's.
  plugins: [pythonApi(), react(), cloudflare()],
  build: { chunkSizeWarningLimit: 900 },
});
