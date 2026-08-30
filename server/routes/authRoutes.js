const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const { sendPasswordResetEmail } = require("../utils/emailService");
const { getJwtSecret, JWT_EXPIRES_IN } = require("../config/jwt");

const router = express.Router();
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

/**
 * Helper: Generate JSON Web Token
 */
function generateToken(userId) {
  return jwt.sign({ id: userId }, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

/**
 * @route   POST /api/auth/register
 * @desc    Register a new VENSEVEN client
 * @access  Public
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // 1. Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide your name, email address, and a password.",
      });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    // 2. Check for duplicate email
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email address already exists. Please sign in instead.",
      });
    }

    // 3. Create User
    const user = new User({
      name: trimmedName,
      email: trimmedEmail,
      password,
      phone: phone ? phone.trim() : "",
      role: "customer",
    });

    await user.save();

    // 4. Generate JWT
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[Register Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Server error occurred during registration. Please try again.",
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate client & retrieve token
 * @access  Public
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter your email and password.",
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // 1. Check user exists
    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email address or password.",
      });
    }

    // 2. Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email address or password.",
      });
    }

    // 3. Generate token
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Signed in successfully.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[Login Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Server error occurred during sign in. Please try again.",
    });
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Generate secure password reset token and email recovery link
 * @access  Public
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide your email address.",
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    const user = await User.findOne({ email: trimmedEmail });

    // Generic safe response to prevent user enumeration
    const genericSuccessMessage =
      "If an account exists for this email, password reset instructions have been sent.";

    if (!user) {
      return res.status(200).json({
        success: true,
        message: genericSuccessMessage,
      });
    }

    // 1. Generate single-use reset token and store SHA-256 hash in DB
    const rawToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 2. Build frontend reset URL
    const resetUrl = `${CLIENT_URL.replace(/\/$/, "")}/reset-password/${rawToken}`;

    // 3. Send email
    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
        expiresInMinutes: 30,
      });

      return res.status(200).json({
        success: true,
        message: genericSuccessMessage,
      });
    } catch (emailErr) {
      console.error("[Email Dispatch Error]:", emailErr);
      // Clean up token if email sending fails so un-delivered token is invalid
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: "Failed to dispatch password recovery email. Please try again later.",
      });
    }
  } catch (error) {
    console.error("[Forgot Password Error]:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while processing your request.",
    });
  }
});

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Validate reset token and update account password
 * @access  Public
 */
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Reset token is required.",
      });
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide both new password and confirmation password.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    // 1. Hash incoming raw token with SHA-256
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // 2. Find user with matching active token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "The password reset link is invalid or has expired. Please request a new one.",
      });
    }

    // 3. Set new password and invalidate token
    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save(); // pre-save hook securely bcrypt hashes user.password

    return res.status(200).json({
      success: true,
      message: "Your password has been successfully updated. You may now sign in.",
    });
  } catch (error) {
    console.error("[Reset Password Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Server error occurred while resetting password. Please try again.",
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user details
 * @access  Private (Requires Bearer token)
 */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
      },
    });
  } catch (error) {
    console.error("[Get Me Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve authenticated profile.",
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Client logout acknowledgment
 * @access  Public
 */
router.post("/logout", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});

module.exports = router;
