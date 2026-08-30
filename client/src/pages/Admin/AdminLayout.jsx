import { useState } from "react";
import { NavLink, Link, Outlet } from "react-router-dom";
import {
  FiGrid,
  FiShoppingBag,
  FiUsers,
  FiBox,
  FiTag,
  FiArrowLeft,
  FiMenu,
  FiX,
  FiShield,
  FiLogOut,
} from "react-icons/fi";
import { useAuth } from "../../context/useAuth";
import "./AdminLayout.css";

function AdminLayout() {
  const { user, logout } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const navItems = [
    { label: "OVERVIEW", to: "/admin", icon: <FiGrid />, end: true },
    { label: "ORDERS", to: "/admin/orders", icon: <FiShoppingBag /> },
    { label: "CUSTOMERS", to: "/admin/customers", icon: <FiUsers /> },
    { label: "PRODUCTS", to: "/admin/products", icon: <FiBox /> },
    { label: "COUPONS", to: "/admin/coupons", icon: <FiTag /> },
  ];

  const toggleMobileNav = () => setIsMobileNavOpen((prev) => !prev);
  const closeMobileNav = () => setIsMobileNavOpen(false);

  return (
    <div className="admin-root">
      {/* Sidebar Navigation */}
      <aside className={`admin-sidebar ${isMobileNavOpen ? "open" : ""}`}>
        {/* Brand Header */}
        <div className="admin-brand-header">
          <Link to="/admin" className="admin-brand-link" onClick={closeMobileNav}>
            <span className="brand-logo">VENSEVEN</span>
            <span className="brand-badge">ADMIN</span>
          </Link>
          <button
            type="button"
            className="mobile-close-btn"
            onClick={closeMobileNav}
            aria-label="Close menu"
          >
            <FiX />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="admin-nav-list">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `admin-nav-item ${isActive ? "active" : ""}`
              }
              onClick={closeMobileNav}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer & User Section */}
        <div className="admin-sidebar-footer">
          <div className="admin-user-pill">
            <div className="user-avatar">
              <FiShield />
            </div>
            <div className="user-meta">
              <strong className="user-name">{user?.name || "Administrator"}</strong>
              <span className="user-role">Super Admin</span>
            </div>
          </div>

          <div className="admin-footer-actions">
            <Link to="/" className="storefront-link">
              <FiArrowLeft />
              <span>STOREFRONT</span>
            </Link>
            <button
              type="button"
              className="admin-logout-btn"
              onClick={logout}
              title="Log Out"
            >
              <FiLogOut />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main-wrapper">
        {/* Top Header Bar for Mobile & Breadcrumbs */}
        <header className="admin-topbar">
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={toggleMobileNav}
            aria-label="Open navigation menu"
          >
            <FiMenu />
          </button>

          <div className="topbar-title-group">
            <span className="topbar-context">MANAGEMENT PORTAL</span>
          </div>

          <div className="topbar-actions">
            <Link to="/shop" className="topbar-store-btn">
              <span>VIEW STORE</span>
            </Link>
          </div>
        </header>

        {/* Dynamic Nested Page Content */}
        <main className="admin-content-outlet">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
