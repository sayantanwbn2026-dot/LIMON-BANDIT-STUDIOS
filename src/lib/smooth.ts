import type Lenis from "lenis";

let instance: Lenis | null = null;
let locks = 0;

export function registerLenis(l: Lenis | null) {
  instance = l;
}

export function getLenis() {
  return instance;
}

/**
 * Reference-counted so overlapping owners can't unlock each other — the
 * preloader and the menu both lock, and whichever releases first must not
 * hand scrolling back while the other is still open.
 *
 * `overflow: hidden` is the fallback for reduced-motion and SSR-less
 * sessions where Lenis never mounts.
 */
export function lockScroll() {
  locks += 1;
  if (locks > 1) return;
  instance?.stop();
  document.body.style.overflow = "hidden";
}

export function unlockScroll() {
  if (locks === 0) return;
  locks -= 1;
  if (locks > 0) return;
  instance?.start();
  document.body.style.overflow = "";
}
