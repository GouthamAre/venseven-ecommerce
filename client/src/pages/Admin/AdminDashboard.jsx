import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiDollarSign,
  FiShoppingBag,
  FiUsers,
  FiCheckCircle,
  FiClock,
  FiArrowRight,
  FiRefreshCw,
  FiChevronRight,
} from "react-icons/fi";
import { useAuth } from "../../context/useAuth";
import { getDashboard } from "../../services/adminService";
import "./AdminDashboard.css";

function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = () => {
    if (!token) return;
    setIsLoading(true);
    setErrorMsg("");

    getDashboard(token)
      .then((res) => {
        if (res?.success && res?.stats) {
          setStats(res.stats);
        } else {
          setErrorMsg(res?.message || "Failed to load dashboard metrics.");
        }
      })
      .catch((err) => {
        console.error("[Dashboard Load Error]:", err);
        setErrorMsg(err.data?.message || err.message || "Failed to load dashboard metrics.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (!token) return;
    let isMounted = true;

    getDashboard(token)
      .then((res) => {
        if (isMounted && res?.success && res?.stats) {
          setStats(res.stats);
        } else if (isMounted) {
          setErrorMsg(res?.message || "Failed to load dashboard metrics.");
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("[Dashboard Load Error]:", err);
          setErrorMsg(err.data?.message || err.message || "Failed to load dashboard metrics.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const formatDate = (isoString) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="admin-loading-container">
        <div className="admin-spinner" />
        <p>LOADING STORE METRICS...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="admin-error-container">
        <h3>COULD NOT LOAD DASHBOARD</h3>
        <p>{errorMsg}</p>
        <button type="button" className="admin-retry-btn" onClick={loadData}>
          <FiRefreshCw />
          <span>RETRY</span>
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-root">
      {/* Page Header */}
      <div className="dashboard-header-row">
        <div>
          <span className="dashboard-eyebrow">STORE PERFORMANCE</span>
          <h1 className="dashboard-title">OVERVIEW</h1>
        </div>
        <button type="button" className="refresh-pill-btn" onClick={loadData} title="Refresh data">
          <FiRefreshCw />
          <span>REFRESH</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card highlight">
          <div className="kpi-icon-wrap revenue">
            <FiDollarSign />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">TOTAL REVENUE (PAID)</span>
            <strong className="kpi-value">₹{stats?.totalRevenue?.toLocaleString() || 0}</strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap orders">
            <FiShoppingBag />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">TOTAL ORDERS</span>
            <strong className="kpi-value">{stats?.totalOrders || 0}</strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap customers">
            <FiUsers />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">REGISTERED CLIENTS</span>
            <strong className="kpi-value">{stats?.totalCustomers || 0}</strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap paid">
            <FiCheckCircle />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">VERIFIED PAYMENTS</span>
            <strong className="kpi-value">{stats?.paidOrders || 0}</strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap pending">
            <FiClock />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">PENDING SETTLEMENT</span>
            <strong className="kpi-value">{stats?.pendingPayments || 0}</strong>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="dashboard-section">
        <div className="section-header-row">
          <div>
            <h2 className="section-title">RECENT ORDERS</h2>
            <p className="section-subtitle">Latest client acquisitions across storefront</p>
          </div>
          <Link to="/admin/orders" className="section-view-all">
            <span>VIEW ALL ORDERS</span>
            <FiArrowRight />
          </Link>
        </div>

        {stats?.recentOrders?.length === 0 ? (
          <div className="admin-empty-box">
            <p>NO ORDERS RECORDED YET</p>
          </div>
        ) : (
          <div className="orders-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ORDER NUMBER</th>
                  <th>CUSTOMER</th>
                  <th>DATE</th>
                  <th>TOTAL</th>
                  <th>ORDER STATUS</th>
                  <th>PAYMENT</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentOrders?.map((order) => {
                  const isPaid = order.payment?.status === "Paid";
                  return (
                    <tr key={order.id || order.orderNumber}>
                      <td>
                        <strong className="table-order-num">{order.orderNumber}</strong>
                      </td>
                      <td>
                        <div className="table-customer-meta">
                          <span className="cust-name">{order.customer?.name}</span>
                          <span className="cust-email">{order.customer?.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className="table-date">{formatDate(order.createdAt)}</span>
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
                          <span>DETAILS</span>
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
  );
}

export default AdminDashboard;
