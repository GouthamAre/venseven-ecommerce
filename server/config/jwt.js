/**
 * Centralized JWT Configuration & Validation Helper
 *
 * Ensures secure cryptographic key management and prevents accidental
 * execution with weak or missing keys in production environments.
 */

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === "production";

  if (!secret || !secret.trim()) {
    if (isProduction) {
      throw new Error(
        "FATAL CONFIGURATION ERROR: JWT_SECRET environment variable is required in production."
      );
    }
    return "venseven_jwt_secret_dev_key_2026";
  }

  if (isProduction && secret.includes("dev_key")) {
    throw new Error(
      "FATAL SECURITY ERROR: Insecure development JWT_SECRET detected in production."
    );
  }

  return secret.trim();
}

module.exports = {
  getJwtSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
};
