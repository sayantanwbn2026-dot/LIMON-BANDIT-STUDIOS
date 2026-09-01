import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Picture } from "@/components/lb/Picture";
import { BoundaryRule, GridRules } from "@/components/lb/GridRules";
import { Eyebrow } from "@/components/lb/Section";
import { ensureGsap, prefersReducedMotion, ScrollTrigger } from "@/lib/motion";
import { getLenis } from "@/lib/smooth";
import { rooms, type Room } from "@/data/rooms";

/**
 * The plan of the building, drawn rather than photographed.
 *
 * Stroke-only, 1px, square — the same drafting language as the column rules.
 * The only fill in it is acid, and only on the room you are currently reading.
 *
 * The SVG is decorative (`aria-hidden`): it is a picture of the building, and
 * a screen reader gains nothing from four unlabelled rectangles. The real
 * control is the list beneath it, which is also what mobile gets.
 */
function FloorPlan({ active, onSelect }: { active: number; onSelect: (i: number) => void }) {
  const lockoutActive = rooms[active]?.plan === null;

  return (
    <div>
      <svg
        viewBox="0 0 400 300"
        aria-hidden="true"
        className="block w-full"
        style={{ overflow: "visible" }}
      >
        {/* the building. The Lockout is the whole of it, so when that chapter
            is active the outline itself goes acid. */}
        <rect
          x="8"
          y="8"
          width="384"
          height="284"
          fill="none"
          stroke={lockoutActive ? "var(--accent)" : "var(--line-strong)"}
          strokeWidth="1"
          style={{ transition: "stroke 0.4s var(--ease-out-expo)" }}
        />

        {rooms.map((r, i) => {
          if (!r.plan) return null;
          const on = i === active;
          const { x, y, w, h } = r.plan;
          return (
            <g
              key={r.id}
              onClick={() => onSelect(i)}
              style={{ cursor: "pointer" }}
              className="lb-plan-region"
            >
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill={on ? "var(--accent)" : "transparent"}
                stroke={on ? "var(--accent)" : "var(--line-strong)"}
                strokeWidth="1"
                style={{ transition: "fill 0.4s var(--ease-out-expo), stroke 0.4s" }}
              />
              <text
                x={x + 10}
                y={y + 20}
                className="font-ui"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  fill: on ? "var(--accent-text)" : "var(--mute)",
                  transition: "fill 0.4s var(--ease-out-expo)",
                }}
              >
                {r.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* The accessible control, and the whole mechanic below 1024px. */}
      <ul className="mt-8 border-t border-line">
        {rooms.map((r, i) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => onSelect(i)}
              aria-current={i === active ? "true" : undefined}
              className="group flex w-full items-baseline gap-4 border-b border-line py-4 text-left transition-colors duration-300 hover:bg-surface-raised"
            >
              <span
                className={`tnum font-ui text-[11px] font-bold uppercase tracking-[0.18em] ${
                  i === active ? "text-acid-type" : "text-mute"
                }`}
              >
                {r.index}
              </span>
              <span
                className={`font-ui text-[13px] font-bold uppercase tracking-[0.1em] transition-transform duration-300 group-hover:translate-x-1 ${
                  i === active ? "text-text" : "text-mute"
                }`}
              >
                {r.name}
              </span>
              <span className="tnum ml-auto font-ui text-[12px] text-mute">{r.rate}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One room, at length. Alternating shape so no two read the same. */
function RoomChapter({ room: r, reverse }: { room: Room; reverse: boolean }) {
  return (
    <article
      id={`room-${r.id}`}
      data-room-chapter
      className="scroll-mt-[120px] border-t border-line py-[96px] first:border-t-0"
    >
      <div className="flex items-baseline gap-4">
        <span className="tnum font-ui text-[11px] font-bold uppercase tracking-[0.18em] text-acid-type">
          {r.index}
        </span>
        <h3 className="font-display text-[32px] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-text md:text-[44px]">
          {r.name}
        </h3>
        <span className="t-label ml-auto text-mute">{r.kind}</span>
      </div>

      <div className={`mt-10 flex flex-col gap-10 ${reverse ? "lg:flex-col-reverse" : ""}`}>
        <Picture
          src={r.image}
          alt={`${r.name} — ${r.kind} at Limon Bandit`}
          sizes="(max-width: 1023px) 100vw, 60vw"
          className="w-full border border-line object-cover"
          style={{
            aspectRatio: reverse ? "16 / 9" : "4 / 3",
            filter: "brightness(var(--img-brightness)) contrast(1.08)",
          }}
        />

        <div>
          <p className="max-w-[52ch] font-ui text-[16px] leading-[1.5] text-mute">{r.blurb}</p>

          <dl className="mt-8 grid grid-cols-1 gap-x-10 gap-y-3 sm:grid-cols-2">
            {r.specs.map((s) => (
              <div key={s.k} className="flex items-baseline gap-4 border-b border-line pb-3">
                <dt className="font-ui text-[10px] font-bold uppercase tracking-[0.16em] text-mute">
                  {s.k}
                </dt>
                <dd className="tnum ml-auto font-ui text-[13px] font-semibold uppercase tracking-[0.06em] text-text">
                  {s.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* three detail crops */}
      <div className="mt-10 grid grid-cols-3 gap-4">
        {r.crops.map((c, i) => (
          <Picture
            key={`${c}-${i}`}
            src={c}
            alt=""
            sizes="(max-width: 1023px) 33vw, 20vw"
            className="aspect-square w-full border border-line object-cover chroma"
          />
        ))}
      </div>

      {/* rate card */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-6 border border-line bg-surface-raised p-8">
        <div>
          <span className="t-label text-mute">From</span>
          <div className="tnum mt-2 font-display text-[28px] font-extrabold uppercase tracking-[-0.02em] text-acid-type">
            {r.rate}
          </div>
          <p className="t-label mt-2 text-mute">Engineer included</p>
        </div>
        <a
          href={`/contact?intent=booking&room=${r.id}`}
          className="group flex h-[60px] items-center justify-between gap-6 bg-acid px-8 transition-colors duration-300 hover:bg-acid-dim"
        >
          <span className="font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-accent-text">
            Book {r.name}
          </span>
          <ArrowRight
            size={16}
            className="text-accent-text transition-transform duration-300 group-hover:translate-x-1"
          />
        </a>
      </div>
    </article>
  );
}

/**
 * Plan rail plus the four chapters. The plan stays put while the chapters
 * scroll past it, and lights whichever room you are reading.
 */
export function RoomsFloor() {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  /* One trigger per chapter, no scrub — the plan switches, it does not tween. */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const gsap = ensureGsap();
    if (!gsap) return;

    const mm = gsap.matchMedia(el);
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      const items = gsap.utils.toArray<HTMLElement>("[data-room-chapter]", el);
      const triggers = items.map((item, i) =>
        ScrollTrigger.create({
          trigger: item,
          start: "top 55%",
          end: "bottom 55%",
          onToggle: (self) => self.isActive && setActive(i),
        }),
      );
      return () => triggers.forEach((t) => t.kill());
    });

    return () => mm.revert();
  }, []);

  const go = (i: number) => {
    setActive(i);
    const target = document.getElementById(`room-${rooms[i].id}`);
    if (!target) return;
    const lenis = getLenis();
    if (lenis && !prefersReducedMotion()) lenis.scrollTo(target, { offset: -120 });
    else target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  return (
    <section className="relative w-full bg-surface-deep py-[120px]">
      <GridRules tone="dark" />
      <BoundaryRule tone="dark" className="top-0" />

      <div className="shell relative z-[2]">
        <Eyebrow tone="dark" surface="bg-surface-deep">
          The floor
        </Eyebrow>
        <h2 className="t-h2 mt-6 max-w-[20ch] text-text">Room by room</h2>

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-[300px_1fr] lg:gap-16">
          <div>
            <div className="lg:sticky lg:top-[14vh]">
              <FloorPlan active={active} onSelect={go} />
            </div>
          </div>

          <div ref={root}>
            {rooms.map((r, i) => (
              <RoomChapter key={r.id} room={r} reverse={i % 2 === 1} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
