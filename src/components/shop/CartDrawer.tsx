import { Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/lb/Modal";
import { Picture } from "@/components/lb/Picture";
import { useCart } from "@/lib/cart";
import { inr } from "@/lib/money";

/**
 * The basket, as a drawer.
 *
 * It shows the arithmetic rather than just the answer — subtotal, discount,
 * shipping, total — because the total is collected in cash at the door and a
 * number nobody can account for is a number that gets argued about on a
 * doorstep.
 *
 * The totals here are for reading. The ones that count are recomputed on the
 * server when the order is placed, from the same catalogue, so what is shown
 * and what is charged cannot drift apart.
 */
export function CartDrawer() {
  const cart = useCart();

  return (
    <Modal
      open={cart.open}
      onClose={() => cart.setOpen(false)}
      variant="drawer"
      title="Your cart"
      standfirst={
        cart.count === 0
          ? "Nothing in it yet."
          : `${cart.count} ${cart.count === 1 ? "item" : "items"}, held for you.`
      }
    >
      {cart.resolved.length === 0 ? (
        <div className="py-8">
          <p className="font-ui text-[15px] leading-[1.6] text-mute">
            Records, discs, prints and the merch runs are all in the shop. Nothing is repressed, so
            when a number is gone it stays gone.
          </p>
          <Link
            to="/shop"
            onClick={() => cart.setOpen(false)}
            className="mt-8 flex h-[56px] items-center justify-center border border-line font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-text transition-colors duration-300 hover:border-acid-type"
          >
            Go to the shop
          </Link>
        </div>
      ) : (
        <>
          <ul className="border-t border-line">
            {cart.resolved.map((line) => {
              const p = line.product;
              const key = `${line.productId}-${line.size ?? "one"}`;

              /* A product removed from the catalogue must not vanish silently
               * from a basket someone has been building. */
              if (!p) {
                return (
                  <li
                    key={key}
                    className="flex items-center justify-between gap-4 border-b border-line py-5"
                  >
                    <p className="font-ui text-[13px] text-mute">
                      An item in your cart is no longer sold.
                    </p>
                    <button
                      type="button"
                      onClick={() => cart.remove(line.productId, line.size)}
                      className="t-label text-acid-type"
                    >
                      Remove
                    </button>
                  </li>
                );
              }

              return (
                <li key={key} className="flex gap-4 border-b border-line py-5">
                  <div className="h-[84px] w-[84px] shrink-0 overflow-hidden bg-surface-raised">
                    <Picture
                      src={p.image}
                      sizes="84px"
                      alt=""
                      className="h-full w-full object-cover"
                      style={{ filter: "brightness(var(--img-brightness))" }}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-[15px] font-bold uppercase leading-[1.1] tracking-[-0.01em] text-text">
                      {p.title}
                    </h3>
                    <p className="mt-1 font-ui text-[12px] text-mute">
                      {p.by}
                      {line.size ? ` · ${line.size}` : ""}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center border border-line">
                        <StepButton
                          label={`Reduce quantity of ${p.title}`}
                          onClick={() => cart.setQty(line.productId, line.size, line.qty - 1)}
                        >
                          <Minus size={13} />
                        </StepButton>
                        <span className="tnum w-9 text-center font-ui text-[13px] font-semibold text-text">
                          {line.qty}
                        </span>
                        <StepButton
                          label={`Increase quantity of ${p.title}`}
                          disabled={line.qty >= p.stock}
                          onClick={() => cart.setQty(line.productId, line.size, line.qty + 1)}
                        >
                          <Plus size={13} />
                        </StepButton>
                      </div>

                      <span className="tnum font-display text-[15px] font-extrabold tracking-[-0.01em] text-text">
                        {inr(line.lineTotal)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => cart.remove(line.productId, line.size)}
                    aria-label={`Remove ${p.title} from your cart`}
                    className="h-8 w-8 shrink-0 text-mute transition-colors duration-300 hover:text-acid-type"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              );
            })}
          </ul>

          {!cart.allDigital ? (
            <fieldset className="mt-8">
              <legend className="t-label text-mute">Where it is going</legend>
              <div className="mt-4 flex gap-3">
                <RegionChip
                  on={cart.region === "kolkata"}
                  onClick={() => cart.setRegion("kolkata")}
                  label="Kolkata"
                  note="Free"
                />
                <RegionChip
                  on={cart.region === "india"}
                  onClick={() => cart.setRegion("india")}
                  label="Rest of India"
                  note={inr(120)}
                />
              </div>
            </fieldset>
          ) : null}

          <dl className="mt-8 border-t border-line pt-6">
            <Row k="Subtotal" v={inr(cart.subtotal)} />
            {cart.discount > 0 && cart.offer ? (
              <Row k={`Discount (${cart.offer.code})`} v={`− ${inr(cart.discount)}`} accent />
            ) : null}
            <Row
              k="Shipping"
              v={
                cart.allDigital
                  ? "None — digital"
                  : cart.shipping === 0
                    ? "Free"
                    : inr(cart.shipping)
              }
            />
            <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
              <dt className="font-display text-[16px] font-extrabold uppercase tracking-[-0.01em] text-text">
                Total
              </dt>
              <dd className="tnum font-display text-[24px] font-extrabold tracking-[-0.02em] text-text">
                {inr(cart.total)}
              </dd>
            </div>
          </dl>

          <Link
            to="/checkout"
            onClick={() => cart.setOpen(false)}
            className="mt-8 flex h-[60px] items-center justify-center bg-acid font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-accent-text transition-colors duration-300 hover:bg-acid-dim"
          >
            Checkout
          </Link>

          <p className="t-label mt-4 text-mute">
            Pay on delivery. We confirm stock by hand before anything is dispatched.
          </p>
        </>
      )}
    </Modal>
  );
}

function StepButton({
  children,
  onClick,
  label,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center text-text transition-colors duration-300 hover:text-acid-type disabled:cursor-not-allowed disabled:text-mute disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function RegionChip({
  on,
  onClick,
  label,
  note,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
  note: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`flex-1 px-3 py-3 text-left transition-colors duration-300 ${
        on ? "bg-acid text-accent-text" : "border border-line text-mute hover:border-acid-type"
      }`}
    >
      <span className="block font-ui text-[11px] font-bold uppercase tracking-[0.12em]">
        {label}
      </span>
      <span className="tnum mt-1 block font-ui text-[12px]">{note}</span>
    </button>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="font-ui text-[13px] text-mute">{k}</dt>
      <dd
        className={`tnum font-ui text-[13px] font-semibold ${accent ? "text-acid-type" : "text-text"}`}
      >
        {v}
      </dd>
    </div>
  );
}
