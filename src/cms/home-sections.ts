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

export const HOME_SECTIONS: { key: HomeSectionKey; label: string; on: boolean }[] = [
  { key: "featured", label: "Featured — the three cards", on: true },
  { key: "proof", label: "Studio facts and partners", on: true },
  { key: "services", label: "What we run — the four operations", on: false },
  { key: "bento", label: "What's inside — track, tee, room", on: false },
  { key: "rooms", label: "The rooms", on: true },
  { key: "film", label: "The film (opens as you scroll)", on: true },
  { key: "estimator", label: "What it costs", on: true },
  { key: "numbers", label: "Headline numbers", on: true },
  { key: "roster", label: "The roster", on: true },
  { key: "drops", label: "From the shop", on: true },
  { key: "wall", label: "The wall — photographs", on: false },
  { key: "process", label: "How a session runs", on: false },
  { key: "testimonials", label: "The roster talks", on: true },
  { key: "journal", label: "From the journal", on: false },
  { key: "faq", label: "Questions", on: true },
  { key: "join", label: "Join the list", on: true },
  { key: "cta", label: "Closing call to action", on: true },
];

/** The order the page ships in, and what a fresh database is seeded with. */
export const DEFAULT_HOME_ORDER: { section: HomeSectionKey; on: boolean }[] = HOME_SECTIONS.map(
  (s) => ({ section: s.key, on: s.on }),
);
