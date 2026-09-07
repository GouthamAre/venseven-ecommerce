const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Otp = require("../models/Otp");
const authMiddleware = require("../middleware/authMiddleware");
const { sendPasswordResetEmail } = require("../utils/emailService");
const { getJwtSecret, JWT_EXPIRES_IN } = require("../config/jwt");
const {
  otpSendLimiter,
  otpVerifyLimiter,
  authLimiter,
  registerLimiter,
  googleLimiter,
  passwordResetLimiter,
} = require("../middleware/rateLimiter");
const { sendOtpSms } = require("../services/smsService");
const { verifyGoogleIdToken } = require("../services/googleAuthService");

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
router.post("/register", registerLimiter, async (req, res) => {
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

    // 3. Create User - always force role: 'customer' to prevent privilege escalation
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
router.post("/login", authLimiter, async (req, res) => {
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
router.post("/forgot-password", passwordResetLimiter, async (req, res) => {
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
router.post("/reset-password/:token", passwordResetLimiter, async (req, res) => {
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
 * @route   POST /api/auth/otp/send
 * @desc    Generate and dispatch 6-digit OTP for phone login/signup
 * @access  Public
 */
router.post("/otp/send", otpSendLimiter, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Please enter your mobile phone number.",
      });
    }

    const digitsOnly = String(phone).replace(/\D/g, "");
    const normalizedPhone = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly;

    if (normalizedPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit mobile number.",
      });
    }

    // Per-phone cooldown: allow new OTP only after 30 seconds
    const recentOtp = await Otp.findOne({
      phone: normalizedPhone,
      createdAt: { $gt: new Date(Date.now() - 30 * 1000) },
    });
    if (recentOtp) {
      return res.status(429).json({
        success: false,
        message: "Please wait 30 seconds before requesting another verification code.",
      });
    }

    // Generate cryptographically secure 6-digit OTP
    const otpCode = Otp.generateSecureOtp();
    const otpHash = Otp.hashOtp(normalizedPhone, otpCode);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // Invalidate existing OTPs for this number
    await Otp.deleteMany({ phone: normalizedPhone });

    // Store HMAC-SHA256 hashed OTP
    await Otp.create({
      phone: normalizedPhone,
      otpHash,
      expiresAt,
    });

    // Dispatch via configured SMS provider
    const smsResult = await sendOtpSms(normalizedPhone, otpCode);

    if (!smsResult.success) {
      // In production, failure to dispatch SMS is a terminal delivery error
      if (process.env.NODE_ENV === "production") {
        return res.status(500).json({
          success: false,
          message: smsResult.message || "Failed to dispatch SMS verification code.",
        });
      }
    }

    const isProduction = process.env.NODE_ENV === "production";

    return res.status(200).json({
      success: true,
      message: `Verification code sent to +91 ${normalizedPhone}`,
      expiresIn: 300,
      provider: smsResult.provider,
      // Zero exposure in production: devOtp is strictly omitted in production environments
      devOtp: !isProduction ? otpCode : undefined,
    });
  } catch (error) {
    console.error("[OTP Send Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to dispatch verification code. Please try again.",
    });
  }
});

/**
 * @route   POST /api/auth/otp/verify
 * @desc    Verify phone OTP and authenticate/register client
 * @access  Public
 */
router.post("/otp/verify", otpVerifyLimiter, async (req, res) => {
  try {
    const { phone, otp, name } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and verification code are required.",
      });
    }

    const digitsOnly = String(phone).replace(/\D/g, "");
    const normalizedPhone = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly;
    const candidateOtp = String(otp).trim();

    const record = await Otp.findOne({
      phone: normalizedPhone,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired or was not requested. Please request a new code.",
      });
    }

    // Verify candidate OTP against HMAC-SHA256 stored hash
    const isValid = Otp.verifyOtpCode(normalizedPhone, candidateOtp, record.otpHash);

    if (!isValid) {
      record.attempts = (record.attempts || 0) + 1;
      if (record.attempts >= 5) {
        await Otp.deleteOne({ _id: record._id });
        return res.status(400).json({
          success: false,
          message: "Too many incorrect attempts. Please request a new code.",
        });
      }
      await record.save();
      return res.status(400).json({
        success: false,
        message: "Incorrect verification code. Please double check and try again.",
      });
    }

    // Single-use: delete verified OTP record immediately to prevent replay
    await Otp.deleteOne({ _id: record._id });

    // Check if user exists by phone
    let user = await User.findOne({ phone: normalizedPhone });

    if (!user) {
      // Auto-provision new customer account with customer role
      const generatedEmail = `user_${normalizedPhone}@venseven.in`;
      const existingByEmail = await User.findOne({ email: generatedEmail });

      if (existingByEmail) {
        user = existingByEmail;
        user.phone = normalizedPhone;
        await user.save();
      } else {
        const clientName = (name && name.trim()) || `Client ${normalizedPhone.slice(-4)}`;
        user = new User({
          name: clientName,
          email: generatedEmail,
          phone: normalizedPhone,
          authProvider: "phone",
          role: "customer",
        });
        await user.save();
      }
    }
    // Note: If user already exists (whether admin or customer), their role is preserved!

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Signed in successfully via phone verification.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        authProvider: user.authProvider,
      },
    });
  } catch (error) {
    console.error("[OTP Verify Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Server error occurred during verification. Please try again.",
    });
  }
});

/**
 * @route   POST /api/auth/google
 * @desc    Authenticate or register client using cryptographically verified Google ID token
 * @access  Public
 */
router.post("/google", googleLimiter, async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential || typeof credential !== "string") {
      return res.status(400).json({
        success: false,
        message: "Google ID token (credential) is required.",
      });
    }

    // Cryptographically verify ID token against Google's tokeninfo/certs
    const verification = await verifyGoogleIdToken(credential);

    if (!verification.verified && !verification.valid) {
      return res.status(401).json({
        success: false,
        message: verification.error || "Google credential could not be verified.",
      });
    }

    const payloadInfo = verification.payload || verification;
    const googleEmail = payloadInfo.email;
    const googleName = payloadInfo.name;
    const googleSub = payloadInfo.sub;
    const googlePicture = payloadInfo.picture;

    const cleanEmail = googleEmail.trim().toLowerCase();

    // Check if user exists by email or googleId
    let user = await User.findOne({
      $or: [{ email: cleanEmail }, ...(googleSub ? [{ googleId: googleSub }] : [])],
    });

    if (user) {
      let modified = false;
      if (googleSub && !user.googleId) {
        user.googleId = googleSub;
        modified = true;
      }
      if (googlePicture && !user.avatar) {
        user.avatar = googlePicture;
        modified = true;
      }
      if (modified) {
        await user.save();
      }
      // Note: Existing user's role (whether admin or customer) is preserved!
    } else {
      // Auto-provision new customer account - explicitly set role to "customer"
      user = new User({
        name: googleName || "VENSEVEN Member",
        email: cleanEmail,
        googleId: googleSub || null,
        authProvider: "google",
        avatar: googlePicture || "",
        role: "customer",
      });
      await user.save();
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Signed in successfully with Google.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        authProvider: user.authProvider,
      },
    });
  } catch (error) {
    console.error("[Google Auth Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Server error occurred during Google sign in. Please try again.",
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

// Non-production endpoint for automated security test isolation
if (process.env.NODE_ENV !== "production") {
  router.post("/test/reset-limits", (req, res) => {
    const { resetAllRateLimiters } = require("../middleware/rateLimiter");
    resetAllRateLimiters();
    return res.status(200).json({
      success: true,
      message: "Rate limiters reset for testing.",
    });
  });
}

module.exports = router;


