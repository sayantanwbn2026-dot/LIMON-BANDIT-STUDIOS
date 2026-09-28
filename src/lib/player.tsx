import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { type Track } from "@/data/tracks";
import { useTracks } from "@/cms/hooks";
import { attach, resume } from "./audio-graph";

type PlayerState = {
  track: Track | null;
  playing: boolean;
  time: number;
  duration: number;
  /** the audio failed to load — the UI says so rather than pretending */
  failed: boolean;
  play: (id: string) => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  step: (delta: number) => void;
  next: () => void;
  prev: () => void;
  stop: () => void;
  /**
   * Load a track and park it at a moment WITHOUT playing it.
   *
   * For links that carry a timestamp. Starting sound on arrival is the
   * reason people browse muted, so a shared moment arms the transport and
   * waits to be pressed.
   */
  cue: (id: string, seconds: number) => void;
};

const Ctx = createContext<PlayerState | null>(null);

/**
 * One <audio> element for the whole site, owned above the router.
 *
 * That placement is the entire point: playing a track on /label and then
 * navigating to /shop must not stop the music, and it cannot survive if the
 * element is unmounted with the route.
 *
 * Never autoplays — playback only ever starts from a user gesture.
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const tracks = useTracks();
  const ref = useRef<HTMLAudioElement | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState(false);
  /** A seek that has to wait for metadata before it can be applied. */
  const pending = useRef<number | null>(null);

  const play = useCallback(
    (id: string) => {
      const t = tracks.find((x) => x.id === id);
      if (!t) return;
      const el = ref.current;
      if (!el) return;

      /* The rooms and the analyser live on a Web Audio graph that can
       * only be built from a user gesture — and every play starts here.
       * If it cannot be built, `attach` says so and the element plays to
       * the speakers exactly as it always did. */
      attach(el);
      resume();

      if (track?.id === id) {
        if (el.paused) void el.play().catch(() => setFailed(true));
        else el.pause();
        return;
      }
      setFailed(false);
      setTrack(t);
      setTime(0);
      setDuration(0);
      el.src = t.src;
      void el.play().catch(() => setFailed(true));
    },
    [track],
  );

  const cue = useCallback(
    (id: string, seconds: number) => {
      const t = tracks.find((x) => x.id === id);
      const el = ref.current;
      if (!t || !el) return;
      setFailed(false);
      setTrack(t);
      setTime(seconds);
      setDuration(0);
      pending.current = seconds;
      /* `preload="none"` is the default on this element, so the metadata
       * this needs has to be asked for explicitly. */
      el.preload = "metadata";
      el.src = t.src;
      el.load();
    },
    [tracks],
  );

  const toggle = useCallback(() => {
    const el = ref.current;
    if (!el || !track) return;
    /* Safari suspends the context with the tab; waking it here costs
     * nothing and is the difference between silence and sound. */
    resume();
    if (el.paused) void el.play().catch(() => setFailed(true));
    else el.pause();
  }, [track]);

  const seek = useCallback((s: number) => {
    const el = ref.current;
    if (!el || !Number.isFinite(el.duration)) return;
    el.currentTime = Math.max(0, Math.min(el.duration, s));
    setTime(el.currentTime);
  }, []);

  const step = useCallback(
    (delta: number) => {
      const el = ref.current;
      if (!el) return;
      seek(el.currentTime + delta);
    },
    [seek],
  );

  const jump = useCallback(
    (dir: 1 | -1) => {
      if (!track) return;
      const i = tracks.findIndex((t) => t.id === track.id);
      const nextTrack = tracks[(i + dir + tracks.length) % tracks.length];
      play(nextTrack.id);
    },
    [track, play],
  );

  const stop = useCallback(() => {
    const el = ref.current;
    if (el) {
      el.pause();
      el.removeAttribute("src");
      el.load();
    }
    setTrack(null);
    setPlaying(false);
    setTime(0);
    setDuration(0);
  }, []);

  const value = useMemo<PlayerState>(
    () => ({
      track,
      playing,
      time,
      duration,
      failed,
      play,
      toggle,
      seek,
      step,
      next: () => jump(1),
      prev: () => jump(-1),
      stop,
      cue,
    }),
    [track, playing, time, duration, failed, play, toggle, seek, step, jump, stop, cue],
  );

  return (
    <Ctx.Provider value={value}>
      <audio
        ref={ref}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          /* A cued moment can only be applied once the browser knows how
           * long the file is. */
          const want = pending.current;
          pending.current = null;
          if (want != null && Number.isFinite(e.currentTarget.duration)) {
            e.currentTarget.currentTime = Math.max(0, Math.min(e.currentTarget.duration, want));
            setTime(e.currentTarget.currentTime);
          }
        }}
        onError={() => {
          setFailed(true);
          setPlaying(false);
        }}
      />
      {children}
    </Ctx.Provider>
  );
}

export function usePlayer() {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePlayer must be used inside PlayerProvider");
  return c;
}

/** mm:ss, always two digits, for tabular-nums readouts */
export function clock(s: number) {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

/* Keyboard transport is bound on the player's own focusable group in
 * LabelPlayer rather than on window — a global space-bar handler would
 * hijack the key for the whole page. */
