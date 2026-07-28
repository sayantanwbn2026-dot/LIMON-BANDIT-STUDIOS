import { useEffect, useRef, useState } from "react";
import { Section } from "@/components/lb/Section";
import { Eyebrow } from "@/components/lb/Section";
import { GhostLink } from "@/components/lb/Buttons";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";
import { rooms } from "@/data/rooms";

export function Rooms() {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const gsap = ensureGsap();
    if (!gsap) return;

    const ctx = gsap.context(() => {
      const items = el.querySelectorAll<HTMLElement>("[data-room-item]");
      items.forEach((item, i) => {
        import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
          ScrollTrigger.create({
            trigger: item,
            start: "top 60%",
            end: "bottom 60%",
            onToggle: (self) => self.isActive && setActive(i),
          });
        });
      });
    }, el);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const gsap = ensureGsap();
    if (!gsap || prefersReducedMotion()) return;
    const el = root.current?.querySelector(`[data-room-img="${active}"]`);
    if (!el) return;
    gsap.fromTo(
      el,
      { clipPath: "inset(0 0 100% 0)" },
      { clipPath: "inset(0 0 0% 0)", duration: 0.75, ease: "power4.inOut" },
    );
  }, [active]);

  return (
    <Section id="rooms" tone="dark" surface="bg-ink" index="06" name="The Rooms">
      <div ref={root} className="py-[120px] md:py-[160px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow tone="dark" surface="bg-ink">
              Four rooms, one building
            </Eyebrow>
            <h2 className="t-h2 mt-6 max-w-[16ch] text-text-dark">The rooms, room by room</h2>
          </div>
          <GhostLink label="See availability" to="/rooms" className="text-mute-dark" />
        </div>

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          {/* sticky visual */}
          <div className="hidden lg:block">
            <div className="sticky top-[14vh]">
              <div className="relative border border-ink-line" style={{ aspectRatio: "4 / 5" }}>
                {rooms.map((r, i) => (
                  <img
                    key={r.id}
                    data-room-img={i}
                    src={r.image}
                    alt={`${r.name} — ${r.kind} at Limon Bandit`}
                    width={1024}
                    height={1280}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{
                      opacity: i === active ? 1 : 0,
                      zIndex: i === active ? 2 : 1,
                      filter: "grayscale(1) contrast(1.08)",
                    }}
                  />
                ))}
                <span className="absolute left-0 top-0 z-[3] bg-acid px-3 py-1 font-ui text-[10px] font-bold uppercase tracking-[0.16em] text-text-light">
                  Fig. {rooms[active].index} — {rooms[active].name}
                </span>
                <span className="absolute bottom-0 right-0 z-[3] bg-ink-deep px-3 py-1 font-ui text-[11px] font-bold uppercase tracking-[0.14em] tnum text-acid">
                  {rooms[active].rate}
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                {rooms.map((r, i) => (
                  <span
                    key={r.id}
                    className="h-px flex-1 transition-colors duration-500"
                    style={{ background: i === active ? "var(--acid)" : "var(--ink-line)" }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* list */}
          <div>
            {rooms.map((r, i) => (
              <article
                key={r.id}
                data-room-item
                className="border-t border-ink-line py-10 first:border-t-0 first:pt-0"
              >
                <div className="flex items-baseline gap-4">
                  <span className="font-ui text-[11px] font-bold uppercase tracking-[0.18em] tnum text-acid">
                    {r.index}
                  </span>
                  <h3 className="font-display text-[32px] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-text-dark md:text-[40px]">
                    {r.name}
                  </h3>
                  <span className="ml-auto font-ui text-[11px] font-bold uppercase tracking-[0.14em] text-mute-dark">
                    {r.kind}
                  </span>
                </div>

                <img
                  src={r.image}
                  alt={`${r.name} — ${r.kind} at Limon Bandit`}
                  width={1024}
                  height={1280}
                  loading="lazy"
                  className="mt-6 block h-[220px] w-full border border-ink-line object-cover lg:hidden"
                  style={{ filter: "grayscale(1) contrast(1.08)" }}
                />

                <p className="mt-5 max-w-[46ch] font-ui text-[15px] leading-[1.65] text-mute-dark">
                  {r.blurb}
                </p>

                <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3">
                  {r.specs.map((s) => (
                    <div key={s.k} className="flex items-baseline gap-2 border-b border-ink-line pb-2">
                      <dt className="font-ui text-[10px] font-bold uppercase tracking-[0.16em] text-mute-dark">
                        {s.k}
                      </dt>
                      <dd className="ml-auto font-ui text-[12px] font-semibold uppercase tracking-[0.08em] tnum text-text-dark">
                        {s.v}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-6 flex items-center justify-between">
                  <span className="font-ui text-[13px] font-bold uppercase tracking-[0.14em] tnum text-acid">
                    {r.rate}
                  </span>
                  <GhostLink label="Book this room" to="/contact" className="text-text-dark" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
