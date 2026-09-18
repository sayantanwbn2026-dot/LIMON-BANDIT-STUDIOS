import { useEffect, useId, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { lockScroll, unlockScroll } from "@/lib/smooth";

/**
 * Every popup on the site: the login gate, the cart, the wishlist, the flash
 * offer. One implementation, because the accessibility work is the same four
 * jobs each time and doing them four times is how three of them end up wrong.
 *
 *   - focus moves in on open and back to the opener on close
 *   - Tab is trapped inside while it is open
 *   - Escape closes, and so does the backdrop
 *   - the page behind stops scrolling (Lenis, via the site's counted lock)
 *
 * `lockScroll` is reference-counted, so a modal opening over the nav menu
 * cannot hand scrolling back when only one of them closes.
 *
 * Three shapes, all square-cornered per the house rules: `center` for asking
 * something, `drawer` for a list you work down the side of the screen, and
 * `sheet` for the detail of one thing — bottom-anchored on a phone, centred
 * once there is room.
 */
export function Modal({
  open,
  onClose,
  title,
  /** shown under the title, in mute */
  standfirst,
  children,
  variant = "center",
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  standfirst?: ReactNode;
  children: ReactNode;
  /**
   * `center` to ask something, `drawer` for a list worked down the side, and
   * `sheet` for detail about one thing on a phone — it rises from the bottom
   * edge, which is where a thumb already is, and becomes an ordinary centred
   * dialog once there is room for one.
   */
  variant?: "center" | "drawer" | "sheet";
  labelledBy?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const autoId = useId();
  const titleId = labelledBy ?? `modal-title-${autoId}`;

  useEffect(() => {
    if (!open) return;

    returnTo.current = document.activeElement as HTMLElement | null;
    lockScroll();

    const panel = panelRef.current;
    const focusables = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null);

    /* Prefer the first real control over the close button — landing on "X"
     * makes Enter dismiss the thing you just opened. */
    const first = focusables();
    const target = first.find((el) => !el.hasAttribute("data-modal-close")) ?? first[0];
    target?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      unlockScroll();
      returnTo.current?.focus?.();
    };
  }, [open, onClose]);

  const drawer = variant === "drawer";
  const sheet = variant === "sheet";

  /* A sheet rises; a centred dialog fades up a little. Both are y-only, so
   * the two share one transition and reduced-motion still gets the fade. */
  const motionProps = drawer
    ? { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } }
    : sheet
      ? {
          initial: { opacity: 0, y: 48 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: 48 },
        }
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: 16 },
        };

  const panelClass = drawer
    ? "absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col border-l border-line bg-surface-deep"
    : sheet
      ? /* Pinned to the bottom edge on a phone, centred from `sm` up. The
           safe-area inset keeps the last control clear of the home bar. */
        "absolute inset-x-0 bottom-0 flex max-h-[90svh] flex-col border-t border-line bg-surface-deep pb-[env(safe-area-inset-bottom,0px)] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[92svh] sm:w-[calc(100%-32px)] sm:max-w-[560px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:border sm:pb-0"
      : "absolute left-1/2 top-1/2 flex max-h-[92svh] w-[calc(100%-32px)] max-w-[520px] -translate-x-1/2 -translate-y-1/2 flex-col border border-line bg-surface-deep";

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[9997]" role="presentation">
          <motion.button
            type="button"
            aria-label="Close"
            tabIndex={-1}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-[2px]"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            {...motionProps}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className={panelClass}
          >
            <header
              className={`flex shrink-0 items-start justify-between gap-6 border-b border-line ${
                sheet ? "p-5 sm:p-8" : "p-6 sm:p-8"
              }`}
            >
              <div className="min-w-0">
                <h2
                  id={titleId}
                  className="font-display text-[20px] font-extrabold uppercase leading-[1.05] tracking-[-0.02em] text-text"
                >
                  {title}
                </h2>
                {standfirst ? (
                  <p className="mt-2 font-ui text-[13px] leading-[1.5] text-mute">{standfirst}</p>
                ) : null}
              </div>
              <button
                type="button"
                data-modal-close
                onClick={onClose}
                aria-label="Close"
                className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center border border-line text-mute transition-colors duration-300 hover:border-acid-type hover:text-text"
              >
                <X size={16} />
              </button>
            </header>

            {/* data-lenis-prevent is load-bearing, not a nicety.
             *
             * Opening a modal calls lockScroll(), which calls lenis.stop().
             * A stopped Lenis does not merely decline to scroll the page —
             * its virtual-scroll handler runs `if (this.isStopped) {
             * event.preventDefault() }` on every wheel and touchmove it
             * sees, anywhere in the document, including ones that started
             * inside this container. So the body below had the right CSS to
             * scroll and was never allowed to.
             *
             * On a desktop that was survivable, because the scrollbar is
             * still draggable. On a phone there is no scrollbar to drag, so
             * the sign-up form simply ended at whatever the fold cut off and
             * the Create account button could not be reached at all.
             *
             * Lenis checks for this attribute on the composed path and bails
             * out BEFORE the isStopped branch, which hands the element back
             * to native scrolling. It belongs on the scrolling body rather
             * than the panel: a drag on the header should still be swallowed,
             * or it would scroll the page behind the dialog.
             *
             * overscroll-contain stops that native scroll from chaining to
             * the page once it reaches either end.
             */}
            <div
              data-lenis-prevent
              className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${
                sheet ? "p-5 sm:p-8" : "p-6 sm:p-8"
              }`}
            >
              {children}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
