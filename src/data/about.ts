/**
 * The About page's content floor.
 *
 * Like every other seed in this directory, these values are what the site
 * renders before anyone has edited anything, and what a restored database
 * falls back to. Everything here is editable in the admin under **About**.
 *
 * REPLACE — the founder quote and the team are written to prove the layout.
 * The shape is right; the people are not necessarily.
 */

export type Founder = {
  /** Set at display scale. It is a quote — write it as something said. */
  quote: string;
  /** Two short paragraphs behind the quote. Supporting, not a biography. */
  body: string[];
  name: string;
  role: string;
  /** The sign-off figure, e.g. a rating or a count. Optional. */
  statValue: string;
  statLabel: string;
  image: string;
  alt: string;
};

export const founder: Founder = {
  quote:
    "I started Limon Bandit because the good rooms in this city were always booked by people who weren't making anything.",
  body: [
    "The idea was straightforward: keep the room open late, keep the rates readable, and let the artist walk out owning the record.",
    "Everything else — the label, the merch, the crew — grew out of that one room, because the people using it kept needing the next thing.",
  ],
  name: "Arko Dasgupta",
  role: "Founder & head engineer",
  statValue: "4.9",
  statLabel: "230+ sessions",
  image: "founder",
  alt: "Arko Dasgupta in the Limon Bandit control room",
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  /** One line. What they actually do here, not a job description. */
  note: string;
  /** Shown as a tabular figure beside the name — years, records, whatever. */
  since: string;
};

/**
 * The house, not the freelance roster.
 *
 * Deliberately separate from `crew.ts`: the crew are hired per project and
 * set their own rates, and conflating them with the people who run the
 * building would misrepresent both. The crew page sells availability; this
 * one says who answers the phone.
 */
export const team: TeamMember[] = [
  {
    id: "t01",
    name: "Arko Dasgupta",
    role: "Founder & head engineer",
    note: "Tracks and mixes most of what leaves the building.",
    since: "2021",
  },
  {
    id: "t02",
    name: "Saptarshi Chowdhury",
    role: "Label & releases",
    note: "Signs the roster, runs the pressings, chases the splits.",
    since: "2022",
  },
  {
    id: "t03",
    name: "Meher Jaswal",
    role: "Studio manager",
    note: "Owns the calendar. The reason a session starts on time.",
    since: "2023",
  },
  {
    id: "t04",
    name: "Dev Prakash",
    role: "Merch & fulfilment",
    note: "Prints the runs, packs the orders, keeps the counts honest.",
    since: "2024",
  },
];
