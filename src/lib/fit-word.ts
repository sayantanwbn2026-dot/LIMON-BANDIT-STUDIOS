/**
 * Fit a one-word wordmark to a measure by the ink, not by the box.
 *
 * The poster lockups size their big word so it spans the measure exactly,
 * and they used to measure the word's layout box to do it. A box starts at
 * the first glyph's origin, and every glyph carries a side bearing — the
 * space the face leaves before the stroke begins. So the box sat flush and
 * the letter did not: the stem of the B in BANDIT stood 5px inside the
 * logo and the acid square above it on a phone, and the bearing grows with
 * the type, ~20px at desktop size, exactly where it is most visible.
 *
 * This measures the first and last glyphs' bearings with canvas text
 * metrics, sizes the word so the visible strokes span the measure, and
 * returns the shift that moves the first stroke onto the left rule.
 *
 * `clipped` is for a word whose letters each sit in an overflow-hidden box
 * (the home hero masks each letter for its rise-in). With negative
 * tracking a glyph is wider than its box, so what shows on the right is
 * the box edge rather than the ink, and the fit has to land that on the
 * rule instead.
 */

export type WordFit = {
  /** font size in px */
  size: number;
  /** horizontal shift in em, applied as margin-left */
  shift: number;
};

let ctx: CanvasRenderingContext2D | null | undefined;

/* Canvas reports ink bounds in whole pixels, so they are read at 1000px and
 * scaled down: at 100px the B's bearing came back as 7 for a true ~6.2,
 * an error the fit then multiplied by 3.5 at desktop size. */
const PROBE = 1000;

/** The first and last glyphs' side bearings, in px at a 100px font size. */
function bearings(cs: CSSStyleDeclaration, text: string) {
  ctx ??= document.createElement("canvas").getContext("2d");
  if (!ctx) return { left: 0, right: 0 };
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${PROBE}px ${cs.fontFamily}`;
  const first = ctx.measureText(text[0]);
  const last = ctx.measureText(text[text.length - 1]);
  const k = 100 / PROBE;
  return {
    /* positive when the stroke starts right of the origin, as it does on B */
    left: -first.actualBoundingBoxLeft * k,
    /* positive when the stroke stops short of the advance */
    right: (last.width - last.actualBoundingBoxRight) * k,
  };
}

export function fitWordToMeasure(
  el: HTMLElement,
  text: string,
  target: number,
  { clipped = false }: { clipped?: boolean } = {},
): WordFit | null {
  if (!target || !text) return null;
  el.style.marginLeft = "0px";
  el.style.fontSize = "100px";
  const box = el.getBoundingClientRect().width;
  if (!box) return null;

  const cs = getComputedStyle(el);
  /* px at 100px; applied after every glyph, the last one included */
  const spacing = parseFloat(cs.letterSpacing) || 0;
  const { left, right } = bearings(cs, text);

  /* What is visible at each end. Clipped, a stroke cannot reach past its
   * own box: not left of the first glyph's origin, not right of the last
   * box, which negative tracking pulls in from the advance. */
  const visibleLeft = clipped ? Math.max(left, 0) : left;
  const advanceEnd = box - spacing;
  const visibleRight = advanceEnd - (clipped ? Math.max(right, -spacing) : right);
  const ink = visibleRight - visibleLeft;
  if (ink <= 0) return null;

  const size = (target / ink) * 100;
  const shift = -visibleLeft / 100;
  el.style.fontSize = `${size}px`;
  el.style.marginLeft = `${shift}em`;
  return { size, shift };
}
