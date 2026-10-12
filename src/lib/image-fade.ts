/**
 * Let an image arrive instead of appearing.
 *
 * A lazy image is blank until it has been fetched and decoded, then it is
 * simply THERE, whole, in one frame. On the shop that is twenty cards each
 * snapping in at its own moment as you scroll — the grid assembles itself
 * with a stutter. A short fade turns the same events into one soft motion.
 *
 * It is a REF CALLBACK rather than state, and that is deliberate. The usual
 * version hides the image in markup (`opacity: 0`) and reveals it from
 * `onLoad`, and that has one famous failure: an image that finished loading
 * before React attached the handler — anything cached, anything decoded
 * between the HTML arriving and hydration — never fires `load` again, so it
 * stays invisible for ever. Here the SSR markup is untouched and fully
 * visible; this only takes effect on an image that is demonstrably still
 * loading at the moment it runs, and `complete` is checked synchronously in
 * the same tick the listeners are attached, so there is no gap for the event
 * to fall into.
 *
 * `complete` rather than `naturalWidth`: a BROKEN image is also `complete`
 * (with a width of zero), and its `load` event has already come and gone as
 * an `error`. Treating it as "still loading" would hide its alt text behind
 * a fade that can never start.
 *
 * Failing open is the rule. Every path that is not "this image is mid-load
 * right now" leaves it exactly as it was, and `load` and `error` both end the
 * hidden state, so nothing here can strand an image at zero opacity.
 *
 * Not for priority images. The hero is the LCP and is part of the
 * preloader's choreography; fading it would delay the one paint the page is
 * measured on.
 *
 * Returns a cleanup (React 19 ref-callback form) so a fast route change
 * leaves no listeners behind.
 */
export function fadeInOnLoad(img: HTMLImageElement | null) {
  if (!img || typeof window === "undefined") return;
  if (img.complete) return;

  img.classList.add("lb-img-pending");

  const done = () => {
    img.classList.remove("lb-img-pending");
    /* Left on the element afterwards, on purpose: the animation uses a
     * `backwards` fill so it has no effect once it has run, and the class is
     * a record that this image faded — which is also what lets a test count
     * them. */
    img.classList.add("lb-img-in");
    img.removeEventListener("load", done);
    img.removeEventListener("error", done);
  };

  img.addEventListener("load", done);
  img.addEventListener("error", done);

  return () => {
    img.removeEventListener("load", done);
    img.removeEventListener("error", done);
    /* Unmounting mid-load must not leave the node hidden if it is reused. */
    img.classList.remove("lb-img-pending");
  };
}
