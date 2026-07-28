import r1 from "@/assets/release-01.jpg";
import r2 from "@/assets/release-02.jpg";
import r3 from "@/assets/release-03.jpg";
import r4 from "@/assets/release-04.jpg";
import r5 from "@/assets/release-05.jpg";
import r6 from "@/assets/release-06.jpg";
import tee from "@/assets/merch-tee.jpg";

export type Drop = {
  id: string;
  index: string;
  title: string;
  artist: string;
  format: string;
  date: string;
  status: "Out now" | "Pre-order" | "Sold out";
  image: string;
};

export const drops: Drop[] = [
  {
    id: "d1",
    index: "01",
    title: "Rusted Gold",
    artist: "Nabeel & The Meter",
    format: '12" + digital',
    date: "Mar 2026",
    status: "Out now",
    image: r1,
  },
  {
    id: "d2",
    index: "02",
    title: "Terminus",
    artist: "Kobra Blue",
    format: "Digital single",
    date: "Feb 2026",
    status: "Out now",
    image: r2,
  },
  {
    id: "d3",
    index: "03",
    title: "Salt Line",
    artist: "Ira Sen",
    format: "Cassette · 100",
    date: "Jan 2026",
    status: "Sold out",
    image: r3,
  },
  {
    id: "d4",
    index: "04",
    title: "Nightcall Radio",
    artist: "House Compilation",
    format: "2LP",
    date: "Dec 2025",
    status: "Out now",
    image: r4,
  },
  {
    id: "d5",
    index: "05",
    title: "Grain / Static",
    artist: "Fourth Room",
    format: "EP",
    date: "Nov 2025",
    status: "Out now",
    image: r5,
  },
  {
    id: "d6",
    index: "06",
    title: "Second Language",
    artist: "Meher",
    format: '12" clear',
    date: "Oct 2026",
    status: "Pre-order",
    image: r6,
  },
  {
    id: "d7",
    index: "07",
    title: "Bandit Tee — Run 04",
    artist: "House Merch",
    format: "Screen print · 150",
    date: "Sep 2026",
    status: "Pre-order",
    image: tee,
  },
];
