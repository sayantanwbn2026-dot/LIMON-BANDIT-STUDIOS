/**
 * The house, in order.
 *
 * One record per page. This is the single source for the drafting index, the
 * breadcrumb, the prev/next chapter footer and every page's <head> — so a
 * route cannot drift out of step with its own metadata, and adding a page
 * without its copy is a type error rather than a silent inheritance of the
 * landing page's title.
 */
export type ChapterKey = "home" | "rooms" | "label" | "shop" | "crew" | "journal" | "contact";

export type Chapter = {
  /** drafting index, e.g. "02" */
  index: string;
  key: ChapterKey;
  to: string;
  /** short drafting name — breadcrumb and margin notes */
  name: string;
  /** page H1 */
  heading: string;
  /** one line under the H1, in --mute */
  standfirst: string;
  title: string;
  description: string;
};

export const chapters: Chapter[] = [
  {
    index: "01",
    key: "home",
    to: "/",
    name: "House",
    heading: "Limon Bandit",
    standfirst: "Four rooms, one label, and a merch line. Run out of one building in Kolkata.",
    title: "Limon Bandit — Kolkata Music House, Studio Rooms & Label",
    description:
      "Four recording rooms, an independent label, a Kolkata-printed merch line, and a crew of vetted directors and engineers. Book a night, sign a record, print a run.",
  },
  {
    index: "02",
    key: "rooms",
    to: "/rooms",
    name: "Rooms",
    heading: "Four rooms, one building",
    standfirst:
      "Live room, vocal booth, and overnight lockouts. Engineer included, rates on the wall, masters go home with you.",
    title: "The Rooms — Studio Hire in Kolkata | Limon Bandit",
    description:
      "Live room, vocal booth, and overnight lockout sessions in Kolkata. Engineer included, no clock-watching after midnight, and you keep the masters.",
  },
  {
    index: "03",
    key: "label",
    to: "/label",
    name: "Label",
    heading: "The label",
    standfirst:
      "Seventy-thirty, paid monthly, artist first. We sign records we would play ourselves.",
    title: "The Label — Independent Records from Kolkata | Limon Bandit",
    description:
      "An independent label with a roster streaming direct. Splits 70/30, paid monthly, artist first.",
  },
  {
    index: "04",
    key: "shop",
    to: "/shop",
    name: "Shop",
    heading: "The drop",
    standfirst:
      "Tees, outerwear, caps and vinyl. Small runs printed in Kolkata and sold direct. No restocks.",
    title: "The Drop — Merch Printed in Kolkata | Limon Bandit",
    description:
      "Tees, outerwear, caps and vinyl. Small runs printed locally and sold direct. No restocks.",
  },
  {
    index: "05",
    key: "crew",
    to: "/crew",
    name: "Crew",
    heading: "The crew",
    standfirst:
      "Directors, engineers, cover artists and photographers. Vetted, rated, and hired by the project.",
    title: "The Crew — Directors, Engineers & Artists for Hire | Limon Bandit",
    description:
      "A marketplace of vetted directors, engineers, cover artists and photographers, hired by the project.",
  },
  {
    index: "06",
    key: "journal",
    to: "/journal",
    name: "Journal",
    heading: "Notes from the room",
    standfirst:
      "Gear, label splits, recording in this city, and how a print run actually gets made.",
    title: "Journal — Notes from the Limon Bandit Room",
    description:
      "Writing on gear, label splits, recording in Kolkata, and how a print run actually gets made.",
  },
  {
    index: "07",
    key: "contact",
    to: "/contact",
    name: "Contact",
    heading: "Start something",
    standfirst: "Book a room, submit a demo, hire the crew. One form, and a person reads it.",
    title: "Contact — Book a Room or Submit a Demo | Limon Bandit",
    description:
      "Book a recording room, submit a demo to the label, or hire the crew. Hatibagan, Kolkata.",
  },
];

const byKey = new Map(chapters.map((c) => [c.key, c]));

export function chapter(key: ChapterKey): Chapter {
  const c = byKey.get(key);
  if (!c) throw new Error(`unknown chapter: ${key}`);
  return c;
}

/** The house loops: past the last door you are back at the front. */
export function neighbours(key: ChapterKey): { prev: Chapter; next: Chapter } {
  const i = chapters.findIndex((c) => c.key === key);
  const n = chapters.length;
  return {
    prev: chapters[(i - 1 + n) % n],
    next: chapters[(i + 1) % n],
  };
}
