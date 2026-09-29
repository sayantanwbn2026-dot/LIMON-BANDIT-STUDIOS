/**
 * One button, four voices, three sizes.
 *
 * There were sixty-eight hand-rolled buttons in this codebase and about
 * twenty distinct class strings describing the same shape. That is not an
 * aesthetic problem, it is where the bugs came from: the 36px play
 * controls on the label page, the 40px category chips, three separate
 * places that greyed a control out to mean "not yet". Every one of those
 * was written by someone reasonable, one component at a time, with no
 * shared definition to be wrong about.
 *
 * So the rules live here instead of in sixty-eight opinions.
 *
 * THE SMALLEST SIZE IS 44px, AND THERE IS NO SMALLER ONE.
 * `sm` is not 32 or 36. A fingertip is 44 and the site now clears that
 * everywhere, so the API simply cannot express a target that fails —
 * which is a better guarantee than my remembering to check.
 *
 * NOTHING HERE HAS A DISABLED VARIANT THAT MEANS "NOT YET".
 * `disabled` is for a control that is genuinely inert — a submit already
 * in flight, a quantity at the stock ceiling. For "you have not picked a
 * size", keep the button live and answer the press; that pattern is in
 * ProductPage and ProductSheet and it is the house rule.
 *
 * `buttonClass` exists because TanStack's <Link> carries typed `to` and
 * `params` that a wrapper would have to re-declare and get wrong. A Link
 * takes the class instead: <Link to="/shop" className={buttonClass()}>.
 */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

/* Heights, not paddings — a row of buttons has to line up, and padding
 * plus line-height does not survive a label wrapping to two words. */
const SIZES: Record<ButtonSize, string> = {
  sm: "h-11 px-4 text-[11px] tracking-[0.12em]",
  md: "h-[52px] px-6 text-[12px] tracking-[0.14em]",
  lg: "h-[56px] px-8 text-[13px] tracking-[0.14em]",
};

/* `fill-acid` and the `border` hook drive the existing edge-light and
 * press effects in styles.css, so a button built here inherits the
 * site's physics for free rather than reimplementing them. */
const VARIANTS: Record<ButtonVariant, string> = {
  primary: "fill-acid bg-acid text-accent-text hover:bg-acid-dim",
  secondary: "border border-line-strong bg-transparent text-text hover:border-acid-type",
  ghost: "border border-transparent bg-transparent text-mute hover:text-text",
  /* Destructive work is the one place the house's yellow cannot speak —
   * see the note on --danger. Outlined rather than filled by default:
   * a wall of coral is an alarm, and most destructive buttons are
   * sitting quietly next to something you actually meant to press. */
  danger: "border border-danger bg-transparent text-danger hover:bg-danger hover:text-danger-ink",
};

const BASE =
  "inline-flex shrink-0 items-center justify-center gap-2 text-center font-ui font-bold uppercase " +
  "transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-40";

export function buttonClass({
  variant = "primary",
  size = "md",
  full = false,
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** run to the measure — the right answer on a phone, rarely on a desktop */
  full?: boolean;
  className?: string;
} = {}) {
  return [BASE, SIZES[size], VARIANTS[variant], full ? "w-full" : "", className]
    .filter(Boolean)
    .join(" ");
}
