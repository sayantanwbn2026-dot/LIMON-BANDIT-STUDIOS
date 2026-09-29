import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
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

  /* Enter and exit with CSS transitions rather than Framer Motion.
   *
   * This component is mounted on every page (login, cart, wishlist, flash
   * offer all live in __root), so its animation library was in the
   * first-paint bundle of every visit — for a fade and a slide. Now:
   * `rendered` keeps the dialog in the DOM through its exit, and `shown`
   * flips a frame after mount so the entry has a starting state to move
   * from. Global reduced-motion CSS shortens these transitions to nothing,
   * the same way it does for everything else on the site. */
  const [rendered, setRendered] = useState(open);
  const [shown, setShown] = useState(false);
  if (open && !rendered) setRendered(true);

  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(raf);
    }
    setShown(false);
    const t = window.setTimeout(() => setRendered(false), EXIT_MS);
    return () => window.clearTimeout(t);
  }, [open]);
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

  /* A drawer slides in from the right; a sheet rises; a centred dialog
   * fades up a little. `transform`, not `translate`: the centring classes
   * use Tailwind's `translate` property, and the two compose. */
  const hidden = drawer ? "translateX(100%)" : sheet ? "translateY(48px)" : "translateY(16px)";
  const panelStyle: CSSProperties = {
    transform: shown ? "none" : hidden,
    opacity: drawer || shown ? 1 : 0,
    transition: `transform ${EXIT_MS}ms cubic-bezier(0.16, 1, 0.3, 1), opacity ${EXIT_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
  };

  /* `ui-panel*` carries the radius and the one real shadow on the site —
   * this is the only place with a page visibly behind it to separate
   * from. The drawer and the sheet round only the edges they are NOT
   * attached to, or they would float off the screen. */
  const panelClass = drawer
    ? "ui-panel-drawer absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col border-l border-line bg-surface"
    : sheet
      ? /* Pinned to the bottom edge on a phone, centred from `sm` up. The
           safe-area inset keeps the last control clear of the home bar. */
        "ui-panel-sheet absolute inset-x-0 bottom-0 flex max-h-[90svh] flex-col border-t border-line bg-surface pb-[env(safe-area-inset-bottom,0px)] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[92svh] sm:w-[calc(100%-32px)] sm:max-w-[560px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:border sm:pb-0"
      : "ui-panel absolute left-1/2 top-1/2 flex max-h-[92svh] w-[calc(100%-32px)] max-w-[520px] -translate-x-1/2 -translate-y-1/2 flex-col border border-line bg-surface";

  return (
    <>
      {rendered ? (
        <div
          className="fixed inset-0 z-[9997]"
          role="presentation"
          /* While closing, the dialog is still on screen but must not catch
           * a click meant for the page underneath. */
          style={{ pointerEvents: open ? undefined : "none" }}
        >
          <button
            type="button"
            aria-label="Close"
            tabIndex={-1}
            onClick={onClose}
            style={{ opacity: shown ? 1 : 0, transition: "opacity 280ms ease" }}
            className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-[2px]"
          />

          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            style={panelStyle}
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
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Enter/exit duration, ms — the panel's transition and the unmount delay. */
const EXIT_MS = 420;
