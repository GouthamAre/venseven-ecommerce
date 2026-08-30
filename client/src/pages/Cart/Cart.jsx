import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiTrash2,
  FiShoppingBag,
  FiArrowRight,
  FiArrowLeft,
  FiShield,
  FiTruck,
  FiMinus,
  FiPlus,
  FiCheck,
  FiTag,
  FiX,
  FiLoader,
} from "react-icons/fi";

import Navbar from "../../components/layout/Navbar/Navbar";
import CloudinaryImage from "../../components/common/CloudinaryImage/CloudinaryImage";
import { useCart } from "../../context/useCart";
import { useAuth } from "../../context/useAuth";
import { validateCoupon } from "../../services/couponService";
import "./Cart.css";

function Cart() {
  const {
    cart,
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
  } = useCart();

  const { token } = useAuth();

  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponSuccessMsg, setCouponSuccessMsg] = useState("");

  const freeShippingThreshold = 1999;
  const amountNeededForFreeShipping = Math.max(
    0,
    freeShippingThreshold - subtotal
  );

  const handleApplyCoupon = async (e) => {
    if (e) e.preventDefault();
    if (!couponCodeInput || !couponCodeInput.trim()) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    setCouponLoading(true);
    setCouponError("");
    setCouponSuccessMsg("");

    try {
      const res = await validateCoupon(
        couponCodeInput.trim().toUpperCase(),
        cart,
        token
      );

      if (res.success && res.coupon) {
        applyCoupon({
          ...res.coupon,
          discountAmount: res.pricing?.discount || 0,
          pricing: res.pricing,
        });
        setCouponSuccessMsg(
          `✓ ${res.coupon.code} APPLIED — You saved ₹${(
            res.pricing?.discount || 0
          ).toLocaleString()}`
        );
        setCouponCodeInput("");
      } else {
        setCouponError(res.message || "Invalid or ineligible promotional code.");
      }
    } catch {
      setCouponError("Failed to validate coupon. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponSuccessMsg("");
    setCouponError("");
  };

  return (
    <>
      <Navbar />

      <main className="cart-page">
        <div className="cart-container">
          {/* Page Header */}
          <header className="cart-header">
            <span className="cart-eyebrow">CHECKOUT PREVIEW</span>
            <h1 className="cart-title">
              YOUR BAG
              {totalItems > 0 && <span> ({totalItems})</span>}
            </h1>
          </header>

          {cart.length > 0 ? (
            <div className="cart-layout">
              {/* Left Column: Cart Items List */}
              <div className="cart-items-column">
                {/* Free Shipping Progress Indicator */}
                <div className="shipping-progress-card">
                  {amountNeededForFreeShipping === 0 ? (
                    <p className="shipping-progress-text success">
                      <FiCheck /> You have unlocked <strong>Free Standard Shipping</strong>!
                    </p>
                  ) : (
                    <p className="shipping-progress-text">
                      Add <strong>₹{amountNeededForFreeShipping.toLocaleString()}</strong> more to unlock <strong>Free Shipping</strong>.
                    </p>
                  )}
                  <div className="shipping-progress-bar">
                    <div
                      className="shipping-progress-fill"
                      style={{
                        width: `${Math.min(
                          100,
                          (subtotal / freeShippingThreshold) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Items List */}
                <div className="cart-items-list">
                  <AnimatePresence>
                    {cart.map((item) => {
                      const itemSubtotal = item.numericPrice * item.quantity;

                      return (
                        <motion.article
                          key={item.id}
                          className="cart-item-card"
                          layout
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.25 }}
                        >
                          {/* Image */}
                          <Link
                            to={`/product/${item.slug}`}
                            className="cart-item-image-link"
                          >
                            <CloudinaryImage
                              src={item.image}
                              alt={item.name}
                              className="cart-item-img"
                              width={240}
                              height={320}
                              crop="fill"
                            />
                          </Link>

                          {/* Details */}
                          <div className="cart-item-details">
                            <div className="cart-item-header">
                              <span className="cart-item-category">
                                {item.category}
                              </span>
                              <h2 className="cart-item-name">
                                <Link to={`/product/${item.slug}`}>
                                  {item.name}
                                </Link>
                              </h2>
                            </div>

                            <div className="cart-item-meta">
                              <span className="meta-pill">
                                Size: <strong>{item.size}</strong>
                              </span>
                              {item.color && (
                                <span className="meta-pill">
                                  Color: <strong>{item.color}</strong>
                                </span>
                              )}
                            </div>

                            <div className="cart-item-pricing">
                              <span className="unit-price">
                                ₹{item.numericPrice.toLocaleString()} each
                              </span>
                              <strong className="item-total-price">
                                ₹{itemSubtotal.toLocaleString()}
                              </strong>
                            </div>

                            {/* Controls */}
                            <div className="cart-item-controls">
                              <div className="quantity-stepper">
                                <button
                                  type="button"
                                  className="stepper-btn"
                                  onClick={() => decreaseQuantity(item.id)}
                                  aria-label="Decrease quantity"
                                >
                                  <FiMinus />
                                </button>
                                <span className="stepper-count">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  className="stepper-btn"
                                  onClick={() => increaseQuantity(item.id)}
                                  disabled={
                                    typeof item.maxStock === "number" &&
                                    item.quantity >= item.maxStock
                                  }
                                  aria-label="Increase quantity"
                                >
                                  <FiPlus />
                                </button>
                              </div>

                              <button
                                type="button"
                                className="remove-item-btn"
                                onClick={() => removeFromCart(item.id)}
                                aria-label={`Remove ${item.name} from bag`}
                              >
                                <FiTrash2 />
                                <span>REMOVE</span>
                              </button>
                            </div>
                          </div>
                        </motion.article>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Cart Action Buttons */}
                <div className="cart-list-actions">
                  <Link to="/shop" className="continue-shopping-link">
                    <FiArrowLeft />
                    <span>CONTINUE SHOPPING</span>
                  </Link>

                  <button
                    type="button"
                    className="clear-cart-btn"
                    onClick={clearCart}
                  >
                    CLEAR BAG
                  </button>
                </div>
              </div>

              {/* Right Column: Order Summary */}
              <aside className="cart-summary-column" aria-label="Order Summary">
                <div className="cart-summary-card">
                  <h2 className="summary-title">ORDER SUMMARY</h2>

                  {/* Promo / Coupon Section */}
                  <div className="cart-coupon-section">
                    {appliedCoupon ? (
                      <div className="applied-coupon-card">
                        <div className="applied-coupon-info">
                          <div className="applied-coupon-badge">
                            <FiTag />
                            <span>{appliedCoupon.code}</span>
                          </div>
                          <span className="applied-coupon-savings">
                            -₹{discount.toLocaleString()} OFF
                          </span>
                        </div>
                        <button
                          type="button"
                          className="remove-coupon-btn"
                          onClick={handleRemoveCoupon}
                          title="Remove coupon"
                          aria-label="Remove coupon"
                        >
                          <FiX />
                          <span>REMOVE</span>
                        </button>
                      </div>
                    ) : (
                      <form
                        className="coupon-input-form"
                        onSubmit={handleApplyCoupon}
                      >
                        <div className="coupon-input-wrapper">
                          <FiTag className="coupon-input-icon" />
                          <input
                            type="text"
                            placeholder="PROMO CODE (e.g. WELCOME10)"
                            value={couponCodeInput}
                            onChange={(e) => {
                              setCouponCodeInput(e.target.value.toUpperCase());
                              if (couponError) setCouponError("");
                            }}
                            className="coupon-input"
                            maxLength={30}
                          />
                          <button
                            type="submit"
                            className="coupon-apply-btn"
                            disabled={couponLoading || !couponCodeInput.trim()}
                          >
                            {couponLoading ? (
                              <FiLoader className="spin-icon" />
                            ) : (
                              "APPLY"
                            )}
                          </button>
                        </div>
                      </form>
                    )}

                    {couponError && (
                      <p className="coupon-msg error">{couponError}</p>
                    )}
                    {couponSuccessMsg && !appliedCoupon && (
                      <p className="coupon-msg success">{couponSuccessMsg}</p>
                    )}
                  </div>

                  <div className="summary-rows">
                    <div className="summary-row">
                      <span>Subtotal ({totalItems} items)</span>
                      <strong>₹{subtotal.toLocaleString()}</strong>
                    </div>

                    {discount > 0 && (
                      <div className="summary-row discount-row">
                        <span>
                          {appliedCoupon?.code ? `${appliedCoupon.code} Discount` : "Promotional Discount"}
                        </span>
                        <strong className="discount-amount">
                          -₹{discount.toLocaleString()}
                        </strong>
                      </div>
                    )}

                    <div className="summary-row">
                      <span>Estimated Shipping</span>
                      <span>
                        {shippingFee === 0 ? (
                          <strong className="free-shipping-tag">FREE</strong>
                        ) : (
                          `₹${shippingFee}`
                        )}
                      </span>
                    </div>

                    <div className="summary-row">
                      <span>Taxes</span>
                      <span className="summary-note">Included in price</span>
                    </div>

                    <div className="summary-divider" />

                    <div className="summary-row total-row">
                      <span>TOTAL</span>
                      <strong className="total-amount">
                        ₹{total.toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  <Link to="/checkout" className="checkout-btn">
                    <span>PROCEED TO CHECKOUT</span>
                    <FiArrowRight />
                  </Link>

                  {/* Trust Signals */}
                  <div className="summary-trust-signals">
                    <div className="summary-trust-item">
                      <FiShield />
                      <span>Encrypted SSL 256-bit Checkout</span>
                    </div>
                    <div className="summary-trust-item">
                      <FiTruck />
                      <span>Insured Express Courier Dispatch</span>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          ) : (
            /* Empty State */
            <div className="cart-empty-state">
              <div className="empty-state-icon">
                <FiShoppingBag />
              </div>
              <h2>YOUR BAG IS EMPTY</h2>
              <p>
                Looks like you haven't added any luxury menswear pieces to your bag yet.
              </p>
              <Link to="/shop" className="empty-state-btn">
                EXPLORE SHOP COLLECTION →
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default Cart;
