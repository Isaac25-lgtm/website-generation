import { useState } from "react";
import { Navigate } from "react-router";
import { api, fmtDate, money, useApp, useAsync, usd } from "../lib";
import { LoadingPage, Spinner } from "../components/ui";

const TABS = ["overview", "projects", "users", "tickets", "payments", "orders", "settings", "audit"] as const;

export default function Admin() {
  const { me } = useApp();
  const [tab, setTab] = useState<(typeof TABS)[number]>("overview");
  if (!me?.isAdmin) return <Navigate to="/dashboard" replace />;
  return (
    <div className="container app-main" style={{ width: "min(100% - 2rem, 1400px)" }}>
      <div className="page-title"><h1>Admin</h1><span className="badge red">Restricted · all actions are audited</span></div>
      <div className="tabs" role="tablist">{TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}</div>
      {tab === "overview" && <Overview />}
      {tab === "projects" && <Projects />}
      {tab === "users" && <Users />}
      {tab === "tickets" && <Tickets />}
      {tab === "payments" && <Payments />}
      {tab === "orders" && <Orders />}
      {tab === "settings" && <Settings />}
      {tab === "audit" && <Audit />}
    </div>
  );
}

function Overview() {
  const { data } = useAsync(() => api("/api/admin/overview"), []);
  if (!data) return <LoadingPage />;
  const stat = (l: string, v: React.ReactNode) => <div className="card"><span className="muted small">{l}</span><div style={{ font: "700 1.8rem var(--font-h)" }}>{v}</div></div>;
  const gen = data.generation.reduce((a: any, g: any) => ({ n: a.n + g.n, tin: a.tin + g.tin, tout: a.tout + g.tout }), { n: 0, tin: 0, tout: 0 });
  return (
    <div className="stack">
      <div className="grid-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        {stat("Users", `${data.users} (${data.usersLast30} in 30d)`)}
        {stat("Live customer sites", data.liveSites)}
        {stat("Real store orders", data.realOrders)}
        {stat("Generation jobs (30d)", `${gen.n} · ${gen.tin + gen.tout} tokens`)}
        {stat("Media stored", data.media.map((m: any) => `${(m.b / 1048576).toFixed(1)} MB in ${m.storage}`).join(", ") || "0")}
        {stat("Failed inspirations (30d)", data.failedInspirations30)}
      </div>
      <div className="grid-2">
        <div className="card"><h3>Projects by type/status</h3><table className="table"><tbody>{data.projects.map((p: any, i: number) => <tr key={i}><td>{p.site_type}</td><td>{p.status}</td><td>{p.n}</td></tr>)}</tbody></table></div>
        <div className="card"><h3>Payments</h3>{data.payments.length ? <table className="table"><tbody>{data.payments.map((p: any, i: number) => <tr key={i}><td>{p.mode}</td><td>{p.status}</td><td>{p.n}</td><td>{usd(p.cents)}</td></tr>)}</tbody></table> : <p className="muted small">No payments recorded.</p>}
          <h3 style={{ marginTop: "1rem" }}>Webhooks</h3>{data.webhooks.length ? data.webhooks.map((w: any) => <span key={w.status} className="badge" style={{ marginRight: 4 }}>{w.status}: {w.n}</span>) : <p className="muted small">None received.</p>}</div>
        <div className="card"><h3>Support tickets</h3>{data.tickets.map((t: any) => <span key={t.status} className="badge" style={{ marginRight: 4 }}>{t.status}: {t.n}</span>)}</div>
        <div className="card"><h3>Recent errors</h3>{data.recentErrors.length ? <ul className="small">{data.recentErrors.map((e: any) => <li key={e.id}>{fmtDate(e.created_at)} {e.route}: {e.message}</li>)}</ul> : <p className="muted small">No errors logged.</p>}</div>
      </div>
    </div>
  );
}

function Projects() {
  const { toast } = useApp();
  const [q, setQ] = useState("");
  const { data, reload } = useAsync(() => api(`/api/admin/projects?q=${encodeURIComponent(q)}`), [q]);
  const grant = async (id: string) => { const reason = prompt("Reason for demo entitlement (audited):"); if (!reason) return; try { await api(`/api/admin/projects/${id}/entitlement`, { body: { reason } }); toast("Demo entitlement granted"); reload(); } catch (e) { toast((e as Error).message, "err"); } };
  const suspend = async (id: string, s: boolean) => { const reason = prompt(s ? "Reason for suspension:" : "Reason for reinstating:"); if (!reason) return; try { await api(`/api/admin/projects/${id}/suspend`, { body: { reason, suspend: s } }); toast("Done"); reload(); } catch (e) { toast((e as Error).message, "err"); } };
  return (
    <div className="stack">
      <input className="input" style={{ maxWidth: 320 }} placeholder="Search name, address or owner email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search projects" />
      {!data ? <Spinner /> : <div className="table-wrap"><table className="table"><thead><tr><th>Project</th><th>Owner</th><th>Type</th><th>Status</th><th>Entitlement</th><th></th></tr></thead><tbody>
        {data.projects.map((p: any) => <tr key={p.id}><td><b>{p.name}</b>{p.is_demo ? <span className="badge amber" style={{ marginLeft: 4 }}>demo</span> : null}<div className="tiny muted">/s/{p.slug}/</div></td><td className="small">{p.owner}</td><td>{p.site_type}</td><td>{p.status}{p.pub_status ? ` · ${p.pub_status}` : ""}</td><td>{p.entitlement || "—"}</td>
          <td className="row" style={{ gap: 4 }}>{!p.entitlement && <button className="btn btn-sm" onClick={() => grant(p.id)}>Grant demo</button>}{p.entitlement === "admin_demo" && !p.is_demo && <button className="btn btn-sm" onClick={async () => { await api(`/api/admin/projects/${p.id}/entitlement`, { method: "DELETE" }); reload(); }}>Revoke demo</button>}{p.status === "suspended" ? <button className="btn btn-sm" onClick={() => suspend(p.id, false)}>Reinstate</button> : <button className="btn btn-sm btn-danger" onClick={() => suspend(p.id, true)}>Suspend</button>}{p.pub_status === "live" && <a className="btn btn-sm" href={`/s/${p.slug}/`} target="_blank" rel="noreferrer">View</a>}</td></tr>)}
      </tbody></table></div>}
    </div>
  );
}

function Users() {
  const { toast } = useApp();
  const [q, setQ] = useState("");
  const { data, reload } = useAsync(() => api(`/api/admin/users?q=${encodeURIComponent(q)}`), [q]);
  return (
    <div className="stack">
      <input className="input" style={{ maxWidth: 320 }} placeholder="Search users" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search users" />
      {!data ? <Spinner /> : <div className="table-wrap"><table className="table"><thead><tr><th>User</th><th>Sign-in</th><th>Projects</th><th>Joined</th><th>Status</th><th></th></tr></thead><tbody>
        {data.users.map((u: any) => <tr key={u.id}><td><b>{u.name || "—"}</b><div className="small">{u.email}</div>{u.role === "admin" && <span className="badge red">admin</span>}</td><td className="small">{u.google ? "Google" : "Email"}{u.email_verified ? " · verified" : ""}</td><td>{u.projects}</td><td className="small">{fmtDate(u.created_at)}</td><td>{u.status}</td>
          <td className="row" style={{ gap: 4 }}><button className="btn btn-sm" onClick={async () => { if (!confirm("Create a password reset link for this user? Only send it to the verified account holder.")) return; const r = await api(`/api/admin/users/${u.id}/reset-link`, { body: {} }); prompt("Reset link (expires in 24h):", r.url); }}>Reset link</button>
            <button className="btn btn-sm btn-danger" onClick={async () => { try { await api(`/api/admin/users/${u.id}`, { method: "PATCH", body: { status: u.status === "active" ? "suspended" : "active" } }); reload(); } catch (e) { toast((e as Error).message, "err"); } }}>{u.status === "active" ? "Suspend" : "Activate"}</button></td></tr>)}
      </tbody></table></div>}
    </div>
  );
}

function Tickets() {
  const { data, reload } = useAsync(() => api("/api/admin/tickets"), []);
  if (!data) return <Spinner />;
  return (
    <div className="stack-sm">
      {data.tickets.length === 0 && <p className="muted">No tickets.</p>}
      {data.tickets.map((t: any) => (
        <article key={t.id} className="card stack-sm">
          <div className="row between"><strong>{t.subject}</strong><span className="row"><span className={`badge ${t.category.includes("report") ? "red" : "blue"}`}>{t.category}</span><span className="badge">{t.status}</span></span></div>
          <div className="small">{t.name} · <a href={`mailto:${t.email}?subject=${encodeURIComponent("Re: " + t.subject)}`}>{t.email}</a> · {fmtDate(t.created_at)} · ref {t.id.slice(-8).toUpperCase()}</div>
          {t.reference_url && <div className="small">Page: <a href={t.reference_url} target="_blank" rel="noreferrer">{t.reference_url}</a></div>}
          <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{t.message}</p>
          {t.admin_note && <p className="small muted">Note: {t.admin_note}</p>}
          <div className="row">{["in_progress", "resolved", "closed"].filter((s) => s !== t.status).map((s) => <button key={s} className="btn btn-sm" onClick={async () => { await api(`/api/admin/tickets/${t.id}`, { method: "PATCH", body: { status: s, adminNote: prompt("Internal note (optional)") || undefined } }); reload(); }}>Mark {s.replace("_", " ")}</button>)}</div>
        </article>
      ))}
    </div>
  );
}

function Payments() {
  const { data } = useAsync(() => api("/api/admin/payments"), []);
  if (!data) return <Spinner />;
  return (
    <div className="stack">
      <h3>Payments</h3>{data.payments.length ? <div className="table-wrap"><table className="table"><thead><tr><th>When</th><th>User</th><th>Mode</th><th>Amount</th><th>Status</th></tr></thead><tbody>{data.payments.map((p: any) => <tr key={p.id}><td className="small">{fmtDate(p.created_at)}</td><td className="small">{p.email}</td><td>{p.mode}</td><td>{money(p.amount_cents, p.currency)}</td><td>{p.status}</td></tr>)}</tbody></table></div> : <p className="muted">None yet.</p>}
      <h3>Checkout sessions</h3>{data.checkouts.length ? <div className="table-wrap"><table className="table"><tbody>{data.checkouts.map((c: any) => <tr key={c.id}><td className="small">{fmtDate(c.created_at)}</td><td>{c.site_type}</td><td>{usd(c.amount_cents)}</td><td>{c.mode}</td><td>{c.status}</td></tr>)}</tbody></table></div> : <p className="muted">None yet.</p>}
      <h3>Webhook events</h3>{data.webhooks.length ? <div className="table-wrap"><table className="table"><tbody>{data.webhooks.map((w: any) => <tr key={w.id}><td className="small">{fmtDate(w.received_at)}</td><td>{w.event_type}</td><td>{w.status}</td><td className="small">{w.error}</td></tr>)}</tbody></table></div> : <p className="muted">None received.</p>}
    </div>
  );
}

function Orders() {
  const { data } = useAsync(() => api("/api/admin/orders"), []);
  if (!data) return <Spinner />;
  return data.orders.length ? <div className="table-wrap"><table className="table"><thead><tr><th>When</th><th>Store</th><th>#</th><th>Total</th><th>Status</th><th>Payment</th></tr></thead><tbody>{data.orders.map((o: any) => <tr key={o.id}><td className="small">{fmtDate(o.created_at)}</td><td>{o.store}{o.is_demo ? <span className="badge amber" style={{ marginLeft: 4 }}>demo</span> : null}</td><td>{o.number}</td><td>{money(o.total_cents, o.currency)}</td><td>{o.status}</td><td>{o.payment_status}</td></tr>)}</tbody></table></div> : <p className="muted">No orders.</p>;
}

function Settings() {
  const { toast } = useApp();
  const { data, reload } = useAsync(() => api("/api/admin/settings"), []);
  const [vals, setVals] = useState<Record<string, string> | null>(null);
  if (!data) return <Spinner />;
  const cur = vals ?? Object.fromEntries(data.settings.filter((s: any) => !s.key.startsWith("demo_seed")).map((s: any) => [s.key, s.value]));
  const LABELS: Record<string, string> = {
    hosting_fee_status: "Hosting fee status (not_set / announced / active)", hosting_fee_amount: "Hosting fee amount (approved figure only)", hosting_fee_currency: "Hosting fee currency", hosting_fee_interval: "Hosting fee interval (e.g. month)",
    ai_generations_per_project: "AI suggestions allowed per site", free_previews_per_day: "Free previews per day", operator_display_name: "Operator name shown on legal pages", operator_status_note: "Operator status note", support_email: "Public support email (leave empty if none)",
  };
  return (
    <form className="card stack" style={{ maxWidth: 720 }} onSubmit={async (e) => { e.preventDefault(); try { await api("/api/admin/settings", { method: "PUT", body: cur }); toast("Settings saved"); setVals(null); reload(); } catch (er) { toast((er as Error).message, "err"); } }}>
      <div className="alert warn small">Hosting fees are displayed to customers but never charged automatically. Only set “active” once a recurring hosting price and billing flow have been approved.</div>
      {Object.keys(LABELS).map((k) => <label key={k} className="field"><span>{LABELS[k]}</span><input value={cur[k] ?? ""} onChange={(e) => setVals({ ...cur, [k]: e.target.value })} /></label>)}
      <button className="btn btn-primary" style={{ justifySelf: "start" }}>Save settings</button>
    </form>
  );
}

function Audit() {
  const { data } = useAsync(() => api("/api/admin/audit"), []);
  if (!data) return <Spinner />;
  return <div className="table-wrap"><table className="table"><thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Target</th><th>Detail</th></tr></thead><tbody>{data.audit.map((a: any) => <tr key={a.id}><td className="small">{fmtDate(a.created_at)}</td><td className="small">{a.actor || "system"}</td><td>{a.action}</td><td className="small">{a.target_type} {a.target_id}</td><td className="tiny muted" style={{ maxWidth: 320, wordBreak: "break-all" }}>{a.detail_json}</td></tr>)}</tbody></table></div>;
}
