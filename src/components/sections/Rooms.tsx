import { RailMeter } from "@/components/lb/RailMeter";
import { useEffect, useRef, useState } from "react";
import { Section } from "@/components/lb/Section";
import { Eyebrow } from "@/components/lb/Section";
import { GhostLink } from "@/components/lb/Buttons";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";
import { CmsImage } from "@/components/lb/CmsImage";
import { useRooms, useSection, useWords } from "@/cms/hooks";

export function Rooms() {
  const copy = useSection("home", "rooms");
  const w = useWords("home");
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
          <GhostLink label={w.roomsSeeAvailability} to="/rooms" className="text-mute" />
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
          {/* wrapped so the meter sits under the rail, not a grid gap away */}
          <div>
            <div className="rail-mobile">
              {rooms.map((r, i) => (
                <article
                  key={r.id}
                  data-room-item
                  className="border border-line p-5 md:border-x-0 md:border-b-0 md:px-0 md:py-7 md:first:border-t-0 md:first:pt-0"
                >
                  {/* ONE EYEBROW, NOT TWO THINGS AT OPPOSITE ENDS.
                   *
                   * The index and the kind are the same rank — both 11px
                   * labels qualifying the name below — so they belong to each
                   * other, and `ml-auto` was throwing the kind to the far edge
                   * of a 205px card. That left a hole across the middle of the
                   * first line and read as two unrelated fragments floating
                   * apart rather than as a label with two halves. Sitting
                   * together at a 12px gap they read as one line: "01 LIVE
                   * TRACKING", the number in acid and the kind in mute, which
                   * is hierarchy carried by colour rather than by distance.
                   *
                   * `md:ml-auto` puts it back at the far end from the tablet
                   * up, where the card is a full-width ruled row and the span
                   * is the point: there the gap is structure, not a hole.
                   *
                   * The name still takes its own line on a phone — "ROOM A" at
                   * 28px wants most of 205px — and rejoins the baseline row
                   * at `md` via the order swap. */}
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 md:gap-x-4">
                    <span className="order-1 font-ui text-[11px] font-bold uppercase tracking-[0.18em] tnum text-acid-type">
                      {r.index}
                    </span>
                    <span className="order-2 font-ui text-[11px] font-bold uppercase tracking-[0.14em] text-mute md:order-3 md:ml-auto">
                      {r.kind}
                    </span>
                    <h3 className="order-3 w-full font-display text-[28px] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-text md:order-2 md:w-auto md:text-[34px]">
                      {r.name}
                    </h3>
                  </div>

                  {/* 12px under the name, not 16. The blurb belongs to the
                   * heading above it, and an even gap on both sides of the
                   * name made the three parts read as a list of equals.
                   *
                   * `pretty` keeps the clamped second line from ending on a
                   * single orphaned word. */}
                  <p className="card-blurb mt-3 max-w-[46ch] font-ui text-[15px] leading-[1.5] text-mute [text-wrap:pretty]">
                    {r.blurb}
                  </p>

                  {/* NO SPECS HERE.
                   *
                   * This was a full label/value sheet, then two of them on one
                   * line, and it is now none. Each step was the same argument
                   * carried further: the whole sheet already exists on /rooms,
                   * which is where somebody comparing rooms is going anyway,
                   * and a card in a rail is a door — it has to say what the
                   * room IS and what it costs, not brief you on it.
                   *
                   * The two-spec version also could not survive the card it
                   * lived in. "480 SQ FT - API 1608 - 16CH" in 205px wrapped
                   * mid-list and left a separator dangling at the head of the
                   * second line, so the one row meant to read as a quiet
                   * caption was the most broken-looking thing on the card. */}

                  {/* THE ACTION ZONE IS DRAWN OFF, NOT JUST SPACED OFF.
                   *
                   * The price and the link used to follow the blurb on nothing
                   * but a margin, so the card was four things in a column with
                   * no statement about which belonged together. A hairline
                   * above them says the top of the card describes the room and
                   * the bottom of it transacts — the same rule the rest of the
                   * site uses to separate a section from its furniture.
                   *
                   * They are stacked because they could not share 205px: the
                   * price broke after the slash and the link broke before
                   * "room", stranding its arrow on a line of its own. The rule
                   * and the stacking both stop at `md`, where the card becomes
                   * a full-width ruled row that already has its own edges. */}
                  <div className="mt-5 flex flex-col items-start gap-3 border-t border-line pt-4 md:mt-4 md:flex-row md:items-center md:justify-between md:gap-4 md:border-t-0 md:pt-0">
                    <span className="font-ui text-[13px] font-bold uppercase tracking-[0.14em] tnum text-acid-type">
                      {r.rate}
                    </span>
                    <GhostLink label={w.roomsBook} to="/contact" className="text-text" />
                  </div>
                </article>
              ))}
            </div>
            <RailMeter />
          </div>
        </div>
      </div>
    </Section>
  );
}
