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
 * Deliberately NOT here: the hero. It is the page's masthead, it is
 * always first, and an interface that lets someone put it third is an
 * interface that lets someone break the front page by accident.
 */

export type HomeSectionKey =
  | "featured"
  | "proof"
  | "rooms"
  | "film"
  | "estimator"
  | "numbers"
  | "roster"
  | "drops"
  | "testimonials"
  | "faq"
  | "join"
  | "cta";

export const HOME_SECTIONS: { key: HomeSectionKey; label: string }[] = [
  { key: "featured", label: "Featured — the three cards" },
  { key: "proof", label: "Studio facts and partners" },
  { key: "rooms", label: "The rooms" },
  { key: "film", label: "The film (opens as you scroll)" },
  { key: "estimator", label: "What it costs" },
  { key: "numbers", label: "Headline numbers" },
  { key: "roster", label: "The roster" },
  { key: "drops", label: "From the shop" },
  { key: "testimonials", label: "The roster talks" },
  { key: "faq", label: "Questions" },
  { key: "join", label: "Join the list" },
  { key: "cta", label: "Closing call to action" },
];

/** The order the page ships in, and what a fresh database is seeded with. */
export const DEFAULT_HOME_ORDER: { section: HomeSectionKey; on: boolean }[] = HOME_SECTIONS.map(
  (s) => ({ section: s.key, on: true }),
);
