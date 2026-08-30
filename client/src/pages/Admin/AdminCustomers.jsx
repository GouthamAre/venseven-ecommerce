import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiSearch,
  FiUsers,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiUserCheck,
} from "react-icons/fi";
import { useAuth } from "../../context/useAuth";
import { getAdminCustomers } from "../../services/adminService";
import "./AdminCustomers.css";

function AdminCustomers() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCustomers = () => {
    if (!token) return;
    setIsLoading(true);
    setErrorMsg("");

    getAdminCustomers(
      {
        page: currentPage,
        limit: 15,
        search: debouncedSearch,
      },
      token
    )
      .then((res) => {
        if (res?.success && Array.isArray(res.customers)) {
          setCustomers(res.customers);
          setTotalPages(res.totalPages || 1);
          setTotalCount(res.count || 0);
        } else {
          setErrorMsg(res?.message || "Failed to load customers.");
        }
      })
      .catch((err) => {
        console.error("[Admin Customers Error]:", err);
        setErrorMsg(err.data?.message || err.message || "Failed to load customers.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (!token) return;
    let isMounted = true;

    getAdminCustomers(
      {
        page: currentPage,
        limit: 15,
        search: debouncedSearch,
      },
      token
    )
      .then((res) => {
        if (isMounted && res?.success && Array.isArray(res.customers)) {
          setCustomers(res.customers);
          setTotalPages(res.totalPages || 1);
          setTotalCount(res.count || 0);
        } else if (isMounted) {
          setErrorMsg(res?.message || "Failed to load customers.");
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("[Admin Customers Error]:", err);
          setErrorMsg(err.data?.message || err.message || "Failed to load customers.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token, currentPage, debouncedSearch]);

  const formatDate = (isoString) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="admin-customers-root">
      {/* Header Row */}
      <div className="customers-header-row">
        <div>
          <span className="customers-eyebrow">CLIENT REGISTRY</span>
          <h1 className="customers-title">REGISTERED CLIENTS ({totalCount})</h1>
        </div>
        <button
          type="button"
          className="refresh-pill-btn"
          onClick={fetchCustomers}
          title="Refresh client list"
        >
          <FiRefreshCw />
          <span>REFRESH</span>
        </button>
      </div>

      {/* Search Input Card */}
      <div className="customers-search-card">
        <div className="search-input-wrapper">
          <FiSearch className="search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search clients by name, email, or mobile..."
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
      </div>

      {/* State Views */}
      {isLoading ? (
        <div className="admin-loading-container">
          <div className="admin-spinner" />
          <p>LOADING CLIENT REGISTRY...</p>
        </div>
      ) : errorMsg ? (
        <div className="admin-error-container">
          <h3>COULD NOT LOAD CLIENTS</h3>
          <p>{errorMsg}</p>
          <button type="button" className="admin-retry-btn" onClick={fetchCustomers}>
            <FiRefreshCw />
            <span>RETRY</span>
          </button>
        </div>
      ) : customers.length === 0 ? (
        <div className="admin-empty-box">
          <FiUsers style={{ fontSize: "2rem", color: "#666", marginBottom: "8px" }} />
          <p>NO REGISTERED CLIENTS FOUND</p>
          <span style={{ fontSize: "0.8rem", color: "#888" }}>
            New customer accounts will automatically appear here upon registration.
          </span>
        </div>
      ) : (
        <>
          <div className="admin-card-container">
            <div className="orders-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>CLIENT NAME</th>
                    <th>EMAIL</th>
                    <th>PHONE</th>
                    <th>JOINED</th>
                    <th>TOTAL ORDERS</th>
                    <th>LIFETIME SPENT</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="client-name-cell">
                          <FiUserCheck className="client-verified-icon" />
                          <strong className="client-name-text">{c.name}</strong>
                        </div>
                      </td>
                      <td>
                        <span className="client-email-text">{c.email}</span>
                      </td>
                      <td>
                        <span className="client-phone-text">
                          {c.phone || "Not specified"}
                        </span>
                      </td>
                      <td>
                        <span className="table-date">{formatDate(c.createdAt)}</span>
                      </td>
                      <td>
                        <span className="orders-count-badge">
                          {c.totalOrders} {c.totalOrders === 1 ? "order" : "orders"}
                        </span>
                      </td>
                      <td>
                        <strong className="table-total">
                          ₹{Number(c.totalSpent || 0).toLocaleString()}
                        </strong>
                      </td>
                      <td>
                        <Link
                          to={`/admin/customers/${c.id}`}
                          className="table-action-link"
                        >
                          <span>VIEW PROFILE</span>
                          <FiChevronRight />
                        </Link>
                      </td>
                    </tr>
                  ))}
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

export default AdminCustomers;
