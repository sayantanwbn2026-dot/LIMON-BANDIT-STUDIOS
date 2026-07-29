# LIMON BANDIT — PASS 5 (CLAUDE CODE)

## The house opens: asset pipeline, route architecture, and the six rooms

## 0. CONTEXT

You are working inside the Limon Bandit codebase — TanStack Start + React 19 +
Vite + GSAP/ScrollTrigger + Lenis, built across four prior passes into an
editorial-brutalist landing page: a two-pole semantic theme system
(`--surface`/`--text`/`--line` against `--alt-*`, flipped by `data-theme`), a
visible four-column dashed drafting grid with boundary rules and crosshairs, a
pinned four-second scrubbed hero, a full-screen menu that fits `100svh`, and a
documented spacing/type/grid audit in `AUDIT.md`.

Read `AUDIT.md` and `src/styles.css` before you touch anything. They are the
constitution: the token poles, the spacing scale, the type ladder, and the
accepted exceptions are all recorded there, with the reasoning.

**The problem this pass solves: it is still one page.** `/rooms`, `/label`,
`/shop`, `/crew`, `/journal` and `/contact` all render `StubPage`. The
landing page promises a house with four rooms, a label, a shop and a crew, and
every door currently opens onto a placeholder. Nothing else matters until the
doors open.

**Standing rules — unchanged and still binding.** No border radius above 4px.
No box shadows (drop-shadow filters permitted). No gradients beyond the
sanctioned set. No new fonts. No elastic or bounce easing. Acid stays scarce,
and never appears as type on a bone surface — use `--accent-type`, which
follows the pole. Every mechanic degrades cleanly under
`prefers-reduced-motion` and below 1024px. Every spacing value is on the scale
in `AUDIT.md` §4.1. Components branch on their **pole**, never on the theme.

**New standing rule.** Nothing ships that has not been looked at. Every job
below ends with the page open in a browser at 1440, 768 and 390, in both
themes, with a screenshot. Pass 4 was verified entirely by DOM measurement
because the browser pane never composited — that caught four real bugs, but it
cannot catch "this looks wrong."

---

## JOB 0 — LOOK AT IT, AND FIX WHAT YOU SEE

Before building anything new, open the existing page and actually inspect it.

1. Run the dev server. Load `/` at 1440×900, 1280×800, 768 and 390, in both
   themes. Screenshot each. This is the first visual review the site has had.
2. Scroll the hero scene slowly end to end and back. The choreography was
   verified by stepping the timeline, not by watching it. Confirm the wall
   parting, the figure's approach, the blur handover and the crosshair tick
   read as intended at scroll speed, and that nothing snaps on reverse.
3. Throttle the CPU 4× and scroll the hero again. If the phase-3
   `blur(0 → 6px)` stutters, cut the blur and keep the fade — this is
   pre-authorised by the pass-4 brief and needs no further permission.
4. Record anything that looks wrong in `AUDIT.md` under a new
   `## Pass 5 — visual review` heading, then fix it.

Do not proceed to Job 1 until this is done. Everything below compounds on top
of the current page; if it is visually broken, you will build six more broken
pages on top of it.

---

## JOB 1 — THE ASSET AND FONT PIPELINE

The site currently ships `src/assets/limon-mascot.png` at **1.4 MB**, marked
`fetchPriority="high"`, as the hero's focal image. That single file is larger
than the entire rest of the page and is almost certainly the Largest
Contentful Paint. There are twenty more raw JPEGs behind it. This is the
difference between a site that looks expensive and one that is.

### 1.1 — Images

Introduce a build-time image pipeline (`vite-imagetools` or equivalent — your
call, but it must run at build, not at request).

- Every image in `src/assets` is emitted as **AVIF** with a **WebP** fallback
  and the original format last, via `<picture>`.
- Every image is emitted at widths `480, 768, 1024, 1440, 1920`, wired to
  `srcset` with a correct `sizes` attribute per usage. A card image in a
  4-column grid must not download the 1920 variant.
- Budgets, enforced: the mascot lands **under 120 KB** at 1× (it has alpha —
  AVIF handles it); no photographic asset exceeds **90 KB** at its 1440
  variant. If a file cannot meet budget without visible degradation, reduce
  its display size rather than shipping it over budget.
- Every `<img>` carries explicit `width`/`height` (or `aspect-ratio`) so
  nothing reflows. CLS budget for this pass is **0.02**.
- Below-fold images stay `loading="lazy"`; the hero mascot and the first
  above-fold image per route are `loading="eager"` with `fetchPriority="high"`.
  Nothing else gets high priority.
- Build a single `<Picture>` component in `src/components/lb/` that takes the
  imported asset and a `sizes` string and emits the whole `<picture>` block.
  Every image on the site goes through it. The existing `mono` utility and
  `--img-brightness` must survive — monochrome treatment is applied to the
  `<img>` inside.

### 1.2 — Fonts

Sora and Switzer are currently fetched from `fonts.googleapis.com` and
`api.fontshare.com` — two extra DNS lookups, two TLS handshakes, and two
render-blocking stylesheets on the critical path, before a single glyph draws.

- Self-host both. Subset to `latin` + the punctuation actually used (the site
  uses `—`, `·`, `→`, `✱`, `↓`, `₹`, `©`, curly quotes — verify against the
  real corpus, do not guess).
- `woff2` only. Total font payload **under 90 KB**.
- Ship only the weights in use: audit first — the ladder needs Sora 700/800
  and Switzer 400/500/600/700. Drop anything unused.
- `font-display: swap`, and `<link rel="preload">` for the two faces that
  render above the fold (Sora 800 for the hero wordmark, Switzer 500 for the
  stations). No more than two preloads.
- Add `size-adjust`/`ascent-override` metrics to the `@font-face` blocks so
  the fallback and the real face occupy the same box. The hero runs a
  measure-and-fit routine against `document.fonts.ready`; a metric-mismatched
  fallback makes it visibly jump.

### 1.3 — Bundle

- `src/components/ui/` is shadcn scaffolding. Audit which components are
  actually imported (`sidebar.tsx` alone is 23 KB). **Delete every unused
  file.** Do not keep them "in case" — they are in git history.
- Route-split: the landing page must not ship the shop's or the player's
  JavaScript. Verify with a bundle visualiser.
- Budget, enforced in CI later but measured now: **initial route JS under
  180 KB gzipped**, total transfer for `/` under **500 KB**.

### 1.4 — Deliverable

`PERF.md` at the repo root: a before/after table of every asset, the font
payload, the bundle size, and Lighthouse scores (mobile, throttled) for `/`
before and after this job. Numbers, not adjectives.

---

## JOB 2 — ROUTE ARCHITECTURE AND SHARED PAGE FURNITURE

Six pages are coming. Build the shared frame once, properly, before building
any of them — otherwise you will build it six times, differently.

### 2.1 — The page shell

A `PageShell` component providing what every inner route needs and the landing
page does not:

- **A page header band.** Full-bleed, sits under the fixed 88px navbar, with:
  the drafting index and name (reusing the `MarginNotes` vocabulary), an `H1`
  on the type ladder (`clamp(38px, 3.6vw, 56px)` — the inner pages do not get
  the hero's wall treatment), a one-line standfirst in `--mute`, and the
  boundary rule with crosshairs closing it. 160px top padding (it follows the
  navbar, which is a chapter change), 120px bottom.
- **A breadcrumb**, rendered as a drafting annotation, not a UI chrome
  breadcrumb: `LMN·BNDT / ROOMS / LIVE ROOM` at 10–11px, `0.16em`, `--mute`.
  It is `<nav aria-label="Breadcrumb">` with a real ordered list underneath.
- **A skip link** — first focusable element in the DOM, visually hidden until
  focused, then a hard acid block at the top left. The site has never had one.
- **A prev/next chapter footer** above the global footer: two half-width
  panels, the previous and next route in the house's order, each with its
  index, name, and a hover slide. This is what makes a multi-page site feel
  like one building rather than six documents.

### 2.2 — Route transitions

The preloader currently runs on first load only, which is correct. Do not run
it on navigation. Instead:

- A route change plays a **wipe**: the acid rule sweeps left→right across the
  viewport at 2px height over 420ms `--ease-in-out-quart`, the outgoing page
  fades to `opacity: 0` over 180ms, the incoming page's header band rises
  `y: 24px → 0` over 520ms `--ease-out-expo`.
- Scroll resets to top on navigation — via Lenis `scrollTo(0, { immediate: true })`,
  not `window.scrollTo`, or it will fight the smooth scroller.
- `ScrollTrigger.refresh()` after the incoming route commits and after its
  images settle. Every pinned mechanic on the destination page depends on this.
- Under `prefers-reduced-motion`: no wipe, no fade, instant.
- The transition must not trap focus or lose it. After navigation, focus moves
  to the new page's `H1` (which takes `tabindex="-1"`), and the route change is
  announced via a polite live region.

### 2.3 — Metadata per route

Every route gets real `head()` output: unique `title`, `description`,
canonical URL, `og:title`/`og:description`/`og:image`, and `twitter:card`.
No route inherits the landing page's copy. Centralise the shape so a missing
field is a type error, not a silent omission.

---

## JOB 3 — `/rooms` — THE BOOKING ROOM

The most commercially important page on the site. Someone lands here to decide
whether to give you money for a night.

**Structure, top to bottom:**

1. **Header band** — "Four rooms, one building", standfirst on rates and what
   is included.
2. **The comparison rail.** All four rooms as a single horizontally-scrolling
   table on desktop, stacked cards on mobile: rate, capacity, engineer
   included, gear highlights, best-for. Every numeral `tabular-nums`. The
   table's outer edges sit on the drafting rules. This is the page's
   information spine — build it before the atmosphere.
3. **Room detail, one per room.** Each is a full chapter: a large plate
   photograph, the gear list as a two-column drafting table, three detail
   crops, and a rate card. Alternate the offset per room so no two consecutive
   chapters share a layout shape (audit rule 4.5).
4. **The signature mechanic — the floor plan.** One inline SVG plan of the
   building, four rooms as clickable regions. Hovering a region raises it and
   lights its label in acid; clicking scrolls to that room's chapter. As you
   scroll through the chapters, the corresponding region lights in sync
   (ScrollTrigger, one trigger per chapter, no scrub). On mobile and reduced
   motion it degrades to a static plan with the four rooms as a labelled list
   beneath. The SVG is hand-authored, on the grid, stroke-only, 1px, no fills
   except acid on the active region.
5. **Availability + booking CTA.** See Job 8 for the form contract; this page
   deep-links into it with the room preselected.
6. **FAQ subset** — the three booking questions from `src/data/faq.ts`, not a
   duplicate of the landing page's set.

**Constraints.** The floor plan is the only new mechanic; do not add a second.
Room photography is monochrome via `mono`, as everywhere else. The rate is the
one place acid may appear as type — through `--accent-type`, so it dims on the
bone pole.

---

## JOB 4 — `/label` — THE ROSTER AND THE PLAYER

**Structure:**

1. **Header band** — the 70/30 split, monthly payouts, artist-first.
2. **The roster.** Every artist on `src/data/releases.ts`, as a drafting
   index: number, name, genre, year, release count. Hovering a row reveals the
   artist's plate photograph pinned to the right column (reuse the Rooms
   sticky-visual pattern — that is consistency, not repetition).
3. **The signature mechanic — the player.** A real audio player, not a
   decoration:
   - Waveform rendered from actual audio via Web Audio `AnalyserNode`, drawn
     to canvas at `devicePixelRatio`, in `--line` with the played portion in
     `--accent-type`. The Bento section already fakes a 48-bar waveform; this
     replaces it with the real thing and the fake one is deleted.
   - Transport: play/pause, scrub, track list, current time and duration in
     `tabular-nums`. Keyboard operable: space toggles, arrows scrub 5s, home
     and end jump.
   - It **persists across route changes** — playing a track and navigating to
     `/shop` does not stop the music. This means the audio element lives above
     the router, in a context provider, with a docked mini-transport that
     appears in the bottom rule once a track is playing.
   - Respects `prefers-reduced-motion` by not animating the waveform sweep,
     and never autoplays.
4. **Demo submission** — deep-link to the contact form with subject preset.
5. **Splits, plainly stated.** A three-column drafting table: what the label
   takes, what the artist keeps, when it pays. No marketing language.

---

## JOB 5 — `/shop` — THE DROP

**Structure:**

1. **Header band** — printed in Kolkata, small runs, no restocks.
2. **Product grid.** Two columns at 1440, one at 768. Each card: plate
   photograph, name, price (`tabular-nums`, `₹`), sizes as chips, and a stock
   state. Sold-out products stay visible with the plate at 40% and a hard
   `SOLD OUT` acid tag — scarcity is the brand.
3. **Product detail.** A route per product (`/shop/$slug`): image plate with
   crop thumbnails, size selector, quantity, add to bag, care and print
   details as a drafting table, and a "printed in" provenance line.
4. **The bag.** A slide-over from the right, 480px, full-height, on the
   drafting grid. Line items, quantities, subtotal, and a checkout CTA. It is
   a `<dialog>` or a properly-trapped role="dialog", it locks scroll through
   the **existing ref-counted `lockScroll()`** in `src/lib/smooth.ts` — do not
   introduce a second locking mechanism — and Escape closes it.
5. **Bag state** persists to `localStorage` and survives reload. Guard the
   read in a `try/catch` and hydrate after mount, exactly as
   `src/lib/theme.ts` does, or you will reintroduce a hydration mismatch.

**Do not build checkout.** Stop at the bag with a disabled "Checkout" and a
note. Payments are a Pass 6 decision with real consequences; this pass builds
the vitrine.

---

## JOB 6 — `/crew` — THE MARKETPLACE

**Structure:**

1. **Header band** — vetted directors, engineers, artists, photographers.
2. **Filter rail.** Discipline, availability, rate band. Filters are real URL
   search params (TanStack Router `validateSearch`), so a filtered view is
   linkable and survives reload. The filter UI is chips on the established
   padding; the active chip is an acid surface with `--accent-text`.
3. **Crew grid.** Portrait plate, name, discipline, day rate, three sample
   credits. Empty state is designed, not a bare "no results" — a drafting note
   with the mascot at low opacity and a clear reset action.
4. **Crew detail** (`/crew/$slug`): portfolio plates, credits table, rate
   card, and a hire CTA that deep-links to the contact form with the crew
   member preselected.
5. **No new scroll mechanic here.** This page's job is density and
   findability. Restraint is the design.

---

## JOB 7 — `/journal` — INDEX AND ARTICLE

1. **Index.** Full post list from `src/data/journal.ts`, as an editorial
   index: date, category, read time, title, and a plate on hover. Category
   filter via URL params, same mechanism as `/crew`.
2. **Article template** (`/journal/$slug`) — the page that proves the type
   ladder holds under real prose:
   - Measure capped at **68ch**. Body 18px/1.6 (the lead exception to the 1.5
     rule; prose needs the leading). H2 within articles at 28–32px, H3 at 22px.
   - A reading-progress rule: 2px acid, pinned to the top of the viewport
     under the navbar, scaling `scaleX` 0→1 with scroll. Transform only.
   - Pull quotes as full-bleed acid panels with `--accent-text`.
   - Figures with captions in `--mute` at 12px, on the grid.
   - Code and lists styled to the ladder — articles will contain them.
   - A sticky contents rail in the left column on desktop, tracking the
     current heading via ScrollTrigger.
3. **Author block, share row, prev/next article.**

---

## JOB 8 — `/contact` — THE FORM

The only page where the site asks the user to do work. It gets the most care.

1. **Header band**, address, phone, hours, and a Kolkata map plate — a static
   monochrome map image, on the grid, not an embedded third-party map iframe
   (it would break the aesthetic, the theme, and the performance budget).
2. **The form.** One column, 640px, generous.
   - Intent selector first — _Book a room / Submit a demo / Hire the crew /
     Something else_ — as four large radio panels, because it changes which
     fields follow.
   - Conditional fields per intent (room + date + duration; track links; brief
     - budget; free text).
   - Validation is **on blur, then on change once touched** — never on every
     keystroke from empty. Errors are stated in words beneath the field, in
     `--accent-type` on the primary pole, and the field's border goes to
     `--accent-type`. Never colour alone: every error also carries an icon and
     text.
   - `aria-invalid`, `aria-describedby` wired to the error node. The submit
     button is never disabled — disabled buttons hide the reason. On invalid
     submit, focus moves to the first error and a live region announces the
     count.
   - Success is a state change on the page, not a redirect: the form is
     replaced by a confirmation panel with what happens next and a
     reference number.
   - Honeypot + timing check for spam. No CAPTCHA — it would violate the
     aesthetic and the accessibility standard.
3. **Wire `JoinList`** on the landing page to the same submission contract. It
   currently calls `setDone(true)` and discards the email, which means the
   site has been silently dropping signups.

---

## JOB 9 — CONTENT AND DATA INTEGRITY

Everything above consumes `src/data/*`. That data is currently placeholder
prose with `// REPLACE` markers in it.

- Type every data module with a Zod schema and parse at module load, so a
  malformed record fails at build rather than rendering `undefined` into the
  page.
- Every image referenced by data must resolve — add a build-time check.
- Every route that takes a `$slug` must handle an unknown slug with the
  designed 404, not a crash.
- Redesign the 404 and the error boundary. They are currently generic
  centred-card shadcn with `rounded-md` and `bg-primary` — off-brand, off-grid,
  and in violation of the 4px radius rule. The 404 gets the drafting
  treatment: a large `404`, the mascot, and three real routes out.

---

## DEFINITION OF DONE

1. Job 0's screenshots exist and anything they exposed is fixed and recorded.
2. No image over budget; mascot under 120 KB; fonts self-hosted under 90 KB
   total; unused shadcn deleted; `PERF.md` shows before/after with real
   Lighthouse numbers.
3. All six routes are real pages on the drafting grid, in both themes, at
   1440/1280/1024/768/390, with no horizontal overflow and no off-scale
   spacing (re-run the pass-4 audit scripts — they are the standard).
4. Shared furniture is shared: one `PageShell`, one `Picture`, one scroll
   lock, one bag store, one audio context. No mechanic implemented twice.
5. Route transitions play, reset scroll through Lenis, refresh ScrollTrigger,
   and move focus to the new `H1`.
6. The player survives navigation. The bag survives reload. The filters
   survive being linked.
7. Contact and JoinList both submit through one contract and both have
   designed success and error states.
8. Zero contrast failures in both themes across all six routes — re-run the
   pass-4 sweep per route, not just on `/`.
9. `bun x tsc --noEmit` clean, `bun run lint` at zero errors.
10. Every page has been **looked at**, in both themes, and the screenshots are
    in the PR.
