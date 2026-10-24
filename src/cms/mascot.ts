import { resolveImage } from "./media";

/**
 * Which mascot stands on a hero.
 *
 * Two places in the admin can set him. "Brand & contact" holds the house
 * mascot, which every hero uses by default and which the menu, the footer
 * and the "Still stuck?" card always use. Each row of "Page titles & SEO"
 * can replace him on that one page — Limon in headphones on Rooms, Limon
 * with a tote on Shop — and leaving that field empty hands the page back
 * to the house mascot.
 *
 * Every step falls through on an image that cannot be shown, not only an
 * empty one: a manifest key for artwork that has since been removed
 * resolves to nothing, and a hero with a hole where the largest paint on
 * the page should be is worse than the house mascot standing in.
 */

export const HOUSE_MASCOT = "limon-mascot";
export const HOUSE_MASCOT_ALT =
  "Limon, the Limon Bandit mascot: a lemon in a bandana and leather jacket";

export type Mascot = { src: string; alt: string };

type Slot = { mascot?: string; mascotAlt?: string } | null | undefined;

const usable = (v: string | undefined) => resolveImage(v).kind !== "none";
const filled = (v: string | undefined) => (typeof v === "string" && v.trim() ? v.trim() : "");

export function pickMascot(page: Slot, house: Slot): Mascot {
  const houseAlt = filled(house?.mascotAlt) || HOUSE_MASCOT_ALT;
  if (usable(page?.mascot)) {
    /* A page's own picture with no description of its own is still the
     * mascot, so the house description is closer than nothing. */
    return { src: filled(page?.mascot), alt: filled(page?.mascotAlt) || houseAlt };
  }
  if (usable(house?.mascot)) return { src: filled(house?.mascot), alt: houseAlt };
  return { src: HOUSE_MASCOT, alt: HOUSE_MASCOT_ALT };
}
