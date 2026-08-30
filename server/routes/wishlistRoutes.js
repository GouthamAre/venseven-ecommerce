const express = require("express");
const mongoose = require("mongoose");
const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Apply auth middleware to all wishlist endpoints
router.use(authMiddleware);

/**
 * Helper to format a populated product into a consistent wishlist item object
 */
function formatWishlistItem(entry) {
  if (!entry || !entry.product) {
    return null;
  }

  const p = entry.product;
  const isDeleted = !p.name;
  const isInactive = Boolean(!p.isActive);
  const totalStock = typeof p.totalStock === "number" ? p.totalStock : 0;
  const isSoldOut = totalStock <= 0;

  return {
    id: String(p._id),
    _id: String(p._id),
    productId: String(p._id),
    name: p.name || "Archived Piece",
    slug: p.slug || String(p._id),
    category: p.category || "",
    subcategory: p.subcategory || "",
    color: p.color || "",
    price: typeof p.price === "number" ? `₹${p.price.toLocaleString()}` : p.price || "₹0",
    numericPrice: typeof p.price === "number" ? p.price : 0,
    salePrice: p.salePrice ? `₹${Number(p.salePrice).toLocaleString()}` : null,
    numericSalePrice: p.salePrice ? Number(p.salePrice) : null,
    image: p.primaryImage || (p.images?.[0]?.url || ""),
    images: p.images || [],
    sizes: p.sizes?.map((s) => s.size) || [],
    sizeInventory: p.sizes || [],
    totalStock,
    isSoldOut,
    isActive: !isInactive && !isDeleted,
    isUnavailable: isInactive || isDeleted,
    addedAt: entry.addedAt || new Date(),
  };
}

/**
 * @route   GET /api/wishlist
 * @desc    Retrieve the authenticated user's wishlist
 * @access  Private (Authenticated Customer / Admin)
 */
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    let wishlist = await Wishlist.findOne({ user: userId }).populate({
      path: "products.product",
      select:
        "name slug price salePrice primaryImage images category subcategory color sizes totalStock isActive isNewArrival isBestSeller",
    });

    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, products: [] });
      await wishlist.save();
    }

    // Filter out null references if any product was completely removed from the DB
    const validItems = (wishlist.products || [])
      .map(formatWishlistItem)
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      count: validItems.length,
      wishlist: validItems,
    });
  } catch (error) {
    console.error("[Get Wishlist Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve wishlist.",
    });
  }
});

/**
 * @route   POST /api/wishlist/merge
 * @desc    Merge guest wishlist items into user's database wishlist upon login
 * @access  Private
 * NOTE: Defined before /:productId to prevent parameter capture of 'merge'
 */
router.post("/merge", async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { productIds } = req.body;

    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, products: [] });
    }

    if (Array.isArray(productIds) && productIds.length > 0) {
      const existingProductIds = new Set(
        wishlist.products.map((item) => String(item.product))
      );

      for (const pId of productIds) {
        if (!pId) continue;

        let product = null;
        if (mongoose.Types.ObjectId.isValid(pId)) {
          product = await Product.findById(pId);
        }
        if (!product) {
          product = await Product.findOne({ slug: pId });
        }

        if (product && !existingProductIds.has(String(product._id))) {
          wishlist.products.unshift({
            product: product._id,
            addedAt: new Date(),
          });
          existingProductIds.add(String(product._id));
        }
      }

      await wishlist.save();
    }

    const populated = await Wishlist.findById(wishlist._id).populate({
      path: "products.product",
      select:
        "name slug price salePrice primaryImage images category subcategory color sizes totalStock isActive",
    });

    const formatted = (populated.products || [])
      .map(formatWishlistItem)
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      message: "Wishlist synchronized successfully.",
      count: formatted.length,
      wishlist: formatted,
    });
  } catch (error) {
    console.error("[Merge Wishlist Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to synchronize guest wishlist.",
    });
  }
});

/**
 * @route   DELETE /api/wishlist
 * @desc    Clear all items in user's wishlist
 * @access  Private
 * NOTE: Defined before /:productId
 */
router.delete("/", async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    let wishlist = await Wishlist.findOne({ user: userId });
    if (wishlist) {
      wishlist.products = [];
      await wishlist.save();
    }

    return res.status(200).json({
      success: true,
      message: "Your wishlist has been cleared.",
      count: 0,
      wishlist: [],
    });
  } catch (error) {
    console.error("[Clear Wishlist Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to clear wishlist.",
    });
  }
});

/**
 * @route   POST /api/wishlist/:productId
 * @desc    Add a product to the user's wishlist
 * @access  Private
 */
router.post("/:productId", async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product identifier is required.",
      });
    }

    // Locate product by ObjectId or slug
    let product = null;
    if (mongoose.Types.ObjectId.isValid(productId)) {
      product = await Product.findById(productId);
    }
    if (!product) {
      product = await Product.findOne({ slug: productId });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found in studio catalogue.",
      });
    }

    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, products: [] });
    }

    // Check if product is already in wishlist
    const exists = wishlist.products.some(
      (item) => String(item.product) === String(product._id)
    );

    if (!exists) {
      wishlist.products.unshift({
        product: product._id,
        addedAt: new Date(),
      });
      await wishlist.save();
    }

    // Re-fetch populated wishlist
    const populated = await Wishlist.findById(wishlist._id).populate({
      path: "products.product",
      select:
        "name slug price salePrice primaryImage images category subcategory color sizes totalStock isActive",
    });

    const formatted = (populated.products || [])
      .map(formatWishlistItem)
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      message: exists
        ? "Product is already in your wishlist."
        : `"${product.name}" added to your wishlist.`,
      count: formatted.length,
      wishlist: formatted,
    });
  } catch (error) {
    console.error("[Add To Wishlist Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update wishlist.",
    });
  }
});

/**
 * @route   DELETE /api/wishlist/:productId
 * @desc    Remove a product from the user's wishlist
 * @access  Private
 */
router.delete("/:productId", async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product identifier is required.",
      });
    }

    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      return res.status(200).json({
        success: true,
        message: "Wishlist is empty.",
        count: 0,
        wishlist: [],
      });
    }

    // Check if matching by ObjectId or slug
    let targetId = productId;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      const prod = await Product.findOne({ slug: productId });
      if (prod) {
        targetId = String(prod._id);
      }
    }

    wishlist.products = wishlist.products.filter(
      (item) => String(item.product) !== String(targetId)
    );

    await wishlist.save();

    const populated = await Wishlist.findById(wishlist._id).populate({
      path: "products.product",
      select:
        "name slug price salePrice primaryImage images category subcategory color sizes totalStock isActive",
    });

    const formatted = (populated.products || [])
      .map(formatWishlistItem)
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      message: "Piece removed from your wishlist.",
      count: formatted.length,
      wishlist: formatted,
    });
  } catch (error) {
    console.error("[Remove From Wishlist Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove item from wishlist.",
    });
  }
});

module.exports = router;
