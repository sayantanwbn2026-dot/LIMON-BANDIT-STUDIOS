import { describe, expect, test } from "bun:test";
import { mailHref, mapsHref, telHref, waHref, waNumber } from "./contact";

/**
 * The menu's Call / WhatsApp / Email buttons are built from whatever an
 * editor typed into the phone and email fields, in whatever format they
 * typed it. A button that dials a wrong number is worse than no button, so
 * each of these returns "" rather than guessing.
 */

describe("waNumber", () => {
  test("a ten-digit number is given India's code", () => {
    expect(waNumber("98300 00000")).toBe("919830000000");
  });

  test("a number with its code keeps it, however it is punctuated", () => {
    expect(waNumber("+91 98300 00000")).toBe("919830000000");
    expect(waNumber("+44 (20) 7946-0958")).toBe("442079460958");
  });

  test("too short or empty is no number", () => {
    expect(waNumber("12345")).toBe("");
    expect(waNumber("")).toBe("");
    expect(waNumber(undefined)).toBe("");
  });
});

describe("telHref", () => {
  test("strips spacing and keeps the plus", () => {
    expect(telHref("+91 98300 00000")).toBe("tel:+919830000000");
    expect(telHref("033 2555 0000")).toBe("tel:03325550000");
  });

  test("nothing to dial is no link", () => {
    expect(telHref("")).toBe("");
    expect(telHref("call us")).toBe("");
  });
});

describe("waHref", () => {
  test("builds a wa.me chat, or nothing", () => {
    expect(waHref("+91 98300 00000")).toBe("https://wa.me/919830000000");
    expect(waHref("n/a")).toBe("");
  });
});

describe("mailHref", () => {
  test("an address becomes a mailto, trimmed", () => {
    expect(mailHref(" room@limonbandit.com ")).toBe("mailto:room@limonbandit.com");
  });

  test("anything else is no link", () => {
    expect(mailHref("room at limonbandit")).toBe("");
    expect(mailHref(undefined)).toBe("");
  });
});

describe("mapsHref", () => {
  test("the address lines, joined and encoded, as a maps search", () => {
    expect(mapsHref(["14B Sisir Bhaduri Sarani", " Hatibagan, Kolkata 700006 ", ""])).toBe(
      "https://www.google.com/maps/search/?api=1&query=14B%20Sisir%20Bhaduri%20Sarani%2C%20Hatibagan%2C%20Kolkata%20700006",
    );
  });

  test("no address is no link", () => {
    expect(mapsHref([])).toBe("");
    expect(mapsHref(undefined)).toBe("");
  });
});
