/**
 * Recently viewed, kept in this browser and nowhere else.
 *
 * The one piece of shopping memory a site can offer without asking for
 * anything: no account, no cookie, no row in anyone's database. It is a list
 * of product ids in localStorage, newest first, capped — enough to get
 * someone back to the tee they were looking at before they wandered off.
 *
 * Every read and write is wrapped: a private window, cleared site data or a
 * browser set to refuse storage all throw here, and a shop must not fall
 * over because it could not remember something optional.
 */

const KEY = "lb-recent";
const MAX = 12;

export function readRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

/** Put one product at the front, without duplicating it. */
export function remember(productId: string): void {
  try {
    const next = [productId, ...readRecent().filter((id) => id !== productId)].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* nothing to do: the list is a convenience, not state anything needs */
  }
}

export function forgetRecent(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* as above */
  }
}
