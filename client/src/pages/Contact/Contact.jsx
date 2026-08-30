import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMapPin,
  FiPhone,
  FiClock,
  FiMail,
  FiCheck,
  FiSend,
  FiExternalLink,
} from "react-icons/fi";

import Navbar from "../../components/layout/Navbar/Navbar";
import "./Contact.css";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setErrorMsg("Please provide a valid email address.");
      return;
    }

    setSubmitting(true);

    // Simulate instant client submission
    setTimeout(() => {
      setSubmitting(false);
      setFormSubmitted(true);
      setFormData({ name: "", email: "", phone: "", message: "" });
    }, 600);
  };

  const mapsUrl =
    "https://maps.google.com/?q=VENSEVEN+Men's+Fashion+Studio+KPHB+Phase+3+Kukatpally+Hyderabad+Telangana+500072";

  return (
    <>
      <Navbar />

      <main className="contact-page">
        <div className="contact-container">
          {/* Header */}
          <header className="contact-header">
            <span className="contact-eyebrow">STUDIO ASSISTANCE</span>
            <h1 className="contact-title">CONTACT THE STUDIO</h1>
            <p className="contact-subtitle">
              Visit our Hyderabad flagship or send a message to our client styling and support team.
            </p>
          </header>

          {/* 2-Column Showcase */}
          <div className="contact-layout">
            {/* Left Column: Store Information & Hours & Map */}
            <div className="contact-info-column">
              {/* Studio Info Card */}
              <div className="info-card">
                <span className="info-card-label">FLAGSHIP LOCATION</span>
                <h2 className="studio-brand-name">
                  VENSEVEN Men’s Fashion Studio
                </h2>

                <div className="info-rows-list">
                  {/* Address */}
                  <div className="info-row-item">
                    <div className="info-icon-box">
                      <FiMapPin />
                    </div>
                    <div>
                      <strong>Studio Address</strong>
                      <p>
                        3rd Phase, opposite Ramya Ground,
                        <br />
                        KPHB Phase 3, Kukatpally,
                        <br />
                        Hyderabad, Telangana 500072
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="info-row-item">
                    <div className="info-icon-box">
                      <FiPhone />
                    </div>
                    <div>
                      <strong>Telephone</strong>
                      <p>
                        <a href="tel:09866465242" className="phone-link">
                          098664 65242
                        </a>
                      </p>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="info-row-item">
                    <div className="info-icon-box">
                      <FiClock />
                    </div>
                    <div>
                      <strong>Opening Hours</strong>
                      <p>
                        Monday – Saturday: 10:30 AM – 9:30 PM
                        <br />
                        Sunday: 11:00 AM – 9:00 PM
                      </p>
                    </div>
                  </div>

                  {/* Email Support */}
                  <div className="info-row-item">
                    <div className="info-icon-box">
                      <FiMail />
                    </div>
                    <div>
                      <strong>Client Inquiries</strong>
                      <p>support@venseven.com</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map & Directions Card */}
              <div className="map-directions-card">
                <div className="map-header-row">
                  <div>
                    <strong>Studio Directions</strong>
                    <span>Opposite Ramya Ground, KPHB Phase 3</span>
                  </div>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="directions-btn"
                  >
                    <span>OPEN MAPS</span>
                    <FiExternalLink />
                  </a>
                </div>

                <div className="map-preview-box">
                  <iframe
                    title="VENSEVEN Studio Location"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3805.340058863673!2d78.3908!3d17.4912!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTfCsDI5JzI4LjMiTiA3OMKwMjMnMjYuOSJF!5e0!3m2!1sen!2sin!4v1680000000000!5m2!1sen!2sin"
                    width="100%"
                    height="220"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Contact Form */}
            <div className="contact-form-column">
              <div className="contact-form-card">
                <span className="form-card-label">CLIENT INQUIRY</span>
                <h2 className="form-card-title">SEND A MESSAGE</h2>
                <p className="form-card-desc">
                  Have a question regarding sizes, orders, or styling recommendations? Leave us a note and we will respond promptly.
                </p>

                <AnimatePresence>
                  {formSubmitted ? (
                    <motion.div
                      className="form-success-state"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="success-icon-circle">
                        <FiCheck />
                      </div>
                      <h3>MESSAGE RECEIVED</h3>
                      <p>
                        Thank you for contacting VENSEVEN. Our studio team will review your inquiry and get back to you shortly.
                      </p>
                      <button
                        type="button"
                        className="send-another-btn"
                        onClick={() => setFormSubmitted(false)}
                      >
                        SEND ANOTHER MESSAGE
                      </button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="contact-form">
                      {errorMsg && (
                        <div className="form-error-banner">{errorMsg}</div>
                      )}

                      {/* Name */}
                      <div className="form-group">
                        <label htmlFor="name">
                          Full Name <span className="req">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="e.g. Aryan Sharma"
                          required
                        />
                      </div>

                      {/* Email & Phone Grid */}
                      <div className="form-row-grid">
                        <div className="form-group">
                          <label htmlFor="email">
                            Email Address <span className="req">*</span>
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="e.g. aryan@example.com"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="phone">Phone Number</label>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="e.g. +91 98765 43210"
                          />
                        </div>
                      </div>

                      {/* Message */}
                      <div className="form-group">
                        <label htmlFor="message">
                          Your Message <span className="req">*</span>
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          rows="5"
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="How can our studio team assist you today?"
                          required
                        />
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        className="contact-submit-btn"
                        disabled={submitting}
                      >
                        <FiSend />
                        <span>
                          {submitting ? "SENDING MESSAGE..." : "SEND MESSAGE"}
                        </span>
                      </button>
                    </form>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default Contact;
