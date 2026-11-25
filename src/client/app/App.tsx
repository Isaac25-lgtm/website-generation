import { useEffect, useRef, useState } from "react";
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { api, fmtDate, hostingPrice, useApp, useAsync, usd } from "../lib";
import { Icon, LoadingPage, Logo, Modal, SiteThumb, Spinner, ThemeToggle } from "../components/ui";
import { PLANS } from "../../shared/pricing";
import { OrdersManager, ProductsManager } from "./Store";
import { TemplateGallery } from "../pages/Marketing";

export function RequireAuth() {
  const { me, loading } = useApp();
  const loc = useLocation();
  if (loading) return <LoadingPage />;
  if (!me) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  return <Outlet />;
}

export function AppShell() {
  const { me, refresh } = useApp();
  const nav = useNavigate();
  return (
    <>
      <header className="app-head">
        <div className="container bar" style={{ width: "min(100% - 2rem, 1400px)" }}>
          <div className="row" style={{ gap: "1.5rem" }}><Logo to="/dashboard" small />
            <nav className="row" aria-label="App" style={{ gap: ".25rem" }}>
              <NavLink to="/dashboard" end className="btn btn-ghost btn-sm">My sites</NavLink>
              <NavLink to="/templates" className="btn btn-ghost btn-sm">Templates</NavLink>
              {me?.isAdmin && <NavLink to="/admin" className="btn btn-ghost btn-sm">Admin</NavLink>}
            </nav>
          </div>
          <div className="row">
            <ThemeToggle />
            <NavLink to="/account" className="btn btn-ghost btn-sm">{me?.name || me?.email}</NavLink>
            <button className="btn btn-sm" onClick={async () => { await api("/api/auth/logout", { body: {} }); await refresh(); nav("/"); }}>Sign out</button>
          </div>
        </div>
      </header>
      <main id="main"><Outlet /></main>
    </>
  );
}

const TYPE_LABEL: Record<string, string> = { personal: "Personal", business: "Business", ecommerce: "E-commerce" };

export function Dashboard() {
  const { data, loading, reload } = useAsync(() => api("/api/projects"), []);
  const { toast } = useApp();
  if (loading && !data) return <LoadingPage />;
  const projects: any[] = data?.projects ?? [];
  return (
    <div className="container app-main">
      <div className="page-title"><div><h1>Your websites</h1><p className="muted" style={{ margin: 0 }}>Build, preview, publish and manage.</p></div><Link className="btn btn-primary" to="/dashboard/new">+ New website</Link></div>
      <StartChoices compact={projects.length > 0} />
      {projects.length === 0 ? (
        <div className="empty"><div className="icon-badge" style={{ margin: "0 auto 1rem" }}>{Icon.spark}</div><h2 style={{ fontSize: "1.4rem" }}>Create your first website</h2><p className="muted">Answer a few questions and see your site in minutes. Free to preview.</p><Link className="btn btn-primary btn-lg" to="/dashboard/new">Start building</Link></div>
      ) : (
        <div className="grid-3">
          {projects.map((p) => (
            <article key={p.id} className="card project-card">
              {p.revision > 0 ? <SiteThumb src={`/preview/${p.id}/?r=${p.revision}`} title={`${p.name} preview`} /> : <div className="thumb" style={{ display: "grid", placeItems: "center", borderRadius: 12 }}><span className="muted small">Not generated yet</span></div>}
              <div className="row between"><h2 style={{ fontSize: "1.15rem", margin: 0 }}>{p.name}</h2><span className={`status ${p.status}`}>{p.status.replace(/_/g, " ")}</span></div>
              <div className="row small muted"><span className="badge">{TYPE_LABEL[p.type]} · {usd(p.price)}</span>{p.entitlement ? <span className="badge green">{p.entitlement === "admin_demo" ? "Demo access" : p.entitlement === "payment_test" ? "Paid (test)" : "Paid"}</span> : <span className="badge amber">Unpaid</span>}{p.newLeads > 0 && <span className="badge blue">{p.newLeads} new leads</span>}{p.pendingOrders > 0 && <span className="badge blue">{p.pendingOrders} new orders</span>}</div>
              {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="small" style={{ wordBreak: "break-all" }}>{p.url}</a>}
              <span className="tiny muted">Updated {fmtDate(p.updatedAt)}{p.lastPublishedAt ? ` · Published ${fmtDate(p.lastPublishedAt)}` : ""}</span>
              <div className="row">
                {p.revision > 0 ? <Link className="btn btn-primary btn-sm" to={`/projects/${p.id}/editor`}>Edit</Link> : <Link className="btn btn-primary btn-sm" to={`/projects/${p.id}/setup`}>Continue setup</Link>}
                <Link className="btn btn-sm" to={`/projects/${p.id}/publish`}>Publish</Link>
                {p.type === "ecommerce" && <Link className="btn btn-sm" to={`/projects/${p.id}/store`}>Store</Link>}
                {p.type !== "ecommerce" && <Link className="btn btn-sm" to={`/projects/${p.id}/leads`}>Leads</Link>}
                <button className="btn btn-sm btn-ghost" title="Duplicate" onClick={async () => { await api(`/api/projects/${p.id}/duplicate`, { body: {} }); toast("Duplicated"); reload(); }}>Duplicate</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

/** The two recommended ways to start a website, shown on the dashboard. */
function StartChoices({ compact }: { compact?: boolean }) {
  return (
    <section className={`start-choices${compact ? " compact" : ""}`} aria-label="Start a new website">
      <div>
        <h2>Start a new website</h2>
        <p className="muted small">The quickest way to a site you'll love: pick a template, or show us a website you like.</p>
      </div>
      <div className="start-grid">
        <Link className="start-card link" to="/templates"><strong>Choose a template</strong><span className="muted small">Browse complete designs for businesses, people and online stores, then press "Use template".</span></Link>
        <Link className="start-card link" to="/dashboard/new?start=inspiration"><strong>Share a website you love</strong><span className="muted small">Paste its link and we'll match its colours, fonts and layout, never its words or photos.</span></Link>
      </div>
    </section>
  );
}

export function NewProject() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  // The home-page intent (description + website you love) applies only when arriving from the home prompt, and only
  // for a few hours; it is cleared once a site is created, so a later project never inherits it.
  const intent = (() => { try { const i = JSON.parse(sessionStorage.getItem("is_intent") || "null"); return i && Date.now() - (i.at || 0) < 6 * 3600_000 ? i : null; } catch { return null; } })();
  const fromPrompt = params.get("from") === "prompt";
  const [type, setType] = useState<string>(params.get("type") || intent?.type || "business");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugState, setSlugState] = useState<{ checking?: boolean; available?: boolean; reason?: string; suggestion?: string }>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // The two recommended ways to start (owner, 25 Nov 2026): a template, or a website the customer loves.
  const [templateId, setTemplateId] = useState<string>(params.get("template") || "");
  const [templateName, setTemplateName] = useState<string>("");
  const [picking, setPicking] = useState(false);
  const [loveUrl, setLoveUrl] = useState<string>((fromPrompt && intent?.url) || "");
  const loveRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (params.get("start") === "inspiration") loveRef.current?.focus(); }, [params]);
  useEffect(() => {
    if (!templateId) { setTemplateName(""); return; }
    api("/api/templates").then((r) => {
      const t = (r.templates as { id: string; name: string; type: string }[]).find((x) => x.id === templateId);
      if (t && t.type === type) setTemplateName(t.name); else { setTemplateId(""); setTemplateName(""); } // a template only fits its own site type
    }).catch(() => undefined);
  }, [templateId, type]);
  const { config } = useApp();
  const hp = hostingPrice(config, type);
  const prompt: string = fromPrompt ? intent?.prompt || "" : "";
  const checkSeq = useRef(0);
  const toSlug = (v: string) => v.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/, "");
  useEffect(() => { if (!slugEdited) setSlug(toSlug(name)); }, [name, slugEdited]);
  useEffect(() => {
    if (slug.length < 3) { setSlugState({}); return; }
    setSlugState({ checking: true });
    const seq = ++checkSeq.current;
    const t = setTimeout(() => { api(`/api/projects/slug-available?slug=${encodeURIComponent(slug)}`).then((r) => {
      if (seq !== checkSeq.current) return; // a newer address was typed; ignore this older answer
      // Auto-suggested address taken? Switch to the free alternative. Typed by hand? Offer it instead.
      if (!r.available && r.suggestion && !slugEdited) { setSlug(r.suggestion); return; }
      setSlugState({ available: r.available, reason: r.reason, suggestion: r.suggestion });
    }).catch(() => { if (seq === checkSeq.current) setSlugState({}); }); }, 350);
    return () => clearTimeout(t);
  }, [slug, slugEdited]);
  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    const answers: Record<string, unknown> = {};
    if (prompt) {
      if (type === "personal") answers.bio = prompt; else answers.description = prompt.slice(0, 400);
      if (type !== "personal" && prompt.length > 400) answers.about = prompt;
    }
    if (type === "personal") answers.name = name; else if (type === "business") answers.businessName = name; else answers.storeName = name;
    const love = loveUrl.trim();
    if (love) answers.inspiration = { url: /^https?:\/\//i.test(love) ? love : `https://${love}`, notes: "" };
    if (!slugState.available) { setErr("Choose an available web address first."); setBusy(false); return; }
    try {
      // Send exactly the address shown; the server refuses it (rather than inventing another) if it was just taken.
      const r = await api("/api/projects", { body: { type, name, slug, templateId: templateId || undefined, answers } });
      sessionStorage.removeItem("is_intent");
      nav(`/projects/${r.id}/setup`);
    } catch (er) { setErr((er as Error).message); setBusy(false); }
  };
  return (
    <div className="narrow app-main">
      <Link to="/dashboard" className="small">← Back</Link>
      <h1 style={{ fontSize: "2rem", marginTop: ".75rem" }}>What are you building?</h1>
      {prompt && <div className="alert info small" style={{ marginBottom: "1rem" }}>We'll start from your description: “{prompt.slice(0, 160)}{prompt.length > 160 ? "…" : ""}”</div>}
      <form className="stack" onSubmit={create}>
        <div className="type-pick" role="group" aria-label="Website type">
          {Object.values(PLANS).map((p) => (
            <button type="button" key={p.type} aria-pressed={type === p.type} onClick={() => setType(p.type)}>
              <div className="row between"><strong>{p.name}</strong><span className="p">{usd(p.priceCents)}</span></div>
              <p className="muted small" style={{ margin: ".5rem 0 0" }}>{p.summary}</p>
            </button>
          ))}
        </div>
        <fieldset className="start-pick">
          <legend>How would you like to start?</legend>
          <p className="muted small">Choose a template, share the link of a website you love, or both: the template sets the layout and the website you love sets the colours and fonts. You can change either later.</p>
          <div className="start-grid">
            <div className={`start-card${templateId ? " on" : ""}`}>
              <strong>1. Choose a template</strong>
              <p className="muted small">Browse complete {type === "ecommerce" ? "online store" : type} designs and pick the one closest to what you want.</p>
              {templateId ? <p className="small"><span className="badge green">Selected: {templateName || "template"}</span></p> : null}
              <div className="row" style={{ gap: ".4rem" }}>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setPicking(true)}>{templateId ? "Change template" : "Browse templates"}</button>
                {templateId && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTemplateId("")}>Clear</button>}
              </div>
            </div>
            <div className={`start-card${loveUrl.trim() ? " on" : ""}`}>
              <strong>2. Share a website you love</strong>
              <p className="muted small">Paste its link and we'll match its style: colours, fonts and layout. We never copy its words, photos or logo.</p>
              <input ref={loveRef} type="url" inputMode="url" aria-label="Link to a website you love" placeholder="e.g. www.example.com" maxLength={300} value={loveUrl} onChange={(e) => setLoveUrl(e.target.value)} />
            </div>
          </div>
          {!templateId && !loveUrl.trim() && <p className="help">Not sure yet? Continue, and we'll recommend templates from your answers.</p>}
        </fieldset>
        {picking && (
          <Modal title={`Choose a ${type === "ecommerce" ? "store" : type} template`} wide onClose={() => setPicking(false)}>
            <TemplateGallery embedded type={type} selected={templateId} onPick={(id) => { setTemplateId(id); setPicking(false); }} />
          </Modal>
        )}
        <label className="field"><span>{type === "personal" ? "Your name" : type === "business" ? "Business name" : "Store name"}</span><input required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} autoFocus /></label>
        <div className="field">
          <span>Your web address</span>
          <div className="row" style={{ gap: 0, flexWrap: "nowrap" }}>
            <span className="small muted" style={{ padding: ".6rem .6rem .6rem .75rem", background: "var(--soft)", border: "1px solid var(--line-2)", borderRight: 0, borderRadius: "10px 0 0 10px", whiteSpace: "nowrap" }}>{location.host}/s/</span>
            <input aria-label="Web address" value={slug} maxLength={40} style={{ borderRadius: "0 10px 10px 0" }} onChange={(e) => { setSlugEdited(true); setSlug(toSlug(e.target.value) + (e.target.value.endsWith("-") ? "-" : "")); }} placeholder="your-business" />
          </div>
          <span className="help" aria-live="polite" style={{ color: slugState.available === false ? "var(--err)" : slugState.available ? "var(--ok)" : undefined }}>
            {slug.length < 3 ? "At least 3 letters or numbers." : slugState.checking ? "Checking…" : slugState.available ? `Available. We'll set it up for you automatically, with https, when you publish.` : slugState.reason || ""}
            {slugState.available === false && slugState.suggestion && <> <button type="button" className="btn btn-sm btn-outline" style={{ marginLeft: ".4rem" }} onClick={() => setSlug(slugState.suggestion!)}>Use {slugState.suggestion}</button></>}
          </span>
          <span className="help">Connecting a domain you own (like yourbusiness.com) is coming soon.</span>
        </div>
        <p className="muted small" style={{ margin: 0 }}>Free to build and preview. When you publish: a one-time {usd(PLANS[type as keyof typeof PLANS].priceCents)} build fee, then {hp.label} per {hp.interval} for hosting &amp; maintenance.</p>
        {err && <div className="alert err">{err}</div>}
        <button className="btn btn-primary btn-lg" disabled={busy || !name.trim() || !slugState.available || slugState.checking}>{busy && <Spinner />} Continue</button>
      </form>
    </div>
  );
}

export function Publish() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { toast, config, ask } = useApp();
  const { data, reload } = useAsync(() => api(`/api/projects/${id}`), [id]);
  const vers = useAsync(() => api(`/api/projects/${id}/versions`), [id]);
  const [rights, setRights] = useState(false);
  const [aiAck, setAiAck] = useState(false);
  const [busy, setBusy] = useState("");
  const [problems, setProblems] = useState<string[]>([]);
  const [share, setShare] = useState<string | null>(null);
  useEffect(() => { if (params.get("checkout")) { toast("Returned from checkout. Publishing unlocks as soon as the payment is confirmed (usually a few seconds)."); const t = setInterval(() => reload(), 4000); setTimeout(() => clearInterval(t), 40000); return () => clearInterval(t); } }, []);
  if (!data) return <LoadingPage />;
  const p = data.project;
  const plan = PLANS[p.type as keyof typeof PLANS];
  const hasAi = data.doc?.pages?.some((pg: any) => pg.sections.some((s: any) => s.aiSuggested));
  const paid = !!data.entitlement && !data.entitlement.invalidInThisMode;
  const run = async (what: string, fn: () => Promise<void>) => { setBusy(what); try { await fn(); } catch (e: any) { toast(e.message, "err"); if (e.data?.problems) setProblems(e.data.problems); } setBusy(""); };
  return (
    <div className="container app-main">
      <div className="page-title"><div><Link to="/dashboard" className="small">← All sites</Link><h1>Publish “{p.name}”</h1></div><div className="row"><Link className="btn" to={`/projects/${id}/editor`}>Back to editor</Link></div></div>
      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="stack">
          <div className="card stack">
            <div className="row between"><h2 style={{ fontSize: "1.25rem", margin: 0 }}>1. Payment</h2>{paid ? <span className="badge green">✓ {data.entitlement.source === "admin_demo" ? "Demo access granted" : data.entitlement.source === "payment_test" ? "Paid (test mode)" : "Paid"}</span> : <span className="badge amber">Not paid</span>}</div>
            <p className="muted" style={{ margin: 0 }}>{plan.name}: <b>{usd(plan.priceCents)} USD, one-time</b>. Covers publishing this site, unlimited edits and republishing.</p>
            {!paid && (data.payments.configured ? (
              <>
                {data.payments.mode === "test" && <div className="alert warn small">Checkout is in <b>TEST mode</b>. Use the provider's test card. No real money moves.</div>}
                <button className="btn btn-primary btn-lg" disabled={!!busy} onClick={() => run("pay", async () => { const r = await api(`/api/billing/projects/${id}/checkout`, { body: {} }); window.location.href = r.checkoutUrl; })}>{busy === "pay" && <Spinner />} Pay {usd(plan.priceCents)} securely</button>
              </>
            ) : (
              <div className="alert info small"><b>Online checkout is opening soon.</b> Your site is saved and you can keep editing and sharing previews. We're completing payment-provider verification, and you'll be able to pay and publish as soon as it's live. Questions? <Link to="/contact?topic=sales">Contact us</Link>.</div>
            ))}
            {params.get("checkout") && !paid && <div className="alert info small"><Spinner /> Waiting for payment confirmation from the provider…</div>}
          </div>
          <div className="card stack">
            <h2 style={{ fontSize: "1.25rem", margin: 0 }}>2. Confirm & publish</h2>
            {data.doc && (
              <div className="stack-sm">
                <span className="small"><b>Light or dark?</b> Choose how your site looks before you publish. You can change it again at any time.</span>
                <div className="seg" role="group" aria-label="Colour mode" style={{ justifySelf: "start" }}>{(["light", "dark"] as const).map((m) => <button key={m} aria-pressed={data.doc.theme.mode === m} disabled={!!busy} onClick={() => data.doc.theme.mode !== m && run("mode", async () => { const { switchMode } = await import("../../shared/refine"); await api(`/api/projects/${id}/draft`, { method: "PUT", body: { doc: switchMode(data.doc, m), baseRevision: p.revision } }); toast(m === "dark" ? "Your site now has a dark look" : "Your site now has a light look"); reload(); })}>{m === "light" ? "Light" : "Dark"}</button>)}</div>
                <span className="tiny muted">To see it first, open the editor or create a private preview link below.</span>
              </div>
            )}
            {!p.contentRightsAck && <label className="check"><input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} /> I own or have permission to use all content and images on this site.</label>}
            {hasAi && <label className="check"><input type="checkbox" checked={aiAck} onChange={(e) => setAiAck(e.target.checked)} /> I've reviewed the AI-suggested text and confirm it's accurate.</label>}
            {problems.length > 0 && <div className="alert warn"><b>Before publishing:</b><ul style={{ margin: ".4rem 0 0" }}>{problems.map((x) => <li key={x}>{x}</li>)}</ul></div>}
            <div className="row">
              <button className="btn btn-primary btn-lg" disabled={!paid || !!busy || (!p.contentRightsAck && !rights) || (hasAi && !aiAck)} onClick={() => run("pub", async () => { setProblems([]); const r = await api(`/api/projects/${id}/publish`, { body: { contentRightsAck: rights || p.contentRightsAck, aiReviewAck: aiAck } }); toast(`Published version ${r.version}!`); reload(); vers.reload(); })}>{busy === "pub" && <Spinner />} {data.publish?.status === "live" ? "Publish latest changes" : "Publish site"}</button>
              {data.publish?.status === "live" && <button className="btn btn-danger" disabled={!!busy || p.isDemo} onClick={async () => (await ask({ title: "Take this site offline?", message: "Visitors will see a \"not published\" page until you publish again. Your content is kept.", confirmLabel: "Unpublish", danger: true })) !== null && run("unpub", async () => { await api(`/api/projects/${id}/unpublish`, { body: {} }); toast("Site unpublished"); reload(); })}>Unpublish</button>}
            </div>
            {data.publish?.status === "live" && <div className="alert ok">Live at <a href={data.publish.url} target="_blank" rel="noreferrer"><b>{data.publish.url}</b></a></div>}
          </div>
          <div className="card stack-sm">
            <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Share a private preview</h2>
            <p className="muted small" style={{ margin: 0 }}>Anyone with the link can view your unpublished draft for 7 days. It's watermarked and hidden from search engines.</p>
            <div className="row"><button className="btn btn-sm" onClick={() => run("share", async () => { const r = await api(`/api/projects/${id}/preview-link`, { body: {} }); setShare(r.url); })}>Create preview link</button>{share && <><input className="input" readOnly value={share} style={{ flex: 1 }} aria-label="Preview link" onFocus={(e) => e.target.select()} /><button className="btn btn-sm" onClick={() => { navigator.clipboard?.writeText(share); toast("Copied"); }}>Copy</button></>}</div>
          </div>
        </div>
        <div className="stack">
          <div className="card stack-sm">
            <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Site address</h2>
            <SlugEditor id={id!} slug={p.slug} onSaved={reload} />
            <p className="tiny muted" style={{ margin: 0 }}>Your free address: {location.origin}/s/{p.slug}/</p>
          </div>
          <div className="card stack-sm">
            <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Custom domain</h2>
            <DomainBox id={id!} />
          </div>
          <div className="card stack-sm">
            <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Published versions</h2>
            {!vers.data ? <Spinner /> : vers.data.versions.length === 0 ? <p className="muted small" style={{ margin: 0 }}>Nothing published yet.</p> : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }} className="stack-sm">{vers.data.versions.map((v: any) => (
                <li key={v.id} className="row between small"><span>v{v.version} · {fmtDate(v.created_at)} {v.id === vers.data.current && vers.data.status === "live" ? <span className="badge green">live</span> : null}</span>
                  {v.id !== vers.data.current && paid && <button className="btn btn-sm" onClick={async () => (await ask({ title: `Restore version ${v.version}?`, message: "This version becomes the live site straight away. You can restore a newer version at any time.", confirmLabel: "Restore" })) !== null && run("rb", async () => { await api(`/api/projects/${id}/versions/${v.id}/rollback`, { body: {} }); toast(`Version ${v.version} is live again`); vers.reload(); reload(); })}>Restore</button>}</li>
              ))}</ul>
            )}
          </div>
          <div className="card stack-sm">
            <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Export</h2>
            <p className="muted small" style={{ margin: 0 }}>Download a copy of your website as one ZIP file: the web pages, your images and your content. Keep it as a backup, or upload the pages to any other web host. Your site here keeps working either way.</p>
            <a className="btn btn-sm" style={{ justifySelf: "start" }} href={`/api/projects/${id}/export`}>Download a copy (ZIP)</a>
          </div>
          <PaymentsHistory id={id!} />
          {config && <p className="tiny muted">Hosting &amp; maintenance: {hostingPrice(config, p.type).label} per site per {hostingPrice(config, p.type).interval}. {hostingPrice(config, p.type).notice}</p>}
        </div>
      </div>
    </div>
  );
}

function PaymentsHistory({ id }: { id: string }) {
  const { data } = useAsync(() => api(`/api/billing/projects/${id}/payments`), [id]);
  if (!data || (!data.payments.length && !data.checkouts.length)) return null;
  return <div className="card stack-sm"><h2 style={{ fontSize: "1.1rem", margin: 0 }}>Payment history</h2>{data.payments.map((p: any, i: number) => <div key={i} className="small row between"><span>{fmtDate(p.created_at)} · {p.mode}</span><span>{usd(p.amount_cents)} · <b>{p.status}</b></span></div>)}{data.checkouts.filter((c: any) => c.status !== "completed").slice(0, 3).map((c: any) => <div key={c.id} className="tiny muted">Checkout {c.status} · {fmtDate(c.created_at)}</div>)}</div>;
}

function SlugEditor({ id, slug, onSaved }: { id: string; slug: string; onSaved: () => void }) {
  const [v, setV] = useState(slug);
  const { toast } = useApp();
  return <form className="row" onSubmit={async (e) => { e.preventDefault(); try { await api(`/api/projects/${id}`, { method: "PATCH", body: { slug: v } }); toast("Address updated"); onSaved(); } catch (er) { toast((er as Error).message, "err"); } }}><span className="small muted">/s/</span><input className="input" style={{ flex: 1 }} value={v} onChange={(e) => setV(e.target.value.toLowerCase())} aria-label="Site address" /><button className="btn btn-sm" disabled={v === slug}>Save</button></form>;
}

function DomainBox({ id }: { id: string }) {
  const { data, reload } = useAsync(() => api(`/api/projects/${id}/domains`), [id]);
  const [host, setHost] = useState("");
  const { toast } = useApp();
  if (!data) return <Spinner />;
  return (
    <div className="stack-sm">
      <div className="alert info small">{data.note}</div>
      {data.domains.map((d: any) => <div key={d.id} className="small row between"><span>{d.hostname}</span><span className="badge">Not available yet</span></div>)}
      <form className="row" onSubmit={async (e) => { e.preventDefault(); try { await api(`/api/projects/${id}/domains`, { body: { hostname: host } }); setHost(""); toast("Saved. We'll notify you when custom domains launch."); reload(); } catch (er) { toast((er as Error).message, "err"); } }}>
        <input className="input" style={{ flex: 1 }} placeholder="www.yourdomain.com" value={host} onChange={(e) => setHost(e.target.value)} aria-label="Domain you own" /><button className="btn btn-sm">Register interest</button>
      </form>
    </div>
  );
}

export function Leads() {
  const { id } = useParams();
  const { data, reload } = useAsync(() => api(`/api/projects/${id}/leads`), [id]);
  const proj = useAsync(() => api(`/api/projects/${id}`), [id]);
  const mark = async (lid: string, kind: string, status: string) => { await api(`/api/projects/${id}/leads/${lid}`, { method: "PATCH", body: { kind, status } }); reload(); };
  if (!data) return <LoadingPage />;
  return (
    <div className="container app-main">
      <div className="page-title"><div><Link to="/dashboard" className="small">← All sites</Link><h1>Leads · {proj.data?.project.name}</h1></div></div>
      {!proj.data?.publish && <div className="alert info small" style={{ marginBottom: "1rem" }}>Forms start collecting messages once your site is published.</div>}
      <h2 style={{ fontSize: "1.2rem" }}>Messages ({data.leads.length})</h2>
      {data.leads.length === 0 ? <p className="muted">No messages yet.</p> : <div className="stack-sm">{data.leads.map((l: any) => (
        <article key={l.id} className="card stack-sm" style={{ opacity: l.status === "archived" ? .6 : 1 }}>
          <div className="row between"><strong>{l.name}</strong><span className="tiny muted">{fmtDate(l.created_at)} {l.status === "new" && <span className="badge blue">new</span>}</span></div>
          <div className="small">{l.email && <a href={`mailto:${l.email}`}>{l.email}</a>} {l.phone && <> · <a href={`tel:${l.phone}`}>{l.phone}</a></>}</div>
          <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{l.message}</p>
          <div className="row">{l.status !== "read" && <button className="btn btn-sm" onClick={() => mark(l.id, "contact", "read")}>Mark read</button>}{l.status !== "archived" && <button className="btn btn-sm btn-ghost" onClick={() => mark(l.id, "contact", "archived")}>Archive</button>}</div>
        </article>))}</div>}
      <h2 style={{ fontSize: "1.2rem", marginTop: "2rem" }}>Quote requests ({data.quotes.length})</h2>
      {data.quotes.length === 0 ? <p className="muted">No quote requests yet.</p> : <div className="stack-sm">{data.quotes.map((q: any) => (
        <article key={q.id} className="card stack-sm" style={{ opacity: q.status === "archived" ? .6 : 1 }}>
          <div className="row between"><strong>{q.name}{q.service ? ` · ${q.service}` : ""}</strong><span className="tiny muted">{fmtDate(q.created_at)} {q.status === "new" && <span className="badge blue">new</span>}</span></div>
          <div className="small">{q.email && <a href={`mailto:${q.email}`}>{q.email}</a>} {q.phone && <> · <a href={`tel:${q.phone}`}>{q.phone}</a></>} {q.budget && <> · Budget: {q.budget}</>} {q.timeline && <> · Timeline: {q.timeline}</>}</div>
          <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{q.details}</p>
          <div className="row">{q.status !== "read" && <button className="btn btn-sm" onClick={() => mark(q.id, "quote", "read")}>Mark read</button>}{q.status !== "archived" && <button className="btn btn-sm btn-ghost" onClick={() => mark(q.id, "quote", "archived")}>Archive</button>}</div>
        </article>))}</div>}
    </div>
  );
}

export function StorePage() {
  const { id } = useParams();
  const [tab, setTab] = useState<"products" | "orders">("orders");
  const { data } = useAsync(() => api(`/api/projects/${id}`), [id]);
  if (!data) return <LoadingPage />;
  const currency = data.doc?.store?.currency || data.intake.answers.currency || "USD";
  return (
    <div className="container app-main">
      <div className="page-title"><div><Link to="/dashboard" className="small">← All sites</Link><h1>Store · {data.project.name}</h1></div><div className="row"><Link className="btn" to={`/projects/${id}/editor`}>Edit design</Link>{data.publish?.status === "live" && <a className="btn" href={data.publish.url} target="_blank" rel="noreferrer">View store</a>}</div></div>
      <div className="tabs" role="tablist"><button role="tab" aria-selected={tab === "orders"} onClick={() => setTab("orders")}>Orders</button><button role="tab" aria-selected={tab === "products"} onClick={() => setTab("products")}>Products &amp; categories</button></div>
      {tab === "orders" ? <OrdersManager projectId={id!} /> : <ProductsManager projectId={id!} currency={currency} />}
    </div>
  );
}

export function Account() {
  const { me, refresh, toast } = useApp();
  const [name, setName] = useState(me?.name || "");
  const [pw, setPw] = useState({ current: "", next: "" });
  const [del, setDel] = useState(false);
  return (
    <div className="narrow app-main stack">
      <h1 style={{ fontSize: "2rem" }}>Account</h1>
      <form className="card stack" onSubmit={async (e) => { e.preventDefault(); try { await api("/api/account", { method: "PATCH", body: { name } }); await refresh(); toast("Saved"); } catch (er) { toast((er as Error).message, "err"); } }}>
        <h2 style={{ fontSize: "1.15rem" }}>Profile</h2>
        <div className="small muted">Email: {me?.email} {me?.google && <span className="badge">Google sign-in</span>} {me?.emailVerified && <span className="badge green">verified</span>}</div>
        <label className="field"><span>Name</span><input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></label>
        <button className="btn btn-primary" style={{ justifySelf: "start" }}>Save</button>
      </form>
      <form className="card stack" onSubmit={async (e) => { e.preventDefault(); try { await api("/api/account/password", { body: pw }); setPw({ current: "", next: "" }); toast("Password updated"); } catch (er) { toast((er as Error).message, "err"); } }}>
        <h2 style={{ fontSize: "1.15rem" }}>{me?.hasPassword ? "Change password" : "Set a password"}</h2>
        {me?.hasPassword && <label className="field"><span>Current password</span><input type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></label>}
        <label className="field"><span>New password</span><input type="password" autoComplete="new-password" minLength={10} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></label>
        <button className="btn" style={{ justifySelf: "start" }}>Update password</button>
      </form>
      <div className="card stack-sm">
        <h2 style={{ fontSize: "1.15rem" }}>Your data</h2>
        <p className="muted small" style={{ margin: 0 }}>Download a copy of your account data, or ask us to delete your account and sites.</p>
        <div className="row"><a className="btn btn-sm" href="/api/account/export">Download my data</a><button className="btn btn-sm btn-danger" onClick={() => setDel(true)}>Request account deletion</button></div>
      </div>
      {del && <Modal title="Delete your account?" onClose={() => setDel(false)}><p>This takes down your published sites and deletes your data after we confirm the request. Payment records required by law are kept. Export anything you need first.</p><div className="row"><button className="btn" onClick={() => setDel(false)}>Cancel</button><button className="btn btn-danger" onClick={async () => { const r = await api("/api/account/delete-request", { body: {} }); toast(r.message); setDel(false); }}>Request deletion</button></div></Modal>}
    </div>
  );
}
