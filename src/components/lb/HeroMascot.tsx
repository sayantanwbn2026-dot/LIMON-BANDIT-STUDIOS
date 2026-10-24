import { CmsImage } from "./CmsImage";
import { useHeroMascot, useHouseMascot } from "@/cms/hooks";
import type { ChapterKey } from "@/data/routes";

/**
 * The mascot on a hero's poster stage — whichever one the CMS says stands
 * on this chapter (see `pickMascot`).
 *
 * Only the picture lives here. The box he stands in stays in each hero, so
 * the home hero's scroll scene can keep its refs on it, and so swapping the
 * artwork can never move him: the box decides where he is, and the artwork
 * is object-contain inside it, exactly as the committed mascot always was.
 *
 * `priority` because at 52–68vh he is the largest paint on the page, so he
 * is the LCP; `sizes` tracks the box, or the browser picks a source half
 * the width he needs and he arrives soft. width/height are the committed
 * artwork's, and only reach an uploaded replacement, which has no measured
 * size of its own — the box, not the ratio, decides the layout either way.
 */
export function HeroMascot({ chapter }: { chapter: ChapterKey }) {
  const { src, alt } = useHeroMascot(chapter);
  return (
    <CmsImage
      src={src}
      alt={alt}
      sizes="(max-width: 767px) 90vw, (max-width: 1023px) 360px, 660px"
      priority
      width={1024}
      height={1169}
      className="block h-full w-full object-contain"
      style={{ filter: "saturate(0.92) drop-shadow(0 40px 80px var(--limon-shadow))" }}
    />
  );
}

/**
 * The house mascot as a faint mark — the menu, the footer, the help card.
 * Decorative, so it carries no description: he is already named by the
 * hero above, and reading him out three more times is noise.
 */
export function HouseMascot({ sizes, className }: { sizes: string; className?: string }) {
  const { src } = useHouseMascot();
  return (
    <CmsImage src={src} alt="" sizes={sizes} width={1024} height={1169} className={className} />
  );
}
