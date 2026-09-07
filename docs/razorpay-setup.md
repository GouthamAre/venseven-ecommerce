# VENSEVEN — Razorpay Account Setup & Configuration Guide

> **Document Version:** 1.0.0  
> **Author:** VENSEVEN Engineering  
> **Applies To:** Razorpay Dashboard, Render Backend (`venseven-backend`), Vercel Frontend (`venseven-ecommerce`)

---

## 1. Creating a Razorpay Account & Completing KYC

To accept online payments (UPI, Debit/Credit Cards, Netbanking) in India, you need an active Razorpay Merchant account.

### Step 1: Sign Up on Razorpay
1. Visit [https://razorpay.com/](https://razorpay.com/) and click **Sign Up**.
2. Enter your business email address and create a strong password.
3. Verify your email address via the activation link sent to your inbox.

### Step 2: Choose Your Business Type
Razorpay supports multiple business structures in India:
* **Individual / Freelancer / Unregistered Business**: Minimal documentation required (Aadhaar + PAN). Great for quick prototyping and low monthly volume.
* **Sole Proprietorship**: Requires GSTIN (if applicable) or Trade License / Shop & Establishment Certificate.
* **Private Limited (Pvt Ltd) / LLP / Partnership**: Requires Certificate of Incorporation (COI), Memorandum of Association (MOA), Board Resolution, and Director PAN/Aadhaar.

### Step 3: Complete KYC & Bank Account Verification
1. Navigate to **Account & Settings** > **KYC & Verification**.
2. Upload the required documents:
   * Promoter PAN Card & Aadhaar Card.
   * Business PAN Card (for registered companies).
   * Business Address Proof (Electricity bill, Lease agreement, or GST certificate).
   * Cancelled Cheque or Bank Statement showing Account Number, IFSC, and Beneficiary Name.
3. Razorpay conducts a **Penny Drop Test** (depositing ₹1.00 into your bank account) to verify ownership.
4. **Approval Timeline**: Initial test mode access is instant. Live KYC approval typically takes 24 to 72 business hours.

---

## 2. Generating API Keys (Test Mode & Live Mode)

Razorpay provides two pairs of API keys:
1. **Test Keys (`rzp_test_...`)**: Used for development, local testing, and staging. No real money is moved.
2. **Live Keys (`rzp_live_...`)**: Used in production. Charges actual customer credit/debit cards and UPI accounts.

### How to Generate or Regenerate Keys:
1. Log in to the [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. On the top navigation bar, toggle the switch between **Test Mode** and **Live Mode** depending on which keys you need.
3. In the left sidebar, click **Account & Settings** (or go to **Settings** > **API Keys**).
4. Click **Generate Key** (or **Regenerate Key** if you already generated one previously).
5. A modal will display two values:
   * **Key ID**: Starts with `rzp_test_` (Test) or `rzp_live_` (Live).
   * **Key Secret**: A secure 24-32 character string.
6. **Download or copy the Key Secret immediately**. Razorpay will never display the Secret again once you close this dialog.

> [!CAUTION]
> **Never commit your Key Secret to GitHub or any public repository!**  
> `RAZORPAY_KEY_SECRET` belongs strictly on your backend server (`server/.env`). Only `RAZORPAY_KEY_ID` may be exposed to the client.

---

## 3. Configuring Webhooks in Razorpay Dashboard

Webhooks allow Razorpay to notify the VENSEVEN backend directly when a payment succeeds, ensuring orders are marked as **Paid** even if the user closes their browser window.

### Step-by-Step Webhook Setup:
1. In the Razorpay Dashboard, select **Live Mode** (or **Test Mode** for local testing).
2. Go to **Settings** > **Webhooks** > **Add New Webhook**.
3. Fill in the webhook form:
   * **Webhook URL**:
     * **Production:** `https://venseven-backend.onrender.com/api/payments/webhook`
     * **Local Testing:** Use an ngrok tunnel (e.g., `https://your-tunnel.ngrok-free.app/api/payments/webhook`).
   * **Secret**: Enter a strong random string (e.g. generate via `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`).
     * Save this exact string into `server/.env` as `RAZORPAY_WEBHOOK_SECRET`.
   * **Alert Email**: Enter your engineering/monitoring email (e.g., `dev@venseven.com`).
4. **Select Active Events**:
   Check the following event checkboxes:
   * `order.paid` *(Triggered when an order is completely paid)*
   * `payment.captured` *(Triggered when a payment is captured successfully)*
   * `payment.failed` *(Triggered when a payment fails)*
   * `refund.processed` *(Optional: useful for automated refund status sync)*
5. Click **Create Webhook**.

---

## 4. Environment Variables Configuration for VENSEVEN

Configure the following variables in your local files and hosting provider dashboards:

### 4.1. Local Development (`.env`)

#### Backend (`server/.env`):
```env
# Razorpay Credentials (Test Mode)
RAZORPAY_KEY_ID=rzp_test_your_test_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
RAZORPAY_WEBHOOK_SECRET=your_test_webhook_secret

# Allowed CORS Origins
CLIENT_URL=http://localhost:5173,https://venseven-ecommerce.vercel.app
```

#### Frontend (`client/.env` or `client/.env.local`):
```env
# Razorpay Public Key ID (Test Mode)
VITE_RAZORPAY_KEY_ID=rzp_test_your_test_key_id
VITE_API_URL=http://localhost:5000
```

---

### 4.2. Production Deployment (Render & Vercel)

#### Backend on Render ([Render Dashboard](https://dashboard.render.com/)):
1. Navigate to your **VENSEVEN Backend** Web Service > **Environment**.
2. Add the following environment variables:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production mode and disables dev simulators |
| `RAZORPAY_KEY_ID` | `rzp_live_xxxxxxxxxxxxxxxx` | Live Razorpay Key ID |
| `RAZORPAY_KEY_SECRET` | `xxxxxxxxxxxxxxxxxxxxxxxx` | Live Razorpay Key Secret |
| `RAZORPAY_WEBHOOK_SECRET`| `xxxxxxxxxxxxxxxxxxxxxxxx` | Secret configured in Razorpay Webhook Dashboard |
| `CLIENT_URL` | `https://venseven-ecommerce.vercel.app` | Whitelisted frontend origin for CORS |

#### Frontend on Vercel ([Vercel Dashboard](https://vercel.com/)):
1. Navigate to your **venseven-ecommerce** project > **Settings** > **Environment Variables**.
2. Add the following environment variables:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://venseven-backend.onrender.com` | Production Express Backend API URL |
| `VITE_RAZORPAY_KEY_ID` | `rzp_live_xxxxxxxxxxxxxxxx` | Live Razorpay Key ID for Checkout SDK |

---

## 5. Switching Between Test Mode and Production Mode

The VENSEVEN codebase automatically adapts based on the provided keys:

| Environment | Key Format | Behavior |
| :--- | :--- | :--- |
| **Development** (Keys provided) | `rzp_test_...` | Real Razorpay Checkout modal opens with test payment methods. No bank account charged. |
| **Development** (Keys unset) | *Empty* | Server uses `RAZORPAY_DEV` mock order ID and simulates instant verification for UI development. |
| **Production** | `rzp_live_...` | Real transactions processed. Webhooks and cryptographic signatures strictly verified. |

### How to Switch from Test to Live:
1. In the Razorpay Dashboard, toggle the top switch from **Test Mode** to **Live Mode**.
2. Generate Live API Keys (**Account & Settings** > **API Keys**).
3. Replace the keys in:
   * Render Environment Variables (`RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`).
   * Vercel Environment Variables (`VITE_RAZORPAY_KEY_ID`).
4. Re-deploy the backend on Render and re-deploy the frontend on Vercel.
5. Create a Live Webhook pointing to `https://venseven-backend.onrender.com/api/payments/webhook`.

---

## 6. Razorpay Dashboard Customization & Branding

To ensure the checkout popup matches the VENSEVEN luxury aesthetic:
1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/) > **Account & Settings** > **Checkout Settings**.
2. **Brand Color**: Set theme color to `#25b7ed` (VENSEVEN signature cyan).
3. **Brand Logo**: Upload a clean square PNG of the VENSEVEN logo (transparent background, minimum 256x256 px).
4. **Business Name**: Set to `VENSEVEN`.
5. **Payment Methods**:
   Under **Payment Methods**, enable:
   * **UPI**: Google Pay, PhonePe, Paytm, BHIM, and QR Code.
   * **Cards**: Visa, MasterCard, RuPay, American Express.
   * **Netbanking**: All major Indian banks (HDFC, ICICI, SBI, Axis, Kotak).
   * **Wallets**: Amazon Pay, Mobikwik, etc.

---

## 7. Testing Procedures (Test Cards & UPI)

In **Test Mode**, you can use Razorpay's official sandbox credentials:

### 7.1. Test Card Details
* **Card Number:** `4111 1111 1111 1111` (Visa) or `5123 4567 8901 2345` (Mastercard)
* **Expiry Date:** Any future date (e.g. `12/30`)
* **CVV:** `123`
* **Cardholder Name:** `Devendra Verma` (or any name)
* **OTP for Verification:** `1234` (or click "Success" on the mock bank screen)

### 7.2. Test UPI Handles
* **Successful Payment:** `success@razorpay`
* **Failed / Declined Payment:** `failure@razorpay`

### 7.3. Simulating Webhooks Locally
You can test webhooks locally using **Postman** or the Razorpay Webhooks Test utility:
1. Send a `POST` request to `http://localhost:5000/api/payments/webhook`.
2. Include the header `X-Razorpay-Signature` computed with your local `RAZORPAY_WEBHOOK_SECRET`.
3. Verify that the order's status in MongoDB transitions to `Paid`.

---

## 8. Pre-Deployment Go-Live Checklist

Use this 12-point checklist before opening the store to real customers:

- [ ] **1. KYC Approved**: Razorpay account status is active and verified for Live Mode.
- [ ] **2. Live Keys Generated**: `rzp_live_...` generated from the Live dashboard (not `rzp_test_`).
- [ ] **3. Render Server Secrets Set**: `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` added to Render environment.
- [ ] **4. Vercel Client Key Set**: `VITE_RAZORPAY_KEY_ID` added to Vercel environment.
- [ ] **5. Webhook Configured**: Live webhook active on Razorpay pointing to `https://venseven-backend.onrender.com/api/payments/webhook`.
- [ ] **6. Webhook Secret In Sync**: `RAZORPAY_WEBHOOK_SECRET` identical on both Razorpay and Render.
- [ ] **7. HTTPS Verified**: SSL/TLS certificate active on both frontend (`https://venseven-ecommerce.vercel.app`) and backend (`https://venseven-backend.onrender.com`).
- [ ] **8. CORS Configured**: `https://venseven-ecommerce.vercel.app` listed in `CLIENT_URL` on Render.
- [ ] **9. Brand Styling Verified**: Razorpay Checkout modal displays the VENSEVEN logo and `#25b7ed` theme color.
- [ ] **10. Transactional Email Active**: SendGrid / SMTP credentials configured so receipts are delivered to customers upon payment.
- [ ] **11. Test Real ₹1 Transaction**: Place a real order on production with a small ₹1 to ₹10 item, pay via personal UPI/card, verify bank settlement in Razorpay dashboard, and test refund.
- [ ] **12. Zero Leaked Secrets**: Verified that `RAZORPAY_KEY_SECRET` does not appear in Git commits or client-side bundles.
