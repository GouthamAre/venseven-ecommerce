import { Link } from "react-router-dom";
import { FiArrowLeft, FiShoppingBag } from "react-icons/fi";
import Navbar from "../../components/layout/Navbar/Navbar";
import "./NotFound.css";

function NotFound() {
  return (
    <>
      <Navbar />

      <main className="not-found-page">
        <div className="not-found-container">
          <span className="not-found-badge">404 ERROR</span>
          <h1 className="not-found-title">PAGE NOT FOUND</h1>
          <p className="not-found-subtitle">
            The sartorial piece or editorial page you are searching for does not exist or has been relocated.
          </p>

          <div className="not-found-actions">
            <Link to="/shop" className="not-found-btn primary">
              <FiShoppingBag />
              <span>EXPLORE SHOP</span>
            </Link>
            <Link to="/" className="not-found-btn secondary">
              <FiArrowLeft />
              <span>RETURN HOME</span>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

export default NotFound;
