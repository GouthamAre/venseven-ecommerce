/**
 * Cloudinary Client Configuration, Transformation Presets & Folder Structure
 *
 * NOTE: Only public configurations are handled here.
 * NEVER store or expose Cloudinary API secrets in client-side code.
 */

export const cloudinaryConfig = {
  cloudName:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_CLOUDINARY_CLOUD_NAME) ||
    "cmb6xxhf",
  defaultQuality: "auto",
  defaultFormat: "auto",
  baseUrl: "https://res.cloudinary.com",
};

/**
 * Standard folder architecture in VENSEVEN Cloudinary media library
 */
export const CLOUDINARY_FOLDERS = {
  PRODUCTS: {
    ROOT: "VENSEVEN/products",
    SHIRTS: "VENSEVEN/products/shirts",
    TROUSERS: "VENSEVEN/products/trousers",
    TSHIRTS: "VENSEVEN/products/t-shirts",
    SHORTS: "VENSEVEN/products/shorts",
  },
  COLLECTIONS: "VENSEVEN/collections",
  HOMEPAGE: "VENSEVEN/homepage",
  BRANDING: "VENSEVEN/branding",
};

/**
 * Helper to resolve the standard Cloudinary destination folder for a product category
 *
 * @param {string} category - Garment category (e.g. "Shirts", "Trousers", "T-Shirts", "Shorts")
 * @returns {string} - Destination folder path
 */
export function getProductFolder(category = "") {
  const cat = category.toLowerCase().trim();
  if (cat.includes("shirt") && !cat.includes("t-shirt") && !cat.includes("tee")) {
    return CLOUDINARY_FOLDERS.PRODUCTS.SHIRTS;
  }
  if (cat.includes("trouser") || cat.includes("pant")) {
    return CLOUDINARY_FOLDERS.PRODUCTS.TROUSERS;
  }
  if (cat.includes("t-shirt") || cat.includes("tee")) {
    return CLOUDINARY_FOLDERS.PRODUCTS.TSHIRTS;
  }
  if (cat.includes("short")) {
    return CLOUDINARY_FOLDERS.PRODUCTS.SHORTS;
  }
  return CLOUDINARY_FOLDERS.PRODUCTS.ROOT;
}

/**
 * Standard transformation presets for VENSEVEN e-commerce image display
 */
export const CLOUDINARY_PRESETS = {
  // Product browsing cards (3:4 aspect ratio, crisp mobile/desktop density)
  PRODUCT_CARD: {
    width: 800,
    crop: "fill",
    quality: "auto",
    format: "auto",
  },
  // High-res garment showcase in Product Details view
  PRODUCT_DETAIL: {
    width: 1400,
    crop: "limit",
    quality: "auto",
    format: "auto",
  },
  // Compact gallery thumbnail selectors
  GALLERY_THUMB: {
    width: 240,
    height: 300,
    crop: "fill",
    quality: "auto",
    format: "auto",
  },
  // Full-bleed hero and lookbook editorial banners
  HERO_BANNER: {
    width: 1920,
    crop: "limit",
    quality: "auto",
    format: "auto",
  },
};

export default cloudinaryConfig;
