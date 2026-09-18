import { useId, useState } from "react";
import { Minus, Plus } from "lucide-react";

export type AccordionItem = { question: string; answer: string };

/**
 * Numbered disclosure list. Extracted so the Rooms page and the landing FAQ
 * cannot drift into two different accordions.
 *
 * The panel is animated with grid-template-rows rather than max-height, so it
 * opens to its real height instead of a guessed one.
 */
export function Accordion({
  items,
  pole = "primary",
  defaultOpen = 0,
  mobileCap,
}: {
  items: AccordionItem[];
  /** which token pole the surrounding section sits on */
  pole?: "primary" | "alt";
  defaultOpen?: number;
  /**
   * Show only this many on a phone until "Show all" is pressed.
   *
   * Visibility is decided by CSS per breakpoint, not by measuring the
   * screen in React: the server renders every row, a phone hides the ones
   * past the cap with `max-md:hidden`, and the button only removes that
   * class. Branching on window width in render would hand the server and
   * the client different markup and hydrate a mismatch. Desktop always
   * shows the lot — it has the room.
   */
  mobileCap?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [showAll, setShowAll] = useState(false);
  const capping = mobileCap != null && !showAll && items.length > mobileCap;
  const uid = useId();

  const line = pole === "alt" ? "border-alt-line" : "border-line";
  const text = pole === "alt" ? "text-alt-text" : "text-text";
  const mute = pole === "alt" ? "text-alt-mute" : "text-mute";

  return (
    <div>
      {items.map((item, i) => {
        const isOpen = open === i;
        const hiddenOnPhone = capping && i >= (mobileCap ?? 0);
        return (
          <div
            key={item.question}
            className={`border-t ${line} ${hiddenOnPhone ? "max-md:hidden" : ""}`}
          >
            <h3>
              <button
                type="button"
                id={`${uid}-t-${i}`}
                aria-expanded={isOpen}
                aria-controls={`${uid}-p-${i}`}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex w-full items-center gap-6 py-8 text-left"
              >
                <span className={`tnum font-ui text-[13px] ${mute}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={`flex-1 font-display text-[18px] font-bold tracking-[-0.02em] ${text}`}
                >
                  {item.question}
                </span>
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center ${text}`}>
                  {isOpen ? <Minus size={20} /> : <Plus size={20} />}
                </span>
              </button>
            </h3>
            <div
              id={`${uid}-p-${i}`}
              role="region"
              aria-labelledby={`${uid}-t-${i}`}
              className="grid"
              style={{
                gridTemplateRows: isOpen ? "1fr" : "0fr",
                transition: "grid-template-rows 0.45s var(--ease-in-out-quart)",
              }}
            >
              <div className="overflow-hidden">
                <p
                  className={`max-w-[60ch] pb-8 pl-[48px] font-ui text-[16px] leading-[1.5] ${mute}`}
                  style={{ opacity: isOpen ? 1 : 0, transition: "opacity 0.35s ease 0.08s" }}
                >
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
      {capping ? (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className={`flex min-h-11 w-full items-center justify-between border-t ${line} py-5 t-action ${text} md:hidden`}
        >
          <span>Show all {items.length} questions</span>
          <Plus size={16} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
