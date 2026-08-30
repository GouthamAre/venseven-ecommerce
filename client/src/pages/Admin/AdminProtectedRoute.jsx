import { Link, Navigate } from "react-router-dom";
import { FiArrowLeft, FiLock } from "react-icons/fi";
import { useAuth } from "../../context/useAuth";

/**
 * Route protection wrapper for VENSEVEN Administration area.
 * Validates authentication and admin role.
 */
function AdminProtectedRoute({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: "#0A0A0A",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Montserrat', sans-serif",
        fontSize: "0.85rem",
        letterSpacing: "0.14em"
      }}>
        VERIFYING ADMINISTRATIVE ACCESS...
      </div>
    );
  }

  // If not logged in -> redirect to Account sign in
  if (!isAuthenticated || !user) {
    return <Navigate to="/account" replace />;
  }

  // If logged in but not an admin -> show luxury restricted view
  if (user.role !== "admin") {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: "#0A0A0A",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}>
        <div style={{
          maxWidth: "480px",
          width: "100%",
          background: "#121212",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "6px",
          padding: "48px 32px",
          textAlign: "center"
        }}>
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "rgba(255, 77, 79, 0.1)",
            border: "1px solid rgba(255, 77, 79, 0.3)",
            color: "#ff6b6b",
            fontSize: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px"
          }}>
            <FiLock />
          </div>
          <span style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.2em",
            color: "#ff6b6b",
            display: "block",
            marginBottom: "6px"
          }}>
            ACCESS RESTRICTED
          </span>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "2.4rem",
            letterSpacing: "0.04em",
            color: "#ffffff",
            marginBottom: "12px",
            lineHeight: 1
          }}>
            ADMIN PRIVILEGES REQUIRED
          </h1>
          <p style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: "0.88rem",
            color: "#888888",
            marginBottom: "28px",
            lineHeight: 1.6
          }}>
            Your account (<strong>{user.email}</strong>) does not have administrator privileges for the VENSEVEN management portal.
          </p>
          <Link
            to="/shop"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#25b7ed",
              color: "#000000",
              fontFamily: "'Montserrat', sans-serif",
              fontSize: "0.8rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              padding: "12px 24px",
              borderRadius: "4px",
              textDecoration: "none"
            }}
          >
            <FiArrowLeft />
            <span>RETURN TO STOREFRONT</span>
          </Link>
        </div>
      </div>
    );
  }

  // Authenticated admin -> render children
  return children;
}

export default AdminProtectedRoute;
