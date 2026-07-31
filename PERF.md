# Limon Bandit — Performance

Pass 5, Job 1. Numbers measured, not estimated. Anything not yet measured is
marked outstanding rather than guessed.

## Headline

|                                             |                            Before |                        After |
| ------------------------------------------- | --------------------------------: | ---------------------------: |
| Hero mascot (LCP candidate)                 |                **1,432.7 KB** PNG |       **55.2 KB** AVIF @1024 |
| Largest photographic asset @1440            |                     166.5 KB JPEG |             **34.6 KB** AVIF |
| Source images on disk                       |               3,032 KB / 22 files | unchanged (sources retained) |
| JS + CSS, gzipped, production build         |                          191.1 KB |     206.2 KB (see Bundle) |
| Font delivery                               |             2 third-party origins |              **self-hosted** |
| Font payload                                |           ~118 KB, 2 blocking CSS |            **89.9 KB**, none |
| Render-blocking requests before first glyph | **2 stylesheets + 2 DNS + 2 TLS** |                        **0** |
| npm dependencies                            |                                68 |                       **27** |
| Source files in `src/components/ui`         |                                46 |                        **0** |
| ESLint                                      |            244 errors, 8 warnings |     **0 errors, 2 warnings** |

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

| Asset          |     Source |          AVIF | Saving |
| -------------- | ---------: | ------------: | -----: |
| limon-mascot   | 1,432.7 KB | 55.2 KB @1024 |    96% |
| split-corridor |   166.5 KB | 34.6 KB @1440 |    79% |
| room-b         |   140.3 KB |        ~30 KB |   ~79% |
| room-a         |   117.6 KB | 34.1 KB @1440 |    71% |
| wall-05        |    92.3 KB |       28.2 KB |    69% |
| wall-04        |    80.7 KB |       19.5 KB |    76% |

Budgets from the brief — mascot under 120 KB, no photo over 90 KB at 1440 —
are met with large margin.

## Fonts

`scripts/fonts.mjs` downloads Sora from Google and Switzer from Fontshare,
subsets both to the glyphs this site actually sets, and writes woff2 to
`public/fonts/` plus `@font-face` rules to `src/generated/fonts.css`.
`--if-missing` makes dev and build skip it once the faces are on disk, so
neither needs connectivity.

| Family    | Weight |      Subset | Original |
| --------- | -----: | ----------: | -------: |
| Sora      |    700 |     22.4 KB |  24.7 KB |
| Sora      |    800 |     22.4 KB |  24.7 KB |
| Switzer   |    400 |      9.8 KB |  16.3 KB |
| Switzer   |    500 |     11.8 KB |  19.1 KB |
| Switzer   |    600 |     11.9 KB |  19.2 KB |
| Switzer   |    700 |     11.7 KB |  19.0 KB |
| **Total** |        | **89.9 KB** |          |

Only the six weights the type ladder actually uses are shipped — the previous
Google request asked for Sora 400/500/600/700/800, three of which the site
never sets. Two faces are preloaded: Sora 800 (hero wordmark) and Switzer 500
(corner stations). No more, because preloads compete with the LCP image.

Verified in the browser: **0 requests to googleapis, gstatic or fontshare**,
all six faces loaded, and every symbol the site sets — `— – · → ↓ ✱ ₹ © ' " ×
… € é ł` — present in both families (checked against the notdef width, not
guessed).

### The size-adjust was wrong twice before it was right

The fallback faces are metric-adjusted local Arial so the swap does not move
the line box. Ascent/descent/line-gap come from the font's own tables and are
reliable. `size-adjust` took three attempts:

1. **Derived from OS/2 `xAvgCharWidth`** → 130.95% for Sora. Wrong by a third
   and in the wrong direction: that field averages every glyph in the face,
   including ones this site never sets, and it survives subsetting unchanged.
2. **Measured webfont against Arial** → 95.72%. Still wrong, because Arial has
   no 800 weight and the browser synthesises a wider faux-bold, skewing the
   comparison.
3. **Calibrated against the fallback face itself** → 115.72% (Sora),
   101.05% (Switzer).

Measured result: rendered Fallback/webfont width ratio is **1.0000** (Sora
800), **0.9999** (Switzer 500), **1.0079** (Switzer 400). A wrong size-adjust
is worse than none, which is why this was measured rather than trusted.

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

| Chunk                           |      gzipped |
| ------------------------------- | -----------: |
| `index-*.js`                    |     106.6 KB |
| `Noise-*.js` (landing sections) |      47.9 KB |
| `routes-*.js`                   |      26.5 KB |
| `styles-*.css`                  |       8.4 KB |
| **Total**                       | **192.4 KB** |

Against the brief's 180 KB budget this is **12 KB over**. The dominant cost is
GSAP (251 KB raw on the server build). Closing it means deferring
GSAP/ScrollTrigger off the critical path — real work, not a tweak, and it
belongs with the route-splitting in Job 2 rather than being rushed here.

**Update after Jobs 2–4: 206.2 KB — 26 KB over.** The page shell, route
transition, audio player and waveform each added a few KB, and none of it has
been split out yet. The budget has now been missed three passes running and is
getting worse, not better; deferring GSAP and route-splitting the player is
the outstanding fix and should be done before any more pages are added.

## Outstanding

- **The Switzer subset is a fixed glyph set.** Copy introducing a character
  outside `scripts/fonts.mjs`'s `KEEP` list will render in the fallback face.
  The list is deliberately generous (ASCII, Latin-1, Latin Extended-A
  essentials, punctuation, currency, arrows), but it is a list, and it is the
  one maintenance cost this pipeline introduces.
- **Lighthouse not run.** No Chrome is reachable from this environment
  (the extension is not connected and the in-app pane cannot drive it), so
  Performance/LCP/CLS/INP figures are not yet recorded. Every number above
  comes from the build output, the filesystem, or the live DOM.
- **180 KB JS budget not met** — see above.
- Route-level image budgets will need revisiting once the six inner routes
  exist; the figures here are for `/` only.
