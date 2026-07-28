import roomA from "@/assets/room-a.jpg";
import roomB from "@/assets/room-b.jpg";
import booth from "@/assets/room-booth.jpg";
import lockout from "@/assets/room-lockout.jpg";

export type Room = {
  id: string;
  index: string;
  name: string;
  kind: string;
  image: string;
  blurb: string;
  specs: { k: string; v: string }[];
  rate: string;
};

export const rooms: Room[] = [
  {
    id: "room-a",
    index: "01",
    name: "Room A",
    kind: "Live tracking",
    image: roomA,
    blurb:
      "The loud one. Twenty-two feet of untreated brick down one wall so drums keep their tail. Full backline lives here permanently.",
    specs: [
      { k: "Area", v: "480 sq ft" },
      { k: "Console", v: "API 1608 · 16ch" },
      { k: "Backline", v: "Kit, cabs, upright" },
      { k: "Capacity", v: "Six players" },
    ],
    rate: "₹2,400 / hr",
  },
  {
    id: "room-b",
    index: "02",
    name: "Room B",
    kind: "Mix + overdub",
    image: roomB,
    blurb:
      "Dry, tight, and honest. Where records get finished at 4am. Tuned to fail loudly if the mix does not translate.",
    specs: [
      { k: "Area", v: "180 sq ft" },
      { k: "Monitors", v: "Focal Trio + NS10" },
      { k: "Outboard", v: "1176 · LA-2A · Pultec" },
      { k: "Capacity", v: "Three people" },
    ],
    rate: "₹1,800 / hr",
  },
  {
    id: "booth",
    index: "03",
    name: "The Booth",
    kind: "Vocals",
    image: booth,
    blurb:
      "One chain, no menu. U87 into a Neve pre into tape emulation. Sightline into Room B so nobody shouts through glass.",
    specs: [
      { k: "Area", v: "42 sq ft" },
      { k: "Chain", v: "U87 · 1073 · LA-2A" },
      { k: "Headphones", v: "Four cue mixes" },
      { k: "Capacity", v: "One + engineer" },
    ],
    rate: "₹1,200 / hr",
  },
  {
    id: "lockout",
    index: "04",
    name: "The Lockout",
    kind: "Overnight",
    image: lockout,
    blurb:
      "Doors close at 22:00 and the building is yours until sunrise. Engineer included, clock switched off, kitchen open.",
    specs: [
      { k: "Window", v: "22:00 → 06:00" },
      { k: "Rooms", v: "A + B + Booth" },
      { k: "Crew", v: "Engineer + runner" },
      { k: "Capacity", v: "Whole house" },
    ],
    rate: "₹14,000 / night",
  },
];
