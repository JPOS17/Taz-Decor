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
  isGuest: boolean;
  // Usage map is pre-fetched by CheckoutPage and passed down to avoid duplicate API calls
  userCouponUsage: Record<number, number>;
}

const CartLevelCouponSelector = ({
  coupons,
  selectedCoupon,
  onCouponSelect,
  subtotalAfterItemDiscounts,
  isEmailVerified,
  isGuest,
  userCouponUsage,
}: CartLevelCouponSelectorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  // Only show coupons that apply to the entire cart
  const cartLevelCoupons = coupons.filter((c) => c.applies_to_type === "all");

  if (cartLevelCoupons.length === 0) {
    return null;
  }

  // ============================================================================
  // HANDLERS
  // ============================================================================

  // When a coupon is selected from the list, pass it up to the parent and collapse the list
  const handleCouponSelect = (coupon: ProductCoupon) => {
    onCouponSelect(coupon);
    setIsExpanded(false);
  };

  // When the remove button is clicked, clear the selected coupon and collapse the list
  const handleRemoveCoupon = () => {
    onCouponSelect(null);
    setIsExpanded(false);
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  // Returns a human-readable discount label for a coupon
  const getDiscountDisplay = (coupon: ProductCoupon) => {
    if (coupon.discount_type === "free_shipping_only") return "FREE SHIPPING";
    if (!coupon.discount_value) return "Invalid coupon";
    if (coupon.discount_type === "percentage")
      return `${coupon.discount_value}% OFF`;
    if (coupon.discount_type === "fixed")
      return `$${coupon.discount_value.toFixed(2)} OFF`;
    return "Discount";
  };

  // Returns true if the coupon passes all eligibility checks for the current user/cart
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
    if (!isGuest && coupon.usage_limit_per_user != null) {
      const timesUsed = userCouponUsage[coupon.coupon_id] ?? 0;
      if (timesUsed >= coupon.usage_limit_per_user) return false;
    }
    return true;
  };

  // Returns a user-facing explanation for why a coupon cannot be applied
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
    if (!isGuest && coupon.usage_limit_per_user != null) {
      const timesUsed = userCouponUsage[coupon.coupon_id] ?? 0;
      if (timesUsed >= coupon.usage_limit_per_user)
        return `You've already used this coupon ${timesUsed}/${coupon.usage_limit_per_user} times`;
    }
    return "";
  };

  const isFreeShippingCoupon = (coupon: ProductCoupon) =>
    coupon.discount_type === "free_shipping_only";

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="clcs-section">
      <div className="clcs-header">
        <h3 className="clcs-title">
          <FaTag /> Cart Discount
        </h3>

        {/* Header right — shows selected coupon details or an add button */}
        {selectedCoupon ? (
          <div className="clcs-selected-coupon">
            <div className="clcs-selected-coupon-details">
              <span className="clcs-coupon-code">
                {selectedCoupon.coupon_code}
              </span>
              <span className="clcs-coupon-value">
                {isFreeShippingCoupon(selectedCoupon) && (
                  <FaShippingFast size={12} style={{ marginRight: "4px" }} />
                )}
                {getDiscountDisplay(selectedCoupon)}
              </span>
            </div>
            <button
              className="clcs-btn-change"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              Change
            </button>
            <button
              className="clcs-btn-remove"
              onClick={handleRemoveCoupon}
              title="Remove coupon"
            >
              <FaTimes />
            </button>
          </div>
        ) : (
          <button
            className="clcs-btn-add"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Hide Coupons" : "Add Cart Discount"}
          </button>
        )}
      </div>

      {/* Expandable coupon list */}
      {isExpanded && (
        <>
          {/* Sign-in notice — shown when the user's email is not verified */}
          {!isEmailVerified && (
            <div className="clcs-guest-notice">
              <FaLock className="clcs-guest-icon" />
              <p>
                Coupons are only applicable for signed-in users.{" "}
                <button
                  className="clcs-btn-sign-in"
                  onClick={() => navigate("/login")}
                >
                  Sign in to redeem.
                </button>
              </p>
            </div>
          )}

          {/* Coupon list — pointer events disabled for unverified users */}
          <div
            style={
              !isEmailVerified
                ? { pointerEvents: "none", opacity: 0.75 }
                : undefined
            }
          >
            <div className="clcs-coupon-list">
              {cartLevelCoupons.length === 0 ? (
                <p className="clcs-no-coupons-message">
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
                      className={[
                        "clcs-coupon-item",
                        !eligible ? "clcs-ineligible" : "",
                        isSelected ? "clcs-coupon-item-selected" : "",
                        isFreeShipping ? "clcs-free-shipping-coupon" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <div className="clcs-coupon-item-content">
                        <div className="clcs-coupon-details">
                          <div className="clcs-coupon-code-row">
                            <span className="clcs-coupon-code-text">
                              {coupon.coupon_code}
                            </span>
                            <span className="clcs-coupon-discount">
                              {getDiscountDisplay(coupon)}
                            </span>
                          </div>

                          {coupon.min_purchase_amount && eligible && (
                            <p className="clcs-coupon-requirement">
                              {isFreeShipping
                                ? "Min. purchase for free shipping: "
                                : "Min. purchase: "}
                              ${coupon.min_purchase_amount.toFixed(2)}
                            </p>
                          )}

                          {isEmailVerified && !eligible && (
                            <p className="clcs-coupon-ineligible-reason">
                              {ineligibilityReason}
                            </p>
                          )}
                        </div>

                        <button
                          className="clcs-btn-select"
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
