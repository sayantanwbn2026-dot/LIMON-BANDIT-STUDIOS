/**
 * The crew marketplace.
 *
 * One record per person. The Crew hero derives its role counts from this
 * list rather than carrying its own numbers, so the page cannot advertise a
 * roster it does not have.
 */
export type Discipline = "Director" | "Engineer" | "Cover artist" | "Photographer";

export type CrewMember = {
  id: string;
  name: string;
  discipline: Discipline;
  /** one line on what they are actually good at */
  focus: string;
  /** things they have shot, cut, mixed or drawn */
  credits: string[];
  /** day rate, or the closest honest equivalent */
  rate: string;
  status: "Open" | "Limited" | "Booked";
};

/** Display order on the page — also the order the hero lists roles in. */
export const disciplines: Discipline[] = ["Director", "Engineer", "Cover artist", "Photographer"];

/** Short descriptor per discipline, used by the hero's call sheet. */
export const disciplineNote: Record<Discipline, string> = {
  Director: "Video, live, documentary",
  Engineer: "Tracking, mix, master",
  "Cover artist": "Sleeve, type, layout",
  Photographer: "Press, live, product",
};

// REPLACE — crew roster
export const crew: CrewMember[] = [
  {
    id: "c01",
    name: "Ishaan Roy",
    discipline: "Director",
    focus: "One-take live sessions shot on a single body, no crew call.",
    credits: ["Rana & The Strays — Rusted Gold", "Tram No. 12 — Terminus"],
    rate: "₹18,000 / day",
    status: "Open",
  },
  {
    id: "c02",
    name: "Devika Mitra",
    discipline: "Director",
    focus: "Narrative music video. Writes the treatment before she quotes.",
    credits: ["Kaalo — Basement Tapes Vol. 2"],
    rate: "₹26,000 / day",
    status: "Limited",
  },
  {
    id: "c03",
    name: "Farhan Qureshi",
    discipline: "Director",
    focus: "Documentary and tour footage. Travels light, cuts fast.",
    credits: ["Nightcall Radio — house compilation film"],
    rate: "₹15,000 / day",
    status: "Open",
  },
  {
    id: "c04",
    name: "Ritu Banerjee",
    discipline: "Director",
    focus: "Performance capture with four cameras and a live mix.",
    credits: ["Park Circus Edits — club film"],
    rate: "₹22,000 / day",
    status: "Booked",
  },
  {
    id: "c05",
    name: "Arko Dasgupta",
    discipline: "Engineer",
    focus: "Tracking drums and full-band takes in Room A.",
    credits: ["House engineer since 2021", "180+ releases"],
    rate: "Included with the room",
    status: "Open",
  },
  {
    id: "c06",
    name: "Nusrat Alam",
    discipline: "Engineer",
    focus: "Mix. Works in Room B, delivers stems and a fold-down.",
    credits: ["Misfit Mohan — Late Fee", "Neel Dust — Sodium Light"],
    rate: "₹12,000 / track",
    status: "Limited",
  },
  {
    id: "c07",
    name: "Sanjay Pillai",
    discipline: "Engineer",
    focus: "Mastering for vinyl and streaming from one pass.",
    credits: ["Terminus", "Rusted Gold"],
    rate: "₹4,500 / track",
    status: "Open",
  },
  {
    id: "c08",
    name: "Lea Fernandes",
    discipline: "Engineer",
    focus: "Vocal chains and comping. Lives in the Booth.",
    credits: ["Basement Tapes Vol. 2"],
    rate: "₹9,000 / day",
    status: "Open",
  },
  {
    id: "c09",
    name: "Tanmay Ghosh",
    discipline: "Engineer",
    focus: "Live sound and multitrack capture off the desk.",
    credits: ["Tram FM sessions"],
    rate: "₹8,000 / show",
    status: "Booked",
  },
  {
    id: "c10",
    name: "Prerna Saikia",
    discipline: "Cover artist",
    focus: "Hand-set type and collage. Builds for print first.",
    credits: ["Sodium Light", "Salt Line"],
    rate: "₹20,000 / sleeve",
    status: "Open",
  },
  {
    id: "c11",
    name: "Osman Haq",
    discipline: "Cover artist",
    focus: "Illustration and sleeve systems across a catalogue.",
    credits: ["Nightcall Radio 2LP"],
    rate: "₹24,000 / sleeve",
    status: "Limited",
  },
  {
    id: "c12",
    name: "Mira Sengupta",
    discipline: "Photographer",
    focus: "Press portraits in available light. No strobes, no fuss.",
    credits: ["Roster portraits 2024–2026"],
    rate: "₹14,000 / day",
    status: "Open",
  },
  {
    id: "c13",
    name: "Joy Barman",
    discipline: "Photographer",
    focus: "Live and crowd work in rooms that are too dark for it.",
    credits: ["Park Circus nights"],
    rate: "₹10,000 / show",
    status: "Open",
  },
  {
    id: "c14",
    name: "Aleya Rahman",
    discipline: "Photographer",
    focus: "Product and merch shot flat, lit hard, no retouch.",
    credits: ["Bandit Tee — Run 04"],
    rate: "₹11,000 / day",
    status: "Booked",
  },
];

export const crewByDiscipline = (d: Discipline) => crew.filter((c) => c.discipline === d);

/** Count per discipline, in display order — the hero's call sheet. */
export const crewCounts = () =>
  disciplines.map((d) => ({
    discipline: d,
    note: disciplineNote[d],
    count: String(crewByDiscipline(d).length).padStart(2, "0"),
  }));
