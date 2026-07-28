const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/** Opacity and blend mode live in CSS so they can follow the theme. */
export function Noise() {
  return (
    <div
      aria-hidden="true"
      className="lb-noise pointer-events-none fixed inset-0 z-[9998]"
      style={{ backgroundImage: NOISE }}
    />
  );
}
