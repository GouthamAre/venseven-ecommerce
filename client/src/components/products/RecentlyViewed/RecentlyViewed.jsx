import { useMemo } from "react";
import ProductCard from "../ProductCard/ProductCard";
import { getRecentlyViewed } from "../../../utils/recentlyViewed";
import "./RecentlyViewed.css";

function RecentlyViewed({ currentProductId, onWishlist, onQuickView }) {
  const recentProducts = useMemo(() => {
    return getRecentlyViewed(currentProductId);
  }, [currentProductId]);

  if (!recentProducts || recentProducts.length === 0) {
    return null;
  }

  return (
    <section className="recently-viewed-section" aria-label="Recently Viewed Products">
      <div className="recently-viewed-header">
        <span className="recently-viewed-eyebrow">YOUR BROWSING HISTORY</span>
        <h2 className="recently-viewed-title">RECENTLY VIEWED</h2>
      </div>

      <div className="recently-viewed-grid">
        {recentProducts.map((prod) => (
          <ProductCard
            key={prod.id || prod._id}
            product={prod}
            onWishlist={onWishlist}
            onQuickView={onQuickView}
          />
        ))}
      </div>
    </section>
  );
}

export default RecentlyViewed;
