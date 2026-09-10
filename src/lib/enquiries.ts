import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { enquirySummary, postNotification } from "./notify";

/**
 * Sending an enquiry.
 *
 * This is the studio's entire inbound path — "Book the room", "Submit your
 * demo" and "Hire the crew" all end at the same form — and until now it
 * composed a `mailto:` and handed off to the visitor's mail client. On a
 * phone that mostly works. On a desktop where mail is Gmail in a browser
 * tab there is no registered handler at all: the button appears to do
 * nothing, no error is raised, and the enquiry is gone. The people most
 * likely to be booking a studio from a laptop were the people least
 * likely to reach anyone.
 *
 * So it is stored first and announced second, in that order, for the same
 * reason orders are: a message that is saved but unannounced is a message
 * someone can still find, and a message that is announced but unsaved is
 * gone the moment the tab with the notification closes.
 *
 * The insert runs as whoever is asking — a signed-in member or a complete
 * stranger — under RLS. `enquiries` grants insert to anon and select only
 * to admins, so the form is open to the public while the resulting list of
 * names, emails and phone numbers is not readable by the public that
 * filled it in. The insert never touches the service role; it is used for
 * one optional thing, recording whether the notification went out, and
 * the form works without it.
 */

const Input = z.object({
  intent: z.string().min(1).max(40),
  fullName: z.string().trim().min(2, "Tell us who you are.").max(120),
  email: z.string().trim().email("That address will not reach you — check it."),
  phone: z.string().trim().max(40).optional().default(""),
  message: z.string().trim().min(10, "A sentence or two, so we know what you need.").max(4000),
  sourcePath: z.string().max(200).optional().default(""),
});

export type EnquiryInput = z.infer<typeof Input>;
export type EnquiryResult =
  | { ok: true; reference: string; notified: boolean }
  | { ok: false; message: string };

/** Short, human-quotable, and unique enough for a few a day. */
function makeReference(): string {
  const now = new Date();
  const stamp =
    String(now.getFullYear()).slice(2) +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  const tail = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LB-${stamp}-${tail}`;
}

/** Turn a ZodError into one sentence a person can act on. */
function readableIssue(e: unknown): string {
  if (e instanceof z.ZodError) {
    const first = e.issues[0];
    return first?.message || "Something in that form was not right.";
  }
  return e instanceof Error ? e.message : "Could not send that. Try again in a moment.";
}

export const submitEnquiry = createServerFn({ method: "POST" })
  .validator((raw: unknown) => Input.parse(raw))
  .handler(async ({ data }): Promise<EnquiryResult> => {
    /* A client built here, not `getSupabase()`. That helper deliberately
     * returns null on the server — it builds an auth client that reaches
     * for localStorage — so using it made every enquiry fail with "not
     * connected" in production while working fine in any test that ran
     * in a browser. Same construction orders.ts uses, with no session and
     * the publishable key: this runs as a stranger, under RLS. */
    const url = process.env.VITE_SUPABASE_URL;
    const publishable = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !publishable) {
      return {
        ok: false,
        message: "Messages are not connected yet. Email us directly in the meantime.",
      };
    }
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, publishable, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    /* The id and timestamp are made here rather than read back. Reading
     * back means `insert().select()`, and PostgREST can only return a row
     * the caller is allowed to SELECT — which a stranger, correctly, is
     * not. Asking for it would turn every successful insert into an RLS
     * error. Knowing the id up front also means the notification and the
     * admin stamp can refer to the exact row without a second query. */
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const reference = makeReference();
    const row = {
      id,
      reference,
      intent: data.intent,
      full_name: data.fullName,
      email: data.email,
      phone: data.phone || null,
      message: data.message,
      source_path: data.sourcePath || null,
      status: "new",
      created_at: createdAt,
    };

    const { error } = await supabase.from("enquiries").insert(row);
    if (error) {
      console.error("enquiry insert failed", error);
      return { ok: false, message: "Could not send that just now. Try again in a moment." };
    }
    const inserted = { id, created_at: createdAt };

    /* Announced second, and never allowed to fail the send. The visitor's
     * message is safely stored by this point; telling them it failed
     * because a chat webhook was slow would be a lie that costs a booking. */
    let notified = false;
    const webhook = process.env.SHEETS_WEBHOOK_URL;
    if (webhook) {
      const res = await postNotification(webhook, {
        secret: process.env.SHEETS_WEBHOOK_SECRET,
        text: enquirySummary({ ...row, reference }),
        payload: {
          kind: "enquiry",
          reference,
          received_at: inserted.created_at,
          intent: row.intent,
          name: row.full_name,
          email: row.email,
          phone: row.phone ?? "",
          message: row.message,
          source: row.source_path ?? "",
        },
      });
      notified = res.ok;
      if (!res.ok) console.warn("enquiry notification failed:", res.detail);

      /* Record whether it went out, so the admin can list what nobody was
       * told about. A stranger has no UPDATE policy on enquiries — that is
       * the point — so this needs the service role, and without it the row
       * keeps notified_at null. That is the honest default: "not recorded
       * as delivered" is true, where "delivered" might not be. */
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceKey && serviceKey.length > 20) {
        try {
          const admin = createClient(url, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          await admin
            .from("enquiries")
            .update(
              res.ok
                ? { notified_at: new Date().toISOString(), notify_error: null }
                : { notify_error: res.detail.slice(0, 300) },
            )
            .eq("id", inserted.id);
        } catch (e) {
          console.error("could not stamp enquiry delivery", e);
        }
      }
    } else {
      console.warn("SHEETS_WEBHOOK_URL is not set — enquiry saved, nobody notified.");
    }

    return { ok: true, reference, notified };
  });

export { readableIssue as readableEnquiryIssue };
