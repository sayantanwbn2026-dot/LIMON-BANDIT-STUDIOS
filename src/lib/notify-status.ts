import { createServerFn } from "@tanstack/react-start";

/**
 * Whether order and enquiry notifications are actually wired up.
 *
 * THE PROBLEM THIS SOLVES. Every order in the admin reads "Sheet: not
 * synced", and has since the shop opened. That line cannot tell three very
 * different situations apart:
 *
 *   nothing is configured, so nothing was ever attempted;
 *   it is configured and the webhook is failing;
 *   it is configured and WORKING, but the result could not be recorded.
 *
 * The third is the trap. Stamping `sheet_synced_at` writes to `orders`, and
 * buyers deliberately have no update policy on that table — nobody marks
 * their own order delivered — so the stamp needs the service role. Set the
 * webhook without `SUPABASE_SERVICE_ROLE_KEY` and every order syncs
 * perfectly while the admin insists none of them did. Somebody would spend
 * an afternoon debugging a webhook that was never broken.
 *
 * The first is the one that is true today, and it reads as a fleet of failed
 * syncs rather than as a setting nobody has filled in yet.
 *
 * So the server says which of the three it is. BOOLEANS ONLY — this crosses
 * to the browser, and the presence of a secret is a fact worth knowing while
 * its value is never worth sending. There is no code path here that can
 * return one by accident, because the values never enter the object.
 */

export type NotifyStatus = {
  /** A destination for order and enquiry notifications. */
  webhook: boolean;
  /** Only the Google Sheet destination uses it; Slack and Discord do not. */
  secret: boolean;
  /** Needed to record the sync result back onto the order. */
  serviceKey: boolean;
};

export const notifyStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<NotifyStatus> => ({
    /* `Boolean` on the raw value, so an empty string counts as absent in
     * exactly the way the senders' own `if (!webhook)` guards do. A .env
     * line left as `KEY=""` is not configuration, and both places have to
     * agree about that or the admin will describe a state the sender is not
     * in. */
    webhook: Boolean(process.env.SHEETS_WEBHOOK_URL),
    secret: Boolean(process.env.SHEETS_WEBHOOK_SECRET),
    serviceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  }),
);

/** What to tell a person, given the three facts. Plain sentences, no jargon. */
export function explainNotifyStatus(s: NotifyStatus): {
  tone: "bad" | "warn" | "ok";
  text: string;
} {
  if (!s.webhook) {
    return {
      tone: "bad",
      text: "Order and enquiry notifications are not set up, so nothing has been sent anywhere. Orders are safe in the database either way — see scripts/SHEET-SETUP.md.",
    };
  }
  if (!s.serviceKey) {
    return {
      tone: "warn",
      text: "Notifications are being sent, but the result cannot be recorded without SUPABASE_SERVICE_ROLE_KEY — so every order below will say “not synced” even when it went through.",
    };
  }
  return { tone: "ok", text: "Notifications are set up." };
}
