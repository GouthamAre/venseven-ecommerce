const mongoose = require("mongoose");
const Coupon = require("../models/Coupon");
const Order = require("../models/Order");

/**
 * Validates a coupon code against MongoDB rules, user usage history, and cart items
 *
 * @param {object} params
 * @param {string} params.code - Coupon code string
 * @param {string|mongoose.Types.ObjectId} [params.userId] - Optional authenticated user ID
 * @param {Array} params.cartItems - Array of validated cart item objects from MongoDB
 * @param {number} params.subtotal - Recalculated server subtotal
 * @returns {Promise<{ valid: boolean, message: string, coupon?: object, discountAmount?: number, eligibleSubtotal?: number }>}
 */
async function validateCoupon({ code, userId, cartItems, subtotal }) {
  if (!code || typeof code !== "string" || !code.trim()) {
    return {
      valid: false,
      message: "Please enter a valid coupon code.",
    };
  }

  const normalizedCode = code.trim().toUpperCase();

  // 1. Check if coupon exists in database
  const coupon = await Coupon.findOne({ code: normalizedCode });
  if (!coupon) {
    return {
      valid: false,
      message: `Coupon code "${normalizedCode}" is not recognized.`,
    };
  }

  // 2. Check active state
  if (!coupon.isActive) {
    return {
      valid: false,
      message: `Coupon "${normalizedCode}" is currently inactive.`,
    };
  }

  const now = new Date();

  // 3. Check start date
  if (coupon.startDate && new Date(coupon.startDate) > now) {
    return {
      valid: false,
      message: `Coupon "${normalizedCode}" is not active yet.`,
    };
  }

  // 4. Check expiry date
  if (coupon.expiryDate && new Date(coupon.expiryDate) < now) {
    return {
      valid: false,
      message: `Coupon "${normalizedCode}" expired on ${new Date(
        coupon.expiryDate
      ).toLocaleDateString("en-IN")}.`,
    };
  }

  // 5. Check global usage limit
  if (
    coupon.usageLimit !== null &&
    typeof coupon.usageLimit === "number" &&
    coupon.usageCount >= coupon.usageLimit
  ) {
    return {
      valid: false,
      message: `Coupon "${normalizedCode}" has reached its maximum global usage limit.`,
    };
  }

  // 6. Check per-user limit for authenticated users
  if (userId) {
    const userUsageCount = await Order.countDocuments({
      user: userId,
      "coupon.code": normalizedCode,
      "payment.status": { $ne: "Failed" },
      orderStatus: { $ne: "Cancelled" },
    });

    if (userUsageCount >= (coupon.perUserLimit || 1)) {
      return {
        valid: false,
        message: `You have already redeemed coupon "${normalizedCode}" the maximum number of allowed times.`,
      };
    }
  }

  // 7. Check minimum order amount
  const numericSubtotal = Number(subtotal) || 0;
  if (
    coupon.minimumOrderAmount &&
    coupon.minimumOrderAmount > 0 &&
    numericSubtotal < coupon.minimumOrderAmount
  ) {
    return {
      valid: false,
      message: `Order subtotal must be at least ₹${coupon.minimumOrderAmount.toLocaleString()} to apply coupon "${normalizedCode}".`,
    };
  }

  // 8. Calculate eligible subtotal based on product and category restrictions
  const applicableProdIds = new Set(
    (coupon.applicableProducts || []).map((p) => String(p))
  );
  const excludedProdIds = new Set(
    (coupon.excludedProducts || []).map((p) => String(p))
  );
  const applicableCategories = new Set(
    (coupon.applicableCategories || []).map((c) => String(c).trim().toLowerCase())
  );

  let eligibleSubtotal = 0;

  if (Array.isArray(cartItems) && cartItems.length > 0) {
    for (const item of cartItems) {
      const pId = String(item.productId || item.id || item._id || "");
      const cat = String(item.category || "").trim().toLowerCase();
      const itemPrice = Number(item.price) || 0;
      const itemQty = Number(item.quantity) || 1;

      // Exclude check
      if (excludedProdIds.has(pId)) {
        continue;
      }

      // Check applicable products restriction (if defined)
      if (applicableProdIds.size > 0 && !applicableProdIds.has(pId)) {
        continue;
      }

      // Check applicable categories restriction (if defined)
      if (applicableCategories.size > 0 && !applicableCategories.has(cat)) {
        continue;
      }

      eligibleSubtotal += itemPrice * itemQty;
    }
  } else {
    eligibleSubtotal = numericSubtotal;
  }

  if (eligibleSubtotal <= 0) {
    return {
      valid: false,
      message: `None of the garments in your bag qualify for coupon "${normalizedCode}".`,
    };
  }

  // 9. Calculate discount amount
  let calculatedDiscount = 0;
  if (coupon.discountType === "percentage") {
    calculatedDiscount = (eligibleSubtotal * coupon.discountValue) / 100;
    if (
      coupon.maximumDiscountAmount !== null &&
      coupon.maximumDiscountAmount > 0 &&
      calculatedDiscount > coupon.maximumDiscountAmount
    ) {
      calculatedDiscount = coupon.maximumDiscountAmount;
    }
  } else if (coupon.discountType === "fixed") {
    calculatedDiscount = Math.min(eligibleSubtotal, coupon.discountValue);
  }

  const finalDiscountAmount = Math.max(0, Math.round(calculatedDiscount));

  return {
    valid: true,
    message: `Coupon "${normalizedCode}" applied successfully.`,
    coupon: {
      id: coupon._id,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maximumDiscountAmount: coupon.maximumDiscountAmount,
      minimumOrderAmount: coupon.minimumOrderAmount,
    },
    eligibleSubtotal,
    discountAmount: finalDiscountAmount,
  };
}

module.exports = {
  validateCoupon,
};
