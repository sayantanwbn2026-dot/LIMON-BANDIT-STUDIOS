import w1 from "@/assets/wall-01.jpg";
import w2 from "@/assets/wall-02.jpg";
import w3 from "@/assets/wall-03.jpg";
import w4 from "@/assets/wall-04.jpg";
import w5 from "@/assets/wall-05.jpg";
import j1 from "@/assets/journal-01.jpg";
import j2 from "@/assets/journal-02.jpg";
import j3 from "@/assets/journal-03.jpg";

export type WallShot = { src: string; alt: string; caption: string; span?: boolean };

export const wall: WallShot[] = [
  { src: w1, alt: "Band tracking live in Room A at night", caption: "Room A / 02:14" },
  { src: w2, alt: "Screen printing a Limon Bandit tee in a Kolkata workshop", caption: "Print floor / run 03" },
  { src: w3, alt: "Vocalist recording in the booth", caption: "Booth / take 19" },
  { src: w4, alt: "Kolkata street at night with tram wires and neon", caption: "Outside / 23:40", span: true },
  { src: w5, alt: "Crowd with hands raised at a small gig", caption: "Launch night / Terminus" },
  { src: j1, alt: "Close-up of studio outboard gear", caption: "Rack B / 1176" },
  { src: j2, alt: "Patch cables and mixing desk detail", caption: "Patchbay / normalled" },
  { src: j3, alt: "Tape machine detail", caption: "Tape / 15ips" },
];
