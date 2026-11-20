import type { AppEnv } from "./env";
import { now } from "./env";
import { newId } from "./lib/crypto";
import { PERSONAS, PUBLIC_DEMOS } from "../shared/demo";
import { generateSiteDoc } from "../shared/generate";
import { TEMPLATES } from "../shared/templates";
import { slugify } from "../shared/util";

const SEED_VERSION = "demo-v4";
let seededInIsolate = false;

/** Idempotently creates the three public demo sites (clearly labelled as demonstrations). */
export async function ensureDemos(env: AppEnv): Promise<void> {
  if (seededInIsolate) return;
  const done = await env.DB.prepare("SELECT value FROM system_settings WHERE key = 'demo_seed'").first<{ value: string }>();
  if (done?.value === SEED_VERSION) { seededInIsolate = true; return; }
  const lock = await env.DB.prepare("INSERT INTO system_settings (key, value, updated_at) VALUES ('demo_seed_lock', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at WHERE system_settings.updated_at < ?")
    .bind(SEED_VERSION, now(), now() - 60_000).run();
  if (!lock.meta.changes) return; // another request is seeding
  const t = now();
  const ownerId = "usr_demo_owner_system";
  await env.DB.prepare("INSERT OR IGNORE INTO users (id, email, name, role, status, email_verified, created_at, updated_at) VALUES (?, 'demo-owner@demo.invalid', 'Demo content (system)', 'customer', 'active', 0, ?, ?)").bind(ownerId, t, t).run();
  await env.DB.batch(TEMPLATES.map((tp) => env.DB.prepare("INSERT OR REPLACE INTO templates (id, site_type, name, tier, active) VALUES (?, ?, ?, ?, 1)").bind(tp.id, tp.type, tp.name, tp.tier)));

  // Replace demos from an older seed version (demo data only: owned by the system demo account).
  const old = await env.DB.prepare("SELECT id FROM projects WHERE owner_id = ? AND is_demo = 1").bind(ownerId).all<{ id: string }>();
  for (const o of old.results) {
    await env.DB.batch([
      env.DB.prepare("DELETE FROM entitlements WHERE project_id = ?").bind(o.id),
      env.DB.prepare("DELETE FROM inventory_movements WHERE project_id = ?").bind(o.id),
      env.DB.prepare("DELETE FROM consents WHERE project_id = ?").bind(o.id),
      env.DB.prepare("DELETE FROM projects WHERE id = ? AND owner_id = ? AND is_demo = 1").bind(o.id, ownerId),
    ]);
  }
  for (const demo of PUBLIC_DEMOS) {
    const exists = await env.DB.prepare("SELECT id FROM projects WHERE slug = ?").bind(demo.slug).first();
    if (exists) continue;
    const persona = PERSONAS[demo.templateId];
    const doc = generateSiteDoc(demo.type, demo.templateId, persona.answers);
    const pid = newId("prj");
    const vid = newId("ver");
    const json = JSON.stringify(doc);
    const stmts: D1PreparedStatement[] = [
      env.DB.prepare("INSERT INTO projects (id, owner_id, site_type, name, slug, template_id, status, draft_json, draft_revision, is_demo, content_rights_ack_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'published', ?, 1, 1, ?, ?, ?)").bind(pid, ownerId, demo.type, demo.name, demo.slug, demo.templateId, json, t, t, t),
      env.DB.prepare("INSERT INTO project_intake (project_id, step, data_json, completed_at, updated_at) VALUES (?, 99, ?, ?, ?)").bind(pid, JSON.stringify(persona.answers), t, t),
      env.DB.prepare("INSERT INTO site_versions (id, project_id, version, doc_json, created_by, created_at, note) VALUES (?, ?, 1, ?, 'system', ?, 'Demo seed')").bind(vid, pid, json, t),
      env.DB.prepare("INSERT INTO published_sites (project_id, slug, current_version_id, status, first_published_at, last_published_at) VALUES (?, ?, ?, 'live', ?, ?)").bind(pid, demo.slug, vid, t, t),
      env.DB.prepare("INSERT INTO entitlements (id, project_id, user_id, site_type, source, granted_by, reason, status, created_at) VALUES (?, ?, ?, ?, 'admin_demo', 'system', 'Public demonstration site', 'active', ?)").bind(newId("ent"), pid, ownerId, demo.type, t),
    ];
    if (demo.type === "ecommerce") {
      const currency = doc.store!.currency;
      const zero = ["UGX", "JPY", "RWF", "KRW"].includes(currency);
      const colIds = new Map<string, string>();
      (persona.collections ?? []).forEach((name, i) => {
        const cid = newId("col");
        colIds.set(name, cid);
        stmts.push(env.DB.prepare("INSERT INTO collections (id, project_id, name, handle, position) VALUES (?, ?, ?, ?, ?)").bind(cid, pid, name, slugify(name), i));
      });
      (persona.products ?? []).forEach((p, i) => {
        const prd = newId("prd");
        stmts.push(env.DB.prepare("INSERT INTO products (id, project_id, title, handle, description, product_type, status, price_cents, compare_at_cents, currency, tags, images_json, option1_name, option2_name, max_per_order, featured, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'physical', 'active', ?, ?, ?, ?, ?, ?, ?, 10, ?, ?, ?, ?)")
          .bind(prd, pid, p.title, slugify(p.title), p.description, zero ? p.price : Math.round(p.price * 100), p.compareAt ? (zero ? p.compareAt : Math.round(p.compareAt * 100)) : null, currency, p.tags ?? "", JSON.stringify(p.image ? [{ stock: p.image, alt: p.title }] : []), p.option1?.name ?? null, p.option2?.name ?? null, p.featured ? 1 : 0, i, t - i * 1000, t));
        stmts.push(env.DB.prepare("INSERT INTO product_collections (product_id, collection_id) VALUES (?, ?)").bind(prd, colIds.get(p.collection)!));
        const o1 = p.option1?.values ?? [null];
        const o2 = p.option2?.values ?? [null];
        let pos = 0;
        for (const a of o1) for (const b of o2) {
          stmts.push(env.DB.prepare("INSERT INTO product_variants (id, product_id, project_id, title, option1, option2, stock, track_inventory, allow_backorder, position) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, ?)")
            .bind(newId("var"), prd, pid, [a, b].filter(Boolean).join(" / ") || "Default", a, b, p.stock ?? 5, pos++));
        }
      });
    }
    for (let i = 0; i < stmts.length; i += 80) await env.DB.batch(stmts.slice(i, i + 80));
  }
  await env.DB.prepare("INSERT INTO system_settings (key, value, updated_at) VALUES ('demo_seed', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at").bind(SEED_VERSION, now()).run();
  seededInIsolate = true;
}
