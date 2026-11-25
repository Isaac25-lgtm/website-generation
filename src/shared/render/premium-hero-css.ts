// CSS for premium-heroes.ts; only the CSS for heroes a site uses is sent.
const SM = "@media(max-width:860px)";
const img100 = (sel: string) => `${sel} img{width:100%;height:100%;object-fit:cover}`;

export const PREMIUM_HERO_CSS: Record<string, string> = {
  desktop: `.hero.desktop{padding:clamp(1rem,3vw,2rem)}
.hero.desktop .dk-screen{position:relative;min-height:min(84vh,760px);border-radius:10px;overflow:hidden;background:var(--primary)}
.hero.desktop .dk-screen>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.55}
.hero.desktop .dk-icons{position:relative;list-style:none;margin:0;padding:1.5rem;display:grid;gap:1.2rem;width:110px}
.hero.desktop .dk-icons a{display:grid;justify-items:center;gap:.35rem;color:#fff;text-decoration:none;font-size:.8rem;text-shadow:0 1px 3px rgba(0,0,0,.6)}
.hero.desktop .dk-ico{width:42px;height:36px;border-radius:4px;background:#f6d365;box-shadow:inset 0 -6px 0 rgba(0,0,0,.15)}
.hero.desktop .dk-win{position:absolute;left:50%;top:50%;transform:translate(-45%,-55%);width:min(520px,86%);background:#ece9d8;border:2px solid #0a246a;border-radius:8px 8px 4px 4px;box-shadow:6px 8px 0 rgba(0,0,0,.25);color:#111}
.hero.desktop .dk-bar{display:flex;justify-content:space-between;align-items:center;background:#0a246a;color:#fff;padding:.4rem .7rem;font-size:.85rem;font-weight:700;border-radius:6px 6px 0 0}
.hero.desktop .dk-bar i{width:18px;height:18px;background:#e2514a;border-radius:3px}
.hero.desktop .dk-body{padding:1.3rem 1.4rem}
.hero.desktop h1{font-size:clamp(1.8rem,3.4vw,2.6rem);color:#111}
.hero.desktop .dk-body .btn{border-radius:3px;background:#ece9d8;color:#111;border:1px solid #333;box-shadow:inset -1px -1px 0 #888}
.hero.desktop .dk-task{position:absolute;left:0;right:0;bottom:0;display:flex;gap:1rem;align-items:center;background:#245edb;color:#fff;font-size:.82rem;padding:.3rem .5rem}
.hero.desktop .dk-start{background:#3c9a32;padding:.25rem .9rem;border-radius:0 10px 10px 0;font-weight:700;font-style:italic}`,

  globe: `.hero.globe{background:var(--primary);color:var(--on-primary);overflow:hidden}
.hero.globe .wrap{display:grid;grid-template-columns:1fr 1fr;gap:2rem;align-items:center;min-height:min(80vh,720px)}
.hero.globe h1{color:inherit;font-size:clamp(3rem,8vw,6.6rem);line-height:.9;letter-spacing:-.04em}
.hero.globe .sub,.hero.globe .eyebrow{color:inherit;opacity:.9}
.hero.globe .gl-sphere{aspect-ratio:1;border-radius:50%;background-image:radial-gradient(currentColor 28%,transparent 30%);background-size:14px 14px;-webkit-mask:radial-gradient(circle at 35% 35%,#000 20%,rgba(0,0,0,.35) 70%,transparent 71%);mask:radial-gradient(circle at 35% 35%,#000 20%,rgba(0,0,0,.35) 70%,transparent 71%)}
.hero.globe .btn{border-color:currentColor;color:inherit}.hero.globe .btn-primary{background:var(--on-primary);color:var(--primary)}
${SM}{.hero.globe .wrap{grid-template-columns:1fr}}`,

  planet: `.hero.planet{text-align:center;padding-block:clamp(4rem,10vw,8rem);background-image:radial-gradient(var(--border) 1.5px,transparent 1.6px);background-size:22px 22px}
.hero.planet .pl-orb{display:block;width:150px;height:150px;margin:0 auto 1.5rem;border-radius:50%;background:var(--accent);position:relative}
.hero.planet .pl-orb i{position:absolute;left:-30%;right:-30%;top:44%;height:16%;border:3px solid var(--text);border-radius:50%;transform:rotate(-14deg)}
.hero.planet h1{font-style:italic;font-weight:600;font-size:clamp(3rem,8vw,6rem)}
.hero.planet .sub{margin-inline:auto}.hero.planet .actions{justify-content:center}.hero.planet .btn{border-radius:99px}`,

  nameback: `.hero.nameback{overflow:hidden}
.hero.nameback .wrap{position:relative;display:grid;grid-template-columns:1fr auto 1fr;gap:2rem;align-items:end;min-height:min(80vh,760px)}
.hero.nameback .nb-name{position:absolute;left:50%;top:6%;transform:translateX(-50%);margin:0;font-family:var(--font-h);font-weight:800;font-size:clamp(6rem,24vw,22rem);line-height:.8;color:var(--accent);letter-spacing:-.05em;white-space:nowrap;pointer-events:none}
.hero.nameback .nb-pic{grid-column:2;position:relative;width:min(36vw,420px);aspect-ratio:4/5;border-radius:var(--radius) var(--radius) 0 0;overflow:hidden}${img100(".hero.nameback .nb-pic")}
.hero.nameback .nb-copy{grid-column:1;grid-row:1;position:relative;align-self:end}
.hero.nameback h1{font-size:clamp(1.8rem,3vw,2.4rem)}
.hero.nameback .nb-stats{grid-column:3;grid-row:1;display:grid;gap:.6rem;position:relative}
.hero.nameback .nb-card{background:var(--surface);border-radius:14px;padding:.9rem 1rem;font-weight:600;display:grid;gap:.2rem}.hero.nameback .nb-card span{font-size:.72rem;color:var(--muted)}
${SM}{.hero.nameback .wrap{grid-template-columns:1fr}.hero.nameback .nb-pic,.hero.nameback .nb-copy,.hero.nameback .nb-stats{grid-column:1;grid-row:auto;width:100%}}`,

  fullportrait: `.hero.fullportrait{min-height:min(96vh,940px);display:flex;align-items:flex-end;color:#fff}
.hero.fullportrait .bgimg{position:absolute;inset:0}${img100(".hero.fullportrait .bgimg")}
.hero.fullportrait::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.1) 30%,rgba(0,0,0,.72))}
.hero.fullportrait h1{text-shadow:0 2px 24px rgba(0,0,0,.45)}
.hero.fullportrait .btn-ghost{color:#fff;border-color:rgba(255,255,255,.65)}
.hero.fullportrait .wrap{position:relative;z-index:2;padding-bottom:clamp(2rem,5vw,4rem)}
.hero.fullportrait h1{color:#fff;font-weight:400;font-size:clamp(2.6rem,6vw,5rem)}.hero.fullportrait .sub{color:rgba(255,255,255,.88)}`,

  scatter: `.hero.scatter{min-height:min(92vh,880px);display:flex;align-items:center;justify-content:center;text-align:center;overflow:hidden}
.hero.scatter .sc-field figure{position:absolute;margin:0;width:clamp(110px,14vw,200px);aspect-ratio:4/5;overflow:hidden;box-shadow:0 14px 30px -16px rgba(0,0,0,.45)}${img100(".hero.scatter .sc-field figure")}
.hero.scatter .sc-0{left:6%;top:12%;transform:rotate(-6deg)}.hero.scatter .sc-1{right:8%;top:10%;transform:rotate(5deg)}.hero.scatter .sc-2{left:12%;bottom:8%;transform:rotate(4deg)}.hero.scatter .sc-3{right:12%;bottom:10%;transform:rotate(-4deg)}.hero.scatter .sc-4{left:40%;top:4%;transform:rotate(2deg);width:110px}.hero.scatter .sc-5{right:38%;bottom:4%;transform:rotate(-3deg);width:110px}
.hero.scatter .wrap{position:relative;z-index:2;max-width:620px}
.hero.scatter h1{font-weight:400;font-size:clamp(2.8rem,7vw,5.6rem);color:var(--primary-ink)}
.hero.scatter .sub{margin-inline:auto}.hero.scatter .actions{justify-content:center}
${SM}{.hero.scatter .sc-field figure{opacity:.35}}`,

  lockscreen: `.hero.lockscreen .wrap{display:grid;grid-template-columns:1fr 360px;gap:3rem;align-items:center}
.hero.lockscreen h1{font-size:clamp(2.6rem,6vw,4.8rem)}
.hero.lockscreen .ls-phone{border-radius:44px;padding:3rem 1rem 2rem;background:linear-gradient(180deg,#2c3e50,#4a6274);color:#fff;border:10px solid #111;aspect-ratio:9/18.5;display:flex;flex-direction:column;gap:.6rem}
.hero.lockscreen .ls-time{text-align:center;font-size:2.6rem;font-weight:600;line-height:1}
.hero.lockscreen .ls-date{text-align:center;font-size:.9rem;opacity:.85;margin-bottom:1.2rem}
.hero.lockscreen .ls-note{background:rgba(255,255,255,.18);backdrop-filter:blur(8px);border-radius:16px;padding:.7rem .9rem;font-size:.82rem;display:grid;gap:.15rem}
.hero.lockscreen .ls-note span{opacity:.85;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
${SM}{.hero.lockscreen .wrap{grid-template-columns:1fr}.hero.lockscreen .ls-phone{max-width:340px}}`,

  levels: `.hero.levels .wrap{display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:start}
.hero.levels .lv-tag{font:700 .75rem/1 ui-monospace,monospace;background:var(--accent);color:var(--on-accent);padding:.3rem .6rem;border-radius:3px}
.hero.levels h1{font-size:clamp(2.6rem,6vw,4.6rem);margin-top:1rem}
.hero.levels .lv-list{list-style:none;padding:0;margin:0;display:grid;gap:.8rem}
.hero.levels .lv-list li{border:2px solid var(--text);border-radius:8px;padding:.8rem 1rem;display:grid;gap:.25rem;background:var(--surface)}
.hero.levels .lv-n{font:700 .7rem/1 ui-monospace,monospace;color:var(--primary-ink)}
.hero.levels .lv-list i{display:block;height:8px;border-radius:4px;background:linear-gradient(90deg,var(--accent) var(--p),var(--border) var(--p))}
${SM}{.hero.levels .wrap{grid-template-columns:1fr}}`,

  playshapes: `.hero.playshapes{background:var(--primary);color:var(--on-primary);overflow:hidden;min-height:min(80vh,720px);display:flex;align-items:center}
.hero.playshapes .ps-shapes i{position:absolute;display:block;border-radius:50%}
.hero.playshapes .ps-shapes i:nth-child(1){width:180px;height:180px;background:#ff8a65;right:8%;top:12%}.hero.playshapes .ps-shapes i:nth-child(2){width:90px;height:90px;background:#ffd54f;right:26%;bottom:16%}.hero.playshapes .ps-shapes i:nth-child(3){width:130px;height:60px;border-radius:60px;background:#81c784;left:58%;top:58%}.hero.playshapes .ps-shapes i:nth-child(4){width:60px;height:60px;background:#f48fb1;right:6%;bottom:10%}
.hero.playshapes .wrap{position:relative}
.hero.playshapes h1{color:inherit;font-size:clamp(3.4rem,10vw,8rem);line-height:.9;letter-spacing:-.03em;max-width:8ch}
.hero.playshapes .sub{color:inherit;opacity:.88}
.hero.playshapes .btn{border-radius:99px;border-color:currentColor;color:inherit}.hero.playshapes .btn-primary{background:var(--on-primary);color:var(--primary)}`,

  stickies: `.hero.stickies{background:var(--surface)}
.hero.stickies h1{font-size:clamp(2.4rem,6vw,4.6rem);margin-bottom:2rem}
.hero.stickies .st-board{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1.2rem;margin-bottom:1.5rem}
.hero.stickies .st-n{background:#fff59d;color:#2b2a1d;padding:1.2rem 1.1rem;min-height:170px;font-size:1rem;line-height:1.4;box-shadow:0 12px 24px -16px rgba(0,0,0,.45)}
.hero.stickies .st-0{transform:rotate(-2deg)}.hero.stickies .st-1{background:#b3e5fc;transform:rotate(1.5deg)}.hero.stickies .st-2{background:#f8bbd0;transform:rotate(-1deg)}.hero.stickies .st-3{background:#c8e6c9;transform:rotate(2deg)}.hero.stickies .st-4{background:#ffe0b2;transform:rotate(-1.5deg)}`,

  initials: `.hero.initials{background:#0c0c0c;color:#f1f1ef;overflow:hidden}
.hero.initials .in-big{margin:0;font-family:var(--font-h);font-size:clamp(9rem,34vw,30rem);line-height:.78;letter-spacing:-.06em;font-weight:700}
.hero.initials .in-row{display:flex;justify-content:space-between;gap:2rem;align-items:end;margin-top:2.5rem;position:relative;z-index:1;background:inherit;border-top:1px solid rgba(255,255,255,.2);padding-top:1rem}
.hero.initials h1{color:inherit;font-size:clamp(1.4rem,2.4vw,2rem);margin:0}.hero.initials .in-row p{margin:0;max-width:44ch;opacity:.8}
.hero.initials .btn{color:#f1f1ef;border-color:rgba(255,255,255,.5)}.hero.initials .btn-primary{background:#f1f1ef;color:#0c0c0c}`,

  ticker: `.hero.ticker{overflow:hidden;padding-bottom:0}
.hero.ticker .tk-shapes i{position:absolute;display:block}
.hero.ticker .tk-shapes i:nth-child(1){width:120px;height:120px;border-radius:50%;background:var(--accent);right:10%;top:10%}.hero.ticker .tk-shapes i:nth-child(2){width:0;height:0;border-left:70px solid transparent;border-right:70px solid transparent;border-bottom:120px solid #ffcf3f;right:28%;top:40%}.hero.ticker .tk-shapes i:nth-child(3){width:160px;height:24px;background:repeating-linear-gradient(90deg,var(--text) 0 12px,transparent 12px 24px);right:6%;bottom:30%}
.hero.ticker .wrap{position:relative}
.hero.ticker h1{font-size:clamp(3.2rem,9vw,7.4rem);line-height:.9;text-transform:uppercase;max-width:9ch}
.hero.ticker .tk-band{margin-top:clamp(2rem,6vw,4rem);background:var(--text);color:var(--bg);padding:.8rem 0;white-space:nowrap;overflow:hidden}
.hero.ticker .tk-run{display:inline-block;animation:tk 40s linear infinite}
.hero.ticker .tk-run span{margin:0 1.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em}
.hero.ticker .tk-run span::after{content:"●";margin-left:1.6rem;color:var(--accent)}
@keyframes tk{to{transform:translateX(-50%)}}`,

  clients: `.hero.clients{background:var(--primary);color:var(--on-primary)}
.hero.clients .cl-intro{font:500 1.1rem/1.5 var(--font-b);letter-spacing:0;max-width:46ch;opacity:.9;color:inherit;margin:0}
.hero.clients .cl-list{list-style:none;padding:0;margin:1.5rem 0;display:grid}
.hero.clients .cl-list a{display:block;color:inherit;text-decoration:none;font-family:var(--font-h);font-style:italic;font-weight:700;font-size:clamp(2.4rem,7vw,6rem);line-height:1;letter-spacing:-.03em;padding:.12em 0;border-bottom:1px solid color-mix(in srgb,currentColor 30%,transparent)}
.hero.clients .cl-list a:hover{padding-left:.3em;transition:padding .25s}
.hero.clients .btn{border-color:currentColor;color:inherit}.hero.clients .btn-primary{background:var(--on-primary);color:var(--primary)}`,

  swiss: `.hero.swiss .sw-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:1.5rem 1rem;border-top:3px solid var(--text);padding-top:1rem}
.hero.swiss h1{grid-column:1/8;font-size:clamp(2.6rem,6vw,5rem);letter-spacing:-.04em;margin:0}
.hero.swiss .sw-role{grid-column:9/13;font-weight:600;margin:0}
.hero.swiss .sw-bio{grid-column:5/12;font-size:1.25rem;line-height:1.45}
.hero.swiss .sw-act{grid-column:5/12}
${SM}{.hero.swiss .sw-grid>*{grid-column:1/-1}}`,

  profilegrid: `.hero.profilegrid .wrap{display:grid;grid-template-columns:280px 1fr;gap:2.5rem;align-items:start}
.hero.profilegrid .pg-side{position:sticky;top:90px;display:grid;gap:.4rem}
.hero.profilegrid .pg-pic{width:84px;height:84px;border-radius:50%;overflow:hidden}${img100(".hero.profilegrid .pg-pic")}
.hero.profilegrid h1{font-size:1.6rem;margin:.6rem 0 0}.hero.profilegrid .pg-side p{margin:0}
.hero.profilegrid .pg-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem}
.hero.profilegrid .pg-item{text-decoration:none;display:grid;gap:.5rem;font-weight:600}.hero.profilegrid .pg-item img{border-radius:var(--radius);aspect-ratio:4/3;object-fit:cover;width:100%}
${SM}{.hero.profilegrid .wrap{grid-template-columns:1fr}.hero.profilegrid .pg-side{position:static}}`,

  outline: `.hero.outline{background:#0d0d0b;color:#efe7d2}
.hero.outline .eyebrow{color:#c8a24a}
.hero.outline h1{color:inherit;font-size:clamp(3.4rem,10vw,8.6rem);line-height:.88;text-transform:uppercase;display:grid}
.hero.outline .ol-last{color:transparent;-webkit-text-stroke:2px #c8a24a}
.hero.outline .sub{color:#cfc6b0}
.hero.outline .btn{color:#efe7d2;border-color:#c8a24a}.hero.outline .btn-primary{background:#c8a24a;color:#0d0d0b}`,

  wordmark: `.hero.wordmark{padding-top:1rem}
.hero.wordmark h1{font-size:clamp(3.6rem,13.5vw,13rem);line-height:.82;letter-spacing:-.065em;font-weight:700;margin:0}
.hero.wordmark .wm-row{display:flex;justify-content:space-between;gap:2rem;align-items:end;border-top:1px solid var(--text);padding-top:1rem;margin-top:1rem}
.hero.wordmark .wm-row p{max-width:40ch;margin:0}.hero.wordmark .actions{margin:0}
${SM}{.hero.wordmark .wm-row{flex-direction:column;align-items:flex-start}}`,

  monogram: `.hero.monogram{text-align:center;padding-block:clamp(4rem,10vw,8rem)}
.hero.monogram .mg-mark{display:inline-grid;place-items:center;width:110px;height:110px;border:1px solid var(--text);border-radius:50%;font-family:var(--font-h);font-style:italic;font-size:2.6rem;margin-bottom:2rem}
.hero.monogram h1{font-weight:400;font-size:clamp(2.6rem,6vw,4.6rem)}
.hero.monogram .sub{margin-inline:auto;font-family:var(--font-h);font-size:1.3rem}.hero.monogram .actions{justify-content:center}`,

  datelist: `.hero.datelist .wrap{max-width:760px}
.hero.datelist h1{font-size:1.2rem;letter-spacing:0;margin:0 0 .3rem}
.hero.datelist .wrap>p{color:var(--muted);margin-bottom:2rem}
.hero.datelist .dl-list{list-style:none;padding:0;margin:0 0 2rem;border-top:1px solid var(--border)}
.hero.datelist .dl-list li{display:grid;grid-template-columns:110px 1fr;gap:1rem;padding:.7rem 0;border-bottom:1px solid var(--border)}
.hero.datelist .dl-list span{color:var(--muted);font-variant-numeric:tabular-nums}.hero.datelist .dl-list a{text-decoration:none}`,

  tripane: `.hero.tripane .wrap{display:grid;grid-template-columns:1fr .9fr 1fr;gap:2rem;align-items:end;min-height:min(80vh,760px)}
.hero.tripane h1{font-size:clamp(2.2rem,4.6vw,3.8rem);line-height:1.02}
.hero.tripane .tp-pic{align-self:stretch;border-radius:999px 999px 0 0;overflow:hidden}${img100(".hero.tripane .tp-pic")}
.hero.tripane .tp-r p{font-size:1.05rem}.hero.tripane .btn{border-radius:99px}
${SM}{.hero.tripane .wrap{grid-template-columns:1fr}.hero.tripane .tp-pic{max-height:60vh}}`,

  resumecard: `.hero.resumecard{background:var(--surface)}
.hero.resumecard .rc-card{max-width:680px;margin:0 auto;background:var(--bg);border:1px solid var(--border);border-radius:16px;padding:clamp(1.5rem,5vw,3rem);text-align:center;box-shadow:0 30px 60px -40px rgba(0,0,0,.4)}
.hero.resumecard .rc-pic{width:96px;height:96px;border-radius:50%;overflow:hidden;margin:0 auto 1rem}${img100(".hero.resumecard .rc-pic")}
.hero.resumecard h1{font-size:clamp(2rem,4vw,2.8rem);margin-bottom:.3rem}.hero.resumecard .rc-role{color:var(--muted)}
.hero.resumecard .rc-xp{list-style:none;padding:0;margin:1.5rem 0;text-align:left;border-top:1px solid var(--border)}
.hero.resumecard .rc-xp li{display:grid;grid-template-columns:1.2fr 1fr auto;gap:.8rem;padding:.6rem 0;border-bottom:1px solid var(--border);font-size:.92rem}
.hero.resumecard .actions{justify-content:center}`,

  centeravatar: `.hero.centeravatar{text-align:center}
.hero.centeravatar .ca-pic{width:120px;height:120px;border-radius:50%;overflow:hidden;margin:0 auto 1.4rem}${img100(".hero.centeravatar .ca-pic")}
.hero.centeravatar h1{font-size:clamp(2.4rem,5vw,3.8rem)}.hero.centeravatar .sub{margin-inline:auto}
.hero.centeravatar .actions{justify-content:center}
.hero.centeravatar .ca-tabs{display:inline-flex;gap:.3rem;margin-top:2.5rem;background:var(--surface);border-radius:99px;padding:.3rem}
.hero.centeravatar .ca-tabs span{padding:.4rem 1rem;border-radius:99px;font-size:.88rem}.hero.centeravatar .ca-tabs .on{background:var(--text);color:var(--bg)}`,

  desk: `.hero.desk .wrap{display:grid;grid-template-columns:1fr 1.1fr;gap:3rem;align-items:center}
.hero.desk h1{font-size:clamp(3rem,7vw,5.6rem);line-height:.95}
.hero.desk .dsk-scene{position:relative;border-radius:28px;overflow:hidden;aspect-ratio:9/7;border:3px solid var(--text)}${img100(".hero.desk .dsk-scene")}
.hero.desk .dsk-tag{position:absolute;left:1rem;bottom:1rem;background:var(--accent);color:var(--on-accent);border:2px solid var(--text);border-radius:99px;padding:.35rem .9rem;font-weight:700;font-size:.85rem}
${SM}{.hero.desk .wrap{grid-template-columns:1fr}}`,

  editorialname: `.hero.editorialname h1{font-weight:400;font-size:clamp(3.4rem,10vw,8.6rem);line-height:.9;letter-spacing:-.03em;margin:0}
.hero.editorialname .en-row{display:grid;grid-template-columns:1fr 2fr;gap:2rem;margin:1.2rem 0 2rem;border-top:1px solid var(--border);padding-top:1rem}
.hero.editorialname .en-pic{aspect-ratio:2/1;overflow:hidden;margin-bottom:1.5rem}${img100(".hero.editorialname .en-pic")}
${SM}{.hero.editorialname .en-row{grid-template-columns:1fr}}`,

  stacked3: `.hero.stacked3 .wrap{display:grid;grid-template-columns:1.2fr .8fr;gap:3rem;align-items:center}
.hero.stacked3 h1{display:grid;font-size:clamp(3rem,8vw,6.6rem);line-height:.95;letter-spacing:-.03em}
.hero.stacked3 h1 span:nth-child(2){color:var(--primary-ink)}.hero.stacked3 h1 span:nth-child(3){color:var(--muted)}
.hero.stacked3 .s3-pic{aspect-ratio:4/5;border-radius:var(--radius);overflow:hidden}${img100(".hero.stacked3 .s3-pic")}
${SM}{.hero.stacked3 .wrap{grid-template-columns:1fr}}`,

  mockups: `.hero.mockups{text-align:center;overflow:hidden}
.hero.mockups h1{font-size:clamp(2.6rem,6.4vw,5.2rem);max-width:18ch;margin-inline:auto}.hero.mockups h1 em{font-family:var(--font-h);font-weight:400}
.hero.mockups .sub{margin-inline:auto}.hero.mockups .actions{justify-content:center}
.hero.mockups .mk-row{display:flex;justify-content:center;gap:1.4rem;margin-top:3rem}
.hero.mockups .mk-phone{width:clamp(150px,18vw,230px);aspect-ratio:9/19;border:8px solid #111;border-radius:30px;overflow:hidden;box-shadow:0 30px 50px -30px rgba(0,0,0,.5)}${img100(".hero.mockups .mk-phone")}
.hero.mockups .mk-phone:nth-child(2){transform:translateY(-24px)}`,

  centername: `.hero.centername{text-align:center;padding-block:clamp(6rem,16vw,12rem)}
.hero.centername h1{font-weight:400;font-size:clamp(2.4rem,5.4vw,4.2rem);letter-spacing:.01em}
.hero.centername .sub{margin-inline:auto;color:var(--muted)}.hero.centername .actions{justify-content:center}`,

  photogrid: `.hero.photogrid .pgr-head{display:flex;justify-content:space-between;align-items:end;gap:2rem;margin-bottom:1.5rem}
.hero.photogrid h1{font-size:clamp(1.8rem,3vw,2.4rem);margin:0}.hero.photogrid .pgr-head p{margin:0;max-width:40ch;color:var(--muted)}
.hero.photogrid .pgr-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.hero.photogrid figure{margin:0;aspect-ratio:4/5;overflow:hidden}${img100(".hero.photogrid figure")}
${SM}{.hero.photogrid .pgr-grid{grid-template-columns:repeat(2,1fr)}.hero.photogrid .pgr-head{flex-direction:column;align-items:flex-start}}`,

  gridpaper: `.hero.gridpaper{background-image:linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px);background-size:32px 32px}
.hero.gridpaper .wrap{max-width:720px;background:var(--bg);padding:clamp(1.5rem,4vw,2.5rem);border:1px solid var(--border)}
.hero.gridpaper h1{font-size:clamp(2rem,4vw,3rem)}.hero.gridpaper .gp-bio{font-size:1.12rem;line-height:1.6}`,

  twotone: `.hero.twotone{padding-block:clamp(5rem,12vw,9rem)}
.hero.twotone h1{font-size:clamp(2.6rem,6.4vw,5.4rem);line-height:1.02;letter-spacing:-.035em;max-width:20ch}
.hero.twotone h1 span{color:var(--muted)}
.hero.twotone .btn{border-radius:99px}`,

  handnote: `.hero.handnote{background:var(--bg)}
.hero.handnote .hn-badge{display:inline-flex;align-items:center;gap:.5rem;border:1px solid var(--border);border-radius:99px;padding:.35rem .9rem;font-size:.85rem}
.hero.handnote .hn-badge::before{content:"";width:8px;height:8px;border-radius:50%;background:#3fb27f}
.hero.handnote h1{font-size:clamp(2.6rem,6.4vw,5rem);line-height:1.02;max-width:18ch;margin-top:1.5rem}
.hero.handnote .hn-note{font-family:var(--font-h);font-style:italic;font-size:1.6rem;color:var(--accent);transform:rotate(-3deg);display:inline-block}`,

  chat: `.hero.chat .ch-win{max-width:640px;margin:0 auto;border:1px solid var(--border);border-radius:18px;overflow:hidden;background:var(--bg);box-shadow:0 30px 60px -40px rgba(0,0,0,.4)}
.hero.chat .ch-bar{display:flex;gap:.8rem;align-items:baseline;padding:.9rem 1.2rem;border-bottom:1px solid var(--border);background:var(--surface)}.hero.chat .ch-bar span{color:var(--muted);font-size:.85rem}
.hero.chat .ch-body{display:grid;gap:.6rem;padding:1.4rem 1.2rem}
.hero.chat .ch-msg{margin:0;max-width:80%;background:var(--surface);border-radius:16px 16px 16px 4px;padding:.7rem .9rem;justify-self:start}
.hero.chat .ch-msg.me{justify-self:end;background:var(--primary);color:var(--on-primary);border-radius:16px 16px 4px 16px}
.hero.chat .ch-foot{padding:0 1.2rem 1.2rem}.hero.chat .ch-foot .actions{margin:0}`,

  profilesplit: `.hero.profilesplit .wrap{display:grid;grid-template-columns:300px 1fr;gap:3rem;align-items:start}
.hero.profilesplit .psp-l{display:grid;gap:.4rem;position:sticky;top:90px}
.hero.profilesplit .psp-pic{width:88px;height:88px;border-radius:20px;overflow:hidden}${img100(".hero.profilesplit .psp-pic")}
.hero.profilesplit h1{font-size:1.7rem;margin:.6rem 0 0}.hero.profilesplit .psp-l ul{list-style:none;padding:0;margin:.8rem 0;display:grid;gap:.3rem;font-size:.92rem}
.hero.profilesplit .psp-l li::before{content:"— ";color:var(--muted)}
.hero.profilesplit .psp-r h2{font-size:clamp(1.8rem,3.4vw,2.6rem)}.hero.profilesplit .psp-r img{border-radius:var(--radius);margin-top:1.2rem}
${SM}{.hero.profilesplit .wrap{grid-template-columns:1fr}.hero.profilesplit .psp-l{position:static}}`,

  statementcards: `.hero.statementcards h1{font-size:clamp(2.6rem,6.4vw,5rem);line-height:1;max-width:18ch}
.hero.statementcards .sc2-row{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-top:2.5rem}
.hero.statementcards .sc2-card{position:relative;border-radius:var(--radius);overflow:hidden;aspect-ratio:5/6;color:#fff;text-decoration:none}${img100(".hero.statementcards .sc2-card")}
.hero.statementcards .sc2-card span{position:absolute;left:1rem;bottom:1rem;font-weight:600;text-shadow:0 1px 8px rgba(0,0,0,.5)}
${SM}{.hero.statementcards .sc2-row{grid-template-columns:1fr}}`,

  blog: `.hero.blog .wrap{max-width:760px}
.hero.blog .bl-mast{border-bottom:3px double var(--text);padding-bottom:1rem;margin-bottom:1.5rem}
.hero.blog h1{font-size:clamp(2.4rem,5vw,3.6rem);margin:0}.hero.blog .bl-mast p{margin:.3rem 0 0;font-style:italic;color:var(--muted)}
.hero.blog .bl-list{list-style:none;padding:0;margin:0 0 2rem;display:grid;gap:1.5rem}
.hero.blog .bl-date{display:block;font-size:.78rem;text-transform:uppercase;letter-spacing:.1em;color:var(--muted)}
.hero.blog .bl-list a{font-family:var(--font-h);font-size:1.5rem;font-weight:700;text-decoration:none}.hero.blog .bl-list p{margin:.3rem 0 0}`,
};
