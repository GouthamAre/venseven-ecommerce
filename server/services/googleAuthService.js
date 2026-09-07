/**
 * VENSEVEN Google Authentication Verification Service
 *
 * Verifies Google-issued ID tokens server-side using Google's public tokeninfo endpoint.
 * Validates issuer, audience, signature, expiration, and email_verified.
 *
 * CRITICAL SECURITY PRINCIPLE:
 * Never trusts arbitrary client-supplied profile objects. Only tokens validated
 * cryptographically by Google are accepted as authentication proof.
 */

const GOOGLE_ISSUERS = ["accounts.google.com", "https://accounts.google.com"];

/**
 * Verify Google ID Token server-side
 *
 * @param {string} idToken - Raw JWT issued by Google Identity Services
 * @returns {Promise<{
 *   verified: boolean,
 *   sub?: string,
 *   email?: string,
 *   name?: string,
 *   picture?: string,
 *   error?: string
 * }>}
 */
async function verifyGoogleIdToken(idToken) {
  if (!idToken || typeof idToken !== "string" || !idToken.trim()) {
    return {
      verified: false,
      error: "Google ID token credential is required.",
    };
  }

  const cleanToken = idToken.trim();

  try {
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(cleanToken)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        verified: false,
        error: errorData.error_description || "Google ID token validation failed or token is invalid.",
      };
    }

    const payload = await response.json();

    // 1. Verify Issuer
    if (!payload.iss || !GOOGLE_ISSUERS.includes(payload.iss)) {
      return {
        verified: false,
        error: "Google ID token issuer is invalid.",
      };
    }

    // 2. Verify Expiration
    const expSeconds = parseInt(payload.exp, 10);
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (isNaN(expSeconds) || expSeconds < nowSeconds) {
      return {
        verified: false,
        error: "Google ID token has expired. Please sign in again.",
      };
    }

    // 3. Verify Audience against GOOGLE_CLIENT_ID if configured
    const configuredClientId = process.env.GOOGLE_CLIENT_ID;
    if (configuredClientId) {
      if (payload.aud !== configuredClientId) {
        return {
          verified: false,
          error: "Google ID token audience mismatch. Untrusted client application.",
        };
      }
    }

    // 4. Verify Email & Email Verification Flag
    if (!payload.email || typeof payload.email !== "string") {
      return {
        verified: false,
        error: "Google ID token did not include a valid email address.",
      };
    }

    const isEmailVerified =
      payload.email_verified === true ||
      payload.email_verified === "true";

    if (!isEmailVerified) {
      return {
        verified: false,
        error: "Google account email address is not verified.",
      };
    }

    if (!payload.sub || typeof payload.sub !== "string") {
      return {
        verified: false,
        valid: false,
        error: "Google ID token did not include a valid subject identifier.",
      };
    }

    const cleanEmail = payload.email.trim().toLowerCase();
    const cleanName = payload.name ? payload.name.trim() : "VENSEVEN Member";
    const picture = payload.picture || "";

    return {
      verified: true,
      valid: true,
      sub: payload.sub,
      email: cleanEmail,
      name: cleanName,
      picture,
      payload: {
        sub: payload.sub,
        email: cleanEmail,
        name: cleanName,
        picture,
      },
    };
  } catch (err) {
    console.error("[Google Token Verification Error]:", err.message);
    return {
      verified: false,
      valid: false,
      error: "Unable to verify Google credential with authentication authority.",
    };
  }
}

module.exports = {
  verifyGoogleIdToken,
};
