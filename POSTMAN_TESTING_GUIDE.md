# VENSEVEN API — Complete Postman Testing Guide

This guide provides an in-depth, step-by-step walkthrough for testing all backend API endpoints on the live production server:

**Production Base URL:**
```text
https://venseven-backend.onrender.com
```

---

## 1. Postman Environment Setup

Setting up an environment in Postman makes testing automated and seamless by automatically passing tokens and IDs across requests.

### Step 1: Create a Postman Environment
1. In Postman, click on **Environments** on the left sidebar and click **+ (Create Environment)**.
2. Name the environment: **`VENSEVEN Production`**.
3. Add the following variables:

| Variable | Initial Value | Current Value | Description |
|---|---|---|---|
| `baseUrl` | `https://venseven-backend.onrender.com` | `https://venseven-backend.onrender.com` | Live backend API URL |
| `authToken` | *(leave blank)* | *(auto-populated on login)* | Customer JWT Token |
| `adminToken` | *(leave blank)* | *(populated on admin login)* | Admin JWT Token |
| `productId` | *(leave blank)* | *(auto-saved from product list)* | Product MongoDB ID |
| `productSlug` | *(leave blank)* | *(auto-saved from product list)* | Product URL slug |
| `orderNumber` | *(leave blank)* | *(auto-saved on order create)* | e.g. `V7-2026-000123` |
| `couponCode` | `WELCOME10` | `WELCOME10` | Promo discount code |

4. Click **Save** and select **`VENSEVEN Production`** from the environment dropdown in the top-right corner of Postman.

---

## 2. Global Request Headers

For almost all JSON requests, add the following header in Postman:
```text
Content-Type: application/json
```

For protected customer endpoints, add:
```text
Authorization: Bearer {{authToken}}
```

For protected admin endpoints, add:
```text
Authorization: Bearer {{adminToken}}
```

---

## 3. Step-by-Step Test Sequence

---

### Step 1: Server & Database Health Check

Verify that the Render backend instance is awake and connected to MongoDB Atlas.

* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/health`
* **Headers:** *(None required)*

#### Expected Response (`200 OK`):
```json
{
  "status": "healthy",
  "service": "VENSEVEN API",
  "database": "connected",
  "environment": "production",
  "timestamp": "2026-09-01T14:30:00.000Z"
}
```

> [!NOTE]
> If Render was in sleep mode (Free tier), the first request may take ~30–50 seconds to warm up the container. Subsequent requests will be instant.

---

### Step 2: Customer Registration

Create a new client account.

* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/auth/register`
* **Headers:** `Content-Type: application/json`
* **Body (raw JSON):**
```json
{
  "name": "Devendra Verma",
  "email": "devendra.test@venseven.com",
  "password": "Password123!",
  "phone": "9876543210"
}
```

#### Postman Test Script (Paste in Postman **Tests** tab):
```javascript
if (pm.response.code === 201) {
    const jsonData = pm.response.json();
    pm.environment.set("authToken", jsonData.token);
    console.log("Customer Auth Token saved:", jsonData.token);
}
```

#### Expected Response (`201 Created`):
```json
{
  "success": true,
  "message": "Account created successfully.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65e0a1b2c3d4e5f6a7b8c9d0",
    "name": "Devendra Verma",
    "email": "devendra.test@venseven.com",
    "role": "customer",
    "phone": "9876543210"
  }
}
```

---

### Step 3: Customer Login

Authenticate an existing customer and obtain a fresh JWT token.

* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/auth/login`
* **Headers:** `Content-Type: application/json`
* **Body (raw JSON):**
```json
{
  "email": "devendra.test@venseven.com",
  "password": "Password123!"
}
```

#### Postman Test Script (Paste in Postman **Tests** tab):
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set("authToken", jsonData.token);
}
```

---

### Step 4: Verify Current User Profile

Verify session persistence using the JWT Bearer token.

* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/auth/me`
* **Headers:**
  * `Authorization: Bearer {{authToken}}`

#### Expected Response (`200 OK`):
```json
{
  "success": true,
  "user": {
    "id": "65e0a1b2c3d4e5f6a7b8c9d0",
    "name": "Devendra Verma",
    "email": "devendra.test@venseven.com",
    "role": "customer",
    "phone": "9876543210"
  }
}
```

---

### Step 5: Password Reset Request

Test the transactional email password recovery flow.

* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/auth/forgot-password`
* **Headers:** `Content-Type: application/json`
* **Body (raw JSON):**
```json
{
  "email": "devendra.test@venseven.com"
}
```

#### Expected Response (`200 OK`):
```json
{
  "success": true,
  "message": "If an account exists for this email, password reset instructions have been sent."
}
```

---

### Step 6: Browse Products Catalogue

Retrieve live catalogue products with category filtering, search, pagination, and sorting.

* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/products?category=Shirts&sort=price-asc&limit=10`
* **Headers:** *(None required)*

#### Postman Test Script (Paste in Postman **Tests** tab):
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    if (jsonData.products && jsonData.products.length > 0) {
        pm.environment.set("productId", jsonData.products[0].id || jsonData.products[0]._id);
        pm.environment.set("productSlug", jsonData.products[0].slug);
        console.log("Saved Product ID:", pm.environment.get("productId"));
        console.log("Saved Product Slug:", pm.environment.get("productSlug"));
    }
}
```

#### Expected Response (`200 OK`):
```json
{
  "success": true,
  "count": 4,
  "totalPages": 1,
  "currentPage": 1,
  "products": [
    {
      "id": "65e1f2a3b4c5d6e7f8a9b0c1",
      "name": "Classic Men’s Wine Formal Shirt",
      "slug": "classic-mens-wine-formal-shirt",
      "category": "Shirts",
      "price": 2799,
      "salePrice": null,
      "sizes": [
        { "size": "M", "stock": 10, "sku": "V7-SHIRT-WINE-M" },
        { "size": "L", "stock": 14, "sku": "V7-SHIRT-WINE-L" }
      ],
      "primaryImage": "https://res.cloudinary.com/cmb6xxhf/image/upload/v1/venseven/products/wine-shirt.jpg",
      "isActive": true
    }
  ]
}
```

---

### Step 7: Single Product Details by Slug

Fetch full details, size stock matrices, fabric details, and image gallery for a specific garment.

* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/products/{{productSlug}}`
* **Headers:** *(None required)*

#### Expected Response (`200 OK`):
```json
{
  "success": true,
  "product": {
    "name": "Classic Men’s Wine Formal Shirt",
    "slug": "classic-mens-wine-formal-shirt",
    "category": "Shirts",
    "price": 2799,
    "description": "Tailored luxury formal shirt crafted from breathable Egyptian cotton.",
    "fabric": "100% Giza Egyptian Cotton",
    "fit": "Tailored Slim Fit",
    "images": [
      {
        "url": "https://res.cloudinary.com/cmb6xxhf/image/upload/v1/venseven/products/wine-shirt.jpg",
        "alt": "Front view"
      }
    ]
  }
}
```

---

### Step 8: Personalized Product Recommendations

Retrieve matching recommendations based on category synergy and bestsellers.

* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/products/{{productSlug}}/recommendations`
* **Headers:** *(None required)*

---

### Step 9: Validate Promotional Coupon

Test server-side discount calculation and minimum order thresholds.

* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/coupons/validate`
* **Headers:** `Content-Type: application/json`
* **Body (raw JSON):**
```json
{
  "code": "WELCOME10",
  "cartItems": [
    {
      "productId": "{{productId}}",
      "quantity": 1
    }
  ]
}
```

#### Expected Response (`200 OK`):
```json
{
  "success": true,
  "message": "Coupon applied: 10% OFF",
  "coupon": {
    "code": "WELCOME10",
    "discountType": "percentage",
    "discountValue": 10
  },
  "pricing": {
    "subtotal": 2799,
    "discount": 280,
    "shipping": 0,
    "total": 2519
  }
}
```

---

### Step 10: Wishlist API Endpoints

#### 1. Add Product to Wishlist:
* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/wishlist/{{productId}}`
* **Headers:**
  * `Authorization: Bearer {{authToken}}`

#### 2. Fetch User Wishlist:
* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/wishlist`
* **Headers:**
  * `Authorization: Bearer {{authToken}}`

#### 3. Remove Product from Wishlist:
* **Method:** `DELETE`
* **URL:** `{{baseUrl}}/api/wishlist/{{productId}}`
* **Headers:**
  * `Authorization: Bearer {{authToken}}`

---

### Step 11: Create & Place Order

Submit customer delivery information and bag contents with verified coupon code.

* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/orders`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer {{authToken}}` *(Optional for Guest, Required for Authenticated)*
* **Body (raw JSON):**
```json
{
  "customer": {
    "name": "Devendra Verma",
    "email": "devendra.test@venseven.com",
    "phone": "9876543210"
  },
  "shippingAddress": {
    "address": "Road No 36, Jubilee Hills",
    "apartment": "Flat 402, Luxury Heights",
    "city": "Hyderabad",
    "state": "Telangana",
    "pincode": "500033",
    "country": "India"
  },
  "items": [
    {
      "productId": "{{productId}}",
      "name": "Classic Men’s Wine Formal Shirt",
      "size": "M",
      "quantity": 1
    }
  ],
  "couponCode": "WELCOME10",
  "paymentMethod": "RAZORPAY"
}
```

#### Postman Test Script (Paste in Postman **Tests** tab):
```javascript
if (pm.response.code === 201) {
    const jsonData = pm.response.json();
    pm.environment.set("orderNumber", jsonData.order.orderNumber);
    console.log("Saved Order Number:", pm.environment.get("orderNumber"));
}
```

#### Expected Response (`201 Created`):
```json
{
  "success": true,
  "message": "Order placed successfully.",
  "order": {
    "orderNumber": "V7-2026-489123",
    "customer": {
      "name": "Devendra Verma",
      "email": "devendra.test@venseven.com",
      "phone": "9876543210"
    },
    "pricing": {
      "subtotal": 2799,
      "discount": 280,
      "shipping": 0,
      "total": 2519
    },
    "coupon": {
      "code": "WELCOME10",
      "discountType": "percentage",
      "discountValue": 10,
      "discountAmount": 280
    },
    "orderStatus": "Confirmed"
  }
}
```

---

### Step 12: Customer Order History

Retrieve all past orders placed by the authenticated customer.

* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/orders/my-orders`
* **Headers:**
  * `Authorization: Bearer {{authToken}}`

---

### Step 13: View Order Details by Order Number

Retrieve full breakdown of a single order (useful for guest tracking or order confirmation screens).

* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/orders/{{orderNumber}}?email=devendra.test@venseven.com`
* **Headers:** *(None required for guest, or pass Bearer token)*

---

### Step 14: Razorpay — Create Payment Order

Generate a Razorpay Order ID for checkout.

* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/payments/create-order`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer {{authToken}}`
* **Body (raw JSON):**
```json
{
  "orderNumber": "{{orderNumber}}"
}
```

#### Expected Response (`200 OK`):
```json
{
  "success": true,
  "razorpayOrderId": "order_OD123456789abc",
  "amount": 251900,
  "currency": "INR",
  "keyId": "rzp_live_xxxxxxxxxxxxxx",
  "orderNumber": "V7-2026-489123"
}
```

---

### Step 15: Razorpay — Verify Cryptographic Signature

Simulate server verification of Razorpay's HMAC SHA-256 signature and confirm order payment.

* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/payments/verify`
* **Headers:** `Content-Type: application/json`
* **Body (raw JSON):**
```json
{
  "orderNumber": "{{orderNumber}}",
  "razorpay_order_id": "order_OD123456789abc",
  "razorpay_payment_id": "pay_PY123456789abc",
  "razorpay_signature": "cryptographic_hmac_signature_here"
}
```

---

## 4. Admin Management Endpoints

> [!IMPORTANT]
> To test Admin endpoints, register or choose an account, promote it to `admin` in MongoDB Atlas (or via `npm run promote-admin <email>`), log in, and copy the token to `{{adminToken}}`.

---

### Step 16: Admin Store KPIs & Dashboard Overview

* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/admin/dashboard`
* **Headers:**
  * `Authorization: Bearer {{adminToken}}`

#### Expected Response (`200 OK`):
```json
{
  "success": true,
  "stats": {
    "totalOrders": 24,
    "totalRevenue": 64800,
    "totalCustomers": 18,
    "paidOrders": 20,
    "pendingPayments": 4,
    "recentOrders": [ ... ]
  }
}
```

---

### Step 17: Admin Order Management

#### 1. List All Orders (with filters & search):
* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/admin/orders?page=1&limit=10&status=ALL`
* **Headers:**
  * `Authorization: Bearer {{adminToken}}`

#### 2. Update Order Fulfillment Status:
* **Method:** `PATCH`
* **URL:** `{{baseUrl}}/api/admin/orders/{{orderNumber}}/status`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer {{adminToken}}`
* **Body (raw JSON):**
```json
{
  "status": "Shipped"
}
```
*(Options: `Confirmed`, `Processing`, `Shipped`, `Delivered`, `Cancelled`)*

---

### Step 18: Admin Customer Management

#### 1. List Registered Customers:
* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/admin/customers?page=1&limit=10&search=devendra`
* **Headers:**
  * `Authorization: Bearer {{adminToken}}`

#### 2. Customer Profile with Lifetime Stats:
* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/admin/customers/65e0a1b2c3d4e5f6a7b8c9d0`
* **Headers:**
  * `Authorization: Bearer {{adminToken}}`

---

### Step 19: Admin Product CMS Management

#### 1. Create a New Luxury Piece:
* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/products`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer {{adminToken}}`
* **Body (raw JSON):**
```json
{
  "name": "Raw Silk Bandhgala Jacket",
  "slug": "raw-silk-bandhgala-jacket",
  "category": "Blazers",
  "subcategory": "Formal Jackets",
  "color": "Midnight Black",
  "colorHex": "#0A0A0A",
  "price": 8999,
  "sizes": [
    { "size": "38", "stock": 5, "sku": "V7-BLZ-RAW-38" },
    { "size": "40", "stock": 8, "sku": "V7-BLZ-RAW-40" }
  ],
  "primaryImage": "https://res.cloudinary.com/cmb6xxhf/image/upload/v1/venseven/products/blazer.jpg",
  "images": [
    {
      "url": "https://res.cloudinary.com/cmb6xxhf/image/upload/v1/venseven/products/blazer.jpg",
      "alt": "Bandhgala front view"
    }
  ],
  "description": "Structured raw silk formal jacket tailored with precision shoulder construction.",
  "fabric": "100% Handspun Raw Silk",
  "fit": "Tailored Fit",
  "isActive": true
}
```

#### 2. Update Product Inventory / Size Stock:
* **Method:** `PATCH`
* **URL:** `{{baseUrl}}/api/products/{{productId}}/stock`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer {{adminToken}}`
* **Body (raw JSON):**
```json
{
  "sizes": [
    { "size": "38", "stock": 10 },
    { "size": "40", "stock": 15 }
  ]
}
```

---

### Step 20: Admin Promotional Campaigns & Coupons

#### 1. Create Promotional Campaign:
* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/admin/coupons`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer {{adminToken}}`
* **Body (raw JSON):**
```json
{
  "code": "FESTIVE25",
  "description": "25% off festive menswear",
  "discountType": "percentage",
  "discountValue": 25,
  "minimumOrderAmount": 3500,
  "maximumDiscountAmount": 2000,
  "startDate": "2026-09-01",
  "expiryDate": "2026-10-31",
  "usageLimit": 100,
  "perUserLimit": 1,
  "applicableCategories": ["Shirts", "Blazers"],
  "isActive": true
}
```

#### 2. Toggle Coupon Status (Enable / Disable):
* **Method:** `PATCH`
* **URL:** `{{baseUrl}}/api/admin/coupons/{{couponId}}/status`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer {{adminToken}}`
* **Body (raw JSON):**
```json
{
  "isActive": false
}
```

---

## 5. Security & Edge Case Tests

Run these tests in Postman to confirm server-side defenses:

| Test Scenario | Method & URL | Headers / Payload | Expected Status |
|---|---|---|---|
| **Non-Admin User accessing Admin API** | `GET {{baseUrl}}/api/admin/dashboard` | `Authorization: Bearer {{authToken}}` | `403 Forbidden` |
| **Unauthenticated access to protected API** | `GET {{baseUrl}}/api/auth/me` | *(No header)* | `401 Unauthorized` |
| **Invalid Coupon Code** | `POST {{baseUrl}}/api/coupons/validate` | `{"code": "FAKECODE99", "cartItems": [...]}` | `400 Bad Request` |
| **Forged Price Tampering** | `POST {{baseUrl}}/api/orders` | Passing `{ "price": 1 }` in items | `201 Created` *(Server ignores client price and calculates true database price)* |
| **Non-existent API endpoint** | `GET {{baseUrl}}/api/unknown-route` | *(Any)* | `404 Not Found` |

---

## 6. Quick cURL Commands for Terminal Testing

### Health Check:
```bash
curl -i -X GET https://venseven-backend.onrender.com/api/health
```

### Browse Products:
```bash
curl -i -X GET "https://venseven-backend.onrender.com/api/products?limit=5"
```

### Customer Login:
```bash
curl -i -X POST https://venseven-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"devendra.test@venseven.com","password":"Password123!"}'
```

### Validate Coupon:
```bash
curl -i -X POST https://venseven-backend.onrender.com/api/coupons/validate \
  -H "Content-Type: application/json" \
  -d '{"code":"WELCOME10","cartItems":[{"productId":"65e1f2a3b4c5d6e7f8a9b0c1","quantity":1}]}'
```
