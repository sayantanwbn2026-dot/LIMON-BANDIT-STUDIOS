import type { ImageKey } from "@/generated/images";

/** Position on the floor plan, in the plan's own 400x300 coordinate space.
 *  `null` means the room *is* the building — the Lockout takes the lot. */
export type PlanRect = { x: number; y: number; w: number; h: number } | null;

export type Room = {
  id: string;
  index: string;
  name: string;
  kind: string;
  image: ImageKey;
  /** three detail crops shown alongside the plate */
  crops: ImageKey[];
  blurb: string;
  specs: { k: string; v: string }[];
  rate: string;
  /** comparison rail */
  capacity: string;
  engineer: boolean;
  bestFor: string;
  plan: PlanRect;
};

export const rooms: Room[] = [
  {
    id: "room-a",
    index: "01",
    name: "Room A",
    kind: "Live tracking",
    image: "room-a",
    crops: ["wall-01", "wall-04", "journal-01"],
    blurb:
      "The loud one. Twenty-two feet of untreated brick down one wall so drums keep their tail. Full backline lives here permanently.",
    specs: [
      { k: "Area", v: "480 sq ft" },
      { k: "Console", v: "API 1608 · 16ch" },
      { k: "Backline", v: "Kit, cabs, upright" },
      { k: "Capacity", v: "Six players" },
    ],
    rate: "₹2,400 / hr",
    capacity: "6 players",
    engineer: true,
    bestFor: "Drums, full band takes, anything that needs air",
    plan: { x: 24, y: 24, w: 192, h: 170 },
  },
  {
    id: "room-b",
    index: "02",
    name: "Room B",
    kind: "Mix + overdub",
    image: "room-b",
    crops: ["wall-02", "journal-02", "wall-05"],
    blurb:
      "Dry, tight, and honest. Where records get finished at 4am. Tuned to fail loudly if the mix does not translate.",
    specs: [
      { k: "Area", v: "180 sq ft" },
      { k: "Monitors", v: "Focal Trio + NS10" },
      { k: "Outboard", v: "1176 · LA-2A · Pultec" },
      { k: "Capacity", v: "Three people" },
    ],
    rate: "₹1,800 / hr",
    capacity: "3 people",
    engineer: true,
    bestFor: "Mixing, overdubs, decisions you cannot unhear",
    plan: { x: 232, y: 24, w: 144, h: 104 },
  },
  {
    id: "booth",
    index: "03",
    name: "The Booth",
    kind: "Vocals",
    image: "room-booth",
    crops: ["wall-03", "journal-03", "wall-01"],
    blurb:
      "One chain, no menu. U87 into a Neve pre into tape emulation. Sightline into Room B so nobody shouts through glass.",
    specs: [
      { k: "Area", v: "42 sq ft" },
      { k: "Chain", v: "U87 · 1073 · LA-2A" },
      { k: "Headphones", v: "Four cue mixes" },
      { k: "Capacity", v: "One + engineer" },
    ],
    rate: "₹1,200 / hr",
    capacity: "1 + engineer",
    engineer: true,
    bestFor: "Lead vocals, doubles, voice-over",
    plan: { x: 232, y: 148, w: 76, h: 46 },
  },
  {
    id: "lockout",
    index: "04",
    name: "The Lockout",
    kind: "Overnight",
    image: "room-lockout",
    crops: ["split-corridor", "wall-05", "wall-02"],
    blurb:
      "Doors close at 22:00 and the building is yours until sunrise. Engineer included, clock switched off, kitchen open.",
    specs: [
      { k: "Window", v: "22:00 → 06:00" },
      { k: "Rooms", v: "A + B + Booth" },
      { k: "Crew", v: "Engineer + runner" },
      { k: "Capacity", v: "Whole house" },
    ],
    rate: "₹14,000 / night",
    capacity: "Whole house",
    engineer: true,
    bestFor: "Albums, deadlines, bands who work after midnight",
    plan: null,
  },
];
