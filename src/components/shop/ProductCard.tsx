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
import { useJustOn } from "@/lib/just-on";
import { useWords } from "@/cms/hooks";
import { fill } from "@/cms/words";

/**
 * One product.
 *
 * THE CARD IS 3:4, AND THE PICTURE TAKES WHAT THE WORDS LEAVE.
 * It used to be a 4:5 photograph with the blurb, the size chips and the run
 * stacked underneath — 328 × 744 on a desk, more than twice as tall as wide,
 * so a row of three filled the screen and still ended below it. Now the
 * card holds one shape at every width and the body is three single lines: a
 * name, who made it, a price. The photograph is `flex-1`, so it fills
 * whatever the card has left over.
 *
 * Because every line in the body has a fixed height (the name is clamped,
 * the full title is in its `title` and on the product page), every body in
 * a row is the same height, and so every photograph in the row is too — the
 * hairline under the pictures runs straight across instead of stepping.
 *
 * The blurb, the run and the size run live in `ProductSheet` and on the
 * product page, at every width now rather than only on a phone. That is not
 * information hidden; it is information moved to where there is room to
 * read it.
 *
 * The one rule that keeps this honest: **nothing can be bought without the
 * choice being made.** A product with a size run never adds from the card —
 * the button opens the sheet instead, where the sizes are 48px targets. Only
 * a thing with nothing to choose adds in one tap.
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
  const w = useWords("product");
  const cart = useCart();
  const wishlist = useWishlist();
  const rating = useRatingMap().get(product.id);

  const [added, setAdded] = useState(false);

  const needsSize = Boolean(product.sizes?.length);
  const gone = product.stock <= 0;
  const saved = wishlist.has(product.id);
  const justSaved = useJustOn(saved);
  const low = !gone && product.stock <= 10;

  /* A sized product cannot resolve on the card, so it hands off to the
   * sheet; anything else goes straight into the bag. */
  const onAdd = () => {
    if (needsSize) {
      onOpen(product);
      return;
    }
    requireAuth(fill(w.signInToAdd, { title: product.title }), () => {
      cart.add(product.id, null, 1);
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1600);
    });
  };

  return (
    <li
      id={`product-${product.id}`}
      data-reveal
      className="ui-card flex flex-col overflow-hidden"
      style={{ aspectRatio: "3 / 4" }}
    >
      <article className="group flex min-h-0 flex-1 flex-col">
        <div className="relative min-h-0 flex-1">
          {/* The picture and the name go to the product's own page; the
           * quick-add stays on the grid. Someone who wants to look gets a
           * page they can share, someone who already knows gets one tap —
           * the two intentions stopped sharing a button. */}
          <Link
            to="/shop/$id"
            params={{ id: product.id }}
            aria-label={fill(w.cardView, { title: product.title })}
            className="absolute inset-0 block overflow-hidden"
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
              requireAuth(fill(w.signInToSave, { title: product.title }), () => {
                void wishlist.toggle(product.id);
              })
            }
            aria-pressed={saved}
            aria-label={fill(saved ? w.wishlistRemove : w.wishlistAdd, { title: product.title })}
            className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center bg-surface-deep text-mute transition-colors duration-300 hover:text-acid-type"
          >
            <Heart
              size={15}
              fill={saved ? "currentColor" : "none"}
              className={`${saved ? "text-acid-type" : ""} ${justSaved ? "lb-pop" : ""}`}
            />
          </button>

          {/* Stock reads on the left edge so it never sits under the add
           * button, and on the dark chip rather than acid — one acid block
           * per picture, and it is the one you press. */}
          {gone ? (
            <span className="pointer-events-none absolute bottom-0 left-0 bg-surface-deep px-2 py-1 font-ui text-[10px] font-bold uppercase tracking-[0.16em] text-mute">
              {w.soldOut}
            </span>
          ) : low ? (
            <span className="tnum pointer-events-none absolute bottom-0 left-0 bg-surface-deep px-2 py-1 font-ui text-[10px] font-bold uppercase tracking-[0.16em] text-acid-type">
              {product.stock} left
            </span>
          ) : null}

          {/* ON THE PICTURE, NOT UNDER IT.
           * The price row used to be a second band under every card, 44px
           * of button beside the price. Floated into the photograph's corner
           * it costs the card nothing, and it sits where the eye already
           * is. A 44px square on a phone; the word joins it from `sm`. */}
          {gone ? null : (
            <button
              type="button"
              onClick={onAdd}
              aria-label={
                needsSize
                  ? fill(w.cardChooseSize, { title: product.title })
                  : fill(w.cardAdd, { title: product.title })
              }
              className="absolute bottom-2 right-2 flex h-11 shrink-0 items-center justify-center gap-2 bg-acid px-0 font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-accent-text shadow-[var(--elev-2)] transition-colors duration-300 hover:bg-acid-dim sm:h-10 sm:px-4"
              style={{ minWidth: 44 }}
            >
              {added ? <Check size={15} /> : <Plus size={15} />}
              <span className="hidden sm:inline">
                {added ? w.added : needsSize ? w.cardPickSize : w.cardAddShort}
              </span>
            </button>
          )}
        </div>

        {/* Every line here has a fixed height, so this block is the same
         * on every card and the pictures above line up. */}
        <div className="border-t border-line px-3 py-3 sm:px-4 sm:py-4">
          <Link
            to="/shop/$id"
            params={{ id: product.id }}
            title={product.title}
            className="tap block text-left font-display text-[14px] font-extrabold uppercase leading-[1.1] tracking-[-0.01em] text-text transition-colors duration-300 hover:text-acid-type sm:text-[18px] sm:leading-[1.05] sm:tracking-[-0.02em]"
          >
            {/* Two lines held open on a phone, where 150px cuts most names
             * at one; one line from `sm`, where nearly all of them fit. */}
            <span className="line-clamp-2 min-h-[2.2em] sm:line-clamp-1 sm:min-h-0">
              {product.title}
            </span>
          </Link>

          {/* A phone card is a picture, a name and a price: at 165px wide
           * the maker's line would take the picture's height to say what
           * the sheet says anyway. */}
          <p className="mt-1.5 hidden items-center gap-2 font-ui text-[13px] text-mute sm:flex">
            <span className="truncate">{product.by}</span>
            {rating && rating.count > 0 ? (
              <span className="flex shrink-0 items-center gap-1.5 text-[11px]">
                <Stars value={rating.average} size={11} />
                <span className="tnum">({rating.count})</span>
              </span>
            ) : null}
          </p>

          <div className="mt-2 flex items-baseline gap-x-2 sm:mt-3">
            <span
              className={`tnum font-display text-[15px] font-extrabold leading-none tracking-[-0.02em] sm:text-[20px] ${
                gone ? "text-mute line-through" : "text-text"
              }`}
            >
              {inr(product.price)}
            </span>
            {product.compareAt ? (
              <span className="tnum font-ui text-[11px] leading-none text-mute line-through sm:text-[12px]">
                {inr(product.compareAt)}
              </span>
            ) : null}
            {gone ? (
              <span className="t-label ml-auto leading-none text-mute">{w.cardGone}</span>
            ) : null}
          </div>
        </div>
      </article>
    </li>
  );
}
