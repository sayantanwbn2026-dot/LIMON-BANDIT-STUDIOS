import { inr } from "./money";

/**
 * Email to the customer.
 *
 * Until this existed the buyer got a reference on screen and nothing else:
 * no confirmation, no word when it shipped. The house was told about every
 * order (the chat webhook); the person who paid was told nothing. For cash
 * on delivery that gap is the difference between a confident buyer and a
 * "did my order go through?" message three days later.
 *
 * Sent over Resend's HTTP API — a fetch, no dependency, and it runs on
 * Cloudflare Workers where a Node mail library would not. Swapping provider
 * means rewriting `send` and nothing else.
 *
 * SET THESE TO TURN IT ON
 *   RESEND_API_KEY   from resend.com
 *   ORDER_FROM_EMAIL e.g. "Limon Bandit <orders@limonbandit.com>", on a
 *                    domain verified with the provider
 *
 * With neither set, every call is a no-op that logs and reports
 * `configured: false`. The order still completes and the admin screen says
 * the customer was not emailed, rather than implying they were — the same
 * rule the sheet sync and the chat notification already follow.
 */

export type EmailResult = { ok: boolean; configured: boolean; detail: string };

const FROM_FALLBACK = "Limon Bandit <onboarding@resend.dev>";

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

export async function sendEmail(args: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<EmailResult> {
  const key = env("RESEND_API_KEY");
  if (!key) {
    console.warn(`email not sent (RESEND_API_KEY unset): "${args.subject}" to ${args.to}`);
    return { ok: false, configured: false, detail: "Email is not configured." };
  }

  /* A slow mail API must never hold up an order confirmation screen. */
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        from: env("ORDER_FROM_EMAIL") ?? FROM_FALLBACK,
        to: [args.to],
        subject: args.subject,
        text: args.text,
        ...(args.replyTo ? { reply_to: args.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      const body = (await res.text()).slice(0, 300);
      return { ok: false, configured: true, detail: `${res.status} ${body}` };
    }
    return { ok: true, configured: true, detail: "sent" };
  } catch (e) {
    return {
      ok: false,
      configured: true,
      detail: e instanceof Error ? e.message : "could not reach the mail service",
    };
  } finally {
    clearTimeout(timer);
  }
}

/* ---------------- what the customer actually reads ----------------
 *
 * Plain text, no HTML. A receipt is read in a notification preview on a
 * phone more often than it is opened, and plain text survives that, every
 * client, and a spam filter's suspicion of a first-time sender. The house
 * voice is kept short: what they bought, what it costs, what happens next.
 */

type MailOrder = {
  reference: string;
  full_name: string;
  items: { title: string; size?: string | null; qty: number; line_inr: number }[];
  subtotal_inr: number;
  shipping_inr: number;
  discount_inr: number;
  total_inr: number;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  region: string;
  postcode: string;
  payment_method: string;
};

const firstName = (full: string) => full.trim().split(/\s+/)[0] || "there";

function itemLines(o: MailOrder): string {
  return o.items
    .map((i) => `  ${i.qty} x ${i.title}${i.size ? ` (${i.size})` : ""} — ${inr(i.line_inr)}`)
    .join("\n");
}

export function orderConfirmationEmail(o: MailOrder, site: { name: string; email?: string }) {
  const cod = o.payment_method === "cod";
  const text = [
    `Hi ${firstName(o.full_name)},`,
    ``,
    `Your order is in. Reference ${o.reference}.`,
    ``,
    itemLines(o),
    ``,
    `Subtotal ${inr(o.subtotal_inr)}`,
    o.discount_inr ? `Discount −${inr(o.discount_inr)}` : null,
    `Shipping ${o.shipping_inr ? inr(o.shipping_inr) : "Free"}`,
    `Total ${inr(o.total_inr)}`,
    ``,
    `Going to:`,
    `  ${o.address_line1}`,
    o.address_line2 ? `  ${o.address_line2}` : null,
    `  ${o.city}, ${o.region} ${o.postcode}`,
    ``,
    cod
      ? `Payment is cash on delivery — please keep ${inr(o.total_inr)} ready for the courier.`
      : `Payment received.`,
    ``,
    `We will email you again when it ships. Reply to this message if anything is wrong with the address.`,
    ``,
    `— ${site.name}`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  return { subject: `Order ${o.reference} — we have it`, text };
}

const STATUS_LINE: Record<string, string> = {
  confirmed: "Your order is confirmed and being put together.",
  packed: "Your order is packed and waiting for the courier.",
  shipped: "Your order is on its way.",
  delivered: "Your order has been delivered.",
  cancelled: "Your order has been cancelled.",
};

/** `null` for a status not worth an email (received — they already have the confirmation). */
export function orderStatusEmail(
  o: MailOrder,
  status: string,
  site: { name: string; email?: string },
) {
  const line = STATUS_LINE[status];
  if (!line) return null;

  const text = [
    `Hi ${firstName(o.full_name)},`,
    ``,
    line,
    ``,
    `Reference ${o.reference}`,
    itemLines(o),
    status === "cancelled" ? `` : `Total ${inr(o.total_inr)}`,
    status === "shipped" && o.payment_method === "cod"
      ? `Please keep ${inr(o.total_inr)} ready for the courier.`
      : null,
    status === "cancelled"
      ? `Nothing is owed. Reply to this message if that is not what you expected.`
      : `Reply to this message if you need anything.`,
    ``,
    `— ${site.name}`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const subject =
    status === "shipped"
      ? `Order ${o.reference} is on its way`
      : status === "delivered"
        ? `Order ${o.reference} delivered`
        : status === "cancelled"
          ? `Order ${o.reference} cancelled`
          : `Order ${o.reference} — ${status}`;

  return { subject, text };
}
