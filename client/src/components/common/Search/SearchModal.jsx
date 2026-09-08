import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiX, FiArrowRight } from "react-icons/fi";

import { useSearch } from "../../../context/useSearch";
import CloudinaryImage from "../CloudinaryImage/CloudinaryImage";
import { getProducts } from "../../../services/productService";
import { products as localProductsFallback } from "../../../data/products";
import "./SearchModal.css";

const CATEGORY_SUGGESTIONS = [
  "SHIRTS",
  "TROUSERS",
  "T-SHIRTS",
  "SHORTS",
  "BLACK",
  "WINE",
  "FORMAL",
  "CASUAL",
];

function CompactProductItem({ product, onClick }) {
  if (!product) return null;
  const pId = product.id || product._id;
  const productUrl = `/product/${product.slug || pId}`;

  const localMatch = localProductsFallback.find(
    (lp) =>
      (product.slug && lp.slug.toLowerCase() === product.slug.toLowerCase()) ||
      String(lp.id) === String(pId) ||
      (product.name && lp.name.toLowerCase() === product.name.toLowerCase())
  );
  const fallbackSrc = localMatch?.image || "";
  const rawImage =
    product.image ||
    product.primaryImage ||
    product.images?.[0]?.url ||
    "";
  const isBrokenRemote =
    typeof rawImage === "string" &&
    (rawImage.includes("venseven/products/") || rawImage.includes("placeholder"));

  const imageSrc = isBrokenRemote || !rawImage ? fallbackSrc : rawImage;

  const formattedPrice =
    typeof product.price === "number"
      ? `₹${product.price.toLocaleString("en-IN")}`
      : product.price?.startsWith?.("₹")
      ? product.price
      : `₹${product.price || product.numericPrice || "1,999"}`;

  return (
    <Link
      to={productUrl}
      className="search-compact-item"
      onClick={onClick}
      aria-label={`View ${product.name}`}
    >
      <div className="search-compact-thumb">
        <CloudinaryImage
          src={imageSrc}
          fallbackSrc={fallbackSrc}
          alt={product.name}
          loading="lazy"
        />
        {product.isNewArrival ? (
          <span className="search-compact-badge new">NEW</span>
        ) : product.isBestSeller ? (
          <span className="search-compact-badge best">BEST</span>
        ) : null}
      </div>

      <div className="search-compact-info">
        <h4 className="search-compact-name">{product.name}</h4>
        <span className="search-compact-meta">
          {product.category || "Collection"}
          {product.color ? ` · ${product.color}` : ""}
        </span>
        <span className="search-compact-price">{formattedPrice}</span>
      </div>

      <div className="search-compact-action" aria-hidden="true">
        <FiArrowRight />
      </div>
    </Link>
  );
}

function SearchModalContent({ onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [catalogue, setCatalogue] = useState(localProductsFallback);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    async function loadSearchData() {
      try {
        const res = await getProducts();
        if (res?.success && Array.isArray(res.products) && isMounted) {
          setCatalogue(res.products);
        }
      } catch (err) {
        console.warn("[SearchModal] Dynamic fetch failed:", err);
      }
    }
    loadSearchData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-focus input on mount & lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, []);

  // Keyboard navigation & ESC handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Close search automatically on route change (only after initial mount)
  const initialPathRef = useRef(location.pathname);
  useEffect(() => {
    if (initialPathRef.current !== location.pathname) {
      onClose();
    }
  }, [location.pathname, onClose]);

  // Real-time matching filter against catalog
  const trimmedQuery = searchQuery.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!trimmedQuery) return [];

    return catalogue.filter((p) => {
      const nameMatch = p.name?.toLowerCase().includes(trimmedQuery);
      const catMatch = p.category?.toLowerCase().includes(trimmedQuery);
      const subcatMatch = p.subcategory?.toLowerCase().includes(trimmedQuery);
      const colorMatch = p.color?.toLowerCase().includes(trimmedQuery);
      const descMatch = p.description?.toLowerCase().includes(trimmedQuery);
      const fabricMatch = p.fabric?.toLowerCase().includes(trimmedQuery);
      const detailsMatch = p.details?.some((d) =>
        d.toLowerCase().includes(trimmedQuery)
      );

      return (
        nameMatch ||
        catMatch ||
        subcatMatch ||
        colorMatch ||
        descMatch ||
        fabricMatch ||
        detailsMatch
      );
    });
  }, [catalogue, trimmedQuery]);

  // Featured suggestion products (when search is empty)
  const suggestedProducts = useMemo(() => {
    return catalogue.filter((p) => p.isNewArrival || p.isBestSeller).slice(0, 4);
  }, [catalogue]);

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleViewAllInShop = () => {
    const query = searchQuery.trim();
    onClose();
    if (query) {
      navigate(`/shop?search=${encodeURIComponent(query)}`);
    } else {
      navigate("/shop");
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      onClose();
      navigate(`/shop?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div
      className="search-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="VENSEVEN Product Search"
    >
      {/* Backdrop */}
      <motion.div
        className="search-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
      />

      {/* Modal Content Panel */}
      <motion.div
        className="search-panel"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Top Bar / Header */}
        <div className="search-panel-header">
          <Link
            to="/"
            className="search-brand-logo"
            onClick={onClose}
            aria-label="VENSEVEN Home"
          >
            <img
              src="/logo.png"
              alt="VENSEVEN"
              className="search-brand-icon"
            />
            <span className="search-brand-name">VENSEVEN</span>
          </Link>

          <button
            type="button"
            className="search-close-btn"
            onClick={onClose}
            aria-label="Close search (Escape)"
          >
            <span className="search-close-text">ESC</span>
            <FiX />
          </button>
        </div>

        {/* Input Form Bar */}
        <form onSubmit={handleFormSubmit} className="search-input-form">
          <div className="search-input-wrapper">
            <button
              type="submit"
              className="search-input-icon-btn"
              aria-label="Execute search"
            >
              <FiSearch className="search-input-icon" />
            </button>
            <input
              ref={inputRef}
              type="search"
              className="search-input"
              placeholder="Search shirts, trousers, styles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
              aria-label="Search products"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={handleClear}
                aria-label="Clear search input"
              >
                <FiX />
              </button>
            )}
          </div>
        </form>

        {/* Suggestion Chips */}
        <div className="search-quick-tags">
          <span className="search-quick-label">SUGGESTIONS:</span>
          <div className="search-tags-list">
            {CATEGORY_SUGGESTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`search-tag-pill ${
                  trimmedQuery === tag.toLowerCase() ? "active" : ""
                }`}
                onClick={() => handleSuggestionClick(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Results & Suggestions Area */}
        <div className="search-content-body">
          {/* STATE 1: Empty Search Input (Default Initial State) */}
          {!trimmedQuery && (
            <div className="search-initial-state">
              <div className="search-curated-header">
                <span className="search-section-label">TRENDING RIGHT NOW</span>
                <button
                  type="button"
                  className="search-link-btn"
                  onClick={() => {
                    onClose();
                    navigate("/shop");
                  }}
                >
                  Browse All Pieces <FiArrowRight />
                </button>
              </div>

              <div className="search-compact-grid">
                {suggestedProducts.map((product) => (
                  <CompactProductItem
                    key={product.id || product._id}
                    product={product}
                    onClick={onClose}
                  />
                ))}
              </div>
            </div>
          )}

          {/* STATE 2: Matching Results Found */}
          {trimmedQuery && searchResults.length > 0 && (
            <div className="search-results-section">
              <div className="search-results-header">
                <span className="search-count-badge">
                  MATCHING PIECES ({searchResults.length})
                </span>
                {searchResults.length > 6 && (
                  <button
                    type="button"
                    className="search-view-all-link"
                    onClick={handleViewAllInShop}
                  >
                    View all in Shop <FiArrowRight />
                  </button>
                )}
              </div>

              <div className="search-compact-grid">
                {searchResults.slice(0, 6).map((product) => (
                  <CompactProductItem
                    key={product.id || product._id}
                    product={product}
                    onClick={onClose}
                  />
                ))}
              </div>

              {/* View All Button */}
              <div className="search-actions-row">
                <button
                  type="button"
                  className="search-view-all-btn"
                  onClick={handleViewAllInShop}
                >
                  VIEW ALL {searchResults.length} PIECES IN SHOP <FiArrowRight />
                </button>
              </div>
            </div>
          )}

          {/* STATE 3: No Results Matching Query */}
          {trimmedQuery && searchResults.length === 0 && (
            <div className="search-no-results">
              <div className="search-empty-icon-wrap">
                <FiSearch />
              </div>
              <h3 className="search-no-results-title">NO PIECES FOUND</h3>
              <p className="search-no-results-desc">
                We couldn’t find anything matching &ldquo;{searchQuery}&rdquo;.
                Try searching for shirts, trousers or essentials.
              </p>
              <div className="search-no-results-actions">
                <button
                  type="button"
                  className="search-btn-primary"
                  onClick={handleClear}
                >
                  CLEAR SEARCH
                </button>
                <button
                  type="button"
                  className="search-btn-secondary"
                  onClick={() => {
                    onClose();
                    navigate("/shop");
                  }}
                >
                  EXPLORE FULL SHOP
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function SearchModal() {
  const { isSearchOpen, closeSearch } = useSearch();

  return (
    <AnimatePresence>
      {isSearchOpen && <SearchModalContent onClose={closeSearch} />}
    </AnimatePresence>
  );
}

export default SearchModal;
