import { describe, expect, test } from "bun:test";
import { HOUSE_MASCOT, HOUSE_MASCOT_ALT, MASCOT_PAGES, applyMascots, pickMascot } from "./mascot";
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

/**
 * The Hero Mascot screen saves into documents that also hold the contact
 * details and every page's heading and search text. It must change the two
 * mascot fields and nothing else.
 */
describe("applyMascots", () => {
  const site = { name: "LIMON BANDIT", phone: "+91 98300 00000", mascot: "limon-mascot" };
  const rows = [
    { key: "home", heading: "Limon Bandit", title: "Home title", mascot: "", mascotAlt: "" },
    { key: "rooms", heading: "Four rooms", title: "Rooms title", mascot: "", mascotAlt: "" },
    { key: "journal", heading: "Notes", title: "Journal title" },
  ];
  const seedRows = [...rows, { key: "about", heading: "Inside the house", title: "About title" }];
  const draft = {
    house: { mascot: "https://cdn.example.com/limon-v2.webp", mascotAlt: "Limon, v2" },
    pages: {
      home: { mascot: "", mascotAlt: "" },
      rooms: { mascot: "/uploads/limon-headphones.png", mascotAlt: "Limon in headphones" },
      about: { mascot: "/uploads/limon-about.png", mascotAlt: "Limon at the desk" },
    },
  };

  test("the house slot changes the mascot fields and keeps the rest of the site", () => {
    const out = applyMascots(site, rows, draft, seedRows);
    expect(out.site).toEqual({
      name: "LIMON BANDIT",
      phone: "+91 98300 00000",
      mascot: "https://cdn.example.com/limon-v2.webp",
      mascotAlt: "Limon, v2",
    });
  });

  test("a page's slot lands on its own row, headings and search text untouched", () => {
    const out = applyMascots(site, rows, draft, seedRows);
    const rooms = out.pages.find((r) => r.key === "rooms");
    expect(rooms).toEqual({
      key: "rooms",
      heading: "Four rooms",
      title: "Rooms title",
      mascot: "/uploads/limon-headphones.png",
      mascotAlt: "Limon in headphones",
    });
    /* a page the screen does not edit passes through as it was */
    expect(out.pages.find((r) => r.key === "journal")).toEqual(rows[2]);
  });

  test("a page with no stored row takes its committed row, so the edit is kept", () => {
    const out = applyMascots(site, rows, draft, seedRows);
    expect(out.pages.find((r) => r.key === "about")).toEqual({
      key: "about",
      heading: "Inside the house",
      title: "About title",
      mascot: "/uploads/limon-about.png",
      mascotAlt: "Limon at the desk",
    });
  });

  test("the stored order is kept", () => {
    const out = applyMascots(site, rows, draft, seedRows);
    expect(out.pages.map((r) => r.key)).toEqual(["home", "rooms", "journal", "about"]);
  });

  test("every page with a stage has a slot, and the Journal does not", () => {
    expect(MASCOT_PAGES).toEqual(["home", "rooms", "label", "shop", "crew", "about", "contact"]);
  });
});
