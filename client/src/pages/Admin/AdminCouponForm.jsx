import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiSave,
  FiAlertCircle,
  FiCheckCircle,
  FiTag,
  FiCalendar,
  FiDollarSign,
  FiPercent,
  FiUsers,
} from "react-icons/fi";
import { useAuth } from "../../context/useAuth";
import {
  getAdminCouponById,
  createCoupon,
  updateCoupon,
} from "../../services/couponService";
import "./AdminCouponForm.css";

const CATEGORY_OPTIONS = [
  "Shirts",
  "Trousers",
  "T-Shirts",
  "Shorts",
  "Blazers",
  "Accessories",
];

function getInitialFormState() {
  const today = new Date().toISOString().split("T")[0];
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  return {
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    minimumOrderAmount: "",
    maximumDiscountAmount: "",
    startDate: today,
    expiryDate: nextMonth,
    usageLimit: "",
    perUserLimit: "1",
    applicableCategories: [],
    isActive: true,
  };
}

function AdminCouponForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { token } = useAuth();

  const [formData, setFormData] = useState(getInitialFormState);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let isMounted = true;
    if (!isEditMode || !token) return;

    async function load() {
      try {
        const res = await getAdminCouponById(id, token);
        if (isMounted) {
          if (res.success && res.coupon) {
            const c = res.coupon;
            setFormData({
              code: c.code || "",
              description: c.description || "",
              discountType: c.discountType || "percentage",
              discountValue: c.discountValue ? String(c.discountValue) : "",
              minimumOrderAmount:
                c.minimumOrderAmount ? String(c.minimumOrderAmount) : "",
              maximumDiscountAmount:
                c.maximumDiscountAmount ? String(c.maximumDiscountAmount) : "",
              startDate: c.startDate
                ? new Date(c.startDate).toISOString().split("T")[0]
                : "",
              expiryDate: c.expiryDate
                ? new Date(c.expiryDate).toISOString().split("T")[0]
                : "",
              usageLimit: c.usageLimit ? String(c.usageLimit) : "",
              perUserLimit: c.perUserLimit ? String(c.perUserLimit) : "1",
              applicableCategories: c.applicableCategories || [],
              isActive: c.isActive !== undefined ? c.isActive : true,
            });
          } else {
            setError(res.message || "Failed to load coupon details.");
          }
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setError("Network error loading coupon.");
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [id, isEditMode, token]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (error) setError("");
  };

  const handleCategoryToggle = (category) => {
    setFormData((prev) => {
      const current = prev.applicableCategories || [];
      const exists = current.includes(category);
      return {
        ...prev,
        applicableCategories: exists
          ? current.filter((c) => c !== category)
          : [...current, category],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    // Client Validation
    if (!formData.code || !formData.code.trim()) {
      setError("Coupon code is required.");
      return;
    }

    const numVal = Number(formData.discountValue);
    if (isNaN(numVal) || numVal <= 0) {
      setError("Please enter a valid discount value greater than 0.");
      return;
    }

    if (formData.discountType === "percentage" && (numVal < 1 || numVal > 100)) {
      setError("Percentage discount must be between 1 and 100.");
      return;
    }

    if (!formData.expiryDate) {
      setError("Expiry date is required.");
      return;
    }

    if (new Date(formData.expiryDate) <= new Date(formData.startDate)) {
      setError("Expiry date must be after the start date.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      code: formData.code.trim().toUpperCase(),
      description: formData.description.trim(),
      discountType: formData.discountType,
      discountValue: numVal,
      minimumOrderAmount: formData.minimumOrderAmount
        ? Number(formData.minimumOrderAmount)
        : 0,
      maximumDiscountAmount: formData.maximumDiscountAmount
        ? Number(formData.maximumDiscountAmount)
        : null,
      startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
      expiryDate: new Date(formData.expiryDate),
      usageLimit: formData.usageLimit
        ? parseInt(formData.usageLimit, 10)
        : null,
      perUserLimit: formData.perUserLimit
        ? parseInt(formData.perUserLimit, 10)
        : 1,
      applicableCategories: formData.applicableCategories,
      isActive: formData.isActive,
    };

    try {
      let res;
      if (isEditMode) {
        res = await updateCoupon(id, payload, token);
      } else {
        res = await createCoupon(payload, token);
      }

      if (res.success) {
        setSuccess(res.message || "Coupon saved successfully.");
        setTimeout(() => {
          navigate("/admin/coupons");
        }, 1200);
      } else {
        setError(res.message || "Failed to save coupon.");
      }
    } catch {
      setError("Network error saving coupon.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-coupon-form-page loading">
        <p>Loading coupon editor...</p>
      </div>
    );
  }

  return (
    <div className="admin-coupon-form-page">
      {/* Header */}
      <div className="admin-form-header">
        <Link to="/admin/coupons" className="admin-back-link">
          <FiArrowLeft />
          <span>BACK TO COUPONS</span>
        </Link>
        <h1 className="admin-form-title">
          {isEditMode ? `EDIT COUPON — ${formData.code}` : "CREATE PROMOTIONAL COUPON"}
        </h1>
        <p className="admin-form-subtitle">
          Configure discount metrics, order limits, validity dates, and category applicability.
        </p>
      </div>

      {/* Error & Success Banners */}
      {error && (
        <div className="form-alert-banner error">
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="form-alert-banner success">
          <FiCheckCircle />
          <span>{success}</span>
        </div>
      )}

      {/* Main Form */}
      <form className="admin-coupon-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Left Column: Core Settings */}
          <div className="form-column">
            <div className="form-card">
              <h2 className="form-card-title">
                <FiTag />
                <span>COUPON IDENTITY</span>
              </h2>

              <div className="form-field">
                <label htmlFor="code">
                  COUPON CODE <span className="req">*</span>
                </label>
                <input
                  id="code"
                  type="text"
                  name="code"
                  placeholder="e.g. FESTIVE20, WELCOME10"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  required
                  maxLength={30}
                  className="code-input"
                />
                <span className="field-hint">
                  Codes automatically convert to uppercase and must be unique.
                </span>
              </div>

              <div className="form-field">
                <label htmlFor="description">CAMPAIGN DESCRIPTION</label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="e.g. 20% off all festive menswear outerwear"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div className="form-field checkbox-field">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                  <span className="slider round" />
                </label>
                <div className="toggle-label-group">
                  <strong>COUPON ACTIVE STATUS</strong>
                  <span>
                    When enabled, eligible customers can redeem this code.
                  </span>
                </div>
              </div>
            </div>

            {/* Discount Configuration Card */}
            <div className="form-card">
              <h2 className="form-card-title">
                <FiDollarSign />
                <span>DISCOUNT VALUES</span>
              </h2>

              <div className="form-field">
                <label>DISCOUNT TYPE</label>
                <div className="discount-type-switcher">
                  <button
                    type="button"
                    className={`switcher-btn ${
                      formData.discountType === "percentage" ? "active" : ""
                    }`}
                    onClick={() =>
                      setFormData((p) => ({ ...p, discountType: "percentage" }))
                    }
                  >
                    <FiPercent />
                    <span>PERCENTAGE (%)</span>
                  </button>
                  <button
                    type="button"
                    className={`switcher-btn ${
                      formData.discountType === "fixed" ? "active" : ""
                    }`}
                    onClick={() =>
                      setFormData((p) => ({ ...p, discountType: "fixed" }))
                    }
                  >
                    <FiDollarSign />
                    <span>FIXED AMOUNT (₹)</span>
                  </button>
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-field">
                  <label htmlFor="discountValue">
                    {formData.discountType === "percentage"
                      ? "PERCENTAGE DISCOUNT (%)"
                      : "FIXED DISCOUNT (₹)"}{" "}
                    <span className="req">*</span>
                  </label>
                  <input
                    id="discountValue"
                    type="number"
                    name="discountValue"
                    placeholder={
                      formData.discountType === "percentage" ? "10" : "500"
                    }
                    value={formData.discountValue}
                    onChange={handleInputChange}
                    min={1}
                    max={formData.discountType === "percentage" ? 100 : undefined}
                    required
                  />
                </div>

                {formData.discountType === "percentage" && (
                  <div className="form-field">
                    <label htmlFor="maximumDiscountAmount">MAX DISCOUNT CAP (₹)</label>
                    <input
                      id="maximumDiscountAmount"
                      type="number"
                      name="maximumDiscountAmount"
                      placeholder="e.g. 1500 (Optional)"
                      value={formData.maximumDiscountAmount}
                      onChange={handleInputChange}
                      min={0}
                    />
                  </div>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="minimumOrderAmount">MINIMUM ORDER SUBTOTAL (₹)</label>
                <input
                  id="minimumOrderAmount"
                  type="number"
                  name="minimumOrderAmount"
                  placeholder="e.g. 2999 (0 for no minimum)"
                  value={formData.minimumOrderAmount}
                  onChange={handleInputChange}
                  min={0}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Validity, Usage Limits & Categories */}
          <div className="form-column">
            {/* Validity Schedule */}
            <div className="form-card">
              <h2 className="form-card-title">
                <FiCalendar />
                <span>VALIDITY SCHEDULE</span>
              </h2>

              <div className="form-row two-col">
                <div className="form-field">
                  <label htmlFor="startDate">START DATE</label>
                  <input
                    id="startDate"
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="expiryDate">
                    EXPIRY DATE <span className="req">*</span>
                  </label>
                  <input
                    id="expiryDate"
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Redemption Limits */}
            <div className="form-card">
              <h2 className="form-card-title">
                <FiUsers />
                <span>REDEMPTION LIMITS</span>
              </h2>

              <div className="form-row two-col">
                <div className="form-field">
                  <label htmlFor="usageLimit">GLOBAL USAGE LIMIT</label>
                  <input
                    id="usageLimit"
                    type="number"
                    name="usageLimit"
                    placeholder="Leave empty for unlimited"
                    value={formData.usageLimit}
                    onChange={handleInputChange}
                    min={1}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="perUserLimit">PER-USER LIMIT</label>
                  <input
                    id="perUserLimit"
                    type="number"
                    name="perUserLimit"
                    placeholder="1"
                    value={formData.perUserLimit}
                    onChange={handleInputChange}
                    min={1}
                  />
                </div>
              </div>
            </div>

            {/* Category Applicability */}
            <div className="form-card">
              <h2 className="form-card-title">
                <FiTag />
                <span>CATEGORY APPLICABILITY</span>
              </h2>
              <span className="field-hint">
                Select specific categories to restrict redemption, or leave empty to apply across entire collection.
              </span>

              <div className="category-checkboxes-grid">
                {CATEGORY_OPTIONS.map((cat) => {
                  const isChecked =
                    formData.applicableCategories?.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      className={`cat-pill-btn ${isChecked ? "selected" : ""}`}
                      onClick={() => handleCategoryToggle(cat)}
                    >
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="form-footer-actions">
          <Link to="/admin/coupons" className="cancel-form-btn">
            CANCEL
          </Link>
          <button
            type="submit"
            className="save-coupon-btn"
            disabled={saving}
          >
            <FiSave />
            <span>{saving ? "SAVING..." : isEditMode ? "UPDATE COUPON" : "CREATE COUPON"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminCouponForm;
