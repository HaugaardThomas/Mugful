/*
 * Hand-drawn outlines, hatching and underlines for the site.
 * The geometry is a straight port of src/lib/sketch.ts in the app, so the website wobbles
 * exactly like the app does. Everything is seeded: a shape keeps its wobble on every redraw.
 */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var root = document.documentElement;
  root.classList.add('js');

  function hashSeed(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /** mulberry32 */
  function rng(seed) {
    var a = seed | 0 || 1;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function f(n) {
    return (Math.round(n * 10) / 10).toString();
  }

  /** Smooth curve through the points (Catmull-Rom as cubic Béziers). */
  function curve(pts, closed) {
    function at(i) {
      return closed ? pts[(i + pts.length) % pts.length] : pts[Math.max(0, Math.min(pts.length - 1, i))];
    }
    var segments = closed ? pts.length : pts.length - 1;
    var d = 'M' + f(pts[0][0]) + ' ' + f(pts[0][1]);
    for (var i = 0; i < segments; i++) {
      var p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      d +=
        'C' + f(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + f(p1[1] + (p2[1] - p0[1]) / 6) + ' ' +
        f(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + f(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f(p2[0]) + ' ' + f(p2[1]);
    }
    return closed ? d + 'Z' : d;
  }

  function roundedRectPoints(x, y, w, h, r, step) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    var pts = [];
    function side(ax, ay, bx, by) {
      var n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / step));
      for (var i = 0; i < n; i++) pts.push([ax + ((bx - ax) * i) / n, ay + ((by - ay) * i) / n]);
    }
    function corner(cx, cy, from) {
      for (var i = 0; i < 3; i++) {
        var a = from + (i / 3) * (Math.PI / 2);
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
    }
    side(x + r, y, x + w - r, y);
    corner(x + w - r, y + r, -Math.PI / 2);
    side(x + w, y + r, x + w, y + h - r);
    corner(x + w - r, y + h - r, 0);
    side(x + w - r, y + h, x + r, y + h);
    corner(x + r, y + h - r, Math.PI / 2);
    side(x, y + h - r, x, y + r);
    corner(x + r, y + r, Math.PI);
    return pts;
  }

  function jitter(pts, amount, rand) {
    return pts.map(function (p) {
      return [p[0] + (rand() - 0.5) * 2 * amount, p[1] + (rand() - 0.5) * 2 * amount];
    });
  }

  function sketchRect(w, h, o) {
    var rand = rng(o.seed);
    var inset = o.inset == null ? 2 : o.inset;
    var base = roundedRectPoints(inset, inset, w - inset * 2, h - inset * 2, o.radius, 18);
    var main = jitter(base, o.wobble, rand);
    var overshoot = jitter(base.slice(0, 2), o.wobble * 1.4, rand);
    return {
      fill: curve(main, true),
      stroke: curve(main.concat(overshoot), false),
      ghost: curve(jitter(base, o.wobble * 1.3, rand), true),
    };
  }

  function sketchLine(x1, y1, x2, y2, o) {
    var rand = rng(o.seed);
    var n = Math.max(2, Math.round(Math.hypot(x2 - x1, y2 - y1) / 40));
    var pts = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n;
      var edge = i === 0 || i === n ? 0.4 : 1;
      pts.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t + (rand() - 0.5) * 2 * o.wobble * edge]);
    }
    return curve(pts, false);
  }

  function hatch(w, h, o) {
    var rand = rng(o.seed);
    var spacing = o.spacing || 4.5;
    var a = o.angle == null ? -0.75 : o.angle;
    var dx = Math.cos(a), dy = Math.sin(a);
    var half = Math.hypot(w, h) / 2 + 4;
    var d = '';
    for (var s = -half; s <= half; s += spacing) {
      var off = s + (rand() - 0.5) * spacing * 0.5;
      var px = w / 2 - dy * off;
      var py = h / 2 + dx * off;
      var bow = (rand() - 0.5) * 2.4;
      d +=
        'M' + f(px - dx * half) + ' ' + f(py - dy * half) +
        'Q' + f(px - dy * bow) + ' ' + f(py + dx * bow) + ' ' + f(px + dx * half) + ' ' + f(py + dy * half);
    }
    return d;
  }

  var uid = 0;

  function layer(el, cls) {
    var svg = el.querySelector(':scope > svg.' + cls);
    if (!svg) {
      svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', cls);
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      el.insertBefore(svg, el.firstChild);
    }
    return svg;
  }

  function seedOf(el, salt) {
    return hashSeed((el.getAttribute('data-sketch') || el.textContent.trim().slice(0, 40) || 'mugful') + (salt || ''));
  }

  function num(el, name, fallback) {
    var v = parseFloat(el.getAttribute('data-' + name));
    return isNaN(v) ? fallback : v;
  }

  /** A box with a pencil outline, optionally shaded with hatching. */
  function drawBox(el) {
    var w = el.offsetWidth, h = el.offsetHeight;
    if (!w || !h) return;
    var svg = layer(el, 'sk');
    var sw = num(el, 'stroke', 1.6);
    var shape = sketchRect(w, h, { radius: num(el, 'radius', 16), wobble: num(el, 'wobble', 1.1), seed: seedOf(el) });
    var html = '<path class="sk-fill" d="' + shape.fill + '"/>';
    if (el.hasAttribute('data-hatch')) {
      var id = 'skc' + ++uid;
      html +=
        '<clipPath id="' + id + '"><path d="' + shape.fill + '"/></clipPath>' +
        '<g clip-path="url(#' + id + ')"><path class="sk-hatch" d="' +
        hatch(w, h, { seed: seedOf(el, 'h'), spacing: num(el, 'spacing', 4.5) }) + '"/></g>';
    }
    html +=
      '<path class="sk-stroke" pathLength="1" stroke-width="' + sw + '" d="' + shape.stroke + '"/>' +
      '<path class="sk-ghost" stroke-width="' + sw * 0.6 + '" d="' + shape.ghost + '"/>';
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.innerHTML = html;
  }

  /** Coloured-pencil highlight behind a few words. */
  function drawMark(el) {
    var w = el.offsetWidth, h = el.offsetHeight;
    if (!w || !h) return;
    var svg = layer(el, 'mk');
    // Sits on the lower part of the line, like a pencil run along under the words (see .mk in site.css).
    var pad = 6;
    var W = w + pad * 2, H = Math.round(h * 0.56);
    var shape = sketchRect(W, H, { radius: 10, wobble: 2, seed: seedOf(el), inset: 3 });
    var id = 'mkc' + ++uid;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.innerHTML =
      '<clipPath id="' + id + '"><path d="' + shape.fill + '"/></clipPath>' +
      '<path class="mk-tint" d="' + shape.fill + '"/>' +
      '<g clip-path="url(#' + id + ')"><path class="mk-hatch" d="' +
      hatch(W, H, { seed: seedOf(el, 'm'), spacing: Math.max(5, h / 9), angle: -0.95 }) + '"/></g>';
  }

  /** The app's section-heading underline: one firm pencil pass and a looser second one. */
  function drawScribble(el) {
    var w = Math.min(el.scrollWidth, num(el, 'scribble', el.tagName === 'H2' && !el.hasAttribute('data-scribble') ? 84 : 140));
    if (!w) return;
    var svg = layer(el, 'sc');
    var h = 10, s = seedOf(el, 's');
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.style.width = w + 'px';
    svg.innerHTML =
      '<path class="sc-a" pathLength="1" d="' + sketchLine(2, 4, w - 2, 4, { seed: s, wobble: 1.2 }) + '"/>' +
      '<path class="sc-b" pathLength="1" d="' + sketchLine(8, 6.5, w - 14, 6, { seed: s + 1, wobble: 1.6 }) + '"/>';
  }

  var kinds = [
    ['[data-sketch]', drawBox],
    ['[data-mark]', drawMark],
    ['[data-scribble], .doc h1, .doc h2', drawScribble],
  ];

  function drawAll() {
    kinds.forEach(function (k) {
      document.querySelectorAll(k[0]).forEach(k[1]);
    });
  }

  function watch() {
    if (!('ResizeObserver' in window)) return;
    var sizes = new WeakMap();
    var ro = new ResizeObserver(function (entries) {
      entries.forEach(function (e) {
        var el = e.target;
        var key = el.offsetWidth + 'x' + el.offsetHeight;
        if (sizes.get(el) === key) return;
        sizes.set(el, key);
        kinds.forEach(function (k) {
          if (el.matches(k[0])) k[1](el);
        });
      });
    });
    kinds.forEach(function (k) {
      document.querySelectorAll(k[0]).forEach(function (el) {
        ro.observe(el);
      });
    });
  }

  /** Pencil lines draw in as each part of the page arrives. */
  function reveal() {
    var targets = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      targets.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    targets.forEach(function (el) { el.classList.add('wait'); });
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('in');
          io.unobserve(e.target);
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.15 }
    );
    targets.forEach(function (el) { io.observe(el); });
  }

  function start() {
    reveal();
    drawAll();
    watch();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawAll);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
