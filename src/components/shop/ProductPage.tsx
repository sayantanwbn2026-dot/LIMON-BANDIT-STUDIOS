import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Banknote,
  Check,
  ChevronDown,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  Share2,
  Truck,
} from "lucide-react";
import { BoundaryRule, GridRules } from "@/components/lb/GridRules";
import { Button } from "@/components/lb/Button";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { inr } from "@/lib/money";
import { useOffers, useProducts, useShipping, type ProductDoc as Product } from "@/cms/hooks";
import { remember } from "@/lib/recent";
import { ProductGallery } from "./ProductGallery";
import { ProductRail } from "./ProductRail";
import { Reviews, Stars } from "./Reviews";
import { useRatings } from "@/lib/reviews";
import { useToast } from "@/lib/toast";

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
 * Four things this page does deliberately, each fixing something the first
 * version got wrong:
 *
 *   The picture stays put and the words scroll (as on every large shop). It
 *   also stops growing: a square photograph in a wide column pushed the
 *   price and the size picker below the fold, so the one decision the page
 *   exists for started off screen.
 *
 *   Nothing is disabled to mean "not yet". The buy buttons used to grey out
 *   until a size was chosen, which reads as a broken button rather than an
 *   instruction — the screenshot that prompted this looked like a colour
 *   bug. They are always live; pressing one without a size scrolls to the
 *   sizes, focuses the first, and says why. Feedback beats a dead control.
 *
 *   One loud button. "Add to cart" carries the acid; "Buy now" is quiet
 *   beside it. Two equally shouting CTAs make the choice, not the product,
 *   the thing you have to think about (Von Restorff, Hick).
 *
 *   The long tail is folded away. The spec table and the returns detail are
 *   behind disclosures, open to anyone who wants them and out of the way of
 *   everyone who does not.
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
  const toast = useToast();

  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  /** Set when someone tries to buy without choosing a size. */
  const [nudge, setNudge] = useState(false);

  const sizeRef = useRef<HTMLDivElement>(null);

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
    setNudge(false);
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

  /* Same kind first, then the same maker — the two ways someone browsing a
   * tee actually continues: another tee, or more of that artist. */
  const related = useMemo(() => {
    const others = all.filter((p) => p.id !== product.id);
    const score = (p: Product) => (p.kind === product.kind ? 0 : p.by === product.by ? 1 : 2);
    return [...others].sort((a, b) => score(a) - score(b)).slice(0, 8);
  }, [all, product]);

  const sizeMissing = needsSize && !size;

  /**
   * The instruction a disabled button cannot give.
   *
   * Takes the eye to the sizes, puts the keyboard there too, and leaves a
   * line of text behind for anyone who is being read to. Returns true when
   * it handled the press, so the buy handlers can simply stop.
   */
  const askForSize = useCallback(() => {
    if (!sizeMissing) return false;
    setNudge(true);
    const box = sizeRef.current;
    box?.scrollIntoView({ behavior: "smooth", block: "center" });
    box?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    window.setTimeout(() => setNudge(false), 1800);
    return true;
  }, [sizeMissing]);

  const gated = (reason: string, action: () => void) => requireAuth(reason, action);

  const addToCart = () => {
    if (gone || askForSize()) return;
    gated("Sign in to start a basket.", () => {
      cart.add(product.id, needsSize ? size : null, qty);
      setAdded(true);
      toast.ok(`${product.title} is in your basket.`, {
        label: "View",
        onClick: () => cart.setOpen(true),
      });
      window.setTimeout(() => setAdded(false), 4000);
    });
  };

  const buyNow = () => {
    if (gone || askForSize()) return;
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
        toast.ok("Link copied.");
      }
    } catch (e) {
      /* A cancelled share is not a failure and must not be reported as
       * one — the native sheet throws AbortError when you dismiss it.
       * Everything else IS a failure: a clipboard write can be refused
       * outright (permissions, an insecure context), and swallowing that
       * leaves someone pressing Share and getting silence forever. */
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast.error("Could not copy the link — your browser blocked it.");
    }
  };

  return (
    <main id="main" className="relative w-full bg-surface-deep pt-[var(--nav-h)]">
      <section className="relative w-full">
        <GridRules tone="dark" />

        <div className="shell relative z-[2] pb-16 pt-10">
          <Breadcrumb title={product.title} />

          <div className="mt-8 grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-16">
            {/* ---- the picture ----
             * Sticky from `lg` up: the gallery is the thing you keep looking
             * back at while reading the rest, and on a desktop there is room
             * to leave it there. */}
            <div className="relative lg:sticky lg:top-[calc(var(--nav-h)+24px)]">
              <ProductGallery images={gallery} title={product.title} />
              {off ? (
                <span className="pointer-events-none absolute left-0 top-0 bg-acid px-3 py-1 font-ui text-[12px] font-bold uppercase tracking-[0.1em] text-accent-text">
                  {off}% off
                </span>
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
                  <>
                    <span className="tnum font-ui text-[16px] text-mute line-through">
                      {inr(product.compareAt)}
                    </span>
                    {/* The number people actually want: what they keep. */}
                    <span className="tnum font-ui text-[14px] font-semibold text-acid-type">
                      Save {inr(product.compareAt - product.price)}
                    </span>
                  </>
                ) : null}
              </div>
              <p className="mt-1 font-ui text-[13px] text-mute">Taxes included</p>

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
                <div ref={sizeRef} className="mt-8 scroll-mt-[calc(var(--nav-h)+24px)]">
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="t-label text-mute">
                      Size{" "}
                      {size ? (
                        <span className="text-text">· {size}</span>
                      ) : (
                        <span className="text-mute opacity-70">· required</span>
                      )}
                    </h2>
                    <Link
                      to="/legal/$slug"
                      params={{ slug: "shipping-returns" }}
                      className="tap font-ui text-[12px] text-mute underline decoration-line underline-offset-4 hover:text-text"
                    >
                      Size &amp; fit
                    </Link>
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {product.sizes?.map((s) => (
                      <li key={s}>
                        <button
                          type="button"
                          onClick={() => {
                            setSize(s);
                            setNudge(false);
                          }}
                          aria-pressed={size === s}
                          className={`flex h-12 min-w-12 items-center justify-center border px-4 font-ui text-[14px] font-semibold transition-colors duration-300 ${
                            size === s
                              ? "border-acid-type bg-acid text-accent-text"
                              : nudge
                                ? "border-acid-type text-text"
                                : "border-line text-text hover:border-acid-type"
                          }`}
                        >
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                  {/* One live region for the whole page. Silent until the
                   * buttons have something to say, so it is never read out
                   * on arrival. */}
                  <p
                    aria-live="polite"
                    className={`mt-3 font-ui text-[13px] ${nudge ? "text-acid-type" : "text-mute"}`}
                  >
                    {nudge
                      ? "Pick a size first — then add it to the basket."
                      : size
                        ? `Size ${size} selected.`
                        : "Pick a size to continue."}
                  </p>
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
                  {qty >= max ? (
                    <p className="font-ui text-[12px] text-mute">
                      {max === product.stock ? "That is the whole run." : "Twenty per order."}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {/* ---- buy ---- */}
              <div className="mt-8 hidden lg:block">
                <BuyButtons
                  gone={gone}
                  added={added}
                  onAdd={addToCart}
                  onBuy={buyNow}
                  onViewCart={() => cart.setOpen(true)}
                />
              </div>

              {/* On a phone the basket lives in the bar pinned to the bottom
               * edge, so the only button missing from the flow is the other
               * path — and putting a second acid button here would mean two
               * of them on screen at once, which is one too many. */}
              {!gone ? (
                <Button
                  variant="secondary"
                  size="lg"
                  full
                  onClick={buyNow}
                  className="mt-8 lg:hidden"
                >
                  Buy now
                </Button>
              ) : null}

              {/* The three things that decide the sale once the price is
               * read, together in one strip rather than scattered down the
               * page as prose. */}
              {!product.digital ? (
                <ul className="mt-6 grid grid-cols-3 gap-3 border-y border-line py-4">
                  <Assurance icon={<Banknote size={15} />} label="Cash on delivery" />
                  <Assurance icon={<RotateCcw size={15} />} label="7-day returns" />
                  <Assurance icon={<Truck size={15} />} label="Ships in 48 hrs" />
                </ul>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-5">
                <button
                  type="button"
                  onClick={() =>
                    gated("Sign in to keep a wishlist.", () => {
                      const had = wishlist.has(product.id);
                      void wishlist.toggle(product.id);
                      toast.ok(had ? "Removed from your list." : "Saved to your list.");
                    })
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
                  Share
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

              {/* Progressive disclosure: everything below is detail nobody
               * needs in order to decide, and a wall of it is what makes a
               * product page feel like a form. */}
              <div className="mt-8 border-t border-line">
                <Disclosure title="Details" defaultOpen>
                  <dl>
                    <Spec k="Run" v={product.run} />
                    <Spec k="Kind" v={product.kind} />
                    {product.department !== "unisex" ? (
                      <Spec k="Cut" v={product.department} />
                    ) : null}
                    <Spec k="Catalogue" v={product.index} />
                    <Spec
                      k="Payment"
                      v={product.digital ? "No delivery — digital" : "Cash on delivery"}
                    />
                  </dl>
                </Disclosure>
                <Disclosure title="Delivery & returns">
                  <p className="font-ui text-[14px] leading-[1.6] text-mute">
                    {product.digital
                      ? "Nothing ships. The file reaches you by email once the order is confirmed, and a digital item cannot be returned."
                      : "Packed and sent from the building in Kolkata, usually within two working days. Unworn, tags on, seven days from the day it reaches you — tell us and we collect it."}{" "}
                    <Link
                      to="/legal/$slug"
                      params={{ slug: "shipping-returns" }}
                      className="tap text-text underline decoration-line underline-offset-4 hover:decoration-acid-type"
                    >
                      Full terms
                    </Link>
                  </p>
                </Disclosure>
              </div>
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
       * wherever someone happens to be reading. One button, because a thumb
       * bar is the worst possible place to offer a choice. Sits above the
       * home indicator on an iPhone. */}
      <div className="sticky bottom-0 z-[60] border-t border-line bg-surface-deep/95 backdrop-blur-sm lg:hidden">
        <div className="shell flex items-center gap-3 py-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))]">
          <div className="min-w-0 flex-1">
            <p className="tnum font-display text-[20px] font-extrabold tracking-[-0.02em] text-text">
              {inr(product.price * qty)}
            </p>
            <p className="truncate font-ui text-[12px] text-mute">
              {gone
                ? "Sold out"
                : added
                  ? "In your basket"
                  : sizeMissing
                    ? "Size needed"
                    : `${qty} × ${size ?? product.kind}`}
            </p>
          </div>
          {gone ? (
            <span className="flex h-[52px] shrink-0 items-center justify-center border border-line px-6 font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-mute">
              Sold out
            </span>
          ) : added ? (
            <button
              type="button"
              onClick={() => cart.setOpen(true)}
              className="flex h-[52px] shrink-0 items-center justify-center gap-2 bg-acid px-6 font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-accent-text"
            >
              <Check size={16} /> View basket
            </button>
          ) : (
            <button
              type="button"
              onClick={addToCart}
              className="flex h-[52px] shrink-0 items-center justify-center bg-acid px-6 font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-accent-text transition-opacity duration-300 active:opacity-80"
            >
              Add to basket
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

/**
 * The buy controls, desktop.
 *
 * Neither button is ever disabled — see the note at the top of the file.
 * "Add to cart" is the only acid thing in the column, so there is never a
 * question about where to press; "Buy now" is available to anyone who
 * already knows they want it and would rather skip the basket.
 *
 * Once something is added the primary button becomes the next step, which is
 * the basket. A confirmation that does nothing is a confirmation you have to
 * read and then dismiss with your own idea of what to do next.
 */
function BuyButtons({
  gone,
  added,
  onAdd,
  onBuy,
  onViewCart,
}: {
  gone: boolean;
  added: boolean;
  onAdd: () => void;
  onBuy: () => void;
  onViewCart: () => void;
}) {
  if (gone) {
    return (
      <div className="flex flex-col gap-3">
        <span className="flex h-[56px] items-center justify-center border border-line font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-mute">
          Sold out
        </span>
        <p className="font-ui text-[13px] text-mute">
          The run is finished. The list hears about the next one first.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {added ? (
        <Button variant="primary" size="lg" full onClick={onViewCart}>
          <Check size={16} /> In your basket — view it
        </Button>
      ) : (
        <Button variant="primary" size="lg" full onClick={onAdd}>
          Add to basket
        </Button>
      )}
      <Button variant="secondary" size="lg" full onClick={onBuy}>
        Buy now
      </Button>
    </div>
  );
}

/** One of the three promises in the strip under the buy buttons. */
function Assurance({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <li className="flex flex-col items-center gap-2 text-center">
      <span className="text-acid-type">{icon}</span>
      <span className="font-ui text-[11px] font-semibold uppercase leading-[1.3] tracking-[0.08em] text-mute">
        {label}
      </span>
    </li>
  );
}

/**
 * A section you can fold away.
 *
 * `<details>` rather than state and a conditional: it opens without
 * JavaScript, it is findable by the browser's own in-page search even while
 * closed, and the keyboard behaviour is the platform's rather than ours.
 */
function Disclosure({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group border-b border-line">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
        <h2 className="t-label text-text">{title}</h2>
        <ChevronDown
          size={16}
          className="shrink-0 text-mute transition-transform duration-300 group-open:-rotate-180"
        />
      </summary>
      <div className="pb-5">{children}</div>
    </details>
  );
}

function Spec({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-t border-line py-3 first:border-t-0 first:pt-0">
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
      <h2 className="t-label flex items-center gap-2 text-mute">
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
          className="ui-field h-11 min-w-0 flex-1 px-3 font-ui text-[14px] text-text outline-none placeholder:text-[color:var(--placeholder)]"
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
