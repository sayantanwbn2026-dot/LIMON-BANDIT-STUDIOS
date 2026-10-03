import { describe, expect, it } from "bun:test";
import { collections } from "./collections";
import { seeds } from "./seeds";
import { DEFAULT_HOME_ORDER, HOME_SECTIONS } from "./home-sections";

/**
 * The CMS's own joins, checked.
 *
 * The content layer is four files that have to agree with each other:
 * `collections.ts` says what an editor can change, `seeds.ts` is the floor
 * every reader falls back to, `hooks.ts` reads it and the pages render it.
 * Nothing but convention held them together, and each disagreement fails in
 * a different quiet way rather than throwing:
 *
 *   A collection with no seed opens as an empty form in the admin, and the
 *   page it belongs to renders nothing at all until somebody saves it. This
 *   is the one that actually happened — the hero button collection was
 *   written before its seed, and the front page would have shipped with an
 *   unlabelled button pointing nowhere.
 *
 *   A seed with no collection is content on the site that no interface can
 *   reach: editable in principle, invisible in practice. Five whole sections
 *   were in exactly that state for months.
 *
 *   A shape disagreement — a list collection seeded with an object, or the
 *   reverse — means the admin's list editor is handed something it cannot
 *   iterate, which is a blank screen rather than an error.
 *
 * TypeScript already guarantees the one join these tests do NOT make: the
 * home page's section registry is a `Record<HomeSectionKey, …>`, so a key in
 * HOME_SECTIONS with no renderer will not compile. No test needed.
 */
describe("collections and seeds agree", () => {
  const keys = collections.map((c) => c.key);

  it("every collection has a seed to fall back to", () => {
    expect(keys.filter((k) => !(k in seeds))).toEqual([]);
  });

  it("every seed is reachable through a collection", () => {
    expect(Object.keys(seeds).filter((k) => !keys.includes(k))).toEqual([]);
  });

  it("no collection key is registered twice", () => {
    expect(keys.filter((k, i) => keys.indexOf(k) !== i)).toEqual([]);
  });

  it("a list collection seeds an array and an object collection does not", () => {
    const wrong = collections
      .filter((c) => {
        const seed = (seeds as Record<string, unknown>)[c.key];
        if (seed === undefined) return false; // reported by the first test
        return c.shape === "list" ? !Array.isArray(seed) : Array.isArray(seed);
      })
      .map((c) => `${c.key} is "${c.shape}"`);
    expect(wrong).toEqual([]);
  });

  it("every list collection's titleField is one of its own fields", () => {
    const wrong = collections
      .filter((c) => c.shape === "list")
      .filter((c) => !c.fields.some((f) => f.name === (c as { titleField: string }).titleField))
      .map((c) => c.key);
    expect(wrong).toEqual([]);
  });
});

describe("the home page's section list", () => {
  it("names each section once", () => {
    const k = HOME_SECTIONS.map((s) => s.key);
    expect(k.filter((x, i) => k.indexOf(x) !== i)).toEqual([]);
  });

  it("ships an order covering every section", () => {
    expect(DEFAULT_HOME_ORDER.map((r) => r.section)).toEqual(HOME_SECTIONS.map((s) => s.key));
  });

  it("carries each section's own default rather than switching all on", () => {
    /* The resolver appends anything missing from a stored order at its
     * HOME_SECTIONS default. If the seed flattened those to true, adding a
     * section to the registry would publish it to the live front page on
     * deploy with nobody having asked. */
    expect(DEFAULT_HOME_ORDER.map((r) => r.on)).toEqual(HOME_SECTIONS.map((s) => s.on));
    expect(DEFAULT_HOME_ORDER.some((r) => r.on === false)).toBe(true);
  });

  it("offers every section as a choice in the admin picker", () => {
    const picker = collections.find((c) => c.key === "page.home.order");
    expect(picker).toBeDefined();
    const field = picker!.fields.find((f) => f.name === "section");
    const offered = (field as { options?: { value: string }[] }).options?.map((o) => o.value) ?? [];
    expect(offered.sort()).toEqual(HOME_SECTIONS.map((s) => s.key).sort());
  });
});
