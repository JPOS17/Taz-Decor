import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import {
  fetchApplicableCouponsForVariant,
  type ProductCoupon,
} from "../../../api/couponCustomer";
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

  const handleCouponSelect = (coupon: ProductCoupon | null) => {
    onCouponSelect(coupon);
    onClose();
  };

  const handleRemoveCoupon = () => {
    onCouponSelect(null);
    onClose();
  };

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
          <button className="coupon-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="coupon-modal-body">
          {loading ? (
            <div className="coupon-modal-loading">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : coupons.length === 0 ? (
            <div className="coupon-modal-empty">
              <p>No coupons available for this item.</p>
            </div>
          ) : (
            <>
              <CouponBanner
                coupons={coupons}
                productPrice={productPrice}
                isEmailVerified={isEmailVerified}
                currentVariantId={variantId}
                currentProductId={productId}
                onCouponSelect={handleCouponSelect}
                selectedCoupon={selectedCoupon}
              />

              {/* Remove Coupon Option */}
              <div className="coupon-modal-remove-option">
                <button
                  className={`coupon-remove-btn ${!selectedCoupon ? "selected" : ""}`}
                  onClick={handleRemoveCoupon}
                >
                  {!selectedCoupon ? "✓ " : ""}No Coupon
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CouponModal;
