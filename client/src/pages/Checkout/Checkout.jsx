import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiArrowRight,
  FiShoppingBag,
  FiShield,
  FiTruck,
  FiCheckCircle,
  FiCreditCard,
  FiMapPin,
  FiUser,
  FiMail,
  FiPhone,
  FiAlertCircle,
  FiLock,
} from "react-icons/fi";

import Navbar from "../../components/layout/Navbar/Navbar";
import CloudinaryImage from "../../components/common/CloudinaryImage/CloudinaryImage";
import { useCart } from "../../context/useCart";
import { useAuth } from "../../context/useAuth";
import { createOrder } from "../../services/orderService";
import {
  loadRazorpaySDK,
  createPaymentOrder,
  verifyPayment,
} from "../../services/paymentService";
import "./Checkout.css";

const INDIAN_STATES = [
  "Telangana",
  "Andhra Pradesh",
  "Karnataka",
  "Maharashtra",
  "Tamil Nadu",
  "Kerala",
  "Delhi NCR",
  "Gujarat",
  "Rajasthan",
  "West Bengal",
  "Uttar Pradesh",
  "Punjab",
  "Haryana",
  "Madhya Pradesh",
  "Goa",
  "Other",
];

function Checkout() {
  const navigate = useNavigate();
  const { cart, totalItems, subtotal, shippingFee, total, discount, appliedCoupon, clearCart } = useCart();
  const { user, token } = useAuth();

  const [formData, setFormData] = useState(() => ({
    email: user?.email || "",
    phone: user?.phone || "",
    fullName: user?.name || "",
    address: "",
    apartment: "",
    city: "",
    state: "Telangana",
    pinCode: "",
  }));

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStage, setPaymentStage] = useState("idle"); // 'idle' | 'creating_order' | 'preparing_payment' | 'verifying_payment'
  const [submitError, setSubmitError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error on user edit
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (submitError) {
      setSubmitError("");
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // 1. Email validation
    const emailTrimmed = formData.email.trim();
    if (!emailTrimmed) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      newErrors.email = "Please enter a valid email address (e.g. name@example.com)";
    }

    // 2. Mobile validation (10-digit Indian mobile)
    const rawPhone = formData.phone.replace(/\D/g, "");
    if (!formData.phone.trim()) {
      newErrors.phone = "Mobile number is required";
    } else if (!/^[6-9]\d{9}$/.test(rawPhone)) {
      newErrors.phone = "Please enter a valid 10-digit Indian mobile number";
    }

    // 3. Full Name
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Please enter your full name";
    }

    // 4. Address
    if (!formData.address.trim()) {
      newErrors.address = "Street address is required";
    } else if (formData.address.trim().length < 5) {
      newErrors.address = "Please enter a complete street address";
    }

    // 5. City
    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    // 6. State
    if (!formData.state.trim()) {
      newErrors.state = "Please select a state";
    }

    // 7. PIN Code (6-digit Indian PIN)
    const pinTrimmed = formData.pinCode.trim();
    if (!pinTrimmed) {
      newErrors.pinCode = "PIN Code is required";
    } else if (!/^\d{6}$/.test(pinTrimmed)) {
      newErrors.pinCode = "Please enter a valid 6-digit PIN code";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) {
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    setPaymentStage("creating_order");

    try {
      // 1. Format and create VENSEVEN order
      const orderPayload = {
        customer: {
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
        },
        shippingAddress: {
          address: formData.address.trim(),
          apartment: formData.apartment ? formData.apartment.trim() : "",
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pinCode.trim(),
        },
        items: cart.map((item) => ({
          productId: String(item.id),
          name: item.name,
          slug: item.slug || "",
          image: item.image || "",
          category: item.category || "",
          size: item.size,
          color: item.color || "",
          price: item.numericPrice,
          quantity: item.quantity,
        })),
        pricing: {
          subtotal,
          discount,
          shipping: shippingFee,
          total,
        },
        couponCode: appliedCoupon?.code || undefined,
        paymentMethod: "RAZORPAY",
      };

      const orderResponse = await createOrder(orderPayload, token);

      if (!orderResponse?.success || !orderResponse?.order) {
        throw new Error(orderResponse?.message || "Failed to create order.");
      }

      const createdOrder = orderResponse.order;

      // 2. Prepare Razorpay Payment Order
      setPaymentStage("preparing_payment");

      // Load Razorpay SDK
      const sdkLoaded = await loadRazorpaySDK();
      if (!sdkLoaded) {
        throw new Error(
          "Unable to load secure Razorpay payment SDK. Please verify your internet connection or disable ad/popup blockers and try again."
        );
      }

      // Request Razorpay Order ID from backend
      const paymentOrderData = await createPaymentOrder(createdOrder.orderNumber);

      if (!paymentOrderData?.success || !paymentOrderData?.razorpayOrderId) {
        throw new Error(paymentOrderData?.message || "Failed to initialize payment gateway order.");
      }

      // 3. Configure Razorpay Checkout Popup
      const keyId =
        paymentOrderData.keyId ||
        import.meta.env?.VITE_RAZORPAY_KEY_ID;

      if (!keyId || keyId === "rzp_test_placeholder") {
        throw new Error(
          "Payment gateway key is not configured. Missing Razorpay Key ID (VITE_RAZORPAY_KEY_ID / RAZORPAY_KEY_ID). Please check environment settings."
        );
      }

      const razorpayOptions = {
        key: keyId,
        amount: paymentOrderData.amount,
        currency: paymentOrderData.currency || "INR",
        name: "VENSEVEN",
        description: `Order ${createdOrder.orderNumber}`,
        image: "/logo.png",
        order_id: paymentOrderData.razorpayOrderId,
        prefill: {
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          contact: formData.phone.trim(),
        },
        theme: {
          color: "#25b7ed",
          backdrop_color: "rgba(0, 0, 0, 0.88)",
        },
        handler: async function (response) {
          // Payment completed on client -> verify signature securely on server
          setPaymentStage("verifying_payment");

          try {
            const verificationResponse = await verifyPayment({
              orderNumber: createdOrder.orderNumber,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verificationResponse?.success && verificationResponse?.order) {
              // Clear cart only after verified signature
              clearCart();
              navigate(`/order-success/${createdOrder.orderNumber}`, {
                state: { order: verificationResponse.order },
              });
            } else {
              throw new Error(
                verificationResponse?.message || "Payment verification failed."
              );
            }
          } catch (verifyErr) {
            console.error("[Payment Verification Error]:", verifyErr);
            setSubmitError(
              verifyErr.data?.message ||
                verifyErr.message ||
                "Payment verification failed. Your cart items have been preserved."
            );
            setIsSubmitting(false);
            setPaymentStage("idle");
          }
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
            setPaymentStage("idle");
            setSubmitError(
              "Payment window was closed. Your bag items have been preserved; you can retry anytime."
            );
          },
        },
      };

      let rzpInstance;
      try {
        rzpInstance = new window.Razorpay(razorpayOptions);
      } catch (initErr) {
        console.error("[Razorpay Instantiation Error]:", initErr);
        throw new Error(
          initErr.message ||
            "Failed to open Razorpay payment window. Please check your browser settings or disable popup blockers."
        );
      }

      rzpInstance.on("payment.failed", function (response) {
        console.error("[Razorpay Payment Failed]:", response.error);
        setIsSubmitting(false);
        setPaymentStage("idle");
        const failureReason =
          response.error?.description ||
          response.error?.reason ||
          "Payment was declined or failed. Please try again with a different payment method.";
        setSubmitError(failureReason);
      });

      rzpInstance.open();
    } catch (err) {
      console.error("[Checkout / Payment Error]:", err);
      setSubmitError(
        err.data?.message ||
          err.message ||
          "Failed to process order. Please try again."
      );
      setIsSubmitting(false);
      setPaymentStage("idle");
    }
  };

  const getButtonText = () => {
    if (paymentStage === "verifying_payment") {
      return "VERIFYING PAYMENT...";
    }
    if (paymentStage === "preparing_payment") {
      return "PREPARING SECURE PAYMENT...";
    }
    if (isSubmitting) {
      return "PROCESSING ORDER...";
    }
    return `PAY NOW • ₹${total.toLocaleString()}`;
  };

  return (
    <>
      <Navbar />

      <main className="checkout-page">
        <div className="checkout-container">
          {/* =========================================================
             STATE 1: EMPTY BAG PROTECTION
          ========================================================= */}
          {cart.length === 0 ? (
            <div className="checkout-empty-state">
              <div className="checkout-empty-icon-wrap">
                <FiShoppingBag />
              </div>
              <span className="checkout-eyebrow">ORDER REVIEW</span>
              <h1 className="checkout-empty-title">YOUR BAG IS EMPTY</h1>
              <p className="checkout-empty-subtitle">
                Add something to your bag before checking out.
              </p>
              <Link to="/shop" className="checkout-empty-btn">
                <FiArrowLeft />
                <span>CONTINUE SHOPPING</span>
              </Link>
            </div>
          ) : (
            /* =========================================================
               STATE 2: ACTIVE CHECKOUT TWO-COLUMN LAYOUT
            ========================================================= */
            <div className="checkout-grid">
              {/* Left Column: Refined Editorial Form */}
              <section className="checkout-form-column" aria-label="Customer and Delivery Information">
                <div className="checkout-header">
                  <Link to="/cart" className="checkout-back-link">
                    <FiArrowLeft />
                    <span>Return to Bag</span>
                  </Link>
                  <h1 className="checkout-title">CHECKOUT</h1>
                  <p className="checkout-subtitle">
                    Complete your order and we&apos;ll take care of the rest.
                  </p>
                </div>

                {/* Submission Error Banner */}
                <AnimatePresence mode="wait">
                  {submitError && (
                    <motion.div
                      className="checkout-error-banner"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <FiAlertCircle className="banner-icon" />
                      <div>
                        <strong>Payment Notice</strong>
                        <p>{submitError}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handlePlaceOrder} noValidate className="checkout-form">
                  {/* SECTION 1: CONTACT INFORMATION */}
                  <div className="checkout-step-block">
                    <div className="step-header">
                      <span className="step-num">01</span>
                      <h2 className="step-title">CONTACT INFORMATION</h2>
                    </div>
                    <div className="step-divider" />

                    <div className="checkout-fields-grid">
                      <div className="form-group">
                        <label htmlFor="email" className="form-label">
                          Email Address <span className="req-asterisk">*</span>
                        </label>
                        <div className="input-with-icon">
                          <FiMail className="field-icon" />
                          <input
                            type="email"
                            id="email"
                            name="email"
                            className={`checkout-input ${errors.email ? "input-error" : ""}`}
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={handleInputChange}
                            autoComplete="email"
                            disabled={isSubmitting}
                          />
                        </div>
                        {errors.email && (
                          <span className="field-error-msg">{errors.email}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="phone" className="form-label">
                          Mobile Number <span className="req-asterisk">*</span>
                        </label>
                        <div className="input-with-icon">
                          <FiPhone className="field-icon" />
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            maxLength={10}
                            className={`checkout-input ${errors.phone ? "input-error" : ""}`}
                            placeholder="10-digit mobile number"
                            value={formData.phone}
                            onChange={handleInputChange}
                            autoComplete="tel"
                            disabled={isSubmitting}
                          />
                        </div>
                        {errors.phone && (
                          <span className="field-error-msg">{errors.phone}</span>
                        )}
                        <span className="field-hint">For order tracking & dispatch updates</span>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: DELIVERY ADDRESS */}
                  <div className="checkout-step-block">
                    <div className="step-header">
                      <span className="step-num">02</span>
                      <h2 className="step-title">DELIVERY ADDRESS</h2>
                    </div>
                    <div className="step-divider" />

                    <div className="checkout-fields-grid">
                      <div className="form-group full-width">
                        <label htmlFor="fullName" className="form-label">
                          Full Name <span className="req-asterisk">*</span>
                        </label>
                        <div className="input-with-icon">
                          <FiUser className="field-icon" />
                          <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            className={`checkout-input ${errors.fullName ? "input-error" : ""}`}
                            placeholder="Recipient full name"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            autoComplete="name"
                            disabled={isSubmitting}
                          />
                        </div>
                        {errors.fullName && (
                          <span className="field-error-msg">{errors.fullName}</span>
                        )}
                      </div>

                      <div className="form-group full-width">
                        <label htmlFor="address" className="form-label">
                          Street Address <span className="req-asterisk">*</span>
                        </label>
                        <div className="input-with-icon">
                          <FiMapPin className="field-icon" />
                          <input
                            type="text"
                            id="address"
                            name="address"
                            className={`checkout-input ${errors.address ? "input-error" : ""}`}
                            placeholder="House / Flat / Block No., Street Name"
                            value={formData.address}
                            onChange={handleInputChange}
                            autoComplete="street-address"
                            disabled={isSubmitting}
                          />
                        </div>
                        {errors.address && (
                          <span className="field-error-msg">{errors.address}</span>
                        )}
                      </div>

                      <div className="form-group full-width">
                        <label htmlFor="apartment" className="form-label">
                          Apartment, Suite, Landmark <span className="opt-label">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          id="apartment"
                          name="apartment"
                          className="checkout-input"
                          placeholder="e.g. Near Ramya Ground / Opp. Phase 3"
                          value={formData.apartment}
                          onChange={handleInputChange}
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="city" className="form-label">
                          City <span className="req-asterisk">*</span>
                        </label>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          className={`checkout-input ${errors.city ? "input-error" : ""}`}
                          placeholder="e.g. Hyderabad"
                          value={formData.city}
                          onChange={handleInputChange}
                          autoComplete="address-level2"
                          disabled={isSubmitting}
                        />
                        {errors.city && (
                          <span className="field-error-msg">{errors.city}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="state" className="form-label">
                          State <span className="req-asterisk">*</span>
                        </label>
                        <select
                          id="state"
                          name="state"
                          className={`checkout-select ${errors.state ? "input-error" : ""}`}
                          value={formData.state}
                          onChange={handleInputChange}
                          autoComplete="address-level1"
                          disabled={isSubmitting}
                        >
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                        {errors.state && (
                          <span className="field-error-msg">{errors.state}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="pinCode" className="form-label">
                          PIN Code <span className="req-asterisk">*</span>
                        </label>
                        <input
                          type="text"
                          id="pinCode"
                          name="pinCode"
                          maxLength={6}
                          className={`checkout-input ${errors.pinCode ? "input-error" : ""}`}
                          placeholder="6-digit PIN"
                          value={formData.pinCode}
                          onChange={handleInputChange}
                          autoComplete="postal-code"
                          disabled={isSubmitting}
                        />
                        {errors.pinCode && (
                          <span className="field-error-msg">{errors.pinCode}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: DELIVERY METHOD */}
                  <div className="checkout-step-block">
                    <div className="step-header">
                      <span className="step-num">03</span>
                      <h2 className="step-title">DELIVERY METHOD</h2>
                    </div>
                    <div className="step-divider" />

                    <div className="delivery-method-row">
                      <div className="delivery-radio-wrap">
                        <div className="custom-radio selected" />
                      </div>
                      <div className="delivery-info">
                        <div className="delivery-title-row">
                          <strong className="delivery-title">STANDARD INSURED DELIVERY</strong>
                          <span className="delivery-price">
                            {shippingFee === 0 ? (
                              <span className="free-tag">FREE</span>
                            ) : (
                              `₹${shippingFee}`
                            )}
                          </span>
                        </div>
                        <p className="delivery-desc">
                          Estimated 3–7 business days via premium express courier (Delhivery / BlueDart).
                        </p>
                        {subtotal >= 1999 && (
                          <span className="complimentary-banner">
                            <FiCheckCircle /> Complimentary Shipping Applied (Orders above ₹1,999)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4: PAYMENT METHOD */}
                  <div className="checkout-step-block">
                    <div className="step-header">
                      <span className="step-num">04</span>
                      <h2 className="step-title">PAYMENT GATEWAY</h2>
                    </div>
                    <div className="step-divider" />

                    <div className="payment-placeholder-card">
                      <div className="payment-method-header">
                        <div className="custom-radio selected" />
                        <FiCreditCard className="payment-icon" />
                        <span className="payment-method-name">Razorpay Secure Online Gateway (UPI / Cards / NetBanking)</span>
                      </div>

                      <div className="payment-notice-banner">
                        <FiLock className="notice-icon" />
                        <div className="notice-content">
                          <p className="notice-text">
                            <strong>256-bit Encrypted Transaction</strong>: You will be redirected to the secure Razorpay dialog to complete your transaction via UPI, Debit/Credit Card, or NetBanking.
                          </p>
                          <span className="notice-sub">
                            Your payment is verified with cryptographic signatures before order confirmation.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Place Order CTA Button */}
                  <div className="checkout-submit-area">
                    <button
                      type="submit"
                      className="place-order-btn"
                      disabled={isSubmitting}
                    >
                      <span>{getButtonText()}</span>
                      <FiArrowRight className="btn-arrow" />
                    </button>

                    <p className="checkout-guarantee-note">
                      By placing your order, you agree to VENSEVEN&apos;s Terms of Service and Privacy Policy.
                    </p>
                  </div>
                </form>
              </section>

              {/* Right Column: Refined Sticky Order Summary */}
              <aside className="checkout-summary-column" aria-label="Order Summary">
                <div className="checkout-summary-card">
                  <div className="summary-card-header">
                    <h2 className="summary-title">ORDER SUMMARY</h2>
                    <span className="summary-count-badge">
                      {totalItems} {totalItems === 1 ? "PIECE" : "PIECES"}
                    </span>
                  </div>

                  {/* Cart Items List */}
                  <div className="summary-items-list">
                    {cart.map((item) => {
                      const itemSubtotal = item.numericPrice * item.quantity;
                      return (
                        <div key={`${item.id}-${item.size}`} className="summary-item-row">
                          <div className="summary-item-thumb">
                            <CloudinaryImage
                              src={item.image}
                              alt={item.name}
                              preset="GALLERY_THUMB"
                            />
                            <span className="item-qty-pill">{item.quantity}</span>
                          </div>

                          <div className="summary-item-meta">
                            <span className="summary-item-category">{item.category}</span>
                            <h3 className="summary-item-name">{item.name}</h3>
                            <div className="summary-item-specs">
                              <span className="spec-badge">Size: {item.size}</span>
                              {item.color && (
                                <span className="spec-badge">{item.color}</span>
                              )}
                            </div>
                          </div>

                          <div className="summary-item-price">
                            <strong>₹{itemSubtotal.toLocaleString()}</strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="summary-divider" />

                  {/* Financial Calculations */}
                  <div className="summary-financials">
                    <div className="financial-row">
                      <span>Subtotal</span>
                      <strong>₹{subtotal.toLocaleString()}</strong>
                    </div>

                    {discount > 0 && (
                      <div className="financial-row discount-row">
                        <span>
                          {appliedCoupon?.code ? `${appliedCoupon.code} Discount` : "Promotional Discount"}
                        </span>
                        <strong className="discount-amount">-₹{discount.toLocaleString()}</strong>
                      </div>
                    )}

                    <div className="financial-row">
                      <span>Estimated Shipping</span>
                      <span>
                        {shippingFee === 0 ? (
                          <strong className="free-shipping-tag">FREE</strong>
                        ) : (
                          `₹${shippingFee}`
                        )}
                      </span>
                    </div>

                    <div className="financial-row">
                      <span>Taxes</span>
                      <span className="tax-included-note">Included in MRP</span>
                    </div>

                    <div className="summary-divider" />

                    <div className="financial-row total-row">
                      <span className="total-label">TOTAL TO PAY</span>
                      <strong className="total-amount">₹{total.toLocaleString()}</strong>
                    </div>
                  </div>

                  {/* Refined Trust Indicators */}
                  <div className="checkout-trust-box">
                    <div className="trust-item">
                      <FiShield className="trust-icon" />
                      <div>
                        <strong>Genuine Menswear</strong>
                        <p>Studio crafted in Hyderabad</p>
                      </div>
                    </div>

                    <div className="trust-item">
                      <FiTruck className="trust-icon" />
                      <div>
                        <strong>Insured Express Delivery</strong>
                        <p>Tracked end-to-end</p>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default Checkout;
