import { useState } from "react";
import { optimizeCloudinaryUrl } from "../../../utils/cloudinary";
import "./CloudinaryImage.css";

/**
 * CloudinaryImage Component
 *
 * Reusable image renderer supporting Cloudinary URL optimizations and standard image fallbacks.
 *
 * Props:
 * - src: string (Cloudinary URL or local image asset path)
 * - alt: string (Image alternative text)
 * - className: string (Optional CSS class)
 * - loading: "lazy" | "eager" (Default: "lazy")
 * - preset: "PRODUCT_CARD" | "PRODUCT_DETAIL" | "GALLERY_THUMB" | "HERO_BANNER" (Optional transformation preset)
 * - transform: object (Optional custom Cloudinary transformation params: { width, height, crop, quality, format })
 * - width: number | string (Optional width)
 * - height: number | string (Optional height)
 * - fallbackSrc: string (Optional fallback URL if primary src fails)
 */
function CloudinaryImage({
  src,
  alt = "",
  className = "",
  loading = "lazy",
  preset,
  transform,
  width,
  height,
  fallbackSrc,
  onError,
  ...rest
}) {
  const [hasError, setHasError] = useState(false);

  // Compute final optimized URL using preset, custom transform, or dimensional fallback
  const resolvedSrc = optimizeCloudinaryUrl(
    src,
    preset || transform || {
      width: typeof width === "number" ? width : undefined,
      height: typeof height === "number" ? height : undefined,
    }
  );

  const displaySrc = hasError && fallbackSrc ? fallbackSrc : resolvedSrc;

  const handleError = (e) => {
    if (!hasError && fallbackSrc) {
      setHasError(true);
    }
    if (onError) {
      onError(e);
    }
  };

  // If no source is provided at all, render graceful placeholder
  if (!displaySrc) {
    return (
      <div
        className={`cloudinary-img-placeholder ${className}`}
        style={{ width: width || "100%", height: height || "100%" }}
        aria-label={alt || "Image not available"}
      />
    );
  }

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={`cloudinary-img ${className}`}
      loading={loading}
      width={width}
      height={height}
      onError={handleError}
      {...rest}
    />
  );
}

export default CloudinaryImage;
