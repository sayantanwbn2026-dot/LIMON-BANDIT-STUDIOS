# Limon Bandit — handoff

Read this first, then `AUDIT.md` (design constitution) and `PERF.md`
(measured performance). `PASS-5.md` and `PASS-6.md` are the outstanding briefs.

## Where things are

- **Repo:** `G:\Active Projects\limonbanditstudios-main\limonbanditstudios-main`
  (note the doubled folder name — the workspace root is the parent).
- **Stack:** TanStack Start + React 19 + Vite 8 + GSAP/ScrollTrigger + Lenis,
  behind the vendored `@lovable.dev/vite-tanstack-config` preset.
- **Dev server:** `bun run dev` → **port 8081** (8080 is taken by another
  project). Pinned in `../.claude/launch.json`.
- **Git:** repo was initialised during pass 4; `3a31f2d` is the pass-3 baseline.

## Commits so far

| Hash | What |
| --- | --- |
| `3a31f2d` | Baseline (pass 3, as received) |
| `b714903` | Pass 4 Job 1 — semantic two-pole theme system + light mode |
| `ef3fbbd` | Pass 4 Job 2 — nav cleanup, menu fits 100svh |
| `cef78f8` | Pass 4 Job 3 — hero v4 scrubbed scene |
| `6e284e3` | Pass 4 Job 4 — spacing/grid/type audit → `AUDIT.md` |
| `d10544a` | Pass 5 + Pass 6 briefs |
| `4e66bb4` | Pass 5 Job 1a — image pipeline, dependency cull |
| `0f438c4` | Pass 5 Job 1b — self-hosted subset fonts |
| `cedcece` | Pass 5 Job 2 — PageShell, route transitions, skip link |
| `654c1da` | Pass 5 Job 3 — `/rooms` |
| `05f8918` | Global grid gutter (content insets from the rules) |
| `c9f25c2` | Pass 5 Job 4 — `/label` + persistent audio player |

## Pass 5 status

| Job | State |
| --- | --- |
| 0 — Look at it (visual review) | **NOT DONE** — see below |
| 1a — Images + deps | done |
| 1b — Fonts | done |
| 2 — Shell, transitions, SEO | done |
| 3 — `/rooms` | done |
| 4 — `/label` + player | done |
| 5 — `/shop` | **not started** |
| 6 — `/crew` | not started |
| 7 — `/journal` | not started |
| 8 — `/contact` | not started |
| 9 — Data integrity, 404 redesign | not started |

`/shop`, `/crew`, `/journal`, `/contact` currently render `PageShell` with no
body — header band, breadcrumb and chapter nav only. That is a deliberate
interim state, not a bug.

## Architecture you need to know before editing

- **Two token poles, not two themes.** A section declares which pole it sits
  on (`--surface/--text/--line` vs `--alt-*`); flipping `data-theme` inverts
  both. Components branch on their **pole**, never on the theme. In light mode
  FAQ and Journal are the two dark chapters — that inversion is the design.
- **Two boxes, not one.** `.shell-rules` is where the drafting grid is
  *drawn*; `.shell` is where content *lives*, inset by `--grid-gutter` (16px,
  12px under 768px). Type must never touch a drawn rule. `.section-head`
  cancels the gutter with a negative margin so its four columns still land on
  the rules exactly, then re-applies it inside each cell.
- **Acid as a surface is always `#E9FF00`. Acid as type follows the pole**
  (`--accent-type`) and dims to `#5F6B00` on bone — `--accent-dim` (`#B8C900`)
  measures 1.63:1 and fails AA; do not use it for type.
- **Global chrome lives in `__root`**, above the router: SkipLink,
  SmoothScroll (Lenis), Noise, Cursor, RouteTransition, Nav, Footer,
  MiniTransport, and `PlayerProvider`. Routes render only their `<main>`.
  The audio element's placement above the router is what makes playback
  survive navigation — do not move it into a route.
- **`src/data/routes.ts` is the single source** for every page's index,
  breadcrumb name, H1, standfirst, title and description. `src/lib/seo.ts`
  requires every SEO field, so a new page cannot inherit another's copy.
- **Generated assets** are gitignored and rebuilt by `predev`/`prebuild`:
  `scripts/images.mjs` → `public/img` + `src/generated/images.ts`,
  `scripts/fonts.mjs` → `public/fonts` + `src/generated/fonts.css`,
  `scripts/audio.mjs` → `public/audio` (placeholder clips, marked REPLACE).
- **All images go through `<Picture>`**; `src` is an `ImageKey` from the
  generated manifest, so a bad key is a compile error.

## Environment gotchas that have already cost time

1. **Never edit source with PowerShell** `Get-Content`/`Set-Content`. PS 5.1
   reads as ANSI and silently mangles every em dash, middle dot, rupee and
   arrow into mojibake, plus adds a BOM. This happened once to 11 files. Use
   Node scripts or the editor tools.
2. **The Browser pane usually does not composite.** Screenshots fail and
   `requestAnimationFrame` never fires — so GSAP timelines, Lenis scrollTo and
   the preloader appear frozen. Verify by measuring the DOM, and treat any
   "frozen mid-transition" colour reading as an artifact.
3. **Never read contrast right after toggling the theme in-pane** — the CSS
   crossfade freezes mid-flight and reports false failures. Set
   `localStorage.lb-theme` and reload instead.
4. **`ScrollTrigger` does not parse `vh` in an `end` string.** `"+=280vh"`
   silently means 280 *pixels*. Use a function returning px.
5. Verification scripts used repeatedly (contrast sweep, spacing audit) are in
   the scratchpad, not the repo — rewrite or re-derive as needed.

## Outstanding problems

- **Job 0 has never been done.** Nobody has visually reviewed this site. The
  one screenshot the user provided found a real defect (type sitting on the
  grid rules) in seconds that four automated audits had missed. Do this before
  building more pages.
- **JS budget missed three passes running and worsening:** 206.2 KB gzipped
  against a 180 KB budget. The cost is GSAP on the critical path plus the
  player. Defer/route-split before adding four more pages, or it compounds.
- **`Faq.tsx` still has its own accordion**; `components/lb/Accordion.tsx`
  exists and `/rooms` and `/label` use it. Faq should adopt it.
- **Lighthouse has never run** — no Chrome reachable from this environment.
  Every number in `PERF.md` comes from the build output, filesystem or DOM.
- **Forms still submit nowhere.** `JoinList` calls `setDone(true)` and
  discards the email. That is Pass 6 Job 1.
- **404 and error boundary are still generic shadcn** with `rounded-md`, in
  violation of the 4px radius rule. Pass 5 Job 9.
- Placeholder audio is synthesised, not music. Replace `public/audio/*.wav`
  with real masters under the same filenames and delete `scripts/audio.mjs`.

## Suggested next step

Job 0 (look at the six pages at 1440/768/390 in both themes), then Pass 5
Job 5 (`/shop`) — but address the JS budget first if any more pages are
planned.
