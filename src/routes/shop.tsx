import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/lb/PageShell";
import { ShopHero } from "@/components/heroes/ShopHero";
import { ShopGrid } from "@/components/shop/ShopGrid";
import { ShopPrint } from "@/components/shop/ShopPrint";
import { ShopOrder } from "@/components/shop/ShopOrder";
import { chapterHead } from "@/lib/seo";

export const Route = createFileRoute("/shop")({
  head: () => chapterHead("shop"),
  component: Shop,
});

function Shop() {
  return (
    <PageShell chapter="shop" hero={<ShopHero />}>
      {/* what is for sale, then why the runs are small, then how to get one */}
      <ShopGrid />
      <ShopPrint />
      <ShopOrder />
    </PageShell>
  );
}
