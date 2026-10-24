import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Play } from "lucide-react";
import { BoundaryRule, GridRules } from "@/components/lb/GridRules";
import { Eyebrow } from "@/components/lb/Section";
import { WordReveal } from "@/components/lb/Reveal";
import { CmsImage } from "@/components/lb/CmsImage";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";
import { embedOf, sourcesOf } from "@/lib/video";
import { useFeaturedVideos, useSection, type VideoDoc } from "@/cms/hooks";
import { VideoTheater } from "./VideoTheater";

/**
 * Three to watch — the label's featured films, as cards.
 *
 * Which three is the editor's call: Label → Music videos in the admin, tick
 * "Feature", and the first three ticked in list order are these cards. Untick
 * them all and the section steps off the page rather than leaving a heading
 * over nothing.
 *
 * THE CARD is the house card (ui-card, the 4:5 frame, the acid rank in the
 * corner, the hairline above the action) so a film sits in the same family
 * as a room, a tee or a release. What it adds is that it is alive: under a
 * mouse the artwork gives way to the film itself, silent and looping, from
 * the lightest encode there is — a trailer that costs nothing until someone
 * shows interest. Pressing it opens the theatre (VideoTheater), which grows
 * out of the card.
 *
 * THE SCROLL. Three movements, all scrubbed so they belong to the hand:
 * each card rises and unclips from the bottom as it arrives, staggered
 * across the row; the artwork drifts inside its frame a little slower than
 * the page; and the house's embossed giant type runs behind the row in the
 * opposite direction — "ON SCREEN", at the emboss contrast the footer uses,
 * a form you feel before you read it. Desktop and motion-allowed only; a
 * phone gets the swipe rail every other row on this site uses.
 */
export function LabelVideos() {
  const copy = useSection("label", "videos");
  const films = useFeaturedVideos();
  const root = useRef<HTMLElement>(null);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);
  const [open, setOpen] = useState<{ index: number; origin: DOMRect | null } | null>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || films.length === 0) return;
    const gsap = ensureGsap();
    if (!gsap) return;

    const mm = gsap.matchMedia(el);
    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      gsap.utils.toArray<HTMLElement>("[data-vid-card]", el).forEach((card, i) => {
        gsap.fromTo(
          card,
          { y: 96, opacity: 0.35, clipPath: "inset(18% 0% 0% 0%)" },
          {
            y: 0,
            opacity: 1,
            clipPath: "inset(0% 0% 0% 0%)",
            ease: "none",
            scrollTrigger: {
              trigger: card,
              start: "top bottom",
              end: `top ${64 - i * 5}%`,
              scrub: 0.8,
            },
          },
        );
        const media = card.querySelector("[data-vid-media]");
        if (media) {
          gsap.fromTo(
            media,
            { yPercent: -6 },
            {
              yPercent: 6,
              ease: "none",
              scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        }
      });

      gsap.fromTo(
        "[data-vid-ghost]",
        { xPercent: 4 },
        {
          xPercent: -22,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.6 },
        },
      );
    });
    return () => mm.revert();
  }, [films.length]);

  const openAt = (index: number) => {
    setOpen({ index, origin: cards.current[index]?.getBoundingClientRect() ?? null });
  };

  const originOf = useCallback(
    (i: number) => cards.current[i]?.getBoundingClientRect() ?? null,
    [],
  );
  const onIndex = useCallback((i: number) => setOpen((o) => (o ? { ...o, index: i } : o)), []);
  const onClose = useCallback(() => {
    setOpen((o) => {
      /* Back to the card that was pressed, for the keyboard and the
       * screen reader — the theatre had the focus. */
      if (o) triggers.current[o.index]?.focus({ preventScroll: true });
      return null;
    });
  }, []);

  if (films.length === 0) return null;

  return (
    <section
      ref={root}
      id="films"
      className="relative w-full overflow-hidden bg-surface-deep pt-[96px] pb-[96px] md:pt-[120px] md:pb-[clamp(150px,13vw,230px)]"
    >
      <GridRules tone="dark" />
      <BoundaryRule tone="dark" className="top-0" />

      {/* The embossed giant type, running along the foot of the section and
       * cut by its bottom edge — the footer's wordmark device. It sits in its
       * own band under the cards rather than behind them: behind, the cards
       * covered all but the 24px gutters, and the slivers of letter showing
       * between them read as a rendering fault rather than as type. */}
      <span
        data-vid-ghost
        aria-hidden="true"
        className="t-giant pointer-events-none absolute bottom-[-0.2em] left-0 z-[1] hidden select-none whitespace-nowrap md:block"
        style={{ color: "var(--emboss-deep)", fontSize: "clamp(150px, 16vw, 280px)" }}
      >
        On screen · On screen · On screen
      </span>

      <div className="shell relative z-[2]">
        <div className="section-head">
          <div className="md:col-span-1">
            <Eyebrow tone="dark">{copy.eyebrow}</Eyebrow>
          </div>
          <div className="md:col-span-2">
            <WordReveal as="h2" className="t-h2 text-text" text={copy.heading} />
          </div>
          <div className="flex items-end md:col-span-1">
            <p className="section-lede font-ui text-[15px] leading-[1.5] text-mute">
              {copy.standfirst}
            </p>
          </div>
        </div>

        <ul
          className="rail-mobile mt-14 grid grid-cols-1 gap-6 md:mt-16 md:grid-cols-3"
          style={{ ["--rail-h" as string]: "auto" }}
        >
          {films.map((f, i) => (
            <li key={`${f.title}-${i}`}>
              <FilmCard
                film={f}
                rank={i + 1}
                cardRef={(n) => {
                  cards.current[i] = n;
                }}
                triggerRef={(n) => {
                  triggers.current[i] = n;
                }}
                onOpen={() => openAt(i)}
              />
            </li>
          ))}
        </ul>
      </div>

      {open ? (
        <VideoTheater
          films={films}
          index={open.index}
          origin={open.origin}
          originOf={originOf}
          onIndex={onIndex}
          onClose={onClose}
        />
      ) : null}
    </section>
  );
}

function FilmCard({
  film,
  rank,
  cardRef,
  triggerRef,
  onOpen,
}: {
  film: VideoDoc;
  rank: number;
  cardRef: (n: HTMLElement | null) => void;
  triggerRef: (n: HTMLButtonElement | null) => void;
  onOpen: () => void;
}) {
  const sources = sourcesOf(film);
  const top = sources[0];
  /* the lightest encode makes the preview — it plays at card size */
  const preview = sources.at(-1);
  const embed = sources.length ? null : embedOf(film.embed);
  const video = useRef<HTMLVideoElement>(null);
  const [live, setLive] = useState(false);

  const badge = top
    ? top.q === 2160
      ? "4K"
      : `${top.q}p`
    : embed
      ? embed.kind === "youtube"
        ? "YouTube"
        : "Vimeo"
      : "";

  /* A silent loop under the mouse. Not on a touchscreen, where there is no
   * hover and a tap means "open"; not for anyone who has asked for less
   * motion; and not until the pointer arrives, so a page of three cards
   * downloads three images and no video. */
  const startPreview = () => {
    const v = video.current;
    if (!v || !preview || prefersReducedMotion()) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (!v.src) v.src = preview.src;
    void v.play().catch(() => {});
  };
  const stopPreview = () => {
    const v = video.current;
    setLive(false);
    if (!v) return;
    v.pause();
  };

  return (
    <article
      ref={cardRef}
      data-vid-card
      data-cursor="play"
      onPointerEnter={startPreview}
      onPointerLeave={stopPreview}
      className="ui-card group relative flex h-full flex-col overflow-hidden"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <div data-vid-media className="absolute inset-x-0 -inset-y-[7%]">
          <CmsImage
            src={film.cover}
            alt=""
            sizes="(max-width: 767px) 84vw, 33vw"
            className="chroma h-full w-full object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
          />
          {preview ? (
            <video
              ref={video}
              muted
              loop
              playsInline
              preload="none"
              aria-hidden="true"
              tabIndex={-1}
              onPlaying={() => setLive(true)}
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
              style={{ opacity: live ? 1 : 0 }}
            />
          ) : null}
        </div>

        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(5,5,5,0.7), rgba(5,5,5,0) 46%)" }}
        />

        {/* the rank, as on the home page's three cards */}
        <span className="tnum pointer-events-none absolute left-0 top-0 bg-surface-deep/85 px-3 py-1 font-ui text-[11px] font-bold uppercase tracking-[0.16em] text-acid-type">
          {String(rank).padStart(2, "0")}
        </span>

        {badge ? (
          <span
            className={`pointer-events-none absolute right-0 top-0 px-3 py-1 font-ui text-[10px] font-bold uppercase tracking-[0.16em] ${
              badge === "4K" ? "bg-acid text-accent-text" : "bg-surface-deep/85 text-text"
            }`}
          >
            {badge}
          </span>
        ) : null}

        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-text/40 bg-surface-deep/40 text-text backdrop-blur-sm transition-[background-color,border-color,color,opacity] duration-300 group-hover:border-acid group-hover:bg-acid group-hover:text-accent-text"
          style={{ opacity: live ? 0 : 1 }}
        >
          <Play size={20} className="translate-x-[2px] fill-current" />
        </span>

        {film.runtime ? (
          <span
            className="tnum pointer-events-none absolute bottom-0 right-0 px-3 py-2 font-ui text-[13px] font-bold uppercase tracking-[0.08em] text-text"
            style={{ background: "var(--scrim)" }}
          >
            {film.runtime}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col border-t border-line p-5">
        <span className="t-label text-mute">Music video{film.year ? ` · ${film.year}` : ""}</span>

        <h3 className="mt-2 font-display text-[22px] font-extrabold uppercase leading-[1.05] tracking-[-0.02em] text-text">
          {/* The one control, stretched over the whole card by its ::after, so
           * the card is a single target with a real <button> and a heading
           * that is still a heading. The focus ring is drawn on that ::after,
           * inside the card: an outline outside it would be cut away by the
           * clip-path the scroll reveal leaves on the card. */}
          <button
            ref={triggerRef}
            type="button"
            onClick={onOpen}
            aria-label={`Play ${film.title} by ${film.artist}`}
            className="text-left uppercase outline-none after:absolute after:inset-0 after:z-[5] after:content-[''] focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-acid"
          >
            {film.title}
          </button>
        </h3>

        <p className="mb-5 mt-2 font-ui text-[14px] leading-[1.5] text-mute">
          {film.artist}
          {film.director ? <span className="text-mute"> · Dir. {film.director}</span> : null}
        </p>

        <span className="mt-auto flex items-center gap-2 border-t border-line pt-4 font-ui text-[12px] font-bold uppercase tracking-[0.14em] text-text">
          <span className="wipe-underline">
            {top?.q === 2160 ? "Watch in 4K" : "Watch the film"}
          </span>
          <ArrowRight size={15} className="lb-arrow text-acid-type" />
        </span>
      </div>
    </article>
  );
}
