import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Section, Eyebrow } from "@/components/lb/Section";
import { WordReveal } from "@/components/lb/Reveal";
import { MaskReveal } from "@/components/lb/MaskReveal";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";
import { useDoors, useSection } from "@/cms/hooks";
/* The three door plates are CSS background slices of one photograph, so this
 * one needs a plain URL rather than a <picture>. Points at the generated
 * AVIF — same pipeline, just consumed as a background. */
const CORRIDOR = "/img/split-corridor-1440.avif";

/**
 * Three Ways In — one photograph that splits into three plates and flips
 * into the house's three offers. Scrubbed, reversible, GSAP-native.
 */
export function ThreeWaysIn() {
  const copy = useSection("home", "doors");
  const doors = useDoors();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const gsap = ensureGsap();
    if (!gsap || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      /* ---- phones: the doors open ----
       * One pair of leaves per card, each pair triggered by its own card so
       * they open as you come to them rather than all at once off-screen.
       * `once` because a door that shuts itself every time you scroll back
       * up stops being a door and becomes a flicker. */
      mm.add("(max-width: 1023px) and (prefers-reduced-motion: no-preference)", () => {
        const panels = gsap.utils.toArray<HTMLElement>("[data-panel]", el);
        const kills: Array<() => void> = [];

        panels.forEach((panel) => {
          const leaves = panel.querySelectorAll<HTMLElement>("[data-leaf]");
          if (leaves.length !== 2) return;

          const tl = gsap.timeline({
            scrollTrigger: { trigger: panel, start: "top 72%", once: true },
          });
          /* 101%, not 100 — a hairline of the leaf stays visible at exactly
           * 100% on fractional-DPR screens. */
          tl.to(leaves[0], { xPercent: -101, duration: 0.9, ease: "expo.inOut" }, 0);
          tl.to(leaves[1], { xPercent: 101, duration: 0.9, ease: "expo.inOut" }, 0);
          kills.push(() => tl.scrollTrigger?.kill());
          kills.push(() => tl.kill());
        });

        return () => kills.forEach((k) => k());
      });

      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const panels = gsap.utils.toArray<HTMLElement>("[data-panel]");
        const assembly = el.querySelector<HTMLElement>("[data-assembly]");
        if (!assembly || panels.length !== 3) return;

        gsap.set(panels, { willChange: "transform" });

        const tl = gsap.timeline({
          defaults: { ease: "power4.inOut" },
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: "bottom bottom",
            pin: el.querySelector("[data-stage]"),
            pinSpacing: false,
            scrub: 0.7,
            onToggle: (self) => {
              if (!self.isActive) gsap.set(panels, { willChange: "auto" });
              else gsap.set(panels, { willChange: "transform" });
            },
          },
        });

        /* A — arrive */
        tl.fromTo(
          assembly,
          { scale: 0.9, opacity: 0.6 },
          { scale: 1, opacity: 1, duration: 0.18 },
          0,
        );

        /* B — split, with plate-like asymmetry */
        tl.fromTo(panels[0], { x: 0, y: 0 }, { x: -24, y: -14, duration: 0.24 }, 0.18);
        tl.fromTo(panels[1], { y: 0 }, { y: 10, duration: 0.24 }, 0.18);
        tl.fromTo(panels[2], { x: 0, y: 0 }, { x: 24, y: -6, duration: 0.24 }, 0.18);
        tl.fromTo(
          "[data-gutter-tick]",
          { scaleY: 0 },
          { scaleY: 1, duration: 0.1, ease: "power2.out", stagger: 0.02 },
          0.28,
        );

        /* C — flip, staggered with depth */
        [0, 1, 2].forEach((i) => {
          const at = 0.42 + i * 0.05;
          tl.to(panels[i], { rotateY: 180, duration: 0.2, ease: "power3.inOut" }, at);
          tl.to(panels[i], { z: 60, duration: 0.1, ease: "power2.out" }, at);
          tl.to(panels[i], { z: 0, duration: 0.1, ease: "power2.in" }, at + 0.1);
          tl.fromTo(
            `[data-rail="${i}"]`,
            { scaleX: 0 },
            { scaleX: 1, duration: 0.08, ease: "none" },
            at + 0.12,
          );
          tl.fromTo(
            panels[i].querySelectorAll("[data-back-item]"),
            { y: 14, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.08, stagger: 0.02, ease: "power3.out" },
            at + 0.14,
          );
        });

        /* D — settle */
        tl.to(panels[0], { y: 0, duration: 0.2 }, 0.78);
        tl.to(panels[1], { y: 0, duration: 0.2 }, 0.78);
        tl.to(panels[2], { y: 0, duration: 0.2 }, 0.78);
        tl.to({}, { duration: 0.02 }, 0.98);
      });
      return () => mm.revert();
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <Section id="doors" tone="dark" surface="bg-surface-deep" index="05" name="Three Ways In">
      <div className="pt-[96px]">
        <div className="section-head">
          <div className="md:col-span-1">
            <Eyebrow surface="bg-surface-deep">{copy.eyebrow}</Eyebrow>
          </div>
          <div className="md:col-span-2">
            <WordReveal as="h2" className="t-h2 text-text" text={copy.heading} />
          </div>
        </div>
      </div>

      {/* Pin container. 200vh, down from 380: the split-and-flip is four
       * short phases and at 380 each one was stretched over most of a
       * screen, so the plates crawled. The timeline is expressed in
       * fractions of the scroll range, so a shorter container plays the
       * same scene at a pace that reads as choreography rather than as the
       * page refusing to move. */}
      <div ref={root} className="relative mt-12 lg:h-[200vh]">
        <div
          data-stage
          /* pt reserves the fixed navbar: the stage is pinned to the top of
           * the viewport, so without it the centred assembly rides up under
           * the bar as the plates flip. */
          className="relative flex w-full items-center justify-center lg:h-[100svh] lg:pt-[var(--nav-h)]"
          style={{ perspective: 1400 }}
        >
          <div className="w-full">
            {/* Reduced motion only. On a phone the corridor is no longer a
             * separate picture above the cards — it is on the doors, which
             * open. This stays for anyone who has asked for no animation,
             * because for them the doors never open and the photograph
             * would otherwise be missing entirely. */}
            <MaskReveal
              src="split-corridor"
              alt="The corridor outside the three rooms at the Limon Bandit house"
              className="lb-doors-still mb-10 aspect-[21/9] w-full lg:hidden"
              imgClassName="h-full w-full object-cover"
              sizes="100vw"
              style={{ filter: "brightness(var(--img-brightness)) contrast(1.08)" }}
            />

            <div className="lb-doors-box relative">
              <div
                data-assembly
                className="flex w-full flex-col gap-6 lg:flex-row lg:gap-0"
                style={{ transformStyle: "preserve-3d" }}
              >
                {doors.map((d, i) => (
                  <div
                    key={d.index}
                    data-panel
                    className="relative flex-1 lg:aspect-[7/9]"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {/* front — photograph slice */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 hidden border border-line lg:block"
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        backgroundImage: `url(${CORRIDOR})`,
                        backgroundSize: "300% 100%",
                        backgroundPosition: `${i * 50}% 50%`,
                        filter: "brightness(var(--img-brightness)) contrast(1.08)",
                      }}
                    >
                      {i === 1 ? (
                        <span className="absolute left-0 top-0 block h-[22px] w-[22px] border-l-2 border-t-2 border-acid-type" />
                      ) : null}
                    </div>

                    {/* back — the offer card */}
                    <article
                      className="lb-back group relative flex min-h-[320px] w-full flex-col p-8 transition-transform duration-[350ms] lg:absolute lg:inset-0 lg:min-h-0"
                      style={{
                        background: d.surface,
                        color: d.text,
                        border: `1px solid ${d.border}`,
                      }}
                    >
                      <span
                        data-back-item
                        className="font-display text-[14px] font-bold"
                        style={{ color: d.indexColor }}
                      >
                        {d.index}
                      </span>
                      <h3
                        data-back-item
                        className="mt-6 font-display font-bold uppercase tracking-[-0.02em]"
                        style={{ fontSize: "clamp(24px, 2vw, 32px)", lineHeight: 1.02 }}
                      >
                        {d.title}
                      </h3>
                      <p
                        data-back-item
                        className="mt-4 font-ui text-[15px] leading-[1.5]"
                        style={{ color: d.muted }}
                      >
                        {d.description}
                      </p>
                      <div
                        data-back-item
                        className="mt-auto pt-8"
                        style={{ borderTop: `1px solid ${d.border}` }}
                      >
                        <Link
                          to={d.to}
                          className="group/cta mt-6 inline-flex items-center gap-2 font-ui text-[12px] font-bold uppercase tracking-[0.14em]"
                          style={{ color: d.text }}
                        >
                          <span className="wipe-underline">{d.cta}</span>
                          <ArrowUpRight size={14} />
                        </Link>
                      </div>
                    </article>

                    {/* ---- the door, on phones ----
                     * Two leaves carrying this card's slice of the corridor,
                     * which slide apart when the card arrives and leave the
                     * offer behind them. The desktop plate flip is gated to
                     * 1024px and mobile got nothing at all — a static photo
                     * above three plain cards.
                     *
                     * The maths: the corridor spans three card widths, each
                     * leaf is half a card, so the image is six leaf widths —
                     * 600% — and leaf k sits at k*20%. Card i owns leaves 2i
                     * and 2i+1, so the seam falls exactly where the picture
                     * would have been cut anyway.
                     *
                     * transform only, so the whole thing composites.
                     *
                     * pointer-events-none is not optional. The leaves sit at
                     * z-3, above the card, and were catching taps: anyone who
                     * pressed "Book the room" while the doors were still
                     * parting hit a photograph instead of the link, and had
                     * the reveal ever failed to fire the whole card would
                     * have been untappable. They are pictures of a door. */}
                    <span
                      aria-hidden="true"
                      data-leaf
                      className="pointer-events-none absolute inset-y-0 left-0 z-[3] w-1/2 lg:hidden"
                      style={{
                        backgroundImage: `url(${CORRIDOR})`,
                        backgroundSize: "600% 100%",
                        backgroundPosition: `${i * 2 * 20}% 50%`,
                        filter: "brightness(var(--img-brightness)) contrast(1.08)",
                        borderRight: "1px solid var(--accent)",
                      }}
                    />
                    <span
                      aria-hidden="true"
                      data-leaf
                      className="pointer-events-none absolute inset-y-0 right-0 z-[3] w-1/2 lg:hidden"
                      style={{
                        backgroundImage: `url(${CORRIDOR})`,
                        backgroundSize: "600% 100%",
                        backgroundPosition: `${(i * 2 + 1) * 20}% 50%`,
                        filter: "brightness(var(--img-brightness)) contrast(1.08)",
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* gutter ticks */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 hidden lg:block"
              >
                {[33.333, 66.666].map((left) => (
                  <span
                    key={left}
                    data-gutter-tick
                    className="absolute top-1/2 block h-[36%] w-px bg-acid"
                    style={{ left: `${left}%`, transform: "translateY(-50%) scaleY(0)" }}
                  />
                ))}
              </div>
            </div>

            {/* progress rail */}
            <div className="lb-doors-box mt-8 hidden grid-cols-3 gap-6 lg:grid">
              {[0, 1, 2].map((i) => (
                <span key={i} className="relative block h-px w-full bg-line">
                  <span
                    data-rail={i}
                    className="absolute inset-0 block origin-left bg-acid"
                    style={{ transform: "scaleX(0)" }}
                  />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="h-[140px]" />
    </Section>
  );
}
