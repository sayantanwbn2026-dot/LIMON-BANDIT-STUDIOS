import { describe, expect, test } from "bun:test";
import { autoQuality, embedOf, isPlayable, sourcesOf } from "./video";

/**
 * The film player's decisions, which run on visitors' devices and are
 * otherwise only checkable by owning every one of them: what a row can
 * play, which encode Auto starts on, and what a pasted link becomes.
 */

const all = { src2160: "/v/a-2160.mp4", src1080: "/v/a-1080.mp4", src720: "/v/a-720.mp4" };

describe("sourcesOf", () => {
  test("lists the encodes highest first", () => {
    expect(sourcesOf(all).map((s) => s.q)).toEqual([2160, 1080, 720]);
  });

  test("a blank or whitespace field is not an encode", () => {
    expect(sourcesOf({ src2160: "  ", src1080: "/v/a.mp4", src720: "" }).map((s) => s.q)).toEqual([
      1080,
    ]);
  });
});

describe("autoQuality", () => {
  const s = sourcesOf(all);

  test("a 4K panel gets the 4K file", () => {
    expect(autoQuality(s, { longEdge: 3840, dpr: 1 })?.q).toBe(2160);
  });

  test("a retina laptop gets 4K — it fills 2880 device pixels in fullscreen", () => {
    expect(autoQuality(s, { longEdge: 1440, dpr: 2 })?.q).toBe(2160);
  });

  test("a 1080p monitor gets HD, not the largest file there is", () => {
    expect(autoQuality(s, { longEdge: 1920, dpr: 1 })?.q).toBe(1080);
  });

  test("a phone never starts above HD", () => {
    expect(autoQuality(s, { longEdge: 932, dpr: 3, narrow: true })?.q).toBe(1080);
  });

  test("save-data and slow connections get the lightest encode", () => {
    expect(autoQuality(s, { longEdge: 3840, dpr: 1, saveData: true })?.q).toBe(720);
    expect(autoQuality(s, { longEdge: 3840, dpr: 1, effectiveType: "3g" })?.q).toBe(720);
    expect(autoQuality(s, { longEdge: 3840, dpr: 1, effectiveType: "4g" })?.q).toBe(2160);
  });

  test("with only one encode, that is the one", () => {
    expect(autoQuality(sourcesOf({ src2160: "/v/a.mp4" }), { longEdge: 800, dpr: 1 })?.q).toBe(
      2160,
    );
  });

  test("nothing to play is undefined, not a crash", () => {
    expect(autoQuality([], { longEdge: 1920, dpr: 1 })).toBeUndefined();
  });
});

describe("embedOf", () => {
  const id = "dQw4w9WgXcQ";

  test.each([
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtube.com/watch?v=${id}&t=42s&si=abc`,
    `https://m.youtube.com/watch?v=${id}`,
    `https://youtu.be/${id}?si=xyz`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube.com/embed/${id}`,
    `https://www.youtube.com/live/${id}`,
  ])("reads YouTube from %s", (url) => {
    const e = embedOf(url);
    expect(e?.kind).toBe("youtube");
    expect(e?.id).toBe(id);
    expect(e?.src.startsWith("https://www.youtube-nocookie.com/embed/")).toBe(true);
  });

  test.each(["https://vimeo.com/76979871", "https://player.vimeo.com/video/76979871?h=1"])(
    "reads Vimeo from %s",
    (url) => {
      expect(embedOf(url)).toMatchObject({ kind: "vimeo", id: "76979871" });
    },
  );

  test.each([
    "",
    "not a url",
    "https://example.com/video.mp4",
    "https://youtube.com/watch?v=short",
  ])("returns null for %p", (url) => {
    expect(embedOf(url)).toBeNull();
  });
});

describe("isPlayable", () => {
  test("a file or a recognised link makes a film playable", () => {
    expect(isPlayable({ src1080: "/v/a.mp4" })).toBe(true);
    expect(isPlayable({ embed: "https://youtu.be/dQw4w9WgXcQ" })).toBe(true);
  });

  test("an empty row, or one with an unrecognised link, does not", () => {
    expect(isPlayable({})).toBe(false);
    expect(isPlayable({ embed: "https://example.com" })).toBe(false);
  });
});
