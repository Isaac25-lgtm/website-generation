import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { api, fmtDate, useApp } from "../lib";
import { Fields } from "../components/forms";
import { Icon, LoadingPage, Modal, Spinner } from "../components/ui";
import { TemplateGallery } from "../pages/Marketing";
import { NEW_SECTION_DATA, SECTION_LABELS, SECTION_SPECS, SITE_SPECS, STORE_POLICY_SPECS, THEME_SPECS } from "./editorSpecs";
import { DeliveryStep, PaymentsStep } from "./Wizard";

type Sel = { kind: "section"; pageId: string; sectionId: string } | { kind: "theme" } | { kind: "site" } | { kind: "store" } | { kind: "page"; pageId: string };
const DEVICES = { desktop: 1280, tablet: 820, mobile: 390 } as const;
const sid = (k: string) => `${k}-${Math.random().toString(36).slice(2, 9)}`;

const ALLOWED: Record<string, string[]> = {
  personal: ["hero", "about", "text", "projects", "experience", "education", "achievements", "skills", "gallery", "testimonials", "video", "resume", "faq", "cta", "contact"],
  business: ["hero", "about", "text", "services", "gallery", "testimonials", "team", "faq", "hours", "video", "quote", "cta", "contact", "banner"],
  ecommerce: ["banner", "hero", "collections", "products", "about", "text", "gallery", "testimonials", "faq", "hours", "video", "cta", "contact"],
};

export default function Editor() {
  const { id } = useParams();
  const { toast, config } = useApp();
  const [proj, setProj] = useState<any>(null);
  const [doc, setDoc] = useState<any>(null);
  const [rev, setRev] = useState(0);
  const [past, setPast] = useState<any[]>([]);
  const [future, setFuture] = useState<any[]>([]);
  const [sel, setSel] = useState<Sel>({ kind: "theme" });
  const [pageId, setPageId] = useState("home");
  const [device, setDevice] = useState<keyof typeof DEVICES>("desktop");
  const [status, setStatus] = useState<"saved" | "saving" | "error" | "dirty">("saved");
  const [frameRev, setFrameRev] = useState(0);
  const [modal, setModal] = useState<"" | "template" | "history" | "addSection" | "addPage">("");
  const [refine, setRefine] = useState("");
  const [refineMsg, setRefineMsg] = useState<string>("");
  const [busy, setBusy] = useState("");
  const revRef = useRef(0);
  const docRef = useRef<any>(null);
  const timer = useRef<number | undefined>(undefined);
  const frame = useRef<HTMLIFrameElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ w: 900, h: 700 });
  useEffect(() => {
    const el = stage.current; if (!el) return;
    const ro = new ResizeObserver(() => setStageSize({ w: el.clientWidth - 32, h: el.clientHeight - 32 }));
    ro.observe(el); return () => ro.disconnect();
  });

  useEffect(() => {
    api(`/api/projects/${id}`).then((r) => {
      setProj(r); setDoc(r.doc); docRef.current = r.doc; setRev(r.project.revision); revRef.current = r.project.revision; setFrameRev(r.project.revision);
      if (!r.doc) return;
    }).catch((e) => toast(e.message, "err"));
  }, [id]);

  const persist = useCallback(async (checkpoint = false, note?: string) => {
    window.clearTimeout(timer.current);
    setStatus("saving");
    try {
      const r = await api(`/api/projects/${id}/draft`, { method: "PUT", body: { doc: docRef.current, baseRevision: revRef.current, checkpoint, note } });
      revRef.current = r.revision; setRev(r.revision); setFrameRev(r.revision); setStatus("saved");
      if (checkpoint) toast("Checkpoint saved");
    } catch (e: any) {
      setStatus("error");
      toast(e.code === "conflict" ? "This site changed in another tab. Reload the page to continue." : e.message, "err");
    }
  }, [id]);

  const change = (next: any, immediate = false) => {
    setPast((p) => [...p.slice(-60), docRef.current]); setFuture([]);
    docRef.current = next; setDoc(next); setStatus("dirty");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => persist(), immediate ? 50 : 800);
  };
  const replaceFromServer = (d: any, r: number) => { setPast((p) => [...p.slice(-60), docRef.current]); setFuture([]); docRef.current = d; setDoc(d); revRef.current = r; setRev(r); setFrameRev(r); setStatus("saved"); };
  const undo = () => { if (!past.length) return; const prev = past[past.length - 1]; setPast(past.slice(0, -1)); setFuture((f) => [docRef.current, ...f]); docRef.current = prev; setDoc(prev); setStatus("dirty"); window.clearTimeout(timer.current); timer.current = window.setTimeout(() => persist(), 300); };
  const redo = () => { if (!future.length) return; const nx = future[0]; setFuture(future.slice(1)); setPast((p) => [...p, docRef.current]); docRef.current = nx; setDoc(nx); setStatus("dirty"); window.clearTimeout(timer.current); timer.current = window.setTimeout(() => persist(), 300); };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !(e.target as HTMLElement)?.closest("input,textarea")) { e.preventDefault(); e.shiftKey ? redo() : undo(); } };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  });
  useEffect(() => { const h = (e: BeforeUnloadEvent) => { if (status === "dirty" || status === "saving") e.preventDefault(); }; window.addEventListener("beforeunload", h); return () => window.removeEventListener("beforeunload", h); }, [status]);

  // Click-to-select inside the same-origin preview + highlight of the selection
  const page = doc?.pages.find((p: any) => p.id === pageId) ?? doc?.pages[0];
  const selectedSectionId = sel.kind === "section" ? sel.sectionId : null;
  const wireFrame = () => {
    const d = frame.current?.contentDocument;
    if (!d) return;
    const style = d.createElement("style");
    style.textContent = `section[id]{cursor:pointer}section[id]:hover{outline:2px dashed rgba(26,92,255,.55);outline-offset:-2px}.is-sel{outline:3px solid #1a5cff!important;outline-offset:-3px}`;
    d.head.appendChild(style);
    d.addEventListener("click", (e) => {
      const t = e.target as HTMLElement;
      if (t.closest("a,button,input,select,textarea,label,summary")) { if (t.closest("a")) e.preventDefault(); }
      const s = t.closest("section[id], div.banner[id]") as HTMLElement | null;
      if (s && page) { const found = page.sections.find((x: any) => x.id === s.id); if (found) setSel({ kind: "section", pageId: page.id, sectionId: s.id }); }
    }, true);
    highlight();
  };
  const highlight = () => {
    const d = frame.current?.contentDocument;
    if (!d) return;
    d.querySelectorAll(".is-sel").forEach((x) => x.classList.remove("is-sel"));
    if (selectedSectionId) { const el = d.getElementById(selectedSectionId); if (el) { el.classList.add("is-sel"); el.scrollIntoView({ block: "nearest", behavior: "smooth" }); } }
  };
  useEffect(highlight, [selectedSectionId, frameRev]);

  if (!proj) return <LoadingPage />;
  if (!doc) return <div className="narrow app-main"><h1>Not generated yet</h1><p className="muted">Finish the setup to generate your site.</p><Link className="btn btn-primary" to={`/projects/${id}/setup`}>Continue setup</Link></div>;

  const updPage = (pid: string, fn: (p: any) => any) => change({ ...doc, pages: doc.pages.map((p: any) => (p.id === pid ? fn(p) : p)) });
  const moveSection = (pid: string, i: number, d: number) => updPage(pid, (p) => { const s = [...p.sections]; const j = i + d; if (j < 0 || j >= s.length) return p; [s[i], s[j]] = [s[j], s[i]]; return { ...p, sections: s }; });
  const selSection = sel.kind === "section" ? doc.pages.find((p: any) => p.id === sel.pageId)?.sections.find((s: any) => s.id === sel.sectionId) : null;
  const selPage = sel.kind === "page" ? doc.pages.find((p: any) => p.id === sel.pageId) : null;
  const src = `/preview/${id}/${page?.slug ? page.slug : ""}?r=${frameRev}`;
  const hasAi = doc.pages.some((p: any) => p.sections.some((s: any) => s.aiSuggested));

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div className="editor">
        <aside aria-label="Pages and sections">
          <div className="panel">
            <div className="row between"><Link to="/dashboard" className="small">← Sites</Link><span className="tiny muted" aria-live="polite">{status === "saving" ? "Saving…" : status === "dirty" ? "Unsaved" : status === "error" ? "Save failed" : "Saved"}</span></div>
            <h2 style={{ fontSize: "1.1rem", margin: ".6rem 0 0" }}>{proj.project.name}</h2>
          </div>
          <div className="panel tree">
            <h3>Design</h3>
            <button aria-current={sel.kind === "theme"} onClick={() => setSel({ kind: "theme" })}>Theme &amp; colours</button>
            <button aria-current={sel.kind === "site"} onClick={() => setSel({ kind: "site" })}>Site settings &amp; contact</button>
            {doc.type === "ecommerce" && <button aria-current={sel.kind === "store"} onClick={() => setSel({ kind: "store" })}>Store checkout &amp; policies</button>}
            <button onClick={() => setModal("template")}>Change template</button>
          </div>
          <div className="panel tree">
            <div className="row between"><h3 style={{ margin: 0 }}>Pages</h3><button className="btn btn-sm btn-ghost" onClick={() => setModal("addPage")}>+ Page</button></div>
            {doc.pages.map((p: any) => (
              <div key={p.id}>
                <button aria-current={p.id === page?.id && sel.kind === "page"} onClick={() => { setPageId(p.id); setSel({ kind: "page", pageId: p.id }); }}><span><b>{p.title || "Untitled"}</b> <span className="tiny muted">/{p.slug}</span></span>{!p.inNav && <span className="tiny muted">hidden</span>}</button>
                {p.id === page?.id && p.sections.map((s: any, i: number) => (
                  <div key={s.id} className="row sec-row" aria-current={selectedSectionId === s.id} style={{ flexWrap: "nowrap", gap: 0 }}>
                    <button style={{ flex: 1, opacity: s.hidden ? .5 : 1 }} aria-current={selectedSectionId === s.id} onClick={() => { setSel({ kind: "section", pageId: p.id, sectionId: s.id }); }}>
                      <span>{SECTION_LABELS[s.kind] ?? s.kind}{s.aiSuggested && <span className="badge blue" style={{ marginLeft: 4, fontSize: ".6rem" }}>AI</span>}</span>
                    </button>
                    <span className="tools">
                      <button className="icon-btn" aria-label="Move up" onClick={() => moveSection(p.id, i, -1)}>{Icon.up}</button>
                      <button className="icon-btn" aria-label="Move down" onClick={() => moveSection(p.id, i, 1)}>{Icon.down}</button>
                      <button className="icon-btn" aria-label={s.hidden ? "Show section" : "Hide section"} onClick={() => updPage(p.id, (pg) => ({ ...pg, sections: pg.sections.map((x: any) => (x.id === s.id ? { ...x, hidden: !x.hidden } : x)) }))}>{s.hidden ? Icon.eyeOff : Icon.eye}</button>
                    </span>
                  </div>
                ))}
                {p.id === page?.id && <button className="sec-row" style={{ color: "var(--blue)" }} onClick={() => setModal("addSection")}>+ Add section</button>}
              </div>
            ))}
          </div>
        </aside>

        <section className="canvas" aria-label="Live preview">
          <div className="canvas-bar">
            <div className="row" style={{ gap: ".35rem" }}>
              <button className="btn btn-sm btn-ghost" onClick={undo} disabled={!past.length} aria-label="Undo" title="Undo (Ctrl+Z)">↶</button>
              <button className="btn btn-sm btn-ghost" onClick={redo} disabled={!future.length} aria-label="Redo" title="Redo (Ctrl+Shift+Z)">↷</button>
              <div className="seg" role="group" aria-label="Device preview">{(Object.keys(DEVICES) as (keyof typeof DEVICES)[]).map((d) => <button key={d} aria-pressed={device === d} onClick={() => setDevice(d)}>{d[0].toUpperCase() + d.slice(1)}</button>)}</div>
            </div>
            <div className="row" style={{ gap: ".35rem" }}>
              <button className="btn btn-sm" onClick={() => persist(true, "Manual checkpoint")}>Save checkpoint</button>
              <button className="btn btn-sm" onClick={() => setModal("history")}>History</button>
              <a className="btn btn-sm" href={src} target="_blank" rel="noreferrer">Full screen</a>
              {doc.type === "ecommerce" ? <Link className="btn btn-sm" to={`/projects/${id}/store`}>Products</Link> : <Link className="btn btn-sm" to={`/projects/${id}/setup`}>Answers</Link>}
              <Link className="btn btn-sm btn-primary" to={`/projects/${id}/publish`} onClick={() => persist()}>{Icon.rocket && <span style={{ width: 16, display: "inline-flex" }}>{Icon.rocket}</span>} Publish</Link>
            </div>
          </div>
          {hasAi && <div className="alert info small" style={{ margin: ".5rem .75rem 0", borderRadius: 10 }}>Sections marked <b>AI</b> contain suggested wording. Please check them for accuracy before publishing.</div>}
          <div className="canvas-frame" ref={stage}>
            {(() => {
              const vw = DEVICES[device];
              const scale = Math.min(1, stageSize.w / vw);
              const h = Math.max(480, stageSize.h);
              return (
                <div className="device" style={{ width: vw * scale, height: h, flex: "none" }}>
                  {status === "saving" && <div style={{ position: "absolute", top: 8, right: 8, zIndex: 2 }}><Spinner /></div>}
                  <iframe ref={frame} key={`${src}`} src={src} title="Site preview" onLoad={wireFrame} style={{ width: vw, height: h / scale, transform: `scale(${scale})`, transformOrigin: "0 0" }} />
                </div>
              );
            })()}
          </div>
        </section>

        <aside className="right" aria-label="Inspector">
          <div className="panel">
            <div className="ai-box stack-sm">
              <strong className="small">Refine the design</strong>
              <form className="stack-sm" onSubmit={async (e) => {
                e.preventDefault(); if (refine.trim().length < 2) return; setBusy("refine"); setRefineMsg("");
                await persist();
                try { const r = await api(`/api/projects/${id}/refine`, { body: { request: refine } }); replaceFromServer(r.doc, r.revision); setRefineMsg(`${r.engine === "ai" ? "AI" : "Rule-based designer"}: ${r.explanation}${r.note ? ` (${r.note})` : ""}`); setRefine(""); }
                catch (er) { toast((er as Error).message, "err"); }
                setBusy("");
              }}>
                <textarea className="input" rows={2} style={{ minHeight: 60 }} placeholder="e.g. more elegant, use more space, smaller headings, dark mode, green" value={refine} onChange={(e) => setRefine(e.target.value)} aria-label="Describe a design change" maxLength={400} />
                <div className="row between"><span className="tiny muted">{config?.ai.available ? "AI-powered, with a rule-based fallback" : "Rule-based (AI not enabled)"} · undo anytime</span><button className="btn btn-primary btn-sm" disabled={busy === "refine"}>{busy === "refine" ? <Spinner /> : "Apply"}</button></div>
              </form>
              {refineMsg && <p className="tiny" style={{ margin: 0 }}>{refineMsg}</p>}
              {config?.ai.available && <button className="btn btn-sm" disabled={!!busy} onClick={async () => { setBusy("copy"); await persist(); try { const r = await api(`/api/projects/${id}/ai/copy`, { body: {} }); replaceFromServer(r.doc, r.revision); toast("AI wording suggestions applied. Review the sections marked AI."); } catch (e) { toast((e as Error).message, "err"); } setBusy(""); }}>{busy === "copy" ? <Spinner /> : "Polish wording with AI"}</button>}
            </div>
          </div>
          <div className="panel">
            {sel.kind === "theme" && <><h3>Theme</h3><Fields specs={THEME_SPECS} value={doc} onChange={(v) => change(v)} projectId={id!} /></>}
            {sel.kind === "site" && <><h3>Site settings</h3><Fields specs={SITE_SPECS} value={doc} onChange={(v) => change(v)} projectId={id!} /></>}
            {sel.kind === "store" && doc.store && (
              <div className="stack">
                <h3>Payments</h3>
                <PaymentsStep answers={{ store: doc.store, currency: doc.store.currency }} onChange={(a) => change({ ...doc, store: { ...doc.store, ...a.store } })} />
                <h3>Delivery</h3>
                <DeliveryStep answers={{ store: doc.store, currency: doc.store.currency }} onChange={(a) => change({ ...doc, store: { ...doc.store, ...a.store } })} />
                <h3>Policies</h3>
                <Fields specs={STORE_POLICY_SPECS} value={doc} onChange={(v) => change(v)} projectId={id!} />
              </div>
            )}
            {sel.kind === "page" && selPage && (
              <div className="stack">
                <h3>Page</h3>
                <label className="field"><span>Title (shown in menu)</span><input value={selPage.title} maxLength={80} onChange={(e) => updPage(selPage.id, (p) => ({ ...p, title: e.target.value }))} /></label>
                {selPage.slug !== "" && <label className="field"><span>Address</span><input value={selPage.slug} maxLength={40} onChange={(e) => updPage(selPage.id, (p) => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 40) }))} /></label>}
                <label className="check"><input type="checkbox" checked={selPage.inNav} onChange={(e) => updPage(selPage.id, (p) => ({ ...p, inNav: e.target.checked }))} /> Show in navigation menu</label>
                {selPage.slug !== "" && <button className="btn btn-danger btn-sm" style={{ justifySelf: "start" }} onClick={() => { if (confirm(`Delete page “${selPage.title}”?`)) { change({ ...doc, pages: doc.pages.filter((p: any) => p.id !== selPage.id) }); setPageId(doc.pages[0].id); setSel({ kind: "theme" }); } }}>Delete page</button>}
              </div>
            )}
            {sel.kind === "section" && selSection && (
              <div className="stack">
                <div className="row between"><h3 style={{ margin: 0 }}>{SECTION_LABELS[selSection.kind]}</h3>
                  <div className="row" style={{ gap: 2 }}>
                    <button className="icon-btn" title="Duplicate" aria-label="Duplicate section" onClick={() => updPage(sel.pageId, (p) => { const i = p.sections.findIndex((x: any) => x.id === selSection.id); const s = [...p.sections]; s.splice(i + 1, 0, { ...JSON.parse(JSON.stringify(selSection)), id: sid(selSection.kind) }); return { ...p, sections: s }; })}>{Icon.copy}</button>
                    <button className="icon-btn" title="Delete" aria-label="Delete section" onClick={() => { if (confirm("Delete this section?")) { updPage(sel.pageId, (p) => ({ ...p, sections: p.sections.filter((x: any) => x.id !== selSection.id) })); setSel({ kind: "page", pageId: sel.pageId }); } }}>{Icon.trash}</button>
                  </div>
                </div>
                {selSection.aiSuggested && <div className="alert info small">This text was suggested by AI. Check it's accurate. <button className="btn btn-sm" onClick={() => updPage(sel.pageId, (p) => ({ ...p, sections: p.sections.map((x: any) => (x.id === selSection.id ? { ...x, aiSuggested: false } : x)) }))}>Mark as reviewed</button></div>}
                <Fields specs={SECTION_SPECS[selSection.kind] ?? []} value={selSection} projectId={id!}
                  onChange={(v) => updPage(sel.pageId, (p) => ({ ...p, sections: p.sections.map((x: any) => (x.id === selSection.id ? v : x)) }))} />
              </div>
            )}
          </div>
        </aside>
      </div>

      {modal === "addSection" && page && (
        <Modal title="Add a section" onClose={() => setModal("")}>
          <div className="grid-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
            {ALLOWED[doc.type].map((k) => <button key={k} className="btn" style={{ justifyContent: "flex-start", height: 56 }} onClick={() => { const s = { id: sid(k), kind: k, hidden: false, aiSuggested: false, variant: "", data: JSON.parse(JSON.stringify(NEW_SECTION_DATA[k])) }; updPage(page.id, (p) => ({ ...p, sections: [...p.sections, s] })); setSel({ kind: "section", pageId: page.id, sectionId: s.id }); setModal(""); }}>{SECTION_LABELS[k]}</button>)}
          </div>
        </Modal>
      )}
      {modal === "addPage" && <AddPage onClose={() => setModal("")} existing={doc.pages.map((p: any) => p.slug)} onAdd={(title, slug) => { const pg = { id: sid("page"), slug, title, inNav: true, sections: [{ id: sid("text"), kind: "text", hidden: false, aiSuggested: false, variant: "", data: { heading: title, body: "" } }] }; change({ ...doc, pages: [...doc.pages, pg] }); setPageId(pg.id); setSel({ kind: "page", pageId: pg.id }); setModal(""); }} />}
      {modal === "template" && (
        <Modal title="Change template (your content is kept)" onClose={() => setModal("")} wide>
          <TemplateGallery embedded type={doc.type} selected={doc.templateId} onPick={async (t) => { await persist(); try { const r = await api(`/api/projects/${id}/template`, { body: { templateId: t } }); if (r.doc) replaceFromServer(r.doc, r.revision); toast("Template changed"); setModal(""); } catch (e) { toast((e as Error).message, "err"); } }} />
        </Modal>
      )}
      {modal === "history" && <History id={id!} onClose={() => setModal("")} onRestore={(d, r) => { replaceFromServer(d, r); setModal(""); }} />}
    </div>
  );
}

function AddPage({ onClose, onAdd, existing }: { onClose: () => void; onAdd: (t: string, s: string) => void; existing: string[] }) {
  const [title, setTitle] = useState("");
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  const clash = existing.includes(slug) || ["cart", "checkout", "product", "order", "policies"].includes(slug);
  return (
    <Modal title="Add a page" onClose={onClose}>
      <form className="stack" onSubmit={(e) => { e.preventDefault(); if (slug && !clash) onAdd(title, slug); }}>
        <label className="field"><span>Page title</span><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} autoFocus /></label>
        <span className="small muted">Address: /{slug || "…"} {clash && <b style={{ color: "var(--err)" }}>already used</b>}</span>
        <button className="btn btn-primary" disabled={!slug || clash}>Add page</button>
      </form>
    </Modal>
  );
}

function History({ id, onClose, onRestore }: { id: string; onClose: () => void; onRestore: (d: any, r: number) => void }) {
  const [list, setList] = useState<any[] | null>(null);
  const { toast } = useApp();
  useEffect(() => { api(`/api/projects/${id}/history`).then((r) => setList(r.history)); }, [id]);
  return (
    <Modal title="Checkpoints" onClose={onClose}>
      {!list ? <Spinner /> : list.length === 0 ? <p className="muted">No checkpoints yet.</p> : (
        <ul style={{ listStyle: "none", padding: 0 }} className="stack-sm">{list.map((h) => (
          <li key={h.id} className="row between card" style={{ padding: ".75rem 1rem" }}><span className="small"><b>{h.note || `Revision ${h.revision}`}</b><br /><span className="muted">{fmtDate(h.created_at)}</span></span>
            <button className="btn btn-sm" onClick={async () => { try { const r = await api(`/api/projects/${id}/history/${h.id}/restore`, { body: {} }); onRestore(r.doc, r.revision); toast("Checkpoint restored"); } catch (e) { toast((e as Error).message, "err"); } }}>Restore</button></li>
        ))}</ul>
      )}
    </Modal>
  );
}
