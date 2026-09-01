import type { ImageKey } from "@/generated/images";
export type Drop = {
  id: string;
  index: string;
  title: string;
  artist: string;
  format: string;
  date: string;
  status: "Out now" | "Pre-order" | "Sold out";
  image: ImageKey;
  /** shelf price. Sold-out runs keep theirs — the shop states what it was. */
  price: string;
  /** how many were made. Nothing is repressed, so this is the whole run. */
  run: string;
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
    image: "release-01",
    price: "₹1,800",
    run: "300 pressed",
  },
  {
    id: "d2",
    index: "02",
    title: "Terminus",
    artist: "Kobra Blue",
    format: "Digital single",
    date: "Feb 2026",
    status: "Out now",
    image: "release-02",
    price: "₹180",
    run: "Digital",
  },
  {
    id: "d3",
    index: "03",
    title: "Salt Line",
    artist: "Ira Sen",
    format: "Cassette · 100",
    date: "Jan 2026",
    status: "Sold out",
    image: "release-03",
    price: "₹900",
    run: "100 dubbed",
  },
  {
    id: "d4",
    index: "04",
    title: "Nightcall Radio",
    artist: "House Compilation",
    format: "2LP",
    date: "Dec 2025",
    status: "Out now",
    image: "release-04",
    price: "₹2,600",
    run: "500 pressed",
  },
  {
    id: "d5",
    index: "05",
    title: "Grain / Static",
    artist: "Fourth Room",
    format: "EP",
    date: "Nov 2025",
    status: "Out now",
    image: "release-05",
    price: "₹450",
    run: "Digital + 50 CD",
  },
  {
    id: "d6",
    index: "06",
    title: "Second Language",
    artist: "Meher",
    format: '12" clear',
    date: "Oct 2026",
    status: "Pre-order",
    image: "release-06",
    price: "₹2,200",
    run: "250 pressed",
  },
  {
    id: "d7",
    index: "07",
    title: "Bandit Tee — Run 04",
    artist: "House Merch",
    format: "Screen print · 150",
    date: "Sep 2026",
    status: "Pre-order",
    image: "merch-tee",
    price: "₹1,400",
    run: "150 printed",
  },
];
