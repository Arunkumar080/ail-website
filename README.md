# Aetherius Intelligence Labs

Our operational model is strictly a "Value-Delta" approach. Our embedded agents cryptographically audit
your current compute baseline, optimise your stack, and we only invoice a percentage of the actual cash
saved.

This repository holds the public web presence for that model: a marketing site and an interactive
WebGL briefing tool, built as one Vite project with two independent entry points.

| Route         | What it is                                                                 | Entry                                   |
| ------------- | -------------------------------------------------------------------------- | --------------------------------------- |
| `/`           | Public marketing site — the front door                                      | `index.html` → `src/site/main.tsx`      |
| `/simulator/` | "Perimeter node": a five-mode WebGL briefing app (gateway → phantom)        | `simulator/index.html` → `src/main.tsx` |

The two share no runtime code. That is deliberate and worth preserving: it is why a visitor to the
marketing site never downloads three.js.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173/  — add /simulator/ for the canvas app
```

Node `^20.19.0 || >=22.12.0` (required by Vite 8 and oxlint). A plain `npm install` resolves cleanly;
no `--legacy-peer-deps` is needed — `@react-three/fiber`'s React Native and Expo peers are declared
optional.

| Script            | Does                                                          |
| ----------------- | ------------------------------------------------------------- |
| `npm run dev`     | Vite dev server, both pages                                    |
| `npm run build`   | `tsc -b && vite build` — type-check, then emit to `dist/`      |
| `npm run preview` | Serve the built `dist/` exactly as production would            |
| `npm run lint`    | `oxlint` (config in `.oxlintrc.json`)                          |

There is no test suite. Verification to date has been build + lint + headless-browser rendering
checks; see [Verifying a change](#verifying-a-change).

---

## Environment

Copy `.env.example` to `.env`. Both variables are optional — the app runs with neither.

| Variable              | Effect when unset                                    | Effect when set                                                                |
| --------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| `VITE_VIVID_API_URL`  | VIVID answers from a local deterministic engine       | Streams from a live uplink. `http(s)://…` = POST + Server-Sent Events; `ws(s)://…` = WebSocket. Both stream `text` \| `{"delta": "…"}` until `[DONE]` \| `{"done": true}`. |
| `VITE_SITE_URL`       | `og:url` / `og:image` fall back to the placeholder    | Absolute origin for social card URLs, no trailing slash                        |

`.env` is git-ignored. Anything prefixed `VITE_` is **inlined into the client bundle** — never put a
secret there.

---

## Layout

```
index.html            → the marketing site page
simulator/index.html  → the canvas app page
src/
  site/               the marketing site — self-contained, own stylesheet
    Site.tsx          section composition
    site.css          Tailwind entry + design tokens
    economics.ts      the worked-example arithmetic (single source of truth)
    links.ts          nav / footer link tables
    components/       Nav, Hero, Interventions, Arsenal, Economics,
                      Security, Engagement, Contact, Footer + Container,
                      Section, Motion, Logo
  main.tsx, App.tsx   the canvas app root
  components/         canvas DOM overlay (nav, telemetry, terminal, inspector)
  fabric/             the logic-fabric scene: curves, shaders, camera rig
  gateway/            mode 00 — monolith, arsenal, executive dossier
  ledger/             mode 03 — node ladder, drift, schema labels
  phantom/            mode 04 — enclave, cluster, deployment drop
  sim/model.ts        mode 02 — value-delta formula + latency models
  state/perimeter.ts  shared external store for the whole canvas app
  brand/              arsenal product marks (shared by both apps)
  styles/             canvas app stylesheet + Tailwind theme
  audio/              Web Audio synth and key-click
public/og.png         social card image
```

---

## The marketing site (`/`)

Implemented from a Claude Design artboard (`Aetherius Site Redesign.dc.html`). **The artboard is a
single `desktop 1440` frame**, so design values hold from Tailwind's `lg:` breakpoint upward;
everything below that — heading step-downs, grid collapses, stacked proof strip and footer, the
hamburger drawer — was authored here, not specified. Treat those as open to revision in a way the
≥1440 layout is not.

**Tokens** live in the `@theme` block of `src/site/site.css`:

| Token                        | Value     | Used for                        |
| ---------------------------- | --------- | ------------------------------- |
| `--color-void`               | `#050506` | page ground, footer             |
| `--color-shell`              | `#08090a` | content shell                   |
| `--color-cyan`               | `#22d3ee` | accent, eyebrows, CTA           |
| `--color-cyan-lift`          | `#67e8f9` | accent hover                    |
| `--color-ink` → `--color-dim`| ramp      | headings → body → muted → index |

Type is Schibsted Grotesk (sans) and JetBrains Mono (mono), both self-hosted via `@fontsource-variable`.
`body` is `text-transform: lowercase`; uppercase `// label` eyebrows are the deliberate exception.

**The site's cyan is `#22d3ee`. The canvas app's is `#5ff2ff`.** They are different palettes on
purpose — don't unify them without a decision.

### Conventions that are load-bearing

- **Tailwind scoping.** `site.css` uses `@import 'tailwindcss' source('./')`, so it only scans
  `src/site/`. The canvas app's `src/styles/tailwind.css` does the inverse with `@source not '../site'`.
  A class used in one app is not generated for the other. Files moved across that boundary need both
  stylesheets re-checked.
- **`economics.ts` is the single source of truth** for the worked example. The bar widths and the
  ledger figures both read from `workedExample()`, so they cannot drift apart. Change the constants
  there, not in the JSX.
- **Reveal-on-scroll (`components/Motion.tsx`) deliberately avoids an animation library and an
  IntersectionObserver.** It is a geometry sweep that writes `opacity: 1` straight onto the element.
  An IO callback is not delivered in a non-painting frame and a frame-driven tween never lands its
  final value, so both strand content at `opacity: 0` in headless renders, thumbnail capture and
  backgrounded tabs. The reveal test is `top < vh * 0.85`, monotonic in scroll position, rather than
  the artboard's "15% visible" — the latter can never fire for an element already scrolled past.
- **Inline SVG uses `vector-effect: non-scaling-stroke`** via the `.gfx *` rule, so hairlines stay
  1px at any scale.
- **No hover affordances on cards.** The artboard has none; earlier revisions did. Adding spotlight
  or lift effects back is a design change, not a polish pass.

### Known gaps

- Two labels in the security diagram are clipped — `savings report onl` (missing the "y") and
  `client services + data` running to its box edge. **The artboard clips them identically**;
  this was verified by rendering the original bundle side by side, so the clipping is a faithful
  match, not a bug introduced here. One-line fixes if you would rather correct than match:
  `Security.tsx:65` `x="430"` → `x="416"`, and `Security.tsx:55` `fontSize` `10` → `9.5`.
- `#about` and `#careers` in the footer's company column point at sections that do not exist.
- **Deep links to a section do not scroll on first load.** `/#contact` lands at `scrollY: 0` because
  the target is not yet in the DOM when the browser handles the fragment, and the wrappers below the
  fold stay hidden — so the visitor sees the hero, not the section they were sent to. In-page nav
  clicks are unaffected. Roughly four lines to fix, if it matters for shared links.

---

## The canvas app (`/simulator/`)

A single-screen react-three-fiber scene with a DOM overlay, moving through five modes:

| # | Mode        | What happens                                                              |
| - | ----------- | ------------------------------------------------------------------------- |
| 0 | `gateway`   | Monolith shatters into the logic fabric; arsenal nodes spawn. Two views — technical architecture and a paged executive briefing. |
| 1 | `perimeter` | The fabric itself; the intent terminal routes queries (transient `routing` mode). |
| 2 | `simulator` | Value-delta model — ingestion load and opex baseline drive savings, royalty and net retained. |
| 3 | `ledger`    | Node ladder with schema inspector, drift and quarantine states.            |
| 4 | `phantom`   | Deployment sequence: compiling → injecting → verifying → symbiotic, ending in a single-use token. |

**State** is a hand-rolled external store, `src/state/perimeter.ts`, read through
`useSyncExternalStore`. Anything read per frame (pointer, hover, slider values) is read via `get()`
directly so the render loop never waits on React. Add per-frame reads there, not to component state.

**Keyboard** (`src/hooks/useGlobalShortcuts.ts`) — zero-mouse navigation:

| Key                         | Action                                    |
| --------------------------- | ----------------------------------------- |
| `0`–`4` or `g` `p` `v` `l` `d` | Jump to mode                            |
| `←` / `→`, `PgUp` / `PgDn`  | Page the executive dossier (gateway only) |
| `/`                         | Focus the intent terminal / VIVID query   |
| `m`                         | Toggle audio                              |
| `Esc`                       | Release focus; clear the ledger selection |

Letters and digits are ignored while a text input has focus, so typing never switches mode.

**Audio** is Web Audio, off by default, and every oscillator is torn down on `pagehide`.

**The camera frames to the DOM chrome, not the viewport.** The header panel is sized by its tallest
child (the telemetry column, ~178px), so a scene centred in the viewport is partly hidden behind it.
`PerimeterNode` publishes the header's bottom edge and the bottom bar's top edge to
`perimeter.chromeTopPx` / `chromeBottomPx`, and `CameraRig` reads them per frame in gateway mode to
dolly back and slide the framing down so the monolith sits centred in the clear band between them.
Both values are written straight to the store rather than React state, because the rig reads them
every frame and must not trigger a re-render. If you change the header's contents or height, the
framing follows automatically — but if you add chrome elsewhere, publish its edge the same way.

---

## Verifying a change

`npm run build` proves the types compile; it does not prove either page renders. For anything
touching layout, motion or shared files, render both:

```bash
npm run build && npm run preview     # then load / and /simulator/
```

Worth checking after a site change, because each has caught a real regression here:

1. **No element stuck at `opacity: 0`** after scrolling the full page (the motion sweep).
2. **`scrollWidth === clientWidth`** at 390px and 1440px — use real mobile emulation, not a narrow
   window; headless Chrome at `--window-size=390` ignores the viewport meta and reports false overflow.
3. **`/simulator/` still renders** — a canvas element with non-zero dimensions, and no console errors.
   Site-only changes have broken it before via shared files (`index.html`, fonts, Tailwind scoping).
4. **`prefers-reduced-motion`** reveals all content outright and stops the spark animation.

---

## Deploying

`npm run build` emits `dist/` with `index.html` at the root and `simulator/index.html` nested. Any
static host works. Two notes:

- Serve `/simulator/` **with** the trailing slash, or configure a redirect; without it most static
  hosts fall through to the marketing page.
- Set `VITE_SITE_URL` at build time so the social card URLs are absolute.
