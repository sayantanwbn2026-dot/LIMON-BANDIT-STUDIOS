import { useMemo } from "react";
import { Eyebrow, MarginNotes } from "@/components/lb/Section";
import { BoundaryRule, GridRules } from "@/components/lb/GridRules";
import { GhostLink } from "@/components/lb/Buttons";
import { GarmentRail, type RailGarment } from "@/components/shop/GarmentRail";
import { resolveImage } from "@/cms/media";
import { images } from "@/generated/images";
import { useProducts, useSection, useWords, type ProductDoc } from "@/cms/hooks";
import type { PageKey } from "@/cms/schema";

/**
 * THE TEE RAIL — the house's shirts, hanging.
 *
 * The one section on this site where you handle the goods rather than read
 * about them. It shows the tees and only the tees: everything else in the
 * catalogue is a record, a poster or a cable, and none of those hang.
 *
 * WHY ONLY TEES, SAID IN CODE RATHER THAN IN A COMMENT. The filter is
 * `kind === "tee"`, which is a field the CMS already has and an editor
 * already sets. Print a new tee and it joins the rail by itself; the rest
 * of the shop is untouched and still renders as the grid it always was.
 *
 * It appears twice — under the shop's masthead, and on the front page after
 * the rooms — and both are the same component reading the same documents,
 * so the rail cannot drift between the two places it is seen.
 */

/** A stored image value as a URL an <img> or a CSS mask can load. */
function photoUrl(value: unknown): string | undefined {
  const r = resolveImage(value);
  if (r.kind === "url") return r.url;
  if (r.kind === "manifest") return images[r.key].fallback;
  return undefined;
}

/** The second frame of the gallery, which is what the back of the tee shows. */
function backOf(product: ProductDoc): string | undefined {
  const row = product.gallery?.[0];
  const value = typeof row === "string" ? row : row?.url;
  return photoUrl(value);
}

function toGarment(product: ProductDoc): RailGarment {
  const sizes = product.sizes?.length ? product.sizes.join(" · ") : null;
  return {
    id: product.id,
    name: product.title,
    by: product.by,
    price: product.price,
    compareAt: product.compareAt,
    blurb: product.blurb,
    /* The facts worth having on a hanger: how many exist, what sizes were
     * cut, who it is for. Anything longer belongs on the product page. */
    details: [product.run, sizes, product.department].filter(Boolean) as string[],
    image: photoUrl(product.image),
    backImage: backOf(product),
    productId: product.id,
    gone: product.stock <= 0 && !product.digital,
  };
}

export function TeeRail({
  /** the front page turns them in sequence; the shop waits to be touched */
  autoplay = false,
  index = "11",
  /* Which page's section copy to read. The rail is on two pages and they
   * are not saying the same thing: the front page is introducing the shop,
   * the shop is introducing the run. Same component, two documents. */
  page = "home",
}: {
  autoplay?: boolean;
  index?: string;
  page?: PageKey;
}) {
  const products = useProducts();
  const copy = useSection(page, "tees");
  const w = useWords("home");

  const garments = useMemo(
    () => products.filter((p) => p.kind === "tee").map(toGarment),
    [products],
  );

  /* Nothing to hang, nothing to draw. A rail with no shirts on it is a
   * horizontal line and forty vertical pixels of confusion. */
  if (garments.length === 0) return null;

  return (
    <section id="tees" className="relative w-full overflow-hidden bg-surface">
      <BoundaryRule tone="dark" className="top-0" />
      <GridRules tone="dark" />
      <MarginNotes index={index} name="The Rail" />

      {/* The room behind the rail: a pool of light above it, falling away to
          nothing at the floor. Same stage light as the rooms and the
          preloader, so the shirts hang in the same building. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(90% 55% at 50% 0%, color-mix(in oklab, var(--accent) 7%, transparent), transparent 70%)",
        }}
      />

      <div className="relative z-[2] py-[72px] md:py-[96px]">
        <div className="shell flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0">
            <Eyebrow tone="dark">{copy.eyebrow}</Eyebrow>
            <h2 className="t-h2 mt-5 max-w-[16ch] text-text">{copy.heading}</h2>
          </div>
          <GhostLink label={w.dropsCatalogue} to="/shop" className="text-mute" />
        </div>

        {/* The rail runs the full measure of the page rather than the text
            column: it is furniture, and furniture meets the walls. */}
        <div className="mt-10 w-full md:mt-14">
          <GarmentRail items={garments} autoplay={autoplay} caption={copy.standfirst} />
        </div>
      </div>
    </section>
  );
}
