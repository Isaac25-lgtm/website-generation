import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { api, hostingPrice, useApp, usd } from "../lib";
import { Field, Icon, Modal, SiteThumb, Spinner } from "../components/ui";
import { PLANS } from "../../shared/pricing";
import { startIntent } from "./Home";

export function Pricing() {
  const { me, config } = useApp();
  const nav = useNavigate();
  const hp = hostingPrice(config);
  return (
    <main id="main" className="section">
      <div className="container">
        <div className="section-head"><span className="eyebrow">Pricing</span><h1 style={{ fontSize: "clamp(2.2rem,4.5vw,3.4rem)" }}>Simple pricing</h1><p>A one-time fee to build and publish your website, then {hp.label} per site per {hp.interval} for hosting and maintenance. Preview everything free before you pay.</p></div>
        <div className="grid-3" style={{ alignItems: "stretch" }}>
          {Object.values(PLANS).map((p) => (
            <article key={p.type} className={`card plan ${p.type === "business" ? "featured" : ""}`}>
              {p.type === "business" && <span className="tag">Most chosen</span>}
              <h2 style={{ fontSize: "1.35rem", margin: 0 }}>{p.name}</h2>
              <div className="price">{usd(p.priceCents)} <small>USD, one-time build fee</small></div>
              <p className="small" style={{ margin: "0 0 .6rem" }}>+ {hp.label}/{hp.interval} hosting &amp; maintenance</p>
              <p className="muted" style={{ margin: 0 }}>{p.summary}</p>
              <ul>{p.includes.map((x) => <li key={x}>{x}</li>)}</ul>
              <button className={`btn ${p.type === "business" ? "btn-primary" : ""} btn-lg`} onClick={() => { startIntent(p.type, "", ""); nav(me ? `/dashboard/new?type=${p.type}` : `/signup?next=${encodeURIComponent(`/dashboard/new?type=${p.type}`)}`); }}>Start free preview</button>
            </article>
          ))}
        </div>
        <div className="grid-2" style={{ marginTop: "2.5rem" }}>
          <div className="card">
            <h3>What the one-time build fee covers</h3>
            <p className="muted small">Creating your website with our builder and templates, setting up your web address, publishing, unlimited manual editing and republishing, and your data export. AI suggestions are limited to {config?.ai.perProjectLimit ?? 20} per site (manual editing is unlimited).</p>
          </div>
          <div className="card">
            <h3>Hosting &amp; maintenance: {hp.label} per site per {hp.interval}</h3>
            <p className="muted small">
              Keeps your site online at its web address over secure https, with backups, security and platform updates, and support. It's billed monthly per published site, and you can cancel any time (your site goes offline at the end of the paid month; you can export it first).
              {" "}{hp.billingLive ? "" : "Monthly billing is being set up: you'll be asked to agree to the monthly plan before any monthly charge is made."}
              {" "}Your web address is set up automatically. Connecting a domain you own is coming soon; domains are bought from a registrar at their price and aren't included.
            </p>
          </div>
        </div>
        <p className="center muted small" style={{ marginTop: "2rem" }}>Payment: {config?.payments.configured ? (config.payments.mode === "test" ? "checkout is in test mode — no real charges are possible yet." : "secure card checkout.") : "online checkout is opening soon. You can build and preview your site today."} See our <Link to="/refunds">Refund &amp; Cancellation Policy</Link>.</p>
      </div>
    </main>
  );
}

type Tpl = { id: string; name: string; type: string; tier: string; styles: string[]; industries: string[]; description: string; colors: Record<string, string>; locked: boolean; fontHeading: string };

export function TemplateGallery({ embedded, onPick, type: fixedType, selected }: { embedded?: boolean; onPick?: (id: string) => void; type?: string; selected?: string }) {
  const [list, setList] = useState<Tpl[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [type, setType] = useState(fixedType ?? "all");
  const [style, setStyle] = useState("all");
  const [open, setOpen] = useState<Tpl | null>(null);
  useEffect(() => { api("/api/templates").then((r) => { setList(r.templates); setSignedIn(r.signedIn); }).catch(() => {}); }, []);
  const styles = useMemo(() => ["all", ...new Set(list.flatMap((t) => t.styles))].slice(0, 12), [list]);
  const shown = list.filter((t) => (type === "all" || t.type === type) && (style === "all" || t.styles.includes(style)));
  return (
    <>
      {!fixedType && (
        <div className="filters" role="group" aria-label="Filter by site type">
          {[["all", "All"], ["personal", "Personal"], ["business", "Business"], ["ecommerce", "E-commerce"]].map(([k, l]) => <button key={k} aria-pressed={type === k} onClick={() => setType(k)}>{l}</button>)}
        </div>
      )}
      <div className="filters" role="group" aria-label="Filter by style" style={{ marginTop: fixedType ? 0 : "-1rem" }}>
        {styles.map((s) => <button key={s} aria-pressed={style === s} onClick={() => setStyle(s)} style={{ fontSize: ".85rem", padding: ".3rem .8rem" }}>{s === "all" ? "Any style" : s}</button>)}
      </div>
      {!signedIn && <p className="muted small" style={{ marginTop: "-.5rem", marginBottom: "1.5rem" }}>{list.filter((t) => t.locked).length} member templates unlock when you <Link to="/signup">sign up free</Link> or sign in with Google.</p>}
      <div className="grid-3">
        {shown.map((t) => (
          <article key={t.id} className={`card hover tpl-card ${selected === t.id ? "plan featured" : ""}`}>
            <SiteThumb src={`/api/templates/${t.id}/preview/`} title={`${t.name} template preview`} locked={t.locked ? <div><strong style={{ fontWeight: 500 }}>{t.name}</strong><div className="small muted">Sign in to unlock</div></div> : undefined} />
            <div className="meta stack-sm">
              <div className="row between"><strong style={{ fontFamily: "var(--font-h)", fontSize: "1.1rem" }}>{t.name}</strong><div className="swatches" aria-hidden="true">{["bg", "primary", "accent", "text"].map((k) => <i key={k} style={{ background: t.colors[k] }} />)}</div></div>
              <p className="muted small" style={{ margin: 0 }}>{t.description}</p>
              <div className="row">{t.tier === "member" ? <span className="badge amber">Member</span> : <span className="badge green">Free to all</span>}<span className="badge">{t.type === "ecommerce" ? "E-commerce" : t.type[0].toUpperCase() + t.type.slice(1)}</span></div>
              <div className="row" style={{ marginTop: ".4rem" }}>
                {t.locked ? <Link to="/signup?next=%2Ftemplates" className="btn btn-primary btn-sm">Unlock free</Link> : <button className="btn btn-sm" onClick={() => setOpen(t)}>Preview</button>}
                {onPick && !t.locked && <button className="btn btn-primary btn-sm" onClick={() => onPick(t.id)} aria-pressed={selected === t.id}>{selected === t.id ? "Selected ✓" : "Use this template"}</button>}
                {!onPick && !t.locked && !embedded && <Link className="btn btn-primary btn-sm" to={`/dashboard/new?type=${t.type}&template=${t.id}`}>Use template</Link>}
              </div>
            </div>
          </article>
        ))}
      </div>
      {open && (
        <Modal title={`${open.name} — sample content`} onClose={() => setOpen(null)} wide>
          <div className="browser" style={{ height: "70vh" }}><div className="chrome"><i /><i /><i /><span className="url">Template preview with fictional sample content</span></div><iframe src={`/api/templates/${open.id}/preview/`} title={`${open.name} preview`} style={{ width: "100%", height: "calc(70vh - 36px)", border: 0 }} /></div>
        </Modal>
      )}
    </>
  );
}

export function Templates() {
  return (
    <main id="main" className="section">
      <div className="container">
        <div className="section-head"><span className="eyebrow">Template gallery</span><h1 style={{ fontSize: "clamp(2.2rem,4.5vw,3.4rem)" }}>18 original designs, ready for your content</h1><p>Every template is fully responsive, accessible and editable: colours, fonts, spacing and layout. Previews use fictional sample content.</p></div>
        <TemplateGallery />
      </div>
    </main>
  );
}

export function Examples() {
  const [demos, setDemos] = useState<any[]>([]);
  useEffect(() => { api("/api/examples").then((r) => setDemos(r.examples)).catch(() => {}); }, []);
  return (
    <main id="main" className="section">
      <div className="container">
        <div className="section-head"><span className="eyebrow">Example websites</span><h1 style={{ fontSize: "clamp(2.2rem,4.5vw,3.4rem)" }}>See finished sites, live</h1><p>One working demo for each product. They're real published sites on our platform with fictional content, labelled as demonstrations. The store accepts test orders (nothing is shipped or charged).</p></div>
        {!demos.length && <div className="center"><Spinner /></div>}
        <div className="stack" style={{ gap: "2.5rem" }}>
          {demos.map((d) => (
            <article key={d.slug} className="grid-2" style={{ alignItems: "center", gap: "2.5rem" }}>
              <div className="browser"><div className="chrome"><i /><i /><i /><span className="url">{d.url}</span></div><SiteThumb src={`/s/${d.slug}/`} title={d.name} eager /></div>
              <div>
                <span className="badge blue">{d.type === "ecommerce" ? "E-commerce · $100" : d.type === "business" ? "Business · $30" : "Personal · $20"}</span>
                <h2 style={{ marginTop: ".75rem" }}>{d.name.replace("Demo: ", "")}</h2>
                <p className="muted">{d.type === "ecommerce" ? "Browse categories, search, choose sizes and colours, add to cart and place a test order. Stock, totals and order confirmation are real." : d.type === "business" ? "Multi-page business site with services, gallery, FAQ, quote requests and WhatsApp contact." : "Developer portfolio with projects, experience, skills and a contact form."}</p>
                <p className="small muted">Template: {d.template}</p>
                <a className="btn btn-primary" href={d.url}>Open live site →</a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

export function HowItWorks() {
  const { me, config } = useApp();
  return (
    <main id="main" className="section">
      <div className="narrow">
        <div className="section-head"><span className="eyebrow">How it works</span><h1 style={{ fontSize: "clamp(2.2rem,4.5vw,3.4rem)" }}>What happens when you build with us</h1></div>
        <div className="stack" style={{ gap: "1.25rem" }}>
          {[
            ["1. Choose your website type", "Personal ($20), Business ($30) or E-commerce ($100). Each has its own guided questions. The store setup is the most detailed because it covers products, stock, delivery, payments and policies."],
            ["2. Answer guided questions", "Add your bio, services or products, photos, contact details and preferences. Upload your own images, or choose openly licensed photos with attribution handled for you. Answers save automatically, so you can come back later."],
            ["3. Pick a template or paste an inspiration link", "Choose from 18 original templates (9 free to browse, 9 more for members). Or paste a website you admire: we read its high-level style (colours, fonts, spacing, shapes) using an automated browser where available, and apply it to an original design. We never copy text, images, logos or code."],
            ["4. Generate & preview", "Your site is built from your answers using our template engine. Optional AI can polish your wording, but it never adds facts. You review everything. Preview it privately on desktop, tablet and mobile."],
            ["5. Edit and refine", "Change text, images, colours, fonts and layout, reorder sections, add pages, or type requests like “use more space” or “make it more elegant”. Every change can be undone, and checkpoints are kept."],
            ["6. Pick your web address", "Choose the name for your site's address, for example /s/your-business. We check that it's free and set it up automatically with a secure https connection when you publish, so there's nothing to configure. Connecting a domain you already own is coming soon."],
            ["7. Publish", `Pay the one-time build fee and your site goes live instantly. Hosting and maintenance are then ${hostingPrice(config).label} per site per month, billed monthly once you agree to the plan, and you can cancel any time. Publishing is unlocked only by a confirmed payment.`],
            ["8. Manage", "Leads, quote requests and store orders arrive in your dashboard. Update your site at any time; earlier versions can be restored. Export your site whenever you like."],
          ].map(([h, d]) => <article className="card" key={h}><h2 style={{ fontSize: "1.25rem" }}>{h}</h2><p className="muted" style={{ margin: 0 }}>{d}</p></article>)}
        </div>
        <div className="alert info" style={{ marginTop: "2rem" }}><strong>Current stage:</strong> builder, previews, editing, path-based publishing, forms and store orders are live. Online card payments inside customer stores and custom domains are in development and are clearly marked as unavailable until ready.</div>
        <div className="center" style={{ marginTop: "2rem" }}><Link className="btn btn-primary btn-lg" to={me ? "/dashboard/new" : "/signup"}>Start your free preview</Link></div>
      </div>
    </main>
  );
}

export function Contact() {
  const { me, config } = useApp();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ category: params.get("topic") || "general", name: me?.name || "", email: me?.email || "", subject: "", message: "", referenceUrl: "", website: "" });
  const [t] = useState(Date.now());
  const [state, setState] = useState<{ ok?: string; err?: string; busy?: boolean }>({});
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ busy: true });
    try { const r = await api("/api/support", { body: { ...form, elapsed: Date.now() - t } }); setState({ ok: `${r.message} Reference: ${r.reference}` }); setForm({ ...form, subject: "", message: "", referenceUrl: "" }); }
    catch (er) { setState({ err: (er as Error).message }); }
  };
  const report = form.category === "ip_report" || form.category === "abuse_report";
  return (
    <main id="main" className="section">
      <div className="container grid-2" style={{ gap: "3rem", alignItems: "start" }}>
        <div>
          <span className="eyebrow">Contact &amp; support</span>
          <h1 style={{ fontSize: "clamp(2.2rem,4.5vw,3.2rem)" }}>We're here to help</h1>
          <p className="muted">Questions about building your site, billing, a refund, privacy, or a problem with content on a site we host? Send us a message and we'll reply by email, usually within 2 business days.</p>
          <div className="stack-sm" style={{ marginTop: "1.5rem" }}>
            <div className="card"><strong>Report content or copyright</strong><p className="muted small" style={{ margin: ".3rem 0 0" }}>Choose “Copyright / IP report” or “Abuse report”, include the exact page address and explain the issue. We review every report and can take sites offline.</p></div>
            <div className="card"><strong>Operator</strong><p className="muted small" style={{ margin: ".3rem 0 0" }}>{config?.operator.name}. {config?.operator.note}{config?.operator.supportEmail ? ` Email: ${config.operator.supportEmail}` : ""}</p></div>
          </div>
        </div>
        <form className="card stack" onSubmit={submit} noValidate>
          <Field label="Topic"><select value={form.category} onChange={set("category")}>{[["general", "General question"], ["sales", "Before buying"], ["billing", "Billing & refunds"], ["technical", "Technical help"], ["privacy", "Privacy / my data"], ["ip_report", "Copyright / IP report"], ["abuse_report", "Abuse report"]].map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
          <div className="grid-2" style={{ gap: "1rem" }}><Field label="Your name"><input required value={form.name} onChange={set("name")} autoComplete="name" maxLength={80} /></Field><Field label="Email"><input type="email" required value={form.email} onChange={set("email")} autoComplete="email" maxLength={200} /></Field></div>
          <Field label="Subject"><input required value={form.subject} onChange={set("subject")} maxLength={160} /></Field>
          {report && <Field label="Address of the page concerned" help="The full link to the page on a site we host."><input value={form.referenceUrl} onChange={set("referenceUrl")} placeholder="https://…/s/site-name/" maxLength={600} /></Field>}
          <Field label="Message"><textarea required value={form.message} onChange={set("message")} maxLength={5000} /></Field>
          <div style={{ position: "absolute", left: -10000 }} aria-hidden="true"><label>Leave empty<input tabIndex={-1} value={form.website} onChange={set("website")} autoComplete="off" /></label></div>
          {state.ok && <div className="alert ok" role="status">{state.ok}</div>}
          {state.err && <div className="alert err" role="alert">{state.err}</div>}
          <button className="btn btn-primary btn-lg" disabled={state.busy}>{state.busy ? <Spinner /> : null} Send message</button>
          <p className="tiny muted" style={{ margin: 0 }}>We use your details only to reply. See our <Link to="/privacy">Privacy Policy</Link>.</p>
        </form>
      </div>
    </main>
  );
}

export function NotFound() {
  return <main id="main" className="section"><div className="narrow center"><h1>Page not found</h1><p className="muted">The page you're looking for doesn't exist.</p><Link className="btn btn-primary" to="/">Go home</Link></div></main>;
}

export { Icon };
