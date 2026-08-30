import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiShoppingBag,
  FiDollarSign,
  FiChevronRight,
  FiRefreshCw,
  FiPackage,
} from "react-icons/fi";
import { useAuth } from "../../context/useAuth";
import { getAdminCustomer } from "../../services/adminService";
import "./AdminCustomerDetail.css";

function AdminCustomerDetail() {
  const { id } = useParams();
  const { token } = useAuth();

  const [customer, setCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const loadCustomer = () => {
    if (!id || !token) return;
    setIsLoading(true);
    setErrorMsg("");

    getAdminCustomer(id, token)
      .then((res) => {
        if (res?.success && res?.customer) {
          setCustomer(res.customer);
        } else {
          setErrorMsg(res?.message || "Failed to load customer profile.");
        }
      })
      .catch((err) => {
        console.error("[Admin Customer Detail Error]:", err);
        setErrorMsg(err.data?.message || err.message || "Failed to load customer.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (!id || !token) return;
    let isMounted = true;

    getAdminCustomer(id, token)
      .then((res) => {
        if (isMounted && res?.success && res?.customer) {
          setCustomer(res.customer);
        } else if (isMounted) {
          setErrorMsg(res?.message || "Failed to load customer profile.");
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("[Admin Customer Detail Error]:", err);
          setErrorMsg(err.data?.message || err.message || "Failed to load customer.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, token]);

  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="admin-loading-container">
        <div className="admin-spinner" />
        <p>LOADING CLIENT PROFILE...</p>
      </div>
    );
  }

  if (errorMsg || !customer) {
    return (
      <div className="admin-error-container">
        <h3>CLIENT NOT FOUND</h3>
        <p>{errorMsg || "Unable to locate customer record."}</p>
        <Link to="/admin/customers" className="admin-retry-btn" style={{ textDecoration: "none" }}>
          <FiArrowLeft />
          <span>RETURN TO CLIENT REGISTRY</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-cust-detail-root">
      {/* Top Breadcrumb */}
      <div className="detail-header-row">
        <div>
          <Link to="/admin/customers" className="detail-back-link">
            <FiArrowLeft />
            <span>Client Registry</span>
          </Link>
          <div className="title-with-pill">
            <h1 className="cust-detail-title">{customer.name}</h1>
            <span className="account-tag linked">VERIFIED CLIENT</span>
          </div>
          <span className="order-placed-date">
            Registered on {formatDate(customer.createdAt)}
          </span>
        </div>

        <button
          type="button"
          className="refresh-pill-btn"
          onClick={loadCustomer}
          title="Reload profile"
        >
          <FiRefreshCw />
          <span>RELOAD</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="cust-metrics-grid">
        <div className="cust-metric-card">
          <div className="metric-icon-wrap orders">
            <FiShoppingBag />
          </div>
          <div>
            <span className="metric-label">LIFETIME ORDERS</span>
            <strong className="metric-val">{customer.totalOrders}</strong>
          </div>
        </div>

        <div className="cust-metric-card highlight">
          <div className="metric-icon-wrap revenue">
            <FiDollarSign />
          </div>
          <div>
            <span className="metric-label">LIFETIME SPENT (PAID)</span>
            <strong className="metric-val">
              ₹{Number(customer.totalSpent || 0).toLocaleString()}
            </strong>
          </div>
        </div>

        <div className="cust-metric-card">
          <div className="metric-icon-wrap date">
            <FiCalendar />
          </div>
          <div>
            <span className="metric-label">MEMBER SINCE</span>
            <strong className="metric-val-date">
              {formatDate(customer.createdAt)}
            </strong>
          </div>
        </div>
      </div>

      {/* Profile Overview and Order History Grid */}
      <div className="cust-content-grid">
        {/* Customer Profile Card */}
        <div className="detail-card">
          <div className="detail-card-header">
            <h2 className="card-heading">CONTACT INFORMATION</h2>
          </div>

          <div className="info-group">
            <div className="info-row">
              <FiUser className="info-icon" />
              <div>
                <span className="info-label">FULL NAME</span>
                <strong className="info-val">{customer.name}</strong>
              </div>
            </div>

            <div className="info-row">
              <FiMail className="info-icon" />
              <div>
                <span className="info-label">EMAIL ADDRESS</span>
                <span className="info-val">{customer.email}</span>
              </div>
            </div>

            <div className="info-row">
              <FiPhone className="info-icon" />
              <div>
                <span className="info-label">MOBILE NUMBER</span>
                <span className="info-val">{customer.phone || "Not specified"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Order History */}
        <div className="detail-card">
          <div className="detail-card-header">
            <h2 className="card-heading">
              ORDER ARCHIVE ({customer.orders?.length || 0})
            </h2>
          </div>

          {customer.orders?.length === 0 ? (
            <div className="admin-empty-box" style={{ padding: "32px 16px" }}>
              <FiPackage style={{ fontSize: "1.6rem", color: "#666", marginBottom: "6px" }} />
              <p>NO ORDERS PLACED YET</p>
            </div>
          ) : (
            <div className="orders-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ORDER NUMBER</th>
                    <th>DATE</th>
                    <th>TOTAL</th>
                    <th>STATUS</th>
                    <th>PAYMENT</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.orders?.map((order) => {
                    const isPaid = order.payment?.status === "Paid";
                    return (
                      <tr key={order.id || order.orderNumber}>
                        <td>
                          <strong className="table-order-num">
                            {order.orderNumber}
                          </strong>
                        </td>
                        <td>
                          <span className="table-date">
                            {formatDate(order.createdAt)}
                          </span>
                        </td>
                        <td>
                          <strong className="table-total">
                            ₹{order.pricing?.total?.toLocaleString()}
                          </strong>
                        </td>
                        <td>
                          <span className={`status-pill ${order.orderStatus?.toLowerCase()}`}>
                            {order.orderStatus}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill payment ${isPaid ? "paid" : "pending"}`}>
                            {isPaid ? "PAID ✓" : "PENDING"}
                          </span>
                        </td>
                        <td>
                          <Link
                            to={`/admin/orders/${order.orderNumber}`}
                            className="table-action-link"
                          >
                            <span>VIEW ORDER</span>
                            <FiChevronRight />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminCustomerDetail;
