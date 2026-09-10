/**
 * Telling a human that something arrived.
 *
 * An order lands in Postgres whether or not anyone is told, so nothing is
 * ever lost — but "nothing is lost" is not the same as "somebody knows".
 * Until this existed the only notification path was a Google Apps Script
 * webhook, and that is a genuinely awkward thing to stand up: write the
 * script, deploy it as a web app, set the access to "anyone", copy the
 * exec URL. It stayed unset, so orders arrived and nobody heard.
 *
 * So the destination is now whatever is easiest to actually create.
 * Slack and Discord incoming webhooks take under a minute and both are
 * places a small team already looks all day; the Apps Script path is
 * unchanged for anyone who wants rows in a spreadsheet. Which one you
 * get is inferred from the URL, because asking someone to set both a URL
 * and a "type" is one more thing to get wrong.
 *
 * The shapes are not interchangeable, which is why callers hand over
 * both a written summary and a structured record: chat wants a sentence,
 * a spreadsheet wants columns. Building only one and coercing it into
 * the other is how these end up posting `[object Object]` into a channel.
 */

export type Destination = "slack" | "discord" | "sheet";

/** Which service this URL belongs to. Unrecognised hosts get the sheet shape. */
export function destinationFor(url: string): Destination {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return "sheet";
  }
  if (host.endsWith("hooks.slack.com")) return "slack";
  if (host.endsWith("discord.com") || host.endsWith("discordapp.com")) return "discord";
  return "sheet";
}

export type NotifyResult = { ok: boolean; detail: string };

export async function postNotification(
  url: string,
  opts: {
    /** shared secret, only meaningful for the Apps Script endpoint */
    secret?: string;
    /** plain-text summary — what a chat channel shows */
    text: string;
    /** the row, for a spreadsheet */
    payload: Record<string, unknown>;
    /** abandon a slow endpoint rather than holding the request open */
    timeoutMs?: number;
  },
): Promise<NotifyResult> {
  const kind = destinationFor(url);

  /* Discord rejects messages over 2000 characters outright, and Slack
   * silently truncates. Cheaper to trim here than to debug a 400 later. */
  const text = opts.text.length > 1900 ? `${opts.text.slice(0, 1897)}...` : opts.text;

  const body =
    kind === "slack"
      ? JSON.stringify({ text })
      : kind === "discord"
        ? JSON.stringify({ content: text })
        : JSON.stringify({ secret: opts.secret ?? "", ...opts.payload });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 8000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      signal: controller.signal,
    });
    const responseText = await res.text().catch(() => "");

    if (kind === "sheet") {
      /* Apps Script 302s to script.googleusercontent.com on success and
       * fetch follows it, so the status alone proves nothing — the script
       * has to say so in the body. */
      const ok = res.ok && /"ok"\s*:\s*true/.test(responseText);
      return { ok, detail: ok ? "" : `${res.status} ${responseText.slice(0, 200)}` };
    }

    /* Slack answers "ok"; Discord answers 204 with an empty body. */
    const ok = res.ok;
    return { ok, detail: ok ? "" : `${res.status} ${responseText.slice(0, 200)}` };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : String(e) };
  } finally {
    clearTimeout(timer);
  }
}

/** Currency, for the one-line summaries. */
function inr(n: unknown): string {
  const v = typeof n === "number" ? n : Number(n ?? 0);
  return `₹${v.toLocaleString("en-IN")}`;
}

/** The written summary of an order, for a chat channel. */
export function orderSummary(row: Record<string, unknown>, itemLines: string): string {
  const addr = [row.address_line1, row.address_line2, row.city, row.region, row.postcode]
    .filter(Boolean)
    .join(", ");
  return lines([
    `🛒 *New order ${String(row.reference)}* — ${inr(row.total_inr)}`,
    `${String(row.full_name)} · ${String(row.email)}${row.phone ? ` · ${String(row.phone)}` : ""}`,
    addr || null,
    "",
    itemLines,
    "",
    `Subtotal ${inr(row.subtotal_inr)} · Shipping ${inr(row.shipping_inr)}${
      row.discount_inr ? ` · Discount -${inr(row.discount_inr)}` : ""
    }`,
    `Pay: ${String(row.payment_method)} (${String(row.payment_status)})`,
    row.note ? `Note: ${String(row.note)}` : null,
  ]);
}

/** The written summary of an enquiry. */
export function enquirySummary(row: Record<string, unknown>): string {
  return lines([
    `✉️ *New enquiry ${String(row.reference)}* — ${String(row.intent)}`,
    `${String(row.full_name)} · ${String(row.email)}${row.phone ? ` · ${String(row.phone)}` : ""}`,
    "",
    String(row.message),
  ]);
}

/**
 * Join summary lines, where `null` means "leave this line out" and `""`
 * means "a blank line here". They used to share one filter(Boolean), which
 * treats both as nothing — so every deliberate spacer vanished and an
 * enquiry's message ran straight on from the sender's email address.
 */
function lines(parts: (string | null)[]): string {
  return parts.filter((p): p is string => p !== null).join("\n");
}
