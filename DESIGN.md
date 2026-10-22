# Mugful website design

The site is a page from the same pencil sketchbook as the iPhone app (`HaugaardThomas/cozy-coffee`). It borrows the app's world rather than inventing one; when the app changes, the site follows.

## World

- **Paper:** oatmeal `#ECE4D3` with `paper-grain.png` tiled over it. Dark mode ("sketchbook by lamplight") is dark kraft `#2B241D` with `paper-grain-dark.png`. Follows `prefers-color-scheme`.
- **Ink:** graphite brown `#4A3A2E` for outlines, `#3B2E26` for text, `#6E5E51` for secondary text. Never pure black.
- **Pencil box:** moss `#536E45` (actions, heading underlines), rust `#A4512F` (caffeine, coffee, hatching), ochre `#8E671C` (calories), blue `#43709D` (water only), rose `#A2566F` (sugar). Dark values mirror `src/constants/theme.ts`.
- **Type:** Gaegu Bold for headings and margin notes, Shantell Sans for everything else. Both self-hosted in `assets/fonts/`. Gaegu has no curly quotes, so headings use straight ones (kramdown `smart_quotes` is set accordingly).

## Drawing

- `assets/sketch.js` is a port of the app's `src/lib/sketch.ts`: seeded wobbly rectangles, pencil hatching and bowed lines. Mark an element with `data-sketch` (outline), `data-hatch` (shading), `data-mark` (coloured-pencil highlight behind words) or `data-scribble` (the app's double green heading underline). `data-radius` and `data-stroke` tune the shape; set `--sk-fill`, `--sk-ink` or `--sk-hatch` in CSS to colour it.
- Without JavaScript the same elements fall back to plain ink borders.
- Icons are the app's pencil icons (`src/components/pencil-icons.tsx`), inlined as SVG.
- The logo is inlined from `brand/mugful/` with colours swapped for CSS variables so it works on both papers. Don't retype the name.

## Motion

One grammar: the pencil draws things as they arrive. Outlines trace themselves, hatching fades in after, the hero words get coloured in, the closing mug fills up, the half-life curve draws. Everything is off under `prefers-reduced-motion`.

## Pages

- `index.html`: hero with the Today screen, then a tour (recipe model, half-life chart, history, promises with the dark screen), then a closing.
- `privacy.md`, `support.md`: `page` layout, text in a drawn card.
- Screens in `assets/screens/` are WebP exports of the App Store screenshots (`marketing/screenshots/public/screenshots/apple/iphone/en/` in the app repo) at 440 and 880 px wide.
- `_includes/halflife-chart.svg` is generated (one 126 mg flat white at 7:40 AM, 5 h half-life, bedtime 11 PM, last call 1:11 PM as in the app screenshot). Regenerate it with `node tools/halflife-chart.js assets/sketch.js _includes/halflife-chart.svg` rather than hand-editing.
