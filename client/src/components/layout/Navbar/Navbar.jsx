import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiSearch,
  FiHeart,
  FiShoppingBag,
  FiUser,
  FiMenu,
  FiX,
} from "react-icons/fi";

import { useCart } from "../../../context/useCart";
import { useWishlist } from "../../../context/useWishlist";
import { useSearch } from "../../../context/useSearch";
import { useAuth } from "../../../context/useAuth";
import "./Navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const { totalWishlistItems } = useWishlist();
  const { openSearch } = useSearch();
  const { isAuthenticated, user } = useAuth();

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    { name: "Collections", href: "/collections" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <header className="navbar">
      <div className="navbar-inner">

        {/* Logo */}
        <Link to="/" className="navbar-logo" aria-label="VENSEVEN Home">
          <img
            src="/logo.png"
            alt="VENSEVEN Men's Fashion Studio"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="navbar-links" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <Link key={link.name} to={link.href}>
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="navbar-actions">
          <button
            type="button"
            className="navbar-action-btn"
            onClick={openSearch}
            aria-label="Open global search"
          >
            <FiSearch />
          </button>

          <Link
            to="/wishlist"
            className="navbar-action-btn"
            aria-label={`Wishlist with ${totalWishlistItems} items`}
          >
            <FiHeart />
            {totalWishlistItems > 0 && (
              <span className="navbar-badge">{totalWishlistItems}</span>
            )}
          </Link>

          <Link
            to="/cart"
            className="navbar-action-btn"
            aria-label={`Shopping bag with ${totalItems} items`}
          >
            <FiShoppingBag />
            {totalItems > 0 && (
              <span className="navbar-badge">{totalItems}</span>
            )}
          </Link>

          <Link
            to="/account"
            className={`navbar-action-btn ${isAuthenticated ? "authenticated" : ""}`}
            aria-label={isAuthenticated ? `Account (${user?.name || "Client"})` : "My Account"}
            title={isAuthenticated ? `Signed in as ${user?.name}` : "My Account"}
          >
            <FiUser />
            {isAuthenticated && <span className="navbar-auth-dot" />}
          </Link>
        </div>

        {/* Mobile Header Actions (Search + Wishlist + Cart + Menu) */}
        <div className="mobile-header-actions">
          <button
            type="button"
            className="navbar-action-btn mobile-search-btn"
            onClick={openSearch}
            aria-label="Open search"
          >
            <FiSearch />
          </button>

          <Link
            to="/wishlist"
            className="navbar-action-btn mobile-wishlist-btn"
            aria-label={`Wishlist with ${totalWishlistItems} items`}
          >
            <FiHeart />
            {totalWishlistItems > 0 && (
              <span className="navbar-badge">{totalWishlistItems}</span>
            )}
          </Link>

          <Link
            to="/cart"
            className="navbar-action-btn mobile-cart-btn"
            aria-label={`Shopping bag with ${totalItems} items`}
          >
            <FiShoppingBag />
            {totalItems > 0 && (
              <span className="navbar-badge">{totalItems}</span>
            )}
          </Link>

          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

      </div>

      {/* Mobile menu */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`} aria-label="Mobile Navigation">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            to={link.href}
            onClick={() => setMenuOpen(false)}
          >
            {link.name}
          </Link>
        ))}

        <div className="mobile-menu-divider" />

        <button
          type="button"
          className="mobile-menu-sublink mobile-menu-search-trigger"
          onClick={() => {
            setMenuOpen(false);
            openSearch();
          }}
        >
          <span>SEARCH</span>
          <FiSearch />
        </button>

        <Link
          to="/wishlist"
          className="mobile-menu-sublink"
          onClick={() => setMenuOpen(false)}
        >
          <span>WISHLIST</span>
          {totalWishlistItems > 0 && (
            <span className="mobile-menu-badge">{totalWishlistItems}</span>
          )}
        </Link>

        <Link
          to="/account"
          className="mobile-menu-sublink"
          onClick={() => setMenuOpen(false)}
        >
          <span>{isAuthenticated ? `MY ACCOUNT (${user?.name?.split(" ")[0] || "CLIENT"})` : "MY ACCOUNT"}</span>
        </Link>
      </div>
    </header>
  );
}

export default Navbar;