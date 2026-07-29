import { useEffect, useRef } from "react";
import { Eyebrow } from "@/components/lb/Section";
import { GridRules, BoundaryRule } from "@/components/lb/GridRules";
import { MarginNotes } from "@/components/lb/Section";
import { GhostLink } from "@/components/lb/Buttons";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";
import { drops } from "@/data/drops";
import { Picture } from "@/components/lb/Picture";

export function DropRail() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    const tr = track.current;
    if (!el || !tr) return;
    const gsap = ensureGsap();
    if (!gsap || prefersReducedMotion()) return;
    if (window.matchMedia("(max-width: 767px)").matches) return;

    const ctx = gsap.context(() => {
      const distance = () => tr.scrollWidth - window.innerWidth + 48;
      gsap.to(tr, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            if (bar.current) bar.current.style.transform = `scaleX(${self.progress})`;
          },
        },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="drops" className="relative w-full overflow-hidden bg-surface-deep">
      <BoundaryRule tone="dark" className="top-0" />
      <GridRules tone="dark" />
      <MarginNotes index="10" name="The Drop Rail" />

      <div className="relative z-[2] flex min-h-screen flex-col justify-center py-[96px]">
        <div className="shell flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow tone="dark">Label output</Eyebrow>
            <h2 className="t-h2 mt-6 max-w-[18ch] text-text">Everything the house has pressed</h2>
          </div>
          <GhostLink label="Full catalogue" to="/label" className="text-mute" />
        </div>

        <div className="mt-12 w-full overflow-hidden">
          <div
            ref={track}
            className="flex w-max gap-6 px-[var(--page-margin)] max-md:w-full max-md:snap-x max-md:overflow-x-auto"
          >
            {drops.map((d) => (
              <article
                key={d.id}
                className="group w-[280px] shrink-0 snap-start border border-line bg-surface md:w-[340px]"
              >
                <div className="relative overflow-hidden" style={{ aspectRatio: "1 / 1" }}>
                  <Picture
                    src={d.image}
                    sizes="(max-width: 767px) 280px, 340px"
                    alt={`${d.title} by ${d.artist} — cover art`}
                    className="h-full w-full object-cover transition-transform duration-[700ms] group-hover:scale-[1.05]"
                    style={{
                      filter: "grayscale(1) brightness(var(--img-brightness)) contrast(1.05)",
                    }}
                  />
                  <span className="absolute left-0 top-0 bg-surface-deep px-3 py-1 font-ui text-[10px] font-bold uppercase tracking-[0.16em] tnum text-acid-type">
                    {d.index}
                  </span>
                  <span
                    className={`absolute bottom-0 right-0 px-3 py-1 font-ui text-[10px] font-bold uppercase tracking-[0.16em] ${
                      d.status === "Out now"
                        ? "bg-acid text-accent-text"
                        : "bg-surface-deep text-mute"
                    }`}
                  >
                    {d.status}
                  </span>
                </div>
                <div className="border-t border-line p-5">
                  <h3 className="font-display text-[22px] font-extrabold uppercase leading-[1] tracking-[-0.02em] text-text">
                    {d.title}
                  </h3>
                  <p className="mt-2 font-ui text-[13px] text-mute">{d.artist}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                    <span className="font-ui text-[10px] font-bold uppercase tracking-[0.14em] text-mute">
                      {d.format}
                    </span>
                    <span className="font-ui text-[10px] font-bold uppercase tracking-[0.14em] tnum text-mute">
                      {d.date}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="shell mt-12 flex items-center gap-5">
          <span className="font-ui text-[10px] font-bold uppercase tracking-[0.18em] text-mute">
            Drag / Scroll
          </span>
          <span className="relative h-px flex-1 bg-line">
            <span
              ref={bar}
              className="absolute inset-0 origin-left bg-acid"
              style={{ transform: "scaleX(0)" }}
            />
          </span>
          <span className="font-ui text-[10px] font-bold uppercase tracking-[0.18em] tnum text-mute">
            {String(drops.length).padStart(2, "0")} releases
          </span>
        </div>
      </div>
    </section>
  );
}
