import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useCart } from "../../../context/CartContext";
import { useAuth } from "../../../context/AuthContext";
import { loadSession, saveSession } from "../../../utils/checkoutSession";
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
  fetchUserCouponUsage,
  type ProductCoupon,
  type GroupedCoupons,
  findBestCoupon,
  calculateDiscount,
  calculateCartLevelDiscount,
  shouldShowDiscountedPrice,
  checkCustomGroupCoupons,
  isItemLevelCoupon,
} from "../../../api/couponCustomer";

import CouponModal from "../../../components/customerInterface/items/CouponModal";
import CartLevelCouponSelector from "../../../components/customerInterface/checkout/CartLevelCouponSelector";

import ConfirmModal from "../../../components/universalComponents/ConfirmModal";
import LoadingSpinner from "../../../components/universalComponents/LoadingSpinner";

import "../../../styles/pages/customerInterface/Tokens.css";
import "../../../styles/pages/customerInterface/customer/Cart.css";

const Cart = () => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    updateCartCoupon,
    clearCart,
    getCartTotal,
    cartLevelCouponId,
    setCartLevelCouponId,
  } = useCart();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const session = loadSession();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Coupon data
  const [coupons, setCoupons] = useState<GroupedCoupons | null>(null);
  const [customGroupMap, setCustomGroupMap] = useState<
    Record<number, number[]>
  >({});

  // Cart-level coupon resolved from cartLevelCouponId stored in context
  const [selectedCartLevelCoupon, setSelectedCartLevelCoupon] =
    useState<ProductCoupon | null>(session.cartLevelCoupon ?? null);

  // Per-coupon usage counts for the current user — fetched once and passed
  // down to CartLevelCouponSelector so it doesn't fetch independently
  const [userCouponUsage, setUserCouponUsage] = useState<
    Record<number, number>
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

  // Fetch coupons once when auth resolves
  // Custom group membership is re-checked separately when variant IDs change
  useEffect(() => {
    if (isLoading) return;
    if (cartItems.length === 0) return;

    const loadCoupons = async () => {
      try {
        const [couponsData, usageData] = await Promise.all([
          fetchProductCouponsPreview(),
          user ? fetchUserCouponUsage() : Promise.resolve({}),
        ]);
        setCoupons(couponsData);
        setUserCouponUsage(usageData);

        if (couponsData.custom_group.length > 0) {
          const variantIds = cartItems.map((item) => item.variant_id);
          const mapping = await checkCustomGroupCoupons(variantIds);
          setCustomGroupMap(mapping);
        }
      } catch (error) {
        console.error("Error loading coupons:", error);
      }
    };

    loadCoupons();
  }, [isLoading]);

  // Once coupons load, restore or clear the selected cart-level coupon
  useEffect(() => {
    if (!coupons) return;

    if (cartLevelCouponId) {
      const found =
        coupons.all.find((c) => c.coupon_id === cartLevelCouponId) ?? null;
      setSelectedCartLevelCoupon(found);
    } else if (!session.cartLevelCoupon) {
      setSelectedCartLevelCoupon(null);
    }
  }, [coupons, cartLevelCouponId]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // ============================================================================
  // CART-LEVEL COUPON HANDLER
  // ============================================================================

  // Updates local display state and shared context when user selects or removes a cart-level coupon
  const handleCartLevelCouponSelect = (coupon: ProductCoupon | null) => {
    setSelectedCartLevelCoupon(coupon);
    setCartLevelCouponId(coupon ? coupon.coupon_id : null);
    saveSession({
      cartLevelCoupon: coupon,
      cartLevelCouponId: coupon?.coupon_id ?? null,
    });
  };

  // ============================================================================
  // COUPON LOGIC
  // ============================================================================

  // Returns all item-level coupons applicable to a given cart item
  const getApplicableCouponsForItem = (
    item: (typeof cartItems)[0],
  ): ProductCoupon[] => {
    if (!coupons) return [];

    const applicableCoupons: ProductCoupon[] = [];

    // Add 'all' coupons — item-level only
    const allCoupons = coupons.all.filter((c) => isItemLevelCoupon(c));
    applicableCoupons.push(...allCoupons);

    // Add category coupons — item-level only
    if (item.category_id) {
      const categoryCoupons = coupons.category.filter(
        (c) => c.applies_to_id === item.category_id && isItemLevelCoupon(c),
      );
      applicableCoupons.push(...categoryCoupons);
    }

    // Add product_type coupons — item-level only
    if (item.product_type_id) {
      const productTypeCoupons = coupons.product_type.filter(
        (c) => c.applies_to_id === item.product_type_id && isItemLevelCoupon(c),
      );
      applicableCoupons.push(...productTypeCoupons);
    }

    // Add product coupons — item-level only
    if (item.product_id) {
      const productCoupons = coupons.product.filter(
        (c) => c.applies_to_id === item.product_id && isItemLevelCoupon(c),
      );
      applicableCoupons.push(...productCoupons);
    }

    // Add variant coupons — item-level only
    const variantCoupons = coupons.variant.filter(
      (c) => c.applies_to_id === item.variant_id && isItemLevelCoupon(c),
    );
    applicableCoupons.push(...variantCoupons);

    // Add custom_group coupons — item-level only
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

  // Resolves the active coupon for a cart item, handling expiry and fallback to best available
  const getCouponForItem = (
    item: (typeof cartItems)[0],
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
        // Selected coupon no longer applicable — fall back to best available
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

    return { itemCoupon: null, isExpired: false, fallbackToBest: false };
  };

  // ============================================================================
  // PRICE CALCULATIONS
  // ============================================================================

  // Calculates original subtotal before any discounts
  const calculateOriginalSubtotal = (): number => {
    return cartItems.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
  };

  // Returns BOGO combination info if multiple items share the same BOGO coupon
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

  // Calculates BOGO discounts across all cart items, distributing savings to the cheapest units
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

      // Determine how many items qualify for a discount
      const completeSets = Math.floor(totalQuantity / (buyQty + getQty));
      const itemsToDiscount = completeSets * getQty;

      if (itemsToDiscount === 0) return;

      // Flatten items into individual units for price-based sorting
      const individualItems: Array<{ variant_id: number; price: number }> = [];
      for (const item of items) {
        for (let i = 0; i < item.quantity; i++) {
          individualItems.push({
            variant_id: item.variant_id,
            price: item.price,
          });
        }
      }

      // Sort ascending so cheapest items get the discount
      individualItems.sort((a, b) => a.price - b.price);

      // Apply discount to the cheapest qualifying items
      let totalDiscount = 0;
      for (let i = 0; i < itemsToDiscount; i++) {
        const item = individualItems[i];
        const itemDiscount = item.price * (discountPercentage / 100);
        const currentDiscount = bogoDiscounts.get(item.variant_id) || 0;
        bogoDiscounts.set(item.variant_id, currentDiscount + itemDiscount);
        totalDiscount += itemDiscount;
      }

      // Cap total discount if a max discount amount is set
      if (maxDiscountAmount && totalDiscount > maxDiscountAmount) {
        const ratio = maxDiscountAmount / totalDiscount;
        for (const [variantId, discount] of bogoDiscounts.entries()) {
          bogoDiscounts.set(variantId, discount * ratio);
        }
      }
    });

    return bogoDiscounts;
  };

  // Calculates the total discount amount from all item-level coupons
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

      // Use pre-calculated BOGO discount
      if (itemCoupon.discount_type === "bogo") {
        const bogoDiscount = bogoDiscounts.get(item.variant_id) || 0;
        return totalDiscount + bogoDiscount;
      }

      // Calculate discount for non-BOGO coupons
      const discountInfo = calculateDiscount(
        item.price,
        itemCoupon,
        item.quantity,
      );

      return totalDiscount + discountInfo.discountAmount;
    }, 0);
  };

  // Calculates the subtotal with all item-level discounts applied
  const calculateSubtotalWithDiscounts = (): number => {
    const bogoDiscounts = calculateBogoDiscounts();

    return cartItems.reduce((total, item) => {
      const { itemCoupon } = getCouponForItem(item);

      // No coupon or unverified email — use original price
      if (!itemCoupon || !isEmailVerified) {
        return total + item.price * item.quantity;
      }

      // Use pre-calculated BOGO discount
      if (itemCoupon.discount_type === "bogo") {
        const bogoDiscount = bogoDiscounts.get(item.variant_id) || 0;
        const itemTotal = item.price * item.quantity - bogoDiscount;
        return total + itemTotal;
      }

      // Calculate discount for non-BOGO coupons
      const discountInfo = calculateDiscount(
        item.price,
        itemCoupon,
        item.quantity,
      );

      const itemTotal =
        discountInfo.totalPrice !== undefined
          ? discountInfo.totalPrice
          : discountInfo.discountedPrice * item.quantity;

      return total + itemTotal;
    }, 0);
  };

  // Derived price values used throughout the cart summary
  const originalSubtotal = calculateOriginalSubtotal();
  const bogoDiscounts = calculateBogoDiscounts();
  const totalDiscount = calculateTotalDiscount();
  const subtotalWithDiscounts = calculateSubtotalWithDiscounts();

  // Cart-level coupon preview — computed so the summary updates immediately
  // when the user selects or removes a coupon, matching validateCoupons output in CheckoutPage
  const cartLevelDiscountInfo = selectedCartLevelCoupon
    ? calculateCartLevelDiscount(selectedCartLevelCoupon, subtotalWithDiscounts)
    : null;

  const cartLevelDiscountAmount = cartLevelDiscountInfo?.discountAmount ?? 0;
  const cartLevelFreeShipping = cartLevelDiscountInfo?.isFreeShipping ?? false;
  const finalTotal = subtotalWithDiscounts - cartLevelDiscountAmount;

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  // Opens the coupon modal for the given cart item
  const handleOpenCouponModal = (item: (typeof cartItems)[0]) => {
    setSelectedCartItem(item);
    setIsCouponModalOpen(true);
  };

  // Applies the selected coupon to the cart item and closes the modal
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

  // Triggers a removal confirmation if quantity would drop to zero, otherwise decrements normally
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

  // Confirms item removal and clears the removal warning state
  const handleConfirmRemoval = () => {
    if (itemToRemove !== null) {
      removeFromCart(itemToRemove);
      setShowRemovalWarning(false);
      setItemToRemove(null);
    }
  };

  // Cancels item removal and dismisses the warning modal
  const handleCancelRemoval = () => {
    setShowRemovalWarning(false);
    setItemToRemove(null);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <div className={"cart-page cart-loading-state"}>
        <LoadingSpinner message="Loading your cart..." />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className={"cart-page"}>
        <div className={"cart-container"}>
          <div className={"cart-empty"}>
            <FaTag className={"cart-empty-icon"} />
            <h2 className={"cart-empty-title"}>Your cart is empty</h2>
            <p className={"cart-empty-text"}>
              Add some items to your cart to get started!
            </p>
            <button
              className={"cart-btn-browse"}
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
    <div className={"cart-page"}>
      <div className={"cart-container"}>
        <div className={"cart-header"}>
          <h1 className={"cart-title"}>Shopping Cart</h1>
          <button className={"cart-btn-clear"} onClick={clearCart}>
            Clear Cart
          </button>
        </div>

        <div className={"cart-layout"}>
          {/* LEFT COLUMN — all cart items */}
          <div className={"cart-items-section"}>
            {!isEmailVerified &&
              cartItems.some(
                (item) => getApplicableCouponsForItem(item).length > 0,
              ) && (
                <div
                  className={"cart-verification-banner"}
                  onClick={() => navigate("/login")}
                  style={{ cursor: "pointer" }}
                >
                  <FaLock className={"cart-banner-icon"} />
                  <div className={"cart-banner-content"}>
                    <h4 className={"cart-banner-title"}>
                      Email Verification Required for Discounts!
                    </h4>
                    <p className={"cart-banner-message"}>
                      Please create and verify your email address to see apply
                      coupons.
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
                    discountInfo = calculateDiscount(
                      item.price,
                      itemCoupon,
                      item.quantity,
                    );
                    hasDiscount = shouldShowDiscountedPrice(itemCoupon);
                  }
                }

                return (
                  <div key={item.variant_id} className={"cart-item-card"}>
                    <div className={"cart-item-image-wrapper"}>
                      <img
                        src={item.image}
                        alt={item.name}
                        className={"cart-item-image"}
                        onClick={() =>
                          navigate(`/items/${item.variant_id}`, {
                            state: { from: "/cart" },
                          })
                        }
                      />
                    </div>

                    <div className={"cart-item-details"}>
                      <h5
                        className={"cart-item-name"}
                        onClick={() =>
                          navigate(`/items/${item.variant_id}`, {
                            state: { from: "/cart" },
                          })
                        }
                      >
                        {item.name}
                      </h5>
                      <div className={"cart-item-meta"}>
                        {item.color && <span>Color: {item.color}</span>}
                        {item.color && item.size && <span> | </span>}
                        {item.size && <span>Size: {item.size}</span>}
                      </div>

                      {/* Price display — shows original and discounted when a coupon applies */}
                      <div className={"cart-item-price-container"}>
                        {hasDiscount && discountInfo ? (
                          <>
                            <p className={"cart-item-price-original"}>
                              ${item.price.toFixed(2)}
                            </p>
                            <p className={"cart-item-price-discounted"}>
                              ${discountInfo.discountedPrice.toFixed(2)}
                            </p>
                          </>
                        ) : (
                          <p className={"cart-item-price"}>
                            ${item.price.toFixed(2)}
                          </p>
                        )}
                      </div>

                      {(isEmailVerified ||
                        getApplicableCouponsForItem(item).length > 0) && (
                        <div className={"cart-coupon-section"}>
                          {isEmailVerified && (
                            <>
                              {isExpired && (
                                <div className={"cart-coupon-expired-warning"}>
                                  <FaExclamationTriangle />
                                  <span>Selected coupon expired</span>
                                </div>
                              )}

                              {fallbackToBest && !isExpired && (
                                <div className={"cart-coupon-fallback-info"}>
                                  <span>
                                    Selected coupon no longer available. Best
                                    coupon applied.
                                  </span>
                                </div>
                              )}

                              {itemCoupon && (
                                <div className={"cart-coupon-display"}>
                                  <div className={"cart-coupon-code-badge"}>
                                    <FaTag />
                                    <span>{itemCoupon.coupon_code}</span>
                                  </div>

                                  {itemCoupon.discount_type !== "bogo" &&
                                    itemCoupon.discount_type !==
                                      "free_shipping_only" && (
                                      <div className={"cart-coupon-savings"}>
                                        {itemCoupon.discount_type ===
                                          "percentage" && (
                                          <span
                                            className={"cart-savings-badge"}
                                          >
                                            {itemCoupon.discount_value}% OFF
                                          </span>
                                        )}
                                        {itemCoupon.discount_type ===
                                          "fixed" && (
                                          <span
                                            className={"cart-savings-badge"}
                                          >
                                            ${itemCoupon.discount_value} OFF
                                          </span>
                                        )}
                                        {itemCoupon.free_shipping && (
                                          <span
                                            className={
                                              "cart-savings-badge cart-savings-badge-shipping"
                                            }
                                          >
                                            Free Shipping
                                          </span>
                                        )}
                                      </div>
                                    )}

                                  {itemCoupon.discount_type === "bogo" && (
                                    <div className={"cart-coupon-savings"}>
                                      <span
                                        className={
                                          "cart-savings-badge cart-savings-badge-bogo"
                                        }
                                      >
                                        {itemCoupon.bogo_discount_percentage ===
                                        100
                                          ? `Buy ${itemCoupon.bogo_buy_quantity || 1} Get ${itemCoupon.bogo_get_quantity || 1} FREE`
                                          : `Buy ${itemCoupon.bogo_buy_quantity || 1} Get ${itemCoupon.bogo_get_quantity || 1} ${itemCoupon.bogo_discount_percentage}% OFF`}
                                      </span>
                                      {itemCoupon.free_shipping && (
                                        <span
                                          className={
                                            "cart-savings-badge cart-savings-badge-shipping"
                                          }
                                        >
                                          + Free Shipping
                                        </span>
                                      )}
                                      {(() => {
                                        const bogoInfo =
                                          getBogoCombinationInfo(item);
                                        if (bogoInfo.isCombined) {
                                          return (
                                            <span className="cart-bogo-combination-note">
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
                            </>
                          )}

                          {(isEmailVerified
                            ? itemCoupon ||
                              getApplicableCouponsForItem(item).length > 0
                            : getApplicableCouponsForItem(item).length > 0) && (
                            <button
                              className={"cart-btn-change-coupon"}
                              onClick={() => handleOpenCouponModal(item)}
                            >
                              {isEmailVerified && itemCoupon
                                ? "Change Coupon"
                                : "Add Coupon"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className={"cart-item-quantity"}>
                      <div className={"cart-quantity-control"}>
                        <button
                          className={"cart-quantity-btn cart-quantity-decrease"}
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
                          className={"cart-quantity-input"}
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
                          className={"cart-quantity-btn cart-quantity-increase"}
                          onClick={() =>
                            updateQuantity(item.variant_id, item.quantity + 1)
                          }
                        >
                          <FaPlus />
                        </button>
                      </div>
                    </div>

                    <div className={"cart-item-total"}>
                      {hasDiscount && discountInfo ? (
                        <div className={"cart-item-total-with-discount"}>
                          <p className={"cart-item-total-price-original"}>
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          <p className={"cart-item-total-price"}>
                            $
                            {(
                              discountInfo.totalPrice ||
                              discountInfo.discountedPrice * item.quantity
                            ).toFixed(2)}
                          </p>
                        </div>
                      ) : (
                        <p className={"cart-item-total-price"}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      )}
                    </div>

                    <div className={"cart-item-actions"}>
                      <button
                        className={"cart-btn-remove-item"}
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

          {/* RIGHT COLUMN — sticky order summary */}
          <div className={"cart-summary-section"}>
            <div className={"cart-summary-card"}>
              <h4 className={"cart-summary-title"}>Order Summary</h4>

              <div className={"cart-summary-row"}>
                <span className={"cart-summary-label"}>Subtotal</span>
                <span className={"cart-summary-value"}>
                  ${originalSubtotal.toFixed(2)}
                </span>
              </div>

              {totalDiscount > 0 && (
                <div className={"cart-summary-row"}>
                  <span className={"cart-summary-label"}>Item Discounts</span>
                  <span className={"cart-summary-value-discount"}>
                    -${totalDiscount.toFixed(2)}
                  </span>
                </div>
              )}

              {cartLevelDiscountAmount > 0 && (
                <div className={"cart-summary-row"}>
                  <span className={"cart-summary-label"}>Cart Discount</span>
                  <span className={"cart-summary-value-discount"}>
                    -${cartLevelDiscountAmount.toFixed(2)}
                  </span>
                </div>
              )}

              <div className={"cart-summary-row"}>
                <span className={"cart-summary-label"}>Shipping</span>
                <span
                  className={
                    cartLevelFreeShipping
                      ? "cart-summary-value-discount"
                      : "cart-summary-value-muted"
                  }
                >
                  {cartLevelFreeShipping ? (
                    <span className={"cart-free-shipping-badge"}>FREE</span>
                  ) : (
                    "Calculated at checkout"
                  )}
                </span>
              </div>

              <div className={"cart-summary-row cart-summary-total"}>
                <strong
                  className={"cart-summary-label cart-summary-total-label"}
                >
                  Total
                </strong>
                <strong
                  className={
                    "cart-summary-value cart-summary-total-value cart-summary-value-total"
                  }
                >
                  ${finalTotal.toFixed(2)}
                </strong>
              </div>

              <p className={"cart-summary-note"}>
                Plus applicable tax and shipping
              </p>

              {/* Cart-level coupon selector */}
              {coupons && (
                <CartLevelCouponSelector
                  coupons={coupons.all}
                  selectedCoupon={selectedCartLevelCoupon}
                  onCouponSelect={handleCartLevelCouponSelect}
                  subtotalAfterItemDiscounts={subtotalWithDiscounts}
                  isEmailVerified={isEmailVerified}
                  isGuest={!user}
                  userCouponUsage={userCouponUsage}
                />
              )}

              <button
                className={"cart-btn-checkout"}
                onClick={() => navigate("/checkout")}
              >
                Proceed to Checkout
              </button>

              <button
                className={"cart-btn-continue-shopping"}
                onClick={() => navigate("/items")}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Coupon modal */}
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

      {/* Removal warning modal */}
      <ConfirmModal
        isOpen={showRemovalWarning}
        title="Remove Item from Cart?"
        message="This item will be removed from your cart. Are you sure you want to continue?"
        confirmLabel="Yes, Remove"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmRemoval}
        onCancel={handleCancelRemoval}
      />
    </div>
  );
};

export default Cart;
