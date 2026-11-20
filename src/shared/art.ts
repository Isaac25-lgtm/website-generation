import type { ArtStyle } from "./templates";
import { hash32, mix, mulberry32 } from "./util";

// Self-generated, deterministic SVG artwork. Used for template previews, demo
// sites and empty image slots so no third-party imagery is ever needed.

export interface ArtPalette {
  bg: string;
  primary: string;
  accent: string;
  surface: string;
  text: string;
}

export function svgArt(seed: string, style: ArtStyle, p: ArtPalette, w = 1200, h = 800): string {
  const rnd = mulberry32(hash32(seed + style));
  const r = (a: number, b: number) => a + (b - a) * rnd();
  const cols = [p.primary, p.accent, mix(p.primary, p.accent, 0.5), mix(p.primary, p.bg, 0.45), mix(p.accent, p.bg, 0.35)];
  const pick = () => cols[Math.floor(rnd() * cols.length)];
  const bg = mix(p.surface, p.bg, 0.4);
  let body = "";
  const id = `g${hash32(seed).toString(36)}`;

  switch (style) {
    case "blobs": {
      body += `<defs><filter id="${id}b"><feGaussianBlur stdDeviation="${Math.round(w / 18)}"/></filter></defs><g filter="url(#${id}b)">`;
      for (let i = 0; i < 5; i++) body += `<circle cx="${r(0, w)}" cy="${r(0, h)}" r="${r(w * 0.15, w * 0.32)}" fill="${pick()}" opacity="${r(0.55, 0.9).toFixed(2)}"/>`;
      body += `</g>`;
      break;
    }
    case "geo": {
      for (let i = 0; i < 9; i++) {
        const x = r(-0.1, 1) * w, y = r(-0.1, 1) * h, s = r(0.12, 0.34) * w;
        const k = Math.floor(rnd() * 3);
        if (k === 0) body += `<circle cx="${x}" cy="${y}" r="${s / 2}" fill="${pick()}"/>`;
        else if (k === 1) body += `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.12}" fill="${pick()}" transform="rotate(${r(-25, 25)} ${x + s / 2} ${y + s / 2})"/>`;
        else body += `<path d="M${x} ${y + s}L${x + s / 2} ${y}L${x + s} ${y + s}Z" fill="${pick()}"/>`;
      }
      break;
    }
    case "waves": {
      for (let i = 0; i < 6; i++) {
        const y0 = h * (0.25 + i * 0.14);
        const a = r(h * 0.04, h * 0.12);
        let d = `M0 ${y0}`;
        for (let x = 0; x <= w; x += w / 6) d += ` Q${x + w / 12} ${y0 + (rnd() > 0.5 ? a : -a)} ${x + w / 6} ${y0}`;
        d += ` L${w} ${h} L0 ${h} Z`;
        body += `<path d="${d}" fill="${cols[i % cols.length]}" opacity="${(0.35 + i * 0.1).toFixed(2)}"/>`;
      }
      break;
    }
    case "grid": {
      const step = Math.round(w / 24);
      body += `<defs><pattern id="${id}p" width="${step}" height="${step}" patternUnits="userSpaceOnUse"><path d="M${step} 0H0V${step}" fill="none" stroke="${p.primary}" stroke-opacity=".18"/></pattern></defs><rect width="${w}" height="${h}" fill="url(#${id}p)"/>`;
      for (let i = 0; i < 14; i++) {
        const x = Math.floor(r(0, 24)) * step, y = Math.floor(r(0, 16)) * step;
        body += `<rect x="${x}" y="${y}" width="${step * Math.ceil(r(1, 5))}" height="${step}" fill="${pick()}" opacity="${r(0.5, 1).toFixed(2)}"/>`;
      }
      body += `<circle cx="${w * 0.7}" cy="${h * 0.45}" r="${h * 0.28}" fill="none" stroke="${p.primary}" stroke-width="2"/>`;
      break;
    }
    case "arcs": {
      const cx = r(0.3, 0.7) * w, cy = h * r(0.7, 1.1);
      for (let i = 9; i > 0; i--) body += `<circle cx="${cx}" cy="${cy}" r="${(i / 9) * w * 0.65}" fill="${i % 2 ? pick() : bg}" opacity="${i % 2 ? 0.85 : 1}"/>`;
      break;
    }
    case "stripes": {
      const n = 7 + Math.floor(rnd() * 5);
      const ang = r(-30, 30);
      body += `<g transform="rotate(${ang} ${w / 2} ${h / 2})">`;
      for (let i = -3; i < n + 3; i++) body += `<rect x="${(i / n) * w}" y="${-h}" width="${(w / n) * r(0.3, 0.9)}" height="${h * 3}" fill="${pick()}"/>`;
      body += `</g>`;
      break;
    }
    case "rings": {
      for (let i = 0; i < 4; i++) {
        const x = r(0.1, 0.9) * w, y = r(0.1, 0.9) * h, rad = r(0.12, 0.3) * w;
        body += `<circle cx="${x}" cy="${y}" r="${rad}" fill="none" stroke="${pick()}" stroke-width="${r(10, 40)}" opacity=".85"/>`;
      }
      body += `<circle cx="${r(0.2, 0.8) * w}" cy="${r(0.2, 0.8) * h}" r="${w * 0.08}" fill="${p.accent}"/>`;
      break;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice"><rect width="${w}" height="${h}" fill="${bg}"/>${body}</svg>`;
}

export function artDataUri(seed: string, style: ArtStyle, p: ArtPalette, w = 1200, h = 800): string {
  return `data:image/svg+xml,${encodeURIComponent(svgArt(seed, style, p, w, h))}`;
}
