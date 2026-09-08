import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiShoppingBag,
  FiCalendar,
  FiPackage,
  FiRefreshCw,
  FiChevronRight,
  FiShield,
  FiCreditCard,
} from "react-icons/fi";

import Navbar from "../../components/layout/Navbar/Navbar";
import CloudinaryImage from "../../components/common/CloudinaryImage/CloudinaryImage";
import { useAuth } from "../../context/useAuth";
import { getMyOrders } from "../../services/orderService";
import {
  loadRazorpaySDK,
  createPaymentOrder,
  verifyPayment,
} from "../../services/paymentService";
import "./Orders.css";

function Orders() {
  const navigate = useNavigate();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [activePayingOrder, setActivePayingOrder] = useState(null);

  const handleRetry = () => {
    if (!token) return;
    setIsLoading(true);
    setErrorMsg("");

    getMyOrders(token)
      .then((response) => {
        if (response?.success && Array.isArray(response.orders)) {
          setOrders(response.orders);
        } else {
          setErrorMsg(response?.message || "Failed to load orders");
        }
      })
      .catch((err) => {
        console.error("[Orders]: Failed to fetch order history:", err);
        setErrorMsg(
          err.data?.message || err.message || "Failed to load order history. Please try again."
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Auth Protection: Redirect if unauthenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/account");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Load orders asynchronously on mount
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    let isMounted = true;

    getMyOrders(token)
      .then((response) => {
        if (isMounted && response?.success && Array.isArray(response.orders)) {
          setOrders(response.orders);
          setErrorMsg("");
        } else if (isMounted) {
          setErrorMsg(response?.message || "Failed to load orders");
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("[Orders]: Failed to fetch order history:", err);
          setErrorMsg(
            err.data?.message || err.message || "Failed to load order history. Please try again."
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, token]);

  // Trigger payment for unpaid orders
  const handlePayOrder = async (order) => {
    if (!order || activePayingOrder) return;
    setActivePayingOrder(order.orderNumber);

    try {
      const sdkLoaded = await loadRazorpaySDK();
      if (!sdkLoaded) {
        alert("Unable to load secure payment SDK. Please try again.");
        setActivePayingOrder(null);
        return;
      }

      const paymentOrderData = await createPaymentOrder(order.orderNumber);
      if (!paymentOrderData?.success || !paymentOrderData?.razorpayOrderId) {
        alert(paymentOrderData?.message || "Failed to initialize payment.");
        setActivePayingOrder(null);
        return;
      }

      const keyId =
        paymentOrderData.keyId ||
        import.meta.env?.VITE_RAZORPAY_KEY_ID ||
        "";

      if (!keyId || keyId === "rzp_test_placeholder") {
        alert("Razorpay Key ID is not configured. Please ensure VITE_RAZORPAY_KEY_ID is set.");
        setActivePayingOrder(null);
        return;
      }

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
              setOrders((prev) =>
                prev.map((o) =>
                  o.orderNumber === order.orderNumber ? verificationResponse.order : o
                )
              );
            }
          } catch (verifyErr) {
            console.error("Payment retry verification failed:", verifyErr);
            alert("Payment verification failed. Please contact support.");
          } finally {
            setActivePayingOrder(null);
          }
        },
        modal: {
          ondismiss: function () {
            setActivePayingOrder(null);
          },
        },
      };

      let rzpInstance;
      try {
        rzpInstance = new window.Razorpay(razorpayOptions);
      } catch (sdkInitErr) {
        console.error("Razorpay SDK initialization failed:", sdkInitErr);
        alert("Failed to open Razorpay checkout popup. Please check your network or ad-blocker settings.");
        setActivePayingOrder(null);
        return;
      }

      rzpInstance.on("payment.failed", function (failResponse) {
        console.error("Payment failed on order retry:", failResponse?.error);
        alert(`Payment failed: ${failResponse?.error?.description || "Transaction declined"}`);
        setActivePayingOrder(null);
      });

      rzpInstance.open();
    } catch (err) {
      console.error("Pay order error:", err);
      alert(err.data?.message || err.message || "Payment initialization failed.");
      setActivePayingOrder(null);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <Navbar />

      <main className="orders-page">
        <div className="orders-container">
          {/* Header */}
          <header className="orders-header">
            <span className="orders-eyebrow">CLIENT ARCHIVE</span>
            <h1 className="orders-title">MY ORDERS</h1>
            <p className="orders-subtitle">
              Review your bespoke garment acquisitions, delivery status, and historical reservations.
            </p>
          </header>

          {/* STATE 1: LOADING */}
          {isLoading || authLoading ? (
            <div className="orders-loading-state">
              <div className="orders-spinner" />
              <p>LOADING YOUR ORDER ARCHIVE...</p>
            </div>
          ) : errorMsg ? (
            /* STATE 2: ERROR */
            <div className="orders-error-state">
              <p className="error-title">COULD NOT LOAD ORDERS</p>
              <p className="error-desc">{errorMsg}</p>
              <button
                type="button"
                className="orders-retry-btn"
                onClick={handleRetry}
              >
                <FiRefreshCw />
                <span>RETRY</span>
              </button>
            </div>
          ) : orders.length === 0 ? (
            /* STATE 3: EMPTY ORDERS */
            <div className="orders-empty-state">
              <div className="orders-empty-icon-box">
                <FiPackage />
              </div>
              <span className="empty-eyebrow">ZERO ACQUISITIONS</span>
              <h2 className="empty-title">NO ORDERS YET</h2>
              <p className="empty-subtitle">
                Your bespoke sartorial wardrobe awaits your first selection.
              </p>
              <Link to="/shop" className="orders-explore-btn">
                <FiShoppingBag />
                <span>EXPLORE THE COLLECTION</span>
              </Link>
            </div>
          ) : (
            /* STATE 4: ORDERS LIST */
            <div className="orders-list">
              {orders.map((order) => {
                const isPaid = order.payment?.status === "Paid";
                return (
                  <article key={order.id || order.orderNumber} className="order-card">
                    {/* Order Top Strip */}
                    <div className="order-card-header">
                      <div className="header-meta-group">
                        <span className="order-number-tag">
                          {order.orderNumber}
                        </span>
                        <span className="order-date">
                          <FiCalendar className="date-icon" />
                          {formatDate(order.createdAt)}
                        </span>
                      </div>

                      <div className="header-status-group">
                        <span className={`status-pill ${order.orderStatus?.toLowerCase()}`}>
                          {order.orderStatus}
                        </span>
                        <span className={`status-pill payment ${isPaid ? "paid" : "pending"}`}>
                          {isPaid ? "PAID ✓" : "PAYMENT PENDING"}
                        </span>
                        <strong className="order-card-total">
                          ₹{order.pricing?.total?.toLocaleString()}
                        </strong>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    <div className="order-card-body">
                      <div className="order-card-items-grid">
                        {order.items?.map((item, idx) => (
                          <div key={`${item.productId}-${idx}`} className="order-card-item">
                            <div className="item-thumbnail">
                              <CloudinaryImage
                                src={item.image}
                                alt={item.name}
                                preset="GALLERY_THUMB"
                              />
                              <span className="item-qty-badge">{item.quantity}</span>
                            </div>

                            <div className="item-info">
                              <h4 className="item-name">{item.name}</h4>
                              <div className="item-attributes">
                                <span>Size: {item.size}</span>
                                {item.color && <span>• {item.color}</span>}
                              </div>
                              <span className="item-price">
                                ₹{(item.price * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Card Footer */}
                    <div className="order-card-footer">
                      <div className="footer-delivery-note">
                        <FiShield className="note-icon" />
                        <span>
                          Fulfillment to {order.shippingAddress?.city}, {order.shippingAddress?.state}
                        </span>
                      </div>

                      <div className="order-footer-actions">
                        {!isPaid && (
                          <button
                            type="button"
                            className="order-pay-action-btn"
                            onClick={() => handlePayOrder(order)}
                            disabled={activePayingOrder === order.orderNumber}
                          >
                            <FiCreditCard />
                            <span>
                              {activePayingOrder === order.orderNumber
                                ? "OPENING GATEWAY..."
                                : "COMPLETE PAYMENT"}
                            </span>
                          </button>
                        )}

                        <Link
                          to={`/order-success/${order.orderNumber}`}
                          state={{ order }}
                          className="view-order-details-link"
                        >
                          <span>VIEW CONFIRMATION</span>
                          <FiChevronRight />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default Orders;
