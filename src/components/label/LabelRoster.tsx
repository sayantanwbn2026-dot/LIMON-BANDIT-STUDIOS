import { useState } from "react";
import { Play } from "lucide-react";
import { CmsImage } from "@/components/lb/CmsImage";
import { BoundaryRule, GridRules } from "@/components/lb/GridRules";
import { Eyebrow } from "@/components/lb/Section";
import { trackForArtist } from "@/data/tracks";
import { usePlayer } from "@/lib/player";
import { useReleases } from "@/cms/hooks";

/**
 * The roster as a drafting index rather than a wall of covers. Hovering or
 * focusing a row pins that release's plate in the right column — the same
 * sticky-visual pattern the landing page uses for the rooms, deliberately,
 * because a second pattern for the same job would be noise.
 */
export function LabelRoster() {
  const releases = useReleases();
  const [hover, setHover] = useState(0);
  const { play, track, playing } = usePlayer();
  const shown = releases[hover];

  return (
    <section className="relative w-full bg-surface-deep py-[96px]">
      <GridRules tone="dark" />
      <BoundaryRule tone="dark" className="top-0" />

      <div className="shell relative z-[2]">
        <Eyebrow tone="dark" surface="bg-surface-deep">
          Who we put out
        </Eyebrow>
        <h2 className="t-h2 mt-6 max-w-[20ch] text-text">The roster</h2>

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_360px] lg:gap-12">
          <ol className="border-t border-line">
            {releases.map((r, i) => {
              const t = trackForArtist(r.artist);
              const isPlaying = t && track?.id === t.id && playing;
              return (
                <li key={r.title}>
                  <div
                    onMouseEnter={() => setHover(i)}
                    onFocus={() => setHover(i)}
                    className="flex items-center gap-6 border-b border-line py-6 transition-colors duration-300 hover:bg-surface-raised"
                  >
                    <span className="tnum font-ui text-[11px] font-bold uppercase tracking-[0.18em] text-acid-type">
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-[20px] font-extrabold uppercase leading-[1.1] tracking-[-0.02em] text-text md:text-[24px]">
                        {r.artist}
                      </span>
                      <span className="mt-1 block truncate font-ui text-[13px] text-mute">
                        {r.title}
                      </span>
                    </span>

                    <span className="t-label hidden w-[120px] shrink-0 text-mute md:block">
                      {r.genre}
                    </span>
                    <span className="tnum hidden w-[56px] shrink-0 font-ui text-[12px] text-mute sm:block">
                      {r.year}
                    </span>

                    {t ? (
                      <button
                        type="button"
                        onClick={() => play(t.id)}
                        aria-label={`Play ${r.title} by ${r.artist}`}
                        className="flex h-9 w-9 shrink-0 items-center justify-center border border-line text-text transition-colors duration-300 hover:border-acid-type"
                      >
                        <Play
                          size={12}
                          className={isPlaying ? "fill-acid-type text-acid-type" : ""}
                        />
                      </button>
                    ) : (
                      <span
                        className="t-label w-9 shrink-0 text-right text-mute"
                        aria-hidden="true"
                      >
                        —
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          {/* the pinned plate */}
          <div className="hidden lg:block">
            <div className="sticky top-[14vh]">
              <CmsImage
                src={shown.cover}
                alt={shown.alt}
                sizes="360px"
                className="aspect-square w-full border border-line object-cover chroma"
              />
              <div className="mt-4 flex items-baseline justify-between gap-4">
                <span className="font-display text-[15px] font-bold uppercase tracking-[-0.01em] text-text">
                  {shown.title}
                </span>
                <span className="tnum font-ui text-[12px] text-mute">{shown.runtime}</span>
              </div>
              <p className="t-label mt-1 text-mute">{shown.artist}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
