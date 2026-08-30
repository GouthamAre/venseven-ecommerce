import { useState, useEffect, useCallback } from "react";
import { CartContext } from "./cart-context";

const CART_STORAGE_KEY = "venseven_cart";
const COUPON_STORAGE_KEY = "venseven_applied_coupon";

/**
 * Helper to determine available stock for a specific product size
 */
function getProductSizeStock(product, size) {
  if (!product || !size) return 0;

  // 1. Check sizeInventory array of { size, stock, sku }
  if (Array.isArray(product.sizeInventory) && product.sizeInventory.length > 0) {
    const sMatch = product.sizeInventory.find(
      (s) =>
        (s.size || "").toString().trim().toUpperCase() ===
        size.toString().trim().toUpperCase()
    );
    if (sMatch && typeof sMatch.stock === "number") {
      return Math.max(0, sMatch.stock);
    }
  }

  // 2. Check if product.sizes is an array of objects
  if (
    Array.isArray(product.sizes) &&
    product.sizes.length > 0 &&
    typeof product.sizes[0] === "object"
  ) {
    const sMatch = product.sizes.find(
      (s) =>
        (s.size || "").toString().trim().toUpperCase() ===
        size.toString().trim().toUpperCase()
    );
    if (sMatch && typeof sMatch.stock === "number") {
      return Math.max(0, sMatch.stock);
    }
  }

  // 3. Check totalStock if explicitly 0
  if (typeof product.totalStock === "number" && product.totalStock === 0) {
    return 0;
  }

  // 4. Default baseline stock for legacy static items
  return 10;
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const stored = localStorage.getItem(COUPON_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage errors
    }
  }, [cart]);

  // Sync appliedCoupon to localStorage
  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }, [appliedCoupon]);

  // Add product to cart with strict stock boundary validation
  const addToCart = useCallback((product, size, quantity = 1) => {
    if (!product || !size) {
      return { success: false, message: "Please select a size." };
    }

    const availableStock = getProductSizeStock(product, size);
    if (availableStock <= 0) {
      return {
        success: false,
        message: `Size ${size} for "${product.name}" is currently sold out.`,
      };
    }

    const cartItemId = `${product.id || product._id}-${size}`;
    let outcome = { success: true, message: "Added to bag." };

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.id === cartItemId);

      if (existingIndex > -1) {
        const currentQty = prevCart[existingIndex].quantity;
        const requestedTotal = currentQty + quantity;

        if (currentQty >= availableStock) {
          outcome = {
            success: false,
            message: `Maximum available inventory (${availableStock}) for size ${size} is already in your bag.`,
          };
          return prevCart;
        }

        const cappedQty = Math.min(availableStock, requestedTotal);
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: cappedQty,
          maxStock: availableStock,
        };

        outcome = {
          success: true,
          message: `Updated quantity to ${cappedQty} (Stock available: ${availableStock}).`,
        };
        return updated;
      }

      const initialQty = Math.min(availableStock, Math.max(1, quantity));
      const pPrice =
        typeof product.price === "number"
          ? `₹${product.price.toLocaleString()}`
          : product.price;
      const numPrice =
        typeof product.numericPrice === "number"
          ? product.numericPrice
          : typeof product.price === "number"
          ? product.price
          : parseInt(String(product.price).replace(/[^\d]/g, ""), 10) || 0;

      return [
        ...prevCart,
        {
          id: cartItemId,
          productId: String(product.id || product._id),
          name: product.name,
          slug: product.slug || product.id || product._id,
          category: product.category,
          color: product.color,
          price: pPrice,
          numericPrice: numPrice,
          image:
            product.image ||
            product.primaryImage ||
            (product.images?.[0]?.url || ""),
          size,
          quantity: initialQty,
          maxStock: availableStock,
        },
      ];
    });

    return outcome;
  }, []);

  // Remove from cart
  const removeFromCart = useCallback((cartItemId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== cartItemId));
  }, []);

  // Increase quantity capped strictly at max stock
  const increaseQuantity = useCallback((cartItemId) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === cartItemId) {
          const limit = typeof item.maxStock === "number" ? Math.min(10, item.maxStock) : 10;
          return { ...item, quantity: Math.min(limit, item.quantity + 1) };
        }
        return item;
      })
    );
  }, []);

  // Decrease quantity
  const decreaseQuantity = useCallback((cartItemId) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === cartItemId) {
            return { ...item, quantity: item.quantity - 1 };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  }, []);

  // Clear cart
  const clearCart = useCallback(() => {
    setCart([]);
    setAppliedCoupon(null);
  }, []);

  // Apply Coupon
  const applyCoupon = useCallback((couponData) => {
    setAppliedCoupon(couponData);
  }, []);

  // Remove Coupon
  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  // Financial Calculations
  const subtotal = cart.reduce(
    (acc, item) => acc + item.numericPrice * item.quantity,
    0
  );

  const discount = appliedCoupon?.pricing?.discount ?? appliedCoupon?.discountAmount ?? 0;
  const shippingFee = subtotal >= 1999 || subtotal === 0 ? 0 : 150;
  const total = Math.max(0, subtotal - discount + shippingFee);
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const value = {
    cart,
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    discount,
    subtotal,
    shippingFee,
    total,
    totalItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export default CartProvider;
