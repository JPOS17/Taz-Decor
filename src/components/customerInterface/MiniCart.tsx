import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useCart, type CartItem } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { FaTimes, FaCheckCircle, FaShoppingCart, FaTag } from "react-icons/fa";
import {
  fetchProductCouponsPreview,
  type ProductCoupon,
  type GroupedCoupons,
  calculateDiscount,
  isItemLevelCoupon,
  shouldShowDiscountedPrice,
} from "../../api/couponCustomer";
import "../../styles/components/customerInterface/MiniCart.css";

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
  justAddedItem?: {
    variantId: number;
    name: string;
    price: number;
    image: string;
    color?: string;
    size?: string;
  } | null;
  isNewItem: boolean;
  fromPath?: string;
}

const MiniCart = ({
  isOpen,
  onClose,
  justAddedItem,
  isNewItem,
  fromPath = "/items",
}: MiniCartProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, getCartCount, removeFromCart } = useCart();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Notification state
  const [justRemovedItem, setJustRemovedItem] = useState(false);
  const [showAddedMessage, setShowAddedMessage] = useState(false);

  // Coupon data
  const [coupons, setCoupons] = useState<GroupedCoupons | null>(null);

  // Ref to track whether coupons have been fetched for the current open session of the mini cart
  const hasFetchedRef = useRef(false);

  // Refs for notification auto-dismiss timers
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs for notification DOM elements — used to add the fade-out class before unmounting
  const addedNotificationRef = useRef<HTMLDivElement | null>(null);
  const removedNotificationRef = useRef<HTMLDivElement | null>(null);

  const isEmailVerified = user?.isEmailVerified ?? false;

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // When justAddedItem changes, show the "added" notification and set a timer to auto-dismiss
  useEffect(() => {
    if (justAddedItem) {
      setJustRemovedItem(false);
      if (removedTimerRef.current) clearTimeout(removedTimerRef.current);

      setShowAddedMessage(true);
      if (addedTimerRef.current) clearTimeout(addedTimerRef.current);

      addedTimerRef.current = setTimeout(() => {
        if (addedNotificationRef.current) {
          addedNotificationRef.current.classList.add("mc-notification-hiding");
        }
        setTimeout(() => setShowAddedMessage(false), 300);
      }, 2700);
    }

    return () => {
      if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    };
  }, [justAddedItem]);

  // Cleanup the removed-item timer on unmount to prevent state updates on an unmounted component
  useEffect(() => {
    return () => {
      if (removedTimerRef.current) clearTimeout(removedTimerRef.current);
    };
  }, []);

  // Fetches coupons once when the mini cart opens (if the cart is non-empty),
  // and resets the fetch flag when it closes so the next open gets fresh data
  useEffect(() => {
    if (!isOpen) {
      hasFetchedRef.current = false;
      return;
    }

    if (cartItems.length > 0 && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      loadCoupons();
    }
  }, [isOpen, cartItems.length]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  // Fetches all applicable coupon previews and stores them in state
  const loadCoupons = async () => {
    try {
      const couponsData = await fetchProductCouponsPreview();
      setCoupons(couponsData);
    } catch (error) {
      console.error("Error loading coupons:", error);
    }
  };

  // ============================================================================
  // COUPON HELPERS
  // ============================================================================

  // Returns the selected coupon for a cart item if it exists and is an item-level coupon
  const getCouponForItem = (item: CartItem): ProductCoupon | null => {
    if (!coupons || !item.selected_coupon_id) return null;

    const allCoupons = [
      ...coupons.all,
      ...coupons.category,
      ...coupons.product_type,
      ...coupons.product,
      ...coupons.variant,
      ...coupons.custom_group,
    ];

    const coupon = allCoupons.find(
      (c) => c.coupon_id === item.selected_coupon_id,
    );

    if (coupon && isItemLevelCoupon(coupon)) {
      return coupon;
    }

    return null;
  };

  // Calculates the BOGO discount amount for each variant_id across the cart
  const calculateBogoDiscounts = (): Map<number, number> => {
    const bogoDiscounts = new Map<number, number>();

    if (!isEmailVerified) return bogoDiscounts;

    // Group cart items by BOGO coupon ID so sets can be counted per coupon
    const bogoCouponGroups = new Map<number, CartItem[]>();

    cartItems.forEach((item) => {
      const itemCoupon = getCouponForItem(item);
      if (itemCoupon?.discount_type === "bogo") {
        const couponId = itemCoupon.coupon_id;
        if (!bogoCouponGroups.has(couponId)) {
          bogoCouponGroups.set(couponId, []);
        }
        bogoCouponGroups.get(couponId)!.push(item);
      }
    });

    bogoCouponGroups.forEach((items) => {
      const coupon = getCouponForItem(items[0]);
      if (!coupon) return;

      const buyQty = coupon.bogo_buy_quantity || 1;
      const getQty = coupon.bogo_get_quantity || 1;
      const discountPercentage = coupon.bogo_discount_percentage || 100;
      const maxDiscountAmount = coupon.max_discount_amount || undefined;

      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const completeSets = Math.floor(totalQuantity / (buyQty + getQty));
      const itemsToDiscount = completeSets * getQty;

      if (itemsToDiscount === 0) return;

      // Expand each cart item into individual units for cheapest-first sorting
      const individualItems: Array<{ variant_id: number; price: number }> = [];
      for (const item of items) {
        for (let i = 0; i < item.quantity; i++) {
          individualItems.push({
            variant_id: item.variant_id,
            price: item.price,
          });
        }
      }

      // Apply discounts to the cheapest units first (standard BOGO convention)
      individualItems.sort((a, b) => a.price - b.price);

      let totalDiscount = 0;
      for (let i = 0; i < itemsToDiscount; i++) {
        const item = individualItems[i];
        const itemDiscount = item.price * (discountPercentage / 100);
        const currentDiscount = bogoDiscounts.get(item.variant_id) || 0;
        bogoDiscounts.set(item.variant_id, currentDiscount + itemDiscount);
        totalDiscount += itemDiscount;
      }

      // Scale all discounts proportionally if the total exceeds max_discount_amount
      if (maxDiscountAmount && totalDiscount > maxDiscountAmount) {
        const ratio = maxDiscountAmount / totalDiscount;
        for (const [variantId, discount] of bogoDiscounts.entries()) {
          bogoDiscounts.set(variantId, discount * ratio);
        }
      }
    });

    return bogoDiscounts;
  };

  // Returns the subtotal after applying all item-level coupon discounts
  const calculateSubtotalWithDiscounts = (): number => {
    const bogoDiscounts = calculateBogoDiscounts();

    return cartItems.reduce((total, item) => {
      const itemCoupon = getCouponForItem(item);

      // No coupon or unverified email — full price
      if (!itemCoupon || !isEmailVerified) {
        return total + item.price * item.quantity;
      }

      // BOGO — use the pre-calculated per-variant discount
      if (itemCoupon.discount_type === "bogo") {
        const bogoDiscount = bogoDiscounts.get(item.variant_id) || 0;
        const itemTotal = item.price * item.quantity - bogoDiscount;
        return total + itemTotal;
      }

      // Non-BOGO coupons that don't alter the displayed price (e.g. free shipping)
      if (!shouldShowDiscountedPrice(itemCoupon)) {
        return total + item.price * item.quantity;
      }

      // Percentage or fixed discount
      const discountInfo = calculateDiscount(
        item.price,
        itemCoupon,
        item.quantity,
      );
      return total + (discountInfo.totalPrice ?? item.price * item.quantity);
    }, 0);
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  // Closes the mini cart and navigates to the full cart page
  const handleViewCart = () => {
    onClose();
    navigate("/cart");
  };

  // Closes the mini cart and navigates to checkout
  const handleCheckout = () => {
    onClose();
    navigate("/checkout");
  };

  // Closes the mini cart and returns the user to wherever they were browsing
  const handleContinueShopping = () => {
    onClose();
    navigate(fromPath);
  };

  // Removes the item from the cart, shows the "removed" notification
  const handleRemoveItem = (variantId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromCart(variantId);

    setShowAddedMessage(false);
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);

    setJustRemovedItem(true);
    if (removedTimerRef.current) clearTimeout(removedTimerRef.current);
    removedTimerRef.current = setTimeout(() => {
      if (removedNotificationRef.current) {
        removedNotificationRef.current.classList.add("mc-notification-hiding");
      }
      setTimeout(() => setJustRemovedItem(false), 300);
    }, 2700);
  };

  // ============================================================================
  // DERIVED VALUES
  // ============================================================================

  // Sort items newest-first so the most recently added item appears at the top
  const displayItems: CartItem[] = [...cartItems].sort(
    (a, b) => b.addedAt - a.addedAt,
  );

  const subtotalWithDiscounts = calculateSubtotalWithDiscounts();
  // Pre-calculated here to avoid re-computing it once per item in the render loop
  const bogoDiscounts = calculateBogoDiscounts();

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen) return null;

  return (
    <div className="mc-overlay" onClick={onClose}>
      <div className="mc-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mc-header">
          <h4 className="mc-header-title">
            <FaShoppingCart className="mc-header-icon" />
            Shopping Cart
            {getCartCount() > 0 && (
              <span className="mc-count">{getCartCount()}</span>
            )}
          </h4>
          <button className="mc-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Notification area */}
        {justRemovedItem ? (
          <div
            ref={removedNotificationRef}
            className="mc-notification mc-notification-removed"
          >
            <FaCheckCircle className="mc-notification-icon" />
            <span className="mc-notification-text">
              Item removed from your cart!
            </span>
          </div>
        ) : showAddedMessage && justAddedItem ? (
          <div
            ref={addedNotificationRef}
            className="mc-notification mc-notification-added"
          >
            <FaCheckCircle className="mc-notification-icon" />
            {/* Message differs based on whether this was a new add or a duplicate */}
            <span className="mc-notification-text">
              {isNewItem
                ? "Item added to your cart!"
                : "Item already in your cart!"}
            </span>
          </div>
        ) : null}

        {/* Cart Body */}
        <div className="mc-body">
          {displayItems.length === 0 ? (
            <p className="mc-empty">Your cart is empty</p>
          ) : (
            displayItems.map((item) => {
              const itemCoupon = getCouponForItem(item);
              const isBogo = itemCoupon?.discount_type === "bogo";

              let hasDiscount = false;
              let displayPrice = item.price * item.quantity;

              // Compute the discounted price to display — only when email is verified
              if (itemCoupon && isEmailVerified) {
                if (isBogo) {
                  const bogoDiscount = bogoDiscounts.get(item.variant_id) || 0;
                  hasDiscount =
                    bogoDiscount > 0 && shouldShowDiscountedPrice(itemCoupon);
                  displayPrice = item.price * item.quantity - bogoDiscount;
                } else {
                  hasDiscount = shouldShowDiscountedPrice(itemCoupon);
                  if (hasDiscount) {
                    const discountInfo = calculateDiscount(
                      item.price,
                      itemCoupon,
                      item.quantity,
                    );
                    displayPrice =
                      discountInfo.totalPrice ??
                      discountInfo.discountedPrice * item.quantity;
                  }
                }
              }

              return (
                <div key={item.variant_id} className="mc-item">
                  {/* Remove button */}
                  <button
                    className="mc-item-remove"
                    onClick={(e) => handleRemoveItem(item.variant_id, e)}
                    title="Remove item"
                  >
                    <FaTimes />
                  </button>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="mc-item-image"
                  />
                  <div className="mc-item-details">
                    <h5 className="mc-item-name">{item.name}</h5>
                    {/* Variant attributes */}
                    {(item.color || item.size) && (
                      <p className="mc-item-meta">
                        {item.color && <span>{item.color}</span>}
                        {item.color && item.size && <span> | </span>}
                        {item.size && <span>{item.size}</span>}
                      </p>
                    )}
                    <p className="mc-item-meta">Qty: {item.quantity}</p>

                    {/* Applied coupon badge for item-level */}
                    {itemCoupon && (
                      <div className="mc-item-coupon">
                        <FaTag size={10} />
                        <span>{itemCoupon.coupon_code}</span>
                      </div>
                    )}

                    {/* Price display */}
                    {hasDiscount ? (
                      <div className="mc-item-price-container">
                        <p className="mc-item-price-original">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <p className="mc-item-price">
                          ${displayPrice.toFixed(2)}
                        </p>
                      </div>
                    ) : (
                      <p className="mc-item-price">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer — subtotal and action buttons, only shown when cart is non-empty */}
        {displayItems.length > 0 && (
          <>
            <div className="mc-subtotal">
              <span className="mc-subtotal-label">Subtotal:</span>
              <span className="mc-subtotal-amount">
                ${subtotalWithDiscounts.toFixed(2)}
              </span>
            </div>

            {/* Action buttons — checkout, view cart, and continue shopping */}
            <div className="mc-actions">
              <button
                className="mc-btn mc-btn-primary"
                onClick={handleCheckout}
              >
                <FaShoppingCart />
                Checkout
              </button>
              <button
                className="mc-btn mc-btn-secondary"
                onClick={handleViewCart}
              >
                View Cart
              </button>
              <button
                className="mc-btn mc-btn-outline"
                onClick={handleContinueShopping}
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MiniCart;
