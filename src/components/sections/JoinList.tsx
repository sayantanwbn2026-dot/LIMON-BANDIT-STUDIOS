import { useRef, useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { Section, Eyebrow } from "@/components/lb/Section";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";

export function JoinList() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);

  const shake = () => {
    const gsap = ensureGsap();
    const el = fieldRef.current;
    if (!gsap || !el || prefersReducedMotion()) return;
    gsap.fromTo(el, { x: -6 }, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      shake();
      return;
    }
    setDone(true);
  };

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
                  className="group mt-3 flex items-center border-b border-line transition-colors duration-300 focus-within:border-acid-type"
                >
                  <input
                    id="join-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@somewhere.in"
                    className="h-[64px] w-full bg-transparent font-display text-[22px] font-bold uppercase tracking-[-0.01em] text-text outline-none placeholder:text-[color:var(--placeholder)] md:text-[28px]"
                  />
                  <button
                    type="submit"
                    aria-label="Join the mailing list"
                    className="flex h-[46px] w-[46px] shrink-0 items-center justify-center bg-acid transition-transform duration-300 hover:scale-[1.06]"
                  >
                    <ArrowRight size={18} className="text-accent-text" />
                  </button>
                </div>
                <p className="mt-4 font-ui text-[11px] uppercase tracking-[0.12em] text-mute">
                  We mail once a month. Nothing else, ever.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}
