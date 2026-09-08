/**
 * VENSEVEN Client Centralized API Configuration
 *
 * Normalizes VITE_API_URL to ensure reliable '/api' routing across all client services,
 * preventing duplicate '/api/api' prefixes or malformed URL patterns.
 *
 * Guarantees production builds NEVER attempt to connect to localhost:5000.
 */

const envApiUrl = (import.meta.env?.VITE_API_URL || "").trim();
const isProd =
  import.meta.env?.PROD ||
  (typeof window !== "undefined" &&
    window.location?.hostname !== "localhost" &&
    window.location?.hostname !== "127.0.0.1");

let rawApiUrl = envApiUrl;

// In production environments, never allow localhost/127.0.0.1 fallback
if (!rawApiUrl || (isProd && (rawApiUrl.includes("localhost") || rawApiUrl.includes("127.0.0.1")))) {
  rawApiUrl = isProd
    ? "https://venseven-backend.onrender.com"
    : "http://localhost:5000";
}

// Strip any trailing /api or trailing slashes to extract clean origin
export const API_ORIGIN = rawApiUrl.replace(/\/api\/?$/i, "").replace(/\/+$/, "");

// Standardized API Base URL -> e.g. "http://localhost:5000/api" or "https://venseven-backend.onrender.com/api"
export const API_BASE_URL = `${API_ORIGIN}/api`;

export default API_BASE_URL;
