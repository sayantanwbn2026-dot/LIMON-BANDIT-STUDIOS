/**
 * The field vocabulary the CMS is built out of.
 *
 * Every editable thing on this site is described by one of these, and both
 * halves of the CMS read the same description: the admin renders its form
 * from it, and the site reads values shaped by it. That is the whole point —
 * adding a field is one entry in `collections.ts`, not a migration plus a
 * form plus a type plus a query.
 *
 * The image field carries `width`/`height`, and they are not decoration. A
 * non-technical editor uploading a 400px logo into a 1600px hero slot cannot
 * tell it went wrong until it ships blurry, so the admin prints the expected
 * resolution beside the field and warns — loudly, but without blocking —
 * when what was supplied does not match. Blocking would be worse: sometimes
 * the only photo that exists is the wrong size, and refusing it just means
 * the site keeps the placeholder forever.
 */

export type SelectOption = { value: string; label: string };

type Base = {
  /** key in the stored JSON object */
  name: string;
  /** what the editor reads above the input */
  label: string;
  /** one line under the input, for anything non-obvious */
  help?: string;
  required?: boolean;
};

export type Field =
  | (Base & { kind: "text"; placeholder?: string; max?: number; mono?: boolean })
  | (Base & { kind: "textarea"; placeholder?: string; rows?: number; max?: number })
  | (Base & { kind: "number"; min?: number; max?: number; step?: number; prefix?: string })
  | (Base & { kind: "boolean" })
  | (Base & { kind: "select"; options: SelectOption[] })
  | (Base & { kind: "url"; placeholder?: string })
  | (Base & { kind: "email" })
  | (Base & { kind: "tel" })
  | (Base & {
      kind: "image";
      /** the resolution this slot is designed for, shown to the editor */
      width: number;
      height: number;
      /** e.g. "Square. Sits in a 3-up grid." */
      note?: string;
    })
  /** repeatable plain strings — ticker lines, credits, feature bullets */
  | (Base & { kind: "stringList"; itemLabel?: string; placeholder?: string; max?: number })
  /** repeatable objects */
  | (Base & {
      kind: "list";
      fields: Field[];
      /** which child field to show as the row's title when collapsed */
      titleField: string;
      /** singular noun for the Add button: "Add room" */
      itemNoun: string;
      min?: number;
      max?: number;
    })
  /** a fixed nested object */
  | (Base & { kind: "group"; fields: Field[] });

export type FieldKind = Field["kind"];

/**
 * A document the CMS stores under one key.
 *
 * `object` documents are a fixed set of fields (the site's contact details).
 * `list` documents are a repeatable collection (the rooms, the crew) and get
 * a reorderable row editor rather than a form.
 */
export type Collection = {
  /** primary key in cms_documents, e.g. "global.site" */
  key: string;
  title: string;
  /** one line under the title in the admin */
  description: string;
  /** which admin section it appears under */
  group: CollectionGroup;
  /** for group "page", which chapter it belongs to */
  page?: PageKey;
  icon?: string;
} & (
  | { shape: "object"; fields: Field[] }
  | {
      shape: "list";
      fields: Field[];
      titleField: string;
      itemNoun: string;
    }
);

export type CollectionGroup = "global" | "page" | "commerce";

export type PageKey = "home" | "rooms" | "label" | "shop" | "crew" | "journal" | "contact";

export const PAGES: { key: PageKey; label: string; path: string }[] = [
  { key: "home", label: "Home", path: "/" },
  { key: "rooms", label: "Rooms", path: "/rooms" },
  { key: "label", label: "Label", path: "/label" },
  { key: "shop", label: "Shop", path: "/shop" },
  { key: "crew", label: "Crew", path: "/crew" },
  { key: "journal", label: "Journal", path: "/journal" },
  { key: "contact", label: "Contact", path: "/contact" },
];

/* ------------------------------------------------------------------ *
 * Helpers for building schemas without repeating yourself
 * ------------------------------------------------------------------ */

export const text = (name: string, label: string, extra: Partial<Field> = {}): Field =>
  ({ kind: "text", name, label, ...extra }) as Field;

export const area = (name: string, label: string, extra: Partial<Field> = {}): Field =>
  ({ kind: "textarea", name, label, rows: 3, ...extra }) as Field;

export const num = (name: string, label: string, extra: Partial<Field> = {}): Field =>
  ({ kind: "number", name, label, ...extra }) as Field;

export const image = (
  name: string,
  label: string,
  width: number,
  height: number,
  note?: string,
): Field => ({ kind: "image", name, label, width, height, note });

export const choice = (name: string, label: string, options: string[] | SelectOption[]): Field => ({
  kind: "select",
  name,
  label,
  options: options.map((o) => (typeof o === "string" ? { value: o, label: o } : o)),
});

export const strings = (name: string, label: string, extra: Partial<Field> = {}): Field =>
  ({ kind: "stringList", name, label, ...extra }) as Field;

/** Empty value for a field, used when adding a new list row. */
export function blankValue(field: Field): unknown {
  switch (field.kind) {
    case "number":
      return 0;
    case "boolean":
      return false;
    case "select":
      return field.options[0]?.value ?? "";
    case "stringList":
      return [];
    case "list":
      return [];
    case "group":
      return blankRecord(field.fields);
    case "image":
      return "";
    default:
      return "";
  }
}

export function blankRecord(fields: Field[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) out[f.name] = blankValue(f);
  return out;
}

/** Human label for one row of a list, falling back when the title is empty. */
export function rowTitle(row: unknown, titleField: string, index: number): string {
  if (row && typeof row === "object") {
    const v = (row as Record<string, unknown>)[titleField];
    if (typeof v === "string" && v.trim()) return v;
    if (typeof v === "number") return String(v);
  }
  return `Item ${index + 1}`;
}
