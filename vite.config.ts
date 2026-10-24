// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

/* The browser entry was one 550 kB chunk — react-dom, GSAP, the router and
 * the app together — which is what Vite's "Some chunks are larger than
 * 500 kB" warning in the Vercel build log was about. React and the motion
 * libraries now get chunks of their own, and the entry is 241 kB. The
 * landing page downloads the same bytes as before (212.0 → 211.9 kB
 * gzipped), and those two chunks stay cached across deploys, because
 * library code only changes when the dependency does. Browser build only;
 * the server bundle is left exactly as nitro packs it.
 *
 * One `name` function rather than a `test` per group: with separate
 * test-based groups rolldown 1.1 only ever built the first one. */
const vendor = (pkgs: string) => new RegExp(String.raw`[\\/]node_modules[\\/](?:${pkgs})[\\/]`);
const REACT = vendor("react|react-dom|scheduler");
const MOTION = vendor("gsap|lenis");

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    environments: {
      client: {
        build: {
          rolldownOptions: {
            output: {
              codeSplitting: {
                groups: [
                  {
                    name: (id: string) =>
                      REACT.test(id) ? "vendor-react" : MOTION.test(id) ? "vendor-motion" : null,
                  },
                ],
              },
            },
          },
        },
      },
    },
  },
});
