import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { Modal } from "@/components/lb/Modal";
import { CmsImage } from "@/components/lb/CmsImage";
import { useWishlist } from "@/lib/wishlist";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useProducts, useWords } from "@/cms/hooks";
import { inr } from "@/lib/money";
import { fill } from "@/cms/words";

/**
 * The wishlist, as a drawer.
 *
 * Saved things move to the basket from here in one press. Anything with a
 * size run cannot — a wishlist entry records the product, not the size — so
 * those send you to the shop to pick one rather than guessing a medium and
 * shipping the wrong shirt.
 */
export function WishlistDrawer() {
  const wishlist = useWishlist();
  const w = useWords("basket");
  const pw = useWords("product");
  const cart = useCart();
  const { requireAuth } = useAuth();
  const catalogue = useProducts();

  const items = Array.from(wishlist.ids)
    .map((id) => catalogue.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <Modal
      open={wishlist.open}
      onClose={() => wishlist.setOpen(false)}
      variant="drawer"
      title={w.wishlistTitle}
      standfirst={
        items.length === 0 ? w.wishlistEmpty : fill(w.wishlistCount, { count: items.length })
      }
    >
      {items.length === 0 ? (
        <div className="py-8">
          <p className="font-ui text-[15px] leading-[1.6] text-mute">{w.wishlistEmptyBody}</p>
          <Link
            to="/shop"
            onClick={() => wishlist.setOpen(false)}
            className="mt-8 flex h-[56px] items-center justify-center border border-line font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-text transition-colors duration-300 hover:border-acid-type"
          >
            {w.goToShop}
          </Link>
        </div>
      ) : (
        <ul className="border-t border-line">
          {items.map((p) => {
            const needsSize = Boolean(p.sizes?.length);
            const gone = p.stock <= 0;

            return (
              <li key={p.id} className="flex gap-4 border-b border-line py-5">
                <div className="h-[84px] w-[84px] shrink-0 overflow-hidden bg-surface-raised">
                  <CmsImage
                    src={p.image}
                    sizes="84px"
                    alt=""
                    className="h-full w-full object-cover"
                    style={{
                      filter: "brightness(var(--img-brightness))",
                      opacity: gone ? 0.45 : 1,
                    }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-[15px] font-bold uppercase leading-[1.1] tracking-[-0.01em] text-text">
                    {p.title}
                  </h3>
                  <p className="mt-1 font-ui text-[12px] text-mute">{p.by}</p>
                  <p className="tnum mt-2 font-display text-[15px] font-extrabold tracking-[-0.01em] text-text">
                    {inr(p.price)}
                  </p>

                  <div className="mt-3">
                    {gone ? (
                      <span className="t-label text-mute">{pw.soldOut}</span>
                    ) : needsSize ? (
                      <Link
                        to="/shop"
                        hash={`product-${p.id}`}
                        onClick={() => wishlist.setOpen(false)}
                        className="t-label text-text"
                      >
                        <span className="wipe-underline">{w.wishlistPickSize}</span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          requireAuth(w.wishlistSignIn, () => {
                            cart.add(p.id, null, 1);
                            void wishlist.remove(p.id);
                            wishlist.setOpen(false);
                            cart.setOpen(true);
                          })
                        }
                        className="t-label text-text"
                      >
                        <span className="wipe-underline">{w.wishlistMove}</span>
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void wishlist.remove(p.id)}
                  aria-label={fill(w.wishlistRemove, { title: p.title })}
                  className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center text-mute transition-colors duration-300 hover:text-acid-type"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
