// CSS for the personal heroes in personal-heroes.ts. Only the CSS for heroes a site actually uses is sent.
const SM = "@media(max-width:860px)";

export const PERSONAL_HERO_CSS: Record<string, string> = {
  sentence: `.hero.sentence{padding-block:clamp(4rem,12vw,10rem) clamp(3rem,8vw,6rem)}
.hero.sentence h1{font-weight:300;font-size:clamp(2rem,4.3vw,3.7rem);line-height:1.16;max-width:32ch;letter-spacing:-.01em}
.hero.sentence .btn{border-radius:99px;text-transform:uppercase;letter-spacing:.12em;font-size:.78rem}`,

  essay: `.hero.essay{padding-block:clamp(3rem,9vw,7rem) clamp(2rem,5vw,4rem)}
.hero.essay .essay-grid{display:grid;grid-template-columns:1fr 1.1fr;gap:clamp(2rem,6vw,6rem);align-items:center;min-height:52vh}
.hero.essay h1{font-weight:400;font-size:clamp(3rem,7vw,5.8rem);margin:0}
.hero.essay .lede{font-family:var(--font-h);font-size:clamp(1.3rem,2.2vw,1.75rem);line-height:1.3;margin-bottom:1rem}
.hero.essay .body{color:var(--muted);font-family:var(--font-h);font-size:1.08rem;line-height:1.6}
.hero.essay .where{display:inline-flex;align-items:center;gap:.5rem;border:1px solid var(--border);border-radius:99px;padding:.35rem .9rem;font-size:.85rem}
.hero.essay .dot{width:7px;height:7px;border-radius:50%;background:#3fb27f}
.hero.essay .snaps{display:grid;grid-template-columns:repeat(4,1fr);gap:clamp(1rem,3vw,3rem);margin-top:clamp(3rem,7vw,6rem)}
.hero.essay .snaps img{aspect-ratio:4/5;object-fit:cover;width:100%}
.hero.essay figcaption{font-family:var(--font-h);font-size:.9rem;color:var(--muted);margin-top:.9rem}
${SM}{.hero.essay .essay-grid{grid-template-columns:1fr}.hero.essay .snaps{grid-template-columns:repeat(2,1fr)}}`,

  chapters: `.hero.chapters{text-align:center;padding-block:clamp(3rem,7vw,5rem)}
.hero.chapters .wrap{max-width:640px}
.hero.chapters .kicker{font-variant:small-caps;letter-spacing:.12em;font-size:.9rem;color:var(--muted)}
.hero.chapters h1{font-variant:small-caps;letter-spacing:.08em;font-weight:500;font-size:clamp(2.4rem,6vw,3.8rem);margin:.4rem 0}
.hero.chapters .alias{font-family:var(--font-h);font-style:italic;font-size:1.3rem;margin:0 0 1.2rem}
.hero.chapters .being{font-family:var(--font-h);font-style:italic;color:var(--muted);max-width:34ch;margin:0 auto 2rem}
.hero.chapters .plate{margin:0 auto 3rem;max-width:300px;border:1px solid var(--text);padding:10px;background:var(--bg)}
.hero.chapters .plate img{filter:grayscale(1) contrast(1.05);aspect-ratio:4/5;object-fit:cover;width:100%}
.hero.chapters .toc{list-style:none;padding:0;margin:0 auto;text-align:left;font-family:var(--font-h)}
.hero.chapters .toc a{display:flex;align-items:baseline;gap:.9rem;padding:.45rem 0;text-decoration:none;font-size:1.2rem}
.hero.chapters .toc .r{width:2.6rem;flex:none;color:var(--muted)}
.hero.chapters .toc .t{white-space:nowrap}
.hero.chapters .toc a::after{content:"";flex:1;border-bottom:1px dotted var(--muted);order:2;margin:0 .2rem;transform:translateY(-4px)}
.hero.chapters .toc .pg{order:3;color:var(--muted)}
.hero.chapters .toc .sub a{padding-left:3.5rem;font-size:.98rem;font-style:italic}
.hero.chapters .actions{justify-content:center}
.hero.chapters .btn{border-radius:0;font-family:var(--font-h);font-style:italic;border:0;border-bottom:1px solid currentColor;background:none!important;color:var(--text)!important;padding:.2rem 0;min-height:auto}`,

  tiles: `.hero.tilehub{padding-block:clamp(1.5rem,3vw,2.5rem)}
.hero.tilehub .tgrid{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:minmax(190px,auto);gap:12px}
.hero.tilehub .who{grid-column:span 2;display:grid;grid-template-columns:auto 1fr;gap:1.25rem;align-items:end;padding:1.5rem;position:relative}
.hero.tilehub .who .pic{width:150px;height:150px;border-radius:50%;overflow:hidden;filter:grayscale(1)}
.hero.tilehub .who img{width:100%;height:100%;object-fit:cover}
.hero.tilehub h1{font-size:clamp(1.6rem,3vw,2.3rem);margin:0 0 .3rem}
.hero.tilehub .who p{margin:0;color:var(--muted)}
.hero.tilehub .tline{grid-column:1/-1;color:var(--muted);font-size:.95rem}
.hero.tilehub .hubtile{border-radius:18px;padding:1.1rem;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.8rem;text-decoration:none;color:#fff;position:relative;background:var(--primary);transition:transform .2s}
.hero.tilehub .hubtile:hover{transform:translateY(-3px)}
.hero.tilehub .hubtile:nth-of-type(2){filter:brightness(1.15)}.hero.tilehub .hubtile:nth-of-type(3){filter:brightness(1.3)}.hero.tilehub .hubtile:nth-of-type(4){filter:brightness(1.45) saturate(1.1)}.hero.tilehub .hubtile:nth-of-type(5){filter:brightness(1.25) hue-rotate(20deg)}.hero.tilehub .hubtile:nth-of-type(6){filter:brightness(.9)}
.hero.tilehub .hubtile svg{width:30px;height:30px}
.hero.tilehub .hubtile:last-child:nth-child(6){grid-column:span 2}
.hero.tilehub .no{position:absolute;left:1rem;top:.8rem;font-size:.72rem;opacity:.75}
.hero.tilehub .lbl{font-weight:600;font-size:1.05rem}
${SM}{.hero.tilehub .tgrid{grid-template-columns:repeat(2,1fr);grid-auto-rows:150px}.hero.tilehub .who{grid-column:1/-1}}`,

  warmbento: `.hero.warmbento{background:var(--primary);color:var(--on-primary);padding-block:clamp(2rem,5vw,4rem)}
.hero.warmbento h1{font-weight:400;font-size:clamp(4rem,13vw,10rem);line-height:.9;letter-spacing:-.04em;margin:0 0 2rem;color:inherit}
.hero.warmbento .cards{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(280px,1fr);gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:.5rem}
.hero.warmbento .card{border-radius:22px;min-height:380px;scroll-snap-align:start;padding:1.6rem;overflow:hidden;position:relative}
.hero.warmbento .bio{background:color-mix(in srgb,var(--primary) 82%,#000);font-weight:600;font-size:1.12rem}
.hero.warmbento .bio .btn{background:var(--on-primary);color:var(--primary);border-color:var(--on-primary);border-radius:99px}
.hero.warmbento .pic{padding:0}.hero.warmbento .pic img{width:100%;height:100%;object-fit:cover;position:absolute;inset:0}
.hero.warmbento .quote{background:#dcebf5;color:#1b2a3a;background-image:linear-gradient(#c7dbea 1px,transparent 1px),linear-gradient(90deg,#c7dbea 1px,transparent 1px);background-size:22px 22px}
.hero.warmbento .quote p{font-family:var(--font-h);font-size:clamp(1.6rem,2.6vw,2.2rem);line-height:1.15}
.hero.warmbento .skills{background:var(--bg);color:var(--text)}.hero.warmbento .skills span{font-size:.8rem;text-transform:uppercase;letter-spacing:.12em;color:var(--muted)}
.hero.warmbento .skills ul{list-style:none;padding:0;margin:1rem 0 0;font-family:var(--font-h);font-size:1.35rem;line-height:1.5}`,

  growth: `.hero.growth .wrap{display:grid;grid-template-columns:1.1fr .9fr;gap:2rem;align-items:end}
.hero.growth h1{font-size:clamp(2.8rem,6.6vw,5.4rem);line-height:1;margin-bottom:1.5rem}
.hero.growth .first{position:relative;display:inline-block}
.hero.growth .sw{position:absolute;left:0;right:0;bottom:-.18em;width:100%;height:.3em;color:var(--primary)}
.hero.growth .btn-primary{border-radius:99px}
.hero.growth .btn-ghost{border:0;text-transform:uppercase;letter-spacing:.12em;font-size:.8rem}
.hero.growth .cut{align-self:stretch;min-height:420px;border-radius:var(--radius);overflow:hidden;background:var(--surface)}
.hero.growth .cut img{width:100%;height:100%;object-fit:cover;object-position:top}
${SM}{.hero.growth .wrap{grid-template-columns:1fr}}`,

  hello: `.hero.hello{text-align:center;padding-block:clamp(5rem,14vw,11rem)}
.hero.hello h1{font-weight:400;font-size:clamp(1.8rem,3.4vw,2.6rem);line-height:1.25;max-width:30ch;margin-inline:auto}
.hero.hello .hi{display:block}
.hero.hello .line{display:block;color:var(--accent)}
.hero.hello .now{font-size:.92rem;color:var(--muted)}
.hero.hello .actions{justify-content:center}`,

  contour: `.hero.contour{overflow:hidden}
.hero.contour .topo{position:absolute;inset:0;width:100%;height:100%;color:var(--border);pointer-events:none}
.hero.contour .wrap{position:relative}
.hero.contour .meta{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;font:500 .72rem/1 ui-monospace,monospace;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);border-bottom:1px solid var(--border);padding-bottom:1rem;margin-bottom:2rem}
.hero.contour .grid{display:grid;grid-template-columns:1.2fr .8fr;gap:2rem;align-items:end}
.hero.contour h1{font-size:clamp(3.6rem,11vw,9rem);line-height:.86;letter-spacing:-.03em;font-stretch:80%;text-transform:none}
.hero.contour h1 span{display:block}
.hero.contour .accent{color:var(--primary-ink)}
.hero.contour .cut{border-radius:var(--radius);overflow:hidden;aspect-ratio:5/6}.hero.contour .cut img{width:100%;height:100%;object-fit:cover}
${SM}{.hero.contour .grid{grid-template-columns:1fr}}`,

  keynote: `.hero.keynote .wrap{display:grid;grid-template-columns:1.1fr .9fr;gap:3rem;align-items:center}
.hero.keynote h1{font-weight:400;font-size:clamp(3.4rem,9vw,7.4rem);line-height:.95}
.hero.keynote mark{background:linear-gradient(transparent 62%,var(--accent) 62%,var(--accent) 88%,transparent 88%);color:inherit}
.hero.keynote .sub{font-size:clamp(1.1rem,1.6vw,1.35rem);color:var(--text)}
.hero.keynote .btn-primary{border-radius:99px}
.hero.keynote .speaker{position:relative}
.hero.keynote .pic{border-radius:22px;overflow:hidden;aspect-ratio:5/6;background:var(--surface)}.hero.keynote .pic img{width:100%;height:100%;object-fit:cover}
.hero.keynote .spk{position:absolute;right:-12px;bottom:12%;width:220px;align-content:start;background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:1rem 1.1rem;display:grid;gap:.2rem;box-shadow:0 18px 40px -18px rgba(0,0,0,.35);font-size:.85rem}
.hero.keynote .strap{position:absolute;left:50%;top:-70px;width:16px;height:72px;background:var(--primary);transform:translateX(-50%)}
.hero.keynote .spk-tag{justify-self:start;align-self:start;background:var(--primary);color:var(--on-primary);font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;padding:.2rem .45rem;border-radius:3px;margin-bottom:.4rem}
.hero.keynote .spk strong{font-family:var(--font-h);font-size:1.15rem}
.hero.keynote .mono{font-family:ui-monospace,monospace;font-size:.72rem;color:var(--muted);margin-top:.4rem}
${SM}{.hero.keynote .wrap{grid-template-columns:1fr}.hero.keynote .spk{right:8px}}`,

  creator: `.hero.creator .wrap{display:grid;grid-template-columns:1fr .8fr;gap:clamp(2rem,6vw,5rem);align-items:center;max-width:1040px}
.hero.creator h1{font-size:clamp(2.4rem,5vw,3.8rem);line-height:1.08;font-weight:500}
.hero.creator h1 em{font-style:italic;font-weight:600}
.hero.creator .pic{border-radius:20px;overflow:hidden;aspect-ratio:4/5}.hero.creator .pic img{width:100%;height:100%;object-fit:cover}
.hero.creator .btn{border-radius:8px}
${SM}{.hero.creator .wrap{grid-template-columns:1fr}}`,

  shapes: `.hero.shapes{padding-top:1.25rem}
.hero.shapes .top{display:flex;justify-content:space-between;align-items:center}
.hero.shapes .nm{font-weight:600;text-transform:uppercase;letter-spacing:.06em;font-size:1.3rem;font-stretch:115%}
.hero.shapes .glyphs{display:flex;gap:6px}.hero.shapes .glyphs i{width:18px;height:18px;background:var(--text);display:block}
.hero.shapes .g0{border-radius:50%}.hero.shapes .g2{clip-path:polygon(50% 0,100% 100%,0 100%)}.hero.shapes .g3{clip-path:polygon(15% 0,50% 35%,85% 0,100% 15%,65% 50%,100% 85%,85% 100%,50% 65%,15% 100%,0 85%,35% 50%,0 15%)}
.hero.shapes h1{font-size:clamp(4rem,12vw,10rem);line-height:.9;letter-spacing:-.04em;font-weight:500;margin:.2em 0 .3em}
.hero.shapes .shape-row{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(1rem,4vw,4rem);margin-top:2.5rem;align-items:center}
.hero.shapes .sh{aspect-ratio:1;overflow:hidden}.hero.shapes .sh img{width:100%;height:100%;object-fit:cover}
.hero.shapes .sh0{clip-path:polygon(50% 0,100% 100%,0 100%)}
.hero.shapes .sh1{-webkit-mask:radial-gradient(circle at 50% 26%,#000 26%,transparent 26.5%),radial-gradient(circle at 26% 50%,#000 26%,transparent 26.5%),radial-gradient(circle at 74% 50%,#000 26%,transparent 26.5%),radial-gradient(circle at 50% 74%,#000 26%,transparent 26.5%),radial-gradient(circle at 50% 50%,#000 30%,transparent 30.5%);mask:radial-gradient(circle at 50% 26%,#000 26%,transparent 26.5%),radial-gradient(circle at 26% 50%,#000 26%,transparent 26.5%),radial-gradient(circle at 74% 50%,#000 26%,transparent 26.5%),radial-gradient(circle at 50% 74%,#000 26%,transparent 26.5%),radial-gradient(circle at 50% 50%,#000 30%,transparent 30.5%)}
.hero.shapes .sh2{border-radius:50%}`,

  iconline: `.hero.iconline{padding-top:1.5rem}
.hero.iconline .pic{width:92px;height:92px;border-radius:14px;overflow:hidden;margin-bottom:2rem}.hero.iconline .pic img{width:100%;height:100%;object-fit:cover}
.hero.iconline h1{font-size:clamp(2.6rem,6.4vw,5.6rem);line-height:1.02;letter-spacing:-.035em;color:var(--muted);font-weight:700}
.hero.iconline .ic{display:inline-block;width:.85em;height:.85em;vertical-align:-.08em;color:var(--text)}.hero.iconline .ic svg{width:100%;height:100%}`,

  author: `.hero.author{background-image:linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px);background-size:72px 72px;text-align:center}
.hero.author h1{font-weight:400;font-size:clamp(3.4rem,10vw,8.4rem);line-height:.92;color:var(--primary-ink);max-width:12ch;margin:0 auto -0.6em;position:relative;z-index:2}
.hero.author .obj{max-width:440px;margin:0 auto;aspect-ratio:1;border-radius:4px;overflow:hidden}.hero.author .obj img{width:100%;height:100%;object-fit:cover}
.hero.author .card{max-width:420px;margin:-2.5rem auto 0;position:relative;background:var(--bg);border:1px solid var(--border);padding:1.4rem 1.6rem;text-align:left}
.hero.author .card .actions{margin-top:1rem}`,

  splitname: `.hero.splitname{padding-top:1rem}
.hero.splitname .corners{display:flex;justify-content:space-between;gap:1rem;margin-bottom:1.5rem}
.hero.splitname .corners a{text-decoration:none;display:grid;gap:.2rem}.hero.splitname .corners strong{font-weight:400;font-size:1.25rem}.hero.splitname .corners span{font-size:.72rem;color:var(--muted);letter-spacing:.12em}
.hero.splitname .stage{position:relative;display:grid;grid-template-columns:1fr auto 1fr;align-items:center}
.hero.splitname .pic{width:min(34vw,420px);aspect-ratio:4/5;overflow:hidden;position:relative;z-index:1}.hero.splitname .pic img{width:100%;height:100%;object-fit:cover}
.hero.splitname .n1,.hero.splitname .n2{font-family:var(--font-h);font-size:clamp(2.8rem,8vw,7rem);line-height:1;position:relative;z-index:3;color:#fff;mix-blend-mode:difference}
.hero.splitname .n1{text-align:right;margin-right:-1.2em}.hero.splitname .n2{margin-left:-1.2em}
.hero.splitname .foot{display:flex;justify-content:space-between;align-items:end;gap:2rem;margin-top:2rem}.hero.splitname .foot p{max-width:42ch;margin:0}
${SM}{.hero.splitname .stage{grid-template-columns:1fr}.hero.splitname .pic{width:100%}.hero.splitname .n1,.hero.splitname .n2{margin:0;text-align:left}.hero.splitname .foot{flex-direction:column;align-items:flex-start}}`,

  prologue: `.hero.prologue{padding:0;background:var(--primary);color:var(--on-primary)}
.hero.prologue .split{display:grid;grid-template-columns:1fr 1fr;min-height:min(88vh,820px)}
.hero.prologue .copy{display:flex;flex-direction:column;justify-content:center;padding:clamp(2rem,6vw,5rem) clamp(1.5rem,4vw,3rem) clamp(2rem,6vw,5rem) max(1.25rem,calc((100vw - var(--maxw))/2))}
.hero.prologue .label{font:500 .72rem/1 ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;opacity:.75;margin-bottom:1.5rem}
.hero.prologue h1{font-weight:400;color:inherit;font-size:clamp(2.6rem,5.6vw,4.6rem)}
.hero.prologue .sub{color:inherit;opacity:.88;font-size:1.25rem}
.hero.prologue .btn{background:#141414!important;color:#fff!important;border-color:#141414;border-radius:2px;font-family:ui-monospace,monospace;text-transform:uppercase;letter-spacing:.12em;font-size:.78rem}
.hero.prologue .media{position:relative;overflow:hidden}.hero.prologue .media img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
${SM}{.hero.prologue .split{grid-template-columns:1fr}.hero.prologue .media{min-height:50vh}}`,

  library: `.hero.library .wrap{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(2rem,6vw,5rem);align-items:center}
.hero.library .card{background:#f4e8c9;color:#2c2416;border:1px solid #c9b78c;padding:1.4rem 1.5rem 1.8rem;transform:rotate(-2deg);box-shadow:0 20px 40px -24px rgba(0,0,0,.4);font-family:"Courier New",ui-monospace,monospace}
.hero.library .card-head{display:grid;gap:.25rem;text-align:center;border-bottom:2px solid #2c2416;padding-bottom:.9rem;margin-bottom:.6rem;font-size:.72rem;text-transform:uppercase;letter-spacing:.12em}
.hero.library .type{font-size:1.5rem;text-transform:none;letter-spacing:0}
.hero.library table{width:100%;border-collapse:collapse;font-size:.85rem}
.hero.library th{font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;border-bottom:1px solid #2c2416;padding:.4rem;text-align:left}
.hero.library td{border-bottom:1px solid #c9b78c;padding:.55rem .4rem;height:2.2rem}
.hero.library .stamp{color:#9c2b20;font-weight:700;letter-spacing:.06em}
.hero.library h1{font-size:clamp(2.2rem,4.6vw,3.8rem)}
${SM}{.hero.library .wrap{grid-template-columns:1fr}}`,

  poem: `.hero.poem .wrap{display:grid;grid-template-columns:1.1fr .9fr;gap:clamp(2rem,6vw,6rem);align-items:center;min-height:70vh}
.hero.poem h1{font-weight:400;font-style:italic;font-size:clamp(2rem,4.2vw,3.4rem);line-height:1.3}
.hero.poem .sig{color:var(--muted);font-size:.95rem;letter-spacing:.04em}
.hero.poem .pic{aspect-ratio:4/5;overflow:hidden;border-radius:2px}.hero.poem .pic img{width:100%;height:100%;object-fit:cover}
${SM}{.hero.poem .wrap{grid-template-columns:1fr}}`,

  cinema: `.hero.cinema{min-height:min(94vh,920px);display:flex;align-items:flex-end;color:#fff;padding-bottom:2rem}
.hero.cinema .bgimg{position:absolute;inset:0}.hero.cinema .bgimg img{width:100%;height:100%;object-fit:cover}
.hero.cinema::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.65))}
.hero.cinema .wrap{position:relative;z-index:2;width:min(100% - 2.5rem,1400px)}
.hero.cinema h1{color:#fff;font-size:clamp(2.6rem,6vw,5rem);font-weight:500}
.hero.cinema .sub{color:rgba(255,255,255,.85)}
.hero.cinema .eyebrow{color:#fff}
.hero.cinema .strip{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(170px,1fr);gap:10px;overflow-x:auto;margin-top:2rem}
.hero.cinema .frame{text-decoration:none;color:#fff;font-size:.78rem;letter-spacing:.06em}
.hero.cinema .frame img{aspect-ratio:3/2;object-fit:cover;width:100%;border:1px solid rgba(255,255,255,.3);margin-bottom:.4rem}`,

  gazette: `.hero.gazette{padding-top:1.5rem}
.hero.gazette .mast{display:grid;grid-template-columns:1fr auto 1fr;align-items:end;border-bottom:4px double var(--text);padding-bottom:.8rem;font-size:.78rem;text-transform:uppercase;letter-spacing:.14em}
.hero.gazette .mast span:last-child{text-align:right}
.hero.gazette h1{font-size:clamp(3rem,9vw,7.4rem);text-align:center;line-height:.9;margin:0;font-weight:700;letter-spacing:-.02em}
.hero.gazette .cols{display:grid;grid-template-columns:1.4fr 1fr .8fr;gap:0;margin-top:1.2rem}
.hero.gazette .cols>*{padding:0 1.25rem;border-left:1px solid var(--text)}.hero.gazette .cols>*:first-child{border-left:0;padding-left:0}
.hero.gazette .lead h2{font-size:clamp(1.8rem,3.2vw,2.6rem);line-height:1.05}
.hero.gazette .dek{font-style:italic;color:var(--muted)}
.hero.gazette .body{column-count:2;column-gap:1.25rem;text-align:justify;font-size:.95rem;hyphens:auto}
.hero.gazette figure{margin:0}.hero.gazette figure img{filter:grayscale(1);aspect-ratio:4/5;object-fit:cover;width:100%}
.hero.gazette figcaption{font-size:.75rem;color:var(--muted);margin-top:.4rem}
.hero.gazette aside h3{font-size:.8rem;text-transform:uppercase;letter-spacing:.14em;border-bottom:1px solid var(--text);padding-bottom:.4rem}
.hero.gazette aside ol{padding-left:1.1rem;font-family:var(--font-h);font-size:1.05rem;line-height:1.5}
${SM}{.hero.gazette .cols{grid-template-columns:1fr}.hero.gazette .cols>*{border-left:0;padding:0;margin-bottom:1.5rem}.hero.gazette .body{column-count:1}}`,

  boarding: `.hero.boarding .wrap{display:grid;grid-template-columns:.9fr 1.1fr;gap:clamp(2rem,5vw,4rem);align-items:center}
.hero.boarding h1{font-size:clamp(3rem,8vw,6.4rem);line-height:.9;letter-spacing:-.04em}
.hero.boarding .pass{display:grid;grid-template-columns:1fr 200px;background:var(--surface);border-radius:18px;overflow:hidden;box-shadow:0 24px 50px -28px rgba(0,0,0,.45);font-size:.92rem}
.hero.boarding .main{padding:1.5rem;display:grid;gap:1rem}
.hero.boarding .lbl{display:block;font-size:.66rem;text-transform:uppercase;letter-spacing:.16em;color:var(--muted)}
.hero.boarding .main>strong{font-size:1.2rem}
.hero.boarding .route{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:1rem}
.hero.boarding .route b{display:block;font-size:2.2rem;letter-spacing:.04em;line-height:1.1}
.hero.boarding .plane svg{width:40px;height:40px;color:var(--primary)}
.hero.boarding .row{display:grid;grid-template-columns:2fr 1fr 1fr;gap:1rem;border-top:1px dashed var(--border);padding-top:1rem}
.hero.boarding .stub{border-left:2px dashed var(--border);padding:1.5rem 1.2rem;background:var(--bg)}
.hero.boarding .stub ul{list-style:none;padding:0;margin:.6rem 0 0;display:grid;gap:.35rem;font-weight:600}
${SM}{.hero.boarding .wrap,.hero.boarding .pass{grid-template-columns:1fr}.hero.boarding .stub{border-left:0;border-top:2px dashed var(--border)}}`,

  badge: `.hero.idbadge{padding-bottom:0;overflow:hidden}
.hero.idbadge .wrap{position:relative;display:grid;grid-template-columns:1fr auto 1fr;align-items:start;gap:2rem;width:100%;max-width:none;padding-inline:2.5rem}
.hero.idbadge .l,.hero.idbadge .r{font-family:var(--font-h);font-size:1.05rem;max-width:30ch;margin-top:3.5rem;grid-row:1}.hero.idbadge .l{grid-column:1}.hero.idbadge .r{grid-column:3;text-align:right;justify-self:end}.hero.idbadge .lanyard{grid-column:2;grid-row:1}
.hero.idbadge .lanyard{display:flex;flex-direction:column;align-items:center}
.hero.idbadge .strap{width:16px;height:120px;background:var(--text)}
.hero.idbadge .card{width:230px;background:var(--bg);border:1px solid var(--border);border-radius:14px;padding:1rem;box-shadow:0 26px 50px -26px rgba(0,0,0,.45);transform:rotate(-4deg);display:grid;gap:.4rem}
.hero.idbadge .card .pic{width:64px;height:64px;border-radius:8px;overflow:hidden}.hero.idbadge .card img{width:100%;height:100%;object-fit:cover}
.hero.idbadge .card strong{font-family:var(--font-h);font-size:1.5rem;font-weight:400;line-height:1.05}.hero.idbadge .card em{color:var(--primary-ink);font-style:normal}
.hero.idbadge .card span{font-size:.75rem;color:var(--muted)}
.hero.idbadge h1{grid-column:1/-1;grid-row:2;font-weight:400;font-size:clamp(3.4rem,10.5vw,11rem);line-height:.85;letter-spacing:-.04em;text-align:center;margin:1.5rem 0 .2em}
.hero.idbadge .actions{grid-column:1/-1;grid-row:3;justify-content:center;margin-bottom:2rem}
${SM}{.hero.idbadge .wrap{grid-template-columns:1fr;padding-inline:1.25rem}.hero.idbadge .l,.hero.idbadge .r,.hero.idbadge .lanyard{grid-column:1;grid-row:auto}.hero.idbadge .l,.hero.idbadge .r{margin-top:0;text-align:left;justify-self:start}.hero.idbadge h1{white-space:normal}}`,

  deco: `.hero.deco{background:var(--primary);color:var(--on-primary)}
.hero.deco .frame{position:relative;border:2px solid currentColor;outline:1px solid currentColor;outline-offset:10px;padding:clamp(2.5rem,7vw,5rem) clamp(1.5rem,5vw,4rem);text-align:center;overflow:hidden}
.hero.deco .sun{position:absolute;left:50%;bottom:-60%;width:120%;aspect-ratio:1;transform:translateX(-50%);background:repeating-conic-gradient(from 0deg,color-mix(in srgb,currentColor 14%,transparent) 0 4deg,transparent 4deg 12deg);border-radius:50%;pointer-events:none}
.hero.deco h1{position:relative;color:inherit;text-transform:uppercase;letter-spacing:.12em;font-size:clamp(2.8rem,8vw,6.4rem);line-height:1}
.hero.deco .eyebrow{color:inherit;position:relative}
.hero.deco .sub{position:relative;color:inherit;opacity:.9;margin-inline:auto}
.hero.deco .actions{position:relative;justify-content:center}
.hero.deco .btn{border-radius:0;border-color:currentColor;color:inherit;background:transparent}`,

  slides: `.hero.slides{min-height:min(94vh,920px);display:flex;align-items:center;justify-content:center;text-align:center;color:#fff}
.hero.slides .bgimg{position:absolute;inset:0}.hero.slides .bgimg img{width:100%;height:100%;object-fit:cover}
.hero.slides::after{content:"";position:absolute;inset:0;background:rgba(0,0,0,.52)}
.hero.slides .wrap{position:relative;z-index:2}
.hero.slides .count{font:500 .8rem/1 ui-monospace,monospace;letter-spacing:.14em}
.hero.slides h1{color:#fff;font-size:clamp(3rem,9vw,7.6rem);font-weight:400;line-height:.95;margin:1rem 0}
.hero.slides .sub{color:rgba(255,255,255,.85);margin-inline:auto}
.hero.slides .index{list-style:none;padding:0;display:flex;flex-wrap:wrap;justify-content:center;gap:.4rem 1.6rem;margin-top:3rem;font-size:.82rem}
.hero.slides .index a{color:#fff;text-decoration:none;opacity:.75}.hero.slides .index a:hover{opacity:1}.hero.slides .index span{margin-right:.4rem;opacity:.6}`,

  roles: `.hero.roles{overflow:hidden;min-height:min(86vh,800px);display:flex;align-items:center}
.hero.roles .wall{position:absolute;inset:-1rem;font-weight:600;font-size:clamp(1rem,1.6vw,1.35rem);line-height:1.25;color:var(--muted);opacity:.22;word-spacing:.4rem;pointer-events:none}
.hero.roles .wrap{position:relative}
.hero.roles h1{font-size:clamp(4rem,13vw,11rem);line-height:.86;text-transform:uppercase;letter-spacing:-.02em;font-stretch:85%;font-weight:800;max-width:8ch}
.hero.roles .sub{color:var(--text)}
.hero.roles .pillbar{display:inline-flex;flex-wrap:wrap;align-items:center;gap:.8rem;background:var(--text);color:var(--bg);border-radius:99px;padding:.5rem .6rem .5rem 1.2rem;margin-top:1.5rem}
.hero.roles .pillbar span{font-size:.85rem;opacity:.8}.hero.roles .pillbar span::before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--accent);margin-right:.4rem}
.hero.roles .pillbar .actions{margin:0}.hero.roles .pillbar .btn-ghost{color:var(--bg);border-color:color-mix(in srgb,var(--bg) 45%,transparent)}.hero.roles .pillbar .btn{min-height:38px;border-radius:99px;padding:.45rem 1rem}`,

  ohhi: `.hero.ohhi{overflow:hidden}
.hero.ohhi .thread{position:absolute;inset:auto 0 10% 0;width:100%;height:50%;color:var(--accent);opacity:.8;pointer-events:none}
.hero.ohhi .grid{position:relative;display:grid;grid-template-columns:1.2fr .8fr;gap:3rem;align-items:center}
.hero.ohhi h1{font-family:var(--font-b);font-weight:700;letter-spacing:-.03em;font-size:clamp(2.8rem,7vw,5.6rem);line-height:1}
.hero.ohhi h1 em{font-family:var(--font-h);font-weight:400;color:var(--primary-ink)}
.hero.ohhi .blob{position:relative;border-radius:46% 54% 42% 58% / 52% 44% 56% 48%;overflow:hidden;aspect-ratio:1}
.hero.ohhi .blob img{width:100%;height:100%;object-fit:cover}
.hero.ohhi .note{position:absolute;left:-7.5rem;top:12%;z-index:2;font-family:var(--font-h);font-style:italic;color:var(--muted)}
.hero.ohhi .btn{border-radius:4px}
${SM}{.hero.ohhi .grid{grid-template-columns:1fr}.hero.ohhi .note{display:none}}`,

  hotspots: `.hero.hotspots .copy{display:flex;justify-content:space-between;align-items:end;gap:2rem;margin-bottom:1.5rem}
.hero.hotspots h1{margin:0}.hero.hotspots .copy .sub{max-width:40ch;margin:0}
.hero.hotspots .scene{position:relative;border-radius:var(--radius);overflow:hidden;aspect-ratio:16/9}.hero.hotspots .scene img{width:100%;height:100%;object-fit:cover}
.hero.hotspots .spot{position:absolute;transform:translate(-50%,-50%);display:flex;align-items:center;gap:.5rem;text-decoration:none;color:#fff;font-weight:600;font-size:.9rem;text-shadow:0 1px 6px rgba(0,0,0,.6)}
.hero.hotspots .spot i{width:18px;height:18px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 6px color-mix(in srgb,var(--accent) 35%,transparent)}
.hero.hotspots .spot span{background:rgba(0,0,0,.45);padding:.25rem .6rem;border-radius:99px}
${SM}{.hero.hotspots .copy{flex-direction:column;align-items:flex-start}.hero.hotspots .scene{aspect-ratio:4/5}}`,

  landscape: `.hero.landscape{text-align:center;padding-top:0}
.hero.landscape .scene{height:min(62vh,600px);overflow:hidden;-webkit-mask-image:linear-gradient(180deg,#000 55%,transparent);mask-image:linear-gradient(180deg,#000 55%,transparent)}
.hero.landscape .scene img{width:100%;height:100%;object-fit:cover;filter:saturate(.75) contrast(.92)}
.hero.landscape .wrap{margin-top:-2.5rem;position:relative}
.hero.landscape .kicker{font-size:.8rem;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
.hero.landscape h1{font-weight:400;font-size:clamp(2rem,4.4vw,3.6rem);max-width:24ch;margin:0 auto 1rem;line-height:1.2}
.hero.landscape .sub{font-style:italic;font-family:var(--font-h);margin-inline:auto}
.hero.landscape .actions{justify-content:center}`,

  bento: `.hero.bento{padding-block:1rem 2rem}
.hero.bento .bgrid{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:minmax(150px,auto);gap:10px}
.hero.bento .b{border-radius:18px;padding:1.1rem;background:var(--surface);overflow:hidden;position:relative;text-decoration:none;color:inherit;display:flex;flex-direction:column;justify-content:space-between}
.hero.bento .intro{grid-row:span 2}.hero.bento .intro h1{font-size:1.5rem;margin:0}.hero.bento .intro p{font-size:1.02rem}
.hero.bento .where{background:#111;color:#fff}
.hero.bento .hello{grid-column:span 2;grid-row:span 2;padding:0;color:#fff}.hero.bento .hello img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.hero.bento .hello span{position:relative;margin:auto;font-family:var(--font-h);font-style:italic;font-size:clamp(4rem,9vw,7.5rem);text-shadow:0 2px 20px rgba(0,0,0,.3)}
.hero.bento .lbl{font-size:.7rem;text-transform:uppercase;letter-spacing:.14em;opacity:.7}
.hero.bento .list ul{list-style:none;padding:0;margin:.5rem 0 0;display:grid;gap:.3rem;font-size:.92rem}.hero.bento .list li::before{content:"+ ";color:var(--primary-ink)}
.hero.bento .proj{padding:0;color:#fff;min-height:150px}.hero.bento .proj img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.hero.bento .proj span{position:relative;margin-top:auto;padding:.9rem;background:linear-gradient(transparent,rgba(0,0,0,.6));font-weight:600;display:grid}.hero.bento .proj small{font-weight:400;opacity:.8}
.hero.bento .status strong{font-size:1.3rem}
.hero.bento .talk{background:var(--accent);color:var(--on-accent)}
${SM}{.hero.bento .bgrid{grid-template-columns:repeat(2,1fr)}.hero.bento .intro{grid-column:1/-1;grid-row:auto}}`,

  champion: `.hero.champion{min-height:min(94vh,920px);display:flex;align-items:flex-end;color:#fff;padding-bottom:clamp(2rem,6vw,5rem)}
.hero.champion .bgimg{position:absolute;inset:0}.hero.champion .bgimg img{width:100%;height:100%;object-fit:cover;object-position:top}
.hero.champion::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.2),rgba(0,0,0,.35) 40%,rgba(0,0,0,.75))}
.hero.champion h1{text-shadow:0 2px 30px rgba(0,0,0,.35)}
.hero.champion .wrap{position:relative;z-index:2}
.hero.champion h1{color:#fff;text-transform:uppercase;font-size:clamp(3.6rem,12vw,10rem);line-height:.84;letter-spacing:-.02em;font-stretch:80%}
.hero.champion .sub{color:rgba(255,255,255,.88)}.hero.champion .eyebrow{color:var(--accent)}`,

  bookcover: `.hero.bookcover{text-align:center}
.hero.bookcover .book{position:relative;margin:0 auto;width:min(440px,100%);aspect-ratio:5/7;background:#2a1a12;color:#e8d9b5;border-radius:3px 8px 8px 3px;padding:2.4rem 2.2rem;display:flex;flex-direction:column;align-items:flex-start;text-align:left;box-shadow:inset 6px 0 10px -4px rgba(0,0,0,.6),18px 24px 50px -24px rgba(0,0,0,.6);border-right:8px solid #efe3c7}
.hero.bookcover .book::before{content:"";position:absolute;inset:1.1rem;border:1px solid rgba(201,163,94,.45);pointer-events:none}
.hero.bookcover .ribbon{position:absolute;right:2.4rem;top:-6px;width:16px;height:64px;background:#a3262a;clip-path:polygon(0 0,100% 0,100% 100%,50% 84%,0 100%)}
.hero.bookcover .kicker{font-size:.68rem;letter-spacing:.2em;text-transform:uppercase;color:#c9a35e}
.hero.bookcover .orn{width:100%;height:1px;background:rgba(201,163,94,.5);margin:1.2rem 0}
.hero.bookcover h1{font-weight:400;color:#f2e6c8;font-size:clamp(2.4rem,5vw,3.6rem);line-height:1.02}
.hero.bookcover .blurb{font-style:italic;color:#cbb88f;font-family:var(--font-h);margin-top:auto}
.hero.bookcover .by{margin-top:1rem;font-size:.8rem;letter-spacing:.16em;text-transform:uppercase;color:#c9a35e}
.hero.bookcover .actions{justify-content:center}`,
};

export const FAME_CSS = `.fame{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem}
.fame article{border:1px solid var(--border);border-radius:var(--radius);padding:1.4rem;display:grid;gap:.4rem;background:var(--surface)}
.fame .yr{font-family:var(--font-h);font-size:2.6rem;line-height:1;color:var(--primary-ink)}
.fame h3{margin:0;font-size:1.1rem}`;
