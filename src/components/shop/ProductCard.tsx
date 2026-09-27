import { useState } from "react";
import { Heart, Check, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { CmsImage } from "@/components/lb/CmsImage";
import { Stars } from "./Reviews";
import { useRatingMap } from "@/lib/reviews";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { inr } from "@/lib/money";
import type { ProductDoc as Product } from "@/cms/hooks";

/**
 * One product.
 *
 * The card is deliberately two different densities, and the reason is the
 * phone. At one column with a square photo, each card ran about 630px tall —
 * twenty products was a twelve-thousand pixel scroll to see a shop that fits
 * on one desk. Nobody browses that; they bounce.
 *
 * So on a phone the card carries a picture, a name and a price, in two
 * columns, and everything else — the blurb, the run, the size run — moves
 * into `ProductSheet`. That is not information hidden; it is information
 * moved to where there is room to read it, and it is what makes a scannable
 * grid possible at all. From `sm` up the space exists, so the blurb and the
 * size chips come back inline and the card is the richer thing it was.
 *
 * The one rule that keeps this honest: **nothing can be bought without the
 * choice being made.** A product with a size run never adds from the card on
 * a phone — the button opens the sheet instead, where the sizes are 48px
 * targets. Only a thing with nothing to choose adds in one tap.
 *
 * Both actions are gated. `requireAuth` takes the action as a callback so a
 * signed-out tap opens the login popup and then *performs the add*, rather
 * than dropping it and making you find the button again.
 */
export function ProductCard({
  product,
  onOpen,
}: {
  product: Product;
  /** open the detail sheet — the whole card is a target for it on mobile */
  onOpen: (p: Product) => void;
}) {
  const { requireAuth } = useAuth();
  const cart = useCart();
  const wishlist = useWishlist();
  const rating = useRatingMap().get(product.id);

  const [size, setSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const needsSize = Boolean(product.sizes?.length);
  const gone = product.stock <= 0;
  const saved = wishlist.has(product.id);
  const low = !gone && product.stock <= 10;

  const addToCart = (chosen: string | null) => {
    requireAuth(`Sign in to add ${product.title} to your cart.`, () => {
      cart.add(product.id, chosen, 1);
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1600);
    });
  };

  /* The compact button. On a phone a sized product cannot resolve here, so it
   * hands off to the sheet; on desktop the chips are on the card and `size`
   * is already known. */
  const onCompactAdd = () => {
    if (needsSize && !size) {
      onOpen(product);
      return;
    }
    addToCart(needsSize ? size : null);
  };

  return (
    <li id={`product-${product.id}`} className="bg-surface-deep">
      <article className="group flex h-full flex-col">
        <div className="relative">
          {/* The picture and the name go to the product's own page; the
           * quick-add below stays on the grid. Someone who wants to look
           * gets a page they can share, someone who already knows gets one
           * tap — the two intentions stopped sharing a button. */}
          <Link
            to="/shop/$id"
            params={{ id: product.id }}
            aria-label={`View ${product.title}`}
            className="block w-full overflow-hidden"
            style={{ aspectRatio: "4 / 5" }}
          >
            <CmsImage
              src={product.image}
              sizes="(max-width: 639px) 50vw, (max-width: 1023px) 50vw, 33vw"
              alt={`${product.title} — ${product.by}`}
              className="h-full w-full object-cover transition-transform duration-[700ms] group-hover:scale-[1.04]"
              style={{
                filter: "brightness(var(--img-brightness)) contrast(1.03) saturate(1.06)",
                opacity: gone ? 0.4 : 1,
              }}
            />
          </Link>

          <span className="tnum pointer-events-none absolute left-0 top-0 bg-surface-deep px-2 py-1 font-ui text-[10px] font-bold uppercase tracking-[0.16em] text-acid-type">
            {product.index}
          </span>

          <button
            type="button"
            onClick={() =>
              requireAuth(`Sign in to save ${product.title} to your wishlist.`, () => {
                void wishlist.toggle(product.id);
              })
            }
            aria-pressed={saved}
            aria-label={
              saved ? `Remove ${product.title} from wishlist` : `Save ${product.title} to wishlist`
            }
            className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center bg-surface-deep text-mute transition-colors duration-300 hover:text-acid-type"
          >
            <Heart
              size={15}
              fill={saved ? "currentColor" : "none"}
              className={saved ? "text-acid-type" : ""}
            />
          </button>

          {gone ? (
            <span className="pointer-events-none absolute bottom-0 right-0 bg-surface-deep px-2 py-1 font-ui text-[10px] font-bold uppercase tracking-[0.16em] text-mute">
              Sold out
            </span>
          ) : low ? (
            <span className="tnum pointer-events-none absolute bottom-0 right-0 bg-acid px-2 py-1 font-ui text-[10px] font-bold uppercase tracking-[0.16em] text-accent-text">
              {product.stock} left
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col border-t border-line p-3 sm:p-6">
          <Link
            to="/shop/$id"
            params={{ id: product.id }}
            className="tap text-left font-display text-[14px] font-extrabold uppercase leading-[1.1] tracking-[-0.01em] text-text transition-colors duration-300 hover:text-acid-type sm:text-[18px] sm:leading-[1.05] sm:tracking-[-0.02em]"
          >
            {product.title}
          </Link>

          <p className="mt-1 truncate font-ui text-[11px] text-mute sm:mt-2 sm:text-[13px]">
            {product.by}
          </p>

          {rating && rating.count > 0 ? (
            <p className="mt-1 flex items-center gap-1.5 font-ui text-[11px] text-mute">
              <Stars value={rating.average} size={11} />
              <span className="tnum">({rating.count})</span>
            </p>
          ) : null}

          {/* Below `sm` these live in the sheet — see the note at the top. */}
          <p className="mt-3 hidden font-ui text-[13px] leading-[1.5] text-mute sm:block">
            {product.blurb}
          </p>

          {needsSize && !gone ? (
            <fieldset className="mt-5 hidden sm:block">
              <legend className="t-label text-mute">Size</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.sizes!.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    aria-pressed={size === s}
                    className={`min-w-[42px] px-3 py-2 font-ui text-[11px] font-bold uppercase tracking-[0.1em] transition-colors duration-300 ${
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

          <span className="t-label mt-5 hidden text-mute sm:block sm:pb-1">{product.run}</span>

          {/* Price and action share a row on the phone — a full-width button
              under every card added 40px twenty times over for no more
              clarity than a 44px square gives.
              `mt-auto` pins the row to the bottom of the card so prices line
              up across a row whatever the titles do; without it a one-line
              name next to a two-line one staggers the two prices. */}
          <div className="mt-auto flex items-end justify-between gap-2 border-t border-line pt-3 sm:pt-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span
                  className={`tnum font-display text-[15px] font-extrabold tracking-[-0.02em] sm:text-[20px] ${
                    gone ? "text-mute line-through" : "text-text"
                  }`}
                >
                  {inr(product.price)}
                </span>
                {product.compareAt ? (
                  <span className="tnum font-ui text-[11px] text-mute line-through sm:text-[12px]">
                    {inr(product.compareAt)}
                  </span>
                ) : null}
              </div>
            </div>

            {gone ? (
              /* Same 44px box the Add button occupies, so a sold-out card
                 keeps its price on the baseline of the card beside it
                 instead of dropping it half a line. */
              <span className="t-label flex h-11 shrink-0 items-center text-mute">Gone</span>
            ) : (
              <button
                type="button"
                onClick={onCompactAdd}
                aria-label={
                  needsSize && !size
                    ? `Choose a size for ${product.title}`
                    : `Add ${product.title} to cart`
                }
                className="flex h-11 shrink-0 items-center justify-center gap-2 bg-acid px-0 font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-accent-text transition-colors duration-300 hover:bg-acid-dim sm:px-5"
                style={{ minWidth: 44 }}
              >
                {added ? <Check size={15} /> : <Plus size={15} className="sm:hidden" />}
                <span className="hidden sm:inline">
                  {added ? "Added" : needsSize && !size ? "Pick a size" : "Add"}
                </span>
              </button>
            )}
          </div>
        </div>
      </article>
    </li>
  );
}
