import { API_BASE_URL } from "./apiConfig";

/**
 * Validates a coupon code against MongoDB rules and cart contents
 *
 * @param {string} code
 * @param {Array} cartItems
 * @param {string} [token]
 * @returns {Promise<object>}
 */
export async function validateCoupon(code, cartItems, token = null) {
  try {
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/coupons/validate`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        code,
        cartItems,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[couponService.validateCoupon Error]:", error);
    return {
      success: false,
      message: "Unable to validate coupon code at this time.",
    };
  }
}

/**
 * Admin: Fetch coupons list with optional search and filter
 *
 * @param {object} params
 * @param {string} token
 * @returns {Promise<object>}
 */
export async function getAdminCoupons(params = {}, token) {
  try {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.filter) query.append("filter", params.filter);
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const response = await fetch(`${API_BASE_URL}/admin/coupons${qs}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[couponService.getAdminCoupons Error]:", error);
    return {
      success: false,
      message: "Failed to fetch coupons from admin service.",
    };
  }
}

/**
 * Admin: Fetch single coupon detail
 *
 * @param {string} id
 * @param {string} token
 * @returns {Promise<object>}
 */
export async function getAdminCouponById(id, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/coupons/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[couponService.getAdminCouponById Error]:", error);
    return {
      success: false,
      message: "Failed to retrieve coupon details.",
    };
  }
}

/**
 * Admin: Create new coupon
 *
 * @param {object} couponData
 * @param {string} token
 * @returns {Promise<object>}
 */
export async function createCoupon(couponData, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/coupons`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(couponData),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[couponService.createCoupon Error]:", error);
    return {
      success: false,
      message: "Failed to create coupon.",
    };
  }
}

/**
 * Admin: Update coupon
 *
 * @param {string} id
 * @param {object} couponData
 * @param {string} token
 * @returns {Promise<object>}
 */
export async function updateCoupon(id, couponData, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/coupons/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(couponData),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[couponService.updateCoupon Error]:", error);
    return {
      success: false,
      message: "Failed to update coupon.",
    };
  }
}

/**
 * Admin: Toggle coupon status
 *
 * @param {string} id
 * @param {boolean} isActive
 * @param {string} token
 * @returns {Promise<object>}
 */
export async function updateCouponStatus(id, isActive, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/coupons/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isActive }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[couponService.updateCouponStatus Error]:", error);
    return {
      success: false,
      message: "Failed to change coupon status.",
    };
  }
}

/**
 * Admin: Delete coupon
 *
 * @param {string} id
 * @param {string} token
 * @returns {Promise<object>}
 */
export async function deleteCoupon(id, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/coupons/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[couponService.deleteCoupon Error]:", error);
    return {
      success: false,
      message: "Failed to delete coupon.",
    };
  }
}
