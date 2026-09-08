import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiLock,
  FiMail,
  FiUser,
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
  FiEdit2,
  FiChevronDown,
  FiChevronUp,
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
    sendOtp,
    verifyOtp,
    loginWithGoogle,
    logout,
    authError,
    clearError,
  } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Resolve initial view from props, pathname, or query parameters
  const resolveView = useCallback(() => {
    if (initialView) return initialView;
    const tabParam = (
      searchParams.get("tab") ||
      searchParams.get("mode") ||
      ""
    ).toLowerCase();
    if (tabParam === "forgot" || tabParam === "reset") return "forgot";
    if (tabParam === "register" || tabParam === "signup") return "portal";
    if (location.pathname.includes("forgot")) return "forgot";
    return "portal";
  }, [initialView, searchParams, location.pathname]);

  const [view, setView] = useState(resolveView); // 'portal' | 'forgot'
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Phone + OTP authentication state
  const [phone, setPhone] = useState("");
  const [otpStep, setOtpStep] = useState("phone"); // 'phone' | 'verify'
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [clientName, setClientName] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState("");
  const otpInputRefs = useRef([]);
  const googleBtnContainerRef = useRef(null);
  const gsiInitializedRef = useRef(false);

  // Traditional Email/Password state (Preserved for existing accounts & Admin)
  const [emailAuthMode, setEmailAuthMode] = useState("login"); // 'login' | 'register'
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    remember: false,
  });
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

  // Synchronize view if URL or prop changes
  useEffect(() => {
    const target = resolveView();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setView(target);
    setLocalError("");
    setFeedbackMsg("");
    clearError();
  }, [resolveView, clearError]);

  // Resend Countdown Timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

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

          if (googleBtnContainerRef.current && !googleBtnContainerRef.current.hasChildNodes()) {
            window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
              theme: "outline",
              size: "large",
              width: 320,
              text: "continue_with",
              shape: "rectangular",
              logo_alignment: "left",
            });
          }
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

    return () => {
      if (checkInterval) clearInterval(checkInterval);
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
          "Google Sign-In is not configured (VITE_GOOGLE_CLIENT_ID required). Please sign in using Phone OTP or Email & Password."
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
        "Google Sign-In script is loading or unavailable. Please sign in with Phone OTP or Email & Password."
      );
    } catch (err) {
      setIsSubmitting(false);
      setLocalError(err.message || "Failed to initialize Google authentication.");
    }
  };

  // -------------------------------------------------------------
  // PHONE + OTP HANDLERS
  // -------------------------------------------------------------
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setLocalError("");
    setFeedbackMsg("");

    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length !== 10) {
      setLocalError("Please enter a valid 10-digit mobile phone number.");
      return;
    }

    setIsSubmitting(true);
    const result = await sendOtp(digitsOnly);
    setIsSubmitting(false);

    if (result.success) {
      setOtpStep("verify");
      setResendCountdown(45);
      setFeedbackMsg(result.message || `Verification code sent to +91 ${digitsOnly}`);
      if (result.devOtp) {
        setDevOtpHint(result.devOtp);
      }
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } else {
      setLocalError(result.error || "Failed to dispatch verification code.");
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setLocalError("");
    setFeedbackMsg("");

    const code = otpDigits.join("");
    if (code.length !== 6) {
      setLocalError("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsSubmitting(true);
    const result = await verifyOtp(phone, code, clientName.trim());
    setIsSubmitting(false);

    if (result.success) {
      setFeedbackMsg("Verification successful! Welcome to VENSEVEN.");
      handleAuthSuccess();
    } else {
      setLocalError(result.error || "Invalid verification code. Please check and try again.");
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    setOtpDigits(["", "", "", "", "", ""]);
    await handleSendOtp();
  };

  const handleOtpDigitChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (localError) setLocalError("");

    // Auto-advance focus to next input
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || "";
    }
    setOtpDigits(newDigits);

    const nextIndex = Math.min(pasted.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  const handleFillDevOtp = () => {
    if (!devOtpHint) return;
    const digits = devOtpHint.split("").slice(0, 6);
    setOtpDigits(digits);
    if (localError) setLocalError("");
  };

  // -------------------------------------------------------------
  // TRADITIONAL EMAIL / PASSWORD HANDLERS
  // -------------------------------------------------------------
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

    if (result.success) {
      handleAuthSuccess();
    } else {
      setLocalError(result.error || "Sign in failed. Please check your credentials.");
    }
  };

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
                      VIEW: FAST PORTAL AUTH (GOOGLE + PHONE OTP)
                  ==================================================== */}
                  {view === "portal" && (
                    <div className="fast-auth-flow">
                      {/* 1. ONE-TAP GOOGLE AUTH BUTTON & OFFICIAL GSI SLOT */}
                      <div className="google-auth-wrapper">
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
                        <div ref={googleBtnContainerRef} className="google-rendered-button-slot" aria-hidden="true" />
                      </div>

                      {/* 2. SECTION DIVIDER */}
                      <div className="auth-divider">
                        <span>OR SIGN IN WITH PHONE &amp; OTP</span>
                      </div>

                      {/* 3. PHONE & OTP FORM */}
                      {otpStep === "phone" ? (
                        <form onSubmit={handleSendOtp} className="auth-form">
                          <div className="auth-field-group">
                            <label htmlFor="phone-number">
                              Mobile Number <span className="req">*</span>
                            </label>
                            <div className="phone-input-wrapper">
                              <div className="phone-prefix-badge">
                                <span className="country-flag-icon">🇮🇳</span>
                                <span>+91</span>
                              </div>
                              <input
                                type="tel"
                                id="phone-number"
                                className="phone-input-field"
                                value={phone}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
                                  setPhone(raw);
                                  if (localError) setLocalError("");
                                  clearError();
                                }}
                                placeholder="Enter 10-digit mobile number"
                                autoFocus
                                required
                              />
                            </div>
                          </div>

                          <div className="auth-field-group">
                            <label htmlFor="client-name">
                              Your Name <span style={{ color: "#888888", textTransform: "none", fontWeight: 400 }}>(Optional for new clients)</span>
                            </label>
                            <div className="input-icon-wrapper">
                              <FiUser className="field-icon" />
                              <input
                                type="text"
                                id="client-name"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                placeholder="e.g. Aryan Sharma"
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={isSubmitting || phone.replace(/\D/g, "").length !== 10}
                          >
                            <span>{isSubmitting ? "SENDING CODE..." : "GET VERIFICATION CODE"}</span>
                            <FiArrowRight />
                          </button>
                        </form>
                      ) : (
                        <form onSubmit={handleVerifyOtp} className="auth-form">
                          {/* OTP Number Header Pill */}
                          <div className="otp-header-strip">
                            <div className="otp-target-text">
                              <span className="otp-target-label">CODE SENT TO</span>
                              <span className="otp-target-number">+91 {phone}</span>
                            </div>
                            <button
                              type="button"
                              className="otp-change-number-btn"
                              onClick={() => {
                                setOtpStep("phone");
                                setOtpDigits(["", "", "", "", "", ""]);
                                setLocalError("");
                              }}
                            >
                              <FiEdit2 />
                              <span>Change</span>
                            </button>
                          </div>

                          <div className="auth-field-group">
                            <label>Enter 6-Digit Verification Code</label>
                            <div className="otp-container">
                              {otpDigits.map((digit, idx) => (
                                <input
                                  key={idx}
                                  ref={(el) => (otpInputRefs.current[idx] = el)}
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={1}
                                  value={digit}
                                  onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                  onPaste={handleOtpPaste}
                                  className={`otp-digit-input ${digit ? "filled" : ""}`}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Timer & Dev Hint */}
                          <div className="otp-meta-row">
                            <div className="otp-timer-box">
                              {resendCountdown > 0 ? (
                                <span>Resend OTP in <strong>{resendCountdown}s</strong></span>
                              ) : (
                                <button
                                  type="button"
                                  className="otp-resend-link"
                                  onClick={handleResendOtp}
                                >
                                  Resend Code
                                </button>
                              )}
                            </div>

                            {devOtpHint && (
                              <button
                                type="button"
                                className="dev-otp-badge"
                                onClick={handleFillDevOtp}
                                title="Click to auto-paste generated demo OTP"
                              >
                                <span>Demo OTP: <strong>{devOtpHint}</strong> (Click to fill)</span>
                              </button>
                            )}
                          </div>

                          <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={isSubmitting || otpDigits.join("").length !== 6}
                          >
                            <span>{isSubmitting ? "VERIFYING..." : "ENTER CLIENT PORTAL"}</span>
                            <FiArrowRight />
                          </button>
                        </form>
                      )}

                      {/* 4. PREFER EMAIL & PASSWORD COLLAPSIBLE (For Admin & Existing Accounts) */}
                      <div className="auth-legacy-toggle">
                        <button
                          type="button"
                          className="legacy-toggle-btn"
                          onClick={() => setShowEmailAuth(!showEmailAuth)}
                        >
                          <span>
                            {showEmailAuth
                              ? "Hide standard Email & Password sign-in"
                              : "Prefer sign-in with Email & Password? Click here"}
                          </span>
                          {showEmailAuth ? (
                            <FiChevronUp className="legacy-toggle-chevron rotated" />
                          ) : (
                            <FiChevronDown className="legacy-toggle-chevron" />
                          )}
                        </button>

                        <AnimatePresence>
                          {showEmailAuth && (
                            <motion.div
                              className="legacy-email-section"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                            >
                              <div className="account-tab-bar" style={{ marginBottom: "20px" }}>
                                <button
                                  type="button"
                                  className={`account-tab-btn ${emailAuthMode === "login" ? "active" : ""}`}
                                  onClick={() => setEmailAuthMode("login")}
                                >
                                  EMAIL SIGN IN
                                </button>
                                <button
                                  type="button"
                                  className={`account-tab-btn ${emailAuthMode === "register" ? "active" : ""}`}
                                  onClick={() => setEmailAuthMode("register")}
                                >
                                  EMAIL REGISTER
                                </button>
                              </div>

                              {emailAuthMode === "login" ? (
                                <form onSubmit={handleLoginSubmit} className="auth-form">
                                  <div className="auth-field-group">
                                    <label htmlFor="legacy-login-email">Email Address</label>
                                    <div className="input-icon-wrapper">
                                      <FiMail className="field-icon" />
                                      <input
                                        type="email"
                                        id="legacy-login-email"
                                        value={loginData.email}
                                        onChange={(e) =>
                                          setLoginData({ ...loginData, email: e.target.value })
                                        }
                                        placeholder="name@example.com"
                                        required
                                      />
                                    </div>
                                  </div>

                                  <div className="auth-field-group">
                                    <div className="label-row">
                                      <label htmlFor="legacy-login-pwd">Password</label>
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
                                        id="legacy-login-pwd"
                                        value={loginData.password}
                                        onChange={(e) =>
                                          setLoginData({ ...loginData, password: e.target.value })
                                        }
                                        placeholder="••••••••"
                                        required
                                      />
                                      <button
                                        type="button"
                                        className="pwd-toggle-btn"
                                        onClick={() => setShowPassword(!showPassword)}
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
                                    <span>{isSubmitting ? "SIGNING IN..." : "SIGN IN WITH EMAIL"}</span>
                                    <FiArrowRight />
                                  </button>
                                </form>
                              ) : (
                                <form onSubmit={handleRegisterSubmit} className="auth-form">
                                  <div className="auth-field-group">
                                    <label htmlFor="legacy-reg-name">Full Name</label>
                                    <div className="input-icon-wrapper">
                                      <FiUser className="field-icon" />
                                      <input
                                        type="text"
                                        id="legacy-reg-name"
                                        value={registerData.name}
                                        onChange={(e) =>
                                          setRegisterData({ ...registerData, name: e.target.value })
                                        }
                                        placeholder="Aryan Sharma"
                                        required
                                      />
                                    </div>
                                  </div>

                                  <div className="auth-field-group">
                                    <label htmlFor="legacy-reg-email">Email Address</label>
                                    <div className="input-icon-wrapper">
                                      <FiMail className="field-icon" />
                                      <input
                                        type="email"
                                        id="legacy-reg-email"
                                        value={registerData.email}
                                        onChange={(e) =>
                                          setRegisterData({ ...registerData, email: e.target.value })
                                        }
                                        placeholder="aryan@example.com"
                                        required
                                      />
                                    </div>
                                  </div>

                                  <div className="auth-field-group">
                                    <label htmlFor="legacy-reg-pwd">Password</label>
                                    <div className="input-icon-wrapper">
                                      <FiLock className="field-icon" />
                                      <input
                                        type={showPassword ? "text" : "password"}
                                        id="legacy-reg-pwd"
                                        value={registerData.password}
                                        onChange={(e) =>
                                          setRegisterData({
                                            ...registerData,
                                            password: e.target.value,
                                          })
                                        }
                                        placeholder="Min. 6 characters"
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
                                    <label htmlFor="legacy-reg-cpwd">Confirm Password</label>
                                    <div className="input-icon-wrapper">
                                      <FiLock className="field-icon" />
                                      <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        id="legacy-reg-cpwd"
                                        value={registerData.confirmPassword}
                                        onChange={(e) =>
                                          setRegisterData({
                                            ...registerData,
                                            confirmPassword: e.target.value,
                                          })
                                        }
                                        placeholder="Re-enter password"
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

                                  <button
                                    type="submit"
                                    className="auth-submit-btn"
                                    disabled={isSubmitting}
                                  >
                                    <span>{isSubmitting ? "CREATING..." : "CREATE ACCOUNT WITH EMAIL"}</span>
                                    <FiArrowRight />
                                  </button>
                                </form>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
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
                          <strong>Frictionless 1-Tap Access</strong>
                          <p>
                            No passwords to remember. Instant access via Google or Phone OTP.
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
