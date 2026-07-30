import { useEffect, useRef, useState } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { ensureGsap, prefersReducedMotion, ScrollTrigger } from "@/lib/motion";
import { getLenis } from "@/lib/smooth";
import { chapters } from "@/data/routes";

/**
 * Navigation between chapters: an acid rule sweeps the top of the viewport,
 * the outgoing page fades, the incoming header band rises.
 *
 * It also does the three unglamorous things a client-side route change breaks
 * if nobody does them — reset the scroll position through the smooth
 * scroller, refresh the pinned mechanics against the new layout, and move
 * focus so a keyboard or screen reader user is not stranded on a page they
 * have already left.
 *
 * The incoming half is driven by router *state* rather than a router event.
 * Events fire around the transition, not after the new tree has rendered, so
 * an event-based handler queries the DOM too early and focuses nothing —
 * which is exactly what happened first time round.
 */
export function RouteTransition() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const wipeRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  const [message, setMessage] = useState("");

  /* ---- outgoing: fade + wipe, before the new route commits ---- */
  useEffect(() => {
    const gsap = ensureGsap();
    if (!gsap || prefersReducedMotion()) return;

    return router.subscribe("onBeforeNavigate", () => {
      const main = document.querySelector("main");
      if (main) gsap.to(main, { opacity: 0, duration: 0.18, ease: "power2.out", overwrite: true });

      const el = wipeRef.current;
      if (!el) return;
      gsap.set(el, { scaleX: 0, transformOrigin: "left center", opacity: 1 });
      gsap
        .timeline()
        .to(el, { scaleX: 1, duration: 0.21, ease: "power4.inOut" })
        .set(el, { transformOrigin: "right center" })
        .to(el, { scaleX: 0, duration: 0.21, ease: "power4.inOut" });
    });
  }, [router]);

  /* ---- incoming: runs after the new route has rendered ---- */
  useEffect(() => {
    /* Skip the first pass: on a cold load the user asked for this page, and
     * yanking focus to the heading would scroll them past the hero. */
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const gsap = ensureGsap();
    const reduced = prefersReducedMotion();

    /* Through Lenis, not window.scrollTo — the smooth scroller owns the
     * scroll position and would animate back to wherever it thinks it is. */
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);

    const main = document.querySelector<HTMLElement>("main");
    if (main) {
      if (gsap && !reduced) {
        gsap.fromTo(main, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: "power2.out" });
        const header = main.querySelector("header");
        if (header) gsap.fromTo(header, { y: 24 }, { y: 0, duration: 0.52, ease: "expo.out" });
      } else {
        main.style.opacity = "";
      }
    }

    /* Announce from the route table, not document.title — the head is
     * updated asynchronously after this effect, so reading it here reports
     * the page the user just left. */
    const arrived = chapters.find((c) => c.to === pathname);
    setMessage(`${arrived?.title ?? "Page"} — loaded`);

    /* Focus after paint. Moving it inside this effect is too early: the
     * router commits the head and settles the tree immediately afterwards,
     * and focus set before that lands on an element that is then replaced. */
    /* Move focus once the router has finished committing the head and
     * settling the tree — focus set synchronously here lands on an element
     * that is replaced a moment later.
     *
     * Scheduled on BOTH a double rAF and a timer, whichever wins. rAF alone
     * is not safe: it is paused whenever the page is not compositing (a
     * background tab, or a hidden pane), and a keyboard user returning to
     * such a tab would find focus stranded on <body>. `settle` is idempotent. */
    let done = false;
    let raf2 = 0;
    const settle = () => {
      if (done) return;
      done = true;
      const target =
        document.querySelector<HTMLElement>("[data-page-h1]") ??
        document.querySelector<HTMLElement>("main");
      target?.focus({ preventScroll: true });
      ScrollTrigger.refresh();
    };

    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(settle);
    });
    const tSettle = window.setTimeout(settle, 80);
    /* and again once the new route's images have taken up their space */
    const tImages = window.setTimeout(() => ScrollTrigger.refresh(), 400);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.clearTimeout(tSettle);
      window.clearTimeout(tImages);
    };
  }, [pathname]);

  return (
    <>
      <div ref={wipeRef} aria-hidden="true" className="lb-wipe" />
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {message}
      </div>
    </>
  );
}
