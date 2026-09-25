import { FaTag, FaShippingFast } from "react-icons/fa";
import type { CartItem } from "../../../context/CartContext";
import type { ProductCoupon } from "../../../api/couponCustomer";
import CartLevelCouponSelector from "./CartLevelCouponSelector";
import { getBOGOLabel } from "../../../utils/couponUtils";

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
  // Pre-fetched by CheckoutPage so CartLevelCouponSelector doesn't fetch independently
  userCouponUsage: Record<number, number>;
  isGuest: boolean;
}

const OrderSummary = ({
  cartItems,
  currentStep,
  coupons,
  selectedCartLevelCoupon,
  onCartLevelCouponSelect,
  subtotal,
  itemLevelDiscount,
  cartLevelDiscount,
  discountAmount,
  shippingCost,
  isFreeShipping,
  taxAmount,
  total,
  isEmailVerified,
  getCouponForItem,
  couponValidation,
  userCouponUsage,
  isGuest,
}: OrderSummaryProps) => {
  return (
    <div className="order-summary-checkout-order-summary">
      <h3 className="order-summary-title">Order Summary</h3>

      {/* Cart item list */}
      <div className="order-summary-items">
        {cartItems.map((item) => {
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
            <div key={item.variant_id} className="order-summary-item">
              <img
                src={item.image}
                alt={item.name}
                className="order-summary-item-image"
              />
              <div className="order-summary-item-details">
                <h4>{item.name}</h4>
                <p className="order-summary-item-variant">
                  {item.color} {item.color && item.size && "•"} {item.size}
                </p>
                <p className="order-summary-item-quantity">Qty: {item.quantity}</p>

                {/* Applied coupon badge */}
                {itemCoupon && (
                  <div className="order-summary-item-coupon-display">
                    <div className="order-summary-coupon-code-badge">
                      <FaTag size={10} />
                      <span>{itemCoupon.coupon_code}</span>
                    </div>
                    {itemCoupon.discount_type !== "bogo" && (
                      <div className="order-summary-coupon-savings">
                        {itemCoupon.discount_type === "percentage" && (
                          <span className="order-summary-savings-badge">
                            {itemCoupon.discount_value}% OFF
                          </span>
                        )}
                        {itemCoupon.discount_type === "fixed" && (
                          <span className="order-summary-savings-badge">
                            ${itemCoupon.discount_value} OFF
                          </span>
                        )}
                        {itemCoupon.free_shipping && (
                          <span className="order-summary-savings-badge order-summary-shipping">
                            Free Shipping
                          </span>
                        )}
                      </div>
                    )}
                    {itemCoupon.discount_type === "bogo" && (
                      <div className="order-summary-coupon-savings">
                        <span className="order-summary-savings-badge order-summary-bogo">
                          {getBOGOLabel(
                            itemCoupon.bogo_buy_quantity,
                            itemCoupon.bogo_get_quantity,
                            itemCoupon.bogo_discount_percentage,
                          )}
                        </span>
                        {itemCoupon.free_shipping && (
                          <span className="order-summary-savings-badge order-summary-shipping">
                            + Free Shipping
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Item price — shows original and discounted price when a discount applies */}
              <div className="order-summary-item-price">
                {itemDiscountAmount > 0 ? (
                  <>
                    <div className="order-summary-price-original-summary">
                      ${itemOriginalPrice.toFixed(2)}
                    </div>
                    <div className="order-summary-price-final-summary">
                      ${itemFinalPrice.toFixed(2)}
                    </div>
                  </>
                ) : (
                  <div className="order-summary-price-final-summary">
                    ${itemOriginalPrice.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals breakdown */}
      <div className="order-summary-totals">
        <div className="order-summary-row">
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="order-summary-row order-summary-discount">
            <span>Discount:</span>
            <span>-${discountAmount.toFixed(2)}</span>
          </div>
        )}

        {/* Shipping row */}
        <div className="order-summary-row">
          <span>Shipping:</span>
          <span>
            {isFreeShipping ? (
              <span className="order-summary-free-shipping-text">
                <FaShippingFast size={14} className="order-summary-free-shipping-icon" />
                FREE
              </span>
            ) : currentStep === "cart" ? (
              <span className="order-summary-value-muted">
                Calculated at checkout
              </span>
            ) : shippingCost > 0 ? (
              `$${shippingCost.toFixed(2)}`
            ) : (
              <span className="order-summary-value-muted">
                Calculated at checkout
              </span>
            )}
          </span>
        </div>

        {currentStep !== "cart" && (
          <div className="order-summary-row">
            <span>Tax:</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="order-summary-row order-summary-total">
          <strong>Total:</strong>
          <strong className="order-summary-value-total">
            ${total.toFixed(2)}
          </strong>
        </div>

        <div className="order-summary-divider"></div>

        {/* Cart-level coupon */}
        {coupons && (
          <>
            {currentStep === "cart" || currentStep === "shipping" ? (
              <CartLevelCouponSelector
                coupons={coupons.all}
                selectedCoupon={selectedCartLevelCoupon}
                onCouponSelect={onCartLevelCouponSelect}
                subtotalAfterItemDiscounts={subtotal - itemLevelDiscount}
                isEmailVerified={isEmailVerified}
                isGuest={isGuest}
                userCouponUsage={userCouponUsage}
              />
            ) : selectedCartLevelCoupon ? (
              <div className="cart-level-coupon-section">
                <div className="cart-level-coupon-header">
                  <h3 className="cart-level-coupon-title">
                    <FaTag /> Cart Discount
                  </h3>
                  <div className="selected-cart-coupon">
                    <div className="selected-coupon-details">
                      <span className="coupon-code">
                        {selectedCartLevelCoupon.coupon_code}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

export default OrderSummary;
