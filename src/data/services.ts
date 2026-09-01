import type { ImageKey } from "@/generated/images";

export type Service = {
  index: string;
  title: string;
  /** the one-word idea, set as the giant plate behind the photograph */
  word: string;
  description: string;
  tags: string[];
  /** the operation, photographed — this section is the only place on the
   * landing page where all four are shown as rooms rather than as copy */
  image: ImageKey;
  alt: string;
  /** where the operation actually lives. The cards used to link nowhere. */
  to: string;
};

// REPLACE — the four operations
export const services: Service[] = [
  {
    index: "/01",
    title: "The Rooms",
    word: "Track",
    description:
      "Live room, vocal booth, and overnight lockouts. Analogue front end, clean monitoring, no clock-watching after midnight.",
    tags: ["Live Room", "Booth", "Lockout"],
    image: "room-a",
    alt: "Room A set up for a live session",
    to: "/rooms",
  },
  {
    index: "/02",
    title: "The Label",
    word: "Release",
    description:
      "We sign, release, and distribute — and stream every record on our own player so the roster keeps the audience.",
    tags: ["A&R", "Distribution", "Splits"],
    image: "release-04",
    alt: "Cover art from the label's catalogue",
    to: "/label",
  },
  {
    index: "/03",
    title: "The Drop",
    word: "Print",
    description:
      "Merch cut and printed in Kolkata. Small runs, no restocks, sold direct from the site.",
    tags: ["Tees", "Outerwear", "Vinyl"],
    image: "merch-tee",
    alt: "The house tee hanging against a concrete wall",
    to: "/shop",
  },
  {
    index: "/04",
    title: "The Crew",
    word: "Shoot",
    description:
      "A marketplace of vetted directors, cover artists, photographers, and mixing engineers, hired by the project.",
    tags: ["Video", "Artwork", "Engineers"],
    image: "wall-02",
    alt: "A crew at work in the building",
    to: "/crew",
  },
];
