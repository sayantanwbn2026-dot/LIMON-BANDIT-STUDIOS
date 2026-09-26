import { createFileRoute, notFound } from "@tanstack/react-router";
import { ProductPage } from "@/components/shop/ProductPage";
import { liveDocs, listFrom } from "@/cms/live";
import { useProducts, type ProductDoc } from "@/cms/hooks";
import { pageHead, productJsonLd } from "@/lib/seo";

/**
 * One product, at its own address.
 *
 * Resolved on the server against the CMS catalogue, so a link to a tee is a
 * real page — shareable, indexable, and a proper 404 when the run is deleted
 * rather than an empty frame that answers 200 to a crawler.
 */
export const Route = createFileRoute("/shop_/$id")({
  loader: async ({ params }) => {
    const docs = await liveDocs();
    const product = listFrom<ProductDoc>(docs, "commerce.products").find((p) => p.id === params.id);
    if (!product) throw notFound();
    const name = (docs["global.site"] as { name?: string } | undefined)?.name;
    return { product, siteName: name?.trim() || "Limon Bandit" };
  },
  head: ({ loaderData }) =>
    loaderData
      ? pageHead({
          title: `${loaderData.product.title} — ${loaderData.siteName}`,
          description:
            loaderData.product.blurb ||
            `${loaderData.product.title} by ${loaderData.product.by}, from the ${loaderData.siteName} shop.`,
          path: `/shop/${loaderData.product.id}`,
          ogType: "product",
          image: loaderData.product.image,
          jsonLd: productJsonLd(loaderData.product),
        })
      : {},
  component: OneProduct,
});

function OneProduct() {
  const { product } = Route.useLoaderData();
  /* The provider's copy wins once it is fresher — a price edited in the
   * admin should not need a reload to be the price on screen. */
  const live = useProducts().find((p) => p.id === product.id);
  return <ProductPage product={live ?? product} />;
}
