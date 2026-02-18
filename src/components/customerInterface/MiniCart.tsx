import { useState, useEffect } from "react";
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

  const [coupons, setCoupons] = useState<GroupedCoupons | null>(null);

  const isEmailVerified = user?.isEmailVerified ?? false;

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

    // Find the coupon in all categories
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

    // Only return if it's an item-level coupon
    if (coupon && isItemLevelCoupon(coupon)) {
      return coupon;
    }

    return null;
  };

  // Calculate BOGO discounts across multiple items
  const calculateBogoDiscounts = (): Map<number, number> => {
    const bogoDiscounts = new Map<number, number>();

    if (!isEmailVerified) return bogoDiscounts;

    // Group items by their BOGO coupon
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

    // Calculate discount for each BOGO group
    bogoCouponGroups.forEach((items, couponId) => {
      const coupon = getCouponForItem(items[0]);
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

  // Calculate subtotal with item-level discounts applied
  const calculateSubtotalWithDiscounts = (): number => {
    const bogoDiscounts = calculateBogoDiscounts();

    return cartItems.reduce((total, item) => {
      const itemCoupon = getCouponForItem(item);

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

      // For non-BOGO coupons, check if should show discount
      if (!shouldShowDiscountedPrice(itemCoupon)) {
        return total + item.price * item.quantity;
      }

      // Calculate discount for non-BOGO coupons
      const discountInfo = calculateDiscount(
        item.price,
        itemCoupon,
        item.quantity,
      );
      return total + (discountInfo.totalPrice ?? item.price * item.quantity);
    }, 0);
  };

  if (!isOpen) return null;

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
  };

  const subtotalWithDiscounts = calculateSubtotalWithDiscounts();
  const bogoDiscounts = calculateBogoDiscounts(); // Calculate once for item display

  return (
    <div className="mini-cart-overlay" onClick={onClose}>
      <div className="mini-cart-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mini-cart-header">
          <h4 className="mini-cart-header-title">
            <FaShoppingCart className="mini-cart-header-icon" />
            Shopping Cart
            {getCartCount() > 0 && (
              <span className="mini-cart-count">{getCartCount()}</span>
            )}
          </h4>
          <button className="mini-cart-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Success Message */}
        {justAddedItem && (
          <div className="mini-cart-success">
            <FaCheckCircle className="mini-cart-success-icon" />
            <span className="mini-cart-success-text">
              {isNewItem
                ? "Item added to your cart!"
                : "Item already in your cart!"}
            </span>
          </div>
        )}

        {/* Cart Items */}
        <div className="mini-cart-body">
          {displayItems.length === 0 ? (
            <p className="mini-cart-empty">Your cart is empty</p>
          ) : (
            displayItems.map((item) => {
              const itemCoupon = getCouponForItem(item);
              const isBogo = itemCoupon?.discount_type === "bogo";

              let hasDiscount = false;
              let displayPrice = item.price * item.quantity;

              if (itemCoupon && isEmailVerified) {
                if (isBogo) {
                  // For BOGO, use pre-calculated discount
                  const bogoDiscount = bogoDiscounts.get(item.variant_id) || 0;
                  hasDiscount =
                    bogoDiscount > 0 && shouldShowDiscountedPrice(itemCoupon);
                  displayPrice = item.price * item.quantity - bogoDiscount;
                } else {
                  // For non-BOGO, calculate normally
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
                <div key={item.variant_id} className="mini-cart-item">
                  <button
                    className="mini-cart-item-remove"
                    onClick={(e) => handleRemoveItem(item.variant_id, e)}
                    title="Remove item"
                  >
                    <FaTimes />
                  </button>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="mini-cart-item-image"
                  />
                  <div className="mini-cart-item-details">
                    <h5 className="mini-cart-item-name">{item.name}</h5>
                    {(item.color || item.size) && (
                      <p className="mini-cart-item-meta">
                        {item.color && <span>{item.color}</span>}
                        {item.color && item.size && <span> | </span>}
                        {item.size && <span>{item.size}</span>}
                      </p>
                    )}
                    <p className="mini-cart-item-meta">Qty: {item.quantity}</p>

                    {/* Coupon Display */}
                    {itemCoupon && (
                      <div className="mini-cart-item-coupon">
                        <FaTag size={10} />
                        <span>{itemCoupon.coupon_code}</span>
                      </div>
                    )}

                    {/* Price with discount */}
                    {hasDiscount ? (
                      <div className="mini-cart-item-price-container">
                        <p className="mini-cart-item-price-original">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <p className="mini-cart-item-price">
                          ${displayPrice.toFixed(2)}
                        </p>
                      </div>
                    ) : (
                      <p className="mini-cart-item-price">
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
            <div className="mini-cart-subtotal">
              <span className="mini-cart-subtotal-label">Subtotal:</span>
              <span className="mini-cart-subtotal-amount">
                ${subtotalWithDiscounts.toFixed(2)}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="mini-cart-actions">
              <button
                className="mini-cart-btn mini-cart-btn-primary"
                onClick={handleCheckout}
              >
                <FaShoppingCart />
                Checkout
              </button>
              <button
                className="mini-cart-btn mini-cart-btn-secondary"
                onClick={handleViewCart}
              >
                View Cart
              </button>
              <button
                className="mini-cart-btn mini-cart-btn-outline"
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
