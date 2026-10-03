/**
 * Loading placeholders shaped like the thing that is coming.
 *
 * WHY, rather than the word "Loading…"
 * Eight screens — your orders, every admin list, the insights tiles — put a
 * single line of 11px grey type where a table was about to appear, and then
 * replaced it with 400px of content. Two things are wrong with that. The
 * screen reads as empty right up to the moment it reads as full, so a slow
 * connection looks like a broken page rather than a working one; and
 * everything below jumps when the real rows land. A placeholder the same
 * shape as the answer removes both: the layout is already correct before the
 * data arrives, so nothing moves, and the shape itself tells you what is
 * coming.
 *
 * WHAT A SCREEN READER GETS
 * None of this. The blocks are decorative, so they are `aria-hidden`, and
 * the caller passes `label` once — rendered into a `role="status"` line that
 * is visually hidden. Announcing "Loading your orders" beats announcing
 * fourteen empty boxes, and `status` is polite, so it waits for a pause
 * rather than interrupting whatever is being read.
 *
 * THE SHIMMER
 * A travelling highlight, not a pulse. A pulse fades the whole block in and
 * out, which on a dark surface reads as a flicker; a sweep reads as "work in
 * progress" and is the convention people already know. It is one keyframe on
 * a background gradient — no JS, no layout work, so it costs nothing while
 * the main thread is busy with the fetch it is covering.
 *
 * Under `prefers-reduced-motion` the sweep stops and the block holds a flat
 * tint. It must still be VISIBLE in that case: the point is to show that
 * something is coming, and an invisible placeholder is just a gap. Animation
 * is the part that is optional, not the placeholder.
 */

/** One block. `w` and `h` take any CSS length — these are shapes, not type. */
export function Skeleton({
  w = "100%",
  h = 14,
  className,
  radius = "var(--r-control)",
}: {
  w?: string | number;
  h?: string | number;
  className?: string;
  radius?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`lb-skeleton block ${className ?? ""}`}
      style={{ width: w, height: h, borderRadius: radius }}
    />
  );
}

/**
 * A paragraph's worth of lines, the last one short.
 *
 * The short last line is not decoration — equal-length bars read as a chart
 * or a table, and the ragged edge is what makes the shape say "prose".
 */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <span className={`flex flex-col gap-2 ${className ?? ""}`}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} h={12} w={i === lines - 1 ? "62%" : "100%"} />
      ))}
    </span>
  );
}

/**
 * The standard list placeholder: a label on the left, a figure on the right,
 * on the house's ruled rows. This is the shape of nearly every list in the
 * admin and of the order list on the site, which is why it is one component
 * rather than four hand-built stacks.
 *
 * The widths alternate rather than repeat. Identical rows read as a loading
 * GIF — a thing that is stuck — and a little variance reads as real content
 * that happens to be blurred.
 */
export function SkeletonRows({
  rows = 5,
  label,
  figure = true,
  className,
}: {
  rows?: number;
  /** Announced once, politely. Say what is loading: "your orders", not "data". */
  label: string;
  figure?: boolean;
  className?: string;
}) {
  const widths = ["72%", "54%", "63%", "45%", "68%", "50%"];
  return (
    <div className={`border-t border-line ${className ?? ""}`}>
      <span className="sr-only" role="status">
        Loading {label}
      </span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 border-b border-line py-4">
          <Skeleton w={widths[i % widths.length]} h={13} />
          {figure ? <Skeleton w={52} h={13} className="shrink-0" /> : null}
        </div>
      ))}
    </div>
  );
}

/**
 * The grid of figures at the top of the insights screen.
 *
 * `label` is OPTIONAL here, unlike on the rows, because this grid is used
 * twice in a row on one screen. One announcement per region is the right
 * amount; two identical "Loading the figures" a line apart is the screen
 * reader equivalent of saying it twice, so the second grid is passed none
 * and stays silent.
 */
export function SkeletonStats({ count = 4, label }: { count?: number; label?: string }) {
  return (
    <div className="grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
      {label ? (
        <span className="sr-only" role="status">
          Loading {label}
        </span>
      ) : null}
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="bg-surface-deep p-5">
          <Skeleton w="58%" h={10} />
          <Skeleton w="42%" h={24} className="mt-3" />
        </div>
      ))}
    </div>
  );
}
