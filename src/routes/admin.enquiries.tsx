import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, Mail, MessageCircle, Phone } from "lucide-react";
import { AdminHeading } from "@/components/admin/AdminShell";
import { Empty, InboxError, Pill, Toolbar } from "@/components/admin/Inbox";
import {
  EMPTY_HINT,
  ENQUIRY_STATUSES,
  listEnquiries,
  updateEnquiry,
  type EnquiryRow,
  type EnquiryStatus,
  downloadCsv,
  matches,
  when,
} from "@/cms/inbox";
import { useIntents } from "@/cms/hooks";

export const Route = createFileRoute("/admin/enquiries")({
  component: Enquiries,
});

type Tab = EnquiryStatus | "all";

/**
 * The contact form's inbox. Each enquiry opens to the full message, with a
 * reply button that pre-fills the subject with its reference, and three
 * states — new, replied, closed — so two people answering the same inbox
 * can see what is already handled.
 */
function Enquiries() {
  const [rows, setRows] = useState<EnquiryRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("new");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const intents = useIntents();
  const intentLabel = (id: string) => intents.find((i) => i.id === id)?.label ?? id;

  useEffect(() => {
    void listEnquiries().then((r) => (r.ok ? setRows(r.data) : setError(r.error)));
  }, []);

  /* Anything not replied or closed is new — including rows written before
   * statuses were used, or with a value typed by hand. */
  const statusOf = (s: string): EnquiryStatus => (s === "replied" || s === "closed" ? s : "new");

  const counts = useMemo(() => {
    const c = { new: 0, replied: 0, closed: 0, all: rows?.length ?? 0 };
    for (const r of rows ?? []) c[statusOf(r.status)]++;
    return c;
  }, [rows]);

  const shown = useMemo(
    () =>
      (rows ?? []).filter(
        (r) =>
          (tab === "all" || statusOf(r.status) === tab) &&
          matches(query, r.reference, r.full_name, r.email, r.phone, r.message, r.intent),
      ),
    [rows, tab, query],
  );

  const replace = (next: EnquiryRow) =>
    setRows((rs) => (rs ?? []).map((r) => (r.id === next.id ? next : r)));

  return (
    <>
      <AdminHeading
        title="Enquiries"
        standfirst="Everything sent through the contact form. Reply, then mark it replied so nobody answers twice."
      />

      {error ? (
        <InboxError message={error} />
      ) : rows === null ? (
        <p className="t-label text-mute">Loading…</p>
      ) : (
        <>
          <Toolbar<Tab>
            tabs={[
              { id: "new", label: "New", count: counts.new },
              { id: "replied", label: "Replied", count: counts.replied },
              { id: "closed", label: "Closed", count: counts.closed },
              { id: "all", label: "All", count: counts.all },
            ]}
            tab={tab}
            onTab={setTab}
            query={query}
            onQuery={setQuery}
            placeholder="Name, email, words in the message…"
            onExport={
              shown.length
                ? () =>
                    downloadCsv("enquiries", shown, [
                      "reference",
                      "created_at",
                      "status",
                      "intent",
                      "full_name",
                      "email",
                      "phone",
                      "message",
                      "source_path",
                    ])
                : undefined
            }
          />

          {shown.length === 0 ? (
            <Empty>
              {rows.length === 0
                ? EMPTY_HINT("enquiries")
                : tab === "new"
                  ? "Inbox zero — nothing waiting for a reply."
                  : "Nothing matches — try another tab or clear the search."}
            </Empty>
          ) : (
            <ul className="border-t border-line">
              {shown.map((r) => (
                <EnquiryItem
                  key={r.id}
                  row={r}
                  status={statusOf(r.status)}
                  intent={intentLabel(r.intent)}
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

function EnquiryItem({
  row: r,
  status,
  intent,
  expanded,
  onToggle,
  onSaved,
}: {
  row: EnquiryRow;
  status: EnquiryStatus;
  intent: string;
  expanded: boolean;
  onToggle: () => void;
  onSaved: (r: EnquiryRow) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const setStatus = async (s: EnquiryStatus) => {
    setBusy(true);
    setNote(null);
    const res = await updateEnquiry(r.id, s);
    setBusy(false);
    if (res.ok) onSaved(res.data);
    else setNote(res.error);
  };

  const wa = (r.phone ?? "").replace(/[^\d]/g, "");
  const reply = `mailto:${r.email}?subject=${encodeURIComponent(`Re: ${intent} — ${r.reference}`)}&body=${encodeURIComponent(
    `Hi ${r.full_name.split(" ")[0]},\n\n\n\n—\nLimon Bandit\n\n> ${r.message.split("\n").join("\n> ")}`,
  )}`;

  return (
    <li className="border-b border-line">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-4 text-left md:grid-cols-[150px_220px_1fr_110px_24px]"
      >
        <span className="t-label tnum text-mute">{when(r.created_at)}</span>
        <span className="min-w-0 truncate font-ui text-[14px] font-semibold text-text">
          {r.full_name}
        </span>
        <span className="col-span-2 min-w-0 truncate font-ui text-[14px] text-mute md:col-span-1">
          <span className="text-text">{intent}</span> — {r.message}
        </span>
        <span className="row-start-1 justify-self-end md:row-auto md:justify-self-start">
          <Pill tone={status === "new" ? "acid" : status === "replied" ? "text" : "mute"}>
            {status}
          </Pill>
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`hidden text-mute transition-transform duration-300 md:block ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded ? (
        <div className="grid gap-8 pb-8 lg:grid-cols-[1fr_280px]">
          <section>
            <p className="t-label text-mute">
              {r.reference} · {intent}
              {r.source_path ? ` · sent from ${r.source_path}` : ""}
            </p>
            <p className="mt-4 whitespace-pre-wrap font-ui text-[15px] leading-[1.65] text-text">
              {r.message}
            </p>
          </section>

          <section>
            <div className="flex flex-col gap-2">
              <a
                href={reply}
                onClick={() => {
                  if (status === "new") void setStatus("replied");
                }}
                className="inline-flex h-10 items-center justify-center gap-2 bg-acid px-4 font-ui text-[12px] font-bold uppercase tracking-[0.1em] text-accent-text"
              >
                <Mail size={14} /> Reply by email
              </a>
              {r.phone ? (
                <a
                  href={`tel:${r.phone}`}
                  className="inline-flex h-10 items-center justify-center gap-2 border border-line px-4 font-ui text-[12px] text-text hover:border-acid-type"
                >
                  <Phone size={14} /> {r.phone}
                </a>
              ) : null}
              {wa ? (
                <a
                  href={`https://wa.me/${wa.length === 10 ? `91${wa}` : wa}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-2 border border-line px-4 font-ui text-[12px] text-text hover:border-acid-type"
                >
                  <MessageCircle size={14} /> WhatsApp
                </a>
              ) : null}
            </div>

            <p className="t-label mt-6 text-mute">Mark as</p>
            <div className="mt-2 flex gap-1">
              {ENQUIRY_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={busy || s === status}
                  onClick={() => void setStatus(s)}
                  aria-pressed={s === status}
                  className={`h-9 flex-1 font-ui text-[11px] font-bold uppercase tracking-[0.1em] transition-colors duration-300 ${
                    s === status
                      ? "bg-surface-raised text-text"
                      : "border border-line text-mute hover:border-acid-type hover:text-text"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {note ? (
              <p role="status" className="mt-3 font-ui text-[13px] leading-[1.5] text-text">
                {note}
              </p>
            ) : null}
            <p className="t-label mt-4 text-mute">
              Notification:{" "}
              {r.notified_at
                ? `sent ${when(r.notified_at)}`
                : r.notify_error
                  ? r.notify_error
                  : "not sent"}
            </p>
          </section>
        </div>
      ) : null}
    </li>
  );
}
