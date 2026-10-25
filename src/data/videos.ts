import type { ImageKey } from "@/generated/images";

/**
 * The label's films.
 *
 * Every row can carry up to three encodes of the same film — 2160p, 1080p
 * and 720p — and the player offers whichever exist, starting on the one the
 * screen and connection can use (see lib/video.ts). A row with no files can
 * instead carry a YouTube or Vimeo link, which plays in their own player;
 * both stream up to 4K themselves.
 *
 * `feature` puts a film on the label page. The first three ticked, in list
 * order, are the cards; a film with nothing to play is never featured,
 * because a card that opens onto an empty screen is worse than no card.
 */
export type Video = {
  feature: boolean;
  title: string;
  artist: string;
  director: string;
  year: string;
  /** display only — the player reads the real length off the file */
  runtime: string;
  /** one line under the title in the player */
  note: string;
  /** the card, 4:5 */
  cover: ImageKey | string;
  /** the player's first frame, 16:9 — falls back to the cover */
  still: ImageKey | string;
  src2160: string;
  src1080: string;
  src720: string;
  /** YouTube or Vimeo — used only when there are no files */
  embed: string;
};

// REPLACE — the films. The credits come from the roster and the crew list;
// the footage is a placeholder built from each release's artwork and its
// placeholder audio by scripts/films.mjs. Drop the real masters into
// public/video/ under the same names, or point these at wherever they live.
export const videos: Video[] = [
  {
    feature: true,
    title: "Rusted Gold",
    artist: "Rana & The Strays",
    director: "Ishaan Roy",
    year: "2025",
    runtime: "",
    note: "One take, one camera, live in Room A.",
    cover: "release-01-flat",
    still: "release-01",
    src2160: "/video/rusted-gold-2160.mp4",
    src1080: "",
    src720: "",
    embed: "",
  },
  {
    feature: true,
    title: "Terminus",
    artist: "Tram No. 12",
    director: "Ishaan Roy",
    year: "2024",
    runtime: "",
    note: "The last tram of the night, scored live off the desk.",
    cover: "release-04-flat",
    still: "release-04",
    src2160: "/video/terminus-2160.mp4",
    src1080: "",
    src720: "",
    embed: "",
  },
  {
    feature: true,
    title: "Park Circus Edits",
    artist: "DJ Shona",
    director: "Ritu Banerjee",
    year: "2023",
    runtime: "",
    note: "Four cameras and a live mix, off the club floor.",
    cover: "release-06-flat",
    still: "release-06",
    src2160: "/video/park-circus-2160.mp4",
    src1080: "",
    src720: "",
    embed: "",
  },
  {
    feature: false,
    title: "Basement Tapes Vol. 2",
    artist: "Kaalo",
    director: "Devika Mitra",
    year: "2025",
    runtime: "",
    note: "A narrative film, written before a frame was shot.",
    cover: "release-02-flat",
    still: "release-02",
    src2160: "",
    src1080: "",
    src720: "",
    embed: "",
  },
];
