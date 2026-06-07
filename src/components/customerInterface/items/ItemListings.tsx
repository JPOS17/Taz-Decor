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

import "../../../styles/components/customerInterface/items/ItemListing.css";

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

  // Navigates to the items page
  const handleClick = () => {
    navigate(`/items/${product.variant_id}`, {
      state: { from: fromPath || "/items" },
    });
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
    } else if (coupon.free_shipping && !coupon.discount_value) {
      return "FREE SHIPPING";
    }
    return "DISCOUNT";
  };

  // Builds the combined coupon label shown in the text block (e.g. "10% OFF · Free Shipping")
  const getCouponLabelText = (): string | null => {
    if (!coupon) return null;
    const parts: string[] = [];
    if (coupon.discount_value || coupon.discount_type === "bogo") {
      parts.push(
        isBogo ? formatBogoBadge(coupon) : getDiscountBadgeText(coupon),
      );
    }
    if (coupon.free_shipping) {
      parts.push("Free Shipping");
    }
    return parts.length > 0 ? parts.join(" · ") : null;
  };

  const couponLabelText = getCouponLabelText();

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="item-listing-list-item" onClick={handleClick}>
      {/* Image tile */}
      <div className="item-listing-image-container">
        <img src={product.primary_image} alt={product.name} />

        {/* Discount badge — top left overlay */}
        {coupon &&
          (coupon.discount_value || coupon.discount_type === "bogo") && (
            <div className="item-listing-discount-badge">
              {isBogo ? formatBogoBadge(coupon) : getDiscountBadgeText(coupon)}
            </div>
          )}

        {/* Free shipping badge — top right overlay */}
        {coupon && coupon.free_shipping && (
          <div className="item-listing-free-shipping-badge">FREE SHIPPING</div>
        )}

        {/* Wishlist button */}
        <div
          className={`item-listing-wishlist-btn${coupon?.free_shipping ? " item-listing-wishlist-btn-shifted" : ""}`}
          onClick={handleWishlistClick}
        >
          {isInWishlistState ? (
            <FaHeart className="item-listing-wishlist-icon-filled" />
          ) : (
            <FaRegHeart className="item-listing-wishlist-icon" />
          )}
        </div>
      </div>

      {/* Text block — name, coupon label, and price below the image tile */}
      <div className="item-listing-text-block">
        {couponLabelText && (
          <p className="item-listing-coupon-label">{couponLabelText}</p>
        )}

        <p className="item-listing-item-name">{product.name}</p>

        {/* Price row — shows original and discounted price when a discount applies */}
        <div className="item-listing-price-row">
          {hasDiscountedPrice && discountInfo ? (
            <>
              <span className="item-listing-price-original">
                ${product.price.toFixed(2)}
              </span>
              <span className="item-listing-price-discounted">
                ${discountInfo.discountedPrice.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="item-listing-price">
              ${product.price.toFixed(2)}
            </span>
          )}

          {/* Lock icon — signals that email verification is required to use the coupon */}
          {requiresVerification && (
            <span
              className="item-listing-lock-icon"
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
