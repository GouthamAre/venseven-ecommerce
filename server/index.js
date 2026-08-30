require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const couponRoutes = require("./routes/couponRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/venseven";
const isProduction = process.env.NODE_ENV === "production";

// Disable fingerprinting header
app.disable("x-powered-by");

// Environment Validation & Startup Diagnostics
function validateEnvironment() {
  const missing = [];
  if (isProduction) {
    if (!process.env.MONGODB_URI) missing.push("MONGODB_URI");
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes("dev_key")) {
      missing.push("JWT_SECRET (must be a strong production secret)");
    }
  }

  if (missing.length > 0) {
    console.warn(`[Config Warning]: Missing recommended production variables: ${missing.join(", ")}`);
  }
}
validateEnvironment();

// Allowed origins for CORS (Local dev servers, configured CLIENT_URL, Vercel/Netlify preview domains)
const configuredClientUrls = (process.env.CLIENT_URL || "")
  .split(",")
  .map((url) => url.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  ...configuredClientUrls,
];

const corsOptions = {
  origin: function (origin, callback) {
    const cleanOrigin = origin ? origin.replace(/\/+$/, "") : "";
    // Allow non-browser requests (Postman, curl, server-to-server) or matching origins
    if (!origin || allowedOrigins.includes(cleanOrigin) || !isProduction) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS policy.`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
  exposedHeaders: ["Authorization"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  const stateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  const dbReadyState = mongoose.connection.readyState;
  const dbState = stateMap[dbReadyState] || "unknown";
  const isHealthy = dbReadyState === 1;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "healthy" : "degraded",
    service: "VENSEVEN API",
    database: dbState,
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/coupons", couponRoutes);

// 404 Catch-All Handler for Unknown API Endpoints
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' does not exist on VENSEVEN server.`,
  });
});

// Centralized Global Error Handling Middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  if (!isProduction) {
    console.error(`[Server Error]:`, err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
});

// Database connection
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log(`[Database]: Connected to MongoDB`);
  })
  .catch((err) => {
    console.warn(`[Database Warning]: MongoDB connection failed (${err.message}). Running in offline/disconnected state.`);
  });

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[VENSEVEN Server]: Running on http://localhost:${PORT}`);
  });
}

module.exports = app;
