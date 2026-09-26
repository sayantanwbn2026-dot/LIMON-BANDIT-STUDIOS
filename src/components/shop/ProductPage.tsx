import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Check, Heart, Minus, Plus, Share2, Truck } from "lucide-react";
import { BoundaryRule, GridRules } from "@/components/lb/GridRules";
import { CmsImage } from "@/components/lb/CmsImage";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { inr } from "@/lib/money";
import { useOffers, useProducts, useShipping, type ProductDoc as Product } from "@/cms/hooks";
import { remember } from "@/lib/recent";
import { ProductRail } from "./ProductRail";
import { Reviews, Stars } from "./Reviews";
import { useRatings } from "@/lib/reviews";

/**
 * One product, on its own page.
 *
 * The shop had a quick-view sheet and nothing else: no address to send
 * anyone, nothing for Google to index, no way to put a tee in a message.
 * Every shop people already know how to use — Amazon, Flipkart, any of them
 * — has a page per item, and the habits that come with it: a gallery, a
 * delivery estimate against your own PIN, what it costs to send back, and
 * what else is like it.
 *
 * The sheet stays. It is the right answer for "add this, I already know what
 * it is" from the grid; this is the right answer for "tell me about it".
 *
 * On a phone the buy controls leave the flow and stick to the bottom edge,
 * where a thumb is, so a long page never puts the price out of reach.
 */
export function ProductPage({ product }: { product: Product }) {
  const { requireAuth, user } = useAuth();
  const cart = useCart();
  const wishlist = useWishlist();
  const navigate = useNavigate();
  const all = useProducts();
  const offers = useOffers();
  const shipping = useShipping();
  const ratings = useRatings(product.id);

  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);

  const needsSize = Boolean(product.sizes?.length);
  const gone = product.stock <= 0;
  const saved = wishlist.has(product.id);
  const max = Math.min(product.stock, 20);
  const off =
    product.compareAt && product.compareAt > product.price
      ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
      : 0;

  /* Start again when the route swaps to a different product — the component
   * stays mounted between them. */
  useEffect(() => {
    setSize(null);
    setQty(1);
    setAdded(false);
    setShareNote(null);
  }, [product.id]);

  /* "Recently viewed" is the one piece of memory a shop can keep without
   * asking for anything: it lives in this browser and never leaves it. */
  useEffect(() => {
    remember(product.id);
  }, [product.id]);

  const gallery = useMemo(() => {
    const extra = (Array.isArray(product.gallery) ? product.gallery : [])
      .map((g) => (typeof g === "string" ? g : (g?.url ?? "")))
      .filter(Boolean);
    return [product.image, ...extra];
  }, [product.image, product.gallery]);
  const [shot, setShot] = useState(0);
  useEffect(() => setShot(0), [product.id]);

  /* Same kind first, then the same maker — the two ways someone browsing a
   * tee actually continues: another tee, or more of that artist. */
  const related = useMemo(() => {
    const others = all.filter((p) => p.id !== product.id);
    const score = (p: Product) => (p.kind === product.kind ? 0 : p.by === product.by ? 1 : 2);
    return [...others].sort((a, b) => score(a) - score(b)).slice(0, 8);
  }, [all, product]);

  const gated = (reason: string, action: () => void) => requireAuth(reason, action);

  const addToCart = () => {
    if (gone) return;
    if (needsSize && !size) return;
    gated("Sign in to start a basket.", () => {
      cart.add(product.id, needsSize ? size : null, qty);
      setAdded(true);
      window.setTimeout(() => setAdded(false), 2000);
    });
  };

  const buyNow = () => {
    if (gone) return;
    if (needsSize && !size) return;
    gated("Sign in to check out.", () => {
      cart.add(product.id, needsSize ? size : null, qty);
      void navigate({ to: "/checkout" });
    });
  };

  const share = async () => {
    const url = window.location.href;
    const data = { title: product.title, text: `${product.title} — ${inr(product.price)}`, url };
    try {
      /* The native sheet where there is one (every phone), the clipboard
       * where there is not (most desktops). */
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(url);
        setShareNote("Link copied.");
        window.setTimeout(() => setShareNote(null), 2000);
      }
    } catch {
      /* A cancelled share is not a failure and must not be reported as one. */
    }
  };

  const sizeMissing = needsSize && !size;

  return (
    <main id="main" className="relative w-full bg-surface-deep pt-[var(--nav-h)]">
      <section className="relative w-full">
        <GridRules tone="dark" />

        <div className="shell relative z-[2] pb-16 pt-10">
          <Breadcrumb title={product.title} />

          <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-16">
            {/* ---- the picture ---- */}
            <div>
              <div className="relative border border-line bg-surface">
                <CmsImage
                  src={gallery[shot] ?? product.image}
                  alt={product.title}
                  sizes="(max-width: 1023px) 100vw, 640px"
                  priority
                  className="chroma aspect-square w-full object-cover"
                />
                {off ? (
                  <span className="absolute left-0 top-0 bg-acid px-3 py-1 font-ui text-[12px] font-bold uppercase tracking-[0.1em] text-accent-text">
                    {off}% off
                  </span>
                ) : null}
              </div>

              {gallery.length > 1 ? (
                <ul className="mt-3 flex gap-3 overflow-x-auto no-scrollbar">
                  {gallery.map((g, i) => (
                    <li key={`${g}-${i}`} className="shrink-0">
                      <button
                        type="button"
                        onClick={() => setShot(i)}
                        aria-label={`View image ${i + 1}`}
                        aria-pressed={i === shot}
                        className={`block h-[72px] w-[72px] border ${
                          i === shot ? "border-acid-type" : "border-line hover:border-line-strong"
                        }`}
                      >
                        <CmsImage
                          src={g}
                          alt=""
                          sizes="72px"
                          className="chroma h-full w-full object-cover"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            {/* ---- the decision ---- */}
            <div>
              <p className="t-label text-mute">{product.by}</p>
              <h1
                data-page-h1
                tabIndex={-1}
                className="mt-3 font-display text-[28px] font-extrabold uppercase leading-[1.05] tracking-[-0.02em] text-text outline-none md:text-[34px]"
              >
                {product.title}
              </h1>

              {ratings.count > 0 ? (
                <a
                  href="#reviews"
                  className="tap mt-4 inline-flex items-center gap-2 font-ui text-[13px] text-mute hover:text-text"
                >
                  <Stars value={ratings.average} />
                  <span className="tnum">
                    {ratings.average.toFixed(1)} · {ratings.count}{" "}
                    {ratings.count === 1 ? "review" : "reviews"}
                  </span>
                </a>
              ) : null}

              <div className="mt-6 flex flex-wrap items-baseline gap-3">
                <span className="tnum font-display text-[32px] font-extrabold tracking-[-0.03em] text-text">
                  {inr(product.price)}
                </span>
                {product.compareAt && product.compareAt > product.price ? (
                  <span className="tnum font-ui text-[16px] text-mute line-through">
                    {inr(product.compareAt)}
                  </span>
                ) : null}
                <span className="font-ui text-[13px] text-mute">Taxes included</span>
              </div>

              <p className="mt-5 max-w-[52ch] font-ui text-[15px] leading-[1.6] text-mute">
                {product.blurb}
              </p>

              {/* stock, said plainly */}
              <p className="mt-5 font-ui text-[13px]">
                {gone ? (
                  <span className="text-mute">Sold out — this run is finished.</span>
                ) : product.stock <= 10 ? (
                  <span className="text-acid-type">Only {product.stock} left of this run.</span>
                ) : (
                  <span className="text-mute">In stock · {product.run}</span>
                )}
              </p>

              {needsSize ? (
                <div className="mt-8">
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="t-label text-mute">Size</h2>
                    <Link
                      to="/legal/$slug"
                      params={{ slug: "shipping-returns" }}
                      className="tap font-ui text-[12px] text-mute underline decoration-line underline-offset-4 hover:text-text"
                    >
                      Returns in 7 days
                    </Link>
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {product.sizes?.map((s) => (
                      <li key={s}>
                        <button
                          type="button"
                          onClick={() => setSize(s)}
                          aria-pressed={size === s}
                          className={`flex h-12 min-w-12 items-center justify-center border px-4 font-ui text-[14px] font-semibold transition-colors duration-300 ${
                            size === s
                              ? "border-acid-type bg-acid text-accent-text"
                              : "border-line text-text hover:border-acid-type"
                          }`}
                        >
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                  {sizeMissing ? (
                    <p className="mt-3 font-ui text-[13px] text-mute">Pick a size to continue.</p>
                  ) : null}
                </div>
              ) : null}

              {!gone ? (
                <div className="mt-8 flex items-center gap-4">
                  <h2 className="t-label text-mute">Quantity</h2>
                  <div className="flex items-center border border-line">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      aria-label="One fewer"
                      disabled={qty <= 1}
                      className="flex h-12 w-12 items-center justify-center text-text disabled:opacity-30"
                    >
                      <Minus size={15} />
                    </button>
                    <span className="tnum w-10 text-center font-ui text-[15px] font-semibold text-text">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.min(max, q + 1))}
                      aria-label="One more"
                      disabled={qty >= max}
                      className="flex h-12 w-12 items-center justify-center text-text disabled:opacity-30"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
              ) : null}

              {/* ---- buy ---- */}
              <div className="mt-8 hidden gap-3 lg:flex">
                <BuyButtons
                  gone={gone}
                  added={added}
                  disabled={sizeMissing}
                  onAdd={addToCart}
                  onBuy={buyNow}
                />
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-5">
                <button
                  type="button"
                  onClick={() =>
                    gated("Sign in to keep a wishlist.", () => void wishlist.toggle(product.id))
                  }
                  className="tap inline-flex items-center gap-2 font-ui text-[13px] text-mute transition-colors duration-300 hover:text-text"
                >
                  <Heart size={15} className={saved && user ? "fill-acid text-acid" : ""} />
                  {saved && user ? "Saved" : "Save for later"}
                </button>
                <button
                  type="button"
                  onClick={() => void share()}
                  className="tap inline-flex items-center gap-2 font-ui text-[13px] text-mute transition-colors duration-300 hover:text-text"
                >
                  <Share2 size={15} />
                  {shareNote ?? "Share"}
                </button>
              </div>

              <DeliveryEstimate
                digital={Boolean(product.digital)}
                kolkata={shipping.kolkata}
                india={shipping.india}
              />

              {offers.length ? (
                <div className="mt-8 border border-line p-5">
                  <h2 className="t-label text-mute">Offers</h2>
                  <ul className="mt-3 space-y-2">
                    {offers.slice(0, 3).map((o) => (
                      <li key={o.code} className="font-ui text-[14px] text-text">
                        <span className="tnum bg-acid px-2 py-[2px] font-bold text-accent-text">
                          {o.code}
                        </span>{" "}
                        {o.label} — enter it at checkout.
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <dl className="mt-8 border-t border-line">
                <Spec k="Run" v={product.run} />
                <Spec k="Kind" v={product.kind} />
                {product.department !== "unisex" ? <Spec k="Cut" v={product.department} /> : null}
                <Spec k="Catalogue" v={product.index} />
                <Spec
                  k="Payment"
                  v={product.digital ? "No delivery — digital" : "Cash on delivery"}
                />
              </dl>
            </div>
          </div>
        </div>

        <BoundaryRule tone="dark" className="bottom-0" />
      </section>

      <Reviews productId={product.id} productTitle={product.title} />

      {related.length ? (
        <ProductRail
          title="More from the shop"
          products={related}
          standfirst="Same shelf, same building."
        />
      ) : null}

      {/* ---- the phone's buy bar ----
       * Fixed to the bottom edge from the moment the page opens: on a long
       * page the price and the button would otherwise be a scroll away from
       * wherever someone happens to be reading. Sits above the home
       * indicator on an iPhone. */}
      <div className="sticky bottom-0 z-[60] border-t border-line bg-surface-deep/95 backdrop-blur-sm lg:hidden">
        <div className="shell flex items-center gap-3 py-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))]">
          <div className="min-w-0 flex-1">
            <p className="tnum font-display text-[20px] font-extrabold tracking-[-0.02em] text-text">
              {inr(product.price * qty)}
            </p>
            <p className="truncate font-ui text-[12px] text-mute">
              {gone ? "Sold out" : sizeMissing ? "Pick a size first" : `${qty} × ${product.title}`}
            </p>
          </div>
          <BuyButtons
            gone={gone}
            added={added}
            disabled={sizeMissing}
            onAdd={addToCart}
            onBuy={buyNow}
            compact
          />
        </div>
      </div>
    </main>
  );
}

function BuyButtons({
  gone,
  added,
  disabled,
  onAdd,
  onBuy,
  compact,
}: {
  gone: boolean;
  added: boolean;
  disabled: boolean;
  onAdd: () => void;
  onBuy: () => void;
  compact?: boolean;
}) {
  if (gone) {
    return (
      <span className="flex h-[52px] flex-1 items-center justify-center border border-line font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-mute">
        Sold out
      </span>
    );
  }
  return (
    <>
      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        className={`flex h-[52px] items-center justify-center gap-2 border border-line-strong px-5 font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-text transition-colors duration-300 hover:border-acid-type disabled:opacity-40 ${
          compact ? "shrink-0" : "flex-1"
        }`}
      >
        {added ? <Check size={16} className="text-acid-type" /> : null}
        {added ? "Added" : compact ? "Add" : "Add to cart"}
      </button>
      <button
        type="button"
        onClick={onBuy}
        disabled={disabled}
        className={`flex h-[52px] items-center justify-center bg-acid px-5 font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-accent-text transition-opacity duration-300 hover:opacity-90 disabled:opacity-40 ${
          compact ? "shrink-0" : "flex-1"
        }`}
      >
        Buy now
      </button>
    </>
  );
}

function Spec({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-line py-3">
      <dt className="t-label text-mute">{k}</dt>
      <dd className="font-ui text-[14px] capitalize text-text">{v}</dd>
    </div>
  );
}

function Breadcrumb({ title }: { title: string }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 font-ui text-[10px] font-semibold uppercase tracking-[0.16em] text-mute">
        <li>
          <Link to="/" className="tap transition-colors duration-300 hover:text-text">
            LMN&middot;BNDT
          </Link>
        </li>
        <li aria-hidden="true" className="opacity-50">
          /
        </li>
        <li>
          <Link to="/shop" className="tap transition-colors duration-300 hover:text-text">
            The drop
          </Link>
        </li>
        <li aria-hidden="true" className="opacity-50">
          /
        </li>
        <li aria-current="page" className="max-w-[40ch] truncate text-text">
          {title}
        </li>
      </ol>
    </nav>
  );
}

/**
 * "When would it get here?"
 *
 * The question every Indian shop answers with a PIN box, and the one this
 * shop could not answer at all. The rates are the CMS's own, so this cannot
 * quote a delivery charge the checkout then disagrees with; the windows are
 * the ones written on the shipping page.
 *
 * The PIN is kept in this browser so the next product does not ask again.
 */
function DeliveryEstimate({
  digital,
  kolkata,
  india,
}: {
  digital: boolean;
  kolkata: number;
  india: number;
}) {
  const [pin, setPin] = useState("");
  const [checked, setChecked] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("lb-pin");
      if (saved) {
        setPin(saved);
        setChecked(saved);
      }
    } catch {
      /* private mode, or storage disabled — the box simply starts empty */
    }
  }, []);

  if (digital) {
    return (
      <div className="mt-8 flex items-start gap-3 border border-line p-5">
        <Truck size={16} className="mt-[2px] shrink-0 text-acid-type" />
        <p className="font-ui text-[14px] leading-[1.5] text-text">
          Digital — nothing ships. The file reaches you by email after the order.
        </p>
      </div>
    );
  }

  const valid = /^[1-9][0-9]{5}$/.test(pin.trim());
  /* Kolkata's PINs are 700001–700199. Close enough to be useful, honest
   * enough that the rest of the country is quoted the national window. */
  const local = /^7000[0-1][0-9]$/.test(checked ?? "");

  return (
    <div className="mt-8 border border-line p-5">
      <h2 className="flex items-center gap-2 t-label text-mute">
        <Truck size={14} className="text-acid-type" /> Delivery
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          const value = pin.trim();
          setChecked(value);
          try {
            window.localStorage.setItem("lb-pin", value);
          } catch {
            /* nothing to do — the estimate still shows for this visit */
          }
        }}
        className="mt-3 flex gap-2"
      >
        <label className="sr-only" htmlFor="pin">
          Delivery PIN code
        </label>
        <input
          id="pin"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="PIN code"
          className="h-11 min-w-0 flex-1 border border-line bg-transparent px-3 font-ui text-[14px] text-text outline-none placeholder:text-[color:var(--placeholder)] focus:border-acid-type"
        />
        <button
          type="submit"
          disabled={!valid}
          className="h-11 shrink-0 border border-line-strong px-4 font-ui text-[12px] font-bold uppercase tracking-[0.1em] text-text transition-colors duration-300 hover:border-acid-type disabled:opacity-40"
        >
          Check
        </button>
      </form>

      {checked ? (
        <p className="mt-3 font-ui text-[14px] leading-[1.5] text-text">
          {local ? (
            <>
              <span className="text-acid-type">2–4 working days</span> to {checked}. Delivery{" "}
              {kolkata ? inr(kolkata) : "free"}, paid in cash when it arrives.
            </>
          ) : (
            <>
              <span className="text-acid-type">5–9 working days</span> to {checked}. Delivery{" "}
              {india ? inr(india) : "free"}, paid in cash when it arrives.
            </>
          )}
        </p>
      ) : (
        <p className="mt-3 font-ui text-[14px] text-mute">
          Enter a PIN code for the window and the delivery charge.
        </p>
      )}
    </div>
  );
}
