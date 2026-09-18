import { useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2, X } from "lucide-react";
import { ImagePicker } from "./ImagePicker";
import { blankRecord, blankValue, rowTitle, type Field } from "@/cms/schema";

/**
 * Turns a schema into a form.
 *
 * Recursive, because the schema is: a list contains fields, one of which may
 * be another list. Everything an editor sees in the CMS is rendered by this
 * one component, which is what keeps twenty-odd sections looking and
 * behaving identically instead of drifting into twenty hand-built forms.
 *
 * Values are plain JSON throughout. `onChange` hands back the whole new value
 * rather than a patch, so the parent can keep one immutable draft and compare
 * it against the saved document to know whether anything is dirty.
 */

const labelCls = "font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-mute";
const inputCls =
  "h-11 w-full border-b border-line bg-transparent font-ui text-[14px] text-text outline-none transition-colors duration-300 focus:border-acid-type placeholder:text-[color:var(--placeholder)]";

export function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  switch (field.kind) {
    case "text":
    case "url":
    case "email":
    case "tel":
      return (
        <Labelled field={field}>
          <input
            type={field.kind === "text" ? "text" : field.kind}
            value={String(value ?? "")}
            maxLength={"max" in field ? field.max : undefined}
            placeholder={"placeholder" in field ? field.placeholder : undefined}
            onChange={(e) => onChange(e.target.value)}
            className={`${inputCls} ${"mono" in field && field.mono ? "font-mono text-[13px]" : ""}`}
          />
          <Counter value={String(value ?? "")} max={"max" in field ? field.max : undefined} />
        </Labelled>
      );

    case "textarea":
      return (
        <Labelled field={field}>
          <textarea
            rows={field.rows ?? 3}
            value={String(value ?? "")}
            maxLength={field.max}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            className="w-full resize-y border-b border-line bg-transparent py-3 font-ui text-[14px] leading-[1.55] text-text outline-none transition-colors duration-300 focus:border-acid-type placeholder:text-[color:var(--placeholder)]"
          />
          <Counter value={String(value ?? "")} max={field.max} />
        </Labelled>
      );

    case "number":
      return (
        <Labelled field={field}>
          <div className="flex items-center gap-2 border-b border-line focus-within:border-acid-type">
            {field.prefix ? (
              <span className="font-ui text-[14px] text-mute">{field.prefix}</span>
            ) : null}
            <input
              type="number"
              value={Number.isFinite(value as number) ? (value as number) : 0}
              min={field.min}
              max={field.max}
              step={field.step ?? 1}
              onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
              className="tnum h-11 w-full bg-transparent font-ui text-[14px] text-text outline-none"
            />
          </div>
        </Labelled>
      );

    case "boolean":
      return (
        <label className="flex cursor-pointer items-center gap-3 py-2">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="h-5 w-5 shrink-0 accent-[var(--accent)]"
          />
          <span className="font-ui text-[13px] text-text">{field.label}</span>
          {field.help ? <span className="t-label text-mute">{field.help}</span> : null}
        </label>
      );

    case "select":
      return (
        <Labelled field={field}>
          <select
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            className="h-11 w-full border-b border-line bg-surface-deep font-ui text-[14px] text-text outline-none transition-colors duration-300 focus:border-acid-type"
          >
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Labelled>
      );

    case "image":
      return (
        <div>
          <span className={labelCls}>{field.label}</span>
          {field.help ? <p className="t-label mt-1 text-mute">{field.help}</p> : null}
          <div className="mt-3">
            <ImagePicker
              label={field.label}
              value={String(value ?? "")}
              onChange={onChange}
              width={field.width}
              height={field.height}
              note={field.note}
            />
          </div>
        </div>
      );

    case "stringList":
      return (
        <StringList
          field={field}
          value={Array.isArray(value) ? (value as string[]) : []}
          onChange={onChange}
        />
      );

    case "group":
      return (
        <fieldset className="border border-line p-4">
          <legend className={`${labelCls} px-2`}>{field.label}</legend>
          <div className="space-y-5">
            {field.fields.map((f) => (
              <FieldRenderer
                key={f.name}
                field={f}
                value={(value as Record<string, unknown>)?.[f.name]}
                onChange={(v) =>
                  onChange({ ...((value as Record<string, unknown>) ?? {}), [f.name]: v })
                }
              />
            ))}
          </div>
        </fieldset>
      );

    case "list":
      return (
        <ListEditor
          field={field}
          value={Array.isArray(value) ? (value as Record<string, unknown>[]) : []}
          onChange={onChange}
        />
      );

    default:
      return null;
  }
}

function Labelled({ field, children }: { field: Field; children: React.ReactNode }) {
  return (
    <div>
      <span className={labelCls}>
        {field.label}
        {field.required ? <span className="ml-1 text-acid-type">*</span> : null}
      </span>
      <div className="mt-2">{children}</div>
      {field.help ? <p className="t-label mt-2 text-mute">{field.help}</p> : null}
    </div>
  );
}

/** Only appears once there is a limit and you are near it. */
function Counter({ value, max }: { value: string; max?: number }) {
  if (!max) return null;
  const left = max - value.length;
  if (left > max * 0.25) return null;
  return (
    <p className={`t-label mt-1 text-right ${left < 0 ? "text-acid-type" : "text-mute"}`}>
      {left} left
    </p>
  );
}

function StringList({
  field,
  value,
  onChange,
}: {
  field: Extract<Field, { kind: "stringList" }>;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const set = (i: number, v: string) => onChange(value.map((x, j) => (j === i ? v : x)));
  const remove = (i: number) => onChange(value.filter((_, j) => j !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      <span className={labelCls}>{field.label}</span>
      {field.help ? <p className="t-label mt-1 text-mute">{field.help}</p> : null}

      <ul className="mt-3 space-y-2">
        {value.map((v, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="tnum w-6 shrink-0 font-ui text-[11px] text-mute">
              {String(i + 1).padStart(2, "0")}
            </span>
            <input
              value={v}
              placeholder={field.placeholder}
              onChange={(e) => set(i, e.target.value)}
              className={inputCls}
            />
            <IconBtn
              label={`Move ${field.itemLabel ?? "item"} up`}
              onClick={() => move(i, -1)}
              disabled={i === 0}
            >
              <ChevronUp size={14} />
            </IconBtn>
            <IconBtn
              label={`Move ${field.itemLabel ?? "item"} down`}
              onClick={() => move(i, 1)}
              disabled={i === value.length - 1}
            >
              <ChevronDown size={14} />
            </IconBtn>
            <IconBtn label={`Remove ${field.itemLabel ?? "item"}`} onClick={() => remove(i)} danger>
              <X size={14} />
            </IconBtn>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onChange([...value, ""])}
        className="mt-3 flex h-9 items-center gap-2 border border-line px-3 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-text transition-colors duration-300 hover:border-acid-type"
      >
        <Plus size={13} />
        Add {field.itemLabel?.toLowerCase() ?? "item"}
      </button>
    </div>
  );
}

export function ListEditor({
  field,
  value,
  onChange,
}: {
  field: Extract<Field, { kind: "list" }>;
  value: Record<string, unknown>[];
  onChange: (v: Record<string, unknown>[]) => void;
}) {
  /* Rows are collapsed by default. A twenty-product list with every field
   * open is unusable; the row title plus a click is how you find the one you
   * came to change. */
  const [open, setOpen] = useState<number | null>(null);

  const setRow = (i: number, row: Record<string, unknown>) =>
    onChange(value.map((r, j) => (j === i ? row : r)));

  const remove = (i: number) => {
    onChange(value.filter((_, j) => j !== i));
    setOpen(null);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setOpen(j);
  };

  const add = () => {
    onChange([...value, blankRecord(field.fields)]);
    setOpen(value.length);
  };

  const atMax = field.max !== undefined && value.length >= field.max;
  const atMin = field.min !== undefined && value.length <= field.min;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span className={labelCls}>{field.label}</span>
        <span className="tnum t-label text-mute">
          {value.length} {value.length === 1 ? field.itemNoun : `${field.itemNoun}s`}
        </span>
      </div>
      {field.help ? <p className="t-label mt-1 text-mute">{field.help}</p> : null}

      <ul className="mt-3 border-t border-line">
        {value.map((row, i) => {
          const isOpen = open === i;
          return (
            <li key={i} className="border-b border-line">
              <div className="flex items-center gap-2 py-2">
                <GripVertical size={14} className="shrink-0 text-mute" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex min-w-0 flex-1 items-center gap-3 py-1 text-left"
                >
                  <span className="tnum shrink-0 font-ui text-[11px] text-mute">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="truncate font-ui text-[13px] font-semibold text-text">
                    {rowTitle(row, field.titleField, i)}
                  </span>
                </button>
                <IconBtn label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                  <ChevronUp size={14} />
                </IconBtn>
                <IconBtn
                  label="Move down"
                  onClick={() => move(i, 1)}
                  disabled={i === value.length - 1}
                >
                  <ChevronDown size={14} />
                </IconBtn>
                <IconBtn
                  label={`Delete ${field.itemNoun}`}
                  onClick={() => remove(i)}
                  disabled={atMin}
                  danger
                >
                  <Trash2 size={14} />
                </IconBtn>
              </div>

              {isOpen ? (
                <div className="space-y-6 border-t border-line bg-surface px-4 py-6">
                  {field.fields.map((f) => (
                    <FieldRenderer
                      key={f.name}
                      field={f}
                      value={row[f.name] ?? blankValue(f)}
                      onChange={(v) => setRow(i, { ...row, [f.name]: v })}
                    />
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {value.length === 0 ? (
        <p className="py-6 font-ui text-[13px] text-mute">
          Nothing here yet. The site will show its built-in default until you add one.
        </p>
      ) : null}

      <button
        type="button"
        onClick={add}
        disabled={atMax}
        className="mt-4 flex h-10 items-center gap-2 border border-line px-4 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-text transition-colors duration-300 hover:border-acid-type disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus size={14} />
        Add {field.itemNoun}
      </button>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`flex h-9 w-9 shrink-0 items-center justify-center border border-line transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-30 ${
        danger
          ? "text-mute hover:border-acid-type hover:text-acid-type"
          : "text-mute hover:border-acid-type hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}
