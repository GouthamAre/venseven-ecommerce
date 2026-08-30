const nodemailer = require("nodemailer");

/**
 * Check if SMTP transport credentials are fully configured in the environment
 *
 * @returns {boolean}
 */
function isSMTPConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD
  );
}

/**
 * Creates Nodemailer transporter instance based on environment variables
 */
function createTransporter() {
  if (!isSMTPConfigured()) {
    return null;
  }

  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
  });
}

/**
 * Reusable dark luxury HTML email frame for VENSEVEN
 */
function createEmailLayout({ eyebrow, title, contentHtml, clientName }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || "VENSEVEN Notification"}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0a0a0a;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #ffffff;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #0a0a0a;
      padding: 32px 0;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #121212;
      border: 1px solid #222222;
      border-radius: 6px;
      overflow: hidden;
    }
    .header {
      padding: 32px 40px 20px;
      text-align: center;
      border-bottom: 1px solid #1e1e1e;
    }
    .logo {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 0.15em;
      color: #ffffff;
      text-transform: uppercase;
      text-decoration: none;
      display: inline-block;
    }
    .eyebrow {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.2em;
      color: #25b7ed;
      text-transform: uppercase;
      margin-top: 6px;
      display: block;
    }
    .content {
      padding: 32px 40px;
      line-height: 1.6;
    }
    .greeting {
      font-size: 15px;
      color: #ffffff;
      margin-bottom: 12px;
    }
    .heading {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #ffffff;
      margin: 0 0 16px;
      text-transform: uppercase;
    }
    .lead-text {
      font-size: 14px;
      color: #a0a0a0;
      margin: 0 0 24px;
      line-height: 1.7;
    }
    .card-box {
      background-color: #0d0d0d;
      border: 1px solid #1e1e1e;
      border-radius: 4px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .status-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      padding: 4px 10px;
      border-radius: 3px;
      text-transform: uppercase;
      background-color: #25b7ed;
      color: #000000;
      margin-bottom: 12px;
    }
    .status-badge.paid {
      background-color: #52c41a;
      color: #000000;
    }
    .status-badge.pending {
      background-color: #faad14;
      color: #000000;
    }
    .status-badge.cancelled {
      background-color: #ff4d4f;
      color: #ffffff;
    }
    .table-row {
      display: table;
      width: 100%;
      padding: 8px 0;
      border-bottom: 1px solid #1a1a1a;
      font-size: 13px;
    }
    .table-row:last-child {
      border-bottom: none;
    }
    .table-cell-left {
      display: table-cell;
      text-align: left;
      color: #cccccc;
    }
    .table-cell-right {
      display: table-cell;
      text-align: right;
      font-weight: 600;
      color: #ffffff;
    }
    .financial-total {
      font-size: 16px;
      font-weight: 700;
      color: #25b7ed;
      padding-top: 10px;
    }
    .divider {
      height: 1px;
      background-color: #1e1e1e;
      margin: 24px 0;
    }
    .button-container {
      text-align: center;
      margin: 28px 0 16px;
    }
    .btn {
      background-color: #25b7ed;
      color: #000000 !important;
      text-decoration: none;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.15em;
      padding: 12px 28px;
      border-radius: 4px;
      display: inline-block;
      text-transform: uppercase;
    }
    .footer {
      padding: 20px 40px;
      background-color: #0e0e0e;
      border-top: 1px solid #1a1a1a;
      text-align: center;
      font-size: 11px;
      color: #555555;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <table class="wrapper" role="presentation" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <div class="container">
          <div class="header">
            <span class="logo">VENSEVEN</span>
            <span class="eyebrow">${eyebrow || "STUDIO NOTICE"}</span>
          </div>

          <div class="content">
            <p class="greeting">Hello ${clientName || "Client"},</p>
            <h1 class="heading">${title}</h1>
            ${contentHtml}
          </div>

          <div class="footer">
            <p>© 2026 VENSEVEN Men's Fashion Studio. All rights reserved.</p>
            <p>Hyderabad Studio · Telangana, India</p>
            <p>Need assistance? Contact our client concierge.</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Generic internal dispatcher with development fallback
 */
async function dispatchEmail({ to, subject, text, html, logType, identifier }) {
  const from = process.env.EMAIL_FROM || "VENSEVEN Studio <noreply@venseven.com>";
  const transporter = createTransporter();

  if (!transporter) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[EMAIL DEV]: ${logType || "Notification"} simulated for <${to}> [${identifier || "N/A"}]: "${subject}"`);
      return { sent: true, isDevSimulated: true };
    }
    throw new Error("SMTP service is not configured on this server.");
  }

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });

  return { sent: true, messageId: info.messageId };
}

/**
 * 1. Send Password Reset Email
 */
async function sendPasswordResetEmail({ to, name, resetUrl, expiresInMinutes = 30 }) {
  const subject = "Reset Your VENSEVEN Password";
  const eyebrow = "ACCOUNT RECOVERY";
  const title = "RESET YOUR PASSWORD";

  const contentHtml = `
    <p class="lead-text">
      We received a request to reset the password for your VENSEVEN client account. Click below to establish a new secure password:
    </p>

    <div class="button-container">
      <a href="${resetUrl}" class="btn" target="_blank" rel="noopener noreferrer">
        RESET PASSWORD
      </a>
    </div>

    <p style="font-size: 12px; color: #777777; text-align: center; margin-bottom: 24px;">
      This single-use reset authorization link will expire in <strong>${expiresInMinutes} minutes</strong>.
    </p>

    <div class="divider"></div>

    <p style="font-size: 12px; color: #666666; margin: 0;">
      <strong>Security Notice:</strong> If you did not request this password reset, no further action is required. Your account credentials remain completely secure.
    </p>
  `;

  const text = `
VENSEVEN — ACCOUNT RECOVERY
Hello ${name || "Client"},

We received a request to reset the password for your VENSEVEN account.
Reset Link: ${resetUrl}
This link expires in ${expiresInMinutes} minutes.
If you did not request this, please ignore this email.
`.trim();

  const html = createEmailLayout({
    eyebrow,
    title,
    contentHtml,
    clientName: name,
  });

  return await dispatchEmail({
    to,
    subject,
    text,
    html,
    logType: "Password Reset",
    identifier: to,
  });
}

/**
 * 2. Send Order Confirmation Email
 */
async function sendOrderConfirmationEmail(order) {
  if (!order || !order.customer?.email) return { sent: false };

  const to = order.customer.email;
  const name = order.customer.name || "Client";
  const subject = `Order Confirmed: ${order.orderNumber} — VENSEVEN`;
  const eyebrow = "ORDER CONFIRMED";
  const title = "YOUR ORDER IS CONFIRMED";

  const itemsHtml = (order.items || [])
    .map(
      (item) => `
      <div class="table-row">
        <div class="table-cell-left">
          <strong>${item.name}</strong><br>
          <span style="font-size: 11px; color: #888888;">Size: ${item.size} × ${item.quantity}</span>
        </div>
        <div class="table-cell-right">
          ₹${(item.price * item.quantity).toLocaleString()}
        </div>
      </div>
    `
    )
    .join("");

  const addressSummary = `${order.shippingAddress?.address || ""}, ${
    order.shippingAddress?.city || ""
  }, ${order.shippingAddress?.state || ""} - ${
    order.shippingAddress?.pincode || ""
  }`;

  const contentHtml = `
    <p class="lead-text">
      Thank you for your acquisition. We have registered order <strong>${order.orderNumber}</strong> and our Hyderabad studio has initiated preparation.
    </p>

    <div class="card-box">
      <span class="status-badge ${order.payment?.status === "Paid" ? "paid" : "pending"}">
        PAYMENT: ${order.payment?.status || "PENDING"}
      </span>
      <div style="margin-bottom: 12px; font-size: 12px; color: #888888;">
        Order Number: <strong style="color: #ffffff;">${order.orderNumber}</strong><br>
        Date: <span style="color: #ffffff;">${new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
      </div>

      <div style="border-top: 1px solid #222222; padding-top: 8px;">
        ${itemsHtml}
      </div>

      <div class="divider" style="margin: 12px 0;"></div>

      <div class="table-row">
        <div class="table-cell-left">Subtotal</div>
        <div class="table-cell-right">₹${Number(order.pricing?.subtotal || 0).toLocaleString()}</div>
      </div>
      <div class="table-row">
        <div class="table-cell-left">Insured Shipping</div>
        <div class="table-cell-right">${order.pricing?.shipping === 0 ? "FREE" : `₹${order.pricing?.shipping}`}</div>
      </div>
      <div class="table-row">
        <div class="table-cell-left financial-total">TOTAL AMOUNT</div>
        <div class="table-cell-right financial-total">₹${Number(order.pricing?.total || 0).toLocaleString()}</div>
      </div>
    </div>

    <div class="card-box">
      <strong style="font-size: 12px; letter-spacing: 0.08em; color: #888888; text-transform: uppercase;">Delivery Address</strong>
      <p style="margin: 6px 0 0; font-size: 13px; color: #cccccc;">
        ${order.customer?.name}<br>
        ${addressSummary}<br>
        Mobile: ${order.customer?.phone || ""}
      </p>
    </div>
  `;

  const text = `
VENSEVEN — ORDER CONFIRMATION
Order Number: ${order.orderNumber}
Hello ${name},

Your VENSEVEN order has been confirmed.
Total: ₹${order.pricing?.total}
Delivery: ${addressSummary}

Thank you for choosing VENSEVEN.
`.trim();

  const html = createEmailLayout({
    eyebrow,
    title,
    contentHtml,
    clientName: name,
  });

  return await dispatchEmail({
    to,
    subject,
    text,
    html,
    logType: "Order Confirmation",
    identifier: order.orderNumber,
  });
}

/**
 * 3. Send Payment Success Email
 */
async function sendPaymentSuccessEmail(order, paymentDetails = {}) {
  if (!order || !order.customer?.email) return { sent: false };

  const to = order.customer.email;
  const name = order.customer.name || "Client";
  const subject = `Payment Received for Order ${order.orderNumber} — VENSEVEN`;
  const eyebrow = "PAYMENT VERIFIED";
  const title = "PAYMENT RECEIVED";

  const paymentId =
    paymentDetails.razorpayPaymentId ||
    order.payment?.razorpayPaymentId ||
    "Verified Transaction";

  const contentHtml = `
    <p class="lead-text">
      Payment of <strong>₹${Number(order.pricing?.total || 0).toLocaleString()}</strong> for order <strong>${order.orderNumber}</strong> has been successfully verified.
    </p>

    <div class="card-box">
      <span class="status-badge paid">
        STATUS: PAYMENT VERIFIED ✓
      </span>

      <div style="font-size: 13px; color: #cccccc; line-height: 1.8;">
        <strong>Order Reference:</strong> ${order.orderNumber}<br>
        <strong>Payment Reference:</strong> <span style="font-family: monospace; color: #25b7ed;">${paymentId}</span><br>
        <strong>Amount Paid:</strong> ₹${Number(order.pricing?.total || 0).toLocaleString()}<br>
        <strong>Fulfillment:</strong> Studio Preparation Underway
      </div>
    </div>

    <p style="font-size: 13px; color: #aaaaaa; margin: 0 0 16px;">
      Our tailoring studio is now packaging your pieces. You will receive a dispatch notification with live tracking as soon as your shipment departs.
    </p>
  `;

  const text = `
VENSEVEN — PAYMENT SUCCESSFUL
Order Number: ${order.orderNumber}
Payment ID: ${paymentId}
Amount: ₹${order.pricing?.total}

Payment received. Your order is now being prepared at our studio.
`.trim();

  const html = createEmailLayout({
    eyebrow,
    title,
    contentHtml,
    clientName: name,
  });

  return await dispatchEmail({
    to,
    subject,
    text,
    html,
    logType: "Payment Success",
    identifier: order.orderNumber,
  });
}

/**
 * 4. Send Order Status Update Email
 */
async function sendOrderStatusUpdateEmail(order, previousStatus, newStatus) {
  if (!order || !order.customer?.email || !newStatus) return { sent: false };

  const to = order.customer.email;
  const name = order.customer.name || "Client";
  const subject = `Order Update: ${order.orderNumber} is now ${newStatus} — VENSEVEN`;
  const eyebrow = "STATUS UPDATE";
  const title = `ORDER ${newStatus.toUpperCase()}`;

  const statusMessages = {
    Confirmed: "Your order has been confirmed and is awaiting studio processing.",
    Processing: "Our studio is preparing and quality-inspecting your garments.",
    Shipped: "Your VENSEVEN order is on its way. Insured express transit has initiated.",
    Delivered: "Your VENSEVEN package has been successfully delivered.",
    Cancelled: "Your VENSEVEN order reservation has been cancelled.",
  };

  const statusMsg =
    statusMessages[newStatus] ||
    `Your order status has been updated to "${newStatus}".`;

  const badgeClass =
    newStatus.toLowerCase() === "delivered"
      ? "paid"
      : newStatus.toLowerCase() === "cancelled"
      ? "cancelled"
      : "";

  const contentHtml = `
    <p class="lead-text">
      ${statusMsg}
    </p>

    <div class="card-box">
      <span class="status-badge ${badgeClass}">
        CURRENT STATUS: ${newStatus.toUpperCase()}
      </span>

      <div style="font-size: 13px; color: #cccccc; line-height: 1.8;">
        <strong>Order Reference:</strong> ${order.orderNumber}<br>
        <strong>Items Reserved:</strong> ${order.items?.length || 0} pieces<br>
        <strong>Order Total:</strong> ₹${Number(order.pricing?.total || 0).toLocaleString()}
      </div>
    </div>

    <p style="font-size: 13px; color: #888888; margin: 0;">
      If you have questions regarding this update, please reply directly or reach our Hyderabad studio team.
    </p>
  `;

  const text = `
VENSEVEN — ORDER UPDATE
Order Number: ${order.orderNumber}
New Status: ${newStatus}

${statusMsg}
Order Total: ₹${order.pricing?.total}
`.trim();

  const html = createEmailLayout({
    eyebrow,
    title,
    contentHtml,
    clientName: name,
  });

  return await dispatchEmail({
    to,
    subject,
    text,
    html,
    logType: `Status Update (${newStatus})`,
    identifier: order.orderNumber,
  });
}

module.exports = {
  isSMTPConfigured,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendPaymentSuccessEmail,
  sendOrderStatusUpdateEmail,
};
