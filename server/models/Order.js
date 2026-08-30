const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: [true, "Product ID is required"],
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "",
    },
    size: {
      type: String,
      required: [true, "Size is required"],
      trim: true,
    },
    color: {
      type: String,
      trim: true,
      default: "",
    },
    price: {
      type: Number,
      required: [true, "Item price is required"],
      min: [0, "Price cannot be negative"],
    },
    quantity: {
      type: Number,
      required: [true, "Item quantity is required"],
      min: [1, "Quantity must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be an integer",
      },
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: [true, "Order number is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
      index: true,
    },
    customer: {
      name: {
        type: String,
        required: [true, "Customer name is required"],
        trim: true,
      },
      email: {
        type: String,
        required: [true, "Customer email is required"],
        lowercase: true,
        trim: true,
      },
      phone: {
        type: String,
        required: [true, "Customer phone number is required"],
        trim: true,
      },
    },
    shippingAddress: {
      address: {
        type: String,
        required: [true, "Street address is required"],
        trim: true,
      },
      apartment: {
        type: String,
        trim: true,
        default: "",
      },
      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
      },
      state: {
        type: String,
        required: [true, "State is required"],
        trim: true,
      },
      pincode: {
        type: String,
        required: [true, "PIN code is required"],
        trim: true,
      },
      country: {
        type: String,
        default: "India",
        trim: true,
      },
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: "Order must contain at least one item",
      },
    },
    pricing: {
      subtotal: {
        type: Number,
        required: true,
        min: [0, "Subtotal cannot be negative"],
      },
      discount: {
        type: Number,
        default: 0,
        min: [0, "Discount cannot be negative"],
      },
      shipping: {
        type: Number,
        required: true,
        min: [0, "Shipping fee cannot be negative"],
      },
      total: {
        type: Number,
        required: true,
        min: [0, "Total cannot be negative"],
      },
    },
    coupon: {
      code: {
        type: String,
        default: null,
        trim: true,
      },
      discountType: {
        type: String,
        default: null,
      },
      discountValue: {
        type: Number,
        default: null,
      },
      discountAmount: {
        type: Number,
        default: 0,
        min: [0, "Discount amount cannot be negative"],
      },
    },
    payment: {
      method: {
        type: String,
        default: "RAZORPAY",
      },
      status: {
        type: String,
        enum: ["Pending", "Paid", "Failed", "Refunded"],
        default: "Pending",
      },
      razorpayOrderId: {
        type: String,
        default: "",
        trim: true,
      },
      razorpayPaymentId: {
        type: String,
        default: "",
        trim: true,
      },
      razorpaySignature: {
        type: String,
        default: "",
        trim: true,
      },
      paidAt: {
        type: Date,
        default: null,
      },
    },
    inventoryDeducted: {
      type: Boolean,
      default: false,
    },
    inventoryRestored: {
      type: Boolean,
      default: false,
    },
    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Inventory Conflict",
      ],
      default: "Pending",
    },
    // Safe notification tracking to prevent duplicate emails
    notifications: {
      orderConfirmationSent: {
        type: Boolean,
        default: false,
      },
      paymentConfirmationSent: {
        type: Boolean,
        default: false,
      },
      lastStatusEmail: {
        type: String,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Safe JSON representation
orderSchema.methods.toJSON = function () {
  const orderObject = this.toObject();
  delete orderObject.__v;
  orderObject.id = orderObject._id;
  return orderObject;
};

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
