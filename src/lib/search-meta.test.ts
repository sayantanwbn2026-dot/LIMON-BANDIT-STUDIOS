import { describe, expect, test } from "bun:test";
import { pageHead, searchMeta } from "./seo";

/* The rule these all share: a field left empty says nothing. An empty
 * verification tag fails verification, an empty canonical points a crawler
 * at nowhere, and both are worse than the absence they replaced. */

describe("searchMeta", () => {
  test("an empty store emits no tags at all", () => {
    expect(searchMeta({})).toEqual([]);
    expect(searchMeta({ "global.search": { verifyGoogle: "  ", twitterSite: "" } })).toEqual([]);
  });

  test("a verification code becomes the tag that search console looks for", () => {
    expect(searchMeta({ "global.search": { verifyGoogle: "abc123" } })).toEqual([
      { name: "google-site-verification", content: "abc123" },
    ]);
    expect(searchMeta({ "global.search": { verifyBing: "BING42" } })).toEqual([
      { name: "msvalidate.01", content: "BING42" },
    ]);
  });

  test("the handle is published with one @, however it was typed", () => {
    const withHandle = (twitterSite: string) => searchMeta({ "global.search": { twitterSite } })[0];
    expect(withHandle("limonbandit")).toEqual({ name: "twitter:site", content: "@limonbandit" });
    expect(withHandle("@limonbandit")).toEqual({ name: "twitter:site", content: "@limonbandit" });
    expect(withHandle(" @@limonbandit ")).toEqual({
      name: "twitter:site",
      content: "@limonbandit",
    });
  });
});

describe("pageHead canonical", () => {
  const canonicalOf = (head: ReturnType<typeof pageHead>) =>
    head.links.find((l) => l.rel === "canonical")?.href;
  const ogUrlOf = (head: ReturnType<typeof pageHead>) =>
    head.meta.find((m) => "property" in m && m.property === "og:url")?.content;

  const base = { title: "T", description: "D", path: "/rooms" };

  test("with no override, the link is built from the path", () => {
    const head = pageHead(base);
    expect(canonicalOf(head)).toMatch(/\/rooms$/);
    expect(ogUrlOf(head)).toBe(canonicalOf(head));
  });

  test("an absolute override wins, and og:url follows it", () => {
    const head = pageHead({ ...base, canonical: "https://example.com/elsewhere" });
    expect(canonicalOf(head)).toBe("https://example.com/elsewhere");
    expect(ogUrlOf(head)).toBe("https://example.com/elsewhere");
  });

  test("anything that is not an absolute URL is ignored rather than emitted", () => {
    for (const bad of ["/elsewhere", "example.com", "  ", "javascript:alert(1)"]) {
      expect(canonicalOf(pageHead({ ...base, canonical: bad }))).toMatch(/\/rooms$/);
    }
  });
});
