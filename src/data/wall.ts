import type { ImageKey } from "@/generated/images";

export type WallShot = { src: ImageKey; alt: string; caption: string; span?: boolean };

export const wall: WallShot[] = [
  { src: "wall-01", alt: "Band tracking live in Room A at night", caption: "Room A / 02:14" },
  {
    src: "wall-02",
    alt: "Screen printing a Limon Bandit tee in a Kolkata workshop",
    caption: "Print floor / run 03",
  },
  { src: "wall-03", alt: "Vocalist recording in the booth", caption: "Booth / take 19" },
  {
    src: "wall-04",
    alt: "Kolkata street at night with tram wires and neon",
    caption: "Outside / 23:40",
    span: true,
  },
  {
    src: "wall-05",
    alt: "Crowd with hands raised at a small gig",
    caption: "Launch night / Terminus",
  },
  { src: "journal-01", alt: "Close-up of studio outboard gear", caption: "Rack B / 1176" },
  {
    src: "journal-02",
    alt: "Patch cables and mixing desk detail",
    caption: "Patchbay / normalled",
  },
  { src: "journal-03", alt: "Tape machine detail", caption: "Tape / 15ips" },
];
