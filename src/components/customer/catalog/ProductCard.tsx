import { useNavigate } from "react-router";
import { useCart } from "../../../context/CartContext";
import { useAuth } from "../../../context/AuthContext";
import { FaHeart, FaRegHeart, FaLock } from "react-icons/fa";
import { type ProductPreview } from "../../../api/listings";
import {
  type ProductCoupon,
  calculateDiscount,
  shouldShowDiscountedPrice,
  formatBogoBadge,
} from "../../../api/couponCustomer";

interface ListItemProps {
  product: ProductPreview;
  coupon?: ProductCoupon | null;
  fromPath?: string;
}

const ListItem = ({ product, coupon, fromPath }: ListItemProps) => {
  const navigate = useNavigate();
  const { addToWishlist, isInWishlist } = useCart();
  const { user } = useAuth();

  // ============================================================================
  // HANDLERS
  // ============================================================================

  // Navigates to the product detail page
  const handleClick = () => {
    navigate(`/items/${product.variant_id}`, {
      state: { from: fromPath || "/items" },
    });
  };

  // Lets keyboard users open the card with Enter; ignores keys pressed on the
  // nested wishlist button so it doesn't also trigger navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter") handleClick();
  };

  // Stops card click propagation so the wishlist toggle doesn't also navigate
  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    const wishlistItem = {
      variant_id: product.variant_id,
      product_id: product.product_id,
      category_id: product.category_id,
      product_type_id: product.product_type_id,
      name: product.name,
      price: product.price,
      image: product.primary_image,
      category: product.category,
      color: product.color,
      size: product.size,
    };

    addToWishlist(wishlistItem, coupon?.coupon_id);
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const isInWishlistState = isInWishlist(product.variant_id);

  // Coupon requires verified email but the current user hasn't verified
  const requiresVerification =
    coupon?.requires_verified_email && !user?.isEmailVerified;

  const showDiscountedPrice = coupon && shouldShowDiscountedPrice(coupon);
  const isBogo = coupon?.discount_type === "bogo";

  const discountInfo = showDiscountedPrice
    ? calculateDiscount(product.price, coupon)
    : null;
  const hasDiscountedPrice = !!discountInfo && discountInfo.discountAmount > 0;

  // Returns the short badge string shown in the top-left image overlay
  const getDiscountBadgeText = (coupon: ProductCoupon): string => {
    if (coupon.discount_type === "percentage" && coupon.discount_value) {
      return `${coupon.discount_value}% OFF`;
    } else if (coupon.discount_type === "fixed" && coupon.discount_value) {
      return `$${coupon.discount_value} OFF`;
    }
    return "DISCOUNT";
  };

  // Label shown in the image badge
  const couponLabelText: string | null =
    coupon && (coupon.discount_value || isBogo)
      ? isBogo
        ? formatBogoBadge(coupon)
        : getDiscountBadgeText(coupon)
      : null;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      className="product-card-list-item"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="link"
      tabIndex={0}
    >
      {/* Image tile */}
      <div className="product-card-image-container">
        <img
          src={product.primary_image}
          alt={product.name}
          loading="lazy"
          decoding="async"
        />

        {/* Discount badge */}
        {couponLabelText && (
          <div className="product-card-discount-badge">{couponLabelText}</div>
        )}

        {/* Wishlist button */}
        <button
          type="button"
          className="product-card-wishlist-btn"
          onClick={handleWishlistClick}
          aria-pressed={isInWishlistState}
          aria-label={
            isInWishlistState ? "Remove from wishlist" : "Add to wishlist"
          }
        >
          {isInWishlistState ? (
            <FaHeart className="product-card-wishlist-icon-filled" />
          ) : (
            <FaRegHeart className="product-card-wishlist-icon" />
          )}
        </button>
      </div>

      {/* Text block */}
      <div className="product-card-text-block">
        <p className="product-card-item-name">{product.name}</p>

        {/* Price row */}
        <div className="product-card-price-row">
          {hasDiscountedPrice && discountInfo ? (
            <>
              <span className="product-card-price-discounted">
                ${discountInfo.discountedPrice.toFixed(2)}
              </span>
              <span className="product-card-price-original">
                ${product.price.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="product-card-price">
              ${product.price.toFixed(2)}
            </span>
          )}

          {/* Lock icon */}
          {requiresVerification && (
            <span
              className="product-card-lock-icon"
              title="Login or verify email to use this coupon"
            >
              <FaLock size={11} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListItem;
