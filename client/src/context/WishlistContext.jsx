import { useState, useEffect, useCallback, useRef } from "react";
import { WishlistContext } from "./wishlist-context";
import { useAuth } from "./useAuth";
import {
  getWishlist,
  addToWishlistAPI,
  removeFromWishlistAPI,
  clearWishlistAPI,
  mergeWishlistAPI,
} from "../services/wishlistService";

const GUEST_STORAGE_KEY = "venseven_guest_wishlist";

/**
 * Normalize an item into standard Wishlist product object structure
 */
function normalizeWishlistItem(p) {
  if (!p) return null;
  const pId = String(p.id || p._id || p.productId || "");
  const totalStock = typeof p.totalStock === "number" ? p.totalStock : 10;
  const isSoldOut = totalStock <= 0;

  return {
    id: pId,
    _id: pId,
    productId: pId,
    name: p.name || "Studio Piece",
    slug: p.slug || pId,
    category: p.category || "",
    subcategory: p.subcategory || "",
    color: p.color || "",
    price:
      typeof p.price === "number"
        ? `₹${p.price.toLocaleString()}`
        : p.price || "₹0",
    numericPrice:
      typeof p.numericPrice === "number"
        ? p.numericPrice
        : typeof p.price === "number"
        ? p.price
        : parseInt(String(p.price).replace(/[^\d]/g, ""), 10) || 0,
    salePrice: p.salePrice || null,
    numericSalePrice: p.numericSalePrice || (p.salePrice ? Number(p.salePrice) : null),
    image: p.image || p.primaryImage || (p.images?.[0]?.url || ""),
    images: p.images || [],
    sizes: p.sizes?.map((s) => (typeof s === "object" ? s.size : s)) || [],
    sizeInventory: p.sizeInventory || p.sizes || [],
    totalStock,
    isSoldOut,
    isActive: p.isActive !== undefined ? Boolean(p.isActive) : true,
    isUnavailable: Boolean(p.isUnavailable || p.isActive === false),
    addedAt: p.addedAt || new Date(),
  };
}

export function WishlistProvider({ children }) {
  const { isAuthenticated, token } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const prevAuthRef = useRef(isAuthenticated);

  // 1. Initial Load & Synchronization
  useEffect(() => {
    let isMounted = true;

    async function syncState() {
      if (isAuthenticated && token) {
        setLoading(true);
        try {
          // Check if guest wishlist exists to merge
          let guestItems = [];
          try {
            const stored = localStorage.getItem(GUEST_STORAGE_KEY);
            guestItems = stored ? JSON.parse(stored) : [];
          } catch {
            guestItems = [];
          }

          if (Array.isArray(guestItems) && guestItems.length > 0) {
            const guestIds = guestItems.map((item) => item.id || item._id || item.productId).filter(Boolean);
            const mergeRes = await mergeWishlistAPI(guestIds, token);
            if (isMounted && mergeRes?.success) {
              setWishlist((mergeRes.wishlist || []).map(normalizeWishlistItem).filter(Boolean));
              localStorage.removeItem(GUEST_STORAGE_KEY);
              setLoading(false);
              return;
            }
          }

          // Normal Authenticated Fetch
          const dbRes = await getWishlist(token);
          if (isMounted && dbRes?.success) {
            setWishlist((dbRes.wishlist || []).map(normalizeWishlistItem).filter(Boolean));
          }
        } catch (err) {
          console.warn("[WishlistContext] Server sync failed:", err.message);
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        // Guest Mode: Load from LocalStorage
        try {
          const stored = localStorage.getItem(GUEST_STORAGE_KEY);
          const parsed = stored ? JSON.parse(stored) : [];
          if (isMounted) {
            setWishlist(Array.isArray(parsed) ? parsed.map(normalizeWishlistItem).filter(Boolean) : []);
          }
        } catch {
          if (isMounted) setWishlist([]);
        }
      }
    }

    syncState();
    prevAuthRef.current = isAuthenticated;

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, token]);

  // 2. Persist Guest Wishlist changes to LocalStorage
  useEffect(() => {
    if (!isAuthenticated) {
      try {
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(wishlist));
      } catch {
        // ignore storage errors
      }
    }
  }, [wishlist, isAuthenticated]);

  // Check if a product is in wishlist
  const isWishlisted = useCallback(
    (productId) => {
      if (!productId) return false;
      const target = String(productId).trim().toLowerCase();
      return wishlist.some(
        (item) =>
          String(item.id || item._id || item.productId || "").trim().toLowerCase() === target ||
          String(item.slug || "").trim().toLowerCase() === target
      );
    },
    [wishlist]
  );

  // Add product to wishlist
  const addToWishlist = useCallback(
    async (product) => {
      if (!product) return;
      const normalized = normalizeWishlistItem(product);
      if (!normalized) return;

      const pId = normalized.id;

      if (isAuthenticated && token) {
        // Optimistic update
        setWishlist((prev) => {
          if (prev.some((item) => item.id === pId || item.slug === normalized.slug)) return prev;
          return [normalized, ...prev];
        });

        try {
          const res = await addToWishlistAPI(pId, token);
          if (res?.success && Array.isArray(res.wishlist)) {
            setWishlist(res.wishlist.map(normalizeWishlistItem).filter(Boolean));
          }
        } catch (err) {
          console.warn("[WishlistContext] Failed to persist wishlist add:", err.message);
        }
      } else {
        // Guest mode update
        setWishlist((prev) => {
          if (prev.some((item) => item.id === pId || item.slug === normalized.slug)) return prev;
          return [normalized, ...prev];
        });
      }
    },
    [isAuthenticated, token]
  );

  // Remove product from wishlist
  const removeFromWishlist = useCallback(
    async (productId) => {
      if (!productId) return;
      const target = String(productId).trim().toLowerCase();

      // Optimistic state filter
      setWishlist((prev) =>
        prev.filter(
          (item) =>
            String(item.id || item._id || item.productId || "").trim().toLowerCase() !== target &&
            String(item.slug || "").trim().toLowerCase() !== target
        )
      );

      if (isAuthenticated && token) {
        try {
          const res = await removeFromWishlistAPI(productId, token);
          if (res?.success && Array.isArray(res.wishlist)) {
            setWishlist(res.wishlist.map(normalizeWishlistItem).filter(Boolean));
          }
        } catch (err) {
          console.warn("[WishlistContext] Failed to persist wishlist remove:", err.message);
        }
      }
    },
    [isAuthenticated, token]
  );

  // Toggle product in wishlist
  const toggleWishlist = useCallback(
    async (product) => {
      if (!product) return;
      const pId = String(product.id || product._id || product.productId || "");
      if (isWishlisted(pId) || isWishlisted(product.slug)) {
        await removeFromWishlist(pId || product.slug);
      } else {
        await addToWishlist(product);
      }
    },
    [isWishlisted, removeFromWishlist, addToWishlist]
  );

  // Clear entire wishlist
  const clearWishlist = useCallback(async () => {
    setWishlist([]);
    if (!isAuthenticated) {
      try {
        localStorage.removeItem(GUEST_STORAGE_KEY);
      } catch {
        // ignore
      }
    } else if (token) {
      try {
        await clearWishlistAPI(token);
      } catch (err) {
        console.warn("[WishlistContext] Failed to clear database wishlist:", err.message);
      }
    }
  }, [isAuthenticated, token]);

  const totalWishlistItems = wishlist.length;

  const value = {
    wishlist,
    loading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isWishlisted,
    clearWishlist,
    totalWishlistItems,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export default WishlistProvider;
