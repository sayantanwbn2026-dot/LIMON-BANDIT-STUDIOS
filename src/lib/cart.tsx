import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useProducts, useShipping, type ProductDoc as Product } from "@/cms/hooks";
import { discountOf } from "./money";
import { useAuth } from "./auth";

/**
 * The basket.
 *
 * Kept in `localStorage` under the signed-in user's id, which is what makes
 * two accounts on one laptop not share a basket — and what makes signing out
 * leave yours intact for when you come back. Nothing is added to a cart
 * without a session (the gate in `useAuth` enforces that at the button), so
 * there is no anonymous basket to merge on login.
 *
 * A line is identified by product **and size**: a medium and a large of the
 * same tee are two lines, not a quantity of two, because they are two
 * different things to pick and pack.
 *
 * Totals are computed here rather than stored, so a price change in the
 * catalogue can never disagree with what the cart is showing.
 */

export type CartLine = {
  productId: string;
  /** null for things without a size run */
  size: string | null;
  qty: number;
};

/** A line joined back to its product. `product` is null if the id went stale. */
export type ResolvedLine = CartLine & { product: Product | null; lineTotal: number };

export type Region = "kolkata" | "india";

export type Offer = { code: string; percent: number } | null;

type CartState = {
  lines: CartLine[];
  resolved: ResolvedLine[];
  count: number;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  allDigital: boolean;
  region: Region;
  setRegion: (r: Region) => void;
  offer: Offer;
  applyOffer: (o: Offer) => void;
  clearOffer: () => void;

  add: (productId: string, size: string | null, qty?: number) => void;
  setQty: (productId: string, size: string | null, qty: number) => void;
  remove: (productId: string, size: string | null) => void;
  clear: () => void;

  open: boolean;
  setOpen: (v: boolean) => void;
};

const Ctx = createContext<CartState | null>(null);

const KEY = (userId: string) => `lb-cart:${userId}`;
const OFFER_KEY = "lb-offer";
const REGION_KEY = "lb-region";

const sameLine = (l: CartLine, productId: string, size: string | null) =>
  l.productId === productId && l.size === size;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    /* private mode, quota, or a half-written value — an empty cart is a
     * better outcome than a crashed page */
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* nothing to do — the cart still works for this session */
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  /* Prices, stock and shipping all come from the CMS so the basket agrees
   * with what the admin says — and, more importantly, with what the server
   * will charge when the order is placed. */
  const catalogue = useProducts();
  const shippingRates = useShipping();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [region, setRegionState] = useState<Region>("india");
  const [offer, setOffer] = useState<Offer>(null);

  /* Load this user's basket when the session resolves, and drop it on sign
   * out so the next person at the machine starts empty.
   *
   * Keyed on the id rather than the user object: Supabase issues a new
   * session object on every auth event including each token refresh, so
   * depending on the object re-read the basket from storage on all of them.
   * The id only changes when the account does. */
  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      setLines([]);
      return;
    }
    setLines(readJson<CartLine[]>(KEY(userId), []));
  }, [userId]);

  useEffect(() => {
    setOffer(readJson<Offer>(OFFER_KEY, null));
    const r = readJson<Region | null>(REGION_KEY, null);
    if (r === "kolkata" || r === "india") setRegionState(r);
  }, []);

  useEffect(() => {
    if (!userId) return;
    writeJson(KEY(userId), lines);
  }, [lines, userId]);

  const setRegion = useCallback((r: Region) => {
    setRegionState(r);
    writeJson(REGION_KEY, r);
  }, []);

  const applyOffer = useCallback((o: Offer) => {
    setOffer(o);
    writeJson(OFFER_KEY, o);
  }, []);

  const clearOffer = useCallback(() => {
    setOffer(null);
    writeJson(OFFER_KEY, null);
  }, []);

  const add = useCallback((productId: string, size: string | null, qty = 1) => {
    setLines((prev) => {
      const at = prev.findIndex((l) => sameLine(l, productId, size));
      if (at === -1) return [...prev, { productId, size, qty }];
      const next = [...prev];
      next[at] = { ...next[at], qty: next[at].qty + qty };
      return next;
    });
  }, []);

  const setQty = useCallback((productId: string, size: string | null, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => !sameLine(l, productId, size))
        : prev.map((l) => (sameLine(l, productId, size) ? { ...l, qty } : l)),
    );
  }, []);

  const remove = useCallback((productId: string, size: string | null) => {
    setLines((prev) => prev.filter((l) => !sameLine(l, productId, size)));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const resolved = useMemo<ResolvedLine[]>(
    () =>
      lines.map((l) => {
        const product = catalogue.find((p) => p.id === l.productId) ?? null;
        return { ...l, product, lineTotal: product ? product.price * l.qty : 0 };
      }),
    [lines, catalogue],
  );

  const subtotal = useMemo(() => resolved.reduce((n, l) => n + l.lineTotal, 0), [resolved]);
  const count = useMemo(() => lines.reduce((n, l) => n + l.qty, 0), [lines]);

  /* An empty basket is not "all digital" — that would show "no shipping" on
   * a cart with nothing in it. */
  const allDigital = useMemo(
    () => resolved.length > 0 && resolved.every((l) => l.product?.digital === true),
    [resolved],
  );

  const shipping = useMemo(() => {
    if (resolved.length === 0 || allDigital) return 0;
    const rate = shippingRates?.[region];
    return typeof rate === "number" ? Math.max(0, rate) : 0;
  }, [resolved.length, allDigital, region, shippingRates]);

  const discount = useMemo(
    () => (offer ? discountOf(subtotal, offer.percent) : 0),
    [offer, subtotal],
  );

  const total = Math.max(0, subtotal - discount) + shipping;

  const value = useMemo<CartState>(
    () => ({
      lines,
      resolved,
      count,
      subtotal,
      shipping,
      discount,
      total,
      allDigital,
      region,
      setRegion,
      offer,
      applyOffer,
      clearOffer,
      add,
      setQty,
      remove,
      clear,
      open,
      setOpen,
    }),
    [
      lines,
      resolved,
      count,
      subtotal,
      shipping,
      discount,
      total,
      allDigital,
      region,
      setRegion,
      offer,
      applyOffer,
      clearOffer,
      add,
      setQty,
      remove,
      clear,
      open,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
