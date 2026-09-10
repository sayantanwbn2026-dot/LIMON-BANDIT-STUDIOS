/**
 * The words above every section.
 *
 * Eyebrow, heading, and the supporting line beside or under it — the
 * three strings that open almost every block on this site. They were
 * literals in the JSX of thirty-odd components, which made the single
 * thing a client most reliably asks for ("can we reword that heading")
 * the one thing the CMS could not do.
 *
 * Two conventions carried over from the components verbatim, because the
 * point of this file is that the page renders exactly as it did:
 *
 *   - `\n` in a heading is a real line break. Several of these are set
 *     with WordReveal, which splits on newline to stagger the words, and
 *     the rest are measured in `ch`. The breaks are typographic, not
 *     incidental.
 *   - the space in "Room A" is U+00A0, a non-breaking space, and it is
 *     deliberate: the name must not wrap between the word and the letter.
 *
 * An empty string means the section genuinely has no such element, not
 * that it is missing: the closing call to action carries a rating line
 * instead of an eyebrow, and most sections have no standfirst at all.
 */

export type SectionCopy = {
  id: string;
  eyebrow: string;
  heading: string;
  standfirst: string;
};

export const homeSections: SectionCopy[] = [
  {
    id: "services",
    eyebrow: "What we run",
    heading: "Turning a room, a roster,\nand a print run\ninto one house",
    standfirst: "Four operations, one building. Each one exists because the last one needed it.",
  },
  { id: "doors", eyebrow: "Three ways in", heading: "Pick your door.", standfirst: "" },
  {
    id: "rooms",
    eyebrow: "Four rooms, one building",
    heading: "The rooms, room by room",
    standfirst: "",
  },
  {
    id: "film",
    eyebrow: "The film",
    heading: "A night in Room A",
    standfirst: "Two minutes, no commentary. Shot on a Tuesday, nobody rehearsing for the camera.",
  },
  { id: "numbers", eyebrow: "The numbers", heading: "Five years, counted", standfirst: "" },
  { id: "roster", eyebrow: "The roster", heading: "Real rooms.\nReal records.", standfirst: "" },
  {
    id: "drops",
    eyebrow: "Label output",
    heading: "Everything the house has pressed",
    standfirst: "",
  },
  {
    id: "bento",
    eyebrow: "What's inside",
    heading: "A label, a shop,\nand a crew —\non one site.",
    standfirst: "",
  },
  {
    id: "rates",
    eyebrow: "Rates",
    heading: "Simple rates,\nno surprise invoices.",
    standfirst: "",
  },
  {
    id: "testimonials",
    eyebrow: "What they say",
    heading: "The roster talks.",
    standfirst: "",
  },
  { id: "process", eyebrow: "How it runs", heading: "Four steps, start to drop.", standfirst: "" },
  { id: "wall", eyebrow: "Unedited house archive", heading: "The wall", standfirst: "" },
  {
    id: "faq",
    eyebrow: "Questions",
    heading: "The things people ask\nbefore they book.",
    standfirst: "",
  },
  { id: "journal", eyebrow: "Journal", heading: "Notes from the room.", standfirst: "" },
  {
    id: "finalcta",
    eyebrow: "",
    heading: "The room's already warm.",
    standfirst:
      "Bring the songs. We'll handle the room, the master, the print run, and the people who shoot the video.",
  },
  {
    id: "join",
    eyebrow: "One mail a month",
    heading: "Join the list",
    standfirst:
      "Drop dates, open studio nights, merch runs before they go public. No forwarding, no selling, one unsubscribe link that actually works.",
  },
];

export const roomsSections: SectionCopy[] = [
  {
    id: "rail",
    eyebrow: "Pick by the numbers",
    heading: "What each room costs and holds",
    standfirst: "",
  },
  { id: "floor", eyebrow: "The floor", heading: "Room by room", standfirst: "" },
  {
    id: "booking",
    eyebrow: "Booking",
    heading: "Hold a room",
    standfirst: "No deposit to hold. No card on file. A person reads every message.",
  },
];

export const labelSections: SectionCopy[] = [
  { id: "player", eyebrow: "Hear it", heading: "The roster, playing", standfirst: "" },
  { id: "roster", eyebrow: "Who we put out", heading: "The roster", standfirst: "" },
  {
    id: "splits",
    eyebrow: "The deal",
    heading: "Seventy thirty, stated plainly",
    standfirst:
      "One page, no schedule of exceptions. If you want a lawyer to read it, it is short enough that they will not charge you much.",
  },
];

export const shopSections: SectionCopy[] = [
  {
    id: "catalogue",
    eyebrow: "In the shop",
    heading: "Everything currently for sale",
    standfirst: "",
  },
  {
    id: "print",
    eyebrow: "The run",
    heading: "Small, local, and finished",
    standfirst:
      "Everything here is made in a quantity we can carry. That is a constraint, not a marketing position.",
  },
  {
    id: "order",
    eyebrow: "Ordering",
    heading: "How it gets to you",
    standfirst:
      "Add it to your cart and check out. You pay on delivery, and we confirm stock by hand before anything is dispatched.",
  },
];

export const crewSections: SectionCopy[] = [
  {
    id: "directory",
    eyebrow: "The list",
    heading: "Who you can hire",
    standfirst: "Rates are theirs, not ours. The house takes nothing from a crew booking.",
  },
  {
    id: "hiring",
    eyebrow: "Hiring",
    heading: "We introduce, then step out",
    standfirst:
      "A marketplace that takes a cut ends up working for itself. This one does not take one.",
  },
];

export const journalSections: SectionCopy[] = [
  {
    id: "index",
    eyebrow: "Latest",
    heading: "What we have been writing",
    standfirst: "Four entries. We write when something is worth writing down, not to a schedule.",
  },
  {
    id: "topics",
    eyebrow: "The beats",
    heading: "Four things we keep returning to",
    standfirst: "No opinion pieces and no industry commentary. Only things we did here.",
  },
];

export const contactSections: SectionCopy[] = [
  {
    id: "form",
    eyebrow: "The form",
    heading: "Tell us what you need",
    standfirst:
      "One form for every reason. It comes straight to us, and a person answers it — usually the same day.",
  },
  {
    id: "visit",
    eyebrow: "The building",
    heading: "Come and look at it",
    standfirst:
      "You are welcome to see a room before you book one. Message first so someone is in.",
  },
];
