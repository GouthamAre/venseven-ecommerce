import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { getProducts } from "../../../services/productService";
import { bestSellers as localBestSellersFallback } from "../../../data/products";
import ProductCard from "../../products/ProductCard/ProductCard";
import "./BestSellers.css";

function BestSellers() {
  const [bestSellersList, setBestSellersList] = useState(localBestSellersFallback);

  useEffect(() => {
    let isMounted = true;
    async function loadBestSellers() {
      try {
        const res = await getProducts({ filter: "best-sellers" });
        if (res?.success && Array.isArray(res.products) && res.products.length > 0 && isMounted) {
          setBestSellersList(res.products.slice(0, 4));
        }
      } catch (err) {
        console.warn("[BestSellers] Dynamic load error:", err);
      }
    }
    loadBestSellers();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="best-sellers" aria-label="Best Sellers">
      <div className="best-sellers-container">
        {/* Section Header */}
        <motion.div
          className="best-sellers-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7 }}
        >
          <div>
            <span className="best-sellers-label">FAVORITES</span>
            <h2 className="best-sellers-title">
              BEST
              <br />
              <span>SELLERS.</span>
            </h2>
          </div>

          <p className="best-sellers-subtitle">
            The pieces everyone keeps coming back for.
          </p>
        </motion.div>

        {/* 4 Products Grid */}
        <div className="best-sellers-grid">
          {bestSellersList.map((product, index) => (
            <motion.div
              key={product.id || product._id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>

        {/* Section Footer */}
        <div className="best-sellers-footer">
          <Link to="/shop?filter=best-sellers" className="best-sellers-cta">
            VIEW ALL BEST SELLERS ↗
          </Link>
        </div>
      </div>
    </section>
  );
}

export default BestSellers;
