// Storefront layouts (Phase 1). A layout is a complete shop-front design system shared by a family of
// templates: hero, collection grid, product page and chrome. Templates in a layout differ by palette,
// type and their own CSS. Selected by TemplateDef.layout and applied as `body.lay.lay-<name>`.

export type StoreLayout = "editorial" | "quiet" | "jewel" | "interiors" | "object" | "lifestyle" | "wordmark";

/** Rules shared by every premium storefront layout. */
const SHARED = `
.lay .site-header{border-bottom:1px solid var(--border)}
.lay .nav a{font-size:.86rem;letter-spacing:.04em}
.lay .cart-link{background:none!important;border:0;color:var(--text)!important;padding:.4rem 0;min-height:auto;font-weight:500;font-size:.86rem;letter-spacing:.04em}
.lay .cart-link:hover{transform:none;text-decoration:underline;text-underline-offset:5px}
.lay .cart-count{position:static;display:inline;background:none;color:inherit;min-width:0;height:auto;padding:0;margin-left:.2rem;font-size:inherit}
.lay .cart-count::before{content:"("}.lay .cart-count::after{content:")"}
.lay .cart-count[hidden]{display:none}
.lay .product-card{background:transparent!important;border:0!important;box-shadow:none!important;border-radius:0;overflow:visible}
.lay .product-card:hover{transform:none}
.lay .product-card .ph{border-radius:var(--radius-sm)}
.lay .product-card .info{padding:.9rem 0 0;gap:.2rem}
.lay .product-card .p-title{font-weight:500}
.lay .product-card .p-meta{display:block;font-size:.7rem;text-transform:uppercase;letter-spacing:.14em;color:var(--muted)}
.lay .product-card .price{font-weight:400;color:var(--muted)}
.lay .badge{border-radius:0;background:var(--bg);font-weight:600;letter-spacing:.12em;font-size:.66rem}
.lay .sec-head h2{font-weight:500}
.lay .banner{font-weight:500;letter-spacing:.06em;font-size:.82rem}
.lay .shop-tools{border-block:1px solid var(--border);padding-block:1rem;margin-bottom:2.5rem}
.lay .shop-tools input,.lay .shop-tools select{border-width:1px;border-radius:0}
.lay .pdp h1{font-weight:500}
.lay .pdp .btn-primary{width:100%;min-height:54px;letter-spacing:.08em}
.lay .related{border-top:1px solid var(--border)}
@media(max-width:640px){.lay .brand{font-size:1.1rem!important;letter-spacing:.06em!important;white-space:nowrap}}
/* stacked product gallery with sticky details (editorial + interiors) */
.pdp.stacked{grid-template-columns:1.35fr .65fr}
.pdp.stacked .gallery-stack{display:grid;gap:.75rem}
.pdp.stacked .gallery-stack img{width:100%;height:auto;aspect-ratio:4/5;object-fit:cover;background:var(--surface)}
.pdp.stacked .details{position:sticky;top:96px}
@media(max-width:860px){.pdp.stacked{grid-template-columns:1fr}.pdp.stacked .details{position:static}.pdp.stacked .gallery-stack{grid-auto-flow:column;grid-auto-columns:86%;overflow-x:auto;scroll-snap-type:x mandatory}.pdp.stacked .gallery-stack img{scroll-snap-align:start}}
`;

const EDITORIAL = `
.lay-editorial .hero.lookbook{min-height:min(92vh,920px)}
.lay-editorial .sec-head{text-align:center;margin-inline:auto}
.lay-editorial .sec-head h2{font-size:clamp(1.3rem,2.2vw,1.8rem);text-transform:uppercase;letter-spacing:.16em}
.lay-editorial .sec-head .lead{margin-inline:auto}
.lay-editorial .products-tall{grid-template-columns:repeat(3,1fr);gap:clamp(1rem,2.4vw,2.2rem) clamp(.75rem,1.6vw,1.4rem)}
.lay-editorial .products-tall .ph{aspect-ratio:3/4}
.lay-editorial .product-card .info{text-align:left;font-size:.92rem}
.lay-editorial .tiles{grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:clamp(.75rem,1.6vw,1.4rem)}
.lay-editorial .tile{aspect-ratio:3/4;border-radius:0;justify-content:center;align-items:flex-end;padding:2rem}
.lay-editorial .tile span{font-weight:500;font-size:.95rem;text-transform:uppercase;letter-spacing:.2em;border-bottom:1px solid currentColor;padding-bottom:.25rem}
.lay-editorial .about.split .media{aspect-ratio:3/4;border-radius:0}
@media(max-width:860px){.lay-editorial .products-tall{grid-template-columns:repeat(2,1fr)}}
`;

const QUIET = `
.lay-quiet .site-header{border-bottom:0}
.lay-quiet .sec{padding-block:calc(var(--space)*.75)}
.lay-quiet .sec-head h2{font-size:.86rem;font-family:var(--font-b);text-transform:uppercase;letter-spacing:.14em;font-weight:500}
.lay-quiet .sec-head .lead{font-size:.95rem}
.lay-quiet .products-quiet{grid-template-columns:repeat(4,1fr);gap:clamp(1.5rem,3vw,3rem) clamp(.75rem,1.6vw,1.5rem)}
.lay-quiet .products-quiet .ph{aspect-ratio:4/5;background:var(--surface);border-radius:0}
.lay-quiet .products-quiet .ph img{width:78%;height:78%;margin:11%;object-fit:cover}
.lay-quiet .product-card:hover .ph img{transform:none}
.lay-quiet .product-card .info{text-align:center;font-size:.82rem;letter-spacing:.02em}
.lay-quiet .product-card .p-meta{display:none}
.lay-quiet .chips{justify-content:center;gap:.4rem}
.lay-quiet .chip{border:0;min-height:36px;padding:.3rem .8rem;font-weight:500;font-size:.82rem;text-transform:uppercase;letter-spacing:.12em;text-decoration:underline;text-decoration-color:transparent;text-underline-offset:6px}
.lay-quiet .chip:hover{text-decoration-color:currentColor}
.lay-quiet .tiles{grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
.lay-quiet .tile{border-radius:0;aspect-ratio:1;color:var(--text);background:var(--surface);align-items:flex-end;justify-content:center}
.lay-quiet .tile::after{display:none}
.lay-quiet .tile img{inset:12%;width:76%;height:66%}
.lay-quiet .tile span{font:500 .8rem var(--font-b);text-transform:uppercase;letter-spacing:.14em}
.lay-quiet .pdp .main-img{border-radius:0;aspect-ratio:4/5;display:grid;place-items:center}
.lay-quiet .pdp .main-img img{width:80%;height:80%}
.lay-quiet .pdp h1{font-size:clamp(1.4rem,2.4vw,2rem)!important;font-family:var(--font-b)}
.lay-quiet .site-footer{border-top:0;font-size:.85rem}
@media(max-width:1000px){.lay-quiet .products-quiet{grid-template-columns:repeat(3,1fr)}}
@media(max-width:640px){.lay-quiet .products-quiet{grid-template-columns:repeat(2,1fr)}}
`;

const JEWEL = `
.lay-jewel .sec-head{text-align:center;margin-inline:auto}
.lay-jewel .sec-head h2{font-weight:400;font-size:clamp(1.6rem,3vw,2.4rem)}
.lay-jewel .sec-head h2::after{content:"";display:block;width:36px;height:1px;background:var(--accent);margin:1rem auto 0}
.lay-jewel .sec-head .lead{margin-inline:auto}
.lay-jewel .products-jewel{grid-template-columns:repeat(4,1fr);gap:clamp(1.25rem,2.4vw,2.25rem) clamp(.75rem,1.6vw,1.25rem)}
.lay-jewel .products-jewel .ph{aspect-ratio:1;border-radius:0;background:var(--surface)}
.lay-jewel .product-card .ph .alt-img{position:absolute;inset:0;opacity:0;transition:opacity .5s}
.lay-jewel .product-card .ph .alt-img img{width:100%;height:100%;object-fit:cover}
.lay-jewel .product-card:hover .ph .alt-img,.lay-jewel .product-card:focus-visible .ph .alt-img{opacity:1}
.lay-jewel .product-card:hover .ph>img{transform:none}
.lay-jewel .product-card .info{text-align:center}
.lay-jewel .product-card .p-title{font-family:var(--font-h);font-size:1.12rem;font-weight:400}
.lay-jewel .product-card .p-meta{font-size:.72rem;text-transform:uppercase;letter-spacing:.16em;color:var(--muted)}
.lay-jewel .tiles{grid-template-columns:repeat(auto-fit,minmax(150px,210px));justify-content:center;gap:clamp(1rem,3vw,2.5rem)}
.lay-jewel .tile{aspect-ratio:1;border-radius:50%;justify-content:center;align-items:center;padding:0}
.lay-jewel .tile::after{background:rgba(0,0,0,.28)}
.lay-jewel .tile span{font-weight:400;font-size:1.15rem;letter-spacing:.04em}
.lay-jewel .pdp .main-img{border-radius:0;cursor:zoom-in}
.lay-jewel .pdp .main-img img{transition:transform .6s ease}
.lay-jewel .pdp .main-img:hover img{transform:scale(1.35)}
.lay-jewel .pdp h1{font-weight:400}
.lay-jewel .pdp .p-price{font-family:var(--font-h)}
.lay-jewel .about.split .media{border-radius:0}
@media(max-width:1000px){.lay-jewel .products-jewel{grid-template-columns:repeat(3,1fr)}}
@media(max-width:640px){.lay-jewel .products-jewel{grid-template-columns:repeat(2,1fr)}}
`;

const INTERIORS = `
.lay-interiors .sec-head h2{font-weight:400;font-size:clamp(1.8rem,3.4vw,2.8rem)}
.lay-interiors .products-room{grid-template-columns:repeat(3,1fr);gap:clamp(1.5rem,3vw,2.75rem) clamp(1rem,2vw,1.75rem)}
.lay-interiors .products-room .ph{aspect-ratio:4/3;border-radius:var(--radius-sm)}
.lay-interiors .product-card .info{grid-template-columns:1fr auto;align-items:baseline;column-gap:1rem}
.lay-interiors .product-card .p-title{font-family:var(--font-h);font-size:1.15rem;font-weight:400}
.lay-interiors .product-card .p-meta{grid-column:1/-1;order:3;font-size:.8rem;color:var(--muted)}
.lay-interiors .tiles{grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:clamp(1rem,2vw,1.75rem)}
.lay-interiors .tile{aspect-ratio:5/4;color:var(--text);padding:0;flex-direction:column;align-items:stretch;justify-content:flex-start;overflow:visible}
.lay-interiors .tile::after{display:none}
.lay-interiors .tile img{position:static;aspect-ratio:5/4;border-radius:var(--radius-sm)}
.lay-interiors .tile span{font-weight:400;font-size:1.3rem;padding-top:.8rem}
.lay-interiors .tile span::after{content:"→";font-family:var(--font-b);font-size:.95rem;margin-left:.5rem}
.lay-interiors .about.split .media{aspect-ratio:4/3}
@media(max-width:860px){.lay-interiors .products-room{grid-template-columns:repeat(2,1fr)}}
@media(max-width:560px){.lay-interiors .products-room{grid-template-columns:1fr}}
`;

const OBJECT = `
.lay-object .sec-head{text-align:center;margin-inline:auto}
.lay-object .sec-head h2{font-weight:400}
.lay-object .sec-head .lead{margin-inline:auto}
.lay-object .products-object{grid-template-columns:repeat(3,1fr);gap:clamp(1rem,2.4vw,2rem)}
.lay-object .products-object .product-card{background:var(--surface)!important;border-radius:var(--radius)!important;padding:1rem;box-shadow:0 18px 40px -30px rgba(0,0,0,.35)!important}
.lay-object .products-object .ph{aspect-ratio:1;background:var(--bg);border-radius:calc(var(--radius) - 4px)}
.lay-object .products-object .ph img{object-fit:cover}
.lay-object .product-card .info{text-align:center;padding:1rem .25rem .25rem}
.lay-object .product-card .p-title{font-family:var(--font-h);font-size:1.15rem;font-weight:400}
.lay-object .pdp .main-img{background:var(--surface);border-radius:var(--radius)}
.lay-object .info-list details{padding:1.1rem 0}
.lay-object .info-list summary{font-family:var(--font-h);font-weight:400;font-size:1.1rem}
@media(max-width:860px){.lay-object .products-object{grid-template-columns:repeat(2,1fr)}}
`;

const LIFESTYLE = `
.lay-lifestyle .sec-head h2{font-weight:500}
.lay-lifestyle .products-life{grid-template-columns:repeat(3,1fr);gap:clamp(1rem,2.4vw,2rem)}
.lay-lifestyle .products-life .ph{aspect-ratio:4/5;border-radius:var(--radius)}
.lay-lifestyle .product-card .p-title{font-size:1.02rem}
.lay-lifestyle .tiles .tile{border-radius:var(--radius)}
.lay-lifestyle .about.split .media{border-radius:var(--radius)}
@media(max-width:860px){.lay-lifestyle .products-life{grid-template-columns:repeat(2,1fr)}}
`;

const WORDMARK = `
.lay-wordmark .sec-head h2{font-weight:800;text-transform:uppercase;letter-spacing:-.01em}
.lay-wordmark .products-hair{grid-template-columns:repeat(4,1fr);gap:0;border-top:1px solid var(--text);border-left:1px solid var(--text)}
.lay-wordmark .products-hair .product-card{border-right:1px solid var(--text)!important;border-bottom:1px solid var(--text)!important;padding:1rem}
.lay-wordmark .products-hair .ph{aspect-ratio:1;border-radius:0}
.lay-wordmark .product-card .info{display:flex;justify-content:space-between;align-items:baseline;gap:.5rem;padding-top:.8rem}
.lay-wordmark .product-card .p-title{font-weight:700;text-transform:uppercase;font-size:.85rem;letter-spacing:.02em}
.lay-wordmark .product-card .price{color:var(--text);font-weight:800}
.lay-wordmark .product-card .p-meta{display:none}
.lay-wordmark .pdp .p-price{font-weight:800;font-size:1.8rem}
@media(max-width:860px){.lay-wordmark .products-hair{grid-template-columns:repeat(2,1fr)}}
`;

/** Hero variants used by the storefront layouts (they work for any template). */
export const STORE_HERO_CSS = `
.hero.lookbook{min-height:min(88vh,860px);display:flex;align-items:flex-end;justify-content:center;color:#fff;padding-block:clamp(3rem,8vw,6rem);text-align:center}
.hero.lookbook .bgimg{position:absolute;inset:0}
.hero.lookbook .bgimg img{width:100%;height:100%;object-fit:cover}
.hero.lookbook::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 45%,rgba(0,0,0,.55))}
.hero.lookbook .wrap{position:relative;z-index:2}
.hero.lookbook h1{font-weight:400;max-width:18ch;margin-inline:auto;color:#fff}
.hero.lookbook .sub{color:rgba(255,255,255,.9);margin-inline:auto;font-size:1.02rem}
.hero.lookbook .eyebrow{color:#fff;letter-spacing:.24em}
.hero.lookbook .actions{justify-content:center;gap:2rem}
.hero.lookbook .btn{background:none!important;border:0;border-bottom:1px solid #fff;border-radius:0;color:#fff!important;padding:.35rem 0;min-height:auto;text-transform:uppercase;letter-spacing:.18em;font-size:.78rem;font-weight:500}
.hero.statement{padding-block:clamp(2.5rem,6vw,5rem) clamp(1.5rem,3vw,2.5rem)}
.hero.statement .wrap{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.5fr);gap:clamp(2rem,5vw,5rem);align-items:end}
.hero.statement h1{font-size:clamp(1.6rem,2.8vw,2.4rem);font-weight:500;letter-spacing:-.01em;max-width:22ch}
.hero.statement .sub{font-size:.98rem;max-width:44ch}
.hero.statement .hero-media{aspect-ratio:16/11;border-radius:0}
.hero.statement .actions .btn{min-height:42px}
.hero.panel{padding:0}
.hero.panel .grid2{display:grid;grid-template-columns:1fr 1fr;min-height:min(86vh,820px)}
.hero.panel .media{position:relative;overflow:hidden;background:var(--surface)}
.hero.panel .media img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.hero.panel .copy{display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:clamp(2.5rem,7vw,6rem);background:var(--surface)}
.hero.panel .copy::before{content:"";width:1px;height:56px;background:var(--accent);margin-bottom:1.75rem}
.hero.panel h1{font-weight:400;font-size:clamp(2.2rem,4.4vw,3.8rem);max-width:14ch}
.hero.panel .sub{margin-inline:auto;max-width:38ch}
.hero.panel .actions{justify-content:center}
.hero.room{padding-bottom:0}
.hero.room .head{display:grid;grid-template-columns:1.2fr .8fr;gap:clamp(2rem,5vw,5rem);align-items:end;margin-bottom:clamp(2rem,4vw,3rem)}
.hero.room h1{font-weight:400;margin:0}
.hero.room .sub{margin:0 0 .25rem}
.hero.room .actions{margin-top:1.25rem}
.hero.room .hero-media{aspect-ratio:21/9;border-radius:var(--radius-sm)}
.hero.objecthero{padding:0}
.hero.objecthero .oh-grid{display:grid;grid-template-columns:1fr 1fr;min-height:min(84vh,800px)}
.hero.objecthero .oh-copy{display:flex;flex-direction:column;justify-content:center;padding:clamp(2rem,6vw,5rem) clamp(1.5rem,4vw,3rem) clamp(2rem,6vw,5rem) max(1.25rem,calc((100vw - var(--maxw))/2))}
.hero.objecthero h1{font-weight:400;font-size:clamp(2.6rem,5.6vw,4.8rem);line-height:1.02}
.hero.objecthero .oh-stage{background:var(--accent);display:grid;place-items:center;padding:clamp(2rem,6vw,5rem)}
.hero.objecthero .oh-stage img{width:min(100%,520px);aspect-ratio:1;object-fit:cover;border-radius:var(--radius);box-shadow:0 30px 60px -30px rgba(0,0,0,.45)}
.hero.sunlit{padding:0;position:relative}
.hero.sunlit .sl-img{height:min(86vh,820px);overflow:hidden}.hero.sunlit .sl-img img{width:100%;height:100%;object-fit:cover}
.hero.sunlit .sl-card{position:absolute;left:max(1.25rem,calc((100vw - var(--maxw))/2));bottom:clamp(1.5rem,5vw,4rem);width:min(460px,calc(100% - 2.5rem));background:var(--bg);border-radius:var(--radius);padding:clamp(1.4rem,3vw,2.2rem)}
.hero.sunlit h1{font-size:clamp(2rem,4vw,3.2rem)}
.hero.wordgrid{padding-top:1rem}
.hero.wordgrid .wg-word{margin:0;font-weight:800;text-transform:uppercase;font-size:clamp(3.4rem,14.5vw,14rem);line-height:.82;letter-spacing:-.055em;font-family:var(--font-h)}
.hero.wordgrid .wg-row{display:flex;justify-content:space-between;align-items:end;gap:2rem;border-top:1px solid var(--text);margin-top:1rem;padding-top:1rem}
.hero.wordgrid h1{font-size:clamp(1.2rem,2vw,1.6rem);margin:0;max-width:34ch;font-family:var(--font-b);font-weight:600}
.hero.wordgrid .wg-items{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-left:1px solid var(--text);margin-top:1.5rem}
.hero.wordgrid .wg-items a{border-right:1px solid var(--text);border-bottom:1px solid var(--text);border-top:1px solid var(--text);padding:.8rem;text-decoration:none;display:grid;gap:.5rem;font-weight:700;font-size:.8rem;text-transform:uppercase}
.hero.wordgrid .wg-items img{aspect-ratio:1;object-fit:cover;width:100%}
@media(max-width:860px){
 .hero.objecthero .oh-grid{grid-template-columns:1fr}
 .hero.wordgrid .wg-items{grid-template-columns:repeat(2,1fr)}
 .hero.wordgrid .wg-row{flex-direction:column;align-items:flex-start}
 .hero.statement .wrap,.hero.room .head{grid-template-columns:1fr}
 .hero.panel .grid2{grid-template-columns:1fr}
 .hero.panel .media{min-height:58vh}
 .hero.room .hero-media{aspect-ratio:4/3}
}
`;

export const LAYOUT_CSS: Record<StoreLayout, string> = {
  editorial: SHARED + EDITORIAL,
  quiet: SHARED + QUIET,
  jewel: SHARED + JEWEL,
  interiors: SHARED + INTERIORS,
  object: SHARED + OBJECT,
  lifestyle: SHARED + LIFESTYLE,
  wordmark: SHARED + WORDMARK,
};

/** Default product-grid variant and product-page style per layout. */
export const LAYOUT_DEFAULTS: Record<StoreLayout, { products: string; pdp: "stacked" | "single" }> = {
  editorial: { products: "tall", pdp: "stacked" },
  quiet: { products: "quiet", pdp: "single" },
  jewel: { products: "jewel", pdp: "single" },
  interiors: { products: "room", pdp: "stacked" },
  object: { products: "object", pdp: "single" },
  lifestyle: { products: "life", pdp: "stacked" },
  wordmark: { products: "hair", pdp: "single" },
};
