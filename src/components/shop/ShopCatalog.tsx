import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { BoundaryRule, GridRules } from "@/components/lb/GridRules";
import { Eyebrow } from "@/components/lb/Section";
import { Modal } from "@/components/lb/Modal";
import { ProductCard } from "./ProductCard";
import { ProductSheet } from "./ProductSheet";
import { ProductRail } from "./ProductRail";
import { ActiveFilters, FilterPanel } from "./ShopFilters";
import { EMPTY_FILTERS, PRICE_BANDS, type Filters } from "@/lib/shop-filters";
import {
  categories,
  categoryById,
  SORTS,
  DEFAULT_CATEGORY,
  DEFAULT_SORT,
  type SortId,
} from "@/data/shop";
import { useProducts, useSection, type ProductDoc as Product } from "@/cms/hooks";
import { readRecent } from "@/lib/recent";

/**
 * The catalogue.
 *
 * Three controls, deliberately different shapes because they do different
 * jobs. Categories are a strip of chips — you are picking one of a known,
 * short list, and seeing the whole list is the point. Search is for the
 * person who arrived knowing the word "hoodie". Filters (price, size, in
 * stock) narrow what is left, and on a phone they live in a sheet behind one
 * button rather than eating the top of the screen — the pattern every large
 * shop settled on for the same reason.
 *
 * On a phone the chip strip is a single row that scrolls sideways, snapped
 * and masked at the right edge, because a horizontal strip that gives no
 * sign it continues is a strip most people never scroll.
 *
 * Counts come from the full catalogue, not the current view, so the strip
 * says what switching would get you rather than what you are already looking
 * at. An empty category is disabled rather than hidden: a "Women" chip that
 * vanishes when the last piece sells looks like a bug, and someone who came
 * for it deserves to see that it exists and is empty today.
 */
export function ShopCatalog() {
  const copy = useSection("shop", "catalogue");
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORY);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS(DEFAULT_SORT));
  const [panelOpen, setPanelOpen] = useState(false);
  const [sheetFor, setSheetFor] = useState<Product | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  /* The catalogue itself is CMS content — prices, stock and which products
   * exist are all editable. The category definitions are not: each one owns a
   * predicate over a product's shape, which is code, not copy. So the list
   * comes from the CMS and the filtering from data/shop.ts. */
  const products = useProducts();

  /* Every size in the shop, in the order the runs list them, so the filter
   * reads S M L XL rather than alphabetically. */
  const sizes = useMemo(() => {
    const seen: string[] = [];
    for (const p of products) for (const s of p.sizes ?? []) if (!seen.includes(s)) seen.push(s);
    return seen;
  }, [products]);

  const matchesText = (p: Product, q: string) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return [p.title, p.by, p.kind, p.blurb, p.run]
      .filter(Boolean)
      .some((f) => String(f).toLowerCase().includes(needle));
  };

  const shown = useMemo(() => {
    const cat = categoryById(category);
    const band = PRICE_BANDS.find((b) => b.id === filters.price);
    const list = products.filter((p) => {
      if (!cat.match(p as never)) return false;
      if (!matchesText(p, query)) return false;
      if (band && (p.price < band.min || p.price > band.max)) return false;
      if (filters.size && !(p.sizes ?? []).includes(filters.size)) return false;
      if (filters.inStock && p.stock <= 0 && !p.digital) return false;
      return true;
    });
    if (filters.sort === "price-desc") return [...list].sort((a, b) => b.price - a.price);
    if (filters.sort === "price-asc") return [...list].sort((a, b) => a.price - b.price);
    return list;
  }, [products, category, query, filters]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of categories) map.set(c.id, products.filter((p) => c.match(p as never)).length);
    return map;
  }, [products]);

  /* Price counts respect the category and the search, so a band never
   * promises items the current view cannot show. */
  const priceCounts = useMemo(() => {
    const cat = categoryById(category);
    const base = products.filter((p) => cat.match(p as never) && matchesText(p, query));
    const map = new Map<string, number>();
    for (const b of PRICE_BANDS) {
      map.set(b.id, base.filter((p) => p.price >= b.min && p.price <= b.max).length);
    }
    return map;
  }, [products, category, query]);

  /* Recently viewed, from this browser only. Resolved against the live
   * catalogue so a product that has since been removed simply drops out. */
  const [recentIds, setRecentIds] = useState<string[]>([]);
  useEffect(() => setRecentIds(readRecent()), []);
  const recent = useMemo(
    () =>
      recentIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p)),
    [recentIds, products],
  );

  const active = categoryById(category);
  const filtered =
    query.trim().length > 0 ||
    category !== DEFAULT_CATEGORY ||
    filters.price !== null ||
    filters.size !== null ||
    filters.inStock;

  const clearAll = () => {
    setCategory(DEFAULT_CATEGORY);
    setQuery("");
    setFilters(EMPTY_FILTERS(filters.sort));
  };

  const openSheet = (p: Product) => {
    setSheetFor(p);
    setSheetOpen(true);
  };

  return (
    <section id="catalogue" className="relative w-full bg-surface-deep py-20 lg:py-[96px]">
      <GridRules tone="dark" />
      <BoundaryRule tone="dark" className="top-0" />

      <div className="shell relative z-[2]">
        <div className="section-head">
          <div className="md:col-span-1">
            <Eyebrow tone="dark" surface="bg-surface-deep">
              {copy.eyebrow}
            </Eyebrow>
          </div>
          <div className="md:col-span-2">
            <h2 className="t-h2 text-text">{copy.heading}</h2>
          </div>
          <div className="flex items-end md:col-span-1">
            <p className="font-ui text-[16px] leading-[1.5] text-mute">{active.note}</p>
          </div>
        </div>

        {/* ---- search ---- */}
        <div className="mt-10 flex items-center gap-2 border border-line px-3 focus-within:border-acid-type lg:mt-12 lg:max-w-[420px]">
          <Search size={16} className="shrink-0 text-mute" aria-hidden="true" />
          <label className="sr-only" htmlFor="shop-search">
            Search the shop
          </label>
          <input
            id="shop-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tee, hoodie, vinyl, an artist…"
            className="h-12 min-w-0 flex-1 bg-transparent font-ui text-[15px] text-text outline-none placeholder:text-[color:var(--placeholder)]"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear the search"
              className="-mr-1 flex h-11 w-11 shrink-0 items-center justify-center text-mute hover:text-text"
            >
              <X size={15} />
            </button>
          ) : null}
        </div>

        {/* ---- categories ---- */}
        <div className="mt-6 border-y border-line py-4 lg:flex lg:items-center lg:justify-between lg:gap-8 lg:py-6">
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
                      className={`flex h-11 items-baseline gap-1.5 px-3 font-ui text-[11px] font-bold uppercase tracking-[0.12em] transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-40 lg:h-auto lg:gap-2 lg:py-2 lg:tracking-[0.14em] ${
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

          {/* Sort stays a select on a desktop, where it is one control among
              several in a row; on a phone it moves into the filter sheet so
              the strip above keeps the whole width. */}
          <div className="mt-3 hidden shrink-0 items-center justify-end gap-3 lg:mt-0 lg:flex">
            <label
              htmlFor="shop-sort"
              className="font-ui text-[10px] font-bold uppercase tracking-[0.18em] text-mute"
            >
              Sort
            </label>
            <select
              id="shop-sort"
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value as SortId })}
              className="h-11 border border-line bg-surface-deep px-3 font-ui text-[12px] font-semibold uppercase tracking-[0.08em] text-text outline-none transition-colors duration-300 focus:border-acid-type"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
          {/* ---- filters: a column on a desktop ---- */}
          <aside className="hidden lg:block">
            <h3 className="font-display text-[16px] font-extrabold uppercase tracking-[-0.01em] text-text">
              Narrow it
            </h3>
            <div className="mt-6">
              <FilterPanel
                filters={filters}
                onChange={setFilters}
                sizes={sizes}
                counts={priceCounts}
              />
            </div>
          </aside>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p aria-live="polite" className="t-label text-mute">
                {shown.length} {shown.length === 1 ? "item" : "items"}
                {category !== DEFAULT_CATEGORY ? ` in ${active.label}` : ""}
                {query.trim() ? ` for “${query.trim()}”` : ""}
              </p>

              {/* One button on a phone, because two rows of controls above a
                  two-column grid leaves no grid. */}
              <button
                type="button"
                onClick={() => setPanelOpen(true)}
                className="flex h-11 items-center gap-2 border border-line px-3 font-ui text-[12px] font-bold uppercase tracking-[0.1em] text-text transition-colors duration-300 hover:border-acid-type lg:hidden"
              >
                <SlidersHorizontal size={14} />
                Filter &amp; sort
              </button>
            </div>

            <ActiveFilters
              filters={filters}
              categoryLabel={category === DEFAULT_CATEGORY ? null : active.label}
              onClearCategory={() => setCategory(DEFAULT_CATEGORY)}
              onChange={setFilters}
              onClearAll={clearAll}
            />

            {shown.length === 0 ? (
              <div className="mt-8 max-w-[52ch]">
                <p className="font-ui text-[16px] leading-[1.6] text-mute">
                  {query.trim()
                    ? `Nothing matches “${query.trim()}”.`
                    : `Nothing in ${active.label} right now.`}{" "}
                  The runs are small and they do not come back — try another category, or join the
                  list and we will say when the next one drops.
                </p>
                {filtered ? (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="mt-5 flex h-11 items-center border border-line-strong px-5 font-ui text-[12px] font-bold uppercase tracking-[0.1em] text-text transition-colors duration-300 hover:border-acid-type"
                  >
                    Show everything
                  </button>
                ) : null}
              </div>
            ) : (
              /* Two columns on a phone. One column with a square photo made
                 each card ~630px tall; twenty of those is a 12,000px scroll
                 to see a shop that fits on one desk. */
              <ul className="mt-6 grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-3">
                {shown.map((p) => (
                  <ProductCard key={p.id} product={p} onOpen={openSheet} />
                ))}
              </ul>
            )}

            <p className="t-label mt-6 max-w-[56ch] text-mute lg:mt-8">
              Pay on delivery. Orders go straight to the people who pack them, and we confirm stock
              by hand before anything is dispatched.
            </p>
          </div>
        </div>
      </div>

      {recent.length > 1 ? (
        <div className="mt-16">
          <ProductRail
            title="You were looking at"
            standfirst="Kept in this browser, nowhere else."
            products={recent}
          />
        </div>
      ) : null}

      <ProductSheet product={sheetFor} open={sheetOpen} onClose={() => setSheetOpen(false)} />

      {/* The phone's filter sheet — the same panel, in a drawer. */}
      <Modal
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title="Filter & sort"
        standfirst={`${shown.length} ${shown.length === 1 ? "item" : "items"} match right now.`}
        variant="sheet"
      >
        <FilterPanel filters={filters} onChange={setFilters} sizes={sizes} counts={priceCounts} />
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={clearAll}
            className="flex h-[52px] flex-1 items-center justify-center border border-line font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-text"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => setPanelOpen(false)}
            className="flex h-[52px] flex-1 items-center justify-center bg-acid font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-accent-text"
          >
            Show {shown.length}
          </button>
        </div>
      </Modal>
    </section>
  );
}
