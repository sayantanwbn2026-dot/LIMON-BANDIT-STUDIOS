import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { orderStatusEmail, sendEmail } from "./email";
import { ORDER_STATUSES } from "@/cms/inbox";

/**
 * "Your order is on its way" — sent from the admin, composed on the server.
 *
 * It cannot run in the browser: the mail provider's key would have to be in
 * the bundle, which is the same as publishing it. So the admin screen asks
 * the server, and the server decides whether the asker is allowed.
 *
 * The caller's own access token is used to talk to the database, and the
 * first thing it does is ask the database `is_admin()`. That is the real
 * gate — not the route guard, not a flag in the request. A signed-in shopper
 * who calls this with their own token gets "not allowed", and cannot read
 * anyone's order to email about in the first place, because the select
 * policy on `orders` is admin-only or own-row.
 */

const Input = z.object({
  accessToken: z.string().min(10),
  orderId: z.string().uuid(),
  status: z.enum(ORDER_STATUSES),
});

export type OrderMailResult =
  | { ok: true; sent: boolean; detail: string }
  | { ok: false; message: string };

export const sendOrderStatusMail = createServerFn({ method: "POST" })
  .validator((raw: unknown) => Input.parse(raw))
  .handler(async ({ data }): Promise<OrderMailResult> => {
    const url =
      process.env.VITE_SUPABASE_URL || (import.meta.env.VITE_SUPABASE_URL as string | undefined);
    const publishable =
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined);
    if (!url || !publishable) return { ok: false, message: "The database is not configured." };

    const { createClient } = await import("@supabase/supabase-js");
    const asUser = createClient(url, publishable, {
      global: { headers: { Authorization: `Bearer ${data.accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: isAdmin, error: adminError } = await asUser.rpc("is_admin");
    if (adminError || isAdmin !== true) {
      return { ok: false, message: "That account is not allowed to send order email." };
    }

    const { data: order, error } = await asUser
      .from("orders")
      .select("*")
      .eq("id", data.orderId)
      .maybeSingle();
    if (error || !order) return { ok: false, message: "That order could not be read." };

    const { data: siteDoc } = await asUser
      .from("cms_documents")
      .select("data")
      .eq("key", "global.site")
      .maybeSingle();
    const site = (siteDoc?.data ?? {}) as { name?: string; email?: string };

    const mail = orderStatusEmail(order as Parameters<typeof orderStatusEmail>[0], data.status, {
      name: site.name?.trim() || "Limon Bandit",
      email: site.email,
    });
    /* "received" has no message of its own — the confirmation already said
     * it. Telling the admin nothing was sent is the honest answer. */
    if (!mail) return { ok: true, sent: false, detail: "No email is sent for that status." };

    const res = await sendEmail({
      to: order.email as string,
      subject: mail.subject,
      text: mail.text,
      replyTo: site.email,
    });

    if (res.ok) return { ok: true, sent: true, detail: `Emailed ${order.email as string}.` };
    if (!res.configured) {
      return {
        ok: true,
        sent: false,
        detail: "Email is not set up yet, so the customer was not told.",
      };
    }
    return { ok: false, message: `The email did not go out: ${res.detail}` };
  });
