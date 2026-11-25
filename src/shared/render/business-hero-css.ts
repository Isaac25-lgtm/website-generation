// CSS for business-heroes.ts; only the CSS for heroes a site uses is sent.
const SM = "@media(max-width:860px)";

export const BUSINESS_HERO_CSS: Record<string, string> = {
  skyline: `.hero.skyline{min-height:min(96vh,940px);display:flex;flex-direction:column;justify-content:flex-end;color:#fff;padding-bottom:2rem}
.hero.skyline .bgimg{position:absolute;inset:0}.hero.skyline .bgimg img{width:100%;height:100%;object-fit:cover}
.hero.skyline::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(8,14,30,.84),rgba(8,14,30,.5) 60%,rgba(8,14,30,.35))}
.hero.skyline>*{position:relative;z-index:2}
.hero.skyline .eyebrow{color:#fff;letter-spacing:.3em;font-size:.68rem;font-weight:500}
.hero.skyline h1{color:#fff;font-weight:400;font-size:clamp(3rem,7.5vw,6.4rem);max-width:12ch;line-height:1}
.hero.skyline .faint{opacity:.5}
.hero.skyline .sub{color:rgba(255,255,255,.85);max-width:44ch;font-size:1rem}
.hero.skyline .place{margin-top:2.5rem;font-family:var(--font-h);font-size:1.3rem}.hero.skyline .place span{display:block;font:500 .62rem/1 var(--font-b);letter-spacing:.3em;text-transform:uppercase;opacity:.7;margin-bottom:.4rem}
.hero.skyline .btn{border-radius:0;text-transform:uppercase;letter-spacing:.2em;font-size:.7rem}
.hero.skyline .btn-ghost{color:#fff;border-color:rgba(255,255,255,.6)}
.hero.skyline .stats{list-style:none;padding:1.5rem 0 0;margin-top:2.5rem;border-top:1px solid rgba(255,255,255,.25);display:grid;grid-template-columns:repeat(5,1fr);gap:1rem;font-size:.7rem;letter-spacing:.14em;text-transform:uppercase}
.hero.skyline .stats .n{display:block;font:400 2rem/1 var(--font-h);letter-spacing:0;margin-bottom:.5rem}
${SM}{.hero.skyline .stats{grid-template-columns:repeat(2,1fr)}}`,

  continent: `.hero.continent{padding-block:clamp(5rem,12vw,10rem);overflow:hidden}
.hero.continent .lines{position:absolute;inset:0;background-image:linear-gradient(90deg,var(--border) 1px,transparent 1px);background-size:calc(100% / 12) 100%;opacity:.7}
.hero.continent .wrap{position:relative;max-width:820px}
.hero.continent .label{display:inline-flex;flex-direction:column;font-family:var(--font-h);font-style:italic;font-size:1.05rem;color:var(--muted);margin-bottom:1.5rem}
.hero.continent .label svg{width:120px;height:18px;color:var(--muted)}
.hero.continent h1{font-weight:400;text-transform:uppercase;font-size:clamp(1.8rem,3.6vw,2.9rem);line-height:1.12;letter-spacing:.01em}
.hero.continent .grey{color:var(--muted)}
.hero.continent .btn{border-radius:2px;text-transform:uppercase;letter-spacing:.16em;font-size:.72rem}`,

  coordinates: `.hero.coordinates{padding-top:1rem}
.hero.coordinates .cap{display:flex;justify-content:space-between;gap:2rem;padding:.8rem 0;border-top:1px solid var(--border)}
.hero.coordinates .cap .small{display:block;font-size:.7rem;color:var(--muted)}
.hero.coordinates .cap strong,.hero.coordinates .cap h1{font-family:var(--font-b);font-weight:400;font-size:1.05rem;margin:0;letter-spacing:0}
.hero.coordinates .cap .r{text-align:right}
.hero.coordinates .frame{aspect-ratio:16/8.5;overflow:hidden;background:var(--surface)}.hero.coordinates .frame img{width:100%;height:100%;object-fit:cover}
.hero.coordinates .foot{display:flex;justify-content:space-between;align-items:center;gap:2rem;padding-top:1rem}.hero.coordinates .foot p{margin:0;max-width:52ch;color:var(--muted)}
.hero.coordinates .actions{margin:0}
${SM}{.hero.coordinates .foot{flex-direction:column;align-items:flex-start}}`,

  studiodark: `.hero.studiodark{background:var(--bg);padding-block:clamp(4rem,10vw,8rem) clamp(3rem,6vw,5rem)}
.hero.studiodark .lead{max-width:34ch;font-size:1.15rem;font-weight:500;line-height:1.35;margin-bottom:clamp(3rem,8vw,7rem)}
.hero.studiodark h1{font-size:clamp(4rem,14vw,12rem);line-height:.86;letter-spacing:-.05em;font-weight:500;margin:0}
.hero.studiodark .row{display:flex;justify-content:space-between;align-items:center;margin-top:2rem}
.hero.studiodark .scroll{font-size:.8rem;color:var(--muted)}
.hero.studiodark .btn{border-radius:99px}`,

  lettering: `.hero.lettering{text-align:center;padding-block:clamp(3rem,8vw,6rem)}
.hero.lettering .mark{font-family:var(--font-h);font-style:italic;font-weight:600;font-size:clamp(4rem,13vw,11rem);line-height:.9;letter-spacing:-.01em;margin:0 0 clamp(2rem,6vw,4rem);color:var(--text)}
.hero.lettering h1{font-family:var(--font-b);font-weight:800;font-size:clamp(2.6rem,6.4vw,5.4rem);line-height:1;max-width:14ch;margin:0 auto 2rem;letter-spacing:-.02em}
.hero.lettering .reach{font-size:1.05rem}
.hero.lettering .mailpill{display:inline-block;border:1.5px solid var(--accent);color:var(--accent);border-radius:99px;padding:.6rem 2rem;font-size:clamp(1.1rem,2.2vw,1.6rem);text-decoration:none}
.hero.lettering .actions{justify-content:center}`,

  catalogue: `.hero.catalogue{text-align:center;padding:clamp(4rem,10vw,8rem) 0 0}
.hero.catalogue .kicker{font-size:.8rem;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.hero.catalogue h1{font-weight:400;font-size:clamp(1.9rem,4vw,3.2rem);max-width:26ch;margin:0 auto 2rem;line-height:1.18}
.hero.catalogue .pills{display:flex;flex-wrap:wrap;justify-content:center;gap:.5rem}
.hero.catalogue .pill{border:1px solid var(--text);border-radius:99px;padding:.5rem 1.1rem;text-decoration:none;font-size:.9rem}
.hero.catalogue .pill:hover{background:var(--text);color:var(--bg)}
.hero.catalogue .wide{position:relative;margin-top:clamp(3rem,7vw,5rem);aspect-ratio:21/9;overflow:hidden}.hero.catalogue .wide img{width:100%;height:100%;object-fit:cover}
.hero.catalogue .cat-card{position:absolute;right:clamp(1rem,4vw,3rem);bottom:clamp(1rem,4vw,3rem);width:min(340px,80%);background:var(--bg);text-align:left;padding:1.3rem 1.4rem;border-radius:var(--radius)}
.hero.catalogue .cat-card p{font-size:.92rem;color:var(--muted)}
${SM}{.hero.catalogue .wide{aspect-ratio:4/5}}`,

  monolith: `.hero.monolith{padding-top:1rem;overflow:hidden}
.hero.monolith .word{font-weight:800;font-size:clamp(4rem,16vw,15rem);line-height:.8;letter-spacing:-.06em;margin:0;font-stretch:85%;text-transform:uppercase}
.hero.monolith .stage{display:grid;grid-template-columns:1fr 1.1fr 1fr;gap:2rem;align-items:end;margin-top:1.5rem}
.hero.monolith .l{font-size:.8rem;text-transform:uppercase;letter-spacing:.14em;color:var(--muted)}
.hero.monolith .obj{aspect-ratio:1;overflow:hidden;border-radius:50% 50% 0 0}.hero.monolith .obj img{width:100%;height:100%;object-fit:cover}
.hero.monolith h1{font-size:clamp(1.3rem,2vw,1.7rem);font-weight:600;line-height:1.25}
.hero.monolith .btn-primary{border-radius:99px}
${SM}{.hero.monolith .stage{grid-template-columns:1fr}}`,

  canal: `.hero.canal{padding:0}
.hero.canal .split{display:grid;grid-template-columns:1fr 1.15fr;min-height:min(94vh,920px)}
.hero.canal .copy{display:flex;flex-direction:column;justify-content:flex-end;padding:clamp(2rem,6vw,5rem) clamp(1.5rem,4vw,3rem) clamp(2rem,6vw,5rem) max(1.25rem,calc((100vw - var(--maxw))/2))}
.hero.canal h1{font-size:clamp(3rem,8vw,7rem);line-height:.86;text-transform:uppercase;font-stretch:70%;letter-spacing:-.01em;max-width:9ch}
.hero.canal .eyebrow{color:var(--primary-ink)}
.hero.canal .media{position:relative;overflow:hidden}.hero.canal .media img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
${SM}{.hero.canal .split{grid-template-columns:1fr}.hero.canal .media{min-height:56vh}}`,

  realwork: `.hero.realwork{min-height:min(92vh,880px);display:flex;align-items:flex-end;color:#fff;padding-bottom:clamp(2.5rem,6vw,5rem)}
.hero.realwork .bgimg{position:absolute;inset:0}.hero.realwork .bgimg img{width:100%;height:100%;object-fit:cover}
.hero.realwork::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.62),rgba(0,0,0,.25))}
.hero.realwork .wrap{position:relative;z-index:2;display:grid;grid-template-columns:1.25fr .75fr;gap:2.5rem;align-items:end}
.hero.realwork h1{color:#fff;font-size:clamp(3rem,7.6vw,6.6rem);line-height:.95;font-weight:700;margin:0}
.hero.realwork .hot{color:var(--accent)}
.hero.realwork .panel{display:grid;gap:.6rem;font-size:1rem}
.hero.realwork .panel strong{font-size:1.3rem}
.hero.realwork .rule{width:42px;height:3px;background:var(--accent)}
.hero.realwork .panel p{color:rgba(255,255,255,.86);margin:0}
.hero.realwork .btn-primary{background:#fff;color:#111;border-color:#fff;border-radius:99px}
.hero.realwork .btn-ghost{color:#fff;border-color:rgba(255,255,255,.6);border-radius:99px}
${SM}{.hero.realwork .wrap{grid-template-columns:1fr}}`,

  colorword: `.hero.colorword{padding-block:clamp(3rem,8vw,6rem)}
.hero.colorword .cw-word{margin:0;font-family:var(--font-h);font-weight:800;font-size:clamp(4rem,15vw,14rem);line-height:.82;letter-spacing:-.05em}
.hero.colorword .cw-0{color:#e4572e}.hero.colorword .cw-1{color:#2f6fed}.hero.colorword .cw-2{color:#f3a712}.hero.colorword .cw-3{color:#29a36a}.hero.colorword .cw-4{color:#a23bec}
.hero.colorword h1{font-size:clamp(1.4rem,2.6vw,2.2rem);font-weight:500;max-width:30ch;margin-top:2rem}`,
  blueprint: `.hero.blueprint{background:#0d2b52;color:#e6eefb;background-image:linear-gradient(rgba(230,238,251,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(230,238,251,.08) 1px,transparent 1px);background-size:32px 32px}
.hero.blueprint .wrap{display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:center;min-height:min(78vh,720px)}
.hero.blueprint h1{color:inherit;font-weight:500}.hero.blueprint .sub,.hero.blueprint .eyebrow{color:#b9c8e2}
.hero.blueprint .bp-art{width:100%;color:#8fb2e8}
.hero.blueprint .btn{color:#e6eefb;border-color:rgba(230,238,251,.5)}.hero.blueprint .btn-primary{background:#e6eefb;color:#0d2b52}
${SM}{.hero.blueprint .wrap{grid-template-columns:1fr}}`,
  typeintro: `.hero.typeintro{min-height:min(86vh,800px);display:flex;align-items:center;text-align:center}
.hero.typeintro h1{font-weight:400;font-size:clamp(2.4rem,6vw,5rem);max-width:18ch;margin-inline:auto;line-height:1.08}
.hero.typeintro h1 span{display:inline-block;opacity:0;transform:translateY(.3em);animation:ti-in .7s ease forwards}
@keyframes ti-in{to{opacity:1;transform:none}}
.hero.typeintro .ti-by{font-size:.85rem;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);margin-top:2rem}
.hero.typeintro .actions{justify-content:center}`,
  marquee: `.hero.marquee{padding-top:0;overflow:hidden}
.hero.marquee .mq-band{white-space:nowrap;overflow:hidden;border-bottom:1px solid var(--text);margin-bottom:clamp(2rem,5vw,4rem)}
.hero.marquee .mq-run{display:inline-block;animation:mq 30s linear infinite}
.hero.marquee .mq-run span{font-weight:800;font-size:clamp(4rem,14vw,12rem);line-height:1;letter-spacing:-.04em;margin-right:4rem;text-transform:uppercase}
@keyframes mq{to{transform:translateX(-50%)}}
.hero.marquee h1{font-size:clamp(1.6rem,3vw,2.4rem);max-width:28ch}
.hero.marquee .mq-table{width:100%;border-collapse:collapse;margin:2rem 0;font-size:.95rem}
.hero.marquee .mq-table th,.hero.marquee .mq-table td{text-align:left;padding:.9rem .5rem;border-bottom:1px solid var(--border);vertical-align:top}
.hero.marquee thead th{font-size:.72rem;text-transform:uppercase;letter-spacing:.14em;color:var(--muted);border-bottom:1px solid var(--text)}
.hero.marquee tbody th{font-weight:600}`,
  pixel: `.hero.pixel{padding-block:clamp(4rem,10vw,8rem)}
.hero.pixel .px-word{margin:0 0 2rem;font-family:var(--font-h);font-weight:700;font-size:clamp(3.4rem,11vw,9rem);line-height:.9;text-transform:uppercase;letter-spacing:.04em;color:var(--primary-ink);-webkit-mask:linear-gradient(90deg,#000 80%,transparent 80%) 0 0/8px 100%,linear-gradient(#000 80%,transparent 80%) 0 0/100% 8px;-webkit-mask-composite:source-in;mask:linear-gradient(90deg,#000 80%,transparent 80%) 0 0/8px 100%,linear-gradient(#000 80%,transparent 80%) 0 0/100% 8px;mask-composite:intersect}
.hero.pixel h1{font-weight:400;font-size:clamp(1.6rem,3vw,2.4rem);max-width:26ch}`,
  contractor: `.hero.contractor{min-height:min(80vh,720px);display:flex;align-items:center;justify-content:center;text-align:center;color:#fff}
.hero.contractor .bgimg{position:absolute;inset:0}.hero.contractor .bgimg img{width:100%;height:100%;object-fit:cover}
.hero.contractor::after{content:"";position:absolute;inset:0;background:rgba(10,14,20,.6)}
.hero.contractor .wrap{position:relative;z-index:2;max-width:900px}
.hero.contractor h1{color:#fff;font-size:clamp(2.2rem,5vw,3.8rem)}
.hero.contractor .sub{color:rgba(255,255,255,.86);margin-inline:auto}
.hero.contractor .actions{justify-content:center}
.hero.contractor .btn-primary{min-width:200px;border-radius:6px}
.hero.contractor .btn-ghost{color:#fff;border-color:rgba(255,255,255,.6);border-radius:6px}`,
};
