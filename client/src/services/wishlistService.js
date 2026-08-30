import { API_BASE_URL } from "./apiConfig";

/**
 * Fetch authenticated user's wishlist from MongoDB
 */
export async function getWishlist(token) {
  if (!token) {
    throw new Error("Authentication token is required to retrieve wishlist.");
  }

  const response = await fetch(`${API_BASE_URL}/wishlist`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Failed to retrieve wishlist.");
  }

  return data;
}

/**
 * Add a product to the authenticated user's wishlist in MongoDB
 */
export async function addToWishlistAPI(productId, token) {
  if (!token) {
    throw new Error("Authentication token is required to update wishlist.");
  }

  const response = await fetch(`${API_BASE_URL}/wishlist/${productId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Failed to add product to wishlist.");
  }

  return data;
}

/**
 * Remove a product from the authenticated user's wishlist in MongoDB
 */
export async function removeFromWishlistAPI(productId, token) {
  if (!token) {
    throw new Error("Authentication token is required to update wishlist.");
  }

  const response = await fetch(`${API_BASE_URL}/wishlist/${productId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Failed to remove product from wishlist.");
  }

  return data;
}

/**
 * Clear the authenticated user's complete wishlist in MongoDB
 */
export async function clearWishlistAPI(token) {
  if (!token) {
    throw new Error("Authentication token is required to clear wishlist.");
  }

  const response = await fetch(`${API_BASE_URL}/wishlist`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Failed to clear wishlist.");
  }

  return data;
}

/**
 * Merge guest wishlist items into authenticated user's database wishlist upon login/register
 */
export async function mergeWishlistAPI(productIds, token) {
  if (!token || !Array.isArray(productIds) || productIds.length === 0) {
    return { success: true, count: 0, wishlist: [] };
  }

  const response = await fetch(`${API_BASE_URL}/wishlist/merge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ productIds }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Failed to merge guest wishlist.");
  }

  return data;
}
