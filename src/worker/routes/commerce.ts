import { Hono } from "hono";
import { z } from "zod";
import { isOwnerStock, stripOwnerPhotos } from "../../shared/owner-photos";
import type { Ctx, HonoEnv } from "../env";
import { HttpError, now } from "../env";
import { audit, requireUser } from "../lib/auth";
import { newId, sha256Hex } from "../lib/crypto";
import { draftDoc, ownedProject, type ProjectRow } from "../lib/site";
import { parsePrice, slugify } from "../../shared/util";

export const commerce = new Hono<HonoEnv>();

async function storeProject(c: Ctx, id: string): Promise<ProjectRow> {
  const u = requireUser(c);
  const p = await ownedProject(c, u, id, { allowAdmin: true });
  if (p.site_type !== "ecommerce") throw new HttpError(400, "Products are only available for e-commerce sites.");
  return p;
}

/** Currency of the live (published) store, or null when the store isn't live. */
export async function liveStoreCurrency(c: Ctx, projectId: string): Promise<string | null> {
  const r = await c.env.DB.prepare("SELECT sv.doc_json FROM published_sites ps JOIN site_versions sv ON sv.id = ps.current_version_id WHERE ps.project_id = ? AND ps.status = 'live'").bind(projectId).first<{ doc_json: string }>();
  if (!r) return null;
  try { const cur = JSON.parse(r.doc_json)?.store?.currency; return typeof cur === "string" ? cur : null; } catch { return null; }
}

/**
 * The currency products are priced in. A live store keeps selling in its published currency (catalogue changes
 * go live immediately, so they must match the checkout). Before going live: the merchant's setup choice, then the
 * generated site, then USD. Publishing refuses any mismatch (audit #1), and checkout refuses mismatched lines.
 */
export async function storeCurrency(c: Ctx, p: ProjectRow): Promise<string> {
  const live = await liveStoreCurrency(c, p.id);
  if (live) return live;
  const intake = await c.env.DB.prepare("SELECT data_json FROM project_intake WHERE project_id = ?").bind(p.id).first<{ data_json: string }>();
  let chosen: unknown;
  try { chosen = JSON.parse(intake?.data_json || "{}").currency; } catch { chosen = undefined; }
  if (typeof chosen === "string" && /^[A-Z]{3}$/.test(chosen)) return chosen;
  return draftDoc(p)?.store?.currency ?? "USD";
}

const VariantIn = z.object({
  id: z.string().max(40).optional(),
  option1: z.string().trim().max(60).nullable().optional(),
  option2: z.string().trim().max(60).nullable().optional(),
  sku: z.string().trim().max(60).nullable().optional(),
  priceMinor: z.number().int().min(0).max(1e10).nullable().optional(),
  stock: z.number().int().min(-100000).max(1_000_000).default(0),
  /** Stock when the merchant's form was loaded. When present, only (stock - stockBase) is applied (audit #3). */
  stockBase: z.number().int().min(-100000).max(1_000_000).optional(),
  /** Set stock to an absolute count exactly once per opKey (CSV imports): a retried delivery changes nothing. */
  stockSet: z.object({ target: z.number().int().min(0).max(1_000_000), opKey: z.string().regex(/^[A-Za-z0-9:_-]{8,120}$/) }).optional(),
  trackInventory: z.boolean().default(true),
  allowBackorder: z.boolean().default(false),
});

const ProductIn = z.object({
  title: z.string().trim().min(1, "Product name is required.").max(140),
  handle: z.string().trim().max(80).optional(),
  description: z.string().max(5000).default(""),
  productType: z.enum(["physical", "digital"]).default("physical"),
  status: z.enum(["active", "draft", "archived"]).default("active"),
  priceMinor: z.number().int().min(0).max(1e10),
  compareAtMinor: z.number().int().min(0).max(1e10).nullable().optional(),
  costMinor: z.number().int().min(0).max(1e10).nullable().optional(),
  sku: z.string().trim().max(60).nullable().optional(),
  weightGrams: z.number().int().min(0).max(1e7).nullable().optional(),
  dimensions: z.string().max(80).nullable().optional(),
  tags: z.string().max(400).default(""),
  images: z.array(z.object({ assetId: z.string().regex(/^ast_[a-z0-9]+$/).optional(), stock: z.string().regex(/^[a-z0-9-]{1,48}$/).optional(), alt: z.string().max(300).default("") })
    .refine((i) => !!i.assetId !== !!i.stock, "Each image needs exactly one source.")
    .refine((i) => !isOwnerStock(i.stock), "That photo is only available in template previews.")).max(12).default([]),
  option1Name: z.string().trim().max(40).nullable().optional(),
  option2Name: z.string().trim().max(40).nullable().optional(),
  maxPerOrder: z.number().int().min(1).max(999).default(10),
  featured: z.boolean().default(false),
  collections: z.array(z.string().max(40)).max(20).default([]),
  variants: z.array(VariantIn).min(1).max(100),
  /** Currency the merchant entered the prices in. Rejected when it differs from the store currency. */
  currency: z.string().regex(/^[A-Z]{3}$/).optional(),
  /** Stable id for one edit session (one opened form). Retrying the same save applies its stock changes once. */
  editId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/).optional(),
  /** Variants the merchant deliberately removed in this form. Variants merely missing from an older form are kept. */
  removeVariantIds: z.array(z.string().max(40)).max(100).default([]),
});
type ProductInput = z.infer<typeof ProductIn>;

async function productOut(c: Ctx, projectId: string, productId?: string) {
  const where = productId ? "AND p.id = ?" : "";
  const binds = productId ? [projectId, productId] : [projectId];
  const [prods, vars, links] = await c.env.DB.batch([
    c.env.DB.prepare(`SELECT p.* FROM products p WHERE p.project_id = ? ${where} ORDER BY p.position, p.created_at DESC`).bind(...binds),
    c.env.DB.prepare(`SELECT * FROM product_variants WHERE project_id = ? ${productId ? "AND product_id = ?" : ""} ORDER BY position`).bind(...binds),
    c.env.DB.prepare(`SELECT pc.product_id, pc.collection_id FROM product_collections pc JOIN products p ON p.id = pc.product_id WHERE p.project_id = ?`).bind(projectId),
  ]);
  return (prods.results as any[]).map((p) => ({
    id: p.id, title: p.title, handle: p.handle, description: p.description, productType: p.product_type, status: p.status,
    priceMinor: p.price_cents, compareAtMinor: p.compare_at_cents, costMinor: p.cost_cents, currency: p.currency, sku: p.sku,
    weightGrams: p.weight_grams, dimensions: p.dimensions, tags: p.tags, images: stripOwnerPhotos(JSON.parse(p.images_json || "[]")),
    option1Name: p.option1_name, option2Name: p.option2_name, maxPerOrder: p.max_per_order, featured: !!p.featured,
    collections: (links.results as any[]).filter((l) => l.product_id === p.id).map((l) => l.collection_id),
    variants: (vars.results as any[]).filter((v) => v.product_id === p.id).map((v) => ({
      id: v.id, title: v.title, option1: v.option1, option2: v.option2, sku: v.sku, priceMinor: v.price_cents, stock: v.stock,
      trackInventory: !!v.track_inventory, allowBackorder: !!v.allow_backorder,
    })),
    createdAt: p.created_at, updatedAt: p.updated_at,
  }));
}

async function uniqueHandle(c: Ctx, projectId: string, base: string, exceptId?: string): Promise<string> {
  let h = slugify(base, 70);
  for (let i = 0; i < 8; i++) {
    const r = await c.env.DB.prepare("SELECT id FROM products WHERE project_id = ? AND handle = ?").bind(projectId, h).first<{ id: string }>();
    if (!r || r.id === exceptId) return h;
    h = `${slugify(base, 60)}-${i + 2}`;
  }
  return `${slugify(base, 50)}-${Date.now().toString(36)}`;
}

/** Stable ids for records created inside one edit, so replaying the same save finds them instead of duplicating. */
async function editScopedId(prefix: string, editId: string, key: string): Promise<string> {
  return `${prefix}_${(await sha256Hex(`${editId}|${key}`)).slice(0, 24)}`;
}

async function writeProduct(c: Ctx, p: ProjectRow, input: ProductInput, userId: string, existingId?: string, createId?: string): Promise<string> {
  const id = existingId ?? createId ?? newId("prd");
  const t = now();
  const currency = await storeCurrency(c, p);
  if (input.currency && input.currency !== currency) {
    throw new HttpError(409, `These prices were entered in ${input.currency}, but this store sells in ${currency}. Reload the page and enter the prices in ${currency}.`, "currency_mismatch");
  }
  const handle = await uniqueHandle(c, p.id, input.handle || input.title, existingId);
  // Validate image ownership (tenant isolation)
  const uploadIds = input.images.map((i) => i.assetId).filter((x): x is string => !!x);
  if (uploadIds.length) {
    const ids = uploadIds;
    const owned = await c.env.DB.prepare(`SELECT COUNT(*) AS n FROM site_assets WHERE project_id = ? AND deleted_at IS NULL AND id IN (${ids.map(() => "?").join(",")})`).bind(p.id, ...ids).first<{ n: number }>();
    if ((owned?.n ?? 0) !== new Set(ids).size) throw new HttpError(400, "One of the product images isn't in this project's media library.");
  }
  if (input.collections.length) {
    const owned = await c.env.DB.prepare(`SELECT COUNT(*) AS n FROM collections WHERE project_id = ? AND id IN (${input.collections.map(() => "?").join(",")})`).bind(p.id, ...input.collections).first<{ n: number }>();
    if ((owned?.n ?? 0) !== new Set(input.collections).size) throw new HttpError(400, "Unknown category selected.");
  }
  // Variant SKUs identify exactly one variant in the store (imports rely on it).
  const vskus = input.variants.map((v) => (v.sku || "").trim()).filter(Boolean);
  if (new Set(vskus.map((s) => s.toLowerCase())).size !== vskus.length) throw new HttpError(409, "Two variants share the same SKU. Give each variant its own SKU.", "duplicate_sku");
  if (vskus.length) {
    const clash = await c.env.DB.prepare(`SELECT sku FROM product_variants WHERE project_id = ? AND product_id != ? AND sku IN (${vskus.map(() => "?").join(",")}) LIMIT 1`).bind(p.id, id, ...vskus).first<{ sku: string }>();
    if (clash) throw new HttpError(409, `SKU “${clash.sku}” is already used by another product's variant.`, "duplicate_sku");
  }
  const combos = new Set<string>();
  for (const v of input.variants) {
    const k = `${v.option1 ?? ""}|${v.option2 ?? ""}`;
    if (combos.has(k)) throw new HttpError(400, "Two variants have the same options.");
    combos.add(k);
  }
  const stmts: D1PreparedStatement[] = [];
  if (existingId) {
    stmts.push(c.env.DB.prepare(`UPDATE products SET title=?, handle=?, description=?, product_type=?, status=?, price_cents=?, compare_at_cents=?, cost_cents=?, currency=?, sku=?, weight_grams=?, dimensions=?, tags=?, images_json=?, option1_name=?, option2_name=?, max_per_order=?, featured=?, updated_at=? WHERE id=? AND project_id=?`)
      .bind(input.title, handle, input.description, input.productType, input.status, input.priceMinor, input.compareAtMinor ?? null, input.costMinor ?? null, currency, input.sku || null, input.weightGrams ?? null, input.dimensions ?? null, input.tags, JSON.stringify(input.images), input.option1Name || null, input.option2Name || null, input.maxPerOrder, input.featured ? 1 : 0, t, id, p.id));
  } else {
    stmts.push(c.env.DB.prepare(`INSERT INTO products (id, project_id, title, handle, description, product_type, status, price_cents, compare_at_cents, cost_cents, currency, sku, weight_grams, dimensions, tags, images_json, option1_name, option2_name, max_per_order, featured, position, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(id, p.id, input.title, handle, input.description, input.productType, input.status, input.priceMinor, input.compareAtMinor ?? null, input.costMinor ?? null, currency, input.sku || null, input.weightGrams ?? null, input.dimensions ?? null, input.tags, JSON.stringify(input.images), input.option1Name || null, input.option2Name || null, input.maxPerOrder, input.featured ? 1 : 0, 0, t, t));
  }
  // Variants: update existing (recording stock deltas), insert new, delete removed.
  const existing = existingId ? ((await c.env.DB.prepare("SELECT id, stock FROM product_variants WHERE product_id = ?").bind(id).all<{ id: string; stock: number }>()).results) : [];
  const keep = new Set<string>();
  const createdIds = await Promise.all(input.variants.map((v) => (!v.id && input.editId ? editScopedId("var", input.editId, `${id}|${v.option1 ?? ""}|${v.option2 ?? ""}`) : Promise.resolve(null))));
  // Relative, once-per-edit stock change: applies (wanted - already applied by this edit). Movement and stock
  // change commit together; the oversell trigger still rejects a result below zero.
  const applyOnce = (variantId: string, wanted: number) => {
    const mid = newId("inv");
    stmts.push(c.env.DB.prepare(`INSERT INTO inventory_movements (id, project_id, variant_id, delta, reason, actor, created_at, op_key)
        SELECT ?, ?, ?, d, 'manual_adjust', ?, ?, ? FROM (SELECT ? - COALESCE((SELECT SUM(delta) FROM inventory_movements WHERE variant_id = ? AND op_key = ?), 0) AS d) WHERE d != 0`)
      .bind(mid, p.id, variantId, userId, t, input.editId, wanted, variantId, input.editId));
    stmts.push(c.env.DB.prepare("UPDATE product_variants SET stock = stock + (SELECT delta FROM inventory_movements WHERE id = ?) WHERE id = ? AND product_id = ? AND EXISTS (SELECT 1 FROM inventory_movements WHERE id = ?)")
      .bind(mid, variantId, id, mid));
  };
  // Absolute count applied once per opKey. A marker movement is written even when the count already matches,
  // so a retry after later sales can never reset stock.
  const setOnce = (variantId: string, target: number, opKey: string) => {
    const mid = newId("inv");
    stmts.push(c.env.DB.prepare(`INSERT INTO inventory_movements (id, project_id, variant_id, delta, reason, actor, created_at, op_key)
        SELECT ?, ?, v.id, ? - v.stock, 'import', ?, ?, ? FROM product_variants v WHERE v.id = ? AND v.product_id = ?
          AND NOT EXISTS (SELECT 1 FROM inventory_movements WHERE variant_id = ? AND op_key = ?)`)
      .bind(mid, p.id, target, userId, t, opKey, variantId, id, variantId, opKey));
    stmts.push(c.env.DB.prepare("UPDATE product_variants SET stock = stock + (SELECT delta FROM inventory_movements WHERE id = ?) WHERE id = ? AND product_id = ? AND EXISTS (SELECT 1 FROM inventory_movements WHERE id = ?)")
      .bind(mid, variantId, id, mid));
  };
  input.variants.forEach((v, i) => {
    const title = [v.option1, v.option2].filter(Boolean).join(" / ") || "Default";
    const replayedNew = !v.id && createdIds[i] ? existing.find((e) => e.id === createdIds[i]) : undefined;
    if (replayedNew) {
      // This variant was created by an earlier attempt of the same edit: keep its id (orders reference it) and
      // count its stock from creation, so a replay changes nothing and sales made since are kept.
      keep.add(replayedNew.id);
      stmts.push(c.env.DB.prepare("UPDATE product_variants SET title=?, option1=?, option2=?, sku=?, price_cents=?, track_inventory=?, allow_backorder=?, position=? WHERE id=? AND product_id=?")
        .bind(title, v.option1 || null, v.option2 || null, v.sku || null, v.priceMinor ?? null, v.trackInventory ? 1 : 0, v.allowBackorder ? 1 : 0, i, replayedNew.id, id));
      if (v.stockSet) setOnce(replayedNew.id, v.stockSet.target, v.stockSet.opKey);
      else applyOnce(replayedNew.id, Math.max(0, v.stock));
      return;
    }
    const ex = v.id ? existing.find((e) => e.id === v.id) : undefined;
    if (ex) {
      keep.add(ex.id);
      // Catalogue fields only; stock is changed separately so a stale form can never overwrite sales.
      stmts.push(c.env.DB.prepare("UPDATE product_variants SET title=?, option1=?, option2=?, sku=?, price_cents=?, track_inventory=?, allow_backorder=?, position=? WHERE id=? AND product_id=?")
        .bind(title, v.option1 || null, v.option2 || null, v.sku || null, v.priceMinor ?? null, v.trackInventory ? 1 : 0, v.allowBackorder ? 1 : 0, i, ex.id, id));
      if (v.stockSet) {
        setOnce(ex.id, v.stockSet.target, v.stockSet.opKey);
      } else if (v.stockBase !== undefined) {
        const wanted = v.stock - v.stockBase; // the merchant's change, relative so sales made meanwhile are kept
        if (wanted !== 0 && !input.editId) throw new HttpError(400, "Stock changes need an edit id so a retried save is applied only once. Reload the page and try again.", "edit_id_required");
        // A retried request applies nothing more; a changed value in the same edit applies only the difference.
        if (input.editId) applyOnce(ex.id, wanted);
      } else if (v.stock !== ex.stock) {
        // Legacy absolute set (API clients that don't send stockBase).
        stmts.push(c.env.DB.prepare("UPDATE product_variants SET stock = ? WHERE id = ? AND product_id = ?").bind(v.stock, ex.id, id));
        stmts.push(c.env.DB.prepare("INSERT INTO inventory_movements (id, project_id, variant_id, delta, reason, actor, created_at) VALUES (?, ?, ?, ?, 'manual_adjust', ?, ?)").bind(newId("inv"), p.id, ex.id, v.stock - ex.stock, userId, t));
      }
    } else {
      const vid = createdIds[i] ?? newId("var");
      stmts.push(c.env.DB.prepare("INSERT INTO product_variants (id, product_id, project_id, title, option1, option2, sku, price_cents, stock, track_inventory, allow_backorder, position) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
        .bind(vid, id, p.id, title, v.option1 || null, v.option2 || null, v.sku || null, v.priceMinor ?? null, Math.max(0, v.stock), v.trackInventory ? 1 : 0, v.allowBackorder ? 1 : 0, i));
      // The initial movement carries the edit id, so a replay of this edit sees the stock as already applied.
      if (v.stock > 0 || v.stockSet) stmts.push(c.env.DB.prepare("INSERT INTO inventory_movements (id, project_id, variant_id, delta, reason, actor, created_at, op_key) VALUES (?, ?, ?, ?, 'initial', ?, ?, ?)").bind(newId("inv"), p.id, vid, Math.max(0, v.stock), userId, t, v.stockSet?.opKey ?? input.editId ?? null));
    }
  });
  // Only variants the merchant explicitly removed are deleted. A variant missing from an older form (for example
  // one another editor just added) is kept, so a stale save can never delete someone else's work.
  const removable = new Set(input.removeVariantIds);
  for (const e of existing) if (!keep.has(e.id) && removable.has(e.id)) stmts.push(c.env.DB.prepare("DELETE FROM product_variants WHERE id = ? AND product_id = ?").bind(e.id, id));
  stmts.push(c.env.DB.prepare("DELETE FROM product_collections WHERE product_id = ?").bind(id));
  for (const col of new Set(input.collections)) stmts.push(c.env.DB.prepare("INSERT INTO product_collections (product_id, collection_id) VALUES (?, ?)").bind(id, col));
  try { await c.env.DB.batch(stmts); }
  catch (e) {
    const m = String((e as Error).message);
    if (m.includes("UNIQUE") && m.includes("product_variants")) throw new HttpError(409, "Another variant already uses that SKU.", "duplicate_sku");
    if (m.includes("UNIQUE") && m.includes("sku")) throw new HttpError(409, "Another product already uses that SKU.");
    if (m.includes("OUT_OF_STOCK")) throw new HttpError(400, "Stock can't go below zero.");
    throw e;
  }
  return id;
}

commerce.get("/projects/:id/products", async (c) => {
  const p = await storeProject(c, c.req.param("id"));
  return c.json({ products: await productOut(c, p.id), currency: await storeCurrency(c, p) });
});

commerce.post("/projects/:id/products", async (c) => {
  const u = requireUser(c);
  const p = await storeProject(c, c.req.param("id"));
  const parsed = ProductIn.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message || "Check the product details.");
  const count = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM products WHERE project_id = ?").bind(p.id).first<{ n: number }>();
  // With an edit id, a replayed create (for example after a lost response) updates the same product instead of
  // creating a duplicate, and its variants keep their ids and post-sale stock.
  const createId = parsed.data.editId ? await editScopedId("prd", parsed.data.editId, p.id) : undefined;
  const replay = createId ? await c.env.DB.prepare("SELECT id FROM products WHERE id = ? AND project_id = ?").bind(createId, p.id).first() : null;
  if (!replay && (count?.n ?? 0) >= 2000) throw new HttpError(400, "Product limit reached (2,000).");
  const id = replay ? await writeProduct(c, p, parsed.data, u.id, createId) : await writeProduct(c, p, parsed.data, u.id, undefined, createId);
  return c.json({ product: (await productOut(c, p.id, id))[0] });
});

commerce.put("/projects/:id/products/:pid", async (c) => {
  const u = requireUser(c);
  const p = await storeProject(c, c.req.param("id"));
  const ex = await c.env.DB.prepare("SELECT id FROM products WHERE id = ? AND project_id = ?").bind(c.req.param("pid"), p.id).first();
  if (!ex) throw new HttpError(404, "Product not found.");
  const parsed = ProductIn.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message || "Check the product details.");
  await writeProduct(c, p, parsed.data, u.id, c.req.param("pid"));
  return c.json({ product: (await productOut(c, p.id, c.req.param("pid")))[0] });
});

commerce.delete("/projects/:id/products/:pid", async (c) => {
  const p = await storeProject(c, c.req.param("id"));
  const used = await c.env.DB.prepare("SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.product_id = ? AND o.project_id = ? LIMIT 1").bind(c.req.param("pid"), p.id).first();
  if (used) {
    await c.env.DB.prepare("UPDATE products SET status = 'archived', updated_at = ? WHERE id = ? AND project_id = ?").bind(now(), c.req.param("pid"), p.id).run();
    return c.json({ ok: true, archived: true, message: "This product has orders, so it was archived instead of deleted." });
  }
  await c.env.DB.prepare("DELETE FROM products WHERE id = ? AND project_id = ?").bind(c.req.param("pid"), p.id).run();
  return c.json({ ok: true });
});

// ───── CSV import (client maps columns; server validates every row) ─────
const ImportRow = z.object({
  title: z.string().trim().min(1).max(140), sku: z.string().trim().max(60).optional().default(""),
  description: z.string().max(5000).optional().default(""), price: z.union([z.string(), z.number()]),
  compareAt: z.union([z.string(), z.number()]).optional(), stock: z.union([z.string(), z.number()]).optional(),
  category: z.string().trim().max(60).optional().default(""), tags: z.string().max(400).optional().default(""),
  option1Name: z.string().max(40).optional().default(""), option1: z.string().max(60).optional().default(""),
  option2Name: z.string().max(40).optional().default(""), option2: z.string().max(60).optional().default(""),
  status: z.string().optional().default("active"),
});

commerce.post("/projects/:id/products/import", async (c) => {
  const u = requireUser(c);
  const p = await storeProject(c, c.req.param("id"));
  const body = z.object({ rows: z.array(z.record(z.string(), z.unknown())).min(1).max(500), importId: z.string().regex(/^[A-Za-z0-9_-]{8,40}$/).optional() }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw new HttpError(400, "No rows to import (maximum 500 per file).");
  const currency = await storeCurrency(c, p);
  // One validated conversion for every price (see parsePrice): ambiguous values are rejected, never guessed.
  const toMinor = (v: unknown) => { const r = parsePrice(v as string, currency); return r.ok ? r.minor : null; };
  let created = 0, updated = 0;
  const errors: { row: number; error: string }[] = [];
  const cols = new Map<string, string>(((await c.env.DB.prepare("SELECT id, name FROM collections WHERE project_id = ?").bind(p.id).all<{ id: string; name: string }>()).results).map((r) => [r.name.toLowerCase(), r.id]));
  // One id per delivery of a file: the browser keeps it for retries of the same upload; a new upload gets a new one.
  const importId = body.data.importId ?? newId("imp").replace("_", "");
  for (let i = 0; i < body.data.rows.length; i++) {
    const rowEdit = `imp-${importId}-${i}`;
    const rowOp = `import:${importId}:${i}`;
    const r = ImportRow.safeParse(body.data.rows[i]);
    if (!r.success) { errors.push({ row: i + 2, error: r.error.issues[0]?.message || "Invalid row" }); continue; }
    const priced = parsePrice(r.data.price, currency);
    if (!priced.ok) { errors.push({ row: i + 2, error: `Price: ${priced.error}` }); continue; }
    const price = priced.minor;
    const rawCompare = (body.data.rows[i] as Record<string, unknown>).compareAt;
    const comparePriced = rawCompare !== undefined && rawCompare !== null && String(rawCompare).trim() !== "" ? parsePrice(rawCompare as string, currency) : null;
    if (comparePriced && !comparePriced.ok) { errors.push({ row: i + 2, error: `Compare-at price: ${comparePriced.error}` }); continue; }
    const stock = r.data.stock === undefined || r.data.stock === "" ? 0 : Math.trunc(Number(r.data.stock));
    if (!Number.isFinite(stock) || stock < 0) { errors.push({ row: i + 2, error: "Stock must be 0 or more" }); continue; }
    let colId: string | undefined;
    if (r.data.category) {
      colId = cols.get(r.data.category.toLowerCase());
      if (!colId) {
        colId = newId("col");
        await c.env.DB.prepare("INSERT INTO collections (id, project_id, name, handle, position) VALUES (?, ?, ?, ?, ?)").bind(colId, p.id, r.data.category, `${slugify(r.data.category, 50)}-${colId.slice(-4)}`, cols.size).run();
        cols.set(r.data.category.toLowerCase(), colId);
      }
    }
    // Match an existing product by variant SKU first, then by product SKU.
    const raw = body.data.rows[i] as Record<string, unknown>;
    const has = (k: string) => raw[k] !== undefined && raw[k] !== null && String(raw[k]).trim() !== "";
    // The SKU must identify exactly one target: one variant, or one product. Ambiguous rows change nothing.
    let existing: { id: string; variantId?: string } | null = null;
    if (r.data.sku) {
      const vms = (await c.env.DB.prepare("SELECT product_id, id FROM product_variants WHERE project_id = ? AND sku = ? LIMIT 3").bind(p.id, r.data.sku).all<{ product_id: string; id: string }>()).results;
      const pm = await c.env.DB.prepare("SELECT id FROM products WHERE project_id = ? AND sku = ?").bind(p.id, r.data.sku).first<{ id: string }>();
      if (vms.length > 1) { errors.push({ row: i + 2, error: `SKU “${r.data.sku}” is used by several variants. Give each variant its own SKU in the product editor, then import again.` }); continue; }
      if (vms.length === 1 && pm && pm.id !== vms[0].product_id) { errors.push({ row: i + 2, error: `SKU “${r.data.sku}” matches a variant of one product and a different product. Make the SKUs unique, then import again.` }); continue; }
      if (vms.length === 1) existing = { id: vms[0].product_id, variantId: vms[0].id };
      else if (pm) existing = { id: pm.id };
    }
    try {
      if (existing) {
        // Update: start from the current product so omitted columns and other variants are preserved.
        const cur = (await productOut(c, p.id, existing.id))[0];
        if (cur.currency !== currency) { errors.push({ row: i + 2, error: `This product is priced in ${cur.currency} but the store sells in ${currency}. Update it in the product editor first.` }); continue; }
        const variants: Array<Record<string, any>> = cur.variants.map((v: any) => ({ id: v.id, option1: v.option1, option2: v.option2, sku: v.sku, priceMinor: v.priceMinor, stock: v.stock, stockBase: v.stock, trackInventory: v.trackInventory, allowBackorder: v.allowBackorder }));
        let target = existing.variantId ? variants.find((v: any) => v.id === existing!.variantId) : undefined;
        // Scope: a variant SKU row prices that variant only; a product SKU row prices the product.
        if (existing.variantId) {
          if (has("compareAt")) { errors.push({ row: i + 2, error: "Compare-at prices apply to the whole product. Use the product's SKU for that column." }); continue; }
          target!.priceMinor = price;
        }
        if (!target && r.data.option1) {
          // Only an unambiguous option combination may select a variant; otherwise reject the row before changing anything.
          const twoOptions = !!cur.option2Name || variants.some((v: any) => v.option2);
          const matches = variants.filter((v: any) => (v.option1 ?? "") === r.data.option1 && (!has("option2") || (v.option2 ?? "") === r.data.option2));
          if (matches.length > 1) { errors.push({ row: i + 2, error: `Several variants match “${r.data.option1}”. Add the second option value (for example the colour) or use the variant's SKU.` }); continue; }
          target = matches[0];
          if (!target) {
            if (twoOptions && !has("option2")) { errors.push({ row: i + 2, error: `This product has two options. Add the second option value for “${r.data.option1}”, or use the variant's SKU.` }); continue; }
            target = { option1: r.data.option1, option2: has("option2") ? r.data.option2 : null, stock: 0, trackInventory: true, allowBackorder: false } as any;
            variants.push(target!);
          }
        }
        if (has("stock")) {
          if (!target && variants.length === 1) target = variants[0];
          if (!target) { errors.push({ row: i + 2, error: "This product has several variants. Add an option value (for example the size) to say which variant the stock is for." }); continue; }
          // The count is set once per import delivery: resending the same file keeps sales made since.
          target.stockSet = { target: stock, opKey: rowOp };
          if (!target.id) target.stock = stock;
        }
        const input: ProductInput = ProductIn.parse({
          title: r.data.title, handle: cur.handle,
          description: has("description") ? r.data.description : cur.description,
          productType: cur.productType,
          status: has("status") && ["active", "draft"].includes(r.data.status.toLowerCase()) ? r.data.status.toLowerCase() : cur.status,
          priceMinor: existing.variantId ? cur.priceMinor : price,
          compareAtMinor: comparePriced?.ok ? comparePriced.minor : cur.compareAtMinor,
          costMinor: cur.costMinor, sku: cur.sku, weightGrams: cur.weightGrams, dimensions: cur.dimensions,
          tags: has("tags") ? r.data.tags : cur.tags, images: cur.images,
          option1Name: has("option1Name") ? r.data.option1Name : cur.option1Name, option2Name: has("option2Name") ? r.data.option2Name : cur.option2Name,
          maxPerOrder: cur.maxPerOrder, featured: cur.featured,
          collections: colId ? [...new Set([...cur.collections, colId])] : cur.collections,
          variants, editId: rowEdit,
        });
        await writeProduct(c, p, input, u.id, existing.id); updated++;
      } else {
        const input: ProductInput = ProductIn.parse({
          title: r.data.title, description: r.data.description, priceMinor: price, compareAtMinor: comparePriced?.ok ? comparePriced.minor : null,
          sku: r.data.sku || null, tags: r.data.tags, status: ["active", "draft"].includes(r.data.status.toLowerCase()) ? r.data.status.toLowerCase() : "active",
          option1Name: r.data.option1Name || null, option2Name: r.data.option2Name || null, collections: colId ? [colId] : [],
          variants: [{ option1: r.data.option1 || null, option2: r.data.option2 || null, stock, trackInventory: true, stockSet: { target: stock, opKey: rowOp } }],
          editId: rowEdit,
        });
        // A resent delivery maps to the product this row created the first time instead of a duplicate.
        const createId = await editScopedId("prd", rowEdit, p.id);
        const again = await c.env.DB.prepare("SELECT id FROM products WHERE id = ? AND project_id = ?").bind(createId, p.id).first();
        if (again) await writeProduct(c, p, input, u.id, createId); else await writeProduct(c, p, input, u.id, undefined, createId);
        created++;
      }
    } catch (e) { errors.push({ row: i + 2, error: e instanceof HttpError ? e.message : "Could not save" }); }
  }
  await c.env.DB.prepare("INSERT INTO product_imports (id, project_id, user_id, rows_total, rows_created, rows_updated, rows_failed, errors_json, created_at) VALUES (?,?,?,?,?,?,?,?,?)")
    .bind(newId("imp"), p.id, u.id, body.data.rows.length, created, updated, errors.length, JSON.stringify(errors.slice(0, 200)), now()).run();
  return c.json({ created, updated, failed: errors.length, errors: errors.slice(0, 50) });
});

// ───── Collections ─────
commerce.get("/projects/:id/collections", async (c) => {
  const p = await storeProject(c, c.req.param("id"));
  const r = await c.env.DB.prepare("SELECT c.id, c.name, c.handle, c.description, c.position, (SELECT COUNT(*) FROM product_collections pc WHERE pc.collection_id = c.id) AS products FROM collections c WHERE c.project_id = ? ORDER BY c.position, c.name").bind(p.id).all();
  return c.json({ collections: r.results });
});

commerce.post("/projects/:id/collections", async (c) => {
  const p = await storeProject(c, c.req.param("id"));
  const body = z.object({ name: z.string().trim().min(1).max(60), description: z.string().max(400).default("") }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw new HttpError(400, "Enter a category name.");
  const id = newId("col");
  let handle = slugify(body.data.name, 50);
  if (await c.env.DB.prepare("SELECT 1 FROM collections WHERE project_id = ? AND handle = ?").bind(p.id, handle).first()) handle = `${handle}-${id.slice(-4)}`;
  const pos = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM collections WHERE project_id = ?").bind(p.id).first<{ n: number }>();
  await c.env.DB.prepare("INSERT INTO collections (id, project_id, name, handle, description, position) VALUES (?, ?, ?, ?, ?, ?)").bind(id, p.id, body.data.name, handle, body.data.description, pos?.n ?? 0).run();
  return c.json({ collection: { id, name: body.data.name, handle, description: body.data.description } });
});

commerce.patch("/projects/:id/collections/:cid", async (c) => {
  const p = await storeProject(c, c.req.param("id"));
  const body = z.object({ name: z.string().trim().min(1).max(60), description: z.string().max(400).default("") }).parse(await c.req.json());
  await c.env.DB.prepare("UPDATE collections SET name = ?, description = ? WHERE id = ? AND project_id = ?").bind(body.name, body.description, c.req.param("cid"), p.id).run();
  return c.json({ ok: true });
});

commerce.delete("/projects/:id/collections/:cid", async (c) => {
  const p = await storeProject(c, c.req.param("id"));
  await c.env.DB.prepare("DELETE FROM collections WHERE id = ? AND project_id = ?").bind(c.req.param("cid"), p.id).run();
  return c.json({ ok: true });
});

// ───── Orders (seller side) ─────
const TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "processing", "cancelled"],
  confirmed: ["processing", "ready_for_pickup", "shipped", "delivered", "cancelled"],
  processing: ["ready_for_pickup", "shipped", "delivered", "cancelled"],
  ready_for_pickup: ["delivered", "cancelled"],
  shipped: ["delivered"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

commerce.get("/projects/:id/orders", async (c) => {
  const p = await storeProject(c, c.req.param("id"));
  const status = c.req.query("status");
  const r = await c.env.DB.prepare(`SELECT id, number, status, payment_status, payment_method, fulfillment_label, customer_name, customer_phone, customer_email, currency, total_cents, is_demo, created_at FROM orders WHERE project_id = ? ${status ? "AND status = ?" : ""} ORDER BY created_at DESC LIMIT 200`).bind(...(status ? [p.id, status] : [p.id])).all();
  return c.json({ orders: r.results });
});

commerce.get("/projects/:id/orders.csv", async (c) => {
  const p = await storeProject(c, c.req.param("id"));
  const r = await c.env.DB.prepare("SELECT number, created_at, status, payment_status, payment_method, fulfillment_label, customer_name, customer_phone, customer_email, currency, subtotal_cents, shipping_cents, total_cents FROM orders WHERE project_id = ? ORDER BY created_at DESC LIMIT 5000").bind(p.id).all<any>();
  const head = ["number", "date", "status", "payment_status", "payment_method", "fulfillment", "customer", "phone", "email", "currency", "subtotal_minor", "shipping_minor", "total_minor"];
  const q = (v: unknown) => { const s = String(v ?? ""); return /[",\n]/.test(s) || /^[=+\-@]/.test(s) ? `"${s.replace(/^([=+\-@])/, "'$1").replace(/"/g, '""')}"` : s; };
  const lines = [head.join(","), ...r.results.map((o) => [o.number, new Date(o.created_at).toISOString(), o.status, o.payment_status, o.payment_method, o.fulfillment_label, o.customer_name, o.customer_phone, o.customer_email, o.currency, o.subtotal_cents, o.shipping_cents, o.total_cents].map(q).join(","))];
  return new Response(lines.join("\n"), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="orders-${p.slug}.csv"` } });
});

commerce.get("/projects/:id/orders/:oid", async (c) => {
  const p = await storeProject(c, c.req.param("id"));
  const [o, items, hist] = await c.env.DB.batch([
    c.env.DB.prepare("SELECT * FROM orders WHERE id = ? AND project_id = ?").bind(c.req.param("oid"), p.id),
    c.env.DB.prepare("SELECT title, variant_title, sku, unit_price_cents, quantity, line_total_cents FROM order_items WHERE order_id = ?").bind(c.req.param("oid")),
    c.env.DB.prepare("SELECT from_status, to_status, payment_status, note, actor, created_at FROM order_status_history WHERE order_id = ? ORDER BY created_at").bind(c.req.param("oid")),
  ]);
  const order = o.results[0] as any;
  if (!order) throw new HttpError(404, "Order not found.");
  delete order.access_token_hash;
  return c.json({ order: { ...order, address: order.address_json ? JSON.parse(order.address_json) : null }, items: items.results, history: hist.results });
});

commerce.patch("/projects/:id/orders/:oid", async (c) => {
  const u = requireUser(c);
  const p = await storeProject(c, c.req.param("id"));
  const body = z.object({ status: z.string().optional(), paymentStatus: z.enum(["unpaid", "paid", "refunded"]).optional(), note: z.string().max(500).optional() }).parse(await c.req.json().catch(() => ({})));
  const o = await c.env.DB.prepare("SELECT id, status, payment_status, is_demo FROM orders WHERE id = ? AND project_id = ?").bind(c.req.param("oid"), p.id).first<{ id: string; status: string; payment_status: string; is_demo: number }>();
  if (!o) throw new HttpError(404, "Order not found.");
  const to = body.status ?? o.status;
  if (to !== o.status && !TRANSITIONS[o.status]?.includes(to)) throw new HttpError(400, `An order can't move from “${o.status}” to “${to}”.`);
  const pay = body.paymentStatus ?? o.payment_status;
  const t = now();
  const stmts: D1PreparedStatement[] = [
    // Conditional on the current status, so two concurrent updates can't both restock.
    c.env.DB.prepare("UPDATE orders SET status = ?, payment_status = ?, updated_at = ? WHERE id = ? AND status = ? AND payment_status = ?").bind(to, pay, t, o.id, o.status, o.payment_status),
    // changes() refers to the UPDATE above: if it matched nothing (concurrent change), to_status becomes NULL,
    // violating NOT NULL and rolling back the whole batch, so stock can never be restocked twice.
    c.env.DB.prepare("INSERT INTO order_status_history (id, order_id, from_status, to_status, payment_status, note, actor, created_at) VALUES (?, ?, ?, CASE WHEN changes() = 1 THEN ? ELSE NULL END, ?, ?, ?, ?)").bind(newId("osh"), o.id, o.status, to, pay, body.note ?? null, u.id, t),
  ];
  if (to === "cancelled" && o.status !== "cancelled" && !o.is_demo) {
    // Give back exactly what this order took (its recorded debits, net of any earlier restock), once, whatever the
    // variant's tracking setting is now. Variants the order never debited get nothing back.
    const debited = await c.env.DB.prepare("SELECT DISTINCT variant_id FROM inventory_movements WHERE order_id = ? AND reason = 'order'").bind(o.id).all<{ variant_id: string }>();
    for (const { variant_id } of debited.results) {
      const mid = newId("inv");
      stmts.push(c.env.DB.prepare(`INSERT INTO inventory_movements (id, project_id, variant_id, delta, reason, order_id, actor, created_at)
          SELECT ?, ?, ?, d, 'order_cancel', ?, ?, ? FROM (SELECT -COALESCE(SUM(delta), 0) AS d FROM inventory_movements WHERE order_id = ? AND variant_id = ? AND reason IN ('order', 'order_cancel')) WHERE d > 0`)
        .bind(mid, p.id, variant_id, o.id, u.id, t, o.id, variant_id));
      stmts.push(c.env.DB.prepare("UPDATE product_variants SET stock = stock + (SELECT delta FROM inventory_movements WHERE id = ?) WHERE id = ? AND project_id = ? AND EXISTS (SELECT 1 FROM inventory_movements WHERE id = ?)")
        .bind(mid, variant_id, p.id, mid));
    }
  }
  try { await c.env.DB.batch(stmts); }
  catch (e) {
    if (/NOT NULL/i.test(String((e as Error).message))) throw new HttpError(409, "This order was just updated by someone else. Reload and try again.");
    throw e;
  }
  await audit(c.env, u.id, "order.updated", "order", o.id, { from: o.status, to, pay });
  return c.json({ ok: true });
});

commerce.get("/projects/:id/store/summary", async (c) => {
  const p = await storeProject(c, c.req.param("id"));
  const doc = draftDoc(p);
  const low = doc?.store?.lowStockThreshold ?? 3;
  const [counts, revenue, lowStock, products] = await c.env.DB.batch([
    c.env.DB.prepare("SELECT status, COUNT(*) AS n FROM orders WHERE project_id = ? AND is_demo = 0 GROUP BY status").bind(p.id),
    c.env.DB.prepare("SELECT currency, SUM(total_cents) AS total, COUNT(*) AS n FROM orders WHERE project_id = ? AND payment_status = 'paid' AND is_demo = 0 GROUP BY currency").bind(p.id),
    c.env.DB.prepare("SELECT v.id, p.title, v.title AS variant, v.stock FROM product_variants v JOIN products p ON p.id = v.product_id WHERE v.project_id = ? AND v.track_inventory = 1 AND v.stock <= ? AND p.status = 'active' ORDER BY v.stock LIMIT 20").bind(p.id, low),
    c.env.DB.prepare("SELECT COUNT(*) AS n FROM products WHERE project_id = ? AND status = 'active'").bind(p.id),
  ]);
  return c.json({ ordersByStatus: counts.results, paidRevenue: revenue.results, lowStock: lowStock.results, activeProducts: (products.results[0] as any)?.n ?? 0, note: "Revenue counts only orders you have marked as paid." });
});
