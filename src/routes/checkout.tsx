import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { pageHead } from "@/lib/seo";

/**
 * Checkout sits outside the seven-chapter loop on purpose.
 *
 * `PageShell` gives a page a drafting index, a breadcrumb and prev/next
 * doors, and every one of those is wrong here: this is a transaction, not a
 * room in the building, and offering "next chapter" to someone mid-order is
 * an invitation to lose their basket. It gets a plain header instead, and
 * `noindex` — a per-person page is no use to a search engine.
 */
export const Route = createFileRoute("/checkout")({
  head: () =>
    pageHead({
      title: "Checkout | Limon Bandit",
      description: "Confirm your order and where it should go.",
      path: "/checkout",
      noindex: true,
    }),
  component: Checkout,
});

function Checkout() {
  return (
    <main id="main" className="relative w-full bg-surface-deep">
      <header className="shell relative z-[2] pb-10 pt-[160px]">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 font-ui text-[10px] font-semibold uppercase tracking-[0.16em] text-mute">
            <li>
              <Link to="/" className="transition-colors duration-300 hover:text-text">
                LMN&middot;BNDT
              </Link>
            </li>
            <li aria-hidden="true" className="opacity-50">
              /
            </li>
            <li>
              <Link to="/shop" className="transition-colors duration-300 hover:text-text">
                Shop
              </Link>
            </li>
            <li aria-hidden="true" className="opacity-50">
              /
            </li>
            <li aria-current="page" className="text-text">
              Checkout
            </li>
          </ol>
        </nav>

        {/* focus lands here on navigation — see RouteTransition */}
        <h1 data-page-h1 tabIndex={-1} className="t-h2 mt-8 max-w-[18ch] text-text outline-none">
          Checkout
        </h1>
      </header>

      <CheckoutForm />
    </main>
  );
}
