import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";

import Navbar from "../../components/layout/Navbar/Navbar";
import whiteFormalShirt from "../../assets/images/white-formal-shirt.jpg";
import casualPant from "../../assets/images/casual-pant.jpg";
import collectionImg from "../../assets/images/collection.jpg";
import blueLinenShort from "../../assets/images/blue-linen-short.jpg";

import "./Collections.css";

const COLLECTIONS = [
  {
    id: "formal",
    title: "FORMAL",
    tagline: "THE TAILORED SUITE",
    description:
      "Crisp tailoring, structured collars, and refined Egyptian cotton silhouettes engineered for boardroom presence and evening affairs.",
    image: whiteFormalShirt,
    link: "/shop?category=shirts",
    piecesCount: "04 Pieces",
  },
  {
    id: "casual",
    title: "CASUAL",
    tagline: "CONTEMPORARY LEISURE",
    description:
      "Relaxed proportions, textured corduroys, and breathable weaves designed for effortless weekday-to-weekend transitions.",
    image: casualPant,
    link: "/shop?category=trousers",
    piecesCount: "03 Pieces",
  },
  {
    id: "essentials",
    title: "ESSENTIALS",
    tagline: "FOUNDATION ELEMENTS",
    description:
      "Timeless core staples crafted with heavyweight 240 GSM organic cotton and enduring precision detailing.",
    image: collectionImg,
    link: "/shop?category=t-shirts",
    piecesCount: "04 Pieces",
  },
  {
    id: "summer",
    title: "SUMMER",
    tagline: "WARM-WEATHER RESORT",
    description:
      "Pure European flax linen and airy breezy textures crafted for coastal travel and sunny afternoon ease.",
    image: blueLinenShort,
    link: "/shop?category=shorts",
    piecesCount: "02 Pieces",
  },
];

function Collections() {
  return (
    <>
      <Navbar />

      <main className="collections-page">
        <div className="collections-container">
          {/* Header */}
          <header className="collections-header">
            <span className="collections-eyebrow">CURATED CHAPTERS</span>
            <h1 className="collections-title">COLLECTIONS</h1>
            <p className="collections-subtitle">
              Distinct sartorial stories defined by clean silhouettes, tactile fabrics, and understated confidence.
            </p>
          </header>

          {/* Collections Editorial Grid */}
          <div className="collections-grid">
            {COLLECTIONS.map((item, index) => (
              <motion.article
                key={item.id}
                className="collection-card"
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="collection-image-container">
                  <img
                    src={item.image}
                    alt={`${item.title} Collection`}
                    className="collection-bg-img"
                    loading="lazy"
                  />
                  <div className="collection-overlay" />
                  <div className="collection-badge">{item.piecesCount}</div>
                </div>

                <div className="collection-content">
                  <span className="collection-tagline">{item.tagline}</span>
                  <h2 className="collection-heading">{item.title}</h2>
                  <p className="collection-desc">{item.description}</p>

                  <Link to={item.link} className="collection-cta-btn">
                    <span>EXPLORE COLLECTION</span>
                    <FiArrowRight />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

export default Collections;
