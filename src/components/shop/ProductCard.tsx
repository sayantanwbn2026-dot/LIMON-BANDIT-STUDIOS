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
 * FROM `sm` THE CARD IS 3:4, AND THE PICTURE TAKES WHAT THE WORDS LEAVE.
 * It used to be a 4:5 photograph with the blurb, the size chips and the run
 * stacked underneath — 328 × 744 on a desk, more than twice as tall as wide,
 * so a row of three filled the screen and still ended below it. Now the
 * card holds one shape and the body is three single lines: a name, who made
 * it, a price. The photograph is `flex-1`, so it fills whatever the card has
 * left over.
 *
 * ON A PHONE IT IS THE PICTURE THAT IS 3:4.
 * Two columns leave a card 150px wide, and the same rule there left a
 * 148 × 119 photograph with a 44px heart and a 44px add button on it —
 * a quarter of the picture was controls, and the product was a thumbnail.
 * So below `sm` the photograph keeps the shape and the words go under it:
 * a two-line name, then the price with a 32px add button beside it, off
 * the picture entirely. Both buttons are 32px to look at and 44px to the
 * finger.
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

  const addLabel = needsSize
    ? fill(w.cardChooseSize, { title: product.title })
    : fill(w.cardAdd, { title: product.title });

  return (
    <li
      id={`product-${product.id}`}
      data-reveal
      className="ui-card flex flex-col overflow-hidden sm:aspect-[3/4]"
    >
      <article className="group flex min-h-0 flex-1 flex-col">
        <div className="relative aspect-[3/4] sm:aspect-auto sm:min-h-0 sm:flex-1">
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
            /* 44px to the finger, 32px to the eye on a phone: the button is
             * the full square, the chip inside it is what is drawn. Tucked in
             * the card's corner, a hit area grown past the button's edge
             * would be clipped by the card. */
            className="group/heart absolute right-0 top-0 flex h-11 w-11 items-start justify-end"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-[var(--r-control)] bg-surface-deep text-mute transition-colors duration-300 group-hover/heart:text-acid-type sm:h-11 sm:w-11">
              <Heart
                size={15}
                fill={saved ? "currentColor" : "none"}
                className={`h-3.5 w-3.5 sm:h-[15px] sm:w-[15px] ${saved ? "text-acid-type" : ""} ${justSaved ? "lb-pop" : ""}`}
              />
            </span>
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

          {/* ON THE PICTURE, NOT UNDER IT — from `sm`.
           * The price row used to be a second band under every card, 44px
           * of button beside the price. Floated into the photograph's corner
           * it costs the 3:4 card nothing, and it sits where the eye already
           * is. On a phone it would cover the product, so it moves to the
           * price row below instead. */}
          {gone ? null : (
            <button
              type="button"
              onClick={onAdd}
              aria-label={addLabel}
              className="absolute bottom-2 right-2 hidden h-10 shrink-0 items-center justify-center gap-2 bg-acid px-4 font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-accent-text shadow-[var(--elev-2)] transition-colors duration-300 hover:bg-acid-dim sm:flex"
            >
              {added ? <Check size={15} /> : <Plus size={15} />}
              {added ? w.added : needsSize ? w.cardPickSize : w.cardAddShort}
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

          <div className="mt-2 flex items-center gap-2 sm:mt-3">
            <span className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5 sm:gap-x-2">
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
            </span>
            {gone ? (
              <span className="t-label ml-auto leading-none text-mute">{w.cardGone}</span>
            ) : (
              /* The phone's add button: beside the price, off the picture. */
              <button
                type="button"
                onClick={onAdd}
                aria-label={addLabel}
                className="tap-area relative ml-auto flex h-8 w-8 shrink-0 items-center justify-center bg-acid text-accent-text transition-colors duration-300 hover:bg-acid-dim sm:hidden"
              >
                {added ? <Check size={14} /> : <Plus size={14} />}
              </button>
            )}
          </div>
        </div>
      </article>
    </li>
  );
}
