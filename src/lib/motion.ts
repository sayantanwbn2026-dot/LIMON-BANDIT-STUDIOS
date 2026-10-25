import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

export function ensureGsap() {
  if (typeof window === "undefined") return null;
  if (!registered) {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
  return gsap;
}

export function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

let navigated = false;

/** Called by RouteTransition as a client-side navigation begins. */
export function markNavigated() {
  navigated = true;
}

/** True once the visitor has moved between pages without a reload. */
export function hasNavigated() {
  return navigated;
}

/**
 * Whether an element that is mounting now may play an entrance.
 *
 * Yes after a client-side navigation, and yes under the preloader. No on a
 * hard load of any page the preloader does not cover: the server-rendered
 * page has already been painted by the time this runs, so hiding something
 * to play it in again is a flicker, not an entrance.
 */
export function mayPlayEntrance(): boolean {
  if (typeof window === "undefined") return false;
  return navigated || Boolean(document.querySelector("[data-preloader]"));
}

/**
 * Run an entrance once the preloader has lifted.
 *
 * On a hard load the preloader covers the page for its first couple of
 * seconds, and an entrance that starts on mount plays out underneath it —
 * the visitor arrives on a page that has already finished arriving. On a
 * client-side navigation there is no preloader and it runs on the next
 * frame. The preloader's own six-second safety net is matched here, so an
 * entrance can never be stranded waiting for an event that will not come.
 *
 * Returns a cleanup for the effect that called it.
 */
export function afterPreloader(run: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    run();
  };
  if (!document.querySelector("[data-preloader]")) {
    const raf = requestAnimationFrame(go);
    return () => {
      done = true;
      cancelAnimationFrame(raf);
    };
  }
  window.addEventListener("lb:loaded", go, { once: true });
  const safety = window.setTimeout(go, 6500);
  return () => {
    done = true;
    window.removeEventListener("lb:loaded", go);
    window.clearTimeout(safety);
  };
}

export { gsap, ScrollTrigger };
