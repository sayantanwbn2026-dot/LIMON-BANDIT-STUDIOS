import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    /* Fetch a page's code when the pointer reaches its link (or a finger
     * touches it), not when it is clicked. Every route is its own chunk,
     * so without this each click waited on a network round trip before
     * anything moved — on a phone connection, most of the time it took to
     * change pages. 50ms keeps a pointer just passing over the menu from
     * fetching all seven. */
    defaultPreload: "intent",
    defaultPreloadDelay: 50,
    /* A preload is reused if the click lands within 30s, rather than
     * thrown away and run again (0 meant every preload was wasted). Page
     * data comes from the CMS documents the root already holds, so there
     * is nothing in 30s that could go stale. */
    defaultPreloadStaleTime: 30_000,
  });

  return router;
};
