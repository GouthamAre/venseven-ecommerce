import { API_BASE_URL } from "./apiConfig";

/**
 * Helper to execute JSON requests to the VENSEVEN backend
 */
async function authFetch(endpoint, options = {}) {
  // Ensure endpoint starts with a slash
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({
    success: false,
    message: "Network response could not be parsed.",
  }));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Register a new VENSEVEN user
 *
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @param {string} [phone]
 * @returns {Promise<{ success: boolean, token: string, user: object }>}
 */
export async function registerUser(name, email, password, phone = "") {
  return await authFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, phone }),
  });
}

/**
 * Sign in an existing VENSEVEN client
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ success: boolean, token: string, user: object }>}
 */
export async function loginUser(email, password) {
  return await authFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Retrieve currently authenticated user profile
 *
 * @param {string} token
 * @returns {Promise<{ success: boolean, user: object }>}
 */
export async function getCurrentUser(token) {
  return await authFetch("/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Request password recovery email
 *
 * @param {string} email
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function forgotPassword(email) {
  return await authFetch("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

/**
 * Reset password using single-use authorization token
 *
 * @param {string} token - Raw reset token
 * @param {string} password - New password
 * @param {string} confirmPassword - New password confirmation
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function resetPassword(token, password, confirmPassword) {
  return await authFetch(`/auth/reset-password/${encodeURIComponent(token)}`, {
    method: "POST",
    body: JSON.stringify({ password, confirmPassword }),
  });
}

/**
 * Acknowledge client logout with backend
 *
 * @returns {Promise<{ success: boolean }>}
 */
export async function logoutUser() {
  try {
    return await authFetch("/auth/logout", {
      method: "POST",
    });
  } catch {
    // Graceful offline fallback
    return { success: true };
  }
}
