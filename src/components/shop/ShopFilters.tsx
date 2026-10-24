import { X } from "lucide-react";
import { SORTS } from "@/data/shop";
import { PRICE_BANDS, type Filters } from "@/lib/shop-filters";
import { useWords } from "@/cms/hooks";
import { fill } from "@/cms/words";
import { bandLabel, sortLabel } from "@/lib/shop-words";

/**
 * The filter panel, used twice: inline down the side on a desktop, and
 * inside a sheet on a phone.
 *
 * One component for both, because two would drift — a price band added to
 * the desktop column and forgotten on the phone is exactly the bug this
 * shape prevents.
 */

export function FilterPanel({
  filters,
  onChange,
  sizes,
  counts,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
  /** every size that exists in the catalogue, in run order */
  sizes: string[];
  /** how many products each price band would show, from the unfiltered list */
  counts: Map<string, number>;
}) {
  const w = useWords("shop");
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="t-label text-mute">{w.filterPrice}</legend>
        <ul className="mt-3 flex flex-wrap gap-2">
          {PRICE_BANDS.map((b) => {
            const n = counts.get(b.id) ?? 0;
            const on = filters.price === b.id;
            return (
              <li key={b.id}>
                <button
                  type="button"
                  disabled={n === 0}
                  aria-pressed={on}
                  onClick={() => set("price", on ? null : b.id)}
                  className={`flex h-11 items-center gap-2 px-3 font-ui text-[12px] font-semibold transition-colors duration-300 disabled:opacity-35 ${
                    on
                      ? "bg-acid text-accent-text"
                      : "border border-line text-mute hover:border-acid-type hover:text-text"
                  }`}
                >
                  {bandLabel(w, b)}
                  <span className="tnum text-[10px] opacity-70">{n}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      {sizes.length ? (
        <fieldset>
          <legend className="t-label text-mute">{w.filterSize}</legend>
          <ul className="mt-3 flex flex-wrap gap-2">
            {sizes.map((s) => {
              const on = filters.size === s;
              return (
                <li key={s}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => set("size", on ? null : s)}
                    className={`flex h-11 min-w-11 items-center justify-center px-3 font-ui text-[13px] font-semibold transition-colors duration-300 ${
                      on
                        ? "bg-acid text-accent-text"
                        : "border border-line text-text hover:border-acid-type"
                    }`}
                  >
                    {s}
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ) : null}

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={filters.inStock}
          onChange={(e) => set("inStock", e.target.checked)}
          className="h-5 w-5 accent-[color:var(--accent)]"
        />
        <span className="font-ui text-[14px] text-text">{w.filterInStockOnly}</span>
      </label>

      <fieldset>
        <legend className="t-label text-mute">{w.filterSort}</legend>
        <ul className="mt-3 space-y-2">
          {SORTS.map((s) => (
            <li key={s.id}>
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="shop-sort-panel"
                  checked={filters.sort === s.id}
                  onChange={() => set("sort", s.id)}
                  className="h-4 w-4 accent-[color:var(--accent)]"
                />
                <span className="font-ui text-[14px] text-text">{sortLabel(w, s)}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
    </div>
  );
}

/** What is currently narrowing the grid, and a way to undo each one. */
export function ActiveFilters({
  filters,
  categoryLabel,
  onClearCategory,
  onChange,
  onClearAll,
}: {
  filters: Filters;
  categoryLabel: string | null;
  onClearCategory: () => void;
  onChange: (next: Filters) => void;
  onClearAll: () => void;
}) {
  const w = useWords("shop");
  const band = PRICE_BANDS.find((b) => b.id === filters.price);
  const chips: { key: string; label: string; clear: () => void }[] = [];

  if (categoryLabel) chips.push({ key: "cat", label: categoryLabel, clear: onClearCategory });
  if (band)
    chips.push({
      key: "price",
      label: bandLabel(w, band),
      clear: () => onChange({ ...filters, price: null }),
    });
  if (filters.size)
    chips.push({
      key: "size",
      label: fill(w.chipSize, { size: filters.size }),
      clear: () => onChange({ ...filters, size: null }),
    });
  if (filters.inStock)
    chips.push({
      key: "stock",
      label: w.chipInStock,
      clear: () => onChange({ ...filters, inStock: false }),
    });

  if (chips.length === 0) return null;

  return (
    <ul className="mt-4 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <li key={c.key}>
          <button
            type="button"
            onClick={c.clear}
            className="flex h-11 items-center gap-2 border border-line-strong px-3 font-ui text-[12px] text-text transition-colors duration-300 hover:border-acid-type"
          >
            {c.label}
            <X size={13} aria-hidden="true" />
            <span className="sr-only">{w.chipRemove}</span>
          </button>
        </li>
      ))}
      {chips.length > 1 ? (
        <li>
          <button
            type="button"
            onClick={onClearAll}
            className="tap h-11 px-2 font-ui text-[12px] text-mute underline decoration-line underline-offset-4 hover:text-text"
          >
            {w.chipClearAll}
          </button>
        </li>
      ) : null}
    </ul>
  );
}
