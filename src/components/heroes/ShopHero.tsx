import { HeroFrame } from "@/components/lb/PageHero";
import { PosterLockup } from "@/components/lb/PosterLockup";
import { RiseIn } from "@/components/lb/Reveal";
import { useChapter, useWords } from "@/cms/hooks";

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
  const w = useWords("shop");

  return (
    <HeroFrame
      chapter="shop"
      lockup={<PosterLockup spread={c.poster.spread} word={c.poster.word} srText={c.heading} />}
    >
      <p className="t-lead mt-14 max-w-[48ch] text-mute">{c.standfirst}</p>

      {/* Each fact carries the separator that precedes it, so the two can
       * never be split across a line break. As separate flex items they
       * wrapped apart on a phone and left a marker hanging at the end of
       * each line, pointing at nothing. Below `sm`, where the four do not
       * fit on one line, the markers go and the facts sit as a short list. */}
      <RiseIn delay={0.1} className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
        {[w.heroFact1, w.heroFact2, w.heroFact3, w.heroFact4].filter(Boolean).map((t, i) => (
          <span key={t} className="flex items-center gap-x-8 max-sm:w-full">
            {i > 0 ? (
              <span
                aria-hidden="true"
                className="h-[9px] w-[9px] shrink-0 border border-acid-type max-sm:hidden"
              />
            ) : null}
            <span className="t-label text-mute">{t}</span>
          </span>
        ))}
      </RiseIn>
    </HeroFrame>
  );
}
