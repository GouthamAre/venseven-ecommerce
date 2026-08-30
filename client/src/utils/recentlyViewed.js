const RECENTLY_VIEWED_KEY = "venseven_recently_viewed";

/**
 * Record a viewed product into localStorage
 * @param {object} product
 */
export function recordRecentlyViewed(product) {
  if (!product) return;
  try {
    const pId = String(product.id || product._id || product.productId || "");
    if (!pId) return;

    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
    const list = stored ? JSON.parse(stored) : [];

    // Filter out previous occurrence if any
    const filtered = list.filter(
      (item) =>
        String(item.id || item._id) !== pId &&
        String(item.slug || "") !== String(product.slug || "")
    );

    const snapshot = {
      id: pId,
      _id: pId,
      name: product.name,
      slug: product.slug || pId,
      category: product.category,
      color: product.color,
      price: product.price,
      numericPrice: product.numericPrice,
      salePrice: product.salePrice,
      image: product.image || product.primaryImage || product.images?.[0]?.url || "",
      totalStock: product.totalStock,
      isNewArrival: product.isNewArrival,
      isBestSeller: product.isBestSeller,
      isActive: product.isActive !== undefined ? product.isActive : true,
    };

    // Insert at front, cap at 8 items
    const updated = [snapshot, ...filtered].slice(0, 8);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Retrieve recently viewed products excluding optional currentProductId
 * @param {string} [currentProductId]
 * @returns {Array}
 */
export function getRecentlyViewed(currentProductId) {
  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((p) => {
      const id = String(p.id || p._id);
      const isCurrent =
        currentProductId &&
        (id === String(currentProductId) || p.slug === String(currentProductId));
      const isActive = p.isActive !== false;
      return !isCurrent && isActive;
    });
  } catch {
    return [];
  }
}
