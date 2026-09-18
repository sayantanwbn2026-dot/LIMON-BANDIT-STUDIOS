import { useEffect, useState, type FormEvent } from "react";
import { Check, Copy } from "lucide-react";
import { Modal } from "@/components/lb/Modal";
import { Field, FormNotice, SubmitButton } from "@/components/lb/Field";
import { getSupabase } from "@/lib/supabase";
import { useCart } from "@/lib/cart";
import { FLASH_OFFER } from "@/data/offers";

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

export function FlashOffer() {
  const cart = useCart();
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

    const t = window.setTimeout(() => {
      /* Never over a checkout, and never over an open drawer.
       *
       * `:not([inert])` is load-bearing. The nav's site menu is a
       * `role="dialog"` that is always in the DOM and merely inerted while
       * closed, so a bare `[role="dialog"]` matches on every page and this
       * popup would never once appear. Only an open dialog is not inert. */
      if (window.location.pathname.startsWith("/checkout")) return;
      if (document.querySelector('[role="dialog"]:not([inert])')) return;

      try {
        window.localStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* nothing to do */
      }
      setOpen(true);
    }, DELAY_MS);

    return () => window.clearTimeout(t);
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);

    if (!EMAIL.test(email)) {
      setError("That address will not reach you — check it.");
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
          .insert({ email: email.trim().toLowerCase(), code: FLASH_OFFER.code, source: "flash" });

        if (dbError && dbError.code !== "23505") {
          console.error("offer signup failed", dbError);
        }
      }

      setCode(FLASH_OFFER.code);
      cart.applyOffer({ code: FLASH_OFFER.code, percent: FLASH_OFFER.percent });
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
      title={code ? "Here it is" : FLASH_OFFER.label}
      standfirst={
        code
          ? "Already applied to your cart. It will still be there when you check out."
          : "Leave an address and the code is yours. We mail when a run drops — a few times a year, not weekly."
      }
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
              className="flex items-center gap-2 border border-line px-4 py-2 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-mute transition-colors duration-300 hover:border-acid-type hover:text-text"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <p className="mt-6 font-ui text-[14px] leading-[1.6] text-mute">
            {FLASH_OFFER.percent}% comes off your subtotal at checkout. Shipping is charged as
            normal — we do not mark it up, so there is nothing in it to discount.
          </p>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-8 flex h-[56px] w-full items-center justify-center bg-acid t-action text-accent-text transition-colors duration-300 hover:bg-acid-dim"
          >
            Back to the shop
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-6">
          <Field
            id="flash-email"
            label="Email"
            type="email"
            inputMode="email"
            value={email}
            onChange={setEmail}
            error={error}
            placeholder="you@somewhere.in"
            autoComplete="email"
            required
          />

          <SubmitButton label="Send me the code" busyLabel="Getting it…" busy={busy} />

          <FormNotice>
            One address, one list. Unsubscribe from the bottom of any mail and we delete the row.
          </FormNotice>
        </form>
      )}
    </Modal>
  );
}
