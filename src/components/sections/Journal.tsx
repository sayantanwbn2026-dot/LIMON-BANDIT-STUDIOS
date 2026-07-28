import { ArrowRight } from "lucide-react";
import { Section } from "@/components/lb/Section";
import { RiseIn, WordReveal } from "@/components/lb/Reveal";
import { posts } from "@/data/journal";

export function Journal() {
  /* 160px bottom: the light chapter ends here and the page returns to dark. */
  return (
    <Section tone="light" className="border-t border-alt-line pt-[120px] pb-[160px]">
      <div className="section-head">
        <div className="md:col-span-1">
          <div className="flex items-center gap-3">
            <span className="h-[10px] w-[10px] bg-alt-acid-type" />
            <span className="t-eyebrow text-alt-text">Journal</span>
          </div>
        </div>
        <div className="md:col-span-2">
          <WordReveal as="h2" className="t-h2 text-alt-text" text={"Notes from the room."} />
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
              className="text-alt-text transition-all duration-300 group-hover:translate-x-1 group-hover:text-alt-surface"
            />
          </a>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((p, i) => (
          <RiseIn key={p.title} delay={i * 0.08}>
            <a href="/journal" className="group block">
              <img
                src={p.image}
                alt={p.alt}
                width={1000}
                height={750}
                loading="lazy"
                className="aspect-[4/3] w-full border border-alt-line object-cover transition-all duration-500"
                style={{ filter: "grayscale(1) brightness(var(--img-brightness))" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.filter =
                    "grayscale(0.2) brightness(var(--img-brightness))")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.filter = "grayscale(1) brightness(var(--img-brightness))")
                }
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
