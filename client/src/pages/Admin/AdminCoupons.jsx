import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FiTag,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiTrendingUp,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";
import { useAuth } from "../../context/useAuth";
import {
  getAdminCoupons,
  updateCouponStatus,
  deleteCoupon,
} from "../../services/couponService";
import "./AdminCoupons.css";

function AdminCoupons() {
  const { token } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL"); // ALL | ACTIVE | EXPIRED | DISABLED
  const [actionLoading, setActionLoading] = useState(null); // couponId being toggled/deleted
  const [toastMessage, setToastMessage] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;
    if (!token) return;

    async function load() {
      try {
        const res = await getAdminCoupons({ search, filter }, token);
        if (isMounted) {
          if (res.success) {
            setCoupons(res.coupons || []);
            if (res.stats) setStats(res.stats);
          } else {
            setError(res.message || "Failed to load coupons.");
          }
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setError("Network error loading coupons.");
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [token, search, filter, refreshTrigger]);

  const handleRefresh = () => {
    setLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  };

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  }, []);

  const handleToggleStatus = async (coupon) => {
    if (!token || actionLoading) return;
    setActionLoading(coupon.id || coupon._id);

    try {
      const nextStatus = !coupon.isActive;
      const res = await updateCouponStatus(coupon.id || coupon._id, nextStatus, token);

      if (res.success) {
        setCoupons((prev) =>
          prev.map((c) =>
            (c.id || c._id) === (coupon.id || coupon._id)
              ? { ...c, isActive: nextStatus }
              : c
          )
        );
        showToast(res.message || `Coupon status updated.`);
      } else {
        showToast(res.message || "Failed to update status.");
      }
    } catch {
      showToast("Error updating status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCoupon = async (coupon) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete coupon "${coupon.code}"?`
    );
    if (!confirmDelete || !token || actionLoading) return;

    setActionLoading(coupon.id || coupon._id);

    try {
      const res = await deleteCoupon(coupon.id || coupon._id, token);
      if (res.success) {
        setCoupons((prev) =>
          prev.filter((c) => (c.id || c._id) !== (coupon.id || coupon._id))
        );
        showToast(`Coupon "${coupon.code}" removed.`);
      } else {
        showToast(res.message || "Failed to delete coupon.");
      }
    } catch {
      showToast("Error deleting coupon.");
    } finally {
      setActionLoading(null);
    }
  };

  const totalRedemptions = coupons.reduce(
    (acc, c) => acc + (Number(c.usageCount) || 0),
    0
  );

  return (
    <div className="admin-coupons-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="admin-toast-banner">
          <FiCheckCircle />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">PROMOTIONS & DISCOUNTS</span>
          <h1 className="admin-page-title">COUPON MANAGEMENT</h1>
        </div>
        <div className="admin-header-actions">
          <button
            type="button"
            className="admin-refresh-btn"
            onClick={handleRefresh}
            title="Refresh List"
          >
            <FiRefreshCw className={loading ? "spin-icon" : ""} />
          </button>
          <Link to="/admin/coupons/new" className="admin-create-btn">
            <FiPlus />
            <span>CREATE COUPON</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="admin-coupon-stats">
        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <FiTag />
          </div>
          <div className="stat-info">
            <span className="stat-label">TOTAL CAMPAIGNS</span>
            <strong className="stat-value">{stats.total || coupons.length}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper green">
            <FiCheckCircle />
          </div>
          <div className="stat-info">
            <span className="stat-label">ACTIVE PROMOTIONS</span>
            <strong className="stat-value">{stats.active}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper orange">
            <FiClock />
          </div>
          <div className="stat-info">
            <span className="stat-label">EXPIRED COUPONS</span>
            <strong className="stat-value">{stats.expired}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper purple">
            <FiTrendingUp />
          </div>
          <div className="stat-info">
            <span className="stat-label">TOTAL REDEMPTIONS</span>
            <strong className="stat-value">{totalRedemptions}</strong>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="admin-controls-bar">
        <div className="admin-search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by code or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="admin-filter-tabs">
          {["ALL", "ACTIVE", "EXPIRED", "DISABLED"].map((f) => (
            <button
              key={f}
              type="button"
              className={`filter-tab ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="admin-error-box">
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      )}

      {/* Coupons Table */}
      <div className="admin-table-wrapper">
        {loading ? (
          <div className="admin-table-loading">
            <FiRefreshCw className="spin-icon large" />
            <p>Loading promotional catalogue...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="admin-table-empty">
            <FiTag className="empty-icon" />
            <h3>NO COUPONS FOUND</h3>
            <p>
              {search || filter !== "ALL"
                ? "Try adjusting your search query or filter."
                : "Create your first promotional discount coupon to boost conversions."}
            </p>
            <Link to="/admin/coupons/new" className="admin-create-btn small">
              <FiPlus /> CREATE PROMO CODE
            </Link>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>CODE</th>
                <th>DISCOUNT</th>
                <th>USAGE</th>
                <th>STATUS</th>
                <th>VALIDITY PERIOD</th>
                <th className="text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const cId = c.id || c._id;
                const isExpired = c.isExpired || new Date(c.expiryDate) < new Date();
                const isUsageExceeded =
                  c.usageLimit !== null && c.usageCount >= c.usageLimit;

                let statusBadge = "active";
                let statusLabel = "ACTIVE";

                if (!c.isActive) {
                  statusBadge = "disabled";
                  statusLabel = "DISABLED";
                } else if (isExpired) {
                  statusBadge = "expired";
                  statusLabel = "EXPIRED";
                } else if (isUsageExceeded) {
                  statusBadge = "limit-reached";
                  statusLabel = "LIMIT REACHED";
                }

                return (
                  <tr key={cId}>
                    {/* Code & Description */}
                    <td>
                      <div className="coupon-code-cell">
                        <strong className="code-tag">{c.code}</strong>
                        {c.description && (
                          <span className="code-desc">{c.description}</span>
                        )}
                      </div>
                    </td>

                    {/* Discount */}
                    <td>
                      <div className="discount-cell">
                        <strong className="discount-val">
                          {c.discountType === "percentage"
                            ? `${c.discountValue}% OFF`
                            : `₹${Number(c.discountValue).toLocaleString()} OFF`}
                        </strong>
                        {c.minimumOrderAmount > 0 && (
                          <span className="min-order-note">
                            Min Order: ₹{c.minimumOrderAmount.toLocaleString()}
                          </span>
                        )}
                        {c.maximumDiscountAmount > 0 && (
                          <span className="cap-note">
                            Cap: ₹{c.maximumDiscountAmount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Usage */}
                    <td>
                      <div className="usage-cell">
                        <span className="usage-fraction">
                          <strong>{c.usageCount || 0}</strong> /{" "}
                          {c.usageLimit !== null ? c.usageLimit : "∞"}
                        </span>
                        <span className="per-user-note">
                          Limit/User: {c.perUserLimit || 1}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`status-pill ${statusBadge}`}>
                        {statusLabel}
                      </span>
                    </td>

                    {/* Validity Period */}
                    <td>
                      <div className="validity-cell">
                        <span>
                          {new Date(c.startDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                          {" — "}
                          {new Date(c.expiryDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="table-actions-cell">
                        <button
                          type="button"
                          className={`action-icon-btn status-btn ${
                            c.isActive ? "active" : "inactive"
                          }`}
                          onClick={() => handleToggleStatus(c)}
                          disabled={actionLoading === cId}
                          title={c.isActive ? "Disable Coupon" : "Enable Coupon"}
                          aria-label={c.isActive ? "Disable" : "Enable"}
                        >
                          {c.isActive ? <FiCheckCircle /> : <FiXCircle />}
                        </button>

                        <Link
                          to={`/admin/coupons/${cId}/edit`}
                          className="action-icon-btn edit-btn"
                          title="Edit Coupon"
                          aria-label="Edit"
                        >
                          <FiEdit2 />
                        </Link>

                        <button
                          type="button"
                          className="action-icon-btn delete-btn"
                          onClick={() => handleDeleteCoupon(c)}
                          disabled={actionLoading === cId}
                          title="Delete Coupon"
                          aria-label="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminCoupons;
