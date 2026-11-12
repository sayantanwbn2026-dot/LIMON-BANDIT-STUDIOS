/**
 * The house colour, and the three switches under it.
 *
 * `--accent` is the only colour this site has. It is the hero's lockup, every
 * primary button, the eyebrow dots, the rules that tick as you pass them and
 * the ring around a focused field — so it is also the single value that
 * changes the most for the least typing, which is exactly the kind of thing
 * an editor should be able to reach and exactly the kind of thing that goes
 * wrong when they can.
 *
 * WHAT GOES WRONG, AND WHY IT CANNOT HERE
 *
 * The acid yellow carries near-black type (`--accent-text`). Hand an editor a
 * colour picker and the first thing that happens is a navy accent with black
 * type on it, which is unreadable and which no amount of help text prevents,
 * because the person choosing the colour is looking at the swatch and not at
 * the button. So the contrast colour is not asked for: it is computed from
 * the colour they picked, by luminance, and it is always one of the two the
 * palette already contains. Pick a dark accent and the type on it goes white
 * on its own.
 *
 * `--accent-dim` is derived the same way rather than asked for, because it is
 * a decorative shade of the same colour and two colour fields describing one
 * decision is how palettes drift apart.
 *
 * Everything here is pure and has no DOM: the values are turned into a
 * blocking line of script in the root head (see `accentScript`), which is the
 * only way to repaint a custom property before the first frame. A stylesheet
 * written after hydration would show the shipped yellow for a beat and then
 * swap it, on every single page load.
 */

export type LookDoc = {
  accent?: string;
  grain?: boolean;
  cursor?: boolean;
  smooth?: boolean;
};

/**
 * "#E9FF00", "e9ff00", "#ef0" → "#e9ff00". Anything else → null.
 *
 * Null is the important half: an empty field, a colour name, a half-typed
 * value and a stray paste all mean "the house yellow", because a malformed
 * custom property does not fail loudly — it makes every acid surface on the
 * site fall back to whatever the browser last had, which on a first paint is
 * nothing at all.
 */
export function normalizeHex(raw: string | undefined): string | null {
  const v = raw?.trim().replace(/^#/, "").toLowerCase();
  if (!v) return null;
  if (/^[0-9a-f]{3}$/.test(v)) return `#${v[0]}${v[0]}${v[1]}${v[1]}${v[2]}${v[2]}`;
  if (/^[0-9a-f]{6}$/.test(v)) return `#${v}`;
  return null;
}

function channels(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

const toHex = (n: number) =>
  Math.max(0, Math.min(255, Math.round(n)))
    .toString(16)
    .padStart(2, "0");

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const srgb = channels(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

/* The two inks the palette already owns. Near-black rather than pure, to
 * match the shipped --accent-text; pure white on the other side, because a
 * dark accent needs every point of contrast it can get. */
const INK_DARK = "#080808";
const INK_LIGHT = "#ffffff";

/** WCAG contrast ratio between two luminances, 1 to 21. */
const ratio = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/**
 * The type colour for a surface painted in this accent — whichever of the
 * two house inks actually contrasts better, by ratio rather than by a
 * luminance threshold.
 *
 * The threshold version got hot pink wrong: at 0.35 luminance it sits just
 * under any sensible midpoint, so the rule said white, while the measured
 * ratios say black by three to one (7.9 against 2.7). Comparing the two
 * ratios has no midpoint to get wrong.
 */
export function accentInk(hex: string): string {
  const l = luminance(hex);
  return ratio(l, luminance(INK_DARK)) >= ratio(l, luminance(INK_LIGHT)) ? INK_DARK : INK_LIGHT;
}

/** A dimmed shade of the accent, for the decorative marks that use it. */
export function dimmed(hex: string, amount = 0.21): string {
  const [r, g, b] = channels(hex);
  const k = 1 - amount;
  return `#${toHex(r * k)}${toHex(g * k)}${toHex(b * k)}`;
}

export type AccentVars = {
  accent: string;
  accentText: string;
  accentDim: string;
};

/** The four tokens, or null when the editor has not chosen a colour. */
export function accentVars(doc: LookDoc | undefined): AccentVars | null {
  const accent = normalizeHex(doc?.accent);
  if (!accent) return null;
  return { accent, accentText: accentInk(accent), accentDim: dimmed(accent) };
}

/**
 * One blocking line in the head, which is the only place a custom property
 * can be changed before the first paint.
 *
 * `--accent-type` is set to the same value as `--accent`: the stylesheet
 * keeps them apart so the type pole can be tuned per theme, and a colour
 * chosen by an editor has no second value to tune it to.
 *
 * Returns "" when nothing was chosen, so the caller emits no script at all
 * rather than an empty one.
 */
export function accentScript(doc: LookDoc | undefined): string {
  const v = accentVars(doc);
  if (!v) return "";
  const set = (name: string, value: string) =>
    `d.setProperty(${JSON.stringify(name)},${JSON.stringify(value)});`;
  return (
    `(function(){try{var d=document.documentElement.style;` +
    set("--accent", v.accent) +
    set("--accent-type", v.accent) +
    set("--accent-text", v.accentText) +
    set("--accent-dim", v.accentDim) +
    `}catch(e){}})();`
  );
}
