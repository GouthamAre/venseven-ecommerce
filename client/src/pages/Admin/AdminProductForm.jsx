import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiUploadCloud,
  FiTrash2,
  FiPlus,
  FiStar,
  FiZap,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
} from "react-icons/fi";
import {
  getAdminProductById,
  createProduct,
  updateProduct,
  uploadProductImages,
} from "../../services/productService";
import "./AdminProductForm.css";

const CATEGORY_OPTIONS = [
  "Shirts",
  "Trousers",
  "T-Shirts",
  "Shorts",
  "Blazers",
  "Suits",
  "Accessories",
];

const STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "30", "32", "34", "36", "38"];

function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("venseven_auth_token");
  const isEditMode = Boolean(id);
  const fileInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    shortDescription: "",
    description: "",
    details: [""],
    care: "",
    category: "Shirts",
    subcategory: "",
    color: "",
    colorHex: "#000000",
    fabric: "",
    fit: "",
    tags: "",
    price: "",
    salePrice: "",
    sizes: [
      { size: "S", stock: 10, sku: "" },
      { size: "M", stock: 15, sku: "" },
      { size: "L", stock: 10, sku: "" },
    ],
    images: [],
    primaryImage: "",
    isActive: true,
    isNewArrival: false,
    isBestSeller: false,
  });

  const [loadingInitial, setLoadingInitial] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch product data in edit mode
  useEffect(() => {
    if (!isEditMode) return;

    let isMounted = true;
    async function loadProduct() {
      try {
        const res = await getAdminProductById(id, token);
        if (res?.success && res.product && isMounted) {
          const p = res.product;
          setFormData({
            name: p.name || "",
            slug: p.slug || "",
            shortDescription: p.shortDescription || "",
            description: p.description || "",
            details: p.details && p.details.length > 0 ? p.details : [""],
            care: p.care || "",
            category: p.category || "Shirts",
            subcategory: p.subcategory || "",
            color: p.color || "",
            colorHex: p.colorHex || "#000000",
            fabric: p.fabric || "",
            fit: p.fit || "",
            tags: Array.isArray(p.tags) ? p.tags.join(", ") : "",
            price: p.price !== undefined ? String(p.price) : "",
            salePrice: p.salePrice ? String(p.salePrice) : "",
            sizes:
              Array.isArray(p.sizes) && p.sizes.length > 0
                ? p.sizes
                : [{ size: "M", stock: 10, sku: "" }],
            images: Array.isArray(p.images) ? p.images : [],
            primaryImage: p.primaryImage || (p.images?.[0]?.url || ""),
            isActive: p.isActive !== undefined ? p.isActive : true,
            isNewArrival: Boolean(p.isNewArrival),
            isBestSeller: Boolean(p.isBestSeller),
          });
          setLastUpdated(p.updatedAt || p.createdAt);
        }
      } catch (err) {
        if (isMounted) {
          setErrorMessage(err.message || "Failed to load product for editing.");
        }
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    }

    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [id, isEditMode, token]);

  // Form field change handler
  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-generate slug preview for new products if slug wasn't manually edited
      if (field === "name" && !isEditMode) {
        next.slug = value
          .toString()
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-");
      }
      return next;
    });
    if (errorMessage) setErrorMessage("");
  };

  // Bullet Details handlers
  const handleDetailChange = (index, value) => {
    setFormData((prev) => {
      const next = [...prev.details];
      next[index] = value;
      return { ...prev, details: next };
    });
  };

  const handleAddDetail = () => {
    setFormData((prev) => ({ ...prev, details: [...prev.details, ""] }));
  };

  const handleRemoveDetail = (index) => {
    setFormData((prev) => {
      const next = prev.details.filter((_, i) => i !== index);
      return { ...prev, details: next.length > 0 ? next : [""] };
    });
  };

  // Sizes & Inventory handlers
  const handleSizeRowChange = (index, field, val) => {
    setFormData((prev) => {
      const next = [...prev.sizes];
      next[index] = { ...next[index], [field]: val };
      return { ...prev, sizes: next };
    });
  };

  const handleAddSizeRow = () => {
    setFormData((prev) => ({
      ...prev,
      sizes: [...prev.sizes, { size: "M", stock: 10, sku: "" }],
    }));
  };

  const handleRemoveSizeRow = (index) => {
    setFormData((prev) => {
      const next = prev.sizes.filter((_, i) => i !== index);
      return { ...prev, sizes: next.length > 0 ? next : [{ size: "M", stock: 0, sku: "" }] };
    });
  };

  // Image Upload handler
  const handleImageFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (formData.images.length + files.length > 8) {
      alert("A product can have a maximum of 8 images.");
      return;
    }

    const uploadPayload = new FormData();
    files.forEach((file) => {
      uploadPayload.append("images", file);
    });

    setIsUploadingImages(true);
    setErrorMessage("");
    try {
      const res = await uploadProductImages(uploadPayload, token);
      if (res?.success && Array.isArray(res.images)) {
        setFormData((prev) => {
          const combined = [...prev.images, ...res.images];
          const primary = prev.primaryImage || combined[0]?.url || "";
          return {
            ...prev,
            images: combined,
            primaryImage: primary,
          };
        });
      }
    } catch (err) {
      setErrorMessage(err.message || "Failed to upload images to Cloudinary.");
    } finally {
      setIsUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSetPrimaryImage = (url) => {
    setFormData((prev) => ({ ...prev, primaryImage: url }));
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => {
      const removed = prev.images[index];
      const remaining = prev.images.filter((_, i) => i !== index);
      let nextPrimary = prev.primaryImage;
      if (removed.url === prev.primaryImage) {
        nextPrimary = remaining[0]?.url || "";
      }
      return {
        ...prev,
        images: remaining,
        primaryImage: nextPrimary,
      };
    });
  };

  const handleMoveImage = (index, direction) => {
    setFormData((prev) => {
      const next = [...prev.images];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return { ...prev, images: next };
    });
  };

  // Total Inventory calculation
  const totalInventoryCount = formData.sizes.reduce(
    (sum, s) => sum + (Number(s.stock) || 0),
    0
  );

  // Form submission
  const handleSubmit = async (e, forcedActiveStatus) => {
    if (e) e.preventDefault();
    setErrorMessage("");

    // Validate Required Fields
    if (!formData.name.trim()) {
      setErrorMessage("Product name is required.");
      return;
    }
    if (!formData.description.trim()) {
      setErrorMessage("Product description is required.");
      return;
    }
    if (!formData.category.trim()) {
      setErrorMessage("Please select a product category.");
      return;
    }
    const numPrice = Number(formData.price);
    if (isNaN(numPrice) || numPrice < 0 || formData.price === "") {
      setErrorMessage("A valid non-negative price is required.");
      return;
    }

    const activeState =
      forcedActiveStatus !== undefined ? forcedActiveStatus : formData.isActive;

    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      shortDescription: formData.shortDescription.trim(),
      description: formData.description.trim(),
      category: formData.category.trim(),
      subcategory: formData.subcategory.trim(),
      gender: "Men",
      price: numPrice,
      salePrice:
        formData.salePrice && !isNaN(Number(formData.salePrice))
          ? Number(formData.salePrice)
          : null,
      color: formData.color.trim(),
      colorHex: formData.colorHex.trim(),
      fabric: formData.fabric.trim(),
      fit: formData.fit.trim(),
      details: formData.details.filter((d) => d && d.trim().length > 0),
      care: formData.care.trim(),
      tags: formData.tags
        ? formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      sizes: formData.sizes.map((s) => ({
        size: s.size.trim().toUpperCase(),
        stock: Math.max(0, parseInt(s.stock, 10) || 0),
        sku: s.sku.trim(),
      })),
      images: formData.images,
      primaryImage: formData.primaryImage || formData.images[0]?.url || "",
      isActive: activeState,
      isNewArrival: formData.isNewArrival,
      isBestSeller: formData.isBestSeller,
    };

    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await updateProduct(id, payload, token);
      } else {
        await createProduct(payload, token);
      }
      navigate("/admin/products");
    } catch (err) {
      setErrorMessage(err.message || "Failed to save product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="product-form-loading">
        <div className="form-skeleton-header" />
        <div className="form-skeleton-body" />
      </div>
    );
  }

  return (
    <div className="admin-product-form-root">
      {/* Top Header */}
      <div className="form-top-nav">
        <Link to="/admin/products" className="back-link">
          <FiArrowLeft />
          <span>BACK TO PRODUCTS</span>
        </Link>
        {lastUpdated && (
          <span className="last-updated-tag">
            Last Updated: {new Date(lastUpdated).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </span>
        )}
      </div>

      <div className="form-title-header">
        <span className="form-eyebrow">
          {isEditMode ? "STUDIO CATALOGUE EDIT" : "NEW PIECE CREATION"}
        </span>
        <h1 className="form-page-title">
          {isEditMode ? `EDIT: ${formData.name || "PRODUCT"}` : "ADD NEW PRODUCT"}
        </h1>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="form-error-banner" role="alert">
          <FiAlertCircle />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e)} className="product-editorial-form">
        {/* ========================================================
            01 PRODUCT INFORMATION
            ======================================================== */}
        <section className="form-section-card">
          <div className="section-head">
            <span className="section-index">01</span>
            <h2 className="section-heading">PRODUCT INFORMATION</h2>
          </div>

          <div className="form-grid-2">
            <div className="field-group span-2">
              <label htmlFor="product-name">
                Product Name <span className="req">*</span>
              </label>
              <input
                type="text"
                id="product-name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g. Classic Men’s Wine Formal Shirt"
                required
              />
            </div>

            <div className="field-group span-2">
              <label htmlFor="product-slug">
                URL Slug <span className="helper-text">(Auto-generated for SEO)</span>
              </label>
              <div className="slug-input-wrap">
                <span className="slug-prefix">/product/</span>
                <input
                  type="text"
                  id="product-slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                  placeholder="classic-mens-wine-formal-shirt"
                />
              </div>
            </div>

            <div className="field-group span-2">
              <label htmlFor="product-short-desc">Short Tagline / Teaser</label>
              <input
                type="text"
                id="product-short-desc"
                value={formData.shortDescription}
                onChange={(e) => handleInputChange("shortDescription", e.target.value)}
                placeholder="Brief one-line summary for catalogue cards"
              />
            </div>

            <div className="field-group span-2">
              <label htmlFor="product-desc">
                Full Description <span className="req">*</span>
              </label>
              <textarea
                id="product-desc"
                rows="4"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe the silhouette, hand-feel, occasion, and design philosophy..."
                required
              />
            </div>

            {/* Bullet Details */}
            <div className="field-group span-2">
              <label>Highlight Bullet Details</label>
              <div className="details-builder">
                {formData.details.map((bullet, idx) => (
                  <div key={idx} className="detail-row">
                    <span className="detail-dot">•</span>
                    <input
                      type="text"
                      value={bullet}
                      onChange={(e) => handleDetailChange(idx, e.target.value)}
                      placeholder="e.g. Structured semi-spread collar with removable collar stays"
                    />
                    <button
                      type="button"
                      className="remove-detail-btn"
                      onClick={() => handleRemoveDetail(idx)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-detail-btn"
                  onClick={handleAddDetail}
                >
                  <FiPlus />
                  <span>ADD HIGHLIGHT BULLET</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            02 CLASSIFICATION & ATTRIBUTES
            ======================================================== */}
        <section className="form-section-card">
          <div className="section-head">
            <span className="section-index">02</span>
            <h2 className="section-heading">CLASSIFICATION & ATTRIBUTES</h2>
          </div>

          <div className="form-grid-2">
            <div className="field-group">
              <label htmlFor="category">
                Category <span className="req">*</span>
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                required
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label htmlFor="subcategory">Subcategory</label>
              <input
                type="text"
                id="subcategory"
                value={formData.subcategory}
                onChange={(e) => handleInputChange("subcategory", e.target.value)}
                placeholder="e.g. Formal Shirts, Tailored Trousers"
              />
            </div>

            <div className="field-group">
              <label htmlFor="color-name">Color Name</label>
              <input
                type="text"
                id="color-name"
                value={formData.color}
                onChange={(e) => handleInputChange("color", e.target.value)}
                placeholder="e.g. Plum Wine, Onyx Black"
              />
            </div>

            <div className="field-group">
              <label htmlFor="color-hex">Color Swatch Hex</label>
              <div className="color-swatch-input-wrap">
                <input
                  type="color"
                  className="color-picker-input"
                  value={formData.colorHex || "#000000"}
                  onChange={(e) => handleInputChange("colorHex", e.target.value)}
                />
                <input
                  type="text"
                  id="color-hex"
                  value={formData.colorHex}
                  onChange={(e) => handleInputChange("colorHex", e.target.value)}
                  placeholder="#58111A"
                />
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="fabric">Fabric Composition</label>
              <input
                type="text"
                id="fabric"
                value={formData.fabric}
                onChange={(e) => handleInputChange("fabric", e.target.value)}
                placeholder="e.g. 100% Giza Long-Staple Cotton"
              />
            </div>

            <div className="field-group">
              <label htmlFor="fit">Fit / Silhouette</label>
              <input
                type="text"
                id="fit"
                value={formData.fit}
                onChange={(e) => handleInputChange("fit", e.target.value)}
                placeholder="e.g. Slim Tailored, Relaxed Tapered"
              />
            </div>

            <div className="field-group span-2">
              <label htmlFor="care">Care & Maintenance</label>
              <input
                type="text"
                id="care"
                value={formData.care}
                onChange={(e) => handleInputChange("care", e.target.value)}
                placeholder="e.g. Dry clean recommended or machine wash cold gentle."
              />
            </div>

            <div className="field-group span-2">
              <label htmlFor="tags">Search Tags (Comma-separated)</label>
              <input
                type="text"
                id="tags"
                value={formData.tags}
                onChange={(e) => handleInputChange("tags", e.target.value)}
                placeholder="shirts, formal, wine, bestseller, cotton"
              />
            </div>
          </div>
        </section>

        {/* ========================================================
            03 PRICING
            ======================================================== */}
        <section className="form-section-card">
          <div className="section-head">
            <span className="section-index">03</span>
            <h2 className="section-heading">PRICING</h2>
          </div>

          <div className="pricing-layout">
            <div className="form-grid-2">
              <div className="field-group">
                <label htmlFor="price">
                  Original Price (₹ INR) <span className="req">*</span>
                </label>
                <input
                  type="number"
                  id="price"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  placeholder="2499"
                  min="0"
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="sale-price">
                  Sale Price (₹ INR) <span className="helper-text">(Optional)</span>
                </label>
                <input
                  type="number"
                  id="sale-price"
                  value={formData.salePrice}
                  onChange={(e) => handleInputChange("salePrice", e.target.value)}
                  placeholder="1999"
                  min="0"
                />
              </div>
            </div>

            {/* Price Preview Card */}
            <div className="price-preview-card">
              <span className="preview-eyebrow">CUSTOMER STOREFRONT PRICE</span>
              <div className="preview-price-display">
                <span className="current-active-price">
                  ₹{Number(formData.salePrice || formData.price || 0).toLocaleString()}
                </span>
                {formData.salePrice && formData.price && (
                  <span className="original-strikethrough">
                    ₹{Number(formData.price).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            04 INVENTORY & SIZES
            ======================================================== */}
        <section className="form-section-card">
          <div className="section-head">
            <div className="section-title-wrap">
              <span className="section-index">04</span>
              <h2 className="section-heading">INVENTORY & SIZES</h2>
            </div>
            <div className="inventory-summary-badge">
              TOTAL INVENTORY: <strong>{totalInventoryCount} UNITS</strong>
            </div>
          </div>

          <div className="sizes-table-builder">
            <div className="sizes-table-header">
              <span>SIZE</span>
              <span>STOCK UNITS</span>
              <span>SKU CODE</span>
              <span className="text-right">ACTION</span>
            </div>

            {formData.sizes.map((row, idx) => (
              <div key={idx} className="size-table-row">
                {/* Size Selector / Input */}
                <div className="size-col">
                  <input
                    type="text"
                    value={row.size}
                    onChange={(e) =>
                      handleSizeRowChange(idx, "size", e.target.value.toUpperCase())
                    }
                    placeholder="M"
                    list={`size-options-${idx}`}
                    required
                  />
                  <datalist id={`size-options-${idx}`}>
                    {STANDARD_SIZES.map((sz) => (
                      <option key={sz} value={sz} />
                    ))}
                  </datalist>
                </div>

                {/* Stock Units */}
                <div className="stock-col">
                  <input
                    type="number"
                    value={row.stock}
                    onChange={(e) =>
                      handleSizeRowChange(idx, "stock", e.target.value)
                    }
                    min="0"
                    required
                  />
                </div>

                {/* SKU Code */}
                <div className="sku-col">
                  <input
                    type="text"
                    value={row.sku}
                    onChange={(e) =>
                      handleSizeRowChange(idx, "sku", e.target.value)
                    }
                    placeholder="V7-SHT-M-001"
                  />
                </div>

                {/* Remove button */}
                <div className="action-col text-right">
                  <button
                    type="button"
                    className="remove-size-btn"
                    onClick={() => handleRemoveSizeRow(idx)}
                    title="Remove Size"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="add-size-row-btn"
              onClick={handleAddSizeRow}
            >
              <FiPlus />
              <span>ADD SIZE VARIANT</span>
            </button>
          </div>
        </section>

        {/* ========================================================
            05 PRODUCT IMAGES & CLOUDINARY
            ======================================================== */}
        <section className="form-section-card">
          <div className="section-head">
            <span className="section-index">05</span>
            <h2 className="section-heading">PRODUCT IMAGES (MAX 8)</h2>
          </div>

          {/* Upload Drag/Click Zone */}
          <div
            className={`image-upload-zone ${isUploadingImages ? "uploading" : ""}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageFileSelect}
              multiple
              accept="image/jpeg,image/png,image/webp,image/avif"
              style={{ display: "none" }}
            />
            <div className="upload-icon-box">
              <FiUploadCloud />
            </div>
            <div className="upload-instructions">
              <strong className="upload-main-text">
                {isUploadingImages
                  ? "UPLOADING TO CLOUDINARY..."
                  : "CLICK OR DRAG IMAGES TO UPLOAD"}
              </strong>
              <span className="upload-sub-text">
                Supports High-Resolution JPEG, PNG, WebP up to 6MB. Maximum 8 images.
              </span>
            </div>
          </div>

          {/* Image Thumbnails Gallery */}
          {formData.images.length > 0 && (
            <div className="uploaded-gallery-grid">
              {formData.images.map((img, idx) => {
                const isPrimary = (img.url === formData.primaryImage) || (idx === 0 && !formData.primaryImage);
                return (
                  <div
                    key={idx}
                    className={`gallery-card ${isPrimary ? "is-primary" : ""}`}
                  >
                    <img src={img.url} alt={img.alt || `Preview ${idx + 1}`} />

                    {isPrimary && (
                      <span className="primary-pill">
                        <FiStar /> PRIMARY
                      </span>
                    )}

                    <div className="gallery-card-overlay">
                      <div className="overlay-controls">
                        <button
                          type="button"
                          className="control-icon-btn"
                          disabled={idx === 0}
                          onClick={() => handleMoveImage(idx, -1)}
                          title="Move Left"
                        >
                          <FiChevronLeft />
                        </button>

                        {!isPrimary && (
                          <button
                            type="button"
                            className="set-primary-btn"
                            onClick={() => handleSetPrimaryImage(img.url)}
                          >
                            SET PRIMARY
                          </button>
                        )}

                        <button
                          type="button"
                          className="control-icon-btn"
                          disabled={idx === formData.images.length - 1}
                          onClick={() => handleMoveImage(idx, 1)}
                          title="Move Right"
                        >
                          <FiChevronRight />
                        </button>

                        <button
                          type="button"
                          className="delete-img-btn"
                          onClick={() => handleRemoveImage(idx)}
                          title="Remove Image"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ========================================================
            06 PRODUCT VISIBILITY & FLAGS
            ======================================================== */}
        <section className="form-section-card">
          <div className="section-head">
            <span className="section-index">06</span>
            <h2 className="section-heading">STOREFRONT VISIBILITY & BADGES</h2>
          </div>

          <div className="visibility-toggles-list">
            {/* Active Storefront Toggle */}
            <label className="visibility-toggle-item">
              <div className="toggle-info">
                <strong className="toggle-title">ACTIVE ON STOREFRONT</strong>
                <span className="toggle-desc">
                  When enabled, this piece is visible and purchasable in the shop and search.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleInputChange("isActive", e.target.checked)}
              />
              <span className="toggle-switch-visual" />
            </label>

            {/* New Arrival Toggle */}
            <label className="visibility-toggle-item">
              <div className="toggle-info">
                <strong className="toggle-title">
                  <FiZap className="inline-accent" /> NEW ARRIVAL
                </strong>
                <span className="toggle-desc">
                  Features this product in the homepage New Arrivals carousel and filter tabs.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.isNewArrival}
                onChange={(e) => handleInputChange("isNewArrival", e.target.checked)}
              />
              <span className="toggle-switch-visual" />
            </label>

            {/* Best Seller Toggle */}
            <label className="visibility-toggle-item">
              <div className="toggle-info">
                <strong className="toggle-title">
                  <FiStar className="inline-accent" /> BEST SELLER
                </strong>
                <span className="toggle-desc">
                  Marks this piece with the Best Seller badge in the catalogue and editorial feeds.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.isBestSeller}
                onChange={(e) => handleInputChange("isBestSeller", e.target.checked)}
              />
              <span className="toggle-switch-visual" />
            </label>
          </div>
        </section>

        {/* ========================================================
            BOTTOM STICKY ACTION BAR
            ======================================================== */}
        <div className="form-sticky-action-bar">
          <button
            type="button"
            className="action-cancel-btn"
            onClick={() => navigate("/admin/products")}
            disabled={isSubmitting}
          >
            CANCEL
          </button>

          <div className="action-save-group">
            <button
              type="button"
              className="action-draft-btn"
              onClick={(e) => handleSubmit(e, false)}
              disabled={isSubmitting}
            >
              SAVE AS DRAFT
            </button>

            <button
              type="submit"
              className="action-publish-btn"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "SAVING..."
                : isEditMode
                ? "SAVE CHANGES →"
                : "PUBLISH PRODUCT →"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AdminProductForm;
