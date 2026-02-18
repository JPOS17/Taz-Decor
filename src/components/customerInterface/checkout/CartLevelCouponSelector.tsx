import { useState } from "react";
import { FaTag, FaTimes, FaLock, FaShippingFast } from "react-icons/fa";
import type { ProductCoupon } from "../../../api/couponCustomer";
import "../../../styles/components/customerInterface/checkout/CartLevelCouponSelector.css";

interface CartLevelCouponSelectorProps {
  coupons: ProductCoupon[];
  selectedCoupon: ProductCoupon | null;
  onCouponSelect: (coupon: ProductCoupon | null) => void;
  subtotalAfterItemDiscounts: number;
  isEmailVerified: boolean;
}

const CartLevelCouponSelector = ({
  coupons,
  selectedCoupon,
  onCouponSelect,
  subtotalAfterItemDiscounts,
  isEmailVerified,
}: CartLevelCouponSelectorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter for cart-level coupons only
  const cartLevelCoupons = coupons.filter((c) => c.applies_to_type === "all");

  if (cartLevelCoupons.length === 0) {
    return null;
  }

  const handleCouponSelect = (coupon: ProductCoupon) => {
    onCouponSelect(coupon);
    setIsExpanded(false);
  };

  const handleRemoveCoupon = () => {
    onCouponSelect(null);
    setIsExpanded(false);
  };

  /**
   * Get discount display text based on coupon type
   * UPDATED: Now handles free_shipping_only type
   */
  const getDiscountDisplay = (coupon: ProductCoupon) => {
    if (coupon.discount_type === "free_shipping_only") {
      return "FREE SHIPPING";
    }

    if (!coupon.discount_value) return "Invalid coupon";

    if (coupon.discount_type === "percentage") {
      return `${coupon.discount_value}% OFF`;
    }

    if (coupon.discount_type === "fixed") {
      return `$${coupon.discount_value.toFixed(2)} OFF`;
    }

    return "Discount";
  };

  /**
   * Check if user is eligible for this coupon
   */
  const isEligible = (coupon: ProductCoupon) => {
    // Check email verification
    if (coupon.requires_verified_email && !isEmailVerified) {
      return false;
    }

    // Check minimum purchase amount
    if (
      coupon.min_purchase_amount &&
      subtotalAfterItemDiscounts < coupon.min_purchase_amount
    ) {
      return false;
    }

    // Check if expired
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      return false;
    }

    // Check usage limits
    if (
      coupon.usage_limit_total &&
      coupon.usage_count_total >= coupon.usage_limit_total
    ) {
      return false;
    }

    return true;
  };

  /**
   * Get reason why user is ineligible
   */
  const getIneligibilityReason = (coupon: ProductCoupon) => {
    if (coupon.requires_verified_email && !isEmailVerified) {
      return "Email verification required";
    }

    if (
      coupon.min_purchase_amount &&
      subtotalAfterItemDiscounts < coupon.min_purchase_amount
    ) {
      return `Min. purchase: $${coupon.min_purchase_amount.toFixed(2)}`;
    }

    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      return "Expired";
    }

    if (
      coupon.usage_limit_total &&
      coupon.usage_count_total >= coupon.usage_limit_total
    ) {
      return "Usage limit reached";
    }

    return "";
  };

  /**
   * Check if this is a free shipping coupon
   */
  const isFreeShippingCoupon = (coupon: ProductCoupon) => {
    return coupon.discount_type === "free_shipping_only";
  };

  return (
    <div className="cart-level-coupon-section">
      <div className="cart-level-coupon-header">
        <h3 className="cart-level-coupon-title">
          <FaTag /> Cart Discount
        </h3>
        {selectedCoupon ? (
          <div className="selected-cart-coupon">
            <div className="selected-coupon-details">
              <span className="coupon-code">{selectedCoupon.coupon_code}</span>
              <span
                className={`coupon-value ${isFreeShippingCoupon(selectedCoupon) ? "free-shipping" : ""}`}
              >
                {isFreeShippingCoupon(selectedCoupon) && (
                  <FaShippingFast size={12} style={{ marginRight: "4px" }} />
                )}
                {getDiscountDisplay(selectedCoupon)}
              </span>
            </div>
            <button
              className="btn-change-cart-coupon"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              Change
            </button>
            <button
              className="btn-remove-cart-coupon"
              onClick={handleRemoveCoupon}
              title="Remove coupon"
            >
              <FaTimes />
            </button>
          </div>
        ) : (
          <button
            className="btn-add-cart-coupon"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Hide Coupons" : "Add Cart Discount"}
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="cart-coupon-list">
          {cartLevelCoupons.length === 0 ? (
            <p className="no-coupons-message">
              No cart-level coupons available
            </p>
          ) : (
            <>
              {cartLevelCoupons.map((coupon) => {
                const eligible = isEligible(coupon);
                const ineligibilityReason = !eligible
                  ? getIneligibilityReason(coupon)
                  : "";
                const isSelected =
                  selectedCoupon?.coupon_id === coupon.coupon_id;
                const isFreeShipping = isFreeShippingCoupon(coupon);

                return (
                  <div
                    key={coupon.coupon_id}
                    className={`cart-coupon-item ${!eligible ? "ineligible" : ""} ${isSelected ? "selected" : ""} ${isFreeShipping ? "free-shipping-coupon" : ""}`}
                  >
                    <div className="cart-coupon-item-content">
                      <div className="cart-coupon-info">
                        <div className="cart-coupon-code-row">
                          <span className="cart-coupon-code">
                            {coupon.coupon_code}
                          </span>
                          <span
                            className={`cart-coupon-discount ${isFreeShipping ? "free-shipping" : ""}`}
                          >
                            {isFreeShipping && (
                              <FaShippingFast
                                size={12}
                                style={{ marginRight: "4px" }}
                              />
                            )}
                            {getDiscountDisplay(coupon)}
                          </span>
                        </div>

                        {/* Description */}
                        {coupon.description && (
                          <p className="cart-coupon-description">
                            {coupon.description}
                          </p>
                        )}

                        {/* Minimum Purchase Requirement */}
                        {coupon.min_purchase_amount && (
                          <p className="cart-coupon-requirement">
                            {isFreeShipping
                              ? "Min. purchase for free shipping: "
                              : "Min. purchase: "}
                            ${coupon.min_purchase_amount.toFixed(2)}
                          </p>
                        )}

                        {/* Ineligibility Reason */}
                        {!eligible && (
                          <p className="cart-coupon-ineligible-reason">
                            {coupon.requires_verified_email &&
                              !isEmailVerified && (
                                <>
                                  <FaLock size={12} /> {ineligibilityReason}
                                </>
                              )}
                            {!(
                              coupon.requires_verified_email && !isEmailVerified
                            ) && ineligibilityReason}
                          </p>
                        )}
                      </div>

                      {/* Select Button */}
                      <button
                        className="btn-select-cart-coupon"
                        onClick={() => handleCouponSelect(coupon)}
                        disabled={!eligible}
                      >
                        {isSelected ? "Selected" : "Select"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CartLevelCouponSelector;
