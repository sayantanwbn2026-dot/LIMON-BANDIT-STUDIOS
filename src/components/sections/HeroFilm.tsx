import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { images, type ImageEntry } from "@/generated/images";
import { prefersReducedMotion } from "@/lib/motion";
import { useFilm } from "@/cms/hooks";

/**
 * The film, back in the hero — desktop only.
 *
 * It used to be `RoomFilm`: a 200vh scroll section that pulled a window open
 * to the full viewport. That came out when the home page went from 21.7
 * screens to 14.1, and it was the right thing to cut, because two hundred
 * vertical hundredths for one effect is exactly the kind of scrolling that
 * was making the page tiring.
 *
 * This is the same film in the one place that costs no scrolling at all: the
 * hero's bottom-left corner, opposite "Book the room", which on a desktop is
 * empty space the composition was already carrying. It is `lg` and up only —
 * below that the corner is where the mascot's feet and the full-width CTA
 * are, and there is no room to take.
 *
 * It reads the same CMS document the old section did (Home → "Room A film"),
 * so an editor setting a film sets it here, and there is still exactly one
 * place to set it.
 *
 * WHEN THERE IS NO FILM — which is the case today
 * The still carries the frame on its own and the controls are not drawn.
 * A play button that cannot play is worse than no play button; the same
 * rule RoomFilm followed, for the same reason. Drop a file at
 * public/video/room-a.mp4 and point the CMS field at /video/room-a.mp4,
 * and this becomes a player without another change.
 *
 * IT MUST NOT COMPETE WITH THE LCP
 * The mascot is the hero's largest paint and the one `priority` image on
 * the site. So the poster here is a plain background-image, the video is
 * `preload="metadata"`, and nothing starts decoding until the element is
 * actually on screen.
 */

/** A still can be a manifest key (built-in art) or an uploaded URL. */
function posterUrl(value: string): string {
  const entry = (images as Record<string, ImageEntry | undefined>)[value];
  if (entry) return entry.avif.at(-1)?.url ?? entry.fallback;
  return value || (images["room-a"].avif.at(-1)?.url ?? images["room-a"].fallback);
}

export function HeroFilm() {
  const film = useFilm();
  const src = film.video?.trim() ?? "";
  const poster = posterUrl(film.poster ?? "");

  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  /* Play only while it is on screen. The hero is at the top of the page, so
   * without this the file would keep decoding for the whole scroll — a
   * laptop fan spinning up over a corner of a page nobody is looking at. */
  useEffect(() => {
    const el = box.current;
    const v = video.current;
    if (!el || !v || !src) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !prefersReducedMotion()) {
          void v.play().then(
            () => setPlaying(true),
            () => {
              /* Autoplay refused — the controls still work by hand. */
            },
          );
        } else {
          v.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [src]);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) {
      void v.play().then(
        () => setPlaying(true),
        () => setPlaying(false),
      );
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    const v = video.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  return (
    <div ref={box} data-hero-station className="hidden lg:block">
      <figure className="w-[300px]">
        <div
          className="group relative aspect-video w-full overflow-hidden border border-line bg-surface bg-cover bg-center"
          style={{ backgroundImage: `url("${poster}")` }}
        >
          {src ? (
            <>
              <video
                ref={video}
                muted={muted}
                loop
                playsInline
                preload="metadata"
                poster={poster}
                className="absolute inset-0 h-full w-full object-cover"
                aria-label="A night in Room A"
              >
                <source src={src} />
              </video>

              {/* The controls sit on a scrim rather than on the picture, so
               * they stay legible whatever frame is under them. */}
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-surface-deep/80 px-1 py-1 opacity-0 transition-opacity duration-300 focus-within:opacity-100 group-hover:opacity-100">
                <Control onClick={toggle} label={playing ? "Pause the film" : "Play the film"}>
                  {playing ? <Pause size={14} /> : <Play size={14} />}
                </Control>
                <Control onClick={toggleMute} label={muted ? "Unmute the film" : "Mute the film"}>
                  {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </Control>
              </div>
            </>
          ) : null}

          <span
            aria-hidden="true"
            className="absolute left-0 top-0 h-[18px] w-[18px] border-l border-t border-acid-type"
          />
        </div>

        <figcaption className="mt-3 flex items-baseline gap-2 font-ui text-[11px] font-bold uppercase tracking-[0.14em] text-mute">
          <span className="h-[5px] w-[5px] shrink-0 bg-acid" />
          Room A — the film
        </figcaption>
      </figure>
    </div>
  );
}

/** 44px, like everything else you can press on this site. */
function Control({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center text-text transition-colors duration-300 hover:text-acid-type"
    >
      {children}
    </button>
  );
}
