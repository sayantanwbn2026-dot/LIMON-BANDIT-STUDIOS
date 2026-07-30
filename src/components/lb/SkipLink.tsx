/**
 * First focusable element on every page. Hidden until focused, then a hard
 * acid block in the top-left — square, like everything else here.
 */
export function SkipLink() {
  return (
    <a href="#main" className="lb-skip">
      Skip to content
    </a>
  );
}
