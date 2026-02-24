import { useState } from "react";
import { useNavigate } from "react-router";
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
  const navigate = useNavigate();

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

  const isEligible = (coupon: ProductCoupon) => {
    if (coupon.requires_verified_email && !isEmailVerified) return false;
    if (
      coupon.min_purchase_amount &&
      subtotalAfterItemDiscounts < coupon.min_purchase_amount
    )
      return false;
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date())
      return false;
    if (
      coupon.usage_limit_total &&
      coupon.usage_count_total >= coupon.usage_limit_total
    )
      return false;
    return true;
  };

  const getIneligibilityReason = (coupon: ProductCoupon) => {
    if (coupon.requires_verified_email && !isEmailVerified)
      return "Email verification required";
    if (
      coupon.min_purchase_amount &&
      subtotalAfterItemDiscounts < coupon.min_purchase_amount
    )
      return `Min. purchase: $${coupon.min_purchase_amount.toFixed(2)}`;
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date())
      return "Expired";
    if (
      coupon.usage_limit_total &&
      coupon.usage_count_total >= coupon.usage_limit_total
    )
      return "Usage limit reached";
    return "";
  };

  const isFreeShippingCoupon = (coupon: ProductCoupon) =>
    coupon.discount_type === "free_shipping_only";

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
        <>
          {/* Guest notice — always shown when not verified, sits above the list */}
          {!isEmailVerified && (
            <div className="cart-level-guest-notice">
              <FaLock className="cart-level-guest-icon" />
              <p>
                Coupons are only applicable for signed-in users.{" "}
                <button
                  className="cart-level-sign-in-link"
                  onClick={() => navigate("/login")}
                >
                  Sign in to redeem.
                </button>
              </p>
            </div>
          )}

          {/* Coupon list — always rendered; interactions disabled for guests */}
          <div
            style={
              !isEmailVerified
                ? { pointerEvents: "none", opacity: 0.75 }
                : undefined
            }
          >
            <div className="cart-coupon-list">
              {cartLevelCoupons.length === 0 ? (
                <p className="no-coupons-message">
                  No cart-level coupons available
                </p>
              ) : (
                cartLevelCoupons.map((coupon) => {
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
                        <div className="cart-coupon-details">
                          <div className="cart-coupon-code-row">
                            <span className="cart-coupon-code">
                              {coupon.coupon_code}
                            </span>
                            <span
                              className={`cart-coupon-discount ${isFreeShipping ? "free-shipping" : ""}`}
                            >
                              {getDiscountDisplay(coupon)}
                            </span>
                          </div>

                          {coupon.min_purchase_amount && (
                            <p className="cart-coupon-requirement">
                              {isFreeShipping
                                ? "Min. purchase for free shipping: "
                                : "Min. purchase: "}
                              ${coupon.min_purchase_amount.toFixed(2)}
                            </p>
                          )}

                          {isEmailVerified && !eligible && (
                            <p className="cart-coupon-ineligible-reason">
                              {coupon.requires_verified_email &&
                              !isEmailVerified ? (
                                <>
                                  <FaLock size={12} /> {ineligibilityReason}
                                </>
                              ) : (
                                ineligibilityReason
                              )}
                            </p>
                          )}
                        </div>

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
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CartLevelCouponSelector;
