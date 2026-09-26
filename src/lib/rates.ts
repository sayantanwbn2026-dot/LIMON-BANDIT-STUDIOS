/**
 * Room rates, as the CMS writes them.
 *
 * Each room carries its price as a free-text line — "₹2,400 / hr",
 * "₹14,000 / night" — because that is what the Rooms page prints and an
 * editor should not have to keep a number and its label in step by hand.
 * The estimator needs arithmetic, so it parses that one line rather than
 * introducing a second field that could disagree with the first.
 *
 * Anything unparseable returns null, and the caller shows no total. A made
 * up number on a booking page is worse than no number.
 */

type Rate = { amount: number; unit: "hour" | "night" } | null;

/** "₹2,400 / hr" -> 2400 an hour. Anything unexpected -> null. */
export function parseRate(line: string | undefined): Rate {
  if (!line) return null;
  const m = line.match(/([\d,]+)\s*\/\s*([a-z]+)/i);
  if (!m) return null;
  const amount = Number(m[1].replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const unit = /night|day/i.test(m[2]) ? "night" : "hour";
  return { amount, unit };
}
