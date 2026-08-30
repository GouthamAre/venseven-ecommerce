import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import collectionImage from "../../../assets/images/store.jpg";
import "./Hero.css";

function Hero() {
  return (
    <section className="hero">

      {/* Background Image */}
      <div className="hero-image">
        <img
          src={collectionImage}
          alt="VENSEVEN Men's Fashion Collection"
        />
      </div>

      {/* Cinematic Overlay */}
      <div className="hero-overlay" />

      {/* Content */}
      <div className="hero-content">

        <motion.p
          className="hero-eyebrow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          VENSEVEN MEN'S FASHION STUDIO
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35 }}
        >
          THE ART OF
          <span>LOOKING GOOD.</span>
        </motion.h1>

        <motion.p
          className="hero-description"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          Modern menswear crafted for confidence.
        </motion.p>

        <motion.div
          className="hero-buttons"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.8 }}
        >
          <Link to="/shop" className="hero-button primary">
            Shop Collection
            <span>↗</span>
          </Link>

          <Link to="/collections" className="hero-button secondary">
            Explore
          </Link>
        </motion.div>

      </div>

      {/* Bottom Information */}
      <motion.div
        className="hero-bottom"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
      >
        <span>EST. HYDERABAD</span>

        <div className="scroll-indicator">
          <span>SCROLL</span>
          <div className="scroll-line" />
        </div>

        <span>PREMIUM MENSWEAR</span>
      </motion.div>

    </section>
  );
}

export default Hero;