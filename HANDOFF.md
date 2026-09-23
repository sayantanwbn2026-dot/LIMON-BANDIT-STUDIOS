# Limon Bandit — handoff

Read this first, then `AUDIT.md` (design constitution) and `PERF.md`
(measured performance). `PASS-5.md` and `PASS-6.md` are the outstanding briefs.

## Deploying

The build targets **Cloudflare Workers** (`cloudflare-module`, via the Lovable
preset). Verified before launch on 2026-09-19 against a production build:
every route 200 (unknown slugs 404), security headers on every response,
first-load JS 165 KB gz (budget 180), no secrets in the client bundle or git
history, anonymous database access refused for every private table.

Set these in the host's environment / secrets — they are **not** in the repo:

| Variable                        | Needed for                              | Notes                                        |
| ------------------------------- | --------------------------------------- | -------------------------------------------- |
| `VITE_SUPABASE_URL`             | everything                              | also compiled into the build; public         |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | everything                              | also compiled into the build; public         |
| `SHEETS_WEBHOOK_URL`            | order + enquiry notifications           | Slack, Discord or Apps Script URL            |
| `SHEETS_WEBHOOK_SECRET`         | the Apps Script option only             |                                              |
| `SUPABASE_SERVICE_ROLE_KEY`     | stamping "notified" on enquiries/orders | optional; **never** give it a `VITE_` prefix |

The admin-inbox policies are already applied to `limon-bandit-shop`
(`vwuuwommxvqtgzlsndip`, ap-south-1) — see `supabase/migrations/`. Still to do:
set Brand & contact → _Live website address_ to the real domain
(canonical links, sitemap and share cards are built from it), and add that
domain to Supabase → Authentication → URL configuration.

## Where things are

- **Repo:** `G:\Active Projects\limonbanditstudios-main\limonbanditstudios-main`
  (note the doubled folder name — the workspace root is the parent).
- **Stack:** TanStack Start + React 19 + Vite 8 + GSAP/ScrollTrigger + Lenis,
  behind the vendored `@lovable.dev/vite-tanstack-config` preset.
- **Dev server:** `bun run dev` → **port 8081** (8080 is taken by another
  project). Pinned in `../.claude/launch.json`.
- **Git:** repo was initialised during pass 4; `3a31f2d` is the pass-3 baseline.

## Commits so far

| Hash      | What                                                       |
| --------- | ---------------------------------------------------------- |
| `3a31f2d` | Baseline (pass 3, as received)                             |
| `b714903` | Pass 4 Job 1 — semantic two-pole theme system + light mode |
| `ef3fbbd` | Pass 4 Job 2 — nav cleanup, menu fits 100svh               |
| `cef78f8` | Pass 4 Job 3 — hero v4 scrubbed scene                      |
| `6e284e3` | Pass 4 Job 4 — spacing/grid/type audit → `AUDIT.md`        |
| `d10544a` | Pass 5 + Pass 6 briefs                                     |
| `4e66bb4` | Pass 5 Job 1a — image pipeline, dependency cull            |
| `0f438c4` | Pass 5 Job 1b — self-hosted subset fonts                   |
| `cedcece` | Pass 5 Job 2 — PageShell, route transitions, skip link     |
| `654c1da` | Pass 5 Job 3 — `/rooms`                                    |
| `05f8918` | Global grid gutter (content insets from the rules)         |
| `c9f25c2` | Pass 5 Job 4 — `/label` + persistent audio player          |

## Pass 5 status

| Job                              | State                       |
| -------------------------------- | --------------------------- |
| 0 — Look at it (visual review)   | **NOT DONE** — see below    |
| 1a — Images + deps               | done                        |
| 1b — Fonts                       | done                        |
| 2 — Shell, transitions, SEO      | done                        |
| 3 — `/rooms`                     | done                        |
| 4 — `/label` + player            | done                        |
| 5 — `/shop`                      | done — full shop, see below |
| 6 — `/crew`                      | done in `478c4a7`           |
| 7 — `/journal`                   | done in `478c4a7`           |
| 8 — `/contact`                   | done in `478c4a7`           |
| 9 — Data integrity, 404 redesign | not started                 |

All seven chapters now have real bodies. The "not started" rows above are
stale — `/crew`, `/journal` and `/contact` were built in `478c4a7` and render
their own sections (`CrewDirectory`/`CrewHiring`, `JournalIndex`/
`JournalTopics`, `ContactForm`/`ContactVisit`). What is still outstanding on
them is content, not code: see the REPLACE markers in `src/data/`.

## The shop

`/shop` is now a working store: catalogue with category and price filters,
cart, wishlist, accounts, checkout, and orders pushed to a Google Sheet for
logistics. **Setup is in [`scripts/SHEET-SETUP.md`](scripts/SHEET-SETUP.md)** —
read that before touching any of it.

- **Accounts are real.** Supabase project `limon-bandit-shop` (`ap-south-1`,
  free tier). Four tables, RLS on all of them, denying by default.
- **Money is integer rupees everywhere** — catalogue, cart, `*_inr` columns.
  Formatted once, on screen, by `inr()` in `lib/money.ts`. Never a string,
  never a float; a cart has to add them up.
- **Order totals are computed on the server, not the browser.** `submitOrder`
  in `lib/orders.ts` re-prices every line against `data/shop.ts` and
  re-validates the discount code. This is load-bearing: payment is collected
  on delivery from the figure in the sheet, so a browser-supplied total is a
  shopper-supplied total. Verified — a tampered basket claiming ₹120 for
  twenty jackets filed at ₹25,320.
- **The gate is one mechanism.** `useAuth().requireAuth(reason, action)` runs
  the action if signed in, or opens the login popup and runs it _after_ the
  session arrives. Nobody presses Add twice. The pending action survives only
  because `AuthProvider` sits above the router in `__root` — do not move it,
  for the same reason the audio element cannot move.
- **`.env` is gitignored now** and `.env.example` is the committed template.
  The two `VITE_*` values are browser-safe; `SUPABASE_SERVICE_ROLE_KEY` must
  never gain a `VITE_` prefix.
- **Payment is a seam, not a gap.** Every order is `cod` / `pending`, and
  `payment_ref` plus the `paid`/`failed`/`refunded` states already exist. A
  gateway slots between the insert and the sheet push — see PAYMENT-LATER in
  the setup doc.
- **The card has two densities, and the phone one is the constraint.** One
  column with a square photo made each card ~630px tall, so twenty products
  was an ~11,000px scroll; it is two columns and 3,268px now. Everything the
  compact card drops — blurb, run, size chips — is in `ProductSheet`, a
  bottom sheet on a phone and a centred quick-view from `sm` up. The rule
  that keeps it honest: **a product with a size run never adds from the
  card on a phone**, the button opens the sheet where the sizes are 48px
  targets. Only a thing with nothing to choose adds in one tap.
- **Gating from inside a dialog must close it first.** `requireAuth` opens
  the login popup, so calling it from the product sheet stacked two
  `aria-modal` dialogs that fought over the Tab trap. `ProductSheet.gated()`
  steps out of the way; the pending action still completes on sign-in, so the
  size and quantity chosen before the interruption survive it.

Two things still need a person:

1. `SHEETS_WEBHOOK_URL` / `SHEETS_WEBHOOK_SECRET` are empty, so orders save to
   Postgres but do not reach the sheet. The confirmation screen says so
   honestly rather than pretending. Step 2 of the setup doc fixes it.
2. Leaked-password protection is off (Supabase default). Dashboard →
   Authentication → Password settings.

## The CMS

`/admin` edits every piece of content on the site. Password-protected at
`/admin/login`, Supabase-backed. **Read [`scripts/CMS-GUIDE.md`](scripts/CMS-GUIDE.md)**
before touching it — it covers both the editor's side and the developer's.

- **One JSONB document per key**, described by a TypeScript schema in
  `src/cms/collections.ts`. The admin renders its forms from that schema, so
  adding an editable field is one line there — no migration, no form
  component, no query. Twenty-odd sections stay identical instead of drifting
  into twenty hand-built forms.
- **`src/cms/seeds.ts` is the floor, not a loading state.** It is the
  committed content in CMS shape, used both as the seed and as the fallback
  every `useDoc` returns when a row is missing or the database is
  unreachable. With an empty database the site renders exactly as it did
  before the CMS existed. Keep it in step when you add a collection.
- **Images can be a manifest key or a URL.** `<CmsImage>` handles both:
  untouched sections keep `<Picture>` and its build-time AVIF/WebP variants,
  replaced ones become a single uploaded file. Every image field declares the
  resolution it wants and warns — without blocking — when what was supplied
  does not match.
- **`submitOrder` prices from the CMS**, not `src/data/shop.ts`. The moment
  an editor changes a price the two would disagree, and that function is the
  authority on what an order costs. Shipping and discount codes too.
- **The route guard is not the security boundary.** RLS is. `cms_documents`,
  `cms_media` and `admins` refuse writes unless `is_admin()` is true for the
  caller's JWT — verified: a signed-in shopper changed 0 rows on content, 0
  on prices, could not grant themselves access, and could read neither the
  admin list, the traffic log nor the audit trail.
- **Analytics are first-party** — a per-tab id in `sessionStorage`, no cookie,
  no third party. `/admin` is excluded so staff do not inflate the figures.

The one admin seeded is `sayantanmukherjee2505@gmail.com` (owner). That grants
permission to an address; the account still has to be registered on the site.

## Architecture you need to know before editing

- **Two token poles, not two themes.** A section declares which pole it sits
  on (`--surface/--text/--line` vs `--alt-*`); flipping `data-theme` inverts
  both. Components branch on their **pole**, never on the theme. In light mode
  FAQ and Journal are the two dark chapters — that inversion is the design.
- **Two boxes, not one.** `.shell-rules` is where the drafting grid is
  _drawn_; `.shell` is where content _lives_, inset by `--grid-gutter` (16px,
  12px under 768px). Type must never touch a drawn rule. `.section-head`
  cancels the gutter with a negative margin so its four columns still land on
  the rules exactly, then re-applies it inside each cell.
- **A drawn rule must end on another rule.** The stat grids (`LabelSplits`,
  `ShopPrint`, `CrewHiring`, `JournalTopics`, `Bento`) drop each cell's bottom
  border at `lg` to avoid doubling it, which left their `lg:border-l`
  dividers running down into open space and stopping in mid-air — it reads as
  a rendering fault, not a decision. All five now carry `lg:border-b` on the
  container so the box closes. If you add another grid of this shape, close
  it. The two intentional exceptions are decorative and animated, not
  structure: `data-leaf` (the ThreeWaysIn door seam) and `data-gutter-tick`.
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
   silently means 280 _pixels_. Use a function returning px.
5. Verification scripts used repeatedly (contrast sweep, spacing audit) are in
   the scratchpad, not the repo — rewrite or re-derive as needed.

## Outstanding problems

- **Job 0 has never been done.** Nobody has visually reviewed this site. The
  one screenshot the user provided found a real defect (type sitting on the
  grid rules) in seconds that four automated audits had missed. Do this before
  building more pages.
- **JS budget missed four passes running and now badly over:** the main client
  chunk measures **248 KB gzipped** against a 180 KB budget (329 KB across all
  chunks; `/shop` pulls roughly 285 KB of that). It was 206.2 KB before the
  shop. GSAP and the player were already on the critical path; `supabase-js`
  added the rest, and it drags in `realtime-js` and `storage-js` which this
  site never uses.

  The cheapest real fix is to make `getSupabase()` in `lib/supabase.ts` do a
  dynamic `import()` and return a promise. Every call site is already inside
  an `async` function or a `useEffect`, so the change is mechanical — it was
  left undone deliberately rather than refactored unverified at the end of a
  large change. That moves Supabase off the first-paint path; it will still
  load on every page, because `AuthProvider` checks the session on mount.

- **Done since this list was written:** `Faq` uses the shared `Accordion`;
  `JoinList` writes to `offer_signups`; the 404 and error screens are the
  house design (no `rounded-md`).
- **CMS now server-renders** (`src/cms/live.ts`, see CMS-GUIDE → "How content
  reaches the page"). Journal posts, legal pages, chapter headings, crew
  counts, label tracks, discount codes and the Room A film all read the CMS.
- **Admin inbox** (`/admin/orders`, `/admin/enquiries`, `/admin/subscribers`)
  needs `supabase/migrations/20260918_admin_inbox.sql` run once in the SQL
  editor. The Supabase MCP in this environment can no longer see project
  `vwuuwommxvqtgzlsndip`, so it has not been applied from here.
- **Legal pages** (`/legal/terms`, `/legal/privacy`, `/legal/shipping-returns`)
  ship as drafts written from the code — returns window, delivery times and
  grievance contact are placeholders for the owner to confirm.
- Placeholder audio is synthesised, not music. Replace `public/audio/*.wav`
  with real masters under the same filenames and delete `scripts/audio.mjs`.

## Suggested next step

Job 0 (look at the six pages at 1440/768/390 in both themes), then Pass 5
Job 5 (`/shop`) — but address the JS budget first if any more pages are
planned.
