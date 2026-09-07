/**
 * VENSEVEN Production Rate Limiter Middleware
 *
 * Implements sliding-window rate limiting for authentication endpoints to prevent:
 * - Brute-force credential guessing
 * - SMS OTP flooding and financial exhaustion
 * - Account registration spam
 * - Password reset email flooding
 *
 * Sets standard HTTP headers: Retry-After, X-RateLimit-Limit, X-RateLimit-Remaining
 */

/**
 * Creates an in-memory rate limiting middleware
 *
 * @param {object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum number of requests allowed within window
 * @param {string} options.message - User-facing error message upon limit breach
 * @param {function} [options.keyGenerator] - Custom key generator function (req) => string
 * @param {boolean} [options.skipSuccessfulRequests] - If true, only failed requests count towards limit
 */
function createRateLimiter({
  windowMs = 60 * 1000,
  max = 10,
  message = "Too many requests. Please try again later.",
  keyGenerator,
  skipSuccessfulRequests = false,
}) {
  const store = new Map(); // key -> Array of timestamps [t1, t2, ...]

  // Periodic cleanup of expired records every 5 minutes to prevent memory leaks
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of store.entries()) {
      const valid = timestamps.filter((t) => now - t < windowMs);
      if (valid.length === 0) {
        store.delete(key);
      } else {
        store.set(key, valid);
      }
    }
  }, 5 * 60 * 1000);

  // Unref interval so it does not block Node process exit
  if (cleanupInterval.unref) cleanupInterval.unref();

  return function rateLimitMiddleware(req, res, next) {
    const now = Date.now();

    // Determine client IP taking proxies into account
    const rawIp =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      "127.0.0.1";

    const customKey = keyGenerator ? keyGenerator(req) : null;
    const key = customKey ? `${customKey}:${rawIp}` : rawIp;

    const timestamps = store.get(key) || [];
    const validTimestamps = timestamps.filter((t) => now - t < windowMs);

    if (validTimestamps.length >= max) {
      const oldestValid = validTimestamps[0];
      const retryAfterSec = Math.max(1, Math.ceil((oldestValid + windowMs - now) / 1000));

      res.setHeader("Retry-After", retryAfterSec);
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.setHeader("X-RateLimit-Reset", Math.ceil((oldestValid + windowMs) / 1000));

      return res.status(429).json({
        success: false,
        message,
        retryAfter: retryAfterSec,
      });
    }

    // If skipSuccessfulRequests is enabled, record timestamp only when response fails (status >= 400)
    if (skipSuccessfulRequests) {
      const originalEnd = res.end;
      res.end = function (...args) {
        if (res.statusCode >= 400) {
          validTimestamps.push(Date.now());
          store.set(key, validTimestamps);
        }
        return originalEnd.apply(this, args);
      };
    } else {
      validTimestamps.push(now);
      store.set(key, validTimestamps);
    }

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - validTimestamps.length));

    next();
  };

  rateLimitMiddleware.reset = function () {
    store.clear();
  };

  return rateLimitMiddleware;
}

// 1. Phone OTP Send Limiter (Max 3 OTP sends per phone/IP per 10 minutes)
const otpSendLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: "Too many OTP requests for this mobile number. Please wait before requesting another code.",
  keyGenerator: (req) => {
    const phone = req.body?.phone ? String(req.body.phone).replace(/\D/g, "").slice(-10) : "";
    return phone ? `otp_send_${phone}` : null;
  },
});

// 2. Phone OTP Verification Limiter (Max 5 attempts per phone per 10 minutes)
const otpVerifyLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: "Too many failed verification attempts. Please request a new verification code.",
  keyGenerator: (req) => {
    const phone = req.body?.phone ? String(req.body.phone).replace(/\D/g, "").slice(-10) : "";
    return phone ? `otp_verify_${phone}` : null;
  },
});

// 3. Password Login Limiter (Max 5 failed attempts per account/IP per 15 minutes)
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many failed sign-in attempts. For security, please try again in 15 minutes.",
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = req.body?.email ? String(req.body.email).trim().toLowerCase() : "";
    return email ? `login_${email}` : null;
  },
});

// 4. Registration Limiter (Max 5 account creations per IP per hour)
const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Account creation limit exceeded from this network. Please try again later.",
});

// 5. Password Reset Limiter (Max 3 requests per IP/email per hour)
const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: "Password recovery limit reached. Please check your inbox or try again in 1 hour.",
  keyGenerator: (req) => {
    const email = req.body?.email ? String(req.body.email).trim().toLowerCase() : "";
    return email ? `pwd_reset_${email}` : null;
  },
});

// 6. Google Auth Limiter (Max 10 requests per IP per 5 minutes)
const googleAuthLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: "Too many authentication requests. Please wait a moment and try again.",
});

function resetAllRateLimiters() {
  otpSendLimiter.reset();
  otpVerifyLimiter.reset();
  loginLimiter.reset();
  registerLimiter.reset();
  passwordResetLimiter.reset();
  googleAuthLimiter.reset();
}

module.exports = {
  createRateLimiter,
  resetAllRateLimiters,
  otpSendLimiter,
  otpVerifyLimiter,
  loginLimiter,
  authLimiter: loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  googleAuthLimiter,
  googleLimiter: googleAuthLimiter,
};

