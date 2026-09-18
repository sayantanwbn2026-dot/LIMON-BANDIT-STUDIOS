import { ArrowRight } from "lucide-react";
import { Section } from "@/components/lb/Section";
import { RiseIn, WordReveal } from "@/components/lb/Reveal";
import { CmsImage } from "@/components/lb/CmsImage";
import { usePosts, useSection } from "@/cms/hooks";

export function Journal() {
  const copy = useSection("home", "journal");
  const posts = usePosts();
  /* 160px bottom: the light chapter ends here and the page returns to dark. */
  return (
    <Section tone="light" className="border-t border-alt-line pt-[96px] pb-[120px]">
      <div className="section-head">
        <div className="md:col-span-1">
          <div className="flex items-center gap-3">
            <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-alt-acid-type" />
            <span className="t-eyebrow text-alt-text">{copy.eyebrow}</span>
          </div>
        </div>
        <div className="md:col-span-2">
          <WordReveal as="h2" className="t-h2 text-alt-text" text={copy.heading} />
        </div>
        <div className="flex items-end md:col-span-1 md:justify-end">
          <a
            href="/journal"
            className="group flex items-center gap-3 border border-alt-text px-6 py-4 transition-colors duration-300 hover:bg-alt-text"
          >
            <span className="t-eyebrow text-alt-text transition-colors duration-300 group-hover:text-alt-surface">
              Read everything
            </span>
            <ArrowRight
              size={15}
              className="text-alt-text transition-colors duration-300 group-hover:text-alt-surface lb-arrow"
            />
          </a>
        </div>
      </div>

      {/* Swipe rail on phones — four entries stacked were two screens. */}
      <div className="rail-mobile mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((p, i) => (
          <RiseIn key={p.title} delay={i * 0.08}>
            <a href="/journal" className="group block">
              <CmsImage
                src={p.image}
                sizes="(max-width: 767px) 100vw, 30vw"
                alt={p.alt}
                className="chroma aspect-[4/3] w-full border border-alt-line object-cover"
              />
              <div className="t-label mt-5 text-alt-mute">
                {p.category} · {p.readTime}
              </div>
              <h3 className="mt-3 inline font-display text-[18px] font-bold uppercase leading-[1.15] tracking-[-0.02em] text-alt-text">
                <span className="relative inline bg-[linear-gradient(var(--accent-dim),var(--accent-dim))] bg-[length:0%_2px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_2px]">
                  {p.title}
                </span>
              </h3>
            </a>
          </RiseIn>
        ))}
      </div>
    </Section>
  );
}
