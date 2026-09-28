import { useEffect, useRef, useState } from "react";
import { Check, Link2, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { CmsImage } from "@/components/lb/CmsImage";
import { Waveform } from "@/components/lb/Waveform";
import { Spectrum } from "@/components/lb/Spectrum";
import { RoomDial } from "./RoomDial";
import { BoundaryRule, GridRules } from "@/components/lb/GridRules";
import { Eyebrow } from "@/components/lb/Section";
import { clock, usePlayer } from "@/lib/player";
import { useSection, useTracks } from "@/cms/hooks";

/**
 * The player. Not a decoration — it decodes the actual audio to draw its
 * waveform, and it keeps playing when you leave this page.
 */
export function LabelPlayer() {
  const copy = useSection("label", "player");
  const tracks = useTracks();
  const { track, playing, time, duration, failed, play, toggle, seek, step, next, prev, cue } =
    usePlayer();
  const [cued, setCued] = useState<number | null>(null);
  const armed = useRef(false);

  /* A shared moment: ?t=<track>&at=<seconds>.
   *
   * Read straight off the URL rather than through the route's search
   * schema — this is one optional pair on one page, and giving the whole
   * route a validated search shape for it would make every link to /label
   * care about it. Runs once; re-reading on every render would fight the
   * listener the moment they scrubbed away from the cued point. */
  useEffect(() => {
    if (armed.current) return;
    armed.current = true;
    const q = new URLSearchParams(window.location.search);
    const id = q.get("t");
    const at = Number(q.get("at"));
    if (!id || !tracks.some((t) => t.id === id)) return;
    const seconds = Number.isFinite(at) && at > 0 ? at : 0;
    cue(id, seconds);
    setCued(seconds);
  }, [cue, tracks]);

  /* Before anything is chosen, show the first track's artwork and waveform so
   * the section is not an empty box waiting to be clicked. */
  const shown = track ?? tracks[0];
  const isLive = track?.id === shown.id;
  const progress = isLive && duration > 0 ? time / duration : 0;

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case " ":
        e.preventDefault();
        if (track) toggle();
        else play(shown.id);
        break;
      case "ArrowRight":
        e.preventDefault();
        step(5);
        break;
      case "ArrowLeft":
        e.preventDefault();
        step(-5);
        break;
      case "Home":
        e.preventDefault();
        seek(0);
        break;
      case "End":
        e.preventDefault();
        seek(duration);
        break;
    }
  };

  return (
    <section className="relative w-full bg-surface py-[96px]">
      <GridRules tone="dark" />
      <BoundaryRule tone="dark" className="top-0" />

      <div className="shell relative z-[2]">
        <Eyebrow tone="dark" surface="bg-surface">
          {copy.eyebrow}
        </Eyebrow>
        <h2 className="t-h2 mt-6 max-w-[20ch] text-text">{copy.heading}</h2>

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[280px_1fr] lg:gap-12">
          <div>
            <CmsImage
              src={shown.cover}
              alt={`Cover art for ${shown.title} by ${shown.artist}`}
              sizes="(max-width: 1023px) 100vw, 280px"
              className="chroma aspect-square w-full border border-line object-cover"
            />
            {/* The FFT of what is actually coming out, drawn the way the
             * wall of a control room draws it. Falls to the floor when
             * nothing is playing, because there is nothing to draw. */}
            <Spectrum active={playing && isLive} className="mt-3 block h-[56px] w-full" />
          </div>

          <div
            role="group"
            aria-label={`Player — ${shown.title} by ${shown.artist}`}
            tabIndex={0}
            onKeyDown={onKeyDown}
            className="flex flex-col justify-between outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acid"
          >
            <div>
              <span className="t-label text-mute">{shown.genre}</span>
              <h3 className="mt-3 font-display text-[28px] font-extrabold uppercase leading-[1] tracking-[-0.02em] text-text md:text-[42px]">
                {shown.title}
              </h3>
              <p className="mt-2 font-ui text-[15px] text-mute">
                {shown.artist} · <span className="tnum">{shown.year}</span>
              </p>
            </div>

            {cued !== null && !playing ? (
              <p
                role="status"
                className="mt-6 flex flex-wrap items-center gap-3 border border-acid-type px-4 py-3 font-ui text-[13px] text-text"
              >
                Someone sent you this at <span className="tnum">{clock(cued)}</span>.
                <button
                  type="button"
                  onClick={() => {
                    play(shown.id);
                    seek(cued);
                    setCued(null);
                  }}
                  className="inline-flex h-11 items-center bg-acid px-4 font-ui text-[12px] font-bold uppercase tracking-[0.1em] text-accent-text"
                >
                  Play from {clock(cued)}
                </button>
              </p>
            ) : null}

            <div className="mt-10">
              <Waveform
                src={shown.src}
                progress={progress}
                onSeek={(f) => {
                  if (!isLive) play(shown.id);
                  if (duration > 0) seek(f * duration);
                }}
                className="w-full"
              />

              <div className="mt-6 flex items-center gap-4">
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Previous track"
                  className="flex h-12 w-12 items-center justify-center border border-line text-text transition-colors duration-300 hover:border-acid-type"
                >
                  <SkipBack size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => (isLive ? toggle() : play(shown.id))}
                  aria-label={playing && isLive ? `Pause ${shown.title}` : `Play ${shown.title}`}
                  className="flex h-12 w-[120px] items-center justify-center gap-3 bg-acid transition-colors duration-300 hover:bg-acid-dim"
                >
                  {playing && isLive ? (
                    <Pause size={16} className="fill-accent-text text-accent-text" />
                  ) : (
                    <Play size={16} className="fill-accent-text text-accent-text" />
                  )}
                  <span className="font-ui text-[12px] font-bold uppercase tracking-[0.14em] text-accent-text">
                    {playing && isLive ? "Pause" : "Play"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={next}
                  aria-label="Next track"
                  className="flex h-12 w-12 items-center justify-center border border-line text-text transition-colors duration-300 hover:border-acid-type"
                >
                  <SkipForward size={16} />
                </button>

                <span className="tnum ml-auto font-ui text-[13px] text-mute">
                  {clock(isLive ? time : 0)} / {clock(isLive ? duration : 0)}
                </span>
              </div>

              <p className="t-label mt-4 text-mute">
                {failed ? "Preview unavailable" : "Space plays · ← → scrub 5s · Home and End jump"}
              </p>

              <RoomDial onWake={() => play(shown.id)} />

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                <ShareAt id={shown.id} at={isLive ? time : 0} />
                <span className="font-ui text-[12px] text-mute">
                  Links carry the moment — whoever opens it lands on this bar.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* the rest of the previewable roster */}
        <ul className="mt-12 border-t border-line">
          {tracks.map((t, i) => {
            const on = track?.id === t.id;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => play(t.id)}
                  aria-current={on ? "true" : undefined}
                  className="group flex w-full items-center gap-6 border-b border-line py-5 text-left transition-colors duration-300 hover:bg-surface-raised"
                >
                  <span
                    className={`tnum font-ui text-[11px] font-bold uppercase tracking-[0.18em] ${on ? "text-acid-type" : "text-mute"}`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-line text-text transition-colors duration-300 group-hover:border-acid-type">
                    {on && playing ? <Pause size={12} /> : <Play size={12} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate font-display text-[16px] font-bold uppercase tracking-[-0.01em] ${on ? "text-acid-type" : "text-text"}`}
                    >
                      {t.title}
                    </span>
                    <span className="block truncate font-ui text-[12px] text-mute">{t.artist}</span>
                  </span>
                  <span className="t-label hidden shrink-0 text-mute sm:block">{t.genre}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/**
 * A link to a moment, not to a page.
 *
 * Sending someone "listen to the bit at 1:12" and making them find 1:12 is
 * the small rudeness every music page commits. This copies a link that
 * opens on the track, cued to the second you were on — the label route
 * reads it back and arms the transport there.
 *
 * It does not autoplay at the other end. Sound that starts by itself is
 * the reason people keep their browsers muted, and the player's rule —
 * playback only ever begins from a gesture — is worth more than the
 * flourish of having it already running.
 */
function ShareAt({ id, at }: { id: string; at: number }) {
  const [done, setDone] = useState(false);

  const copy = async () => {
    const url = new URL(window.location.href);
    url.hash = "";
    url.searchParams.set("t", id);
    url.searchParams.set("at", String(Math.floor(at)));
    try {
      await navigator.clipboard.writeText(url.toString());
      setDone(true);
      window.setTimeout(() => setDone(false), 2200);
    } catch {
      /* Clipboard refused — the button simply does not claim success. */
    }
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="inline-flex h-11 items-center gap-2 border border-line px-4 font-ui text-[12px] font-bold uppercase tracking-[0.1em] text-text transition-colors duration-300 hover:border-acid-type"
    >
      {done ? <Check size={14} className="text-acid-type" /> : <Link2 size={14} />}
      {done ? "Link copied" : `Copy link at ${clock(at)}`}
    </button>
  );
}
