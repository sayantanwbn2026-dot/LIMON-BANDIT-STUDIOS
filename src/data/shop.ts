import type { ImageKey } from "@/generated/images";

/**
 * The shop catalogue.
 *
 * Two things are deliberately separate here, because they answer different
 * questions and a shopper uses them differently:
 *
 *   `department` — who it is cut for. Men, Women, or Unisex. Only apparel and
 *     accessories have a real answer; a CD has no gender, so it is "Unisex"
 *     and the Men/Women filters simply do not claim it.
 *
 *   `kind` — what the object is. Tee, CD, vinyl, digital, poster, accessory.
 *
 * Filtering on one must not silently filter on the other: picking "Women"
 * should not hide the records, and picking "Posters" should not hide half of
 * them because they were tagged for men. So the category strip below mixes
 * both axes into one list of named filters, and each one carries its own
 * predicate rather than matching a single field.
 *
 * PRICES ARE INTEGER RUPEES. Never a formatted string, never a float — a
 * cart adds them up and `"₹1,800"` cannot be added to anything. Render them
 * through `inr()` in @/lib/money.
 *
 * REPLACE: every `image` here points at existing site artwork, because there
 * is no product photography in the repo yet. Shoot the real runs, drop them
 * in src/assets, run `bun run images`, and swap the keys.
 */

export type Department = "men" | "women" | "unisex";

export type ProductKind = "tee" | "outerwear" | "cd" | "vinyl" | "digital" | "poster" | "accessory";

export type Product = {
  id: string;
  /** catalogue index, printed on the card */
  index: string;
  title: string;
  /** the artist, or "House Merch" for own-label goods */
  by: string;
  kind: ProductKind;
  department: Department;
  /** integer rupees */
  price: number;
  /** what it was before, for a struck-through was-price. Omit when never discounted. */
  compareAt?: number;
  image: ImageKey;
  /** one line on the card, a sentence on the product */
  blurb: string;
  /** size run, or null for things that do not have sizes */
  sizes?: string[];
  /** how many exist. Nothing is repressed. */
  run: string;
  stock: number;
  /** digital goods skip the address step and cost nothing to ship */
  digital?: boolean;
};

export const products: Product[] = [
  // ---- apparel: men ----
  {
    id: "p01",
    index: "01",
    title: "Bandit Tee — Run 04",
    by: "House Merch",
    kind: "tee",
    department: "men",
    price: 1400,
    image: "merch-tee",
    blurb: "Heavyweight cotton, screen printed in Kolkata. Boxy men's cut.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    run: "150 printed",
    stock: 42,
  },
  {
    id: "p02",
    index: "02",
    title: "Lockout Hoodie",
    by: "House Merch",
    kind: "outerwear",
    department: "men",
    price: 3200,
    compareAt: 3800,
    image: "room-lockout",
    blurb: "For the 4am end of a lockout. Brushed inside, dropped shoulder.",
    sizes: ["M", "L", "XL", "XXL"],
    run: "80 made",
    stock: 17,
  },
  {
    id: "p03",
    index: "03",
    title: "Engineer's Work Shirt",
    by: "House Merch",
    kind: "outerwear",
    department: "men",
    price: 2600,
    image: "room-booth",
    blurb: "Twill, two chest pockets, patch on the sleeve. What the desk wears.",
    sizes: ["S", "M", "L", "XL"],
    run: "60 made",
    stock: 9,
  },

  // ---- apparel: women ----
  {
    id: "p04",
    index: "04",
    title: "Bandit Tee — Fitted",
    by: "House Merch",
    kind: "tee",
    department: "women",
    price: 1400,
    image: "merch-tee",
    blurb: "Same print, same cotton, cut close with a shorter body.",
    sizes: ["XS", "S", "M", "L", "XL"],
    run: "150 printed",
    stock: 51,
  },
  {
    id: "p05",
    index: "05",
    title: "Tram FM Crop Tee",
    by: "House Merch",
    kind: "tee",
    department: "women",
    price: 1250,
    image: "wall-03",
    blurb: "Cropped, acid print pulled from the Tram FM session posters.",
    sizes: ["XS", "S", "M", "L"],
    run: "90 printed",
    stock: 23,
  },
  {
    id: "p06",
    index: "06",
    title: "Salt Line Bomber",
    by: "House Merch",
    kind: "outerwear",
    department: "women",
    price: 4200,
    compareAt: 4800,
    image: "room-b",
    blurb: "Lined bomber, embroidered back. Made once, for the Salt Line run.",
    sizes: ["XS", "S", "M", "L"],
    run: "40 made",
    stock: 6,
  },

  // ---- CDs ----
  {
    id: "p07",
    index: "07",
    title: "Rusted Gold — CD",
    by: "Nabeel & The Meter",
    kind: "cd",
    department: "unisex",
    price: 600,
    image: "release-01",
    blurb: "Digipak with a printed inner sleeve and the session notes.",
    run: "200 pressed",
    stock: 88,
  },
  {
    id: "p08",
    index: "08",
    title: "Grain / Static — CD",
    by: "Fourth Room",
    kind: "cd",
    department: "unisex",
    price: 450,
    image: "release-05",
    blurb: "The EP on disc, cut from the same master as the vinyl.",
    run: "50 pressed",
    stock: 12,
  },
  {
    id: "p09",
    index: "09",
    title: "Nightcall Radio — 2CD",
    by: "House Compilation",
    kind: "cd",
    department: "unisex",
    price: 950,
    image: "release-04",
    blurb: "Twenty-one tracks across two discs. Everything the house cut in 2025.",
    run: "300 pressed",
    stock: 104,
  },

  // ---- vinyl ----
  {
    id: "p10",
    index: "10",
    title: 'Rusted Gold — 12"',
    by: "Nabeel & The Meter",
    kind: "vinyl",
    department: "unisex",
    price: 1800,
    image: "release-01",
    blurb: "180g black, single sleeve. Includes the digital download.",
    run: "300 pressed",
    stock: 31,
  },
  {
    id: "p11",
    index: "11",
    title: 'Second Language — 12" Clear',
    by: "Meher",
    kind: "vinyl",
    department: "unisex",
    price: 2200,
    image: "release-06",
    blurb: "Clear vinyl, hand-numbered. Ships when the plant delivers.",
    run: "250 pressed",
    stock: 74,
  },

  // ---- digital ----
  {
    id: "p12",
    index: "12",
    title: "Terminus — Digital",
    by: "Kobra Blue",
    kind: "digital",
    department: "unisex",
    price: 180,
    image: "release-02",
    blurb: "24-bit WAV and MP3. Download link by email, no shipping.",
    run: "Digital",
    stock: 9999,
    digital: true,
  },
  {
    id: "p13",
    index: "13",
    title: "Salt Line — Digital",
    by: "Ira Sen",
    kind: "digital",
    department: "unisex",
    price: 220,
    image: "release-03",
    blurb: "The cassette is gone. This is the only way left to own it.",
    run: "Digital",
    stock: 9999,
    digital: true,
  },

  // ---- posters ----
  {
    id: "p14",
    index: "14",
    title: "Session Poster — A2",
    by: "House Print",
    kind: "poster",
    department: "unisex",
    price: 700,
    image: "wall-01",
    blurb: "Two-colour risograph, A2. Printed off the original paste-up.",
    run: "120 printed",
    stock: 46,
  },
  {
    id: "p15",
    index: "15",
    title: "Corridor — A1",
    by: "House Print",
    kind: "poster",
    department: "unisex",
    price: 1100,
    image: "split-corridor",
    blurb: "The building's own corridor, shot on film. Large format.",
    run: "60 printed",
    stock: 14,
  },
  {
    id: "p16",
    index: "16",
    title: "Wall Set — Three Prints",
    by: "House Print",
    kind: "poster",
    department: "unisex",
    price: 1800,
    compareAt: 2100,
    image: "wall-05",
    blurb: "Three A3 prints from the wall series, rolled in one tube.",
    run: "75 sets",
    stock: 28,
  },

  // ---- accessories ----
  {
    id: "p17",
    index: "17",
    title: "Bandit Tote",
    by: "House Merch",
    kind: "accessory",
    department: "unisex",
    price: 850,
    image: "wall-02",
    blurb: "16oz canvas, long handle, fits a 12-inch record flat.",
    run: "200 made",
    stock: 63,
  },
  {
    id: "p18",
    index: "18",
    title: "Mascot Enamel Pin",
    by: "House Merch",
    kind: "accessory",
    department: "unisex",
    price: 350,
    image: "limon-mascot",
    blurb: "Hard enamel, 32mm, double post. The one on the door.",
    run: "300 made",
    stock: 187,
  },
  {
    id: "p19",
    index: "19",
    title: "Studio Cap",
    by: "House Merch",
    kind: "accessory",
    department: "unisex",
    price: 1200,
    image: "room-a",
    blurb: "Unstructured six-panel, embroidered mark, adjustable strap.",
    run: "100 made",
    stock: 0,
  },
  {
    id: "p20",
    index: "20",
    title: "Slipmat Pair",
    by: "House Merch",
    kind: "accessory",
    department: "unisex",
    price: 1600,
    image: "wall-04",
    blurb: "Felt, 12 inch, printed both sides. Sold as a pair.",
    run: "150 pairs",
    stock: 35,
  },
];

/**
 * The filter strip.
 *
 * Each entry owns its own `match`, so the strip can mix the two axes —
 * "Women" reads `department`, "Posters" reads `kind` — without the grid
 * needing to know which is which. Adding a category is one entry here and
 * nothing else; the strip, the counts and the empty state all derive from it.
 */
export type Category = {
  id: string;
  label: string;
  /** the line under the heading when this category is showing */
  note: string;
  match: (p: Product) => boolean;
};

export const categories: Category[] = [
  {
    id: "all",
    label: "All",
    note: "Everything in the building that is for sale.",
    match: () => true,
  },
  {
    id: "men",
    label: "Men",
    note: "Cut for men. Sizes run S to XXL.",
    match: (p) => p.department === "men",
  },
  {
    id: "women",
    label: "Women",
    note: "Cut for women. Sizes run XS to XL.",
    match: (p) => p.department === "women",
  },
  {
    id: "cd",
    label: "CDs",
    note: "Pressed discs, with the sleeve notes.",
    match: (p) => p.kind === "cd",
  },
  {
    id: "vinyl",
    label: "Vinyl",
    note: "Records. Nothing here gets repressed.",
    match: (p) => p.kind === "vinyl",
  },
  {
    id: "digital",
    label: "Digital",
    note: "Files, sent by email. No shipping, no wait.",
    match: (p) => p.kind === "digital",
  },
  {
    id: "poster",
    label: "Posters",
    note: "Printed off the original paste-ups.",
    match: (p) => p.kind === "poster",
  },
  {
    id: "accessory",
    label: "Accessories",
    note: "Totes, pins, caps, slipmats.",
    match: (p) => p.kind === "accessory",
  },
];

export const DEFAULT_CATEGORY = "all";

export type SortId = "featured" | "price-desc" | "price-asc";

export const SORTS: { id: SortId; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "price-asc", label: "Price: low to high" },
];

export const DEFAULT_SORT: SortId = "featured";

/** Resolve a category id to its definition, falling back to "all". */
export function categoryById(id: string): Category {
  return categories.find((c) => c.id === id) ?? categories[0];
}

export function productById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

/**
 * Filter, then sort. Kept here rather than in the component so the same
 * ordering is used by the grid and by anything else that lists products.
 */
export function selectProducts(categoryId: string, sort: SortId): Product[] {
  const cat = categoryById(categoryId);
  const list = products.filter(cat.match);

  switch (sort) {
    case "price-desc":
      return [...list].sort((a, b) => b.price - a.price);
    case "price-asc":
      return [...list].sort((a, b) => a.price - b.price);
    default:
      return list;
  }
}

/** Shipping, in integer rupees. Digital-only baskets ship for nothing. */
export const SHIPPING = {
  kolkata: 0,
  india: 120,
} as const;

export function shippingFor(allDigital: boolean, region: "kolkata" | "india"): number {
  if (allDigital) return 0;
  return SHIPPING[region];
}
