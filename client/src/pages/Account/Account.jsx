import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiLock,
  FiMail,
  FiUser,
  FiPhone,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiCheck,
  FiShield,
  FiPackage,
  FiHeart,
  FiStar,
  FiLogOut,
  FiShoppingBag,
} from "react-icons/fi";

import Navbar from "../../components/layout/Navbar/Navbar";
import { useAuth } from "../../context/useAuth";
import { forgotPassword } from "../../services/authService";
import "./Account.css";

function Account() {
  const { user, isAuthenticated, login, register, logout, authError, clearError } =
    useAuth();

  const [view, setView] = useState("login"); // 'login' | 'register' | 'forgot'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    agreeTerms: true,
  });
  const [forgotEmail, setForgotEmail] = useState("");

  const [localError, setLocalError] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset errors when switching views
  const handleSwitchView = (newView) => {
    setView(newView);
    setLocalError("");
    setFeedbackMsg("");
    clearError();
  };

  // Login Submit Handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setFeedbackMsg("");

    const emailTrimmed = loginData.email.trim();
    const passwordTrimmed = loginData.password.trim();

    if (!emailTrimmed || !passwordTrimmed) {
      setLocalError("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    const result = await login(emailTrimmed, passwordTrimmed);
    setIsSubmitting(false);

    if (!result.success) {
      setLocalError(result.error || "Sign in failed. Please check your credentials.");
    }
  };

  // Register Submit Handler
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setFeedbackMsg("");

    const nameTrimmed = registerData.name.trim();
    const emailTrimmed = registerData.email.trim();
    const passwordTrimmed = registerData.password.trim();

    if (!nameTrimmed || !emailTrimmed || !passwordTrimmed) {
      setLocalError("Please fill in all required fields.");
      return;
    }

    if (passwordTrimmed.length < 6) {
      setLocalError("Password must be at least 6 characters long.");
      return;
    }

    if (passwordTrimmed !== registerData.confirmPassword.trim()) {
      setLocalError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const result = await register(
      nameTrimmed,
      emailTrimmed,
      passwordTrimmed,
      registerData.phone.trim()
    );
    setIsSubmitting(false);

    if (result.success) {
      setFeedbackMsg(`Account created successfully for ${result.user.name}!`);
    } else {
      setLocalError(result.error || "Registration failed. Please try again.");
    }
  };

  // Real Forgot Password Handler
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setFeedbackMsg("");

    const trimmedEmail = forgotEmail.trim();
    if (!trimmedEmail) {
      setLocalError("Please enter your registered email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setLocalError("Please provide a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await forgotPassword(trimmedEmail);
      if (result?.success) {
        setFeedbackMsg(
          result.message ||
            "If an account exists for this email, password reset instructions have been sent."
        );
        setForgotEmail("");
      } else {
        setLocalError(result?.message || "Failed to process recovery request.");
      }
    } catch (err) {
      console.error("[Forgot Password UI Error]:", err);
      setLocalError(
        err.data?.message || err.message || "Unable to send recovery email. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = localError || authError;

  return (
    <>
      <Navbar />

      <main className="account-page">
        <div className="account-container">
          {/* =========================================================
             STATE A: AUTHENTICATED USER PORTAL
          ========================================================= */}
          {isAuthenticated && user ? (
            <div className="account-authenticated-view">
              <header className="account-header">
                <span className="account-eyebrow">CLIENT PRIVILEGES</span>
                <h1 className="account-title">WELCOME BACK</h1>
                <p className="account-subtitle">
                  Signed in as <strong>{user.email}</strong>. Access your curated preferences and priority acquisitions.
                </p>
              </header>

              <div className="account-layout">
                {/* User Profile Card */}
                <div className="account-card auth-profile-card">
                  <div className="profile-header-strip">
                    <div className="profile-avatar">
                      {user.name ? user.name.charAt(0).toUpperCase() : "V"}
                    </div>
                    <div className="profile-headline">
                      <span className="profile-badge">VENSEVEN MEMBER</span>
                      <h2 className="profile-name">{user.name}</h2>
                      <span className="profile-email">{user.email}</span>
                    </div>
                  </div>

                  <div className="profile-details-grid">
                    <div className="profile-detail-item">
                      <span className="detail-label">MEMBER STATUS</span>
                      <strong className="detail-value">Verified Client</strong>
                    </div>
                    <div className="profile-detail-item">
                      <span className="detail-label">CONTACT NUMBER</span>
                      <strong className="detail-value">
                        {user.phone || "Not specified"}
                      </strong>
                    </div>
                    <div className="profile-detail-item">
                      <span className="detail-label">EXPRESS DELIVERY</span>
                      <strong className="detail-value">Insured Delhivery / BlueDart</strong>
                    </div>
                    <div className="profile-detail-item">
                      <span className="detail-label">STUDIO LOCATION</span>
                      <strong className="detail-value">Hyderabad Studio</strong>
                    </div>
                  </div>

                  <div className="profile-actions-row">
                    {user?.role === "admin" && (
                      <Link to="/admin" className="profile-action-btn primary" style={{ background: "#ffffff", color: "#000000" }}>
                        <FiShield />
                        <span>ADMIN DASHBOARD</span>
                      </Link>
                    )}

                    <Link to="/orders" className="profile-action-btn primary">
                      <FiPackage />
                      <span>MY ORDERS</span>
                    </Link>

                    <Link to="/shop" className="profile-action-btn secondary">
                      <FiShoppingBag />
                      <span>EXPLORE COLLECTION</span>
                    </Link>

                    <Link to="/wishlist" className="profile-action-btn secondary">
                      <FiHeart />
                      <span>VIEW WISHLIST</span>
                    </Link>

                    <button
                      type="button"
                      className="profile-logout-btn"
                      onClick={logout}
                    >
                      <FiLogOut />
                      <span>LOG OUT</span>
                    </button>
                  </div>
                </div>

                {/* Right: Benefits Sidebar */}
                <aside className="account-benefits-sidebar">
                  <div className="benefits-card">
                    <span className="benefits-eyebrow">ACTIVE PRIVILEGES</span>
                    <h3 className="benefits-title">YOUR CLIENT ADVANTAGES</h3>

                    <div className="benefits-list">
                      <div className="benefit-item">
                        <div className="benefit-icon-box">
                          <FiPackage />
                        </div>
                        <div>
                          <strong>Automatic Checkout Prefill</strong>
                          <p>Your name and email are synced for swift acquisitions.</p>
                        </div>
                      </div>

                      <div className="benefit-item">
                        <div className="benefit-icon-box">
                          <FiHeart />
                        </div>
                        <div>
                          <strong>Synced Sartorial Wishlist</strong>
                          <p>Your saved pieces persist across all browsing sessions.</p>
                        </div>
                      </div>

                      <div className="benefit-item">
                        <div className="benefit-icon-box">
                          <FiStar />
                        </div>
                        <div>
                          <strong>Priority Release Notifications</strong>
                          <p>Receive early previews of upcoming seasonal drops.</p>
                        </div>
                      </div>

                      <div className="benefit-item">
                        <div className="benefit-icon-box">
                          <FiShield />
                        </div>
                        <div>
                          <strong>Studio Guarantee</strong>
                          <p>100% genuine craftsmanship dispatched from Kukatpally.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          ) : (
            /* =========================================================
               STATE B: UNAUTHENTICATED SIGN IN / REGISTER FORMS
            ========================================================= */
            <>
              {/* Header */}
              <header className="account-header">
                <span className="account-eyebrow">CLIENT PORTAL</span>
                <h1 className="account-title">
                  {view === "login" && "SIGN IN"}
                  {view === "register" && "CREATE ACCOUNT"}
                  {view === "forgot" && "RESET PASSWORD"}
                </h1>
                <p className="account-subtitle">
                  {view === "login" &&
                    "Access your curated wardrobe, saved orders, and private releases."}
                  {view === "register" &&
                    "Join the VENSEVEN sartorial circle for exclusive releases and faster checkout."}
                  {view === "forgot" &&
                    "Enter your email address to receive password recovery instructions."}
                </p>
              </header>

              <div className="account-layout">
                {/* Main Auth Form Card */}
                <div className="account-card">
                  {/* Tab Navigation (Login / Register) */}
                  {view !== "forgot" && (
                    <div className="account-tab-bar" role="tablist">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={view === "login"}
                        className={`account-tab-btn ${
                          view === "login" ? "active" : ""
                        }`}
                        onClick={() => handleSwitchView("login")}
                      >
                        SIGN IN
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={view === "register"}
                        className={`account-tab-btn ${
                          view === "register" ? "active" : ""
                        }`}
                        onClick={() => handleSwitchView("register")}
                      >
                        CREATE ACCOUNT
                      </button>
                    </div>
                  )}

                  {/* Alert Feedback Messages */}
                  <AnimatePresence mode="wait">
                    {activeError && (
                      <motion.div
                        className="auth-error-banner"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        {activeError}
                      </motion.div>
                    )}

                    {feedbackMsg && (
                      <motion.div
                        className="auth-success-banner"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        <FiCheck className="banner-icon" />
                        <span>{feedbackMsg}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* VIEW: LOGIN */}
                  {view === "login" && (
                    <motion.form
                      key="login-form"
                      onSubmit={handleLoginSubmit}
                      className="auth-form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Email */}
                      <div className="auth-field-group">
                        <label htmlFor="login-email">
                          Email Address <span className="req">*</span>
                        </label>
                        <div className="input-icon-wrapper">
                          <FiMail className="field-icon" />
                          <input
                            type="email"
                            id="login-email"
                            value={loginData.email}
                            onChange={(e) => {
                              setLoginData({
                                ...loginData,
                                email: e.target.value,
                              });
                              if (localError) setLocalError("");
                              clearError();
                            }}
                            placeholder="e.g. name@example.com"
                            required
                            autoComplete="email"
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="auth-field-group">
                        <div className="label-row">
                          <label htmlFor="login-password">
                            Password <span className="req">*</span>
                          </label>
                          <button
                            type="button"
                            className="forgot-password-link"
                            onClick={() => handleSwitchView("forgot")}
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="input-icon-wrapper">
                          <FiLock className="field-icon" />
                          <input
                            type={showPassword ? "text" : "password"}
                            id="login-password"
                            value={loginData.password}
                            onChange={(e) => {
                              setLoginData({
                                ...loginData,
                                password: e.target.value,
                              });
                              if (localError) setLocalError("");
                              clearError();
                            }}
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                          />
                          <button
                            type="button"
                            className="pwd-toggle-btn"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                          >
                            {showPassword ? <FiEyeOff /> : <FiEye />}
                          </button>
                        </div>
                      </div>

                      {/* Remember Me */}
                      <div className="auth-checkbox-row">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={loginData.remember}
                            onChange={(e) =>
                              setLoginData({
                                ...loginData,
                                remember: e.target.checked,
                              })
                            }
                          />
                          <span>Remember me on this device</span>
                        </label>
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={isSubmitting}
                      >
                        <span>
                          {isSubmitting ? "SIGNING IN..." : "SIGN IN"}
                        </span>
                        <FiArrowRight />
                      </button>

                      {/* Switch Footer */}
                      <div className="auth-card-footer">
                        <span>Don&apos;t have an account?</span>
                        <button
                          type="button"
                          className="switch-view-btn"
                          onClick={() => handleSwitchView("register")}
                        >
                          Create one now →
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {/* VIEW: REGISTER */}
                  {view === "register" && (
                    <motion.form
                      key="register-form"
                      onSubmit={handleRegisterSubmit}
                      className="auth-form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Full Name */}
                      <div className="auth-field-group">
                        <label htmlFor="reg-name">
                          Full Name <span className="req">*</span>
                        </label>
                        <div className="input-icon-wrapper">
                          <FiUser className="field-icon" />
                          <input
                            type="text"
                            id="reg-name"
                            value={registerData.name}
                            onChange={(e) => {
                              setRegisterData({
                                ...registerData,
                                name: e.target.value,
                              });
                              if (localError) setLocalError("");
                              clearError();
                            }}
                            placeholder="e.g. Aryan Sharma"
                            required
                            autoComplete="name"
                          />
                        </div>
                      </div>

                      {/* Email & Phone Grid */}
                      <div className="auth-fields-row">
                        <div className="auth-field-group">
                          <label htmlFor="reg-email">
                            Email Address <span className="req">*</span>
                          </label>
                          <div className="input-icon-wrapper">
                            <FiMail className="field-icon" />
                            <input
                              type="email"
                              id="reg-email"
                              value={registerData.email}
                              onChange={(e) => {
                                setRegisterData({
                                  ...registerData,
                                  email: e.target.value,
                                });
                                if (localError) setLocalError("");
                                clearError();
                              }}
                              placeholder="aryan@example.com"
                              required
                              autoComplete="email"
                            />
                          </div>
                        </div>

                        <div className="auth-field-group">
                          <label htmlFor="reg-phone">Phone Number</label>
                          <div className="input-icon-wrapper">
                            <FiPhone className="field-icon" />
                            <input
                              type="tel"
                              id="reg-phone"
                              value={registerData.phone}
                              onChange={(e) =>
                                setRegisterData({
                                  ...registerData,
                                  phone: e.target.value,
                                })
                              }
                              placeholder="+91 98765 43210"
                              autoComplete="tel"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Password */}
                      <div className="auth-field-group">
                        <label htmlFor="reg-password">
                          Password <span className="req">*</span>
                        </label>
                        <div className="input-icon-wrapper">
                          <FiLock className="field-icon" />
                          <input
                            type={showPassword ? "text" : "password"}
                            id="reg-password"
                            value={registerData.password}
                            onChange={(e) => {
                              setRegisterData({
                                ...registerData,
                                password: e.target.value,
                              });
                              if (localError) setLocalError("");
                              clearError();
                            }}
                            placeholder="Minimum 6 characters"
                            required
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            className="pwd-toggle-btn"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                          >
                            {showPassword ? <FiEyeOff /> : <FiEye />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div className="auth-field-group">
                        <label htmlFor="reg-confirm-password">
                          Confirm Password <span className="req">*</span>
                        </label>
                        <div className="input-icon-wrapper">
                          <FiLock className="field-icon" />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            id="reg-confirm-password"
                            value={registerData.confirmPassword}
                            onChange={(e) => {
                              setRegisterData({
                                ...registerData,
                                confirmPassword: e.target.value,
                              });
                              if (localError) setLocalError("");
                              clearError();
                            }}
                            placeholder="Re-enter password"
                            required
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            className="pwd-toggle-btn"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            aria-label={
                              showConfirmPassword
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                          </button>
                        </div>
                      </div>

                      {/* Terms */}
                      <div className="auth-checkbox-row">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={registerData.agreeTerms}
                            onChange={(e) =>
                              setRegisterData({
                                ...registerData,
                                agreeTerms: e.target.checked,
                              })
                            }
                            required
                          />
                          <span>
                            I agree to VENSEVEN Terms &amp; Privacy Policy
                          </span>
                        </label>
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={isSubmitting}
                      >
                        <span>
                          {isSubmitting
                            ? "CREATING ACCOUNT..."
                            : "CREATE ACCOUNT"}
                        </span>
                        <FiArrowRight />
                      </button>

                      {/* Switch Footer */}
                      <div className="auth-card-footer">
                        <span>Already have an account?</span>
                        <button
                          type="button"
                          className="switch-view-btn"
                          onClick={() => handleSwitchView("login")}
                        >
                          Sign in here →
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {/* VIEW: FORGOT PASSWORD */}
                  {view === "forgot" && (
                    <motion.form
                      key="forgot-form"
                      onSubmit={handleForgotSubmit}
                      className="auth-form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="forgot-instructions">
                        Enter the email address associated with your VENSEVEN
                        account to receive password recovery instructions.
                      </p>

                      {/* Email */}
                      <div className="auth-field-group">
                        <label htmlFor="forgot-email">
                          Registered Email Address <span className="req">*</span>
                        </label>
                        <div className="input-icon-wrapper">
                          <FiMail className="field-icon" />
                          <input
                            type="email"
                            id="forgot-email"
                            value={forgotEmail}
                            onChange={(e) => {
                              setForgotEmail(e.target.value);
                              if (localError) setLocalError("");
                            }}
                            placeholder="e.g. aryan@example.com"
                            required
                            autoComplete="email"
                          />
                        </div>
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={isSubmitting}
                      >
                        <span>
                          {isSubmitting
                            ? "SENDING RECOVERY LINK..."
                            : "SEND RECOVERY LINK"}
                        </span>
                        <FiArrowRight />
                      </button>

                      {/* Back to Login */}
                      <div className="auth-card-footer">
                        <button
                          type="button"
                          className="switch-view-btn center-btn"
                          onClick={() => handleSwitchView("login")}
                        >
                          ← Return to Sign In
                        </button>
                      </div>
                    </motion.form>
                  )}
                </div>

                {/* Right: Client Benefits Sidebar */}
                <aside className="account-benefits-sidebar">
                  <div className="benefits-card">
                    <span className="benefits-eyebrow">VENSEVEN PRIVILEGES</span>
                    <h3 className="benefits-title">WHY CREATE AN ACCOUNT?</h3>

                    <div className="benefits-list">
                      <div className="benefit-item">
                        <div className="benefit-icon-box">
                          <FiPackage />
                        </div>
                        <div>
                          <strong>Order Tracking &amp; History</strong>
                          <p>
                            Instant access to dispatch updates and past garment
                            orders.
                          </p>
                        </div>
                      </div>

                      <div className="benefit-item">
                        <div className="benefit-icon-box">
                          <FiHeart />
                        </div>
                        <div>
                          <strong>Synced Wishlist</strong>
                          <p>
                            Save your preferred pieces across all mobile and
                            desktop devices.
                          </p>
                        </div>
                      </div>

                      <div className="benefit-item">
                        <div className="benefit-icon-box">
                          <FiStar />
                        </div>
                        <div>
                          <strong>Private Drop Access</strong>
                          <p>
                            Priority notification for limited seasonal releases
                            and archival drops.
                          </p>
                        </div>
                      </div>

                      <div className="benefit-item">
                        <div className="benefit-icon-box">
                          <FiShield />
                        </div>
                        <div>
                          <strong>Express Checkout</strong>
                          <p>
                            Securely saved delivery addresses for frictionless
                            acquisition.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}

export default Account;
