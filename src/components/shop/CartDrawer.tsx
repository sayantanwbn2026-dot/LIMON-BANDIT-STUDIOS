import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, Undo2 } from "lucide-react";
import { Modal } from "@/components/lb/Modal";
import { CmsImage } from "@/components/lb/CmsImage";
import { useCart } from "@/lib/cart";
import { useShipping } from "@/cms/hooks";
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
 *
 * Three things it is careful about:
 *
 *   The total and the checkout button are pinned to the bottom of the
 *   drawer. With four or five lines in it they used to be below the fold, so
 *   the one control the drawer exists for had to be hunted for.
 *
 *   Nothing is lost by one tap. Removing a line — or stepping the last one
 *   down to zero, which is the same thing wearing a minus sign — leaves an
 *   Undo behind rather than a gap where a jacket used to be.
 *
 *   The delivery chips quote the CMS's own rates. They used to say "Free"
 *   and "₹120" in the markup, which was true until the day an editor changed
 *   the rate and the chip disagreed with the Shipping line six inches below
 *   it.
 */
export function CartDrawer() {
  const cart = useCart();
  const shipping = useShipping();

  /** The last line taken out, kept just long enough to put back. */
  const [undo, setUndo] = useState<{
    productId: string;
    size: string | null;
    qty: number;
    title: string;
  } | null>(null);
  const undoTimer = useRef<number | null>(null);

  const forget = () => {
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
    undoTimer.current = null;
  };
  useEffect(() => forget, []);

  const dropLine = (productId: string, size: string | null, qty: number, title: string) => {
    cart.remove(productId, size);
    setUndo({ productId, size, qty, title });
    forget();
    undoTimer.current = window.setTimeout(() => setUndo(null), 9000);
  };

  const putBack = () => {
    if (!undo) return;
    cart.add(undo.productId, undo.size, undo.qty);
    setUndo(null);
    forget();
  };

  /* An empty drawer with an Undo in it is the one case where the undo must
   * outlive the list it came from, so it is rendered above both branches. */
  const undoStrip = undo ? (
    <div className="mb-6 flex items-center justify-between gap-4 border border-line bg-surface px-4 py-3">
      <p className="min-w-0 font-ui text-[13px] text-mute">
        Removed <span className="text-text">{undo.title}</span>.
      </p>
      <button
        type="button"
        onClick={putBack}
        className="flex h-11 shrink-0 items-center gap-2 px-2 font-ui text-[12px] font-bold uppercase tracking-[0.1em] text-acid-type transition-opacity duration-300 hover:opacity-70"
      >
        <Undo2 size={14} /> Undo
      </button>
    </div>
  ) : null;

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
          {undoStrip}
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
          {undoStrip}

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
                      className="flex h-11 items-center px-2 font-ui text-[12px] font-bold uppercase tracking-[0.1em] text-acid-type"
                    >
                      Remove
                    </button>
                  </li>
                );
              }

              const capped = line.qty >= p.stock;

              return (
                <li key={key} className="flex gap-4 border-b border-line py-5">
                  <div className="h-[84px] w-[84px] shrink-0 overflow-hidden bg-surface-raised">
                    <CmsImage
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
                          label={
                            line.qty <= 1
                              ? `Remove ${p.title} from your cart`
                              : `Reduce quantity of ${p.title}`
                          }
                          onClick={() =>
                            line.qty <= 1
                              ? dropLine(line.productId, line.size, line.qty, p.title)
                              : cart.setQty(line.productId, line.size, line.qty - 1)
                          }
                        >
                          {/* At one, the minus IS the bin — say so rather than
                           * letting a step button delete something. */}
                          {line.qty <= 1 ? <Trash2 size={13} /> : <Minus size={13} />}
                        </StepButton>
                        <span className="tnum w-9 text-center font-ui text-[13px] font-semibold text-text">
                          {line.qty}
                        </span>
                        <StepButton
                          label={`Increase quantity of ${p.title}`}
                          disabled={capped}
                          onClick={() => cart.setQty(line.productId, line.size, line.qty + 1)}
                        >
                          <Plus size={13} />
                        </StepButton>
                      </div>

                      <span className="tnum font-display text-[15px] font-extrabold tracking-[-0.01em] text-text">
                        {inr(line.lineTotal)}
                      </span>
                    </div>

                    {capped ? (
                      <p className="mt-2 font-ui text-[11px] text-mute">
                        That is all {p.stock === 1 ? "there is" : `${p.stock} we have`}.
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => dropLine(line.productId, line.size, line.qty, p.title)}
                    aria-label={`Remove ${p.title} from your cart`}
                    className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center text-mute transition-colors duration-300 hover:text-acid-type"
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
                  note={shipping.kolkata ? inr(shipping.kolkata) : "Free"}
                />
                <RegionChip
                  on={cart.region === "india"}
                  onClick={() => cart.setRegion("india")}
                  label="Rest of India"
                  note={shipping.india ? inr(shipping.india) : "Free"}
                />
              </div>
            </fieldset>
          ) : null}

          {/* ---- the part you came for ----
           * Pinned to the bottom of the scrolling body, pulled out to the
           * drawer's edges so the list runs under it rather than beside it.
           * A basket with five things in it used to hide its own total. */}
          <div className="sticky bottom-0 -mx-6 -mb-6 mt-8 border-t border-line bg-surface-deep px-6 pb-6 pt-5 sm:-mx-8 sm:-mb-8 sm:px-8 sm:pb-8">
            <dl>
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
              <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
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
              className="mt-4 flex h-[56px] items-center justify-center bg-acid font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-accent-text transition-colors duration-300 hover:bg-acid-dim"
            >
              Checkout
            </Link>

            <p className="t-label mt-3 text-mute">
              Pay on delivery. We confirm stock by hand before anything is dispatched.
            </p>
          </div>
        </>
      )}
    </Modal>
  );
}

/** 44px, because a thumb is 44px — and the minus becomes a bin at one. */
function StepButton({
  children,
  onClick,
  label,
  disabled,
}: {
  children: ReactNode;
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
      className="flex h-11 w-11 items-center justify-center text-text transition-colors duration-300 hover:text-acid-type disabled:cursor-not-allowed disabled:text-mute disabled:opacity-40"
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
