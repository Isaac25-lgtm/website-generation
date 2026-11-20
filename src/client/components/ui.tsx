import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { useApp } from "../lib";

export function Logo({ to = "/", small = false }: { to?: string; small?: boolean }) {
  return (
    <Link to={to} className="logo" aria-label="ImprintSites AI home" style={small ? { fontSize: "1.1rem" } : undefined}>
      <img src="/logo-mark.svg" alt="" width={small ? 28 : 34} height={small ? 28 : 34} />
      <span>ImprintSites <span className="ai">AI</span></span>
    </Link>
  );
}

export const Icon = {
  spark: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></svg>,
  link: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></svg>,
  layout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M3 9h18M9 21V9" /></svg>,
  phone: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2.5" /><path d="M11 18h2" /></svg>,
  cart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 7H6" /></svg>,
  rocket: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2" /><path d="M9 15l-3-3a14 14 0 0 1 12-9 14 14 0 0 1-9 12z" /><circle cx="14.5" cy="9.5" r="1.5" /></svg>,
  edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>,
  shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></svg>,
  mail: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>,
  download: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M4 21h16" /></svg>,
  globe: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>,
  google: <svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" /><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" /></svg>,
  menu: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>,
  up: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg>,
  down: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>,
  eye: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>,
  eyeOff: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 4.4-1" /></svg>,
  trash: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3" /></svg>,
  copy: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></svg>,
};

export function MarketingNav() {
  const { me } = useApp();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  return (
    <header className="topnav">
      <div className="container bar">
        <Logo />
        <nav aria-label="Main" className={`navlinks ${open ? "open" : ""}`}>
          <NavLink to="/templates">Templates</NavLink>
          <NavLink to="/examples">Examples</NavLink>
          <NavLink to="/how-it-works">How it works</NavLink>
          <NavLink to="/pricing">Pricing</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </nav>
        <div className="nav-actions">
          {me ? (
            <Link className="btn btn-primary btn-sm" to="/dashboard">Dashboard</Link>
          ) : (
            <>
              <Link className="btn btn-ghost btn-sm hide-sm" to="/login">Sign in</Link>
              <Link className="btn btn-primary btn-sm" to="/signup">Get started</Link>
            </>
          )}
          <button className="btn btn-ghost btn-sm hamburger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>{Icon.menu}</button>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const { config } = useApp();
  return (
    <footer className="footer">
      <div className="container">
        <div className="cols">
          <div>
            <Logo />
            <p className="muted small" style={{ marginTop: "1rem", maxWidth: 340 }}>Imagine it. Build it. Launch it. Professional personal, business and e-commerce websites without code.</p>
            <p className="muted tiny" style={{ maxWidth: 360 }}>A product of {config?.operator.name ?? "Motion Imprints Technologies"}. {config?.operator.note}</p>
          </div>
          <div><h4>Product</h4><ul><li><Link to="/templates">Templates</Link></li><li><Link to="/examples">Example sites</Link></li><li><Link to="/how-it-works">How it works</Link></li><li><Link to="/pricing">Pricing</Link></li></ul></div>
          <div><h4>Support</h4><ul><li><Link to="/contact">Contact us</Link></li><li><Link to="/contact?topic=ip_report">Report content</Link></li><li><Link to="/login">Sign in</Link></li></ul></div>
          <div><h4>Legal</h4><ul><li><Link to="/terms">Terms of Service</Link></li><li><Link to="/privacy">Privacy Policy</Link></li><li><Link to="/refunds">Refund &amp; Cancellation</Link></li></ul></div>
        </div>
        <div className="legal"><span>© {new Date().getFullYear()} {config?.operator.name ?? "Motion Imprints Technologies"}. All rights reserved.</span></div>
      </div>
    </footer>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return <span className="spinner" role="status" aria-label={label} />;
}

export function LoadingPage() {
  return <div className="loading-page"><Spinner /></div>;
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); prev?.focus(); };
  }, [onClose]);
  return (
    <div className="modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref} style={wide ? { width: "min(100%, 1100px)" } : undefined}>
        <div className="modal-head"><h2 style={{ fontSize: "1.15rem", margin: 0 }}>{title}</h2><button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">✕</button></div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

/** Scaled live iframe thumbnail of a rendered site. */
export function SiteThumb({ src, title, locked, eager }: { src: string; title: string; locked?: ReactNode; eager?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / 1280));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div className="thumb" ref={box}>
      {!locked && <iframe src={`${src}${src.includes("?") ? "&" : "?"}static=1`} title={title} loading={eager ? "eager" : "lazy"} tabIndex={-1} aria-hidden="true" style={{ transform: `scale(${scale})` }} sandbox="allow-same-origin" />}
      {locked && <div className="lock">{locked}</div>}
    </div>
  );
}

export function Field({ label, help, children }: { label: string; help?: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}{help && <span className="help">{help}</span>}</label>;
}

export function GoogleButton({ next = "/dashboard", label = "Continue with Google" }: { next?: string; label?: string }) {
  const { config } = useApp();
  const enabled = config?.google.enabled;
  return (
    <a className="btn btn-google btn-lg" style={{ width: "100%" }} href={enabled ? `/api/auth/google/start?next=${encodeURIComponent(next)}` : undefined}
      aria-disabled={!enabled} onClick={(e) => { if (!enabled) e.preventDefault(); }} title={enabled ? undefined : "Google sign-in is being set up. Use email for now."}>
      {Icon.google}<span>{label}</span>
    </a>
  );
}
