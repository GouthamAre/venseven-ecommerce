import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCheckCircle,
  FiAlertTriangle,
  FiRefreshCw,
} from "react-icons/fi";
import CloudinaryImage from "../../components/common/CloudinaryImage/CloudinaryImage";
import { useAuth } from "../../context/useAuth";
import { getAdminOrder, updateOrderStatus } from "../../services/adminService";
import "./AdminOrderDetail.css";

const ALLOWED_STATUSES = [
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

function AdminOrderDetail() {
  const { orderNumber } = useParams();
  const { token } = useAuth();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Cancel Confirmation Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);

  const loadOrderDetail = () => {
    if (!orderNumber || !token) return;
    setIsLoading(true);
    setErrorMsg("");

    getAdminOrder(orderNumber, token)
      .then((res) => {
        if (res?.success && res?.order) {
          setOrder(res.order);
        } else {
          setErrorMsg(res?.message || "Failed to retrieve order details.");
        }
      })
      .catch((err) => {
        console.error("[Admin Order Detail Error]:", err);
        setErrorMsg(err.data?.message || err.message || "Failed to load order.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (!orderNumber || !token) return;
    let isMounted = true;

    getAdminOrder(orderNumber, token)
      .then((res) => {
        if (isMounted && res?.success && res?.order) {
          setOrder(res.order);
        } else if (isMounted) {
          setErrorMsg(res?.message || "Failed to retrieve order details.");
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("[Admin Order Detail Error]:", err);
          setErrorMsg(err.data?.message || err.message || "Failed to load order.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [orderNumber, token]);

  const handleStatusChange = async (newStatus) => {
    if (newStatus === "Cancelled") {
      setShowCancelModal(true);
      return;
    }
    await executeStatusUpdate(newStatus);
  };

  const executeStatusUpdate = async (newStatus) => {
    if (!token || !orderNumber || statusUpdating) return;
    setStatusUpdating(true);
    setStatusMessage("");

    try {
      const res = await updateOrderStatus(orderNumber, newStatus, token);
      if (res?.success && res?.order) {
        setOrder((prev) => ({
          ...prev,
          orderStatus: res.order.orderStatus,
          updatedAt: res.order.updatedAt,
        }));
        setStatusMessage(`Order fulfillment status updated to "${newStatus}".`);
        setShowCancelModal(false);
      } else {
        throw new Error(res?.message || "Status update failed.");
      }
    } catch (err) {
      console.error("[Status Update Error]:", err);
      alert(err.data?.message || err.message || "Could not update status.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (isLoading) {
    return (
      <div className="admin-loading-container">
        <div className="admin-spinner" />
        <p>LOADING ORDER RECORD...</p>
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="admin-error-container">
        <h3>ORDER NOT FOUND</h3>
        <p>{errorMsg || "Unable to locate requested order record."}</p>
        <Link to="/admin/orders" className="admin-retry-btn" style={{ textDecoration: "none" }}>
          <FiArrowLeft />
          <span>RETURN TO ORDERS</span>
        </Link>
      </div>
    );
  }

  const isPaid = order.payment?.status === "Paid";

  return (
    <div className="admin-order-detail-root">
      {/* Top Breadcrumb Header */}
      <div className="detail-header-row">
        <div>
          <Link to="/admin/orders" className="detail-back-link">
            <FiArrowLeft />
            <span>All Orders</span>
          </Link>
          <div className="title-with-pill">
            <h1 className="order-detail-title">{order.orderNumber}</h1>
            <span className={`status-pill ${order.orderStatus?.toLowerCase()}`}>
              {order.orderStatus}
            </span>
            <span className={`status-pill payment ${isPaid ? "paid" : "pending"}`}>
              {isPaid ? "PAID ✓" : "PAYMENT PENDING"}
            </span>
          </div>
          <span className="order-placed-date">
            Registered on {formatDate(order.createdAt)}
          </span>
        </div>

        <button
          type="button"
          className="refresh-pill-btn"
          onClick={loadOrderDetail}
          title="Reload order"
        >
          <FiRefreshCw />
          <span>RELOAD</span>
        </button>
      </div>

      {statusMessage && (
        <div className="status-success-banner">
          <FiCheckCircle />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Two Column Order Detail Layout */}
      <div className="detail-grid">
        {/* Left Column: Items & Fulfillment Status Control */}
        <div className="detail-left-column">
          {/* Status Control Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h2 className="card-heading">FULFILLMENT STATUS</h2>
              <span className="fulfillment-note">Payment status remains isolated</span>
            </div>

            <div className="status-button-strip">
              {ALLOWED_STATUSES.map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`status-btn ${order.orderStatus === st ? "current" : ""} ${
                    st === "Cancelled" ? "cancel-btn" : ""
                  }`}
                  disabled={order.orderStatus === st || statusUpdating}
                  onClick={() => handleStatusChange(st)}
                >
                  {statusUpdating && order.orderStatus !== st ? "UPDATING..." : st}
                </button>
              ))}
            </div>
          </div>

          {/* Reserved Garments List */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h2 className="card-heading">
                RESERVED GARMENTS ({order.items?.length || 0})
              </h2>
            </div>

            <div className="detail-items-list">
              {order.items?.map((item, idx) => (
                <div key={`${item.productId}-${idx}`} className="detail-item-row">
                  <div className="item-thumb-box">
                    <CloudinaryImage
                      src={item.image}
                      alt={item.name}
                      preset="GALLERY_THUMB"
                    />
                  </div>

                  <div className="item-meta-column">
                    <span className="item-cat-tag">{item.category}</span>
                    <h3 className="item-name-heading">{item.name}</h3>
                    <div className="item-spec-tags">
                      <span>Size: {item.size}</span>
                      {item.color && <span>Color: {item.color}</span>}
                      <span>Qty: {item.quantity}</span>
                    </div>
                  </div>

                  <div className="item-pricing-column">
                    <span className="item-unit-price">
                      ₹{Number(item.price).toLocaleString()} × {item.quantity}
                    </span>
                    <strong className="item-line-total">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Customer, Shipping, Financials, Payment */}
        <div className="detail-right-column">
          {/* Customer Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h2 className="card-heading">CUSTOMER PROFILE</h2>
              {order.user ? (
                <Link to={`/admin/customers/${order.user._id || order.user.id || order.user}`} className="account-tag linked">
                  REGISTERED CLIENT
                </Link>
              ) : (
                <span className="account-tag guest">GUEST ORDER</span>
              )}
            </div>

            <div className="info-group">
              <div className="info-row">
                <FiUser className="info-icon" />
                <div>
                  <span className="info-label">NAME</span>
                  <strong className="info-val">{order.customer?.name}</strong>
                </div>
              </div>

              <div className="info-row">
                <FiMail className="info-icon" />
                <div>
                  <span className="info-label">EMAIL</span>
                  <span className="info-val">{order.customer?.email}</span>
                </div>
              </div>

              <div className="info-row">
                <FiPhone className="info-icon" />
                <div>
                  <span className="info-label">PHONE</span>
                  <span className="info-val">{order.customer?.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h2 className="card-heading">DELIVERY DESTINATION</h2>
            </div>

            <div className="info-row">
              <FiMapPin className="info-icon" />
              <div className="address-block">
                <p>{order.shippingAddress?.address}</p>
                {order.shippingAddress?.apartment && (
                  <p>{order.shippingAddress.apartment}</p>
                )}
                <p>
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} -{" "}
                  {order.shippingAddress?.pincode}
                </p>
                <p>{order.shippingAddress?.country || "India"}</p>
              </div>
            </div>
          </div>

          {/* Payment & Financial Breakdown */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h2 className="card-heading">FINANCIAL SUMMARY</h2>
            </div>

            <div className="financial-rows">
              <div className="fin-row">
                <span>Subtotal</span>
                <strong>₹{order.pricing?.subtotal?.toLocaleString()}</strong>
              </div>

              <div className="fin-row">
                <span>Insured Shipping</span>
                <span>
                  {order.pricing?.shipping === 0 ? (
                    <strong className="free-shipping-tag">FREE</strong>
                  ) : (
                    `₹${order.pricing?.shipping}`
                  )}
                </span>
              </div>

              <div className="fin-divider" />

              <div className="fin-row total">
                <span className="fin-total-label">TOTAL AMOUNT</span>
                <strong className="fin-total-price">
                  ₹{order.pricing?.total?.toLocaleString()}
                </strong>
              </div>
            </div>

            <div className="payment-metadata-box">
              <div className="pay-meta-row">
                <span className="pay-label">METHOD:</span>
                <span className="pay-val">{order.payment?.method || "RAZORPAY"}</span>
              </div>
              {order.payment?.razorpayOrderId && (
                <div className="pay-meta-row">
                  <span className="pay-label">RAZORPAY ORDER:</span>
                  <span className="pay-val code">{order.payment.razorpayOrderId}</span>
                </div>
              )}
              {order.payment?.razorpayPaymentId && (
                <div className="pay-meta-row">
                  <span className="pay-label">PAYMENT ID:</span>
                  <span className="pay-val code">{order.payment.razorpayPaymentId}</span>
                </div>
              )}
              <div className="pay-meta-row">
                <span className="pay-label">PAID TIMESTAMP:</span>
                <span className="pay-val">
                  {order.payment?.paidAt ? formatDate(order.payment.paidAt) : "Pending"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box">
            <div className="modal-icon-wrap warning">
              <FiAlertTriangle />
            </div>
            <h3 className="modal-title">CANCEL ORDER RESERVATION</h3>
            <p className="modal-desc">
              Are you sure you want to mark order <strong>{order.orderNumber}</strong> as{" "}
              <strong>Cancelled</strong>? This updates the fulfillment lifecycle.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="modal-btn cancel"
                onClick={() => setShowCancelModal(false)}
              >
                DISMISS
              </button>
              <button
                type="button"
                className="modal-btn danger"
                onClick={() => executeStatusUpdate("Cancelled")}
                disabled={statusUpdating}
              >
                {statusUpdating ? "CANCELLING..." : "CONFIRM CANCELLATION"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrderDetail;
