import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabase } from "./supabase";
import { orderSummary, postNotification } from "./notify";

/**
 * Placing an order.
 *
 * The whole thing happens in one server function, and the reason is money.
 *
 * The obvious build — let the browser compute the basket total and insert the
 * row itself — is wrong here in a way that costs real rupees. Payment is on
 * delivery: logistics work from the Google Sheet and collect whatever the
 * sheet says. So a total the browser chose is a total a shopper can choose,
 * and a forged `total_inr: 1` on a ₹4,200 bomber is a jacket out of the door
 * for a rupee. Nobody would need to break anything to do it; the insert was
 * theirs to make.
 *
 * So the client sends what it is entitled to know — which products, which
 * sizes, how many, where to ship, which code was typed — and the server
 * prices it, against the same catalogue the grid rendered from. Line prices,
 * shipping, the discount and the total are all recomputed here. The browser's
 * arithmetic never leaves the browser.
 *
 * The insert runs as the buyer, not as the service role: the request carries
 * their access token, `getUser` verifies it, and the row goes in under RLS
 * with `user_id` pinned to `auth.uid()`. That keeps the ordinary path free of
 * the service role entirely — it is used for one optional thing, stamping the
 * sheet-sync result, and the shop works without it.
 *
 * PAYMENT-LATER: a gateway slots in between the insert and the sheet push.
 * Charge, then update `payment_status` to 'paid' and only then sync, so
 * logistics never receive an unpaid order. `payment_method` and `payment_ref`
 * columns are already there for it.
 */

import { products, shippingFor } from "@/data/shop";
import { findOffer } from "@/data/offers";
import { discountOf } from "./money";

export type PlacedOrder = {
  id: string;
  reference: string;
  total: number;
  sheetSynced: boolean;
};

const lineSchema = z.object({
  productId: z.string().min(1).max(64),
  size: z.string().max(16).nullable(),
  qty: z.number().int().min(1).max(20),
});

const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(6).max(32),
  addressLine1: z.string().trim().min(4).max(200),
  addressLine2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(80),
  region: z.string().trim().min(2).max(80),
  postcode: z.string().trim().min(4).max(16),
  country: z.string().trim().min(2).max(80).default("India"),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

const orderSchema = z.object({
  accessToken: z.string().min(10),
  lines: z.array(lineSchema).min(1).max(40),
  address: addressSchema,
  discountCode: z.string().trim().max(40).nullable(),
  shipRegion: z.enum(["kolkata", "india"]),
});

export type OrderAddress = z.infer<typeof addressSchema>;
export type OrderLineInput = z.infer<typeof lineSchema>;

/** `LB-M4K2P7` — short enough to read down a phone, unique enough to key on. */
function makeReference(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-4);
  const salt = Math.random().toString(36).toUpperCase().slice(2, 4);
  return `LB-${stamp}${salt}`;
}

/**
 * Turn a schema failure into a sentence.
 *
 * `orderSchema.parse` throws a ZodError whose `message` is a JSON array of
 * issue objects, and a thrown server-function error goes straight to the
 * checkout's failure notice — so the raw form of this put a wall of
 * `{"code":"too_big","maximum":20,…}` in front of a shopper. The cases that
 * actually reach here are a tampered or stale basket, so they need to say
 * what to do about it, not what the validator thought.
 */
function readableIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  const path = issue?.path.join(".") ?? "";

  if (path.startsWith("lines")) {
    return "Something in your cart is not right — the quantity is out of range. Empty it and add the items again.";
  }
  if (path.startsWith("address")) {
    const field = issue.path[issue.path.length - 1];
    return `Check the ${String(field)} field — that value was not accepted.`;
  }
  if (path === "accessToken") {
    return "Your session has expired. Sign in again and retry.";
  }
  return "That order could not be read. Refresh the page and try once more.";
}

/**
 * Look a discount code up in the CMS-managed list.
 *
 * Mirrors `findOffer` in data/offers.ts — case-insensitive, and an expiry in
 * the past is not a code. Kept separate rather than made generic because the
 * stored rows are untyped JSON and every field has to be checked before it is
 * trusted; a blank `expires` is "no expiry", not "expired in 1970".
 */
function findLiveOffer(
  offers: { code: string; percent: number; expires?: string | null }[],
  code: string | null,
): { code: string; percent: number } | null {
  if (!code) return null;
  const wanted = code.trim().toLowerCase();
  const found = offers.find((o) => typeof o.code === "string" && o.code.toLowerCase() === wanted);
  if (!found) return null;
  if (typeof found.percent !== "number" || found.percent <= 0) return null;
  if (found.expires && String(found.expires).trim()) {
    const when = new Date(String(found.expires));
    if (!Number.isNaN(when.getTime()) && when < new Date(new Date().toDateString())) return null;
  }
  return { code: found.code, percent: Math.min(100, found.percent) };
}

export const submitOrder = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const parsed = orderSchema.safeParse(d);
    if (parsed.success) return parsed.data;
    throw new Error(readableIssue(parsed.error));
  })
  .handler(async ({ data }) => {
    const url = process.env.VITE_SUPABASE_URL;
    const publishable = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !publishable) {
      throw new Error("The shop is not connected to Supabase yet.");
    }

    const { createClient } = await import("@supabase/supabase-js");

    /* Acts as the buyer: their token on every request, RLS in force, no
     * elevated key anywhere near the insert. */
    const asUser = createClient(url, publishable, {
      global: { headers: { Authorization: `Bearer ${data.accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: auth, error: authError } = await asUser.auth.getUser(data.accessToken);
    if (authError || !auth.user) {
      throw new Error("Your session has expired. Sign in again and retry.");
    }
    const user = auth.user;

    /* The catalogue the server prices against.
     *
     * This must be the CMS document, not the compiled `src/data/shop.ts`.
     * The moment an editor changes a price in the admin, the two disagree —
     * and since this function's whole job is to be the authority on what an
     * order costs, pricing from the stale copy would quietly charge the old
     * amount for everything the editor had just repriced. `cms_documents` is
     * world-readable, so the buyer's own client can fetch it.
     *
     * The committed data stays as the fallback for exactly the case the rest
     * of the CMS falls back for: an unseeded or unreachable database should
     * degrade to the shipped catalogue rather than refuse every order. */
    const { data: catalogue } = await asUser
      .from("cms_documents")
      .select("data")
      .eq("key", "commerce.products")
      .maybeSingle();

    const liveProducts =
      Array.isArray(catalogue?.data) && catalogue.data.length > 0
        ? (catalogue.data as typeof products)
        : products;

    const { data: offerDoc } = await asUser
      .from("cms_documents")
      .select("data")
      .eq("key", "commerce.offers")
      .maybeSingle();

    const { data: shipDoc } = await asUser
      .from("cms_documents")
      .select("data")
      .eq("key", "commerce.shipping")
      .maybeSingle();

    // ---- price it here, from the catalogue, ignoring whatever the client thinks ----
    const items = data.lines.map((line) => {
      const product = liveProducts.find((p) => p.id === line.productId);
      if (!product) throw new Error(`That item is no longer in the shop (${line.productId}).`);
      if (product.stock <= 0) throw new Error(`${product.title} is sold out.`);

      /* A size that is not in the product's run means a tampered or stale
       * payload; picking one for them would ship the wrong thing. */
      if (product.sizes?.length) {
        if (!line.size || !product.sizes.includes(line.size)) {
          throw new Error(`Pick a size for ${product.title}.`);
        }
      }

      const qty = Math.min(line.qty, product.stock);
      return {
        product_id: product.id,
        title: product.title,
        by: product.by,
        kind: product.kind,
        size: product.sizes?.length ? line.size : null,
        qty,
        unit_inr: product.price,
        line_inr: product.price * qty,
        digital: Boolean(product.digital),
      };
    });

    const subtotal = items.reduce((n, i) => n + i.line_inr, 0);
    const allDigital = items.every((i) => i.digital);

    /* Shipping and discounts come from the CMS too, for the same reason the
     * prices do — an editor who raises the India rate expects the next order
     * to be charged the new one. */
    const ship = shipDoc?.data as { kolkata?: number; india?: number } | undefined;
    const shipping = allDigital
      ? 0
      : typeof ship?.[data.shipRegion] === "number"
        ? Math.max(0, ship[data.shipRegion] as number)
        : shippingFor(allDigital, data.shipRegion);

    const liveOffers = Array.isArray(offerDoc?.data)
      ? (offerDoc.data as { code: string; percent: number; expires?: string | null }[])
      : null;

    const offer = liveOffers
      ? findLiveOffer(liveOffers, data.discountCode)
      : findOffer(data.discountCode);
    const discount = offer ? discountOf(subtotal, offer.percent) : 0;
    const total = Math.max(0, subtotal - discount) + shipping;

    const base = {
      user_id: user.id,
      email: data.address.email,
      full_name: data.address.fullName,
      phone: data.address.phone,
      address_line1: data.address.addressLine1,
      address_line2: data.address.addressLine2 || null,
      city: data.address.city,
      region: data.address.region,
      postcode: data.address.postcode,
      country: data.address.country || "India",
      note: data.address.note || null,
      items,
      subtotal_inr: subtotal,
      shipping_inr: shipping,
      discount_inr: discount,
      discount_code: offer?.code ?? null,
      total_inr: total,
      payment_method: "cod",
      payment_status: "pending",
      status: "received",
    };

    let inserted = await asUser
      .from("orders")
      .insert({ ...base, reference: makeReference() })
      .select("id, reference")
      .single();

    /* The reference is random and unique-constrained. A collision is unlikely
     * and entirely survivable, so take one more swing before giving up. */
    if (inserted.error?.code === "23505") {
      inserted = await asUser
        .from("orders")
        .insert({ ...base, reference: makeReference() })
        .select("id, reference")
        .single();
    }

    if (inserted.error || !inserted.data) {
      throw new Error(inserted.error?.message ?? "The order could not be saved.");
    }

    const orderId = inserted.data.id as string;
    const reference = inserted.data.reference as string;

    const sheetSynced = await syncToSheet({
      orderId,
      reference,
      createdAt: new Date().toISOString(),
      row: base,
      items,
    });

    return { id: orderId, reference, total, sheetSynced } satisfies PlacedOrder;
  });

type SheetItem = {
  title: string;
  size: string | null;
  qty: number;
  unit_inr: number;
};

/**
 * Push one order into the Google Sheet.
 *
 * The sheet is a downstream copy, so this is allowed to fail: the order is
 * already committed by the time we get here, and losing a sheet row is
 * recoverable in a way that losing the order is not. Failures are stamped
 * onto `sheet_error` when the service role is available, logged either way,
 * and reported back so the confirmation screen can tell the buyer honestly
 * whether logistics have it yet.
 */
async function syncToSheet(args: {
  orderId: string;
  reference: string;
  createdAt: string;
  row: Record<string, unknown>;
  items: SheetItem[];
}): Promise<boolean> {
  const webhook = process.env.SHEETS_WEBHOOK_URL;
  if (!webhook) {
    console.warn("SHEETS_WEBHOOK_URL is not set — order saved, sheet not updated.");
    return false;
  }

  const r = args.row as Record<string, string | number | null>;
  const payload = {
    secret: process.env.SHEETS_WEBHOOK_SECRET ?? "",
    reference: args.reference,
    placed_at: args.createdAt,
    name: r.full_name,
    email: r.email,
    phone: r.phone,
    address: [r.address_line1, r.address_line2, r.city, r.region, r.postcode, r.country]
      .filter(Boolean)
      .join(", "),
    city: r.city,
    postcode: r.postcode,
    items: args.items
      .map((i) => `${i.qty}x ${i.title}${i.size ? ` (${i.size})` : ""} @ ${i.unit_inr}`)
      .join("\n"),
    item_count: args.items.reduce((n, i) => n + i.qty, 0),
    subtotal_inr: r.subtotal_inr,
    shipping_inr: r.shipping_inr,
    discount_inr: r.discount_inr,
    discount_code: r.discount_code ?? "",
    total_inr: r.total_inr,
    payment_method: r.payment_method,
    payment_status: r.payment_status,
    status: r.status,
    note: r.note ?? "",
  };

  /* Through the shared notifier, so the same SHEETS_WEBHOOK_URL can be a
   * Slack or Discord incoming webhook instead of an Apps Script — see
   * lib/notify. The sheet payload is unchanged; a chat destination gets
   * the written summary instead. The secret is the notifier's to add, so
   * it is taken off the payload here rather than sent twice. */
  const { secret, ...sheetRow } = payload;
  const res = await postNotification(webhook, {
    secret,
    text: orderSummary(r, sheetRow.items as string),
    payload: sheetRow,
  });
  const ok = res.ok;
  const detail = res.detail;

  if (!ok) console.error("sheet sync failed:", detail);

  /* Optional bookkeeping. Buyers have no update policy on orders — by design,
   * so nobody can mark their own order delivered — so stamping the result
   * needs the service role. Without it the order is still correct, it just
   * carries no sync record. */
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.VITE_SUPABASE_URL;
  if (serviceKey && url) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const admin = createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      await admin
        .from("orders")
        .update(
          ok
            ? { sheet_synced_at: new Date().toISOString(), sheet_error: null }
            : { sheet_error: detail },
        )
        .eq("id", args.orderId);
    } catch (e) {
      console.error("could not stamp sheet sync state", e);
    }
  }

  return ok;
}

/** The signed-in buyer's own orders, newest first. RLS does the filtering. */
export async function myOrders() {
  const supabase = await getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("orders")
    .select("id, reference, created_at, total_inr, status, payment_status, items")
    .order("created_at", { ascending: false })
    .limit(25);
  if (error) {
    console.error("could not load orders", error);
    return [];
  }
  return data ?? [];
}
