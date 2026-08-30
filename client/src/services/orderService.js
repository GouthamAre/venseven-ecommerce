import { API_BASE_URL } from "./apiConfig";

/**
 * Helper to execute JSON requests to the VENSEVEN backend
 */
async function apiFetch(endpoint, options = {}, token = null) {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

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
 * Place a new order (Guest or Authenticated)
 *
 * @param {object} orderData - Order payload (customer, shippingAddress, items, pricing)
 * @param {string|null} [token] - Optional user JWT token
 * @returns {Promise<{ success: boolean, order: object }>}
 */
export async function createOrder(orderData, token = null) {
  return await apiFetch(
    "/orders",
    {
      method: "POST",
      body: JSON.stringify(orderData),
    },
    token
  );
}

/**
 * Retrieve authenticated user order history
 *
 * @param {string} token - User JWT token
 * @returns {Promise<{ success: boolean, count: number, orders: Array }>}
 */
export async function getMyOrders(token) {
  if (!token) {
    throw new Error("Authentication token required to view order history.");
  }

  return await apiFetch(
    "/orders/my-orders",
    {
      method: "GET",
    },
    token
  );
}

/**
 * Retrieve single order details
 *
 * @param {string} orderNumber - e.g. V7-2026-000123
 * @param {string|null} [token] - Optional user JWT token
 * @param {string|null} [email] - Optional guest email verification
 * @returns {Promise<{ success: boolean, order: object }>}
 */
export async function getOrder(orderNumber, token = null, email = null) {
  const query = email ? `?email=${encodeURIComponent(email)}` : "";
  return await apiFetch(
    `/orders/${encodeURIComponent(orderNumber)}${query}`,
    {
      method: "GET",
    },
    token
  );
}
