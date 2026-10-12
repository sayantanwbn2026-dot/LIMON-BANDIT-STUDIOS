import { useEffect, useRef, useState } from "react";

/**
 * True for a moment after something turns ON — and only then.
 *
 * Built for the wishlist heart, which used to answer a deliberate tap by
 * changing a colour and nothing else. A short pop gives the act a body. It
 * has to be driven by the CHANGE rather than by the state: a CSS rule on
 * `[aria-pressed="true"]` would play on mount, so a signed-in visitor with
 * five saved items would watch five hearts pop at once every time a product
 * page loaded. Remembering the previous value is what separates "is saved"
 * from "has just been saved".
 */

export type Step = "resync" | "clear" | "hold" | "pop";

/**
 * The whole decision, with no React in it, so it can be tested without a DOM
 * — and so the hook below is too thin to hide a bug.
 *
 *   resync  the SUBJECT changed (a different product): adopt the new value
 *           silently. A component reused across subjects — the product sheet
 *           shows whichever tee you opened — sees `on` flip false → true when
 *           you move from an unsaved product to a saved one, which is
 *           indistinguishable from a tap. Only a change within one subject is
 *           an act.
 *   clear   turned OFF. Cleared at once rather than left to time out,
 *           otherwise a fast on → off → on finds it still true, sets it true
 *           again as a no-op, and the second pop never plays.
 *   hold    already on, nothing changed — including on mount. No celebration.
 *   pop     off → on within one subject. The only case that celebrates.
 */
export function decideStep(
  prev: { on: boolean; scope?: string },
  next: { on: boolean; scope?: string },
): Step {
  if (prev.scope !== next.scope) return "resync";
  if (!next.on) return "clear";
  if (prev.on) return "hold";
  return "pop";
}

export function useJustOn(on: boolean, ms = 500, scope?: string): boolean {
  const [just, setJust] = useState(false);
  const prev = useRef<{ on: boolean; scope?: string }>({ on, scope });

  useEffect(() => {
    const step = decideStep(prev.current, { on, scope });
    prev.current = { on, scope };

    if (step === "resync" || step === "clear") {
      setJust(false);
      return;
    }
    if (step === "hold") return;

    setJust(true);
    const t = window.setTimeout(() => setJust(false), ms);
    return () => window.clearTimeout(t);
  }, [on, ms, scope]);

  return just;
}
