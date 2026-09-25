import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { ensureGsap, ScrollTrigger } from "@/lib/motion";

/**
 * Draws each section header's top rule as you arrive at it.
 *
 * Mounted once, above the router, rather than added to every section: the
 * header is a bare `.section-head` class on a div in a dozen files, not a
 * component, so wiring a trigger into each one would mean touching all of
 * them and remembering to do it again for the next section anyone adds.
 * One watcher finds them wherever they are.
 *
 * The rule itself is CSS (`.section-head::before`) — this only sets the
 * `data-in` flag that releases it. With JS off the rule is simply drawn
 * from the start rather than missing.
 *
 * WHY NOT IntersectionObserver
 * It was the obvious choice and it does not work here. Eight of the eleven
 * headers sit inside a `[data-depth]` wrapper, and ScrollDepth sets
 * `overflow-x: clip` on the element around it; IO computes intersection against the clip-rect
 * chain, so a clipped ancestor makes the child read as never intersecting.
 * Measured: only two of eleven ever fired. ScrollTrigger measures against
 * the document and is what every other reveal on this site already uses
 * from inside the same wrappers, so it is both correct and consistent.
 *
 * Draws once per element, on purpose. A line that redraws every time a header
 * scrolls back into view turns a section boundary into a blinking light,
 * and on a thirty-screen page you cross most of these several times.
 */
export function SectionRule() {
  const router = useRouter();

  useEffect(() => {
    const gsap = ensureGsap();
    if (!gsap) return;

    const triggers: ScrollTrigger[] = [];
    const seen = new WeakSet<Element>();

    const scan = () => {
      document.querySelectorAll<HTMLElement>(".section-head").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        triggers.push(
          ScrollTrigger.create({
            trigger: el,
            /* a little before the header reaches the middle of the screen,
             * so the line has finished drawing by the time it is read */
            start: "top 78%",
            /* No `once` — see the note in Reveal.tsx. Setting an attribute
             * that is already set is free, so a live trigger costs nothing. */
            onEnter: () => el.setAttribute("data-in", ""),
          }),
        );
      });
    };

    /* Routes swap their whole subtree under a persistent root, so new
     * headers appear without this component remounting. */
    const mo = new MutationObserver(() => scan());

    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      scan();
      mo.observe(document.body, { childList: true, subtree: true });
    };

    /* NOT ON MOUNT — wait until the page has hydrated.
     *
     * This component is mounted above the router, so its effect runs before
     * React has finished hydrating the streamed route below it. Marking a
     * header `data-in` in that window put an attribute into the DOM that
     * React had not rendered, and hydration reported a mismatch on every
     * section in view at load. The rule still drew; React logged a wall of
     * console error for something entirely intentional, which is how a real
     * mismatch later gets ignored.
     *
     * `onRendered` fires once the router has committed its matches, which is
     * after hydration. The timer is a safety net for the case where that
     * event has already passed before this subscription exists — a second is
     * far longer than hydration takes, and the observer catches up anything
     * that scrolled past in the meantime. */
    const unsubscribe = router.subscribe("onRendered", start);
    const fallback = window.setTimeout(start, 1000);

    return () => {
      unsubscribe();
      window.clearTimeout(fallback);
      mo.disconnect();
      triggers.forEach((t) => t.kill());
    };
  }, [router]);

  return null;
}
