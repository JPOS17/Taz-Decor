import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import {
  FaTrash,
  FaPlus,
  FaMinus,
  FaTag,
  FaLock,
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

import CouponModal from "../../components/customerInterface/items/CouponModal";

import "../../styles/pages/customer/Cart.css";

// ============================================================================
// CART COMPONENT
// ============================================================================

const Cart = () => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    updateCartCoupon,
    clearCart,
    getCartTotal,
  } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Coupon data
  const [coupons, setCoupons] = useState<GroupedCoupons | null>(null);
  const [customGroupMap, setCustomGroupMap] = useState<
    Record<number, number[]>
  >({});

  // Modal state
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [selectedCartItem, setSelectedCartItem] = useState<any | null>(null);

  // Removal warning state
  const [showRemovalWarning, setShowRemovalWarning] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<number | null>(null);

  const isEmailVerified = user?.isEmailVerified ?? false;

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  // Fetch coupons on mount
  useEffect(() => {
    const loadCoupons = async () => {
      try {
        const couponsData = await fetchProductCouponsPreview();
        setCoupons(couponsData);

        // Fetch custom group mappings if needed
        if (couponsData.custom_group.length > 0 && cartItems.length > 0) {
          const variantIds = cartItems.map((item) => item.variant_id);
          const mapping = await checkCustomGroupCoupons(variantIds);
          setCustomGroupMap(mapping);
        }
      } catch (error) {
        console.error("Error loading coupons:", error);
      }
    };

    if (cartItems.length > 0) {
      loadCoupons();
    }
  }, [cartItems.length]);

  // ============================================================================
  // COUPON LOGIC
  // ============================================================================

  // Helper to get applicable coupons for a cart item
  const getApplicableCouponsForItem = (
    item: (typeof cartItems)[0],
  ): ProductCoupon[] => {
    if (!coupons) return [];

    const applicableCoupons: ProductCoupon[] = [];

    // Add 'all' coupons - ONLY item-level
    const allCoupons = coupons.all.filter((c) => isItemLevelCoupon(c));
    applicableCoupons.push(...allCoupons);

    // Add category coupons - ONLY item-level
    if (item.category_id) {
      const categoryCoupons = coupons.category.filter(
        (c) => c.applies_to_id === item.category_id && isItemLevelCoupon(c),
      );
      applicableCoupons.push(...categoryCoupons);
    }

    // Add product_type coupons - ONLY item-level
    if (item.product_type_id) {
      const productTypeCoupons = coupons.product_type.filter(
        (c) => c.applies_to_id === item.product_type_id && isItemLevelCoupon(c),
      );
      applicableCoupons.push(...productTypeCoupons);
    }

    // Add product coupons - ONLY item-level
    if (item.product_id) {
      const productCoupons = coupons.product.filter(
        (c) => c.applies_to_id === item.product_id && isItemLevelCoupon(c),
      );
      applicableCoupons.push(...productCoupons);
    }

    // Add variant coupons - ONLY item-level
    const variantCoupons = coupons.variant.filter(
      (c) => c.applies_to_id === item.variant_id && isItemLevelCoupon(c),
    );
    applicableCoupons.push(...variantCoupons);

    // Add custom_group coupons - ONLY item-level
    if (customGroupMap[item.variant_id]) {
      const applicableCouponIds = customGroupMap[item.variant_id];
      const customGroupCoupons = coupons.custom_group.filter(
        (c) =>
          applicableCouponIds.includes(c.coupon_id) && isItemLevelCoupon(c),
      );
      applicableCoupons.push(...customGroupCoupons);
    }

    return applicableCoupons;
  };

  // Get the coupon for a cart item
  const getCouponForItem = (
    item: (typeof cartItems)[0],
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
          const bestCoupon = findBestCoupon(
            applicableCoupons,
            item.price,
            item.quantity,
          );
          return {
            itemCoupon: bestCoupon,
            isExpired: true,
            fallbackToBest: true,
          };
        }
      } else {
        // Selected coupon no longer applicable, fall back to best
        const bestCoupon = findBestCoupon(
          applicableCoupons,
          item.price,
          item.quantity,
        );
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

  // ============================================================================
  // PRICE CALCULATIONS
  // ============================================================================

  // Calculate original subtotal (before any discounts)
  const calculateOriginalSubtotal = (): number => {
    return cartItems.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
  };

  // Check if multiple items share the same BOGO coupon
  const getBogoCombinationInfo = (
    item: (typeof cartItems)[0],
  ): {
    isCombined: boolean;
    totalItems: number;
  } => {
    const { itemCoupon } = getCouponForItem(item);
    if (!itemCoupon || itemCoupon.discount_type !== "bogo") {
      return { isCombined: false, totalItems: 0 };
    }

    const itemsWithSameCoupon = cartItems.filter((cartItem) => {
      const { itemCoupon: otherCoupon } = getCouponForItem(cartItem);
      return otherCoupon?.coupon_id === itemCoupon.coupon_id;
    });

    const totalQuantity = itemsWithSameCoupon.reduce(
      (sum, cartItem) => sum + cartItem.quantity,
      0,
    );

    return {
      isCombined: itemsWithSameCoupon.length > 1,
      totalItems: totalQuantity,
    };
  };

  // Calculate BOGO discounts across multiple items
  const calculateBogoDiscounts = (): Map<number, number> => {
    const bogoDiscounts = new Map<number, number>();

    if (!isEmailVerified) return bogoDiscounts;

    // Group items by their BOGO coupon
    const bogoCouponGroups = new Map<number, typeof cartItems>();

    cartItems.forEach((item) => {
      const { itemCoupon } = getCouponForItem(item);
      if (itemCoupon?.discount_type === "bogo") {
        const couponId = itemCoupon.coupon_id;
        if (!bogoCouponGroups.has(couponId)) {
          bogoCouponGroups.set(couponId, []);
        }
        bogoCouponGroups.get(couponId)!.push(item);
      }
    });

    // Calculate discount for each BOGO group
    bogoCouponGroups.forEach((items, couponId) => {
      const coupon = getCouponForItem(items[0]).itemCoupon;
      if (!coupon) return;

      const buyQty = coupon.bogo_buy_quantity || 1;
      const getQty = coupon.bogo_get_quantity || 1;
      const discountPercentage = coupon.bogo_discount_percentage || 100;
      const maxDiscountAmount = coupon.max_discount_amount || undefined;

      // Calculate total quantity across all items in this BOGO group
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

      // Calculate how many complete BOGO sets we have
      const completeSets = Math.floor(totalQuantity / (buyQty + getQty));
      const itemsToDiscount = completeSets * getQty;

      if (itemsToDiscount === 0) return;

      // Create array of individual items for sorting
      const individualItems: Array<{ variant_id: number; price: number }> = [];
      for (const item of items) {
        for (let i = 0; i < item.quantity; i++) {
          individualItems.push({
            variant_id: item.variant_id,
            price: item.price,
          });
        }
      }

      // Sort by price ascending (cheapest items get discounted)
      individualItems.sort((a, b) => a.price - b.price);

      // Apply discount to the cheapest items
      let totalDiscount = 0;
      for (let i = 0; i < itemsToDiscount; i++) {
        const item = individualItems[i];
        const itemDiscount = item.price * (discountPercentage / 100);

        const currentDiscount = bogoDiscounts.get(item.variant_id) || 0;
        bogoDiscounts.set(item.variant_id, currentDiscount + itemDiscount);

        totalDiscount += itemDiscount;
      }

      // Apply max discount cap if set
      if (maxDiscountAmount && totalDiscount > maxDiscountAmount) {
        const ratio = maxDiscountAmount / totalDiscount;
        for (const [variantId, discount] of bogoDiscounts.entries()) {
          bogoDiscounts.set(variantId, discount * ratio);
        }
      }
    });

    return bogoDiscounts;
  };

  // Calculate total discount amount from item-level coupons
  const calculateTotalDiscount = (): number => {
    const bogoDiscounts = calculateBogoDiscounts();

    return cartItems.reduce((totalDiscount, item) => {
      const { itemCoupon } = getCouponForItem(item);

      if (
        !itemCoupon ||
        !isEmailVerified ||
        !shouldShowDiscountedPrice(itemCoupon)
      ) {
        return totalDiscount;
      }

      // For BOGO, use pre-calculated discount
      if (itemCoupon.discount_type === "bogo") {
        const bogoDiscount = bogoDiscounts.get(item.variant_id) || 0;
        return totalDiscount + bogoDiscount;
      }

      // For non-BOGO coupons, calculate normally
      const discountInfo = calculateDiscount(
        item.price,
        itemCoupon,
        item.quantity,
      );

      return totalDiscount + discountInfo.discountAmount;
    }, 0);
  };

  // Calculate subtotal with item-level discounts applied
  const calculateSubtotalWithDiscounts = (): number => {
    const bogoDiscounts = calculateBogoDiscounts();

    return cartItems.reduce((total, item) => {
      const { itemCoupon } = getCouponForItem(item);

      // If no coupon or email not verified, use original price
      if (!itemCoupon || !isEmailVerified) {
        return total + item.price * item.quantity;
      }

      // For BOGO, use pre-calculated discount
      if (itemCoupon.discount_type === "bogo") {
        const bogoDiscount = bogoDiscounts.get(item.variant_id) || 0;
        const itemTotal = item.price * item.quantity - bogoDiscount;
        return total + itemTotal;
      }

      // For non-BOGO coupons, calculate normally
      const discountInfo = calculateDiscount(
        item.price,
        itemCoupon,
        item.quantity,
      );

      // Use totalPrice if available, otherwise calculate
      const itemTotal =
        discountInfo.totalPrice !== undefined
          ? discountInfo.totalPrice
          : discountInfo.discountedPrice * item.quantity;

      return total + itemTotal;
    }, 0);
  };

  // Calculate values
  const originalSubtotal = calculateOriginalSubtotal();
  const bogoDiscounts = calculateBogoDiscounts(); // Calculate once at top level
  const totalDiscount = calculateTotalDiscount();
  const subtotalWithDiscounts = calculateSubtotalWithDiscounts();

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  // Handle opening coupon modal
  const handleOpenCouponModal = (item: (typeof cartItems)[0]) => {
    setSelectedCartItem(item);
    setIsCouponModalOpen(true);
  };

  // Handle coupon selection
  const handleCouponSelect = (coupon: ProductCoupon | null) => {
    if (selectedCartItem) {
      updateCartCoupon(
        selectedCartItem.variant_id,
        coupon ? coupon.coupon_id : null,
      );
    }
    setIsCouponModalOpen(false);
    setSelectedCartItem(null);
  };

  // Handle quantity decrease
  const handleDecreaseQuantity = (
    variantId: number,
    currentQuantity: number,
  ) => {
    if (currentQuantity === 1) {
      setItemToRemove(variantId);
      setShowRemovalWarning(true);
    } else {
      updateQuantity(variantId, currentQuantity - 1);
    }
  };

  // Handle removal confirmation
  const handleConfirmRemoval = () => {
    if (itemToRemove !== null) {
      removeFromCart(itemToRemove);
      setShowRemovalWarning(false);
      setItemToRemove(null);
    }
  };

  // Handle removal cancellation
  const handleCancelRemoval = () => {
    setShowRemovalWarning(false);
    setItemToRemove(null);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <div className="empty-cart">
            <FaTag className="empty-cart-icon" />
            <h2 className="empty-cart-title">Your cart is empty</h2>
            <p className="empty-cart-text">
              Add some items to your cart to get started!
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
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-header">
          <h1 className="cart-title">Shopping Cart</h1>
          <button className="btn-clear-cart" onClick={clearCart}>
            Clear Cart
          </button>
        </div>

        <div className="cart-content-wrapper">
          <div className="cart-items-section">
            {!isEmailVerified && (
              <div className="cart-verification-banner">
                <FaLock className="banner-icon" />
                <div className="banner-content">
                  <h4 className="banner-title">Email Verification Required</h4>
                  <p className="banner-message">
                    Please verify your email address to see discounted prices
                    and apply coupons.
                  </p>
                </div>
              </div>
            )}

            {cartItems
              .filter((item) => item.quantity > 0)
              .map((item) => {
                const { itemCoupon, isExpired, fallbackToBest } =
                  getCouponForItem(item);

                const isBogo = itemCoupon?.discount_type === "bogo";
                let discountInfo = null;
                let hasDiscount = false;

                if (itemCoupon && isEmailVerified) {
                  if (isBogo) {
                    // For BOGO, use pre-calculated discount
                    const bogoDiscount =
                      bogoDiscounts.get(item.variant_id) || 0;
                    const itemTotal = item.price * item.quantity - bogoDiscount;
                    const discountedPricePerUnit = itemTotal / item.quantity;

                    discountInfo = {
                      discountedPrice: discountedPricePerUnit,
                      discountAmount: bogoDiscount,
                      totalPrice: itemTotal,
                      qualifiesForBogo: bogoDiscount > 0,
                    };
                    hasDiscount =
                      bogoDiscount > 0 && shouldShowDiscountedPrice(itemCoupon);
                  } else {
                    // For non-BOGO, calculate normally
                    discountInfo = calculateDiscount(
                      item.price,
                      itemCoupon,
                      item.quantity,
                    );
                    hasDiscount = shouldShowDiscountedPrice(itemCoupon);
                  }
                }

                return (
                  <div key={item.variant_id} className="cart-item-card">
                    <div className="cart-item-image-wrapper">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="cart-item-image"
                        onClick={() =>
                          navigate(`/items/${item.variant_id}`, {
                            state: { from: "/cart" },
                          })
                        }
                      />
                    </div>

                    <div className="cart-item-details">
                      <h5
                        className="cart-item-name"
                        onClick={() =>
                          navigate(`/items/${item.variant_id}`, {
                            state: { from: "/cart" },
                          })
                        }
                      >
                        {item.name}
                      </h5>
                      <div className="cart-item-meta">
                        <span className="cart-item-category">
                          {item.category}
                        </span>
                        {item.color && <span>Color: {item.color}</span>}
                        {item.color && item.size && <span> | </span>}
                        {item.size && <span>Size: {item.size}</span>}
                      </div>

                      {/* Price Display */}
                      <div className="cart-item-price-container">
                        {hasDiscount && discountInfo ? (
                          <>
                            <p className="cart-item-price-original">
                              ${item.price.toFixed(2)}
                            </p>
                            <p className="cart-item-price-discounted">
                              ${discountInfo.discountedPrice.toFixed(2)}
                            </p>
                          </>
                        ) : (
                          <p className="cart-item-price">
                            ${item.price.toFixed(2)}
                          </p>
                        )}
                      </div>

                      {isEmailVerified && (
                        <div className="cart-item-coupon-section">
                          {isExpired && (
                            <div className="coupon-expired-warning">
                              <FaExclamationTriangle />
                              <span>Selected coupon expired</span>
                            </div>
                          )}

                          {fallbackToBest && !isExpired && (
                            <div className="coupon-fallback-info">
                              <span>
                                Selected coupon no longer available. Best coupon
                                applied.
                              </span>
                            </div>
                          )}

                          {itemCoupon && (
                            <div className="cart-coupon-display">
                              <div className="coupon-code-badge">
                                <FaTag />
                                <span>{itemCoupon.coupon_code}</span>
                              </div>

                              {itemCoupon.discount_type !== "bogo" &&
                                itemCoupon.discount_type !==
                                  "free_shipping_only" && (
                                  <div className="cart-coupon-savings">
                                    {itemCoupon.discount_type ===
                                      "percentage" && (
                                      <span className="savings-badge">
                                        {itemCoupon.discount_value}% OFF
                                      </span>
                                    )}
                                    {itemCoupon.discount_type === "fixed" && (
                                      <span className="savings-badge">
                                        ${itemCoupon.discount_value} OFF
                                      </span>
                                    )}
                                    {itemCoupon.free_shipping && (
                                      <span className="savings-badge shipping">
                                        Free Shipping
                                      </span>
                                    )}
                                  </div>
                                )}

                              {itemCoupon.discount_type === "bogo" && (
                                <div className="cart-coupon-savings">
                                  <span className="savings-badge bogo">
                                    {itemCoupon.bogo_discount_percentage === 100
                                      ? `Buy ${itemCoupon.bogo_buy_quantity || 1} Get ${itemCoupon.bogo_get_quantity || 1} FREE`
                                      : `Buy ${itemCoupon.bogo_buy_quantity || 1} Get ${itemCoupon.bogo_get_quantity || 1} ${itemCoupon.bogo_discount_percentage}% OFF`}
                                  </span>
                                  {itemCoupon.free_shipping && (
                                    <span className="savings-badge shipping">
                                      + Free Shipping
                                    </span>
                                  )}
                                  {(() => {
                                    const bogoInfo =
                                      getBogoCombinationInfo(item);
                                    if (bogoInfo.isCombined) {
                                      return (
                                        <span className="bogo-combination-note">
                                          Combined with other items (
                                          {bogoInfo.totalItems} total)
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Change Coupon Button */}
                          <button
                            className="btn-change-coupon"
                            onClick={() => handleOpenCouponModal(item)}
                          >
                            {itemCoupon ? "Change Coupon" : "Add Coupon"}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="cart-item-quantity">
                      <div className="quantity-control">
                        <button
                          className="quantity-btn quantity-decrease"
                          onClick={() =>
                            handleDecreaseQuantity(
                              item.variant_id,
                              item.quantity,
                            )
                          }
                        >
                          <FaMinus />
                        </button>
                        <input
                          type="number"
                          className="quantity-input"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(
                              item.variant_id,
                              parseInt(e.target.value) || 1,
                            )
                          }
                          min="1"
                        />
                        <button
                          className="quantity-btn quantity-increase"
                          onClick={() =>
                            updateQuantity(item.variant_id, item.quantity + 1)
                          }
                        >
                          <FaPlus />
                        </button>
                      </div>
                    </div>

                    <div className="cart-item-total">
                      {hasDiscount && discountInfo ? (
                        <div className="item-total-with-discount">
                          <p className="item-total-price-original">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          <p className="item-total-price">
                            $
                            {(
                              discountInfo.totalPrice ||
                              discountInfo.discountedPrice * item.quantity
                            ).toFixed(2)}
                          </p>
                        </div>
                      ) : (
                        <p className="item-total-price">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      )}
                    </div>

                    <div className="cart-item-actions">
                      <button
                        className="btn-remove-item"
                        onClick={() => removeFromCart(item.variant_id)}
                        title="Remove from cart"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="cart-summary-section">
            <div className="cart-summary-card">
              <h4 className="cart-summary-title">Order Summary</h4>

              <div className="summary-row">
                <span className="summary-label">Subtotal:</span>
                <span className="summary-value">
                  ${originalSubtotal.toFixed(2)}
                </span>
              </div>

              {totalDiscount > 0 && (
                <div className="summary-row summary-discount">
                  <span className="summary-label">Discount:</span>
                  <span className="summary-value summary-value-discount">
                    -${totalDiscount.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="summary-row">
                <span className="summary-label">Shipping:</span>
                <span className="summary-value summary-value-muted">
                  Calculated at checkout
                </span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-row summary-total">
                <strong className="summary-label">Total:</strong>
                <strong className="summary-value summary-value-total">
                  ${subtotalWithDiscounts.toFixed(2)}
                </strong>
              </div>

              <p className="summary-note">Plus tax and shipping</p>

              <button
                className="btn-checkout"
                onClick={() => navigate("/checkout")}
              >
                Proceed to Checkout
              </button>

              <button
                className="btn-continue-shopping"
                onClick={() => navigate("/items")}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Coupon Modal */}
      {selectedCartItem && (
        <CouponModal
          isOpen={isCouponModalOpen}
          onClose={() => {
            setIsCouponModalOpen(false);
            setSelectedCartItem(null);
          }}
          variantId={selectedCartItem.variant_id}
          productId={selectedCartItem.product_id || 0}
          categoryId={selectedCartItem.category_id || 0}
          productTypeId={selectedCartItem.product_type_id}
          productPrice={selectedCartItem.price}
          productName={selectedCartItem.name}
          isEmailVerified={isEmailVerified}
          selectedCoupon={
            getCouponForItem(selectedCartItem).itemCoupon || undefined
          }
          onCouponSelect={handleCouponSelect}
        />
      )}

      {/* Removal Warning Modal */}
      {showRemovalWarning && (
        <div className="modal-overlay" onClick={handleCancelRemoval}>
          <div
            className="removal-warning-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="warning-icon">
              <FaExclamationTriangle size={48} />
            </div>
            <h3 className="warning-title">Remove Item from Cart?</h3>
            <p className="warning-message">
              This item will be removed from your cart. Are you sure you want to
              continue?
            </p>
            <div className="warning-actions">
              <button className="btn-cancel" onClick={handleCancelRemoval}>
                Cancel
              </button>
              <button
                className="btn-confirm-remove"
                onClick={handleConfirmRemoval}
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
