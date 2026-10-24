import { fill, type Words } from "@/cms/words";
import { inr } from "@/lib/money";
import type { PriceBand } from "@/lib/shop-filters";

/**
 * The shop's category, sort and price-band names, from the shop wording.
 *
 * The ids — and which products each category matches, and where each band
 * starts and ends — stay in code: they are how the catalogue filters. Only
 * the name a visitor reads is the editor's. A category or sort added in
 * code before anyone has written its name falls back to its committed one.
 */
type ShopWords = Words["shop"];

const CATEGORY: Record<string, keyof ShopWords> = {
  all: "catAll",
  men: "catMen",
  women: "catWomen",
  cd: "catCd",
  vinyl: "catVinyl",
  digital: "catDigital",
  poster: "catPoster",
  accessory: "catAccessory",
};

const SORT: Record<string, keyof ShopWords> = {
  featured: "sortFeatured",
  "price-desc": "sortPriceDesc",
  "price-asc": "sortPriceAsc",
};

export function categoryLabel(w: ShopWords, c: { id: string; label: string }): string {
  const k = CATEGORY[c.id];
  return (k && w[k]) || c.label;
}

export function sortLabel(w: ShopWords, s: { id: string; label: string }): string {
  const k = SORT[s.id];
  return (k && w[k]) || s.label;
}

export function bandLabel(w: ShopWords, b: PriceBand): string {
  if (b.min <= 0) return fill(w.bandUnder, { amount: inr(b.max + 1) });
  if (b.max >= Number.MAX_SAFE_INTEGER) return fill(w.bandOver, { amount: inr(b.min - 1) });
  return fill(w.bandRange, { min: inr(b.min), max: inr(b.max) });
}
