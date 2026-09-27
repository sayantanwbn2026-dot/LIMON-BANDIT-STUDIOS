import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { BoundaryRule, GridRules } from "@/components/lb/GridRules";
import { Eyebrow } from "@/components/lb/Section";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";
import { useSection, useSite } from "@/cms/hooks";
import {
  INTENTS,
  DEFAULT_INTENT,
  readEnquiry,
  openingLine,
  type IntentId,
  type Subject,
} from "@/lib/enquiry";
import { readableEnquiryIssue, submitEnquiry } from "@/lib/enquiries";

/**
 * The one form.
 *
 * It posts to the `enquiries` table through a server function, and the
 * studio is notified from there (see lib/enquiries). It used to compose a
 * mailto: because there was no backend; that is still offered as a
 * secondary link, for people who would rather write from their own inbox
 * and as the fallback if the server is unreachable.
 *
 * Validation follows the house rules: labels are visible, errors sit under
 * their own field and are announced, and nothing is validated until the field
 * has been left once.
 */
type Errors = Partial<Record<"name" | "email" | "message", string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm() {
  const copy = useSection("contact", "form");
  const site = useSite();
  const [intent, setIntent] = useState<IntentId>(DEFAULT_INTENT);
  const [subject, setSubject] = useState<Subject | undefined>();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  /* Anti-spam (see lib/enquiries): when the form was drawn, and a honeypot
   * field that only a bot fills. Set in an effect so the server render and
   * hydration agree. */
  const startedAt = useRef<number | undefined>(undefined);
  const [website, setWebsite] = useState("");
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<{ reference: string } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
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

  /* The mail client, kept as the way out rather than the way in.
   *
   * This used to be the only path: compose a mailto: and hope the visitor
   * has a handler. On a desktop running webmail there is none, so Send did
   * nothing at all and the enquiry vanished without an error. It is still
   * offered — some people would rather write from their own inbox, and it
   * is the honest fallback when the server cannot be reached — but it is no
   * longer what pressing Send does. */
  const openMailClient = () => {
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

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const found = validate();
    setErrors(found);
    setTouched({ name: true, email: true, message: true });
    setFailed(null);

    const firstBad = (["name", "email", "message"] as const).find((k) => found[k]);
    if (firstBad) {
      shake();
      document.getElementById(`contact-${firstBad}`)?.focus();
      return;
    }

    setBusy(true);
    try {
      const label = INTENTS.find((i) => i.id === intent)?.label ?? "Enquiry";
      const res = await submitEnquiry({
        data: {
          intent: label,
          fullName: name,
          email,
          phone: "",
          /* The thing they clicked goes into the message itself: the
           * enquiry list is read as rows, and "Room A" in the body is the
           * difference between triage and guesswork. */
          message: subject ? `${subject.title}\n\n${message}` : message,
          sourcePath: window.location.pathname + window.location.search,
          website,
          startedAt: startedAt.current,
        },
      });
      if (res.ok) {
        setSent({ reference: res.reference });
      } else {
        setFailed(res.message);
        shake();
      }
    } catch (err) {
      setFailed(readableEnquiryIssue(err));
      shake();
    } finally {
      setBusy(false);
    }
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
              {copy.eyebrow}
            </Eyebrow>
          </div>
          <div className="md:col-span-2">
            <h2 className="t-h2 text-text">{copy.heading}</h2>
          </div>
          <div className="flex items-end md:col-span-1">
            <p className="font-ui text-[16px] leading-[1.5] text-mute">{copy.standfirst}</p>
          </div>
        </div>

        {sent ? (
          /* Replaces the form rather than sitting above it: a form still on
           * screen after sending invites a second, duplicate send. The
           * reference is the thing to quote if they chase it up. */
          <div role="status" className="mt-12 max-w-[760px] border-t border-line pt-10">
            <span className="flex items-center gap-3">
              <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-acid" />
              <span className="t-label text-mute">Received</span>
            </span>
            <p className="mt-6 font-display text-[28px] font-extrabold uppercase leading-[1.05] tracking-[-0.02em] text-text">
              Thanks, {name.trim().split(" ")[0]}. It is with us.
            </p>
            <p className="mt-5 max-w-[52ch] font-ui text-[16px] leading-[1.6] text-mute">
              A person reads every message and replies to {email.trim()}. If you need to chase it,
              quote <span className="tnum font-semibold text-acid-type">{sent.reference}</span>.
            </p>
            <button
              type="button"
              onClick={() => {
                setSent(null);
                setMessage("");
                setSubject(undefined);
                setTouched({});
              }}
              className="t-label mt-8 text-text underline underline-offset-4 transition-colors duration-300 hover:text-acid-type"
            >
              Send another
            </button>
          </div>
        ) : (
          <form ref={formRef} onSubmit={onSubmit} noValidate className="mt-12 max-w-[760px]">
            {/* Honeypot. Off-screen rather than display:none (some bots skip
             * hidden fields), out of the tab order, and hidden from assistive
             * tech so nobody is asked to fill it in. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label>
                Website
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </label>
            </div>
            {/* What you clicked to get here, said back to you. Without this the
             * form silently discarded the choice and the only clue that it had
             * registered anything was which chip happened to be lit. Dismissable,
             * because the deep link is a starting point and someone who followed
             * "Book Room A" is allowed to end up asking about something else. */}
            {/* AnimatePresence so "Clear" collapses the strip instead of
             * blinking it out of existence — the height animates too, so the
             * form below rises into the space rather than snapping up. */}
            <MotionConfig reducedMotion="user">
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
            </MotionConfig>

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
                      className={`flex h-11 items-center px-4 font-ui text-[11px] font-bold uppercase tracking-[0.14em] transition-colors duration-300 ${
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
                className={`mt-3 border-b lb-field-line transition-colors duration-300 focus-within:border-line-strong ${
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

            {/* Said where it will be seen, not in a toast that leaves. A failure
             * keeps everything they typed and offers their own mail app as the
             * way round it, so a server problem never costs the message. */}
            {failed ? (
              <div role="alert" className="mt-10 border-l-2 border-acid-type pl-4">
                <p className="font-ui text-[14px] leading-[1.5] text-text">{failed}</p>
                <button
                  type="button"
                  onClick={openMailClient}
                  className="t-label mt-3 text-acid-type underline underline-offset-4"
                >
                  Send it from your own mail app instead
                </button>
              </div>
            ) : null}

            <div className="mt-12 flex flex-wrap items-center gap-6">
              <button
                type="submit"
                disabled={busy}
                aria-busy={busy}
                className="group flex h-[56px] items-center justify-between gap-6 bg-acid px-8 transition-colors duration-300 hover:bg-acid-dim disabled:cursor-wait disabled:opacity-70"
              >
                <span className="font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-accent-text">
                  {busy ? "Sending…" : "Send it"}
                </span>
                <ArrowRight size={16} className="text-accent-text lb-arrow" />
              </button>
              <p className="t-label max-w-[40ch] text-mute">
                A person reads every one.{" "}
                <button
                  type="button"
                  onClick={openMailClient}
                  className="tap text-text underline underline-offset-4 transition-colors duration-300 hover:text-acid-type"
                >
                  Or email {site.email}
                </button>
              </p>
            </div>
          </form>
        )}
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
        className={`mt-3 border-b lb-field-line transition-colors duration-300 focus-within:border-line-strong ${
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
