import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import storeImage from "../../../assets/images/store.jpg";
import "./BrandStory.css";

function BrandStory() {
  return (
    <section className="brand-story" aria-label="Brand Story">
      <div className="brand-story-container">
        {/* Left Column: Visual Media */}
        <motion.div
          className="brand-story-media"
          initial={{ opacity: 0, x: -35 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="brand-story-image-wrapper">
            <img
              src={storeImage}
              alt="VENSEVEN Men's Fashion Studio in Hyderabad"
              className="brand-story-img"
              loading="lazy"
            />

            <div className="brand-story-badge">
              <span className="badge-tag">STUDIO</span>
              <span className="badge-loc">EST. HYDERABAD</span>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Editorial Narrative */}
        <motion.div
          className="brand-story-content"
          initial={{ opacity: 0, x: 35 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        >
          <span className="brand-story-label">THE VENSEVEN PHILOSOPHY</span>

          <h2 className="brand-story-title">
            LESS NOISE.
            <br />
            <span>BETTER STYLE.</span>
          </h2>

          <p className="brand-story-description">
            Born from the belief that true sophistication lies in restraint.
            VENSEVEN crafts contemporary menswear designed to elevate your everyday
            presence—combining precision tailoring, premium breathable fabrics, and
            effortless versatility for the modern man.
          </p>

          <div className="brand-story-highlights">
            <div className="brand-highlight-item">
              <span className="highlight-number">01</span>
              <div>
                <h4>Precision Fit</h4>
                <p>Architectural silhouettes tailored for confidence and natural movement.</p>
              </div>
            </div>

            <div className="brand-highlight-item">
              <span className="highlight-number">02</span>
              <div>
                <h4>Uncompromising Quality</h4>
                <p>Curated textures and enduring construction designed to outlast trends.</p>
              </div>
            </div>
          </div>

          <div className="brand-story-action">
            <Link to="/about" className="brand-story-btn">
              <span>DISCOVER OUR STORY</span>
              <span className="brand-story-arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default BrandStory;
