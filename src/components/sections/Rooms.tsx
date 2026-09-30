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

    /* Desktop only: `active` drives the sticky photograph, and that is
     * lg:block. Below lg the triggers were still being built, and on a
     * phone — where the list is now a sideways rail, every card at the
     * same height — they all toggled at once, re-rendering and replaying
     * a clip animation on an image nobody could see. */
    const mm = gsap.matchMedia(el);
    mm.add("(min-width: 1024px)", () => {
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
    });
    return () => mm.revert();
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
              <div className="ui-card relative overflow-hidden" style={{ aspectRatio: "4 / 5" }}>
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

          {/* list — a swipe rail on phones (see .rail-mobile). Four rooms of
           * image, blurb and spec sheet stacked to 2,906px, the tallest
           * section left on the page, and the full detail lives on /rooms. */}
          <div className="rail-mobile">
            {rooms.map((r, i) => (
              <article
                key={r.id}
                data-room-item
                className="border border-line p-5 md:border-x-0 md:border-b-0 md:px-0 md:py-7 md:first:border-t-0 md:first:pt-0"
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

                <p className="mt-4 max-w-[46ch] font-ui text-[15px] leading-[1.5] text-mute">
                  {r.blurb}
                </p>

                {/* TWO specs, not four, and on one line.
                 *
                 * This was a full label/value sheet per room — four rooms x
                 * four rows, stacked, and the tallest thing left on the home
                 * page. The whole sheet already exists on /rooms, which is
                 * where somebody comparing rooms is going anyway; here it
                 * only has to be enough to tell one room from the next. The
                 * first two specs are the ones that do that (capacity and
                 * what is in it), and they read as a caption rather than as
                 * a table. */}
                <p className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-ui text-[12px] font-semibold uppercase tracking-[0.08em] text-mute">
                  {r.specs.slice(0, 2).map((s, n) => (
                    <span key={s.k} className="tnum">
                      {n > 0 ? <span className="pr-3 text-line-strong">&middot;</span> : null}
                      {s.v}
                    </span>
                  ))}
                </p>

                <div className="mt-4 flex items-center justify-between">
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
