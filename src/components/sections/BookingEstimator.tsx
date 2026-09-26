import { useMemo, useState } from "react";
import { ArrowRight, Minus, Plus } from "lucide-react";
import { Section, Eyebrow } from "@/components/lb/Section";
import { WordReveal } from "@/components/lb/Reveal";
import { CmsImage } from "@/components/lb/CmsImage";
import { useRooms, useSection } from "@/cms/hooks";
import { inr } from "@/lib/money";
import { parseRate } from "@/lib/rates";

/**
 * "What would a session actually cost?"
 *
 * The home page used to answer that with a table of three plans and a
 * paragraph each — 2,000px of reading to work out a number you then had to
 * do arithmetic on. This asks the two questions that decide the figure (which
 * room, how long) and shows the total as you change them.
 *
 * The rates are the CMS's own, parsed out of the rate line each room already
 * carries ("₹2,400 / hr", "₹14,000 / night"), so there is no second copy of
 * the price to drift from the Rooms page. A line it cannot parse simply does
 * not offer a total — better than inventing one.
 *
 * It is an estimate and says so. The booking is still a conversation: the
 * button carries the room and the hours into the contact form so nobody
 * retypes what they just chose.
 */

/* Two hours is the house minimum on the hourly rooms; a lockout is sold by
 * the night and nobody books half of one. */
const MIN = { hour: 2, night: 1 } as const;
const MAX = { hour: 12, night: 7 } as const;

export function BookingEstimator() {
  const copy = useSection("home", "rates");
  const rooms = useRooms();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [count, setCount] = useState(3);

  const room = useMemo(() => rooms.find((r) => r.id === roomId) ?? rooms[0], [rooms, roomId]);
  const rate = parseRate(room?.rate);
  const unit = rate?.unit ?? "hour";
  const min = MIN[unit];
  const max = MAX[unit];
  const n = Math.min(Math.max(count, min), max);
  const total = rate ? rate.amount * n : null;

  if (!room) return null;

  return (
    <Section tone="dark" surface="bg-surface" className="py-[96px]">
      <div className="section-head">
        <div className="md:col-span-1">
          <Eyebrow>{copy.eyebrow}</Eyebrow>
        </div>
        <div className="md:col-span-2">
          <WordReveal as="h2" className="t-h2 text-text" text={copy.heading} />
        </div>
        <div className="flex items-end md:col-span-1">
          <p className="font-ui text-[15px] leading-[1.5] text-mute">
            Pick a room and a length. The number moves with you.
          </p>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-px border border-line bg-line lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* ---- the two questions ---- */}
        <div className="bg-surface p-6 sm:p-8">
          <fieldset>
            <legend className="t-label text-mute">Which room</legend>
            <ul className="mt-4 grid grid-cols-2 gap-2">
              {rooms.map((r) => {
                const on = r.id === room.id;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setRoomId(r.id);
                        const next = parseRate(r.rate)?.unit ?? "hour";
                        setCount(next === "night" ? 1 : 3);
                      }}
                      aria-pressed={on}
                      className={`flex h-full w-full flex-col gap-1 border p-3 text-left transition-colors duration-300 ${
                        on
                          ? "border-acid-type bg-surface-raised"
                          : "border-line hover:border-line-strong"
                      }`}
                    >
                      <span className="font-display text-[15px] font-extrabold uppercase tracking-[-0.01em] text-text">
                        {r.name}
                      </span>
                      <span className="font-ui text-[12px] text-mute">{r.capacity}</span>
                      <span className="tnum mt-1 font-ui text-[12px] text-acid-type">{r.rate}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </fieldset>

          <fieldset className="mt-8">
            <legend className="t-label text-mute">
              {unit === "night" ? "How many nights" : "How many hours"}
            </legend>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center border border-line">
                <button
                  type="button"
                  /* Functional updates: two quick taps must count twice.
                   * Reading `n` from this render meant both presses computed
                   * from the same number and one of them was lost. */
                  onClick={() => setCount((c) => Math.max(min, Math.min(max, c) - 1))}
                  disabled={n <= min}
                  aria-label="One fewer"
                  className="flex h-12 w-12 items-center justify-center text-text disabled:opacity-30"
                >
                  <Minus size={16} />
                </button>
                <span className="tnum w-12 text-center font-display text-[20px] font-extrabold text-text">
                  {n}
                </span>
                <button
                  type="button"
                  onClick={() => setCount((c) => Math.min(max, Math.max(min, c) + 1))}
                  disabled={n >= max}
                  aria-label="One more"
                  className="flex h-12 w-12 items-center justify-center text-text disabled:opacity-30"
                >
                  <Plus size={16} />
                </button>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                value={n}
                onChange={(e) => setCount(Number(e.target.value))}
                aria-label={unit === "night" ? "Nights" : "Hours"}
                className="h-11 min-w-0 flex-1 accent-[color:var(--accent)]"
              />
            </div>
            <p className="mt-3 font-ui text-[13px] text-mute">
              {unit === "night"
                ? "Sold by the night — in at 9, out when you are done."
                : `Minimum ${MIN.hour} hours. ${room.engineer ? "Engineer included." : ""}`}
            </p>
          </fieldset>
        </div>

        {/* ---- the number ---- */}
        <div className="flex flex-col justify-between gap-6 bg-surface-deep p-6 sm:p-8">
          <div>
            <CmsImage
              src={room.image}
              alt={room.name}
              sizes="(max-width: 1023px) 100vw, 380px"
              className="mono aspect-[16/10] w-full border border-line object-cover"
            />
            <p className="mt-4 font-ui text-[14px] leading-[1.5] text-mute">{room.bestFor}</p>
          </div>

          <div>
            <p className="t-label text-mute">Estimate</p>
            <p
              aria-live="polite"
              className="tnum mt-2 font-display text-[42px] font-extrabold leading-none tracking-[-0.03em] text-text"
            >
              {total === null ? "—" : inr(total)}
            </p>
            <p className="mt-2 font-ui text-[13px] text-mute">
              {total === null
                ? "Ask us for this room's rate."
                : `${room.name} · ${n} ${unit === "night" ? (n === 1 ? "night" : "nights") : "hours"}${
                    room.engineer ? " · engineer included" : ""
                  }`}
            </p>

            <a
              href={`/contact?intent=booking&room=${encodeURIComponent(room.id)}&hours=${n}`}
              className="group mt-6 flex h-[56px] w-full items-center justify-between gap-4 bg-acid px-6 transition-opacity duration-300 hover:opacity-90"
            >
              <span className="font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-accent-text">
                Ask for this slot
              </span>
              <ArrowRight size={16} className="text-accent-text lb-arrow" />
            </a>
            <p className="t-label mt-4 text-mute">
              An estimate, not an invoice — confirmed when we reply.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
