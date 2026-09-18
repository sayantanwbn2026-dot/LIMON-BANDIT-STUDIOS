import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, ShieldCheck, Trash2, Clock } from "lucide-react";
import { AdminHeading } from "@/components/admin/AdminShell";
import {
  addAdmin,
  checkAdmin,
  listAdmins,
  recentChanges,
  removeAdmin,
  type AdminRow,
  type AuditRow,
} from "@/cms/admin";
import { collections } from "@/cms/collections";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin/ownership")({
  component: Ownership,
});

/**
 * Who can edit the site, and what they have done.
 *
 * Two roles. An **owner** manages this list; an **editor** changes content
 * but cannot grant access. That split is enforced by RLS — the policies on
 * `admins` require `is_owner()` — so an editor who finds this page useless
 * is seeing the truth rather than a disabled button.
 *
 * Adding an email here does not create the account. Supabase auth owns
 * accounts; this list is a permission on top of one, so the person still has
 * to sign up through the site's own sign-in. Said explicitly on the form,
 * because "I added them and they still cannot get in" is otherwise the
 * obvious next question.
 */
function Ownership() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminRow[] | null>(null);
  const [owner, setOwner] = useState(false);
  const [changes, setChanges] = useState<AuditRow[]>([]);
  const [email, setEmail] = useState("");
  const [label, setLabel] = useState("");
  const [role, setRole] = useState<"owner" | "editor">("editor");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    void listAdmins().then(setAdmins);
    void checkAdmin().then((r) => setOwner(r.owner));
    void recentChanges(30).then(setChanges);
  }, []);

  useEffect(load, [load]);

  const onAdd = async () => {
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("That does not look like an email address.");
      return;
    }
    setBusy(true);
    const err = await addAdmin(email, role, label);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setEmail("");
    setLabel("");
    load();
  };

  const onRemove = async (row: AdminRow) => {
    if (row.email === user?.email) {
      setError("You cannot remove your own access.");
      return;
    }
    if (!window.confirm(`Remove ${row.email}? They will lose access to the admin immediately.`)) {
      return;
    }
    const err = await removeAdmin(row.email);
    if (err) setError(err);
    load();
  };

  return (
    <>
      <AdminHeading
        title="Ownership"
        standfirst="Who can sign in and edit this website, and a record of every change made."
      />

      <section className="border border-line bg-surface-deep">
        <header className="border-b border-line p-6">
          <h2 className="font-display text-[18px] font-bold tracking-[-0.02em] text-text">
            People with access
          </h2>
          <p className="mt-2 max-w-[64ch] font-ui text-[13px] leading-[1.5] text-mute">
            <span className="font-semibold text-text">Owners</span> manage this list.{" "}
            <span className="font-semibold text-text">Editors</span> can change every piece of
            content but cannot add or remove people.
          </p>
        </header>

        {admins === null ? (
          <p className="t-label p-6 text-mute">Loading…</p>
        ) : (
          <ul className="border-b border-line">
            {admins.map((a) => (
              <li
                key={a.email}
                className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line px-6 py-4"
              >
                <ShieldCheck
                  size={15}
                  className={a.role === "owner" ? "text-acid-type" : "text-mute"}
                />
                <div className="min-w-0">
                  <p className="truncate font-ui text-[13px] font-semibold text-text">{a.email}</p>
                  {a.label ? <p className="t-label text-mute">{a.label}</p> : null}
                </div>
                <span
                  className={`ml-auto px-3 py-1 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] ${
                    a.role === "owner" ? "bg-acid text-accent-text" : "bg-surface-raised text-mute"
                  }`}
                >
                  {a.role}
                </span>
                {a.email === user?.email ? (
                  <span className="t-label text-mute">You</span>
                ) : owner ? (
                  <button
                    type="button"
                    onClick={() => void onRemove(a)}
                    aria-label={`Remove ${a.email}`}
                    className="flex h-9 w-9 items-center justify-center border border-line text-mute transition-colors duration-300 hover:border-acid-type hover:text-acid-type"
                  >
                    <Trash2 size={13} />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {owner ? (
          <div className="p-6">
            <h3 className="t-label text-mute">Add someone</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_140px_auto]">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="them@limonbandit.com"
                className="h-11 border-b border-line bg-transparent font-ui text-[13px] text-text outline-none transition-colors focus:border-acid-type placeholder:text-[color:var(--placeholder)]"
              />
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Name (optional)"
                className="h-11 border-b border-line bg-transparent font-ui text-[13px] text-text outline-none transition-colors focus:border-acid-type placeholder:text-[color:var(--placeholder)]"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "owner" | "editor")}
                className="h-11 border-b border-line bg-surface-deep font-ui text-[13px] text-text outline-none focus:border-acid-type"
              >
                <option value="editor">Editor</option>
                <option value="owner">Owner</option>
              </select>
              <button
                type="button"
                onClick={() => void onAdd()}
                disabled={busy}
                className="flex h-11 items-center justify-center gap-2 bg-acid px-5 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-accent-text transition-colors duration-300 hover:bg-acid-dim disabled:opacity-50"
              >
                <Plus size={14} />
                Add
              </button>
            </div>

            <p className="t-label mt-4 max-w-[64ch] text-mute">
              This grants permission to an email address — it does not create the account. They
              still need to register on the site with the same address before they can sign in here.
            </p>

            {error ? (
              <p role="alert" className="mt-4 font-ui text-[13px] text-acid-type">
                {error}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="p-6 font-ui text-[13px] text-mute">
            Only an owner can add or remove people.
          </p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-[18px] font-bold tracking-[-0.02em] text-text">
          Change history
        </h2>
        <p className="mt-2 max-w-[64ch] font-ui text-[13px] leading-[1.5] text-mute">
          Every save, with who made it. Records cannot be edited or deleted.
        </p>

        {changes.length === 0 ? (
          <p className="mt-6 font-ui text-[14px] text-mute">Nothing has been changed yet.</p>
        ) : (
          <ul className="mt-6 border-t border-line">
            {changes.map((c) => {
              const title = collections.find((x) => x.key === c.key)?.title ?? c.key;
              return (
                <li
                  key={c.id}
                  className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-line py-3"
                >
                  <Clock size={13} className="shrink-0 text-mute" />
                  <span className="font-ui text-[13px] font-semibold text-text">{title}</span>
                  <span
                    className={`px-2 py-0.5 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] ${
                      c.action === "create" ? "text-acid-type" : "text-mute"
                    }`}
                  >
                    {c.action}
                  </span>
                  <span className="font-ui text-[12px] text-mute">{c.actor ?? "unknown"}</span>
                  <span className="t-label ml-auto text-mute">
                    {new Date(c.created_at).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
