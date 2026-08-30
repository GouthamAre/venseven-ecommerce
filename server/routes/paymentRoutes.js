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
      return res.status(400).json({
        success: false,
        message: "Order number is required to initialize payment.",
      });
    }

    // 1. Retrieve the existing order from MongoDB
    const order = await Order.findOne({
      orderNumber: orderNumber.toUpperCase(),
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order "${orderNumber}" not found.`,
      });
    }

    // 2. Check if order is already paid
    if (order.payment && order.payment.status === "Paid") {
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

    const razorpay = getRazorpayInstance();

    // 4. Create Razorpay Order
    if (razorpay && isRazorpayConfigured()) {
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

      const razorpayOrder = await razorpay.orders.create(options);

      // Save Razorpay Order ID to MongoDB order
      order.payment.razorpayOrderId = razorpayOrder.id;
      order.payment.method = "RAZORPAY";
      await order.save();

      return res.status(200).json({
        success: true,
        razorpayOrderId: razorpayOrder.id,
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
    } else {
      // Fallback for development without API keys
      console.warn(
        `[Payment Warning]: Razorpay credentials not configured. Generating test-mode payment token for order ${order.orderNumber}.`
      );

      const devOrderId = `order_test_${Date.now()}`;
      order.payment.razorpayOrderId = devOrderId;
      order.payment.method = "RAZORPAY_DEV";
      await order.save();

      return res.status(200).json({
        success: true,
        razorpayOrderId: devOrderId,
        amount: amountInPaise,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
        orderNumber: order.orderNumber,
        isDevFallback: true,
        customer: {
          name: order.customer.name,
          email: order.customer.email,
          phone: order.customer.phone,
        },
      });
    }
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
      return res.status(400).json({
        success: false,
        message: "Missing payment verification parameters.",
      });
    }

    // 1. Retrieve the existing order from MongoDB
    const order = await Order.findOne({
      orderNumber: orderNumber.toUpperCase(),
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order "${orderNumber}" not found.`,
      });
    }

    // 2. Idempotency Check: If already marked Paid and inventory already deducted, return success immediately
    if (order.payment && order.payment.status === "Paid" && order.inventoryDeducted === true) {
      return res.status(200).json({
        success: true,
        message: "Payment already verified and confirmed.",
        order,
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // 3. Cryptographic Signature Verification
    if (keySecret) {
      if (!razorpay_signature) {
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
          `[Payment Security Alert]: Invalid signature for order ${order.orderNumber}.`
        );
        order.payment.status = "Failed";
        await order.save();
        return res.status(400).json({
          success: false,
          message: "Payment signature verification failed.",
        });
      }
    } else {
      // Dev mode fallback without secret key
      console.warn(
        `[Payment Dev Warning]: No RAZORPAY_KEY_SECRET found. Accepting verification for dev testing.`
      );
    }

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

module.exports = router;

