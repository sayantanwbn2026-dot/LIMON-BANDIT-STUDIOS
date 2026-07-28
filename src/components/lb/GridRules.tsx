export type Tone = "dark" | "light" | "acid";

export const ruleColor: Record<Tone, string> = {
  dark: "rgba(255,255,255,0.12)",
  light: "rgba(0,0,0,0.12)",
  acid: "rgba(0,0,0,0.16)",
};

export const solidRuleColor: Record<Tone, string> = {
  dark: "var(--ink-line)",
  light: "var(--bone-line)",
  acid: "rgba(0,0,0,0.28)",
};

/**
 * The visible four-column dashed grid — the drafting layer's vertical members.
 */
export function GridRules({ tone = "dark" }: { tone?: Tone }) {
  const color = ruleColor[tone];

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1]">
      <div className="shell mx-auto h-full">
        <div className="relative h-full">
          {[0, 25, 50, 75, 100].map((left, i) => (
            <span
              key={left}
              data-col-rule
              className={
                i === 1 || i === 3
                  ? "absolute top-0 hidden h-full w-px origin-top md:block"
                  : "absolute top-0 h-full w-px origin-top"
              }
              style={{
                left: `${left}%`,
                backgroundImage: `repeating-linear-gradient(to bottom, ${color} 0 4px, transparent 4px 10px)`,
              }}

            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** A single drafting crosshair: two crossing 9px strokes. */
export function Crosshair({ tone = "dark", active = false }: { tone?: Tone; active?: boolean }) {
  const c = active ? "var(--acid)" : tone === "dark" ? "#2A2A2A" : "rgba(0,0,0,0.45)";
  return (
    <span aria-hidden="true" className="pointer-events-none absolute block h-[9px] w-[9px]" style={{ transform: "translate(-4.5px, -4.5px)" }}>
      <span
        className="absolute left-0 top-1/2 h-px w-full"
        style={{ background: c, transition: "background 0.4s var(--ease-out-expo)" }}
      />
      <span
        className="absolute left-1/2 top-0 h-full w-px"
        style={{ background: c, transition: "background 0.4s var(--ease-out-expo)" }}
      />
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
    <div aria-hidden="true" className={`pointer-events-none absolute left-0 right-0 z-[3] ${className ?? ""}`}>
      <span className="absolute left-0 right-0 top-0 block h-px" style={{ background: solidRuleColor[tone] }} />
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
      <div className="shell mx-auto">
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
