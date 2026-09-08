import { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHeart,
  FiShoppingBag,
  FiTruck,
  FiRefreshCw,
  FiShield,
  FiChevronDown,
  FiCheck,
  FiMinus,
  FiPlus,
} from "react-icons/fi";

import Navbar from "../../components/layout/Navbar/Navbar";
import ProductCard from "../../components/products/ProductCard/ProductCard";
import RecentlyViewed from "../../components/products/RecentlyViewed/RecentlyViewed";
import { recordRecentlyViewed } from "../../utils/recentlyViewed";
import { useCart } from "../../context/useCart";
import { useWishlist } from "../../context/useWishlist";
import { getProductBySlug, getRecommendations } from "../../services/productService";
import { products } from "../../data/products";
import "./Product.css";

function ProductNotFound() {
  return (
    <>
      <Navbar />
      <main className="product-not-found">
        <div className="not-found-content">
          <span className="not-found-eyebrow">404 ERROR</span>
          <h1>PIECE NOT FOUND</h1>
          <p>
            The garment you are looking for does not exist or has been archived.
          </p>
          <Link to="/shop" className="not-found-btn">
            RETURN TO SHOP →
          </Link>
        </div>
      </main>
    </>
  );
}

function ProductDetails({ product }) {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const isSoldOut = product.totalStock !== undefined && product.totalStock <= 0;

  // Normalized size inventory list: [{ size: "S", stock: 5 }, ...]
  const sizeList = useMemo(() => {
    if (Array.isArray(product.sizeInventory) && product.sizeInventory.length > 0) {
      return product.sizeInventory.map((s) => ({
        size: String(s.size).toUpperCase(),
        stock: typeof s.stock === "number" ? s.stock : 0,
      }));
    }
    if (Array.isArray(product.sizes) && product.sizes.length > 0) {
      if (typeof product.sizes[0] === "object") {
        return product.sizes.map((s) => ({
          size: String(s.size).toUpperCase(),
          stock: typeof s.stock === "number" ? s.stock : 0,
        }));
      }
      return product.sizes.map((s) => ({
        size: String(s).toUpperCase(),
        stock: isSoldOut ? 0 : 10,
      }));
    }
    return [];
  }, [product, isSoldOut]);

  // First available in-stock size
  const firstAvailableSize = useMemo(() => {
    const available = sizeList.find((s) => s.stock > 0);
    return available ? available.size : sizeList[0]?.size || "";
  }, [sizeList]);

  const localMatch = products.find(
    (lp) =>
      lp.slug.toLowerCase() === (product.slug || "").toLowerCase() ||
      String(lp.id) === String(product.id || product._id) ||
      lp.name.toLowerCase() === (product.name || "").toLowerCase()
  );
  const fallbackAsset = localMatch?.image || "";

  const candidateActiveImage =
    (product.image && !product.image.includes("venseven/products/"))
      ? product.image
      : (product.primaryImage && !product.primaryImage.includes("venseven/products/"))
      ? product.primaryImage
      : fallbackAsset || product.gallery?.[0] || "";

  // Gallery active image (defaults to product image)
  const [activeImage, setActiveImage] = useState(candidateActiveImage);

  // User selections
  const [selectedSize, setSelectedSize] = useState(firstAvailableSize);
  const [quantity, setQuantity] = useState(1);
  const [cartFeedback, setCartFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [activeAccordion, setActiveAccordion] = useState("description");

  // Current stock for the actively selected size
  const currentSizeStock = useMemo(() => {
    const match = sizeList.find((s) => s.size === selectedSize);
    return match ? match.stock : isSoldOut ? 0 : 10;
  }, [sizeList, selectedSize, isSoldOut]);

  const maxAllowedQuantity = Math.max(1, Math.min(10, currentSizeStock));

  const wishlisted = isWishlisted(product.id || product._id);

  // Automatically track recently viewed piece in localStorage
  useEffect(() => {
    recordRecentlyViewed(product);
  }, [product]);

  // Dynamic Personalized Recommendations from MongoDB backend
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  useEffect(() => {
    let isMounted = true;
    async function loadRecs() {
      try {
        const res = await getRecommendations(product.slug || product.id || product._id);
        if (isMounted && res?.success && Array.isArray(res.recommendations) && res.recommendations.length > 0) {
          setRecommendedProducts(res.recommendations);
        }
      } catch {
        // fallback
      }
    }
    loadRecs();
    return () => {
      isMounted = false;
    };
  }, [product]);

  // Related products fallback (same category or others, excluding current)
  const relatedProducts = useMemo(() => {
    const pId = product.id || product._id;
    const sameCategory = products.filter(
      (p) => (p.id || p._id) !== pId && p.category === product.category
    );
    const others = products.filter(
      (p) => (p.id || p._id) !== pId && p.category !== product.category
    );
    return [...sameCategory, ...others].slice(0, 4);
  }, [product]);

  const displayRecommendations =
    recommendedProducts.length > 0 ? recommendedProducts : relatedProducts;

  const handleAddToCart = () => {
    if (!selectedSize || isSoldOut || currentSizeStock <= 0) return;
    const result = addToCart(product, selectedSize, quantity);
    setFeedbackText(
      result?.message || `Added ${quantity} × ${product.name} (${selectedSize}) to your bag.`
    );
    setCartFeedback(true);
    setTimeout(() => {
      setCartFeedback(false);
    }, 3500);
  };

  const handleWishlistToggle = () => {
    toggleWishlist(product);
  };

  const toggleAccordion = (section) => {
    setActiveAccordion((prev) => (prev === section ? null : section));
  };

  return (
    <>
      <Navbar />

      <main className="product-page">
        <div className="product-container">
          {/* Breadcrumb Navigation */}
          <nav className="product-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="breadcrumb-separator">/</span>
            <Link to="/shop">Shop</Link>
            <span className="breadcrumb-separator">/</span>
            <Link to={`/shop?category=${product.category.toLowerCase()}`}>
              {product.category}
            </Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{product.name}</span>
          </nav>

          {/* Main Product Showcase (2 Columns) */}
          <div className="product-showcase">
            {/* Left Column: Image Gallery */}
            <div className="product-gallery">
              {/* Main Image Container */}
              <div className="gallery-main-image-wrapper">
                <motion.img
                  key={activeImage}
                  src={activeImage || fallbackAsset || product.image}
                  alt={product.name}
                  className="gallery-main-img"
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  onError={(e) => {
                    if (fallbackAsset && e.target.src !== fallbackAsset) {
                      e.target.src = fallbackAsset;
                    }
                  }}
                />

                {/* Status Badges */}
                <div className="product-image-badges">
                  {isSoldOut && (
                    <span className="product-badge sold-out">SOLD OUT</span>
                  )}
                  {product.isNewArrival && !isSoldOut && (
                    <span className="product-badge new">NEW ARRIVAL</span>
                  )}
                  {product.isBestSeller && !isSoldOut && (
                    <span className="product-badge best">BEST SELLER</span>
                  )}
                </div>
              </div>

              {/* Thumbnails Row */}
              {product.gallery && product.gallery.length > 1 && (
                <div className="gallery-thumbnails" role="tablist">
                  {product.gallery.map((imgUrl, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`gallery-thumb-btn ${
                        activeImage === imgUrl ? "active" : ""
                      }`}
                      onClick={() => setActiveImage(imgUrl)}
                      aria-label={`View image ${index + 1}`}
                      role="tab"
                      aria-selected={activeImage === imgUrl}
                    >
                      <img src={imgUrl} alt={`${product.name} thumbnail ${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Product Info & Actions */}
            <div className="product-info-panel">
              {/* Category & Color Meta */}
              <div className="product-meta-top">
                <span className="product-category-label">
                  {product.category}
                </span>
                <span className="product-color-label">{product.color}</span>
              </div>

              {/* Product Title */}
              <h1 className="product-title">{product.name}</h1>

              {/* Price */}
              <div className="product-price-wrapper">
                <span className="product-price">
                  {typeof product.price === "number"
                    ? `₹${product.price.toLocaleString()}`
                    : product.price}
                </span>
                {product.salePrice && (
                  <span className="product-sale-price-strike">
                    ₹{Number(product.salePrice).toLocaleString()}
                  </span>
                )}
                <span className="tax-inclusive-tag">Inclusive of all taxes</span>
              </div>

              {/* Short Teaser Description */}
              <p className="product-short-description">
                {product.shortDescription || product.description}
              </p>

              {/* Size Selector with Stock Badging */}
              {sizeList.length > 0 && (
                <div className="product-size-section">
                  <div className="size-section-header">
                    <span className="size-label-title">SELECT SIZE</span>
                    <button
                      type="button"
                      className="size-guide-link"
                      onClick={() => setActiveAccordion("size-guide")}
                    >
                      Size Guide
                    </button>
                  </div>

                  <div className="size-options-grid" role="radiogroup" aria-label="Sizes">
                    {sizeList.map((s) => {
                      const isUnavailable = s.stock <= 0;
                      const isSelected = selectedSize === s.size;

                      return (
                        <button
                          key={s.size}
                          type="button"
                          className={`size-btn ${isSelected ? "selected" : ""} ${
                            isUnavailable ? "sold-out-size" : ""
                          }`}
                          onClick={() => {
                            if (!isUnavailable) {
                              setSelectedSize(s.size);
                              setQuantity((q) => Math.min(q, Math.max(1, s.stock)));
                            }
                          }}
                          disabled={isUnavailable}
                          role="radio"
                          aria-checked={isSelected}
                          title={
                            isUnavailable
                              ? `${s.size} - Sold Out`
                              : s.stock <= 3
                              ? `${s.size} - Only ${s.stock} left`
                              : `${s.size} - In Stock`
                          }
                        >
                          <span className="size-btn-text">{s.size}</span>
                          {isUnavailable && <span className="size-btn-strike" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Stock Availability Feedback Hint */}
                  <div className="size-stock-feedback-wrapper">
                    {currentSizeStock > 0 && currentSizeStock <= 3 && (
                      <span className="size-stock-hint low-stock">
                        🔥 ONLY {currentSizeStock} LEFT IN SIZE {selectedSize} — ORDER SOON
                      </span>
                    )}
                    {currentSizeStock <= 0 && !isSoldOut && (
                      <span className="size-stock-hint out-of-stock">
                        SIZE {selectedSize} IS CURRENTLY SOLD OUT
                      </span>
                    )}
                    {isSoldOut && (
                      <span className="size-stock-hint out-of-stock">
                        ALL SIZES ARE CURRENTLY SOLD OUT
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Quantity & Actions */}
              <div className="product-purchase-section product-action-row">
                <div className="quantity-wrapper quantity-stepper">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1 || isSoldOut || currentSizeStock <= 0}
                  >
                    <FiMinus />
                  </button>
                  <span className="qty-number" aria-label={`Quantity ${quantity}`}>
                    {quantity}
                  </span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setQuantity((q) => Math.min(maxAllowedQuantity, q + 1))}
                    aria-label="Increase quantity"
                    disabled={quantity >= maxAllowedQuantity || isSoldOut || currentSizeStock <= 0}
                  >
                    <FiPlus />
                  </button>
                </div>

                <button
                  type="button"
                  className={`add-to-cart-btn ${cartFeedback ? "success" : ""} ${
                    isSoldOut || currentSizeStock <= 0 ? "sold-out-btn" : ""
                  }`}
                  onClick={handleAddToCart}
                  disabled={isSoldOut || currentSizeStock <= 0}
                >
                  <FiShoppingBag />
                  <span>
                    {isSoldOut || currentSizeStock <= 0
                      ? "SOLD OUT"
                      : cartFeedback
                      ? "ADDED TO BAG ✓"
                      : "ADD TO CART"}
                  </span>
                </button>

                <button
                  type="button"
                  className={`wishlist-toggle-btn ${wishlisted ? "active" : ""}`}
                  onClick={handleWishlistToggle}
                  aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <FiHeart className={wishlisted ? "filled-heart" : ""} />
                </button>
              </div>

              {/* Feedback Alert Toast */}
              <AnimatePresence>
                {cartFeedback && (
                  <motion.div
                    className="cart-feedback-banner"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <FiCheck className="feedback-check-icon" />
                    <span>{feedbackText}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Assurance / Trust Signals */}
              <div className="product-trust-signals">
                <div className="trust-signal-item">
                  <FiTruck />
                  <div>
                    <strong>Free Shipping</strong>
                    <p>Complimentary delivery across India on all orders</p>
                  </div>
                </div>

                <div className="trust-signal-item">
                  <FiRefreshCw />
                  <div>
                    <strong>7-Day Returns</strong>
                    <p>Hassle-free doorstep pickup &amp; size exchanges</p>
                  </div>
                </div>

                <div className="trust-signal-item">
                  <FiShield />
                  <div>
                    <strong>Authentic Garment</strong>
                    <p>100% Genuine luxury cotton handcrafted for longevity</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Accordion Information Section */}
          <section className="product-accordion-section" aria-label="Product Information">
            {/* Description Tab */}
            <div className="accordion-item">
              <button
                type="button"
                className={`accordion-trigger ${activeAccordion === "description" ? "open" : ""}`}
                onClick={() => toggleAccordion("description")}
                aria-expanded={activeAccordion === "description"}
              >
                <span>DESCRIPTION &amp; SILHOUETTE</span>
                <FiChevronDown className="accordion-chevron" />
              </button>

              <AnimatePresence>
                {activeAccordion === "description" && (
                  <motion.div
                    className="accordion-content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="accordion-text">{product.description}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Product Details & Fabric */}
            <div className="accordion-item">
              <button
                type="button"
                className={`accordion-trigger ${activeAccordion === "details" ? "open" : ""}`}
                onClick={() => toggleAccordion("details")}
                aria-expanded={activeAccordion === "details"}
              >
                <span>SPECIFICATIONS &amp; CARE</span>
                <FiChevronDown className="accordion-chevron" />
              </button>

              <AnimatePresence>
                {activeAccordion === "details" && (
                  <motion.div
                    className="accordion-content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ul className="details-list">
                      {product.fabric && (
                        <li>
                          <strong>Fabric:</strong> {product.fabric}
                        </li>
                      )}
                      {product.fit && (
                        <li>
                          <strong>Fit:</strong> {product.fit}
                        </li>
                      )}
                      {product.care && (
                        <li>
                          <strong>Care:</strong> {product.care}
                        </li>
                      )}
                      {product.details?.map((detail, idx) => (
                        <li key={idx}>{detail}</li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Size Guide Tab */}
            <div className="accordion-item">
              <button
                type="button"
                className={`accordion-trigger ${activeAccordion === "size-guide" ? "open" : ""}`}
                onClick={() => toggleAccordion("size-guide")}
                aria-expanded={activeAccordion === "size-guide"}
              >
                <span>SIZE GUIDE (INCHES)</span>
                <FiChevronDown className="accordion-chevron" />
              </button>

              <AnimatePresence>
                {activeAccordion === "size-guide" && (
                  <motion.div
                    className="accordion-content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <table className="size-guide-table">
                      <thead>
                        <tr>
                          <th>SIZE</th>
                          <th>CHEST</th>
                          <th>SHOULDER</th>
                          <th>LENGTH</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>S</td>
                          <td>38"</td>
                          <td>17.5"</td>
                          <td>28.5"</td>
                        </tr>
                        <tr>
                          <td>M</td>
                          <td>40"</td>
                          <td>18.0"</td>
                          <td>29.0"</td>
                        </tr>
                        <tr>
                          <td>L</td>
                          <td>42"</td>
                          <td>18.5"</td>
                          <td>29.5"</td>
                        </tr>
                        <tr>
                          <td>XL</td>
                          <td>44"</td>
                          <td>19.0"</td>
                          <td>30.0"</td>
                        </tr>
                        <tr>
                          <td>XXL</td>
                          <td>46"</td>
                          <td>19.5"</td>
                          <td>30.5"</td>
                        </tr>
                      </tbody>
                    </table>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Shipping & Returns Tab */}
            <div className="accordion-item">
              <button
                type="button"
                className={`accordion-trigger ${activeAccordion === "shipping" ? "open" : ""}`}
                onClick={() => toggleAccordion("shipping")}
                aria-expanded={activeAccordion === "shipping"}
              >
                <span>SHIPPING INFORMATION</span>
                <FiChevronDown className="accordion-chevron" />
              </button>

              <AnimatePresence>
                {activeAccordion === "shipping" && (
                  <motion.div
                    className="accordion-content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="accordion-text">
                      All orders are dispatched from our studio within 24–48 hours. Express delivery takes 2–4 business days across metro cities in India.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Returns & Exchanges Tab */}
            <div className="accordion-item">
              <button
                type="button"
                className={`accordion-trigger ${activeAccordion === "returns" ? "open" : ""}`}
                onClick={() => toggleAccordion("returns")}
                aria-expanded={activeAccordion === "returns"}
              >
                <span>RETURNS &amp; EXCHANGES</span>
                <FiChevronDown className="accordion-chevron" />
              </button>

              <AnimatePresence>
                {activeAccordion === "returns" && (
                  <motion.div
                    className="accordion-content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="accordion-text">
                      We offer a 7-day hassle-free return and size exchange policy. All items must be unused, unwashed, with all original tags attached.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Personalized Recommendations: YOU MAY ALSO LIKE */}
          {displayRecommendations.length > 0 && (
            <section className="product-related-section" aria-label="Personalized Recommendations">
              <div className="related-section-header">
                <span className="related-eyebrow">COMPLETE THE LOOK</span>
                <h2 className="related-title">YOU MAY ALSO LIKE.</h2>
              </div>

              <div className="related-products-grid">
                {displayRecommendations.map((relProduct) => (
                  <ProductCard key={relProduct.id || relProduct._id} product={relProduct} />
                ))}
              </div>
            </section>
          )}

          {/* Browsing History: RECENTLY VIEWED */}
          <RecentlyViewed currentProductId={product.id || product._id} />
        </div>
      </main>
    </>
  );
}

function Product() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadProduct() {
      setLoading(true);
      try {
        const res = await getProductBySlug(slug);
        if (res?.success && res.product && isMounted) {
          setProduct(res.product);
        } else if (isMounted) {
          setProduct(null);
        }
      } catch (err) {
        console.warn("[Product] Dynamic product fetch failed:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Scroll to top when product changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="product-page">
          <div className="product-container" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "var(--font-ui, Montserrat)", fontSize: "0.8rem", letterSpacing: "0.15em", color: "#888888" }}>
              LOADING VENSEVEN GARMENT...
            </span>
          </div>
        </main>
      </>
    );
  }

  if (!product) {
    return <ProductNotFound />;
  }

  return <ProductDetails key={product.id || product._id} product={product} />;
}

export default Product;
