const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/**
 * The screen: film grain, then a CRT ruling over it.
 *
 * Opacity and blend mode live in CSS so they can follow the theme.
 *
 * The scanline sits in its own layer *under* the grain rather than in the
 * same element, because the grain is blended (overlay in dark, multiply in
 * light) and a ruling pushed through that blend either disappears or goes
 * harsh depending on the theme. Separate layers keep it at one weight in
 * both. It is one pixel every three, at under 3% alpha — read as a screen
 * rather than seen as stripes.
 */
export function Noise() {
  return (
    <>
      <div aria-hidden="true" className="lb-scanlines pointer-events-none fixed inset-0 z-[9997]" />
      <div
        aria-hidden="true"
        className="lb-noise pointer-events-none fixed inset-0 z-[9998]"
        style={{ backgroundImage: NOISE }}
      />
    </>
  );
}
