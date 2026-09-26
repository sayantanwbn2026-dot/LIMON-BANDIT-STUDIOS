import { expect, test, describe } from "bun:test";
import { parseRate } from "./rates";

/**
 * The estimator multiplies whatever this returns, so a wrong parse is a
 * wrong price on a booking page. These are the real lines from the room
 * documents plus the ways an editor could reasonably write them.
 */

describe("parseRate", () => {
  test("reads the house's own lines", () => {
    expect(parseRate("₹2,400 / hr")).toEqual({ amount: 2400, unit: "hour" });
    expect(parseRate("₹1,800 / hr")).toEqual({ amount: 1800, unit: "hour" });
    expect(parseRate("₹14,000 / night")).toEqual({ amount: 14000, unit: "night" });
  });

  test("survives spacing and wording an editor might use", () => {
    expect(parseRate("₹2400/hr")).toEqual({ amount: 2400, unit: "hour" });
    expect(parseRate("₹2,400 / hour")).toEqual({ amount: 2400, unit: "hour" });
    expect(parseRate("₹9,000 / day")).toEqual({ amount: 9000, unit: "night" });
  });

  test("a line with no number quotes nothing rather than guessing", () => {
    expect(parseRate("On request")).toBeNull();
    expect(parseRate("")).toBeNull();
    expect(parseRate(undefined)).toBeNull();
  });

  test("refuses a zero or negative rate", () => {
    expect(parseRate("₹0 / hr")).toBeNull();
  });

  test("takes the price, not a stray number in the label", () => {
    expect(parseRate("₹2,400 / hr (2 hour minimum)")).toEqual({ amount: 2400, unit: "hour" });
  });
});
