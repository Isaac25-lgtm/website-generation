import { useEffect, useMemo, useState } from "react";
import { api, fmtDate, money, priceError, toMajor, toMinor, useApp } from "../lib";
import { Fields, type FieldSpec } from "../components/forms";
import { Modal, Spinner } from "../components/ui";
import { parseCsv } from "../../shared/util";

interface Variant { id?: string; option1?: string | null; option2?: string | null; sku?: string | null; priceMinor?: number | null; stock: number; trackInventory: boolean; allowBackorder: boolean }
interface Product { id?: string; currency?: string; title: string; description: string; status: string; productType: string; priceMinor: number; compareAtMinor?: number | null; sku?: string | null; tags: string; images: { assetId: string; alt: string }[]; option1Name?: string | null; option2Name?: string | null; maxPerOrder: number; featured: boolean; collections: string[]; variants: Variant[] }

export function ProductsManager({ projectId, currency: fallbackCurrency }: { projectId: string; currency: string }) {
  const { toast, ask } = useApp();
  // The server decides the store currency (a live store keeps its published currency).
  const [serverCurrency, setServerCurrency] = useState<string | null>(null);
  const currency = serverCurrency ?? fallbackCurrency;
  const [products, setProducts] = useState<Product[] | null>(null);
  const [cols, setCols] = useState<{ id: string; name: string; products: number }[]>([]);
  const [edit, setEdit] = useState<Product | null>(null);
  const [importing, setImporting] = useState(false);
  const [newCol, setNewCol] = useState("");
  const [q, setQ] = useState("");
  const load = async () => {
    const [p, c] = await Promise.all([api(`/api/projects/${projectId}/products`), api(`/api/projects/${projectId}/collections`)]);
    setProducts(p.products); setCols(c.collections); if (p.currency) setServerCurrency(p.currency);
  };
  useEffect(() => { load().catch((e) => toast(e.message, "err")); }, [projectId]);
  const shown = (products ?? []).filter((p) => !q || p.title.toLowerCase().includes(q.toLowerCase()) || (p.sku || "").toLowerCase().includes(q.toLowerCase()));
  const blank = (): Product => ({ title: "", description: "", status: "active", productType: "physical", priceMinor: 0, compareAtMinor: null, sku: "", tags: "", images: [], option1Name: "", option2Name: "", maxPerOrder: 10, featured: false, collections: [], variants: [{ stock: 0, trackInventory: true, allowBackorder: false }] });
  return (
    <div className="stack">
      <div className="card stack-sm">
        <div className="row between"><strong>Categories</strong><span className="muted small">Group products so shoppers can filter.</span></div>
        <div className="row">{cols.map((c) => <span key={c.id} className="badge">{c.name} · {c.products}<button className="icon-btn" style={{ width: 20, height: 20 }} aria-label={`Delete ${c.name}`} onClick={async () => { if ((await ask({ title: `Delete category “${c.name}”?`, message: "Products in it are kept; they just won’t be in this category any more.", confirmLabel: "Delete category", danger: true })) !== null) { await api(`/api/projects/${projectId}/collections/${c.id}`, { method: "DELETE" }); load(); } }}>✕</button></span>)}{!cols.length && <span className="muted small">No categories yet.</span>}</div>
        <form className="row" onSubmit={async (e) => { e.preventDefault(); if (!newCol.trim()) return; try { await api(`/api/projects/${projectId}/collections`, { body: { name: newCol } }); setNewCol(""); load(); } catch (er) { toast((er as Error).message, "err"); } }}>
          <input className="input" style={{ maxWidth: 280 }} placeholder="New category name" value={newCol} onChange={(e) => setNewCol(e.target.value)} aria-label="New category name" /><button className="btn btn-sm">Add category</button>
        </form>
      </div>
      <div className="row between">
        <input className="input" style={{ maxWidth: 280 }} placeholder="Search products or SKU" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
        <div className="row"><button className="btn" onClick={() => setImporting(true)}>Import CSV</button><button className="btn btn-primary" onClick={() => setEdit(blank())}>+ Add product</button></div>
      </div>
      {!products ? <Spinner /> : products.length === 0 ? (
        <div className="empty"><h3>No products yet</h3><p className="muted">Add your first product, or import a spreadsheet of products.</p><button className="btn btn-primary" onClick={() => setEdit(blank())}>Add product</button></div>
      ) : (
        <div className="table-wrap"><table className="table"><thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead><tbody>
          {shown.map((p) => {
            const stock = p.variants.reduce((a, v) => a + (v.trackInventory ? v.stock : 0), 0);
            const tracked = p.variants.some((v) => v.trackInventory);
            return (
              <tr key={p.id}>
                <td><div className="row" style={{ flexWrap: "nowrap" }}>{p.images[0] ? <img src={`/media/${p.images[0].assetId}`} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} /> : <div style={{ width: 44, height: 44, borderRadius: 8, background: "var(--soft)" }} />}<div><strong>{p.title}</strong><div className="tiny muted">{p.variants.length > 1 ? `${p.variants.length} variants` : p.sku || ""}{p.featured ? " · Featured" : ""}</div></div></div></td>
                <td>{money(p.priceMinor, p.currency || currency)}{p.compareAtMinor ? <div className="tiny muted" style={{ textDecoration: "line-through" }}>{money(p.compareAtMinor, p.currency || currency)}</div> : null}{p.currency && p.currency !== currency ? <div className="tiny" style={{ color: "var(--warn)" }}>Priced in {p.currency}. Edit and save to price it in {currency}.</div> : null}</td>
                <td>{tracked ? <span className={`badge ${stock === 0 ? "red" : stock <= 3 ? "amber" : "green"}`}>{stock === 0 ? "Sold out" : `${stock} in stock`}</span> : <span className="badge">Not tracked</span>}</td>
                <td><span className={`badge ${p.status === "active" ? "green" : ""}`}>{p.status}</span></td>
                <td style={{ textAlign: "right" }}><button className="btn btn-sm" onClick={() => setEdit(JSON.parse(JSON.stringify(p)))}>Edit</button></td>
              </tr>
            );
          })}
        </tbody></table></div>
      )}
      {edit && <ProductEditor projectId={projectId} currency={currency} product={edit} cols={cols} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />}
      {importing && <CsvImport projectId={projectId} onClose={() => setImporting(false)} onDone={() => { load(); }} />}
    </div>
  );
}

function ProductEditor({ projectId, currency, product, cols, onClose, onSaved }: { projectId: string; currency: string; product: Product; cols: { id: string; name: string }[]; onClose: () => void; onSaved: () => void }) {
  const { toast, ask } = useApp();
  const [p, setP] = useState<Product>(product);
  const [price, setPrice] = useState(product.priceMinor ? toMajor(product.priceMinor, currency) : "");
  const [compare, setCompare] = useState(product.compareAtMinor ? toMajor(product.compareAtMinor, currency) : "");
  const [opt1, setOpt1] = useState([...new Set(product.variants.map((v) => v.option1).filter(Boolean))].join(", "));
  const [opt2, setOpt2] = useState([...new Set(product.variants.map((v) => v.option2).filter(Boolean))].join(", "));
  const [busy, setBusy] = useState(false);
  // What the merchant typed in each variant's price override (validated on save, never reinterpreted while typing).
  const [variantPrices, setVariantPrices] = useState<string[]>(() => product.variants.map((v) => (v.priceMinor != null ? toMajor(v.priceMinor, currency) : "")));
  // One id per opened form: a retried save (for example after a lost response) changes stock only once.
  const [editId] = useState(() => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}${Math.random()}`).replace(/[^A-Za-z0-9]/g, "").slice(0, 40));

  const regenerate = (o1: string, o2: string) => {
    const a = o1.split(",").map((x) => x.trim()).filter(Boolean);
    const b = o2.split(",").map((x) => x.trim()).filter(Boolean);
    const combos = (a.length ? a : [null]).flatMap((x) => (b.length ? b : [null]).map((y) => ({ x, y })));
    setP((cur) => {
      const next = combos.map(({ x, y }) => cur.variants.find((v) => (v.option1 ?? null) === x && (v.option2 ?? null) === y) ?? { option1: x, option2: y, stock: 0, trackInventory: true, allowBackorder: false });
      setVariantPrices((prices) => next.map((v) => { const j = cur.variants.indexOf(v); return j >= 0 ? prices[j] ?? "" : ""; }));
      return { ...cur, variants: next };
    });
  };
  const imgSpec: FieldSpec[] = [{ k: "images", label: "Product photos", t: "images", max: 12, help: "First image is the main photo. Use your own photos or licensed images." }];
  const save = async () => {
    const problems = [
      price ? priceError(price, currency) && `Price: ${priceError(price, currency)}` : null,
      compare ? priceError(compare, currency) && `Compare-at price: ${priceError(compare, currency)}` : null,
      ...p.variants.map((_, i) => (variantPrices[i] ? priceError(variantPrices[i], currency) && `Variant price: ${priceError(variantPrices[i], currency)}` : null)),
    ].filter(Boolean);
    if (problems.length) { toast(String(problems[0]), "err"); return; }
    setBusy(true);
    // Only variants that were in this form when it opened and are gone now count as deliberate removals.
    const removeVariantIds = product.variants.filter((v) => v.id && !p.variants.some((x) => x.id === v.id)).map((v) => v.id!);
    const body = { ...p, currency, editId, removeVariantIds, priceMinor: price ? toMinor(price, currency) ?? 0 : 0, compareAtMinor: compare ? toMinor(compare, currency) : null, option1Name: p.option1Name || null, option2Name: p.option2Name || null, sku: p.sku || null,
      // stockBase = stock when this form opened, so the server applies only the merchant's change and keeps sales made meanwhile.
      variants: p.variants.map((v, i) => {
        const opened = v.id ? product.variants.find((x) => x.id === v.id) : undefined;
        return { ...v, option1: v.option1 || null, option2: v.option2 || null, sku: v.sku || null, stock: Number(v.stock) || 0, priceMinor: variantPrices[i] ? toMinor(variantPrices[i], currency) : null, ...(opened ? { stockBase: opened.stock } : {}) };
      }) };
    try {
      if (p.id) await api(`/api/projects/${projectId}/products/${p.id}`, { method: "PUT", body }); else await api(`/api/projects/${projectId}/products`, { body });
      toast("Product saved"); onSaved();
    } catch (e) { toast((e as Error).message, "err"); setBusy(false); }
  };
  return (
    <Modal title={p.id ? `Edit ${p.title}` : "Add product"} onClose={onClose} wide>
      <div className="grid-2" style={{ alignItems: "start", gap: "1.5rem" }}>
        <div className="stack">
          <label className="field"><span>Product name</span><input value={p.title} maxLength={140} onChange={(e) => setP({ ...p, title: e.target.value })} /></label>
          <label className="field"><span>Description</span><textarea rows={5} value={p.description} maxLength={5000} onChange={(e) => setP({ ...p, description: e.target.value })} /><span className="help">Describe only real facts about the product (materials, size, use).</span></label>
          <div className="grid-2" style={{ gap: ".75rem" }}>
            <label className="field"><span>Price ({currency})</span><input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} /></label>
            <label className="field"><span>Compare-at price (optional)</span><input inputMode="decimal" value={compare} onChange={(e) => setCompare(e.target.value)} /><span className="help">Only if it's a genuine former price.</span></label>
            <label className="field"><span>SKU (optional)</span><input value={p.sku ?? ""} maxLength={60} onChange={(e) => setP({ ...p, sku: e.target.value })} /></label>
            <label className="field"><span>Status</span><select value={p.status} onChange={(e) => setP({ ...p, status: e.target.value })}><option value="active">Active (visible)</option><option value="draft">Draft (hidden)</option><option value="archived">Archived</option></select></label>
            <label className="field"><span>Max per order</span><input type="number" min={1} max={999} value={p.maxPerOrder} onChange={(e) => setP({ ...p, maxPerOrder: Number(e.target.value) || 1 })} /></label>
            <label className="field"><span>Type</span><select value={p.productType} onChange={(e) => setP({ ...p, productType: e.target.value })}><option value="physical">Physical</option><option value="digital">Digital</option></select></label>
          </div>
          <label className="field"><span>Tags (comma separated)</span><input value={p.tags} maxLength={400} onChange={(e) => setP({ ...p, tags: e.target.value })} /></label>
          <label className="check"><input type="checkbox" checked={p.featured} onChange={(e) => setP({ ...p, featured: e.target.checked })} /> Feature on the home page</label>
          {cols.length > 0 && <fieldset style={{ border: 0, padding: 0 }}><legend className="label">Categories</legend><div className="row">{cols.map((c) => <label key={c.id} className="check"><input type="checkbox" checked={p.collections.includes(c.id)} onChange={(e) => setP({ ...p, collections: e.target.checked ? [...p.collections, c.id] : p.collections.filter((x) => x !== c.id) })} /> {c.name}</label>)}</div></fieldset>}
        </div>
        <div className="stack">
          <Fields specs={imgSpec} value={p} onChange={(v) => setP(v)} projectId={projectId} />
          <div className="card stack-sm" style={{ background: "var(--soft)" }}>
            <strong>Sizes, colours and stock</strong>
            <span className="tiny muted">Sell this product in different versions? Name the option (for example Size) and list the choices. We create one row per version so you can set its stock.</span>
            <div className="grid-2" style={{ gap: ".5rem" }}>
              <label className="field"><span>Option 1 name</span><input placeholder="Size" value={p.option1Name ?? ""} onChange={(e) => setP({ ...p, option1Name: e.target.value })} /></label>
              <label className="field"><span>Values (comma separated)</span><input placeholder="S, M, L" value={opt1} onChange={(e) => { setOpt1(e.target.value); regenerate(e.target.value, opt2); }} /></label>
              <label className="field"><span>Option 2 name</span><input placeholder="Colour" value={p.option2Name ?? ""} onChange={(e) => setP({ ...p, option2Name: e.target.value })} /></label>
              <label className="field"><span>Values</span><input placeholder="Black, White" value={opt2} onChange={(e) => { setOpt2(e.target.value); regenerate(opt1, e.target.value); }} /></label>
            </div>
            <div className="table-wrap"><table className="table"><thead><tr><th>Version</th><th>In stock</th><th>Different price</th><th title="Count down stock as orders come in">Count stock</th><th title="Keep taking orders when stock reaches 0">Sell when 0</th></tr></thead><tbody>
              {p.variants.map((v, i) => (
                <tr key={i}>
                  <td>{[v.option1, v.option2].filter(Boolean).join(" / ") || "Default"}</td>
                  <td><input className="input" style={{ width: 80, minHeight: 36 }} type="number" min={0} value={v.stock} aria-label="Stock" onChange={(e) => setP({ ...p, variants: p.variants.map((x, j) => (j === i ? { ...x, stock: Number(e.target.value) } : x)) })} /></td>
                  <td><input className="input" style={{ width: 100, minHeight: 36 }} inputMode="decimal" placeholder="—" aria-label="Different price for this version (optional)" value={variantPrices[i] ?? ""} onChange={(e) => setVariantPrices((cur) => { const next = [...cur]; next[i] = e.target.value; return next; })} /></td>
                  <td><input type="checkbox" checked={v.trackInventory} aria-label="Track inventory" onChange={(e) => setP({ ...p, variants: p.variants.map((x, j) => (j === i ? { ...x, trackInventory: e.target.checked } : x)) })} /></td>
                  <td><input type="checkbox" checked={v.allowBackorder} aria-label="Allow backorder" onChange={(e) => setP({ ...p, variants: p.variants.map((x, j) => (j === i ? { ...x, allowBackorder: e.target.checked } : x)) })} /></td>
                </tr>
              ))}
            </tbody></table></div>
            <span className="tiny muted">Leave “Different price” empty to use the main price. Stock goes down automatically with each order and back up if an order is cancelled. With “Sell when 0” off, nobody can buy more than you have.</span>
          </div>
        </div>
      </div>
      <div className="row between" style={{ marginTop: "1.5rem" }}>
        {p.id ? <button className="btn btn-danger" onClick={async () => { if ((await ask({ title: "Delete this product?", message: "If it has orders it is archived instead, so order history stays intact.", confirmLabel: "Delete product", danger: true })) === null) return; try { const r = await api(`/api/projects/${projectId}/products/${p.id}`, { method: "DELETE" }); toast(r.message || "Deleted"); onSaved(); } catch (e) { toast((e as Error).message, "err"); } }}>Delete</button> : <span />}
        <div className="row"><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy || !p.title.trim()} onClick={save}>{busy && <Spinner />} Save product</button></div>
      </div>
    </Modal>
  );
}

const IMPORT_FIELDS: [string, string, RegExp][] = [
  ["title", "Product name *", /^(title|name|product)/i], ["price", "Price *", /^price/i], ["sku", "SKU", /sku|code/i], ["description", "Description", /desc/i],
  ["compareAt", "Compare-at price", /compare|was|old/i], ["stock", "Stock quantity", /stock|qty|quantity|inventory/i], ["category", "Category", /categ|collection/i],
  ["tags", "Tags", /tag/i], ["option1Name", "Option name (e.g. Size)", /option.?name/i], ["option1", "Option value", /option.?value|^option.?1$|^size$|^variant/i], ["option2Name", "Second option name (e.g. Colour)", /option.?2.?name/i], ["option2", "Second option value", /option.?2.?value|^option.?2$|^colou?r$/i], ["status", "Status (active/draft)", /status/i],
];

function CsvImport({ projectId, onClose, onDone }: { projectId: string; onClose: () => void; onDone: () => void }) {
  const { toast } = useApp();
  const [rows, setRows] = useState<string[][] | null>(null);
  const [map, setMap] = useState<Record<string, number>>({});
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const headers = rows?.[0] ?? [];
  const data = useMemo(() => (rows ?? []).slice(1), [rows]);
  // One id per loaded file, reused if the upload is retried, so stock counts are applied once.
  const importId = useMemo(() => (rows ? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}` : ""), [rows]);
  return (
    <Modal title="Import products from CSV" onClose={onClose} wide>
      {!rows ? (
        <div className="stack">
          <p className="muted">Upload a CSV (comma-separated) file exported from Excel or Google Sheets. The first row must be column headings. Up to 500 products per file. Products with an existing SKU are updated.</p>
          <a className="btn btn-sm" style={{ justifySelf: "start" }} href={`data:text/csv;charset=utf-8,${encodeURIComponent("name,price,sku,description,stock,category,tags,option_name,option_value\nLinen shirt,25,LS-01-S,Breathable linen shirt,5,Shirts,linen,Size,S\nLinen shirt,25,LS-01-M,Breathable linen shirt,8,Shirts,linen,Size,M\n")}`} download="products-template.csv">Download example CSV</a>
          <input type="file" accept=".csv,text/csv" onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            if (f.size > 2_000_000) { toast("File is too large (max 2 MB).", "err"); return; }
            const parsed = parseCsv(await f.text());
            if (parsed.length < 2) { toast("The file has no data rows.", "err"); return; }
            const m: Record<string, number> = {};
            for (const [k, , re] of IMPORT_FIELDS) { const i = parsed[0].findIndex((h) => re.test(h.trim())); if (i >= 0 && !Object.values(m).includes(i)) m[k] = i; }
            setMap(m); setRows(parsed.slice(0, 501));
          }} aria-label="CSV file" />
        </div>
      ) : result ? (
        <div className="stack">
          <div className={`alert ${result.failed ? "warn" : "ok"}`}>{result.created} created · {result.updated} updated · {result.failed} failed</div>
          {result.errors?.length > 0 && <div className="table-wrap"><table className="table"><thead><tr><th>Row</th><th>Problem</th></tr></thead><tbody>{result.errors.map((e: any) => <tr key={e.row}><td>{e.row}</td><td>{e.error}</td></tr>)}</tbody></table></div>}
          <button className="btn btn-primary" style={{ justifySelf: "start" }} onClick={onClose}>Done</button>
        </div>
      ) : (
        <div className="stack">
          <p className="muted small">{data.length} rows found. Match your columns:</p>
          <div className="grid-3">{IMPORT_FIELDS.map(([k, label]) => (
            <label key={k} className="field"><span>{label}</span><select value={map[k] ?? ""} onChange={(e) => setMap({ ...map, [k]: e.target.value === "" ? (undefined as any) : Number(e.target.value) })}><option value="">— not in file —</option>{headers.map((h, i) => <option key={i} value={i}>{h}</option>)}</select></label>
          ))}</div>
          <div className="table-wrap"><table className="table"><thead><tr>{IMPORT_FIELDS.filter(([k]) => map[k] !== undefined).map(([k, l]) => <th key={k}>{l}</th>)}</tr></thead><tbody>
            {data.slice(0, 5).map((r, i) => <tr key={i}>{IMPORT_FIELDS.filter(([k]) => map[k] !== undefined).map(([k]) => <td key={k}>{r[map[k]]}</td>)}</tr>)}
          </tbody></table></div>
          <div className="row"><button className="btn" onClick={() => setRows(null)}>Choose another file</button>
            <button className="btn btn-primary" disabled={busy || map.title === undefined || map.price === undefined} onClick={async () => {
              setBusy(true);
              const payload = data.map((r) => Object.fromEntries(Object.entries(map).filter(([, i]) => i !== undefined).map(([k, i]) => [k, (r[i] ?? "").trim()])));
              try { const res = await api(`/api/projects/${projectId}/products/import`, { body: { rows: payload, importId } }); setResult(res); onDone(); } catch (e) { toast((e as Error).message, "err"); }
              setBusy(false);
            }}>{busy && <Spinner />} Import {data.length} rows</button></div>
        </div>
      )}
    </Modal>
  );
}

const NEXT: Record<string, string[]> = { pending: ["confirmed", "cancelled"], confirmed: ["processing", "ready_for_pickup", "shipped", "delivered", "cancelled"], processing: ["ready_for_pickup", "shipped", "delivered", "cancelled"], ready_for_pickup: ["delivered", "cancelled"], shipped: ["delivered"], delivered: ["refunded"], cancelled: [], refunded: [] };

export function OrdersManager({ projectId }: { projectId: string }) {
  const { toast } = useApp();
  const [orders, setOrders] = useState<any[] | null>(null);
  const [filter, setFilter] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const load = async () => { const r = await api(`/api/projects/${projectId}/orders${filter ? `?status=${filter}` : ""}`); setOrders(r.orders); setSummary(await api(`/api/projects/${projectId}/store/summary`)); };
  useEffect(() => { load().catch((e) => toast(e.message, "err")); }, [projectId, filter]);
  return (
    <div className="stack">
      {summary && (
        <div className="grid-3">
          <div className="card"><span className="muted small">Paid revenue (marked paid by you)</span><div style={{ font: "700 1.6rem var(--font-h)" }}>{summary.paidRevenue.length ? summary.paidRevenue.map((r: any) => money(r.total, r.currency)).join(" + ") : "—"}</div><span className="tiny muted">Based on real orders only.</span></div>
          <div className="card"><span className="muted small">Orders by status</span><div className="row" style={{ marginTop: ".4rem" }}>{summary.ordersByStatus.length ? summary.ordersByStatus.map((s: any) => <span key={s.status} className="badge">{s.status.replace(/_/g, " ")}: {s.n}</span>) : <span className="muted small">No orders yet</span>}</div></div>
          <div className="card"><span className="muted small">Low stock</span><div className="stack-sm" style={{ marginTop: ".4rem" }}>{summary.lowStock.length ? summary.lowStock.slice(0, 4).map((l: any) => <span key={l.id} className="small">{l.title}{l.variant !== "Default" ? ` (${l.variant})` : ""}: <b>{l.stock}</b></span>) : <span className="muted small">All good</span>}</div></div>
        </div>
      )}
      <div className="row between">
        <select className="input" style={{ maxWidth: 220 }} value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter orders"><option value="">All orders</option>{Object.keys(NEXT).map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}</select>
        <a className="btn btn-sm" href={`/api/projects/${projectId}/orders.csv`}>Export CSV</a>
      </div>
      {!orders ? <Spinner /> : orders.length === 0 ? <div className="empty"><h3>No orders yet</h3><p className="muted">Orders from your published store appear here.</p></div> : (
        <div className="table-wrap"><table className="table"><thead><tr><th>#</th><th>Date</th><th>Customer</th><th>Total</th><th>Status</th><th>Payment</th><th></th></tr></thead><tbody>
          {orders.map((o) => <tr key={o.id}><td>{o.number}{o.is_demo ? <span className="badge amber" style={{ marginLeft: 6 }}>demo</span> : null}</td><td className="small">{fmtDate(o.created_at)}</td><td>{o.customer_name}<div className="tiny muted">{o.customer_phone}</div></td><td>{money(o.total_cents, o.currency)}</td><td><span className="badge blue">{o.status.replace(/_/g, " ")}</span></td><td><span className={`badge ${o.payment_status === "paid" ? "green" : "amber"}`}>{o.payment_status}</span></td><td><button className="btn btn-sm" onClick={() => setOpen(o.id)}>Open</button></td></tr>)}
        </tbody></table></div>
      )}
      {open && <OrderDetail projectId={projectId} id={open} onClose={() => setOpen(null)} onChanged={load} />}
    </div>
  );
}

function OrderDetail({ projectId, id, onClose, onChanged }: { projectId: string; id: string; onClose: () => void; onChanged: () => void }) {
  const { toast } = useApp();
  const [d, setD] = useState<any>(null);
  const [note, setNote] = useState("");
  const load = () => api(`/api/projects/${projectId}/orders/${id}`).then(setD).catch((e) => toast(e.message, "err"));
  useEffect(() => { load(); }, [id]);
  const update = async (body: any) => { try { await api(`/api/projects/${projectId}/orders/${id}`, { method: "PATCH", body: { ...body, note: note || undefined } }); setNote(""); toast("Order updated"); load(); onChanged(); } catch (e) { toast((e as Error).message, "err"); } };
  if (!d) return <Modal title="Order" onClose={onClose}><Spinner /></Modal>;
  const o = d.order;
  return (
    <Modal title={`Order #${o.number}`} onClose={onClose}>
      <div className="stack">
        {o.is_demo ? <div className="alert warn small">Demo order placed on the public demo store. No payment or delivery is involved.</div> : null}
        <div className="grid-2">
          <div><strong>Customer</strong><div className="small">{o.customer_name}<br />{o.customer_phone}<br />{o.customer_email}</div></div>
          <div><strong>{o.fulfillment_label}</strong><div className="small">{o.address ? [o.address.line1, o.address.city, o.address.region, o.address.country].filter(Boolean).join(", ") : "Pickup / no address"}{o.address?.notes ? <><br /><i>{o.address.notes}</i></> : null}</div></div>
        </div>
        <div className="table-wrap"><table className="table"><tbody>{d.items.map((i: any, k: number) => <tr key={k}><td>{i.title}{i.variant_title ? ` · ${i.variant_title}` : ""} × {i.quantity}</td><td style={{ textAlign: "right" }}>{money(i.line_total_cents, o.currency)}</td></tr>)}
          <tr><td>Delivery</td><td style={{ textAlign: "right" }}>{money(o.shipping_cents, o.currency)}</td></tr><tr><td><b>Total</b></td><td style={{ textAlign: "right" }}><b>{money(o.total_cents, o.currency)}</b></td></tr></tbody></table></div>
        <div className="row"><span>Payment method: <b>{o.payment_method.replace(/_/g, " ")}</b></span>{o.notes && <span className="small muted">Note: {o.notes}</span>}</div>
        <div className="card stack-sm" style={{ background: "var(--soft)" }}>
          <div className="row"><span>Status: <span className="badge blue">{o.status.replace(/_/g, " ")}</span></span><span>Payment: <span className={`badge ${o.payment_status === "paid" ? "green" : "amber"}`}>{o.payment_status}</span></span></div>
          <input className="input" placeholder="Optional note for the history" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Status note" />
          <div className="row">{NEXT[o.status].map((s) => <button key={s} className={`btn btn-sm ${s === "cancelled" ? "btn-danger" : ""}`} onClick={() => update({ status: s })}>Mark {s.replace(/_/g, " ")}</button>)}
            {o.payment_status !== "paid" && <button className="btn btn-sm btn-primary" onClick={() => update({ paymentStatus: "paid" })}>Mark payment received</button>}</div>
          <span className="tiny muted">Only mark payment received after you have actually received the money.</span>
        </div>
        <div><strong className="small">History</strong><ul className="small muted">{d.history.map((h: any, k: number) => <li key={k}>{fmtDate(h.created_at)}: {h.from_status ? `${h.from_status} → ` : ""}{h.to_status} ({h.payment_status}){h.note ? ` · ${h.note}` : ""}</li>)}</ul></div>
      </div>
    </Modal>
  );
}
