import { createFileRoute } from "@tanstack/react-router";
import { AdminHeading } from "@/components/admin/AdminShell";
import { CollectionList } from "@/components/admin/CollectionList";
import { ViewLive } from "@/components/admin/DocEditor";
import { commerceCollections } from "@/cms/collections";

export const Route = createFileRoute("/admin/shop")({
  component: ShopEditor,
});

function ShopEditor() {
  return (
    <>
      <AdminHeading
        title="Shop & pricing"
        standfirst="Products, prices, stock, discount codes and delivery costs."
        aside={<ViewLive path="/shop" />}
      />

      <div className="mb-8 border-l-2 border-acid-type bg-surface-deep py-4 pl-5 pr-6">
        <p className="max-w-[70ch] font-ui text-[13px] leading-[1.6] text-mute">
          <span className="font-semibold text-text">
            Prices and stock are enforced at checkout.
          </span>{" "}
          What you set here is what a buyer is charged — the server re-prices every order against
          this list and will not sell more than the stock number, so a typo in a price is a real
          price. Stock at zero shows the product as sold out rather than hiding it.
        </p>
      </div>

      <CollectionList items={commerceCollections} />
    </>
  );
}
