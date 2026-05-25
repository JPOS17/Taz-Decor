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

  const [justRemovedItem, setJustRemovedItem] = useState(false);
  const [showAddedMessage, setShowAddedMessage] = useState(false);
  const [coupons, setCoupons] = useState<GroupedCoupons | null>(null);

  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addedNotificationRef = useRef<HTMLDivElement | null>(null);
  const removedNotificationRef = useRef<HTMLDivElement | null>(null);

  const isEmailVerified = user?.isEmailVerified ?? false;

  // Show added message for 3 seconds when justAddedItem changes
  useEffect(() => {
    if (justAddedItem) {
      // Hide removed message if showing
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

  // Cleanup removed timer on unmount
  useEffect(() => {
    return () => {
      if (removedTimerRef.current) clearTimeout(removedTimerRef.current);
    };
  }, []);

  // Load coupons when mini cart opens or cart items change
  useEffect(() => {
    if (isOpen && cartItems.length > 0) {
      loadCoupons();
    }
  }, [isOpen, cartItems]);

  const loadCoupons = async () => {
    try {
      const couponsData = await fetchProductCouponsPreview();
      setCoupons(couponsData);
    } catch (error) {
      console.error("Error loading coupons:", error);
    }
  };

  // Get the coupon for a cart item
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

  // Calculate BOGO discounts across multiple items
  const calculateBogoDiscounts = (): Map<number, number> => {
    const bogoDiscounts = new Map<number, number>();

    if (!isEmailVerified) return bogoDiscounts;

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

      const individualItems: Array<{ variant_id: number; price: number }> = [];
      for (const item of items) {
        for (let i = 0; i < item.quantity; i++) {
          individualItems.push({
            variant_id: item.variant_id,
            price: item.price,
          });
        }
      }

      individualItems.sort((a, b) => a.price - b.price);

      let totalDiscount = 0;
      for (let i = 0; i < itemsToDiscount; i++) {
        const item = individualItems[i];
        const itemDiscount = item.price * (discountPercentage / 100);
        const currentDiscount = bogoDiscounts.get(item.variant_id) || 0;
        bogoDiscounts.set(item.variant_id, currentDiscount + itemDiscount);
        totalDiscount += itemDiscount;
      }

      if (maxDiscountAmount && totalDiscount > maxDiscountAmount) {
        const ratio = maxDiscountAmount / totalDiscount;
        for (const [variantId, discount] of bogoDiscounts.entries()) {
          bogoDiscounts.set(variantId, discount * ratio);
        }
      }
    });

    return bogoDiscounts;
  };

  // Calculate subtotal with item-level discounts applied
  const calculateSubtotalWithDiscounts = (): number => {
    const bogoDiscounts = calculateBogoDiscounts();

    return cartItems.reduce((total, item) => {
      const itemCoupon = getCouponForItem(item);

      if (!itemCoupon || !isEmailVerified) {
        return total + item.price * item.quantity;
      }

      if (itemCoupon.discount_type === "bogo") {
        const bogoDiscount = bogoDiscounts.get(item.variant_id) || 0;
        const itemTotal = item.price * item.quantity - bogoDiscount;
        return total + itemTotal;
      }

      if (!shouldShowDiscountedPrice(itemCoupon)) {
        return total + item.price * item.quantity;
      }

      const discountInfo = calculateDiscount(
        item.price,
        itemCoupon,
        item.quantity,
      );
      return total + (discountInfo.totalPrice ?? item.price * item.quantity);
    }, 0);
  };

  const handleViewCart = () => {
    onClose();
    navigate("/cart");
  };

  const handleCheckout = () => {
    onClose();
    navigate("/checkout");
  };

  const handleContinueShopping = () => {
    onClose();
    navigate(fromPath);
  };

  const displayItems: CartItem[] = [...cartItems].sort(
    (a, b) => b.addedAt - a.addedAt,
  );

  const handleRemoveItem = (variantId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromCart(variantId);

    // Hide added message if showing
    setShowAddedMessage(false);
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);

    // Show removed message for 3 seconds with slide-out animation
    setJustRemovedItem(true);
    if (removedTimerRef.current) clearTimeout(removedTimerRef.current);
    removedTimerRef.current = setTimeout(() => {
      if (removedNotificationRef.current) {
        removedNotificationRef.current.classList.add("mc-notification-hiding");
      }
      setTimeout(() => setJustRemovedItem(false), 300);
    }, 2700);
  };

  const subtotalWithDiscounts = calculateSubtotalWithDiscounts();
  const bogoDiscounts = calculateBogoDiscounts();

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

        {/* Notification Messages */}
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
            <span className="mc-notification-text">
              {isNewItem
                ? "Item added to your cart!"
                : "Item already in your cart!"}
            </span>
          </div>
        ) : null}

        {/* Cart Items */}
        <div className="mc-body">
          {displayItems.length === 0 ? (
            <p className="mc-empty">Your cart is empty</p>
          ) : (
            displayItems.map((item) => {
              const itemCoupon = getCouponForItem(item);
              const isBogo = itemCoupon?.discount_type === "bogo";

              let hasDiscount = false;
              let displayPrice = item.price * item.quantity;

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
                    {(item.color || item.size) && (
                      <p className="mc-item-meta">
                        {item.color && <span>{item.color}</span>}
                        {item.color && item.size && <span> | </span>}
                        {item.size && <span>{item.size}</span>}
                      </p>
                    )}
                    <p className="mc-item-meta">Qty: {item.quantity}</p>

                    {/* Coupon Display */}
                    {itemCoupon && (
                      <div className="mc-item-coupon">
                        <FaTag size={10} />
                        <span>{itemCoupon.coupon_code}</span>
                      </div>
                    )}

                    {/* Price with discount */}
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

        {/* Subtotal */}
        {displayItems.length > 0 && (
          <>
            <div className="mc-subtotal">
              <span className="mc-subtotal-label">Subtotal:</span>
              <span className="mc-subtotal-amount">
                ${subtotalWithDiscounts.toFixed(2)}
              </span>
            </div>

            {/* Action Buttons */}
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
