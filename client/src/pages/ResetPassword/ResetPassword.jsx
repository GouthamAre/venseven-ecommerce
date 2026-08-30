import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

import Navbar from "../../components/layout/Navbar/Navbar";
import { resetPassword } from "../../services/authService";
import "./ResetPassword.css";

function ResetPassword() {
  const { token } = useParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!token) {
      setErrorMessage("No reset authorization token provided. Please request a new link.");
      return;
    }

    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedPassword || !trimmedConfirm) {
      setErrorMessage("Please fill in both password fields.");
      return;
    }

    if (trimmedPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await resetPassword(token, trimmedPassword, trimmedConfirm);
      if (response?.success) {
        setIsSuccess(true);
      } else {
        setErrorMessage(
          response?.message || "The password reset link is invalid or has expired."
        );
      }
    } catch (err) {
      console.error("[Reset Password UI Error]:", err);
      setErrorMessage(
        err.data?.message ||
          err.message ||
          "The password reset link is invalid or has expired. Please request a new recovery link."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="reset-password-page">
        <div className="reset-password-container">
          <motion.div
            className="reset-password-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {isSuccess ? (
              /* Success State */
              <div className="reset-success-view">
                <div className="success-icon-wrap">
                  <FiCheckCircle />
                </div>
                <span className="reset-eyebrow">CREDENTIALS UPDATED</span>
                <h1 className="reset-title">PASSWORD UPDATED</h1>
                <p className="reset-subtitle">
                  Your VENSEVEN account password has been successfully updated. You can now sign in with your new credentials.
                </p>

                <Link to="/account" className="reset-action-btn primary">
                  <span>PROCEED TO SIGN IN</span>
                  <FiArrowRight />
                </Link>
              </div>
            ) : (
              /* Reset Password Form */
              <>
                <header className="reset-card-header">
                  <span className="reset-eyebrow">ACCOUNT RECOVERY</span>
                  <h1 className="reset-title">RESET PASSWORD</h1>
                  <p className="reset-subtitle">
                    Enter your new secure password to restore access to your VENSEVEN client account.
                  </p>
                </header>

                {errorMessage && (
                  <div className="reset-error-banner" role="alert">
                    <FiAlertCircle className="error-icon" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="reset-form">
                  {/* New Password */}
                  <div className="reset-field-group">
                    <label htmlFor="new-password">
                      New Password <span className="req">*</span>
                    </label>
                    <div className="input-icon-wrapper">
                      <FiLock className="field-icon" />
                      <input
                        type={showPassword ? "text" : "password"}
                        id="new-password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errorMessage) setErrorMessage("");
                        }}
                        placeholder="At least 6 characters"
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="reset-field-group">
                    <label htmlFor="confirm-password">
                      Confirm New Password <span className="req">*</span>
                    </label>
                    <div className="input-icon-wrapper">
                      <FiLock className="field-icon" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirm-password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (errorMessage) setErrorMessage("");
                        }}
                        placeholder="Repeat your new password"
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="reset-action-btn primary"
                    disabled={isSubmitting}
                  >
                    <span>
                      {isSubmitting ? "UPDATING PASSWORD..." : "RESET PASSWORD"}
                    </span>
                    <FiArrowRight />
                  </button>

                  {/* Footer link */}
                  <div className="reset-card-footer">
                    <Link to="/account" className="reset-back-link">
                      ← Return to Sign In
                    </Link>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </main>
    </>
  );
}

export default ResetPassword;
