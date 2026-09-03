/**
 * Money is integer rupees everywhere in this codebase — in the catalogue, in
 * the cart, in the `*_inr` columns. It is formatted exactly once, on the way
 * to the screen, by these two functions.
 *
 * The reason is arithmetic: a cart sums line items and applies a percentage
 * discount, and both of those are wrong on a float and impossible on
 * `"₹1,800"`. Rounding happens once, at the point a discount is computed, and
 * never again.
 */

const inrFormat = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** `1800` → `"₹1,800"`. Indian digit grouping, no paise. */
export function inr(rupees: number): string {
  return inrFormat.format(Math.round(rupees));
}

/** `1800` → `"1800"`. For the sheet, where a number must stay a number. */
export function plain(rupees: number): string {
  return String(Math.round(rupees));
}

/**
 * Apply a percentage off, rounded to whole rupees, and never below zero.
 * Returns the discount itself, not the new total, so the checkout can show
 * the line.
 */
export function discountOf(subtotal: number, percent: number): number {
  if (percent <= 0) return 0;
  return Math.min(subtotal, Math.round((subtotal * percent) / 100));
}
