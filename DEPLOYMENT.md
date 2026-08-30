# VENSEVEN — Production Deployment & Launch Guide

This guide provides step-by-step instructions for deploying the **VENSEVEN Men's Fashion Studio** e-commerce platform into production.

---

## 1. System Architecture & Required Services

```text
┌────────────────────────────────────────────────────────┐
│              VENSEVEN FRONTEND (React + Vite)          │
│              Hosted on: Vercel / Netlify / Cloudflare   │
│              Custom Domain: https://venseven.com       │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS API Requests
                            ▼
┌────────────────────────────────────────────────────────┐
│              VENSEVEN BACKEND (Node.js + Express)      │
│              Hosted on: Render / Railway / AWS / VPS   │
│              API Domain: https://api.venseven.com      │
└──────────────┬─────────────┬─────────────┬─────────────┘
               │             │             │
        ┌──────▼──────┐ ┌────▼────┐ ┌──────▼──────┐
        │   MongoDB   │ │ Cloudinary │ Razorpay  │
        │    Atlas    │ │  Media  │ │  Payments   │
        └─────────────┘ └─────────┘ └─────────────┘
               │
        ┌──────▼──────┐
        │  SMTP Email │
        │ (SendGrid)  │
        └─────────────┘
```

### Required Third-Party Services:
1. **MongoDB Atlas**: Managed MongoDB cluster for user profiles, product catalogue, orders, wishlists, and promotional coupons.
2. **Cloudinary**: Cloud media hosting and transformation CDN for high-resolution product imagery.
3. **Razorpay**: Payment gateway handling secure card, UPI, and net banking transactions.
4. **SMTP Provider (SendGrid / Postmark / Mailgun / AWS SES)**: Transactional email infrastructure for order receipts, payment confirmations, and password recovery.

---

## 2. Environment Variables Specification

### Server Environment Variables (`server/.env`):
| Variable | Description | Example / Recommended Value |
|---|---|---|
| `PORT` | Listening port | `5000` (or host-assigned) |
| `NODE_ENV` | Environment mode | `production` |
| `MONGODB_URI` | MongoDB Atlas URI | `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/venseven?retryWrites=true&w=majority` |
| `JWT_SECRET` | 256-bit cryptographic signing secret | `openssl rand -base64 32` |
| `CLIENT_URL` | Frontend origin(s) for CORS & email links | `https://venseven.com,https://www.venseven.com` |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | `rzp_live_xxxxxxxxxxxxxx` (or `rzp_test_...`) |
| `RAZORPAY_KEY_SECRET` | Razorpay Secret Key (Private) | `xxxxxxxxxxxxxxxxxxxxxxxx` |
| `CLOUDINARY_CLOUD_NAME`| Cloudinary Cloud Name | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `123456789012345` |
| `CLOUDINARY_API_SECRET`| Cloudinary API Secret (Private) | `xxxxxxxxxxxxxxxxxxxxxxxx` |
| `SMTP_HOST` | SMTP Hostname | `smtp.sendgrid.net` |
| `SMTP_PORT` | SMTP Port | `587` |
| `SMTP_USER` | SMTP Username | `apikey` |
| `SMTP_PASSWORD` | SMTP API Key / Password | `SG.xxxxxxxxxxxxxxxxxxxx` |
| `EMAIL_FROM` | Verified sender signature | `VENSEVEN Studio <orders@venseven.com>` |

### Frontend Client Environment Variables (`client/.env`):
| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Deployed backend API base URL | `https://api.venseven.com` or `https://venseven-backend.onrender.com` |
| `VITE_RAZORPAY_KEY_ID` | Razorpay Public Key ID (Checkout SDK only) | `rzp_live_xxxxxxxxxxxxxx` |
| `VITE_CLOUDINARY_CLOUD_NAME`| Cloudinary Public Cloud Name | `your_cloud_name` |

> [!CAUTION]
> **Never commit real `.env` files. Private secrets (`JWT_SECRET`, `RAZORPAY_KEY_SECRET`, `CLOUDINARY_API_SECRET`, `SMTP_PASSWORD`) must NEVER be exposed in client code or prefixed with `VITE_`.**

---

## 3. Local Development Setup

```bash
# 1. Clone repository
git clone <YOUR_REPOSITORY_URL>
cd venseven-ecommerce

# 2. Setup and run backend server
cd server
npm install
cp .env.example .env
# Fill in your local environment variables in server/.env
npm run dev

# 3. In a separate terminal, setup and run frontend client
cd ../client
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000 in client/.env
npm run dev
```

---

## 4. Production Build & Execution Commands

### Frontend Client:
- **Build**: `npm run build` (outputs optimized static assets to `client/dist`)
- **Lint**: `npm run lint`
- **Preview**: `npm run preview`

### Backend Server:
- **Production Start**: `npm start` (executes `node index.js`)
- **Database Seed**: `npm run seed`

---

## 5. Deployment Step-by-Step

### 1. MongoDB Atlas Configuration
1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user with `readWriteAnyDatabase` or `readWrite@venseven`.
3. In **Network Access**, add `0.0.0.0/0` (allow access from anywhere, secured by your database credentials).
4. Copy the connection string into `MONGODB_URI`.

### 2. Backend Deployment (Render)
1. In [Render Dashboard](https://dashboard.render.com), click **New → Web Service**.
2. Connect your Git repository.
3. Configure settings:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. In **Environment Variables**, add all server variables listed in Section 2.
5. Deploy service and verify via health check: `https://<YOUR-RENDER-URL>/api/health`.

### 3. Frontend Deployment (Vercel)
1. In [Vercel Dashboard](https://vercel.com/dashboard), click **Add New → Project**.
2. Import your Git repository.
3. Configure settings:
   - **Root Directory**: `client`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Under **Environment Variables**, add `VITE_API_URL` and `VITE_RAZORPAY_KEY_ID`.
5. Deploy. Vercel automatically applies `client/vercel.json` for SPA deep link routing.

---

## 6. SPA Routing & Deep Link Handling

Because VENSEVEN is a Single Page Application (SPA) using React Router, direct navigation or page refreshes on nested routes (`/shop`, `/product/:slug`, `/account`, `/orders`, `/admin/*`) must be redirected to `index.html`.

- **Vercel**: Handled automatically via `client/vercel.json`.
- **Netlify / Static Hosts**: Handled automatically via `client/public/_redirects`.
- **Nginx / VPS**:
  ```nginx
  location / {
      try_files $uri $uri/ /index.html;
  }
  ```

---

## 7. CORS Configuration

The Express backend dynamically verifies the incoming request origin against `CLIENT_URL`:
- In **development** (`NODE_ENV=development`): allows `http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:3000`.
- In **production** (`NODE_ENV=production`): strictly restricts requests to the configured `CLIENT_URL` domain(s). Multiple comma-separated domains are supported (e.g. `https://venseven.com,https://www.venseven.com`).

---

## 8. Razorpay: Test Mode vs Live Mode

1. **Test Mode** (Development & Staging):
   - Use `rzp_test_...` key pairs.
   - Use Razorpay Test Cards / UPI simulation to verify order flow.
2. **Live Mode** (Production):
   - Complete KYC on the [Razorpay Dashboard](https://dashboard.razorpay.com).
   - Generate Live API Keys (`rzp_live_...`).
   - Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Render.
   - Set `VITE_RAZORPAY_KEY_ID` in Vercel.
   - **Security**: Payable amounts are ALWAYS recomputed on the backend from MongoDB records; client amounts are ignored. Cryptographic HMAC SHA-256 signature verification guarantees transaction authenticity.

---

## 9. Promoting the Primary Administrator

1. Register an account through the storefront UI at `/account`.
2. Open MongoDB Atlas (or MongoDB Compass).
3. In the `users` collection, locate your user document and update:
   ```json
   { "$set": { "role": "admin" } }
   ```
4. Sign in to access the protected Management Portal at `/admin`.

---

## 10. Custom Domain & DNS Setup

To attach custom domains (e.g. `https://venseven.com` for frontend and `https://api.venseven.com` for backend):

1. **Frontend (Vercel)**:
   - In Vercel Project Settings → **Domains**, add `venseven.com` and `www.venseven.com`.
   - Add the DNS `A` record (`76.76.21.21`) or `CNAME` (`cname.vercel-dns.com`) provided by Vercel in your DNS registrar.
2. **Backend (Render)**:
   - In Render Web Service Settings → **Custom Domains**, add `api.venseven.com`.
   - Add the `CNAME` pointing to `<service-name>.onrender.com` in your DNS registrar.
3. **Update URLs**:
   - Update `CLIENT_URL=https://venseven.com,https://www.venseven.com` in Render.
   - Update `VITE_API_URL=https://api.venseven.com` in Vercel.
4. **Email DNS Records**:
   - Add SPF (`v=spf1 include:sendgrid.net ~all`), DKIM, and DMARC TXT records in your DNS manager to ensure 100% email delivery to customer inboxes.

---

## 11. Pre-Launch Security Checklist

- [ ] `NODE_ENV=production` is set on the backend.
- [ ] `JWT_SECRET` is set to a secure, randomly generated 256-bit secret.
- [ ] No `.env` files are tracked in Git.
- [ ] `GET /api/health` returns `status: "healthy"` and HTTP 200.
- [ ] Unauthorized requests to `/api/admin/*` return HTTP 401/403.
- [ ] Password hashes and reset tokens are excluded from all API responses.
- [ ] Frontend uses `https://` for all production API requests.
- [ ] Razorpay Live API keys are active and verified.
- [ ] Transactional emails deliver cleanly for order confirmation and password resets.
- [ ] Direct URL refreshes on nested routes load without 404 errors.
