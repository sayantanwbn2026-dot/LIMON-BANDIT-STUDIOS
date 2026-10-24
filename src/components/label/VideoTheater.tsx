import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { lockScroll, unlockScroll } from "@/lib/smooth";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";
import { clock, usePlayer } from "@/lib/player";
import { autoQuality, embedOf, sourcesOf, viewingNow, type Quality } from "@/lib/video";
import { resolveImage } from "@/cms/media";
import { images, type ImageEntry } from "@/generated/images";
import type { VideoDoc } from "@/cms/hooks";
import { useWords } from "@/cms/hooks";
import { fill } from "@/cms/words";

/**
 * The theatre — the label's films, full screen, at the quality the screen
 * can show.
 *
 * WHY NOT THE BROWSER'S OWN CONTROLS
 * Native controls differ on every browser, cannot be styled to the house,
 * and none of them can change quality: a <video> plays the one file it was
 * given. This player holds every encode a film has (2160p, 1080p, 720p),
 * starts on the one the screen and connection can use (lib/video), and
 * switches between them without losing the place — the time and the
 * play/pause state carry across.
 *
 * IT OPENS FROM THE CARD. The theatre is clipped to the card's rectangle and
 * opens to the full viewport, the same move the home page's Room A film
 * makes on scroll — so the picture you pressed is the picture that grows,
 * rather than a dialog appearing from nowhere. Closing returns it to its
 * card when the card is still on screen.
 *
 * A PORTAL, AND THAT IS LOAD-BEARING. The cards sit inside sections that
 * GSAP transforms, and a transformed ancestor turns `position: fixed` into
 * "fixed to that ancestor". Rendered in place, the theatre would cover a
 * card's worth of section instead of the screen.
 *
 * Everything you would expect of a real player is here: a scrubber with
 * the buffered range and a time under the pointer, volume, picture in
 * picture, fullscreen, and the keyboard — Space or K, ← → for five seconds,
 * J L for ten, ↑ ↓ volume, M mute, F fullscreen, 0–9 to jump, Shift+← →
 * between films, Escape to leave. A film that only has a YouTube or Vimeo
 * link plays in their own player, which streams up to 4K itself.
 */

type Props = {
  films: VideoDoc[];
  index: number;
  /** the card's rectangle at the moment it was pressed */
  origin: DOMRect | null;
  /** where film `i`'s card is now, for the way back */
  originOf: (i: number) => DOMRect | null;
  onIndex: (i: number) => void;
  onClose: () => void;
};

export function VideoTheater(props: Props) {
  if (typeof document === "undefined") return null;
  return createPortal(<Theater {...props} />, document.body);
}

/** A manifest key or an uploaded URL, as something a poster attribute takes. */
function stillUrl(value: string | undefined): string | undefined {
  const r = resolveImage(value);
  if (r.kind === "url") return r.url;
  if (r.kind === "manifest") {
    const entry = (images as Record<string, ImageEntry | undefined>)[r.key];
    return entry?.avif.at(-1)?.url ?? entry?.fallback;
  }
  return undefined;
}

const inset = (r: DOMRect) =>
  `inset(${r.top}px ${window.innerWidth - r.right}px ${window.innerHeight - r.bottom}px ${r.left}px)`;
const OPEN = "inset(0px 0px 0px 0px)";

/** How long the pointer can rest before the chrome steps out of the picture. */
const IDLE_MS = 2600;

function Theater({ films, index, origin, originOf, onIndex, onClose }: Props) {
  const film = films[index];
  const w = useWords("player");
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playBtnRef = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);

  const sources = useMemo(() => sourcesOf(film), [film]);
  const embed = useMemo(() => (sources.length ? null : embedOf(film.embed)), [sources, film]);

  /* "auto" until somebody picks a rung; a picked rung carries to the next
   * film when that film has it. */
  const [choice, setChoice] = useState<"auto" | Quality>("auto");
  const auto = useMemo(
    () => (typeof window === "undefined" ? sources[0] : autoQuality(sources, viewingNow())),
    [sources],
  );
  const current = (choice !== "auto" && sources.find((s) => s.q === choice)) || auto;

  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [waiting, setWaiting] = useState(true);
  const [ended, setEnded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  /** autoplay with sound was refused, so it is playing muted */
  const [soundBlocked, setSoundBlocked] = useState(false);
  /** autoplay was refused outright — a press is needed */
  const [needsPress, setNeedsPress] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [pip, setPip] = useState(false);
  const [menu, setMenu] = useState(false);
  const [idle, setIdle] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const player = usePlayer();
  const playerRef = useRef(player);
  playerRef.current = player;

  const canPip =
    typeof document !== "undefined" && "pictureInPictureEnabled" in document
      ? document.pictureInPictureEnabled
      : false;

  /* ---------------- open: lock, focus, and grow out of the card ---------------- */

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    lockScroll();
    const gsap = ensureGsap();
    if (gsap && !prefersReducedMotion() && origin) {
      gsap.fromTo(
        root,
        { clipPath: inset(origin) },
        { clipPath: OPEN, duration: 0.85, ease: "expo.inOut", clearProps: "clipPath" },
      );
      gsap.fromTo(
        "[data-theater-chrome]",
        { opacity: 0 },
        { opacity: 1, duration: 0.5, delay: 0.55, ease: "power2.out", clearProps: "opacity" },
      );
    } else if (gsap) {
      gsap.fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.3, clearProps: "opacity" });
    }
    playBtnRef.current?.focus({ preventScroll: true });
    return () => unlockScroll();
  }, [origin]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const v = videoRef.current;
    v?.pause();
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    if (document.pictureInPictureElement) void document.exitPictureInPicture().catch(() => {});

    const root = rootRef.current;
    const gsap = ensureGsap();
    const back = originOf(index);
    const onScreen =
      back && back.bottom > 0 && back.top < window.innerHeight && back.width > 0 && back.height > 0;
    if (!root || !gsap || prefersReducedMotion()) {
      onClose();
      return;
    }
    if (onScreen) {
      /* fromTo, not to: the open tween cleared its clip-path, and GSAP
       * cannot interpolate out of `none`. */
      gsap.fromTo(
        root,
        { clipPath: OPEN },
        { clipPath: inset(back), duration: 0.7, ease: "expo.inOut", onComplete: onClose },
      );
    } else {
      gsap.to(root, { opacity: 0, duration: 0.25, onComplete: onClose });
    }
  }, [index, onClose, originOf]);

  /* ---------------- the file ----------------
   * Set imperatively rather than as a `src` prop, so a change of quality
   * can carry the time and the play state across: React swapping the
   * attribute would restart the film from nothing. */

  const resume = useRef<{ t: number; play: boolean } | null>(null);
  const firstLoad = useRef(true);
  const src = current?.src;

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !src) return;
    if (!firstLoad.current) resume.current = { t: v.currentTime, play: !v.paused };
    setFailed(false);
    setWaiting(true);
    v.src = src;
    v.load();
  }, [src]);

  /* A new film starts from the top, and its first play has to try again
   * for sound. */
  useEffect(() => {
    firstLoad.current = true;
    resume.current = null;
    setEnded(false);
    setTime(0);
    setDuration(0);
    setBuffered(0);
    setNeedsPress(false);
  }, [index]);

  const startPlaying = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      await v.play();
      setNeedsPress(false);
    } catch {
      /* Sound is the usual reason. Try again silent and say so; if even
       * that is refused, the big play button takes over. */
      try {
        v.muted = true;
        setMuted(true);
        await v.play();
        setSoundBlocked(true);
      } catch {
        setNeedsPress(true);
      }
    }
  }, []);

  const onLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
    const r = resume.current;
    resume.current = null;
    if (r) {
      v.currentTime = Math.min(r.t, v.duration || r.t);
      if (r.play) void startPlaying();
    } else if (firstLoad.current) {
      firstLoad.current = false;
      void startPlaying();
    }
  };

  const readBuffered = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const b = v.buffered;
    for (let i = 0; i < b.length; i++) {
      if (b.start(i) <= v.currentTime + 0.25 && b.end(i) >= v.currentTime) {
        setBuffered(b.end(i) / v.duration);
        return;
      }
    }
  };

  /* ---------------- transport ---------------- */

  const toggle = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused || v.ended) void startPlaying();
    else v.pause();
  }, [startPlaying]);

  const seekTo = useCallback((t: number) => {
    const v = videoRef.current;
    if (!v || !Number.isFinite(v.duration)) return;
    v.currentTime = Math.max(0, Math.min(v.duration, t));
    setTime(v.currentTime);
    setEnded(false);
  }, []);

  const say = useCallback((s: string) => {
    setFlash(s);
  }, []);
  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(null), 900);
    return () => window.clearTimeout(t);
  }, [flash]);

  const setVol = useCallback(
    (n: number) => {
      const v = videoRef.current;
      if (!v) return;
      const next = Math.max(0, Math.min(1, Math.round(n * 100) / 100));
      v.volume = next;
      v.muted = next === 0;
      setSoundBlocked(false);
      say(fill(w.filmVolumeSaid, { percent: Math.round(next * 100) }));
    },
    [say, w.filmVolumeSaid],
  );

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    if (!v.muted && v.volume === 0) v.volume = 0.6;
    setSoundBlocked(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const root = rootRef.current;
    const v = videoRef.current as
      | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
      | null;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    } else if (root?.requestFullscreen) {
      void root.requestFullscreen().catch(() => {});
    } else {
      /* iOS Safari: only the video element itself can go fullscreen, and
       * it brings the system controls with it. */
      v?.webkitEnterFullscreen?.();
    }
  }, []);

  const togglePip = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (document.pictureInPictureElement) void document.exitPictureInPicture().catch(() => {});
    else void v.requestPictureInPicture().catch(() => {});
  }, []);

  const go = useCallback(
    (d: number) => {
      if (films.length < 2) return;
      onIndex((index + d + films.length) % films.length);
    },
    [films.length, index, onIndex],
  );

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  /* React has no props for these two, so they are listened for directly. */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const on = () => setPip(true);
    const off = () => setPip(false);
    v.addEventListener("enterpictureinpicture", on);
    v.addEventListener("leavepictureinpicture", off);
    return () => {
      v.removeEventListener("enterpictureinpicture", on);
      v.removeEventListener("leavepictureinpicture", off);
    };
  }, [embed]);

  /* ---------------- the chrome steps aside while you watch ---------------- */

  const idleTimer = useRef(0);
  const wake = useCallback(() => {
    setIdle(false);
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setIdle(true), IDLE_MS);
  }, []);
  useEffect(() => () => window.clearTimeout(idleTimer.current), []);
  const chromeHidden = idle && playing && !menu && !scrubbing && !embed;

  /* ---------------- keyboard ---------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const root = rootRef.current;
      if (!root) return;
      wake();

      if (e.key === "Escape") {
        e.stopPropagation();
        if (menu) setMenu(false);
        else if (!document.fullscreenElement) close();
        return;
      }

      if (e.key === "Tab") {
        const items = Array.from(
          root.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input, iframe, [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => el.offsetParent !== null);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
        return;
      }

      if (embed || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const onControl = target?.closest("button, input, [role='slider'], [role='menu']");
      const v = videoRef.current;
      if (!v) return;

      switch (e.key) {
        case " ":
          if (onControl) return; // a focused button already takes Space
          e.preventDefault();
          toggle();
          return;
        case "k":
        case "K":
          toggle();
          return;
        case "ArrowLeft":
        case "ArrowRight": {
          if (target?.closest("input, [role='slider']")) return;
          e.preventDefault();
          const dir = e.key === "ArrowRight" ? 1 : -1;
          if (e.shiftKey) go(dir);
          else {
            seekTo(v.currentTime + dir * 5);
            say(dir > 0 ? "+5s" : "−5s");
          }
          return;
        }
        case "j":
        case "J":
          seekTo(v.currentTime - 10);
          say("−10s");
          return;
        case "l":
        case "L":
          seekTo(v.currentTime + 10);
          say("+10s");
          return;
        case "ArrowUp":
        case "ArrowDown":
          if (target?.closest("input")) return;
          e.preventDefault();
          setVol((v.muted ? 0 : v.volume) + (e.key === "ArrowUp" ? 0.1 : -0.1));
          return;
        case "m":
        case "M":
          toggleMute();
          return;
        case "f":
        case "F":
          toggleFullscreen();
          return;
        case "Home":
          e.preventDefault();
          seekTo(0);
          return;
        case "End":
          e.preventDefault();
          seekTo(v.duration);
          return;
        default:
          if (/^[0-9]$/.test(e.key) && Number.isFinite(v.duration)) {
            seekTo((Number(e.key) / 10) * v.duration);
          }
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [close, embed, go, menu, say, seekTo, setVol, toggle, toggleFullscreen, toggleMute, wake]);

  /* ---------------- render ---------------- */

  const poster = stillUrl(film.still) ?? stillUrl(film.cover);
  const byline = [film.artist, film.director ? `Dir. ${film.director}` : "", film.year]
    .filter(Boolean)
    .join(" · ");
  const lower = failed ? sources.find((s) => current && s.q < current.q) : undefined;
  const next = films.length > 1 ? films[(index + 1) % films.length] : null;
  const showCentre = !embed && (needsPress || ended || failed || (!playing && !waiting));

  return (
    <div
      ref={rootRef}
      data-theater
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onPointerMove={wake}
      className="fixed inset-0 z-[9998] bg-surface-deep text-text"
      style={{ cursor: chromeHidden ? "none" : undefined }}
    >
      {/* ---------------- the picture ----------------
       * As large as the screen allows at 16:9, with the head and the
       * transport laid over it on their own gradients — not reserved bands
       * above and below. Reserving them kept the film at two-thirds of a
       * laptop screen even after the controls had stepped out of the way;
       * overlaid, the picture is the whole room the moment they go. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative aspect-video w-full overflow-hidden bg-black"
          style={{ maxWidth: "min(100%, calc(100svh * 16 / 9))" }}
        >
          {embed ? (
            <iframe
              key={embed.src}
              src={embed.src}
              title={`${film.title} — ${film.artist}`}
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          ) : (
            <video
              ref={videoRef}
              poster={poster}
              playsInline
              preload="auto"
              className="absolute inset-0 h-full w-full object-contain"
              onClick={() => {
                if (window.matchMedia("(pointer: coarse)").matches) wake();
                else toggle();
              }}
              onDoubleClick={toggleFullscreen}
              onLoadedMetadata={onLoadedMetadata}
              onDurationChange={() => setDuration(videoRef.current?.duration ?? 0)}
              onTimeUpdate={() => {
                const v = videoRef.current;
                if (!v) return;
                if (!scrubbing) setTime(v.currentTime);
                readBuffered();
              }}
              onProgress={readBuffered}
              onPlay={() => {
                setPlaying(true);
                setEnded(false);
                wake();
                /* One sound at a time: the label's audio player stops when
                 * a film starts. */
                if (playerRef.current.playing) playerRef.current.toggle();
              }}
              onPause={() => setPlaying(false)}
              onWaiting={() => setWaiting(true)}
              onPlaying={() => setWaiting(false)}
              onCanPlay={() => setWaiting(false)}
              onEnded={() => {
                setPlaying(false);
                setEnded(true);
              }}
              onError={() => {
                setFailed(true);
                setWaiting(false);
              }}
              onVolumeChange={() => {
                const v = videoRef.current;
                if (!v) return;
                setMuted(v.muted);
                setVolume(v.volume);
              }}
            />
          )}

          {/* buffering */}
          {!embed && waiting && !failed && !needsPress ? (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <Loader2 size={34} className="animate-spin text-acid-type" aria-hidden="true" />
              <span className="sr-only">{w.filmLoading}</span>
            </span>
          ) : null}

          {/* the big press: paused, ended, refused, or failed */}
          {showCentre ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[rgba(5,5,5,0.35)] px-6 text-center">
              {failed ? (
                <>
                  <p className="font-display text-[20px] font-extrabold uppercase tracking-[-0.02em]">
                    {w.filmFailed}
                  </p>
                  {lower ? (
                    <button
                      type="button"
                      onClick={() => setChoice(lower.q)}
                      className="flex h-11 items-center gap-2 border border-line bg-surface-deep/70 px-4 font-ui text-[12px] font-bold uppercase tracking-[0.14em] transition-colors duration-300 hover:border-acid-type"
                    >
                      {fill(w.filmTryLower, { quality: lower.label, height: lower.q })}
                    </button>
                  ) : (
                    <p className="t-label text-mute">{w.filmCheckAdmin}</p>
                  )}
                </>
              ) : (
                <>
                  <button
                    ref={playBtnRef}
                    type="button"
                    onClick={() => {
                      if (!ended) return toggle();
                      seekTo(0);
                      void startPlaying();
                    }}
                    aria-label={ended ? w.filmWatchAgain : fill(w.filmPlay, { title: film.title })}
                    className="flex h-[76px] w-[76px] items-center justify-center bg-acid text-accent-text transition-transform duration-300 hover:scale-105"
                  >
                    {ended ? (
                      <RotateCcw size={26} />
                    ) : (
                      <Play size={28} className="translate-x-[2px] fill-accent-text" />
                    )}
                  </button>
                  {ended && next ? (
                    <button
                      type="button"
                      onClick={() => go(1)}
                      className="group flex items-center gap-2 font-ui text-[12px] font-bold uppercase tracking-[0.14em] text-text"
                    >
                      <span className="wipe-underline">Next — {next.title}</span>
                      <ArrowRight size={14} className="lb-arrow text-acid-type" />
                    </button>
                  ) : null}
                </>
              )}
            </div>
          ) : null}

          {soundBlocked ? (
            <button
              type="button"
              onClick={toggleMute}
              className="absolute bottom-4 left-1/2 flex h-11 -translate-x-1/2 items-center gap-2 border border-acid-type bg-surface-deep/80 px-4 font-ui text-[11px] font-bold uppercase tracking-[0.14em] text-text"
            >
              <VolumeX size={14} className="text-acid-type" /> Sound off — tap for sound
            </button>
          ) : null}

          {flash ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 bg-surface-deep/80 px-3 py-1.5 font-ui text-[11px] font-bold uppercase tracking-[0.14em] text-text"
            >
              {flash}
            </span>
          ) : null}
        </div>
      </div>

      {/* ---------------- the head ---------------- */}
      <div
        data-theater-chrome
        className="pointer-events-none absolute inset-x-0 top-0 z-[3] transition-opacity duration-500"
        style={{
          opacity: chromeHidden ? 0 : 1,
          background: "linear-gradient(to bottom, rgba(5,5,5,0.92), rgba(5,5,5,0))",
        }}
      >
        <div className="flex items-start justify-between gap-6 px-5 pb-10 pt-5 md:px-8 md:pt-7">
          <div className="min-w-0">
            <p className="t-label tnum text-acid-type">
              Film {String(index + 1).padStart(2, "0")} / {String(films.length).padStart(2, "0")}
            </p>
            <h2
              id={titleId}
              className="mt-2 truncate font-display text-[22px] font-extrabold uppercase leading-none tracking-[-0.03em] md:text-[34px]"
            >
              {film.title}
            </h2>
            <p className="mt-2 truncate font-ui text-[13px] text-mute md:text-[14px]">
              {byline}
              {film.note ? <span className="hidden lg:inline"> — {film.note}</span> : null}
            </p>
          </div>
          <div className="pointer-events-auto flex shrink-0 items-center gap-2">
            {/* On a phone the transport has no room for these, so the way
             * between films moves up here, beside the way out. */}
            {films.length > 1 && !embed ? (
              <>
                <Ctrl label={w.filmPrevious} onClick={() => go(-1)} className="sm:hidden">
                  <ArrowLeft size={16} />
                </Ctrl>
                <Ctrl label={w.filmNext} onClick={() => go(1)} className="sm:hidden">
                  <ArrowRight size={16} />
                </Ctrl>
              </>
            ) : null}
            {current ? (
              <span className="t-label hidden h-11 items-center border border-line px-3 text-mute sm:flex">
                {current.label} · {current.q}p
              </span>
            ) : null}
            <Ctrl label={w.filmClose} onClick={close}>
              <X size={18} />
            </Ctrl>
          </div>
        </div>
      </div>

      {/* ---------------- the transport ---------------- */}
      {!embed ? (
        <div
          data-theater-chrome
          className="absolute inset-x-0 bottom-0 z-[3] transition-opacity duration-500"
          style={{
            opacity: chromeHidden ? 0 : 1,
            pointerEvents: chromeHidden ? "none" : undefined,
            background: "linear-gradient(to top, rgba(5,5,5,0.94), rgba(5,5,5,0))",
          }}
        >
          <div className="px-5 pb-[calc(20px+env(safe-area-inset-bottom,0px))] pt-12 md:px-8 md:pb-7">
            <Scrubber
              time={time}
              duration={duration}
              buffered={buffered}
              onScrub={(t, done) => {
                setScrubbing(!done);
                setTime(t);
                seekTo(t);
                wake();
              }}
            />

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Ctrl
                  ref={showCentre ? undefined : playBtnRef}
                  label={playing ? w.filmPauseKey : w.filmPlayKey}
                  onClick={toggle}
                  accent
                >
                  {playing ? <Pause size={16} /> : <Play size={16} className="translate-x-[1px]" />}
                </Ctrl>
                {films.length > 1 ? (
                  <>
                    <Ctrl
                      label={w.filmPreviousKey}
                      onClick={() => go(-1)}
                      className="max-sm:hidden"
                    >
                      <ArrowLeft size={16} />
                    </Ctrl>
                    <Ctrl label={w.filmNextKey} onClick={() => go(1)} className="max-sm:hidden">
                      <ArrowRight size={16} />
                    </Ctrl>
                  </>
                ) : null}
                <span className="tnum ml-2 whitespace-nowrap font-ui text-[13px] text-mute">
                  <span className="text-text">{clock(time)}</span> / {clock(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Ctrl label={muted ? w.filmUnmuteKey : w.filmMuteKey} onClick={toggleMute}>
                  {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </Ctrl>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  onChange={(e) => setVol(Number(e.target.value))}
                  aria-label={w.filmVolume}
                  className="hidden w-[96px] accent-[var(--accent)] pointer-fine:block"
                />

                {sources.length > 0 ? (
                  <QualityMenu
                    open={menu}
                    onOpen={setMenu}
                    choice={choice}
                    autoLabel={auto ? `${auto.label}` : ""}
                    current={current?.q}
                    options={sources}
                    onPick={(q) => {
                      setChoice(q);
                      setMenu(false);
                      say(q === "auto" ? w.filmQualityAuto : `${q}p`);
                    }}
                  />
                ) : null}

                {canPip ? (
                  <Ctrl
                    label={pip ? w.filmPipLeave : w.filmPip}
                    onClick={togglePip}
                    className="max-sm:hidden"
                  >
                    <PictureInPicture2 size={16} />
                  </Ctrl>
                ) : null}
                <Ctrl
                  label={fullscreen ? w.filmFullscreenLeave : w.filmFullscreen}
                  onClick={toggleFullscreen}
                >
                  {fullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                </Ctrl>
              </div>
            </div>
          </div>
        </div>
      ) : /* An embed brings its own controls; the house only supplies the way
       * between films. */
      films.length > 1 ? (
        <div className="absolute inset-x-0 bottom-0 z-[3] flex justify-center gap-2 pb-[calc(20px+env(safe-area-inset-bottom,0px))]">
          <Ctrl label={w.filmPrevious} onClick={() => go(-1)}>
            <ArrowLeft size={16} />
          </Ctrl>
          <Ctrl label={w.filmNext} onClick={() => go(1)}>
            <ArrowRight size={16} />
          </Ctrl>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */

type CtrlProps = {
  label: string;
  onClick: () => void;
  children: ReactNode;
  accent?: boolean;
  className?: string;
  ref?: React.Ref<HTMLButtonElement>;
};

/** One square control, the house's 44px minimum, labelled for its shortcut. */
function Ctrl({ label, onClick, children, accent, className = "", ref }: CtrlProps) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-11 w-11 shrink-0 items-center justify-center border backdrop-blur-sm transition-colors duration-300 ${
        accent
          ? "border-acid bg-acid text-accent-text hover:bg-acid-dim"
          : "border-line bg-surface-deep/60 text-text hover:border-acid-type"
      } ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * The timeline. Drag anywhere along it; the time under the pointer shows
 * above it before you commit. A slider to assistive tech, with the arrow
 * keys stepping five seconds — the same step the theatre's own keys use.
 */
function Scrubber({
  time,
  duration,
  buffered,
  onScrub,
}: {
  time: number;
  duration: number;
  buffered: number;
  onScrub: (t: number, done: boolean) => void;
}) {
  const w = useWords("player");
  const track = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const dragging = useRef(false);

  const at = (e: ReactPointerEvent) => {
    const r = track.current?.getBoundingClientRect();
    if (!r || !duration) return 0;
    return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * duration;
  };

  const played = duration ? time / duration : 0;

  return (
    <div
      ref={track}
      role="slider"
      tabIndex={0}
      aria-label={w.filmSeek}
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(time)}
      aria-valuetext={`${clock(time)} of ${clock(duration)}`}
      onKeyDown={(e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        e.stopPropagation();
        onScrub(time + (e.key === "ArrowRight" ? 5 : -5), true);
      }}
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        onScrub(at(e), false);
      }}
      onPointerMove={(e) => {
        setHover(at(e));
        if (dragging.current) onScrub(at(e), false);
      }}
      onPointerUp={(e) => {
        if (!dragging.current) return;
        dragging.current = false;
        onScrub(at(e), true);
      }}
      onPointerLeave={() => setHover(null)}
      className="group relative flex h-6 cursor-pointer touch-none items-center outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid"
    >
      <span className="relative block h-[3px] w-full bg-line-strong transition-[height] duration-200 group-hover:h-[5px]">
        <span
          className="absolute inset-y-0 left-0 bg-mute/50"
          style={{ width: `${buffered * 100}%` }}
        />
        <span className="absolute inset-y-0 left-0 bg-acid" style={{ width: `${played * 100}%` }} />
      </span>
      <span
        aria-hidden="true"
        className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 bg-acid"
        style={{ left: `${played * 100}%` }}
      />
      {hover !== null && duration ? (
        <span
          aria-hidden="true"
          className="tnum pointer-events-none absolute bottom-full mb-2 -translate-x-1/2 bg-surface-deep px-2 py-1 font-ui text-[11px] font-bold text-text"
          style={{ left: `${(hover / duration) * 100}%` }}
        >
          {clock(hover)}
        </span>
      ) : null}
    </div>
  );
}

/** The quality ladder, plus Auto — which says what it picked. */
function QualityMenu({
  open,
  onOpen,
  choice,
  autoLabel,
  current,
  options,
  onPick,
}: {
  open: boolean;
  onOpen: (v: boolean) => void;
  choice: "auto" | Quality;
  autoLabel: string;
  current?: Quality;
  options: { q: Quality; label: string }[];
  onPick: (q: "auto" | Quality) => void;
}) {
  const w = useWords("player");
  const shown = options.find((o) => o.q === current);
  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={w.filmQuality}
        onClick={() => onOpen(!open)}
        className="flex h-11 items-center gap-2 border border-line bg-surface-deep/60 px-3 font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-text backdrop-blur-sm transition-colors duration-300 hover:border-acid-type"
      >
        {choice === "auto" ? <span className="text-mute">{w.filmQualityAuto}</span> : null}
        <span className={shown?.q === 2160 ? "text-acid-type" : ""}>{shown?.label ?? "—"}</span>
      </button>
      {open ? (
        <div
          role="menu"
          aria-label={w.filmQuality}
          className="ui-panel absolute bottom-[calc(100%+8px)] right-0 w-[230px] overflow-hidden border border-line bg-surface-deep"
        >
          <p className="t-label border-b border-line px-4 py-3 text-mute">{w.filmQuality}</p>
          <Item on={choice === "auto"} onClick={() => onPick("auto")} detail={autoLabel}>
            {w.filmQualityAuto}
          </Item>
          {options.map((o) => (
            <Item
              key={o.q}
              on={choice === o.q}
              onClick={() => onPick(o.q)}
              detail={`${o.q}p`}
              accent={o.q === 2160}
            >
              {o.label}
            </Item>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Item({
  on,
  onClick,
  detail,
  accent,
  children,
}: {
  on: boolean;
  onClick: () => void;
  detail: string;
  accent?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={on}
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left font-ui text-[12px] font-bold uppercase tracking-[0.12em] text-text transition-colors duration-300 last:border-b-0 hover:bg-surface-raised"
    >
      <span className="flex w-4 justify-center">
        {on ? <Check size={14} className="text-acid-type" /> : null}
      </span>
      <span className={accent ? "text-acid-type" : ""}>{children}</span>
      <span className="tnum ml-auto text-mute">{detail}</span>
    </button>
  );
}
