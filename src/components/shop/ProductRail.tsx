import { Link } from "@tanstack/react-router";
import { CmsImage } from "@/components/lb/CmsImage";
import { inr } from "@/lib/money";
import type { ProductDoc as Product } from "@/cms/hooks";

/**
 * A row of products you swipe — "more from the shop", "recently viewed".
 *
 * Deliberately not the catalogue card: no add button, no size chips, no
 * wishlist heart. A rail is for getting somewhere else, and a card with four
 * controls on it in a horizontal scroller is four ways to mis-tap while
 * dragging. Picture, name, price, and the whole thing is one link.
 */
export function ProductRail({
  title,
  standfirst,
  products,
}: {
  title: string;
  standfirst?: string;
  products: Product[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="relative w-full border-t border-line bg-surface-deep py-14">
      <div className="shell relative z-[2]">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="font-display text-[22px] font-extrabold uppercase tracking-[-0.02em] text-text md:text-[28px]">
            {title}
          </h2>
          {standfirst ? <p className="font-ui text-[14px] text-mute">{standfirst}</p> : null}
        </div>

        <ul className="no-scrollbar mt-8 flex gap-4 overflow-x-auto pb-2 [scroll-snap-type:x_proximity]">
          {products.map((p) => (
            <li key={p.id} className="w-[168px] shrink-0 [scroll-snap-align:start] sm:w-[200px]">
              <Link
                to="/shop/$id"
                params={{ id: p.id }}
                className="group block border border-line transition-colors duration-300 hover:border-acid-type"
              >
                <CmsImage
                  src={p.image}
                  alt={p.title}
                  sizes="200px"
                  className="chroma aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <div className="border-t border-line p-3">
                  <p className="truncate font-ui text-[13px] font-semibold text-text">{p.title}</p>
                  <p className="truncate font-ui text-[12px] text-mute">{p.by}</p>
                  <p className="tnum mt-2 font-display text-[15px] font-extrabold tracking-[-0.01em] text-text">
                    {inr(p.price)}
                    {p.stock <= 0 ? <span className="ml-2 t-label text-mute">Sold out</span> : null}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
