import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { BoundaryRule, GridRules } from "@/components/lb/GridRules";
import { Eyebrow } from "@/components/lb/Section";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";
import { useSite } from "@/cms/hooks";
import {
  INTENTS,
  DEFAULT_INTENT,
  readEnquiry,
  openingLine,
  type IntentId,
  type Subject,
} from "@/lib/enquiry";

/**
 * The one form.
 *
 * There is no backend, and the honest options are to say so or to pretend —
 * JoinList currently pretends, which is the open complaint against it. This
 * composes a mailto: instead, so pressing the button actually sends the
 * enquiry somewhere a person reads, and the copy says exactly that.
 *
 * Validation follows the house rules: labels are visible, errors sit under
 * their own field and are announced, and nothing is validated until the field
 * has been left once.
 */
type Errors = Partial<Record<"name" | "email" | "message", string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm() {
  const site = useSite();
  const [intent, setIntent] = useState<IntentId>(DEFAULT_INTENT);
  const [subject, setSubject] = useState<Subject | undefined>();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const formRef = useRef<HTMLFormElement>(null);

  /* Deep links from the rest of the site carry the thing that was clicked,
   * not just the kind of enquiry: ?intent=booking&room=room-a. Resolve it
   * once on arrival and open the message with it, so the room they picked
   * is already in the mail they are about to send. */
  useEffect(() => {
    const e = readEnquiry(window.location.search);
    setIntent(e.intent);
    if (e.subject) {
      setSubject(e.subject);
      /* Only ever seeds an untouched box — a remount must not overwrite
       * something half-typed. */
      setMessage((m) => (m ? m : openingLine(e.intent, e.subject!)));
    }
  }, []);

  const validate = (): Errors => {
    const e: Errors = {};
    if (!name.trim()) e.name = "Tell us who you are.";
    if (!EMAIL.test(email)) e.email = "That address will not reach you — check it.";
    if (message.trim().length < 12) e.message = "A sentence or two, so we can answer properly.";
    return e;
  };

  const shake = () => {
    const gsap = ensureGsap();
    if (!gsap || !formRef.current || prefersReducedMotion()) return;
    gsap.fromTo(formRef.current, { x: -6 }, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    setTouched({ name: true, email: true, message: true });

    const firstBad = (["name", "email", "message"] as const).find((k) => found[k]);
    if (firstBad) {
      shake();
      document.getElementById(`contact-${firstBad}`)?.focus();
      return;
    }

    const label = INTENTS.find((i) => i.id === intent)?.label ?? "Enquiry";
    /* The subject line is what gets read in an inbox list, so the specific
     * thing goes in it — "[Book a room] Room A — Priya" beats a wall of
     * identical "[Book a room]" rows. */
    const head = subject ? `[${label}] ${subject.title} — ${name}` : `[${label}] ${name}`;
    const body = `${message}\n\n— ${name}\n${email}`;
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(
      head,
    )}&body=${encodeURIComponent(body)}`;
  };

  const blur = (k: keyof Errors) => () => {
    setTouched((t) => ({ ...t, [k]: true }));
    setErrors(validate());
  };

  const err = (k: keyof Errors) => (touched[k] ? errors[k] : undefined);

  return (
    <section id="form" className="relative w-full bg-surface py-[96px]">
      <GridRules tone="dark" />
      <BoundaryRule tone="dark" className="top-0" />

      <div className="shell relative z-[2]">
        <div className="section-head">
          <div className="md:col-span-1">
            <Eyebrow tone="dark" surface="bg-surface">
              The form
            </Eyebrow>
          </div>
          <div className="md:col-span-2">
            <h2 className="t-h2 text-text">Tell us what you need</h2>
          </div>
          <div className="flex items-end md:col-span-1">
            <p className="font-ui text-[16px] leading-[1.5] text-mute">
              One form for every reason. It opens your mail client addressed to us — there is no
              server in between.
            </p>
          </div>
        </div>

        <form ref={formRef} onSubmit={onSubmit} noValidate className="mt-12 max-w-[760px]">
          {/* What you clicked to get here, said back to you. Without this the
           * form silently discarded the choice and the only clue that it had
           * registered anything was which chip happened to be lit. Dismissable,
           * because the deep link is a starting point and someone who followed
           * "Book Room A" is allowed to end up asking about something else. */}
          {/* AnimatePresence so "Clear" collapses the strip instead of
           * blinking it out of existence — the height animates too, so the
           * form below rises into the space rather than snapping up. */}
          <AnimatePresence initial={false}>
            {subject ? (
              <motion.div
                key="subject"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="mb-12 flex flex-wrap items-baseline gap-x-6 gap-y-3 border-y border-line py-5">
                  <span className="t-label shrink-0 text-mute">{subject.kind}</span>
                  <span className="font-display text-[18px] font-bold uppercase tracking-[-0.02em] text-text">
                    {subject.title}
                  </span>
                  {subject.detail ? (
                    <span className="tnum font-ui text-[14px] text-acid-type">
                      {subject.detail}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setSubject(undefined)}
                    className="ml-auto font-ui text-[11px] font-bold uppercase tracking-[0.14em] text-mute transition-colors duration-300 hover:text-text"
                  >
                    <span className="wipe-underline">Clear</span>
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <fieldset>
            <legend className="t-label text-mute">What is it about</legend>
            <div className="mt-5 flex flex-wrap gap-3">
              {INTENTS.map((i) => {
                const on = intent === i.id;
                return (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => setIntent(i.id)}
                    aria-pressed={on}
                    className={`px-3 py-2 font-ui text-[11px] font-bold uppercase tracking-[0.14em] transition-colors duration-300 ${
                      on
                        ? "bg-acid text-accent-text"
                        : "border border-line text-mute hover:border-acid-type hover:text-text"
                    }`}
                  >
                    {i.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-2">
            <Field
              id="contact-name"
              label="Your name"
              value={name}
              onChange={setName}
              onBlur={blur("name")}
              error={err("name")}
              placeholder="Who is asking"
              autoComplete="name"
            />
            <Field
              id="contact-email"
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              onBlur={blur("email")}
              error={err("email")}
              placeholder="you@somewhere.in"
              autoComplete="email"
            />
          </div>

          <div className="mt-10">
            <label
              htmlFor="contact-message"
              className="font-ui text-[10px] font-bold uppercase tracking-[0.18em] text-mute"
            >
              The message
            </label>
            <div
              className={`mt-3 border-b transition-colors duration-300 focus-within:border-acid-type ${
                err("message") ? "border-acid-type" : "border-line"
              }`}
            >
              <textarea
                id="contact-message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onBlur={blur("message")}
                aria-invalid={Boolean(err("message"))}
                aria-describedby={err("message") ? "contact-message-error" : undefined}
                placeholder="Dates, the project, the budget you actually have."
                className="w-full resize-y bg-transparent py-4 font-ui text-[16px] leading-[1.5] text-text outline-none placeholder:text-[color:var(--placeholder)]"
              />
            </div>
            <ErrorLine id="contact-message-error" message={err("message")} />
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-6">
            <button
              type="submit"
              className="group flex h-[56px] items-center justify-between gap-6 bg-acid px-8 transition-colors duration-300 hover:bg-acid-dim"
            >
              <span className="font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-accent-text">
                Send it
              </span>
              <ArrowRight
                size={16}
                className="text-accent-text transition-transform duration-300 group-hover:translate-x-1"
              />
            </button>
            <p className="t-label max-w-[36ch] text-mute">
              Opens your mail app, addressed to {site.email}. Nothing is stored here.
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  type = "text",
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  error?: string;
  placeholder: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="font-ui text-[10px] font-bold uppercase tracking-[0.18em] text-mute"
      >
        {label}
      </label>
      <div
        className={`mt-3 border-b transition-colors duration-300 focus-within:border-acid-type ${
          error ? "border-acid-type" : "border-line"
        }`}
      >
        <input
          id={id}
          type={type}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          placeholder={placeholder}
          className="h-[56px] w-full bg-transparent font-ui text-[16px] text-text outline-none placeholder:text-[color:var(--placeholder)]"
        />
      </div>
      <ErrorLine id={`${id}-error`} message={error} />
    </div>
  );
}

/** Errors sit under their own field and are announced, per the house rules. */
function ErrorLine({ id, message }: { id: string; message?: string }) {
  return (
    <p id={id} role="alert" aria-live="polite" className="t-label mt-3 min-h-[1em] text-acid-type">
      {message ?? ""}
    </p>
  );
}
