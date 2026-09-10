import { useEffect, useRef, type ReactNode } from "react";
import { ensureGsap, prefersReducedMotion, ScrollTrigger } from "@/lib/motion";

/**
 * ScrollDepth — the camera moves, not the page.
 *
 * A section arrives from depth (0.94 → 1) and, once its work is done, the
 * camera pushes through it (1 → 1.06, fading out) to reveal the one behind.
 * Scrubbed against scroll, so it is Lenis driving the lens rather than a
 * timed animation playing at you.
 *
 * WHAT MUST NEVER BE WRAPPED IN THIS
 * A transformed ancestor makes `position: fixed` descendants resolve against
 * the transform instead of the viewport, which silently destroys any pinned
 * ScrollTrigger inside, and it re-bases `position: sticky` too. Hero,
 * ThreeWaysIn and DropRail are pinned; Rooms has a sticky visual. All four
 * are deliberately left bare in the route — see index.tsx.
 *
 * Only transform and opacity are touched, so the whole thing composites on
 * the GPU and never reflows. `will-change` is toggled on the active section
 * only: leaving it on fifteen full-viewport layers costs more than it saves.
 *
 * Runs at every width, with less travel on phones — see the note by the
 * matchMedia branches. An earlier version disabled it below 768px on the
 * assumption the cue would be invisible there; the opposite is true, because
 * a phone shows one section at a time and the arrival is the whole frame.
 */
export function ScrollDepth({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const gsap = ensureGsap();
    if (!gsap || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      /* Same scene at both sizes, different travel. On a phone a section
       * fills the screen, so the depth cue is MORE legible than on desktop
       * and needs less of it — 4% reads on a 390px column the way 6% reads
       * on a 1440px one. Nothing is pinned here, so unlike the hero and the
       * door flip this is safe on mobile Safari, where a pinned trigger
       * fights the URL bar resizing the viewport mid-scroll. */
      const build = (arriveScale: number, departScale: number, arriveOpacity: number) => () => {
        /* One trigger and one timeline, rather than separate arrival and
         * departure triggers — two triggers writing scale and opacity on the
         * same element fight each other on any section shorter than about
         * half a viewport. Phases are fractions of the whole pass, so they
         * hold whatever the section's height. */
        const tl = gsap.timeline({ paused: true });

        tl.fromTo(
          el,
          { scale: arriveScale, opacity: arriveOpacity },
          { scale: 1, opacity: 1, duration: 0.2, ease: "power2.out" },
          0,
        );
        tl.to(el, { scale: departScale, opacity: 0, duration: 0.22, ease: "power2.in" }, 0.78);

        const st = ScrollTrigger.create({
          animation: tl,
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.6,
          invalidateOnRefresh: true,
          onToggle: (self) => {
            gsap.set(el, { willChange: self.isActive ? "transform, opacity" : "auto" });
          },
        });

        return () => {
          st.kill();
          tl.kill();
          gsap.set(el, { clearProps: "transform,opacity,willChange" });
        };
      };

      mm.add(
        "(max-width: 767px) and (prefers-reduced-motion: no-preference)",
        build(0.96, 1.04, 0.45),
      );
      mm.add(
        "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
        build(0.94, 1.06, 0.35),
      );

      return () => mm.revert();
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    /* The clip lives on a parent that never transforms, and the scale on
     * the child inside it.
     *
     * They used to be the same element, with a comment saying the clip
     * contained the 1.06 push-through. It could not: overflow clips an
     * element's descendants, never its own transformed box. Measured at
     * 1440px, six wrappers were 1510px wide in a 1425px viewport and the
     * document was 42px wider than the screen — hidden by the page-level
     * overflow guard, but real, and inherited by every width measurement.
     * One level up, the parent clips the child's transform, which is the
     * thing the original comment meant.
     *
     * `clip` rather than `hidden` so it creates no scroll container: it is
     * the one value allowed to pair with a visible cross axis, so the
     * section still paints freely above and below while it scales. */
    <div style={{ overflowX: "clip", overflowY: "visible" }}>
      <div ref={ref} data-depth style={{ transformOrigin: "50% 50%" }}>
        {children}
      </div>
    </div>
  );
}
