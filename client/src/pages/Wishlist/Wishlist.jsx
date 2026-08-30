import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHeart,
  FiShoppingBag,
  FiTrash2,
  FiCheck,
  FiArrowRight,
  FiX,
} from "react-icons/fi";

import Navbar from "../../components/layout/Navbar/Navbar";
import ProductCard from "../../components/products/ProductCard/ProductCard";
import RecentlyViewed from "../../components/products/RecentlyViewed/RecentlyViewed";
import { useWishlist } from "../../context/useWishlist";
import { useCart } from "../../context/useCart";
import "./Wishlist.css";

function Wishlist() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [toastMessage, setToastMessage] = useState("");

  // Size Selector Modal State for individual pieces
  const [sizeModalItem, setSizeModalItem] = useState(null);
  const [selectedModalSize, setSelectedModalSize] = useState("");

  const handleOpenSizeModal = (product, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (product.isUnavailable || product.isSoldOut) return;

    const sizes = Array.isArray(product.sizeInventory) && product.sizeInventory.length > 0
      ? product.sizeInventory
      : Array.isArray(product.sizes)
      ? product.sizes.map((s) => (typeof s === "object" ? s : { size: s, stock: 10 }))
      : [];

    const firstAvailable = sizes.find((s) => Number(s.stock) > 0)?.size || sizes[0]?.size || "M";

    setSizeModalItem(product);
    setSelectedModalSize(firstAvailable);
  };

  const handleConfirmAddToCart = () => {
    if (!sizeModalItem || !selectedModalSize) return;

    const res = addToCart(sizeModalItem, selectedModalSize, 1);
    setToastMessage(res?.message || `Added "${sizeModalItem.name}" (${selectedModalSize}) to your bag.`);
    setSizeModalItem(null);

    setTimeout(() => {
      setToastMessage("");
    }, 3500);
  };

  const handleAddAllAvailableToCart = () => {
    let count = 0;
    wishlist.forEach((product) => {
      if (!product.isUnavailable && !product.isSoldOut) {
        const sizes = Array.isArray(product.sizeInventory) && product.sizeInventory.length > 0
          ? product.sizeInventory
          : Array.isArray(product.sizes)
          ? product.sizes.map((s) => (typeof s === "object" ? s : { size: s, stock: 10 }))
          : [];

        const availableSize = sizes.find((s) => Number(s.stock) > 0)?.size || sizes[0]?.size || "M";
        addToCart(product, availableSize, 1);
        count++;
      }
    });

    if (count > 0) {
      setToastMessage(`Added ${count} available piece(s) to your bag.`);
    } else {
      setToastMessage("No available pieces found to add.");
    }

    setTimeout(() => {
      setToastMessage("");
    }, 3500);
  };

  return (
    <>
      <Navbar />

      <main className="wishlist-page">
        <div className="wishlist-container">
          {/* Toast Notification Banner */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                className="wishlist-toast-banner"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <FiCheck className="toast-icon" />
                <span>{toastMessage}</span>
                <Link to="/cart" className="toast-cart-link">
                  VIEW BAG →
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Page Header */}
          <header className="wishlist-header">
            <span className="wishlist-eyebrow">CURATED SAVED PIECES</span>
            <div className="wishlist-title-row">
              <h1 className="wishlist-title">
                WISHLIST
                {wishlist.length > 0 && <span> ({wishlist.length})</span>}
              </h1>

              {wishlist.length > 0 && (
                <div className="wishlist-header-actions">
                  <button
                    type="button"
                    className="wishlist-clear-btn"
                    onClick={clearWishlist}
                    title="Clear all saved pieces"
                  >
                    CLEAR ALL
                  </button>
                  <button
                    type="button"
                    className="add-all-cart-btn"
                    onClick={handleAddAllAvailableToCart}
                  >
                    <FiShoppingBag />
                    <span>ADD ALL TO BAG</span>
                  </button>
                </div>
              )}
            </div>
            <p className="wishlist-subtitle">
              Your saved pieces, ready for your wardrobe.
            </p>
          </header>

          {wishlist.length > 0 ? (
            <div className="wishlist-grid-wrapper">
              <div className="wishlist-grid">
                {wishlist.map((product) => {
                  const pId = product.id || product._id || product.productId;
                  const isSoldOut = Boolean(product.isSoldOut || (typeof product.totalStock === "number" && product.totalStock <= 0));
                  const isUnavailable = Boolean(product.isUnavailable || product.isActive === false);

                  return (
                    <div key={pId} className="wishlist-card-container">
                      <ProductCard product={product} />

                      {/* Stock Warning Indicators */}
                      {isUnavailable && (
                        <div className="wishlist-stock-banner unavailable">
                          ARCHIVED / CURRENTLY UNAVAILABLE
                        </div>
                      )}
                      {!isUnavailable && isSoldOut && (
                        <div className="wishlist-stock-banner sold-out">
                          CURRENTLY SOLD OUT
                        </div>
                      )}

                      {/* Move to Bag & Remove Controls */}
                      <div className="wishlist-card-actions">
                        <button
                          type="button"
                          className={`wishlist-add-cart-btn ${
                            isUnavailable || isSoldOut ? "disabled-btn" : ""
                          }`}
                          onClick={(e) => handleOpenSizeModal(product, e)}
                          disabled={isUnavailable || isSoldOut}
                          aria-label={`Add ${product.name} to cart`}
                        >
                          <FiShoppingBag />
                          <span>
                            {isUnavailable
                              ? "UNAVAILABLE"
                              : isSoldOut
                              ? "SOLD OUT"
                              : "MOVE TO BAG"}
                          </span>
                        </button>

                        <button
                          type="button"
                          className="wishlist-remove-btn"
                          onClick={() => removeFromWishlist(pId)}
                          aria-label={`Remove ${product.name} from wishlist`}
                          title="Remove from wishlist"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="wishlist-footer-actions">
                <Link to="/shop" className="wishlist-continue-link">
                  <span>EXPLORE MORE PIECES</span>
                  <FiArrowRight />
                </Link>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="wishlist-empty-state">
              <div className="empty-heart-icon">
                <FiHeart />
              </div>
              <h2>YOUR WISHLIST IS WAITING.</h2>
              <p>
                Save your favourite VENSEVEN pieces as you browse to curate
                your bespoke wardrobe.
              </p>
              <Link to="/shop" className="empty-wishlist-btn">
                EXPLORE COLLECTION →
              </Link>
            </div>
          )}

          {/* Quick Size Selection Modal */}
          <AnimatePresence>
            {sizeModalItem && (
              <div className="wishlist-modal-backdrop" onClick={() => setSizeModalItem(null)}>
                <motion.div
                  className="wishlist-size-modal"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="modal-header">
                    <h3>SELECT SIZE</h3>
                    <button
                      type="button"
                      className="modal-close-btn"
                      onClick={() => setSizeModalItem(null)}
                      aria-label="Close"
                    >
                      <FiX />
                    </button>
                  </div>

                  <p className="modal-prod-name">{sizeModalItem.name}</p>
                  <p className="modal-prod-price">{sizeModalItem.price}</p>

                  <div className="modal-sizes-grid">
                    {(Array.isArray(sizeModalItem.sizeInventory) && sizeModalItem.sizeInventory.length > 0
                      ? sizeModalItem.sizeInventory
                      : Array.isArray(sizeModalItem.sizes)
                      ? sizeModalItem.sizes.map((s) => (typeof s === "object" ? s : { size: s, stock: 10 }))
                      : [{ size: "S", stock: 5 }, { size: "M", stock: 5 }, { size: "L", stock: 5 }]
                    ).map((s) => {
                      const sLabel = typeof s === "object" ? s.size : s;
                      const sStock = typeof s === "object" && typeof s.stock === "number" ? s.stock : 10;
                      const isOutOfStock = sStock <= 0;
                      const isSelected = selectedModalSize === sLabel;

                      return (
                        <button
                          key={sLabel}
                          type="button"
                          className={`modal-size-pill ${isSelected ? "selected" : ""} ${
                            isOutOfStock ? "out-of-stock" : ""
                          }`}
                          disabled={isOutOfStock}
                          onClick={() => setSelectedModalSize(sLabel)}
                        >
                          <span>{sLabel}</span>
                          {isOutOfStock && <span className="modal-size-strike" />}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    className="modal-confirm-btn"
                    onClick={handleConfirmAddToCart}
                    disabled={!selectedModalSize}
                  >
                    ADD TO BAG • {selectedModalSize}
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Browsing History: RECENTLY VIEWED */}
          <RecentlyViewed />
        </div>
      </main>
    </>
  );
}

export default Wishlist;
