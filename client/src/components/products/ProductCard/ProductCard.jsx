import { Link } from "react-router-dom";
import { useWishlist } from "../../../context/useWishlist";
import CloudinaryImage from "../../common/CloudinaryImage/CloudinaryImage";
import "./ProductCard.css";

function ProductCard({ product, onWishlist, onQuickView }) {
  const { isWishlisted, toggleWishlist } = useWishlist();

  if (!product) return null;

  const pId = product.id || product._id;
  const productUrl = `/product/${product.slug || pId}`;
  const wishlisted = isWishlisted(pId);
  const imageSrc =
    product.image ||
    product.primaryImage ||
    product.images?.[0]?.url ||
    "";

  const isSoldOut =
    product.totalStock !== undefined && product.totalStock <= 0;

  const formattedPrice =
    typeof product.price === "number"
      ? `₹${product.price.toLocaleString()}`
      : product.price;

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onWishlist) {
      onWishlist(product);
    } else {
      toggleWishlist(product);
    }
  };

  return (
    <article className={`product-card ${isSoldOut ? "product-card-sold-out" : ""}`}>
      <div className="product-image-wrapper">
        <Link to={productUrl} aria-label={`View details of ${product.name}`}>
          <CloudinaryImage
            src={imageSrc}
            alt={product.name}
            loading="lazy"
          />
        </Link>

        {/* Stock & Status Badges */}
        {isSoldOut ? (
          <span className="card-status-badge sold-out">SOLD OUT</span>
        ) : product.isNewArrival ? (
          <span className="card-status-badge new">NEW DROP</span>
        ) : product.isBestSeller ? (
          <span className="card-status-badge best">BEST SELLER</span>
        ) : null}

        <button
          type="button"
          className={`wishlist-btn ${wishlisted ? "active" : ""}`}
          aria-label={
            wishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          onClick={handleWishlistClick}
        >
          {wishlisted ? "♥" : "♡"}
        </button>

        {onQuickView && (
          <button
            type="button"
            className="quick-view"
            onClick={() => onQuickView(product)}
          >
            QUICK VIEW ↗
          </button>
        )}
      </div>

      <div className="product-info">
        <div>
          <Link to={productUrl} className="product-title-link">
            <h3>{product.name}</h3>
          </Link>

          <span>
            {product.category}
            {product.color ? ` · ${product.color}` : ""}
          </span>
        </div>

        <strong>{formattedPrice}</strong>
      </div>
    </article>
  );
}

export default ProductCard;
