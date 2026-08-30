import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiBox,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiLayers,
  FiX,
  FiMinus,
} from "react-icons/fi";
import {
  getAdminProducts,
  updateProductStock,
  deleteProduct,
} from "../../services/productService";
import CloudinaryImage from "../../components/common/CloudinaryImage/CloudinaryImage";
import "./AdminProducts.css";

const FILTER_TABS = [
  { id: "ALL", label: "ALL" },
  { id: "ACTIVE", label: "ACTIVE" },
  { id: "INACTIVE", label: "DRAFT / INACTIVE" },
  { id: "OUT_OF_STOCK", label: "OUT OF STOCK" },
  { id: "NEW_ARRIVALS", label: "NEW ARRIVALS" },
  { id: "BEST_SELLERS", label: "BEST SELLERS" },
];

function AdminProducts() {
  const navigate = useNavigate();
  const token = localStorage.getItem("venseven_auth_token");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals state
  const [stockModalProduct, setStockModalProduct] = useState(null);
  const [stockEditingSizes, setStockEditingSizes] = useState([]);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  const [deleteModalProduct, setDeleteModalProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCatalogue = useCallback(async () => {
    try {
      const data = await getAdminProducts(
        {
          search: searchQuery,
          status: activeFilter,
          page: currentPage,
          limit: 15,
        },
        token
      );

      if (data?.success) {
        setProducts(data.products || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.count || 0);
      }
    } catch (err) {
      console.error("[AdminProducts Fetch Error]:", err);
      setError(err.message || "Failed to load product catalogue.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeFilter, currentPage, token]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await getAdminProducts(
          {
            search: searchQuery,
            status: activeFilter,
            page: currentPage,
            limit: 15,
          },
          token
        );
        if (data?.success && isMounted) {
          setProducts(data.products || []);
          setTotalPages(data.totalPages || 1);
          setTotalCount(data.count || 0);
        }
      } catch (err) {
        if (isMounted) setError(err.message || "Failed to load product catalogue.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [searchQuery, activeFilter, currentPage, token]);

  // Handle Search Input with debounce
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterClick = (filterId) => {
    setActiveFilter(filterId);
    setCurrentPage(1);
  };

  // Stock Management Modal Open
  const openStockModal = (product) => {
    setStockModalProduct(product);
    setStockEditingSizes(
      Array.isArray(product.sizes)
        ? product.sizes.map((s) => ({ ...s }))
        : []
    );
  };

  const handleStockCountChange = (index, delta) => {
    setStockEditingSizes((prev) => {
      const next = [...prev];
      const currentVal = Number(next[index].stock) || 0;
      next[index].stock = Math.max(0, currentVal + delta);
      return next;
    });
  };

  const handleStockDirectInput = (index, value) => {
    const parsed = parseInt(value, 10);
    setStockEditingSizes((prev) => {
      const next = [...prev];
      next[index].stock = isNaN(parsed) ? 0 : Math.max(0, parsed);
      return next;
    });
  };

  const handleSaveStock = async () => {
    if (!stockModalProduct) return;
    setIsUpdatingStock(true);
    try {
      const res = await updateProductStock(
        stockModalProduct._id || stockModalProduct.id,
        stockEditingSizes,
        token
      );
      if (res?.success) {
        setSuccessMsg(res.message || "Stock updated successfully.");
        setStockModalProduct(null);
        fetchCatalogue();
      }
    } catch (err) {
      alert(err.message || "Failed to update stock.");
    } finally {
      setIsUpdatingStock(false);
    }
  };

  // Safe Deletion Flow
  const openDeleteModal = (product) => {
    setDeleteModalProduct(product);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalProduct) return;
    setIsDeleting(true);
    try {
      const res = await deleteProduct(
        deleteModalProduct._id || deleteModalProduct.id,
        token
      );
      if (res?.success) {
        setSuccessMsg(res.message || "Product removed from catalogue.");
        setDeleteModalProduct(null);
        fetchCatalogue();
      }
    } catch (err) {
      alert(err.message || "Failed to delete product.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate total stock in modal
  const modalTotalStock = stockEditingSizes.reduce(
    (acc, s) => acc + (Number(s.stock) || 0),
    0
  );

  return (
    <div className="admin-products-root">
      {/* Header */}
      <div className="products-header-row">
        <div>
          <span className="products-eyebrow">INVENTORY & CATALOGUE</span>
          <h1 className="products-title">
            PRODUCT CATALOGUE {totalCount > 0 ? `(${totalCount})` : ""}
          </h1>
          <p className="products-subtitle">
            Manage the VENSEVEN collection, inventory, pricing, and visibility.
          </p>
        </div>

        <Link to="/admin/products/new" className="admin-primary-btn">
          <FiPlus />
          <span>ADD PRODUCT</span>
        </Link>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="admin-feedback-banner success" role="alert">
          <FiCheckCircle />
          <span>{successMsg}</span>
          <button
            type="button"
            className="banner-close-btn"
            onClick={() => setSuccessMsg("")}
          >
            <FiX />
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="admin-feedback-banner error" role="alert">
          <FiAlertTriangle />
          <span>{error}</span>
          <button
            type="button"
            className="banner-close-btn"
            onClick={() => setError("")}
          >
            <FiX />
          </button>
        </div>
      )}

      {/* Controls Bar: Search & Filter Tabs */}
      <div className="admin-products-controls">
        <div className="admin-search-wrapper">
          <FiSearch className="search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search products by title, category, slug, or color..."
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery("")}
            >
              <FiX />
            </button>
          )}
        </div>

        <div className="admin-filter-tabs">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`filter-tab-btn ${
                activeFilter === tab.id ? "active" : ""
              }`}
              onClick={() => handleFilterClick(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Management Table / Responsive List */}
      <div className="admin-table-container">
        {loading ? (
          <div className="admin-skeleton-table">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton-table-row" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="admin-empty-state">
            <div className="empty-icon-wrap">
              <FiLayers />
            </div>
            <h3 className="empty-title">NO PRODUCTS FOUND</h3>
            <p className="empty-desc">
              {searchQuery || activeFilter !== "ALL"
                ? "Try adjusting your search criteria or active filter filters."
                : "Your studio catalogue is currently empty."}
            </p>
            <Link to="/admin/products/new" className="admin-primary-btn">
              <FiPlus />
              <span>ADD YOUR FIRST PRODUCT</span>
            </Link>
          </div>
        ) : (
          <table className="admin-management-table">
            <thead>
              <tr>
                <th>IMAGE</th>
                <th>PRODUCT</th>
                <th>CATEGORY</th>
                <th>PRICE</th>
                <th>STOCK</th>
                <th>STATUS</th>
                <th className="text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => {
                const isOutOfStock = (prod.totalStock || 0) <= 0;
                const isLowStock =
                  (prod.totalStock || 0) > 0 && (prod.totalStock || 0) <= 3;
                const imgSrc =
                  prod.primaryImage ||
                  prod.images?.[0]?.url ||
                  prod.image ||
                  "";

                return (
                  <tr key={prod._id || prod.id}>
                    {/* 1. Thumbnail */}
                    <td className="col-thumb">
                      <div className="prod-thumb-box">
                        {imgSrc ? (
                          <CloudinaryImage
                            src={imgSrc}
                            alt={prod.name}
                            preset="GALLERY_THUMB"
                          />
                        ) : (
                          <div className="thumb-placeholder">
                            <FiBox />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 2. Product Name & Meta */}
                    <td className="col-product">
                      <div className="prod-title-wrap">
                        <strong className="prod-name">{prod.name}</strong>
                        <div className="prod-meta-tags">
                          <span className="prod-slug">/{prod.slug}</span>
                          {prod.color && (
                            <span className="prod-color-tag">
                              {prod.color}
                            </span>
                          )}
                          {prod.isNewArrival && (
                            <span className="mini-badge new">NEW ARRIVAL</span>
                          )}
                          {prod.isBestSeller && (
                            <span className="mini-badge best">BEST SELLER</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 3. Category */}
                    <td className="col-category">
                      <span className="category-pill">{prod.category}</span>
                      {prod.subcategory && (
                        <span className="subcategory-sub">
                          {prod.subcategory}
                        </span>
                      )}
                    </td>

                    {/* 4. Price */}
                    <td className="col-price">
                      <div className="price-stack">
                        <strong className="main-price">
                          ₹{Number(prod.price || 0).toLocaleString()}
                        </strong>
                        {prod.salePrice && (
                          <span className="sale-price">
                            ₹{Number(prod.salePrice).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 5. Stock */}
                    <td className="col-stock">
                      <div className="stock-info">
                        <strong
                          className={`stock-count ${
                            isOutOfStock
                              ? "out"
                              : isLowStock
                              ? "low"
                              : "normal"
                          }`}
                        >
                          {prod.totalStock || 0} Units
                        </strong>
                        {isOutOfStock && (
                          <span className="stock-pill out">OUT OF STOCK</span>
                        )}
                        {isLowStock && (
                          <span className="stock-pill low">LOW STOCK</span>
                        )}
                        {Array.isArray(prod.sizes) && prod.sizes.length > 0 && (
                          <div className="size-stock-breakdown-chips">
                            {prod.sizes.map((s, idx) => {
                              const sQty = typeof s.stock === "number" ? s.stock : 0;
                              const sLabel = typeof s === "object" ? s.size : s;
                              return (
                                <span
                                  key={idx}
                                  className={`size-stock-mini-chip ${
                                    sQty <= 0 ? "out" : sQty <= 3 ? "low" : "ok"
                                  }`}
                                  title={`${sLabel}: ${sQty} in stock`}
                                >
                                  {sLabel}:{sQty}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 6. Visibility Status */}
                    <td className="col-status">
                      <span
                        className={`status-pill ${
                          prod.isActive ? "active" : "inactive"
                        }`}
                      >
                        {prod.isActive ? (
                          <>
                            <FiCheckCircle /> ACTIVE
                          </>
                        ) : (
                          <>
                            <FiXCircle /> DRAFT / ARCHIVED
                          </>
                        )}
                      </span>
                    </td>

                    {/* 7. Action Buttons */}
                    <td className="col-actions text-right">
                      <div className="action-btn-group">
                        <button
                          type="button"
                          className="table-action-btn edit"
                          onClick={() =>
                            navigate(`/admin/products/${prod._id || prod.id}/edit`)
                          }
                          title="Edit Product"
                        >
                          <FiEdit2 />
                          <span>EDIT</span>
                        </button>

                        <button
                          type="button"
                          className="table-action-btn stock"
                          onClick={() => openStockModal(prod)}
                          title="Manage Inventory"
                        >
                          <FiBox />
                          <span>STOCK</span>
                        </button>

                        <button
                          type="button"
                          className="table-action-btn delete"
                          onClick={() => openDeleteModal(prod)}
                          title="Delete or Archive Product"
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="admin-pagination-bar">
          <button
            type="button"
            className="pagination-btn"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            PREVIOUS
          </button>
          <span className="pagination-info">
            PAGE {currentPage} OF {totalPages}
          </span>
          <button
            type="button"
            className="pagination-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            NEXT
          </button>
        </div>
      )}

      {/* ========================================================
          STOCK MANAGEMENT MODAL
          ======================================================== */}
      {stockModalProduct && (
        <div className="admin-modal-backdrop" onClick={() => setStockModalProduct(null)}>
          <div
            className="admin-modal-card stock-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="modal-eyebrow">INVENTORY MANAGER</span>
                <h3 className="modal-title">{stockModalProduct.name}</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setStockModalProduct(null)}
              >
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <div className="stock-summary-card">
                <span className="summary-label">TOTAL AVAILABLE INVENTORY</span>
                <span
                  className={`summary-value ${
                    modalTotalStock === 0
                      ? "out"
                      : modalTotalStock <= 3
                      ? "low"
                      : ""
                  }`}
                >
                  {modalTotalStock} UNITS
                </span>
              </div>

              <div className="sizes-stock-editor">
                {stockEditingSizes.length === 0 ? (
                  <p className="no-sizes-hint">
                    No sizes defined for this product. You can add sizes in the
                    full Product Edit form.
                  </p>
                ) : (
                  stockEditingSizes.map((s, idx) => (
                    <div key={idx} className="size-stock-row">
                      <div className="size-label-box">
                        <strong className="size-name">{s.size}</strong>
                        {s.sku && <span className="size-sku">SKU: {s.sku}</span>}
                      </div>

                      <div className="stock-counter-wrap">
                        <button
                          type="button"
                          className="counter-btn"
                          onClick={() => handleStockCountChange(idx, -1)}
                          disabled={Number(s.stock) <= 0}
                        >
                          <FiMinus />
                        </button>
                        <input
                          type="number"
                          className="counter-input"
                          value={s.stock}
                          onChange={(e) =>
                            handleStockDirectInput(idx, e.target.value)
                          }
                          min="0"
                        />
                        <button
                          type="button"
                          className="counter-btn"
                          onClick={() => handleStockCountChange(idx, 1)}
                        >
                          <FiPlus />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="admin-secondary-btn"
                onClick={() => setStockModalProduct(null)}
              >
                CANCEL
              </button>
              <button
                type="button"
                className="admin-primary-btn"
                onClick={handleSaveStock}
                disabled={isUpdatingStock}
              >
                {isUpdatingStock ? "SAVING..." : "UPDATE STOCK"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SAFE DELETE / ARCHIVE CONFIRMATION MODAL
          ======================================================== */}
      {deleteModalProduct && (
        <div className="admin-modal-backdrop" onClick={() => setDeleteModalProduct(null)}>
          <div
            className="admin-modal-card delete-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header danger">
              <div className="danger-icon-box">
                <FiAlertTriangle />
              </div>
              <div>
                <span className="modal-eyebrow danger">CONFIRM REMOVAL</span>
                <h3 className="modal-title">DELETE PRODUCT?</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setDeleteModalProduct(null)}
              >
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <p className="delete-warning-text">
                You are about to remove <strong>{deleteModalProduct.name}</strong> from
                the active VENSEVEN catalogue.
              </p>
              <div className="delete-info-note">
                <FiAlertTriangle className="info-icon" />
                <span>
                  <strong>Safety Protection:</strong> If this product is referenced in
                  past customer orders, it will be automatically <em>archived</em> (set
                  to inactive) to preserve historical accounting and fulfillment records.
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="admin-secondary-btn"
                onClick={() => setDeleteModalProduct(null)}
                disabled={isDeleting}
              >
                CANCEL
              </button>
              <button
                type="button"
                className="admin-destructive-btn"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "PROCESSING..." : "CONFIRM REMOVAL"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProducts;
