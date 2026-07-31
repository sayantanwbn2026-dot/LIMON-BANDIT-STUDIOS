import { useEffect, useRef } from "react";
import { ArrowRight, Pause, Play } from "lucide-react";
import { Section, Eyebrow } from "@/components/lb/Section";
import { RiseIn, WordReveal } from "@/components/lb/Reveal";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";
import { Picture } from "@/components/lb/Picture";
import { Waveform } from "@/components/lb/Waveform";
import { clock, usePlayer } from "@/lib/player";
import { tracks } from "@/data/tracks";

const crew = ["Video", "Cover art", "Photo", "Mixing", "Mastering", "Press"];
const avatars = [
  "release-01",
  "release-02",
  "release-03",
  "release-04",
  "release-05",
  "release-06",
] as const;

export function Bento() {
  const ref = useRef<HTMLDivElement>(null);
  /* The same player the /label page drives — this tile used to fake it with
   * 48 hard-coded bar heights and a boolean. */
  const { track, playing, time, duration, play, toggle, seek } = usePlayer();
  const shown = track ?? tracks[0];
  const isLive = track?.id === shown.id;
  const progress = isLive && duration > 0 ? time / duration : 0;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const gsap = ensureGsap();
    if (!gsap || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll("[data-tile]"),
        { scale: 0.96, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.7,
          stagger: 0.08,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        },
      );
      /* the [data-bar] loop that used to live here animated the faked
         waveform; the real one is drawn from the audio and needs no help */
      gsap.fromTo(
        el.querySelector("[data-connector]"),
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 2,
          ease: "power4.inOut",
          scrollTrigger: { trigger: el, start: "top 70%", once: true },
        },
      );
    }, el);
    return () => ctx.revert();
  }, []);

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
        <div className="flex flex-col justify-end gap-6 md:col-span-1">
          <p className="font-ui text-[16px] leading-[1.5] text-mute">
            Everything the roster needs sits behind one login. Nothing is farmed out.
          </p>
          <a
            href="/label"
            className="group flex w-fit items-center gap-3 border border-line px-6 py-4 transition-colors duration-300 hover:border-acid-type"
          >
            <span className="t-eyebrow text-text">See everything</span>
            <ArrowRight
              size={15}
              className="text-acid-type transition-transform duration-300 group-hover:translate-x-1"
            />
          </a>
        </div>
      </div>

      <div
        ref={ref}
        className="mt-20 grid grid-cols-1 gap-px bg-line md:grid-cols-2 lg:grid-cols-4"
      >
        {/* 1 — player */}
        <div data-tile className="bg-surface-raised p-8 lg:col-span-2">
          <div className="flex items-center gap-4">
            <Picture
              src={shown.cover}
              sizes="(max-width: 767px) 100vw, 50vw"
              alt=""
              className="h-16 w-16 object-cover mono"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-[16px] font-bold uppercase text-text">
                {shown.title}
              </div>
              <div className="mt-1 truncate font-ui text-[12px] text-mute">{shown.artist}</div>
            </div>
            <button
              type="button"
              aria-label={playing && isLive ? `Pause ${shown.title}` : `Play ${shown.title}`}
              onClick={() => (isLive ? toggle() : play(shown.id))}
              className="flex h-11 w-11 items-center justify-center bg-acid transition-colors duration-300 hover:bg-acid-dim"
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
            height={64}
            onSeek={(f) => {
              if (!isLive) play(shown.id);
              if (duration > 0) seek(f * duration);
            }}
            className="mt-8 w-full"
          />

          <ul className="mt-8">
            {tracks.map((t) => {
              const on = track?.id === t.id;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => play(t.id)}
                    className="flex w-full items-center justify-between border-t border-line py-3 text-left font-ui text-[14px] transition-colors duration-300 hover:text-text"
                  >
                    <span className={on ? "text-acid-type" : "text-mute"}>{t.title}</span>
                    <span className="tnum text-mute">{on ? clock(duration) : t.genre}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* 2 — merch */}
        <div data-tile className="relative flex flex-col bg-surface-raised lg:row-span-2">
          <span className="t-label absolute left-6 top-6 z-[2] bg-acid px-3 py-1 text-accent-text">
            Sold direct
          </span>
          <Picture
            src={"merch-tee"}
            sizes="(max-width: 767px) 100vw, 50vw"
            alt="The house tee hanging against a concrete wall"
            className="h-full min-h-[320px] w-full flex-1 object-cover mono"
          />
          <div className="p-8">
            <div className="font-display text-[16px] font-bold uppercase text-text">
              House Tee — Black
            </div>
            <div className="tnum mt-2 font-ui text-[14px] text-mute">₹1,299</div>
            <a
              href="/shop"
              className="mt-6 flex items-center gap-2 font-ui text-[12px] font-bold uppercase tracking-[0.12em] text-text"
            >
              Shop the drop <ArrowRight size={14} className="text-acid-type" />
            </a>
          </div>
        </div>

        {/* 3 — rooms */}
        <div data-tile className="relative min-h-[280px] overflow-hidden bg-surface-raised">
          <Picture
            src={"room-a"}
            sizes="(max-width: 767px) 100vw, 50vw"
            alt="Room A set up for a live session"
            className="absolute inset-0 h-full w-full object-cover opacity-45 mono"
          />
          <div className="relative flex h-full flex-col justify-between p-8">
            <div className="flex flex-wrap gap-2">
              {["Room A", "Room B", "Lockout"].map((c) => (
                <span
                  key={c}
                  className="t-label rounded-[2px] border border-line bg-surface-deep px-3 py-2 text-text"
                >
                  {c}
                </span>
              ))}
            </div>
            <p className="font-ui text-[14px] text-mute">
              4 rooms, booked by the hour or the night.
            </p>
          </div>
        </div>

        {/* 4 — roster */}
        <div
          data-tile
          className="flex min-h-[280px] flex-col justify-between bg-surface-raised p-8"
        >
          <div className="flex">
            {avatars.map((a, i) => (
              <Picture
                key={i}
                src={a}
                sizes="(max-width: 767px) 100vw, 50vw"
                alt=""
                className="h-10 w-10 border border-surface-raised object-cover mono"
                style={{ marginLeft: i === 0 ? 0 : -10 }}
              />
            ))}
            <span
              className="flex h-10 w-10 items-center justify-center border border-surface-raised bg-acid font-ui text-[10px] font-bold uppercase text-accent-text"
              style={{ marginLeft: -10 }}
            >
              +You
            </span>
          </div>
          <div className="font-display text-[28px] font-extrabold uppercase leading-[1] tracking-[-0.03em] text-text">
            40+ artists on the roster
          </div>
        </div>

        {/* 5 — crew */}
        <div data-tile className="bg-surface-raised p-8 lg:col-span-3">
          <div className="grid grid-cols-3 gap-6 sm:grid-cols-6">
            {crew.map((c) => (
              <div key={c} className="flex flex-col items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center border border-line">
                  <span className="h-[10px] w-[10px] bg-mute" />
                </span>
                <span className="t-label text-center text-mute">{c}</span>
              </div>
            ))}
          </div>
          <div data-connector aria-hidden="true" className="mt-8 h-px w-full origin-left bg-acid" />
          <RiseIn className="mt-8">
            <p className="t-h3 text-text">Hire the crew by the project.</p>
          </RiseIn>
        </div>
      </div>
    </Section>
  );
}
