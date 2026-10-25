import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { THEME_INIT_SCRIPT } from "../lib/theme";
import { AUTH_CAPTURE_SCRIPT } from "../lib/auth-capture";
import { Nav } from "@/components/sections/Nav";
import { Footer } from "@/components/sections/Footer";
import { Noise } from "@/components/lb/Noise";
import { Cursor } from "@/components/lb/Cursor";
import { SmoothScroll } from "@/components/lb/SmoothScroll";
import { SkipLink } from "@/components/lb/SkipLink";
import { SectionRule } from "@/components/lb/SectionRule";
import { ScrollReveal } from "@/components/lb/ScrollReveal";
import { ScrollProgress } from "@/components/lb/ScrollProgress";
import { StageLight } from "@/components/lb/StageLight";
import { GridRules } from "@/components/lb/GridRules";
import { RouteTransition } from "@/components/lb/RouteTransition";
import { RoutePrefetch } from "@/components/lb/RoutePrefetch";
import { MiniTransport } from "@/components/lb/MiniTransport";
import { PlayerProvider } from "@/lib/player";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import { ToastProvider } from "@/lib/toast";
import { AuthModal } from "@/components/shop/AuthModal";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { WishlistDrawer } from "@/components/shop/WishlistDrawer";
import { FlashOffer } from "@/components/shop/FlashOffer";
import { AuthLanding } from "@/components/shop/AuthLanding";
import { ContentProvider } from "@/cms/content";
import { Toaster } from "@/components/lb/Toaster";
import { liveDocs, primeDocs, docFrom, listFrom } from "@/cms/live";
import { Analytics } from "@/components/lb/Analytics";
import { useWords, type SiteDoc, type PageDoc } from "@/cms/hooks";
import { fill, WORDS, type Words } from "@/cms/words";
import { siteNameFrom } from "@/lib/seo";

/**
 * The 404 and error screens.
 *
 * Both were the shadcn defaults — rounded, generic, off-brand — which is the
 * one thing every other page on this site has been redrawn to avoid. Nothing
 * fancy is called for here: the shell, the drafting grid, an acid mark, and
 * two of the same square buttons the rest of the site uses. The house
 * language, quietly, on the pages a visitor sees when something is wrong.
 */
function NotFoundComponent() {
  const w = useWords("system");
  return (
    <main
      id="main"
      className="relative flex min-h-screen w-full items-center overflow-hidden bg-surface-deep"
    >
      <GridRules tone="dark" />
      <div className="shell relative z-[2] max-w-[640px] pt-[calc(var(--nav-h)+56px)]">
        <span className="mb-8 flex items-center gap-3">
          <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-acid" />
          <span className="tnum font-ui text-[10px] font-bold uppercase tracking-[0.18em] text-mute">
            {w.notFoundLabel}
          </span>
        </span>

        <h1
          className="font-display text-[52px] font-extrabold uppercase leading-[0.95] tracking-[-0.03em] text-text md:text-[68px]"
          data-page-h1
          tabIndex={-1}
        >
          {w.notFoundTitle}
        </h1>

        <p className="mt-8 max-w-[46ch] font-ui text-[16px] leading-[1.6] text-mute md:text-[18px]">
          {w.notFoundBody}
        </p>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            to="/"
            className="flex h-[56px] items-center justify-center bg-acid px-8 font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-accent-text transition-colors duration-300 hover:bg-acid-dim"
          >
            {w.notFoundHome}
          </Link>
          <Link
            to="/shop"
            className="flex h-[56px] items-center justify-center border border-line px-8 font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-text transition-colors duration-300 hover:border-acid-type"
          >
            {w.notFoundShop}
          </Link>
        </div>
      </div>
    </main>
  );
}

/* `error` is `unknown`, not `Error`.
 *
 * That is the router's own type for it, and it is the honest one: anything
 * can be thrown, and a boundary that assumes otherwise is one `throw "nope"`
 * away from a crash inside the crash screen. Nothing here reads a property
 * off it — it is logged and handed to the reporter, both of which take
 * unknown — so narrowing it would buy nothing. */
function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const w = useWords("system");
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <main
      id="main"
      className="relative flex min-h-screen w-full items-center overflow-hidden bg-surface-deep"
    >
      <GridRules tone="dark" />
      <div className="shell relative z-[2] max-w-[640px] pt-[calc(var(--nav-h)+56px)]">
        <span className="mb-8 flex items-center gap-3">
          <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-acid" />
          <span className="tnum font-ui text-[10px] font-bold uppercase tracking-[0.18em] text-mute">
            {w.errorLabel}
          </span>
        </span>

        <h1
          className="font-display text-[42px] font-extrabold uppercase leading-[1] tracking-[-0.03em] text-text md:text-[52px]"
          data-page-h1
          tabIndex={-1}
        >
          {w.errorTitle}
        </h1>

        <p className="mt-8 max-w-[46ch] font-ui text-[16px] leading-[1.6] text-mute md:text-[18px]">
          {w.errorBody}
        </p>

        <div className="mt-12 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="flex h-[56px] items-center justify-center bg-acid px-8 font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-accent-text transition-colors duration-300 hover:bg-acid-dim"
          >
            {w.errorRetry}
          </button>
          <a
            href="/"
            className="flex h-[56px] items-center justify-center border border-line px-8 font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-text transition-colors duration-300 hover:border-acid-type"
          >
            {w.errorHome}
          </a>
        </div>
      </div>
    </main>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  /* The defaults every page starts from, before its own head overrides
   * them — read from the CMS (Brand & contact, and the home row of Page
   * titles & SEO) like every page's own, rather than typed in here. */
  head: ({ loaderData }) => {
    const docs = loaderData?.cms ?? {};
    const site = docFrom<SiteDoc>(docs, "global.site");
    const home = listFrom<PageDoc>(docs, "global.pages").find((p) => p?.key === "home");
    const system = {
      ...WORDS.system,
      ...docFrom<Partial<Words["system"]>>(docs, "global.words.system"),
    };
    const name = siteNameFrom(docs);
    const title = home?.title?.trim() || name;
    const description = home?.description?.trim() || site.description;
    return {
      meta: [
        { charSet: "utf-8" },
        {
          name: "viewport",
          /* viewport-fit=cover is what makes env(safe-area-inset-*) resolve to
           * anything but 0. Without it iOS letterboxes the page and the
           * full-bleed surfaces stop short of the screen edge. */
          content: "width=device-width, initial-scale=1, viewport-fit=cover",
        },
        { title },
        { name: "description", content: description },
        { name: "author", content: name },
        /* overwritten per-theme by THEME_INIT_SCRIPT before first paint */
        { name: "theme-color", content: "#050505" },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { property: "og:title", content: title },
        { name: "twitter:title", content: title },
        { property: "og:description", content: description },
        { name: "twitter:description", content: description },
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
        /* So a reader's browser or app can find the journal feed without
         being told it exists. */
        {
          rel: "alternate",
          type: "application/rss+xml",
          title: fill(system.feedTitle || WORDS.system.feedTitle, { name }),
          href: "/feed.xml",
        },
      ],
    };
  },

  /* Every CMS document, read once on the server and dehydrated with the
   * page (cms/live.ts). `staleTime: Infinity` so a client-side navigation
   * does not refetch it — ContentProvider keeps it fresh from there. */
  loader: async () => ({ cms: await liveDocs() }),
  staleTime: Infinity,
  shouldReload: false,

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
        {/* Must also stay in <head> and stay blocking, for a different
            reason: it is the only code that runs before the router
            normalises the URL. The session a magic link hands back lives in
            the hash, and the router strips hash and query during hydration —
            measured, before the first timer fires — while supabase-js is a
            dynamic import that has not arrived yet. This copies the tokens
            out of the address bar before either of those can happen. See
            lib/auth-capture.ts. */}
        <script dangerouslySetInnerHTML={{ __html: AUTH_CAPTURE_SCRIPT }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

/**
 * The public site's chrome.
 *
 * Split out so `/admin` can skip all of it. Everything in here is hostile to
 * an editing surface — a custom cursor, hijacked scrolling, a route-change
 * curtain, a fixed nav over the top of the working area — and the admin
 * needs a plain document that stays where it was put.
 */
function SiteChrome() {
  return (
    <>
      <SkipLink />
      <SmoothScroll />
      <SectionRule />
      <ScrollReveal />
      <ScrollProgress />
      <StageLight />
      <Noise />
      <Cursor />
      <RouteTransition />
      <RoutePrefetch />
      <Nav />
      <Outlet />
      <Footer />
      <MiniTransport />

      {/* Mounted once, opened from anywhere. */}
      <AuthModal />
      <AuthLanding />
      <CartDrawer />
      <WishlistDrawer />
      <FlashOffer />
    </>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { cms } = Route.useLoaderData();
  /* During render, not in an effect: every route's `head` is built while
   * this subtree renders, and they read these documents (see primeDocs). */
  primeDocs(cms);
  const admin = useRouterState({ select: (s) => s.location.pathname.startsWith("/admin") });

  return (
    <QueryClientProvider client={queryClient}>
      {/* Global chrome, mounted once above the router so it survives
          navigation — the nav and footer never remount, and Lenis is not torn
          down and rebuilt between routes. */}
      {/* The audio element lives here, above the router, so playing a track
          on /label and then navigating does not stop the music. */}
      {/* (MotionConfig used to wrap everything here. It is now local to the two
          components that still animate with Framer Motion — Services and
          ContactForm — so the library is no longer in every page's first
          bundle. The note below describes why it is set to "user".) */}
      {/* Framer Motion honours prefers-reduced-motion from here, matching what
          every GSAP effect on the site already checks via prefersReducedMotion().
          Without this the two systems disagree: the scroll choreography would
          stand still while the component transitions kept animating. `user`
          reduces transforms and keeps opacity, which is the intent — nothing
          moves, things still appear. */}
      {/* The shop providers nest inside-out by dependency: the cart and the
          wishlist both read the session, so Auth wraps them. All three sit
          above the router for the same reason the audio element does — a
          basket that emptied itself on navigation would be worse than no
          basket, and the login popup has to be able to open over any page.
          The gate's pending action (see lib/auth) only survives navigation
          because the provider holding it never unmounts. */}
      <>
        <ToastProvider>
          <AuthProvider>
            <ContentProvider initial={cms}>
              <CartProvider>
                <WishlistProvider>
                  <PlayerProvider>
                    <Analytics />
                    {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
                    {admin ? <Outlet /> : <SiteChrome />}
                    {/* Outside the chrome switch: the admin needs to be
                     * able to say "saved" too. */}
                    <Toaster />
                  </PlayerProvider>
                </WishlistProvider>
              </CartProvider>
            </ContentProvider>
          </AuthProvider>
        </ToastProvider>
      </>
    </QueryClientProvider>
  );
}
