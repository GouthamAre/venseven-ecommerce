const express = require("express");
const adminMiddleware = require("../middleware/adminMiddleware");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const Coupon = require("../models/Coupon");
const { sendOrderStatusUpdateEmail } = require("../utils/emailService");

const router = express.Router();

// Apply adminMiddleware to all routes under /api/admin
router.use(adminMiddleware);

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get key performance indicators and recent orders
 * @access  Private (Admin only)
 */
router.get("/dashboard", async (req, res) => {
  try {
    const [totalOrders, paidOrders, pendingPayments, totalCustomers, revenueAgg, recentOrders] =
      await Promise.all([
        Order.countDocuments(),
        Order.countDocuments({ "payment.status": "Paid" }),
        Order.countDocuments({ "payment.status": { $ne: "Paid" } }),
        User.countDocuments({ role: "customer" }),
        Order.aggregate([
          { $match: { "payment.status": "Paid" } },
          { $group: { _id: null, totalRevenue: { $sum: "$pricing.total" } } },
        ]),
        Order.find()
          .sort({ createdAt: -1 })
          .limit(8)
          .select("orderNumber customer pricing payment orderStatus createdAt items")
          .lean(),
      ]);

    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue,
        totalCustomers,
        paidOrders,
        pendingPayments,
        recentOrders: recentOrders.map((o) => ({
          id: o._id,
          orderNumber: o.orderNumber,
          customer: o.customer,
          pricing: o.pricing,
          payment: o.payment,
          orderStatus: o.orderStatus,
          itemCount: o.items?.length || 0,
          createdAt: o.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("[Admin Dashboard Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve dashboard metrics.",
    });
  }
});

/**
 * @route   GET /api/admin/orders
 * @desc    Get paginated, filtered, and searchable orders
 * @access  Private (Admin only)
 */
router.get("/orders", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { status, paymentStatus, search } = req.query;
    const query = {};

    // Filter by Order Status
    if (status && status !== "ALL") {
      query.orderStatus = status;
    }

    // Filter by Payment Status
    if (paymentStatus && paymentStatus !== "ALL") {
      query["payment.status"] = paymentStatus;
    }

    // Search by Order Number, Customer Name, Email, or Phone
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { orderNumber: searchRegex },
        { "customer.name": searchRegex },
        { "customer.email": searchRegex },
        { "customer.phone": searchRegex },
      ];
    }

    const [totalMatching, rawOrders] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const orders = rawOrders.map((o) => ({
      id: o._id,
      orderNumber: o.orderNumber,
      customer: o.customer,
      shippingAddress: o.shippingAddress,
      pricing: o.pricing,
      payment: o.payment,
      orderStatus: o.orderStatus,
      items: o.items,
      createdAt: o.createdAt,
    }));

    return res.status(200).json({
      success: true,
      count: totalMatching,
      totalPages: Math.ceil(totalMatching / limit) || 1,
      currentPage: page,
      limit,
      orders,
    });
  } catch (error) {
    console.error("[Admin Orders Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve orders list.",
    });
  }
});

/**
 * @route   GET /api/admin/orders/:orderNumber
 * @desc    Get full order details for administrator
 * @access  Private (Admin only)
 */
router.get("/orders/:orderNumber", async (req, res) => {
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
    })
      .populate("user", "name email phone createdAt")
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order "${orderNumber}" not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        user: order.user || null,
        customer: order.customer,
        shippingAddress: order.shippingAddress,
        items: order.items,
        pricing: order.pricing,
        payment: order.payment,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    console.error("[Admin Order Detail Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve order details.",
    });
  }
});

/**
 * @route   PATCH /api/admin/orders/:orderNumber/status
 * @desc    Update order fulfillment status (does NOT alter payment status)
 * @access  Private (Admin only)
 */
router.patch("/orders/:orderNumber/status", async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { status } = req.body;

    const ALLOWED_STATUSES = [
      "Confirmed",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(", ")}`,
      });
    }

    const order = await Order.findOne({
      orderNumber: orderNumber.toUpperCase(),
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order "${orderNumber}" not found.`,
      });
    }

    const previousStatus = order.orderStatus;

    // Avoid duplicate processing if status is identical
    if (previousStatus === status) {
      return res.status(200).json({
        success: true,
        message: `Order ${order.orderNumber} is already "${status}".`,
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          orderStatus: order.orderStatus,
          payment: order.payment,
          updatedAt: order.updatedAt,
        },
      });
    }

    // If cancelling an order whose inventory was previously deducted, restore stock safely (idempotent)
    if (status === "Cancelled" && order.inventoryDeducted && !order.inventoryRestored) {
      for (const item of order.items) {
        const qty = Number(item.quantity);
        const sizeLabel = String(item.size).trim().toUpperCase();

        await Product.findOneAndUpdate(
          {
            _id: item.productId,
            "sizes.size": sizeLabel,
          },
          {
            $inc: {
              "sizes.$.stock": qty,
              totalStock: qty,
            },
          }
        );
      }
      order.inventoryRestored = true;
    }

    // Update order status strictly without modifying payment verification state
    order.orderStatus = status;
    await order.save();

    // Trigger customer notification email (Non-blocking & Deduplicated)
    try {
      if (order.notifications?.lastStatusEmail !== status) {
        await sendOrderStatusUpdateEmail(order, previousStatus, status);
        order.notifications = order.notifications || {};
        order.notifications.lastStatusEmail = status;
        await order.save({ validateBeforeSave: false });
      }
    } catch (emailErr) {
      console.error(
        "[EMAIL] Order status update notification skipped or failed for",
        order.orderNumber,
        ":",
        emailErr.message
      );
      // Status update in DB remains 100% successful
    }

    return res.status(200).json({
      success: true,
      message: `Order ${order.orderNumber} status updated to "${status}".`,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        payment: order.payment,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    console.error("[Admin Update Order Status Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update order status.",
    });
  }
});

/**
 * @route   GET /api/admin/customers
 * @desc    Get paginated, searchable customer list with lifetime metrics
 * @access  Private (Admin only)
 */
router.get("/customers", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const { search } = req.query;

    const query = { role: "customer" };

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
    }

    const [totalMatching, rawUsers] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // Aggregate lifetime spend and orders per customer
    const userIds = rawUsers.map((u) => u._id);
    const ordersAgg = await Order.aggregate([
      { $match: { user: { $in: userIds } } },
      {
        $group: {
          _id: "$user",
          totalOrders: { $sum: 1 },
          totalSpent: {
            $sum: {
              $cond: [{ $eq: ["$payment.status", "Paid"] }, "$pricing.total", 0],
            },
          },
        },
      },
    ]);

    const orderStatsMap = {};
    ordersAgg.forEach((agg) => {
      orderStatsMap[agg._id.toString()] = {
        totalOrders: agg.totalOrders || 0,
        totalSpent: agg.totalSpent || 0,
      };
    });

    const customers = rawUsers.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      createdAt: u.createdAt,
      totalOrders: orderStatsMap[u._id.toString()]?.totalOrders || 0,
      totalSpent: orderStatsMap[u._id.toString()]?.totalSpent || 0,
    }));

    return res.status(200).json({
      success: true,
      count: totalMatching,
      totalPages: Math.ceil(totalMatching / limit) || 1,
      currentPage: page,
      limit,
      customers,
    });
  } catch (error) {
    console.error("[Admin Customers Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve customers list.",
    });
  }
});

/**
 * @route   GET /api/admin/customers/:id
 * @desc    Get single customer profile and full order history
 * @access  Private (Admin only)
 */
router.get("/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password").lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    const orders = await Order.find({ user: user._id })
      .sort({ createdAt: -1 })
      .lean();

    const totalOrders = orders.length;
    const totalSpent = orders
      .filter((o) => o.payment?.status === "Paid")
      .reduce((sum, o) => sum + (o.pricing?.total || 0), 0);

    return res.status(200).json({
      success: true,
      customer: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        totalOrders,
        totalSpent,
        orders: orders.map((o) => ({
          id: o._id,
          orderNumber: o.orderNumber,
          items: o.items,
          pricing: o.pricing,
          payment: o.payment,
          orderStatus: o.orderStatus,
          createdAt: o.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("[Admin Customer Detail Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve customer details.",
    });
  }
});

/* ==========================================================================
   ADMIN COUPON & PROMOTIONS MANAGEMENT ENDPOINTS
   ========================================================================== */

/**
 * @route   GET /api/admin/coupons
 * @desc    Fetch all coupons with search, status filtering, and stats
 * @access  Private (Admin only)
 */
router.get("/coupons", async (req, res) => {
  try {
    const { search, filter, page = 1, limit = 50 } = req.query;

    const query = {};
    const now = new Date();

    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { code: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    if (filter === "ACTIVE") {
      query.isActive = true;
      query.expiryDate = { $gte: now };
    } else if (filter === "EXPIRED") {
      query.expiryDate = { $lt: now };
    } else if (filter === "DISABLED") {
      query.isActive = false;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [totalCoupons, activeCount, expiredCount, rawCoupons] = await Promise.all([
      Coupon.countDocuments(query),
      Coupon.countDocuments({ isActive: true, expiryDate: { $gte: now } }),
      Coupon.countDocuments({ expiryDate: { $lt: now } }),
      Coupon.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("applicableProducts", "name slug price primaryImage")
        .populate("excludedProducts", "name slug price primaryImage")
        .lean(),
    ]);

    const coupons = rawCoupons.map((c) => {
      const isExpired = new Date(c.expiryDate) < now;
      const isUsageExceeded = c.usageLimit !== null && c.usageCount >= c.usageLimit;
      return {
        id: c._id,
        _id: c._id,
        code: c.code,
        description: c.description,
        discountType: c.discountType,
        discountValue: c.discountValue,
        minimumOrderAmount: c.minimumOrderAmount,
        maximumDiscountAmount: c.maximumDiscountAmount,
        startDate: c.startDate,
        expiryDate: c.expiryDate,
        usageLimit: c.usageLimit,
        usageCount: c.usageCount,
        perUserLimit: c.perUserLimit,
        applicableProducts: c.applicableProducts || [],
        applicableCategories: c.applicableCategories || [],
        excludedProducts: c.excludedProducts || [],
        isActive: c.isActive,
        isExpired,
        isUsageExceeded,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      stats: {
        total: totalCoupons,
        active: activeCount,
        expired: expiredCount,
      },
      count: totalCoupons,
      currentPage: pageNum,
      totalPages: Math.ceil(totalCoupons / limitNum) || 1,
      coupons,
    });
  } catch (error) {
    console.error("[Admin Get Coupons Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve coupons list.",
    });
  }
});

/**
 * @route   GET /api/admin/coupons/:id
 * @desc    Fetch a single coupon by ID
 * @access  Private (Admin only)
 */
router.get("/coupons/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id)
      .populate("applicableProducts", "name slug price primaryImage")
      .populate("excludedProducts", "name slug price primaryImage")
      .lean();

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found.",
      });
    }

    return res.status(200).json({
      success: true,
      coupon: {
        ...coupon,
        id: coupon._id,
      },
    });
  } catch (error) {
    console.error("[Admin Get Coupon Detail Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve coupon details.",
    });
  }
});

/**
 * @route   POST /api/admin/coupons
 * @desc    Create a new promotional coupon
 * @access  Private (Admin only)
 */
router.post("/coupons", async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minimumOrderAmount,
      maximumDiscountAmount,
      startDate,
      expiryDate,
      usageLimit,
      perUserLimit,
      applicableCategories,
      applicableProducts,
      excludedProducts,
      isActive,
    } = req.body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required.",
      });
    }

    const normalizedCode = code.trim().toUpperCase();

    // Check unique code
    const existing = await Coupon.findOne({ code: normalizedCode });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Coupon code "${normalizedCode}" already exists.`,
      });
    }

    if (!discountType || !["percentage", "fixed"].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: "Discount type must be either 'percentage' or 'fixed'.",
      });
    }

    const numValue = Number(discountValue);
    if (isNaN(numValue) || numValue <= 0) {
      return res.status(400).json({
        success: false,
        message: "Discount value must be greater than 0.",
      });
    }

    if (discountType === "percentage" && (numValue < 1 || numValue > 100)) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount must be between 1 and 100.",
      });
    }

    if (!expiryDate) {
      return res.status(400).json({
        success: false,
        message: "Expiry date is required.",
      });
    }

    const parsedStart = startDate ? new Date(startDate) : new Date();
    const parsedExpiry = new Date(expiryDate);

    if (parsedExpiry <= parsedStart) {
      return res.status(400).json({
        success: false,
        message: "Expiry date must be after the start date.",
      });
    }

    const newCoupon = new Coupon({
      code: normalizedCode,
      description: description ? description.trim() : "",
      discountType,
      discountValue: numValue,
      minimumOrderAmount: Math.max(0, Number(minimumOrderAmount) || 0),
      maximumDiscountAmount: maximumDiscountAmount ? Math.max(0, Number(maximumDiscountAmount)) : null,
      startDate: parsedStart,
      expiryDate: parsedExpiry,
      usageLimit: usageLimit ? Math.max(1, parseInt(usageLimit, 10)) : null,
      perUserLimit: perUserLimit ? Math.max(1, parseInt(perUserLimit, 10)) : 1,
      applicableCategories: Array.isArray(applicableCategories)
        ? applicableCategories.map((c) => String(c).trim()).filter(Boolean)
        : [],
      applicableProducts: Array.isArray(applicableProducts) ? applicableProducts : [],
      excludedProducts: Array.isArray(excludedProducts) ? excludedProducts : [],
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdBy: req.user?._id || null,
    });

    await newCoupon.save();

    return res.status(201).json({
      success: true,
      message: `Coupon "${newCoupon.code}" created successfully.`,
      coupon: newCoupon,
    });
  } catch (error) {
    console.error("[Admin Create Coupon Error]:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create coupon.",
    });
  }
});

/**
 * @route   PATCH /api/admin/coupons/:id
 * @desc    Update an existing promotional coupon
 * @access  Private (Admin only)
 */
router.patch("/coupons/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found.",
      });
    }

    const {
      code,
      description,
      discountType,
      discountValue,
      minimumOrderAmount,
      maximumDiscountAmount,
      startDate,
      expiryDate,
      usageLimit,
      perUserLimit,
      applicableCategories,
      applicableProducts,
      excludedProducts,
      isActive,
    } = req.body;

    if (code && typeof code === "string") {
      const normalized = code.trim().toUpperCase();
      if (normalized !== coupon.code) {
        const existing = await Coupon.findOne({ code: normalized });
        if (existing) {
          return res.status(400).json({
            success: false,
            message: `Coupon code "${normalized}" is already in use.`,
          });
        }
        coupon.code = normalized;
      }
    }

    if (description !== undefined) coupon.description = String(description).trim();
    if (discountType && ["percentage", "fixed"].includes(discountType)) {
      coupon.discountType = discountType;
    }
    if (discountValue !== undefined) {
      const val = Number(discountValue);
      if (val > 0) coupon.discountValue = val;
    }
    if (minimumOrderAmount !== undefined) {
      coupon.minimumOrderAmount = Math.max(0, Number(minimumOrderAmount) || 0);
    }
    if (maximumDiscountAmount !== undefined) {
      coupon.maximumDiscountAmount = maximumDiscountAmount ? Math.max(0, Number(maximumDiscountAmount)) : null;
    }
    if (startDate) coupon.startDate = new Date(startDate);
    if (expiryDate) coupon.expiryDate = new Date(expiryDate);
    if (usageLimit !== undefined) {
      coupon.usageLimit = usageLimit ? Math.max(1, parseInt(usageLimit, 10)) : null;
    }
    if (perUserLimit !== undefined) {
      coupon.perUserLimit = Math.max(1, parseInt(perUserLimit, 10) || 1);
    }
    if (Array.isArray(applicableCategories)) {
      coupon.applicableCategories = applicableCategories.map((c) => String(c).trim()).filter(Boolean);
    }
    if (Array.isArray(applicableProducts)) {
      coupon.applicableProducts = applicableProducts;
    }
    if (Array.isArray(excludedProducts)) {
      coupon.excludedProducts = excludedProducts;
    }
    if (isActive !== undefined) {
      coupon.isActive = Boolean(isActive);
    }

    await coupon.save();

    return res.status(200).json({
      success: true,
      message: `Coupon "${coupon.code}" updated successfully.`,
      coupon,
    });
  } catch (error) {
    console.error("[Admin Update Coupon Error]:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update coupon.",
    });
  }
});

/**
 * @route   PATCH /api/admin/coupons/:id/status
 * @desc    Quick toggle active / inactive status
 * @access  Private (Admin only)
 */
router.patch("/coupons/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found.",
      });
    }

    coupon.isActive = typeof isActive === "boolean" ? isActive : !coupon.isActive;
    await coupon.save();

    return res.status(200).json({
      success: true,
      message: `Coupon "${coupon.code}" is now ${coupon.isActive ? "ACTIVE" : "DISABLED"}.`,
      isActive: coupon.isActive,
    });
  } catch (error) {
    console.error("[Admin Toggle Coupon Status Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update coupon status.",
    });
  }
});

/**
 * @route   DELETE /api/admin/coupons/:id
 * @desc    Permanently delete a coupon
 * @access  Private (Admin only)
 */
router.delete("/coupons/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Coupon "${coupon.code}" deleted successfully.`,
      id,
    });
  } catch (error) {
    console.error("[Admin Delete Coupon Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete coupon.",
    });
  }
});

module.exports = router;

