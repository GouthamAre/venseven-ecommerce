import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import {
  FiCheckCircle,
  FiArrowRight,
  FiShoppingBag,
  FiTruck,
  FiPackage,
  FiShield,
  FiMail,
  FiCreditCard,
  FiAlertTriangle,
} from "react-icons/fi";

import Navbar from "../../components/layout/Navbar/Navbar";
import CloudinaryImage from "../../components/common/CloudinaryImage/CloudinaryImage";
import { useAuth } from "../../context/useAuth";
import { getOrder } from "../../services/orderService";
import {
  loadRazorpaySDK,
  createPaymentOrder,
  verifyPayment,
} from "../../services/paymentService";
import "./OrderSuccess.css";

function OrderSuccess() {
  const { orderNumber } = useParams();
  const location = useLocation();
  const { token, isAuthenticated } = useAuth();

  const [order, setOrder] = useState(() => location.state?.order || null);
  const [isLoading, setIsLoading] = useState(!location.state?.order);
  const [fetchError, setFetchError] = useState("");
  const [isRetryingPayment, setIsRetryingPayment] = useState(false);
  const [paymentRetryError, setPaymentRetryError] = useState("");

  useEffect(() => {
    // If order was passed via navigation state, we already have it
    if (order) return;

    let isMounted = true;
    async function loadOrder() {
      if (!orderNumber) return;
      setIsLoading(true);
      try {
        const response = await getOrder(orderNumber, token);
        if (isMounted && response?.success && response?.order) {
          setOrder(response.order);
        }
      } catch (err) {
        if (isMounted) {
          setFetchError(err.data?.message || err.message || "Unable to load order details.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadOrder();

    return () => {
      isMounted = false;
    };
  }, [orderNumber, token, order]);

  // Retry payment action for unpaid / pending orders
  const handleRetryPayment = async () => {
    if (!order || isRetryingPayment) return;
    setIsRetryingPayment(true);
    setPaymentRetryError("");

    try {
      const sdkLoaded = await loadRazorpaySDK();
      if (!sdkLoaded) {
        throw new Error("Unable to load secure payment SDK. Please try again.");
      }

      const paymentOrderData = await createPaymentOrder(order.orderNumber);
      if (!paymentOrderData?.success || !paymentOrderData?.razorpayOrderId) {
        throw new Error(paymentOrderData?.message || "Failed to initialize payment.");
      }

      const keyId =
        paymentOrderData.keyId ||
        import.meta.env?.VITE_RAZORPAY_KEY_ID ||
        "rzp_test_placeholder";

      const razorpayOptions = {
        key: keyId,
        amount: paymentOrderData.amount,
        currency: paymentOrderData.currency || "INR",
        name: "VENSEVEN",
        description: `Order ${order.orderNumber}`,
        image: "/logo.png",
        order_id: paymentOrderData.razorpayOrderId,
        prefill: {
          name: order.customer?.name,
          email: order.customer?.email,
          contact: order.customer?.phone,
        },
        theme: {
          color: "#25b7ed",
          backdrop_color: "rgba(0, 0, 0, 0.88)",
        },
        handler: async function (response) {
          try {
            const verificationResponse = await verifyPayment({
              orderNumber: order.orderNumber,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verificationResponse?.success && verificationResponse?.order) {
              setOrder(verificationResponse.order);
            }
          } catch (verifyErr) {
            console.error("Payment retry verification failed:", verifyErr);
            setPaymentRetryError(verifyErr.data?.message || verifyErr.message || "Payment verification failed.");
          } finally {
            setIsRetryingPayment(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsRetryingPayment(false);
          },
        },
      };

      const rzpInstance = new window.Razorpay(razorpayOptions);
      rzpInstance.open();
    } catch (err) {
      console.error("Retry payment error:", err);
      setPaymentRetryError(err.data?.message || err.message || "Payment initialization failed.");
      setIsRetryingPayment(false);
    }
  };

  const isPaid = order?.payment?.status === "Paid";

  return (
    <>
      <Navbar />

      <main className="order-success-page">
        <div className="order-success-container">
          {isLoading ? (
            <div className="order-success-loading">
              <div className="order-spinner" />
              <p>RETRIEVING ORDER CONFIRMATION...</p>
            </div>
          ) : fetchError && !order ? (
            <div className="order-success-error">
              <h1 className="order-error-title">ORDER REFERENCE</h1>
              <p className="order-error-num">{orderNumber}</p>
              <p className="order-error-desc">
                Your order has been recorded. Confirmation details have been routed to your registered contact.
              </p>
              <div className="order-success-actions">
                <Link to="/shop" className="order-btn-primary">
                  <span>CONTINUE SHOPPING</span>
                  <FiArrowRight />
                </Link>
                {isAuthenticated && (
                  <Link to="/orders" className="order-btn-secondary">
                    <span>VIEW MY ORDERS</span>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="order-success-card">
              {/* Header */}
              <div className="order-success-header">
                <div className="success-icon-badge">
                  {isPaid ? <FiCheckCircle /> : <FiAlertTriangle />}
                </div>
                <span className="success-eyebrow">
                  {isPaid ? "ORDER & PAYMENT CONFIRMED" : "ORDER REGISTERED"}
                </span>
                <h1 className="success-title">
                  {isPaid ? "THANK YOU FOR YOUR RESERVATION" : "PAYMENT PENDING FOR YOUR ORDER"}
                </h1>
                <p className="success-subtitle">
                  {isPaid
                    ? `Your payment has been verified. A confirmation receipt has been sent to ${order?.customer?.email}.`
                    : `Your order reservation is saved. Please complete online settlement for express dispatch to ${order?.customer?.email}.`}
                </p>
              </div>

              {/* Payment Retry Error Banner */}
              {paymentRetryError && (
                <div className="order-retry-error-banner">
                  <FiAlertTriangle />
                  <span>{paymentRetryError}</span>
                </div>
              )}

              {/* Order Meta Bar */}
              <div className="order-meta-bar">
                <div className="meta-block">
                  <span className="meta-label">ORDER NUMBER</span>
                  <strong className="meta-value order-ref-num">{order?.orderNumber || orderNumber}</strong>
                </div>
                <div className="meta-block">
                  <span className="meta-label">ORDER STATUS</span>
                  <span className="meta-badge-confirmed">
                    {order?.orderStatus || "Confirmed"}
                  </span>
                </div>
                <div className="meta-block">
                  <span className="meta-label">PAYMENT STATUS</span>
                  {isPaid ? (
                    <span className="meta-badge-confirmed">PAID ✓</span>
                  ) : (
                    <span className="meta-badge-pending">PAYMENT PENDING</span>
                  )}
                </div>
                <div className="meta-block">
                  <span className="meta-label">ESTIMATED DISPATCH</span>
                  <span className="meta-value">3–5 Business Days</span>
                </div>
              </div>

              {/* Items List */}
              {order?.items && order.items.length > 0 && (
                <div className="order-items-section">
                  <h3 className="section-heading">RESERVED PIECES ({order.items.length})</h3>

                  <div className="order-items-grid">
                    {order.items.map((item, idx) => (
                      <div key={`${item.productId}-${idx}`} className="order-item-card">
                        <div className="order-item-thumb">
                          <CloudinaryImage
                            src={item.image}
                            alt={item.name}
                            preset="GALLERY_THUMB"
                          />
                        </div>
                        <div className="order-item-details">
                          {item.category && (
                            <span className="item-cat-label">{item.category}</span>
                          )}
                          <h4 className="item-title">{item.name}</h4>
                          <div className="item-tags">
                            <span className="item-spec">Size: {item.size}</span>
                            {item.color && (
                              <span className="item-spec">{item.color}</span>
                            )}
                            <span className="item-spec">Qty: {item.quantity}</span>
                          </div>
                          <strong className="item-cost">
                            ₹{(item.price * item.quantity).toLocaleString()}
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Financials & Studio Delivery Summary */}
              <div className="order-summary-footer-grid">
                <div className="order-shipping-summary">
                  <h4 className="footer-box-title">DELIVERY INFORMATION</h4>
                  <p className="shipping-recipient">
                    <strong>{order?.customer?.name}</strong>
                  </p>
                  <p className="shipping-address-line">
                    {order?.shippingAddress?.address}
                    {order?.shippingAddress?.apartment ? `, ${order.shippingAddress.apartment}` : ""}
                  </p>
                  <p className="shipping-city-line">
                    {order?.shippingAddress?.city}, {order?.shippingAddress?.state} - {order?.shippingAddress?.pincode}
                  </p>
                  <p className="shipping-contact-line">
                    <FiMail /> {order?.customer?.email}
                  </p>
                </div>

                <div className="order-financial-breakdown">
                  <h4 className="footer-box-title">PAYMENT BREAKDOWN</h4>
                  <div className="breakdown-row">
                    <span>Subtotal</span>
                    <strong>₹{order?.pricing?.subtotal?.toLocaleString()}</strong>
                  </div>
                  <div className="breakdown-row">
                    <span>Shipping</span>
                    <span>
                      {order?.pricing?.shipping === 0 ? (
                        <strong className="free-tag">FREE</strong>
                      ) : (
                        `₹${order?.pricing?.shipping}`
                      )}
                    </span>
                  </div>
                  <div className="breakdown-divider" />
                  <div className="breakdown-row total-row">
                    <span className="total-label">TOTAL AMOUNT</span>
                    <strong className="total-price">₹{order?.pricing?.total?.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Trust Notes */}
              <div className="order-trust-strip">
                <div className="trust-strip-item">
                  <FiPackage className="strip-icon" />
                  <span>Insured Express Packaging</span>
                </div>
                <div className="trust-strip-item">
                  <FiTruck className="strip-icon" />
                  <span>Tracking Details via SMS &amp; Email</span>
                </div>
                <div className="trust-strip-item">
                  <FiShield className="strip-icon" />
                  <span>Studio Authenticity Guarantee</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="order-success-actions">
                {!isPaid && (
                  <button
                    type="button"
                    className="order-btn-primary retry-payment-btn"
                    onClick={handleRetryPayment}
                    disabled={isRetryingPayment}
                  >
                    <FiCreditCard />
                    <span>
                      {isRetryingPayment
                        ? "OPENING GATEWAY..."
                        : `PAY NOW • ₹${order?.pricing?.total?.toLocaleString()}`}
                    </span>
                  </button>
                )}

                <Link to="/shop" className={isPaid ? "order-btn-primary" : "order-btn-secondary"}>
                  <FiShoppingBag />
                  <span>CONTINUE SHOPPING</span>
                </Link>

                {isAuthenticated && (
                  <Link to="/orders" className="order-btn-secondary">
                    <span>VIEW MY ORDERS</span>
                    <FiArrowRight />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default OrderSuccess;
