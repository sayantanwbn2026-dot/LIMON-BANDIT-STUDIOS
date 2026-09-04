import type { CSSProperties } from "react";
import { Picture } from "./Picture";
import { resolveImage } from "@/cms/media";
import type { ImageKey } from "@/generated/images";

/**
 * An image whose source is whatever the CMS holds.
 *
 * Three cases, and keeping all three working is what let the CMS ship without
 * re-encoding the existing artwork:
 *
 *   - a **manifest key** (`"room-a"`) renders through `<Picture>` exactly as
 *     before, with the build-time AVIF/WebP variants and the measured
 *     width/height that hold CLS at zero
 *   - an **uploaded or pasted URL** renders as a plain `<img>`, because there
 *     are no variants to offer — it was uploaded, not built
 *   - **empty** renders nothing rather than a broken image icon
 *
 * So a section an editor has never touched keeps the optimised pipeline, and
 * only the images actually replaced fall back to a single file. That is the
 * right way round: the common case stays fast, and the cost lands only where
 * someone chose to change something.
 */
export function CmsImage({
  src,
  alt,
  sizes,
  className,
  style,
  priority,
  /** used for the plain-<img> case, where nothing knows the real ratio */
  width,
  height,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  style?: CSSProperties;
  priority?: boolean;
  width?: number;
  height?: number;
}) {
  const resolved = resolveImage(src);

  if (resolved.kind === "none") return null;

  if (resolved.kind === "manifest") {
    return (
      <Picture
        src={resolved.key as ImageKey}
        alt={alt}
        sizes={sizes}
        className={className}
        style={style}
        priority={priority}
      />
    );
  }

  return (
    <img
      src={resolved.url}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      className={className}
      style={style}
    />
  );
}
