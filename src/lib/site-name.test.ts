import { describe, expect, test } from "bun:test";
import { siteNameFrom } from "./seo";

describe("siteNameFrom", () => {
  test("an empty store gives the committed name, title-cased for a tab", () => {
    expect(siteNameFrom({})).toBe("Limon Bandit");
  });

  test("an all-caps name reads as a name, not a shout", () => {
    expect(siteNameFrom({ "global.site": { name: "LIMON BANDIT" } })).toBe("Limon Bandit");
    expect(siteNameFrom({ "global.site": { name: "LMN/BNDT STUDIOS" } })).toBe("Lmn/Bndt Studios");
  });

  test("a name typed in mixed case is used as typed", () => {
    expect(siteNameFrom({ "global.site": { name: "Limon Bandit HQ" } })).toBe("Limon Bandit HQ");
  });
});
