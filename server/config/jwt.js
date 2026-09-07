/**
 * Centralized JWT Configuration & Cryptographic Validation Helper
 *
 * Enforces strong cryptographic keys and prevents algorithm confusion attacks.
 */

const JWT_ALGORITHM = "HS256";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === "production";

  if (!secret || !secret.trim()) {
    if (isProduction) {
      throw new Error(
        "FATAL CONFIGURATION ERROR: JWT_SECRET environment variable is required in production."
      );
    }
    return "venseven_jwt_secret_dev_key_2026_minimum_32_characters_for_hmac_sha256";
  }

  const cleanSecret = secret.trim();

  if (isProduction) {
    if (
      cleanSecret.length < 32 ||
      cleanSecret.includes("dev_key") ||
      cleanSecret.includes("secret") ||
      cleanSecret.includes("change_me")
    ) {
      throw new Error(
        "FATAL SECURITY ERROR: Insecure, weak, or development JWT_SECRET detected in production. Must be at least 32 cryptographically random characters."
      );
    }
  }

  return cleanSecret;
}

module.exports = {
  getJwtSecret,
  JWT_ALGORITHM,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
};
