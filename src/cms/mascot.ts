import { resolveImage } from "./media";
import type { ChapterKey } from "@/data/routes";

/**
 * Which mascot stands on a hero.
 *
 * The admin's Hero Mascot screen sets all of them in one place, and the
 * same two fields are still reachable where they are stored. "Brand &
 * contact" holds the house mascot, which every hero uses by default and
 * which the menu, the footer and the "Still stuck?" card always use. Each
 * row of "Page titles & SEO" can replace him on that one page — Limon in
 * headphones on Rooms, Limon with a tote on Shop — and leaving that field
 * empty hands the page back to the house mascot.
 *
 * Every step falls through on an image that cannot be shown, not only an
 * empty one: a manifest key for artwork that has since been removed
 * resolves to nothing, and a hero with a hole where the largest paint on
 * the page should be is worse than the house mascot standing in.
 */

export const HOUSE_MASCOT = "limon-mascot";

/** The committed artwork's canvas — the shape every replacement should keep. */
export const MASCOT_WIDTH = 1024;
export const MASCOT_HEIGHT = 1169;

/** The pages whose hero has a stage for him: every chapter but the Journal,
 * whose masthead is set as a newspaper front page and has none. */
export const MASCOT_PAGES: ChapterKey[] = [
  "home",
  "rooms",
  "label",
  "shop",
  "crew",
  "about",
  "contact",
];
export const HOUSE_MASCOT_ALT =
  "Limon, the Limon Bandit mascot: a lemon in a bandana and leather jacket";

export type Mascot = { src: string; alt: string };

type Slot = { mascot?: string; mascotAlt?: string } | null | undefined;

const usable = (v: string | undefined) => resolveImage(v).kind !== "none";
const filled = (v: string | undefined) => (typeof v === "string" && v.trim() ? v.trim() : "");

export function pickMascot(page: Slot, house: Slot): Mascot {
  const houseAlt = filled(house?.mascotAlt) || HOUSE_MASCOT_ALT;
  if (usable(page?.mascot)) {
    /* A page's own picture with no description of its own is still the
     * mascot, so the house description is closer than nothing. */
    return { src: filled(page?.mascot), alt: filled(page?.mascotAlt) || houseAlt };
  }
  if (usable(house?.mascot)) return { src: filled(house?.mascot), alt: houseAlt };
  return { src: HOUSE_MASCOT, alt: HOUSE_MASCOT_ALT };
}

/** One mascot slot as the Hero Mascot screen edits it. */
export type MascotFields = { mascot: string; mascotAlt: string };

/** Everything the Hero Mascot screen edits: the house slot and one per page. */
export type MascotDraft = { house: MascotFields; pages: Record<string, MascotFields> };

type Doc = Record<string, unknown>;

/**
 * Lay the Hero Mascot screen's edits onto the stored documents.
 *
 * Only `mascot` and `mascotAlt` are written. The screen saves into
 * `global.site` and `global.pages`, which also hold the contact details,
 * every page's heading and its search-engine text, so it is handed the
 * documents as they are *now* — fetched again at the moment of saving —
 * and everything else in them passes through untouched. A heading edited
 * in Page titles & SEO while this screen was open survives the save.
 *
 * A page with no row yet takes its committed row from `seedRows`, so an
 * edit to it is never silently dropped.
 */
export function applyMascots(
  site: unknown,
  rows: unknown,
  draft: MascotDraft,
  seedRows: unknown,
): { site: Doc; pages: Doc[] } {
  const baseSite = site && typeof site === "object" ? (site as Doc) : {};
  const nextSite: Doc = { ...baseSite, ...draft.house };

  const base = (Array.isArray(rows) ? rows : []) as Doc[];
  const nextRows = base.map((r) => {
    const edit = r && typeof r.key === "string" ? draft.pages[r.key] : undefined;
    return edit ? { ...r, ...edit } : r;
  });
  const seeds = (Array.isArray(seedRows) ? seedRows : []) as Doc[];
  for (const [key, edit] of Object.entries(draft.pages)) {
    if (nextRows.some((r) => r?.key === key)) continue;
    const seed = seeds.find((r) => r?.key === key);
    if (seed) nextRows.push({ ...seed, ...edit });
  }
  return { site: nextSite, pages: nextRows };
}
