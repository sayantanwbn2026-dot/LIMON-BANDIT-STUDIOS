import { describe, expect, test } from "bun:test";
import { WORDS, WORD_DOCS, fill, wordLabel, type WordArea } from "./words";
import { byKey } from "./collections";
import { seeds } from "./seeds";
import { resolveImage } from "./media";

/**
 * The wording documents are generated from words.ts, so the joins that
 * matter are between the defaults, the admin forms and the seeds. Each of
 * these failing would be quiet on the site: a string with no field cannot
 * be edited, a field with no default renders an empty button, and a
 * default picture that is not in the library is a hole in a card.
 */

const areas = Object.keys(WORDS) as WordArea[];

describe("words", () => {
  test("every area has a document, and no two areas share one", () => {
    expect(areas.filter((a) => !WORD_DOCS[a])).toEqual([]);
    const keys = areas.map((a) => WORD_DOCS[a].key);
    expect(keys.filter((k, i) => keys.indexOf(k) !== i)).toEqual([]);
  });

  test("every area is a collection with exactly one field per string", () => {
    for (const a of areas) {
      const c = byKey.get(WORD_DOCS[a].key);
      expect(c?.shape).toBe("object");
      expect(c?.fields.map((f) => f.name).sort()).toEqual(Object.keys(WORDS[a]).sort());
    }
  });

  test("every area is seeded with its defaults", () => {
    for (const a of areas) expect(seeds[WORD_DOCS[a].key]).toEqual({ ...WORDS[a] });
  });

  test("no default is blank — an empty default is an empty button", () => {
    const blank = areas.flatMap((a) =>
      Object.entries(WORDS[a] as Record<string, string>)
        .filter(([, v]) => !v.trim())
        .map(([k]) => `${a}.${k}`),
    );
    expect(blank).toEqual([]);
  });

  test("a page's wording sits under that page in the admin", () => {
    for (const a of areas) {
      const d = WORD_DOCS[a];
      if (d.group === "page") expect(d.page).toBeTruthy();
    }
  });

  test("every default picture is one the build has", () => {
    const missing = areas.flatMap((a) =>
      Object.entries(WORDS[a] as Record<string, string>)
        .filter(([k]) => k.endsWith("Image"))
        .filter(([, v]) => resolveImage(v).kind === "none")
        .map(([k, v]) => `${a}.${k} = ${v}`),
    );
    expect(missing).toEqual([]);
  });
});

describe("fill", () => {
  test("fills every slot it has a value for", () => {
    expect(fill("{title} by {artist}", { title: "Terminus", artist: "Kaalo" })).toBe(
      "Terminus by Kaalo",
    );
    expect(fill("{count} items", { count: 3 })).toBe("3 items");
  });

  test("leaves a slot it has no value for visible rather than dropping it", () => {
    expect(fill("Book {room}", {})).toBe("Book {room}");
  });
});

describe("wordLabel", () => {
  test("reads a key as a sentence-case label", () => {
    expect(wordLabel("addToCart")).toBe("Add to cart");
    expect(wordLabel("heroSplitArtistLabel")).toBe("Hero split artist label");
    expect(wordLabel("filmWatch4k")).toBe("Film watch4k");
  });
});
