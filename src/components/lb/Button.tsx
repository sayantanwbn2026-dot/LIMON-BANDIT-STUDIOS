import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { buttonClass, type ButtonSize, type ButtonVariant } from "@/lib/button";

/**
 * The button components. The rules they follow — the variants, the sizes,
 * and why the smallest one is 44px — live in @/lib/button beside
 * `buttonClass`, because a router <Link> needs the class without the
 * component and this file may only export components (react-refresh).
 */

type Common = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  children: ReactNode;
};

/**
 * The busy state says so TWICE, and that is not redundancy.
 *
 * The stylesheet kills animation globally under prefers-reduced-motion
 * (`animation-duration: 0.001ms !important`), so a spinner on its own
 * leaves those users with a frozen icon and a button that looks like it
 * did nothing. The label carries the meaning, the spinner carries the
 * liveness, and either one alone fails somebody.
 */
function Busy({ label }: { label: ReactNode }) {
  return (
    <>
      <Loader2 size={15} className="shrink-0 animate-spin" aria-hidden="true" />
      {label}
    </>
  );
}

export function Button({
  variant,
  size,
  full,
  className,
  children,
  loading = false,
  loadingLabel = "Working…",
  disabled,
  ...rest
}: Common &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    /** an action is in flight — shows the spinner and blocks a second press */
    loading?: boolean;
    loadingLabel?: ReactNode;
  }) {
  return (
    <button
      type="button"
      {...rest}
      /* aria-busy as well as disabled: the control keeps its name, and
       * assistive tech is told the state rather than inferring it from a
       * dead element. */
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={buttonClass({ variant, size, full, className })}
    >
      {loading ? <Busy label={loadingLabel} /> : children}
    </button>
  );
}

/** For a plain <a>. A router link takes `buttonClass()` on its own. */
export function ButtonLink({
  variant,
  size,
  full,
  className,
  children,
  ...rest
}: Common & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a {...rest} className={buttonClass({ variant, size, full, className })}>
      {children}
    </a>
  );
}
