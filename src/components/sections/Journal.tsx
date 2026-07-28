import { ArrowRight } from "lucide-react";
import { Section } from "@/components/lb/Section";
import { RiseIn, WordReveal } from "@/components/lb/Reveal";
import { posts } from "@/data/journal";

export function Journal() {
  return (
    <Section tone="light" className="border-t border-bone-line py-[120px]">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-3">
            <span className="h-[10px] w-[10px] bg-acid-dim" />
            <span className="t-eyebrow text-text-light">Journal</span>
          </div>
        </div>
        <div className="md:col-span-2">
          <WordReveal as="h2" className="t-h2 text-text-light" text={"Notes from the room."} />
        </div>
        <div className="flex items-end md:col-span-1 md:justify-end">
          <a
            href="/journal"
            className="group flex items-center gap-3 border border-text-light px-6 py-4 transition-colors duration-300 hover:bg-text-light"
          >
            <span className="t-eyebrow text-text-light transition-colors duration-300 group-hover:text-bone">
              Read everything
            </span>
            <ArrowRight size={15} className="text-text-light transition-all duration-300 group-hover:translate-x-1 group-hover:text-bone" />
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
                className="aspect-[4/3] w-full border border-bone-line object-cover transition-all duration-500"
                style={{ filter: "grayscale(1)" }}
                onMouseEnter={(e) => (e.currentTarget.style.filter = "grayscale(0.2)")}
                onMouseLeave={(e) => (e.currentTarget.style.filter = "grayscale(1)")}
              />
              <div className="t-label mt-5 text-mute-light">
                {p.category} · {p.readTime}
              </div>
              <h3 className="mt-3 inline font-display text-[18px] font-bold uppercase leading-[1.15] tracking-[-0.02em] text-text-light">
                <span className="relative inline bg-[linear-gradient(var(--acid-dim),var(--acid-dim))] bg-[length:0%_2px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_2px]">
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
