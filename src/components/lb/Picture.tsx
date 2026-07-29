import type { CSSProperties, ImgHTMLAttributes } from "react";
import { images, type ImageKey } from "@/generated/images";

const srcSet = (variants: readonly { w: number; url: string }[]) =>
  variants.map((v) => `${v.url} ${v.w}w`).join(", ");

/**
 * Every image on the site goes through here.
 *
 * The <picture> is `display: contents`, so the <img> is the layout box and
 * className/style land on it exactly as they did before this component
 * existed — the monochrome treatment (`mono`, `--img-brightness`) and every
 * existing utility keep working untouched.
 *
 * width/height come from the generated manifest rather than being hand-typed,
 * which is what holds CLS at zero: they are measured from the real file, so
 * they cannot drift from it.
 */
export function Picture({
  src,
  alt,
  sizes,
  className,
  style,
  priority = false,
  ...rest
}: {
  src: ImageKey;
  /** Empty string marks the image decorative; it also gets aria-hidden. */
  alt: string;
  /** Must describe the rendered box, or the browser picks the wrong variant. */
  sizes: string;
  className?: string;
  style?: CSSProperties;
  /** Above the fold on first paint. At most one per route. */
  priority?: boolean;
} & Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt" | "sizes" | "className" | "style" | "width" | "height" | "loading"
>) {
  const img = images[src];
  const decorative = alt === "";

  return (
    <picture style={{ display: "contents" }}>
      <source type="image/avif" srcSet={srcSet(img.avif)} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(img.webp)} sizes={sizes} />
      <img
        src={img.fallback}
        alt={alt}
        aria-hidden={decorative || undefined}
        width={img.width}
        height={img.height}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding={priority ? "sync" : "async"}
        className={className}
        style={style}
        {...rest}
      />
    </picture>
  );
}
