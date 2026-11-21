import type { Theme } from "../schema";
import { fontStack } from "../fonts";
import { ensureContrast, mix, readableOn } from "../util";

const RADIUS = { none: "0px", sm: "6px", md: "12px", lg: "18px", xl: "28px" } as const;
const SPACE = { compact: "clamp(2.5rem,5vw,3.75rem)", comfortable: "clamp(3.5rem,7vw,5.75rem)", airy: "clamp(4.5rem,9vw,8rem)" } as const;
const H1 = { sm: "clamp(2rem,4.2vw,3rem)", md: "clamp(2.4rem,5.4vw,4rem)", lg: "clamp(2.7rem,6.4vw,5rem)", xl: "clamp(3rem,7.8vw,6.4rem)" } as const;
const H2 = { sm: "clamp(1.5rem,2.6vw,2rem)", md: "clamp(1.7rem,3.2vw,2.5rem)", lg: "clamp(1.9rem,3.8vw,3rem)", xl: "clamp(2.1rem,4.6vw,3.6rem)" } as const;

export function themeVars(t: Theme): string {
  const c = t.colors;
  // Keep brand colours usable on this page background whatever the mode: buttons and bands need 3:1 against
  // the page (WCAG non-text contrast), primary-coloured text needs 4.5:1. A navy primary on a dark page is lifted.
  const primary = ensureContrast(c.primary, c.bg, c.text, 3);
  const primaryInk = ensureContrast(c.primary, c.bg, c.text, 4.5);
  const accent = ensureContrast(c.accent, c.bg, c.text, 3);
  return `:root{--bg:${c.bg};--surface:${c.surface};--text:${c.text};--muted:${c.muted};--primary:${primary};--primary-ink:${primaryInk};--on-primary:${readableOn(primary)};--accent:${accent};--on-accent:${readableOn(accent)};--border:${mix(c.bg, c.text, 0.14)};--soft:${mix(c.bg, c.primary, 0.08)};--radius:${RADIUS[t.radius]};--radius-sm:calc(${RADIUS[t.radius]} * .6);--space:${SPACE[t.density]};--font-h:${fontStack(t.fontHeading)};--font-b:${fontStack(t.fontBody)};--h1:${H1[t.headingScale]};--h2:${H2[t.headingScale]};--maxw:1180px;color-scheme:${t.mode}}`;
}

export const BASE_CSS = `
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--text);font:400 1.0625rem/1.65 var(--font-b);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
img{max-width:100%;height:auto;display:block}
a{color:inherit;text-decoration-color:color-mix(in srgb,currentColor 35%,transparent);text-underline-offset:3px}
a:hover{text-decoration-color:currentColor}
h1,h2,h3,h4{font-family:var(--font-h);line-height:1.08;margin:0 0 .6em;font-weight:700;letter-spacing:-.015em;text-wrap:balance}
h1{font-size:var(--h1)}h2{font-size:var(--h2)}h3{font-size:1.25rem;line-height:1.25}
p{margin:0 0 1em;text-wrap:pretty}
.muted{color:var(--muted)}
.wrap{width:min(100% - 2.5rem,var(--maxw));margin-inline:auto}
.skip{position:absolute;left:-9999px;top:0;z-index:999;background:var(--primary);color:var(--on-primary);padding:.75rem 1rem}
.skip:focus{left:1rem;top:1rem}
:focus-visible{outline:3px solid var(--accent);outline-offset:3px}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0}
/* buttons */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;min-height:44px;padding:.8rem 1.35rem;border-radius:var(--radius);border:1.5px solid var(--text);font:600 .95rem/1.1 var(--font-b);text-decoration:none;cursor:pointer;transition:transform .2s,box-shadow .2s,background .2s;background:transparent;color:var(--text)}
.btn-primary{background:var(--primary);border-color:var(--primary);color:var(--on-primary)}
.btn-accent{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}
.btn-ghost{border-color:var(--border)}
.btn:hover{transform:translateY(-1px)}
.btn[disabled]{opacity:.55;cursor:not-allowed;transform:none}
.actions{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:1.75rem}
/* header */
.site-header{position:sticky;top:0;z-index:50;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:saturate(1.4) blur(10px)}
.site-header .bar{display:flex;align-items:center;justify-content:space-between;gap:1.25rem;min-height:72px}
.brand{display:inline-flex;align-items:center;gap:.6rem;font:700 1.15rem/1 var(--font-h);text-decoration:none;letter-spacing:-.01em}
.brand img{height:38px;width:auto;border-radius:var(--radius-sm)}
.nav ul{display:flex;gap:1.6rem;list-style:none;margin:0;padding:0;align-items:center}
.nav a{text-decoration:none;font-weight:500;font-size:.96rem;opacity:.86;padding:.4rem 0;display:inline-block}
.nav a:hover,.nav a[aria-current=page]{opacity:1;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:6px}
.head-actions{display:flex;align-items:center;gap:.6rem}
.head-actions .btn{min-height:40px;padding:.55rem 1rem;font-size:.88rem}
.menu-btn{display:none;background:none;border:1.5px solid var(--border);border-radius:var(--radius-sm);width:44px;height:44px;color:inherit;cursor:pointer}
.menu-btn span{display:block;width:18px;height:2px;background:currentColor;margin:4px auto}
.cart-link{position:relative}
.cart-count{position:absolute;top:-6px;right:-8px;min-width:20px;height:20px;border-radius:99px;background:var(--accent);color:var(--on-accent);font-size:.72rem;display:grid;place-items:center;padding:0 5px}
.site-header.centered .bar{flex-direction:column;justify-content:center;padding:1.1rem 0 .4rem;gap:.6rem}
.site-header.centered .head-actions{position:absolute;right:1.25rem;top:1.1rem}
.site-header.centered .bar{position:relative}
.site-header.floating{background:transparent;backdrop-filter:none;padding-top:.9rem}
.site-header.floating .bar{background:color-mix(in srgb,var(--surface) 86%,transparent);backdrop-filter:blur(14px);border:1px solid var(--border);border-radius:calc(var(--radius) + 8px);padding:0 1rem 0 1.25rem;min-height:64px}
.site-header.minimal{position:relative;background:transparent;backdrop-filter:none}
.site-header.split .bar{min-height:80px}
.topbar{display:none;background:var(--primary);color:var(--on-primary);font-size:.85rem}
.topbar .wrap{display:flex;justify-content:space-between;gap:1rem;padding:.45rem 0;flex-wrap:wrap}
.topbar a{color:inherit}
/* sidebar layout */
@media(min-width:1000px){
 body.hs-sidebar .layout{display:grid;grid-template-columns:280px 1fr}
 body.hs-sidebar .site-header{position:sticky;top:0;height:100vh;border-right:1px solid var(--border);background:var(--surface)}
 body.hs-sidebar .site-header .bar{flex-direction:column;align-items:flex-start;justify-content:flex-start;padding:2.5rem 1.75rem;height:100%;width:auto}
 body.hs-sidebar .nav ul{flex-direction:column;align-items:flex-start;gap:.4rem}
 body.hs-sidebar .wrap{width:min(100% - 4rem,920px)}
}
/* mobile nav */
@media(max-width:860px){
 .menu-btn{display:inline-block}
 .nav{position:fixed;inset:72px 0 auto 0;background:var(--bg);border-bottom:1px solid var(--border);padding:1rem 1.25rem 1.5rem;display:none;max-height:calc(100vh - 72px);overflow:auto}
 .nav.open{display:block}
 .nav ul{flex-direction:column;align-items:flex-start;gap:.25rem}
 .nav a{font-size:1.1rem;padding:.6rem 0}
 .site-header.centered .bar{flex-direction:row;justify-content:space-between;padding:0}
 .site-header.centered .head-actions{position:static}
 .head-actions .hide-sm{display:none}
}
/* sections */
.page-head{padding-block:clamp(2.5rem,6vw,4.5rem) 0}
.page-head h1{font-size:var(--h2);margin:0}
.page-head+.sec{padding-top:calc(var(--space)*.55)}
.sec{padding-block:var(--space);position:relative}
.sec.alt{background:var(--surface)}
.sec-head{max-width:760px;margin-bottom:clamp(1.75rem,3.5vw,3rem)}
.sec-head.center{text-align:center;margin-inline:auto}
.sec-head .lead,.lead{font-size:1.12rem;color:var(--muted)}
.eyebrow{display:inline-block;font:600 .78rem/1 var(--font-b);letter-spacing:.16em;text-transform:uppercase;color:var(--primary-ink);margin-bottom:1rem}
.grid{display:grid;gap:clamp(1rem,2.2vw,1.75rem);grid-template-columns:repeat(auto-fill,minmax(min(100%,var(--min,280px)),1fr))}
.card{background:var(--bg);border-radius:var(--radius);padding:clamp(1.25rem,2.4vw,1.85rem);position:relative;overflow:hidden}
.card-media{margin:calc(-1*clamp(1.25rem,2.4vw,1.85rem)) calc(-1*clamp(1.25rem,2.4vw,1.85rem)) 1.25rem;aspect-ratio:16/10;overflow:hidden;background:var(--surface)}
.card-media img{width:100%;height:100%;object-fit:cover}
body.cs-outline .card{border:1px solid var(--border)}
body.cs-flat .card{background:var(--surface)}
body.cs-elevated .card{box-shadow:0 1px 2px rgba(0,0,0,.05),0 12px 32px -12px rgba(0,0,0,.18)}
body.cs-glass .card{background:color-mix(in srgb,var(--surface) 62%,transparent);backdrop-filter:blur(14px);border:1px solid color-mix(in srgb,var(--text) 10%,transparent);box-shadow:0 20px 50px -30px rgba(0,0,0,.35)}
.sec.alt .card{background:var(--bg)}
.tags{display:flex;flex-wrap:wrap;gap:.45rem;margin:.75rem 0 0;padding:0;list-style:none}
.tag{font-size:.8rem;padding:.3rem .7rem;border:1px solid var(--border);border-radius:99px;line-height:1.2}
.price{font-weight:700}
.compare{text-decoration:line-through;color:var(--muted);font-weight:400;margin-left:.4rem}
/* hero */
.hero{padding-block:clamp(3.5rem,8vw,7.5rem);position:relative;overflow:hidden}
.hero .sub{font-size:clamp(1.08rem,1.6vw,1.3rem);color:var(--muted);max-width:640px}
.hero-media{border-radius:var(--radius);overflow:hidden;background:var(--surface);aspect-ratio:4/3.3}
.hero-media img{width:100%;height:100%;object-fit:cover}
.hero.split .wrap{display:grid;gap:clamp(2rem,5vw,4.5rem);grid-template-columns:1.05fr .95fr;align-items:center}
.hero.centered{text-align:center}.hero.centered .sub{margin-inline:auto}.hero.centered .actions{justify-content:center}
.hero.centered .hero-media{max-width:980px;margin:3rem auto 0;aspect-ratio:16/8}
.hero.editorial h1{font-size:calc(var(--h1) * 1.12);max-width:13ch}
.hero.editorial .wrap{display:grid;grid-template-columns:1.4fr .8fr;gap:3rem;align-items:end}
.hero.editorial .hero-media{aspect-ratio:3/4}
.hero.fullbleed{min-height:min(88vh,860px);display:flex;align-items:flex-end;color:#fff;padding-bottom:clamp(3rem,7vw,6rem)}
.hero.fullbleed .bgimg{position:absolute;inset:0}
.hero.fullbleed .bgimg img{width:100%;height:100%;object-fit:cover}
.hero.fullbleed::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.05) 20%,rgba(0,0,0,.72))}
.hero.fullbleed .wrap{position:relative;z-index:2}
.hero.fullbleed .sub{color:rgba(255,255,255,.88)}
.hero.fullbleed .eyebrow{color:#fff}
.hero.fullbleed .btn:not(.btn-primary){color:#fff;border-color:rgba(255,255,255,.7)}
.hero.terminal .term{border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);overflow:hidden;font-family:var(--font-h)}
.hero.terminal .term-bar{display:flex;gap:6px;padding:.75rem 1rem;border-bottom:1px solid var(--border)}
.hero.terminal .term-bar i{width:11px;height:11px;border-radius:50%;background:var(--border)}
.hero.terminal .term-body{padding:clamp(1.25rem,4vw,2.75rem)}
.hero.terminal .prompt{color:var(--primary-ink);font-size:.95rem;margin-bottom:1.25rem}
.hero.terminal h1{font-size:calc(var(--h1) * .82)}
.hero.terminal .cursor{display:inline-block;width:.55em;height:1em;background:var(--primary);vertical-align:-.1em;margin-left:.15em;animation:blink 1.1s steps(1) infinite}
@keyframes blink{50%{opacity:0}}
.hero.mosaic .wrap{display:grid;grid-template-columns:1fr 1fr;gap:2.5rem;align-items:center}
.mosaic-grid{display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:110px;gap:.75rem}
.mosaic-grid figure{margin:0;overflow:hidden;border-radius:var(--radius);background:var(--surface)}
.mosaic-grid figure img{width:100%;height:100%;object-fit:cover}
.mosaic-grid figure:nth-child(1){grid-column:span 2;grid-row:span 2}
.mosaic-grid figure:nth-child(4){grid-column:span 2}
.hero.stacked{text-align:center}.hero.stacked .sub{margin-inline:auto}.hero.stacked .actions{justify-content:center}
.hero.stacked .hero-media{aspect-ratio:21/8;margin-top:3rem}
.hero.poster h1{font-size:calc(var(--h1) * 1.25);line-height:.92;max-width:12ch}
.hero.poster .wrap{display:grid;grid-template-columns:1.3fr .7fr;gap:2rem;align-items:center}
.hero.poster .hero-media{aspect-ratio:1;border-radius:50%}
.hero.minimal{padding-block:clamp(2.5rem,6vw,5rem)}
.hero.minimal .wrap{display:flex;gap:2rem;align-items:center}
.hero.minimal .avatar{width:150px;height:150px;border-radius:50%;overflow:hidden;flex:none;background:var(--surface)}
.hero.minimal .avatar img{width:100%;height:100%;object-fit:cover}
@media(max-width:860px){
 .hero.split .wrap,.hero.editorial .wrap,.hero.mosaic .wrap,.hero.poster .wrap{grid-template-columns:1fr}
 .hero.minimal .wrap{flex-direction:column;align-items:flex-start}
 .hero.poster .hero-media{max-width:320px}
}
/* about */
.about.split .wrap,.split2{display:grid;grid-template-columns:1fr 1fr;gap:clamp(2rem,5vw,4.5rem);align-items:center}
.about .media{border-radius:var(--radius);overflow:hidden;aspect-ratio:4/5;background:var(--surface)}
.about .media img{width:100%;height:100%;object-fit:cover}
.about.columns .body{columns:2 320px;column-gap:3rem}
.about.card .inner{background:var(--surface);border-radius:var(--radius);padding:clamp(1.75rem,5vw,4rem)}
.highlights{list-style:none;padding:0;margin:1.5rem 0 0;display:grid;gap:.6rem}
.highlights li{display:flex;gap:.6rem;align-items:flex-start}
.highlights li::before{content:"";flex:none;width:.6rem;height:.6rem;margin-top:.55rem;border-radius:2px;background:var(--primary)}
@media(max-width:860px){.about.split .wrap,.split2{grid-template-columns:1fr}}
/* services */
.services-list{display:grid;gap:1rem}
.services-list .item{display:grid;grid-template-columns:auto 1fr auto;gap:1.25rem;align-items:center;padding:1.25rem 1.5rem;background:var(--surface);border-radius:var(--radius)}
.services-list .item img{width:72px;height:72px;border-radius:var(--radius-sm);object-fit:cover}
.numbered{counter-reset:svc;display:grid;gap:0}
.numbered .row{counter-increment:svc;display:grid;grid-template-columns:5rem 1fr 1.2fr;gap:2rem;padding:2rem 0;border-top:1px solid var(--border)}
.numbered .row::before{content:counter(svc,decimal-leading-zero);font:500 1.1rem var(--font-h);color:var(--muted)}
.menu{max-width:820px;margin-inline:auto}
.menu .row{padding:1rem 0;border-bottom:1px dashed var(--border)}
.menu .line{display:flex;align-items:baseline;gap:.75rem}
.menu .line .dots{flex:1;border-bottom:2px dotted var(--border);transform:translateY(-4px)}
@media(max-width:700px){.numbered .row{grid-template-columns:1fr;gap:.5rem}.services-list .item{grid-template-columns:1fr}}
/* projects */
.proj-alt{display:grid;gap:clamp(3rem,6vw,5rem)}
.proj-alt article{display:grid;grid-template-columns:1.2fr 1fr;gap:clamp(1.5rem,4vw,3.5rem);align-items:center}
.proj-alt article:nth-child(even) .media{order:2}
.proj-alt .media{border-radius:var(--radius);overflow:hidden;aspect-ratio:4/3;background:var(--surface)}
.proj-alt .media img{width:100%;height:100%;object-fit:cover}
.proj-index{border-top:1px solid var(--border)}
.proj-index article{display:grid;grid-template-columns:1fr 2fr auto;gap:2rem;padding:1.6rem 0;border-bottom:1px solid var(--border);align-items:baseline}
.thumbs{display:flex;gap:.5rem;margin-top:1rem;flex-wrap:wrap}
.thumbs img{width:84px;height:64px;object-fit:cover;border-radius:var(--radius-sm)}
.meta{font-size:.88rem;color:var(--muted)}
@media(max-width:860px){.proj-alt article{grid-template-columns:1fr}.proj-alt article:nth-child(even) .media{order:0}.proj-index article{grid-template-columns:1fr;gap:.4rem}}
/* experience */
.timeline{position:relative;border-left:2px solid var(--border);padding-left:1.75rem;display:grid;gap:2rem}
.timeline article{position:relative}
.timeline article::before{content:"";position:absolute;left:calc(-1.75rem - 7px);top:.4rem;width:12px;height:12px;border-radius:50%;background:var(--primary);box-shadow:0 0 0 4px var(--bg)}
.xp-table article{display:grid;grid-template-columns:200px 1fr;gap:2rem;padding:1.5rem 0;border-top:1px solid var(--border)}
@media(max-width:700px){.xp-table article{grid-template-columns:1fr;gap:.3rem}}
.list-plain{list-style:none;padding:0;margin:0;display:grid;gap:1.1rem}
/* skills */
.skill-groups{display:grid;gap:1.5rem;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
/* gallery */
.gallery.grid-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr));gap:.75rem}
.gallery.grid-g figure{aspect-ratio:1}
.gallery.masonry{columns:3 260px;column-gap:.85rem}
.gallery.masonry figure{break-inside:avoid;margin-bottom:.85rem}
.gallery.strip{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(260px,32%);gap:.85rem;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:.5rem}
.gallery.strip figure{scroll-snap-align:start;aspect-ratio:4/5}
.gallery figure{margin:0;overflow:hidden;border-radius:var(--radius);background:var(--surface)}
.gallery figure img{width:100%;height:100%;object-fit:cover;transition:transform .5s}
.gallery figure:hover img{transform:scale(1.03)}
.gallery figcaption{font-size:.85rem;color:var(--muted);padding:.5rem .25rem 0}
.gallery.masonry figcaption,.gallery.grid-g figcaption{display:none}
/* testimonials */
.t-big{max-width:900px;margin-inline:auto;text-align:center;display:grid;gap:3rem}
.t-big blockquote{font:500 clamp(1.3rem,2.6vw,1.9rem)/1.4 var(--font-h);margin:0}
blockquote{margin:0}
.cite{margin-top:1rem;font-size:.95rem;color:var(--muted)}
.cite strong{color:var(--text)}
/* team */
.member .ph{aspect-ratio:1;border-radius:var(--radius);overflow:hidden;background:var(--surface);margin-bottom:1rem}
.member .ph img{width:100%;height:100%;object-fit:cover}
/* faq */
.faq{max-width:860px;margin-inline:auto}
.faq details{border-bottom:1px solid var(--border);padding:1.1rem 0}
.faq summary{cursor:pointer;font-weight:600;font-size:1.08rem;list-style:none;display:flex;justify-content:space-between;gap:1rem}
.faq summary::after{content:"+";font-size:1.4rem;line-height:1;color:var(--primary-ink)}
.faq details[open] summary::after{content:"–"}
.faq details p{margin:.8rem 0 0;color:var(--muted)}
/* hours */
.hours-t{width:100%;border-collapse:collapse;max-width:560px}
.hours-t th,.hours-t td{text-align:left;padding:.7rem 0;border-bottom:1px solid var(--border)}
.hours-t td{text-align:right}
/* contact + forms */
.contact-grid{display:grid;grid-template-columns:.9fr 1.1fr;gap:clamp(2rem,5vw,4rem)}
@media(max-width:860px){.contact-grid{grid-template-columns:1fr}}
.contact-list{list-style:none;padding:0;margin:0;display:grid;gap:1rem}
.contact-list li{display:flex;gap:.75rem;align-items:flex-start}
.contact-list .k{font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);display:block}
.map{margin-top:1.5rem;border-radius:var(--radius);overflow:hidden;border:1px solid var(--border);aspect-ratio:16/10;background:var(--surface)}
.map iframe{width:100%;height:100%;border:0}
form.f{display:grid;gap:1rem}
.f .row2{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
@media(max-width:600px){.f .row2{grid-template-columns:1fr}}
.f label{display:grid;gap:.4rem;font-size:.92rem;font-weight:600}
.f input,.f select,.f textarea{width:100%;font:inherit;font-weight:400;color:var(--text);background:var(--bg);border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:.8rem .9rem;min-height:46px}
.f textarea{min-height:140px;resize:vertical}
.f input:focus,.f select:focus,.f textarea:focus{border-color:var(--primary);outline:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--primary) 25%,transparent)}
.f .hp{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}
.f .check{display:flex;gap:.6rem;align-items:flex-start;font-weight:400}
.f .check input{width:20px;min-height:20px;height:20px;margin-top:.2rem}
.form-status{min-height:1.5em;font-weight:600}
.form-status.ok{color:var(--primary-ink)}.form-status.err{color:#c0392b}
.form-card{background:var(--surface);border-radius:var(--radius);padding:clamp(1.25rem,3vw,2.25rem)}
/* cta */
.cta-band{background:var(--primary);color:var(--on-primary);border-radius:calc(var(--radius) + 6px);padding:clamp(2rem,6vw,4.5rem);text-align:center}
.cta-band p{opacity:.9;max-width:620px;margin-inline:auto}
.cta-band .btn{background:var(--on-primary);color:var(--primary);border-color:var(--on-primary)}
/* video */
.video{position:relative;aspect-ratio:16/9;border-radius:var(--radius);overflow:hidden;background:#000}
.video iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
/* banner */
.banner{background:var(--primary);color:var(--on-primary);text-align:center;font-size:.92rem;font-weight:600;padding:.6rem 1rem}
.banner a{color:inherit}
/* demo / preview notices */
.notice{background:#fff7d6;color:#3d3200;border-bottom:1px solid #e9d27a;font:500 .85rem/1.4 system-ui,sans-serif;text-align:center;padding:.55rem 1rem}
.notice a{color:inherit}
.ribbon{position:fixed;bottom:14px;right:14px;z-index:999;background:#111;color:#fff;font:600 .78rem/1 system-ui,sans-serif;padding:.6rem .9rem;border-radius:99px;box-shadow:0 8px 24px rgba(0,0,0,.25);pointer-events:none;opacity:.92}
/* products */
.product-card{display:flex;flex-direction:column;text-decoration:none;border-radius:var(--radius);overflow:hidden;background:var(--bg);transition:transform .25s,box-shadow .25s,border-color .25s}
body.cs-outline .product-card{border:1px solid var(--border)}
body.cs-elevated .product-card{box-shadow:0 10px 30px -18px rgba(0,0,0,.3)}
body.cs-flat .product-card{background:var(--surface)}
body.cs-glass .product-card{background:color-mix(in srgb,var(--surface) 70%,transparent);border:1px solid var(--border)}
.product-card:hover{transform:translateY(-3px)}
.product-card .ph{aspect-ratio:1;background:var(--surface);overflow:hidden;position:relative}
.product-card .ph img{width:100%;height:100%;object-fit:cover;transition:transform .5s}
.product-card:hover .ph img{transform:scale(1.04)}
.product-card .info{padding:1rem 1.1rem 1.2rem;display:grid;gap:.3rem}
.product-card .p-title{font-weight:600;line-height:1.3}
.badge{position:absolute;top:.75rem;left:.75rem;background:var(--bg);color:var(--text);font-size:.72rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:.3rem .55rem;border-radius:99px}
.badge.sold{background:var(--text);color:var(--bg)}
.products-large{--min:340px}.products-large .product-card .ph{aspect-ratio:4/5}
.products-compact{--min:180px}.products-compact .info{padding:.75rem .85rem .9rem}
.shop-tools{display:flex;flex-wrap:wrap;gap:.75rem;align-items:end;margin-bottom:2rem}
.shop-tools label{display:grid;gap:.3rem;font-size:.82rem;font-weight:600}
.shop-tools input,.shop-tools select{font:inherit;color:var(--text);background:var(--bg);border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:.6rem .75rem;min-height:44px}
.chips{display:flex;flex-wrap:wrap;gap:.6rem}
.chip{display:inline-flex;align-items:center;min-height:42px;padding:.5rem 1.1rem;border:1.5px solid var(--border);border-radius:99px;text-decoration:none;font-weight:600;font-size:.92rem}
.chip[aria-current=true]{background:var(--text);color:var(--bg);border-color:var(--text)}
.tiles{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
.tile{position:relative;aspect-ratio:4/3;border-radius:var(--radius);overflow:hidden;text-decoration:none;color:#fff;display:flex;align-items:flex-end;padding:1.25rem}
.tile img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.tile::after{content:"";position:absolute;inset:0;background:linear-gradient(transparent 40%,rgba(0,0,0,.65))}
.tile span{position:relative;z-index:1;font:700 1.25rem var(--font-h)}
.pdp{display:grid;grid-template-columns:1.1fr .9fr;gap:clamp(2rem,5vw,4rem);align-items:start}
.pdp .main-img{aspect-ratio:1;border-radius:var(--radius);overflow:hidden;background:var(--surface)}
.pdp .main-img img{width:100%;height:100%;object-fit:cover}
.pdp .thumbs button{padding:0;border:2px solid transparent;border-radius:var(--radius-sm);background:none;cursor:pointer;overflow:hidden}
.pdp .thumbs button[aria-pressed=true]{border-color:var(--primary)}
.pdp .p-price{font-size:1.5rem;margin:.25rem 0 1.25rem}
.stock{font-size:.92rem;font-weight:600}
.stock.low{color:#b45309}.stock.out{color:#b91c1c}.stock.in{color:#15803d}
.qty{width:96px}
.info-list{margin-top:2rem;border-top:1px solid var(--border)}
.info-list details{border-bottom:1px solid var(--border);padding:1rem 0}
.info-list summary{cursor:pointer;font-weight:600}
@media(max-width:860px){.pdp{grid-template-columns:1fr}}
.cart-lines{display:grid;gap:1rem}
.cart-line{display:grid;grid-template-columns:80px 1fr auto;gap:1rem;align-items:center;padding-bottom:1rem;border-bottom:1px solid var(--border)}
.cart-line img{width:80px;height:80px;object-fit:cover;border-radius:var(--radius-sm);background:var(--surface)}
.summary{background:var(--surface);border-radius:var(--radius);padding:1.5rem;display:grid;gap:.6rem;align-self:start}
.summary .row{display:flex;justify-content:space-between;gap:1rem}
.summary .total{font-size:1.2rem;font-weight:700;border-top:1px solid var(--border);padding-top:.75rem}
.checkout-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:clamp(2rem,4vw,3rem)}
@media(max-width:860px){.checkout-grid{grid-template-columns:1fr}}
fieldset{border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:1rem 1.1rem;margin:0}
legend{font-weight:700;padding:0 .4rem}
.opt{display:flex;gap:.7rem;align-items:flex-start;padding:.65rem 0;font-weight:400}
.opt input{margin-top:.3rem;width:20px;height:20px;min-height:20px}
.status-pill{display:inline-block;padding:.3rem .75rem;border-radius:99px;background:var(--soft);color:var(--primary-ink);font-weight:700;font-size:.85rem;text-transform:capitalize}
/* footer */
.site-footer{padding-block:clamp(2.5rem,5vw,4rem) 2rem;border-top:1px solid var(--border);font-size:.95rem}
.site-footer .cols{display:grid;grid-template-columns:2fr 1fr 1fr;gap:2rem}
.site-footer ul{list-style:none;padding:0;margin:0;display:grid;gap:.5rem}
.site-footer .bottom{margin-top:2.5rem;padding-top:1.25rem;border-top:1px solid var(--border);display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;color:var(--muted);font-size:.85rem}
.site-footer.big .huge{font:700 clamp(2.5rem,9vw,7rem)/.95 var(--font-h);letter-spacing:-.03em;margin-bottom:2rem;word-break:break-word}
.socials{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:1rem}
.socials a{font-size:.9rem;padding:.35rem .8rem;border:1px solid var(--border);border-radius:99px;text-decoration:none}
@media(max-width:760px){.site-footer .cols{grid-template-columns:1fr}}
.wa-float{position:fixed;right:16px;bottom:16px;z-index:60;width:56px;height:56px;border-radius:50%;background:#1f9d55;color:#fff;display:grid;place-items:center;box-shadow:0 10px 30px rgba(0,0,0,.25)}
.wa-float svg{width:28px;height:28px}
/* ornaments */
body.orn-grain{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .07 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
body.orn-grid .hero{background-image:linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px);background-size:48px 48px;background-position:-1px -1px}
body.orn-dots .hero{background-image:radial-gradient(var(--border) 1.4px,transparent 1.6px);background-size:22px 22px}
body.orn-blobs .hero::before{content:"";position:absolute;width:60vw;height:60vw;max-width:780px;max-height:780px;right:-18vw;top:-22vw;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--accent) 40%,transparent),transparent 65%);filter:blur(20px);pointer-events:none}
body.orn-blobs .hero::after{content:"";position:absolute;width:44vw;height:44vw;max-width:560px;max-height:560px;left:-14vw;bottom:-20vw;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--primary) 32%,transparent),transparent 65%);filter:blur(20px);pointer-events:none}
body.orn-blobs .hero .wrap{position:relative;z-index:1}
body.orn-lines .sec-head{border-left:2px solid var(--primary);padding-left:1.25rem}
body.orn-lines .sec-head.center{border-left:0;padding-left:0}
/* motion */
body.anim-subtle .rv,body.anim-lively .rv{opacity:0;transform:translateY(18px);transition:opacity .7s ease,transform .7s ease}
body.anim-lively .rv{transform:translateY(34px) scale(.98)}
.rv.in{opacity:1!important;transform:none!important}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;scroll-behavior:auto!important}.rv{opacity:1!important;transform:none!important}}
.no-js .rv{opacity:1;transform:none}
@media print{.site-header,.wa-float,.ribbon,.notice{display:none}}
`;
