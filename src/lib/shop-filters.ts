import type { SortId } from "@/data/shop";
import { inr } from "./money";

/**
 * What the shop can be narrowed by.
 *
 * Bands rather than a slider: a slider on a catalogue of twenty items is a
 * precision instrument for a question nobody is asking, and it is miserable
 * on a phone. Four ranges cover how people actually shop a merch table.
 */

export type PriceBand = { id: string; label: string; min: number; max: number };

export const PRICE_BANDS: PriceBand[] = [
  { id: "under-1000", label: `Under ${inr(1000)}`, min: 0, max: 999 },
  { id: "1000-2000", label: `${inr(1000)} – ${inr(2000)}`, min: 1000, max: 2000 },
  { id: "2000-4000", label: `${inr(2000)} – ${inr(4000)}`, min: 2000, max: 4000 },
  { id: "over-4000", label: `Over ${inr(4000)}`, min: 4001, max: Number.MAX_SAFE_INTEGER },
];

export type Filters = {
  price: string | null;
  size: string | null;
  inStock: boolean;
  sort: SortId;
};

export const EMPTY_FILTERS = (sort: SortId): Filters => ({
  price: null,
  size: null,
  inStock: false,
  sort,
});
