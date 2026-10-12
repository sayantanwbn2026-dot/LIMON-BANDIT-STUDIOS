import { describe, expect, it } from "bun:test";
import { decideStep } from "./just-on";

/**
 * When does a wishlist heart pop? Exactly when somebody saves something —
 * and in particular NOT when a saved heart merely appears. Each case here is
 * a way that line gets blurred, and the third is one that was nearly shipped.
 */
describe("when the heart pops", () => {
  it("pops when an unsaved product is saved", () => {
    expect(decideStep({ on: false, scope: "p01" }, { on: true, scope: "p01" })).toBe("pop");
  });

  it("does not pop for a heart that was already saved on arrival", () => {
    /* Mount: the previous value is initialised to the current one, so a
     * visitor with five saved items sees five still hearts, not five pops. */
    expect(decideStep({ on: true, scope: "p01" }, { on: true, scope: "p01" })).toBe("hold");
  });

  it("does not pop when the sheet moves from an unsaved product to a saved one", () => {
    /* on flips false -> true, exactly as it does on a tap — but the SUBJECT
     * changed, so nobody tapped anything. Without the scope this was read as
     * a save. */
    expect(decideStep({ on: false, scope: "p01" }, { on: true, scope: "p02" })).toBe("resync");
  });

  it("clears at once when un-saved, so the next save can pop again", () => {
    expect(decideStep({ on: true, scope: "p01" }, { on: false, scope: "p01" })).toBe("clear");
  });

  it("pops a second time after a quick off and on", () => {
    /* The reason `clear` exists. Off must reset the flag, or the second "on"
     * would find it still true and the animation would never restart. */
    expect(decideStep({ on: false, scope: "p01" }, { on: true, scope: "p01" })).toBe("pop");
  });

  it("treats an unscoped heart (the product card) as one subject throughout", () => {
    expect(decideStep({ on: false }, { on: true })).toBe("pop");
    expect(decideStep({ on: true }, { on: true })).toBe("hold");
  });

  it("resyncs silently to an off value in a new scope without clearing wrongly", () => {
    expect(decideStep({ on: true, scope: "p01" }, { on: false, scope: "p02" })).toBe("resync");
  });
});
