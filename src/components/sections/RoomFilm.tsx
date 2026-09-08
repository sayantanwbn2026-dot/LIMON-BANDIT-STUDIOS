import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Pause, Play } from "lucide-react";
import { GridRules } from "@/components/lb/GridRules";
import { MarginNotes, Eyebrow } from "@/components/lb/Section";
import { images } from "@/generated/images";
import { ensureGsap, prefersReducedMotion, ScrollTrigger } from "@/lib/motion";
import { useSection } from "@/cms/hooks";

/**
 * A night in Room A — the film, opening to full screen as you scroll.
 *
 * The frame starts as a window in the page and is pulled open to the full
 * viewport by scroll position, then closes again on the way out. It plays
 * itself when it arrives and stops the moment it leaves, so nothing is
 * decoding video off-screen.
 *
 * HOW THE OPENING IS DONE
 * `clip-path: inset()` on a stage that is already full-viewport, rather
 * than animating width and height. Two reasons: clip-path composites and
 * never triggers layout, and — the one that actually decides it — a
 * <video> whose box is being resized re-fits `object-fit` every frame, so
 * the picture inside visibly breathes as the frame grows. Clipping leaves
 * the picture untouched and simply shows more of it.
 *
 * WHY IT IS NOT WRAPPED IN ScrollDepth
 * The stage is `position: sticky`, and a transformed ancestor re-bases
 * sticky against the transform instead of the viewport — see the note in
 * index.tsx alongside Hero, ThreeWaysIn, DropRail and Services.
 *
 * WHEN THERE IS NO FILM YET
 * There is no video in the repository, so `poster` carries the frame and
 * the <video> simply has nothing to play. That is deliberate rather than
 * broken: drop a file at VIDEO_SRC and it plays with no other change. The
 * scroll opening, the controls and the layout are identical either way, so
 * this can be shown to a client as-is.
 */

/* Drop a file here and it plays. Keep it muted-friendly: the film is
 * ambient, and autoplay with sound is blocked by every browser anyway. */
const VIDEO_SRC = "/video/room-a.mp4";
const POSTER = images["room-a"].avif.at(-1)?.url ?? images["room-a"].fallback;

/* The window it opens from. Percentages of the viewport, so the shape holds
 * from a phone to a 27in display. */
const CLOSED = "inset(21% 19% 21% 19%)";
const OPEN = "inset(0% 0% 0% 0%)";

export function RoomFilm() {
  const copy = useSection("home", "film");
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = root.current;
    const frame = stage.current;
    const v = video.current;
    if (!el || !frame) return;

    const gsap = ensureGsap();
    if (!gsap) return;

    const reduced = prefersReducedMotion();

    const ctx = gsap.context(() => {
      /* Reduced motion gets the frame open and still — the film is the
       * content, the opening is not. */
      if (reduced) {
        gsap.set(frame, { clipPath: OPEN });
      } else {
        gsap.fromTo(
          frame,
          { clipPath: CLOSED },
          {
            clipPath: OPEN,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top top",
              /* opens over the first half of the container and holds wide
               * for the rest, so it is full screen while you watch rather
               * than only at one exact scroll position */
              end: "50% top",
              scrub: 0.5,
              invalidateOnRefresh: true,
            },
          },
        );
      }

      /* Play only while it is on screen. A muted, looping video left
       * decoding above the fold is the kind of thing that quietly costs a
       * laptop its battery on a long page. */
      ScrollTrigger.create({
        trigger: el,
        start: "top 70%",
        end: "bottom 30%",
        onToggle: (self) => {
          if (!v) return;
          if (self.isActive && !reduced) {
            v.play()
              .then(() => setPlaying(true))
              /* Autoplay can still be refused; the poster stays up and the
               * play control is there, which is the correct outcome. */
              .catch(() => setPlaying(false));
          } else {
            v.pause();
            setPlaying(false);
          }
        },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) {
      v.play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <section className="relative w-full bg-surface-deep">
      <MarginNotes index="08" name="Room A Film" />

      {/* The header sits on the page, above the film — not on it.
       *
       * It is in normal flow, so it scrolls away before the stage pins and
       * the picture is never carrying type. That is the distinction: the
       * film plays clean, and the section still announces itself the way
       * every other section on this page does. */}
      <div className="shell relative z-[2] pb-14 pt-[96px]">
        <div className="section-head">
          <div className="md:col-span-1">
            <Eyebrow surface="bg-surface-deep">{copy.eyebrow}</Eyebrow>
          </div>
          <div className="md:col-span-2">
            <h2 className="t-h2 text-text">{copy.heading}</h2>
          </div>
          <div className="flex items-end md:col-span-1">
            <p className="font-ui text-[15px] leading-[1.5] text-mute">{copy.standfirst}</p>
          </div>
        </div>
      </div>

      <div
        ref={root}
        aria-label="A night in Room A"
        className="relative w-full"
        /* Two viewports: one to open in, one to watch through. */
        style={{ height: "200vh" }}
      >
        <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
          <GridRules tone="dark" />

          <div ref={stage} className="absolute inset-0" style={{ clipPath: CLOSED }}>
            <video
              ref={video}
              className="h-full w-full object-cover"
              poster={POSTER}
              muted={muted}
              loop
              playsInline
              preload="metadata"
              /* No `controls`: the page supplies its own, so the film keeps
               * the house's chrome instead of the browser's. */
            >
              <source src={VIDEO_SRC} type="video/mp4" />
            </video>

            {/* Nothing is laid over the picture — no scrim, no CRT ruling, no
             * slate, no title. The film is the content and it plays clean.
             *
             * The section keeps its aria-label, so it is still announced as
             * "A night in Room A" even though nothing says so on screen; the
             * name was never carrying information the picture did not. */}

            {/* Controls only. An autoplaying film has to be stoppable, so
             * these stay — icon buttons with labels for assistive tech, no
             * visible type on the picture. */}
            <div className="absolute inset-x-0 bottom-0 flex justify-end p-6 md:p-8">
              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={toggle}
                  aria-label={playing ? "Pause the film" : "Play the film"}
                  className="flex h-12 w-12 items-center justify-center border border-line bg-surface-deep/70 text-text transition-colors duration-300 hover:border-acid-type"
                >
                  {playing ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => setMuted((m) => !m)}
                  aria-label={muted ? "Unmute the film" : "Mute the film"}
                  aria-pressed={!muted}
                  className="flex h-12 w-12 items-center justify-center border border-line bg-surface-deep/70 text-text transition-colors duration-300 hover:border-acid-type"
                >
                  {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
