import { expect, test, describe } from "bun:test";
import { inr, discountOf } from "./money";
import { findOffer } from "@/data/offers";
import { orderConfirmationEmail, orderStatusEmail } from "./email";

/**
 * The money paths, which had no tests at all.
 *
 * These are the places where a silent bug costs real rupees: rounding a
 * discount the wrong way, honouring an expired code, or an email that quotes
 * a different total from the one the courier collects. Everything here is a
 * pure function — the parts that talk to Postgres are covered by the RLS and
 * stock probes in the migrations, not by mocks that would only prove the
 * mocks work.
 *
 * `bun test` — no test framework added; Bun ships one.
 */

describe("inr", () => {
  test("formats whole rupees, no paise", () => {
    expect(inr(1400)).toContain("1,400");
    expect(inr(1400)).not.toContain(".");
  });

  test("zero is a price, not a blank", () => {
    expect(inr(0)).toContain("0");
  });
});

describe("discountOf", () => {
  test("ten percent of 1,400 is 140", () => {
    expect(discountOf(1400, 10)).toBe(140);
  });

  test("rounds to whole rupees — the cart cannot carry paise", () => {
    const d = discountOf(1499, 15);
    expect(Number.isInteger(d)).toBe(true);
  });

  test("never exceeds the subtotal, and never goes negative", () => {
    expect(discountOf(1000, 100)).toBeLessThanOrEqual(1000);
    expect(discountOf(1000, 0)).toBe(0);
    expect(discountOf(0, 25)).toBe(0);
  });
});

describe("findOffer", () => {
  const list = [
    { code: "TENOFF", percent: 10, label: "10% off", expires: null },
    { code: "GONE", percent: 50, label: "50% off", expires: "2020-01-01" },
  ];

  test("matches case-insensitively and ignores stray spaces", () => {
    expect(findOffer("  tenoff ", list)?.code).toBe("TENOFF");
  });

  test("refuses an expired code", () => {
    expect(findOffer("GONE", list)).toBeNull();
  });

  test("refuses an unknown code, and empty input", () => {
    expect(findOffer("NOPE", list)).toBeNull();
    expect(findOffer("", list)).toBeNull();
    expect(findOffer(null, list)).toBeNull();
  });

  test("searches the list it is given, not the compiled one", () => {
    expect(findOffer("TENOFF", [])).toBeNull();
  });
});

const order = {
  reference: "LB-260924-AB12",
  full_name: "Rana Sen",
  items: [
    { title: "Bandit Tee", size: "M", qty: 2, line_inr: 2800 },
    { title: "Lockout Hoodie", size: null, qty: 1, line_inr: 3200 },
  ],
  subtotal_inr: 6000,
  shipping_inr: 80,
  discount_inr: 600,
  total_inr: 5480,
  address_line1: "14B Sisir Bhaduri Sarani",
  address_line2: null,
  city: "Kolkata",
  region: "West Bengal",
  postcode: "700006",
  payment_method: "cod",
};

const site = { name: "Limon Bandit", email: "room@limonbandit.com" };

describe("order confirmation email", () => {
  const mail = orderConfirmationEmail(order, site);

  test("leads with the reference, in the subject as well as the body", () => {
    expect(mail.subject).toContain("LB-260924-AB12");
    expect(mail.text).toContain("LB-260924-AB12");
  });

  test("quotes the same total the courier will collect", () => {
    expect(mail.text).toContain(inr(5480));
  });

  test("lists every line with its size and quantity", () => {
    expect(mail.text).toContain("2 x Bandit Tee (M)");
    expect(mail.text).toContain("1 x Lockout Hoodie");
    expect(mail.text).not.toContain("(null)");
  });

  test("says cash on delivery when that is how it is paid", () => {
    expect(mail.text.toLowerCase()).toContain("cash on delivery");
  });

  test("uses the first name only, and never leaves a placeholder", () => {
    expect(mail.text.startsWith("Hi Rana,")).toBe(true);
    expect(orderConfirmationEmail({ ...order, full_name: "  " }, site).text).toStartWith(
      "Hi there,",
    );
  });
});

describe("order status email", () => {
  test("shipped reminds a cash buyer what to have ready", () => {
    const mail = orderStatusEmail(order, "shipped", site);
    expect(mail?.subject).toContain("on its way");
    expect(mail?.text).toContain(inr(5480));
  });

  test("cancelled says nothing is owed, and drops the total", () => {
    const mail = orderStatusEmail(order, "cancelled", site);
    expect(mail?.text).toContain("Nothing is owed");
  });

  test("received sends nothing — the confirmation already said it", () => {
    expect(orderStatusEmail(order, "received", site)).toBeNull();
  });

  test("an unknown status sends nothing rather than a half-written email", () => {
    expect(orderStatusEmail(order, "banana", site)).toBeNull();
  });
});
