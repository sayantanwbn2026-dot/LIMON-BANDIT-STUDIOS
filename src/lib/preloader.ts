/**
 * Which opening sequence plays, and on what.
 *
 * THE WHOLE POINT: ONE FILE IS DOWNLOADED, AND THE BROWSER PICKS IT.
 *
 * Three videos are offered — desktop, tablet, phone — and the obvious way
 * to choose between them is to read the viewport width in JavaScript. That
 * is the wrong way here, twice over. The opening sequence is the first
 * paint of a hard load, so a choice made after hydration is a choice made
 * too late; and the server has no viewport, so the markup it sends would
 * not match what the client decided and React would throw the whole thing
 * out.
 *
 * `<source media="…">` is evaluated by the browser's preload scanner,
 * before React, before hydration, in the same pass that finds the
 * stylesheet. The right file starts downloading immediately and the other
 * two are never requested. Same markup on both sides, one request, no
 * JavaScript in the path.
 *
 * ORDER MATTERS AND IS NOT ALPHABETICAL. The browser takes the FIRST
 * source whose media query matches, so they run narrowest to widest and
 * the desktop file comes last with no query at all — it is both the
 * desktop answer and the fallback for a slot nobody filled.
 */

export type PreloaderDoc = {
  mode?: "meter" | "video" | "off";
  desktop?: string;
  tablet?: string;
  mobile?: string;
  poster?: string;
  fit?: "cover" | "contain";
};

export type VideoSource = { src: string; media?: string; type?: string };

/** The breakpoints the rest of the site uses: md is 768, lg is 1024. */
const PHONE = "(max-width: 767px)";
const TABLET = "(max-width: 1023px)";

/* Naming the type lets a browser skip a source it cannot play without
 * fetching a byte of it. Unknown extensions say nothing rather than
 * guessing, because a wrong type is worse than no type — it is the one
 * thing that will make a playable file be skipped. */
function typeOf(url: string): string | undefined {
  const clean = url.split("?")[0].toLowerCase();
  if (clean.endsWith(".mp4") || clean.endsWith(".m4v")) return "video/mp4";
  if (clean.endsWith(".webm")) return "video/webm";
  if (clean.endsWith(".mov")) return "video/quicktime";
  return undefined;
}

const clean = (v: string | undefined) => v?.trim() || "";

/**
 * The ordered `<source>` list, or an empty array when there is nothing to
 * play — which is the signal to fall back to the built-in level meter.
 *
 * A slot left empty inherits the next one up rather than leaving a device
 * with nothing: fill only the phone slot and the phone gets the film while
 * everything else gets it too, which is what somebody who filled one slot
 * meant. Fill all three and each device gets its own.
 */
export function videoSources(doc: PreloaderDoc | undefined): VideoSource[] {
  const mobile = clean(doc?.mobile);
  const tablet = clean(doc?.tablet);
  const desktop = clean(doc?.desktop);

  /* The last line has no media query, so it has to exist for anything to
   * play at all. Widest first for the fallback, because a desktop file
   * letterboxed on a phone is better than a phone file blown up on a
   * desk. */
  const fallback = desktop || tablet || mobile;
  if (!fallback) return [];

  const out: VideoSource[] = [];
  if (mobile) out.push({ src: mobile, media: PHONE, type: typeOf(mobile) });
  if (tablet) out.push({ src: tablet, media: TABLET, type: typeOf(tablet) });
  out.push({ src: fallback, type: typeOf(fallback) });
  return out;
}

/**
 * The origin the sequence will be fetched from, for a `preconnect` in the
 * head.
 *
 * Worth one line of markup: the file lives on the storage bucket, which is
 * a different host to the site, so the request pays for a DNS lookup, a TCP
 * handshake and a TLS negotiation before the first byte of a file that is
 * already on the critical path. Preconnecting does all three while the HTML
 * is still being parsed.
 *
 * Null when there is nothing to fetch, or when the source is not a URL this
 * can read — an empty or malformed preconnect is a wasted socket.
 */
export function videoOrigin(doc: PreloaderDoc | undefined): string | null {
  const first = videoSources(doc).at(-1)?.src;
  if (!first) return null;
  try {
    const url = new URL(first);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

/** Is the editor asking for a video, and is there one to play? */
export function wantsVideo(doc: PreloaderDoc | undefined): boolean {
  return doc?.mode === "video" && videoSources(doc).length > 0;
}

/**
 * The hard ceiling, in milliseconds.
 *
 * Ten seconds is the longest an opening sequence may hold the page, and it
 * is a ceiling rather than a duration: a six-second film ends when it ends.
 * Nothing about this is enforced at upload — a file can be any length and
 * the admin says so loudly — because the thing that must never happen is a
 * visitor stuck behind a thirty-second film, and that is prevented here,
 * where it cannot be edited around.
 */
export const MAX_MS = 10_000;

/**
 * How long to wait for the first frame before giving up and showing the
 * site.
 *
 * The sequence exists to cover a load, so it must never BE the load. On a
 * bad connection the video may still be arriving; past this the site is
 * revealed and the film is abandoned, which is the only honest trade — a
 * visitor who came to read the rates does not care that the opener did
 * not get to play.
 */
export const FIRST_FRAME_MS = 2_500;
