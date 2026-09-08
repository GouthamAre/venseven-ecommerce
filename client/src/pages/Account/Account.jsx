import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
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

function Account({ initialView }) {
  const {
    user,
    isAuthenticated,
    login,
    register,
    loginWithGoogle,
    logout,
    authError,
    clearError,
  } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Resolve initial tab ('login' | 'register') from URL
  const resolveTab = useCallback(() => {
    const tabParam = (
      searchParams.get("tab") ||
      searchParams.get("mode") ||
      ""
    ).toLowerCase();
    if (tabParam === "register" || tabParam === "signup" || tabParam === "create") {
      return "register";
    }
    return "login";
  }, [searchParams]);

  // Resolve initial view from props, pathname, or query parameters
  const resolveView = useCallback(() => {
    if (initialView) return initialView;
    const tabParam = (
      searchParams.get("tab") ||
      searchParams.get("mode") ||
      ""
    ).toLowerCase();
    if (tabParam === "forgot" || tabParam === "reset") return "forgot";
    if (location.pathname.includes("forgot")) return "forgot";
    return "portal";
  }, [initialView, searchParams, location.pathname]);

  const [view, setView] = useState(resolveView); // 'portal' | 'forgot'
  const [authTab, setAuthTab] = useState(resolveTab); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [gsiRendered, setGsiRendered] = useState(false);
  const googleBtnContainerRef = useRef(null);
  const gsiInitializedRef = useRef(false);

  // Email / Password states
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [forgotEmail, setForgotEmail] = useState("");

  const [localError, setLocalError] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize view and tab if URL or prop changes
  useEffect(() => {
    const targetView = resolveView();
    const targetTab = resolveTab();
    setView(targetView);
    setAuthTab(targetTab);
    setLocalError("");
    setFeedbackMsg("");
    clearError();
  }, [resolveView, resolveTab, clearError]);

  // Auto-redirect helper on successful authentication
  const handleAuthSuccess = useCallback(() => {
    const redirectUrl = searchParams.get("redirect");
    if (redirectUrl) {
      navigate(redirectUrl, { replace: true });
    }
  }, [searchParams, navigate]);

  // Reset feedback & error when switching views
  const handleSwitchView = (newView) => {
    setView(newView);
    setLocalError("");
    setFeedbackMsg("");
    clearError();
  };

  const handleTabChange = (newTab) => {
    setAuthTab(newTab);
    setLocalError("");
    setFeedbackMsg("");
    clearError();
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // Google Sign-In Credential Callback
  const handleGoogleCredentialResponse = useCallback(
    async (response) => {
      if (response?.credential) {
        setIsSubmitting(true);
        setLocalError("");
        setFeedbackMsg("Verifying Google account...");
        const res = await loginWithGoogle(response.credential);
        setIsSubmitting(false);
        if (res.success) {
          setFeedbackMsg("Signed in with Google successfully!");
          handleAuthSuccess();
        } else {
          setLocalError(res.error || "Google authentication failed.");
        }
      } else {
        setIsSubmitting(false);
        setLocalError("No Google credentials returned.");
      }
    },
    [loginWithGoogle, handleAuthSuccess]
  );

  // Initialize Google Identity Services & Render Button
  useEffect(() => {
    const googleClientId = import.meta.env?.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId) return;

    let checkInterval = null;

    const renderGoogleBtn = () => {
      if (window.google?.accounts?.id && googleBtnContainerRef.current) {
        googleBtnContainerRef.current.innerHTML = "";
        const isMobile = window.innerWidth <= 480;
        const targetWidth = isMobile ? 300 : 360;
        window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          width: targetWidth,
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
        });
        setGsiRendered(true);
      }
    };

    const initGsi = () => {
      if (window.google?.accounts?.id) {
        try {
          if (!gsiInitializedRef.current) {
            window.google.accounts.id.initialize({
              client_id: googleClientId,
              callback: handleGoogleCredentialResponse,
              auto_select: false,
              cancel_on_tap_outside: true,
            });
            gsiInitializedRef.current = true;
          }

          renderGoogleBtn();
        } catch (initErr) {
          console.warn("[Google GSI Init Warning]:", initErr);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGsi();
    } else {
      checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          initGsi();
          clearInterval(checkInterval);
        }
      }, 250);
    }

    const handleResize = () => {
      renderGoogleBtn();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      window.removeEventListener("resize", handleResize);
    };
  }, [handleGoogleCredentialResponse, view]);

  // -------------------------------------------------------------
  // GOOGLE SIGN-IN HANDLER
  // -------------------------------------------------------------
  const handleGoogleAuth = async () => {
    setLocalError("");
    setFeedbackMsg("");

    try {
      const googleClientId = import.meta.env?.VITE_GOOGLE_CLIENT_ID;

      if (!googleClientId) {
        setLocalError(
          "Google Sign-In is not configured (VITE_GOOGLE_CLIENT_ID required). Please sign in using your email address and password."
        );
        return;
      }

      if (window.google?.accounts?.id) {
        // First try clicking rendered button if present
        const renderedBtn =
          googleBtnContainerRef.current?.querySelector('[role="button"]') ||
          googleBtnContainerRef.current?.querySelector('div[tabindex="0"]');
        if (renderedBtn) {
          renderedBtn.click();
          return;
        }

        setIsSubmitting(true);
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setIsSubmitting(false);
          }
        });
        return;
      }

      setLocalError(
        "Google Sign-In script is loading or unavailable. Please sign in with your email address and password."
      );
    } catch (err) {
      setIsSubmitting(false);
      setLocalError(err.message || "Failed to initialize Google authentication.");
    }
  };

  // -------------------------------------------------------------
  // EMAIL / PASSWORD AUTHENTICATION HANDLERS
  // -------------------------------------------------------------
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setFeedbackMsg("");
    clearError();

    const emailTrimmed = loginData.email.trim();
    const passwordTrimmed = loginData.password.trim();

    if (!emailTrimmed || !passwordTrimmed) {
      setLocalError("Please enter both email address and password.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setLocalError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    const result = await login(emailTrimmed, passwordTrimmed);
    setIsSubmitting(false);

    if (result.success) {
      setFeedbackMsg("Signed in successfully! Redirecting...");
      handleAuthSuccess();
    } else {
      setLocalError(result.error || "Invalid email address or password.");
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setFeedbackMsg("");
    clearError();

    const nameTrimmed = registerData.name.trim();
    const emailTrimmed = registerData.email.trim();
    const passwordTrimmed = registerData.password.trim();
    const confirmPasswordTrimmed = registerData.confirmPassword.trim();
    const phoneTrimmed = registerData.phone.trim();

    if (!nameTrimmed || !emailTrimmed || !passwordTrimmed || !confirmPasswordTrimmed) {
      setLocalError("Please fill in all required fields.");
      return;
    }

    if (nameTrimmed.length < 2) {
      setLocalError("Full name must be at least 2 characters.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setLocalError("Please provide a valid email address.");
      return;
    }

    if (passwordTrimmed.length < 6) {
      setLocalError("Password must be at least 6 characters long.");
      return;
    }

    if (passwordTrimmed !== confirmPasswordTrimmed) {
      setLocalError("Passwords do not match. Please verify.");
      return;
    }

    if (phoneTrimmed) {
      const cleanPhone = phoneTrimmed.replace(/\D/g, "");
      if (cleanPhone.length !== 10) {
        setLocalError("Please enter a valid 10-digit mobile number, or leave blank.");
        return;
      }
    }

    setIsSubmitting(true);
    const result = await register(
      nameTrimmed,
      emailTrimmed,
      passwordTrimmed,
      phoneTrimmed
    );
    setIsSubmitting(false);

    if (result.success) {
      setFeedbackMsg(`Welcome to VENSEVEN, ${result.user?.name || nameTrimmed}! Account created.`);
      handleAuthSuccess();
    } else {
      setLocalError(result.error || "Registration failed. Please try again.");
    }
  };

  // Password Recovery Submit Handler
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
                  Signed in as <strong>{user.email || user.phone}</strong>. Access your curated preferences and priority acquisitions.
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
                      <span className="profile-badge">
                        {user.authProvider === "google"
                          ? "GOOGLE VERIFIED CLIENT"
                          : user.authProvider === "phone"
                          ? "MOBILE VERIFIED CLIENT"
                          : "VENSEVEN MEMBER"}
                      </span>
                      <h2 className="profile-name">{user.name}</h2>
                      <span className="profile-email">
                        {user.email.includes("@venseven.in")
                          ? `Mobile: +91 ${user.phone}`
                          : user.email}
                      </span>
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
                        {user.phone ? `+91 ${user.phone}` : "Not specified"}
                      </strong>
                    </div>
                    <div className="profile-detail-item">
                      <span className="detail-label">AUTH METHOD</span>
                      <strong className="detail-value" style={{ textTransform: "capitalize" }}>
                        {user.authProvider || "Standard"}
                      </strong>
                    </div>
                    <div className="profile-detail-item">
                      <span className="detail-label">STUDIO LOCATION</span>
                      <strong className="detail-value">Hyderabad Studio</strong>
                    </div>
                  </div>

                  <div className="profile-actions-row">
                    {user?.role === "admin" && (
                      <Link
                        to="/admin"
                        className="profile-action-btn primary"
                        style={{ background: "#ffffff", color: "#000000" }}
                      >
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

                {/* Right: Studio Benefits */}
                <aside className="account-benefits-sidebar">
                  <div className="benefits-card">
                    <span className="benefits-eyebrow">YOUR PRIVILEGES</span>
                    <h3 className="benefits-title">VIP CLIENT BENEFITS</h3>

                    <div className="benefits-list">
                      <div className="benefit-item">
                        <div className="benefit-icon-box">
                          <FiPackage />
                        </div>
                        <div>
                          <strong>Seamless Tracking &amp; Invoicing</strong>
                          <p>Monitor your bespoke tailored deliveries and orders.</p>
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
               STATE B: UNAUTHENTICATED FAST SIGN IN / REGISTRATION
            ========================================================= */
            <>
              <header className="account-header">
                <span className="account-eyebrow">CLIENT PORTAL</span>
                <h1 className="account-title">
                  {view === "forgot" ? "RESET PASSWORD" : "SIGN IN / CREATE ACCOUNT"}
                </h1>
                <p className="account-subtitle">
                  {view === "forgot"
                    ? "Enter your email address to receive password recovery instructions."
                    : "Instant, frictionless access to your curated wardrobe, orders, and private drops."}
                </p>
              </header>

              <div className="account-layout">
                {/* Main Auth Form Card */}
                <div className="account-card">
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

                  {/* ====================================================
                      VIEW: PORTAL AUTH (GOOGLE + EMAIL SIGN IN / REGISTER)
                  ==================================================== */}
                  {view === "portal" && (
                    <div className="auth-portal-flow">
                      {/* 1. ONE-TAP GOOGLE AUTH BUTTON & OFFICIAL GSI SLOT */}
                      <div className="google-auth-wrapper">
                        <div
                          ref={googleBtnContainerRef}
                          className="google-rendered-button-slot"
                        />
                        {!gsiRendered && (
                          <button
                            type="button"
                            className="auth-google-btn"
                            onClick={handleGoogleAuth}
                            disabled={isSubmitting}
                            aria-label="Continue with Google"
                          >
                            <svg className="google-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                              <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              />
                              <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                              />
                              <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                              />
                            </svg>
                            <span>Continue with Google</span>
                          </button>
                        )}
                      </div>

                      {/* 2. SECTION DIVIDER */}
                      <div className="auth-divider">
                        <span>OR CONTINUE WITH EMAIL</span>
                      </div>

                      {/* 3. TABS: SIGN IN | CREATE ACCOUNT */}
                      <div className="account-tab-bar" role="tablist" aria-label="Authentication mode">
                        <button
                          type="button"
                          id="tab-sign-in"
                          role="tab"
                          aria-selected={authTab === "login"}
                          className={`account-tab-btn ${authTab === "login" ? "active" : ""}`}
                          onClick={() => handleTabChange("login")}
                        >
                          SIGN IN
                        </button>
                        <button
                          type="button"
                          id="tab-create-account"
                          role="tab"
                          aria-selected={authTab === "register"}
                          className={`account-tab-btn ${authTab === "register" ? "active" : ""}`}
                          onClick={() => handleTabChange("register")}
                        >
                          CREATE ACCOUNT
                        </button>
                      </div>

                      {/* 4. PRIMARY TABBED FORMS */}
                      {authTab === "login" ? (
                        <form onSubmit={handleLoginSubmit} className="auth-form" noValidate>
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
                                  setLoginData({ ...loginData, email: e.target.value });
                                  if (localError) setLocalError("");
                                  clearError();
                                }}
                                placeholder="client@example.com"
                                autoComplete="email"
                                required
                              />
                            </div>
                          </div>

                          <div className="auth-field-group">
                            <div className="label-row">
                              <label htmlFor="login-pwd">
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
                                id="login-pwd"
                                value={loginData.password}
                                onChange={(e) => {
                                  setLoginData({ ...loginData, password: e.target.value });
                                  if (localError) setLocalError("");
                                  clearError();
                                }}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                              />
                              <button
                                type="button"
                                className="pwd-toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                              >
                                {showPassword ? <FiEyeOff /> : <FiEye />}
                              </button>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={isSubmitting}
                          >
                            <span>{isSubmitting ? "SIGNING IN..." : "SIGN IN"}</span>
                            <FiArrowRight />
                          </button>

                          <div className="auth-card-footer">
                            <span>New to VENSEVEN?</span>
                            <button
                              type="button"
                              className="switch-view-btn"
                              onClick={() => handleTabChange("register")}
                            >
                              Create an Account
                            </button>
                          </div>
                        </form>
                      ) : (
                        <form onSubmit={handleRegisterSubmit} className="auth-form" noValidate>
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
                                  setRegisterData({ ...registerData, name: e.target.value });
                                  if (localError) setLocalError("");
                                  clearError();
                                }}
                                placeholder="e.g. Aryan Sharma"
                                autoComplete="name"
                                required
                              />
                            </div>
                          </div>

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
                                  setRegisterData({ ...registerData, email: e.target.value });
                                  if (localError) setLocalError("");
                                  clearError();
                                }}
                                placeholder="e.g. aryan@example.com"
                                autoComplete="email"
                                required
                              />
                            </div>
                          </div>

                          <div className="auth-fields-row">
                            <div className="auth-field-group">
                              <label htmlFor="reg-pwd">
                                Password <span className="req">*</span>
                              </label>
                              <div className="input-icon-wrapper">
                                <FiLock className="field-icon" />
                                <input
                                  type={showPassword ? "text" : "password"}
                                  id="reg-pwd"
                                  value={registerData.password}
                                  onChange={(e) => {
                                    setRegisterData({
                                      ...registerData,
                                      password: e.target.value,
                                    });
                                    if (localError) setLocalError("");
                                    clearError();
                                  }}
                                  placeholder="Min 6 chars"
                                  autoComplete="new-password"
                                  required
                                />
                                <button
                                  type="button"
                                  className="pwd-toggle-btn"
                                  onClick={() => setShowPassword(!showPassword)}
                                  aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                  {showPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                              </div>
                            </div>

                            <div className="auth-field-group">
                              <label htmlFor="reg-cpwd">
                                Confirm <span className="req">*</span>
                              </label>
                              <div className="input-icon-wrapper">
                                <FiLock className="field-icon" />
                                <input
                                  type={showConfirmPassword ? "text" : "password"}
                                  id="reg-cpwd"
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
                                  autoComplete="new-password"
                                  required
                                />
                                <button
                                  type="button"
                                  className="pwd-toggle-btn"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="auth-field-group">
                            <label htmlFor="reg-phone">
                              Phone Number <span style={{ color: "#888888", textTransform: "none", fontWeight: 400 }}>(Optional for delivery notifications)</span>
                            </label>
                            <div className="input-icon-wrapper">
                              <FiPhone className="field-icon" />
                              <input
                                type="tel"
                                id="reg-phone"
                                value={registerData.phone}
                                onChange={(e) => {
                                  setRegisterData({ ...registerData, phone: e.target.value });
                                  if (localError) setLocalError("");
                                  clearError();
                                }}
                                placeholder="e.g. 9876543210"
                                autoComplete="tel"
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={isSubmitting}
                          >
                            <span>{isSubmitting ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}</span>
                            <FiArrowRight />
                          </button>

                          <div className="auth-card-footer">
                            <span>Already have an account?</span>
                            <button
                              type="button"
                              className="switch-view-btn"
                              onClick={() => handleTabChange("login")}
                            >
                              Sign In
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {/* ====================================================
                      VIEW: FORGOT PASSWORD
                  ==================================================== */}
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

                      <div className="auth-card-footer">
                        <button
                          type="button"
                          className="switch-view-btn center-btn"
                          onClick={() => handleSwitchView("portal")}
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
                    <h3 className="benefits-title">WHY SIGN IN WITH US?</h3>

                    <div className="benefits-list">
                      <div className="benefit-item">
                        <div className="benefit-icon-box">
                          <FiPackage />
                        </div>
                        <div>
                          <strong>Seamless Access</strong>
                          <p>
                            Quick sign-in with Google or your email account.
                          </p>
                        </div>
                      </div>

                      <div className="benefit-item">
                        <div className="benefit-icon-box">
                          <FiHeart />
                        </div>
                        <div>
                          <strong>Synced Sartorial Wishlist</strong>
                          <p>
                            Save your preferred pieces across all mobile and desktop devices.
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
                            Priority notification for limited seasonal releases and archival drops.
                          </p>
                        </div>
                      </div>

                      <div className="benefit-item">
                        <div className="benefit-icon-box">
                          <FiShield />
                        </div>
                        <div>
                          <strong>Studio Guarantee &amp; Express Checkout</strong>
                          <p>
                            Securely saved delivery addresses for rapid, tailored dispatch.
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
