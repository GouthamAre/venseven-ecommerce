const mongoose = require("mongoose");

const sizeStockSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      required: [true, "Size label is required"],
      trim: true,
      uppercase: true,
    },
    stock: {
      type: Number,
      required: [true, "Stock count is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: "Stock must be an integer",
      },
    },
    sku: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const productImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
    },
    publicId: {
      type: String,
      trim: true,
      default: "",
    },
    alt: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Product name must be at least 2 characters"],
      maxlength: [160, "Product name cannot exceed 160 characters"],
    },
    slug: {
      type: String,
      required: [true, "Product slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    subcategory: {
      type: String,
      trim: true,
      default: "",
    },
    gender: {
      type: String,
      trim: true,
      default: "Men",
    },
    price: {
      type: Number,
      required: [true, "Original price is required"],
      min: [0, "Price cannot be negative"],
    },
    salePrice: {
      type: Number,
      min: [0, "Sale price cannot be negative"],
      default: null,
    },
    currency: {
      type: String,
      default: "INR",
    },
    images: {
      type: [productImageSchema],
      default: [],
      validate: {
        validator: function (v) {
          return !v || v.length <= 8;
        },
        message: "A product cannot have more than 8 images",
      },
    },
    primaryImage: {
      type: String,
      default: "",
      trim: true,
    },
    sizes: {
      type: [sizeStockSchema],
      default: [],
    },
    totalStock: {
      type: Number,
      default: 0,
      min: [0, "Total stock cannot be negative"],
    },
    color: {
      type: String,
      trim: true,
      default: "",
    },
    colorHex: {
      type: String,
      trim: true,
      default: "",
    },
    fabric: {
      type: String,
      trim: true,
      default: "",
    },
    fit: {
      type: String,
      trim: true,
      default: "",
    },
    details: {
      type: [String],
      default: [],
    },
    care: {
      type: String,
      trim: true,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
    },
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Helper to generate URL-safe slug from text
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word characters
    .replace(/[\s_-]+/g, "-") // Replace spaces/underscores with dashes
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing dashes
}

// Pre-save hook: auto-generate slug, compute totalStock, and ensure primaryImage
productSchema.pre("validate", function () {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  } else if (this.slug) {
    this.slug = slugify(this.slug);
  }

  // Calculate totalStock from sizes array
  if (Array.isArray(this.sizes)) {
    this.totalStock = this.sizes.reduce(
      (acc, s) => acc + (Number(s.stock) || 0),
      0
    );
  } else {
    this.totalStock = 0;
  }

  // Set default primaryImage if images exist but primaryImage is unset
  if (!this.primaryImage && Array.isArray(this.images) && this.images.length > 0) {
    this.primaryImage = this.images[0].url;
  }
});

// Safe JSON serialization
productSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  obj.id = obj._id;
  return obj;
};

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
