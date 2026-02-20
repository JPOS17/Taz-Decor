import { FaTag, FaShippingFast } from "react-icons/fa";
import type { CartItem } from "../../../context/CartContext";
import type { ProductCoupon } from "../../../api/couponCustomer";

interface OrderSummaryProps {
  cartItems: CartItem[];
  currentStep: string;
  coupons: any;
  selectedCartLevelCoupon: ProductCoupon | null;
  onCartLevelCouponSelect: (coupon: ProductCoupon | null) => void;
  subtotal: number;
  itemLevelDiscount: number;
  cartLevelDiscount: number;
  discountAmount: number;
  shippingCost: number;
  isFreeShipping: boolean;
  taxAmount: number;
  total: number;
  isEmailVerified: boolean;
  getCouponForItem: (item: CartItem) => ProductCoupon | null;
  couponValidation: any;
}

const OrderSummary = ({
  cartItems,
  currentStep,
  selectedCartLevelCoupon,
  subtotal,
  itemLevelDiscount,
  cartLevelDiscount,
  discountAmount,
  shippingCost,
  isFreeShipping,
  taxAmount,
  total,
  getCouponForItem,
  couponValidation,
}: OrderSummaryProps) => {
  // Helper function to get discount display text for a coupon
  const getDiscountDisplay = (coupon: ProductCoupon) => {
    if (coupon.discount_type === "percentage") {
      return `${coupon.discount_value}% OFF`;
    } else if (coupon.discount_type === "fixed") {
      return `$${coupon.discount_value} OFF`;
    } else if (coupon.discount_type === "bogo") {
      if (coupon.bogo_discount_percentage === 100) {
        return `Buy ${coupon.bogo_buy_quantity || 1} Get ${coupon.bogo_get_quantity || 1} FREE`;
      } else {
        return `Buy ${coupon.bogo_buy_quantity || 1} Get ${coupon.bogo_get_quantity || 1} ${coupon.bogo_discount_percentage}% OFF`;
      }
    }
    return "";
  };

  return (
    <div className="cp-checkout-order-summary">
      <h3 className="cp-summary-title">Order Summary</h3>

      <div className="cp-summary-items">
        {cartItems.map((item) => {
          // Find validated discount for SPECIFIC item
          const validatedDiscount = couponValidation?.validated_discounts?.find(
            (d: any) => d.variant_id === item.variant_id,
          );
          const itemCoupon = getCouponForItem(item);
          const itemOriginalPrice = item.price * item.quantity;
          const itemDiscountAmount = validatedDiscount?.discount_amount || 0;
          const itemFinalPrice =
            validatedDiscount?.final_price !== undefined
              ? validatedDiscount.final_price
              : itemOriginalPrice;

          return (
            <div key={item.variant_id} className="cp-summary-item">
              <img
                src={item.image}
                alt={item.name}
                className="cp-summary-item-image"
              />
              <div className="cp-summary-item-details">
                <h4>{item.name}</h4>
                <p className="cp-summary-item-variant">
                  {item.color} {item.color && item.size && "•"} {item.size}
                </p>
                <p className="cp-summary-item-quantity">Qty: {item.quantity}</p>
                {itemCoupon && (
                  <div className="cp-summary-item-coupon-display">
                    <div className="cp-summary-coupon-code-badge">
                      <FaTag size={10} />
                      <span>{itemCoupon.coupon_code}</span>
                    </div>
                    {itemCoupon.discount_type !== "bogo" && (
                      <div className="cp-summary-coupon-savings">
                        {itemCoupon.discount_type === "percentage" && (
                          <span className="cp-savings-badge">
                            {itemCoupon.discount_value}% OFF
                          </span>
                        )}
                        {itemCoupon.discount_type === "fixed" && (
                          <span className="cp-savings-badge">
                            ${itemCoupon.discount_value} OFF
                          </span>
                        )}
                        {itemCoupon.free_shipping && (
                          <span className="cp-savings-badge shipping">
                            Free Shipping
                          </span>
                        )}
                      </div>
                    )}
                    {itemCoupon.discount_type === "bogo" && (
                      <div className="cp-summary-coupon-savings">
                        <span className="cp-savings-badge bogo">
                          {itemCoupon.bogo_discount_percentage === 100
                            ? `Buy ${itemCoupon.bogo_buy_quantity || 1} Get ${itemCoupon.bogo_get_quantity || 1} FREE`
                            : `Buy ${itemCoupon.bogo_buy_quantity || 1} Get ${itemCoupon.bogo_get_quantity || 1} ${itemCoupon.bogo_discount_percentage}% OFF`}
                        </span>
                        {itemCoupon.free_shipping && (
                          <span className="cp-savings-badge shipping">
                            + Free Shipping
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="cp-summary-item-price">
                {/* Show only final price - discounts shown in Review Cart */}
                {itemDiscountAmount > 0 ? (
                  <>
                    <div className="cp-price-original-summary">
                      ${itemOriginalPrice.toFixed(2)}
                    </div>
                    <div className="cp-price-final-summary">
                      ${itemFinalPrice.toFixed(2)}
                    </div>
                  </>
                ) : (
                  <div className="cp-price-final-summary">
                    ${itemOriginalPrice.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="cp-summary-totals">
        <div className="cp-summary-row">
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="cp-summary-row discount">
            <span>Discount:</span>
            <span>-${discountAmount.toFixed(2)}</span>
          </div>
        )}

        {/* Shipping row with free shipping icon */}
        <div className="cp-summary-row">
          <span>Shipping:</span>
          <span>
            {currentStep === "cart" ? (
              <span className="cp-summary-value-muted">
                Calculated at checkout
              </span>
            ) : isFreeShipping ? (
              <span className="cp-free-shipping-text">
                <FaShippingFast size={14} style={{ marginRight: "4px" }} />
                FREE
              </span>
            ) : shippingCost > 0 ? (
              `$${shippingCost.toFixed(2)}`
            ) : (
              <span className="cp-summary-value-muted">
                Calculated at checkout
              </span>
            )}
          </span>
        </div>

        {/* Only show tax row after cart step */}
        {currentStep !== "cart" && (
          <div className="cp-summary-row">
            <span>Tax:</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="cp-summary-divider"></div>

        <div className="cp-summary-row summary-total">
          <strong>Total:</strong>
          <strong className="cp-summary-value-total">
            ${total.toFixed(2)}
          </strong>
        </div>

        {/* Free Shipping Notice Badge */}
        {isFreeShipping && selectedCartLevelCoupon && (
          <div className="cp-free-shipping-notice">
            <FaShippingFast size={16} />
            <span>
              Free shipping applied with{" "}
              <strong>{selectedCartLevelCoupon.coupon_code}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderSummary;
