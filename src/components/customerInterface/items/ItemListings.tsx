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

  const handleClick = () => {
    navigate(`/items/${product.variant_id}`, {
      state: { from: fromPath || "/items" },
    });
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigating to detail page

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

    // When adding from list, use the best coupon
    addToWishlist(wishlistItem, coupon?.coupon_id);
  };

  const isInWishlistState = isInWishlist(product.variant_id);

  // Check if user needs to verify email for this coupon
  const requiresVerification =
    coupon?.requires_verified_email && !user?.isEmailVerified;

  // Determine how to display the coupon
  const showDiscountedPrice = coupon && shouldShowDiscountedPrice(coupon);
  const isBogo = coupon?.discount_type === "bogo";

  // Calculate discount info if it's a percentage or fixed discount
  const discountInfo = showDiscountedPrice
    ? calculateDiscount(product.price, coupon)
    : null;
  const hasDiscountedPrice = !!discountInfo && discountInfo.discountAmount > 0;

  // Helper to format discount badge text for percentage and fixed
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

  return (
    <div
      className="list-item"
      onClick={handleClick}
      style={{ cursor: "pointer" }}
    >
      {/* Wishlist icon */}
      <div className="wishlist-icon-container" onClick={handleWishlistClick}>
        {isInWishlistState ? (
          <FaHeart className="wishlist-icon filled" />
        ) : (
          <FaRegHeart className="wishlist-icon" />
        )}
      </div>

      {/* Discount badge - Shows for percentage, fixed, OR BOGO (top-left) */}
      {coupon && (coupon.discount_value || coupon.discount_type === "bogo") && (
        <div className="discount-badge-corner">
          {isBogo ? formatBogoBadge(coupon) : getDiscountBadgeText(coupon)}
        </div>
      )}

      {/* Free Shipping badge (top-right) - Show whenever free_shipping is true */}
      {coupon && coupon.free_shipping && (
        <div className="free-shipping-badge-corner">FREE SHIPPING</div>
      )}

      <div className="image-container">
        <img src={product.primary_image} alt={product.name} />
      </div>

      <h5 className="item-title">{product.name}</h5>

      {/* Price display - only show discounted price for percentage/fixed */}
      <div className="item-price-container">
        {hasDiscountedPrice && discountInfo ? (
          <>
            <p className="item-price-original">${product.price.toFixed(2)}</p>
            <p className="item-price-discounted">
              ${discountInfo.discountedPrice.toFixed(2)}
            </p>
            {requiresVerification && (
              <div
                className="verification-required-icon"
                title="Login or verify email to use this coupon"
              >
                <FaLock size={12} />
              </div>
            )}
          </>
        ) : (
          <>
            <p className="item-price">${product.price.toFixed(2)}</p>
            {/* Show lock icon for BOGO if verification required */}
            {isBogo && requiresVerification && (
              <div
                className="verification-required-icon"
                title="Login or verify email to use this coupon"
              >
                <FaLock size={12} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ListItem;
