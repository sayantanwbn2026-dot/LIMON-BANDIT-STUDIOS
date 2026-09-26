import { rooms } from "@/data/rooms";
import { crew } from "@/data/crew";
import { drops } from "@/data/drops";

/**
 * What the rest of the site is actually asking the contact form for.
 *
 * Twenty of the site's links do not just point at /contact, they name a
 * thing: `?intent=booking&room=room-a`, `?intent=crew&who=c01`,
 * `?intent=order&item=d1`. The form used to read `intent` and drop the
 * rest on the floor, so pressing "Book Room A" landed you on a general
 * enquiry form with the room you had just chosen nowhere on it — the site
 * asked you to pick, then made you say it again in prose.
 *
 * This resolves the named thing against the same data the linking page
 * rendered from, so the two can never disagree about what Room A costs.
 *
 * Unknown or absent ids resolve to `undefined` rather than throwing or
 * printing "undefined": a stale link should degrade to the general form,
 * which is exactly where it used to land anyway.
 */

export const INTENTS = [
  { id: "booking", label: "Book a room" },
  { id: "demo", label: "Submit a demo" },
  { id: "crew", label: "Hire the crew" },
  { id: "order", label: "Order merch" },
  { id: "join-crew", label: "Join the crew" },
  { id: "other", label: "Something else" },
] as const;

export type IntentId = (typeof INTENTS)[number]["id"];

export const DEFAULT_INTENT: IntentId = "booking";

export type Subject = {
  /** what kind of thing, for the line above the name */
  kind: string;
  /** the thing itself, e.g. "Room A" */
  title: string;
  /** the fact that made them click, e.g. "₹2,400 / hr" */
  detail?: string;
};

export type Enquiry = {
  intent: IntentId;
  subject?: Subject;
};

function isIntent(v: string | null): v is IntentId {
  return !!v && INTENTS.some((i) => i.id === v);
}

/** Resolve a query string — `?intent=…&room=…&who=…&item=…` — into an enquiry. */
export function readEnquiry(search: string): Enquiry {
  const q = new URLSearchParams(search);
  const raw = q.get("intent");
  const intent: IntentId = isIntent(raw) ? raw : DEFAULT_INTENT;

  const roomId = q.get("room");
  if (roomId) {
    const r = rooms.find((x) => x.id === roomId);
    if (r) {
      /* The estimator on the home page sends the length along with the room,
       * so the message says "Room A (₹2,400 / hr · 4 hours)" rather than
       * making someone retype the thing they just chose. */
      const hours = Number(q.get("hours"));
      const length =
        Number.isFinite(hours) && hours > 0
          ? ` · ${hours} ${/night/i.test(r.rate) ? (hours === 1 ? "night" : "nights") : "hours"}`
          : "";
      return { intent, subject: { kind: "Room", title: r.name, detail: `${r.rate}${length}` } };
    }
  }

  const whoId = q.get("who");
  if (whoId) {
    const c = crew.find((x) => x.id === whoId);
    if (c) return { intent, subject: { kind: c.discipline, title: c.name, detail: c.rate } };
  }

  const itemId = q.get("item");
  if (itemId) {
    const d = drops.find((x) => x.id === itemId);
    if (d) return { intent, subject: { kind: "Item", title: d.title, detail: d.price } };
  }

  return { intent };
}

/**
 * The opening line we put in the message box when a subject is known.
 *
 * Prefilled rather than merely displayed, because the mail this form
 * composes is read by a person: "Room A" in a field they cannot see in
 * their inbox is worth less than a sentence in the body. Left editable —
 * it is a starting point, not a locked field.
 */
export function openingLine(intent: IntentId, s: Subject): string {
  switch (intent) {
    case "booking":
      return `I'd like to book ${s.title}${s.detail ? ` (${s.detail})` : ""}. `;
    case "crew":
      return `I'd like to hire ${s.title}${s.detail ? ` (${s.detail})` : ""}. `;
    case "order":
      return `I'd like to order ${s.title}${s.detail ? ` (${s.detail})` : ""}. `;
    default:
      return `About ${s.title}. `;
  }
}
