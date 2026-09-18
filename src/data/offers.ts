/**
 * Discount codes.
 *
 * This list is the only authority on what a code is worth. The flash popup
 * hands one out, the cart shows it applied, and the order server function
 * looks it up here again before computing a total — the browser's opinion of
 * the discount is never taken on trust.
 *
 * Codes are per-campaign, not per-email. A per-email code would need a
 * readable table of codes, which would make the signup endpoint readable too,
 * and an insert-only table is what stops the popup being farmed for
 * addresses. The email is captured for the mailing list; the code is the
 * campaign's.
 */

export type Offer = {
  code: string;
  percent: number;
  /** shown in the popup and on the cart line */
  label: string;
  /** null = no expiry. ISO date, compared as a day. */
  expires: string | null;
};

export const offers: Offer[] = [
  {
    code: "BANDIT10",
    percent: 10,
    label: "10% off your first order",
    expires: null,
  },
  {
    code: "LOCKOUT15",
    percent: 15,
    label: "15% off — lockout week",
    expires: "2026-12-31",
  },
];

/** The code the flash popup hands out. */
export const FLASH_OFFER = offers[0];

/**
 * Case-insensitive lookup that also enforces the expiry.
 *
 * Takes the list to search: the live one is the CMS's `commerce.offers`
 * (which is also what `submitOrder` validates against on the server), and
 * checking the compiled list here would reject a code an editor had just
 * created — or accept one they had just retired.
 */
export function findOffer(
  code: string | null | undefined,
  list: readonly Pick<Offer, "code" | "percent" | "label" | "expires">[] = offers,
): Offer | null {
  if (!code) return null;
  const found = list.find((o) => o.code.toLowerCase() === code.trim().toLowerCase());
  if (!found) return null;
  if (found.expires && new Date(found.expires) < new Date(new Date().toDateString())) return null;
  return found;
}
