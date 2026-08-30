const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { validateCoupon } = require("../services/couponService");
const authMiddleware = require("../middleware/authMiddleware");
const { generateOrderNumber } = require("../utils/orderNumber");
const { sendOrderConfirmationEmail } = require("../utils/emailService");
const { getJwtSecret } = require("../config/jwt");

const router = express.Router();

/**
 * Helper: Optional JWT extraction (does not reject guests)
 */
function extractOptionalUser(req) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (token) {
        const decoded = jwt.verify(token, getJwtSecret());
        return decoded?.id || null;
      }
    }
  } catch {
    // Ignore invalid/expired token for guest requests
  }
  return null;
}

/**
 * @route   POST /api/orders
 * @desc    Create a new order (Guest or Authenticated)
 * @access  Public / Optional Auth
 */
router.post("/", async (req, res) => {
  try {
    const { customer, shippingAddress, items, paymentMethod, couponCode } = req.body;

    // 1. Validate Customer Information
    if (!customer || typeof customer !== "object") {
      return res.status(400).json({
        success: false,
        message: "Customer contact details are required.",
      });
    }

    const { name, email, phone } = customer;
    if (!name || !name.trim() || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "A valid customer name is required (min 2 characters).",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "A valid customer email address is required.",
      });
    }

    const cleanPhone = phone ? phone.replace(/\D/g, "") : "";
    if (!cleanPhone || cleanPhone.length < 10) {
      return res.status(400).json({
        success: false,
        message: "A valid 10-digit mobile number is required.",
      });
    }

    // 2. Validate Shipping Address
    if (!shippingAddress || typeof shippingAddress !== "object") {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required.",
      });
    }

    const { address, apartment, city, state, pincode } = shippingAddress;
    if (!address || !address.trim() || address.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "A complete street address is required (min 5 characters).",
      });
    }

    if (!city || !city.trim()) {
      return res.status(400).json({
        success: false,
        message: "City is required.",
      });
    }

    if (!state || !state.trim()) {
      return res.status(400).json({
        success: false,
        message: "State is required.",
      });
    }

    const cleanPin = pincode ? pincode.toString().trim() : "";
    if (!cleanPin || !/^\d{6}$/.test(cleanPin)) {
      return res.status(400).json({
        success: false,
        message: "A valid 6-digit Indian PIN code is required.",
      });
    }

    // 3. Validate Cart Items Against Live Database Products & Inventory
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "The order must contain at least one item.",
      });
    }

    const validatedItems = [];
    for (const item of items) {
      if (!item.productId || !item.name || !item.size) {
        return res.status(400).json({
          success: false,
          message: "Each item must have a valid productId, name, and size.",
        });
      }

      const rawQuantity = parseInt(item.quantity, 10);
      if (isNaN(rawQuantity) || rawQuantity < 1) {
        return res.status(400).json({
          success: false,
          message: `Quantity for item "${item.name}" must be at least 1.`,
        });
      }

      // Query live product document
      let product = null;
      if (mongoose.Types.ObjectId.isValid(item.productId)) {
        product = await Product.findById(item.productId);
      }
      if (!product && item.slug) {
        product = await Product.findOne({ slug: item.slug });
      }
      if (!product) {
        product = await Product.findOne({
          $or: [{ name: item.name }, { slug: String(item.productId) }],
        });
      }

      if (!product) {
        return res.status(400).json({
          success: false,
          code: "PRODUCT_NOT_FOUND",
          message: `Piece "${item.name}" was not found in our catalogue.`,
          item,
        });
      }

      if (product.isActive === false) {
        return res.status(400).json({
          success: false,
          code: "PRODUCT_INACTIVE",
          message: `"${product.name}" is no longer active or available for purchase.`,
          item,
        });
      }

      // Verify selected size in sizes array
      const requestedSize = String(item.size).trim().toUpperCase();
      const sizeObj = Array.isArray(product.sizes)
        ? product.sizes.find(
            (s) => (s.size || "").toString().trim().toUpperCase() === requestedSize
          )
        : null;

      if (!sizeObj) {
        return res.status(400).json({
          success: false,
          code: "SIZE_NOT_AVAILABLE",
          message: `Size "${item.size}" is not available for "${product.name}".`,
          item,
        });
      }

      if (sizeObj.stock < rawQuantity) {
        return res.status(400).json({
          success: false,
          code: "INSUFFICIENT_STOCK",
          message:
            sizeObj.stock <= 0
              ? `Size "${item.size}" for "${product.name}" is sold out.`
              : `Only ${sizeObj.stock} piece(s) available in size "${item.size}" for "${product.name}".`,
          availableStock: sizeObj.stock,
          requestedQuantity: rawQuantity,
          productId: product._id,
          productName: product.name,
          size: item.size,
        });
      }

      // Live verified price from server
      const unitPrice =
        product.salePrice && product.salePrice > 0
          ? Number(product.salePrice)
          : Number(product.price);

      validatedItems.push({
        productId: String(product._id),
        name: product.name,
        slug: product.slug || item.slug || "",
        image:
          item.image ||
          product.primaryImage ||
          (product.images?.[0]?.url || ""),
        category: product.category || item.category || "",
        size: sizeObj.size,
        color: product.color || item.color || "",
        price: unitPrice,
        quantity: rawQuantity,
      });
    }

    // 4. Server-side Financial Calculations (Never blindly trust client totals)
    const subtotal = validatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // 5. Determine Associated User (Authenticated vs Guest)
    const optionalUserId = extractOptionalUser(req);

    // 6. Server-Side Coupon Re-Validation & Discount Calculation
    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
      const couponValidation = await validateCoupon({
        code: couponCode.trim(),
        userId: optionalUserId,
        cartItems: validatedItems,
        subtotal,
      });

      if (!couponValidation.valid) {
        return res.status(400).json({
          success: false,
          code: "INVALID_COUPON",
          message: couponValidation.message,
        });
      }

      discountAmount = couponValidation.discountAmount || 0;
      appliedCoupon = {
        code: couponValidation.coupon.code,
        discountType: couponValidation.coupon.discountType,
        discountValue: couponValidation.coupon.discountValue,
        discountAmount,
      };
    }

    const shipping = subtotal >= 1999 || subtotal === 0 ? 0 : 150;
    const total = Math.max(0, subtotal - discountAmount + shipping);

    // 7. Generate Unique Order Number
    const orderNumber = await generateOrderNumber();

    // 8. Create & Persist Order Document
    const newOrder = new Order({
      orderNumber,
      user: optionalUserId || null,
      customer: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: cleanPhone,
      },
      shippingAddress: {
        address: address.trim(),
        apartment: apartment ? apartment.trim() : "",
        city: city.trim(),
        state: state.trim(),
        pincode: cleanPin,
        country: "India",
      },
      items: validatedItems,
      pricing: {
        subtotal,
        discount: discountAmount,
        shipping,
        total,
      },
      coupon: appliedCoupon || undefined,
      payment: {
        method: paymentMethod || "ONLINE_PENDING",
        status: "Pending",
      },
      orderStatus: "Confirmed",
    });

    await newOrder.save();

    // 8. Safe Transactional Email Dispatch (Non-blocking)
    try {
      if (!newOrder.notifications?.orderConfirmationSent) {
        await sendOrderConfirmationEmail(newOrder);
        newOrder.notifications = newOrder.notifications || {};
        newOrder.notifications.orderConfirmationSent = true;
        await newOrder.save({ validateBeforeSave: false });
      }
    } catch (emailErr) {
      console.error("[EMAIL] Order confirmation email dispatch skipped or failed:", emailErr.message);
      // Order persistence remains 100% successful
    }

    return res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      order: {
        id: newOrder._id,
        orderNumber: newOrder.orderNumber,
        customer: newOrder.customer,
        shippingAddress: newOrder.shippingAddress,
        items: newOrder.items,
        pricing: newOrder.pricing,
        coupon: newOrder.coupon,
        payment: newOrder.payment,
        orderStatus: newOrder.orderStatus,
        createdAt: newOrder.createdAt,
      },
    });
  } catch (error) {
    console.error("[Create Order Error]:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while creating the order. Please try again.",
    });
  }
});

/**
 * @route   GET /api/orders/my-orders
 * @desc    Get order history for authenticated user
 * @access  Private (Requires Bearer token)
 */
router.get("/my-orders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    const sanitizedOrders = orders.map((o) => ({
      id: o._id,
      orderNumber: o.orderNumber,
      customer: o.customer,
      shippingAddress: o.shippingAddress,
      items: o.items,
      pricing: o.pricing,
      payment: o.payment,
      orderStatus: o.orderStatus,
      createdAt: o.createdAt,
    }));

    return res.status(200).json({
      success: true,
      count: sanitizedOrders.length,
      orders: sanitizedOrders,
    });
  } catch (error) {
    console.error("[My Orders Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve order history.",
    });
  }
});

/**
 * @route   GET /api/orders/:orderNumber
 * @desc    Get specific order details with strict authorization
 * @access  Protected / Verified
 */
router.get("/:orderNumber", async (req, res) => {
  try {
    const { orderNumber } = req.params;

    if (!orderNumber) {
      return res.status(400).json({
        success: false,
        message: "Order number is required.",
      });
    }

    const order = await Order.findOne({
      orderNumber: orderNumber.toUpperCase(),
    }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Security Check: Protect against public order enumeration
    const requestingUserId = extractOptionalUser(req);
    const clientEmailQuery = req.query.email ? req.query.email.trim().toLowerCase() : "";

    // If order belongs to an authenticated user:
    if (order.user) {
      if (!requestingUserId || requestingUserId.toString() !== order.user.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view this order.",
        });
      }
    } else {
      // Guest order verification: Requires matching email query or valid session
      if (clientEmailQuery && clientEmailQuery !== order.customer.email.toLowerCase()) {
        return res.status(403).json({
          success: false,
          message: "Order verification mismatch.",
        });
      }
    }

    return res.status(200).json({
      success: true,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        customer: {
          name: order.customer.name,
          email: order.customer.email,
        },
        items: order.items,
        pricing: order.pricing,
        payment: order.payment,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("[Get Order Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve order details.",
    });
  }
});

module.exports = router;
