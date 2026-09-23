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

| Section                                                      | What is in it                                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| **Dashboard**                                                | What is waiting (orders to ship, enquiries to answer), revenue, and recent changes    |
| **Inbox** → Orders, Enquiries, Subscribers                   | Work the orders, answer the contact form, export the mailing list                     |
| **Analytics**                                                | Visits, top pages, traffic over time                                                  |
| **Pages** → Home, Rooms, Label, Shop, Crew, Journal, Contact | Everything that appears on that page                                                  |
| **Global content**                                           | Contact details, menu, social links, tickers, FAQ, legal pages, page headings and SEO |
| **Shop & pricing**                                           | Products, prices, stock, discount codes, delivery costs                               |
| **Media**                                                    | Every image uploaded, and links you have added                                        |
| **Ownership**                                                | Who can edit, and a history of every change                                           |

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

**Everything is live on the server, not only in the browser.** Pages are
built with the content as you last saved it, so what Google, WhatsApp link
previews and a first-time visitor see is your latest text. The server keeps a
copy for up to 30 seconds — if you have just saved and a fresh tab still shows
the old text, wait a moment and reload rather than saving again.

**Page headings are under Global content → Page titles & SEO.** Each page's
H1, the big poster wordmark above it, the line under it, the short name used
in breadcrumbs and the "next page" doors, and its search-engine title and
description. Leave "Page id" and "Path" alone.

**Journal entries are pages the moment you save them.** A new entry gets its
own address (`/journal/<web address>`), appears in the sitemap, and links to
its neighbours. Deleting one makes its address a proper "not found".

**Legal pages** (Global content → Legal pages) are the terms, privacy policy
and shipping & returns linked from the footer and from checkout. The text
that ships is a working draft written from how the site actually behaves —
have it read by someone qualified, and fill in your registered business name,
before relying on it. Change the "Last updated" date whenever a policy
changes.

**The Room A film** (Home → Room A film) takes a link to an MP4. Until one is
set the section shows the still frame and hides its play controls.

**Discount codes** under Shop & pricing are checked in three places — the
first-order popup hands out the first code in the list, and checkout and the
server both accept any code in it that has not expired.

**The Inbox** shows orders, enquiries and mailing-list signups. Move orders
through received → confirmed → packed → shipped → delivered and mark them
paid when the cash comes in; mark enquiries replied so nobody answers twice
(pressing _Reply by email_ does it for you); export subscribers as CSV for
your newsletter tool and remove anyone who asks.

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

New collections (`global.legal`, `page.home.film`) do not need seeding: a key
missing from the database renders its seed, and the first save from the admin
creates the row. Do **not** re-seed a live site just to add them — `cms:seed`
overwrites every edited document with the repo's version.

### How content reaches the page

`src/cms/live.ts` reads every document over REST (publishable key; the table
is world-readable, RLS guards writes) with a 30-second cache and a 1.5s
timeout. The root route's loader calls it, so the server render and the first
client render both carry the stored content, and `ContentProvider` takes that
as its initial state. Anything that must be decided on the server — does this
journal slug or legal page exist, what is the canonical origin, what goes in
the sitemap — reads `liveDocs()` directly. `head` functions cannot await, so
`seo.ts` reads `lastDocs()`, which every loader has populated by then.

Chapter copy (H1, poster, standfirst, breadcrumb name) goes through
`useChapter()` / `useChapterNeighbours()` in `cms/hooks.ts`, which layer the
`global.pages` row over the compiled `src/data/routes` entry field by field.
`key` and `to` always come from the compiled table.

### The inbox and its migration

`/admin/orders`, `/admin/enquiries` and `/admin/subscribers` read and update
rows as the signed-in admin. They need the policies in
`supabase/migrations/20260918_admin_inbox.sql` (admin select/update on
`orders`, select/update on `enquiries`, select/delete on `offer_signups`),
**applied to limon-bandit-shop on 2026-09-24**. A fresh database — a branch,
a restore, another environment — needs them again; the file is idempotent.
Without them, reads come back empty (RLS filters rather than errors) and
updates are reported as refused, never as saved.

### Why the totals are computed twice

The cart's arithmetic is a preview. `submitOrder` re-prices the whole order
server-side against the CMS catalogue before writing it, because payment is
collected on delivery from the figure that reaches logistics — a total the
browser chose would be a total a shopper could choose. If you change how
pricing works, change it there.
