import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, Mail, MessageCircle, Phone } from "lucide-react";
import { AdminHeading } from "@/components/admin/AdminShell";
import { Empty, InboxError, Pill, Toolbar } from "@/components/admin/Inbox";
import {
  EMPTY_HINT,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  listOrders,
  updateOrder,
  type OrderRow,
  type OrderStatus,
  type PaymentStatus,
  downloadCsv,
  matches,
  when,
} from "@/cms/inbox";
import { inr } from "@/lib/money";
import { sendOrderStatusMail } from "@/lib/order-mail";
import { getSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/orders")({
  component: Orders,
});

type Tab = "open" | "shipped" | "delivered" | "cancelled" | "all";

/* "Open" is everything that still needs a hand on it before it leaves. */
const OPEN: OrderStatus[] = ["received", "confirmed", "packed"];

const tabOf = (s: OrderStatus): Exclude<Tab, "all"> =>
  OPEN.includes(s) ? "open" : (s as Exclude<Tab, "all" | "open">);

/**
 * Every order, newest first, workable from here: move it through
 * received → confirmed → packed → shipped → delivered, mark it paid when the
 * courier's cash comes in, and reach the customer in one tap.
 *
 * The status written here is the same column the Google Sheet was fed from,
 * so this and the sheet agree on the day an order is placed; after that,
 * this screen is the record.
 */
function Orders() {
  const [rows, setRows] = useState<OrderRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("open");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    void listOrders().then((r) => (r.ok ? setRows(r.data) : setError(r.error)));
  }, []);

  const counts = useMemo(() => {
    const c = { open: 0, shipped: 0, delivered: 0, cancelled: 0, all: rows?.length ?? 0 };
    for (const r of rows ?? []) c[tabOf(r.status)]++;
    return c;
  }, [rows]);

  const shown = useMemo(
    () =>
      (rows ?? []).filter(
        (r) =>
          (tab === "all" || tabOf(r.status) === tab) &&
          matches(query, r.reference, r.full_name, r.email, r.phone, r.city, r.postcode),
      ),
    [rows, tab, query],
  );

  const replace = (next: OrderRow) =>
    setRows((rs) => (rs ?? []).map((r) => (r.id === next.id ? next : r)));

  const exportCsv = () =>
    downloadCsv(
      "orders",
      shown.map((r) => ({
        ...r,
        items: r.items
          .map((i) => `${i.qty}x ${i.title}${i.size ? ` (${i.size})` : ""} @ ${i.unit_inr}`)
          .join("; "),
      })),
      [
        "reference",
        "created_at",
        "status",
        "payment_status",
        "full_name",
        "phone",
        "email",
        "address_line1",
        "address_line2",
        "city",
        "region",
        "postcode",
        "items",
        "subtotal_inr",
        "shipping_inr",
        "discount_code",
        "discount_inr",
        "total_inr",
        "note",
      ],
    );

  return (
    <>
      <AdminHeading
        title="Orders"
        standfirst="Every order from the shop. Move each one along as it is packed and shipped, and mark it paid when the cash comes in."
      />

      {error ? (
        <InboxError message={error} />
      ) : rows === null ? (
        <p className="t-label text-mute">Loading…</p>
      ) : (
        <>
          <Toolbar<Tab>
            tabs={[
              { id: "open", label: "To do", count: counts.open },
              { id: "shipped", label: "Shipped", count: counts.shipped },
              { id: "delivered", label: "Delivered", count: counts.delivered },
              { id: "cancelled", label: "Cancelled", count: counts.cancelled },
              { id: "all", label: "All", count: counts.all },
            ]}
            tab={tab}
            onTab={setTab}
            query={query}
            onQuery={setQuery}
            placeholder="Reference, name, phone, city…"
            onExport={shown.length ? exportCsv : undefined}
          />

          {shown.length === 0 ? (
            <Empty>
              {rows.length === 0
                ? EMPTY_HINT("orders")
                : "Nothing matches — try another tab or clear the search."}
            </Empty>
          ) : (
            <ul className="border-t border-line">
              {shown.map((r) => (
                <OrderItemRow
                  key={r.id}
                  row={r}
                  expanded={open === r.id}
                  onToggle={() => setOpen((o) => (o === r.id ? null : r.id))}
                  onSaved={replace}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}

function OrderItemRow({
  row: r,
  expanded,
  onToggle,
  onSaved,
}: {
  row: OrderRow;
  expanded: boolean;
  onToggle: () => void;
  onSaved: (r: OrderRow) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const save = async (patch: { status?: OrderStatus; payment_status?: PaymentStatus }) => {
    setBusy(true);
    setNote(null);
    const res = await updateOrder(r.id, patch, r);
    if (!res.ok) {
      setBusy(false);
      setNote(res.error);
      return;
    }
    onSaved(res.data);
    setNote("Saved.");

    /* Tell the customer, when the new status is one they care about
     * (confirmed, packed, shipped, delivered, cancelled). The order is
     * already saved, so a mail failure is reported beside it rather than
     * undoing anything — and when email is not set up yet it says exactly
     * that instead of implying the customer was told. */
    if (patch.status && patch.status !== r.status) {
      const supabase = await getSupabase();
      const token = (await supabase?.auth.getSession())?.data.session?.access_token;
      if (token) {
        const mail = await sendOrderStatusMail({
          data: { accessToken: token, orderId: r.id, status: patch.status },
        });
        setNote(mail.ok ? `Saved. ${mail.detail}` : `Saved, but ${mail.message}`);
      }
    }
    setBusy(false);
  };

  const itemCount = r.items.reduce((n, i) => n + (i.qty ?? 0), 0);
  const wa = r.phone.replace(/[^\d]/g, "");

  return (
    <li className="border-b border-line">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 py-4 text-left md:grid-cols-[150px_1fr_110px_120px_24px]"
      >
        <span className="tnum font-ui text-[13px] font-bold text-text">{r.reference}</span>
        <span className="min-w-0 truncate font-ui text-[14px] text-text md:order-none">
          {r.full_name}
          <span className="text-mute">
            {" "}
            · {r.city} · {itemCount} item{itemCount === 1 ? "" : "s"}
          </span>
        </span>
        <span className="tnum font-ui text-[14px] font-semibold text-text">{inr(r.total_inr)}</span>
        <span className="flex gap-1">
          <Pill tone={OPEN.includes(r.status) ? "acid" : "text"}>{r.status}</Pill>
          {r.payment_status === "paid" ? <Pill>paid</Pill> : null}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`hidden text-mute transition-transform duration-300 md:block ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded ? (
        <div className="grid gap-8 pb-8 lg:grid-cols-[1fr_1fr_280px]">
          <section>
            <h3 className="t-label text-mute">Deliver to</h3>
            <address className="mt-3 font-ui text-[14px] not-italic leading-[1.6] text-text">
              {r.full_name}
              <br />
              {r.address_line1}
              {r.address_line2 ? (
                <>
                  <br />
                  {r.address_line2}
                </>
              ) : null}
              <br />
              {r.city}, {r.region} {r.postcode}
              <br />
              {r.country}
            </address>
            <div className="mt-4 flex flex-wrap gap-2">
              <Contact href={`tel:${r.phone}`} icon={<Phone size={13} />} label={r.phone} />
              {wa ? (
                <Contact
                  href={`https://wa.me/${wa.length === 10 ? `91${wa}` : wa}?text=${encodeURIComponent(`Hi ${r.full_name}, about your Limon Bandit order ${r.reference}: `)}`}
                  icon={<MessageCircle size={13} />}
                  label="WhatsApp"
                />
              ) : null}
              <Contact
                href={`mailto:${r.email}?subject=${encodeURIComponent(`Your order ${r.reference}`)}`}
                icon={<Mail size={13} />}
                label={r.email}
              />
            </div>
            {r.note ? (
              <p className="mt-4 border-l-2 border-acid pl-3 font-ui text-[14px] text-text">
                “{r.note}”
              </p>
            ) : null}
            <p className="t-label mt-4 text-mute">Placed {when(r.created_at)}</p>
          </section>

          <section>
            <h3 className="t-label text-mute">Items</h3>
            <ul className="mt-3 border-t border-line">
              {r.items.map((i, n) => (
                <li
                  key={`${i.product_id}-${i.size ?? ""}-${n}`}
                  className="flex justify-between gap-4 border-b border-line py-2 font-ui text-[14px]"
                >
                  <span className="text-text">
                    {i.qty}× {i.title}
                    {i.size ? <span className="text-mute"> · {i.size}</span> : null}
                  </span>
                  <span className="tnum text-mute">{inr(i.line_inr)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 font-ui text-[13px]">
              <Line k="Subtotal" v={inr(r.subtotal_inr)} />
              {r.discount_inr ? (
                <Line
                  k={`Discount (${r.discount_code ?? "code"})`}
                  v={`− ${inr(r.discount_inr)}`}
                />
              ) : null}
              <Line k="Shipping" v={r.shipping_inr ? inr(r.shipping_inr) : "Free"} />
              <Line k="To collect" v={inr(r.total_inr)} strong />
            </dl>
          </section>

          <section>
            <h3 className="t-label text-mute">Update</h3>
            <label className="mt-3 block">
              <span className="t-label text-mute">Order status</span>
              <select
                value={r.status}
                disabled={busy}
                onChange={(e) => void save({ status: e.target.value as OrderStatus })}
                className="mt-2 h-10 w-full border border-line bg-surface-deep px-2 font-ui text-[14px] text-text"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-4 block">
              <span className="t-label text-mute">Payment ({r.payment_method.toUpperCase()})</span>
              <select
                value={r.payment_status}
                disabled={busy}
                onChange={(e) => void save({ payment_status: e.target.value as PaymentStatus })}
                className="mt-2 h-10 w-full border border-line bg-surface-deep px-2 font-ui text-[14px] text-text"
              >
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            {note ? (
              <p role="status" className="mt-3 font-ui text-[13px] leading-[1.5] text-text">
                {note}
              </p>
            ) : null}
            <p className="t-label mt-4 text-mute">
              Sheet:{" "}
              {r.sheet_synced_at
                ? `synced ${when(r.sheet_synced_at)}`
                : r.sheet_error
                  ? `not synced — ${r.sheet_error}`
                  : "not synced"}
            </p>
          </section>
        </div>
      ) : null}
    </li>
  );
}

function Contact({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="inline-flex h-9 max-w-full items-center gap-2 border border-line px-3 font-ui text-[12px] text-text transition-colors duration-300 hover:border-acid-type"
    >
      {icon}
      <span className="truncate">{label}</span>
    </a>
  );
}

function Line({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-mute">{k}</dt>
      <dd className={`tnum ${strong ? "font-bold text-text" : "text-text"}`}>{v}</dd>
    </div>
  );
}
