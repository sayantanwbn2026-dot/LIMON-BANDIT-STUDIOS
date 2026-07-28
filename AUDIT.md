# Limon Bandit — Pass 4 Audit

Spacing, alignment, hierarchy and typography, audited section by section at
1440 / 1280 / 1024 / 768 / 390, in both themes.

## Method

Checks were run against the live DOM rather than by eye, because the visible
drafting grid makes sub-pixel error public and eyeballing does not catch a
10px column drift. Three scripted passes:

- **Spacing** — every `p/m/gap/space` utility parsed out of source and
  measured against the scale.
- **Contrast** — every text node walked, its effective background resolved by
  climbing the ancestor chain, ratio computed against the WCAG AA threshold
  for its own size and weight (3:1 for large, 4.5:1 otherwise), with
  `aria-hidden` subtrees excluded as decorative.
- **Alignment** — column rules derived from the shell, then H2 and card-grid
  edges compared against them. Measured via `offsetLeft` rather than
  `getBoundingClientRect`, because reveal transforms on not-yet-scrolled
  elements otherwise read as false misalignment.

---

## 4.1 — Spacing scale

Scale: `8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 120, 160`.

**29 off-scale values found → 27 fixed, 2 accepted.**

| Section | Issue | Fix | Commit |
| --- | --- | --- | --- |
| Bento, Founder, Process, Rates, Roster, Services, ThreeWaysIn | Section vertical `140px` — off scale | `120px` | Job 4 |
| Faq | Section vertical `140px`, and this is the dark→light chapter change | `pt-160 pb-120` | Job 4 |
| Journal | `120px` both sides, but the light chapter ends here | `pt-120 pb-160` | Job 4 |
| JoinList | `110px / 140px` — off scale, and it is a slim band | `80px / 96px` | Job 4 |
| DropRail, IdentityMarquee, Numbers | Slim-band vertical `100px` | `96px` | Job 4 |
| StubPage | `200px` | `160px` | Job 4 |
| DropRail, Faq, Rates, Wall | `mt-14` (56px) | `mt-12` (48px) | Job 4 |
| Buttons, FinalCta | `pl-7` / `mr-7` (28px) | `pl-6` / `mr-6` (24px) | Job 4 |
| Footer | `py-7` (28px) | `py-6` (24px) | Job 4 |
| Faq | `pl-[52px]` answer indent | `pl-[48px]` | Job 4 |
| Hero | `pb-[14px]` micro-line | `pb-[12px]` | Job 4 |
| Services | chip `px-[14px]` | `px-3` | Job 4 |
| Testimonials | card `p-9` (36px) | `p-8` (32px) | Job 4 |

**Accepted exceptions (2):**

- `Bento gap-[3px]` — the 48-bar waveform, whose bars are themselves 3px.
  This is a graphic, not layout spacing; snapping it to 8px destroys the
  figure.
- `Nav mb-[1px]` — optical baseline nudge on the logotype's acid square.
  Sub-scale optical alignment, not spacing.

---

## 4.2 — Grid alignment

**Systemic finding: every section H2 sat 10px right of its column rule.**

The section header rows used `grid-cols-4` with `gap-10`. A gap can never
align to the drafting rules: with `N` equal columns and gutter `g`, inner
boundary `i` lands at `i·(W+g)/N`, drifting `i·g/N` from the rule at `i·W/N`.
At four columns and a 40px gap that is exactly 10px per column — so H2s at
column 2 rendered at x=386 against a rule at x=376, and it was visible
because the rules are drawn.

Fixed by adding `.section-head`: columns run edge to edge (`column-gap: 0`)
and the gutter moves inside the cell as `padding-right`, with the last cell
unpadded so its content still reaches the outer rule. Migrated 11 section
header rows (Bento, Faq, Footer, Founder, Journal, Process, Rates, Roster,
Services, Testimonials, ThreeWaysIn).

| Check | Before | After |
| --- | --- | --- |
| H2 offset from column rule | +10.0px (10 sections) | **0.0px** (10 sections) |
| Top-level card grids on outer rules | — | **11/11 within tolerance** |

Eyebrows were verified as correctly notched at column 1; the earlier reading
of +22px was the measurement catching the label text rather than the eyebrow
block, which starts on the rule.

---

## 4.3 — Typography hierarchy

| Section | Issue | Fix | Commit |
| --- | --- | --- | --- |
| ThreeWaysIn | Door titles: display type at 24–32px with **default tracking** | `tracking-[-0.02em]` | Job 4 |
| JoinList, Rooms | Body copy at `line-height 1.65`, over the 1.6 ceiling | `1.5` | Job 4 |
| Founder | Section had no `<h2>` | `sr-only` h2 | Job 4 |
| ProofBand | Section had no `<h2>` | `sr-only` h2 | Job 4 |

Verified clean: exactly one `<h1>` (the hero lockup); no lowercase display
type; no paragraph over four lines at 1440; all 33 numeric elements
(rates, metrics, clock, indices, counters) carry `tabular-nums`.

`IdentityMarquee` is exempt from the one-H2 rule — it is `aria-hidden`
decoration, so a heading inside it would never be announced.

Headings reported at weight 400 by the raw sweep are wrapper elements whose
styled children carry the type (`<h1>`, the FAQ `<h3>` buttons, and Numbers'
`sr-only` h2). The rendered type is correct; no change made.

---

## 4.4 — Component consistency

- **Button heights** — audited: `54` (hero), `56` (stub), `60` (Buttons),
  `62` (FinalCta). All within the sanctioned `{54, 56, 60, 62}`. No change.
- **Button labels** — all four already `12–13px / 700 / uppercase / 0.14em`
  with the arrow on the right. No change.
- **Chips** — three different paddings existed (`px-3 py-2`, `px-[14px]
  py-2`, `px-2 py-1`). Unified to `px-3 py-2`, radius `2px`.
- **Hairlines** — no literal greys survive the Job 1 migration; re-grepped
  clean. All borders resolve through `--line` / `--alt-line`.
- **Formatting** — `prettier` had been failing repo-wide. `bun run lint`
  went from **244 errors to 0** (8 pre-existing `react-refresh` warnings
  remain, which are advisory and not style).

---

## 4.5 — Rhythm and flow

- **Pins** — three, non-overlapping: hero `0 → 3420`, Three Ways In
  `5462 → 6362`, Drop Rail `14569 → 16714`. Each releases before the next
  begins.
- **Horizontal overflow** — no laid-out element escapes the viewport at any
  breakpoint. `documentElement.scrollWidth` exceeds `clientWidth` by 30px,
  but every contributor is an `opacity: 0` element still holding its
  pre-reveal `translateX`, clipped by the page-level `overflow-x` guard.
  Not a layout defect.
- **Chapter inversion** — confirmed in light mode that the only dark
  sections are FAQ and Journal. The editorial rhythm inverts rather than
  flattening, which was the point of the pole system.

---

## Deviations from the brief

Two values in the brief do not survive measurement, and DoD #6 (AA in both
themes) is the stronger constraint, so the measured values won.

| Brief | Measured | Used instead |
| --- | --- | --- |
| "`--mute` on `--surface` remains AA in both modes (the values above do)" | `#8D8D8D` on bone = **2.93:1** — fails AA at 14px | Bone-pole mute `#6B6B68` = **4.73:1** |
| "substitute `--accent-dim`" for acid type on light surfaces | `#B8C900` on bone = **1.63:1** — fails even the 3:1 large-text floor, while carrying real numerals | Acid-as-type `#5F6B00` = **5.17:1**, still zero-blue and green-dominant |

`--accent-dim` is retained in the token set for decorative marks. Acid as a
*surface* is untouched at `#E9FF00` in both themes, per the brief.

Two further contrast defects were pre-existing and are now fixed: form
placeholders failed in both themes (`2.30:1` dark, `1.85:1` light), and
`doors.ts` door 01 paired an alt-pole surface with `--accent-text`, which
rendered black-on-black once the theme flipped.

**Final sweep: 0 contrast failures in dark, 0 in light.**

---

## Note on tooling

Eleven section files were briefly corrupted mid-audit by editing them with
PowerShell 5.1, whose `Get-Content` reads as ANSI and re-encoded every em
dash, middle dot, rupee, copyright and arrow as mojibake, plus added a BOM.
Repaired and verified: the diff against the previous commit now contains no
non-ASCII lines at all, i.e. every special character is byte-identical to
before. Source edits in this repo should go through Node or an editor tool,
never PowerShell redirection.
