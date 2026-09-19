# Smart Street Vendor Ordering & Management Platform

A production-quality, scalable, mobile-first full-stack web application designed specifically for **street-food vendors, food carts, stalls, kiosks, small restaurants, and local food hubs**.

---

## 🌟 Key Features & Core Flow

1. **QR-Based Instant Storefront Access**:
   - Unique Stall QR (`/vendor/:vendorId`) and Table QR (`/vendor/:vendorId/table/:tableId`) generation.
   - Customers scan QR and arrive directly at the vendor's digital menu without searching.

2. **Mobile OTP & Password Authentication**:
   - Customer login via 10-digit mobile number & 6-digit OTP (with built-in development fallback/universal demo OTP `123456`).
   - Role-based authorization for **Customers**, **Vendors**, and **Super Admins**.

3. **Food Customizations & Inventory Control**:
   - Spice level, size options, extra cheese/sauce add-ons.
   - Real-time stock quantity tracking with low-stock alerts (`⚠️ Only 5 left!`) and automatic out-of-stock disabling.

4. **Razorpay Payments & Cash Support**:
   - Razorpay test integration + built-in fallback sandbox mock mode.
   - Self pickup or Table Dine-in order selection.

5. **Real-Time Kitchen Queue & Order Tracking**:
   - Socket.IO real-time order state updates (`PENDING` → `ACCEPTED` → `PREPARING` → `READY` → `COMPLETED`).
   - Audio alerts & floating toasts on vendor dashboard and customer tracking screen.

6. **Digital Invoices & Verified Purchase Reviews**:
   - Instant printable digital invoice with itemized breakdown, discounts & payment metadata.
   - Only customers with completed orders can submit star ratings & reviews.

7. **Vendor Business Analytics & Super Admin Portal**:
   - Vendor gross sales, net earnings, peak ordering hours chart, top selling dishes & repeat customer retention rate.
   - Super admin platform statistics, vendor application approval/rejection, customer management, and support ticket helpdesk.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Socket.IO Client, Axios, Recharts, Canvas Confetti, QRCode SVG.
- **Backend**: Node.js, Express.js, Socket.IO, Mongoose, JWT, bcryptjs, Razorpay SDK, QRCode.
- **Database**: MongoDB / MongoDB Atlas.

---

## 🚀 Quick Setup & Installation Guide

### Prerequisites
- Node.js (v18+ recommended)
- Local MongoDB running on `mongodb://localhost:27017` or a MongoDB Atlas Connection URI.

### 1. Backend Setup
```bash
cd backend
npm install
```

Create/Verify `.env` in `backend/`:
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/street_vendor_db
JWT_SECRET=super_secret_jwt_key_street_vendor_2026_safe
JWT_EXPIRES_IN=7d
RAZORPAY_KEY_ID=rzp_test_mock1234567890
RAZORPAY_KEY_SECRET=mock_razorpay_secret_key_12345
OTP_DEMO_MODE=true
OTP_UNIVERSAL=123456
FRONTEND_URL=http://localhost:5173
ALLOW_IN_MEMORY_DB=true
```

`ALLOW_IN_MEMORY_DB=true` is intended for local development when MongoDB Atlas is unavailable.
The fallback database is stored in `backend/.data/mongodb`, so categories and menu items survive
backend restarts. For persistent shared production data, allow your IP address in MongoDB Atlas
and remove this setting.

#### Run Database Seed Script:
Populate database with sample vendors, categories, food items, tables, and test users:
```bash
npm run seed
```

#### Start Backend API & Socket Server:
```bash
npm run dev
```
Backend runs on `http://localhost:5001`.

---

### 2. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

## 🔑 Demo Account Credentials

| Role | Mobile / Identifier | Password / OTP | Description |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `9999999999` | `admin123` | Platform governance, vendor approval, stats |
| **Approved Vendor** | `9876543210` | `vendor123` | Delhi Chaat Corner (Kitchen Queue, Menu, QR) |
| **Customer** | Any 10-digit mobile | `123456` | OTP mobile login & checkout |

---

## 🧪 Verification & Manual Testing Steps

1. **Customer QR Flow**:
   - Open `http://localhost:5173/vendor/delhi-chaat-corner`
   - Select food items (e.g. *Mumbai Vada Pav*, *Special Samosa*), customize spice level / extra cheese, and click **Add**.
2. **Mobile Login & Checkout**:
   - Enter mobile `9123456789` -> Use Demo OTP `123456` -> Proceed to checkout.
   - Select Razorpay Online Payment or Cash -> Confirm order.
3. **Real-time Kitchen Dashboard**:
   - Open `http://localhost:5173/vendor/dashboard` in a new tab.
   - Watch the new order appear under **NEW ORDERS**. Click **Accept** → **Start Preparing** → **Mark Ready** → **Complete**.
   - Notice live updates & sound alerts on customer tracking screen!
4. **Digital Invoice & Verified Review**:
   - On customer order page, click **View Digital Invoice** to inspect itemized printable receipt.
   - Rate stall with 5 stars & comment upon completion.
"# street-vender-software" 
