import { useState } from "react";
import {
  Tag,
  Trash2,
  Edit2,
  Copy,
  Check,
  ToggleLeft,
  ToggleRight,
  Eye,
} from "lucide-react";
import type { Coupon } from "../../../api/couponManagement";

import LoadingSpinner from "../../shared/LoadingSpinner";
import { formatDate } from "../../../utils/formatDate";

interface CouponsTableProps {
  coupons: Coupon[];
  loading: boolean;
  onPreview: (coupon: Coupon) => void;
  onToggleStatus: (couponId: number, currentStatus: boolean) => void;
  onEdit: (coupon: Coupon) => void;
  onDelete: (couponId: number) => void;
  onCopyCode: (code: string) => void;
  // Lets the empty state say "no matches" instead of "create your first coupon"
  hasActiveFilters?: boolean;
}

export const CouponsTable = ({
  coupons,
  loading,
  onPreview,
  onToggleStatus,
  onEdit,
  onDelete,
  onCopyCode,
  hasActiveFilters = false,
}: CouponsTableProps) => {
  // Which coupon's code was just copied — drives the brief check-mark feedback
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // ============================================================================
  // HELPERS
  // ============================================================================

  // Copies the code and flashes a check mark on that row for 1.5 seconds
  const handleCopy = (coupon: Coupon) => {
    onCopyCode(coupon.coupon_code);
    setCopiedId(coupon.coupon_id);
    setTimeout(() => {
      setCopiedId((current) => (current === coupon.coupon_id ? null : current));
    }, 1500);
  };

  // Returns the appropriate status pill based on active flag, expiry date, and usage cap
  const getStatusBadge = (coupon: Coupon) => {
    const now = new Date();
    const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

    if (!coupon.is_active) {
      return <span className="coupons-pill coupons-pill--inactive">Inactive</span>;
    }
    if (validUntil && validUntil < now) {
      return <span className="coupons-pill coupons-pill--expired">Expired</span>;
    }
    if (
      coupon.usage_limit_total &&
      coupon.usage_count_total >= coupon.usage_limit_total
    ) {
      return (
        <span className="coupons-pill coupons-pill--limit">Limit Reached</span>
      );
    }
    return <span className="coupons-pill coupons-pill--active">Active</span>;
  };

  // Formats the discount value into a human-readable string
  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === "free_shipping_only") {
      return (
        <span className="coupon-discount-chip coupon-discount-chip--shipping">
          Free Shipping Only
        </span>
      );
    }

    if (coupon.discount_type === "bogo") {
      const buyQty = coupon.bogo_buy_quantity || 1;
      const getQty = coupon.bogo_get_quantity || 1;
      const discountPct = coupon.bogo_discount_percentage || 100;

      return (
        <span className="coupon-discount-chip coupon-discount-chip--bogo">
          Buy {buyQty} Get {getQty}{" "}
          {discountPct === 100 ? "Free" : `${discountPct}% Off`}
        </span>
      );
    }

    if (coupon.discount_value) {
      if (coupon.discount_type === "percentage") {
        return `${coupon.discount_value}% off`;
      }
      if (coupon.discount_type === "fixed") {
        return `$${coupon.discount_value.toFixed(2)} off`;
      }
    }

    // Fallback for free_shipping flag without a discount value
    if (coupon.free_shipping && !coupon.discount_value) {
      return (
        <span className="coupon-discount-chip coupon-discount-chip--shipping">
          Free Shipping Only
        </span>
      );
    }

    return <span className="coupon-muted">-</span>;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="coupons-loading">
        <LoadingSpinner message="Loading coupons..." />
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <div className="coupon-empty-state">
        <div className="coupon-empty-state-icon" aria-hidden="true">
          <Tag size={26} />
        </div>
        <p className="coupon-empty-state-title">
          {hasActiveFilters ? "No coupons match your filters" : "No coupons yet"}
        </p>
        <p className="coupon-empty-state-text">
          {hasActiveFilters
            ? "Try a different search or clear the filters to see every coupon."
            : "Create your first coupon to get started."}
        </p>
      </div>
    );
  }

  return (
    <div className="coupons-table-card">
      <table className="coupons-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Discount</th>
            <th>Limits</th>
            <th>Applies To</th>
            <th>Usage</th>
            <th>Valid Until</th>
            <th>Status</th>
            <th className="coupons-th-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((coupon) => {
            const hasUsageLimit = !!coupon.usage_limit_total;
            const usagePct = hasUsageLimit
              ? Math.min(
                  100,
                  (coupon.usage_count_total / coupon.usage_limit_total!) * 100,
                )
              : 0;
            const isCopied = copiedId === coupon.coupon_id;

            return (
              <tr key={coupon.coupon_id}>
                {/* Code cell — description sits underneath as secondary text */}
                <td>
                  <div className="coupon-code-cell">
                    <div className="coupon-code-line">
                      <code className="coupon-code-display">
                        {coupon.coupon_code}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopy(coupon)}
                        className={`coupon-copy-button${
                          isCopied ? " coupon-copy-button--copied" : ""
                        }`}
                        title={isCopied ? "Copied" : "Copy code"}
                        aria-label={isCopied ? "Code copied" : "Copy code"}
                      >
                        {isCopied ? <Check size={15} /> : <Copy size={15} />}
                      </button>
                    </div>
                    {coupon.description && (
                      <div
                        className="coupon-description"
                        title={coupon.description}
                      >
                        {coupon.description}
                      </div>
                    )}
                  </div>
                </td>

                {/* Discount cell */}
                <td>
                  <div className="coupon-discount-main">
                    {formatDiscount(coupon)}
                  </div>
                  {/* Free shipping on top of a value discount */}
                  {coupon.free_shipping &&
                    coupon.discount_value &&
                    coupon.discount_type !== "free_shipping_only" && (
                      <div className="coupon-discount-sub">
                        + free shipping
                      </div>
                    )}
                </td>

                {/* Limits cell */}
                <td>
                  <div className="coupon-limits-cell">
                    {coupon.min_purchase_amount && (
                      <div>Min: ${coupon.min_purchase_amount.toFixed(2)}</div>
                    )}
                    {coupon.max_discount_amount && (
                      <div>Max: ${coupon.max_discount_amount.toFixed(2)}</div>
                    )}
                    {!coupon.min_purchase_amount &&
                      !coupon.max_discount_amount && (
                        <span className="coupon-muted">-</span>
                      )}
                  </div>
                </td>

                <td>
                  <span
                    className="coupon-applies-to-badge"
                    title={coupon.applies_to_name}
                  >
                    {coupon.applies_to_name}
                  </span>
                </td>

                {/* Usage cell — a progress bar when there is a total limit */}
                <td>
                  <div className="coupon-usage">
                    <span>
                      {coupon.usage_count_total}
                      {hasUsageLimit && (
                        <span className="coupon-muted">
                          {" "}
                          / {coupon.usage_limit_total}
                        </span>
                      )}
                    </span>
                    {hasUsageLimit && (
                      <div className="coupon-usage-bar" aria-hidden="true">
                        <div
                          className={`coupon-usage-fill${
                            usagePct >= 100 ? " coupon-usage-fill--full" : ""
                          }`}
                          style={{ width: `${usagePct}%` }}
                        />
                      </div>
                    )}
                  </div>
                </td>

                <td>
                  {coupon.valid_until ? (
                    formatDate(coupon.valid_until, false, "short")
                  ) : (
                    <span className="coupon-muted">No expiry</span>
                  )}
                </td>

                <td>{getStatusBadge(coupon)}</td>

                {/* Action buttons */}
                <td>
                  <div className="coupons-row-actions">
                    <button
                      type="button"
                      onClick={() => onPreview(coupon)}
                      className="coupons-icon-btn"
                      title="Preview affected products"
                      aria-label="Preview affected products"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onToggleStatus(coupon.coupon_id, coupon.is_active)
                      }
                      className={`coupons-icon-btn ${
                        coupon.is_active
                          ? "coupons-icon-btn--on"
                          : "coupons-icon-btn--off"
                      }`}
                      title={
                        coupon.is_active
                          ? "Deactivate coupon"
                          : "Activate coupon"
                      }
                      aria-label={
                        coupon.is_active
                          ? "Deactivate coupon"
                          : "Activate coupon"
                      }
                    >
                      {coupon.is_active ? (
                        <ToggleRight size={18} />
                      ) : (
                        <ToggleLeft size={18} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(coupon)}
                      className="coupons-icon-btn"
                      title="Edit coupon"
                      aria-label="Edit coupon"
                    >
                      <Edit2 size={16} />
                    </button>
                    {/* Delete is disabled for coupons that have already been redeemed */}
                    <button
                      type="button"
                      onClick={() => onDelete(coupon.coupon_id)}
                      className="coupons-icon-btn coupons-icon-btn--danger"
                      title={
                        coupon.usage_count_total > 0
                          ? "Cannot delete used coupon"
                          : "Delete coupon"
                      }
                      aria-label={
                        coupon.usage_count_total > 0
                          ? "Cannot delete used coupon"
                          : "Delete coupon"
                      }
                      disabled={coupon.usage_count_total > 0}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
