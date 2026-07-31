import { Pause, Play, SkipForward, X } from "lucide-react";
import { Picture } from "./Picture";
import { clock, usePlayer } from "@/lib/player";

/**
 * The docked transport. Appears in the bottom rule the moment a track is
 * playing and stays there across every route — which is what makes the
 * player's placement above the router visible rather than theoretical.
 */
export function MiniTransport() {
  const { track, playing, time, duration, failed, toggle, next, seek, stop } = usePlayer();
  if (!track) return null;

  const pct = duration > 0 ? (time / duration) * 100 : 0;

  return (
    <div
      role="region"
      aria-label="Now playing"
      className="fixed inset-x-0 bottom-0 z-[9989] border-t border-line bg-surface-deep/95"
      style={{ backdropFilter: "blur(6px)" }}
    >
      {/* progress, doubling as the top hairline */}
      <div className="relative h-px w-full bg-line">
        <span
          className="absolute left-0 top-0 h-px bg-acid"
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </div>

      <div className="shell flex h-[64px] items-center gap-4">
        <Picture
          src={track.cover}
          alt=""
          sizes="36px"
          className="h-9 w-9 shrink-0 border border-line object-cover mono"
        />

        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? `Pause ${track.title}` : `Play ${track.title}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center bg-acid transition-colors duration-300 hover:bg-acid-dim"
        >
          {playing ? (
            <Pause size={14} className="fill-accent-text text-accent-text" />
          ) : (
            <Play size={14} className="fill-accent-text text-accent-text" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[13px] font-bold uppercase tracking-[-0.01em] text-text">
            {track.title}
          </div>
          <div className="truncate font-ui text-[11px] text-mute">
            {failed ? "Preview unavailable" : track.artist}
          </div>
        </div>

        <span className="tnum hidden font-ui text-[12px] text-mute sm:block">
          {clock(time)} / {clock(duration)}
        </span>

        <button
          type="button"
          onClick={next}
          aria-label="Next track"
          className="hidden h-10 w-10 shrink-0 items-center justify-center border border-line text-text transition-colors duration-300 hover:border-acid-type sm:flex"
        >
          <SkipForward size={14} />
        </button>

        <button
          type="button"
          onClick={() => seek(0)}
          aria-label="Restart track"
          className="sr-only"
        />

        <button
          type="button"
          onClick={stop}
          aria-label="Close player"
          className="flex h-10 w-10 shrink-0 items-center justify-center border border-line text-mute transition-colors duration-300 hover:border-acid-type hover:text-text"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
