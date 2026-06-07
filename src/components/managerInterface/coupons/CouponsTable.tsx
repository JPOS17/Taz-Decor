import {
  Tag,
  Trash2,
  Edit2,
  Copy,
  ToggleLeft,
  ToggleRight,
  Eye,
} from "lucide-react";
import type { Coupon } from "../../../api/couponManagement";

import LoadingSpinner from "../../universalComponents/LoadingSpinner";
import { formatDate } from "../../../utils/formatDate";

interface CouponsTableProps {
  coupons: Coupon[];
  loading: boolean;
  onPreview: (coupon: Coupon) => void;
  onToggleStatus: (couponId: number, currentStatus: boolean) => void;
  onEdit: (coupon: Coupon) => void;
  onDelete: (couponId: number) => void;
  onCopyCode: (code: string) => void;
}

export const CouponsTable = ({
  coupons,
  loading,
  onPreview,
  onToggleStatus,
  onEdit,
  onDelete,
  onCopyCode,
}: CouponsTableProps) => {
  // ============================================================================
  // HELPERS
  // ============================================================================

  // Returns the appropriate status badge based on active flag, expiry date, and usage cap
  const getStatusBadge = (coupon: Coupon) => {
    const now = new Date();
    const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

    if (!coupon.is_active) {
      return <span className="mgr-badge mgr-badge-secondary">Inactive</span>;
    }
    if (validUntil && validUntil < now) {
      return <span className="mgr-badge mgr-badge-danger">Expired</span>;
    }
    if (
      coupon.usage_limit_total &&
      coupon.usage_count_total >= coupon.usage_limit_total
    ) {
      return <span className="mgr-badge mgr-badge-warning">Limit Reached</span>;
    }
    return <span className="mgr-badge mgr-badge-success">Active</span>;
  };

  // Formats the discount value into a human-readable string
  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === "free_shipping_only") {
      return (
        <span className="coupon-discount-highlight">Free Shipping Only</span>
      );
    }

    if (coupon.discount_type === "bogo") {
      const buyQty = coupon.bogo_buy_quantity || 1;
      const getQty = coupon.bogo_get_quantity || 1;
      const discountPct = coupon.bogo_discount_percentage || 100;

      return (
        <span className="coupon-discount-highlight">
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
        <span className="coupon-discount-highlight">Free Shipping Only</span>
      );
    }

    return "-";
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return <LoadingSpinner message="Loading coupons..." />;
  }

  if (coupons.length === 0) {
    return (
      <div className="coupon-empty-state">
        <Tag size={48} className="coupon-empty-state-icon" />
        <p className="coupon-empty-state-text">
          No coupons found. Create your first coupon to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="mgr-table-wrapper">
      <table className="mgr-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Description</th>
            <th>Discount</th>
            <th>Limits</th>
            <th>Applies To</th>
            <th>Usage</th>
            <th>Valid Until</th>
            <th>Status</th>
            <th className="coupon-table-actions-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((coupon) => (
            <tr key={coupon.coupon_id}>
              {/* Code cell */}
              <td>
                <div className="coupon-code-cell">
                  <code className="coupon-code-display">
                    {coupon.coupon_code}
                  </code>
                  <button
                    onClick={() => onCopyCode(coupon.coupon_code)}
                    className="coupon-copy-button"
                    title="Copy code"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </td>

              <td>{coupon.description || "-"}</td>

              <td>
                <div>{formatDiscount(coupon)}</div>
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
                    !coupon.max_discount_amount &&
                    "-"}
                </div>
              </td>

              <td>
                <span className="coupon-applies-to-badge">
                  {coupon.applies_to_name}
                </span>
              </td>

              {/* Usage cell */}
              <td>
                {coupon.usage_count_total}
                {coupon.usage_limit_total && ` / ${coupon.usage_limit_total}`}
              </td>

              <td>
                {coupon.valid_until
                  ? formatDate(coupon.valid_until, false, "short")
                  : "No expiry"}
              </td>

              <td>{getStatusBadge(coupon)}</td>

              {/* Action buttons */}
              <td>
                <div className="mgr-action-group">
                  <button
                    onClick={() => onPreview(coupon)}
                    className="mgr-action-btn mgr-action-btn-preview"
                    title="Preview affected products"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() =>
                      onToggleStatus(coupon.coupon_id, coupon.is_active)
                    }
                    className="mgr-action-btn mgr-action-btn-toggle"
                    title={
                      coupon.is_active ? "Deactivate coupon" : "Activate coupon"
                    }
                  >
                    {coupon.is_active ? (
                      <ToggleRight size={16} />
                    ) : (
                      <ToggleLeft size={16} />
                    )}
                  </button>
                  <button
                    onClick={() => onEdit(coupon)}
                    className="mgr-action-btn mgr-action-btn-edit"
                    title="Edit coupon"
                  >
                    <Edit2 size={16} />
                  </button>
                  {/* Delete is disabled for coupons that have already been redeemed */}
                  <button
                    onClick={() => onDelete(coupon.coupon_id)}
                    className="mgr-action-btn mgr-action-btn-delete"
                    title={
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
          ))}
        </tbody>
      </table>
    </div>
  );
};
