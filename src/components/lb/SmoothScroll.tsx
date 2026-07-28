import { useEffect } from "react";
import Lenis from "lenis";
import { ensureGsap, prefersReducedMotion, ScrollTrigger } from "@/lib/motion";
import { registerLenis } from "@/lib/smooth";

export function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const gsap = ensureGsap();
    if (!gsap) return;

    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, smoothWheel: true });
    registerLenis(lenis);
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      registerLenis(null);
      lenis.destroy();
    };
  }, []);

  return null;
}
