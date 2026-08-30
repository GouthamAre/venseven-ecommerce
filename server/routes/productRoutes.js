const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Order = require("../models/Order");
const adminMiddleware = require("../middleware/adminMiddleware");
const { uploadToCloudinary, deleteFromCloudinary } = require("../config/cloudinary");

const router = express.Router();

// Multer memory storage configuration for secure image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 6 * 1024 * 1024, // 6 MB max per image
    files: 8, // Max 8 files per upload request
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (JPEG, PNG, WEBP, AVIF) are allowed."), false);
    }
  },
});

// Helper to escape regex search queries
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

/* ==========================================================================
   PUBLIC PRODUCT ENDPOINTS
   ========================================================================== */

/**
 * @route   GET /api/products
 * @desc    Fetch active products with filtering, search, pagination, and sorting
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    const {
      category,
      subcategory,
      color,
      size,
      minPrice,
      maxPrice,
      search,
      filter,
      sort,
    } = req.query;

    const query = { isActive: true };

    // Category filter
    if (category && category.toLowerCase() !== "all") {
      query.category = { $regex: new RegExp(`^${escapeRegex(category.trim())}$`, "i") };
    }

    // Subcategory filter
    if (subcategory && subcategory.toLowerCase() !== "all") {
      query.subcategory = { $regex: new RegExp(`^${escapeRegex(subcategory.trim())}$`, "i") };
    }

    // Color filter
    if (color && color.toLowerCase() !== "all") {
      query.color = { $regex: new RegExp(`^${escapeRegex(color.trim())}$`, "i") };
    }

    // Size filter
    if (size && size.toLowerCase() !== "all") {
      query["sizes.size"] = { $regex: new RegExp(`^${escapeRegex(size.trim())}$`, "i") };
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined && !isNaN(Number(minPrice))) {
        query.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && !isNaN(Number(maxPrice))) {
        query.price.$lte = Number(maxPrice);
      }
    }

    // Special Filter: New Arrivals / Best Sellers
    if (filter === "new-arrivals") {
      query.isNewArrival = true;
    } else if (filter === "best-sellers") {
      query.isBestSeller = true;
    }

    // Global full-text search
    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(escapeRegex(q), "i");
      query.$or = [
        { name: regex },
        { category: regex },
        { subcategory: regex },
        { description: regex },
        { shortDescription: regex },
        { color: regex },
        { fabric: regex },
        { fit: regex },
        { tags: regex },
        { details: regex },
      ];
    }

    // Sorting
    let sortOption = { createdAt: -1 }; // default: newest
    if (sort === "price-asc") {
      sortOption = { price: 1 };
    } else if (sort === "price-desc") {
      sortOption = { price: -1 };
    } else if (sort === "featured") {
      sortOption = { isBestSeller: -1, isNewArrival: -1, createdAt: -1 };
    }

    const [totalMatching, rawProducts] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query).sort(sortOption).skip(skip).limit(limit).lean(),
    ]);

    const products = rawProducts.map((p) => ({
      id: p._id,
      _id: p._id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      shortDescription: p.shortDescription,
      category: p.category,
      subcategory: p.subcategory,
      gender: p.gender,
      price: `₹${p.price.toLocaleString()}`,
      numericPrice: p.price,
      salePrice: p.salePrice,
      numericSalePrice: p.salePrice,
      currency: p.currency,
      image: p.primaryImage || (p.images?.[0]?.url || ""),
      images: p.images,
      gallery: p.images?.map((img) => img.url) || [p.primaryImage],
      sizes: p.sizes?.map((s) => s.size) || [],
      sizeInventory: p.sizes || [],
      totalStock: p.totalStock,
      color: p.color,
      colorHex: p.colorHex,
      fabric: p.fabric,
      fit: p.fit,
      details: p.details || [],
      care: p.care || "",
      tags: p.tags || [],
      isNewArrival: Boolean(p.isNewArrival),
      isBestSeller: Boolean(p.isBestSeller),
      createdAt: p.createdAt,
    }));

    return res.status(200).json({
      success: true,
      count: totalMatching,
      totalPages: Math.ceil(totalMatching / limit) || 1,
      currentPage: page,
      limit,
      products,
    });
  } catch (error) {
    console.error("[Public Products Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve products catalogue.",
    });
  }
});

/**
 * @route   GET /api/products/:slug
 * @desc    Fetch single active product details by slug or ObjectId
 * @access  Public
 */
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Product identifier is required.",
      });
    }

    const query = {
      $or: [{ slug: slug.toLowerCase() }],
    };

    if (mongoose.Types.ObjectId.isValid(slug)) {
      query.$or.push({ _id: slug });
    }

    const p = await Product.findOne(query).lean();

    if (!p || (!p.isActive && req.query.adminPreview !== "true")) {
      return res.status(404).json({
        success: false,
        message: `Product "${slug}" not found or is currently unavailable.`,
      });
    }

    const product = {
      id: p._id,
      _id: p._id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      shortDescription: p.shortDescription,
      category: p.category,
      subcategory: p.subcategory,
      gender: p.gender,
      price: `₹${p.price.toLocaleString()}`,
      numericPrice: p.price,
      salePrice: p.salePrice,
      numericSalePrice: p.salePrice,
      currency: p.currency,
      image: p.primaryImage || (p.images?.[0]?.url || ""),
      images: p.images,
      gallery: p.images?.length > 0 ? p.images.map((img) => img.url) : [p.primaryImage],
      sizes: p.sizes?.map((s) => s.size) || [],
      sizeInventory: p.sizes || [],
      totalStock: p.totalStock,
      color: p.color,
      colorHex: p.colorHex,
      fabric: p.fabric,
      fit: p.fit,
      details: p.details || [],
      care: p.care || "",
      tags: p.tags || [],
      isNewArrival: Boolean(p.isNewArrival),
      isBestSeller: Boolean(p.isBestSeller),
      isActive: Boolean(p.isActive),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("[Get Product by Slug Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve product details.",
    });
  }
});

/**
 * @route   GET /api/products/:slug/recommendations
 * @desc    Get personalized product recommendations based on real metadata
 * @access  Public
 */
router.get("/:slug/recommendations", async (req, res) => {
  try {
    const { slug } = req.params;

    const query = {
      $or: [{ slug: slug.toLowerCase() }],
    };
    if (mongoose.Types.ObjectId.isValid(slug)) {
      query.$or.push({ _id: slug });
    }

    const baseProduct = await Product.findOne(query).lean();
    if (!baseProduct) {
      return res.status(404).json({
        success: false,
        message: "Base product not found for recommendation analysis.",
      });
    }

    // Fetch all other active products in catalogue
    const candidates = await Product.find({
      _id: { $ne: baseProduct._id },
      isActive: true,
    }).lean();

    if (candidates.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        recommendations: [],
      });
    }

    const baseTags = new Set(
      (baseProduct.tags || []).map((t) => String(t).trim().toLowerCase())
    );
    const baseCategory = (baseProduct.category || "").toLowerCase();
    const baseSubcategory = (baseProduct.subcategory || "").toLowerCase();
    const baseColor = (baseProduct.color || "").toLowerCase();
    const basePrice = Number(baseProduct.price) || 0;

    // Score each candidate product with explainable ranking weights
    const scoredCandidates = candidates.map((cand) => {
      let score = 0;
      const candCategory = (cand.category || "").toLowerCase();
      const candSubcategory = (cand.subcategory || "").toLowerCase();
      const candColor = (cand.color || "").toLowerCase();
      const candPrice = Number(cand.price) || 0;

      // 1. Same category weight (High relevance)
      if (candCategory && candCategory === baseCategory) {
        score += 10;
      }

      // 2. Same subcategory weight
      if (candSubcategory && candSubcategory === baseSubcategory) {
        score += 5;
      }

      // 3. Matching tags
      if (Array.isArray(cand.tags)) {
        for (const t of cand.tags) {
          if (baseTags.has(String(t).trim().toLowerCase())) {
            score += 3;
          }
        }
      }

      // 4. Color alignment
      if (candColor && candColor === baseColor) {
        score += 3;
      }

      // 5. Price proximity (within +/- 35% of base price)
      if (basePrice > 0) {
        const priceDiffRatio = Math.abs(candPrice - basePrice) / basePrice;
        if (priceDiffRatio <= 0.35) {
          score += 2;
        }
      }

      // 6. In-stock boost (prioritize purchasable pieces)
      if ((cand.totalStock || 0) > 0) {
        score += 4;
      }

      // 7. Popularity / Editorial boosts
      if (cand.isBestSeller) {
        score += 2;
      }
      if (cand.isNewArrival) {
        score += 1;
      }

      return {
        product: cand,
        score,
      };
    });

    // Sort by score descending and take top 4 to 8
    scoredCandidates.sort((a, b) => b.score - a.score);
    const topRecommendations = scoredCandidates.slice(0, 8).map(({ product: p }) => ({
      id: p._id,
      _id: p._id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      shortDescription: p.shortDescription,
      category: p.category,
      subcategory: p.subcategory,
      gender: p.gender,
      price: `₹${p.price.toLocaleString()}`,
      numericPrice: p.price,
      salePrice: p.salePrice ? `₹${Number(p.salePrice).toLocaleString()}` : null,
      numericSalePrice: p.salePrice,
      currency: p.currency,
      image: p.primaryImage || (p.images?.[0]?.url || ""),
      images: p.images || [],
      sizes: p.sizes?.map((s) => s.size) || [],
      sizeInventory: p.sizes || [],
      totalStock: p.totalStock,
      color: p.color,
      isNewArrival: Boolean(p.isNewArrival),
      isBestSeller: Boolean(p.isBestSeller),
      isActive: Boolean(p.isActive),
    }));

    return res.status(200).json({
      success: true,
      count: topRecommendations.length,
      recommendations: topRecommendations,
    });
  } catch (error) {
    console.error("[Recommendations Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to compute personalized recommendations.",
    });
  }
});

/* ==========================================================================
   ADMIN PROTECTED PRODUCT MANAGEMENT ENDPOINTS
   ========================================================================== */

/**
 * @route   GET /api/products/admin/all
 * @desc    Fetch all products for Admin table (including inactive, drafts, stock counts)
 * @access  Private (Admin only)
 */
router.get("/admin/all", adminMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { status, search, category } = req.query;
    const query = {};

    // Status filter
    if (status === "ACTIVE") {
      query.isActive = true;
    } else if (status === "INACTIVE" || status === "DRAFT") {
      query.isActive = false;
    } else if (status === "OUT_OF_STOCK") {
      query.totalStock = { $lte: 0 };
    } else if (status === "NEW_ARRIVALS") {
      query.isNewArrival = true;
    } else if (status === "BEST_SELLERS") {
      query.isBestSeller = true;
    }

    // Category filter
    if (category && category !== "ALL") {
      query.category = { $regex: new RegExp(`^${escapeRegex(category.trim())}$`, "i") };
    }

    // Search
    if (search && search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), "i");
      query.$or = [{ name: regex }, { slug: regex }, { category: regex }, { color: regex }];
    }

    const [totalMatching, rawProducts] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    return res.status(200).json({
      success: true,
      count: totalMatching,
      totalPages: Math.ceil(totalMatching / limit) || 1,
      currentPage: page,
      limit,
      products: rawProducts,
    });
  } catch (error) {
    console.error("[Admin All Products Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve admin product catalogue.",
    });
  }
});

/**
 * @route   GET /api/products/admin/:id
 * @desc    Fetch single product by ID for editing in Admin Form
 * @access  Private (Admin only)
 */
router.get("/admin/:id", adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format.",
      });
    }

    const product = await Product.findById(id).lean();
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("[Admin Get Product Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve product details.",
    });
  }
});

/**
 * @route   POST /api/products/upload
 * @desc    Upload product image(s) to Cloudinary
 * @access  Private (Admin only)
 */
router.post(
  "/upload",
  adminMiddleware,
  upload.array("images", 8),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please select at least one image file to upload.",
        });
      }

      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary(file.buffer)
      );

      const results = await Promise.all(uploadPromises);

      const uploadedImages = results.map((r, idx) => ({
        url: r.secure_url || r.url,
        publicId: r.public_id,
        alt: req.files[idx]?.originalname || "VENSEVEN Garment Preview",
      }));

      return res.status(200).json({
        success: true,
        message: `Successfully uploaded ${uploadedImages.length} image(s).`,
        images: uploadedImages,
      });
    } catch (error) {
      console.error("[Product Image Upload Error]:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to upload image to Cloudinary.",
      });
    }
  }
);

/**
 * @route   POST /api/products
 * @desc    Create a new product in the database
 * @access  Private (Admin only)
 */
router.post("/", adminMiddleware, async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      shortDescription,
      category,
      subcategory,
      gender,
      price,
      salePrice,
      currency,
      images,
      primaryImage,
      sizes,
      color,
      colorHex,
      fabric,
      fit,
      details,
      care,
      tags,
      isNewArrival,
      isBestSeller,
      isActive,
    } = req.body;

    // 1. Validation
    if (!name || !description || !category || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide product name, description, category, and price.",
      });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a valid non-negative number.",
      });
    }

    // 2. Slug collision check
    let targetSlug = (slug || name)
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-");

    const existingSlug = await Product.findOne({ slug: targetSlug });
    if (existingSlug) {
      targetSlug = `${targetSlug}-${Date.now().toString().slice(-4)}`;
    }

    // 3. Normalize sizes
    const formattedSizes = Array.isArray(sizes)
      ? sizes.map((s) => ({
          size: String(s.size || "").trim().toUpperCase(),
          stock: Math.max(0, parseInt(s.stock, 10) || 0),
          sku: String(s.sku || "").trim(),
        }))
      : [];

    const newProduct = new Product({
      name: name.trim(),
      slug: targetSlug,
      description: description.trim(),
      shortDescription: shortDescription ? shortDescription.trim() : "",
      category: category.trim(),
      subcategory: subcategory ? subcategory.trim() : "",
      gender: gender || "Men",
      price: numPrice,
      salePrice: salePrice !== undefined && salePrice !== null && salePrice !== "" ? Number(salePrice) : null,
      currency: currency || "INR",
      images: Array.isArray(images) ? images : [],
      primaryImage: primaryImage || (images?.[0]?.url || ""),
      sizes: formattedSizes,
      color: color ? color.trim() : "",
      colorHex: colorHex ? colorHex.trim() : "",
      fabric: fabric ? fabric.trim() : "",
      fit: fit ? fit.trim() : "",
      details: Array.isArray(details) ? details.map((d) => String(d).trim()) : [],
      care: care ? care.trim() : "",
      tags: Array.isArray(tags) ? tags.map((t) => String(t).trim()) : [],
      isNewArrival: Boolean(isNewArrival),
      isBestSeller: Boolean(isBestSeller),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    await newProduct.save();

    return res.status(201).json({
      success: true,
      message: `Product "${newProduct.name}" created successfully.`,
      product: newProduct,
    });
  } catch (error) {
    console.error("[Create Product Error]:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create product.",
    });
  }
});

/**
 * @route   PATCH /api/products/:id
 * @desc    Update existing product details
 * @access  Private (Admin only)
 */
router.patch("/:id", adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format.",
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const fieldsToUpdate = [
      "name",
      "slug",
      "description",
      "shortDescription",
      "category",
      "subcategory",
      "gender",
      "price",
      "salePrice",
      "currency",
      "images",
      "primaryImage",
      "sizes",
      "color",
      "colorHex",
      "fabric",
      "fit",
      "details",
      "care",
      "tags",
      "isNewArrival",
      "isBestSeller",
      "isActive",
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "price" || field === "salePrice") {
          product[field] = req.body[field] !== null && req.body[field] !== "" ? Number(req.body[field]) : null;
        } else if (field === "sizes" && Array.isArray(req.body.sizes)) {
          product.sizes = req.body.sizes.map((s) => ({
            size: String(s.size || "").trim().toUpperCase(),
            stock: Math.max(0, parseInt(s.stock, 10) || 0),
            sku: String(s.sku || "").trim(),
          }));
        } else {
          product[field] = req.body[field];
        }
      }
    });

    await product.save();

    return res.status(200).json({
      success: true,
      message: `Product "${product.name}" updated successfully.`,
      product,
    });
  } catch (error) {
    console.error("[Update Product Error]:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update product.",
    });
  }
});

/**
 * @route   PATCH /api/products/:id/stock
 * @desc    Quick update of inventory counts per size
 * @access  Private (Admin only)
 */
router.patch("/:id/stock", adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { sizes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format.",
      });
    }

    if (!Array.isArray(sizes)) {
      return res.status(400).json({
        success: false,
        message: "Sizes array is required for stock updates.",
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    product.sizes = sizes.map((s) => ({
      size: String(s.size || "").trim().toUpperCase(),
      stock: Math.max(0, parseInt(s.stock, 10) || 0),
      sku: String(s.sku || "").trim(),
    }));

    await product.save();

    return res.status(200).json({
      success: true,
      message: `Stock updated for "${product.name}". Total available: ${product.totalStock} units.`,
      totalStock: product.totalStock,
      sizes: product.sizes,
    });
  } catch (error) {
    console.error("[Update Stock Error]:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update stock.",
    });
  }
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Safely delete or archive product (checks past orders before permanent deletion)
 * @access  Private (Admin only)
 */
router.delete("/:id", adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format.",
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // Check if product is referenced in customer orders
    const existsInOrders = await Order.findOne({
      $or: [
        { "items.productId": String(id) },
        { "items.productId": String(product._id) },
        { "items.slug": product.slug },
      ],
    });

    if (existsInOrders) {
      // Safe archival: do not break historical order records
      product.isActive = false;
      await product.save();

      return res.status(200).json({
        success: true,
        message: `Product "${product.name}" is referenced in past customer orders and has been safely archived (set to inactive) rather than permanently deleted.`,
        action: "ARCHIVED",
        product,
      });
    }

    // If never purchased, safe to delete permanently
    await Product.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `Product "${product.name}" permanently deleted from catalogue.`,
      action: "DELETED",
      deletedId: id,
    });
  } catch (error) {
    console.error("[Delete Product Error]:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete product.",
    });
  }
});

module.exports = router;
