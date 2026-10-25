import { useEffect, useRef } from "react";
import { useRouter, type AnyRoute } from "@tanstack/react-router";
import { useChapters } from "@/cms/hooks";
import { afterPreloader } from "@/lib/motion";

/** Pages reached from the chapters rather than from the menu. */
const ALSO = ["/shop/$id", "/journal/$slug", "/checkout"];

type Connection = { saveData?: boolean; effectiveType?: string };

/**
 * Fetch every page's code while the browser has nothing better to do.
 *
 * Each route is its own chunk, and `defaultPreload: "intent"` only starts
 * fetching one when a pointer rests on its link. A tap on a phone, a
 * keyboard Enter or a quick click lands before that, and the visitor waits
 * on a round trip before anything moves. Once the first page has settled,
 * this pulls the rest down one at a time in idle periods, so by the time
 * anyone reaches for the menu every page is already on the device.
 *
 * Code only (`loadRouteChunk`), not loaders: the data is the CMS documents
 * the root already holds, and a loader run now would be stale by the time
 * it was used. Skipped entirely on Save-Data and 2G, where a visitor's
 * bandwidth is better spent on the page they are actually reading.
 */
export function RoutePrefetch() {
  const router = useRouter();
  const chapters = useChapters();
  const paths = useRef<string[]>([]);
  paths.current = [...new Set([...chapters.map((c) => c.to), ...ALSO])];

  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: Connection }).connection;
    if (conn?.saveData || /2g$/.test(conn?.effectiveType ?? "")) return;

    let cancelled = false;
    let idle = 0;
    /* Safari has no requestIdleCallback; a short timer stands in. */
    const hasIdle = typeof window.requestIdleCallback === "function";
    const whenIdle = (fn: () => void) =>
      hasIdle ? window.requestIdleCallback(fn, { timeout: 3000 }) : window.setTimeout(fn, 600);
    const cancelIdle = (id: number) =>
      hasIdle ? window.cancelIdleCallback(id) : window.clearTimeout(id);

    /* looked up by the path the chapter table uses, which the generated
     * route types cannot know ahead of time */
    const byPath = router.routesByPath as unknown as Record<string, AnyRoute | undefined>;
    const queue = paths.current.filter((p) => p !== window.location.pathname && byPath[p]);

    const step = () => {
      const path = queue.shift();
      if (cancelled || !path) return;
      Promise.resolve(router.loadRouteChunk(byPath[path]!))
        .catch(() => {
          /* a chunk that fails here is fetched again on click, as before */
        })
        .finally(() => {
          if (!cancelled) idle = whenIdle(step);
        });
    };

    const stop = afterPreloader(() => {
      idle = whenIdle(step);
    });

    return () => {
      cancelled = true;
      stop();
      cancelIdle(idle);
    };
  }, [router]);

  return null;
}
