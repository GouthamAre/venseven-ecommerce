import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./Newsletter.css";

function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // 'idle' | 'error' | 'success'
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const emailTrimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailTrimmed) {
      setStatus("error");
      setErrorMsg("Please enter your email address.");
      return;
    }

    if (!emailRegex.test(emailTrimmed)) {
      setStatus("error");
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    // Successful submission
    setStatus("success");
    setEmail("");
    setErrorMsg("");
  };

  return (
    <section className="newsletter" aria-label="Newsletter Subscription">
      <div className="newsletter-container">
        <motion.div
          className="newsletter-content"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="newsletter-label">VENSEVEN INSIDER</span>

          <h2 className="newsletter-title">STAY IN THE LOOP.</h2>

          <p className="newsletter-subtitle">
            New drops. Private releases. Style notes.
          </p>

          <AnimatePresence mode="wait">
            {status === "success" ? (
              <motion.div
                key="success"
                className="newsletter-success"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
              >
                <div className="success-icon" aria-hidden="true">✓</div>
                <div className="success-text">
                  <strong>You're on the list.</strong>
                  <span>Look out for private drop announcements in your inbox.</span>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                className="newsletter-form"
                onSubmit={handleSubmit}
                noValidate
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className={`newsletter-input-group ${status === "error" ? "has-error" : ""}`}>
                  <label htmlFor="newsletter-email" className="sr-only">
                    Enter your email address
                  </label>
                  <input
                    id="newsletter-email"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === "error") setStatus("idle");
                    }}
                    placeholder="Enter your email"
                    className="newsletter-input"
                    autoComplete="email"
                    required
                  />

                  <button
                    type="submit"
                    className="newsletter-btn"
                    aria-label="Join newsletter"
                  >
                    <span>JOIN</span>
                    <span className="newsletter-arrow" aria-hidden="true">→</span>
                  </button>
                </div>

                {status === "error" && (
                  <p className="newsletter-error-msg" role="alert">
                    {errorMsg}
                  </p>
                )}
              </motion.form>
            )}
          </AnimatePresence>

          <span className="newsletter-disclaimer">
            No noise. Pure style. Unsubscribe anytime.
          </span>
        </motion.div>
      </div>
    </section>
  );
}

export default Newsletter;
