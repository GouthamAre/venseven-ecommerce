const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Product = require("../models/Product");
const { validateCoupon } = require("../services/couponService");
const { getJwtSecret } = require("../config/jwt");

const router = express.Router();

/**
 * Helper to optionally extract authenticated user ID from Authorization header
 */
function extractOptionalUserId(req) {
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
    // Ignore invalid/expired token for guest validation requests
  }
  return null;
}

/**
 * @route   POST /api/coupons/validate
 * @desc    Validate a coupon code and calculate discounted pricing securely from MongoDB
 * @access  Public (Guest or Authenticated)
 */
router.post("/validate", async (req, res) => {
  try {
    const { code, cartItems } = req.body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid coupon code.",
      });
    }

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your bag must contain at least one piece to apply a coupon.",
      });
    }

    // 1. Re-validate cart items and prices against live database (Never trust frontend prices)
    const verifiedCartItems = [];
    let serverSubtotal = 0;

    for (const item of cartItems) {
      const pId = item.productId || item.id || item._id;
      if (!pId) continue;

      let product = null;
      if (mongoose.Types.ObjectId.isValid(pId)) {
        product = await Product.findById(pId);
      }
      if (!product && item.slug) {
        product = await Product.findOne({ slug: item.slug });
      }

      if (!product) {
        continue;
      }

      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const unitPrice =
        product.salePrice && product.salePrice > 0
          ? Number(product.salePrice)
          : Number(product.price);

      verifiedCartItems.push({
        productId: String(product._id),
        name: product.name,
        slug: product.slug,
        category: product.category,
        color: product.color,
        price: unitPrice,
        quantity: qty,
      });

      serverSubtotal += unitPrice * qty;
    }

    if (verifiedCartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid catalogue items found in your bag.",
      });
    }

    const userId = extractOptionalUserId(req);

    // 2. Validate Coupon via Validation Engine
    const validationResult = await validateCoupon({
      code,
      userId,
      cartItems: verifiedCartItems,
      subtotal: serverSubtotal,
    });

    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        message: validationResult.message,
      });
    }

    const discountAmount = validationResult.discountAmount || 0;
    const shipping = serverSubtotal >= 1999 ? 0 : 150;
    const finalTotal = Math.max(0, serverSubtotal - discountAmount + shipping);

    return res.status(200).json({
      success: true,
      message: validationResult.message,
      coupon: validationResult.coupon,
      pricing: {
        subtotal: serverSubtotal,
        discount: discountAmount,
        shipping,
        total: finalTotal,
      },
    });
  } catch (error) {
    console.error("[Validate Coupon Error]:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while validating the promotional code.",
    });
  }
});

module.exports = router;
