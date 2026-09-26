import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabase } from "./supabase";

/**
 * Review data, shared by everything that shows a rating.
 *
 * The table is small and the same numbers appear on twenty cards at once, so
 * it is fetched once per page and held in a module-level promise: twenty
 * cards asking for one average apiece would be twenty round trips for one
 * number each.
 */

export type ReviewRow = {
  id: string;
  product_id: string;
  user_id: string;
  author: string;
  rating: number;
  title: string | null;
  body: string;
  verified: boolean;
  created_at: string;
};

type Aggregate = { count: number; average: number };

let cache: Promise<ReviewRow[]> | null = null;

async function loadAll(): Promise<ReviewRow[]> {
  const supabase = await getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("product_reviews")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) {
    console.error("could not load reviews", error);
    return [];
  }
  return (data ?? []) as ReviewRow[];
}

export function useAllReviews() {
  const [rows, setRows] = useState<ReviewRow[]>([]);

  const refresh = useCallback(async () => {
    cache = loadAll();
    setRows(await cache);
  }, []);

  useEffect(() => {
    let alive = true;
    cache ??= loadAll();
    void cache.then((r) => alive && setRows(r));
    return () => {
      alive = false;
    };
  }, []);

  return { rows, refresh };
}

/** Count and average for one product — `{ count: 0 }` until they load. */
export function useRatings(productId: string): Aggregate {
  const { rows } = useAllReviews();
  return useMemo(() => {
    const mine = rows.filter((r) => r.product_id === productId);
    if (mine.length === 0) return { count: 0, average: 0 };
    return {
      count: mine.length,
      average: mine.reduce((n, r) => n + r.rating, 0) / mine.length,
    };
  }, [rows, productId]);
}

/** Every product's aggregate, for the catalogue cards. */
export function useRatingMap(): Map<string, Aggregate> {
  const { rows } = useAllReviews();
  return useMemo(() => {
    const totals = new Map<string, { sum: number; count: number }>();
    for (const r of rows) {
      const t = totals.get(r.product_id) ?? { sum: 0, count: 0 };
      t.sum += r.rating;
      t.count += 1;
      totals.set(r.product_id, t);
    }
    const out = new Map<string, Aggregate>();
    for (const [id, t] of totals) out.set(id, { count: t.count, average: t.sum / t.count });
    return out;
  }, [rows]);
}
