import { useEffect, useRef } from "react";
import { Section } from "@/components/lb/Section";
import { metrics } from "@/data/metrics";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";

export function Numbers() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const gsap = ensureGsap();
    if (!gsap || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>("[data-count]").forEach((node) => {
        const target = parseFloat(node.dataset.count ?? "0");
        const decimals = parseInt(node.dataset.decimals ?? "0", 10);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.6,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 80%", once: true },
          onUpdate: () => {
            node.textContent = obj.v.toFixed(decimals);
          },
        });
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <Section surface="bg-surface" className="py-[96px]">
      <h2 className="sr-only">The numbers</h2>
      <div ref={ref} className="grid grid-cols-2 gap-px bg-line md:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-surface px-0 py-2 md:px-8 md:first:pl-0">
            <div className="t-label text-mute">{m.label}</div>
            <div className="mt-5 flex items-baseline gap-1">
              <span
                data-count={m.value}
                data-decimals={m.decimals}
                className="tnum font-display font-extrabold tracking-[-0.04em] text-text"
                style={{ fontSize: "clamp(52px, 5vw, 76px)" }}
              >
                {m.value.toFixed(m.decimals)}
              </span>
              <span
                className="font-display font-extrabold text-acid-type"
                style={{ fontSize: "clamp(31px, 3vw, 46px)" }}
              >
                {m.unit}
              </span>
            </div>
            <p className="mt-4 max-w-[28ch] font-ui text-[14px] leading-[1.45] text-mute">
              {m.sentence}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
