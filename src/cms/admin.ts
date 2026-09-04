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
