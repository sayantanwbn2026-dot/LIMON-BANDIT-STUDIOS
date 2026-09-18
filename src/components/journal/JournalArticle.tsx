import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { setNavPole } from "@/lib/nav-pole";
import { BoundaryRule, GridRules } from "@/components/lb/GridRules";
import { MarginNotes } from "@/components/lb/Section";
import { Picture } from "@/components/lb/Picture";
import { RiseIn } from "@/components/lb/Reveal";
import { postNeighbours, type Post } from "@/data/journal";

/**
 * A single entry — the one page on the site built for reading rather than
 * for deciding.
 *
 * It stays on the ALT pole, like the rest of the Journal chapter: long-form
 * text on the bone panel rather than bone-on-black, because forty lines of
 * reversed-out body copy is the fastest way to make someone leave. Every
 * token here is the alt pair; a primary-pole token would flip the wrong way
 * with the theme.
 *
 * No PosterLockup. The lockup exists to say which chapter you are in, and
 * on an article the title is the heading — putting a giant "NOTES" above it
 * would make the entry's own title the second thing on the page.
 *
 * The measure is capped near 68 characters. That is the whole design: the
 * grid, the drop cap and the rules are inherited, and what this page adds
 * is a column you can actually read down.
 */
export function JournalArticle({ entry }: { entry: Post }) {
  /* This page does not go through PageShell, so it has to declare its own
   * pole. Without it the fixed navbar stays primary — bone logotype on a
   * bone panel — and the site's navigation is simply not visible on every
   * article. PageShell does exactly this for the other routes. */
  useEffect(() => {
    setNavPole("alt");
    return () => setNavPole("primary");
  }, []);

  const around = postNeighbours(entry.slug);
  const when = new Date(entry.date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    /* The page ground stays on the primary pole so the strip behind the
     * navbar is the deep surface. The bone panel starts *below* the bar —
     * the bar is transparent until it scrolls, so an alt surface run to
     * y=0 leaves its logotype invisible. Same reasoning as JournalHero. */
    <main id="main" className="relative w-full bg-surface-deep">
      <article className="relative w-full overflow-hidden bg-alt-surface mt-[var(--nav-h)]">
        <GridRules tone="light" />
        <MarginNotes index="06" name="Journal" tone="light" />

        <header className="shell relative z-[2] pb-16 pt-[72px]">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 font-ui text-[10px] font-semibold uppercase tracking-[0.16em] text-alt-mute">
              <li>
                <Link to="/" className="tap transition-colors duration-300 hover:text-alt-text">
                  LMN&middot;BNDT
                </Link>
              </li>
              <li aria-hidden="true" className="opacity-50">
                /
              </li>
              <li>
                <Link
                  to="/journal"
                  className="tap transition-colors duration-300 hover:text-alt-text"
                >
                  Journal
                </Link>
              </li>
              <li aria-hidden="true" className="opacity-50">
                /
              </li>
              <li aria-current="page" className="text-alt-text">
                {entry.category}
              </li>
            </ol>
          </nav>

          <div className="mt-10 flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-alt-line pb-4">
            <span className="t-label text-alt-acid-type">{entry.category}</span>
            <time dateTime={entry.date} className="t-label tnum text-alt-mute">
              {when}
            </time>
            <span className="t-label tnum ml-auto text-alt-mute">{entry.readTime}</span>
          </div>

          <h1
            data-page-h1
            tabIndex={-1}
            className="mt-10 max-w-[20ch] font-display text-[34px] font-extrabold uppercase leading-[1.02] tracking-[-0.03em] text-alt-text outline-none md:text-[52px]"
          >
            {entry.title}
          </h1>

          <p className="lb-dropcap mt-8 max-w-[54ch] font-ui text-[18px] leading-[1.5] text-alt-mute">
            {entry.standfirst}
          </p>
        </header>

        <div className="shell relative z-[2]">
          <Picture
            src={entry.image}
            sizes="(max-width: 767px) 100vw, 1200px"
            alt={entry.alt}
            className="aspect-[16/9] w-full border border-alt-line object-cover"
          />
        </div>

        {/* The reading column. Offset to the second drafting column on wide
         * screens so the measure sits where the eye already is rather than
         * starting at the far left of a 1440px page. */}
        <div className="shell relative z-[2] pb-[96px] pt-16">
          <div className="max-w-[68ch] lg:ml-[calc(25%+var(--grid-gutter))]">
            {entry.body.map((b, i) => (
              <Block key={i} block={b} />
            ))}
          </div>
        </div>

        <BoundaryRule tone="light" ticks className="bottom-0" />
      </article>

      {around ? <ArticleNav prev={around.prev} next={around.next} /> : null}
    </main>
  );
}

function Block({ block }: { block: Post["body"][number] }) {
  switch (block.kind) {
    case "h2":
      return (
        <h2 className="mt-14 font-display text-[20px] font-extrabold uppercase leading-[1.1] tracking-[-0.02em] text-alt-text md:text-[28px]">
          {block.text}
        </h2>
      );

    case "list":
      return (
        <ul className="mt-8 border-t border-alt-line">
          {block.items.map((it) => (
            <li
              key={it}
              className="flex gap-4 border-b border-alt-line py-4 font-ui text-[16px] leading-[1.55] text-alt-mute"
            >
              <span aria-hidden="true" className="mt-[10px] h-[6px] w-[6px] shrink-0 bg-acid" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      );

    case "quote":
      return (
        <figure className="mt-14 border-l-2 border-acid pl-6 md:pl-8">
          <blockquote className="font-display text-[20px] font-bold uppercase leading-[1.2] tracking-[-0.02em] text-alt-text md:text-[28px]">
            {block.text}
          </blockquote>
          <figcaption className="t-label mt-4 text-alt-mute">{block.who}</figcaption>
        </figure>
      );

    default:
      return (
        <p className="mt-7 font-ui text-[16px] leading-[1.65] text-alt-mute md:text-[18px]">
          {block.text}
        </p>
      );
  }
}

/** Previous and next entry, so an article is never a dead end. */
function ArticleNav({ prev, next }: { prev: Post; next: Post }) {
  return (
    <nav aria-label="More entries" className="relative w-full bg-alt-surface-deep">
      <GridRules tone="light" />
      <div className="shell relative z-[2] grid grid-cols-1 gap-px md:grid-cols-2">
        <RiseIn>
          <Link
            to="/journal/$slug"
            params={{ slug: prev.slug }}
            className="group flex h-full flex-col justify-between gap-8 border-b border-alt-line py-12 md:border-b-0 md:border-r md:pr-10"
          >
            <span className="flex items-center gap-3 font-ui text-[11px] font-bold uppercase tracking-[0.16em] text-alt-mute">
              <ArrowLeft
                size={14}
                className="text-alt-acid-type transition-transform duration-300 group-hover:-translate-x-1"
              />
              Previous
            </span>
            <span className="font-display text-[20px] font-extrabold uppercase leading-[1.1] tracking-[-0.02em] text-alt-text md:text-[24px]">
              {prev.title}
            </span>
          </Link>
        </RiseIn>

        <RiseIn delay={0.08}>
          <Link
            to="/journal/$slug"
            params={{ slug: next.slug }}
            className="group flex h-full flex-col justify-between gap-8 py-12 md:items-end md:pl-10 md:text-right"
          >
            <span className="flex items-center gap-3 font-ui text-[11px] font-bold uppercase tracking-[0.16em] text-alt-mute">
              Next
              <ArrowRight size={14} className="text-alt-acid-type lb-arrow" />
            </span>
            <span className="font-display text-[20px] font-extrabold uppercase leading-[1.1] tracking-[-0.02em] text-alt-text md:text-[24px]">
              {next.title}
            </span>
          </Link>
        </RiseIn>
      </div>
      <BoundaryRule tone="light" className="bottom-0" />
    </nav>
  );
}
