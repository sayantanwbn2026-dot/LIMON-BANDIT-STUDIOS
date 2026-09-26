import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { CmsImage } from "@/components/lb/CmsImage";

/**
 * The product gallery.
 *
 * Built to the shape people already know from every other shop (Jakob's
 * law): one large frame, a strip of thumbnails, and a closer look on click.
 * Deviating here buys nothing — a gallery is the one part of a product page
 * where being unsurprising is the whole job.
 *
 * Four rules it follows that the first version did not:
 *
 *   The frame is bounded. A square image in a 940px column was a picture
 *   taller than most laptops, so the price and the size picker beside it
 *   started below the fold. It is capped at 70% of the viewport height and
 *   keeps a 4:5 shape, which is the ratio the photographs are cut to.
 *
 *   Clicking it magnifies it where it is, rather than opening a dialog.
 *   A lightbox was the obvious answer and the wrong one: the dialog's own
 *   chrome meant the "enlarged" picture came out slightly SMALLER than the
 *   one on the page, on every screen size, which is worse than not offering
 *   it. Scaling in place gives a real 2.2×, and since the sources are
 *   1000px wide and drawn at about 500, that zoom is the photograph's own
 *   pixels rather than an upscale.
 *
 *   Thumbnails are 64px and spaced. Fitts's law: the cost of hitting a
 *   target grows as it shrinks, and a row of 40px squares on a phone is a
 *   row of missed taps.
 *
 *   The current frame is obvious. The selected thumbnail carries the acid
 *   border and `aria-current`; the others are dimmed until hovered, so
 *   "which one am I looking at" never needs working out.
 */
export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [shot, setShot] = useState(0);
  const [zoom, setZoom] = useState(false);
  /** Where in the picture to magnify, as percentages. */
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const stripRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    setShot(0);
    setZoom(false);
  }, [title]);

  const count = images.length;
  const go = (next: number) => {
    setShot(((next % count) + count) % count);
    setZoom(false);
  };

  /* Keep the chosen thumbnail in the strip. Arrow keys and the frame's own
   * arrows can walk past the edge of a scrolling row, and a selected
   * thumbnail you cannot see is worse than no strip at all. */
  useEffect(() => {
    const active = stripRef.current?.children[shot] as HTMLElement | undefined;
    active?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [shot]);

  /* Arrow keys move through the gallery once it has focus. */
  const onKey = (e: React.KeyboardEvent) => {
    if (count < 2) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(shot + 1);
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(shot - 1);
    }
  };

  /** Follow the pointer while magnified, so the zoom pans like a loupe. */
  const track = (e: React.MouseEvent<HTMLElement>) => {
    if (!zoom) return;
    const box = e.currentTarget.getBoundingClientRect();
    setOrigin({
      x: Math.min(100, Math.max(0, ((e.clientX - box.left) / box.width) * 100)),
      y: Math.min(100, Math.max(0, ((e.clientY - box.top) / box.height) * 100)),
    });
  };

  /* Where the press landed becomes the centre of the magnification — the
   * detail you pointed at is the detail you wanted to see. */
  const toggleZoom = (e: React.MouseEvent<HTMLElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    if (!zoom && box.width > 0) {
      setOrigin({
        x: Math.min(100, Math.max(0, ((e.clientX - box.left) / box.width) * 100)),
        y: Math.min(100, Math.max(0, ((e.clientY - box.top) / box.height) * 100)),
      });
    }
    setZoom((z) => !z);
  };

  return (
    <div onKeyDown={onKey}>
      <div className="group relative overflow-hidden border border-line bg-surface">
        <button
          type="button"
          onClick={toggleZoom}
          onMouseMove={track}
          onMouseLeave={() => setZoom(false)}
          aria-pressed={zoom}
          aria-label={zoom ? `Zoom out of ${title}` : `Zoom into ${title}`}
          className={`block w-full ${zoom ? "cursor-zoom-out" : "cursor-zoom-in"}`}
        >
          <CmsImage
            src={images[shot]}
            alt={`${title} — view ${shot + 1} of ${count}`}
            sizes="(max-width: 1023px) 100vw, 620px"
            priority={shot === 0}
            className="chroma aspect-[4/5] max-h-[70svh] w-full object-cover transition-transform duration-500"
            style={{
              transform: zoom ? "scale(2.2)" : "none",
              transformOrigin: `${origin.x}% ${origin.y}%`,
            }}
          />
        </button>

        <span className="pointer-events-none absolute bottom-3 right-3 hidden h-9 items-center gap-2 bg-surface-deep/85 px-3 font-ui text-[11px] font-semibold uppercase tracking-[0.1em] text-text opacity-0 transition-opacity duration-300 group-hover:opacity-100 lg:flex">
          {zoom ? (
            <>
              <ZoomOut size={13} /> Click to shrink
            </>
          ) : (
            <>
              <ZoomIn size={13} /> Click to magnify
            </>
          )}
        </span>

        {count > 1 ? (
          <>
            <Arrow side="left" onClick={() => go(shot - 1)} />
            <Arrow side="right" onClick={() => go(shot + 1)} />
            {/* Which frame of how many — the same count the thumbnails show,
             * for anyone who is swiping rather than looking at them. */}
            <span className="tnum pointer-events-none absolute left-3 top-3 bg-surface-deep/85 px-2 py-1 font-ui text-[11px] font-semibold text-text">
              {shot + 1}/{count}
            </span>
          </>
        ) : null}
      </div>

      {count > 1 ? (
        <ul ref={stripRef} className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1">
          {images.map((g, i) => (
            <li key={`${g}-${i}`} className="shrink-0">
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={`View ${i + 1} of ${count}`}
                aria-current={i === shot}
                className={`block h-16 w-16 border transition-opacity duration-300 ${
                  i === shot
                    ? "border-acid-type opacity-100"
                    : "border-line opacity-60 hover:opacity-100"
                }`}
              >
                <CmsImage
                  src={g}
                  alt=""
                  sizes="64px"
                  className="chroma h-full w-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** A 44px reach target: always there on a touch screen, on hover otherwise. */
function Arrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous image" : "Next image"}
      className={`absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-line bg-surface-deep/85 text-text transition-opacity duration-300 hover:border-acid-type focus-visible:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 ${
        side === "left" ? "left-3" : "right-3"
      }`}
    >
      {side === "left" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
    </button>
  );
}
