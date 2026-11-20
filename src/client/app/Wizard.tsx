import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { api, compressImage, money, sampleColors, toMajor, toMinor, useApp } from "../lib";
import { Fields, type FieldSpec } from "../components/forms";
import { LoadingPage, Spinner } from "../components/ui";
import { TemplateGallery } from "../pages/Marketing";
import { STARTER_POLICIES, STEPS, type Step } from "./wizardSpecs";
import { ProductsManager } from "./Store";

const rid = () => Math.random().toString(36).slice(2, 10);

function ensureIds(a: any): any {
  const st = a.store;
  if (!st) return a;
  const fix = (list: any[] | undefined) => (list ?? []).map((x) => (x.id && /^[a-zA-Z0-9_-]{1,40}$/.test(x.id) ? x : { ...x, id: rid() }));
  return { ...a, store: { ...st, paymentMethods: fix(st.paymentMethods), fulfillment: fix(st.fulfillment) } };
}

export default function Wizard() {
  const { id } = useParams();
  const nav = useNavigate();
  const { toast, config } = useApp();
  const [proj, setProj] = useState<any>(null);
  const [answers, setAnswers] = useState<any>({});
  const [templateId, setTemplateId] = useState<string>("");
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef({ answers, step, templateId });
  latest.current = { answers, step, templateId };

  useEffect(() => {
    api(`/api/projects/${id}`).then((r) => {
      setProj(r); setTemplateId(r.project.templateId); setStep(Math.min(r.intake.step || 0, STEPS[r.project.type].length - 1));
      let a = r.intake.answers || {};
      if (r.project.type === "ecommerce" && !a.store) a = { ...a, store: { ...STARTER_POLICIES, requirePhone: true, paymentMethods: [], fulfillment: [] } };
      setAnswers(a);
    }).catch((e) => toast(e.message, "err"));
  }, [id]);

  const save = useCallback(async (extra: Record<string, unknown> = {}) => {
    const { answers: a, step: s, templateId: t } = latest.current;
    setSaving("saving");
    try { await api(`/api/projects/${id}/intake`, { method: "PUT", body: { step: s, answers: ensureIds(a), templateId: t, ...extra } }); setSaving("saved"); }
    catch (e) { setSaving("error"); toast((e as Error).message, "err"); throw e; }
  }, [id]);

  const update = (a: any) => { setAnswers(a); window.clearTimeout(timer.current); timer.current = window.setTimeout(() => save().catch(() => {}), 900); };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  if (!proj) return <LoadingPage />;
  const type = proj.project.type as string;
  const steps = STEPS[type];
  const cur = steps[step];
  const go = async (n: number) => { window.clearTimeout(timer.current); setStep(n); latest.current.step = n; await save().catch(() => {}); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div className="container app-main">
      <div className="page-title">
        <div><Link to="/dashboard" className="small">← All sites</Link><h1>{proj.project.name}</h1><span className="muted small">{type === "ecommerce" ? "E-commerce store" : type === "business" ? "Business website" : "Personal website"} · step {step + 1} of {steps.length}</span></div>
        <div className="row"><span className="small muted" aria-live="polite">{saving === "saving" ? "Saving…" : saving === "saved" ? "All changes saved" : saving === "error" ? "Not saved" : ""}</span>{proj.doc && <Link className="btn" to={`/projects/${id}/editor`}>Open editor</Link>}</div>
      </div>
      <div className="progress" aria-hidden="true"><i style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
      <div className="wizard">
        <nav className="wizard-steps" aria-label="Setup steps">
          {steps.map((s, i) => <button key={s.id} aria-current={i === step ? "step" : undefined} className={i < step ? "done" : ""} onClick={() => go(i)}><span className="n">{i < step ? "✓" : i + 1}</span><span>{s.title}</span></button>)}
        </nav>
        <section className="card" style={{ padding: "clamp(1.25rem, 3vw, 2rem)" }} aria-labelledby="step-title">
          <h2 id="step-title" style={{ fontSize: "1.5rem" }}>{cur.title}</h2>
          {cur.intro && <p className="muted">{cur.intro}</p>}
          {cur.fields && <Fields specs={cur.fields} value={answers} onChange={update} projectId={id!} />}
          {cur.special === "style" && <StyleStep projectId={id!} type={type} answers={answers} onChange={update} templateId={templateId} setTemplateId={(t) => { setTemplateId(t); latest.current.templateId = t; save().catch(() => {}); }} />}
          {cur.special === "products" && <ProductsManager projectId={id!} currency={answers.currency || "USD"} />}
          {cur.special === "store-payments" && <PaymentsStep answers={answers} onChange={update} />}
          {cur.special === "store-delivery" && <DeliveryStep answers={answers} onChange={update} />}
          {cur.special === "review" && <ReviewStep proj={proj} answers={answers} steps={steps} goTo={go} aiAvailable={!!config?.ai.available} onGenerate={async (useAi, rights) => {
            window.clearTimeout(timer.current);
            await save(rights ? { contentRightsAck: true } : {});
            const r = await api(`/api/projects/${id}/generate`, { body: { useAi } });
            if (useAi && !r.ai.used && r.ai.error) toast(r.ai.error, "err");
            nav(`/projects/${id}/editor`);
          }} />}
          {cur.special !== "review" && (
            <div className="row between" style={{ marginTop: "2rem", borderTop: "1px solid var(--line)", paddingTop: "1.25rem" }}>
              <button className="btn" disabled={step === 0} onClick={() => go(step - 1)}>Back</button>
              <button className="btn btn-primary" onClick={() => go(step + 1)}>Continue</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const STYLE_FIELDS: FieldSpec[] = [
  { k: "style.mode", label: "Colour mode", t: "select", options: [["", "Template default"], ["light", "Light"], ["dark", "Dark"]] },
  { k: "style.primary", label: "Main brand colour", t: "color", help: "Leave empty to use the template's colour." },
  { k: "style.accent", label: "Accent colour", t: "color" },
  { k: "style.fontHeading", label: "Heading font", t: "select", options: [["", "Template default"], ["outfit", "Outfit (geometric)"], ["inter", "Inter (clean)"], ["space-grotesk", "Space Grotesk (modern)"], ["playfair", "Playfair Display (elegant serif)"], ["fraunces", "Fraunces (editorial serif)"], ["cormorant", "Cormorant (luxury serif)"], ["dm-serif", "DM Serif (classic)"], ["poppins", "Poppins (friendly)"], ["syne", "Syne (bold display)"], ["jetbrains-mono", "JetBrains Mono (technical)"]] },
  { k: "style.radius", label: "Corner style", t: "select", options: [["", "Template default"], ["none", "Square"], ["sm", "Slightly rounded"], ["md", "Rounded"], ["lg", "Very rounded"], ["xl", "Pill / soft"]] },
  { k: "style.density", label: "Spacing", t: "select", options: [["", "Template default"], ["compact", "Compact"], ["comfortable", "Comfortable"], ["airy", "Airy / spacious"]] },
  { k: "style.animation", label: "Animation", t: "select", options: [["", "Template default"], ["none", "None"], ["subtle", "Subtle"], ["lively", "Lively"]] },
];

function StyleStep({ projectId, type, answers, onChange, templateId, setTemplateId }: { projectId: string; type: string; answers: any; onChange: (a: any) => void; templateId: string; setTemplateId: (t: string) => void }) {
  const { toast } = useApp();
  const [url, setUrl] = useState<string>(answers.inspiration?.url || (() => { try { const i = JSON.parse(sessionStorage.getItem("is_intent") || "{}"); return i.url || ""; } catch { return ""; } })());
  const [busy, setBusy] = useState(false);
  const [brief, setBrief] = useState<any>(answers.inspiration?.brief || null);
  const [shot, setShot] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const analyze = async () => {
    setBusy(true); setErr("");
    try { const r = await api(`/api/projects/${projectId}/inspiration`, { body: { url } }); setBrief(r.brief); setShot(r.screenshotUrl); }
    catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  const fromScreenshot = async (f: File) => {
    setBusy(true); setErr("");
    try {
      const colors = await sampleColors(f);
      const fd = new FormData(); fd.append("file", await compressImage(f), f.name);
      const up = await api(`/api/projects/${projectId}/assets`, { form: fd });
      const r = await api(`/api/projects/${projectId}/inspiration/screenshot`, { body: { colors, notes: answers.inspiration?.notes || "", assetId: up.asset.id } });
      setBrief(r.brief); setShot(up.asset.url);
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  const apply = () => {
    onChange({ ...answers, inspiration: { sourceHost: brief.sourceHost, notes: answers.inspiration?.notes || "", url, brief, tokens: brief.suggested } });
    if (brief.recommendedTemplates?.[0]) setTemplateId(brief.recommendedTemplates[0]);
    toast("Inspiration applied. Your design will use this style.");
  };
  return (
    <div className="stack" style={{ gap: "2rem" }}>
      <div className="ai-box stack">
        <div><strong>Paste a website you love</strong><p className="muted small" style={{ margin: ".25rem 0 0" }}>We'll read its high-level style (colours, fonts, spacing, shapes) and design an original site for you in that spirit. We never copy its content.</p></div>
        <div className="row"><input className="input" style={{ flex: 1, minWidth: 220 }} placeholder="https://www.example.com" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Inspiration website address" /><button className="btn btn-primary" disabled={busy || url.length < 4} onClick={analyze}>{busy ? <Spinner /> : "Analyse style"}</button></div>
        <div className="row small"><span className="muted">Site blocks automated visits?</span><button className="btn btn-sm" onClick={() => fileRef.current?.click()} disabled={busy}>Upload a screenshot instead</button><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => e.target.files?.[0] && fromScreenshot(e.target.files[0])} /></div>
        <label className="field"><span>Describe the style you want (optional)</span><input value={answers.inspiration?.notes || ""} maxLength={600} placeholder="e.g. minimal and elegant, lots of white space, bold photos" onChange={(e) => onChange({ ...answers, inspiration: { ...(answers.inspiration || {}), notes: e.target.value } })} /></label>
        {err && <div className="alert err" role="alert">{err}</div>}
        {brief && (
          <div className="card stack-sm">
            <div className="row between"><strong>Design brief: {brief.sourceHost}</strong><span className="badge blue">{brief.method === "browser" ? "Rendered with Browser Run" : brief.method === "screenshot" ? "From screenshot" : "From HTML/CSS"}</span></div>
            {shot && <img src={shot} alt={`Captured reference of ${brief.sourceHost}`} style={{ borderRadius: 10, border: "1px solid var(--line)", maxHeight: 260, objectFit: "cover", objectPosition: "top" }} />}
            <div className="row">{brief.palette.slice(0, 8).map((p: any) => <span key={p.hex} title={p.hex} style={{ width: 32, height: 32, borderRadius: 8, background: p.hex, border: "1px solid var(--line)" }} />)}</div>
            <span className="small">Mood: <b>{brief.mood.join(" · ")}</b> · Mode: <b>{brief.mode}</b> · Type: <b>{brief.typography.feel}</b> · Corners: <b>{brief.shape.radius}</b></span>
            <span className="small">Recommended templates: <b>{brief.recommendedTemplates.join(", ")}</b></span>
            {brief.uncertainties.length > 0 && <ul className="tiny muted" style={{ margin: 0 }}>{brief.uncertainties.map((u: string) => <li key={u}>{u}</li>)}</ul>}
            <button className="btn btn-primary btn-sm" style={{ justifySelf: "start" }} onClick={apply}>Use this style</button>
          </div>
        )}
        {answers.inspiration?.sourceHost && !brief && <span className="badge green">Using style from {answers.inspiration.sourceHost}</span>}
      </div>
      <div><h3>Choose a template</h3><p className="muted small">Your content will be placed in the template. You can switch templates later in the editor without losing anything.</p>
        <TemplateGallery embedded type={type} onPick={setTemplateId} selected={templateId} />
      </div>
      <div><h3>Fine-tune (optional)</h3><div className="grid-2"><Fields specs={STYLE_FIELDS} value={answers} onChange={onChange} projectId={projectId} /></div></div>
    </div>
  );
}

const PAY_PRESETS: Record<string, { label: string; instructions: string }> = {
  cod: { label: "Cash on delivery", instructions: "Pay in cash (or mobile money) when your order is delivered." },
  mobile_money: { label: "Mobile money transfer", instructions: "After you order, we'll send you our mobile money number. Your order is confirmed once payment is received." },
  bank_transfer: { label: "Bank transfer", instructions: "After you order, we'll send our bank details. Please use your order number as the reference." },
  pay_on_pickup: { label: "Pay on pickup", instructions: "Pay when you collect your order from our shop." },
  whatsapp: { label: "Arrange payment on WhatsApp", instructions: "We'll message you on WhatsApp to agree payment and delivery." },
};

export function PaymentsStep({ answers, onChange }: { answers: any; onChange: (a: any) => void }) {
  const st = answers.store || {};
  const list: any[] = st.paymentMethods || [];
  const set = (store: any) => onChange({ ...answers, store: { ...st, ...store } });
  return (
    <div className="stack">
      <div className="alert info small"><strong>How payment works today:</strong> customers place real orders, and you collect payment yourself using the methods below. Online card or mobile-money checkout needs your own verified payment account (Flutterwave, Pesapal or Paystack). These integrations are coming, and your store will never pretend to take card payments until then. Your sales never pass through our account.</div>
      <div className="stack-sm"><span className="label">Payment methods your customers can choose</span>
        {Object.entries(PAY_PRESETS).map(([kind, p]) => {
          const on = list.find((m) => m.kind === kind);
          return (
            <div key={kind} className="list-item">
              <label className="check"><input type="checkbox" checked={!!on} onChange={(e) => set({ paymentMethods: e.target.checked ? [...list, { id: rid(), kind, ...p }] : list.filter((m) => m.kind !== kind) })} /> <b>{p.label}</b></label>
              {on && <label className="field"><span>Instructions shown to the customer</span><textarea rows={2} value={on.instructions} maxLength={800} onChange={(e) => set({ paymentMethods: list.map((m) => (m.kind === kind ? { ...m, instructions: e.target.value } : m)) })} /></label>}
            </div>
          );
        })}
      </div>
      <label className="check"><input type="checkbox" checked={st.requirePhone !== false} onChange={(e) => set({ requirePhone: e.target.checked })} /> Require a phone number at checkout</label>
      <label className="check"><input type="checkbox" checked={!!st.requireEmail} onChange={(e) => set({ requireEmail: e.target.checked })} /> Require an email address at checkout</label>
      <label className="field"><span>Checkout note (optional)</span><textarea rows={2} value={st.checkoutNote || ""} maxLength={600} onChange={(e) => set({ checkoutNote: e.target.value })} placeholder="We'll call you to confirm your order within 2 hours." /></label>
    </div>
  );
}

export function DeliveryStep({ answers, onChange }: { answers: any; onChange: (a: any) => void }) {
  const st = answers.store || {};
  const list: any[] = st.fulfillment || [];
  const cur = answers.currency || "USD";
  const set = (store: any) => onChange({ ...answers, store: { ...st, ...store } });
  const upd = (i: number, patch: any) => set({ fulfillment: list.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  return (
    <div className="stack">
      <p className="muted small">Add each way customers can receive orders, with its fee. Customers choose one at checkout.</p>
      {list.map((f, i) => (
        <div className="list-item" key={f.id || i}>
          <div className="list-item-head"><strong className="small">Option {i + 1}</strong><button className="icon-btn" aria-label="Remove option" onClick={() => set({ fulfillment: list.filter((_, j) => j !== i) })}>✕</button></div>
          <div className="grid-2" style={{ gap: ".75rem" }}>
            <label className="field"><span>Type</span><select value={f.kind} onChange={(e) => upd(i, { kind: e.target.value })}><option value="delivery">Delivery to an address</option><option value="pickup">Pickup</option><option value="digital">Digital delivery</option></select></label>
            <label className="field"><span>Name shown to customers</span><input value={f.label || ""} maxLength={80} onChange={(e) => upd(i, { label: e.target.value })} placeholder="Kampala delivery" /></label>
            <label className="field"><span>Fee ({cur})</span><input inputMode="decimal" value={f.priceMinor ? toMajor(f.priceMinor, cur) : ""} placeholder="0" onChange={(e) => upd(i, { priceMinor: toMinor(e.target.value || "0", cur) })} /><span className="help">{f.priceMinor ? money(f.priceMinor, cur) : "Free"}</span></label>
            <label className="field"><span>Details</span><input value={f.details || ""} maxLength={400} onChange={(e) => upd(i, { details: e.target.value })} placeholder="1–2 working days" /></label>
          </div>
        </div>
      ))}
      <div className="row">
        <button className="btn btn-sm" onClick={() => set({ fulfillment: [...list, { id: rid(), kind: "delivery", label: "Delivery", priceMinor: 0, details: "" }] })}>+ Delivery option</button>
        <button className="btn btn-sm" onClick={() => set({ fulfillment: [...list, { id: rid(), kind: "pickup", label: "Pickup from our shop", priceMinor: 0, details: "" }] })}>+ Pickup option</button>
      </div>
      <label className="field" style={{ maxWidth: 260 }}><span>Low-stock warning threshold</span><input type="number" min={0} max={1000} value={st.lowStockThreshold ?? 3} onChange={(e) => set({ lowStockThreshold: Number(e.target.value) })} /><span className="help">Shows “Only N left” to shoppers and flags low stock in your dashboard.</span></label>
    </div>
  );
}

function ReviewStep({ proj, answers, steps, goTo, onGenerate, aiAvailable }: { proj: any; answers: any; steps: Step[]; goTo: (n: number) => void; onGenerate: (ai: boolean, rights: boolean) => Promise<void>; aiAvailable: boolean }) {
  const type = proj.project.type;
  const [useAi, setUseAi] = useState(false);
  const [rights, setRights] = useState(!!proj.project.contentRightsAck);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const name = answers.name || answers.businessName || answers.storeName;
  const checks: [string, boolean, number][] = type === "personal"
    ? [["Your name", !!answers.name, 0], ["Bio", !!answers.bio, 0], ["At least one project", !!answers.projects?.length, 3], ["Contact email or phone", !!(answers.email || answers.phone), 1]]
    : type === "business"
      ? [["Business name", !!answers.businessName, 0], ["Description", !!answers.description, 0], ["At least one service", !!answers.services?.length, 2], ["Phone, WhatsApp or email", !!(answers.phone || answers.whatsapp || answers.email), 4]]
      : [["Store name", !!answers.storeName, 0], ["Payment method", !!answers.store?.paymentMethods?.length, 2], ["Delivery or pickup option", !!answers.store?.fulfillment?.length, 3], ["Returns & shipping policies", !!(answers.store?.returnsPolicy && answers.store?.shippingPolicy), 4], ["Prohibited goods confirmation", !!answers.store?.prohibitedAck, 4]];
  return (
    <div className="stack">
      <p className="muted">We'll build <b>{name || "your site"}</b> from your answers. Sections without information are left out. Nothing is invented.</p>
      <ul className="stack-sm" style={{ listStyle: "none", padding: 0 }}>{checks.map(([l, ok, s]) => <li key={l} className="row"><span className={`badge ${ok ? "green" : "amber"}`}>{ok ? "✓" : "!"}</span> {l} {!ok && <button className="btn btn-sm btn-ghost" onClick={() => goTo(s)}>Add in “{steps[s].title}”</button>}</li>)}</ul>
      {type === "ecommerce" && <p className="small muted">Products are managed in the Products step and your store dashboard. Publishing requires at least one active product.</p>}
      <div className="ai-box">
        <label className="check"><input type="checkbox" checked={useAi} disabled={!aiAvailable} onChange={(e) => setUseAi(e.target.checked)} /> <span><b>Polish my wording with AI</b> (optional)<br /><span className="muted small">{aiAvailable ? "AI may rephrase your headline, about text and descriptions for clarity, using only facts you gave. Suggested text is highlighted for your review before publishing." : "AI suggestions are not enabled on the platform right now. Your site is still generated fully from your answers."}</span></span></label>
      </div>
      <label className="check"><input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} /> <span>I confirm that I own or have permission to use all text, photos, logos and files I've added, and that they don't infringe anyone's rights.</span></label>
      {err && <div className="alert err" role="alert">{err}</div>}
      <div className="row between" style={{ marginTop: "1rem" }}>
        <button className="btn" onClick={() => goTo(steps.length - 2)}>Back</button>
        <button className="btn btn-primary btn-lg" disabled={busy || !rights} onClick={async () => { setBusy(true); setErr(""); try { await onGenerate(useAi, rights); } catch (e) { setErr((e as Error).message); setBusy(false); } }}>{busy ? <><Spinner /> Generating…</> : <>Generate my website</>}</button>
      </div>
    </div>
  );
}
