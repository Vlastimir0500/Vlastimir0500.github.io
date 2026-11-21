# Vlastimir · Research Engineering

Vlastimir’s portfolio features MORPH, Monte Carlo AD Greeks, Q-CyberSelect, Prompt Shield, Hawkes-OFI Market Microstructure, and Adaptive-DRST. The opening exhibit presents an original machined Möbius band in surface, contour, and structural views. Scroll to rotate the band and inspect the geometry, or jump directly to a project.

## Run locally

Use Node.js 22 and npm.

```sh
npm install
npm run dev
```

For the static production build and its local preview, run these commands in the project directory.

```sh
npm run build
npm run preview
```

## GitHub Pages

The build outputs a static site in `dist/`. Its relative asset paths support a username site or a repository subdirectory. Section links use fragment identifiers so direct links and refreshes work on a static host.

The included workflow builds the project on pushes to `main` and can also run manually. To publish, enable **GitHub Actions** as the repository’s Pages source and use the workflow in `.github/workflows/deploy.yml`.

## Source

- `src/App.tsx` implements navigation, the native mobile menu, figure controls and scroll timelines.
- `src/scene/` contains the parametric half-twist, custom metal shader, etched angle markings, and React Three Fiber renderer. The renderer pauses outside the viewport and while the page is hidden.
- `src/editorial/` contains two featured projects, four selectable project studies, technical references, and GitHub contact. Each project figure is a locally generated Three.js scene. MORPH's package separates into layers, and the data and security studies animate paths, signals, or particles through a spatial model. Drag or use the arrow keys to rotate a figure. Its pause button freezes the animation.
- `src/styles.css` defines typography, the page frame, responsive layouts and motion preferences.

At `#future-work`, an original interactive archipelago illustrates three proposed studies in spatial navigation. Switch between place fields, a route graph, and a five-fix survey. Each proposal includes an experiment, an evaluation measure, and a primary research reference.

Reduced motion removes the pinned sequence and uses locally rendered stills for the hero and project figures. The posters in `public/field/` and `public/plates/` also support devices without WebGL. Live project figures render while visible.

Instrument Sans, Instrument Serif and IBM Plex Mono are bundled locally under the SIL Open Font License. Each license ships in `public/licenses/`. Interface icons are from Lucide. The monogram, Möbius sculpture and project illustrations were created for this portfolio.
