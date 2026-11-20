// Live sites designed and built by the Motion Imprints team. Kept apart from the builder's demo sites and
// labelled as the team's work, so no one reads them as "made with ImprintSites". Screenshots come from
// `node scripts/make-ourwork.mjs`.
const WORK = [
  { title: "Jerseyville", sub: "Online sports store", url: "https://jerseyville.omodingisaac123.workers.dev/", shot: "work-jerseyville" },
  { title: "Motion Imprints", sub: "Design, print and branding studio", url: "https://motionimprints.online/", shot: "work-motionimprints" },
  { title: "Active Technical Services", sub: "Engineering and construction", url: "https://ats-public-web.onrender.com/", shot: "work-ats" },
];

export function OurWork({ headingLevel = 2, dark = false }: { headingLevel?: 2 | 3; dark?: boolean }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <div className={`work ${dark ? "work-dark" : ""}`}>
      <div className="work-head">
        <H id="our-work">Our work</H>
        <p>Live sites designed and built by the Motion Imprints team, the people behind ImprintSites.</p>
      </div>
      <div className="work-grid">
        {WORK.map((w) => (
          <a key={w.url} className="work-card" href={w.url} target="_blank" rel="noopener noreferrer">
            <span className="work-shot">
              <img src={`/showcase/${w.shot}.webp`} alt={`${w.title} website on a desktop`} loading="lazy" decoding="async" />
              <img className="work-phone" src={`/showcase/${w.shot}-m.webp`} alt="" width={390} height={844} loading="lazy" decoding="async" />
            </span>
            <span className="work-meta">
              <strong>{w.title}</strong>
              <span>{w.sub}</span>
              <span className="work-host">{new URL(w.url).hostname}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
