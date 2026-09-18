import { getSupabase } from "@/lib/supabase";

/**
 * The admin inbox: orders, enquiries and the mailing list.
 *
 * Until this existed, everything customers sent the house landed in tables
 * nobody could see from the admin — orders went to Postgres and (when the
 * webhook is set) a sheet, enquiries to Postgres and a chat notification,
 * and mailing-list addresses to Postgres only. To answer an enquiry or mark
 * an order shipped, someone had to open the Supabase dashboard.
 *
 * Every read and write here runs as the signed-in admin; RLS decides. A
 * missing policy is not an error to PostgREST: a read comes back as an empty
 * list and an update as zero rows. Updates are caught (no row back → say so,
 * never "Saved"). Reads cannot be told apart from a genuinely empty table,
 * so every empty state names the migration that grants access rather than
 * claiming "nothing yet" as fact.
 */

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const fail = <T>(error: string): Result<T> => ({ ok: false, error });

function explain(e: { message?: string; code?: string } | null): string {
  if (!e) return "Unknown error.";
  /* PostgREST reports an RLS-filtered update as zero rows rather than an
   * error, and a missing select policy as an empty list — both handled by
   * the callers. A real permission error comes back as 42501. */
  if (e.code === "42501") return "The database refused: this account is not allowed to do that.";
  return e.message ?? "Unknown error.";
}

/* ---------------- orders ---------------- */

export const ORDER_STATUSES = [
  "received",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** As `submitOrder` writes it into `orders.items` (lib/orders.ts). */
export type OrderItem = {
  product_id: string;
  title: string;
  by?: string;
  kind?: string;
  size: string | null;
  qty: number;
  unit_inr: number;
  line_inr: number;
  digital?: boolean;
};

export type OrderRow = {
  id: string;
  reference: string;
  email: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  region: string;
  postcode: string;
  country: string;
  note: string | null;
  items: OrderItem[];
  subtotal_inr: number;
  shipping_inr: number;
  discount_inr: number;
  discount_code: string | null;
  total_inr: number;
  payment_method: string;
  payment_status: PaymentStatus;
  status: OrderStatus;
  sheet_synced_at: string | null;
  sheet_error: string | null;
  created_at: string;
};

export async function listOrders(): Promise<Result<OrderRow[]>> {
  const supabase = await getSupabase();
  if (!supabase) return fail("The database is not configured.");
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return fail(explain(error));
  return { ok: true, data: (data ?? []) as OrderRow[] };
}

export async function updateOrder(
  id: string,
  patch: Partial<Pick<OrderRow, "status" | "payment_status">>,
): Promise<Result<OrderRow>> {
  const supabase = await getSupabase();
  if (!supabase) return fail("The database is not configured.");
  const { data, error } = await supabase
    .from("orders")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) return fail(explain(error));
  /* No row back means RLS filtered the update out — the change did not
   * happen, and saying "saved" here would be a lie. */
  if (!data) return fail(NEEDS_MIGRATION);
  return { ok: true, data: data as OrderRow };
}

/* ---------------- enquiries ---------------- */

export const ENQUIRY_STATUSES = ["new", "replied", "closed"] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export type EnquiryRow = {
  id: string;
  reference: string;
  intent: string;
  full_name: string;
  email: string;
  phone: string | null;
  message: string;
  source_path: string | null;
  status: string;
  notified_at: string | null;
  notify_error: string | null;
  created_at: string;
};

export async function listEnquiries(): Promise<Result<EnquiryRow[]>> {
  const supabase = await getSupabase();
  if (!supabase) return fail("The database is not configured.");
  const { data, error } = await supabase
    .from("enquiries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return fail(explain(error));
  return { ok: true, data: (data ?? []) as EnquiryRow[] };
}

export async function updateEnquiry(
  id: string,
  status: EnquiryStatus,
): Promise<Result<EnquiryRow>> {
  const supabase = await getSupabase();
  if (!supabase) return fail("The database is not configured.");
  const { data, error } = await supabase
    .from("enquiries")
    .update({ status })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) return fail(explain(error));
  if (!data) return fail(NEEDS_MIGRATION);
  return { ok: true, data: data as EnquiryRow };
}

/* ---------------- mailing list ---------------- */

export type SignupRow = {
  id: string;
  email: string;
  code: string;
  source: string;
  created_at: string;
};

export async function listSignups(): Promise<Result<SignupRow[]>> {
  const supabase = await getSupabase();
  if (!supabase) return fail("The database is not configured.");
  const { data, error } = await supabase
    .from("offer_signups")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) return fail(explain(error));
  return { ok: true, data: (data ?? []) as SignupRow[] };
}

export async function deleteSignup(id: string): Promise<Result<null>> {
  const supabase = await getSupabase();
  if (!supabase) return fail("The database is not configured.");
  const { data, error } = await supabase.from("offer_signups").delete().eq("id", id).select("id");
  if (error) return fail(explain(error));
  if (!data?.length) return fail(NEEDS_MIGRATION);
  return { ok: true, data: null };
}

/* ---------------- dashboard ---------------- */

/** What is waiting: open orders and unanswered enquiries. `null` = cannot read. */
export async function inboxCounts(): Promise<{ orders: number | null; enquiries: number | null }> {
  const supabase = await getSupabase();
  if (!supabase) return { orders: null, enquiries: null };
  const [o, e] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["received", "confirmed", "packed"]),
    supabase
      .from("enquiries")
      .select("id", { count: "exact", head: true })
      .not("status", "in", "(replied,closed)"),
  ]);
  return {
    orders: o.error ? null : (o.count ?? 0),
    enquiries: e.error ? null : (e.count ?? 0),
  };
}

/* ---------------- shared ---------------- */

/** The empty state for an inbox that may simply be unreadable. */
export const EMPTY_HINT = (what: string) =>
  `No ${what} to show. If you expected some, this account may not have read access yet — run supabase/migrations/20260918_admin_inbox.sql once in the Supabase SQL editor.`;

export const NEEDS_MIGRATION =
  "The database did not let this account make that change. Run supabase/migrations/20260918_admin_inbox.sql once in the Supabase SQL editor — it grants admins read and update access to orders, enquiries and the mailing list.";

/** A CSV a spreadsheet opens cleanly: quoted fields, CRLF, BOM for Excel. */
export function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const cell = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const lines = [
    columns.map(cell).join(","),
    ...rows.map((r) => columns.map((c) => cell(r[c])).join(",")),
  ];
  return "﻿" + lines.join("\r\n");
}

/** "18 Sep 2026, 14:05" in the visitor's zone — the admin is always a person reading it now. */
export function when(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Save rows as a CSV file. The admin is a normal browser tab, so a blob link downloads. */
export function downloadCsv(name: string, rows: Record<string, unknown>[], columns: string[]) {
  const blob = new Blob([toCsv(rows, columns)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Case-insensitive match of a query against any of the given fields. */
export function matches(q: string, ...fields: (string | null | undefined)[]): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((f) => f?.toLowerCase().includes(needle));
}
