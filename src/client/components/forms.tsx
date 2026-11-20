import { useEffect, useRef, useState } from "react";
import { api, compressImage, useApp } from "../lib";
import { Icon, Modal, Spinner } from "./ui";

export type FieldSpec =
  | { k: string; label: string; t: "text" | "textarea" | "email" | "tel" | "url" | "number"; help?: string; ph?: string; max?: number; rows?: number }
  | { k: string; label: string; t: "select"; options: [string, string][]; help?: string }
  | { k: string; label: string; t: "toggle"; help?: string }
  | { k: string; label: string; t: "color"; help?: string }
  | { k: string; label: string; t: "image"; help?: string }
  | { k: string; label: string; t: "images"; help?: string; max?: number }
  | { k: string; label: string; t: "doc"; help?: string }
  | { k: string; label: string; t: "link"; help?: string }
  | { k: string; label: string; t: "strings"; help?: string; ph?: string }
  | { k: string; label: string; t: "list"; item: string; fields: FieldSpec[]; help?: string; max?: number };

export function getPath(obj: any, path: string): any {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
export function setPath(obj: any, path: string, value: any): any {
  const keys = path.split(".");
  const out = Array.isArray(obj) ? [...obj] : { ...(obj ?? {}) };
  let cur: any = out;
  keys.forEach((k, i) => {
    if (i === keys.length - 1) cur[k] = value;
    else { cur[k] = Array.isArray(cur[k]) ? [...cur[k]] : { ...(cur[k] ?? {}) }; cur = cur[k]; }
  });
  return out;
}

export interface Asset { id: string; kind: string; mime: string; url: string; alt: string; name: string; bytes: number; license?: string | null; attribution?: string | null; source?: string }

export function Fields({ specs, value, onChange, projectId }: { specs: FieldSpec[]; value: any; onChange: (v: any) => void; projectId: string }) {
  return (
    <div className="stack">
      {specs.map((s) => <FieldInput key={s.k} spec={s} value={getPath(value, s.k)} onChange={(v) => onChange(setPath(value, s.k, v))} projectId={projectId} />)}
    </div>
  );
}

function FieldInput({ spec, value, onChange, projectId }: { spec: FieldSpec; value: any; onChange: (v: any) => void; projectId: string }) {
  const id = `f-${spec.k.replace(/\W/g, "-")}-${Math.random().toString(36).slice(2, 6)}`;
  switch (spec.t) {
    case "text": case "email": case "tel": case "url": case "number":
      return <label className="field" htmlFor={id}><span>{spec.label}</span><input id={id} type={spec.t === "number" ? "number" : spec.t} value={value ?? ""} placeholder={spec.ph} maxLength={spec.max ?? 300} onChange={(e) => onChange(spec.t === "number" ? (e.target.value === "" ? undefined : Number(e.target.value)) : e.target.value)} />{spec.help && <span className="help">{spec.help}</span>}</label>;
    case "textarea":
      return <label className="field" htmlFor={id}><span>{spec.label}</span><textarea id={id} value={value ?? ""} placeholder={spec.ph} maxLength={spec.max ?? 4000} rows={spec.rows ?? 5} onChange={(e) => onChange(e.target.value)} />{spec.help && <span className="help">{spec.help}</span>}</label>;
    case "select":
      return <label className="field" htmlFor={id}><span>{spec.label}</span><select id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value || undefined)}>{spec.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>{spec.help && <span className="help">{spec.help}</span>}</label>;
    case "toggle":
      return <label className="check"><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /> <span><b style={{ fontWeight: 600 }}>{spec.label}</b>{spec.help && <><br /><span className="muted small">{spec.help}</span></>}</span></label>;
    case "color":
      return <div className="field"><span>{spec.label}</span><div className="color-input"><input type="color" aria-label={spec.label} value={/^#[0-9a-f]{6}$/i.test(value || "") ? value : "#1a5cff"} onChange={(e) => onChange(e.target.value)} /><input type="text" aria-label={`${spec.label} hex`} value={value ?? ""} maxLength={7} placeholder="#rrggbb" onChange={(e) => onChange(e.target.value || undefined)} /></div>{spec.help && <span className="help">{spec.help}</span>}</div>;
    case "link":
      return <div className="field"><span>{spec.label}</span><div className="grid-2" style={{ gap: ".5rem" }}><input aria-label={`${spec.label} text`} placeholder="Button text" value={value?.label ?? ""} maxLength={60} onChange={(e) => onChange({ ...(value ?? { href: "" }), label: e.target.value })} /><input aria-label={`${spec.label} link`} placeholder="/contact or https://…" value={value?.href ?? ""} maxLength={600} onChange={(e) => onChange({ ...(value ?? { label: "" }), href: e.target.value })} /></div><span className="help">{spec.help ?? "Use /page-name for your own pages, or a full https:// link."}</span></div>;
    case "strings":
      return <label className="field" htmlFor={id}><span>{spec.label}</span><textarea id={id} rows={4} placeholder={spec.ph} value={(value ?? []).join("\n")} onChange={(e) => onChange(e.target.value.split("\n").map((x) => x.trimStart()).slice(0, 30))} /><span className="help">{spec.help ?? "One per line."}</span></label>;
    case "image":
      return <ImageField label={spec.label} help={spec.help} value={value} onChange={onChange} projectId={projectId} />;
    case "images":
      return <ImagesField label={spec.label} help={spec.help} value={value ?? []} onChange={onChange} projectId={projectId} max={spec.max ?? 24} />;
    case "doc":
      return <DocField label={spec.label} help={spec.help} value={value} onChange={onChange} projectId={projectId} />;
    case "list":
      return <ListField spec={spec} value={value ?? []} onChange={onChange} projectId={projectId} />;
  }
}

function ListField({ spec, value, onChange, projectId }: { spec: Extract<FieldSpec, { t: "list" }>; value: any[]; onChange: (v: any[]) => void; projectId: string }) {
  const move = (i: number, d: number) => { const a = [...value]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; onChange(a); };
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="stack-sm">
      <legend className="label" style={{ marginBottom: ".4rem" }}>{spec.label}</legend>
      {spec.help && <span className="help muted small">{spec.help}</span>}
      {value.map((item, i) => (
        <div className="list-item" key={i}>
          <div className="list-item-head"><strong className="small">{spec.item} {i + 1}</strong>
            <div className="row" style={{ gap: 2 }}>
              <button type="button" className="icon-btn" aria-label="Move up" onClick={() => move(i, -1)}>{Icon.up}</button>
              <button type="button" className="icon-btn" aria-label="Move down" onClick={() => move(i, 1)}>{Icon.down}</button>
              <button type="button" className="icon-btn" aria-label={`Remove ${spec.item}`} onClick={() => onChange(value.filter((_, j) => j !== i))}>{Icon.trash}</button>
            </div>
          </div>
          <Fields specs={spec.fields} value={item} onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))} projectId={projectId} />
        </div>
      ))}
      {value.length < (spec.max ?? 30) && <button type="button" className="btn btn-sm" style={{ justifySelf: "start" }} onClick={() => onChange([...value, {}])}>+ Add {spec.item.toLowerCase()}</button>}
    </fieldset>
  );
}

function ImageField({ label, help, value, onChange, projectId }: { label: string; help?: string; value: any; onChange: (v: any) => void; projectId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="field">
      <span>{label}</span>
      <div className="row">
        {value?.assetId ? <img src={`/media/${value.assetId}`} alt={value.alt || ""} style={{ width: 84, height: 64, objectFit: "cover", borderRadius: 10, border: "1px solid var(--line)" }} /> : <div className="dropzone" style={{ width: 84, height: 64, padding: 0, display: "grid", placeItems: "center" }} aria-hidden="true">＋</div>}
        <button type="button" className="btn btn-sm" onClick={() => setOpen(true)}>{value?.assetId ? "Change" : "Choose image"}</button>
        {value?.assetId && <button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange(undefined)}>Remove</button>}
      </div>
      {value?.assetId && <input aria-label={`${label} description (alt text)`} placeholder="Describe the image for screen readers" value={value.alt ?? ""} maxLength={300} onChange={(e) => onChange({ ...value, alt: e.target.value })} />}
      {help && <span className="help">{help}</span>}
      {open && <MediaLibrary projectId={projectId} onClose={() => setOpen(false)} onPick={(a) => { onChange({ assetId: a[0].id, alt: a[0].alt || "" }); setOpen(false); }} />}
    </div>
  );
}

function ImagesField({ label, help, value, onChange, projectId, max }: { label: string; help?: string; value: any[]; onChange: (v: any[]) => void; projectId: string; max: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="field">
      <span>{label}</span>
      <div className="img-grid">
        {value.filter((v) => v?.assetId).map((v, i) => (
          <div key={v.assetId + i} className="img-tile"><img src={`/media/${v.assetId}`} alt={v.alt || ""} /><button type="button" className="x" aria-label="Remove image" onClick={() => onChange(value.filter((_, j) => j !== i))}>✕</button></div>
        ))}
        {value.length < max && <button type="button" className="img-tile dropzone" onClick={() => setOpen(true)} style={{ display: "grid", placeItems: "center" }} aria-label={`Add images to ${label}`}>＋</button>}
      </div>
      {help && <span className="help">{help}</span>}
      {open && <MediaLibrary projectId={projectId} multi onClose={() => setOpen(false)} onPick={(a) => { onChange([...value, ...a.map((x) => ({ assetId: x.id, alt: x.alt || "", caption: "" }))].slice(0, max)); setOpen(false); }} />}
    </div>
  );
}

function DocField({ label, help, value, onChange, projectId }: { label: string; help?: string; value: string | undefined; onChange: (v: string | undefined) => void; projectId: string }) {
  const [busy, setBusy] = useState(false);
  const { toast } = useApp();
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="field"><span>{label}</span>
      <div className="row">
        {value ? <a className="btn btn-sm" href={`/media/${value}`} target="_blank" rel="noreferrer">View current file</a> : <span className="muted small">No file yet</span>}
        <button type="button" className="btn btn-sm" onClick={() => input.current?.click()} disabled={busy}>{busy ? <Spinner /> : null}{value ? "Replace PDF" : "Upload PDF"}</button>
        {value && <button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange(undefined)}>Remove</button>}
        <input ref={input} type="file" accept="application/pdf" hidden onChange={async (e) => {
          const f = e.target.files?.[0]; if (!f) return; setBusy(true);
          try { const fd = new FormData(); fd.append("file", f); const r = await api(`/api/projects/${projectId}/assets`, { form: fd }); onChange(r.asset.id); toast("Document uploaded"); }
          catch (er) { toast((er as Error).message, "err"); }
          setBusy(false); e.target.value = "";
        }} />
      </div>
      {help && <span className="help">{help}</span>}
    </div>
  );
}

export function MediaLibrary({ projectId, onClose, onPick, multi }: { projectId: string; onClose: () => void; onPick?: (a: Asset[]) => void; multi?: boolean }) {
  const { toast } = useApp();
  const [tab, setTab] = useState<"mine" | "licensed">("mine");
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [sel, setSel] = useState<string[]>([]);
  const [uploading, setUploading] = useState(0);
  const [over, setOver] = useState(false);
  const [meta, setMeta] = useState<{ usageBytes: number; quotaBytes: number; storage: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const load = async () => { try { const r = await api(`/api/projects/${projectId}/assets`); setAssets(r.assets.filter((a: Asset) => a.kind === "image")); setMeta(r); } catch (e) { toast((e as Error).message, "err"); } };
  useEffect(() => { load(); }, []);
  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files).slice(0, 20);
    setUploading(list.length);
    for (const f of list) {
      try {
        const blob = await compressImage(f);
        const fd = new FormData(); fd.append("file", blob, f.name); fd.append("alt", "");
        await api(`/api/projects/${projectId}/assets`, { form: fd });
      } catch (e) { toast(`${f.name}: ${(e as Error).message}`, "err"); }
      setUploading((n) => n - 1);
    }
    await load();
  };
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : multi ? [...s, id] : [id]));
  return (
    <Modal title="Media library" onClose={onClose} wide>
      <div className="tabs" role="tablist"><button role="tab" aria-selected={tab === "mine"} onClick={() => setTab("mine")}>Your uploads</button><button role="tab" aria-selected={tab === "licensed"} onClick={() => setTab("licensed")}>Find licensed photos</button></div>
      {tab === "mine" ? (
        <div className="stack">
          <div className={`dropzone ${over ? "over" : ""}`} onClick={() => fileRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files); }} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileRef.current?.click(); }}>
            {uploading ? <><Spinner /> Uploading {uploading}…</> : <><strong>Drop photos here or click to upload</strong><div className="small">JPG, PNG, WebP or GIF up to 8 MB. Large photos are resized automatically.</div></>}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={(e) => e.target.files && upload(e.target.files)} />
          </div>
          <p className="tiny muted" style={{ margin: 0 }}>Only upload images you own or have permission to use.{meta ? ` Storage used: ${(meta.usageBytes / 1048576).toFixed(1)} MB of ${(meta.quotaBytes / 1048576).toFixed(0)} MB.` : ""}</p>
          {!assets ? <Spinner /> : assets.length === 0 ? <p className="muted">No images yet.</p> : (
            <div className="img-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}>
              {assets.map((a) => (
                <button type="button" key={a.id} className="img-tile" aria-pressed={sel.includes(a.id)} onClick={() => toggle(a.id)} title={a.attribution || a.name}>
                  <img src={a.url} alt={a.alt || a.name} loading="lazy" />
                  {a.license && <span className="badge" style={{ position: "absolute", bottom: 4, left: 4, fontSize: ".62rem" }}>{a.license}</span>}
                </button>
              ))}
            </div>
          )}
          {sel.length === 1 && assets && (() => { const a = assets.find((x) => x.id === sel[0])!; return a ? (
            <div className="row" style={{ alignItems: "flex-end" }}>
              <label className="field" style={{ flex: 1 }}><span>Description (alt text) for the selected image</span><input defaultValue={a.alt} maxLength={300} onBlur={async (e) => { if (e.target.value !== a.alt) { await api(`/api/assets/${a.id}`, { method: "PATCH", body: { alt: e.target.value } }); a.alt = e.target.value; toast("Description saved"); } }} /></label>
              <button className="btn btn-danger btn-sm" onClick={async () => { try { await api(`/api/assets/${a.id}`, { method: "DELETE" }); setSel([]); load(); } catch (e) { toast((e as Error).message, "err"); } }}>Delete file</button>
            </div>) : null; })()}
        </div>
      ) : <LicensedSearch projectId={projectId} onImported={() => { setTab("mine"); load(); }} />}
      {onPick && (
        <div className="row between" style={{ marginTop: "1.25rem", borderTop: "1px solid var(--line)", paddingTop: "1rem" }}>
          <span className="muted small">{sel.length} selected</span>
          <button className="btn btn-primary" disabled={!sel.length} onClick={() => onPick(sel.map((id) => assets!.find((a) => a.id === id)!).filter(Boolean))}>Use {multi ? "selected images" : "this image"}</button>
        </div>
      )}
    </Modal>
  );
}

function LicensedSearch({ projectId, onImported }: { projectId: string; onImported: () => void }) {
  const { toast } = useApp();
  const [q, setQ] = useState("");
  const [res, setRes] = useState<any[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [pick, setPick] = useState<any | null>(null);
  const [confirm, setConfirm] = useState(false);
  const search = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); try { const r = await api(`/api/images/search?q=${encodeURIComponent(q)}`); setRes(r.results); } catch (er) { toast((er as Error).message, "err"); } setBusy(false); };
  return (
    <div className="stack">
      <div className="alert info small">Photos come from <strong>Openverse</strong>, a library of openly licensed images that allow commercial use. Licence and credit details are saved with each image, and the required credit appears on your site automatically. Always check that an image suits your use. Don't use other businesses' product photos.</div>
      <form className="row" onSubmit={search}><input className="input" style={{ flex: 1 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. coffee beans, safari, office desk" aria-label="Search licensed photos" /><button className="btn btn-primary" disabled={busy || q.length < 2}>{busy ? <Spinner /> : "Search"}</button></form>
      {res && res.length === 0 && <p className="muted">No results.</p>}
      {res && <div className="img-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>{res.map((r) => <button type="button" key={r.id} className="img-tile" aria-pressed={pick?.id === r.id} onClick={() => { setPick(r); setConfirm(false); }} title={r.title}><img src={r.thumbnail} alt={r.title} loading="lazy" referrerPolicy="no-referrer" /></button>)}</div>}
      {pick && (
        <div className="card stack-sm">
          <strong>{pick.title || "Untitled"}</strong>
          <span className="small muted">By {pick.creator} · {pick.license} · <a href={pick.sourceUrl} target="_blank" rel="noreferrer">source</a></span>
          <span className="small">Credit that will be shown: “{pick.attribution}”</span>
          <label className="check"><input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} /> <span>I've checked the licence and want to use this image with the credit above.</span></label>
          <button className="btn btn-primary btn-sm" style={{ justifySelf: "start" }} disabled={!confirm || busy} onClick={async () => { setBusy(true); try { await api(`/api/projects/${projectId}/assets/import`, { body: { openverseId: pick.id, confirm: true, alt: pick.title } }); toast("Image added to your library"); onImported(); } catch (e) { toast((e as Error).message, "err"); } setBusy(false); }}>Add to my library</button>
        </div>
      )}
    </div>
  );
}
