import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
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

export function Button({
  variant,
  size,
  full,
  className,
  children,
  ...rest
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...rest} className={buttonClass({ variant, size, full, className })}>
      {children}
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
