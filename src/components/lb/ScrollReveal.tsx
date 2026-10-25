import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { ensureGsap, prefersReducedMotion, ScrollTrigger } from "@/lib/motion";

/**
 * Rows and cards rise into place as you reach them.
 *
 * Opt-in: put `data-reveal` on the element — a ledger row, a crew entry, a
 * product card — and it arrives with a short rise and a fade, staggered
 * against whatever else crosses the line in the same moment, so a list
 * comes in as a sequence rather than a block. `data-reveal="fade"` for
 * things that should not move (table rows, mostly).
 *
 * Mounted once beside SectionRule and built the same way, for the same
 * reasons spelled out there: ScrollTrigger rather than IntersectionObserver,
 * because the `[data-depth]` wrappers clip and IO reads a clipped ancestor
 * as never intersecting; and nothing touched until the router has rendered,
 * so hydration never meets a style it did not write.
 *
 * Three rules keep it from costing anything it should not:
 *
 *   Only what is below the fold when it is found. Anything already on
 *   screen — the first rows of a page, or a whole page reloaded halfway
 *   down — is left exactly as it is. Hiding something the visitor is
 *   already looking at, to play it back to them, is a flicker.
 *
 *   It always ends visible. Entering, leaving and coming back all reveal,
 *   so a jump past a list (an anchor, a fast fling) can never strand rows
 *   at zero opacity, and once in, the inline styles are cleared — hover
 *   lifts and every other rule on the element work as if this never ran.
 *
 *   Reduced motion: nothing is hidden and nothing moves.
 */
export function ScrollReveal() {
  const router = useRouter();

  useEffect(() => {
    const gsap = ensureGsap();
    if (!gsap || prefersReducedMotion()) return;

    const seen = new WeakSet<Element>();
    let triggers: ScrollTrigger[] = [];

    const reveal = (batch: Element[]) => {
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "expo.out",
        stagger: 0.07,
        overwrite: true,
        clearProps: "opacity,transform",
      });
    };

    const scan = () => {
      /* routes replace their subtree; triggers for rows that went with it
       * are dead weight on every scroll */
      triggers = triggers.filter((t) => {
        const el = t.trigger as Element | undefined;
        if (el && el.isConnected) return true;
        t.kill();
        return false;
      });

      const fold = window.innerHeight * 0.92;
      const fresh: HTMLElement[] = [];
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return; // not laid out — leave it
        if (r.top < fold) return; // on screen, or already scrolled past
        fresh.push(el);
      });
      if (fresh.length === 0) return;

      gsap.set(fresh, {
        opacity: 0,
        y: (_: number, el: HTMLElement) => (el.dataset.reveal === "fade" ? 0 : 28),
      });
      triggers.push(
        ...ScrollTrigger.batch(fresh, {
          start: "top 90%",
          onEnter: reveal,
          onLeave: reveal,
          onEnterBack: reveal,
        }),
      );
    };

    let queued = 0;
    const queue = () => {
      if (!queued) queued = requestAnimationFrame(() => ((queued = 0), scan()));
    };
    const mo = new MutationObserver(queue);

    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      scan();
      mo.observe(document.body, { childList: true, subtree: true });
    };
    const unsubscribe = router.subscribe("onRendered", start);
    const fallback = window.setTimeout(start, 1000);

    return () => {
      unsubscribe();
      window.clearTimeout(fallback);
      cancelAnimationFrame(queued);
      mo.disconnect();
      triggers.forEach((t) => t.kill());
      document
        .querySelectorAll<HTMLElement>("[data-reveal]")
        .forEach((el) => gsap.set(el, { clearProps: "opacity,transform" }));
    };
  }, [router]);

  return null;
}
