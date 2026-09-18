import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Magnetic } from "./Magnetic";

/** Two stacked labels inside a clip; hover rolls label B up into place. */
export function RollLabel({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={`relative block overflow-hidden ${className ?? ""}`}
      style={{ height: "1.2em" }}
    >
      <span
        data-roll
        className="block will-change-transform"
        style={{ transition: "transform 0.45s var(--ease-out-expo)" }}
      >
        <span className="block leading-[1.2]">{label}</span>
        <span className="block leading-[1.2]" aria-hidden="true">
          {label}
        </span>
      </span>
    </span>
  );
}

const rollCss = "[&:hover_[data-roll]]:-translate-y-1/2";

/** Primary square CTA — magnetic + label roll + arrow loop + stage light. */
export function CtaButton({
  label,
  to,
  href,
  className,
  width = 320,
  onClick,
}: {
  label: string;
  to?: string;
  href?: string;
  className?: string;
  width?: number;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <span
        data-mag-label
        className="pl-6 font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-text transition-colors duration-300 group-hover:text-accent-text"
      >
        <RollLabel label={label} />
      </span>
      <span className="lb-arrow-clip mr-6 shrink-0">
        <ArrowRight
          size={18}
          className="lb-arrow text-text transition-colors duration-300 group-hover:text-accent-text"
        />
      </span>
    </>
  );

  /* fill-acid replaces `hover:bg-acid` — same destination, but wiped across
   * from the left instead of crossfading the whole panel. The colour flip on
   * the label and icon is handled by the utility, so the group-hover text
   * variants inside `inner` are belt-and-braces rather than load-bearing. */
  const cls = `group fill-acid flex h-[56px] items-center justify-between border border-line bg-surface-raised transition-colors duration-300 ${rollCss} ${className ?? ""}`;

  return (
    <Magnetic className="inline-block">
      {to ? (
        <Link to={to} className={cls} style={{ width }} onClick={onClick}>
          {inner}
        </Link>
      ) : (
        <a href={href ?? "#"} className={cls} style={{ width }} onClick={onClick}>
          {inner}
        </a>
      )}
    </Magnetic>
  );
}

/** Secondary ghost link — underline wipe + ArrowUpRight. */
export function GhostLink({
  label,
  to,
  href,
  className,
  children,
}: {
  label?: string;
  to?: string;
  href?: string;
  className?: string;
  children?: ReactNode;
}) {
  const inner = (
    <>
      <span className="wipe-underline">{children ?? label}</span>
      <span className="lb-arrow-clip">
        <ArrowUpRight size={14} className="lb-arrow" />
      </span>
    </>
  );
  const cls = `group inline-flex items-center gap-2 font-ui text-[13px] font-bold uppercase tracking-[0.14em] ${className ?? "text-text"}`;
  return to ? (
    <Link to={to} className={cls}>
      {inner}
    </Link>
  ) : (
    <a href={href ?? "#"} className={cls}>
      {inner}
    </a>
  );
}
