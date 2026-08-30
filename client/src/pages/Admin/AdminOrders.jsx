import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiSearch,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiPackage,
} from "react-icons/fi";
import { useAuth } from "../../context/useAuth";
import { getAdminOrders } from "../../services/adminService";
import "./AdminOrders.css";

const STATUS_FILTERS = [
  "ALL",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const PAYMENT_FILTERS = ["ALL", "Paid", "Pending", "Failed"];

function AdminOrders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [paymentStatus, setPaymentStatus] = useState("ALL");

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Load orders
  const fetchOrders = () => {
    if (!token) return;
    setIsLoading(true);
    setErrorMsg("");

    getAdminOrders(
      {
        page: currentPage,
        limit: 15,
        status,
        paymentStatus,
        search: debouncedSearch,
      },
      token
    )
      .then((res) => {
        if (res?.success && Array.isArray(res.orders)) {
          setOrders(res.orders);
          setTotalPages(res.totalPages || 1);
          setTotalCount(res.count || 0);
        } else {
          setErrorMsg(res?.message || "Failed to load orders.");
        }
      })
      .catch((err) => {
        console.error("[Admin Orders Load Error]:", err);
        setErrorMsg(err.data?.message || err.message || "Failed to load orders.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (!token) return;
    let isMounted = true;

    getAdminOrders(
      {
        page: currentPage,
        limit: 15,
        status,
        paymentStatus,
        search: debouncedSearch,
      },
      token
    )
      .then((res) => {
        if (isMounted && res?.success && Array.isArray(res.orders)) {
          setOrders(res.orders);
          setTotalPages(res.totalPages || 1);
          setTotalCount(res.count || 0);
        } else if (isMounted) {
          setErrorMsg(res?.message || "Failed to load orders.");
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("[Admin Orders Load Error]:", err);
          setErrorMsg(err.data?.message || err.message || "Failed to load orders.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token, currentPage, status, paymentStatus, debouncedSearch]);

  const formatDate = (isoString) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="admin-orders-root">
      {/* Page Header */}
      <div className="orders-header-row">
        <div>
          <span className="orders-eyebrow">ORDER MANAGEMENT</span>
          <h1 className="orders-title">ALL ORDERS ({totalCount})</h1>
        </div>
        <button
          type="button"
          className="refresh-pill-btn"
          onClick={fetchOrders}
          title="Refresh orders"
        >
          <FiRefreshCw />
          <span>REFRESH</span>
        </button>
      </div>

      {/* Control Bar: Search & Status Filters */}
      <div className="orders-controls-card">
        <div className="search-input-wrapper">
          <FiSearch className="search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search order number, customer name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearch("")}
            >
              ×
            </button>
          )}
        </div>

        {/* Status Filters */}
        <div className="filters-container">
          <div className="filter-group">
            <span className="filter-group-label">
              <FiFilter /> STATUS:
            </span>
            <div className="filter-chips">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`filter-chip ${status === s ? "active" : ""}`}
                  onClick={() => {
                    setStatus(s);
                    setCurrentPage(1);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-group-label">PAYMENT:</span>
            <div className="filter-chips">
              {PAYMENT_FILTERS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`filter-chip ${paymentStatus === p ? "active" : ""}`}
                  onClick={() => {
                    setPaymentStatus(p);
                    setCurrentPage(1);
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content State */}
      {isLoading ? (
        <div className="admin-loading-container">
          <div className="admin-spinner" />
          <p>RETRIEVING ORDERS LIST...</p>
        </div>
      ) : errorMsg ? (
        <div className="admin-error-container">
          <h3>COULD NOT LOAD ORDERS</h3>
          <p>{errorMsg}</p>
          <button type="button" className="admin-retry-btn" onClick={fetchOrders}>
            <FiRefreshCw />
            <span>RETRY</span>
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="admin-empty-box">
          <FiPackage style={{ fontSize: "2rem", color: "#666", marginBottom: "8px" }} />
          <p>NO ORDERS MATCHED YOUR SELECTION</p>
          <span style={{ fontSize: "0.8rem", color: "#888" }}>
            Try adjusting your search criteria or status filter.
          </span>
        </div>
      ) : (
        <>
          <div className="admin-card-container">
            <div className="orders-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ORDER NUMBER</th>
                    <th>CUSTOMER</th>
                    <th>DESTINATION</th>
                    <th>DATE</th>
                    <th>ITEMS</th>
                    <th>TOTAL</th>
                    <th>ORDER STATUS</th>
                    <th>PAYMENT</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const isPaid = order.payment?.status === "Paid";
                    return (
                      <tr key={order.id || order.orderNumber}>
                        <td>
                          <strong className="table-order-num">
                            {order.orderNumber}
                          </strong>
                        </td>
                        <td>
                          <div className="table-customer-meta">
                            <span className="cust-name">{order.customer?.name}</span>
                            <span className="cust-email">{order.customer?.email}</span>
                          </div>
                        </td>
                        <td>
                          <span className="table-dest">
                            {order.shippingAddress?.city}, {order.shippingAddress?.state}
                          </span>
                        </td>
                        <td>
                          <span className="table-date">{formatDate(order.createdAt)}</span>
                        </td>
                        <td>
                          <span className="table-item-count">
                            {order.items?.length || 0} {order.items?.length === 1 ? "item" : "items"}
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
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="admin-pagination">
              <button
                type="button"
                className="page-nav-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <FiChevronLeft /> PREV
              </button>
              <span className="page-indicator">
                PAGE {currentPage} OF {totalPages}
              </span>
              <button
                type="button"
                className="page-nav-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                NEXT <FiChevronRight />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminOrders;
