import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * One place for "that worked" and "that did not".
 *
 * There was no such place. Confirmation was invented per call site: a
 * button label flipping to "Added", a `role="status"` paragraph under a
 * form, a banner, a nudge, a chip that changes colour for two seconds.
 * Every one is reasonable on its own and together they mean the site has
 * no consistent way of answering you — and several actions (a wishlist
 * write, an admin save, a failed OTP send) answered with nothing at all.
 *
 * WHAT THIS IS NOT FOR
 * Anything the user must act on, and anything that has a natural home on
 * the page. A field's validation error belongs under that field, where
 * the eye already is and where it stays until fixed; the checkout's
 * failure notice belongs in the form, keeping everything they typed. A
 * toast leaves, so nothing that matters may live only here.
 *
 * It is for the transient half: saved, copied, added, removed, sent,
 * signed out, and the errors that are already recoverable by trying
 * again.
 *
 * ACCESSIBILITY
 * Two regions, not one. Polite for confirmations, so a screen reader
 * finishes its sentence first; assertive for failures, which are worth
 * interrupting for. Both live permanently in the DOM — a live region
 * added at the same moment as its text is frequently not announced at
 * all, which is the most common way this feature is built wrong.
 */

export type ToastTone = "ok" | "error" | "info";

export type Toast = {
  id: number;
  tone: ToastTone;
  message: string;
  /** optional single action — "Undo", "View basket" */
  action?: { label: string; onClick: () => void };
};

type ToastState = {
  toasts: Toast[];
  ok: (message: string, action?: Toast["action"]) => void;
  error: (message: string, action?: Toast["action"]) => void;
  info: (message: string, action?: Toast["action"]) => void;
  dismiss: (id: number) => void;
};

const Ctx = createContext<ToastState | null>(null);

/** How long each tone stays. A failure gets longer: it is worth reading. */
const LIFE: Record<ToastTone, number> = { ok: 4000, info: 5000, error: 8000 };

/* Three at once. A fourth is a queue nobody reads, and on a phone the
 * stack would reach the middle of the screen. */
const MAX = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) window.clearTimeout(t);
    timers.current.delete(id);
    setToasts((list) => list.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (tone: ToastTone, message: string, action?: Toast["action"]) => {
      const id = ++seq.current;
      setToasts((list) => [...list, { id, tone, message, action }].slice(-MAX));
      timers.current.set(
        id,
        window.setTimeout(() => dismiss(id), LIFE[tone]),
      );
    },
    [dismiss],
  );

  const value = useMemo<ToastState>(
    () => ({
      toasts,
      ok: (m, a) => push("ok", m, a),
      error: (m, a) => push("error", m, a),
      info: (m, a) => push("info", m, a),
      dismiss,
    }),
    [toasts, push, dismiss],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * Never throws when there is no provider.
 *
 * A missing toast must not take a page down — the admin renders outside
 * the site chrome, and a component that works everywhere except one route
 * is worse than one that quietly says nothing there. This is the opposite
 * call from useCart and usePlayer, which throw, because a cart that
 * silently does nothing IS the bug.
 */
export function useToast(): ToastState {
  return useContext(Ctx) ?? NOOP;
}

const NOOP: ToastState = {
  toasts: [],
  ok: () => {},
  error: () => {},
  info: () => {},
  dismiss: () => {},
};
