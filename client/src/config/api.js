/**
 * VENSEVEN Client Centralized API Configuration
 *
 * Normalizes VITE_API_URL to ensure reliable '/api' routing across all client services,
 * preventing duplicate '/api/api' prefixes or malformed URL patterns.
 */

const RAW_API_URL = (import.meta.env?.VITE_API_URL || "http://localhost:5000").trim();

// Strip any trailing /api or trailing slashes to extract clean origin
export const API_ORIGIN = RAW_API_URL.replace(/\/api\/?$/i, "").replace(/\/+$/, "");

// Standardized API Base URL -> e.g. "http://localhost:5000/api" or "https://api.venseven.com/api"
export const API_BASE_URL = `${API_ORIGIN}/api`;

export default API_BASE_URL;
