import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaTag,
  FaTimes,
  FaPercent,
  FaTruck,
  FaGift,
  FaCopy,
  FaCheckCircle,
  FaCalendarAlt,
  FaShoppingCart,
  FaLock,
} from "react-icons/fa";
import { type ProductCoupon } from "../../../api/couponCustomer";
import { useAuth } from "../../../context/AuthContext";
import { formatDate } from "../../../utils/formatDate";

import "../../../styles/components/customerInterface/items/CartCouponBanner.css";

interface CartCouponBannerProps {
  coupons: ProductCoupon[];
}

const CartCouponBanner = ({ coupons }: CartCouponBannerProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Only show coupons that apply to the entire cart
  const cartCoupons = coupons.filter((c) => c.applies_to_type === "all");

  // ============================================================================
  // SIDE EFFECTS
  // ============================================================================

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    if (isModalOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  if (cartCoupons.length === 0) return null;

  // ============================================================================
  // HELPERS
  // ============================================================================

  // Handles copying codeto clipboard
  const copyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Returns the appropriate icon for a coupon based on its discount type
  const getCouponIcon = (coupon: ProductCoupon) => {
    if (coupon.discount_type === "free_shipping_only")
      return <FaTruck size={18} />;
    if (coupon.discount_type === "bogo") return <FaGift size={18} />;
    if (coupon.discount_type === "percentage") return <FaPercent size={18} />;
    return <FaTag size={18} />;
  };

  // Returns a full sentence describing the coupon's discount
  const getDiscountLabel = (coupon: ProductCoupon): string => {
    if (coupon.discount_type === "percentage" && coupon.discount_value !== null)
      return `${coupon.discount_value}% off your entire order`;
    if (coupon.discount_type === "fixed" && coupon.discount_value !== null)
      return `$${coupon.discount_value.toFixed(2)} off your entire order`;
    if (coupon.discount_type === "free_shipping_only")
      return "Free shipping on your order";
    if (coupon.discount_type === "bogo") {
      const buy = coupon.bogo_buy_quantity || 1;
      const get = coupon.bogo_get_quantity || 1;
      const pct = coupon.bogo_discount_percentage || 100;
      if (pct === 100) return `Buy ${buy}, get ${get} free — sitewide`;
      return `Buy ${buy}, get ${get} at ${pct}% off — sitewide`;
    }
    return "Special discount on your order";
  };

  // Returns the compact badge text shown in the header bar and mini badges
  const getBadgeText = (coupon: ProductCoupon): string => {
    if (coupon.discount_type === "percentage" && coupon.discount_value)
      return `${coupon.discount_value}% OFF`;
    if (coupon.discount_type === "fixed" && coupon.discount_value)
      return `$${coupon.discount_value} OFF`;
    if (coupon.discount_type === "free_shipping_only") return "FREE SHIP";
    if (coupon.discount_type === "bogo") {
      const buy = coupon.bogo_buy_quantity || 1;
      const get = coupon.bogo_get_quantity || 1;
      return `B${buy}G${get}`;
    }
    return "DEAL";
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      {/* Header bar */}
      <div
        className="ccb-header-bar"
        onClick={() => setIsModalOpen(true)}
        role="button"
        aria-label="View cart deals"
      >
        <div className="ccb-header-bar-left">
          <FaShoppingCart size={13} />
          <span className="ccb-header-bar-title">
            {cartCoupons.length} Cart Deal{cartCoupons.length > 1 ? "s" : ""}{" "}
            Available
          </span>
          <div className="ccb-header-bar-badges">
            {cartCoupons.map((c) => (
              <span key={c.coupon_id} className="ccb-mini-badge">
                {getBadgeText(c)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Floating pill */}
      <button
        className="ccb-floating-pill"
        onClick={() => setIsModalOpen(true)}
        aria-label="View cart deals"
      >
        <FaTag size={13} />
        <span>
          {cartCoupons.length} Cart Deal{cartCoupons.length > 1 ? "s" : ""}
        </span>
        <span className="ccb-pill-badge">{cartCoupons.length}</span>
      </button>

      {/* Modal overlay */}
      {isModalOpen && (
        <div
          className="ccb-overlay"
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Cart deals"
        >
          <div className="ccb-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div className="ccb-modal-header">
              <div className="ccb-modal-header-left">
                <FaShoppingCart size={14} />
                <span className="ccb-modal-title">
                  {cartCoupons.length === 1
                    ? "Cart Deal Available"
                    : `${cartCoupons.length} Cart Deals Available`}
                </span>
              </div>
              <button
                className="ccb-modal-close"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close deals modal"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <p className="ccb-modal-subtitle">
              These codes apply to your entire cart at checkout.
            </p>

            {/* Sign-in notice — only shown to unauthenticated users */}
            {!isAuthenticated && (
              <div className="ccb-guest-notice">
                <FaLock size={13} />
                <span>
                  Coupons are only applicable for signed-in users.{" "}
                  <button
                    className="ccb-guest-login-link"
                    onClick={() => {
                      setIsModalOpen(false);
                      navigate("/login");
                    }}
                  >
                    Sign in to redeem
                  </button>
                </span>
              </div>
            )}

            {/* Coupon cards */}
            <div className="ccb-modal-cards">
              {cartCoupons.map((coupon) => (
                <div key={coupon.coupon_id} className="ccb-card">
                  <div className="ccb-card-strip" />

                  <div className="ccb-card-inner">
                    {/* Card top — icon, badge, description */}
                    <div className="ccb-card-top">
                      <div className="ccb-card-icon-wrap">
                        {getCouponIcon(coupon)}
                      </div>
                      <div className="ccb-card-info">
                        <span className="ccb-discount-badge">
                          {getBadgeText(coupon)}
                        </span>
                        <p className="ccb-discount-label">
                          {getDiscountLabel(coupon)}
                        </p>
                        {coupon.description && (
                          <p className="ccb-description">
                            {coupon.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Meta chips — min purchase and expiry when present */}
                    <div className="ccb-card-meta">
                      {coupon.min_purchase_amount && (
                        <span className="ccb-meta-item">
                          <FaShoppingCart size={10} />
                          Min. ${coupon.min_purchase_amount.toFixed(2)}
                        </span>
                      )}
                      {coupon.valid_until && (
                        <span className="ccb-meta-item">
                          <FaCalendarAlt size={10} />
                          Expires{" "}
                          {formatDate(coupon.valid_until, false, "short")}
                        </span>
                      )}
                    </div>

                    {/* Copy code button — currently commented out pending design review */}
                    {/* <button
                      className={[
                        "ccb-code-btn",
                        copiedCode === coupon.coupon_code ? "ccb-code-btn-copied" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={(e) => copyCode(coupon.coupon_code, e)}
                    >
                      {copiedCode === coupon.coupon_code ? (
                        <>
                          <FaCheckCircle size={13} />
                          <span>Copied to clipboard!</span>
                        </>
                      ) : (
                        <>
                          <span className="ccb-code-text">
                            {coupon.coupon_code}
                          </span>
                          <span className="ccb-code-copy-hint">
                            <FaCopy size={11} /> Copy code
                          </span>
                        </>
                      )}
                    </button> */}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="ccb-modal-footer">
              <FaTag size={10} />
              <span>Apply code at checkout · Valid on your entire cart</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CartCouponBanner;
