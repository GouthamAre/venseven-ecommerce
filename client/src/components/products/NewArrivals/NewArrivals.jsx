import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getProducts } from "../../../services/productService";
import { products as localProductsFallback } from "../../../data/products";
import ProductCard from "../ProductCard/ProductCard";
import "./NewArrivals.css";

function NewArrivals() {
  const [newArrivalsList, setNewArrivalsList] = useState(
    localProductsFallback.filter((p) => p.isNewArrival)
  );

  useEffect(() => {
    let isMounted = true;
    async function loadNewArrivals() {
      try {
        const res = await getProducts({ filter: "new-arrivals" });
        if (res?.success && Array.isArray(res.products) && res.products.length > 0 && isMounted) {
          setNewArrivalsList(res.products);
        }
      } catch (err) {
        console.warn("[NewArrivals] Dynamic load error:", err);
      }
    }
    loadNewArrivals();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="new-arrivals" aria-label="New Arrivals">
      <div className="new-arrivals-container">
        <div className="new-arrivals-header">
          <div>
            <span className="section-label">THE LATEST DROP</span>
            <h2>
              NEW
              <br />
              <span>ARRIVALS.</span>
            </h2>
          </div>

          <p>
            Fresh pieces. New energy.
            <br />
            Designed for the modern man.
          </p>
        </div>

        <div className="new-arrivals-grid">
          {newArrivalsList.map((product) => (
            <ProductCard key={product.id || product._id} product={product} />
          ))}
        </div>

        <div className="new-arrivals-footer">
          <Link to="/shop?filter=new-arrivals" className="new-arrivals-cta">
            VIEW ALL NEW ARRIVALS ↗
          </Link>
        </div>
      </div>
    </section>
  );
}

export default NewArrivals;