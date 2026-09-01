import { useSyncExternalStore } from "react";

/**
 * Which token pole the page under the fixed navbar sits on.
 *
 * The bar is transparent until 600px of scroll and its logotype and burger
 * are primary-pole, so a page whose surface is the *opposite* pole renders
 * the whole navigation invisible for the first 600px. Journal is exactly
 * that page — an inverted chapter end to end.
 *
 * The navbar lives in __root, above the router, so it cannot read the route's
 * surface by context. A module store is the smallest thing that crosses that
 * boundary; PageShell sets it, Nav reads it.
 */
export type NavPole = "primary" | "alt";

let pole: NavPole = "primary";
const subscribers = new Set<() => void>();

export function setNavPole(next: NavPole) {
  if (next === pole) return;
  pole = next;
  subscribers.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

const getSnapshot = () => pole;
/* Always primary on the server: the pole is applied in an effect, so a
 * server snapshot of anything else would mismatch on hydration. */
const getServerSnapshot = (): NavPole => "primary";

export function useNavPole() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
