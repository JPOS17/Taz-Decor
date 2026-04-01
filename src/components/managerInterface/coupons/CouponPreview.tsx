import { useState, useEffect, useMemo } from "react";
import type { Coupon } from "../../../api/couponManagement";
import {
  fetchCouponPreview,
  fetchDraftCouponPreview,
} from "../../../api/couponManagement";

import LoadingSpinner from "../../universalComponents/LoadingSpinner";

interface CouponPreviewProps {
  coupon: Coupon | null;
  couponId?: number;
  onClose?: () => void;
  showCloseButton?: boolean;
  isDraft?: boolean;
  draftCustomGroupProducts?: number[];
}

export const CouponPreview = ({
  coupon,
  couponId,
  isDraft = false,
  draftCustomGroupProducts = [],
}: CouponPreviewProps) => {
  const [previewProducts, setPreviewProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Memoize the variant IDs to prevent reference changes
  const variantIds = useMemo(() => {
    return draftCustomGroupProducts.join(",");
  }, [draftCustomGroupProducts]);

  useEffect(() => {
    if (coupon) {
      if (isDraft) {
        loadDraftPreview(coupon);
      } else if (coupon.coupon_id || couponId) {
        loadPreview(coupon.coupon_id || couponId!);
      }
    }
  }, [
    coupon?.coupon_id,
    coupon?.applies_to_type,
    coupon?.applies_to_id,
    couponId,
    isDraft,
    variantIds,
  ]); // Use variantIds instead of draftCustomGroupProducts

  const loadDraftPreview = async (cpn: Coupon) => {
    setLoading(true);
    try {
      let appliesTo: string | number | null | undefined = Array.isArray(
        cpn.applies_to_id,
      )
        ? JSON.stringify(cpn.applies_to_id)
        : cpn.applies_to_id;

      if (Array.isArray(cpn.applies_to_id)) {
        appliesTo = JSON.stringify(cpn.applies_to_id);
      }

      // For custom_group, send the flattened variant IDs
      if (
        cpn.applies_to_type === "custom_group" &&
        draftCustomGroupProducts.length > 0
      ) {
        appliesTo = JSON.stringify(draftCustomGroupProducts);
      }

      const data = await fetchDraftCouponPreview(
        cpn.applies_to_type,
        appliesTo,
        cpn.location_ids || [],
      );
      setPreviewProducts(data.products || []);
    } catch (err) {
      console.error("Preview error:", err);
      setPreviewProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPreview = async (id: number) => {
    setLoading(true);
    try {
      const data = await fetchCouponPreview(id);
      setPreviewProducts(data.products || []);
    } catch (err) {
      console.error("Preview error:", err);
      setPreviewProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscountedPrice = (originalPrice: number, cpn: Coupon) => {
    // Free shipping only doesn't change the price
    if (cpn.discount_type === "free_shipping_only") {
      return originalPrice;
    }

    if (cpn.discount_type === "bogo") {
      return originalPrice;
    }

    if (!cpn.discount_value) {
      return originalPrice;
    }

    let discount = 0;
    if (cpn.discount_type === "percentage") {
      discount = originalPrice * (cpn.discount_value / 100);
    } else if (cpn.discount_type === "fixed") {
      discount = Math.min(cpn.discount_value, originalPrice);
    }

    if (cpn.max_discount_amount && discount > cpn.max_discount_amount) {
      discount = cpn.max_discount_amount;
    }

    return Math.max(0, originalPrice - discount);
  };

  const formatDiscount = (cpn: Coupon) => {
    if (cpn.discount_type === "free_shipping_only") {
      return (
        <span className="coupon-discount-shipping">Free Shipping Only</span>
      );
    }

    if (cpn.discount_type === "bogo") {
      const buyQty = cpn.bogo_buy_quantity || 1;
      const getQty = cpn.bogo_get_quantity || 1;
      const discountPct = cpn.bogo_discount_percentage || 100;

      return (
        <span className="coupon-discount-bogo">
          Buy {buyQty} Get {getQty}{" "}
          {discountPct === 100 ? "Free" : `${discountPct}% Off`}
        </span>
      );
    }

    if (cpn.discount_value) {
      if (cpn.discount_type === "percentage") {
        return `${cpn.discount_value}% off`;
      }
      if (cpn.discount_type === "fixed") {
        return `$${cpn.discount_value.toFixed(2)} off`;
      }
    }

    if (cpn.free_shipping && !cpn.discount_value) {
      return (
        <span className="coupon-discount-shipping">Free Shipping Only</span>
      );
    }

    return "-";
  };

  if (!coupon) return null;

  return (
    <div className="coupon-preview-container">
      <div className="coupon-preview-summary">
        <div className="coupon-preview-summary-grid">
          <div>
            <strong>Discount:</strong> {formatDiscount(coupon)}
          </div>
          <div>
            <strong>Applies To:</strong>{" "}
            {coupon.applies_to_name || "All Products"}
          </div>
          {coupon.min_purchase_amount && (
            <div>
              <strong>Min Purchase:</strong> $
              {coupon.min_purchase_amount.toFixed(2)}
            </div>
          )}
          {coupon.max_discount_amount && (
            <div>
              <strong>Max Discount:</strong> $
              {coupon.max_discount_amount.toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading affected products..." />
      ) : previewProducts.length === 0 ? (
        <div className="coupon-preview-empty">
          <p>
            No products found for this coupon. This may occur if all products in
            the target are inactive.
          </p>
        </div>
      ) : (
        <>
          <div className="coupon-preview-header">
            <strong>
              {previewProducts.length} product
              {previewProducts.length !== 1 ? "s" : ""} affected
            </strong>
            {coupon.discount_type === "bogo" && (
              <div className="coupon-preview-note">
                * BOGO discounts apply when customer adds{" "}
                {(coupon.bogo_buy_quantity || 1) +
                  (coupon.bogo_get_quantity || 1)}
                + items to cart (Buy {coupon.bogo_buy_quantity || 1}, Get{" "}
                {coupon.bogo_get_quantity || 1} at{" "}
                {coupon.bogo_discount_percentage || 100}% off)
              </div>
            )}
          </div>

          <div className="coupon-preview-table-container">
            <table className="coupon-preview-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Original Price</th>
                  {coupon.discount_type !== "bogo" && (
                    <>
                      <th>Discount</th>
                      <th>Final Price</th>
                      <th>Savings</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {previewProducts.map((product, index) => {
                  const originalPrice = parseFloat(product.price);
                  const finalPrice = calculateDiscountedPrice(
                    originalPrice,
                    coupon,
                  );
                  const savings = originalPrice - finalPrice;
                  const savingsPercent =
                    originalPrice > 0 ? (savings / originalPrice) * 100 : 0;

                  return (
                    <tr key={index}>
                      <td>
                        <div className="coupon-product-name-cell">
                          {product.name}
                        </div>
                        {(product.color || product.size) && (
                          <div className="coupon-product-variant-cell">
                            {product.color && product.size
                              ? `${product.color} / ${product.size}`
                              : product.color || product.size}
                          </div>
                        )}
                        <div className="coupon-product-sku-cell">
                          SKU: {product.sku}
                        </div>
                      </td>
                      <td className="coupon-price-cell">
                        ${originalPrice.toFixed(2)}
                      </td>
                      {coupon.discount_type !== "bogo" && (
                        <>
                          <td className="coupon-discount-cell">
                            -${savings.toFixed(2)}
                          </td>
                          <td className="coupon-final-price-cell">
                            ${finalPrice.toFixed(2)}
                          </td>
                          <td>
                            <span
                              className={`coupon-savings-badge ${
                                savingsPercent >= 50
                                  ? "coupon-savings-high"
                                  : savingsPercent >= 25
                                    ? "coupon-savings-medium"
                                    : "coupon-savings-low"
                              }`}
                            >
                              {savingsPercent.toFixed(0)}% off
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {coupon.discount_value && coupon.discount_type !== "bogo" && (
            <div className="coupon-preview-totals">
              <div className="coupon-totals-grid">
                <div>
                  <div className="coupon-totals-label">Total Original</div>
                  <div className="coupon-totals-value">
                    $
                    {previewProducts
                      .reduce((sum, p) => sum + parseFloat(p.price), 0)
                      .toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="coupon-totals-label">Total Savings</div>
                  <div className="coupon-totals-value coupon-totals-savings">
                    -$
                    {previewProducts
                      .reduce((sum, p) => {
                        const original = parseFloat(p.price);
                        const final = calculateDiscountedPrice(
                          original,
                          coupon,
                        );
                        return sum + (original - final);
                      }, 0)
                      .toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="coupon-totals-label">
                    Total After Discount
                  </div>
                  <div className="coupon-totals-value coupon-totals-final">
                    $
                    {previewProducts
                      .reduce((sum, p) => {
                        return (
                          sum +
                          calculateDiscountedPrice(parseFloat(p.price), coupon)
                        );
                      }, 0)
                      .toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
