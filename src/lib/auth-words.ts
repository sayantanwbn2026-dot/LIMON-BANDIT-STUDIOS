import { WORDS, type Words } from "@/cms/words";

/* The error wording lives in the CMS (Wording — sign-in & accounts). This
 * provider sits above the content provider, so it cannot read it with a
 * hook; the sign-in popup, which can, hands its current wording over with
 * `setAuthWords`, and until it does the committed defaults stand in. */
type AuthErrorWords = Pick<
  Words["account"],
  | "errorCredentials"
  | "errorUnconfirmed"
  | "errorExists"
  | "errorPasswordShort"
  | "errorRateLimit"
  | "errorNetwork"
  | "errorEmail"
  | "errorGoogleOff"
  | "errorSamePassword"
>;
let authWords: AuthErrorWords = WORDS.account;

/** Called by the sign-in popup with the editor's wording. */
export function setAuthWords(w: AuthErrorWords) {
  authWords = w;
}

export function readableAuthError(message: string): string {
  const m = message.toLowerCase();
  const w = authWords;

  if (m.includes("invalid login credentials")) return w.errorCredentials;
  if (m.includes("email not confirmed") || m.includes("not confirmed")) return w.errorUnconfirmed;
  if (m.includes("already registered") || m.includes("already been registered")) {
    return w.errorExists;
  }
  if (m.includes("password should be at least") || m.includes("password is too short")) {
    return w.errorPasswordShort;
  }
  if (m.includes("for security purposes") || m.includes("rate limit") || m.includes("too many")) {
    return w.errorRateLimit;
  }
  if (m.includes("failed to fetch") || m.includes("networkerror") || m.includes("network")) {
    return w.errorNetwork;
  }
  if (m.includes("invalid email") || (m.includes("email") && m.includes("invalid"))) {
    return w.errorEmail;
  }
  if (m.includes("provider is not enabled") || m.includes("unsupported provider")) {
    return w.errorGoogleOff;
  }
  if (m.includes("same password")) return w.errorSamePassword;
  return message;
}
