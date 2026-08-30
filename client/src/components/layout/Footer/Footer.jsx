import { Link } from "react-router-dom";
import "./Footer.css";

const shopLinks = [
  { label: "New Arrivals", to: "/shop?filter=new-arrivals" },
  { label: "Shirts", to: "/shop?category=shirts" },
  { label: "Trousers", to: "/shop?category=trousers" },
  { label: "T-Shirts", to: "/shop?category=t-shirts" },
  { label: "Shorts", to: "/shop?category=shorts" },
];

const companyLinks = [
  { label: "About", to: "/about" },
  { label: "Collections", to: "/collections" },
  { label: "Contact", to: "/contact" },
];

const helpLinks = [
  { label: "Shipping", to: "/shipping" },
  { label: "Returns", to: "/returns" },
  { label: "FAQs", to: "/faqs" },
];

const socialLinks = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "Facebook", href: "https://facebook.com" },
  { label: "Pinterest", href: "https://pinterest.com" },
];

function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="footer" aria-label="Site Footer">
      <div className="footer-container">
        {/* Main Columns */}
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand-col">
            <Link to="/" className="footer-brand-logo">
              VENSEVEN
            </Link>
            <p className="footer-brand-desc">
              Modern menswear crafted for confidence. Designed with architectural restraint, premium fabrics, and enduring silhouettes.
            </p>
            <span className="footer-brand-origin">
              STUDIO · EST. HYDERABAD
            </span>
          </div>

          {/* Shop Column */}
          <div className="footer-col">
            <h3 className="footer-col-title">SHOP</h3>
            <ul className="footer-links">
              {shopLinks.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="footer-link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div className="footer-col">
            <h3 className="footer-col-title">COMPANY</h3>
            <ul className="footer-links">
              {companyLinks.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="footer-link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Column */}
          <div className="footer-col">
            <h3 className="footer-col-title">HELP</h3>
            <ul className="footer-links">
              {helpLinks.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="footer-link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Column */}
          <div className="footer-col">
            <h3 className="footer-col-title">SOCIAL</h3>
            <ul className="footer-links">
              {socialLinks.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-link footer-social-link"
                  >
                    <span>{item.label}</span>
                    <span className="social-arrow" aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © 2026 VENSEVEN. All rights reserved.
          </p>

          <div className="footer-legal-links">
            <Link to="/privacy" className="footer-legal-link">
              Privacy Policy
            </Link>
            <span className="footer-divider">·</span>
            <Link to="/terms" className="footer-legal-link">
              Terms &amp; Conditions
            </Link>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="footer-back-to-top"
            aria-label="Back to top of page"
          >
            <span>BACK TO TOP</span>
            <span aria-hidden="true">↑</span>
          </button>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
