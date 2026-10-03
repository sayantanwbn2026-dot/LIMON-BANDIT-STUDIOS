import { getSupabase } from "@/lib/supabase";
import { seeds } from "./seeds";

/**
 * The admin side: who is allowed in, and how a change is written.
 *
 * Membership is a row in `admins`, checked in the database rather than the
 * browser. The UI hides what a non-admin cannot use, but that is courtesy —
 * the actual refusal is RLS: `cms_documents` only accepts a write when
 * `is_admin()` is true for the caller's JWT, so a shopper who signs in and
 * pokes the REST API directly gets nothing.
 */

export type AdminRow = {
  email: string;
  role: "owner" | "editor";
  label: string | null;
  created_at: string;
};

/** Is the signed-in session an admin? Asks the database, not the client. */
export async function checkAdmin(): Promise<{ admin: boolean; owner: boolean }> {
  const supabase = await getSupabase();
  if (!supabase) return { admin: false, owner: false };

  const [{ data: isAdmin }, { data: isOwner }] = await Promise.all([
    supabase.rpc("is_admin"),
    supabase.rpc("is_owner"),
  ]);

  return { admin: Boolean(isAdmin), owner: Boolean(isOwner) };
}

export async function listAdmins(): Promise<AdminRow[]> {
  const supabase = await getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("admins")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("cms: could not list admins", error);
    return [];
  }
  return (data ?? []) as AdminRow[];
}

export async function addAdmin(
  email: string,
  role: "owner" | "editor",
  label: string,
): Promise<string | null> {
  const supabase = await getSupabase();
  if (!supabase) return "Not connected.";
  const { error } = await supabase
    .from("admins")
    .insert({ email: email.trim().toLowerCase(), role, label: label.trim() || null });
  return error ? error.message : null;
}

export async function removeAdmin(email: string): Promise<string | null> {
  const supabase = await getSupabase();
  if (!supabase) return "Not connected.";
  const { error } = await supabase.from("admins").delete().eq("email", email);
  return error ? error.message : null;
}

/** Every stored document, for the admin's editing surface. */
export async function loadDocuments(): Promise<Record<string, unknown>> {
  const supabase = await getSupabase();
  if (!supabase) return {};
  const { data, error } = await supabase.from("cms_documents").select("key, data");
  if (error) {
    console.error("cms: could not load documents", error);
    return {};
  }
  const out: Record<string, unknown> = {};
  for (const row of data ?? []) out[row.key as string] = row.data;
  return out;
}

/**
 * Write one document and record what it replaced.
 *
 * The previous value is read first so the audit row carries a real `before`.
 * That read is not free, but this runs at human speed — a few writes a week —
 * and "what did the phone number used to be" is the question a content
 * history actually gets asked.
 *
 * A failed audit insert does not fail the save. Losing the log entry is a
 * smaller problem than refusing a legitimate edit, and the trigger on
 * `cms_documents` still stamps who and when.
 */
export async function saveDocument(key: string, data: unknown): Promise<string | null> {
  const supabase = await getSupabase();
  if (!supabase) return "Not connected.";

  const { data: session } = await supabase.auth.getUser();
  const actor = session.user?.email ?? null;

  const { data: prev } = await supabase
    .from("cms_documents")
    .select("data")
    .eq("key", key)
    .maybeSingle();

  const { error } = await supabase
    .from("cms_documents")
    .upsert({ key, data, updated_by: actor }, { onConflict: "key" });

  if (error) return error.message;

  const { error: auditError } = await supabase.from("cms_audit").insert({
    key,
    actor,
    action: prev ? "update" : "create",
    before: prev?.data ?? null,
    after: data,
  });
  if (auditError) console.error("cms: change saved but not logged", auditError);

  return null;
}

/** Put a document back to the content committed in the repository. */
export async function resetToSeed(key: string): Promise<string | null> {
  const seed = seeds[key];
  if (seed === undefined) return "There is no committed default for this section.";
  return saveDocument(key, seed);
}

export type AuditRow = {
  id: number;
  key: string;
  actor: string | null;
  action: string;
  created_at: string;
};

export async function recentChanges(limit = 40): Promise<AuditRow[]> {
  const supabase = await getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("cms_audit")
    .select("id, key, actor, action, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("cms: could not read history", error);
    return [];
  }
  return (data ?? []) as AuditRow[];
}

/* ------------------------------------------------------------------ *
 * Analytics
 * ------------------------------------------------------------------ */

export type Summary = { total_views: number; unique_sessions: number; days_covered: number };
export type TopPath = { path: string; views: number; sessions: number };
export type DailyPoint = { day: string; views: number; sessions: number };

export async function analytics(days = 30): Promise<{
  summary: Summary | null;
  top: TopPath[];
  daily: DailyPoint[];
}> {
  const supabase = await getSupabase();
  if (!supabase) return { summary: null, top: [], daily: [] };

  const [s, t, d] = await Promise.all([
    supabase.rpc("analytics_summary", { days }),
    supabase.rpc("analytics_top_paths", { days, lim: 12 }),
    supabase.rpc("analytics_daily", { days }),
  ]);

  return {
    summary: (s.data?.[0] as Summary) ?? null,
    top: (t.data as TopPath[]) ?? [],
    daily: (d.data as DailyPoint[]) ?? [],
  };
}

/** Commerce figures, straight from the shop's own tables. */
export async function commerceStats(days = 30) {
  const supabase = await getSupabase();
  if (!supabase) return { orders: 0, revenue: 0, signups: 0, wishlist: 0 };

  const since = new Date(Date.now() - days * 86400_000).toISOString();

  const [orders, signups, wishlist] = await Promise.all([
    supabase.from("orders").select("total_inr").gte("created_at", since),
    supabase
      .from("offer_signups")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
    supabase
      .from("wishlist_items")
      .select("product_id", { count: "exact", head: true })
      .gte("created_at", since),
  ]);

  const rows = (orders.data ?? []) as { total_inr: number }[];
  return {
    orders: rows.length,
    revenue: rows.reduce((n, r) => n + (r.total_inr ?? 0), 0),
    signups: signups.count ?? 0,
    wishlist: wishlist.count ?? 0,
  };
}

/* ------------------------------------------------------------------ *
 * The rest of the picture
 *
 * The dashboard knew about traffic, orders, revenue, signups and
 * wishlist saves. Everything below is a question the house was asking
 * the database by hand, or not asking at all:
 *
 *   What came in through the form, and what did people want?
 *     Enquiries are the studio's entire inbound path and did not appear
 *     on the dashboard in any form.
 *
 *   Where are the orders?
 *     A count of orders says how many; a breakdown by status says how many
 *     are still the house's problem.
 *
 *     NOT counted here: "how many need a person today". The dashboard
 *     already answers that through `inboxCounts()`, which treats an order
 *     as open at received, confirmed OR packed and an enquiry as open until
 *     it is replied or closed — and reads all time, because a backlog does
 *     not expire when it falls out of a 30-day window. An earlier draft of
 *     this file recomputed both with narrower rules, which would have put
 *     two different numbers for the same thing on two screens of the same
 *     admin. One definition, in one place; the Insights page calls it.
 *
 *   What is selling, and what is about to run out?
 *     Stock lives in a CMS document, so "what is nearly gone" was a
 *     thing you found out by scrolling the product list, and "what is
 *     moving" was not answerable at all — line items sit inside each
 *     order's JSONB and nothing added them up.
 *
 *   What do people think of it?
 *     Reviews are written, averaged on the product page, and never
 *     summarised for the house.
 *
 * All of it reads through the same RLS the rest of the admin does: a
 * non-admin asking these questions gets empty results, not an error, so
 * a stale session degrades to a quiet dashboard rather than a broken one.
 * ------------------------------------------------------------------ */

export type IntentCount = { intent: string; count: number };
export type SoldItem = { id: string; title: string; qty: number; revenue: number };
export type StatusCount = { status: string; count: number };
export type LowStockItem = { id: string; title: string; stock: number };

export type Insights = {
  enquiries: { total: number; byIntent: IntentCount[] };
  orders: { byStatus: StatusCount[]; averageOrder: number; topSellers: SoldItem[] };
  stock: { soldOut: LowStockItem[]; low: LowStockItem[] };
  reviews: { count: number; average: number };
};

const EMPTY_INSIGHTS: Insights = {
  enquiries: { total: 0, byIntent: [] },
  orders: { byStatus: [], averageOrder: 0, topSellers: [] },
  stock: { soldOut: [], low: [] },
  reviews: { count: 0, average: 0 },
};

/** Anything at or below this is worth seeing before it sells out. */
const LOW_STOCK_AT = 5;

export async function insights(days = 30): Promise<Insights> {
  const supabase = await getSupabase();
  if (!supabase) return EMPTY_INSIGHTS;

  const since = new Date(Date.now() - days * 86400_000).toISOString();

  const [enq, ord, products, reviews] = await Promise.all([
    supabase.from("enquiries").select("intent").gte("created_at", since),
    supabase.from("orders").select("status, total_inr, items").gte("created_at", since),
    supabase.from("cms_documents").select("data").eq("key", "commerce.products").maybeSingle(),
    supabase.from("product_reviews").select("rating"),
  ]);

  /* Count by a column without a GROUP BY round trip: these are tens of
   * rows, not millions, and one select beats four. */
  const tally = <T extends string>(rows: { [k: string]: unknown }[], col: string) => {
    const m = new Map<T, number>();
    for (const r of rows) {
      const k = (String(r[col] ?? "") || "—") as T;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].map(([k, count]) => ({ k, count })).sort((a, b) => b.count - a.count);
  };

  const enqRows = (enq.data ?? []) as { intent: string }[];
  const ordRows = (ord.data ?? []) as {
    status: string | null;
    total_inr: number | null;
    items: { product_id?: string; title?: string; qty?: number; line_inr?: number }[] | null;
  }[];
  const revRows = (reviews.data ?? []) as { rating: number | null }[];

  const revenue = ordRows.reduce((n, r) => n + (r.total_inr ?? 0), 0);
  const ratings = revRows.map((r) => r.rating ?? 0).filter((n) => n > 0);

  /* Stock is a field inside the catalogue document, not a table, so the
   * "nearly gone" list is computed here rather than queried. Digital items
   * have no run to exhaust and are skipped — the same rule reserve_stock
   * follows, so the two cannot disagree about what "sold out" means. */
  const catalogue = (products.data?.data ?? []) as {
    id?: string;
    title?: string;
    stock?: number;
    digital?: boolean;
  }[];
  const physical = Array.isArray(catalogue) ? catalogue.filter((p) => p?.id && !p.digital) : [];
  const asItem = (p: (typeof physical)[number]): LowStockItem => ({
    id: String(p.id),
    title: String(p.title ?? p.id),
    stock: Number(p.stock ?? 0),
  });

  /* WHAT IS SELLING.
   *
   * Line items live in `orders.items` as JSONB, not in a join table, so this
   * is aggregated here rather than in SQL. Keyed on product_id and NOT on
   * title: the title is a snapshot of what the thing was called on the day
   * it sold, so renaming a product in the CMS would otherwise split its
   * history into two rows. The most recent title wins for display, which is
   * the one an editor will recognise.
   *
   * Quantity decides the order, not revenue — "what is moving" and "what
   * earns" are different questions, and the second is already answered by
   * revenue and average order above. */
  const sold = new Map<string, SoldItem>();
  for (const o of ordRows) {
    for (const it of o.items ?? []) {
      const id = it.product_id;
      if (!id) continue;
      const row = sold.get(id) ?? { id, title: String(it.title ?? id), qty: 0, revenue: 0 };
      row.qty += Number(it.qty ?? 0);
      row.revenue += Number(it.line_inr ?? 0);
      if (it.title) row.title = String(it.title);
      sold.set(id, row);
    }
  }

  return {
    enquiries: {
      total: enqRows.length,
      byIntent: tally(enqRows, "intent").map((r) => ({ intent: r.k, count: r.count })),
    },
    orders: {
      byStatus: tally(ordRows, "status").map((r) => ({ status: r.k, count: r.count })),
      averageOrder: ordRows.length ? Math.round(revenue / ordRows.length) : 0,
      topSellers: [...sold.values()].sort((a, b) => b.qty - a.qty).slice(0, 5),
    },
    stock: {
      soldOut: physical.filter((p) => Number(p.stock ?? 0) <= 0).map(asItem),
      low: physical
        .filter((p) => {
          const n = Number(p.stock ?? 0);
          return n > 0 && n <= LOW_STOCK_AT;
        })
        .map(asItem)
        .sort((a, b) => a.stock - b.stock),
    },
    reviews: {
      count: ratings.length,
      average: ratings.length
        ? Math.round((ratings.reduce((n, r) => n + r, 0) / ratings.length) * 10) / 10
        : 0,
    },
  };
}
