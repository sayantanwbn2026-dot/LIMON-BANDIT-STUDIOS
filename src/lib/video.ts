/**
 * What a film can play, and which of it to play first.
 *
 * Pure functions, so the decisions the player makes on someone's phone can
 * be tested on a laptop: which encodes a row actually has, which one Auto
 * starts on, and what a pasted YouTube or Vimeo address becomes.
 */

export type Quality = 2160 | 1080 | 720;

export type Source = {
  q: Quality;
  src: string;
  /** what the quality menu calls it */
  label: string;
  /** the encode's width, for matching it to a screen */
  width: number;
};

type Sourced = { src2160?: string; src1080?: string; src720?: string; embed?: string };

const LADDER = [
  { q: 2160, key: "src2160", label: "4K", width: 3840 },
  { q: 1080, key: "src1080", label: "HD", width: 1920 },
  { q: 720, key: "src720", label: "SD", width: 1280 },
] as const;

/** The encodes a film has, highest first. Blank fields are not encodes. */
export function sourcesOf(v: Sourced): Source[] {
  const out: Source[] = [];
  for (const rung of LADDER) {
    const src = (v[rung.key] ?? "").trim();
    if (src) out.push({ q: rung.q, src, label: rung.label, width: rung.width });
  }
  return out;
}

export type Embed = { kind: "youtube" | "vimeo"; id: string; src: string };

/**
 * A YouTube or Vimeo address, as something an iframe can load.
 *
 * Accepts what people actually paste — watch links, short links, Shorts,
 * live links, existing embed URLs, with or without tracking parameters —
 * and returns null for anything else rather than guessing. YouTube goes
 * through the no-cookie domain, so a visitor who only scrolls past is not
 * tracked by it.
 */
export function embedOf(url?: string): Embed | null {
  const raw = (url ?? "").trim();
  if (!raw) return null;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, "");

  let yt: string | null = null;
  if (host === "youtu.be") yt = u.pathname.slice(1);
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    yt =
      u.searchParams.get("v") ??
      u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/)?.[1] ??
      null;
  }
  if (yt && /^[A-Za-z0-9_-]{11}$/.test(yt)) {
    return {
      kind: "youtube",
      id: yt,
      src: `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
    };
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = u.pathname.match(/(?:^|\/)(\d{6,})(?:\/|$)/)?.[1];
    if (id) {
      return {
        kind: "vimeo",
        id,
        src: `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1&title=0&byline=0&portrait=0`,
      };
    }
  }
  return null;
}

/** Has something to play — a file or a link the player understands. */
export function isPlayable(v: Sourced): boolean {
  return sourcesOf(v).length > 0 || embedOf(v.embed) !== null;
}

/** What the player knows about where it is being watched. */
export type Viewing = {
  /** the screen's longer side, CSS px — fullscreen fills it */
  longEdge: number;
  dpr: number;
  /** the visitor asked the browser to save data */
  saveData?: boolean;
  /** Network Information API, where the browser has it */
  effectiveType?: string;
  /** a phone-width layout */
  narrow?: boolean;
};

/**
 * The encode Auto starts on.
 *
 * The smallest one that still covers the screen it will be shown on, at the
 * pixel density it will be shown at — so a 4K file goes to a 4K panel or a
 * retina laptop in fullscreen, and an HD one to a 1080p monitor, rather than
 * every visitor downloading the largest file there is. Density is capped at
 * 2: past that nobody can see the difference, and a 3x phone would
 * otherwise ask for 4K over a cellular connection.
 *
 * A visitor who has asked to save data, or whose connection reports itself
 * as slow, gets the lightest encode regardless; a phone never starts above
 * HD. Anyone can still pick a higher rung from the menu.
 */
export function autoQuality(sources: Source[], view: Viewing): Source | undefined {
  if (sources.length === 0) return undefined;
  const lightest = sources[sources.length - 1];
  if (view.saveData || /(?:^|-)(?:2g|3g)$/.test(view.effectiveType ?? "")) return lightest;

  let target = view.longEdge * Math.min(Math.max(view.dpr, 1), 2);
  if (view.narrow) target = Math.min(target, 1920);

  for (let i = sources.length - 1; i >= 0; i--) {
    if (sources[i].width >= target * 0.85) return sources[i];
  }
  return sources[0];
}

/** The browser's answer to the questions above. Client only. */
export function viewingNow(): Viewing {
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  return {
    longEdge: Math.max(window.screen.width, window.screen.height),
    dpr: window.devicePixelRatio || 1,
    saveData: nav.connection?.saveData,
    effectiveType: nav.connection?.effectiveType,
    narrow: window.matchMedia("(max-width: 767px)").matches,
  };
}
