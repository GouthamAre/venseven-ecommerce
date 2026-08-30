import { API_BASE_URL } from "./apiConfig";

/**
 * Execute authenticated admin JSON API requests
 */
async function adminFetch(endpoint, options = {}, token = null) {
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
    message: "Failed to parse admin API response.",
  }));

  if (!response.ok) {
    const error = new Error(data.message || `Admin request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Fetch Admin Dashboard Store KPIs and Recent Orders
 *
 * @param {string} token - Admin JWT token
 * @returns {Promise<{ success: boolean, stats: object }>}
 */
export async function getDashboard(token) {
  return await adminFetch("/admin/dashboard", { method: "GET" }, token);
}

/**
 * Fetch paginated & filtered orders
 *
 * @param {object} params - { page, limit, status, paymentStatus, search }
 * @param {string} token - Admin JWT token
 * @returns {Promise<{ success: boolean, count: number, totalPages: number, currentPage: number, orders: Array }>}
 */
export async function getAdminOrders(params = {}, token) {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  if (params.status && params.status !== "ALL") query.append("status", params.status);
  if (params.paymentStatus && params.paymentStatus !== "ALL") query.append("paymentStatus", params.paymentStatus);
  if (params.search && params.search.trim()) query.append("search", params.search.trim());

  const queryString = query.toString() ? `?${query.toString()}` : "";
  return await adminFetch(`/admin/orders${queryString}`, { method: "GET" }, token);
}

/**
 * Fetch full order details by orderNumber
 *
 * @param {string} orderNumber - e.g. V7-2026-000123
 * @param {string} token - Admin JWT token
 * @returns {Promise<{ success: boolean, order: object }>}
 */
export async function getAdminOrder(orderNumber, token) {
  return await adminFetch(`/admin/orders/${encodeURIComponent(orderNumber)}`, { method: "GET" }, token);
}

/**
 * Update order fulfillment status
 *
 * @param {string} orderNumber - e.g. V7-2026-000123
 * @param {string} status - 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
 * @param {string} token - Admin JWT token
 * @returns {Promise<{ success: boolean, message: string, order: object }>}
 */
export async function updateOrderStatus(orderNumber, status, token) {
  return await adminFetch(
    `/admin/orders/${encodeURIComponent(orderNumber)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
    token
  );
}

/**
 * Fetch paginated & searchable registered customer list
 *
 * @param {object} params - { page, limit, search }
 * @param {string} token - Admin JWT token
 * @returns {Promise<{ success: boolean, count: number, totalPages: number, currentPage: number, customers: Array }>}
 */
export async function getAdminCustomers(params = {}, token) {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  if (params.search && params.search.trim()) query.append("search", params.search.trim());

  const queryString = query.toString() ? `?${query.toString()}` : "";
  return await adminFetch(`/admin/customers${queryString}`, { method: "GET" }, token);
}

/**
 * Fetch single customer profile with lifetime stats and order history
 *
 * @param {string} id - User ID
 * @param {string} token - Admin JWT token
 * @returns {Promise<{ success: boolean, customer: object }>}
 */
export async function getAdminCustomer(id, token) {
  return await adminFetch(`/admin/customers/${encodeURIComponent(id)}`, { method: "GET" }, token);
}
