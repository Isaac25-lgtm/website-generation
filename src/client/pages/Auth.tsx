import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { api, useApp } from "../lib";
import { Field, GoogleButton, Logo, Spinner } from "../components/ui";

const GOOGLE_ERRORS: Record<string, string> = {
  google_unavailable: "Google sign-in isn't switched on yet. Please use email and password for now.",
  google_state: "The Google sign-in session expired. Please try again.",
  google_token: "Google sign-in failed. Please try again.",
  google_profile: "We couldn't read your Google profile. Please try again.",
  google_unverified: "Your Google email address isn't verified.",
  google_denied: "Google sign-in was cancelled, or this Google account isn't on the testers list yet. While Google sign-in is in testing, only approved accounts can use it. You can still sign up with email.",
  google_conflict: "This email is already linked to a different Google account. Sign in with that Google account, or with your email and password.",
  inactive: "This account is not active. Please contact support.",
};

function safeNext(n: string | null) { return n && n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard"; }

export function Login() {
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const { refresh, config } = useApp();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(GOOGLE_ERRORS[params.get("error") || ""] || "");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { await api("/api/auth/login", { body: { email, password } }); await refresh(); nav(next); }
    catch (er) { setErr((er as Error).message); setBusy(false); }
  };
  return (
    <main id="main" className="auth-wrap">
      <div className="card auth-card stack" style={{ padding: "2rem" }}>
        <div className="center"><Logo /><h1 style={{ fontSize: "1.7rem", marginTop: "1.25rem" }}>Welcome back</h1><p className="muted">Sign in to keep building.</p></div>
        <GoogleButton next={next} />
        {!config?.google.enabled && <p className="tiny muted center" style={{ marginTop: "-.5rem" }}>Google sign-in is being set up. Use email for now.</p>}
        <div className="divider">or with email</div>
        <form className="stack" onSubmit={submit}>
          <Field label="Email"><input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Password"><input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          {err && <div className="alert err" role="alert">{err}</div>}
          <button className="btn btn-primary btn-lg" disabled={busy}>{busy && <Spinner />} Sign in</button>
        </form>
        <div className="row between small"><Link to="/forgot-password">Forgot password?</Link><span>New here? <Link to={`/signup?next=${encodeURIComponent(next)}`}>Create an account</Link></span></div>
      </div>
    </main>
  );
}

export function Signup() {
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const { refresh, config } = useApp();
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "", password: "", acceptTerms: false });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { await api("/api/auth/signup", { body: f }); await refresh(); nav(next); }
    catch (er) { setErr((er as Error).message); setBusy(false); }
  };
  return (
    <main id="main" className="auth-wrap">
      <div className="card auth-card stack" style={{ padding: "2rem" }}>
        <div className="center"><Logo /><h1 style={{ fontSize: "1.7rem", marginTop: "1.25rem" }}>Create your free account</h1><p className="muted">Build and preview free. Unlock all 18 templates.</p></div>
        <GoogleButton next={next} label="Sign up with Google" />
        {!config?.google.enabled && <p className="tiny muted center" style={{ marginTop: "-.5rem" }}>Google sign-in is being set up. Use email for now.</p>}
        <div className="divider">or with email</div>
        <form className="stack" onSubmit={submit}>
          <Field label="Your name"><input autoComplete="name" required maxLength={80} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Email"><input type="email" autoComplete="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Password" help="At least 10 characters."><input type="password" autoComplete="new-password" required minLength={10} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
          <label className="check"><input type="checkbox" checked={f.acceptTerms} onChange={(e) => setF({ ...f, acceptTerms: e.target.checked })} required /> <span>I agree to the <Link to="/terms" target="_blank">Terms of Service</Link> and <Link to="/privacy" target="_blank">Privacy Policy</Link>.</span></label>
          {err && <div className="alert err" role="alert">{err}</div>}
          <button className="btn btn-primary btn-lg" disabled={busy || !f.acceptTerms}>{busy && <Spinner />} Create account</button>
        </form>
        <p className="small center" style={{ margin: 0 }}>Already have an account? <Link to={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link></p>
      </div>
    </main>
  );
}

export function Forgot() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<{ text: string; kind: string } | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <main id="main" className="auth-wrap">
      <form className="card auth-card stack" style={{ padding: "2rem" }} onSubmit={async (e) => {
        e.preventDefault(); setBusy(true);
        try { const r = await api("/api/auth/forgot", { body: { email } }); setMsg({ text: r.message, kind: r.emailConfigured ? "ok" : "warn" }); }
        catch (er) { setMsg({ text: (er as Error).message, kind: "err" }); }
        setBusy(false);
      }}>
        <h1 style={{ fontSize: "1.6rem" }}>Reset your password</h1>
        <Field label="Account email"><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        {msg && <div className={`alert ${msg.kind}`} role="status">{msg.text} {msg.kind === "warn" && <Link to="/contact?topic=technical">Contact support</Link>}</div>}
        <button className="btn btn-primary btn-lg" disabled={busy}>Send reset link</button>
        <Link to="/login" className="small">Back to sign in</Link>
      </form>
    </main>
  );
}

export function Reset() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  return (
    <main id="main" className="auth-wrap">
      <form className="card auth-card stack" style={{ padding: "2rem" }} onSubmit={async (e) => {
        e.preventDefault();
        try { await api("/api/auth/reset", { body: { token: params.get("token") || "", password } }); nav("/login"); }
        catch (er) { setErr((er as Error).message); }
      }}>
        <h1 style={{ fontSize: "1.6rem" }}>Choose a new password</h1>
        <Field label="New password" help="At least 10 characters."><input type="password" autoComplete="new-password" required minLength={10} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        {err && <div className="alert err">{err}</div>}
        <button className="btn btn-primary btn-lg">Save password</button>
      </form>
    </main>
  );
}
