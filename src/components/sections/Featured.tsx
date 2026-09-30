import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Section, Eyebrow } from "@/components/lb/Section";
import { WordReveal } from "@/components/lb/Reveal";
import { CmsImage } from "@/components/lb/CmsImage";
import { useFeatured, useSection } from "@/cms/hooks";

/**
 * The three cards under the hero — the page's real front door.
 *
 * This replaces "Three ways in", which was three coloured panels that flipped
 * on hover and each carried its own surface, text, muted, border and index
 * colour as editable CSS strings. That put six colour fields per card in
 * front of an editor whose actual job was to decide WHAT TO PUT FIRST, and
 * made the one decision that matters — what the house most wants booked or
 * bought this month — the hardest thing to change.
 *
 * So the colours are gone and the content is the control. Whatever is at the
 * top of the Featured list in the CMS is the first card, and each card opens
 * the thing itself rather than a category: a room, one product, a release.
 *
 * WHAT MAKES THE CARD
 *   A photograph at 4:5, which is the shape everything else on this site is
 *   cut to, so the row agrees with the shop grid and the rooms ledger.
 *   The whole card is the link — Fitts's law applied to the largest target
 *   a page can offer — with a single visible focus ring, because three
 *   nested links per card is how a keyboard user ends up pressing Tab nine
 *   times to pass a row of three.
 *   A figure pinned bottom-right of the frame, on the scrim, so a price or
 *   a rate is legible over any photograph without a second panel.
 *   Motion that belongs to the image, not the layout: the photograph eases
 *   up 6%, the card lifts 2px, and nothing reflows.
 */
export function Featured() {
  const copy = useSection("home", "featured");
  const items = useFeatured();

  if (items.length === 0) return null;

  return (
    <Section tone="dark" className="py-[96px]">
      <div className="section-head">
        <div className="md:col-span-1">
          <Eyebrow>{copy.eyebrow}</Eyebrow>
        </div>
        <div className="md:col-span-2">
          <WordReveal as="h2" className="t-h2 text-text" text={copy.heading} />
        </div>
        <div className="flex items-end md:col-span-1 md:justify-end">
          <p className="max-w-[28ch] font-ui text-[14px] leading-[1.5] text-mute">
            {copy.standfirst}
          </p>
        </div>
      </div>

      {/* A swipe rail on a phone like every other row on this page; three
       * across once there is room. */}
      <ul
        className="rail-mobile mt-14 grid grid-cols-1 gap-6 md:grid-cols-3"
        style={{ ["--rail-h" as string]: "auto" }}
      >
        {items.slice(0, 4).map((item, i) => (
          <li key={`${item.title}-${i}`}>
            <FeatureCard item={item} rank={i + 1} />
          </li>
        ))}
      </ul>
    </Section>
  );
}

type Item = ReturnType<typeof useFeatured>[number];

function FeatureCard({ item, rank }: { item: Item; rank: number }) {
  const to = (item.to ?? "").trim();
  const external = /^https?:\/\//i.test(to);

  const body = (
    <>
      <div className="relative overflow-hidden">
        <CmsImage
          src={item.image}
          alt={item.title}
          sizes="(max-width: 767px) 84vw, 33vw"
          className="chroma aspect-[4/5] w-full object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
        />

        {/* The rank, so the row reads as a considered order rather than
         * three things that happen to be next to each other. */}
        <span className="tnum pointer-events-none absolute left-0 top-0 bg-surface-deep/85 px-3 py-1 font-ui text-[11px] font-bold uppercase tracking-[0.16em] text-acid-type">
          {String(rank).padStart(2, "0")}
        </span>

        {item.meta ? (
          <span
            className="tnum pointer-events-none absolute bottom-0 right-0 px-3 py-2 font-ui text-[13px] font-bold uppercase tracking-[0.08em] text-text"
            style={{ background: "var(--scrim)" }}
          >
            {item.meta}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col border-t border-line p-5">
        {item.eyebrow ? <span className="t-label text-mute">{item.eyebrow}</span> : null}

        <h3 className="mt-2 font-display text-[22px] font-extrabold uppercase leading-[1.05] tracking-[-0.02em] text-text">
          {item.title}
        </h3>

        {item.blurb ? (
          <p className="mt-2 font-ui text-[14px] leading-[1.5] text-mute">{item.blurb}</p>
        ) : null}

        <span className="mt-5 flex items-center gap-2 pt-1 font-ui text-[12px] font-bold uppercase tracking-[0.14em] text-text">
          <span className="wipe-underline">{item.cta || "Open"}</span>
          {external ? (
            <ArrowUpRight size={15} className="text-acid-type lb-arrow" />
          ) : (
            <ArrowRight size={15} className="text-acid-type lb-arrow" />
          )}
        </span>
      </div>
    </>
  );

  const shell =
    "ui-card group flex h-full flex-col overflow-hidden text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acid";

  /* An address from another site opens in a new tab and says so in its
   * own label; everything else is an in-app navigation and must go
   * through the router or it costs a full page load. */
  if (external) {
    return (
      <a href={to} target="_blank" rel="noreferrer" className={shell}>
        {body}
      </a>
    );
  }

  return (
    <Link to={to || "/"} className={shell}>
      {body}
    </Link>
  );
}
