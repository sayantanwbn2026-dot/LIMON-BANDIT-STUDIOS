import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, LogOut, Package, ShoppingBag, User } from "lucide-react";
import { useAuth, displayName } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";

/**
 * The account and basket cluster, sitting in the fixed navbar — which is what
 * puts "sign in" on the home page, and on every other page, from one mount.
 *
 * Two controls, not four. A wishlist button and an orders button of their own
 * would put five 48px targets in a 64px bar, and on a 390pt phone that is
 * more width than there is; both live in the account menu instead, which is
 * where you go when you are thinking about your account anyway.
 *
 * The cart count is rendered inside the button's accessible name rather than
 * only as a badge, so a screen reader announces "Cart, 3 items" instead of
 * "Cart" and a stray "3".
 */
export function ShopBar() {
  const { user, loading, openAuth, signOut } = useAuth();
  const cart = useCart();
  const wishlist = useWishlist();
  const [menu, setMenu] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setMenu(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  return (
    <>
      <button
        type="button"
        onClick={() => cart.setOpen(true)}
        aria-label={`Cart, ${cart.count} ${cart.count === 1 ? "item" : "items"}`}
        className="relative flex h-11 w-11 items-center justify-center border border-line text-text transition-colors duration-300 hover:border-acid-type sm:h-12 sm:w-12"
      >
        <ShoppingBag size={17} />
        {cart.count > 0 ? (
          <span className="tnum absolute -right-[1px] -top-[1px] flex h-[18px] min-w-[18px] items-center justify-center bg-acid px-1 font-ui text-[10px] font-bold leading-none text-accent-text">
            {cart.count > 99 ? "99+" : cart.count}
          </span>
        ) : null}
      </button>

      <div ref={wrap} className="relative">
        {user ? (
          <>
            <button
              type="button"
              onClick={() => setMenu((v) => !v)}
              aria-expanded={menu}
              aria-haspopup="menu"
              aria-label={`Account menu for ${displayName(user)}`}
              className="flex h-11 items-center gap-2 border border-line px-2.5 text-text transition-colors duration-300 hover:border-acid-type sm:h-12 sm:px-3"
            >
              <span className="flex h-[18px] w-[18px] items-center justify-center bg-acid font-ui text-[10px] font-bold uppercase leading-none text-accent-text">
                {displayName(user).charAt(0)}
              </span>
              <span className="hidden font-ui text-[11px] font-bold uppercase tracking-[0.12em] sm:inline">
                {displayName(user)}
              </span>
            </button>

            {menu ? (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+8px)] w-[220px] border border-line bg-surface-deep"
              >
                <div className="border-b border-line px-4 py-3">
                  <p className="t-label text-mute">Signed in as</p>
                  <p className="mt-1 truncate font-ui text-[13px] font-semibold text-text">
                    {user.email}
                  </p>
                </div>

                <MenuButton
                  onClick={() => {
                    setMenu(false);
                    wishlist.setOpen(true);
                  }}
                  icon={<Heart size={14} />}
                  label="Wishlist"
                  badge={wishlist.count > 0 ? String(wishlist.count) : undefined}
                />

                <Link
                  to="/orders"
                  role="menuitem"
                  onClick={() => setMenu(false)}
                  className="flex items-center gap-3 border-b border-line px-4 py-3 font-ui text-[12px] font-semibold uppercase tracking-[0.1em] text-mute transition-colors duration-300 hover:bg-surface-raised hover:text-text"
                >
                  <Package size={14} />
                  Orders
                </Link>

                <MenuButton
                  onClick={() => {
                    setMenu(false);
                    void signOut();
                  }}
                  icon={<LogOut size={14} />}
                  label="Sign out"
                  last
                />
              </div>
            ) : null}
          </>
        ) : (
          <button
            type="button"
            onClick={() => openAuth()}
            disabled={loading}
            /* aria-label is unconditional. Below `sm` the visible "Sign in"
             * text is hidden, and a bare user icon with no accessible name
             * reads as an unlabeled button to a screen reader. */
            aria-label="Sign in"
            className="flex h-11 items-center gap-2 border border-line px-2.5 text-text transition-colors duration-300 hover:border-acid-type disabled:opacity-50 sm:h-12 sm:px-3"
          >
            <User size={16} aria-hidden="true" />
            <span className="hidden font-ui text-[11px] font-bold uppercase tracking-[0.12em] sm:inline">
              Sign in
            </span>
          </button>
        )}
      </div>
    </>
  );
}

function MenuButton({
  onClick,
  icon,
  label,
  badge,
  last,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: string;
  last?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left font-ui text-[12px] font-semibold uppercase tracking-[0.1em] text-mute transition-colors duration-300 hover:bg-surface-raised hover:text-text ${
        last ? "" : "border-b border-line"
      }`}
    >
      {icon}
      {label}
      {badge ? <span className="tnum ml-auto text-acid-type">{badge}</span> : null}
    </button>
  );
}
