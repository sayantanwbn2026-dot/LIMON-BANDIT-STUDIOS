# LIMON BANDIT — PASS 6 (CLAUDE CODE)

## Make it real: backend, discoverability, certification, and launch

## 0. CONTEXT

Pass 5 opened the six doors. Every page exists, on the grid, in both themes,
within budget. What it does not yet have is a back end that receives anything,
a search engine that understands it, a certificate that it is usable by
everyone, or a way to know when it breaks.

This is the pass that separates a portfolio piece from a business asset.

Standing rules from passes 1–5 remain binding. Read `AUDIT.md` and `PERF.md`
first — they hold the standards this pass is measured against.

**Do not start Pass 6 until Pass 5's definition of done is fully met.** Every
job here assumes six real pages.

---

## JOB 1 — THE BACK END

Pass 5 built forms that validate and then hand their payload to nothing.

### 1.1 — Decide the platform, once, and write it down

TanStack Start has server functions and this project already has `src/server.ts`
and a Nitro dependency. Options are: server functions against a hosted Postgres
(Supabase/Neon), or a thin API on the same origin. **Do not add a second
runtime.** Write the decision and its reasoning into `ARCHITECTURE.md` before
writing code — including what happens to this project if the vendor
disappears.

### 1.2 — Submissions

- One `submissions` table, discriminated by intent (`booking`, `demo`,
  `hire`, `general`, `newsletter`), with the intent-specific payload as
  validated JSON. One table, because these are all "someone asked us
  something" and five tables would be five sets of admin.
- **Server-side validation with the same Zod schemas as the client.** Share
  them; never trust the client copy. A schema that lives in two places drifts.
- Rate limit by IP and by email: 5 submissions per hour. Return 429 with a
  designed message, not a stack trace.
- Honeypot and timing checks are server-side. The client-side ones from Pass 5
  are a courtesy, not a control.
- Every submission returns a short human reference (`LB-7F3K`) that the
  confirmation panel displays and the notification email quotes.

### 1.3 — Notification and confirmation

- Transactional email on submit: one to the studio, one to the submitter.
  Plain-text-first, HTML second, both on brand and both legible without images.
- Sending failure must **not** lose the submission — write to the database
  first, enqueue the mail second, and make the mail retryable.
- Newsletter signups go to a real list. If that is a third party, the API key
  lives in server-side env only and never reaches the client bundle. Add a
  build-time check that fails if any `SECRET`/`KEY`/`TOKEN` env var is
  referenced from client code.

### 1.4 — Booking availability

- A `room_availability` table and a server function returning free slots for a
  room and date range.
- The `/rooms` booking form reads real availability; unavailable dates are
  disabled in the picker **and** rejected server-side. Client-side disabling
  is UX; the server check is the actual rule.
- Double-booking is prevented by a unique constraint, not by application
  logic. Two people can submit in the same millisecond.

### 1.5 — Admin

A minimal authenticated view of submissions and availability. Not a design
exercise — a table, filters, and the ability to mark a slot booked. Auth is
whatever the platform gives you; do not hand-roll session management.

---

## JOB 2 — DISCOVERABILITY

The site is currently invisible to search beyond a title tag.

### 2.1 — Structured data (JSON-LD)

- `MusicVenue` (or `LocalBusiness` with the right subtype) on `/`: name,
  address from `src/data/site.ts`, geo (`22.5726 N / 88.3639 E` — already in
  the hero), phone, opening hours, price range, `sameAs` for Instagram.
- `Service` per room on `/rooms`, with `offers` carrying the real rates.
- `MusicGroup` per roster artist and `MusicAlbum` per release on `/label`.
- `Product` with `offers` and `availability` per shop item — this is what
  produces rich results with price and stock.
- `Article` on every journal post: headline, author, `datePublished`,
  `dateModified`, image.
- `FAQPage` on the FAQ block — it already exists as real Q&A markup.
- `BreadcrumbList` matching the Pass 5 breadcrumb.

Validate every type against the Rich Results Test. Structured data that does
not validate is worse than none — it is a trust penalty.

### 2.2 — Crawl and index

- `sitemap[.]xml.ts` already exists. Extend it to enumerate every route
  including dynamic `$slug` routes, with `lastmod` from real content dates.
- `robots.txt` with the sitemap reference. Confirm nothing important is
  disallowed.
- Canonical URL on every page. Dynamic routes canonicalise to themselves, not
  the index.
- No route returns 200 for a missing slug. Unknown slugs return a real **404
  status**, not a 200 with 404-looking content — search engines index the
  latter.

### 2.3 — Social

- Per-route OG images, generated at build from the route's title and index in
  the site's own type — not screenshots, not a single generic image. 1200×630.
- `og:type` correct per route (`website`, `article`, `product`).
- Verify with the Facebook and Twitter/X card validators and put the results
  in the PR.

---

## JOB 3 — ACCESSIBILITY CERTIFICATION

Target: **WCAG 2.2 Level AA**, verified, on all six routes plus the landing
page. The site has had contrast verified and a skip link added; nothing else
has been certified.

### 3.1 — Automated

- `axe-core` run against every route in both themes, in CI, as a **failing
  gate**. Zero violations at `serious` or `critical`.
- The pass-4 contrast sweep re-run per route, both themes. Zero failures. It
  is already written; wire it into CI rather than rewriting it.

### 3.2 — Manual, which is the part that matters

Automation catches perhaps 30% of real barriers. Do all of these and record
the results:

- **Keyboard only, whole site, no mouse.** Every interactive element
  reachable, in a sensible order, with a visible focus ring at 3:1 against its
  background. Nothing reachable that shouldn't be — verify the closed menu and
  the closed bag are both `inert`.
- **Focus management** on every state change: menu, bag, route change, form
  errors, accordion, modal. Focus never lands on `<body>`.
- **Screen reader pass** (NVDA or VoiceOver) over each route. The drafting
  annotations, margin notes, crosshairs, tickers and the mascot are decorative
  and must be silent. The proof band and marquee must not be read as content.
- **Reduced motion**: with the OS preference set, load every page and scroll
  it end to end. No pin, no scrub, no marquee, no decode effect, no reveal
  offsets left stranded. The site must be *complete* without motion, not
  merely still.
- **400% zoom** at 1280 width, per WCAG 1.4.10 reflow: no horizontal scroll,
  no clipped content, no overlapped text.
- **Touch targets** 24×24 minimum (2.5.8). Audit the crosshairs, chips, filter
  pills and the theme toggle glyph.
- **Forms** (3.3.1–3.3.4, and 2.2's 3.3.7 redundant entry): labels are real
  `<label>` elements, errors are announced, and nothing asks twice for
  information already given.

### 3.3 — Deliverable

`ACCESSIBILITY.md`: the conformance claim, the tools and assistive tech used,
what was tested, every known issue with severity, and anything deliberately
out of scope with justification. A conformance claim without a method
statement is marketing.

---

## JOB 4 — PERFORMANCE, ENFORCED

Pass 5 measured performance once. Measurement that is not enforced regresses
within three commits.

- **Lighthouse CI** in the pipeline, on every route, mobile profile,
  throttled. Failing thresholds: Performance 90, Accessibility 100, Best
  Practices 95, SEO 100.
- **Field-realistic Core Web Vitals budgets**, failing the build:
  LCP ≤ 2.0s, CLS ≤ 0.02, INP ≤ 200ms, TBT ≤ 200ms.
- **Bundle budgets** from Pass 5 asserted in CI: initial route JS ≤ 180 KB
  gzipped; no route's total transfer above 500 KB. Fail on regression, with
  the offending module named.
- A **long-task audit** during the hero scrub and the `/rooms` floor plan. Any
  task over 50ms during a scroll gets fixed or the mechanic gets simplified.
- Verify GSAP tickers, ScrollTriggers, ResizeObservers and the audio context
  are all torn down on route change. Navigate between all six routes twenty
  times and confirm the ScrollTrigger count and listener count return to
  baseline. Leaks here are silent until the site has been open for an hour.

---

## JOB 5 — TESTS

The project has no tests. At this size that is now the main risk to every
future change.

- **Unit** (Vitest): the theme resolver, the ref-counted scroll lock, the Zod
  schemas, price and date formatting, the bag reducer. These are pure and
  cheap and they are where correctness bugs hide.
- **Component** (Testing Library): the contact form's full validation matrix,
  the bag, the filters, the accordion, the theme toggle's `aria-label` flip.
  Assert on accessible roles and names, not on class names.
- **E2E** (Playwright), the flows that make money: book a room end to end;
  add to bag, reload, bag survives; submit a demo; filter crew and share the
  URL; play a track and navigate without it stopping.
- **Visual regression** on the six routes in both themes at three widths.
  This is the only automated defence against the class of bug that DOM
  measurement cannot see — which, per `AUDIT.md`, is exactly how this project
  has been verified until now.
- **Reduced-motion and keyboard-only** E2E variants of the two critical flows.
- CI runs everything on every PR. A red pipeline blocks merge.

---

## JOB 6 — OBSERVABILITY, PRIVACY, SECURITY

- **Analytics** that does not require a cookie banner — Plausible, Fathom, or
  self-hosted. A consent banner would be the single most off-brand element on
  the site, and the correct way to avoid one is to not collect personal data.
- **Real-user monitoring** of Core Web Vitals, so the Job 4 budgets are
  validated against actual visitors rather than a lab.
- **Error tracking** with source maps uploaded and not publicly served. The
  existing `src/lib/lovable-error-reporting.ts` should either be wired to this
  or removed — right now it is a reporting path to nowhere.
- **Security headers**: HSTS, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`, and a **Content-Security-Policy**. Note that CSP will
  interact with GSAP and any inline script — including the theme init script
  in `__root.tsx`, which is inline by design and will need a nonce or hash.
  Do not solve that by deleting the script; it is what prevents the
  theme flash.
- **Privacy policy and terms** as real routes. The footer already links to
  `/contact` for both, which is a placeholder pointing at the wrong page.
- Dependency audit; Dependabot or equivalent enabled.

---

## JOB 7 — LAUNCH

- Custom domain, TLS, redirects (`www` → apex or the reverse, pick one and
  enforce it), and a 301 map if any URL has ever been published elsewhere.
- Uptime monitoring on `/` and on the submission endpoint.
- Database backups, verified by performing an actual restore. An untested
  backup is not a backup.
- A staging environment on the same stack as production.
- `RUNBOOK.md`: how to deploy, how to roll back, what to do when submissions
  stop arriving, who owns the domain and the mail sender, and where the
  secrets live.
- Final pre-launch pass: every link resolves, every form submits, every image
  loads, both themes, six routes, three widths, real devices — at minimum one
  physical iOS and one physical Android handset. Emulators do not reproduce
  iOS Safari's `svh` behaviour, which this site depends on for both the menu
  and the hero.

---

## DEFINITION OF DONE

1. Every form on the site writes to a database, sends mail, survives a mail
   failure, and returns a reference the user can quote.
2. Booking availability is real and double-booking is prevented by a
   constraint.
3. Structured data validates for every type; sitemap covers every route;
   unknown slugs return a genuine 404 status.
4. Per-route OG images generate at build and both card validators pass.
5. `axe-core` and the contrast sweep run in CI at zero violations across six
   routes and both themes; `ACCESSIBILITY.md` states the conformance claim and
   the method.
6. Keyboard-only, screen-reader, reduced-motion, 400%-zoom and touch-target
   passes are all done manually and recorded.
7. Lighthouse CI and bundle budgets gate the pipeline; navigating the site
   twenty times leaks no ScrollTriggers, tickers or listeners.
8. Unit, component, E2E and visual-regression suites all run on every PR and
   block merge when red.
9. Analytics collects no personal data and needs no banner; errors report
   somewhere a human will see them; CSP is enforced and the theme script still
   runs before first paint with no flash.
10. Backups have been restored at least once, the runbook exists, and the site
    has been opened on real iOS and Android hardware.

---

## A NOTE ON SEQUENCING

Pass 5 and Pass 6 are not interchangeable and should not be merged. Pass 5 is
additive and reversible — it builds pages. Pass 6 introduces a database,
outbound email, a security policy and a CI gate: each of those is a commitment
that is expensive to unwind.

If time forces a choice, **Pass 5 Jobs 0, 1 and 8** (look at it, fix the
1.4 MB hero image, and make the forms actually submit) deliver more value than
anything else in either document. A fast site with three real pages and a
working contact form beats a slow site with nine pages that quietly discards
every enquiry — which, today, is what this site does.
