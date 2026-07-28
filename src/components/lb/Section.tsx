import { useEffect, useRef, useState, type ReactNode } from "react";
import { BoundaryRule, GridRules, type Tone } from "./GridRules";
import { ensureGsap } from "@/lib/motion";
import { Decode } from "./Decode";

const bg: Record<Tone, string> = {
  dark: "bg-surface-deep",
  light: "bg-alt-surface",
  acid: "bg-acid",
};

export function Section({
  children,
  tone = "dark",
  surface,
  className,
  id,
  index,
  name,
  as: Tag = "section",
}: {
  children: ReactNode;
  tone?: Tone;
  /** override the background class (e.g. bg-surface for the mid-dark surface) */
  surface?: string;
  className?: string;
  id?: string;
  /** drafting index, e.g. "04" */
  index?: string;
  /** drafting name, e.g. "SERVICES" */
  name?: string;
  as?: "section" | "footer" | "div";
}) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const gsap = ensureGsap();
    if (!gsap) return;
    const ctx = gsap.context(() => {
      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        ScrollTrigger.create({
          trigger: el,
          start: "top 50%",
          end: "bottom 50%",
          onToggle: (self) => setActive(self.isActive),
        });
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <Tag
      ref={ref as never}
      id={id}
      className={`relative w-full ${surface ?? bg[tone]} ${className ?? ""}`}
    >
      <BoundaryRule tone={tone} active={active} className="top-0" />
      <GridRules tone={tone} />
      {index && name ? <MarginNotes index={index} name={name} /> : null}
      <div className="shell relative z-[2]">{children}</div>
    </Tag>
  );
}

/** Rotated drafting annotations in the outer margins. */
export function MarginNotes({ index, name }: { index: string; name: string }) {
  const base =
    "pointer-events-none absolute top-1/2 z-[3] hidden -translate-y-1/2 font-ui text-[10px] font-semibold uppercase tracking-[0.16em] text-mute xl:block";
  const style: React.CSSProperties = {
    writingMode: "vertical-rl",
    transform: "translateY(-50%) rotate(180deg)",
    opacity: 0.55,
  };
  return (
    <div aria-hidden="true">
      <span className={base} style={{ ...style, left: 12 }}>
        SEC.{index} / {name}
      </span>
      <span className={base} style={{ ...style, right: 12 }}>
        LMN·BNDT / KOL / 2021
      </span>
    </div>
  );
}

/**
 * Eyebrow — riveted into the section's boundary rule via a notch:
 * surface-coloured background, 16px horizontal padding, pulled up half a line.
 */
export function Eyebrow({
  children,
  tone = "dark",
  notch = true,
  surface: surfaceOverride,
}: {
  children: ReactNode;
  tone?: Tone;
  notch?: boolean;
  surface?: string;
}) {
  const surface =
    surfaceOverride ?? (tone === "light" ? "bg-alt-surface" : tone === "acid" ? "bg-acid" : "bg-surface");
  /* Type on the opposite pole must follow that pole (it inverts with the
   * theme); type on acid must not (acid is fixed in both themes). */
  const tint =
    tone === "dark" ? "text-mute" : tone === "light" ? "text-alt-text" : "text-accent-text";
  return (
    <div
      className={`inline-flex items-center gap-3 ${notch ? `${surface} -ml-4 px-4 -mt-[0.5em]` : ""}`}
    >
      <span className="h-[10px] w-[10px] shrink-0 bg-acid" />
      {typeof children === "string" ? (
        <Decode text={children} className={`t-eyebrow ${tint}`} />
      ) : (
        <span className={`t-eyebrow ${tint}`}>{children}</span>
      )}
    </div>
  );
}
