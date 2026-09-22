# Aurelia

An immersive 3D restaurant experience. A culinary journey through light & shadow.

Pure HTML, CSS, and JavaScript — no framework, no build step, no JSON manifests.
3D rendering is powered by [Three.js](https://threejs.org/) loaded as an ES module from a CDN via an `<script type="importmap">`.

---

## What's inside

- **Hero** — A 3D dining room rendered with Three.js: a slow camera drift across four candlelit tables, custom shader particles (warm embers + cream dust motes), gold light ribbon, vignette, and a curtain reveal.
- **About** — Chef's story + animated candle SVG.
- **Menu** — Four courses with hand-coded animated SVG icons and reveal-on-scroll.
- **Gallery** — 3×2 grid of posters; on hover, the tile tilts to follow the cursor and the video plays.
- **Reservations** — A working client-side reservation form with success state.
- **Contact** — Address, hours, contact details, and a stylized SVG map of Florence.
- **Footer** — Brand, links, copyright.
- **Two cinematic overlays** triggered from the navbar:
  - **Reserve** — A scripted camera pushes through opening doors into a candlelit dining room (Three.js scene).
  - **Menu** — Four plates slide in onto a candle-lit table while titles rotate.
- **Theme toggle** — Dark/light themes with anti-FOUC bootstrap and persistence.

---

## File structure

```
3D Website/
├── README.md
├── public/                     # Deployable static root
│   ├── index.html              # Static markup. Loads /styles.css and /scripts.js.
│   ├── styles.css              # All CSS (theme tokens, sections, overlays, responsive).
│   ├── scripts.js              # Single ES module entrypoint — Three.js + vanilla JS.
│   ├── favicon.svg
│   ├── fonts/
│   │   ├── inter.css           # Self-hosted Inter Bold fallback
│   │   └── inter-bold.ttf
│   └── posters/                # Gallery poster images (6 JPGs)
└── _archive_react/             # Original React/Vite source (kept for reference)
```

The deployable site lives under `public/`. Point any static host at that directory.

---

## Running it

This is a **static site** — open `index.html` directly in a browser, or serve the directory with any static file server:

```bash
# Python
python -m http.server 5173

# Node (if you have npx)
npx serve .
```

Then visit `http://localhost:5173`.

> **Note:** The site uses ES modules and an importmap to load Three.js from a CDN (`https://unpkg.com/three@0.169.0/`). Opening the file directly via `file://` will fail in most browsers due to module/CORS rules. Use a static server.

---

## Deployment

Drop the whole directory into any static host (Netlify, Vercel, Render, GitHub Pages, etc.). There is no build step.

- For Render: use the `static` runtime and set the publish directory to `.`
- For GitHub Pages: push and enable Pages on the root

---

## Tech stack

- **HTML5** — Static markup, semantic sections
- **CSS3** — Custom properties, keyframes, grid, responsive
- **Vanilla JavaScript (ES2020+)** — No framework, no bundler
- **Three.js 0.169** — Loaded via `<script type="importmap">` from unpkg
- **Google Fonts** — Cormorant Garamond + Inter (preconnected)

---

## Credits

Designed & built by **Aosaf Ahbab Rayeed** · EEE, BUET.

---

## License

Private project. All rights reserved.
