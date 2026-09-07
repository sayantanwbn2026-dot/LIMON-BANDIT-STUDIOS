import { HeroFrame } from "@/components/lb/PageHero";
import { PosterLockup } from "@/components/lb/PosterLockup";
import { chapter } from "@/data/routes";
import { usePosts } from "@/cms/hooks";

/**
 * JOURNAL — the masthead.
 *
 * The one hero that changes pole. AUDIT fixes Journal as one of the two
 * chapters that invert, so this sits on --alt-* and stays a dark chapter in
 * light mode and a bone one in dark. Every token here is the alt pair; using
 * a primary-pole token would flip the wrong way with the theme.
 *
 * Set as a newspaper masthead: rule, running head, issue and date line, then
 * the title wide, then a standfirst with a drop cap.
 */
export function JournalHero() {
  const posts = usePosts();
  const c = chapter("journal");
  const issue = String(posts.length).padStart(2, "0");

  /* The bone panel starts *below* the navbar rather than under it. The bar is
   * transparent until 600px of scroll and its logotype and burger are
   * primary-pole (bone in dark theme), so running an alt-pole surface up to
   * y=0 renders the whole navigation invisible. Starting at --nav-h leaves the
   * page's own deep surface as a letterhead strip for the bar to sit on, and
   * the top padding drops by the same 88px so the breadcrumb still lands at
   * 160px like every other chapter. */
  return (
    <HeroFrame
      chapter="journal"
      tone="light"
      surface="bg-alt-surface"
      className="mt-[var(--nav-h)]"
      bodyClassName="pb-[96px] pt-[72px]"
    >
      {/* running head */}
      <div className="mt-10 flex flex-wrap items-baseline justify-between gap-4 border-b border-alt-line pb-4">
        <span className="t-label text-alt-text">Limon Bandit Journal</span>
        <span className="t-label tnum text-alt-mute">
          Issue {issue}
          <span aria-hidden="true" className="px-3 text-alt-acid-type">
            &middot;
          </span>
          Kolkata
        </span>
      </div>

      {/* tone="light" is load-bearing here, not cosmetic: it picks the
       * alt-pole wordmark fill. With the default the gradient would paint
       * bone onto this bone panel and the masthead would simply not be
       * there in dark theme. */}
      <PosterLockup
        className="mt-12"
        tone="light"
        spread={c.poster.spread}
        word={c.poster.word}
        srText={c.heading}
      />

      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,58ch)_1fr] lg:gap-20">
        {/* The measure is capped so the standfirst always runs to three lines.
         * Unbounded it collapsed to a single line around 768, leaving the
         * three-line drop cap hanging below the paragraph it sits in. */}
        <p className="lb-dropcap max-w-[38ch] font-ui text-[18px] leading-[1.5] text-alt-mute">
          {c.standfirst}
        </p>

        <ul className="lg:pt-2">
          {posts.slice(0, 3).map((p) => (
            <li
              key={p.title}
              className="flex items-baseline gap-5 border-b border-alt-line py-4 first:border-t"
            >
              <span className="t-label shrink-0 text-alt-acid-type">{p.category}</span>
              <span className="font-ui text-[13px] leading-[1.4] text-alt-text">{p.title}</span>
              <span className="t-label tnum ml-auto shrink-0 text-alt-mute">{p.readTime}</span>
            </li>
          ))}
        </ul>
      </div>
    </HeroFrame>
  );
}
