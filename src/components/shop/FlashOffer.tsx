import { useEffect, useState, type FormEvent } from "react";
import { Check, Copy } from "lucide-react";
import { Modal } from "@/components/lb/Modal";
import { Field, FormNotice, SubmitButton } from "@/components/lb/Field";
import { getSupabase } from "@/lib/supabase";
import { useCart } from "@/lib/cart";
import { FLASH_OFFER } from "@/data/offers";
import { useOffers, useWords } from "@/cms/hooks";
import { fill } from "@/cms/words";

/**
 * The flash offer.
 *
 * Leave an address, get the code, and it applies itself to the basket — the
 * last step matters, because a popup that hands over a code and then makes
 * you find the box to paste it into has spent the goodwill it just bought.
 *
 * It appears once. `lb-flash` records that in `localStorage` the moment it is
 * shown, not when it is dismissed, so a reload during the animation cannot
 * produce it twice. Anyone who signs up is marked done permanently.
 *
 * The delay is deliberate: the site opens on a scrubbed hero with its own
 * timeline, and a dialog that steals focus a second into that is the reason
 * people leave. It waits, and it never interrupts a page where you are
 * already trying to do something — the checkout, or a cart you have open.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SEEN_KEY = "lb-flash";
const DELAY_MS = 25_000;
/** how long the page has to be still before it counts as a pause */
const PAUSE_MS = 1_200;

export function FlashOffer() {
  const cart = useCart();
  const w = useWords("shop");
  const c = useWords("common");
  /* The first offer in the CMS is the one the popup hands out — the same
   * list checkout and the server validate against, so the code it gives
   * is always one the order will accept. */
  const offer = useOffers()[0] ?? FLASH_OFFER;
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem(SEEN_KEY)) return;
    } catch {
      /* private mode — show it, but it may reappear next session */
    }

    /* Not on a clock alone. A timer fired the dialog at 25 seconds
     * whatever the visitor was doing — mid-swipe through a rail, or on a
     * phone still reading the first screen — and a dialog that lands under
     * a moving thumb is dismissed before it is read. Now it also waits for
     * someone who has scrolled at least a screen (they are reading, not
     * bouncing) and has just stopped (they are looking at something, not
     * travelling past it). Whichever comes last of the three opens it. */
    const start = Date.now();
    let deepest = window.scrollY;
    let idle = 0;
    let done = false;

    const attempt = () => {
      if (done) return;
      if (Date.now() - start < DELAY_MS) return;
      if (deepest < window.innerHeight) return;
      /* Never over a checkout, never over an open drawer, never while
       * someone is typing into a field.
       *
       * `:not([inert])` is load-bearing. The nav's site menu is a
       * `role="dialog"` that is always in the DOM and merely inerted while
       * closed, so a bare `[role="dialog"]` matches on every page and this
       * popup would never once appear. Only an open dialog is not inert. */
      if (window.location.pathname.startsWith("/checkout")) return;
      if (document.querySelector('[role="dialog"]:not([inert])')) return;
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;

      done = true;
      cleanup();
      try {
        window.localStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* nothing to do */
      }
      setOpen(true);
    };

    const onScroll = () => {
      deepest = Math.max(deepest, window.scrollY);
      window.clearTimeout(idle);
      idle = window.setTimeout(attempt, PAUSE_MS);
    };

    const t = window.setTimeout(attempt, DELAY_MS);
    window.addEventListener("scroll", onScroll, { passive: true });
    const cleanup = () => {
      window.clearTimeout(t);
      window.clearTimeout(idle);
      window.removeEventListener("scroll", onScroll);
    };
    return cleanup;
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);

    if (!EMAIL.test(email)) {
      setError(c.emailInvalid);
      return;
    }

    setBusy(true);
    try {
      const supabase = await getSupabase();
      if (supabase) {
        /* `offer_signups` is insert-only by policy, so a duplicate address
         * comes back as a unique violation rather than a row we can read.
         * That is not a failure worth showing anyone — they already have the
         * code, and the code is the campaign's, not theirs. */
        const { error: dbError } = await supabase
          .from("offer_signups")
          .insert({ email: email.trim().toLowerCase(), code: offer.code, source: "flash" });

        if (dbError && dbError.code !== "23505") {
          console.error("offer signup failed", dbError);
        }
      }

      setCode(offer.code);
      cart.applyOffer({ code: offer.code, percent: offer.percent });
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the code is on screen to be typed */
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      /* A sheet: on a phone it rises from the bottom edge, where the thumb
       * already is, instead of a box dropped over the middle of what they
       * were reading. From 640px it is the centred dialog it always was. */
      variant="sheet"
      title={code ? w.offerDoneTitle : offer.label}
      standfirst={code ? w.offerDoneStandfirst : w.offerStandfirst}
    >
      {code ? (
        <div>
          <div className="flex items-center justify-between gap-4 border border-line bg-surface-raised px-6 py-5">
            <span className="tnum font-display text-[24px] font-extrabold uppercase tracking-[0.06em] text-acid-type">
              {code}
            </span>
            <button
              type="button"
              onClick={copy}
              className="flex items-center gap-2 border border-line px-4 py-2 font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-mute transition-colors duration-300 hover:border-acid-type hover:text-text"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? c.copied : c.copy}
            </button>
          </div>

          <p className="mt-6 font-ui text-[14px] leading-[1.6] text-mute">
            {fill(w.offerPercentNote, { percent: offer.percent })}
          </p>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-8 flex h-[56px] w-full items-center justify-center bg-acid font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-accent-text transition-colors duration-300 hover:bg-acid-dim"
          >
            {w.offerBack}
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-6">
          <Field
            id="flash-email"
            label={c.emailLabel}
            type="email"
            inputMode="email"
            value={email}
            onChange={setEmail}
            error={error}
            placeholder={c.emailPlaceholder}
            autoComplete="email"
            required
          />

          <SubmitButton label={w.offerSubmit} busyLabel={w.offerBusy} busy={busy} />

          <FormNotice>{w.offerNotice}</FormNotice>
        </form>
      )}
    </Modal>
  );
}
