import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getSupabase } from "@/lib/supabase";
import { seeds } from "./seeds";

/**
 * How the live site reads CMS content.
 *
 * One fetch of every document on mount, held in a context, with the compiled
 * seed data as the fallback. That shape is deliberate on three counts:
 *
 *   **One request, not twenty.** All the documents together are a few hundred
 *   kilobytes of JSON. Fetching them per-section would put a dozen round
 *   trips in front of first paint for no benefit.
 *
 *   **The seeds are the floor, not a loading state.** `useDoc` returns seed
 *   data immediately and swaps to the stored document when it lands. If
 *   Supabase is unreachable, misconfigured, or the row was never seeded, the
 *   site renders exactly what it renders today rather than a blank section.
 *   A CMS that can take the site down when the database hiccups is a worse
 *   site than one with hardcoded copy.
 *
 *   **Server-render gets the live content.** The root loader reads the
 *   store over REST (cms/live.ts) and passes it in as `initial`, so the HTML
 *   already carries whatever the editor last saved. The mount fetch below
 *   still runs, which keeps a long-open tab current and is what `refresh()`
 *   uses after an admin save.
 */

type Docs = Record<string, unknown>;

type ContentState = {
  docs: Docs;
  /** false until the first fetch settles; the site renders regardless */
  loaded: boolean;
  /** the fetch failed — the site is running on seed data */
  offline: boolean;
  refresh: () => Promise<void>;
};

const Ctx = createContext<ContentState | null>(null);

export function ContentProvider({
  children,
  initial,
}: {
  children: ReactNode;
  /** Documents fetched by the root loader (see cms/live.ts), so the server
   * render and the first client render already carry the edited content. */
  initial?: Docs;
}) {
  const [docs, setDocs] = useState<Docs>(initial ?? {});
  const [loaded, setLoaded] = useState(Boolean(initial && Object.keys(initial).length));
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    const supabase = await getSupabase();
    if (!supabase) {
      setOffline(true);
      setLoaded(true);
      return;
    }
    const { data, error } = await supabase.from("cms_documents").select("key, data");
    if (error) {
      console.error("cms: could not load content, running on seed data", error);
      setOffline(true);
      setLoaded(true);
      return;
    }
    const next: Docs = {};
    for (const row of data ?? []) next[row.key as string] = row.data;
    setDocs(next);
    setOffline(false);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const value = useMemo<ContentState>(
    () => ({ docs, loaded, offline, refresh: load }),
    [docs, loaded, offline, load],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * Read one document.
 *
 * Falls back to the seed for that key, so a caller never has to handle
 * undefined and no section can render empty. `T` is the caller's assertion
 * about the shape — the store is JSON and cannot promise it, which is why
 * `useList` below guards the array case rather than trusting a cast.
 */
export function useDoc<T>(key: string): T {
  const ctx = useContext(Ctx);
  const seed = seeds[key] as T | undefined;
  if (!ctx) return (seed ?? ({} as T)) as T;
  const stored = ctx.docs[key];
  if (stored === undefined || stored === null) return (seed ?? ({} as T)) as T;
  return stored as T;
}

/**
 * Read a list document, guaranteed to be an array.
 *
 * A stored document can be the wrong shape — someone empties a collection, or
 * a key gets written by hand — and a section that maps over it would take the
 * whole page down with it. Anything that is not a non-empty array falls back
 * to the seed.
 */
export function useList<T>(key: string): T[] {
  const value = useDoc<unknown>(key);
  if (Array.isArray(value) && value.length > 0) return value as T[];
  const seed = seeds[key];
  return Array.isArray(seed) ? (seed as T[]) : [];
}

/** Whether the site is currently running on committed seed data. */
export function useContentStatus() {
  const ctx = useContext(Ctx);
  return { loaded: ctx?.loaded ?? false, offline: ctx?.offline ?? true };
}
