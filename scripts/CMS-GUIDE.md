# Editing the website

Everything the site says and shows can be changed at **/admin** — no code, no
deploy. Changes are live the moment you press Save.

---

## Getting in

**/admin/login**, with your email and password.

Two things have to be true: you need an account on the site, and your email
has to be on the admin list. They are separate on purpose — every shopper has
an account, and being able to sign in is not the same as being allowed to edit.

`sayantanmukherjee2505@gmail.com` is already on the list as **owner**. To use
it, register that address on the site once (any page, the Sign in button →
Become a member), then sign in at /admin/login.

If you see "Staff only" it means you are signed in with an address that is not
on the list. An owner can add it under **Ownership**.

---

## How it is organised

| Section                                                      | What is in it                                                                           |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| **Dashboard**                                                | Orders, revenue, signups, and what was changed recently                                 |
| **Analytics**                                                | Visits, top pages, traffic over time                                                    |
| **Pages** → Home, Rooms, Label, Shop, Crew, Journal, Contact | Everything that appears on that page                                                    |
| **Global content**                                           | Contact details, menu, social links, tickers, FAQ, and every page's search-engine title |
| **Shop & pricing**                                           | Products, prices, stock, discount codes, delivery costs                                 |
| **Media**                                                    | Every image uploaded, and links you have added                                          |
| **Ownership**                                                | Who can edit, and a history of every change                                             |

If you cannot find something, it is almost always either on the page it
appears on, or in **Global content** if it appears on all of them.

### Rewording a heading

Every page has a **Section headings** panel. Each row is one block on that
page, and it holds the three bits of text at the top of it: the small label
(the "eyebrow"), the heading itself, and the supporting line beside it.

Two things to know before you rewrite one:

- **Leave the Section id alone.** It is how the page finds its own heading.
  Change the heading, not the id.
- **Line breaks are deliberate.** Where a heading is split across lines,
  those breaks were set for the width of the column. Press Enter to make a
  new one. Keep headings short — the box will stop you at 90 characters,
  and most of them look right well under that.

If you delete a row by accident, that section goes back to the wording the
site shipped with rather than losing its heading.

---

## Images

Two ways to set one, on every image field:

- **Upload** — pick a file from your computer or phone
- **Use a link** — paste a web address for an image hosted elsewhere

Up to **20 MB**. JPG, PNG, WebP, AVIF, GIF or SVG.

**Every image slot tells you the size it wants** — for example `1600 × 900 px`
— before you choose anything, and checks what you actually supplied
afterwards. Two kinds of warning:

- _"a different shape to the 1600×900 this slot expects. It will be cropped."_
  The proportions are wrong, so part of your image will be cut off. Worth
  fixing.
- _"smaller than the … this slot expects, so it may look soft."_ Right shape,
  not enough pixels. It will work, it just will not be crisp.

Neither stops you. Sometimes the only photograph that exists is the wrong one,
and refusing it would just leave the placeholder there forever.

---

## Lists

Most sections are lists — rooms, products, crew, journal entries. Each row is
collapsed to its name; click it to open.

- **▲ ▼** move a row. The order here is the order on the site.
- **Trash** deletes it. There is no undo, but **Reset** (top right of the
  section) puts the whole section back to how the site shipped.
- **Add** at the bottom makes a new empty one.

---

## Things worth knowing

**Prices and stock are real.** What you type in Shop & pricing is what a buyer
is charged — the server re-prices every order against your list before it is
placed, so a typo in a price is a real price. Stock at zero shows the product
as sold out rather than hiding it, and checkout will not sell more than the
number you set.

**Ids are not labels.** Fields called "Product id", "Room id" or "Web address"
are used in links, carts and past orders. Changing one on something already
live breaks those links. Change the title instead — that is the bit people
read.

**Nothing you can do here takes the site down.** If a section is emptied, or
the database is unreachable, the site falls back to the content it shipped
with. You will see the old text, not a broken page.

**Search-engine titles are live.** What you write under Global content →
Page titles & SEO is what Google and WhatsApp actually show. It is read when
the page is built on the server, so a change can take up to a minute to
appear — if you have just saved and the old title is still showing, wait and
reload rather than saving again.

**Every save is recorded** with who made it and what it replaced, under
Ownership → Change history.

**Ctrl-S / Cmd-S** saves the section you are in.

---

## For developers

### Adding an editable field

One place: `src/cms/collections.ts`. Add the field to the right collection and
it appears in the admin, with validation and the right control, automatically.
No migration, no form component.

```ts
text("subtitle", "Subtitle", { help: "Shown under the heading." });
image("banner", "Banner", 1600, 900, "Full width.");
num("price", "Price", { prefix: "₹", min: 0 });
```

Then add a matching entry to `src/cms/seeds.ts` so the site has a fallback and
the admin opens with real content in it.

Those two files have to agree, and neither a typecheck nor a test will tell
you when they do not, because both are keyed by string. So `collections.ts`
checks it on import in development and logs the offending key: a collection
with no seed opens as an empty form (and saving it writes that emptiness over
a section that was rendering fine), and a seed with no collection is content
the site reads and nobody can edit. Watch the console after adding either.

### Adding a whole section

1. Define the collection in `src/cms/collections.ts` with `group: "page"` and
   the page key.
2. Add its seed to `src/cms/seeds.ts`.
3. Add a hook to `src/cms/hooks.ts`.
4. Use the hook in the component.

The admin picks it up with no further work.

### The pieces

| File                              | Job                                   |
| --------------------------------- | ------------------------------------- |
| `src/cms/schema.ts`               | The field vocabulary                  |
| `src/cms/collections.ts`          | Every editable section, defined once  |
| `src/cms/seeds.ts`                | Committed content — fallback and seed |
| `src/cms/content.tsx`             | Loads documents, falls back to seeds  |
| `src/cms/hooks.ts`                | The read API the site uses            |
| `src/cms/media.ts`                | Upload, URL, resolution checking      |
| `src/cms/admin.ts`                | Saving, audit, admins, analytics      |
| `src/components/admin/Fields.tsx` | Renders any schema as a form          |
| `src/components/lb/CmsImage.tsx`  | Manifest key or URL, either way       |

### Re-seeding

```bash
bun run cms:seed                    # restore all content to the repo's version
bun run cms:seed you@example.com    # …and make that address an owner
```

Needs `SUPABASE_SERVICE_ROLE_KEY` in `.env` — seeding writes to tables only an
admin may write to, and on a fresh database there is no admin yet. Safe to run
repeatedly; it upserts content and never demotes an existing admin.

### Why the totals are computed twice

The cart's arithmetic is a preview. `submitOrder` re-prices the whole order
server-side against the CMS catalogue before writing it, because payment is
collected on delivery from the figure that reaches logistics — a total the
browser chose would be a total a shopper could choose. If you change how
pricing works, change it there.
