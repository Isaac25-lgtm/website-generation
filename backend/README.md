# ImprintSites AI · Python backend

Django + Django REST Framework + PostgreSQL (Neon). This is **step 2 of the migration** in [docs/claude-handoff.md](../docs/claude-handoff.md): a working Python **read path** next to the existing TypeScript Worker.

| | Status |
|---|---|
| Serves | `GET /healthz`, `GET /readyz`, `GET /api/config`, `GET /api/projects/<id>` |
| Writes | Nothing. The Worker is still the only writer for every domain. Python reads a verified copy of the data. |
| Authority | **Snapshot only.** A copy can't see logouts, suspensions, membership removals or drafts saved since the import. Private reads are therefore refused (`503 snapshot_not_authoritative`) unless `ALLOW_SNAPSHOT_READS=1`, which defaults to on only when `DJANGO_DEBUG=1`. Before any customer traffic, authorization must come from the current authority. Also test an edit followed immediately by a reload. |
| Sign-in | Accepts the Worker's existing `is_session` cookie (same sessions table, `sha256(token)` ids). Python doesn't create sessions yet. |
| Database | PostgreSQL on Neon. Tables and columns mirror D1 exactly (string ids, millisecond timestamps, JSON documents stored as text). |
| Contracts | Validates SiteDocs against `contracts/sitedoc.schema.json`, which is generated from the TypeScript Zod schema. Plan prices come from `contracts/public-config.json`. |
| Production | Not deployed. Hosting the Python service is an open owner decision. |

## Setup

Requires Python 3.12+ and a PostgreSQL database URL (Neon). No local PostgreSQL install is needed.

```bash
cd backend
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements-dev.txt     # macOS/Linux: .venv/bin/python
cp .env.example .env                                            # then set DATABASE_URL (Neon console → Connect)
.venv/Scripts/python manage.py migrate
```

`backend/.env` is gitignored. Never commit it, and never paste the database URL into chats, issues or docs.

## Run

```bash
# 1. Copy the local Worker's D1 data into PostgreSQL (replaces the read-path tables, verifies checksums, rolls back on mismatch)
.venv/Scripts/python manage.py import_d1 --yes          # --dry-run to preview, --sqlite PATH for a specific file

# 2. Start the API
.venv/Scripts/python manage.py runserver 127.0.0.1:8000
curl http://127.0.0.1:8000/readyz                       # {"ok":true,"checks":{"database":"ok","migrations":"ok","contracts":"ok"}}
```

`import_d1` reads only local Wrangler SQLite files (`.wrangler/state/v3/d1/...`). It cannot read production D1. Test suites call it with `--disposable-only`, which refuses any database not named `test_*`, `*_parity`, `*_e2e` or `*_disposable`. `/readyz` reports `"dataset": "disposable"` or `"configured"` so the suites can check before replacing data.

### Use the React UI with Python (one origin)

From the repository root, with the Django server running:

```bash
npm run build
PY_API=http://127.0.0.1:8000 npx vite preview --port 8788 --strictPort
```

`vite.config.ts` forwards **only** the routes listed in `PY_ROUTES` (currently `GET /api/projects/prj_*`) to Python, and everything else to the Worker. Cookies and CSRF therefore work unchanged. Python responses carry `x-served-by: python`. If Python is down, those requests fail with a `502` (there is no silent fallback). Without `PY_API`, the Worker serves everything as before.

Projects created through the UI exist in D1 first. Run `import_d1 --yes` again before opening them through Python.

## Tests

```bash
cd backend && .venv/Scripts/python -m pytest              # 52 tests: contracts, API behaviour, snapshot guard, importer
```

- Database tests run in a separate `test_neondb` database on the same Neon project, which is kept between runs (`--reuse-db`). After changing models, run `pytest --create-db`.
- Without `DATABASE_URL`, the database tests are skipped with a reason, and the contract tests still run.

Cross-implementation checks run from the repository root. They replace data, so point **both** Django and the tests at a disposable database first:

```bash
export DATABASE_URL="postgresql://…/imprintsites_parity?sslmode=require"   # a separate database on the same Neon project
backend/.venv/Scripts/python backend/manage.py migrate
backend/.venv/Scripts/python backend/manage.py runserver 127.0.0.1:8000   # in its own terminal, same DATABASE_URL

# Worker ↔ Python parity: same project body, errors and public config for the same session.
# Needs the Worker preview WITHOUT PY_API on :8788 and Django on :8000.
PY_API_URL=http://127.0.0.1:8000 npx vitest run -c vitest.integration.config.ts tests/integration/python-parity.test.ts

# Browser: the editor loads its project from Python. Needs the preview started WITH PY_API (see above).
PY_API=1 npx playwright test tests/e2e/python-read.spec.ts

# Contracts: regenerate the JSON Schema and public config after changing src/shared/schema.ts or pricing.ts
npx vitest run tests/unit/contracts.test.ts -u
# Regenerate the SiteDoc fixture corpus (ids are random, so only do this deliberately)
UPDATE_CONTRACTS=1 npx vitest run tests/unit/contracts.test.ts
```

## Layout

```
config/            settings (env-driven, optional .env), urls, wsgi
imprint/models.py  D1-compatible models (users, sessions, projects, members, intake, versions, publication, entitlements, jobs, settings)
imprint/auth.py    legacy session cookie → user (expiry and suspended-user checks)
imprint/views.py   health, readiness, config, project read (Worker response shape and error format)
imprint/contracts.py   SiteDoc JSON Schema validation plus parseSiteDoc's cross-field rules
imprint/management/commands/import_d1.py   verified D1 → PostgreSQL copy
tests/             pytest suite
```

## Known, intentional differences from the Worker

- `ai.available` reports whether **this service** can call AI (Workers AI REST credentials: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_AI_API_TOKEN`). The editor reads the flag from `/api/config`, which is still served by the Worker. The parity test ignores this one field.
- In Python's `/api/config`, `browserRun.bound` is `false` (Browser Run stays on the Worker), and `storage` reports where media lives (`d1` until R2 is enabled).
- `/healthz` is liveness only and doesn't query the database. Readiness, including the database, is `/readyz`. The Worker's `/healthz` checks D1.
- String length limits: JSON Schema counts code points and Zod counts UTF-16 units, so text with emoji can pass here at a length the Worker would reject. Documents written by the Worker are valid in both.
- Unsupported methods on a Python route return `405`. In normal use they never reach Python, because the router forwards only `GET`.

## Next (handoff step 3)

Identity, projects and editing: sessions issued by Python, PBKDF2 legacy password verification against synthetic fixtures, owner/member permissions, and draft saves with an atomic compare-and-set on `draft_revision` (audit finding #4). Then AI copy and refine through a Workers AI REST adapter with timeouts and attempt accounting. Move each route by adding it to `PY_ROUTES` only after its parity test passes.
