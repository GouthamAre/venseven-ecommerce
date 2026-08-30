import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowRight, FiMapPin, FiCompass, FiFeather, FiShield } from "react-icons/fi";

import Navbar from "../../components/layout/Navbar/Navbar";
import storeImg from "../../assets/images/store.jpg";
import collectionImg from "../../assets/images/collection.jpg";

import "./About.css";

const BRAND_VALUES = [
  {
    icon: FiCompass,
    number: "01",
    title: "PRECISION SILHOUETTES",
    description:
      "Every seam, collar taper, and cuff proportion is engineered to deliver a structured yet comfortable drape that feels natural from morning to night.",
  },
  {
    icon: FiFeather,
    number: "02",
    title: "TACTILE QUALITY",
    description:
      "We source rich Egyptian twills, pure European linens, and heavyweight compact cottons that feel substantial against the skin and endure daily wear.",
  },
  {
    icon: FiShield,
    number: "03",
    title: "EVERYDAY CONFIDENCE",
    description:
      "Style shouldn't be complicated. Our pieces are designed to eliminate decision fatigue, ensuring you look effortlessly put together every single day.",
  },
  {
    icon: FiMapPin,
    number: "04",
    title: "HYDERABAD ROOTS",
    description:
      "Rooted in Hyderabad, our physical studio provides a tactile space for personal consultations, garment exploration, and sartorial community.",
  },
];

function About() {
  return (
    <>
      <Navbar />

      <main className="about-page">
        {/* Hero Section */}
        <section className="about-hero">
          <div className="about-container">
            <motion.div
              className="about-hero-content"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="about-eyebrow">ABOUT VENSEVEN · EST. HYDERABAD</span>
              <h1 className="about-hero-title">
                THE ART OF
                <br />
                LOOKING SHARP.
              </h1>
              <p className="about-hero-subtitle">
                VENSEVEN is a modern menswear studio committed to understated confidence, intentional design, and refined everyday essentials.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Brand Philosophy Narrative (2 Columns) */}
        <section className="about-story-section">
          <div className="about-container">
            <div className="about-story-grid">
              <motion.div
                className="about-story-left"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <span className="story-label">OUR PHILOSOPHY</span>
                <h2 className="story-heading">
                  LESS NOISE.
                  <br />
                  BETTER STYLE.
                </h2>
                <p className="story-lead">
                  Modern menswear has too often been caught between loud disposable fast-fashion and overly rigid traditional formalwear.
                </p>
                <p className="story-body">
                  At VENSEVEN, we believe true sophistication lies in restraint. We strip away superfluous decoration to focus on what matters: the cleanliness of the silhouette, the weight of the weave, and the confidence the garment instills when you put it on.
                </p>
              </motion.div>

              <motion.div
                className="about-story-right"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="about-portrait-card">
                  <img
                    src={collectionImg}
                    alt="VENSEVEN Editorial Menswear"
                    className="about-story-img"
                    loading="lazy"
                  />
                  <div className="portrait-caption">
                    <span>THE VENSEVEN SILHOUETTE</span>
                    <strong>Structured Ease · Minimalist Palette</strong>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Physical Store Presence in Hyderabad */}
        <section className="about-store-section">
          <div className="about-container">
            <div className="about-store-card">
              <div className="store-image-wrapper">
                <img
                  src={storeImg}
                  alt="VENSEVEN Physical Studio in Hyderabad"
                  className="store-img"
                  loading="lazy"
                />
                <div className="store-badge">
                  <FiMapPin />
                  <span>HYDERABAD STUDIO</span>
                </div>
              </div>

              <div className="store-info-content">
                <span className="store-eyebrow">PHYSICAL PRESENCE</span>
                <h2 className="store-title">STEP INTO OUR HYDERABAD STUDIO</h2>
                <p className="store-desc">
                  Beyond our digital flagship, VENSEVEN operates a dedicated physical studio in Hyderabad. Designed as a calm, minimalist environment, our store invites you to feel fabric weights in person, experience precision fitting, and explore the entire collection firsthand.
                </p>

                <div className="store-details-list">
                  <div className="store-detail-item">
                    <strong>Location</strong>
                    <p>Hyderabad, Telangana, India</p>
                  </div>
                  <div className="store-detail-item">
                    <strong>Experience</strong>
                    <p>Personal Styling &amp; Complete Collection Preview</p>
                  </div>
                </div>

                <Link to="/shop" className="store-cta-btn">
                  <span>DISCOVER THE PIECES</span>
                  <FiArrowRight />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Brand Values Grid */}
        <section className="about-values-section">
          <div className="about-container">
            <div className="values-header">
              <span className="values-eyebrow">CORE PILLARS</span>
              <h2 className="values-title">WHAT DEFINES VENSEVEN.</h2>
              <p className="values-subtitle">
                The foundational principles behind every shirt, trouser, and essential we create.
              </p>
            </div>

            <div className="values-grid">
              {BRAND_VALUES.map((val, idx) => {
                const IconComponent = val.icon;
                return (
                  <motion.div
                    key={val.number}
                    className="value-card"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                  >
                    <div className="value-top-row">
                      <span className="value-number">{val.number}</span>
                      <div className="value-icon-box">
                        <IconComponent />
                      </div>
                    </div>

                    <h3 className="value-card-title">{val.title}</h3>
                    <p className="value-card-desc">{val.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="about-cta-section">
          <div className="about-container">
            <div className="about-cta-box">
              <span className="about-cta-eyebrow">BEGIN YOUR WARDROBE</span>
              <h2 className="about-cta-heading">ELEVATE YOUR DAILY STYLE.</h2>
              <p className="about-cta-text">
                Explore our current curation of shirts, trousers, and refined essentials.
              </p>
              <div className="about-cta-buttons">
                <Link to="/shop" className="about-primary-btn">
                  <span>SHOP ALL MENSWEAR</span>
                  <FiArrowRight />
                </Link>
                <Link to="/collections" className="about-secondary-btn">
                  VIEW COLLECTIONS
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default About;
