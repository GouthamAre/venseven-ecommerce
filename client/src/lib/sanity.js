import { createClient } from "@sanity/client";

/**
 * Sanity Client Configuration
 *
 * Consumes public environment variables only.
 * NEVER expose Sanity API write tokens or secrets in the client bundle.
 */
export const sanityConfig = {
  projectId:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SANITY_PROJECT_ID) ||
    "b8m78t6l",
  dataset:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SANITY_DATASET) ||
    "production",
  apiVersion:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SANITY_API_VERSION) ||
    "2024-03-01",
  useCdn: true, // Use Edge CDN for sub-millisecond cached responses
};

export const sanityClient = createClient(sanityConfig);

/**
 * Reusable GROQ fetch helper with graceful error handling
 *
 * @param {string} query - GROQ query string
 * @param {object} params - Query parameters
 * @returns {Promise<any>}
 */
export async function fetchFromSanity(query, params = {}) {
  try {
    return await sanityClient.fetch(query, params);
  } catch (error) {
    console.error("[Sanity Client Error]:", error);
    throw error;
  }
}

export default sanityClient;
