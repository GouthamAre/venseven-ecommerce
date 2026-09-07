const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { getJwtSecret, JWT_ALGORITHM } = require("../config/jwt");

/**
 * Admin authorization middleware.
 * Verifies JWT token and validates that the requesting user has role: "admin".
 */
async function adminMiddleware(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required. Please sign in as an administrator.",
      });
    }

    // Verify JWT with explicit algorithm
    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: [JWT_ALGORITHM] });

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authorization token.",
      });
    }

    // Retrieve user from MongoDB to verify live role (never trust client claims)
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found.",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access restricted. This area is reserved for VENSEVEN administration.",
      });
    }

    // Attach authenticated admin user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Authorization token is invalid or has expired.",
      });
    }

    console.error("[Admin Middleware Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authorization.",
    });
  }
}

module.exports = adminMiddleware;
