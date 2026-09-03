# Shop setup

Three things to connect, in this order. The first is done; the other two need
a few minutes in a browser.

---

## 1. Supabase — accounts, wishlist, orders (done)

Project **limon-bandit-shop**, region `ap-south-1` (Mumbai), free tier.

- URL: `https://vwuuwommxvqtgzlsndip.supabase.co`
- Both `VITE_*` values are already in `.env`.

Four tables, RLS on all of them, denying by default:

| Table            | Who can do what                                    |
| ---------------- | -------------------------------------------------- |
| `profiles`       | read/write your own row only                       |
| `wishlist_items` | read/insert/delete your own rows only              |
| `orders`         | insert and read your own; **no update, no delete** |
| `offer_signups`  | insert only — nobody can read the list back        |

`orders` has no update policy on purpose: fulfilment state is moved by staff
through the service role, so a buyer cannot mark their own order paid or
delivered. `offer_signups` is insert-only so the flash popup cannot be turned
into an email-harvesting endpoint.

### One switch worth deciding on

Supabase ships with **Confirm email** ON. A new member therefore has to click
a link before they can sign in, and the popup tells them so. If you would
rather they shop immediately:

Dashboard → Authentication → Sign In / Providers → Email → turn off
**Confirm email**.

Leave it on if you would rather not collect unverified addresses. The site
handles both — nothing in the code needs changing either way.

### Optional: the service role key

Add `SUPABASE_SERVICE_ROLE_KEY` to `.env` (Dashboard → Project Settings → API
keys → `service_role`) and each order records whether its sheet sync
succeeded, in `sheet_synced_at` / `sheet_error`. Without it orders are still
placed and still pushed to the sheet — you just have no record of which
pushes failed.

**Never prefix it with `VITE_`.** That would put a key that bypasses every RLS
policy into the browser bundle.

---

## 2. Google Sheet — the logistics queue

1. Make a new spreadsheet. Name it something obvious: _Limon Bandit — Orders_.
2. **Extensions → Apps Script**. Delete the stub `myFunction`.
3. Paste all of `scripts/sheet-webhook.gs`.
4. Change `SHARED_SECRET` at the top from `CHANGE-ME` to any random string.
   Keep it to hand — it goes in `.env` in a moment.
5. **Deploy → New deployment**, gear icon → **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**

   "Anyone" is what lets the site's server POST to it without a Google login.
   The shared secret is what keeps strangers out, which is why step 4 is not
   optional.

6. Authorise when prompted. Google will warn that the app is unverified —
   **Advanced → Go to (project name)** — it is your own script.
7. Copy the **Web app URL**. It ends in `/exec`.
8. Put both values in `.env`:

```bash
SHEETS_WEBHOOK_URL="https://script.google.com/macros/s/AKfy…/exec"
SHEETS_WEBHOOK_SECRET="the-random-string-from-step-4"
```

9. Restart the dev server. Env vars are read at boot.

Check it: open the `/exec` URL in a browser. It should print
`{"ok":true,"service":"limon-bandit-orders"}`. If it asks you to sign in,
"Who has access" is not set to Anyone.

The header row and the `Orders` tab are created on the first order — there is
nothing to set up in the sheet itself.

### What arrives

One row per order: reference, timestamp, status, name, phone, email, full
address, city, PIN, the basket flattened into one cell, item count, subtotal,
shipping, discount, code, **total to collect**, payment method and status, and
the buyer's note.

Re-sending the same reference is ignored, so a retried sync cannot produce a
second parcel.

---

## 3. Payment — later, without a rebuild

Every order is written `payment_method: "cod"`, `payment_status: "pending"`,
and the columns `payment_ref` and the `paid` / `failed` / `refunded` states
already exist.

When a gateway is wanted (Razorpay is the sane default for INR), it slots into
one place — `submitOrder` in [`src/lib/orders.ts`](../src/lib/orders.ts),
between the insert and the sheet push:

1. Insert the order exactly as now. The server has already priced it.
2. Create a gateway order for `total_inr`, return its id to the browser, and
   let the checkout open the gateway's widget.
3. On the gateway's **server-side webhook**, verify the signature, then set
   `payment_status: "paid"` and `payment_ref`.
4. Move the `syncToSheet` call into that webhook.

Step 4 is the point of the ordering: logistics then only ever see orders that
have actually been paid for, and an abandoned payment leaves a `pending` row
in the database and nothing in the sheet.

Nothing in the cart, the catalogue or the checkout form has to change — the
totals are already computed server-side, which is the part that a payment
integration cannot be bolted onto safely afterwards.

---

## Why the total is computed on the server

Worth knowing before anyone "simplifies" it.

Payment is collected on delivery, from the figure in the sheet. If the browser
supplied that figure, a shopper could edit it: a forged `total_inr: 1` on a
₹4,200 jacket is a jacket out of the door for a rupee, and it needs no
exploit — the insert was theirs to make.

So the browser sends only product ids, sizes and quantities. `submitOrder`
prices them against `src/data/shop.ts`, applies shipping and validates the
discount code against `src/data/offers.ts`, and writes the total it computed.
The cart's arithmetic is a preview and never leaves the browser.
