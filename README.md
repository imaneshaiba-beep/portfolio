# Portfolio — Shaiba Imane

Vanilla HTML / CSS / JS + GSAP. Design source: Figma file "portfolio", page "Portfolio"
(sections *Home*, *Work*, *Quests* — marked Ready for dev).

## Run locally

```bash
cd ~/Desktop/portfolio_code
python3 -m http.server 8765
# open http://127.0.0.1:8765
```

(Use a local server, not `file://`: fonts and the Sanity fetch need an http origin.)

## Structure

```
index.html            Home — horizontal scrapbook
works.html            Works — project folders loaded from Sanity (pinned stack)
quests.html           Side quests — vision-board of experiments (Sanity `quest`)
quest.html            Quest detail page (?q=<slug>)
legal.html            Legal notice, privacy (GDPR), accessibility statement, credits
css/tokens.css        design tokens = Figma variables (colors, spacing, radius, --u)
css/base.css          fonts, reset, utilities (.sr-only, .grain)
css/components.css    fixed header links + liquid-glass dock (shared by every page)
css/home.css          Home layout: one rule per Figma layer
css/works.css         Works page: folder grid, skeleton, decorations
js/home.js            horizontal scroll (GSAP ScrollTrigger), scroll / hover motion, to-do list
js/works.js           fetch projects, build folders from <template>, "deal" animation
js/sanity.js          read-only Sanity client (project op2qjg9p, dataset production) + image URLs
js/intro.js           welcome intro (handwritten name, cursor trail)
js/quests.js          board, polaroids, red string
js/quest.js           detail page + js/portable-text.js (rich text renderer)
js/sound.js           sounds (synthesized + recorded keyboard / folder)
js/marker.js          hover effects on links: highlighter, marker underline, felt-pen circle
studio/               Sanity Studio (schemas: projet, quest) — `cd studio && npm run dev`
assets/fonts/         Tox Typewriter, i eat crayons (woff2)
assets/img/home/      WebP exports (2x the 1080p size) + backdrop SVG
```

## How the Home layout works

- The composition is a 4254 × 1080 artboard. `.track` keeps that ratio at the
  viewport height (`aspect-ratio: 4254 / 1080`).
- Every piece is placed with `--x / --y / --w / --h` in **%** of its container,
  plus `--r` (rotation) and `--sh` (drop shadow). Values come straight from Figma.
- Type and shadows scale with `--u` (1 artboard px = `100vh / 1080`).
- Vertical scroll drives the track horizontally (pinned ScrollTrigger). With
  `prefers-reduced-motion` or without GSAP: native horizontal scroll.

## Content

Home copy is static (in English). Projects come from Sanity (`projet` documents,
ordered by `ordre`): add or edit them in the Studio, no code change needed.

## To check before going live

- Font licences: both fonts say “All Rights Reserved”. Confirm web embedding is allowed
  (or buy a web licence) before publishing.
- Add the production domain to Sanity → API → CORS origins.
