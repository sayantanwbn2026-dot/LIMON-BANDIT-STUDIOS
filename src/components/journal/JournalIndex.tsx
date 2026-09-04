import { ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { BoundaryRule, GridRules } from "@/components/lb/GridRules";
import { Eyebrow } from "@/components/lb/Section";
import { CmsImage } from "@/components/lb/CmsImage";
import { usePosts } from "@/cms/hooks";

/**
 * The index, still on the alt pole.
 *
 * The hero set this chapter as a broadsheet, and a masthead followed by a
 * primary-pole body would read as two documents stapled together — so the
 * whole page stays inverted and the dark chrome underneath becomes its edge.
 * Every token here is an alt pair for that reason.
 *
 * Lead story gets the plate; the rest run as a ruled index, which is what a
 * four-entry journal actually warrants.
 */
export function JournalIndex() {
  const posts = usePosts();
  const [lead, ...rest] = posts;

  return (
    <section className="relative w-full bg-alt-surface pb-[120px] pt-[96px]">
      <GridRules tone="light" />
      <BoundaryRule tone="light" className="top-0" />

      <div className="shell relative z-[2]">
        <div className="section-head">
          <div className="md:col-span-1">
            <Eyebrow tone="light">Latest</Eyebrow>
          </div>
          <div className="md:col-span-2">
            <h2 className="t-h2 text-alt-text">What we have been writing</h2>
          </div>
          <div className="flex items-end md:col-span-1">
            <p className="font-ui text-[16px] leading-[1.5] text-alt-mute">
              Four entries. We write when something is worth writing down, not to a schedule.
            </p>
          </div>
        </div>

        {/* lead story */}
        <article className="group mt-16 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <Link
            to="/journal/$slug"
            params={{ slug: lead.slug }}
            className="block overflow-hidden border border-alt-line"
          >
            <CmsImage
              src={lead.image}
              alt={lead.alt}
              sizes="(max-width: 1023px) 100vw, 50vw"
              className="h-full w-full object-cover transition-transform duration-[700ms] group-hover:scale-[1.03]"
              style={{
                aspectRatio: "4 / 3",
                filter: "brightness(var(--img-brightness)) contrast(1.08)",
              }}
            />
          </Link>

          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-4">
              <span className="t-label text-alt-acid-type">{lead.category}</span>
              <span aria-hidden="true" className="h-[9px] w-[9px] border border-alt-acid-type" />
              <span className="t-label tnum text-alt-mute">{lead.readTime}</span>
            </div>

            <h3 className="mt-6 max-w-[18ch] font-display text-[32px] font-extrabold uppercase leading-[1.02] tracking-[-0.03em] text-alt-text md:text-[44px]">
              {lead.title}
            </h3>

            <Link
              to="/journal/$slug"
              params={{ slug: lead.slug }}
              className="mt-8 inline-flex w-fit items-center gap-2 font-ui text-[12px] font-bold uppercase tracking-[0.14em] text-alt-text"
            >
              <span className="wipe-underline">Read the entry</span>
              <ArrowUpRight size={14} className="text-alt-acid-type" />
            </Link>
          </div>
        </article>

        {/* the rest, as an index */}
        <ul className="mt-16 border-t border-alt-line">
          {rest.map((p, i) => (
            <li key={p.title}>
              <Link
                to="/journal/$slug"
                params={{ slug: p.slug }}
                className="group grid grid-cols-1 items-center gap-x-8 gap-y-4 border-b border-alt-line py-8 md:grid-cols-12"
              >
                <span className="tnum t-label text-alt-acid-type md:col-span-1">
                  {String(i + 2).padStart(2, "0")}
                </span>

                <span className="md:col-span-2">
                  <span className="t-label text-alt-mute">{p.category}</span>
                </span>

                <span className="md:col-span-6">
                  <span className="block max-w-[34ch] font-display text-[20px] font-bold uppercase leading-[1.1] tracking-[-0.02em] text-alt-text transition-transform duration-300 group-hover:translate-x-2 md:text-[24px]">
                    {p.title}
                  </span>
                </span>

                <span className="hidden md:col-span-2 md:block">
                  <CmsImage
                    src={p.image}
                    alt=""
                    sizes="140px"
                    className="h-[72px] w-full border border-alt-line object-cover"
                    style={{
                      filter: "brightness(var(--img-brightness)) contrast(1.08)",
                    }}
                  />
                </span>

                <span className="t-label tnum text-alt-mute md:col-span-1 md:text-right">
                  {p.readTime}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="t-label mt-8 max-w-[52ch] text-alt-mute">
          Individual entries are not written up yet — every link lands back on this index.
        </p>
      </div>
    </section>
  );
}
