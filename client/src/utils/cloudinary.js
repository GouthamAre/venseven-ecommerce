/**
 * Cloudinary URL Transformation & Delivery Helper
 *
 * Enhances Cloudinary URLs with on-the-fly transformations (f_auto, q_auto, width, height, crop)
 * or gracefully returns local/standard image paths untouched.
 *
 * Does NOT require credentials or hardcoded account names.
 */

import { cloudinaryConfig, CLOUDINARY_PRESETS } from "../config/cloudinary.js";

/**
 * Optimize a Cloudinary image URL or public ID with transformation parameters.
 *
 * @param {string} source - Full Cloudinary URL, public ID, or local asset path
 * @param {object|string} options - Preset name (e.g. "PRODUCT_CARD") or custom options object
 * @returns {string} - Optimized URL or original asset path
 */
export function optimizeCloudinaryUrl(source, options = {}) {
  if (!source || typeof source !== "string") {
    return source || "";
  }

  // Resolve options from preset string if provided
  let configOptions = options;
  if (typeof options === "string" && CLOUDINARY_PRESETS[options]) {
    configOptions = CLOUDINARY_PRESETS[options];
  } else if (options && typeof options === "object" && options.preset && CLOUDINARY_PRESETS[options.preset]) {
    configOptions = { ...CLOUDINARY_PRESETS[options.preset], ...options };
  }

  const {
    width,
    height,
    crop = "fill",
    quality = cloudinaryConfig.defaultQuality,
    format = cloudinaryConfig.defaultFormat,
    rawTransformations = "",
  } = configOptions || {};

  // Case 1: Standard full Cloudinary delivery URL
  if (source.includes("cloudinary.com") && source.includes("/upload/")) {
    const transformParts = [];

    if (format) transformParts.push(`f_${format}`);
    if (quality) transformParts.push(`q_${quality}`);
    if (width) transformParts.push(`w_${width}`);
    if (height) transformParts.push(`h_${height}`);
    if ((width || height) && crop) transformParts.push(`c_${crop}`);
    if (rawTransformations) transformParts.push(rawTransformations);

    if (transformParts.length === 0) {
      return source;
    }

    const transformationString = transformParts.join(",");
    const uploadIndex = source.indexOf("/upload/");
    if (uploadIndex === -1) return source;

    const beforeUpload = source.slice(0, uploadIndex + 8); // includes '/upload/'
    const afterUpload = source.slice(uploadIndex + 8);

    // If transformations are already explicitly embedded, avoid duplicate prepending
    if (
      afterUpload.startsWith("f_auto") ||
      afterUpload.startsWith("q_auto") ||
      afterUpload.startsWith("w_") ||
      afterUpload.startsWith("c_")
    ) {
      return source;
    }

    return `${beforeUpload}${transformationString}/${afterUpload}`;
  }

  // Case 2: Public ID passed with configured cloudName in .env
  if (
    cloudinaryConfig.cloudName &&
    !source.startsWith("http://") &&
    !source.startsWith("https://") &&
    !source.startsWith("/") &&
    !source.startsWith("data:")
  ) {
    const transformParts = [];
    if (format) transformParts.push(`f_${format}`);
    if (quality) transformParts.push(`q_${quality}`);
    if (width) transformParts.push(`w_${width}`);
    if (height) transformParts.push(`h_${height}`);
    if ((width || height) && crop) transformParts.push(`c_${crop}`);
    if (rawTransformations) transformParts.push(rawTransformations);

    const transformPath = transformParts.length > 0 ? `${transformParts.join(",")}/` : "";
    return `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/${transformPath}${source}`;
  }

  // Case 3: Local imported image asset or non-Cloudinary external URL - return unchanged
  return source;
}

export { CLOUDINARY_PRESETS };
export default optimizeCloudinaryUrl;
