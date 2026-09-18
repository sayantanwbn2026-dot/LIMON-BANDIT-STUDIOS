import { HeroFrame } from "@/components/lb/PageHero";
import { PosterLockup } from "@/components/lb/PosterLockup";
import { RiseIn } from "@/components/lb/Reveal";
import { chapter } from "@/data/routes";
import { useRooms } from "@/cms/hooks";

/**
 * ROOMS — the ledger, under the house lockup.
 *
 * The heading is the landing page's poster set to this page's phrase, so
 * arriving here reads as the same building rather than a different site;
 * what makes it Rooms is everything under it. This page exists to make one
 * decision, so that is the rate card rather than a picture of a room: four
 * ruled lines, index in acid, rate in tabular figures on the right so the
 * column of prices reads as a column. Photography is downstream.
 */
export function RoomsHero() {
  const rooms = useRooms();
  const c = chapter("rooms");

  return (
    <HeroFrame chapter="rooms">
      <PosterLockup
        className="mt-10"
        spread={c.poster.spread}
        word={c.poster.word}
        srText={c.heading}
      />

      <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-0">
        <div className="lg:pr-16">
          <p className="t-lead max-w-[46ch] text-mute">{c.standfirst}</p>
        </div>

        {/* The ledger sits in the right half, so its left edge is the 50%
         * column rule — inset by the gutter, not by an arbitrary pad, so it
         * lands where every other block on the site lands. */}
        <RiseIn className="lg:pl-4" delay={0.1}>
          <div
            className="t-label flex items-baseline justify-between pb-4 text-mute"
            aria-hidden="true"
          >
            <span>Room</span>
            <span>From</span>
          </div>
          <ul className="border-t border-line">
            {rooms.map((r) => (
              <li
                key={r.id}
                className="flex items-baseline gap-5 border-b border-line py-5 md:gap-6"
              >
                <span className="tnum font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-acid-type">
                  {r.index}
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-[16px] font-bold leading-none tracking-[-0.02em] text-text">
                    {r.name}
                  </span>
                  <span className="t-label mt-2 block text-mute">{r.capacity}</span>
                </span>
                <span className="tnum ml-auto shrink-0 font-ui text-[14px] font-semibold text-text">
                  {r.rate}
                </span>
              </li>
            ))}
          </ul>
          <p className="t-label mt-5 text-mute">Engineer included on every rate</p>
        </RiseIn>
      </div>
    </HeroFrame>
  );
}
