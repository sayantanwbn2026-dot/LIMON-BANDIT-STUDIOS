import { useEffect, useRef } from "react";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { Section, Eyebrow } from "@/components/lb/Section";
import { WordReveal } from "@/components/lb/Reveal";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";
import { CmsImage } from "@/components/lb/CmsImage";
import { useReleases, useSection } from "@/cms/hooks";

export function Roster() {
  const copy = useSection("home", "roster");
  const releases = useReleases();
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
    <Section tone="dark" className="py-[96px]">
      <div className="section-head">
        <div className="md:col-span-1">
          <Eyebrow>{copy.eyebrow}</Eyebrow>
        </div>
        <div className="md:col-span-2">
          <WordReveal as="h2" className="t-h2 text-text" text={copy.heading} />
        </div>
        <div className="flex items-end md:col-span-1 md:justify-end">
          <a
            href="/label"
            className="group flex items-center gap-3 border border-line px-6 py-4 transition-colors duration-300 hover:border-acid-type"
          >
            <span className="t-eyebrow text-text">Hear the label</span>
            <ArrowRight
              size={15}
              className="text-acid-type transition-transform duration-300 group-hover:translate-x-1"
            />
          </a>
        </div>
      </div>

      <div ref={ref} className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {releases.map((r) => (
          <a
            key={r.title}
            href="/label"
            data-release
            data-cursor="play"
            className={`group relative block overflow-hidden border border-line ${r.span} ${r.height}`}
          >
            <CmsImage
              src={r.cover}
              sizes="(max-width: 767px) 100vw, 33vw"
              alt={r.alt}
              className="chroma absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
              style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
            />
            <span
              aria-hidden="true"
              className="absolute left-0 top-0 h-[20px] w-[20px] border-l border-t border-acid-type"
            />
            <div
              className="absolute inset-x-0 bottom-0 border-t border-line p-5"
              style={{ background: "var(--scrim)" }}
            >
              <div className="t-label text-mute">
                {r.genre} · {r.runtime} · {r.year}
              </div>
              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="font-display text-[18px] font-bold uppercase leading-none tracking-[-0.02em] text-text">
                  {r.artist}
                </span>
                <ArrowUpRight size={18} className="shrink-0 text-acid-type" />
              </div>
              <div className="mt-1 font-ui text-[12px] text-mute">{r.title}</div>
            </div>
          </a>
        ))}
      </div>
    </Section>
  );
}
