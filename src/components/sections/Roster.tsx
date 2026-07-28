import { useEffect, useRef } from "react";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { Section, Eyebrow } from "@/components/lb/Section";
import { WordReveal } from "@/components/lb/Reveal";
import { releases } from "@/data/releases";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";

export function Roster() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const gsap = ensureGsap();
    if (!gsap || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>("[data-release]").forEach((card, i) => {
        gsap.fromTo(
          card,
          { y: 70, scale: 0.94, opacity: 0.4, filter: "blur(4px)" },
          {
            y: 0,
            scale: 1,
            opacity: 1,
            filter: "blur(0px)",
            ease: "none",
            scrollTrigger: {
              trigger: card,
              start: "top bottom",
              end: `top ${62 + (i % 2) * 6}%`,
              scrub: 0.8,
            },
          },
        );
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <Section tone="dark" className="py-[140px]">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <Eyebrow>The roster</Eyebrow>
        </div>
        <div className="md:col-span-2">
          <WordReveal as="h2" className="t-h2 text-text-dark" text={"Real rooms.\nReal records."} />
        </div>
        <div className="flex items-end md:col-span-1 md:justify-end">
          <a
            href="/label"
            className="group flex items-center gap-3 border border-ink-line px-6 py-4 transition-colors duration-300 hover:border-acid"
          >
            <span className="t-eyebrow text-text-dark">Hear the label</span>
            <ArrowRight size={15} className="text-acid transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>
      </div>

      <div ref={ref} className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {releases.map((r) => (
          <a
            key={r.title}
            href="/label"
            data-release
            data-cursor="play"
            className={`group relative block overflow-hidden border border-ink-line ${r.span} ${r.height}`}
          >
            <img
              src={r.cover}
              alt={r.alt}
              width={900}
              height={900}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-all duration-700 group-hover:scale-[1.06]"
              style={{ filter: "grayscale(1)", transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = "grayscale(0.15)")}
              onMouseLeave={(e) => (e.currentTarget.style.filter = "grayscale(1)")}
            />
            <span aria-hidden="true" className="absolute left-0 top-0 h-[20px] w-[20px] border-l border-t border-acid" />
            <div
              className="absolute inset-x-0 bottom-0 border-t border-ink-line p-5"
              style={{ background: "rgba(7,7,7,0.85)" }}
            >
              <div className="t-label text-mute-dark">
                {r.genre} · {r.runtime} · {r.year}
              </div>
              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="font-display text-[18px] font-bold uppercase leading-none tracking-[-0.02em] text-text-dark">
                  {r.artist}
                </span>
                <ArrowUpRight size={18} className="shrink-0 text-acid" />
              </div>
              <div className="mt-1 font-ui text-[12px] text-mute-dark">{r.title}</div>
            </div>
          </a>
        ))}
      </div>
    </Section>
  );
}
