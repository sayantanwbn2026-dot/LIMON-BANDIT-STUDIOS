import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getLenis } from "@/lib/smooth";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * What happens when someone arrives back from an auth email.
 *
 * Confirmation links used to point at /shop, so the end of signing up
 * was a product grid with no indication that anything had worked. They
 * point at the homepage now, and this is the other half of that: it puts
 * the visitor at the top of the page — the hero, the one screen that
 * says what this place is — and tells them plainly that the account is
 * live, because otherwise a successful confirmation and a dead link look
 * exactly the same from the outside.
 *
 * It also catches the failure. Supabase sends expired or already-used
 * links back with `error` and `error_description` in the URL fragment,
 * and nothing was reading them: the visitor landed on an ordinary page,
 * silently still signed out, with no idea the link had lapsed. That is
 * the case most likely to be read as "the sign-in is broken".
 *
 * **Everything is read once, synchronously, on mount.** The fragment is
 * consumed and cleared by supabase-js as soon as it initialises, and
 * that happens behind a dynamic import — so this wins the race only
 * because it does its reading in a `useState` initialiser rather than in
 * an effect. Doing it in an effect would work most of the time, which is
 * the worst way for this to behave.
 */

type Arrival =
  | { kind: "none" }
  | { kind: "confirmed" }
  | { kind: "error"; message: string; expired: boolean };

function readArrival(): Arrival {
  if (typeof window === "undefined") return { kind: "none" };

  const query = new URLSearchParams(window.location.search);
  /* Switch off the browser's own scroll restoration the moment we know
   * this is an auth arrival — synchronously, during render, because by
   * the time an effect runs the browser has already restored the old
   * offset and a single scrollTo(0) loses the race against it. Measured:
   * without this the confirmation link landed at 7271px, most of the way
   * down the page, instead of on the hero. */
  if (query.get("confirmed") === "1" || query.get("recover") === "1" || query.has("error")) {
    try {
      if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
    } catch {
      /* Some embedded webviews refuse both; the effect's retry covers it. */
    }
  }
  /* The fragment carries auth results; strip the leading # before parsing. */
  const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  const error = fragment.get("error") ?? query.get("error");
  if (error) {
    const description = fragment.get("error_description") ?? query.get("error_description") ?? "";
    const code = fragment.get("error_code") ?? query.get("error_code") ?? "";
    const expired = /expired/i.test(code) || /expired/i.test(description);
    return {
      kind: "error",
      expired,
      message: expired
        ? "That link has expired. Links are good for one use and a short window — send yourself a fresh one."
        : /* Supabase's own description is underscore-separated; make it a
           * sentence rather than showing machine text to a customer. */
          description.replace(/\+/g, " ").replace(/_/g, " ") ||
          "That link could not be used. Try signing in, or send yourself a new one.",
    };
  }

  if (query.get("confirmed") === "1") return { kind: "confirmed" };
  return { kind: "none" };
}

/** Take the query flags back out of the URL so a refresh does not repeat this. */
function cleanUrl() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  let touched = false;
  for (const key of ["confirmed", "recover", "error", "error_code", "error_description"]) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      touched = true;
    }
  }
  if (window.location.hash && /error|access_token/.test(window.location.hash)) {
    url.hash = "";
    touched = true;
  }
  if (touched) window.history.replaceState({}, "", url.pathname + url.search);
}

export function AuthLanding() {
  /* Initialiser, not an effect — see the note above about the race with
   * supabase-js clearing the fragment. */
  const [arrival] = useState<Arrival>(readArrival);
  const [dismissed, setDismissed] = useState(false);
  const { openAuth } = useAuth();

  useEffect(() => {
    if (arrival.kind === "none") return;
    cleanUrl();

    /* Land on the hero, and keep landing on it.
     *
     * One scrollTo is not enough. Three separate things move the page
     * just after load and each of them runs later than this effect:
     * Lenis mounts behind a dynamic import and syncs itself to the
     * document, ScrollTrigger refreshes when the fonts and the mascot
     * settle and re-pins the hero, and the browser may still restore an
     * offset. So the top is re-asserted every frame for a short window
     * rather than once.
     *
     * It stops the instant the visitor touches the page. Fighting
     * someone who has started scrolling would be worse than landing in
     * the wrong place. */
    let stopped = false;
    const until = performance.now() + 900;
    const release = () => {
      stopped = true;
    };
    const opts = { passive: true } as const;
    window.addEventListener("wheel", release, opts);
    window.addEventListener("touchstart", release, opts);
    window.addEventListener("keydown", release);

    const pin = () => {
      if (stopped) return;
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(0, { immediate: true });
      else window.scrollTo(0, 0);
      if (performance.now() < until) requestAnimationFrame(pin);
    };
    const raf = requestAnimationFrame(pin);

    if (arrival.kind === "error") {
      openAuth(arrival.message, arrival.expired ? "signup" : "signin");
    }

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", release);
      window.removeEventListener("touchstart", release);
      window.removeEventListener("keydown", release);
    };
  }, [arrival, openAuth]);

  if (arrival.kind !== "confirmed" || dismissed) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-[9996] flex justify-center px-4 pb-[max(20px,env(safe-area-inset-bottom,0px))]"
    >
      <div
        className="flex w-full max-w-[520px] items-center gap-4 border border-line bg-surface-raised px-5 py-4"
        style={{
          animation: prefersReducedMotion() ? undefined : "lb-landing-in 0.5s var(--ease-out-expo)",
        }}
      >
        <span className="neon h-[10px] w-[10px] shrink-0 bg-acid" />
        <p className="flex-1 font-ui text-[13px] leading-[1.45] text-text">
          Email confirmed — your account is live. You can cart, wishlist and order now.
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center text-mute transition-colors duration-300 hover:text-text"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
