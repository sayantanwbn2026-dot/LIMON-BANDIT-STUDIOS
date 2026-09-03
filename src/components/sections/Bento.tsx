import { ArrowRight, ArrowUpRight, Pause, Play } from "lucide-react";
import { Section, Eyebrow } from "@/components/lb/Section";
import { WordReveal, RiseIn } from "@/components/lb/Reveal";
import { Picture } from "@/components/lb/Picture";
import { Waveform } from "@/components/lb/Waveform";
import { usePlayer } from "@/lib/player";
import { tracks } from "@/data/tracks";

/**
 * What's inside — the artefacts, not another list of the four operations.
 *
 * Services already names all four in prose and ThreeWaysIn is the door
 * picker, so this section earns its place only by showing real things: a
 * track you can actually play, the tee, a room. That is what survived.
 *
 * Dropped: the five raised tiles, the six-square crew icon grid (identical
 * placeholder glyphs carrying no information), the overlapping avatar stack,
 * the room chips, and the five-row track list under the player — the player
 * is the point, the list was a second navigation.
 *
 * Everything now sits on hairlines instead of inside boxes, which is how the
 * Rooms ledger and the Crew directory are already built.
 */
export function Bento() {
  const { track, playing, time, duration, play, toggle, seek } = usePlayer();
  const shown = track ?? tracks[0];
  const isLive = track?.id === shown.id;
  const progress = isLive && duration > 0 ? time / duration : 0;

  return (
    <Section surface="bg-surface" className="py-[120px]">
      <div className="section-head">
        <div className="md:col-span-1">
          <Eyebrow>What&apos;s inside</Eyebrow>
        </div>
        <div className="md:col-span-2">
          <WordReveal
            as="h2"
            className="t-h2 text-text"
            text={"A label, a shop,\nand a crew —\non one site."}
          />
        </div>
        <div className="flex items-end md:col-span-1">
          <a
            href="/label"
            className="group inline-flex items-center gap-2 font-ui text-[12px] font-bold uppercase tracking-[0.14em] text-text"
          >
            <span className="wipe-underline">See everything</span>
            <ArrowRight
              size={14}
              className="text-acid-type transition-transform duration-300 group-hover:translate-x-1"
            />
          </a>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 border-t border-line lg:grid-cols-12 lg:border-b">
        {/* the sound */}
        <RiseIn className="border-b border-line py-12 lg:col-span-6 lg:border-b-0 lg:pr-12">
          <span className="t-label text-mute">The sound</span>

          <div className="mt-8 flex items-center gap-5">
            <Picture
              src={shown.cover}
              sizes="72px"
              alt=""
              className="h-[72px] w-[72px] shrink-0 object-cover chroma"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-[20px] font-extrabold uppercase tracking-[-0.02em] text-text">
                {shown.title}
              </div>
              <div className="mt-1 truncate font-ui text-[13px] text-mute">{shown.artist}</div>
            </div>
            <button
              type="button"
              aria-label={playing && isLive ? `Pause ${shown.title}` : `Play ${shown.title}`}
              onClick={() => (isLive ? toggle() : play(shown.id))}
              className="flex h-12 w-12 shrink-0 items-center justify-center bg-acid transition-colors duration-300 hover:bg-acid-dim"
            >
              {playing && isLive ? (
                <Pause size={16} className="fill-accent-text text-accent-text" />
              ) : (
                <Play size={16} className="fill-accent-text text-accent-text" />
              )}
            </button>
          </div>

          <Waveform
            src={shown.src}
            progress={progress}
            height={72}
            onSeek={(f) => {
              if (!isLive) play(shown.id);
              if (duration > 0) seek(f * duration);
            }}
            className="mt-8 w-full"
          />
        </RiseIn>

        {/* the drop */}
        <RiseIn
          delay={0.08}
          className="border-b border-line py-12 lg:col-span-3 lg:border-b-0 lg:border-l lg:px-10"
        >
          <span className="t-label text-mute">The drop</span>
          <Picture
            src="merch-tee"
            sizes="(max-width: 1023px) 100vw, 24vw"
            alt="The house tee hanging against a concrete wall"
            className="mt-8 aspect-[4/5] w-full object-cover chroma"
          />
          <div className="mt-6 font-display text-[16px] font-bold uppercase text-text">
            House Tee — Black
          </div>
          <div className="tnum mt-2 font-ui text-[14px] text-mute">₹1,299</div>
          <a
            href="/shop"
            className="group mt-5 inline-flex items-center gap-2 font-ui text-[12px] font-bold uppercase tracking-[0.14em] text-text"
          >
            <span className="wipe-underline">Shop the drop</span>
            <ArrowUpRight size={14} className="text-acid-type" />
          </a>
        </RiseIn>

        {/* the room */}
        <RiseIn delay={0.16} className="py-12 lg:col-span-3 lg:border-l lg:border-line lg:pl-10">
          <span className="t-label text-mute">The room</span>
          <Picture
            src="room-a"
            sizes="(max-width: 1023px) 100vw, 24vw"
            alt="Room A set up for a live session"
            className="mt-8 aspect-[4/5] w-full object-cover chroma"
          />
          <div className="mt-6 font-display text-[16px] font-bold uppercase text-text">
            Four rooms
          </div>
          <div className="mt-2 font-ui text-[14px] text-mute">By the hour or the night</div>
          <a
            href="/rooms"
            className="group mt-5 inline-flex items-center gap-2 font-ui text-[12px] font-bold uppercase tracking-[0.14em] text-text"
          >
            <span className="wipe-underline">See the rooms</span>
            <ArrowUpRight size={14} className="text-acid-type" />
          </a>
        </RiseIn>
      </div>

      {/* the roster, stated rather than illustrated */}
      <RiseIn className="flex flex-wrap items-baseline justify-between gap-x-10 gap-y-6 border-t border-line pt-12">
        <p className="max-w-[18ch] font-display text-[30px] font-extrabold uppercase leading-[1.05] tracking-[-0.03em] text-text md:text-[40px]">
          Forty artists on the roster
        </p>
        <a
          href="/crew"
          className="group inline-flex items-center gap-2 font-ui text-[12px] font-bold uppercase tracking-[0.14em] text-text"
        >
          <span className="wipe-underline">Hire the crew by the project</span>
          <ArrowUpRight size={14} className="text-acid-type" />
        </a>
      </RiseIn>
    </Section>
  );
}
