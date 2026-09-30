import type { ImageKey } from "@/generated/images";

/**
 * What the house most wants booked or bought, in order.
 *
 * This is the one piece of home-page content that is expected to change
 * often — a new run, a room with a gap in the diary, a record that just
 * landed. It is a plain list with no colours in it, because the decision
 * an editor is making here is "what goes first", not "what colour is the
 * second panel".
 *
 * Shipped as the floor. The live values come from the CMS.
 */
export type Feature = {
  eyebrow: string;
  title: string;
  blurb: string;
  /** a price, a rate, a run size — or empty when there is no number */
  meta: string;
  image: ImageKey;
  /** an in-app path, or a full https:// address for somewhere else */
  to: string;
  cta: string;
};

export const featured: Feature[] = [
  {
    eyebrow: "Studio time",
    title: "Room A",
    blurb: "The live room. Six players, wood, a real tail — engineer always included.",
    meta: "₹2,400 / hr",
    image: "room-a",
    to: "/rooms",
    cta: "See the room",
  },
  {
    eyebrow: "House merch",
    title: "Bandit Tee — Run 04",
    blurb: "Heavyweight cotton, screen printed in Kolkata. 150 printed, no restock.",
    meta: "₹1,400",
    image: "merch-tee",
    to: "/shop/p01",
    cta: "Buy the tee",
  },
  {
    eyebrow: "On the label",
    title: "Rusted Gold",
    blurb:
      "Rana & The Strays, cut over three nights in Room A. Hear it in the room it was made in.",
    meta: "2025",
    image: "release-01",
    to: "/label",
    cta: "Hear it",
  },
];
