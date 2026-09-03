import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getSupabase } from "./supabase";
import { useAuth } from "./auth";

/**
 * The wishlist.
 *
 * Unlike the cart this lives in Postgres, not `localStorage`, because it is
 * the one thing a shopper expects to still be there on their phone after
 * saving it on a laptop. `wishlist_items` is keyed `(user_id, product_id)`
 * and RLS restricts every row to its owner.
 *
 * Writes are optimistic: the heart fills the instant it is pressed and rolls
 * back if the insert fails. Waiting on a round trip to acknowledge a toggle
 * makes the control feel broken on a slow connection.
 */

type WishlistState = {
  ids: Set<string>;
  ready: boolean;
  has: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  count: number;
  open: boolean;
  setOpen: (v: boolean) => void;
};

const Ctx = createContext<WishlistState | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  /* Keyed on the id, not the user object.
   *
   * Supabase hands `onAuthStateChange` a brand-new session object on every
   * event — initial load, sign-in, each token refresh, and every window
   * refocus — so `session.user` is a new reference each time even when the
   * signed-in person has not changed. Depending on the object re-ran this
   * effect on all of them and refetched the whole wishlist: eleven identical
   * round trips in one short session, measured. The id is a string, so it
   * only changes when the account actually does. */
  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      setIds(new Set());
      setReady(true);
      return;
    }

    let alive = true;
    setReady(false);

    /* `getSupabase()` is now async — the module is dynamically imported to
     * keep it off the critical path. An effect body cannot itself be async,
     * so this runs in an IIFE and the `alive` flag guards against writing to
     * a stale render. */
    void (async () => {
      const supabase = await getSupabase();
      if (!alive) return;
      if (!supabase) {
        setReady(true);
        return;
      }
      const { data, error } = await supabase
        .from("wishlist_items")
        .select("product_id")
        .eq("user_id", userId);
      if (!alive) return;
      if (error) {
        console.error("wishlist load failed", error);
        setReady(true);
        return;
      }
      setIds(new Set((data ?? []).map((r) => r.product_id as string)));
      setReady(true);
    })();

    return () => {
      alive = false;
    };
  }, [userId]);

  const has = useCallback((productId: string) => ids.has(productId), [ids]);

  const remove = useCallback(
    async (productId: string) => {
      const supabase = await getSupabase();
      if (!user || !supabase) return;

      setIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });

      const { error } = await supabase
        .from("wishlist_items")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);

      if (error) {
        console.error("wishlist remove failed", error);
        setIds((prev) => new Set(prev).add(productId));
      }
    },
    [user],
  );

  const toggle = useCallback(
    async (productId: string) => {
      const supabase = await getSupabase();
      if (!user || !supabase) return;

      if (ids.has(productId)) {
        await remove(productId);
        return;
      }

      setIds((prev) => new Set(prev).add(productId));

      const { error } = await supabase
        .from("wishlist_items")
        .upsert({ user_id: user.id, product_id: productId }, { onConflict: "user_id,product_id" });

      if (error) {
        console.error("wishlist add failed", error);
        setIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      }
    },
    [user, ids, remove],
  );

  const value = useMemo<WishlistState>(
    () => ({ ids, ready, has, toggle, remove, count: ids.size, open, setOpen }),
    [ids, ready, has, toggle, remove, open],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWishlist() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWishlist must be used inside WishlistProvider");
  return c;
}
