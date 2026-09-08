import { useEffect, useRef, useState } from "react";
import { Section } from "@/components/lb/Section";
import { Eyebrow } from "@/components/lb/Section";
import { GhostLink } from "@/components/lb/Buttons";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";
import { CmsImage } from "@/components/lb/CmsImage";
import { useRooms, useSection } from "@/cms/hooks";

export function Rooms() {
  const copy = useSection("home", "rooms");
  const rooms = useRooms();
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
    <Section id="rooms" tone="dark" surface="bg-surface" index="06" name="The Rooms">
      <div ref={root} className="py-[96px] md:py-[120px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow tone="dark" surface="bg-surface">
              {copy.eyebrow}
            </Eyebrow>
            <h2 className="t-h2 mt-6 max-w-[16ch] text-text">{copy.heading}</h2>
          </div>
          <GhostLink label="See availability" to="/rooms" className="text-mute" />
        </div>

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-12">
          {/* sticky visual */}
          <div className="hidden lg:block">
            <div className="sticky top-[14vh]">
              <div className="relative border border-line" style={{ aspectRatio: "4 / 5" }}>
                {rooms.map((r, i) => (
                  <CmsImage
                    key={r.id}
                    data-room-img={i}
                    src={r.image}
                    sizes="(max-width: 1023px) 100vw, 45vw"
                    alt={`${r.name} — ${r.kind} at Limon Bandit`}
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{
                      opacity: i === active ? 1 : 0,
                      zIndex: i === active ? 2 : 1,
                      filter: "brightness(var(--img-brightness)) contrast(1.08)",
                    }}
                  />
                ))}
                <span className="absolute left-0 top-0 z-[3] bg-acid px-3 py-1 font-ui text-[10px] font-bold uppercase tracking-[0.16em] text-accent-text">
                  Fig. {rooms[active].index} — {rooms[active].name}
                </span>
                <span className="absolute bottom-0 right-0 z-[3] bg-surface-deep px-3 py-1 font-ui text-[11px] font-bold uppercase tracking-[0.14em] tnum text-acid-type">
                  {rooms[active].rate}
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                {rooms.map((r, i) => (
                  <span
                    key={r.id}
                    className="h-px flex-1 transition-colors duration-500"
                    style={{ background: i === active ? "var(--accent)" : "var(--line)" }}
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
                className="border-t border-line py-10 first:border-t-0 first:pt-0"
              >
                <div className="flex items-baseline gap-4">
                  <span className="font-ui text-[11px] font-bold uppercase tracking-[0.18em] tnum text-acid-type">
                    {r.index}
                  </span>
                  <h3 className="font-display text-[28px] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-text md:text-[34px]">
                    {r.name}
                  </h3>
                  <span className="ml-auto font-ui text-[11px] font-bold uppercase tracking-[0.14em] text-mute">
                    {r.kind}
                  </span>
                </div>

                <CmsImage
                  src={r.image}
                  sizes="(max-width: 1023px) 100vw, 45vw"
                  alt={`${r.name} — ${r.kind} at Limon Bandit`}
                  className="mt-6 block h-[220px] w-full border border-line object-cover lg:hidden"
                  style={{
                    filter: "brightness(var(--img-brightness)) contrast(1.08)",
                  }}
                />

                <p className="mt-5 max-w-[46ch] font-ui text-[15px] leading-[1.5] text-mute">
                  {r.blurb}
                </p>

                {/* One column on a phone. Two columns of a label/value pair
                 * inside 390px leaves ~150px for the value, which broke
                 * "Four cue mixes" over three lines and "One + engineer"
                 * over two — a spec sheet that reads as damaged text. Full
                 * width gives every row its label left, value right, on one
                 * line, which is how the shop and contact rows already set. */}
                <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                  {r.specs.map((s) => (
                    <div key={s.k} className="flex items-baseline gap-2 border-b border-line pb-2">
                      <dt className="font-ui text-[10px] font-bold uppercase tracking-[0.16em] text-mute">
                        {s.k}
                      </dt>
                      <dd className="ml-auto font-ui text-[12px] font-semibold uppercase tracking-[0.08em] tnum text-text">
                        {s.v}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-6 flex items-center justify-between">
                  <span className="font-ui text-[13px] font-bold uppercase tracking-[0.14em] tnum text-acid-type">
                    {r.rate}
                  </span>
                  <GhostLink label="Book this room" to="/contact" className="text-text" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
