import { API_BASE_URL } from "./apiConfig";
import localProducts from "../data/products";

/**
 * Fetch public products with optional filtering, search, pagination, and sorting
 *
 * @param {object} [params] - { category, subcategory, color, size, minPrice, maxPrice, search, filter, sort, page, limit }
 * @returns {Promise<{ success: boolean, products: Array, count: number, totalPages: number, currentPage: number }>}
 */
export async function getProducts(params = {}) {
  try {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.append(key, value);
      }
    });

    const response = await fetch(`${API_BASE_URL}/products?${query.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.success && Array.isArray(data.products) && data.products.length > 0) {
        return data;
      }
    }
  } catch (error) {
    console.warn("[productService] API request failed, falling back to local dataset:", error.message);
  }

  // Graceful Local Fallback
  let filtered = [...localProducts];

  if (params.category && params.category !== "All" && params.category !== "all") {
    filtered = filtered.filter(
      (p) => p.category.toLowerCase() === params.category.toLowerCase()
    );
  }

  if (params.filter === "new-arrivals") {
    filtered = filtered.filter((p) => p.isNewArrival);
  } else if (params.filter === "best-sellers") {
    filtered = filtered.filter((p) => p.isBestSeller);
  }

  if (params.search && params.search.trim()) {
    const q = params.search.trim().toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }

  if (params.sort === "price-asc") {
    filtered.sort((a, b) => a.numericPrice - b.numericPrice);
  } else if (params.sort === "price-desc") {
    filtered.sort((a, b) => b.numericPrice - a.numericPrice);
  }

  return {
    success: true,
    count: filtered.length,
    totalPages: 1,
    currentPage: 1,
    products: filtered,
    isLocalFallback: true,
  };
}

/**
 * Fetch a single product by slug or ID
 *
 * @param {string} slug
 * @returns {Promise<{ success: boolean, product: object }>}
 */
export async function getProductBySlug(slug) {
  if (!slug) return { success: false, message: "Slug is required" };

  try {
    const response = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(slug)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.success && data.product) {
        return data;
      }
    }
  } catch (error) {
    console.warn(`[productService] API lookup for "${slug}" failed, checking local dataset:`, error.message);
  }

  // Local fallback
  const localMatch = localProducts.find(
    (p) =>
      p.slug.toLowerCase() === slug.toLowerCase() ||
      String(p.id) === String(slug)
  );

  if (localMatch) {
    return {
      success: true,
      product: localMatch,
      isLocalFallback: true,
    };
  }

  return {
    success: false,
    message: `Product "${slug}" not found.`,
  };
}

/**
 * Fetch personalized product recommendations for a specific product
 *
 * @param {string} slug
 * @returns {Promise<{ success: boolean, recommendations: Array }>}
 */
export async function getRecommendations(slug) {
  if (!slug) return { success: false, count: 0, recommendations: [] };

  try {
    const response = await fetch(
      `${API_BASE_URL}/products/${encodeURIComponent(slug)}/recommendations`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data?.success && Array.isArray(data.recommendations)) {
        return data;
      }
    }
  } catch (error) {
    console.warn(`[productService] Recommendations API lookup for "${slug}" failed:`, error.message);
  }

  // Graceful Local Fallback: Pick related products from local catalog
  const base = localProducts.find(
    (p) =>
      p.slug.toLowerCase() === slug.toLowerCase() ||
      String(p.id) === String(slug)
  );

  const fallback = localProducts
    .filter(
      (p) =>
        String(p.id) !== String(base?.id) &&
        p.slug.toLowerCase() !== slug.toLowerCase() &&
        (base ? p.category === base.category || p.isBestSeller : true)
    )
    .slice(0, 4);

  return {
    success: true,
    count: fallback.length,
    recommendations: fallback,
    isLocalFallback: true,
  };
}

/**
 * Admin: Fetch all products with admin controls (including drafts/inactive)
 */
export async function getAdminProducts(params = {}, token) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });

  const response = await fetch(`${API_BASE_URL}/products/admin/all?${query.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Failed to retrieve admin products list.");
  }
  return data;
}

/**
 * Admin: Fetch single product for editing in Admin Form
 */
export async function getAdminProductById(id, token) {
  const response = await fetch(`${API_BASE_URL}/products/admin/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Failed to retrieve product details.");
  }
  return data;
}

/**
 * Admin: Upload image(s) to Cloudinary via backend
 */
export async function uploadProductImages(formData, token) {
  const response = await fetch(`${API_BASE_URL}/products/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Image upload failed.");
  }
  return data;
}

/**
 * Admin: Create a new product
 */
export async function createProduct(productData, token) {
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(productData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Failed to create product.");
  }
  return data;
}

/**
 * Admin: Update an existing product
 */
export async function updateProduct(id, productData, token) {
  const response = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(productData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Failed to update product.");
  }
  return data;
}

/**
 * Admin: Update size stock inventory counts
 */
export async function updateProductStock(id, sizes, token) {
  const response = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(id)}/stock`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ sizes }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Failed to update stock.");
  }
  return data;
}

/**
 * Admin: Safely delete or archive a product
 */
export async function deleteProduct(id, token) {
  const response = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Failed to delete product.");
  }
  return data;
}
