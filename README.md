# Vlastimir · Research Engineering

Vlastimir’s portfolio features MORPH, Monte Carlo AD Greeks, Q-CyberSelect, Prompt Shield, Hawkes-OFI Market Microstructure, and Adaptive-DRST. The opening exhibit presents an original machined Möbius band in surface, contour, and structural views. Scroll to rotate the band and inspect the geometry, or jump directly to a project.

## Run locally

Use Node.js 22 and npm.

```sh
npm ci
npm run dev
```

For the static production build and its local preview, run these commands in the project directory.

```sh
npm run build
npm run preview
```

## Future work

With the dev server running on its default port, open any of these exhibits directly. The portfolio terminal’s `research` command also lists all three.

- Explore six proposed career milestones in computational neuroscience, automation and spatial intelligence. Each node names a target role, a deliverable and a way to test it. Marking a step advances the route preview and saves it in your browser. [Career map](http://localhost:5173/#future-work)
- Run a seeded simulation in a browser worker. It generates eight training voyages, decodes 256 positions on four held-out voyages and compares median position error against a navigator that remembers its last fix. Download the seed, protocol and trajectories as JSON to replay the run. [Navigation replay](http://localhost:5173/#navigation-replay)
- Switch between place fields, route topology and a five-fix survey on an original island chart. Each layer pairs a proposed experiment with an evaluation measure and a primary research reference. [An atlas from memory](http://localhost:5173/#research-atlas)

## GitHub Pages

The build outputs a static site in `dist/`. Its relative asset paths support a username site or a repository subdirectory. Section links use fragment identifiers so direct links and refreshes work on a static host.

The included workflow builds the project on pushes to `main` and can also run manually. To publish, enable **GitHub Actions** as the repository’s Pages source and use the workflow in `.github/workflows/deploy.yml`.

## Source

- `src/App.tsx` implements navigation, the native mobile menu, figure controls and scroll timelines.
- `src/scene/` contains the parametric half-twist, custom metal shader, etched angle markings, and React Three Fiber renderer. The renderer pauses outside the viewport and while the page is hidden.
- `src/exhibits/` contains the silicon, mathematics, and intelligence chapters. Tap a model, select a project, or choose **Ask Luffy** to start a three-part conversation. Select **Read aloud** to hear the current reply and the following replies in an original synthetic voice. Select **Mute** to return to text. Each reply changes the model’s viewpoint or geometry. Drag or use the arrow keys to rotate a live figure. Its pause button freezes automatic motion.
- `src/companion/` contains the original articulated straw-hat figure and its scroll and dialogue animations. The hat control hides or shows the guide and remembers that choice on this browser. Edit `PirateFigure.tsx` to change the artwork while keeping the named joints.
- `src/exhibits/tourScript.ts` holds the dialogue for all six projects. `src/editorial/plates/` builds the corresponding Three.js models. Models and their matching stills are original visual interpretations of the projects.
- `src/desk/` contains the keyboard-operated portfolio terminal and the expandable experiment wall. `src/story/` contains the personal introduction, procedural surface study, and closing scene.
- `src/editorial/career/` contains the career map, milestone dependencies and the navigation experiment. `src/editorial/FutureWork.tsx` holds the three atlas proposals.
- `src/styles.css` defines typography, the page frame, responsive layouts and motion preferences.

Reduced motion removes the pinned sequence and uses locally rendered stills for the hero and project figures. The posters in `public/field/` and `public/plates/` also support devices without WebGL. Live project figures render while visible.

Instrument Sans, Instrument Serif and IBM Plex Mono are bundled locally under the SIL Open Font License. Each license ships in `public/licenses/`. Interface icons are from Lucide. The monogram, Möbius sculpture and project illustrations were created for this portfolio.
