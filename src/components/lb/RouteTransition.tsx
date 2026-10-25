import { useEffect, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { ensureGsap, prefersReducedMotion, ScrollTrigger, markNavigated } from "@/lib/motion";
import { getLenis } from "@/lib/smooth";
import { useChapters, useWords } from "@/cms/hooks";
import { fill } from "@/cms/words";

/** How long the arrival in styles.css (`lb-page-in`, `lb-page-rise`) runs. */
const ENTRANCE_MS = 720;

/**
 * Navigation between chapters: an acid rule sweeps the top of the viewport,
 * the page being left dims, and the incoming page fades up while its header
 * band rises a few pixels into place.
 *
 * It also does the three unglamorous things a client-side route change breaks
 * if nobody does them — reset the scroll position through the smooth
 * scroller, refresh the pinned mechanics against the new layout, and move
 * focus so a keyboard or screen reader user is not stranded on a page they
 * have already left.
 *
 * EACH HALF IS TIED TO THE ROUTER EVENT THAT MEANS IT.
 * This used to key the arrival on `location.pathname`, which changes the
 * moment a link is pressed — 40ms in, while the new page was still loading
 * (it mounted 230–650ms later). So the "incoming" fade played on the page
 * being left, the old page jumped to the top before anything replaced it,
 * and the new page then appeared with no entrance at all. Now:
 *
 *   onBeforeNavigate    the press. Dim what is on screen and sweep the rule
 *                       — feedback that something is happening, which only
 *                       registers if the next page is slow to arrive.
 *   onBeforeRouteMount  the new page is about to render. Mark the document
 *                       so the CSS hides the new <main> from its very first
 *                       paint; hiding it from an effect instead lets one
 *                       frame of it through at full strength, a flicker.
 *   onRendered          it is in the DOM. Scroll to the top while it is
 *                       still transparent, so the jump is never seen; focus
 *                       its heading; let the CSS entrance run.
 *
 * The animation itself is CSS (opacity on <main>, a transform on its first
 * header only), so it runs on the compositor and never depends on the GSAP
 * ticker, and with `backwards` fill nothing is left on the element after it
 * ends — a transform left on <main> would become the containing block for
 * every pinned section inside it.
 */
export function RouteTransition() {
  const router = useRouter();
  const wipeRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  /* Read through a ref so a CMS refresh does not re-subscribe mid-flight. */
  const chapters = useChapters();
  const chaptersRef = useRef(chapters);
  chaptersRef.current = chapters;
  const words = useWords("common");
  const wordsRef = useRef(words);
  wordsRef.current = words;

  useEffect(() => {
    const root = document.documentElement;
    /* the <main> on screen when the new page was about to mount; if it is
     * still the one there afterwards (a persistent layout, an aborted
     * navigation), there was no new page to bring in */
    let leaving: Element | null = null;
    let tEnd = 0;
    const timers: number[] = [];

    const offPress = router.subscribe("onBeforeNavigate", (e) => {
      /* Recorded whatever the motion setting, so entrances elsewhere can tell
       * a client-side arrival from a hard load (see mayPlayEntrance). */
      markNavigated();
      if (!e.fromLocation || !e.pathChanged || prefersReducedMotion()) return;

      document.querySelector("main")?.setAttribute("data-leaving", "");

      const gsap = ensureGsap();
      const el = wipeRef.current;
      if (!gsap || !el) return;
      gsap.set(el, { scaleX: 0, transformOrigin: "left center", opacity: 1 });
      gsap
        .timeline()
        .to(el, { scaleX: 1, duration: 0.24, ease: "power3.inOut" })
        .set(el, { transformOrigin: "right center" })
        .to(el, { scaleX: 0, duration: 0.3, ease: "power3.inOut" });
    });

    const offMount = router.subscribe("onBeforeRouteMount", (e) => {
      if (!e.fromLocation || !e.pathChanged) return;
      leaving = document.querySelector("main");
      if (prefersReducedMotion()) return;
      window.clearTimeout(tEnd);
      root.setAttribute("data-route-enter", "");
    });

    const offRendered = router.subscribe("onRendered", (e) => {
      /* Anything still dimmed is a page that was not replaced — a search or
       * hash change, or a navigation that went nowhere. Put it back. */
      document
        .querySelectorAll("main[data-leaving]")
        .forEach((m) => m.removeAttribute("data-leaving"));
      if (!e.fromLocation || !e.pathChanged) return;

      const main = document.querySelector<HTMLElement>("main");
      if (!main || main === leaving) {
        root.removeAttribute("data-route-enter");
        leaving = null;
        return;
      }
      leaving = null;
      tEnd = window.setTimeout(() => root.removeAttribute("data-route-enter"), ENTRANCE_MS);

      /* Through Lenis, not window.scrollTo — the smooth scroller owns the
       * scroll position and would animate back to wherever it thinks it is. */
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(0, { immediate: true });
      else window.scrollTo(0, 0);

      /* Announce from the route table, not document.title — the head is
       * updated asynchronously, so reading it here can report the page the
       * user just left. */
      const arrived = chaptersRef.current.find((c) => c.to === e.toLocation.pathname);
      setMessage(
        fill(wordsRef.current.pageLoaded, {
          title: arrived?.title ?? wordsRef.current.pageFallback,
        }),
      );

      /* Move focus once the router has finished committing the head and
       * settling the tree — focus set synchronously here can land on an
       * element that is replaced a moment later.
       *
       * Scheduled on BOTH a double rAF and a timer, whichever wins. rAF alone
       * is not safe: it is paused whenever the page is not compositing (a
       * background tab, or a hidden pane), and a keyboard user returning to
       * such a tab would find focus stranded on <body>. `settle` is
       * idempotent. */
      let done = false;
      const settle = () => {
        if (done) return;
        done = true;
        const target = document.querySelector<HTMLElement>("[data-page-h1]") ?? main;
        target.focus({ preventScroll: true });
        ScrollTrigger.refresh();
      };
      const raf = requestAnimationFrame(() => requestAnimationFrame(settle));
      timers.push(
        window.setTimeout(settle, 80),
        /* again once the images have taken their space, and once the header
         * has finished rising, so every trigger measures the final layout */
        window.setTimeout(() => ScrollTrigger.refresh(), 400),
        window.setTimeout(() => ScrollTrigger.refresh(), ENTRANCE_MS + 40),
        window.setTimeout(() => cancelAnimationFrame(raf), 1000),
      );
    });

    return () => {
      offPress();
      offMount();
      offRendered();
      window.clearTimeout(tEnd);
      timers.forEach((t) => window.clearTimeout(t));
      root.removeAttribute("data-route-enter");
    };
  }, [router]);

  return (
    <>
      <div ref={wipeRef} aria-hidden="true" className="lb-wipe" />
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {message}
      </div>
    </>
  );
}
