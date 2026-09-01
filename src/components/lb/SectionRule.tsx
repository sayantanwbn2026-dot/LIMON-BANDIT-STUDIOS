import { useEffect } from "react";
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
 * `overflow-x: clip` on it; IO computes intersection against the clip-rect
 * chain, so a clipped ancestor makes the child read as never intersecting.
 * Measured: only two of eleven ever fired. ScrollTrigger measures against
 * the document and is what every other reveal on this site already uses
 * from inside the same wrappers, so it is both correct and consistent.
 *
 * `once` per element, on purpose. A line that redraws every time a header
 * scrolls back into view turns a section boundary into a blinking light,
 * and on a thirty-screen page you cross most of these several times.
 */
export function SectionRule() {
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
            once: true,
            onEnter: () => el.setAttribute("data-in", ""),
          }),
        );
      });
    };

    scan();

    /* Routes swap their whole subtree under a persistent root, so new
     * headers appear without this component remounting. */
    const mo = new MutationObserver(() => scan());
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      triggers.forEach((t) => t.kill());
    };
  }, []);

  return null;
}
