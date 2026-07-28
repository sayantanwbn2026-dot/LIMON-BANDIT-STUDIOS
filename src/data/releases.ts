import cover1 from "@/assets/release-01.jpg";
import cover2 from "@/assets/release-02.jpg";
import cover3 from "@/assets/release-03.jpg";
import cover4 from "@/assets/release-04.jpg";
import cover5 from "@/assets/release-05.jpg";
import cover6 from "@/assets/release-06.jpg";

export type Release = {
  artist: string;
  title: string;
  genre: string;
  runtime: string;
  year: string;
  cover: string;
  alt: string;
  /** tailwind grid span classes for the asymmetric grid */
  span: string;
  height: string;
};

// REPLACE — label roster
export const releases: Release[] = [
  {
    artist: "Rana & The Strays",
    title: "Rusted Gold",
    genre: "Post-punk",
    runtime: "34 min",
    year: "2025",
    cover: cover1,
    alt: "Cover art for Rusted Gold by Rana & The Strays",
    span: "lg:col-span-2",
    height: "h-[460px]",
  },
  {
    artist: "Kaalo",
    title: "Basement Tapes Vol. 2",
    genre: "Bengali hip-hop",
    runtime: "41 min",
    year: "2025",
    cover: cover2,
    alt: "Cover art for Basement Tapes Vol. 2 by Kaalo",
    span: "lg:col-span-2",
    height: "h-[420px]",
  },
  {
    artist: "Misfit Mohan",
    title: "Late Fee",
    genre: "Lo-fi soul",
    runtime: "28 min",
    year: "2024",
    cover: cover3,
    alt: "Cover art for Late Fee by Misfit Mohan",
    span: "lg:col-span-1",
    height: "h-[560px]",
  },
  {
    artist: "Tram No. 12",
    title: "Terminus",
    genre: "Instrumental",
    runtime: "52 min",
    year: "2024",
    cover: cover4,
    alt: "Cover art for Terminus by Tram No. 12",
    span: "lg:col-span-3",
    height: "h-[560px]",
  },
  {
    artist: "Neel Dust",
    title: "Sodium Light",
    genre: "Shoegaze",
    runtime: "37 min",
    year: "2024",
    cover: cover5,
    alt: "Cover art for Sodium Light by Neel Dust",
    span: "lg:col-span-3",
    height: "h-[440px]",
  },
  {
    artist: "DJ Shona",
    title: "Park Circus Edits",
    genre: "Club",
    runtime: "46 min",
    year: "2023",
    cover: cover6,
    alt: "Cover art for Park Circus Edits by DJ Shona",
    span: "lg:col-span-1",
    height: "h-[440px]",
  },
];
