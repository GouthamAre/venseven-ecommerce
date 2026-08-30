import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import collectionImg from "../../../assets/images/collection.jpg";
import "./FeaturedCollection.css";

function FeaturedCollection() {
  return (
    <section className="featured-collection" aria-label="Featured Collection">
      {/* Background Image */}
      <div className="featured-collection-bg">
        <img
          src={collectionImg}
          alt="VENSEVEN Collection - Modern Menswear"
          className="featured-collection-image"
        />
      </div>

      {/* Cinematic Gradient Overlay */}
      <div className="featured-collection-overlay" />

      {/* Editorial Content */}
      <div className="featured-collection-container">
        <motion.div
          className="featured-collection-content"
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="featured-collection-label">
            VENSEVEN COLLECTION
          </span>

          <h2 className="featured-collection-title">
            THE NEW
            <br />
            <span>STANDARD.</span>
          </h2>

          <p className="featured-collection-desc">
            Modern silhouettes. Refined essentials.
          </p>

          <div className="featured-collection-action">
            <Link
              to="/collections"
              className="featured-collection-btn"
            >
              <span>EXPLORE COLLECTION</span>
              <span className="featured-collection-arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default FeaturedCollection;
