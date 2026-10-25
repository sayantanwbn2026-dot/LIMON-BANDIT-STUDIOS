import { describe, expect, test } from "bun:test";
import { HOUSE_MASCOT, HOUSE_MASCOT_ALT, pickMascot } from "./mascot";
import { resolveImage } from "./media";

/**
 * The hero mascot's fallbacks. He is the largest paint on every page that
 * has him, so each way an editor can leave a field half-done has to land on
 * a picture rather than an empty stage.
 */

const house = { mascot: "https://cdn.example.com/limon-new.webp", mascotAlt: "Limon, redrawn" };

describe("pickMascot", () => {
  test("a page's own mascot wins, with its own description", () => {
    expect(
      pickMascot(
        { mascot: "/uploads/limon-headphones.png", mascotAlt: "Limon in headphones" },
        house,
      ),
    ).toEqual({ src: "/uploads/limon-headphones.png", alt: "Limon in headphones" });
  });

  test("a page's own mascot with no description borrows the house one", () => {
    expect(pickMascot({ mascot: "/uploads/limon-tote.png", mascotAlt: " " }, house).alt).toBe(
      "Limon, redrawn",
    );
  });

  test("an empty page field hands the page back to the house mascot", () => {
    expect(pickMascot({ mascot: "", mascotAlt: "ignored" }, house)).toEqual({
      src: house.mascot,
      alt: house.mascotAlt,
    });
  });

  test("a removed manifest key is treated as empty, not rendered as a hole", () => {
    expect(pickMascot({ mascot: "limon-deleted-artwork" }, house).src).toBe(house.mascot);
    expect(pickMascot(undefined, { mascot: "limon-deleted-artwork" }).src).toBe(HOUSE_MASCOT);
  });

  test("with nothing set anywhere, the committed mascot", () => {
    expect(pickMascot(undefined, undefined)).toEqual({ src: HOUSE_MASCOT, alt: HOUSE_MASCOT_ALT });
    expect(pickMascot(null, { mascot: "  " })).toEqual({
      src: HOUSE_MASCOT,
      alt: HOUSE_MASCOT_ALT,
    });
  });

  test("the committed mascot is a key the build actually has", () => {
    expect(resolveImage(HOUSE_MASCOT).kind).toBe("manifest");
  });
});
