import { FaTag, FaShippingFast } from "react-icons/fa";
import type { CartItem } from "../../../context/CartContext";
import type { ProductCoupon } from "../../../api/couponCustomer";
import CartLevelCouponSelector from "../checkout/CartLevelCouponSelector";
import { getBOGOLabel } from "../../../utils/couponUtils";

import "../../../styles/components/customerInterface/checkout/OrderSummary.css";

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
    <div className="os-checkout-order-summary">
      <h3 className="os-summary-title">Order Summary</h3>

      {/* Cart item list */}
      <div className="os-summary-items">
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
            <div key={item.variant_id} className="os-summary-item">
              <img
                src={item.image}
                alt={item.name}
                className="os-summary-item-image"
              />
              <div className="os-summary-item-details">
                <h4>{item.name}</h4>
                <p className="os-summary-item-variant">
                  {item.color} {item.color && item.size && "•"} {item.size}
                </p>
                <p className="os-summary-item-quantity">Qty: {item.quantity}</p>

                {/* Applied coupon badge — shown per item when a coupon is active */}
                {itemCoupon && (
                  <div className="os-summary-item-coupon-display">
                    <div className="os-summary-coupon-code-badge">
                      <FaTag size={10} />
                      <span>{itemCoupon.coupon_code}</span>
                    </div>
                    {itemCoupon.discount_type !== "bogo" && (
                      <div className="os-summary-coupon-savings">
                        {itemCoupon.discount_type === "percentage" && (
                          <span className="os-savings-badge">
                            {itemCoupon.discount_value}% OFF
                          </span>
                        )}
                        {itemCoupon.discount_type === "fixed" && (
                          <span className="os-savings-badge">
                            ${itemCoupon.discount_value} OFF
                          </span>
                        )}
                        {itemCoupon.free_shipping && (
                          <span className="os-savings-badge os-shipping">
                            Free Shipping
                          </span>
                        )}
                      </div>
                    )}
                    {itemCoupon.discount_type === "bogo" && (
                      <div className="os-summary-coupon-savings">
                        <span className="os-savings-badge os-bogo">
                          {getBOGOLabel(
                            itemCoupon.bogo_buy_quantity,
                            itemCoupon.bogo_get_quantity,
                            itemCoupon.bogo_discount_percentage,
                          )}
                        </span>
                        {itemCoupon.free_shipping && (
                          <span className="os-savings-badge os-shipping">
                            + Free Shipping
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Item price — shows original and discounted price when a discount applies */}
              <div className="os-summary-item-price">
                {itemDiscountAmount > 0 ? (
                  <>
                    <div className="os-price-original-summary">
                      ${itemOriginalPrice.toFixed(2)}
                    </div>
                    <div className="os-price-final-summary">
                      ${itemFinalPrice.toFixed(2)}
                    </div>
                  </>
                ) : (
                  <div className="os-price-final-summary">
                    ${itemOriginalPrice.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals breakdown */}
      <div className="os-summary-totals">
        <div className="os-summary-row">
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="os-summary-row os-discount">
            <span>Discount:</span>
            <span>-${discountAmount.toFixed(2)}</span>
          </div>
        )}

        {/* Shipping row — label varies by step and free shipping status */}
        <div className="os-summary-row">
          <span>Shipping:</span>
          <span>
            {isFreeShipping ? (
              <span className="os-free-shipping-text">
                <FaShippingFast size={14} style={{ marginRight: "4px" }} />
                FREE
              </span>
            ) : currentStep === "cart" ? (
              <span className="os-summary-value-muted">
                Calculated at checkout
              </span>
            ) : shippingCost > 0 ? (
              `$${shippingCost.toFixed(2)}`
            ) : (
              <span className="os-summary-value-muted">
                Calculated at checkout
              </span>
            )}
          </span>
        </div>

        {currentStep !== "cart" && (
          <div className="os-summary-row">
            <span>Tax:</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="os-summary-row os-summary-total">
          <strong>Total:</strong>
          <strong className="os-summary-value-total">
            ${total.toFixed(2)}
          </strong>
        </div>

        <div className="os-summary-divider"></div>

        {/* Cart-level coupon — interactive selector on cart/shipping steps, read-only display on later steps */}
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
