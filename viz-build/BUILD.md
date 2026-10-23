# C implementation handoff

Root A owns integration and Site deployment. No raw recruiting data were modified.

Production assets: `observatory.js`, `observatory.css`, `vendor-antv.js`; geography stays at `dist/maps/{china-provinces.geojson,city-anchors.json,GEO-LICENSE.txt}` from B. Keep `vendor-antv.js.LEGAL.txt`, `G2-LICENSE.txt`, `L7-LICENSE.txt`, and `L7-MAPS-LICENSE.txt`, and `G-SVG-LICENSE.txt` beside the bundle.

Load CSS after `style.css`. Remove only the trailing `init();` in `snapshot.js`. Load scripts in existing order through `snapshot.js`, then `vendor-antv.js`, `observatory.js`, and an explicit final `<script>init();</script>`. Existing legacy module hashes remain compatibility links. Default route is `#snapshot/overview`.

The local bundle pins G2 5.4.8, L7 and L7 Maps 2.29.1, esbuild 0.28.2 and explicit G SVG renderer 2.1.1. Preserve `vendor-entry.js`, `package.json`, and `package-lock.json` in a build directory; do not publish node_modules. Reproduce with `npm ci` then `npx esbuild vendor-entry.js --bundle --format=iife --outfile=vendor-antv.js --minify --legal-comments=external`. Engines use MIT licenses. The esbuild legal text includes dependency attributions.

Semantic hooks: `[data-cmo-view]` (overview/map/matrix/industry), `[data-cmo-cell]` with `data-role` and `data-city` or `data-industry`, `#cmo-selection` with record and valid-salary counts, `[data-cmo-drill]` for explicit global commit, `[data-cmo-display]`, `[data-cmo-compare-axis]`, and `[data-cmo-structure]`. Cells do not use legacy instant-filter `data-market-cell`.

Local chart failure leaves numeric tables. The map always starts with a deterministic geographic SVG, with real municipal/city anchors from B; L7 can be enabled to drag and zoom. Missing coordinates stay in the full city table. Offline export embeds all scripts, CSS, full historical data, GeoJSON, and centers; no remote tiles or API key.

`qa-ui.mjs` and `qa-interactions.mjs` run against A's integrated http://127.0.0.1:8765 using the existing Playwright installation and Chrome executable. QA results and screenshots are in this artifact directory.
