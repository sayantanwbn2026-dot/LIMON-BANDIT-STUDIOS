# Limon Bandit — Performance

Pass 5, Job 1. Numbers measured, not estimated. Anything not yet measured is
marked outstanding rather than guessed.

## Headline

| | Before | After |
| --- | ---: | ---: |
| Hero mascot (LCP candidate) | **1,432.7 KB** PNG | **55.2 KB** AVIF @1024 |
| Largest photographic asset @1440 | 166.5 KB JPEG | **34.6 KB** AVIF |
| Source images on disk | 3,032 KB / 22 files | unchanged (sources retained) |
| JS + CSS, gzipped, production build | 191.1 KB | 192.4 KB |
| npm dependencies | 68 | **27** |
| Source files in `src/components/ui` | 46 | **0** |
| ESLint | 244 errors, 8 warnings | **0 errors, 2 warnings** |

The mascot alone was 39% of the entire site's payload and was marked
`fetchPriority="high"`, so it was almost certainly the Largest Contentful
Paint. It is now **96% smaller**.

## Images

`scripts/images.mjs` (sharp) emits AVIF + WebP at 480/768/1024/1440/1920 —
never upscaling past the source — plus one fallback, into `public/img/`, and
writes a typed manifest to `src/generated/images.ts`. It is incremental: a
re-run with no source changes writes 0 files.

Deliberately **not** a Vite plugin. The project pins Vite 8 behind a vendored
config preset (`@lovable.dev/vite-tanstack-config`), and a bundler plugin is
the fragile part of that stack. Files under `public/` are served verbatim by
every host and every dev server.

Every image renders through `src/components/lb/Picture.tsx`. The `<picture>`
is `display: contents`, so the `<img>` remains the layout box and all existing
utilities — including `mono` and `--img-brightness` — kept working untouched.
`width`/`height` come from the manifest rather than being hand-typed, so they
cannot drift from the real file.

**No PNG fallback for transparent images.** The mascot's PNG is 324 KB against
55 KB for AVIF, and the only browsers lacking WebP also lack `svh`,
`color-mix` and the rest of what this site is built on. WebP is the floor.

Verified in the browser, landing page: **69 images, 0 broken, 69 in
`<picture>`, 69 served as AVIF**.

Per-image AVIF, largest variant:

| Asset | Source | AVIF | Saving |
| --- | ---: | ---: | ---: |
| limon-mascot | 1,432.7 KB | 55.2 KB @1024 | 96% |
| split-corridor | 166.5 KB | 34.6 KB @1440 | 79% |
| room-b | 140.3 KB | ~30 KB | ~79% |
| room-a | 117.6 KB | 34.1 KB @1440 | 71% |
| wall-05 | 92.3 KB | 28.2 KB | 69% |
| wall-04 | 80.7 KB | 19.5 KB | 76% |

Budgets from the brief — mascot under 120 KB, no photo over 90 KB at 1440 —
are met with large margin.

## Bundle

`src/components/ui/` held 46 shadcn components. **Nothing outside that
directory imported any of them**, verified by exhaustive grep. Deleted, along
with `lib/utils.ts`, `hooks/use-mobile.tsx` and `components.json`, and the 41
npm packages that existed only to serve them (26 Radix packages, plus recharts,
embla, cmdk, react-hook-form, date-fns, vaul, sonner and others).

**This did not reduce shipped bytes** — 191.1 KB before, 192.4 KB after (the
small increase is `Picture` itself). Tree-shaking had already excluded the
unused components from the bundle. The win is install size, supply-chain
surface (41 fewer packages to audit and patch) and 46 fewer files to read.
Worth stating plainly rather than presenting as a size victory.

Production gzipped, landing route:

| Chunk | gzipped |
| --- | ---: |
| `index-*.js` | 106.6 KB |
| `Noise-*.js` (landing sections) | 47.9 KB |
| `routes-*.js` | 26.5 KB |
| `styles-*.css` | 8.4 KB |
| **Total** | **192.4 KB** |

Against the brief's 180 KB budget this is **12 KB over**. The dominant cost is
GSAP (251 KB raw on the server build). Closing it means deferring
GSAP/ScrollTrigger off the critical path — real work, not a tweak, and it
belongs with the route-splitting in Job 2 rather than being rushed here.

## Outstanding

- **Fonts (Job 1.2) not started.** Sora and Switzer are still fetched from
  `fonts.googleapis.com` and `api.fontshare.com` — two extra DNS lookups, two
  TLS handshakes and two render-blocking stylesheets before a single glyph
  draws. Self-hosting and subsetting is the single largest remaining win on
  this page, ahead of any further image work.
- **Lighthouse not run.** No Chrome is reachable from this environment
  (the extension is not connected and the in-app pane cannot drive it), so
  Performance/LCP/CLS/INP figures are not yet recorded. Every number above
  comes from the build output, the filesystem, or the live DOM.
- **180 KB JS budget not met** — see above.
- Route-level image budgets will need revisiting once the six inner routes
  exist; the figures here are for `/` only.
