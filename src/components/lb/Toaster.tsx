import { Check, Info, TriangleAlert, X } from "lucide-react";
import { useToast, type ToastTone } from "@/lib/toast";

/**
 * The stack itself.
 *
 * Bottom-right on a desktop, bottom-centre on a phone — and lifted clear
 * of the shop's sticky buy bar, which owns the bottom edge of every
 * product page. A confirmation that covers the button you just pressed is
 * worse than no confirmation.
 *
 * The two live regions are always mounted, even empty. A region inserted
 * at the same moment as its text is often not announced at all; this is
 * the single most common way toasts end up inaccessible.
 */

const TONE: Record<ToastTone, { ring: string; ink: string; Icon: typeof Check }> = {
  ok: { ring: "border-ok", ink: "text-ok", Icon: Check },
  error: { ring: "border-danger", ink: "text-danger", Icon: TriangleAlert },
  info: { ring: "border-line-strong", ink: "text-mute", Icon: Info },
};

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <>
      {/* Confirmations wait their turn; failures interrupt. */}
      <LiveRegion politeness="polite" toasts={toasts.filter((t) => t.tone !== "error")} />
      <LiveRegion politeness="assertive" toasts={toasts.filter((t) => t.tone === "error")} />

      <div
        /* aria-hidden because the live regions above already carry the
         * text — without this a screen reader reads every toast twice. */
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[9998] flex flex-col items-center gap-2 p-4 pb-[calc(96px+env(safe-area-inset-bottom,0px))] sm:inset-x-auto sm:right-0 sm:items-end sm:pb-[calc(24px+env(safe-area-inset-bottom,0px))]"
      >
        {toasts.map((t) => {
          const tone = TONE[t.tone];
          return (
            <div
              key={t.id}
              className={`ui-panel pointer-events-auto flex w-full max-w-[380px] items-start gap-3 border bg-surface px-4 py-3 ${tone.ring}`}
            >
              <tone.Icon size={16} className={`mt-[2px] shrink-0 ${tone.ink}`} />

              <p className="min-w-0 flex-1 font-ui text-[13px] leading-[1.45] text-text">
                {t.message}
              </p>

              {t.action ? (
                <button
                  type="button"
                  onClick={() => {
                    t.action?.onClick();
                    dismiss(t.id);
                  }}
                  className="shrink-0 self-center px-1 font-ui text-[12px] font-bold uppercase tracking-[0.1em] text-acid-type transition-opacity duration-300 hover:opacity-70"
                >
                  {t.action.label}
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="-my-3 -mr-2 flex h-11 w-11 shrink-0 items-center justify-center text-mute transition-colors duration-300 hover:text-text"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

function LiveRegion({
  politeness,
  toasts,
}: {
  politeness: "polite" | "assertive";
  toasts: { id: number; message: string }[];
}) {
  return (
    <div
      role={politeness === "assertive" ? "alert" : "status"}
      aria-live={politeness}
      className="sr-only"
    >
      {toasts.map((t) => (
        <p key={t.id}>{t.message}</p>
      ))}
    </div>
  );
}
