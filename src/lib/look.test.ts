import { describe, expect, test } from "bun:test";
import { accentInk, accentScript, accentVars, dimmed, normalizeHex } from "./look";

describe("normalizeHex", () => {
  test("accepts the shapes a person actually types", () => {
    expect(normalizeHex("#E9FF00")).toBe("#e9ff00");
    expect(normalizeHex("e9ff00")).toBe("#e9ff00");
    expect(normalizeHex("  #ef0 ")).toBe("#eeff00");
  });

  test("anything it cannot read means the house yellow, not a broken token", () => {
    for (const bad of ["", "   ", "yellow", "#12345", "rgb(1,2,3)", "#gggggg", undefined]) {
      expect(normalizeHex(bad)).toBeNull();
    }
  });
});

describe("accentInk", () => {
  test("the shipped yellow keeps near-black type", () => {
    expect(accentInk("#e9ff00")).toBe("#080808");
  });

  test("a dark accent flips the type to white on its own", () => {
    expect(accentInk("#101c4b")).toBe("#ffffff");
    expect(accentInk("#000000")).toBe("#ffffff");
  });

  test("white and other bright grounds stay on black type", () => {
    expect(accentInk("#ffffff")).toBe("#080808");
    expect(accentInk("#ff6ad5")).toBe("#080808");
  });
});

describe("dimmed", () => {
  test("is the same hue, darker, and still a valid hex", () => {
    expect(dimmed("#e9ff00")).toMatch(/^#[0-9a-f]{6}$/);
    expect(dimmed("#ffffff", 0.5)).toBe("#808080");
    expect(dimmed("#000000")).toBe("#000000");
  });
});

describe("accentScript", () => {
  test("an unset colour emits nothing at all", () => {
    expect(accentScript(undefined)).toBe("");
    expect(accentScript({ accent: "" })).toBe("");
    expect(accentScript({ accent: "not a colour" })).toBe("");
  });

  test("a chosen colour sets all four tokens before the first paint", () => {
    const js = accentScript({ accent: "#101c4b" });
    expect(js).toContain('"--accent","#101c4b"');
    expect(js).toContain('"--accent-type","#101c4b"');
    expect(js).toContain('"--accent-text","#ffffff"');
    expect(js).toContain("--accent-dim");
    /* It runs inline in <head> on every page, so it must never be able to
     * throw — one bad value would take the document down with it. */
    expect(js).toContain("try{");
    expect(js).toContain("catch(e){}");
  });

  test("the vars and the script agree", () => {
    const v = accentVars({ accent: "ef0" })!;
    expect(v.accent).toBe("#eeff00");
    expect(accentScript({ accent: "ef0" })).toContain(v.accentText);
  });
});
