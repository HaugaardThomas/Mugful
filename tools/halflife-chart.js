// Generates _includes/halflife-chart.svg: node tools/halflife-chart.js assets/sketch.js _includes/halflife-chart.svg
const fs = require('fs');
const src = fs.readFileSync(process.argv[2], 'utf8');
// pull the pure geometry helpers out of the site's sketch.js
const body = src.slice(src.indexOf('function hashSeed'), src.indexOf('var uid = 0;'));
const G = new Function(body + '; return {hashSeed, rng, curve, sketchLine, hatch, jitter};')();
const f = (n) => (Math.round(n * 10) / 10).toString();

const MOON = 'M13.6 3.6C9.3 4.4 6.3 8.2 6.5 12.6C6.8 17.1 10.5 20.5 15 20.4C16.6 20.4 18 19.9 19.2 19.1C13.9 19.4 9.8 14.9 10.6 9.7C11 7.2 12.1 5.1 13.6 3.6Z';
const MUG = 'M5.6 5.8C5.5 10 5.7 15 6.1 19.3C9.2 20 13.4 20 16.3 19.3C16.7 15 16.6 10 16.5 5.9C13 6.4 9.1 6.4 5.6 5.8Z';
const MUGH = 'M16.5 9C20.4 8.5 20.7 15.1 16.3 15.3';
const MUGF = 'M5.8 10.5C9.3 11.1 13 11 16.5 10.6C16.6 13.6 16.6 16.5 16.3 19.3C13.4 20 9.2 20 6.1 19.3C5.9 16.4 5.8 13.4 5.8 10.5Z';

function chart(W, H, compact) {
  const L = compact ? 14 : 24, R = W - (compact ? 14 : 24), T = compact ? 62 : 58, B = H - 44;
  const t0 = 6, t1 = 24;
  const x = (t) => L + ((t - t0) / (t1 - t0)) * (R - L);
  const dose = 126, tDrink = 7 + 40 / 60, half = 5, ka = 3.2, ke = Math.LN2 / half;
  const c = (t) => {
    const dt = t - tDrink;
    if (dt <= 0) return 0;
    return dose * (ka / (ka - ke)) * (Math.exp(-ke * dt) - Math.exp(-ka * dt));
  };
  let peak = 0;
  for (let t = t0; t <= t1; t += 0.01) peak = Math.max(peak, c(t));
  const y = (v) => B - (v / peak) * (B - T);
  const rand = G.rng(G.hashSeed('halflife' + W));
  const pts = [];
  for (let t = t0; t <= t1 + 1e-9; t += 0.25) pts.push([x(t), y(c(t)) + (c(t) > 1 ? (rand() - 0.5) * 1.2 : 0)]);
  const line = G.curve(pts, false);
  const area = line + `L${f(R)} ${f(B)}L${f(L)} ${f(B)}Z`;
  const hatchD = G.hatch(W, H, { seed: 7, spacing: compact ? 5 : 6 });

  const lastCall = 13 + 11 / 60, bed = 23;
  const icon = (d, tx, ty, s, cls) => `<path class="${cls}" transform="translate(${f(tx)} ${f(ty)}) scale(${s})" d="${d}"/>`;
  const label = (t, tx, ty, cls, anchor = 'middle') => `<text class="${cls}" x="${f(tx)}" y="${f(ty)}" text-anchor="${anchor}">${t}</text>`;

  const ticks = compact
    ? [[6, '6 AM'], [12, 'noon'], [18, '6 PM'], [24, '12 AM']]
    : [[6, '6 AM'], [9, '9 AM'], [12, 'noon'], [15, '3 PM'], [18, '6 PM'], [21, '9 PM'], [24, 'midnight']];
  let s = `<svg class="chart ${compact ? 'chart--compact' : 'chart--wide'}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="chart-title chart-desc">`;
  s += `<clipPath id="area-${W}"><path d="${area}"/></clipPath>`;
  s += `<path class="ch-tint" d="${area}"/>`;
  s += `<g clip-path="url(#area-${W})"><path class="ch-hatch" d="${hatchD}"/></g>`;
  s += `<path class="ch-curve" pathLength="1" d="${line}"/>`;
  s += `<path class="ch-axis" d="${G.sketchLine(L - 6, B + 1, R + 6, B + 1, { seed: 3, wobble: 1.2 })}"/>`;
  for (const [t, txt] of ticks) {
    const anchor = t === t0 ? 'start' : t === t1 ? 'end' : 'middle';
    s += `<path class="ch-tick" d="M${f(x(t))} ${f(B + 2)}l0.4 6"/>`;
    s += label(txt, x(t), B + 28, 'ch-time', anchor);
  }
  // last call
  s += `<path class="ch-call" d="${G.sketchLine(x(lastCall), T - 26, x(lastCall), B, { seed: 11, wobble: 0.9 })}"/>`;
  s += label(compact ? 'last call 1:11' : 'last call 1:11 PM', x(lastCall) + 8, T - 30, 'ch-note ch-note--call', 'start');
  // bedtime
  s += `<path class="ch-bed" d="${G.sketchLine(x(bed), T - 4, x(bed), B, { seed: 13, wobble: 0.9 })}"/>`;
  s += icon(MOON, x(bed) - 13, T - 40, 1.1, 'ch-moon');
  s += label('bedtime', x(bed) - 18, T - 18, 'ch-note', 'end');
  // drink
  const px = x(tDrink + 0.75);
  s += `<g class="ch-mug">${icon(MUGF, x(tDrink) - 11, B - 30, 1, 'ch-mug-fill')}${icon(MUG, x(tDrink) - 11, B - 30, 1, 'ch-mug-line')}${icon(MUGH, x(tDrink) - 11, B - 30, 1, 'ch-mug-line')}</g>`;
  s += label(compact ? 'flat white' : 'flat white, 7:40 AM', x(tDrink) - 10, T - 30, 'ch-note', 'start');
  s += label('still in your system', x(compact ? 15.4 : 16.4), y(c(compact ? 15.4 : 16.4)) - 14, 'ch-note ch-note--soft', 'start');
  s += '</svg>';
  return s;
}

const out = chart(760, 320, false) + '\n' + chart(380, 340, true) + '\n';
fs.writeFileSync(process.argv[3], out);
console.log(out.length, 'bytes');
