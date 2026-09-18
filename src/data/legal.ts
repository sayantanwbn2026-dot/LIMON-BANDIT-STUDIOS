/**
 * The three policy pages: terms, privacy, and shipping & returns.
 *
 * Committed in CMS shape (the same block format as journal posts) so they
 * seed the "Legal pages" collection and render from it. The copy describes
 * what this site actually does — cash on delivery, Supabase accounts, a
 * first-party analytics id in sessionStorage and no cookies, enquiries and
 * the mailing list — rather than boilerplate for a site it is not.
 *
 * REPLACE / REVIEW — these are working drafts written from the code, not
 * legal advice. Have them read by someone qualified before relying on them,
 * and fill in the registered business name and grievance officer.
 */

export type LegalBlock = { kind: "p" | "h2" | "list" | "quote"; text: string; who: string };

export type LegalDoc = {
  slug: string;
  title: string;
  /** ISO date the policy last changed — shown at the top of the page */
  updated: string;
  standfirst: string;
  body: LegalBlock[];
};

const p = (text: string): LegalBlock => ({ kind: "p", text, who: "" });
const h = (text: string): LegalBlock => ({ kind: "h2", text, who: "" });
const list = (...items: string[]): LegalBlock => ({
  kind: "list",
  text: items.join("\n"),
  who: "",
});

export const legal: LegalDoc[] = [
  {
    slug: "terms",
    title: "Terms of use",
    updated: "2026-09-18",
    standfirst:
      "The rules for booking a room, buying from the shop and using this site. Plain language, no small print.",
    body: [
      h("Who we are"),
      p(
        "Limon Bandit is a music house in Kolkata: recording rooms, an independent label and a merch line. When these terms say “we” or “us”, that is who they mean. You can reach us through the contact page or at the email address in the footer.",
      ),
      h("Using the site"),
      p(
        "You can browse, listen and read without an account. You need an account to save a wishlist, check out, or see your past orders. Keep your password to yourself — anything done while signed in to your account is treated as done by you.",
      ),
      h("Booking a room"),
      list(
        "A booking is confirmed when we reply to confirm it, not when the enquiry is sent.",
        "Rates are the ones shown on the Rooms page on the day you book.",
        "If you need to move a session, tell us as early as you can; we will do our best to find another slot.",
      ),
      h("Orders from the shop"),
      list(
        "Prices are in Indian rupees and include applicable taxes unless the product page says otherwise.",
        "The total is worked out on our server when you place the order, and that is the figure you pay.",
        "Payment is cash on delivery. Please have the exact amount ready.",
        "We may cancel an order if an item turns out to be out of stock or a price was shown in error. If that happens we will tell you, and nothing is owed.",
        "Discount codes apply to the subtotal, one per order, and cannot be exchanged for cash.",
      ),
      h("Music, artwork and content"),
      p(
        "The recordings, cover art, photographs and writing on this site belong to Limon Bandit or to the artists who made them. You are welcome to listen and share links. Please do not re-upload, sell or use them commercially without asking.",
      ),
      h("Demos and submissions"),
      p(
        "Sending us a demo does not transfer any rights to us. If we want to work on a record together, that happens under a separate written agreement.",
      ),
      h("Liability"),
      p(
        "We work hard to keep the site accurate and running, but we cannot promise it will always be available or error-free. Nothing in these terms limits any right you have under Indian consumer law.",
      ),
      h("Changes and governing law"),
      p(
        "If these terms change, the date at the top of this page changes with them. They are governed by the laws of India, and the courts of Kolkata have jurisdiction.",
      ),
    ],
  },
  {
    slug: "privacy",
    title: "Privacy policy",
    updated: "2026-09-18",
    standfirst:
      "What we collect, why, where it is kept and how to get it deleted. We collect as little as we can.",
    body: [
      h("What we collect"),
      list(
        "Your account: email address and a password (stored hashed by our database provider — we never see it).",
        "Orders: name, phone, delivery address and what you bought, so we can deliver it.",
        "Enquiries: whatever you write in the contact form, with your name, email and phone if you give them.",
        "The mailing list: your email address, if you sign up.",
        "Wishlist: the products you save, tied to your account.",
        "Visits: which pages were viewed, counted with a random id kept in your browser tab for that visit only.",
      ),
      h("What we do not do"),
      list(
        "No advertising trackers and no third-party analytics.",
        "No tracking cookies. The visit id lives in session storage and disappears when you close the tab.",
        "We do not sell or rent your details to anyone.",
      ),
      h("Why we use it"),
      p(
        "To deliver orders, answer enquiries, send the newsletter you asked for, and understand which pages people actually read. That is all.",
      ),
      h("Where it is kept"),
      p(
        "Accounts, orders and enquiries are stored with Supabase, our database provider. Order details are also copied to the sheet our team uses to pack and ship. Only the people who run the shop and the studio can read them.",
      ),
      h("How long we keep it"),
      p(
        "Order records are kept for as long as tax and accounting law requires. Enquiries and mailing-list addresses are kept until you ask us to remove them.",
      ),
      h("Your rights"),
      p(
        "You can ask to see the personal data we hold about you, to correct it, or to delete it — including your account. Write to us from the address you used and we will act on it within 30 days. You can leave the mailing list at any time by replying to any email with “unsubscribe”.",
      ),
      h("Grievance officer"),
      p(
        "Questions or complaints about how your data is handled go to our grievance officer through the email address in the footer. We acknowledge within 48 hours and resolve within 30 days.",
      ),
    ],
  },
  {
    slug: "shipping-returns",
    title: "Shipping & returns",
    updated: "2026-09-18",
    standfirst:
      "How orders reach you, what it costs, and what to do if something is wrong with what arrived.",
    body: [
      h("Where we ship"),
      p(
        "Anywhere in India. Shipping is charged at a flat rate — one rate inside Kolkata, one for the rest of the country — and is shown at checkout before you place the order. Digital items do not ship and carry no delivery charge.",
      ),
      h("How long it takes"),
      list(
        "Kolkata: usually 2–4 working days.",
        "Rest of India: usually 5–9 working days.",
        "Printed-to-order items take a few extra days; the product page says so.",
      ),
      h("Paying"),
      p(
        "All orders are cash on delivery. Please keep the exact amount ready — the courier may not carry change.",
      ),
      h("Returns"),
      list(
        "Clothing can be returned within 7 days of delivery if it is unworn, unwashed and has its tags.",
        "CDs, vinyl and posters can be returned within 7 days if they are still sealed.",
        "Digital items cannot be returned once delivered.",
      ),
      h("Damaged or wrong items"),
      p(
        "If something arrives damaged or is not what you ordered, message us within 48 hours with your order reference and a photo. We will replace it or refund you in full, and we cover the return shipping.",
      ),
      h("Refunds"),
      p(
        "Once a return reaches us and is checked, we refund to your bank account or UPI within 7 working days. Original shipping charges are refunded only when the mistake was ours.",
      ),
      h("Cancelling"),
      p(
        "You can cancel any order before it ships. Write to us with the order reference — there is no charge.",
      ),
    ],
  },
];
