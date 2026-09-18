import type { ReactNode } from "react";

/**
 * The house form field, lifted out of ContactForm so the login popup and the
 * checkout do not each grow their own.
 *
 * The rules it encodes, all from the site's existing forms: the label is
 * always visible (never a placeholder standing in for one), the underline is
 * the only border, it turns acid on focus, and the error sits under its own
 * field and is announced. `ErrorLine` keeps a `min-h` so validating a field
 * does not shove the rest of the form down the page.
 */
export function Field({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  type = "text",
  autoComplete,
  required,
  inputMode,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  inputMode?: "text" | "email" | "tel" | "numeric";
  hint?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-mute"
      >
        {label}
        {required ? <span className="ml-1 text-acid-type">*</span> : null}
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
          inputMode={inputMode}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          placeholder={placeholder}
          className="h-12 w-full bg-transparent font-ui text-[16px] text-text outline-none placeholder:text-[color:var(--placeholder)]"
        />
      </div>
      {hint && !error ? (
        <p id={`${id}-hint`} className="t-label mt-2 text-mute">
          {hint}
        </p>
      ) : null}
      <ErrorLine id={`${id}-error`} message={error} />
    </div>
  );
}

/** Errors sit under their own field and are announced, per the house rules. */
export function ErrorLine({ id, message }: { id: string; message?: string }) {
  return (
    <p id={id} role="alert" aria-live="polite" className="t-label mt-2 min-h-[1em] text-acid-type">
      {message ?? ""}
    </p>
  );
}

/** A whole-form message — the one the server sent back, not a field's. */
export function FormNotice({
  tone = "bad",
  children,
}: {
  tone?: "bad" | "good";
  children: ReactNode;
}) {
  return (
    <p
      role="alert"
      aria-live="polite"
      className={`border-l-2 py-2 pl-4 font-ui text-[13px] leading-[1.5] ${
        tone === "good" ? "border-acid text-text" : "border-acid-type text-mute"
      }`}
    >
      {children}
    </p>
  );
}

/** Primary square CTA used inside popups and the checkout. */
export function SubmitButton({
  label,
  busyLabel,
  busy,
  disabled,
  full = true,
}: {
  label: string;
  busyLabel?: string;
  busy?: boolean;
  disabled?: boolean;
  full?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={busy || disabled}
      className={`flex h-[56px] items-center justify-center bg-acid px-8 t-action text-accent-text transition-colors duration-300 hover:bg-acid-dim disabled:cursor-not-allowed disabled:opacity-50 ${
        full ? "w-full" : ""
      }`}
    >
      {busy ? (busyLabel ?? "Working…") : label}
    </button>
  );
}
