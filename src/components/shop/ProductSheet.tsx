import { useEffect, useState } from "react";
import { Check, Heart, Minus, Plus } from "lucide-react";
import { Modal } from "@/components/lb/Modal";
import { CmsImage } from "@/components/lb/CmsImage";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { inr } from "@/lib/money";
import type { ProductDoc as Product } from "@/cms/hooks";

/**
 * One product, in full.
 *
 * The mobile grid had to lose something to become scannable — the blurb, the
 * run size, the size chips — and this is where all of it went. It is not a
 * consolation prize for the small screen: putting the choice in a sheet is
 * what lets the card stay a picture and a price, which is the whole reason
 * two columns fit.
 *
 * Sizes are the load-bearing case. Six of the twenty products have a run, and
 * a size picker inside a 162px card is either unusable or eats the card. Here
 * each size is a full 48px target with room for the label.
 *
 * It opens as a bottom sheet on a phone and a centred dialog from `sm` up, so
 * the same component serves a desktop quick-view without a second layout.
 */
export function ProductSheet({
  product,
  open,
  onClose,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}) {
  const { requireAuth, user } = useAuth();
  const cart = useCart();
  const wishlist = useWishlist();

  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  /* Reset per product, not per open: reopening the same tee should not forget
   * the size you just picked, but opening a different one must not inherit it. */
  useEffect(() => {
    setSize(null);
    setQty(1);
    setAdded(false);
  }, [product?.id]);

  if (!product) return null;

  const needsSize = Boolean(product.sizes?.length);
  const gone = product.stock <= 0;
  const saved = wishlist.has(product.id);
  const max = Math.min(product.stock, 20);

  /**
   * Gate from inside a sheet.
   *
   * `requireAuth` opens the login popup, and this component is itself a
   * dialog — so calling it directly left two `aria-modal` dialogs stacked at
   * the same z-index, both trapping Tab against each other. Stepping out of
   * the way first means the popup is the only dialog on screen, and because
   * `requireAuth` still holds the pending action, signing in completes the
   * add anyway. The buyer presses Add once, signs in, and the cart count
   * goes up.
   */
  const gated = (reason: string, action: () => void) => {
    if (user) {
      action();
      return;
    }
    onClose();
    requireAuth(reason, action);
  };

  const add = () => {
    gated(`Sign in to add ${product.title} to your cart.`, () => {
      cart.add(product.id, needsSize ? size : null, qty);
      if (!user) return;
      /* Back to one. The size is worth remembering if they reopen the same
       * product; the quantity is not — coming back to a sheet still reading
       * "2" is how someone ends up with four of something they wanted two
       * of. The cart is where quantity is adjusted after the fact. */
      setQty(1);
      setAdded(true);
      /* Close on a beat rather than instantly — vanishing the sheet the
       * moment you press Add reads as a mis-tap, and the tick is the receipt. */
      window.setTimeout(() => {
        setAdded(false);
        onClose();
      }, 700);
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="sheet"
      title={product.title}
      standfirst={product.by}
    >
      <div className="flex gap-4">
        <div className="w-[112px] shrink-0 overflow-hidden bg-surface-raised sm:w-[150px]">
          <CmsImage
            src={product.image}
            sizes="(max-width: 639px) 112px, 150px"
            alt={`${product.title} — ${product.by}`}
            className="h-full w-full object-cover"
            style={{
              aspectRatio: "4 / 5",
              filter: "brightness(var(--img-brightness)) contrast(1.03) saturate(1.06)",
              opacity: gone ? 0.45 : 1,
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span
              className={`tnum font-display text-[24px] font-extrabold tracking-[-0.02em] ${
                gone ? "text-mute line-through" : "text-text"
              }`}
            >
              {inr(product.price)}
            </span>
            {product.compareAt ? (
              <span className="tnum font-ui text-[13px] text-mute line-through">
                {inr(product.compareAt)}
              </span>
            ) : null}
          </div>

          <p className="mt-3 font-ui text-[14px] leading-[1.55] text-mute">{product.blurb}</p>

          <dl className="mt-4 space-y-1.5">
            <Spec k="Run" v={product.run} />
            {gone ? (
              <Spec k="Stock" v="Sold out" />
            ) : product.stock <= 10 ? (
              <Spec k="Left" v={`${product.stock}`} accent />
            ) : null}
          </dl>
        </div>
      </div>

      {needsSize && !gone ? (
        <fieldset className="mt-7">
          <legend className="t-label text-mute">Size</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.sizes!.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                aria-pressed={size === s}
                className={`h-12 min-w-[52px] px-3 font-ui text-[12px] font-bold uppercase tracking-[0.1em] transition-colors duration-300 ${
                  size === s
                    ? "bg-acid text-accent-text"
                    : "border border-line text-mute hover:border-acid-type hover:text-text"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      {!gone ? (
        <div className="mt-7">
          <span className="t-label text-mute">Quantity</span>
          <div className="mt-3 flex items-center justify-between gap-4">
            <div className="flex items-center border border-line">
              <Step
                label="One fewer"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
              >
                <Minus size={14} />
              </Step>
              <span className="tnum w-12 text-center font-ui text-[15px] font-semibold text-text">
                {qty}
              </span>
              <Step
                label="One more"
                onClick={() => setQty((q) => Math.min(max, q + 1))}
                disabled={qty >= max}
              >
                <Plus size={14} />
              </Step>
            </div>
            <span className="tnum font-display text-[20px] font-extrabold tracking-[-0.02em] text-text">
              {inr(product.price * qty)}
            </span>
          </div>
        </div>
      ) : null}

      <div className="mt-7 flex gap-2">
        <button
          type="button"
          onClick={() =>
            gated(`Sign in to save ${product.title} to your wishlist.`, () => {
              void wishlist.toggle(product.id);
            })
          }
          aria-pressed={saved}
          aria-label={
            saved ? `Remove ${product.title} from wishlist` : `Save ${product.title} to wishlist`
          }
          className="flex h-[56px] w-[56px] shrink-0 items-center justify-center border border-line text-mute transition-colors duration-300 hover:border-acid-type hover:text-text"
        >
          <Heart
            size={17}
            fill={saved ? "currentColor" : "none"}
            className={saved ? "text-acid-type" : ""}
          />
        </button>

        {gone ? (
          <span className="flex h-[56px] flex-1 items-center justify-center border border-line font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-mute">
            Sold out
          </span>
        ) : (
          <button
            type="button"
            onClick={add}
            disabled={needsSize && !size}
            className="flex h-[56px] flex-1 items-center justify-center gap-2 bg-acid font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-accent-text transition-colors duration-300 hover:bg-acid-dim disabled:cursor-not-allowed disabled:bg-surface-raised disabled:text-mute"
          >
            {added ? <Check size={15} /> : null}
            {added ? "Added" : needsSize && !size ? "Pick a size" : "Add to cart"}
          </button>
        )}
      </div>

      <p className="t-label mt-4 text-mute">
        {product.digital
          ? "Sent by email. No shipping, no wait."
          : "Pay on delivery. Stock confirmed by hand before dispatch."}
      </p>
    </Modal>
  );
}

function Spec({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="t-label text-mute">{k}</dt>
      <dd
        className={`tnum text-right font-ui text-[12px] font-semibold uppercase tracking-[0.06em] ${
          accent ? "text-acid-type" : "text-text"
        }`}
      >
        {v}
      </dd>
    </div>
  );
}

function Step({
  children,
  onClick,
  label,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className="flex h-12 w-12 items-center justify-center text-text transition-colors duration-300 hover:text-acid-type disabled:cursor-not-allowed disabled:text-mute disabled:opacity-40"
    >
      {children}
    </button>
  );
}
