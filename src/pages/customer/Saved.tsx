import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import {
  FaHeart,
  FaShoppingCart,
  FaLock,
  FaTag,
  FaExclamationTriangle,
} from "react-icons/fa";
import {
  fetchProductCouponsPreview,
  type ProductCoupon,
  type GroupedCoupons,
  findBestCoupon,
  calculateDiscount,
  shouldShowDiscountedPrice,
  checkCustomGroupCoupons,
  isItemLevelCoupon,
} from "../../api/couponCustomer";

import MiniCart from "../../components/customerInterface/MiniCart";

import "../../styles/pages/customer/Saved.css";

const Saved = () => {
  const { wishlistItems, removeFromWishlist, addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [justAddedItem, setJustAddedItem] = useState<any>(null);
  const [isNewItem, setIsNewItem] = useState(false);
  const [coupons, setCoupons] = useState<GroupedCoupons | null>(null);
  const [customGroupMap, setCustomGroupMap] = useState<
    Record<number, number[]>
  >({});

  const isEmailVerified = user?.isEmailVerified ?? false;

  // Fetch coupons on mount
  useEffect(() => {
    const loadCoupons = async () => {
      try {
        const couponsData = await fetchProductCouponsPreview();
        setCoupons(couponsData);

        // Fetch custom group mappings if needed
        if (couponsData.custom_group.length > 0 && wishlistItems.length > 0) {
          const variantIds = wishlistItems.map((item) => item.variant_id);
          const mapping = await checkCustomGroupCoupons(variantIds);
          setCustomGroupMap(mapping);
        }
      } catch (error) {
        console.error("Error loading coupons:", error);
      }
    };

    loadCoupons();
  }, [wishlistItems]);

  // Helper to get applicable coupons for a wishlist item
  const getApplicableCouponsForItem = (
    item: (typeof wishlistItems)[0],
  ): ProductCoupon[] => {
    if (!coupons) return [];

    const applicableCoupons: ProductCoupon[] = [];

    // Helper function to check if coupon applies to this product's location
    const couponMatchesLocation = (coupon: ProductCoupon): boolean => {
      // For wishlist items, we don't have location_id, so we allow all coupons
      // You may want to fetch location_id separately if needed
      return true;
    };

    // Add 'all' coupons
    const allCoupons = coupons.all.filter((c) => couponMatchesLocation(c));
    applicableCoupons.push(...allCoupons);

    // Add category coupons
    if (item.category_id) {
      const categoryCoupons = coupons.category.filter(
        (c) => c.applies_to_id === item.category_id && couponMatchesLocation(c),
      );
      applicableCoupons.push(...categoryCoupons);
    }

    // Add product_type coupons
    if (item.product_type_id) {
      const productTypeCoupons = coupons.product_type.filter(
        (c) =>
          c.applies_to_id === item.product_type_id && couponMatchesLocation(c),
      );
      applicableCoupons.push(...productTypeCoupons);
    }

    // Add product coupons
    if (item.product_id) {
      const productCoupons = coupons.product.filter(
        (c) => c.applies_to_id === item.product_id && couponMatchesLocation(c),
      );
      applicableCoupons.push(...productCoupons);
    }

    // Add variant coupons
    const variantCoupons = coupons.variant.filter(
      (c) => c.applies_to_id === item.variant_id && couponMatchesLocation(c),
    );
    applicableCoupons.push(...variantCoupons);

    // Add custom_group coupons
    if (customGroupMap[item.variant_id]) {
      const applicableCouponIds = customGroupMap[item.variant_id];
      const customGroupCoupons = coupons.custom_group.filter(
        (c) =>
          applicableCouponIds.includes(c.coupon_id) && couponMatchesLocation(c),
      );
      applicableCoupons.push(...customGroupCoupons);
    }

    return applicableCoupons;
  };

  // Helper to get the coupon to display for an item
  const getCouponForItem = (
    item: (typeof wishlistItems)[0],
  ): {
    itemCoupon: ProductCoupon | null;
    isExpired: boolean;
    fallbackToBest: boolean;
  } => {
    const applicableCoupons = getApplicableCouponsForItem(item);

    // If user had selected a coupon
    if (item.selected_coupon_id) {
      const selectedCoupon = applicableCoupons.find(
        (c) => c.coupon_id === item.selected_coupon_id,
      );

      // Check if selected coupon is still valid
      if (selectedCoupon) {
        const isExpired = selectedCoupon.valid_until
          ? new Date(selectedCoupon.valid_until) < new Date()
          : false;

        if (!isExpired) {
          return {
            itemCoupon: selectedCoupon,
            isExpired: false,
            fallbackToBest: false,
          };
        } else {
          // Coupon expired, fall back to best
          const bestCoupon = findBestCoupon(applicableCoupons, item.price);
          return {
            itemCoupon: bestCoupon,
            isExpired: true,
            fallbackToBest: true,
          };
        }
      } else {
        // Selected coupon no longer applicable, fall back to best
        const bestCoupon = findBestCoupon(applicableCoupons, item.price);
        return {
          itemCoupon: bestCoupon,
          isExpired: false,
          fallbackToBest: true,
        };
      }
    }

    // No selected coupon - don't apply any coupon
    return { itemCoupon: null, isExpired: false, fallbackToBest: false };
  };

  const handleAddToCart = (item: (typeof wishlistItems)[0]) => {
    const cartItem = {
      variant_id: item.variant_id,
      product_id: item.product_id,
      category_id: item.category_id,
      product_type_id: item.product_type_id,
      name: item.name,
      price: item.price,
      image: item.image,
      color: item.color,
      size: item.size,
      category: item.category,
    };

    // Get the item's coupon (either selected or best available)
    const { itemCoupon } = getCouponForItem(item);

    // Pass the coupon ID when adding to cart
    const wasNewlyAdded = addToCart(cartItem, itemCoupon?.coupon_id);

    // Show mini cart
    setJustAddedItem(cartItem);
    setIsNewItem(wasNewlyAdded);
    setIsMiniCartOpen(true);
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="saved-page">
        <div className="saved-container">
          <div className="empty-wishlist">
            <FaHeart className="empty-wishlist-icon" />
            <h2 className="empty-wishlist-title">Your Wishlist is Empty</h2>
            <p className="empty-wishlist-text">
              Save your favorite items here!
            </p>
            <button
              className="btn-browse-products"
              onClick={() => navigate("/items")}
            >
              Browse Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="saved-page">
      <div className="saved-container">
        <div className="saved-header">
          <h2 className="saved-title">
            <FaHeart className="saved-title-icon" />
            My Wishlist
          </h2>
          <span className="wishlist-count-badge">
            {wishlistItems.length} items
          </span>
        </div>

        <div className="wishlist-grid">
          {wishlistItems
            .sort((a, b) => b.addedAt - a.addedAt)
            .map((item) => {
              const { itemCoupon, isExpired, fallbackToBest } =
                getCouponForItem(item);
              const hasDiscount =
                itemCoupon &&
                shouldShowDiscountedPrice(itemCoupon) &&
                itemCoupon.discount_type !== "bogo" &&
                isEmailVerified;
              const discountInfo = hasDiscount
                ? calculateDiscount(item.price, itemCoupon)
                : null;
              const requiresVerification =
                itemCoupon?.requires_verified_email && !isEmailVerified;

              return (
                <div key={item.variant_id} className="wishlist-card">
                  <div className="wishlist-card-image-wrapper">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="wishlist-card-image"
                      onClick={() =>
                        navigate(`/items/${item.variant_id}`, {
                          state: { from: "/saved" },
                        })
                      }
                    />
                  </div>
                  <div className="wishlist-card-body">
                    <span className="wishlist-card-category">
                      {item.category}
                    </span>

                    <h5
                      className="wishlist-card-title"
                      onClick={() =>
                        navigate(`/items/${item.variant_id}`, {
                          state: { from: "/saved" },
                        })
                      }
                    >
                      {item.name}
                    </h5>

                    {(item.color || item.size) && (
                      <p className="wishlist-card-details">
                        {item.color && <span>Color: {item.color}</span>}
                        {item.color && item.size && <span> | </span>}
                        {item.size && <span>Size: {item.size}</span>}
                      </p>
                    )}

                    {/* Price with discount */}
                    <div className="wishlist-card-price-container">
                      {hasDiscount && discountInfo ? (
                        <>
                          <p className="wishlist-card-price-original">
                            ${item.price.toFixed(2)}
                          </p>
                          <div className="wishlist-card-price-with-deal">
                            <p className="wishlist-card-price-discounted">
                              ${discountInfo.discountedPrice.toFixed(2)}
                            </p>
                            <div className="wishlist-card-deal-badges">
                              {itemCoupon.discount_type === "percentage" && (
                                <span className="deal-badge">
                                  {itemCoupon.discount_value}% OFF
                                </span>
                              )}
                              {itemCoupon.discount_type === "fixed" && (
                                <span className="deal-badge">
                                  ${itemCoupon.discount_value} OFF
                                </span>
                              )}
                              {itemCoupon.free_shipping && (
                                <span className="deal-badge shipping">
                                  + Free Shipping
                                </span>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="wishlist-card-price-with-deal">
                          <p className="wishlist-card-price">
                            ${item.price.toFixed(2)}
                          </p>
                          {itemCoupon && (
                            <div className="wishlist-card-deal-badges">
                              {itemCoupon.discount_type === "bogo" && (
                                <span className="deal-badge bogo">
                                  {itemCoupon.bogo_discount_percentage === 100
                                    ? `Buy ${itemCoupon.bogo_buy_quantity || 1} Get ${itemCoupon.bogo_get_quantity || 1} FREE`
                                    : `Buy ${itemCoupon.bogo_buy_quantity || 1} Get ${itemCoupon.bogo_get_quantity || 1} ${itemCoupon.bogo_discount_percentage}% OFF`}
                                </span>
                              )}
                              {itemCoupon.free_shipping && (
                                <span className="deal-badge shipping">
                                  + Free Shipping
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Coupon info */}
                    {itemCoupon && (
                      <div className="wishlist-card-coupon-info">
                        {isExpired && (
                          <div className="coupon-expired-notice">
                            <FaExclamationTriangle size={12} />
                            <span>Saved coupon expired</span>
                          </div>
                        )}
                        {fallbackToBest && !isExpired && (
                          <div className="coupon-fallback-notice">
                            <FaExclamationTriangle size={12} />
                            <span>Saved coupon no longer available</span>
                          </div>
                        )}
                        <div className="coupon-code-badge">
                          <FaTag size={10} />
                          <span>{itemCoupon.coupon_code}</span>
                        </div>
                        {requiresVerification && (
                          <div className="coupon-verification-notice">
                            <FaLock size={10} />
                            <span>Login required</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="wishlist-card-actions">
                      <button
                        className="btn-add-to-cart"
                        onClick={() => handleAddToCart(item)}
                      >
                        Add to Cart
                      </button>

                      <button
                        className="btn-remove-wishlist"
                        onClick={() => removeFromWishlist(item.variant_id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Mini Cart Modal */}
        <MiniCart
          isOpen={isMiniCartOpen}
          onClose={() => {
            setIsMiniCartOpen(false);
            setJustAddedItem(null);
          }}
          justAddedItem={justAddedItem}
          isNewItem={isNewItem}
          fromPath="/saved"
        />
      </div>
    </div>
  );
};

export default Saved;
