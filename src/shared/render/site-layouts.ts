// Personal and business layouts (Signature batch). Each is a complete site design shared by a family of
// templates, modelled on the structure of the top-ranked professional sites in the research (statement intro,
// portrait + big name, text CV, executive panel with awards; premium firm, dark advisory, maker studio,
// photo-led hospitality). Structure only: no source text, images, logos or code.

export type SiteLayout = "intro" | "portrait" | "cv" | "executive" | "firm" | "advisory" | "studio" | "stay";

/** Hero variants added for these layouts (usable by any template). */
export const SITE_HERO_CSS = `
.hero.intro{padding-block:clamp(4.5rem,13vw,10rem) clamp(3rem,7vw,5.5rem)}
.hero.intro .who{display:flex;align-items:center;gap:.9rem;margin-bottom:2rem}
.hero.intro .who .pic{width:60px;height:60px;border-radius:50%;overflow:hidden;flex:none;background:var(--surface)}
.hero.intro .who .pic img{width:100%;height:100%;object-fit:cover}
.hero.intro .who .eyebrow{margin:0}
.hero.intro h1{font-weight:400;font-size:clamp(2.2rem,5.2vw,4.4rem);line-height:1.08;max-width:22ch;letter-spacing:-.02em}
.hero.nameplate{padding-block:clamp(2.5rem,6vw,5rem) clamp(2rem,5vw,4rem)}
.hero.nameplate .np-meta{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1.25rem}
.hero.nameplate .chip-s{display:inline-flex;align-items:center;gap:.45rem;border:1px solid var(--border);border-radius:99px;padding:.35rem .85rem;font-size:.85rem}
.hero.nameplate .chip-s::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--accent)}
.hero.nameplate h1{font-size:clamp(3.4rem,12.5vw,11.5rem);line-height:.86;letter-spacing:-.055em;margin:0 0 clamp(1.5rem,4vw,3rem);word-break:break-word}
.hero.nameplate .np-row{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(1.5rem,5vw,4.5rem);align-items:end}
.hero.nameplate .np-photo{aspect-ratio:4/5;overflow:hidden;border-radius:var(--radius);background:var(--surface);max-width:460px}
.hero.nameplate .np-photo img{width:100%;height:100%;object-fit:cover}
.hero.nameplate .np-line{font-size:clamp(1.3rem,2.4vw,2rem);line-height:1.3;max-width:28ch;margin:0}
.hero.cvhead{padding-block:clamp(3rem,8vw,6rem) clamp(1.5rem,3vw,2.5rem)}
.hero.cvhead .wrap{display:grid;grid-template-columns:200px 1fr;gap:2.5rem;align-items:start}
.hero.cvhead h1{font-size:1.2rem;letter-spacing:0;margin:0 0 .3rem}
.hero.cvhead .role{color:var(--muted);margin:0;font-size:.95rem}
.hero.cvhead .statement{font-size:clamp(1.4rem,2.6vw,2.1rem);line-height:1.3;max-width:30ch;margin:0}
.hero.cvhead .actions{margin-top:1.5rem;gap:1.5rem}
.hero.cvhead .btn{background:none!important;border:0;color:var(--text)!important;padding:0;min-height:auto;text-decoration:underline;text-underline-offset:5px;font-weight:500}
.hero.panelcard{padding-block:clamp(2rem,5vw,4rem)}
.hero.panelcard .frame{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,.65fr);border:1px solid var(--border);background:var(--surface)}
.hero.panelcard .pc-copy{padding:clamp(1.75rem,5vw,4.5rem);display:flex;flex-direction:column;justify-content:space-between;gap:2rem}
.hero.panelcard h1{font-size:clamp(2.6rem,6vw,5.2rem);margin:.5rem 0 0}
.hero.panelcard .pc-line{font-size:clamp(1.15rem,2vw,1.5rem);max-width:34ch;margin:0;color:var(--muted)}
.hero.panelcard .pc-photo{position:relative;min-height:420px;border-left:1px solid var(--border)}
.hero.panelcard .pc-photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:grayscale(.25)}
.hero.firm{padding:0}
.hero.firm .firm-grid{display:grid;grid-template-columns:1fr 1fr;min-height:min(86vh,820px)}
.hero.firm .copy{display:flex;align-items:center;padding:clamp(2.5rem,6vw,5rem) clamp(1.5rem,4vw,4rem) clamp(2.5rem,6vw,5rem) max(1.25rem,calc((100vw - var(--maxw)) / 2))}
.hero.firm h1{font-weight:400;max-width:15ch}
.hero.firm .media{position:relative;overflow:hidden;background:var(--surface)}
.hero.firm .media img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.hero.promise{text-align:center;padding-block:clamp(4rem,11vw,9rem) clamp(3rem,7vw,5rem)}
.hero.promise .wrap::before{content:"";display:block;width:1px;height:64px;background:var(--accent);margin:0 auto 2.25rem}
.hero.promise h1{font-weight:400;font-size:clamp(2.6rem,6.6vw,5.8rem);max-width:16ch;margin-inline:auto;line-height:1.02}
.hero.promise .sub{margin-inline:auto}
.hero.promise .actions{justify-content:center}
.hero.promise .hero-media{margin-top:clamp(3rem,6vw,5rem);aspect-ratio:21/9;border-radius:var(--radius-sm)}
.hero.calm{text-align:center;padding:clamp(4rem,10vw,8rem) 0 0}
.hero.calm h1{font-weight:400;font-size:clamp(1.9rem,4.2vw,3.4rem);max-width:24ch;margin-inline:auto;line-height:1.15}
.hero.calm .sub{margin-inline:auto}
.hero.calm .actions{justify-content:center}
.hero.calm .actions .btn{border-radius:99px}
.hero.calm .calm-media{margin-top:clamp(3rem,7vw,5.5rem);aspect-ratio:21/9;overflow:hidden;background:var(--surface)}
.hero.calm .calm-media img{width:100%;height:100%;object-fit:cover}
.awards{width:100%;border-collapse:collapse;font-size:.98rem}
.awards th{text-align:left;font:600 .74rem/1 var(--font-b);text-transform:uppercase;letter-spacing:.14em;color:var(--muted);padding:0 1rem .9rem 0;border-bottom:1px solid var(--text)}
.awards td{padding:1.05rem 1rem 1.05rem 0;border-bottom:1px solid var(--border);vertical-align:top}
.awards td:last-child,.awards th:last-child{text-align:right;padding-right:0;white-space:nowrap}
.awards .t{font-family:var(--font-h);font-size:1.12rem}
@media(max-width:860px){
 .hero.nameplate .np-row,.hero.cvhead .wrap,.hero.panelcard .frame,.hero.firm .firm-grid{grid-template-columns:1fr}
 .hero.panelcard .pc-photo{min-height:340px;border-left:0;border-top:1px solid var(--border)}
 .hero.firm .media{min-height:56vh}
 .hero.calm .calm-media{aspect-ratio:4/3}
 .awards td:nth-child(2),.awards th:nth-child(2){display:none}
}
`;

const quietHeads = (l: string) => `.lay-${l} .sec-head h2{font:600 .8rem/1.2 var(--font-b);text-transform:uppercase;letter-spacing:.16em;color:var(--muted)}`;

export const SITE_LAYOUT_CSS: Record<SiteLayout, string> = {
  intro: `
.lay-intro .sec+.sec{border-top:1px solid var(--border)}
${quietHeads("intro")}
.lay-intro .about.columns .body{columns:1;max-width:62ch;font-size:1.12rem}
.lay-intro .cta-band{background:none;color:var(--text);text-align:left;padding:0;border-radius:0}
.lay-intro .cta-band h2{font-weight:400;font-size:clamp(2rem,4.4vw,3.6rem);max-width:18ch}
.lay-intro .cta-band p{margin-inline:0}
.lay-intro .cta-band .btn{background:var(--text);color:var(--bg);border-color:var(--text)}
.lay-intro .proj-index article h3{font-weight:500}
`,
  portrait: `
.lay-portrait .sec-head h2{font-size:clamp(2.2rem,5.4vw,4.4rem);letter-spacing:-.045em;line-height:.95}
.lay-portrait .proj-alt .media{border-radius:var(--radius)}
.lay-portrait .cta-band{border-radius:var(--radius)}
.lay-portrait .cta-band h2{font-size:clamp(2.4rem,6vw,5rem);letter-spacing:-.045em}
`,
  cv: `
.lay-cv{font-size:1rem}
.lay-cv .wrap{width:min(100% - 2.5rem,1040px)}
.lay-cv .sec{padding-block:clamp(2rem,4.5vw,3.25rem)}
.lay-cv .sec+.sec,.lay-cv .hero+.sec{border-top:1px solid var(--border)}
${quietHeads("cv")}
@media(min-width:861px){
 .lay-cv .sec>.wrap{display:grid;grid-template-columns:200px 1fr;column-gap:2.5rem;align-items:start}
 .lay-cv .sec>.wrap>*{grid-column:2}
 .lay-cv .sec>.wrap>.sec-head{grid-column:1;grid-row:1 / span 20;position:sticky;top:96px;margin:0}
}
.lay-cv .about.columns .body{columns:1;max-width:64ch}
.lay-cv .xp-table article{grid-template-columns:150px 1fr;border-top:0;padding:0 0 1.5rem}
.lay-cv .proj-index{border-top:0}
.lay-cv .proj-index article{grid-template-columns:1fr;gap:.35rem;padding:0 0 1.5rem;border-bottom:0}
.lay-cv .cta-band{background:none;color:var(--text);text-align:left;padding:0}
.lay-cv .cta-band h2{font-size:1.4rem}
.lay-cv .cta-band p{margin-inline:0}
.lay-cv .cta-band .actions{justify-content:flex-start!important}
.lay-cv .cta-band .btn{background:var(--text);color:var(--bg);border-color:var(--text)}
.lay-cv .tag{border-radius:2px}
`,
  executive: `
.lay-executive .sec-head h2{font-weight:400}
.lay-executive .sec+.sec{border-top:1px solid var(--border)}
.lay-executive .cta-band{background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:0}
.lay-executive .cta-band .btn{background:var(--primary);color:var(--on-primary);border-color:var(--primary)}
.lay-executive .proj-index article h3{font-family:var(--font-h);font-weight:400;font-size:1.4rem}
`,
  firm: `
.lay-firm .sec-head h2{font-weight:400}
.lay-firm .sec-head h2::after{content:"";display:block;width:48px;height:2px;background:var(--accent);margin-top:1.1rem}
.lay-firm .sec-head.center h2::after{margin-inline:auto}
.lay-firm .numbered .row h3{font-family:var(--font-h);font-weight:400;font-size:1.45rem}
.lay-firm .highlights li::before{background:var(--accent);border-radius:0;width:14px;height:1px;margin-top:.8rem}
.lay-firm .cta-band{border-radius:0}
`,
  advisory: `
.lay-advisory .sec-head{text-align:center;margin-inline:auto}
.lay-advisory .sec-head h2{font-weight:400;font-size:clamp(2rem,4vw,3.2rem)}
.lay-advisory .sec-head .lead{margin-inline:auto}
.lay-advisory .highlights{border-top:1px solid var(--border);gap:0}
.lay-advisory .highlights li{border-bottom:1px solid var(--border);padding:1rem 0;font-family:var(--font-h);font-size:1.25rem}
.lay-advisory .highlights li::before{display:none}
.lay-advisory .numbered .row h3{font-family:var(--font-h);font-weight:400;font-size:1.5rem}
.lay-advisory .cta-band{background:none;border:1px solid var(--border);color:var(--text);border-radius:0}
.lay-advisory .cta-band h2{font-weight:400}
.lay-advisory .cta-band .btn{background:var(--text);color:var(--bg);border-color:var(--text)}
`,
  studio: `
.lay-studio .sec-head h2{font-weight:400}
.lay-studio .card{background:transparent!important;border:0!important;box-shadow:none!important;padding:0}
.lay-studio .card-media{margin:0 0 1.1rem;aspect-ratio:4/5;border-radius:var(--radius-sm)}
.lay-studio .card h3{font-family:var(--font-h);font-weight:400;font-size:1.4rem}
.lay-studio .cta-band{background:var(--accent);color:var(--on-accent);border-radius:var(--radius);text-align:left}
.lay-studio .cta-band h2{font-weight:400;font-style:italic;font-size:clamp(2rem,4.6vw,3.6rem)}
.lay-studio .cta-band p{margin-inline:0}
.lay-studio .cta-band .actions{justify-content:flex-start!important}
.lay-studio .cta-band .btn{background:var(--on-accent);color:var(--accent);border-color:var(--on-accent);border-radius:99px}
.lay-studio .about.split .media{border-radius:var(--radius-sm)}
`,
  stay: `
.lay-stay .sec-head{text-align:center;margin-inline:auto}
.lay-stay .sec-head h2{font-weight:400;font-size:clamp(2rem,4.4vw,3.4rem)}
.lay-stay .sec-head .lead{margin-inline:auto}
.lay-stay .card{background:transparent!important;border:0!important;box-shadow:none!important;padding:0;text-align:center}
.lay-stay .card-media{margin:0 0 1.1rem;aspect-ratio:3/4;border-radius:0}
.lay-stay .card h3{font-family:var(--font-h);font-weight:400;font-size:1.45rem}
.lay-stay .card .price{font-size:.8rem;text-transform:uppercase;letter-spacing:.14em}
.lay-stay .cta-band{border-radius:0}
.lay-stay .cta-band h2{font-weight:400}
.lay-stay .gallery.strip img{border-radius:0}
`,
};
