import { Fragment } from "react";
import { HeroFrame } from "@/components/lb/PageHero";
import { PosterLockup } from "@/components/lb/PosterLockup";
import { RiseIn } from "@/components/lb/Reveal";
import { useChapter } from "@/cms/hooks";

/**
 * SHOP — the run, under the house lockup.
 *
 * The heading is the landing page's poster set to this page's phrase. What
 * makes it Shop is the run line under it — edition, units, where it was
 * printed, and the fact that it will not come back.
 *
 * The misregistered-print heading that used to live here is gone. It was a
 * good device and it was the wrong one to keep: it existed to make this
 * hero unlike the others, which is the opposite of what these heroes are
 * now for. Screen printing still shows up on this page in the product
 * copy and the plates below, where it is a fact rather than a typographic
 * impression of one.
 */
export function ShopHero() {
  const c = useChapter("shop");

  return (
    <HeroFrame chapter="shop">
      <PosterLockup
        className="mt-10"
        spread={c.poster.spread}
        word={c.poster.word}
        srText={c.heading}
      />

      <p className="t-lead mt-14 max-w-[48ch] text-mute">{c.standfirst}</p>

      <RiseIn delay={0.1} className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
        {["Run 04", "150 units", "Screen printed in Kolkata", "No restock"].map((t, i) => (
          <Fragment key={t}>
            {i > 0 ? (
              <span
                aria-hidden="true"
                className="h-[9px] w-[9px] shrink-0 border border-acid-type"
              />
            ) : null}
            <span className="t-label text-mute">{t}</span>
          </Fragment>
        ))}
      </RiseIn>
    </HeroFrame>
  );
}
