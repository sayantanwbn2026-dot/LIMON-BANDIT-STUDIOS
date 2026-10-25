/**
 * The house's contact details as links.
 *
 * The contact slip, the menu and the footer all turn the same phone number
 * and address into something a thumb can use, and each used to do it inline
 * — three copies of a regex that only has to be wrong once.
 */

/** Digits only, country code included. Empty when there is no usable number.
 * A ten-digit number is assumed Indian, which is what every number on this
 * site is; `wa.me` needs the country code and nothing else. */
export function waNumber(phone: string | undefined): string {
  const digits = (phone ?? "").replace(/[^0-9]/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits.length >= 11 && digits.length <= 15 ? digits : "";
}

/** A `tel:` link, or "" when there is no number to dial. Keeps a leading +. */
export function telHref(phone: string | undefined): string {
  const raw = (phone ?? "").trim();
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.length < 6) return "";
  return `tel:${raw.startsWith("+") ? "+" : ""}${digits}`;
}

/** A WhatsApp chat with the number, or "" when it cannot be one. */
export function waHref(phone: string | undefined): string {
  const n = waNumber(phone);
  return n ? `https://wa.me/${n}` : "";
}

/** A `mailto:` link, or "" for something that is not an address. */
export function mailHref(email: string | undefined): string {
  const e = (email ?? "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? `mailto:${e}` : "";
}

/** Directions to the address in whatever maps app the phone hands it to. */
export function mapsHref(address: readonly string[] | undefined): string {
  const q = (address ?? [])
    .map((l) => l.trim())
    .filter(Boolean)
    .join(", ");
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : "";
}
