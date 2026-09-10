# Shop setup

Three things to connect, in this order. The first is done; the other two need
a few minutes in a browser.

---

## 0. The four switches only you can flip

Each of these lives in a dashboard the site cannot reach for you. None needs a
code change — the site is already built to use them the moment they are on.

### Get told about orders and enquiries — pick ONE, ~1 minute

Orders and contact-form enquiries are always saved to the database. This is
only about **being told**. Set `SHEETS_WEBHOOK_URL` in `.env` to any one of:

| Option           | Where to get the URL                                                        | You get                             |
| ---------------- | --------------------------------------------------------------------------- | ----------------------------------- |
| **Discord**      | Server → Edit channel → Integrations → Webhooks → New Webhook → Copy URL    | a message per order/enquiry         |
| **Slack**        | api.slack.com/apps → Create app → Incoming Webhooks → Add to channel → Copy | a message per order/enquiry         |
| **Google Sheet** | the Apps Script in section 2 below (slower to set up)                       | a row per order, a tab of enquiries |

The site works out which it is from the URL. Discord or Slack is the fastest
way to go live; the sheet is better if logistics already work from one.
Restart the dev server (or redeploy) after changing `.env`.

`SHEETS_WEBHOOK_SECRET` is only used by the Google Sheet option.

### Turn off email confirmation

Supabase → **Authentication → Sign In / Providers → Email** → switch off
**Confirm email** → Save.

While it is on, every new member has to find an email before they can shop,
and signing in first gives "not confirmed". The site now explains that and
offers to resend — but the smoothest fix is not to ask.

### Add "Continue with Google"

1. Google Cloud Console → **APIs & Services → Credentials → Create
   credentials → OAuth client ID** → Web application.
2. Authorised redirect URI:
   `https://vwuuwommxvqtgzlsndip.supabase.co/auth/v1/callback`
3. Copy the Client ID and Client secret.
4. Supabase → **Authentication → Sign In / Providers → Google** → enable,
   paste both → Save.

The button appears in the sign-in popup **by itself** as soon as the provider
is on — it reads the setting live, so there is nothing to deploy.

### Allow the redirect URLs

Supabase → **Authentication → URL Configuration**:

- **Site URL**: the live domain, e.g. `https://limonbandit.com`
- **Redirect URLs**: add `https://limonbandit.com/**` and, for local work,
  `http://localhost:8081/**`

Without these, confirmation and Google links fall back to the Site URL and
can land on the wrong page.

---

## 1. Supabase — accounts, wishlist, orders (done)

Project **limon-bandit-shop**, region `ap-south-1` (Mumbai), free tier.

- URL: `https://vwuuwommxvqtgzlsndip.supabase.co`
- Both `VITE_*` values are already in `.env`.

Five tables, RLS on all of them, denying by default:

| Table            | Who can do what                                    |
| ---------------- | -------------------------------------------------- |
| `profiles`       | read/write your own row only                       |
| `wishlist_items` | read/insert/delete your own rows only              |
| `orders`         | insert and read your own; **no update, no delete** |
| `offer_signups`  | insert only — nobody can read the list back        |
| `enquiries`      | anyone may submit; only admins can read or triage  |

`orders` has no update policy on purpose: fulfilment state is moved by staff
through the service role, so a buyer cannot mark their own order paid or
delivered. `offer_signups` is insert-only so the flash popup cannot be turned
into an email-harvesting endpoint.

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
