import { createContext, useContext, type ReactNode } from "react";

export type Tone = "dark" | "light" | "acid";

/* Acid is theme-independent, so its rules stay literal. The other two
 * tones read their pole's token and therefore invert with the theme. */
export const ruleColor: Record<Tone, string> = {
  dark: "var(--grid-rule)",
  light: "var(--alt-grid-rule)",
  acid: "rgba(0,0,0,0.08)",
};

export const solidRuleColor: Record<Tone, string> = {
  dark: "var(--line)",
  light: "var(--alt-line)",
  acid: "rgba(0,0,0,0.28)",
};

const crosshairColor: Record<Tone, string> = {
  dark: "var(--line-strong)",
  light: "var(--alt-line-strong)",
  acid: "rgba(0,0,0,0.45)",
};

/**
 * The column rules — the drafting layer's vertical members.
 *
 * Solid now, not dashed, and faded out at both ends. A 4-on-6-off dash is a
 * draughtsman's construction line: it says "this page is a working
 * drawing", which is the editorial voice this pass steps away from. A
 * continuous hairline that dissolves into the section edges keeps the grid
 * as quiet structure — you sense the columns, you do not read them.
 */
const FADE = "linear-gradient(to bottom, transparent, #000 18%, #000 82%, transparent)";

/**
 * Which column rules a GridRules draws.
 *
 * `all` is the full drafting grid: the two edges and the quarters. It
 * belongs where the content is laid out on those quarters or sits on
 * opaque plates (the landing page's cards), so a rule either lands on an
 * edge of the content or disappears behind it.
 *
 * `edges` keeps the frame and drops the quarters. Inner pages are ledgers,
 * comparison tables, three-column term rows and forms — transparent cells
 * with dividers of their own at thirds, halves and gutters — and a quarter
 * rule running 20–120px beside one of those dividers is two lines where
 * the eye expects one (measured: every inner page had them, the landing
 * page none that showed). The frame still says "drawing"; the content's own
 * rules do the rest.
 *
 * `inner` is the quarters alone, for a stage inside a frame that already
 * draws the edges, so no edge is drawn twice.
 */
export type GridCols = "all" | "edges" | "inner";

const GridColsContext = createContext<GridCols>("all");

/** Sets the default for every GridRules below it; a `cols` prop still wins. */
export function GridColsProvider({ cols, children }: { cols: GridCols; children: ReactNode }) {
  return <GridColsContext.Provider value={cols}>{children}</GridColsContext.Provider>;
}

const EDGE = new Set([0, 100]);

export function GridRules({ tone = "dark", cols }: { tone?: Tone; cols?: GridCols }) {
  const color = ruleColor[tone];
  const inherited = useContext(GridColsContext);
  const mode = cols ?? inherited;
  const stops = [0, 25, 50, 75, 100].filter((left) =>
    mode === "edges" ? EDGE.has(left) : mode === "inner" ? !EDGE.has(left) : true,
  );

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1]">
      <div className="shell-rules mx-auto h-full">
        <div className="relative h-full">
          {stops.map((left) => (
            <span
              key={left}
              data-col-rule
              className={
                left === 25 || left === 75
                  ? "absolute top-0 hidden h-full w-px origin-top md:block"
                  : "absolute top-0 h-full w-px origin-top"
              }
              style={{
                left: `${left}%`,
                background: color,
                maskImage: FADE,
                WebkitMaskImage: FADE,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * A single drafting crosshair: two crossing 9px strokes.
 *
 * Hidden. Crosshairs at every column intersection were registration marks —
 * print furniture — and they are the loudest piece of the "working drawing"
 * look. Kept in the DOM, with `hidden`, because the hero timeline targets
 * their tick layer by selector; removing them would leave it tweening
 * nothing and warning about it.
 */
export function Crosshair({ tone = "dark", active = false }: { tone?: Tone; active?: boolean }) {
  const c = active ? "var(--accent)" : crosshairColor[tone];
  /* Strokes inherit `currentColor` so the whole crosshair can be ticked by
   * animating one property on the root — the hero scrubs these in sequence,
   * and keeping it a var() (not a resolved hex) means a mid-scene theme
   * switch still resolves live. */
  return (
    <span
      data-crosshair
      aria-hidden="true"
      className="pointer-events-none absolute hidden h-[9px] w-[9px]"
      style={{
        color: c,
        transform: "translate(-4.5px, -4.5px)",
        transition: "color 0.4s var(--ease-out-expo)",
      }}
    >
      <span
        className="absolute left-0 top-1/2 h-px w-full"
        style={{ background: "currentColor" }}
      />
      <span
        className="absolute left-1/2 top-0 h-full w-px"
        style={{ background: "currentColor" }}
      />
      {/* Acid tick layer. Kept as a separate element driven by opacity so a
       * scrubbed timeline can stagger it — animating `color` would both
       * break scrubbing (GSAP cannot tween to a var()) and step outside
       * transform/opacity/filter. */}
      <span data-crosshair-tick className="absolute inset-0 block opacity-0">
        <span className="absolute left-0 top-1/2 h-px w-full bg-acid" />
        <span className="absolute left-1/2 top-0 h-full w-px bg-acid" />
      </span>
    </span>
  );
}

/**
 * Full-bleed horizontal boundary rule with five crosshairs at the column
 * intersections. `active` ticks the crosshairs over to acid.
 */
export function BoundaryRule({
  tone = "dark",
  active = false,
  ticks = false,
  className,
}: {
  tone?: Tone;
  active?: boolean;
  /** hero-only: minor ruler ticks every 1/20th of the width */
  ticks?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute left-0 right-0 z-[3] ${className ?? ""}`}
    >
      <span
        className="absolute left-0 right-0 top-0 block h-px"
        style={{ background: solidRuleColor[tone] }}
      />
      {ticks ? (
        <div className="absolute left-0 right-0 top-0 h-[9px]">
          {Array.from({ length: 21 }, (_, i) => (
            <span
              key={i}
              className="absolute top-0 w-px"
              style={{
                left: `${i * 5}%`,
                height: i % 5 === 0 ? 9 : 5,
                background: solidRuleColor[tone],
                opacity: i % 5 === 0 ? 0.55 : 0.3,
              }}
            />
          ))}
        </div>
      ) : null}
      <div className="shell-rules mx-auto">
        <div className="relative">
          {[0, 25, 50, 75, 100].map((left, i) => (
            <span
              key={left}
              className={i === 1 || i === 3 ? "absolute top-0 hidden md:block" : "absolute top-0"}
              style={{ left: `${left}%` }}
            >
              <Crosshair tone={tone} active={active} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
