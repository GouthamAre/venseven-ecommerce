import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "./Categories.css";

import casualShirt from "../../../assets/images/casual-shirt.jpg";
import graphicTee from "../../../assets/images/graphic-tee.jpg";
import blackTrouser from "../../../assets/images/black-trouser.jpg";
import blackFormalShirt from "../../../assets/images/black-formal-shirt.jpg";
import collectionImage from "../../../assets/images/collection.jpg";
import casualPant from "../../../assets/images/casual-pant.jpg";

function Categories() {
  const categories = [
    {
      name: "Shirts",
      image: casualShirt,
    },
    {
      name: "T-Shirts",
      image: graphicTee,
    },
    {
      name: "Jeans",
      image: blackTrouser,
    },
    {
      name: "Formals",
      image: blackFormalShirt,
    },
    {
      name: "Hoodies",
      image: collectionImage,
    },
    {
      name: "Casuals",
      image: casualPant,
    },
  ];

  return (
    <section className="categories-section">

      <div className="categories-container">

        {/* Heading */}
        <motion.div
          className="categories-heading"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span>VENSEVEN COLLECTIONS</span>

          <h2>
            SHOP BY
            <strong>CATEGORY.</strong>
          </h2>

          <p>
            Discover pieces designed for every side of your style.
          </p>
        </motion.div>

        {/* Categories */}
        <div className="categories-grid">

          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: index * 0.08,
              }}
            >
              <Link
                to={`/shop?category=${category.name.toLowerCase()}`}
                className="category-card"
                aria-label={`Shop ${category.name}`}
              >
                <img
                  src={category.image}
                  alt={category.name}
                  loading="lazy"
                />

                <div className="category-overlay" />

                <div className="category-content">
                  <span className="category-number">
                    0{index + 1}
                  </span>

                  <div>
                    <h3>{category.name}</h3>

                    <span className="category-link">
                      Explore
                      <b>↗</b>
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}

        </div>

      </div>

    </section>
  );
}

export default Categories;