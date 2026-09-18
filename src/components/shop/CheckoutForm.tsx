import { useEffect, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { BoundaryRule, GridRules } from "@/components/lb/GridRules";
import { Eyebrow } from "@/components/lb/Section";
import { Field, FormNotice, SubmitButton } from "@/components/lb/Field";
import { CmsImage } from "@/components/lb/CmsImage";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { getSupabase } from "@/lib/supabase";
import { submitOrder, type PlacedOrder } from "@/lib/orders";
import { findOffer } from "@/data/offers";
import { useOffers } from "@/cms/hooks";
import { inr } from "@/lib/money";

/**
 * Checkout.
 *
 * The summary on the right is a preview. The numbers that are charged are
 * recomputed on the server from the same catalogue, so this cannot quote one
 * price and file another — see the note at the top of `lib/orders.ts` for why
 * that matters when the money is collected at the door.
 *
 * Signed-out visitors never reach the form: the route opens the login popup
 * and holds them on a stub until a session exists. That is the same gate the
 * Add buttons use, applied to a whole page rather than one control.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PIN = /^[1-9][0-9]{5}$/;

type FieldKey = "fullName" | "email" | "phone" | "addressLine1" | "city" | "region" | "postcode";

type Errors = Partial<Record<FieldKey, string>>;

export function CheckoutForm() {
  const offers = useOffers();
  const { user, openAuth, loading } = useAuth();
  const cart = useCart();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("Kolkata");
  const [region, setRegion] = useState("West Bengal");
  const [postcode, setPostcode] = useState("");
  const [note, setNote] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [codeNote, setCodeNote] = useState<string | null>(null);

  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  /* Seed from the account so a returning member is not retyping their own
   * name. Only ever fills an empty box. */
  useEffect(() => {
    if (!user) return;
    const meta = user.user_metadata as { full_name?: string; phone?: string } | undefined;
    setEmail((v) => v || user.email || "");
    setFullName((v) => v || meta?.full_name || "");
    setPhone((v) => v || meta?.phone || "");
  }, [user]);

  useEffect(() => {
    if (loading || user) return;
    openAuth("Sign in to check out. Your cart is waiting.");
  }, [loading, user, openAuth]);

  const digital = cart.allDigital;

  const validate = (): Errors => {
    const e: Errors = {};
    if (fullName.trim().length < 2) e.fullName = "Tell us who is receiving it.";
    if (!EMAIL.test(email)) e.email = "That address will not reach you — check it.";
    if (phone.trim().replace(/\D/g, "").length < 10) {
      e.phone = "Ten digits, so the driver can call.";
    }
    /* A digital-only basket has nowhere to ship to, so the address is not
     * asked for and must not be validated. */
    if (!digital) {
      if (addressLine1.trim().length < 4) e.addressLine1 = "Street and building.";
      if (city.trim().length < 2) e.city = "Which city.";
      if (region.trim().length < 2) e.region = "Which state.";
      if (!PIN.test(postcode.trim())) e.postcode = "Six digits, Indian PIN.";
    }
    return e;
  };

  const blur = (k: FieldKey) => () => {
    setTouched((t) => ({ ...t, [k]: true }));
    setErrors(validate());
  };
  const err = (k: FieldKey) => (touched[k] ? errors[k] : undefined);

  const applyCode = () => {
    const found = findOffer(codeInput, offers);
    if (!found) {
      setCodeNote("That code is not one of ours, or it has expired.");
      return;
    }
    cart.applyOffer({ code: found.code, percent: found.percent });
    setCodeNote(`${found.label} applied.`);
    setCodeInput("");
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFailure(null);

    const found = validate();
    setErrors(found);
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      addressLine1: true,
      city: true,
      region: true,
      postcode: true,
    });

    const firstBad = (
      ["fullName", "email", "phone", "addressLine1", "city", "region", "postcode"] as const
    ).find((k) => found[k]);
    if (firstBad) {
      document.getElementById(`co-${firstBad}`)?.focus();
      return;
    }

    const supabase = await getSupabase();
    const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
    const token = data.session?.access_token;
    if (!token) {
      openAuth("Your session expired. Sign in again to finish the order.");
      return;
    }

    setBusy(true);
    try {
      const result = await submitOrder({
        data: {
          accessToken: token,
          lines: cart.lines.map((l) => ({
            productId: l.productId,
            size: l.size,
            qty: l.qty,
          })),
          address: {
            fullName,
            email,
            phone,
            addressLine1: digital ? "Digital delivery" : addressLine1,
            addressLine2: digital ? "" : addressLine2,
            city: digital ? "—" : city,
            region: digital ? "—" : region,
            postcode: digital ? "000000" : postcode,
            country: "India",
            note,
          },
          discountCode: cart.offer?.code ?? null,
          shipRegion: cart.region,
        },
      });

      setPlaced(result);
      cart.clear();
      cart.clearOffer();
    } catch (e) {
      setFailure(
        e instanceof Error
          ? e.message
          : "The order did not go through. Nothing was charged — try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  // ---- states before the form ----

  if (placed) return <Confirmation order={placed} />;

  if (!loading && !user) {
    return (
      <Stub
        title="Members only"
        body="Checkout is for members. The sign-in popup is open — or press below if you closed it."
      >
        <button
          type="button"
          onClick={() => openAuth("Sign in to check out. Your cart is waiting.")}
          className="flex h-[56px] items-center justify-center bg-acid px-8 font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-accent-text transition-colors duration-300 hover:bg-acid-dim"
        >
          Sign in
        </button>
      </Stub>
    );
  }

  if (cart.resolved.length === 0) {
    return (
      <Stub title="Your cart is empty" body="Nothing to check out. The shop is through here.">
        <Link
          to="/shop"
          className="flex h-[56px] items-center justify-center bg-acid px-8 font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-accent-text transition-colors duration-300 hover:bg-acid-dim"
        >
          Go to the shop
        </Link>
      </Stub>
    );
  }

  return (
    <section className="relative w-full bg-surface-deep py-[96px]">
      <GridRules tone="dark" />
      <BoundaryRule tone="dark" className="top-0" />

      <div className="shell relative z-[2]">
        <div className="section-head">
          <div className="md:col-span-1">
            <Eyebrow tone="dark" surface="bg-surface-deep">
              Checkout
            </Eyebrow>
          </div>
          <div className="md:col-span-2">
            <h2 className="t-h2 text-text">Where it goes</h2>
          </div>
          <div className="flex items-end md:col-span-1">
            <p className="font-ui text-[16px] leading-[1.5] text-mute">
              {digital
                ? "Digital only — no address needed. The files go to your email."
                : "Pay the driver on delivery. We confirm stock before dispatch."}
            </p>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px] lg:gap-12">
          <form onSubmit={onSubmit} noValidate>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <Field
                id="co-fullName"
                label="Full name"
                value={fullName}
                onChange={setFullName}
                onBlur={blur("fullName")}
                error={err("fullName")}
                placeholder="Who is receiving it"
                autoComplete="name"
                required
              />
              <Field
                id="co-phone"
                label="Phone"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={setPhone}
                onBlur={blur("phone")}
                error={err("phone")}
                placeholder="+91"
                autoComplete="tel"
                required
              />
            </div>

            <div className="mt-8">
              <Field
                id="co-email"
                label="Email"
                type="email"
                inputMode="email"
                value={email}
                onChange={setEmail}
                onBlur={blur("email")}
                error={err("email")}
                placeholder="you@somewhere.in"
                autoComplete="email"
                required
                hint={digital ? "The download link goes here." : undefined}
              />
            </div>

            {!digital ? (
              <>
                <div className="mt-8">
                  <Field
                    id="co-addressLine1"
                    label="Address"
                    value={addressLine1}
                    onChange={setAddressLine1}
                    onBlur={blur("addressLine1")}
                    error={err("addressLine1")}
                    placeholder="Street, building, flat"
                    autoComplete="address-line1"
                    required
                  />
                </div>
                <div className="mt-8">
                  <Field
                    id="co-addressLine2"
                    label="Landmark"
                    value={addressLine2}
                    onChange={setAddressLine2}
                    placeholder="Optional — what the driver should look for"
                    autoComplete="address-line2"
                  />
                </div>

                <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
                  <Field
                    id="co-city"
                    label="City"
                    value={city}
                    onChange={setCity}
                    onBlur={blur("city")}
                    error={err("city")}
                    autoComplete="address-level2"
                    required
                  />
                  <Field
                    id="co-region"
                    label="State"
                    value={region}
                    onChange={setRegion}
                    onBlur={blur("region")}
                    error={err("region")}
                    autoComplete="address-level1"
                    required
                  />
                  <Field
                    id="co-postcode"
                    label="PIN"
                    inputMode="numeric"
                    value={postcode}
                    onChange={setPostcode}
                    onBlur={blur("postcode")}
                    error={err("postcode")}
                    placeholder="700006"
                    autoComplete="postal-code"
                    required
                  />
                </div>
              </>
            ) : null}

            <div className="mt-8">
              <label
                htmlFor="co-note"
                className="font-ui text-[10px] font-bold uppercase tracking-[0.18em] text-mute"
              >
                Anything we should know
              </label>
              <div className="mt-3 border-b border-line lb-field-line transition-colors duration-300 focus-within:border-line-strong">
                <textarea
                  id="co-note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Delivery window, gate code, a size you want swapped."
                  className="w-full resize-y bg-transparent py-3 font-ui text-[16px] leading-[1.5] text-text outline-none placeholder:text-[color:var(--placeholder)]"
                />
              </div>
            </div>

            {failure ? (
              <div className="mt-8">
                <FormNotice>{failure}</FormNotice>
              </div>
            ) : null}

            <div className="mt-10">
              <SubmitButton
                label={`Place order · ${inr(cart.total)}`}
                busyLabel="Placing the order…"
                busy={busy}
                full={false}
              />
              <p className="t-label mt-4 max-w-[44ch] text-mute">
                No card is taken here. The order goes to the people who pack it, and you pay on
                delivery.
              </p>
              <p className="mt-3 max-w-[52ch] font-ui text-[13px] leading-[1.5] text-mute">
                By placing the order you agree to our{" "}
                <Link
                  to="/legal/$slug"
                  params={{ slug: "terms" }}
                  className="text-text underline decoration-line underline-offset-4 hover:decoration-acid-type"
                >
                  terms
                </Link>{" "}
                and{" "}
                <Link
                  to="/legal/$slug"
                  params={{ slug: "shipping-returns" }}
                  className="text-text underline decoration-line underline-offset-4 hover:decoration-acid-type"
                >
                  shipping &amp; returns
                </Link>
                .
              </p>
            </div>
          </form>

          {/* ---- summary ---- */}
          <aside className="lg:sticky lg:top-[calc(var(--nav-h)+24px)] lg:self-start">
            <h3 className="t-label text-mute">Your order</h3>

            <ul className="mt-6 border-t border-line">
              {cart.resolved.map((l) =>
                l.product ? (
                  <li
                    key={`${l.productId}-${l.size ?? "one"}`}
                    className="flex gap-4 border-b border-line py-4"
                  >
                    <div className="h-[56px] w-[56px] shrink-0 overflow-hidden bg-surface-raised">
                      <CmsImage
                        src={l.product.image}
                        sizes="56px"
                        alt=""
                        className="h-full w-full object-cover"
                        style={{ filter: "brightness(var(--img-brightness))" }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-ui text-[13px] font-semibold text-text">
                        {l.product.title}
                      </p>
                      <p className="tnum mt-1 font-ui text-[12px] text-mute">
                        {l.qty} × {inr(l.product.price)}
                        {l.size ? ` · ${l.size}` : ""}
                      </p>
                    </div>
                    <span className="tnum font-ui text-[13px] font-semibold text-text">
                      {inr(l.lineTotal)}
                    </span>
                  </li>
                ) : null,
              )}
            </ul>

            {/* discount code */}
            <div className="mt-6">
              <label
                htmlFor="co-code"
                className="font-ui text-[10px] font-bold uppercase tracking-[0.18em] text-mute"
              >
                Discount code
              </label>
              <div className="mt-3 flex gap-2">
                <input
                  id="co-code"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder={cart.offer ? cart.offer.code : "BANDIT10"}
                  className="h-11 min-w-0 flex-1 border-b border-line bg-transparent font-ui text-[14px] uppercase tracking-[0.08em] text-text outline-none transition-colors duration-300 focus:border-acid-type placeholder:text-[color:var(--placeholder)]"
                />
                <button
                  type="button"
                  onClick={applyCode}
                  className="shrink-0 border border-line px-4 font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-mute transition-colors duration-300 hover:border-acid-type hover:text-text"
                >
                  Apply
                </button>
              </div>
              {codeNote ? (
                <p role="status" aria-live="polite" className="t-label mt-2 text-acid-type">
                  {codeNote}
                </p>
              ) : null}
            </div>

            <dl className="mt-6 border-t border-line pt-5">
              <SummaryRow k="Subtotal" v={inr(cart.subtotal)} />
              {cart.discount > 0 && cart.offer ? (
                <SummaryRow
                  k={`Discount (${cart.offer.code})`}
                  v={`− ${inr(cart.discount)}`}
                  accent
                />
              ) : null}
              <SummaryRow
                k="Shipping"
                v={digital ? "None" : cart.shipping === 0 ? "Free" : inr(cart.shipping)}
              />
              <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
                <dt className="font-display text-[15px] font-extrabold uppercase tracking-[-0.01em] text-text">
                  To pay on delivery
                </dt>
                <dd className="tnum font-display text-[20px] font-extrabold tracking-[-0.02em] text-text">
                  {inr(cart.total)}
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </section>
  );
}

function SummaryRow({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="font-ui text-[13px] text-mute">{k}</dt>
      <dd
        className={`tnum font-ui text-[13px] font-semibold ${accent ? "text-acid-type" : "text-text"}`}
      >
        {v}
      </dd>
    </div>
  );
}

function Stub({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative w-full bg-surface-deep py-[96px]">
      <GridRules tone="dark" />
      <BoundaryRule tone="dark" className="top-0" />
      <div className="shell relative z-[2] max-w-[560px]">
        <h2 className="t-h2 text-text">{title}</h2>
        <p className="mt-6 font-ui text-[16px] leading-[1.6] text-mute">{body}</p>
        <div className="mt-10 flex flex-wrap gap-4">{children}</div>
      </div>
    </section>
  );
}

/**
 * The receipt.
 *
 * It says plainly whether logistics have the order yet. If the sheet push
 * failed the order still exists and is safe — pretending otherwise would have
 * someone waiting on a parcel nobody has been told to pack.
 */
function Confirmation({ order }: { order: PlacedOrder }) {
  return (
    <section className="relative w-full bg-surface-deep py-[96px]">
      <GridRules tone="dark" />
      <BoundaryRule tone="dark" className="top-0" />

      <div className="shell relative z-[2] max-w-[640px]">
        <span className="flex h-12 w-12 items-center justify-center bg-acid text-accent-text">
          <Check size={22} />
        </span>

        <h2 className="t-h2 mt-8 text-text">Order placed</h2>

        <dl className="mt-10 border-t border-line">
          <div className="flex items-baseline justify-between gap-4 border-b border-line py-5">
            <dt className="t-label text-mute">Reference</dt>
            <dd className="tnum font-display text-[20px] font-extrabold tracking-[0.04em] text-acid-type">
              {order.reference}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-b border-line py-5">
            <dt className="t-label text-mute">To pay on delivery</dt>
            <dd className="tnum font-display text-[20px] font-extrabold tracking-[-0.02em] text-text">
              {inr(order.total)}
            </dd>
          </div>
        </dl>

        <p className="mt-8 font-ui text-[16px] leading-[1.6] text-mute">
          {order.sheetSynced
            ? "It is on the logistics sheet. Someone confirms stock by hand, then it ships — three to six days across India, same day in Kolkata if we are passing."
            : "Your order is saved and we can see it. It has not reached the logistics sheet yet, so we will move it across by hand — quote the reference above if you get in touch."}
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            to="/orders"
            className="flex h-[56px] items-center gap-3 bg-acid px-8 font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-accent-text transition-colors duration-300 hover:bg-acid-dim"
          >
            Your orders <ArrowRight size={16} />
          </Link>
          <Link
            to="/shop"
            className="flex h-[56px] items-center border border-line px-8 font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-text transition-colors duration-300 hover:border-acid-type"
          >
            Back to the shop
          </Link>
        </div>
      </div>
    </section>
  );
}
