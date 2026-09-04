import { useMemo, useState } from "react";
import { BoundaryRule, GridRules } from "@/components/lb/GridRules";
import { Eyebrow } from "@/components/lb/Section";
import { ProductCard } from "./ProductCard";
import { ProductSheet } from "./ProductSheet";
import {
  categories,
  categoryById,
  SORTS,
  DEFAULT_CATEGORY,
  DEFAULT_SORT,
  type SortId,
} from "@/data/shop";
import { useProducts, type ProductDoc as Product } from "@/cms/hooks";

/**
 * The catalogue.
 *
 * Two controls, deliberately different shapes because they do different jobs.
 * Categories are a strip of chips — you are picking one of a known, short
 * list, and seeing the whole list is the point. Sort is a select — the
 * options are mutually exclusive orderings and nobody browses them.
 *
 * On a phone that chip strip wrapped to four rows and pushed the first
 * product most of a screen down, so below `sm` it is a single row that
 * scrolls sideways. The scroll is snapped and the row is masked at the right
 * edge, because a horizontal strip that gives no sign it continues is a strip
 * most people never scroll.
 *
 * Counts come from the full catalogue, not the current view, so the strip
 * says what switching would get you rather than what you are already looking
 * at. An empty category is disabled rather than hidden: a "Women" chip that
 * vanishes when the last piece sells looks like a bug, and someone who came
 * for it deserves to see that it exists and is empty today.
 */
export function ShopCatalog() {
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORY);
  const [sort, setSort] = useState<SortId>(DEFAULT_SORT);
  const [sheetFor, setSheetFor] = useState<Product | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  /* The catalogue itself is CMS content — prices, stock and which products
   * exist are all editable. The category definitions are not: each one owns a
   * predicate over a product's shape, which is code, not copy. So the list
   * comes from the CMS and the filtering from data/shop.ts. */
  const products = useProducts();

  const shown = useMemo(() => {
    const cat = categoryById(category);
    const list = products.filter((p) => cat.match(p as never));
    if (sort === "price-desc") return [...list].sort((a, b) => b.price - a.price);
    if (sort === "price-asc") return [...list].sort((a, b) => a.price - b.price);
    return list;
  }, [products, category, sort]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of categories) map.set(c.id, products.filter((p) => c.match(p as never)).length);
    return map;
  }, [products]);

  const active = categoryById(category);

  const openSheet = (p: Product) => {
    setSheetFor(p);
    setSheetOpen(true);
  };

  return (
    <section id="catalogue" className="relative w-full bg-surface-deep py-20 lg:py-[120px]">
      <GridRules tone="dark" />
      <BoundaryRule tone="dark" className="top-0" />

      <div className="shell relative z-[2]">
        <div className="section-head">
          <div className="md:col-span-1">
            <Eyebrow tone="dark" surface="bg-surface-deep">
              In the shop
            </Eyebrow>
          </div>
          <div className="md:col-span-2">
            <h2 className="t-h2 text-text">Everything currently for sale</h2>
          </div>
          <div className="flex items-end md:col-span-1">
            <p className="font-ui text-[16px] leading-[1.5] text-mute">{active.note}</p>
          </div>
        </div>

        {/* ---- filters ---- */}
        <div className="mt-10 border-y border-line py-4 lg:mt-16 lg:flex lg:items-center lg:justify-between lg:gap-8 lg:py-6">
          <nav aria-label="Product categories" className="relative min-w-0">
            {/* The strip bleeds through the shell's gutter on a phone so the
                last chip runs to the screen edge — a chip that stops short
                of the edge reads as the end of the list. */}
            <ul className="-mx-[var(--grid-gutter)] flex snap-x snap-mandatory gap-2 overflow-x-auto px-[var(--grid-gutter)] pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:pb-0">
              {categories.map((c) => {
                const n = counts.get(c.id) ?? 0;
                const on = c.id === category;
                return (
                  <li key={c.id} className="shrink-0 snap-start">
                    <button
                      type="button"
                      onClick={() => setCategory(c.id)}
                      aria-pressed={on}
                      disabled={n === 0}
                      className={`flex h-10 items-baseline gap-1.5 px-3 font-ui text-[11px] font-bold uppercase tracking-[0.12em] transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-40 lg:h-auto lg:gap-2 lg:py-2 lg:tracking-[0.14em] ${
                        on
                          ? "bg-acid text-accent-text"
                          : "border border-line text-mute hover:border-acid-type hover:text-text"
                      }`}
                    >
                      {c.label}
                      <span className="tnum text-[10px] opacity-70">{n}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {/* Fade at the right edge: the only honest signal that a
                horizontal strip continues past the fold. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-[calc(var(--grid-gutter)*-1)] w-10 bg-gradient-to-l from-surface-deep to-transparent lg:hidden"
            />
          </nav>

          <div className="mt-3 flex shrink-0 items-center justify-between gap-3 lg:mt-0 lg:justify-end">
            <label
              htmlFor="shop-sort"
              className="font-ui text-[10px] font-bold uppercase tracking-[0.18em] text-mute"
            >
              Sort
            </label>
            <select
              id="shop-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortId)}
              className="h-10 min-w-0 flex-1 border border-line bg-surface-deep px-3 font-ui text-[12px] font-semibold uppercase tracking-[0.08em] text-text outline-none transition-colors duration-300 focus:border-acid-type lg:h-11 lg:flex-none"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p aria-live="polite" className="t-label mt-5 text-mute lg:mt-6">
          {shown.length} {shown.length === 1 ? "item" : "items"}
          {category !== DEFAULT_CATEGORY ? ` in ${active.label}` : ""}
        </p>

        {shown.length === 0 ? (
          <p className="mt-8 max-w-[52ch] font-ui text-[16px] leading-[1.6] text-mute lg:mt-10">
            Nothing in {active.label} right now. The runs are small and they do not come back — try
            another category, or join the list and we will say when the next one drops.
          </p>
        ) : (
          /* Two columns on a phone. One column with a square photo made each
             card ~630px tall; twenty of those is a 12,000px scroll to see a
             shop that fits on one desk. */
          <ul className="mt-6 grid grid-cols-2 gap-px border border-line bg-line lg:mt-10 lg:grid-cols-3">
            {shown.map((p) => (
              <ProductCard key={p.id} product={p} onOpen={openSheet} />
            ))}
          </ul>
        )}

        <p className="t-label mt-6 max-w-[56ch] text-mute lg:mt-8">
          Pay on delivery. Orders go straight to the people who pack them, and we confirm stock by
          hand before anything is dispatched.
        </p>
      </div>

      <ProductSheet product={sheetFor} open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </section>
  );
}
