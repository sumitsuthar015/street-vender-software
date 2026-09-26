# StreetMenu: QR menu, ordering & payments for street food vendors

Vendors register, add their menu, print a QR poster (one for the stall, one per table) and stick it up.
Customers scan it, order from their phone, pay online or at the counter, watch the order status live, and rate the food.

## What it does

**Vendor (dashboard)**
- Register / log in with email + password
- Menu: add dishes with price, photo, category, veg/non-veg, prep time; one-tap "sold out"
- Live orders: new orders ring with a sound and get a daily token number (#1, #2, …)
  - Accept → Ready → Hand over, or Reject with a reason (online payments are refunded automatically)
  - Pay-at-counter orders show how much cash to collect
- Home: today's orders, earnings, cash to collect, rating, 7-day earnings chart, best sellers, top rated dishes
- Reviews: all ratings and comments, filter by stars
- QR codes:
  - **Stall poster** with your stall photo, logo, name, tagline, opening hours, rating, address and phone.
    Your logo sits in the middle of the QR. Download as a high-resolution PNG (for a print shop) or print it.
  - **Table-wise QR codes**: add tables (one by one or "+5 / +10"), rename, delete; poster per table with the
    table name; "Print all" prints every table's QR. Orders from a table show the table name on the vendor's order card.
- Settings: stall photo & logo, shop details, opening hours, open/closed switch, payment options, change password

**Customer (no app, no login)**
- Scan QR → menu with the stall photo & logo, search, veg-only filter, sort by rating/price, category tabs
- Scanned a table QR? The menu says "You're at Table 4" and the order is served at that table
- Ratings on every dish, "Top rated" and "Bestseller" badges, "Customers love these" section
- Checkout with name (+ optional phone and note), choose **Pay online** or **Pay at counter**
- Live order tracking with token number: placed → preparing (with ready time) → ready → collected
- Cancel before the shop accepts; switch a failed online payment to pay at counter
- Rate each dish after collecting the order (only real customers can rate, once per order)

## Tech

| Part | Stack |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion (animations), Socket.IO client, qrcode.react, html-to-image (poster PNG) |
| Backend | Node.js, Express 5, Socket.IO (live updates), JWT login, Zod validation |
| Database | MongoDB (Atlas) with Mongoose. Everything is stored here, including dish photos |
| Payments | Razorpay (UPI/cards/wallets), each vendor with their own account + pay at counter. Demo mode for shops without keys |

```
backend/src
  server.js        app entry (also serves the built frontend in production)
  config.js db.js  settings from .env, MongoDB connection
  models/          Vendor, MenuItem, Order, Review, Counter
  routes/          auth, vendor (dashboard), public (customer), images, webhooks
  services/        orders (order rules), payments (Razorpay), realtime (Socket.IO)
  seed.js          creates a demo shop
frontend/src
  pages/           Landing, Auth, dashboard/*, shop/ShopPage (menu), shop/OrderPage (tracking)
  components/      UI building blocks
  lib/             api client, auth, sockets, cart, formatting
```

## Run it on your computer

Needs Node.js 18 or newer.

```bash
npm install        # installs root + backend + frontend
npm run seed       # optional: creates a demo shop (demo@vendor.com / demo1234)
npm run dev        # starts backend (port 5001) + frontend (port 5173)
```

Open http://localhost:5173

- Vendor: register, or log in with the demo account
- Customer: http://localhost:5173/s/demo-chaat-corner (or your shop's link from the **QR code** page)

**Testing with your phone:** the terminal shows a `Network:` address like `http://192.168.1.5:5173`.
Open the dashboard with that address on your computer; the QR code will then work when scanned by a phone on the same Wi-Fi.

### Settings (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` if you don't have one.

| Key | What it is |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `DB_NAME` | Database name (default `street_vendor`) |
| `JWT_SECRET` | Long random string used to sign logins and encrypt vendors' Razorpay keys (changing it means vendors re-enter their keys) |
| `DEMO_PAYMENTS` | `on`/`off`: simulated online payments for shops without Razorpay keys. Default `on` in development, `off` in production |
| `TIMEZONE` | For daily token numbers & "today" stats (default `Asia/Kolkata`) |

If MongoDB Atlas refuses the connection, go to Atlas → **Network Access** and allow your IP address.

## Payments

**Pay at counter:** the order goes straight to the vendor. The vendor collects cash/UPI when handing over the food
("Collect ₹X & hand over"), or taps "Mark as paid" earlier.

**Pay online:** the order reaches the vendor **only after the payment succeeds**. The server creates a Razorpay order
with the price from the database (customers can't change prices), and verifies Razorpay's signature before marking it paid.
If the vendor rejects a paid order, or the customer cancels, it is refunded through Razorpay automatically.

**Every vendor uses their own Razorpay account**, so each shop's money goes straight to that shop. There are no
Razorpay keys in `.env`. The Key Secret is stored encrypted and is never sent back to the browser.

**Demo mode** (shop hasn't connected Razorpay, `DEMO_PAYMENTS=on`): a fake payment screen with "success" and "fail"
buttons. No real money moves. With `DEMO_PAYMENTS=off` (default in production) such shops only take payment at the counter.

**Connecting Razorpay (each vendor):**
1. Create an account at https://dashboard.razorpay.com, switch to **Test Mode**, then Account & Settings → API Keys
2. In this app: Dashboard → **Settings → Payment options → Connect your Razorpay account**, paste Key ID + Key Secret.
   The keys are checked with Razorpay before saving. Test with Razorpay's test UPI `success@razorpay`
3. Recommended once the app is online: in Razorpay, Webhooks → add the URL shown in Settings
   (`https://<your-domain>/api/webhooks/razorpay/<vendorId>`) with events `payment.captured` and `order.paid`,
   and paste the same webhook secret in Settings (confirms payments even if the customer closes the browser)
4. After Razorpay activates the account (KYC), replace the test keys with Live keys in Settings

## Put it online (production)

```bash
npm install
npm run build      # builds the frontend into frontend/dist
npm start          # backend serves the API + website on PORT
```

Works on any Node host (Render, Railway, a VPS…). Set the `.env` values as environment variables there, plus `NODE_ENV=production`.
Then print your QR code from the live site so it contains your real web address.

## API overview

| Method & path | Who | What |
|---|---|---|
| `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` | vendor | account |
| `PATCH /api/vendor/profile`, `POST /api/vendor/password` | vendor | settings, photos (`cover`/`logo`), open/close shop |
| `PUT/DELETE /api/vendor/razorpay` | vendor | connect / disconnect the shop's own Razorpay account |
| `POST /api/vendor/tables`, `PATCH/DELETE /api/vendor/tables/:code` | vendor | tables for table-wise QR |
| `GET/POST /api/vendor/menu`, `PATCH/DELETE /api/vendor/menu/:id` | vendor | menu |
| `GET /api/vendor/orders?scope=active\|history` | vendor | orders |
| `PATCH /api/vendor/orders/:id/status`, `POST /api/vendor/orders/:id/mark-paid` | vendor | update order |
| `GET /api/vendor/stats`, `GET /api/vendor/reviews` | vendor | dashboard numbers, reviews |
| `GET /api/shops/:slug?table=CODE`, `GET /api/shops/:slug/items/:id/reviews` | customer | menu (+ which table), dish reviews |
| `GET /api/images/menu/:id`, `GET /api/images/shop/:id/cover`, `…/logo` | anyone | photos stored in MongoDB |
| `POST /api/shops/:slug/orders` | customer | place order (`tableCode` for dine-in) |
| `GET /api/orders/:code`, `POST /api/orders/:code/cancel`, `POST /api/orders/:code/switch-to-counter` | customer | track / change order |
| `POST /api/orders/:code/pay`, `…/pay/verify`, `…/pay/demo` | customer | online payment |
| `POST /api/orders/:code/reviews` | customer | rate dishes |
| `POST /api/webhooks/razorpay/:vendorId` | Razorpay | payment confirmation (per vendor) |

Live updates (Socket.IO): vendors get `order:new` / `order:updated`; customers get `order:changed` for their order.
