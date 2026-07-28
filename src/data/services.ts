export type Service = {
  index: string;
  title: string;
  description: string;
  tags: string[];
};

// REPLACE — the four operations
export const services: Service[] = [
  {
    index: "/01",
    title: "The Rooms",
    description:
      "Live room, vocal booth, and overnight lockouts. Analogue front end, clean monitoring, no clock-watching after midnight.",
    tags: ["Live Room", "Booth", "Lockout"],
  },
  {
    index: "/02",
    title: "The Label",
    description:
      "We sign, release, and distribute — and stream every record on our own player so the roster keeps the audience.",
    tags: ["A&R", "Distribution", "Splits"],
  },
  {
    index: "/03",
    title: "The Drop",
    description:
      "Merch cut and printed in Kolkata. Small runs, no restocks, sold direct from the site.",
    tags: ["Tees", "Outerwear", "Vinyl"],
  },
  {
    index: "/04",
    title: "The Crew",
    description:
      "A marketplace of vetted directors, cover artists, photographers, and mixing engineers, hired by the project.",
    tags: ["Video", "Artwork", "Engineers"],
  },
];
