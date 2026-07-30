import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { THEME_INIT_SCRIPT } from "../lib/theme";
import { Nav } from "@/components/sections/Nav";
import { Footer } from "@/components/sections/Footer";
import { Noise } from "@/components/lb/Noise";
import { Cursor } from "@/components/lb/Cursor";
import { SmoothScroll } from "@/components/lb/SmoothScroll";
import { SkipLink } from "@/components/lb/SkipLink";
import { RouteTransition } from "@/components/lb/RouteTransition";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Limon Bandit — Kolkata Music House" },
      {
        name: "description",
        content: "Four rooms, one label, and a merch line. Run out of a building in Kolkata.",
      },
      { name: "author", content: "Limon Bandit" },
      /* overwritten per-theme by THEME_INIT_SCRIPT before first paint */
      { name: "theme-color", content: "#050505" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Limon Bandit — Kolkata Music House" },
      { name: "twitter:title", content: "Limon Bandit — Kolkata Music House" },
      {
        property: "og:description",
        content: "Four rooms, one label, and a merch line. Run out of a building in Kolkata.",
      },
      {
        name: "twitter:description",
        content: "Four rooms, one label, and a merch line. Run out of a building in Kolkata.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b1cedbea-3211-4616-a001-76f4d66bb912/id-preview-7ec2de84--81d10571-0622-4cc6-87cb-939b87a35638.lovable.app-1785234511091.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b1cedbea-3211-4616-a001-76f4d66bb912/id-preview-7ec2de84--81d10571-0622-4cc6-87cb-939b87a35638.lovable.app-1785234511091.png",
      },
    ],
    links: [
      /* Fonts are self-hosted (see scripts/fonts.mjs). Preload only the two
         faces that render above the fold — the hero wordmark and the corner
         stations. Preloading more would compete with the LCP image. */
      {
        rel: "preload",
        href: "/fonts/sora-800.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/fonts/switzer-500.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    /* THEME_INIT_SCRIPT sets data-theme on <html> before React hydrates, so
       the client DOM legitimately differs from the server markup here. */
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        {/* Must stay in <head> and stay blocking — it sets data-theme before
            the first paint, which is what prevents a flash of the wrong
            theme on load. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Global chrome, mounted once above the router so it survives
          navigation — the nav and footer never remount, and Lenis is not torn
          down and rebuilt between routes. */}
      <SkipLink />
      <SmoothScroll />
      <Noise />
      <Cursor />
      <RouteTransition />
      <Nav />
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Footer />
    </QueryClientProvider>
  );
}
