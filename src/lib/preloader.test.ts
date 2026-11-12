import { describe, expect, test } from "bun:test";
import { MAX_MS, videoOrigin, videoSources, wantsVideo } from "./preloader";

const MP4 = "https://bucket.example.com/cms/opening-desktop.mp4";
const TABLET = "https://bucket.example.com/cms/opening-tablet.webm";
const PHONE = "https://bucket.example.com/cms/opening-phone.mp4";

describe("videoSources", () => {
  test("nothing uploaded means nothing to play", () => {
    expect(videoSources(undefined)).toEqual([]);
    expect(videoSources({})).toEqual([]);
    expect(videoSources({ desktop: "   " })).toEqual([]);
  });

  test("narrowest query first, and the last line has none", () => {
    const s = videoSources({ desktop: MP4, tablet: TABLET, mobile: PHONE });
    expect(s.map((x) => x.media)).toEqual(["(max-width: 767px)", "(max-width: 1023px)", undefined]);
    expect(s.map((x) => x.src)).toEqual([PHONE, TABLET, MP4]);
  });

  test("the type is named so an unplayable file is skipped without fetching it", () => {
    const s = videoSources({ desktop: MP4, tablet: TABLET });
    expect(s.find((x) => x.src === TABLET)?.type).toBe("video/webm");
    expect(s.find((x) => x.media === undefined)?.type).toBe("video/mp4");
  });

  test("an unknown extension says nothing rather than guessing wrong", () => {
    const [only] = videoSources({ desktop: "https://x.test/film" });
    expect(only.type).toBeUndefined();
  });

  test("one slot filled covers every device", () => {
    const s = videoSources({ mobile: PHONE });
    /* The phone gets it by query and everything else by the fallback, so a
     * desk is never left with a blank sequence. */
    expect(s).toHaveLength(2);
    expect(s.at(-1)).toEqual({ src: PHONE, type: "video/mp4" });
  });

  test("the fallback prefers the widest file that exists", () => {
    expect(videoSources({ tablet: TABLET, mobile: PHONE }).at(-1)?.src).toBe(TABLET);
    expect(videoSources({ mobile: PHONE }).at(-1)?.src).toBe(PHONE);
  });
});

describe("wantsVideo", () => {
  test("only when the mode asks for it AND there is a file", () => {
    expect(wantsVideo({ mode: "video", desktop: MP4 })).toBe(true);
    expect(wantsVideo({ mode: "video" })).toBe(false);
    expect(wantsVideo({ mode: "meter", desktop: MP4 })).toBe(false);
    expect(wantsVideo({ mode: "off", desktop: MP4 })).toBe(false);
    expect(wantsVideo(undefined)).toBe(false);
  });
});

describe("videoOrigin", () => {
  test("the bucket's origin, for the preconnect", () => {
    expect(videoOrigin({ desktop: MP4 })).toBe("https://bucket.example.com");
  });

  test("nothing to connect to means no link at all", () => {
    expect(videoOrigin({})).toBeNull();
    expect(videoOrigin({ desktop: "not a url" })).toBeNull();
    expect(videoOrigin({ desktop: "javascript:alert(1)" })).toBeNull();
  });
});

describe("the ceiling", () => {
  test("is ten seconds, and is not something a document can raise", () => {
    expect(MAX_MS).toBe(10_000);
  });
});
