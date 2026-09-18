import { useEffect, useRef, useState, type ReactNode } from "react";
import { BoundaryRule, GridRules, type Tone } from "./GridRules";
import { ensureGsap } from "@/lib/motion";

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
      {index && name ? <MarginNotes index={index} name={name} tone={tone} /> : null}
      <div className="shell relative z-[2]">{children}</div>
    </Tag>
  );
}

/**
 * Rotated drafting annotations in the outer margins.
 *
 * Retired, not deleted. "SEC.04 / SERVICES" running up the gutter is the
 * most editorial device on the site — the page captioning its own layout —
 * and the one that did the least for a visitor. The call sites stay so the
 * annotations can come back from one place if the direction ever swings
 * back; `MARGIN_NOTES` is that place.
 */
const MARGIN_NOTES = false;

export function MarginNotes(props: { index: string; name: string; tone?: Tone }) {
  return MARGIN_NOTES ? <MarginNotesDrawn {...props} /> : null;
}

function MarginNotesDrawn({
  index,
  name,
  tone = "dark",
}: {
  index: string;
  name: string;
  tone?: Tone;
}) {
  /* The notes sit on the section's own pole, so on an inverted chapter they
   * have to follow it — primary-pole mute on a bone surface is unreadable. */
  const tint =
    tone === "light" ? "text-alt-mute" : tone === "acid" ? "text-accent-text" : "text-mute";
  const base = `pointer-events-none absolute top-1/2 z-[3] hidden -translate-y-1/2 font-ui text-[10px] font-semibold uppercase tracking-[0.16em] ${tint} xl:block`;
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

/** Eyebrow — the small signpost above a section heading. */
export function Eyebrow({
  children,
  tone = "dark",
}: {
  children: ReactNode;
  tone?: Tone;
  notch?: boolean;
  surface?: string;
}) {
  /* Type on the opposite pole must follow that pole (it inverts with the
   * theme); type on acid must not (acid is fixed in both themes). */
  const tint =
    tone === "dark" ? "text-mute" : tone === "light" ? "text-alt-text" : "text-accent-text";
  return (
    /* The notch — a surface-coloured patch meant to cut the eyebrow into the
     * section's boundary rule — is no longer painted. The eyebrow sits a
     * full section-padding below that rule, so the patch never met a line;
     * on a section whose ground is --surface-deep it showed as a lighter
     * box behind the label. `notch` and `surface` are still accepted so
     * no call site has to change. */
    <div className="inline-flex items-center gap-2.5">
      {/* A small acid dot, no halo. It was a glowing 10px square with a
       * scramble-decoded label beside it — a terminal booting up at the top
       * of every section. The dot keeps the one piece of colour that ties
       * the headers together; the glow and the glyph noise are gone. */}
      <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-acid" />
      <span className={`t-eyebrow ${tint}`}>{children}</span>
    </div>
  );
}
