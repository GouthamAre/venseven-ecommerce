const express = require("express");
const crypto = require("crypto");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const { getRazorpayInstance, isRazorpayConfigured } = require("../config/razorpay");
const { sendPaymentSuccessEmail } = require("../utils/emailService");

const router = express.Router();

/**
 * @route   POST /api/payments/create-order
 * @desc    Create a Razorpay payment order for a validated VENSEVEN order
 * @access  Public (Guest or Authenticated)
 */
router.post("/create-order", async (req, res) => {
  try {
    const { orderNumber } = req.body;

    if (!orderNumber) {
      console.warn("[Payment]: create-order request rejected (missing orderNumber).");
      return res.status(400).json({
        success: false,
        message: "Order number is required to initialize payment.",
      });
    }

    console.log(`[Payment]: create-order endpoint reached for order: ${orderNumber}`);

    // 1. Retrieve the existing order from MongoDB
    const order = await Order.findOne({
      orderNumber: orderNumber.toUpperCase(),
    });

    if (!order) {
      console.warn(`[Payment]: Order "${orderNumber}" not found in database.`);
      return res.status(404).json({
        success: false,
        message: `Order "${orderNumber}" not found.`,
      });
    }

    // 2. Check if order is already paid
    if (order.payment && order.payment.status === "Paid") {
      console.warn(`[Payment]: Order ${order.orderNumber} is already marked Paid.`);
      return res.status(400).json({
        success: false,
        message: "This order has already been paid and confirmed.",
      });
    }

    // 3. Convert server-stored total INR to paise (1 INR = 100 Paise)
    // Never trust amount from client
    const amountInPaise = Math.round(Number(order.pricing.total) * 100);

    if (isNaN(amountInPaise) || amountInPaise <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order amount for payment creation.",
      });
    }

    console.log(
      `[Payment]: Order ${order.orderNumber} validated. Amount: ₹${order.pricing.total} (${amountInPaise} paise)`
    );

    const razorpay = getRazorpayInstance();

    if (!razorpay || !isRazorpayConfigured()) {
      console.error(
        `[Payment Error]: Razorpay credentials not configured (RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET missing).`
      );
      return res.status(500).json({
        success: false,
        message: "Razorpay payment gateway credentials are not configured on the server.",
      });
    }

    // 4. Create Razorpay Order
    let createdRazorpayOrder = null;
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: order.orderNumber,
      notes: {
        orderNumber: order.orderNumber,
        customerName: order.customer.name,
        customerEmail: order.customer.email,
      },
    };

    try {
      createdRazorpayOrder = await razorpay.orders.create(options);
      console.log(
        `[Payment]: Razorpay order created successfully. Razorpay Order ID: ${createdRazorpayOrder.id} for Order: ${order.orderNumber}`
      );
    } catch (apiErr) {
      const errorDescription =
        apiErr?.error?.description ||
        apiErr?.description ||
        apiErr?.message ||
        "Failed to initialize payment with Razorpay gateway.";
      console.error(
        `[Payment Error]: Razorpay API order creation failed for ${order.orderNumber}: ${errorDescription} (Status: ${apiErr.statusCode || 502})`
      );
      return res.status(apiErr.statusCode || 502).json({
        success: false,
        message:
          apiErr.statusCode === 401
            ? "Razorpay authentication failed. Please verify your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env."
            : errorDescription,
      });
    }

    // Save Razorpay Order ID to MongoDB order
    order.payment.razorpayOrderId = createdRazorpayOrder.id;
    order.payment.method = "RAZORPAY";
    await order.save();

    return res.status(200).json({
      success: true,
      razorpayOrderId: createdRazorpayOrder.id,
      amount: amountInPaise,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
      orderNumber: order.orderNumber,
      customer: {
        name: order.customer.name,
        email: order.customer.email,
        phone: order.customer.phone,
      },
    });
  } catch (error) {
    console.error("[Create Payment Order Error]:", error);
    return res.status(500).json({
      success: false,
      message: error.description || error.message || "Failed to create payment order.",
    });
  }
});

/**
 * @route   POST /api/payments/verify
 * @desc    Verify Razorpay payment signature and atomically deduct inventory
 * @access  Public (Guest or Authenticated)
 */
router.post("/verify", async (req, res) => {
  try {
    const {
      orderNumber,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!orderNumber || !razorpay_order_id || !razorpay_payment_id) {
      console.warn("[Payment]: verify request rejected (missing verification parameters).");
      return res.status(400).json({
        success: false,
        message: "Missing payment verification parameters.",
      });
    }

    console.log(
      `[Payment]: Verification request received for order: ${orderNumber}, Razorpay Order ID: ${razorpay_order_id}, Payment ID: ${razorpay_payment_id}`
    );

    // 1. Retrieve the existing order from MongoDB
    const order = await Order.findOne({
      orderNumber: orderNumber.toUpperCase(),
    });

    if (!order) {
      console.warn(`[Payment]: Verify order "${orderNumber}" not found.`);
      return res.status(404).json({
        success: false,
        message: `Order "${orderNumber}" not found.`,
      });
    }

    // 2. Idempotency Check: If already marked Paid and inventory already deducted, return success immediately
    if (order.payment && order.payment.status === "Paid" && order.inventoryDeducted === true) {
      console.log(`[Payment]: Order ${order.orderNumber} already marked Paid. Returning cached success.`);
      return res.status(200).json({
        success: true,
        message: "Payment already verified and confirmed.",
        order,
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      console.error(
        `[Payment Error]: RAZORPAY_KEY_SECRET is not configured on the server. Cannot verify payment.`
      );
      return res.status(500).json({
        success: false,
        message: "Payment gateway secret is not configured on the server.",
      });
    }

    // 3. Cryptographic Signature Verification
    if (!razorpay_signature) {
      console.warn(`[Payment Security Alert]: Missing signature for order ${order.orderNumber}.`);
      order.payment.status = "Failed";
      await order.save();
      return res.status(400).json({
        success: false,
        message: "Payment signature missing from verification request.",
      });
    }

    // Expected signature: HMAC-SHA256 of "razorpay_order_id|razorpay_payment_id"
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(payload)
      .digest("hex");

    const generatedBuffer = Buffer.from(generatedSignature, "utf8");
    const receivedBuffer = Buffer.from(razorpay_signature, "utf8");

    let isValidSignature = false;
    if (generatedBuffer.length === receivedBuffer.length) {
      isValidSignature = crypto.timingSafeEqual(
        generatedBuffer,
        receivedBuffer
      );
    }

    if (!isValidSignature) {
      console.warn(
        `[Payment Security Alert]: Invalid cryptographic signature for order ${order.orderNumber}.`
      );
      order.payment.status = "Failed";
      await order.save();
      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed.",
      });
    }

    console.log(
      `[Payment]: Signature verified successfully for order ${order.orderNumber}.`
    );

    // 4. Atomic Inventory Deduction with Anti-Overselling Guard & Rollback
    if (!order.inventoryDeducted) {
      const successfullyDeductedItems = [];
      let hasInventoryConflict = false;
      let conflictDetails = null;

      for (const item of order.items) {
        const qty = Number(item.quantity);
        const requestedSize = String(item.size).trim().toUpperCase();

        // Atomic conditional decrement: Only decrements if stock is >= requested quantity
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            sizes: {
              $elemMatch: {
                size: requestedSize,
                stock: { $gte: qty },
              },
            },
          },
          {
            $inc: {
              "sizes.$.stock": -qty,
              totalStock: -qty,
            },
          },
          { returnDocument: "after" }
        );

        if (updatedProduct) {
          successfullyDeductedItems.push({
            productId: item.productId,
            size: requestedSize,
            quantity: qty,
          });
        } else {
          // Stock was depleted or insufficient by concurrent purchase!
          hasInventoryConflict = true;
          conflictDetails = {
            productId: item.productId,
            name: item.name,
            size: item.size,
            requested: qty,
          };
          break;
        }
      }

      if (hasInventoryConflict) {
        // Rollback any items that were already deducted in this transaction
        for (const roll of successfullyDeductedItems) {
          await Product.findOneAndUpdate(
            {
              _id: roll.productId,
              "sizes.size": roll.size,
            },
            {
              $inc: {
                "sizes.$.stock": roll.quantity,
                totalStock: roll.quantity,
              },
            }
          );
        }

        order.payment.status = "Paid";
        order.payment.razorpayOrderId = razorpay_order_id;
        order.payment.razorpayPaymentId = razorpay_payment_id;
        order.payment.razorpaySignature = razorpay_signature || "dev_verified";
        order.payment.paidAt = new Date();
        order.inventoryDeducted = false;
        order.orderStatus = "Inventory Conflict";
        await order.save();

        console.error(
          `[INVENTORY CONFLICT]: Order ${order.orderNumber} received payment (${razorpay_payment_id}), but item "${conflictDetails.name}" (${conflictDetails.size}) was depleted before deduction.`
        );

        return res.status(409).json({
          success: false,
          code: "INVENTORY_CONFLICT",
          message: `Payment was processed, but inventory for "${conflictDetails.name}" (Size ${conflictDetails.size}) became unavailable before deduction. Our concierge team has flagged your order for priority review.`,
          order,
        });
      }

      order.inventoryDeducted = true;

      // 4b. Increment Coupon Usage Count upon First Verified Payment
      if (order.coupon && order.coupon.code) {
        try {
          await Coupon.updateOne(
            { code: order.coupon.code.toUpperCase() },
            { $inc: { usageCount: 1 } }
          );
        } catch (couponErr) {
          console.error("[Coupon Usage Increment Error]:", couponErr.message);
        }
      }
    }

    // 5. Mark Order as Paid and Confirmed
    order.payment.status = "Paid";
    order.payment.razorpayOrderId = razorpay_order_id;
    order.payment.razorpayPaymentId = razorpay_payment_id;
    order.payment.razorpaySignature = razorpay_signature || "dev_verified";
    order.payment.paidAt = new Date();
    order.orderStatus = "Confirmed";

    await order.save();

    // 6. Safe Transactional Payment Email Dispatch (Non-blocking & Deduplicated)
    try {
      if (!order.notifications?.paymentConfirmationSent) {
        await sendPaymentSuccessEmail(order, {
          razorpayPaymentId: razorpay_payment_id,
        });
        order.notifications = order.notifications || {};
        order.notifications.paymentConfirmationSent = true;
        await order.save({ validateBeforeSave: false });
      }
    } catch (emailErr) {
      console.error("[EMAIL] Payment success email dispatch skipped or failed:", emailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully. Your order is confirmed.",
      order,
    });
  } catch (error) {
    console.error("[Verify Payment Error]:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during payment verification. Please try again.",
    });
  }
});

/**
 * @route   GET /api/payments/webhook
 * @desc    Webhook health & status endpoint for browser and diagnostic checks
 * @access  Public
 */
router.get("/webhook", (req, res) => {
  const isConfigured = Boolean(process.env.RAZORPAY_WEBHOOK_SECRET);
  res.status(200).json({
    success: true,
    service: "VENSEVEN Razorpay Webhook Gateway",
    status: "active",
    message:
      "This endpoint is actively listening for cryptographic HTTP POST webhook events from Razorpay.",
    expectedMethod: "POST",
    webhookSecretConfigured: isConfigured,
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route   POST /api/payments/webhook
 * @desc    Listen for Razorpay server-to-server events (order.paid, payment.captured, payment.failed)
 * @access  Public (Cryptographically verified via X-Razorpay-Signature)
 */
router.post("/webhook", async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];

  if (!webhookSecret) {
    console.error("[Webhook Error]: RAZORPAY_WEBHOOK_SECRET is not configured in server environment.");
    return res.status(500).json({ status: "error", message: "Webhook secret not configured on server" });
  }

  // 1. Cryptographic Webhook Signature Verification
  const rawBody = req.rawBody
    ? req.rawBody
    : Buffer.from(typeof req.body === "string" ? req.body : JSON.stringify(req.body || {}));

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const receivedBuffer = Buffer.from(signature || "", "utf8");

  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    console.warn("[Webhook Alert]: Received webhook with invalid signature.");
    return res.status(400).json({ status: "invalid_signature", message: "Webhook signature verification failed" });
  }

  // 2. Parse Event Payload
  const eventPayload = req.body && typeof req.body === "object" ? req.body : JSON.parse(rawBody.toString("utf8"));
  const { event, payload } = eventPayload;
  console.log(`[Razorpay Webhook]: Verified incoming event "${event}"`);

  // 3. Process Events
  try {
    if (event === "order.paid" || event === "payment.captured") {
      const paymentEntity = payload?.payment?.entity;
      const orderEntity = payload?.order?.entity;

      const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
      const razorpayPaymentId = paymentEntity?.id;
      const receipt = orderEntity?.receipt || paymentEntity?.notes?.orderNumber;

      if (!razorpayOrderId && !receipt) {
        return res.status(200).json({ status: "ignored_no_identifier" });
      }

      // Query order by Razorpay Order ID or internal receipt
      const query = { $or: [] };
      if (razorpayOrderId) query.$or.push({ "payment.razorpayOrderId": razorpayOrderId });
      if (receipt) query.$or.push({ orderNumber: String(receipt).toUpperCase() });

      const order = await Order.findOne(query);

      if (!order) {
        console.warn(`[Webhook Warning]: No matching order found for Razorpay Order ${razorpayOrderId} / Receipt ${receipt}`);
        return res.status(200).json({ status: "order_not_found" });
      }

      // Idempotency check: If already paid and stock deducted, acknowledge immediately
      if (order.payment && order.payment.status === "Paid" && order.inventoryDeducted === true) {
        return res.status(200).json({ status: "already_processed", orderNumber: order.orderNumber });
      }

      // Atomic inventory deduction if not already deducted
      if (!order.inventoryDeducted) {
        const successfullyDeductedItems = [];
        let hasInventoryConflict = false;
        let conflictDetails = null;

        for (const item of order.items) {
          const qty = Number(item.quantity);
          const requestedSize = String(item.size).trim().toUpperCase();

          const updatedProduct = await Product.findOneAndUpdate(
            {
              _id: item.productId,
              sizes: {
                $elemMatch: {
                  size: requestedSize,
                  stock: { $gte: qty },
                },
              },
            },
            {
              $inc: {
                "sizes.$.stock": -qty,
                totalStock: -qty,
              },
            },
            { returnDocument: "after" }
          );

          if (updatedProduct) {
            successfullyDeductedItems.push({
              productId: item.productId,
              size: requestedSize,
              quantity: qty,
            });
          } else {
            hasInventoryConflict = true;
            conflictDetails = {
              productId: item.productId,
              name: item.name,
              size: item.size,
              requested: qty,
            };
            break;
          }
        }

        if (hasInventoryConflict) {
          // Rollback any items deducted in this transaction
          for (const roll of successfullyDeductedItems) {
            await Product.findOneAndUpdate(
              {
                _id: roll.productId,
                "sizes.size": roll.size,
              },
              {
                $inc: {
                  "sizes.$.stock": roll.quantity,
                  totalStock: roll.quantity,
                },
              }
            );
          }

          order.payment.status = "Paid";
          if (razorpayOrderId) order.payment.razorpayOrderId = razorpayOrderId;
          if (razorpayPaymentId) order.payment.razorpayPaymentId = razorpayPaymentId;
          order.payment.paidAt = new Date();
          order.inventoryDeducted = false;
          order.orderStatus = "Inventory Conflict";
          await order.save();

          console.error(
            `[INVENTORY CONFLICT (WEBHOOK)]: Order ${order.orderNumber} received payment (${razorpayPaymentId}), but item "${conflictDetails.name}" was depleted.`
          );

          return res.status(200).json({ status: "inventory_conflict", orderNumber: order.orderNumber });
        }

        order.inventoryDeducted = true;

        // Increment coupon usage count upon first verified payment
        if (order.coupon && order.coupon.code) {
          try {
            await Coupon.updateOne(
              { code: order.coupon.code.toUpperCase() },
              { $inc: { usageCount: 1 } }
            );
          } catch (couponErr) {
            console.error("[Webhook Coupon Increment Error]:", couponErr.message);
          }
        }
      }

      // Mark order as Paid and Confirmed
      order.payment.status = "Paid";
      if (razorpayOrderId) order.payment.razorpayOrderId = razorpayOrderId;
      if (razorpayPaymentId) order.payment.razorpayPaymentId = razorpayPaymentId;
      order.payment.paidAt = order.payment.paidAt || new Date();
      order.orderStatus = "Confirmed";

      await order.save();

      // Safe transactional payment email dispatch
      try {
        if (!order.notifications?.paymentConfirmationSent) {
          await sendPaymentSuccessEmail(order, {
            razorpayPaymentId: razorpayPaymentId || order.payment.razorpayPaymentId,
          });
          order.notifications = order.notifications || {};
          order.notifications.paymentConfirmationSent = true;
          await order.save({ validateBeforeSave: false });
        }
      } catch (emailErr) {
        console.error("[EMAIL WEBHOOK] Payment email dispatch skipped or failed:", emailErr.message);
      }

      return res.status(200).json({
        status: "success",
        message: "Order payment successfully reconciled via webhook.",
        orderNumber: order.orderNumber,
      });
    } else if (event === "payment.failed") {
      const paymentEntity = payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const receipt = paymentEntity?.notes?.orderNumber;

      const query = { $or: [] };
      if (razorpayOrderId) query.$or.push({ "payment.razorpayOrderId": razorpayOrderId });
      if (receipt) query.$or.push({ orderNumber: String(receipt).toUpperCase() });

      if (query.$or.length > 0) {
        const order = await Order.findOne(query);
        if (order && order.payment.status !== "Paid") {
          order.payment.status = "Failed";
          await order.save();
        }
      }

      return res.status(200).json({ status: "handled_payment_failed" });
    }

    // Acknowledge other unhandled Razorpay events with 200 OK
    return res.status(200).json({ status: "ignored_unhandled_event" });
  } catch (error) {
    console.error("[Razorpay Webhook Processing Error]:", error);
    return res.status(500).json({ status: "processing_error", message: error.message });
  }
});

module.exports = router;

