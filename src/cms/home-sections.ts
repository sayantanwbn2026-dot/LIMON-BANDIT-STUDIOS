/**
 * Every section the home page can show, and what an editor calls it.
 *
 * ONE list, read by three things: the CMS collection that offers the
 * choices, the seed that ships the default order, and the route that
 * renders it. Keeping them apart is how an editor ends up choosing a
 * section that no longer exists, or a new section quietly never appearing
 * in the picker.
 *
 * `key` is stored in the document and must not change once shipped —
 * renaming one orphans that row in every saved order. `label` is only
 * ever shown to a person and can be rewritten freely.
 *
 * `phone` is whether it ships visible on a PHONE. A phone was being handed
 * the desktop page's whole running order down a 375px column — sixteen and a
 * half screens of it — and length on a phone is not the same cost as length
 * on a desktop: there is no peripheral vision to skim with, so every section
 * is paid for in full, one thumb-swipe at a time.
 *
 * Four of them are off below. Not because they are weak — because on a phone
 * they are the ones whose job is already done by a neighbour. The film is
 * 1.7 screens of scrolling to open a frame onto a still photograph; the
 * numbers and the testimonials both say "other people trusted this" and the
 * roster above them shows it; the closing call to action repeats the one in
 * the hero, which on a phone is four swipes away rather than a page away.
 *
 * It is a switch and not a hardcoded list so the house can disagree: this is
 * an editorial call about a specific set of sections, and the next person to
 * write a section will want to make their own.
 *
 * `on` is whether it ships switched ON. It is NOT the same as whether it
 * appears in the admin: every section here is always listed and always
 * toggleable. Five of them are off because they were cut from the page
 * for length, not deleted — the components are built, their content is
 * still edited in the CMS, and the only thing standing between them and
 * the live page is this switch.
 *
 * Deliberately NOT here: the hero. It is the page's masthead, it is
 * always first, and an interface that lets someone put it third is an
 * interface that lets someone break the front page by accident.
 */

export type HomeSectionKey =
  | "featured"
  | "proof"
  | "services"
  | "bento"
  | "rooms"
  | "film"
  | "estimator"
  | "numbers"
  | "roster"
  | "drops"
  | "wall"
  | "process"
  | "testimonials"
  | "journal"
  | "faq"
  | "join"
  | "cta";

export const HOME_SECTIONS: { key: HomeSectionKey; label: string; on: boolean; phone: boolean }[] =
  [
    { key: "featured", label: "Featured — the three cards", on: true, phone: true },
    { key: "proof", label: "Studio facts and partners", on: true, phone: true },
    { key: "services", label: "What we run — the four operations", on: false, phone: true },
    { key: "bento", label: "What's inside — track, tee, room", on: false, phone: true },
    { key: "rooms", label: "The rooms", on: true, phone: true },
    { key: "film", label: "The film (opens as you scroll)", on: true, phone: false },
    { key: "estimator", label: "What it costs", on: true, phone: true },
    { key: "numbers", label: "Headline numbers", on: true, phone: false },
    { key: "roster", label: "The roster", on: true, phone: true },
    { key: "drops", label: "From the shop", on: true, phone: true },
    { key: "wall", label: "The wall — photographs", on: false, phone: true },
    { key: "process", label: "How a session runs", on: false, phone: true },
    { key: "testimonials", label: "The roster talks", on: true, phone: false },
    { key: "journal", label: "From the journal", on: false, phone: true },
    { key: "faq", label: "Questions", on: true, phone: true },
    { key: "join", label: "Join the list", on: true, phone: true },
    { key: "cta", label: "Closing call to action", on: true, phone: false },
  ];

/** The order the page ships in, and what a fresh database is seeded with. */
export const DEFAULT_HOME_ORDER: { section: HomeSectionKey; on: boolean; phone: boolean }[] =
  HOME_SECTIONS.map((s) => ({ section: s.key, on: s.on, phone: s.phone }));
