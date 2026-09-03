import { useRef, useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { Section, Eyebrow } from "@/components/lb/Section";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";
import { getSupabase } from "@/lib/supabase";

/**
 * The home page mailing list band.
 *
 * Points at `offer_signups`, the same insert-only table the flash popup uses.
 * That table is deliberately unreadable to the client — a shopper can leave
 * their address, nobody can read the list back — which is what keeps the
 * endpoint from being turned into an email-harvesting tool.
 *
 * A duplicate address comes back as a unique-violation (`23505`) rather than
 * a row we can see. That is not a failure worth showing anyone: they are
 * already on the list, and telling them so would confirm to a stranger which
 * addresses are subscribed. Silent success.
 *
 * The `source` column separates channels so a later "who came from which"
 * split is a `where source = 'flash'` filter, not a data migration.
 */
export function JoinList() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "bad">("idle");
  const [reason, setReason] = useState<string | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);

  const shake = () => {
    const gsap = ensureGsap();
    const el = fieldRef.current;
    if (!gsap || !el || prefersReducedMotion()) return;
    gsap.fromTo(el, { x: -6 }, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setState("bad");
      setReason("That address will not reach you — check it.");
      shake();
      return;
    }

    setState("busy");
    setReason(null);

    const supabase = await getSupabase();
    if (!supabase) {
      /* No Supabase configured — the shop still runs, but there is nowhere
       * to write the address. Say so plainly instead of pretending. */
      setState("bad");
      setReason("The list is not connected yet. Try again in a moment.");
      return;
    }

    const { error } = await supabase
      .from("offer_signups")
      .insert({ email: email.trim().toLowerCase(), source: "list", code: "LIST" });

    /* 23505 is a unique-violation — the address is already on the list. From
     * outside it is indistinguishable from a fresh signup, which is the
     * point: an insert-only table cannot be probed for existing addresses. */
    if (error && error.code !== "23505") {
      console.error("list signup failed", error);
      setState("bad");
      setReason("Could not save that just now. Try again in a moment.");
      return;
    }

    setState("done");
  };

  const done = state === "done";
  const busy = state === "busy";

  return (
    <Section id="list" tone="dark" surface="bg-surface-deep" index="18" name="Join The List">
      {/* slim band */}
      <div className="py-[80px] md:py-[96px]">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow tone="dark" surface="bg-surface-deep">
              One mail a month
            </Eyebrow>
            <h2 className="t-h2 mt-6 max-w-[14ch] text-text">Join the list</h2>
            <p className="mt-6 max-w-[42ch] font-ui text-[15px] leading-[1.5] text-mute">
              Drop dates, open studio nights, merch runs before they go public. No forwarding, no
              selling, one unsubscribe link that actually works.
            </p>
          </div>

          <div className="flex flex-col justify-end">
            {done ? (
              <div className="border border-acid-type bg-surface-raised p-8">
                <span className="font-ui text-[11px] font-bold uppercase tracking-[0.18em] text-acid-type">
                  On the list
                </span>
                <p className="mt-3 font-ui text-[15px] text-text">
                  You are in. Next mail goes out with the following drop.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate>
                <label
                  htmlFor="join-email"
                  className="font-ui text-[10px] font-bold uppercase tracking-[0.18em] text-mute"
                >
                  Email address
                </label>
                <div
                  ref={fieldRef}
                  className={`group mt-3 flex items-center border-b transition-colors duration-300 focus-within:border-acid-type ${
                    state === "bad" ? "border-acid-type" : "border-line"
                  }`}
                >
                  <input
                    id="join-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (state === "bad") {
                        setState("idle");
                        setReason(null);
                      }
                    }}
                    aria-invalid={state === "bad"}
                    aria-describedby={reason ? "join-email-msg" : undefined}
                    placeholder="you@somewhere.in"
                    disabled={busy}
                    className="h-[64px] w-full bg-transparent font-display text-[22px] font-bold uppercase tracking-[-0.01em] text-text outline-none placeholder:text-[color:var(--placeholder)] disabled:opacity-60 md:text-[28px]"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    aria-label="Join the mailing list"
                    className="flex h-[46px] w-[46px] shrink-0 items-center justify-center bg-acid transition-transform duration-300 hover:scale-[1.06] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ArrowRight size={18} className="text-accent-text" />
                  </button>
                </div>
                <p
                  id="join-email-msg"
                  role={state === "bad" ? "alert" : undefined}
                  aria-live="polite"
                  className={`mt-4 font-ui text-[11px] uppercase tracking-[0.12em] ${
                    state === "bad" ? "text-acid-type" : "text-mute"
                  }`}
                >
                  {reason ?? "We mail once a month. Nothing else, ever."}
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}
