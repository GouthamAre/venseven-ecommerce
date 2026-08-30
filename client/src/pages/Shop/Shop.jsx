import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiFilter, FiX, FiChevronDown } from "react-icons/fi";

import Navbar from "../../components/layout/Navbar/Navbar";
import ProductCard from "../../components/products/ProductCard/ProductCard";
import { getProducts } from "../../services/productService";
import { products as localProductsFallback } from "../../data/products";
import "./Shop.css";

const CATEGORIES = ["All", "Shirts", "Trousers", "T-Shirts", "Shorts"];

const PRICE_RANGES = [
  { label: "All Prices", value: "all" },
  { label: "Under ₹1,500", value: "under-1500", max: 1500 },
  { label: "₹1,500 - ₹2,000", value: "1500-2000", min: 1500, max: 2000 },
  { label: "Above ₹2,000", value: "above-2000", min: 2000 },
];

const COLORS = [
  "All",
  "Black",
  "White",
  "Plum Wine",
  "Deep Blue",
  "Light Olive Green",
  "Denim Blue",
];

const SIZES = ["All", "S", "M", "L", "XL", "XXL"];

const SORT_OPTIONS = [
  { label: "Featured", value: "featured" },
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
];

function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Dynamic Storefront Products State
  const [storeProducts, setStoreProducts] = useState(localProductsFallback);

  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      try {
        const data = await getProducts();
        if (data?.success && Array.isArray(data.products) && isMounted) {
          setStoreProducts(data.products);
        }
      } catch (err) {
        console.warn("[Shop] Dynamic products fetch failed:", err);
      }
    }
    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Mobile Filter Drawer Toggle
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Read current active filters from URL query parameters (or defaults)
  const categoryParam = searchParams.get("category");
  const priceParam = searchParams.get("price");
  const colorParam = searchParams.get("color");
  const sizeParam = searchParams.get("size");
  const sortParam = searchParams.get("sort");
  const filterParam = searchParams.get("filter");
  const searchParam = searchParams.get("search") || "";

  const selectedCategory = categoryParam
    ? CATEGORIES.find((c) => c.toLowerCase() === categoryParam.toLowerCase()) || "All"
    : "All";

  const selectedPriceRange = priceParam || "all";

  const selectedColor = colorParam
    ? COLORS.find((c) => c.toLowerCase() === colorParam.toLowerCase()) || "All"
    : "All";

  const selectedSize = sizeParam
    ? SIZES.find((s) => s.toLowerCase() === sizeParam.toLowerCase()) || "All"
    : "All";

  const sortBy = sortParam || "featured";

  const specialFilter =
    filterParam === "new-arrivals" || filterParam === "best-sellers"
      ? filterParam
      : "all";

  // Helper to update URL search parameters seamlessly without reloading
  const updateParam = (key, value, defaultValue = "All") => {
    const newParams = new URLSearchParams(searchParams);
    if (!value || value === defaultValue || value === "all") {
      newParams.delete(key);
    } else {
      newParams.set(key, typeof value === "string" ? value.toLowerCase() : value);
    }
    setSearchParams(newParams);
  };

  // Reset All Filters
  const handleResetFilters = () => {
    setSearchParams({});
  };

  // Multi-Criteria Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    let result = [...storeProducts];

    // 0. Search Query Filter
    if (searchParam) {
      const q = searchParam.trim().toLowerCase();
      result = result.filter((p) => {
        const nameMatch = p.name?.toLowerCase().includes(q);
        const catMatch = p.category?.toLowerCase().includes(q);
        const subcatMatch = p.subcategory?.toLowerCase().includes(q);
        const colorMatch = p.color?.toLowerCase().includes(q);
        const descMatch = p.description?.toLowerCase().includes(q);
        const fabricMatch = p.fabric?.toLowerCase().includes(q);
        const detailsMatch = p.details?.some((d) => d.toLowerCase().includes(q));
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
    }

    // 1. Special Filter (New Arrivals / Best Sellers)
    if (specialFilter === "new-arrivals") {
      result = result.filter((p) => p.isNewArrival);
    } else if (specialFilter === "best-sellers") {
      result = result.filter((p) => p.isBestSeller);
    }

    // 2. Category Filter
    if (selectedCategory !== "All") {
      result = result.filter(
        (p) => p.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // 3. Price Range Filter
    if (selectedPriceRange !== "all") {
      const range = PRICE_RANGES.find((r) => r.value === selectedPriceRange);
      if (range) {
        if (range.min !== undefined && range.max !== undefined) {
          result = result.filter(
            (p) => p.numericPrice >= range.min && p.numericPrice <= range.max
          );
        } else if (range.min !== undefined) {
          result = result.filter((p) => p.numericPrice >= range.min);
        } else if (range.max !== undefined) {
          result = result.filter((p) => p.numericPrice <= range.max);
        }
      }
    }

    // 4. Color Filter
    if (selectedColor !== "All") {
      result = result.filter(
        (p) => p.color.toLowerCase() === selectedColor.toLowerCase()
      );
    }

    // 5. Size Filter
    if (selectedSize !== "All") {
      result = result.filter(
        (p) => p.sizes && p.sizes.includes(selectedSize)
      );
    }

    // 6. Sorting
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.numericPrice - b.numericPrice);
        break;
      case "price-desc":
        result.sort((a, b) => b.numericPrice - a.numericPrice);
        break;
      case "newest":
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "featured":
      default:
        // Default brand ranking
        break;
    }

    return result;
  }, [
    storeProducts,
    searchParam,
    selectedCategory,
    selectedPriceRange,
    selectedColor,
    selectedSize,
    specialFilter,
    sortBy,
  ]);

  // Active filter count calculation
  const activeFiltersCount =
    (searchParam ? 1 : 0) +
    (selectedCategory !== "All" ? 1 : 0) +
    (selectedPriceRange !== "all" ? 1 : 0) +
    (selectedColor !== "All" ? 1 : 0) +
    (selectedSize !== "All" ? 1 : 0) +
    (specialFilter !== "all" ? 1 : 0);

  return (
    <>
      <Navbar />

      <main className="shop-page">
        <div className="shop-container">
          {/* Header */}
          <header className="shop-header">
            <span className="shop-eyebrow">VENSEVEN STORE</span>
            <h1 className="shop-title">SHOP</h1>
            <p className="shop-subtitle">
              All menswear, curated for everyday confidence.
            </p>
          </header>

          {/* Quick Category Bar */}
          <nav className="shop-category-bar" aria-label="Product Categories">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`category-pill ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => updateParam("category", cat, "All")}
              >
                {cat}
              </button>
            ))}
          </nav>

          {/* Controls Bar: Filters & Sort */}
          <div className="shop-controls-bar">
            {/* Desktop Filters Group */}
            <div className="shop-desktop-filters">
              {/* Price Filter */}
              <div className="filter-select-wrapper">
                <select
                  value={selectedPriceRange}
                  onChange={(e) => updateParam("price", e.target.value, "all")}
                  className="shop-select"
                  aria-label="Filter by price"
                >
                  {PRICE_RANGES.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="select-arrow" />
              </div>

              {/* Color Filter */}
              <div className="filter-select-wrapper">
                <select
                  value={selectedColor}
                  onChange={(e) => updateParam("color", e.target.value, "All")}
                  className="shop-select"
                  aria-label="Filter by color"
                >
                  <option value="All">All Colors</option>
                  {COLORS.filter((c) => c !== "All").map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="select-arrow" />
              </div>

              {/* Size Filter */}
              <div className="filter-select-wrapper">
                <select
                  value={selectedSize}
                  onChange={(e) => updateParam("size", e.target.value, "All")}
                  className="shop-select"
                  aria-label="Filter by size"
                >
                  <option value="All">All Sizes</option>
                  {SIZES.filter((s) => s !== "All").map((size) => (
                    <option key={size} value={size}>
                      Size {size}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="select-arrow" />
              </div>
            </div>

            {/* Mobile Filter Trigger Button */}
            <button
              type="button"
              className="mobile-filter-trigger"
              onClick={() => setMobileFiltersOpen(true)}
              aria-label="Open filter options"
            >
              <FiFilter />
              <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
            </button>

            {/* Right: Product Count & Sort */}
            <div className="shop-sort-group">
              <span className="product-count-label">
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "Piece" : "Pieces"}
              </span>

              <div className="filter-select-wrapper sort-wrapper">
                <select
                  value={sortBy}
                  onChange={(e) => updateParam("sort", e.target.value, "featured")}
                  className="shop-select sort-select"
                  aria-label="Sort products"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      Sort: {opt.label}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="select-arrow" />
              </div>
            </div>
          </div>

          {/* Active Filter Tags */}
          {activeFiltersCount > 0 && (
            <div className="active-filters-bar">
              <span className="active-filters-label">Active Filters:</span>

              {searchParam && (
                <button
                  type="button"
                  className="filter-chip"
                  onClick={() => updateParam("search", null)}
                >
                  Search: &ldquo;{searchParam}&rdquo; <FiX />
                </button>
              )}

              {selectedCategory !== "All" && (
                <button
                  type="button"
                  className="filter-chip"
                  onClick={() => updateParam("category", "All", "All")}
                >
                  Category: {selectedCategory} <FiX />
                </button>
              )}

              {selectedPriceRange !== "all" && (
                <button
                  type="button"
                  className="filter-chip"
                  onClick={() => updateParam("price", "all", "all")}
                >
                  Price:{" "}
                  {
                    PRICE_RANGES.find((r) => r.value === selectedPriceRange)
                      ?.label
                  }{" "}
                  <FiX />
                </button>
              )}

              {selectedColor !== "All" && (
                <button
                  type="button"
                  className="filter-chip"
                  onClick={() => updateParam("color", "All", "All")}
                >
                  Color: {selectedColor} <FiX />
                </button>
              )}

              {selectedSize !== "All" && (
                <button
                  type="button"
                  className="filter-chip"
                  onClick={() => updateParam("size", "All", "All")}
                >
                  Size: {selectedSize} <FiX />
                </button>
              )}

              {specialFilter !== "all" && (
                <button
                  type="button"
                  className="filter-chip"
                  onClick={() => updateParam("filter", "all", "all")}
                >
                  {specialFilter === "new-arrivals" ? "New Arrivals" : "Best Sellers"} <FiX />
                </button>
              )}

              <button
                type="button"
                className="clear-all-filters-btn"
                onClick={handleResetFilters}
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Product Grid */}
          {filteredProducts.length > 0 ? (
            <motion.div
              className="shop-grid"
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
            >
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>
          ) : (
            /* Empty State */
            <div className="shop-empty-state">
              <h3>NO PIECES FOUND</h3>
              <p>
                We couldn't find any products matching your selected criteria.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="shop-reset-btn"
              >
                RESET ALL FILTERS
              </button>
            </div>
          )}
        </div>

        {/* Mobile Filters Drawer */}
        <AnimatePresence>
          {mobileFiltersOpen && (
            <>
              <motion.div
                className="drawer-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileFiltersOpen(false)}
              />

              <motion.div
                className="mobile-filter-drawer"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "tween", duration: 0.3 }}
              >
                <div className="drawer-header">
                  <h3>FILTERS</h3>
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(false)}
                    aria-label="Close filters"
                    className="drawer-close-btn"
                  >
                    <FiX />
                  </button>
                </div>

                <div className="drawer-body">
                  {/* Category */}
                  <div className="drawer-section">
                    <h4>Category</h4>
                    <div className="drawer-pills">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          className={`drawer-pill ${selectedCategory === cat ? "active" : ""}`}
                          onClick={() => updateParam("category", cat, "All")}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="drawer-section">
                    <h4>Price Range</h4>
                    <div className="drawer-pills">
                      {PRICE_RANGES.map((range) => (
                        <button
                          key={range.value}
                          type="button"
                          className={`drawer-pill ${selectedPriceRange === range.value ? "active" : ""}`}
                          onClick={() => updateParam("price", range.value, "all")}
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color */}
                  <div className="drawer-section">
                    <h4>Color</h4>
                    <div className="drawer-pills">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`drawer-pill ${selectedColor === color ? "active" : ""}`}
                          onClick={() => updateParam("color", color, "All")}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size */}
                  <div className="drawer-section">
                    <h4>Size</h4>
                    <div className="drawer-pills">
                      {SIZES.map((size) => (
                        <button
                          key={size}
                          type="button"
                          className={`drawer-pill ${selectedSize === size ? "active" : ""}`}
                          onClick={() => updateParam("size", size, "All")}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="drawer-footer">
                  <button
                    type="button"
                    className="drawer-clear-btn"
                    onClick={handleResetFilters}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className="drawer-apply-btn"
                    onClick={() => setMobileFiltersOpen(false)}
                  >
                    View {filteredProducts.length} Results
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}

export default Shop;
