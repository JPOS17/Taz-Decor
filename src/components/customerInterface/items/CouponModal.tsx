import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { FaTimes, FaLock } from "react-icons/fa";
import {
  fetchApplicableCouponsForVariant,
  fetchUserCouponUsage,
  type ProductCoupon,
} from "../../../api/couponCustomer";
import { useAuth } from "../../../context/AuthContext";
import CouponBanner from "./CouponBanner";

import "../../../styles/components/customerInterface/items/CouponModal.css";

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  variantId: number;
  productId: number;
  categoryId: number;
  productTypeId?: number | null;
  productPrice: number;
  productName: string;
  isEmailVerified?: boolean;
  selectedCoupon?: ProductCoupon | null;
  onCouponSelect: (coupon: ProductCoupon | null) => void;
}

const CouponModal = ({
  isOpen,
  onClose,
  variantId,
  productId,
  categoryId,
  productTypeId,
  productPrice,
  productName,
  isEmailVerified = false,
  selectedCoupon,
  onCouponSelect,
}: CouponModalProps) => {
  const [coupons, setCoupons] = useState<ProductCoupon[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Fetched here and passed down to CouponBanner to avoid a duplicate API call
  const [userCouponUsage, setUserCouponUsage] = useState<
    Record<number, number>
  >({});

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  // Fetch the user's coupon usage once auth has resolved
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setUserCouponUsage({});
      return;
    }

    const loadUserUsage = async () => {
      try {
        const usage = await fetchUserCouponUsage();
        setUserCouponUsage(usage);
      } catch (error) {
        console.error("Error loading user coupon usage:", error);
      }
    };

    loadUserUsage();
  }, [user?.userId, authLoading]);

  // Fetch applicable coupons whenever the modal opens or the variant changes
  useEffect(() => {
    const loadCoupons = async () => {
      if (!isOpen) return;

      try {
        setLoading(true);
        const couponsData = await fetchApplicableCouponsForVariant(
          variantId,
          productId,
          categoryId,
          productTypeId,
        );
        setCoupons(couponsData);
      } catch (error) {
        console.error("Error loading coupons:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCoupons();
  }, [isOpen, variantId, productId, categoryId, productTypeId]);

  // ============================================================================
  // HELPERS
  // ============================================================================

  // Returns false when the user has hit their per-coupon usage limit
  const isEligible = (coupon: ProductCoupon) => {
    if (coupon.usage_limit_per_user != null) {
      const timesUsed = userCouponUsage[coupon.coupon_id] ?? 0;
      if (timesUsed >= coupon.usage_limit_per_user) return false;
    }
    return true;
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  // Guards against selecting an ineligible coupon, then closes the modal
  const handleCouponSelect = (coupon: ProductCoupon | null) => {
    if (coupon && !isEligible(coupon)) return;
    onCouponSelect(coupon);
    onClose();
  };

  // Clears the coupon selection and closes the modal
  const handleRemoveCoupon = () => {
    onCouponSelect(null);
    onClose();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen) return null;

  return (
    <div className="coupon-modal-overlay" onClick={onClose}>
      <div
        className="coupon-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="coupon-modal-header">
          <h3 className="coupon-modal-title">
            Select Coupon for {productName}
          </h3>
          <button className="coupon-modal-btn-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="coupon-modal-body">
          {/* Sign-in notice */}
          {!isEmailVerified && (
            <div className="coupon-modal-guest-notice">
              <FaLock className="coupon-modal-guest-icon" />
              <p>
                Coupons are only applicable for signed-in users.{" "}
                <button
                  className="coupon-modal-btn-sign-in"
                  onClick={() => {
                    onClose();
                    navigate("/login");
                  }}
                >
                  Sign in to redeem.
                </button>
              </p>
            </div>
          )}

          {loading ? (
            <div className="coupon-modal-loading">
              <div className="coupon-modal-spinner" role="status">
                <span className="coupon-modal-visually-hidden">Loading...</span>
              </div>
            </div>
          ) : coupons.length === 0 ? (
            <div className="coupon-modal-empty">
              <p>No coupons available for this item.</p>
            </div>
          ) : (
            <>
              {/* Coupon list */}
              <div
                style={
                  !isEmailVerified
                    ? { pointerEvents: "none", opacity: 0.75 }
                    : undefined
                }
              >
                {/* userCouponUsage is passed down so CouponBanner skips its own fetch */}
                <CouponBanner
                  coupons={coupons}
                  productPrice={productPrice}
                  isEmailVerified={isEmailVerified}
                  currentVariantId={variantId}
                  currentProductId={productId}
                  onCouponSelect={handleCouponSelect}
                  selectedCoupon={selectedCoupon}
                  userCouponUsage={userCouponUsage}
                />
              </div>

              {/* "No Coupon" option */}
              {isEmailVerified && (
                <div className="coupon-modal-remove-option">
                  <button
                    className={`coupon-modal-btn-remove${!selectedCoupon ? " coupon-modal-btn-remove-selected" : ""}`}
                    onClick={handleRemoveCoupon}
                  >
                    {!selectedCoupon ? "✓ " : ""}No Coupon
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CouponModal;
