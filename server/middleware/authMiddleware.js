const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { getJwtSecret, JWT_ALGORITHM } = require("../config/jwt");

/**
 * Authentication Middleware
 * Validates the JWT Bearer token from the request Authorization header.
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Malformed authorization token.",
      });
    }

    // Verify token with explicit algorithm
    let decoded;
    try {
      decoded = jwt.verify(token, getJwtSecret(), { algorithms: [JWT_ALGORITHM] });
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Session expired. Please sign in again.",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    // Find user by decoded ID
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account not found or no longer active.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("[Auth Middleware Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server authentication error.",
    });
  }
}

module.exports = authMiddleware;
