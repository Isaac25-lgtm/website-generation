import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { hostingPrice, useApp, usd } from "../lib";
import { Icon } from "../components/ui";
import { PLANS } from "../../shared/pricing";

const PLAN_INFO = [
  { type: "personal", label: "Personal", price: 2000 },
  { type: "business", label: "Business", price: 3000 },
  { type: "ecommerce", label: "Online store", price: 10000 },
] as const;

// The three kinds of site, each shown with a real CC0 photo and a link to its live demo.
const KINDS = [
  { t: "personal", name: "Personal & portfolio", img: "/stock/photo-camera.webp", alt: "A photographer holding a camera", desc: "Show your work, your story and your CV. Project galleries, a downloadable CV and a contact form, so the right people can find you and get in touch.", example: "/s/demo-portfolio/", shot: "/showcase/portfolio-full.webp", address: "/s/demo-portfolio/", exampleLabel: "See a photographer's portfolio" },
  { t: "business", name: "Business", img: "/hero/business-office.webp", alt: "Colleagues talking in a modern office", desc: "Everything customers look for: your services and prices, photos, opening hours, a map and a WhatsApp button. Enquiries and quote requests land in your dashboard.", example: "/s/demo-business/", shot: "/showcase/business-full.webp", address: "/s/demo-business/", exampleLabel: "See a consultancy's site" },
  { t: "ecommerce", name: "Online store", img: "/hero/store-boutique.webp", alt: "A boutique with clothing rails, shelving and pendant lights", desc: "A real shop with products in sizes and colours, live stock levels, a cart and a checkout. Orders arrive in your dashboard, ready to confirm and deliver.", example: "/s/demo-store/", shot: "/showcase/store-full.webp", address: "/s/demo-store/", exampleLabel: "See a fashion boutique's shop" },
] as const;

// "Made with ImprintSites": screenshots of real sites on the platform (our demos), Framer-style bento wall.
const SHOWCASE = [
  [
    { src: "/showcase/store-home.webp", href: "/s/demo-store/", title: "Maison Nia", sub: "Online store · Maison template" },
    { src: "/showcase/store-product-m.webp", href: "/s/demo-store/product/floral-wrap-dress", title: "Product page", sub: "On a phone", phone: true },
    { src: "/showcase/business-home.webp", href: "/s/demo-business/", title: "Kingsway Advisory", sub: "Business · Meridian template" },
  ],
  [
    { src: "/showcase/portfolio-home.webp", href: "/s/demo-portfolio/", title: "Amina Yusuf", sub: "Portfolio · Lens template" },
    { src: "/showcase/business-services-m.webp", href: "/s/demo-business/services", title: "Services & quotes", sub: "On a phone", phone: true },
    { src: "/showcase/store-shop.webp", href: "/s/demo-store/shop", title: "Shop with filters", sub: "Search, categories and cart" },
  ],
] as const;

const CheckCircle = <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M7.5 12.3l3 3 6-6.3" /></svg>;

// Real CC0 photographs (see public/hero/CREDITS.txt), each showing a step of building and running a website with us.
const SLIDES = [
  { src: "/hero/describe.webp", label: "1 · Describe your idea", pos: "60% 50%" },
  { src: "/hero/design.webp", label: "2 · We design your site", pos: "62% 50%" },
  { src: "/hero/devices.webp", label: "3 · Looks right on every device", pos: "60% 55%" },
  { src: "/hero/edit.webp", label: "Edit it any time", pos: "62% 45%" },
  { src: "/hero/customers.webp", label: "Customers find you online", pos: "64% 40%" },
  { src: "/hero/orders.webp", label: "Take orders and deliver", pos: "58% 45%" },
];

function HeroSlides() {
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(!!reduce);
  const [seen, setSeen] = useState(() => new Set([0, 1]));
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (paused) return;
    timer.current = window.setInterval(() => { if (!document.hidden) setI((x) => (x + 1) % SLIDES.length); }, 6500);
    return () => window.clearInterval(timer.current);
  }, [paused]);
  // Load the shown photo and preload the next one (covers manual jumps via the dots too).
  useEffect(() => { const n = (i + 1) % SLIDES.length; setSeen((s) => (s.has(i) && s.has(n) ? s : new Set([...s, i, n]))); }, [i]);
  return (
    <>
      <div className="hero-slides" aria-hidden="true">
        {SLIDES.map((s, k) => seen.has(k) && (
          <img key={s.src} src={s.src} alt="" className={k === i ? "on" : ""} style={{ objectPosition: s.pos }} width={960} height={640} decoding="async" {...(k === 0 ? { fetchPriority: "high" as const } : {})} />
        ))}
      </div>
      <div className="photo-hero-shade" aria-hidden="true" />
      <div className="hero-slide-ui">
        <span className="hero-slide-label" aria-live="off">{SLIDES[i].label}</span>
        <div className="hero-dots" role="group" aria-label="Background photos">
          {SLIDES.map((s, k) => <button key={s.src} type="button" aria-label={`Show photo ${k + 1}: ${s.label}`} aria-pressed={k === i} onClick={() => { setI(k); setPaused(true); }} />)}
        </div>
        <button type="button" className="hero-pause" onClick={() => setPaused(!paused)} aria-label={paused ? "Play background slideshow" : "Pause background slideshow"}>
          {paused ? <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z" /></svg> : <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>}
        </button>
      </div>
    </>
  );
}

export function startIntent(type: string, prompt: string, url: string) {
  sessionStorage.setItem("is_intent", JSON.stringify({ type, prompt: prompt.slice(0, 2000), url: url.slice(0, 500), at: Date.now() }));
}

export default function Home() {
  const { me, config } = useApp();
  const nav = useNavigate();
  const [type, setType] = useState<string>("business");
  const [prompt, setPrompt] = useState("");
  const [url, setUrl] = useState("");
  const [showUrl, setShowUrl] = useState(false);

  const next = "/dashboard/new?from=prompt";
  const hp = hostingPrice(config);
  const hosting = hp.label;
  const go = (e?: React.FormEvent) => { e?.preventDefault(); startIntent(type, prompt, url); nav(me ? next : `/signup?next=${encodeURIComponent(next)}`); };
  const startPlan = (t: string) => { startIntent(t, "", ""); nav(me ? `/dashboard/new?type=${t}` : `/signup?next=${encodeURIComponent(`/dashboard/new?type=${t}`)}`); };

  return (
    <main id="main">
      <section className="photo-hero">
        <HeroSlides />
        <div className="container photo-hero-inner">
          <h1>Imagine it. Build it. Launch it.</h1>
          <p className="lede">Describe the website you need for your business, your portfolio or your shop. ImprintSites designs it, puts it on its own web address and keeps it running, and you can change anything without code.</p>
          <form className="hero-prompt" onSubmit={go} aria-label="Start building your website">
            <label htmlFor="prompt" className="sr-only">Describe your website</label>
            <input id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={2000} placeholder="Describe your website, e.g. a bakery in Lisbon with our menu and online orders" />
            <button className="btn btn-primary btn-lg" type="submit">Start building</button>
          </form>
          <div className="hero-types" role="group" aria-label="Website type">
            {PLAN_INFO.map((p) => <button key={p.type} type="button" aria-pressed={type === p.type} onClick={() => setType(p.type)}>{p.label} · {usd(p.price)}</button>)}
            {!showUrl ? <button type="button" className="link" onClick={() => setShowUrl(true)}>+ Add a website you love</button> : (
              <span className="hero-url">
                <span aria-hidden="true" style={{ width: 15, display: "inline-flex" }}>{Icon.link}</span>
                <label htmlFor="insp" className="sr-only">Website you love (optional)</label>
                <input id="insp" autoFocus value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://a-site-you-love.com" inputMode="url" />
              </span>
            )}
          </div>
          <ul className="hero-checks">
            <li>{CheckCircle} Free preview before you pay</li>
            <li>{CheckCircle} No coding experience required</li>
            <li>{CheckCircle} Your web address set up for you</li>
          </ul>
        </div>
      </section>

      <section className="kind-strip" aria-labelledby="kinds">
        <h2 id="kinds" className="sr-only">What you can build</h2>
        <div className="container kind-grid">
          {KINDS.map((k) => (
            <article key={k.t} className="kind-card" data-kind={k.t}>
              <a href={k.example} className="kind-media" aria-label={k.exampleLabel}>
                <img className="kind-photo" src={k.img} alt={k.alt} width={960} height={640} loading="lazy" decoding="async" />
                <span className="kind-chip">{k.name}</span>
                <span className="kind-browser" aria-hidden="true">
                  <span className="kind-chrome"><i /><i /><i /><span className="kind-url">imprintsites…{k.address}</span></span>
                  <span className="kind-screen"><img src={k.shot} alt="" loading="lazy" decoding="async" /></span>
                </span>
              </a>
              <div className="kind-body">
                <h3>{k.name}</h3>
                <p className="muted">{k.desc}</p>
                <div className="kind-actions"><a href={k.example} className="kind-link">{k.exampleLabel} <span aria-hidden="true">→</span></a><button className="btn btn-sm" onClick={() => startPlan(k.t)}>Start</button></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="how">
        <div className="container">
          <div className="section-head"><span className="eyebrow">How it works</span><h2 id="how">From a description to a live site</h2><p>Five steps, most of them done for you.</p></div>
          <ol className="steps-row">
            {[
              ["Tell us about it", "Answer a few guided questions and add your photos. Everything saves as you go."],
              ["Choose a look", "Pick a template, or paste a site you admire and we'll take its style, never its content."],
              ["Preview and adjust", "See the real site on phone, tablet and desktop. Change anything, or just ask for it."],
              ["Pick your web address", "Choose a name like /s/your-business. We set it up automatically with secure https. Your own domain: coming soon."],
              ["Publish", `Pay the one-time build fee and you're live. Hosting and maintenance are then ${hosting} per site per month.`],
            ].map(([h, d], k) => (
              <li key={h} className="step"><span className="num">{String(k + 1).padStart(2, "0")}</span><h3>{h}</h3><p className="muted">{d}</p></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="showcase" aria-labelledby="made">
        <div className="container">
          <div className="showcase-head"><h2 id="made">Made with ImprintSites</h2><a href="/examples" className="showcase-more">See all examples <span aria-hidden="true">→</span></a></div>
          {SHOWCASE.map((row, r) => (
            <div key={r} className={`bento bento-${r + 1}`}>
              {row.map((t) => (
                <a key={t.src} href={t.href} className={`bento-tile ${"phone" in t && t.phone ? "is-phone" : ""}`}>
                  <img src={t.src} alt={`${t.title}: ${t.sub}`} loading="lazy" decoding="async" />
                  <span className="bento-cap"><strong>{t.title}</strong><span>{t.sub}</span></span>
                </a>
              ))}
            </div>
          ))}
          <p className="showcase-note">Demo sites with made-up content, built on the platform. Open any of them and click around; the shop even takes test orders.</p>
        </div>
      </section>

      <section className="section" aria-labelledby="insp">
        <div className="container grid-2" style={{ alignItems: "center", gap: "3rem" }}>
          <div>
            <span className="eyebrow">Inspired by a link</span>
            <h2 id="insp">Love how a website looks? Paste the link.</h2>
            <p className="muted">We read its general style (colours, type, spacing, shapes and layout rhythm) and use that as a starting point for a design that's yours.</p>
            <p className="muted small">We never copy another site's words, images, logos or code. If a site blocks automated visits, you can upload a screenshot instead.</p>
          </div>
          <div className="card">
            <div className="stack-sm">
              <div className="row between"><span style={{ fontWeight: 500 }}>Style brief</span><span className="tiny muted">sample output</span></div>
              <div className="row">{["#101014", "#f4f1ea", "#c2611f", "#2f6b4f", "#8b8b92"].map((c) => <span key={c} style={{ width: 36, height: 36, borderRadius: 8, background: c, border: "1px solid var(--line)" }} />)}</div>
              <div className="small muted">Mood: <span style={{ color: "var(--ink)" }}>warm, editorial</span> · Type: <span style={{ color: "var(--ink)" }}>serif headings</span> · Corners: <span style={{ color: "var(--ink)" }}>soft</span></div>
              <div className="small muted">Closest templates: <span style={{ color: "var(--ink)" }}>Savanna, Folio, Craft & Co</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section alt" aria-labelledby="pricing">
        <div className="container">
          <div className="section-head center"><span className="eyebrow">Pricing</span><h2 id="pricing">Simple, honest pricing</h2><p>Build and preview for free. Pay once to publish, then a flat monthly fee keeps your site online and looked after.</p></div>
          <div className="price-grid">
            {Object.values(PLANS).map((p) => (
              <article key={p.type} className={`price-card ${p.type === "business" ? "featured" : ""}`}>
                {p.type === "business" && <span className="price-flag">Most chosen</span>}
                <h3>{p.type === "ecommerce" ? "Online store" : p.type === "personal" ? "Personal & portfolio" : "Business"}</h3>
                <p className="muted small" style={{ minHeight: "2.6em" }}>{p.summary}</p>
                <div className="price-big">{usd(p.priceCents)}<small>one-time build</small></div>
                <div className="price-monthly">+ {hp.label} / {hp.interval} hosting &amp; maintenance</div>
                <ul>{p.includes.map((x) => <li key={x}>{x}</li>)}<li>Web address set up for you, with https</li></ul>
                <button className={`btn btn-lg btn-block ${p.type === "business" ? "btn-primary" : "btn-outline"}`} onClick={() => startPlan(p.type)}>Start free preview</button>
              </article>
            ))}
          </div>
          <p className="center muted small" style={{ marginTop: "1.5rem" }}>Prices in US dollars. {hp.billingLive ? "" : "You'll agree to the monthly hosting plan before any monthly charge. "}Cancel the monthly plan any time. <Link to="/pricing">Full pricing details</Link></p>
        </div>
      </section>

      <section className="section" aria-labelledby="faq">
        <div className="narrow">
          <div className="section-head"><h2 id="faq">Common questions</h2></div>
          <div className="faq">
            <details><summary>What does it cost?</summary><p>A one-time build fee when you publish: $20 for a personal site, $30 for a business site or $100 for an online store. After that, hosting and maintenance are {hosting} per site per month, covering your web address, secure hosting, backups and platform updates. You'll be asked to agree to the monthly plan before any monthly charge, and you can cancel it at any time.</p></details>
            <details><summary>Can I try it before paying?</summary><p>Yes. Create an account, fill in your details, generate the site and look at it on every screen size for free. You only pay when you decide to publish.</p></details>
            <details><summary>Can I change my site after it's live?</summary><p>Any time. Edit, preview privately, then publish the update. Earlier versions are kept if you want to go back.</p></details>
            <details><summary>How do my customers pay in the shop?</summary><p>Right now: pay on delivery, pay on pickup, bank transfer, or arranging it on WhatsApp. Orders and stock are tracked properly. Card payments need your own payment account and will come as an option; the money always goes to you, not through us.</p></details>
            <details><summary>How does my web address work?</summary><p>You pick a name when you create your site, and we check it's free. When you publish, it's set up automatically with a secure https connection, so there's nothing to configure. Connecting a domain you already own (like yourbusiness.com) is coming soon; domains themselves are bought from a registrar.</p></details>
            <details><summary>Does AI write my site?</summary><p>Your site is built from what you tell us. You can ask AI to tidy up the wording, but it doesn't add facts, and you check every suggestion before it goes live.</p></details>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container center">
          <h2>Start with a description</h2>
          <p className="muted" style={{ maxWidth: 520, margin: "0 auto 1.5rem" }}>Build it, look at it on your phone, and publish when you're happy.</p>
          <div className="row" style={{ justifyContent: "center" }}><Link to={me ? "/dashboard/new" : "/signup"} className="btn btn-primary btn-lg">Start building</Link><Link to="/templates" className="btn btn-lg">See the templates</Link></div>
        </div>
      </section>
    </main>
  );
}
