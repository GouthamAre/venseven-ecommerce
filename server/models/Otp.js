const mongoose = require("mongoose");
const crypto = require("crypto");

/**
 * Server-side salt for OTP hashing.
 * Prefers OTP_SECRET, falls back to JWT_SECRET or secure default.
 */
function getOtpSecret() {
  return process.env.OTP_SECRET || process.env.JWT_SECRET || "venseven_otp_hmac_secret_salt_2026";
}

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      index: true,
    },
    // Cryptographically hashed OTP (HMAC-SHA256) - Plaintext OTP is NEVER stored
    otpHash: {
      type: String,
      required: [true, "OTP hash is required"],
      trim: true,
    },
    attempts: {
      type: Number,
      default: 0,
      max: 5,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL auto-cleanup after expiration
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
otpSchema.index({ phone: 1, createdAt: -1 });

/**
 * Generate a cryptographically random 6-digit OTP
 * @returns {string} 6-digit numeric string (e.g. "492018")
 */
otpSchema.statics.generateSecureOtp = function () {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Compute HMAC-SHA256 hash of an OTP for a given phone
 * @param {string} phone - Normalized phone number
 * @param {string} otp - 6-digit numeric string
 * @returns {string} Hex-encoded HMAC hash
 */
otpSchema.statics.hashOtp = function (phone, otp) {
  const secret = getOtpSecret();
  return crypto
    .createHmac("sha256", secret)
    .update(`${phone}:${otp}`)
    .digest("hex");
};

/**
 * Timing-safe comparison of candidate OTP against stored HMAC hash
 * @param {string} phone - Normalized phone number
 * @param {string} candidateOtp - User-entered OTP
 * @param {string} storedHash - Stored HMAC hex hash
 * @returns {boolean} True if matched
 */
otpSchema.statics.verifyOtpCode = function (phone, candidateOtp, storedHash) {
  if (!candidateOtp || !storedHash) return false;
  const candidateHash = this.hashOtp(phone, candidateOtp.trim());

  try {
    const a = Buffer.from(candidateHash, "hex");
    const b = Buffer.from(storedHash, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
};

const Otp = mongoose.model("Otp", otpSchema);

module.exports = Otp;
