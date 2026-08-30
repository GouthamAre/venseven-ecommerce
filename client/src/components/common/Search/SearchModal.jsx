import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiX, FiArrowRight } from "react-icons/fi";

import { useSearch } from "../../../context/useSearch";
import ProductCard from "../../products/ProductCard/ProductCard";
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

  // Close search automatically on route change
  useEffect(() => {
    onClose();
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
    onClose();
    navigate(`/shop?search=${encodeURIComponent(trimmedQuery)}`);
  };

  const handleClear = () => {
    setSearchQuery("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (searchResults.length === 1) {
      onClose();
      navigate(`/product/${searchResults[0].slug}`);
    } else if (searchResults.length > 0) {
      handleViewAllInShop();
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
        initial={{ opacity: 0, y: -25 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Top Bar / Header */}
        <div className="search-panel-header">
          <div className="search-brand-title">
            <span>VENSEVEN</span>
          </div>

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
            <FiSearch className="search-input-icon" />
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

        {/* Scrollable Results & Empty State Area */}
        <div className="search-content-body">
          {/* STATE 1: Empty Search Input (Default Initial State) */}
          {!trimmedQuery && (
            <div className="search-initial-state">
              <div className="search-initial-hero">
                <span className="search-section-label">CURATED COLLECTION</span>
                <h3 className="search-initial-title">SEARCH THE COLLECTION</h3>
                <p className="search-initial-subtitle">
                  Discover shirts, trousers, essentials and more.
                </p>
              </div>

              <div className="search-curated-section">
                <div className="search-curated-header">
                  <h4>TRENDING RIGHT NOW</h4>
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

                <div className="search-products-grid" onClick={onClose}>
                  {suggestedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STATE 2: Matching Results Found */}
          {trimmedQuery && searchResults.length > 0 && (
            <div className="search-results-section">
              <div className="search-results-header">
                <span className="search-count-badge">
                  RESULTS ({searchResults.length})
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

              <div className="search-products-grid" onClick={onClose}>
                {searchResults.slice(0, 6).map((product) => (
                  <ProductCard key={product.id} product={product} />
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
