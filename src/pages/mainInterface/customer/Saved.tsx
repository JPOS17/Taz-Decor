import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useCart } from "../../../context/CartContext";
import { useAuth } from "../../../context/AuthContext";
import { FaHeart, FaLock, FaTag, FaExclamationTriangle } from "react-icons/fa";
import {
  fetchProductCouponsPreview,
  type ProductCoupon,
  type GroupedCoupons,
  findBestCoupon,
  calculateDiscount,
  shouldShowDiscountedPrice,
  checkCustomGroupCoupons,
  isItemLevelCoupon,
} from "../../../api/couponCustomer";

import MiniCart from "../../../components/customerInterface/MiniCart";

import ConfirmModal from "../../../components/universalComponents/ConfirmModal";
import LoadingSpinner from "../../../components/universalComponents/LoadingSpinner";
import { getBOGOLabel } from "../../../utils/couponUtils";

import "../../../styles/pages/customerInterface/Tokens.css";
import "../../../styles/pages/customerInterface/customer/Saved.css";

const Saved = () => {
  const { wishlistItems, removeFromWishlist, addToCart } = useCart();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Coupon data
  const [coupons, setCoupons] = useState<GroupedCoupons | null>(null);
  const [customGroupMap, setCustomGroupMap] = useState<
    Record<number, number[]>
  >({});

  // Mini cart state
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [justAddedItem, setJustAddedItem] = useState<any>(null);
  const [isNewItem, setIsNewItem] = useState(false);

  // Removal confirmation state
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<number | null>(null);

  const isEmailVerified = user?.isEmailVerified ?? false;

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  // Fetch coupons once on mount
  useEffect(() => {
    const loadCoupons = async () => {
      try {
        const couponsData = await fetchProductCouponsPreview();
        setCoupons(couponsData);

        // Fire the custom group mapping fetch concurrently
        if (couponsData.custom_group.length > 0 && wishlistItems.length > 0) {
          const variantIds = wishlistItems.map((item) => item.variant_id);
          checkCustomGroupCoupons(variantIds)
            .then((mapping) => setCustomGroupMap(mapping))
            .catch((err) =>
              console.error("Error loading custom group coupons:", err),
            );
        }
      } catch (error) {
        console.error("Error loading coupons:", error);
      }
    };

    loadCoupons();
  }, []);

  // ============================================================================
  // COUPON LOGIC
  // ============================================================================

  // Returns all applicable coupons for a given wishlist item, filtered by scope
  const getApplicableCouponsForItem = (
    item: (typeof wishlistItems)[0],
  ): ProductCoupon[] => {
    if (!coupons) return [];

    const applicableCoupons: ProductCoupon[] = [];

    applicableCoupons.push(...coupons.all);

    if (item.category_id) {
      const categoryCoupons = coupons.category.filter(
        (c) => c.applies_to_id === item.category_id,
      );
      applicableCoupons.push(...categoryCoupons);
    }

    if (item.product_type_id) {
      const productTypeCoupons = coupons.product_type.filter(
        (c) => c.applies_to_id === item.product_type_id,
      );
      applicableCoupons.push(...productTypeCoupons);
    }

    if (item.product_id) {
      const productCoupons = coupons.product.filter(
        (c) => c.applies_to_id === item.product_id,
      );
      applicableCoupons.push(...productCoupons);
    }

    const variantCoupons = coupons.variant.filter(
      (c) => c.applies_to_id === item.variant_id,
    );
    applicableCoupons.push(...variantCoupons);

    if (customGroupMap[item.variant_id]) {
      const applicableCouponIds = customGroupMap[item.variant_id];
      const customGroupCoupons = coupons.custom_group.filter((c) =>
        applicableCouponIds.includes(c.coupon_id),
      );
      applicableCoupons.push(...customGroupCoupons);
    }

    return applicableCoupons;
  };

  // Resolves the active coupon for a wishlist item, handling expiry and fallback to best available
  const getCouponForItem = (
    item: (typeof wishlistItems)[0],
  ): {
    itemCoupon: ProductCoupon | null;
    isExpired: boolean;
    fallbackToBest: boolean;
  } => {
    const applicableCoupons = getApplicableCouponsForItem(item);

    if (item.selected_coupon_id) {
      const selectedCoupon = applicableCoupons.find(
        (c) => c.coupon_id === item.selected_coupon_id,
      );

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
          // Coupon expired — fall back to best available
          const bestCoupon = findBestCoupon(applicableCoupons, item.price);
          return {
            itemCoupon: bestCoupon,
            isExpired: true,
            fallbackToBest: true,
          };
        }
      } else {
        // Selected coupon no longer applicable — fall back to best available
        const bestCoupon = findBestCoupon(applicableCoupons, item.price);
        return {
          itemCoupon: bestCoupon,
          isExpired: false,
          fallbackToBest: true,
        };
      }
    }

    return { itemCoupon: null, isExpired: false, fallbackToBest: false };
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  // Adds the wishlist item to the cart (with its best coupon) and opens the mini cart
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

    const { itemCoupon } = getCouponForItem(item);
    const wasNewlyAdded = addToCart(cartItem, itemCoupon?.coupon_id);

    setJustAddedItem(cartItem);
    setIsNewItem(wasNewlyAdded);
    setIsMiniCartOpen(true);
  };

  // Queues an item for removal and shows the confirmation modal
  const handleRemoveFromWishlist = (variantId: number) => {
    setItemToRemove(variantId);
    setShowRemoveConfirm(true);
  };

  // Confirms removal and clears the pending item
  const handleConfirmRemove = () => {
    if (itemToRemove !== null) {
      removeFromWishlist(itemToRemove);
    }
    setShowRemoveConfirm(false);
    setItemToRemove(null);
  };

  // Cancels removal and dismisses the confirmation modal
  const handleCancelRemove = () => {
    setShowRemoveConfirm(false);
    setItemToRemove(null);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <div className="saved-page saved-loading-state">
        <LoadingSpinner message="Loading your wishlist..." />
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="saved-page">
        <div className="saved-container">
          <div className="saved-empty">
            <FaHeart className="saved-empty-icon" />
            <h2 className="saved-empty-title">Your Wishlist is Empty</h2>
            <p className="saved-empty-text">Save your favorite items here!</p>
            <button
              className="saved-btn-browse"
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
          <span className="saved-count-badge">
            {wishlistItems.length} items
          </span>
        </div>

        <div className="saved-grid">
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
                <div key={item.variant_id} className="saved-card">
                  <div className="saved-card-image-wrapper">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="saved-card-image"
                      onClick={() =>
                        navigate(`/items/${item.variant_id}`, {
                          state: { from: "/saved" },
                        })
                      }
                    />
                  </div>
                  <div className="saved-card-body">
                    <span className="saved-card-category">{item.category}</span>

                    <h5
                      className="saved-card-title"
                      onClick={() =>
                        navigate(`/items/${item.variant_id}`, {
                          state: { from: "/saved" },
                        })
                      }
                    >
                      {item.name}
                    </h5>

                    {(item.color || item.size) && (
                      <p className="saved-card-details">
                        {item.color && <span>Color: {item.color}</span>}
                        {item.color && item.size && <span> | </span>}
                        {item.size && <span>Size: {item.size}</span>}
                      </p>
                    )}

                    {/* Price — shows strikethrough original and discounted price when a coupon applies */}
                    <div className="saved-card-price-container">
                      {hasDiscount && discountInfo ? (
                        <>
                          <p className="saved-card-price-original">
                            ${item.price.toFixed(2)}
                          </p>
                          <div className="saved-card-price-with-deal">
                            <p className="saved-card-price-discounted">
                              ${discountInfo.discountedPrice.toFixed(2)}
                            </p>
                            <div className="saved-card-deal-badges">
                              {itemCoupon.discount_type === "percentage" && (
                                <span className="saved-deal-badge">
                                  {itemCoupon.discount_value}% OFF
                                </span>
                              )}
                              {itemCoupon.discount_type === "fixed" && (
                                <span className="saved-deal-badge">
                                  ${itemCoupon.discount_value} OFF
                                </span>
                              )}
                              {itemCoupon.free_shipping && (
                                <span className="saved-deal-badge saved-deal-badge-shipping">
                                  + Free Shipping
                                </span>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="saved-card-price-with-deal">
                          <p className="saved-card-price">
                            ${item.price.toFixed(2)}
                          </p>
                          {itemCoupon && (
                            <div className="saved-card-deal-badges">
                              {itemCoupon.discount_type === "bogo" && (
                                <span className="saved-deal-badge saved-deal-badge-bogo">
                                  {getBOGOLabel(
                                    itemCoupon.bogo_buy_quantity,
                                    itemCoupon.bogo_get_quantity,
                                    itemCoupon.bogo_discount_percentage,
                                  )}
                                </span>
                              )}
                              {itemCoupon.free_shipping && (
                                <span className="saved-deal-badge saved-deal-badge-shipping">
                                  + Free Shipping
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Coupon info — expiry notices and coupon code badge */}
                    {itemCoupon && (
                      <div className="saved-card-coupon-info">
                        {isExpired && (
                          <div className="saved-coupon-expired-notice">
                            <FaExclamationTriangle size={12} />
                            <span>Saved coupon expired</span>
                          </div>
                        )}
                        {fallbackToBest && !isExpired && (
                          <div className="saved-coupon-fallback-notice">
                            <FaExclamationTriangle size={12} />
                            <span>Saved coupon no longer available</span>
                          </div>
                        )}
                        <div className="saved-coupon-code-badge">
                          <FaTag size={10} />
                          <span>{itemCoupon.coupon_code}</span>
                        </div>
                        {requiresVerification && (
                          <div className="saved-coupon-verification-notice">
                            <FaLock size={10} />
                            <span>Login required</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="saved-card-actions">
                      <button
                        className="saved-btn-add-to-cart"
                        onClick={() => handleAddToCart(item)}
                      >
                        Add to Cart
                      </button>

                      <button
                        className="saved-btn-remove"
                        onClick={() =>
                          handleRemoveFromWishlist(item.variant_id)
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Mini cart */}
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

        {/* Remove confirmation modal */}
        <ConfirmModal
          isOpen={showRemoveConfirm}
          title="Remove from Wishlist?"
          message="This item will be removed from your wishlist. Are you sure?"
          confirmLabel="Remove"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={handleConfirmRemove}
          onCancel={handleCancelRemove}
        />
      </div>
    </div>
  );
};

export default Saved;
