import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminHeading } from "@/components/admin/AdminShell";
import { Empty, InboxError, Pill, Toolbar } from "@/components/admin/Inbox";
import {
  EMPTY_HINT,
  deleteSignup,
  listSignups,
  type SignupRow,
  downloadCsv,
  matches,
  when,
} from "@/cms/inbox";

export const Route = createFileRoute("/admin/subscribers")({
  component: Subscribers,
});

type Tab = "all" | "list" | "flash";

/**
 * The mailing list: addresses from the Join-the-list form on the home page
 * ("list") and the shop's first-order popup ("flash").
 *
 * Export is the point — the list goes into whatever sends the newsletter.
 * Remove is for honouring an unsubscribe or erasure request, which the
 * privacy page promises and which nothing else on the site can do.
 */
function Subscribers() {
  const [rows, setRows] = useState<SignupRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    void listSignups().then((r) => (r.ok ? setRows(r.data) : setError(r.error)));
  }, []);

  const counts = useMemo(() => {
    const c = { all: rows?.length ?? 0, list: 0, flash: 0 };
    for (const r of rows ?? []) {
      if (r.source === "list") c.list++;
      else c.flash++;
    }
    return c;
  }, [rows]);

  const shown = useMemo(
    () =>
      (rows ?? []).filter(
        (r) =>
          (tab === "all" || (tab === "list" ? r.source === "list" : r.source !== "list")) &&
          matches(query, r.email),
      ),
    [rows, tab, query],
  );

  const remove = async (r: SignupRow) => {
    if (!window.confirm(`Remove ${r.email} from the list? This cannot be undone.`)) return;
    setNote(null);
    const res = await deleteSignup(r.id);
    if (res.ok) {
      setRows((rs) => (rs ?? []).filter((x) => x.id !== r.id));
      setNote(`${r.email} removed.`);
    } else setNote(res.error);
  };

  return (
    <>
      <AdminHeading
        title="Subscribers"
        standfirst="Everyone who joined the list or took the first-order code. Export it for your newsletter tool; remove anyone who asks."
      />

      {error ? (
        <InboxError message={error} />
      ) : rows === null ? (
        <p className="t-label text-mute">Loading…</p>
      ) : (
        <>
          <Toolbar<Tab>
            tabs={[
              { id: "all", label: "All", count: counts.all },
              { id: "list", label: "Join the list", count: counts.list },
              { id: "flash", label: "Shop popup", count: counts.flash },
            ]}
            tab={tab}
            onTab={setTab}
            query={query}
            onQuery={setQuery}
            placeholder="Search an email…"
            onExport={
              shown.length
                ? () => downloadCsv("subscribers", shown, ["email", "source", "code", "created_at"])
                : undefined
            }
          />

          {note ? (
            <p role="status" className="mb-4 font-ui text-[13px] text-text">
              {note}
            </p>
          ) : null}

          {shown.length === 0 ? (
            <Empty>
              {rows.length === 0
                ? EMPTY_HINT("subscribers")
                : "Nothing matches — try another tab or clear the search."}
            </Empty>
          ) : (
            <ul className="border-t border-line">
              {shown.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line py-3"
                >
                  <span className="min-w-0 flex-1 truncate font-ui text-[14px] text-text">
                    {r.email}
                  </span>
                  <Pill>{r.source === "list" ? "list" : "popup"}</Pill>
                  <span className="t-label tnum w-[150px] text-mute">{when(r.created_at)}</span>
                  <button
                    type="button"
                    onClick={() => void remove(r)}
                    className="font-ui text-[12px] text-mute underline decoration-line underline-offset-4 hover:text-text"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}
