import { HeroFrame } from "@/components/lb/PageHero";
import { PosterLockup } from "@/components/lb/PosterLockup";
import { useChapter } from "@/cms/hooks";
import { usePosts } from "@/cms/hooks";

/**
 * JOURNAL — the masthead.
 *
 * This used to be the one hero that changed pole — Journal was fixed as an
 * inverting chapter, so it sat on --alt-* and read bone. It is a dark
 * chapter now like every other one, which is also why the nav note below
 * no longer applies: there is no bone panel to hide a bone logotype
 * against.
 *
 * Set as a newspaper masthead: rule, running head, issue and date line, then
 * the title wide, then a standfirst with a drop cap.
 */
export function JournalHero() {
  const posts = usePosts();
  const c = useChapter("journal");
  const issue = String(posts.length).padStart(2, "0");

  /* The panel still starts below the navbar. That began as a fix for a
   * bone surface swallowing a bone logotype, and it is kept because the
   * letterhead strip it leaves above the masthead is the right look for a
   * newspaper — the breadcrumb lands at 160px like every other chapter. */
  return (
    <HeroFrame
      chapter="journal"
      tone="dark"
      surface="bg-surface"
      className="mt-[var(--nav-h)]"
      bodyClassName="pb-[96px] pt-[72px]"
    >
      {/* running head */}
      <div className="mt-10 flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-4">
        <span className="t-label text-text">Limon Bandit Journal</span>
        <span className="t-label tnum text-mute">
          Issue {issue}
          <span aria-hidden="true" className="px-3 text-acid-type">
            &middot;
          </span>
          Kolkata
        </span>
      </div>

      {/* Ordinary primary-pole fill now that the panel is dark. mascot
       * false: the masthead is set as a newspaper front page, and a lemon
       * in a leather jacket standing in the margin of it is a different
       * joke from the one this hero is telling. */}
      <PosterLockup
        className="mt-12"
        tone="dark"
        spread={c.poster.spread}
        word={c.poster.word}
        srText={c.heading}
        mascot={false}
      />

      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,58ch)_1fr] lg:gap-20">
        {/* The measure is capped so the standfirst always runs to three lines.
         * Unbounded it collapsed to a single line around 768, leaving the
         * three-line drop cap hanging below the paragraph it sits in. */}
        <p className="lb-dropcap max-w-[38ch] font-ui text-[18px] leading-[1.5] text-mute">
          {c.standfirst}
        </p>

        <ul className="lg:pt-2">
          {posts.slice(0, 3).map((p) => (
            <li
              key={p.title}
              className="flex items-baseline gap-5 border-b border-line py-4 first:border-t"
            >
              <span className="t-label shrink-0 text-acid-type">{p.category}</span>
              <span className="font-ui text-[13px] leading-[1.4] text-text">{p.title}</span>
              <span className="t-label tnum ml-auto shrink-0 text-mute">{p.readTime}</span>
            </li>
          ))}
        </ul>
      </div>
    </HeroFrame>
  );
}
