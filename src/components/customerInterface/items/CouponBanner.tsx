import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaTag,
  FaPercent,
  FaCheckCircle,
  FaGift,
  FaChevronDown,
  FaInfoCircle,
  FaBoxOpen,
  FaCalendar,
  FaLock,
} from "react-icons/fa";
import {
  type ProductCoupon,
  calculateDiscount,
  fetchCouponEligibleProducts,
} from "../../../api/couponCustomer";
import { useAuth } from "../../../context/AuthContext";
import "../../../styles/components/customerInterface/items/CouponBanner.css";

interface CouponBannerProps {
  coupons: ProductCoupon[];
  productPrice: number;
  isEmailVerified?: boolean;
  onVerifyEmailClick?: () => void;
  currentVariantId?: number;
  currentProductId?: number;
  onCouponSelect?: (coupon: ProductCoupon | null) => void;
  selectedCoupon?: ProductCoupon | null;
}

interface EligibleProduct {
  variant_id: number;
  product_id: number;
  name: string;
  price: number;
  primary_image: string;
}

const CouponBanner = ({
  coupons,
  productPrice,
  onCouponSelect,
  selectedCoupon,
}: CouponBannerProps) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [clickedCode, setClickedCode] = useState<string | null>(null);
  const [expandedCoupons, setExpandedCoupons] = useState<Set<number>>(
    new Set(),
  );
  const [eligibleProducts, setEligibleProducts] = useState<
    Record<number, EligibleProduct[]>
  >({});
  const [loadingProducts, setLoadingProducts] = useState<Set<number>>(
    new Set(),
  );

  const getCouponIcon = (coupon: ProductCoupon) => {
    if (coupon.discount_type === "bogo") {
      return <FaGift className="text-warning" size={14} />;
    }
    if (coupon.discount_type === "percentage")
      return <FaPercent className="text-success" size={14} />;
    return <FaTag className="text-primary" size={14} />;
  };

  const getCouponText = (coupon: ProductCoupon) => {
    const { discountAmount } = calculateDiscount(productPrice, coupon);

    let text = "";

    if (
      coupon.discount_type === "percentage" &&
      coupon.discount_value !== null
    ) {
      text = `${coupon.discount_value}% off - Save $${discountAmount.toFixed(2)}`;
    } else if (coupon.discount_type === "bogo") {
      const buyQty = coupon.bogo_buy_quantity || 1;
      const getQty = coupon.bogo_get_quantity || 1;
      const discountPct = coupon.bogo_discount_percentage || 100;

      if (discountPct === 100) {
        text = `Buy ${buyQty}, get ${getQty} FREE`;
      } else {
        text = `Buy ${buyQty}, get ${getQty} at ${discountPct}% off`;
      }
    }

    return text;
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Sort coupons by best value (highest discount first)
  const sortCouponsByValue = (couponsToSort: ProductCoupon[]) => {
    return [...couponsToSort].sort((a, b) => {
      const discountA = calculateDiscount(productPrice, a).discountAmount;
      const discountB = calculateDiscount(productPrice, b).discountAmount;

      // Sort by discount amount descending (best first)
      return discountB - discountA;
    });
  };

  // Format expiration date
  const formatExpirationDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const toggleCouponExpand = async (couponId: number) => {
    const newExpanded = new Set(expandedCoupons);

    if (newExpanded.has(couponId)) {
      newExpanded.delete(couponId);
    } else {
      newExpanded.add(couponId);

      // Fetch eligible products if not already loaded
      const coupon = coupons.find((c) => c.coupon_id === couponId);
      if (coupon && !eligibleProducts[couponId]) {
        await fetchEligibleProducts(coupon);
      }
    }

    setExpandedCoupons(newExpanded);
  };

  const fetchEligibleProducts = async (coupon: ProductCoupon) => {
    setLoadingProducts((prev: Set<number>) =>
      new Set(prev).add(coupon.coupon_id),
    );
    try {
      const data = await fetchCouponEligibleProducts(coupon.coupon_id);
      setEligibleProducts((prev) => ({
        ...prev,
        [coupon.coupon_id]: data.products.slice(0, 10),
      }));
    } catch (error) {
      console.error("Error fetching eligible products:", error);
    } finally {
      setLoadingProducts((prev: Set<number>) => {
        const newSet = new Set(prev);
        newSet.delete(coupon.coupon_id);
        return newSet;
      });
    }
  };

  const getAppliesDescription = (coupon: ProductCoupon) => {
    switch (coupon.applies_to_type) {
      case "all":
        return "All products";
      case "category":
        return `${coupon.applies_to_name} category`;
      case "product":
        return `${coupon.applies_to_name} only`;
      case "product_type":
        return `All ${coupon.applies_to_name}`;
      case "variant":
        return "This specific variant";
      case "custom_group":
        return `${coupon.applies_to_name}`;
      default:
        return "Eligible products";
    }
  };

  const handleCouponClick = (coupon: ProductCoupon) => {
    if (onCouponSelect) {
      onCouponSelect(coupon);
      setClickedCode(coupon.coupon_code);
    }
  };

  const handleViewAllProducts = (coupon: ProductCoupon) => {
    if (coupon.applies_to_type === "category") {
      navigate(
        `/items?categoryId=${coupon.applies_to_id}&categoryName=${coupon.applies_to_name}`,
      );
    } else if (coupon.applies_to_type === "all") {
      navigate("/items");
    } else {
      navigate(`/items?couponId=${coupon.coupon_id}`);
    }
  };

  const handleProductClick = (e: React.MouseEvent, variantId: number) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/items/${variantId}`);
  };

  // Filter out cart-level coupons (applies_to_type === "all") - these are only selectable at checkout
  const itemLevelCoupons = coupons.filter((c) => c.applies_to_type !== "all");

  // Sort item-level coupons by best value
  const sortedCoupons = sortCouponsByValue(itemLevelCoupons);

  if (sortedCoupons.length === 0) return null;

  return (
    <div className="coupon-banner-compact">
      <div className="coupon-banner-header-compact">
        <FaTag size={12} />
        <span>Offers ({sortedCoupons.length})</span>
      </div>

      {/* Scrollable Coupons List */}
      <div
        className={`compact-coupons-list ${sortedCoupons.length > 2 ? "scrollable" : ""} ${expandedCoupons.size > 0 ? "has-expanded" : ""}`}
      >
        {sortedCoupons.map((coupon) => {
          const isExpanded = expandedCoupons.has(coupon.coupon_id);
          const isBogo = coupon.discount_type === "bogo";
          const products = eligibleProducts[coupon.coupon_id] || [];
          const isLoading = loadingProducts.has(coupon.coupon_id);
          const isSelected = selectedCoupon?.coupon_id === coupon.coupon_id;

          return (
            <div
              key={coupon.coupon_id}
              className={`compact-coupon-item ${isSelected ? "selected" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleCouponExpand(coupon.coupon_id);
              }}
            >
              {/* Compact View */}
              <div className="compact-coupon-header">
                <div className="compact-coupon-icon">
                  {getCouponIcon(coupon)}
                </div>
                <div className="compact-coupon-content">
                  <div className="compact-coupon-first-line">
                    <button
                      className={`compact-coupon-code ${isSelected ? "selected" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isAuthenticated) {
                          toggleCouponExpand(coupon.coupon_id);
                          return;
                        }
                        copyCode(coupon.coupon_code);
                        setClickedCode(coupon.coupon_code);
                        handleCouponClick(coupon);
                      }}
                      title={
                        isAuthenticated
                          ? "Click to select this coupon"
                          : "Sign in to use this coupon"
                      }
                    >
                      {copiedCode === coupon.coupon_code ? (
                        <>
                          <FaCheckCircle size={12} /> Selected!
                        </>
                      ) : (
                        <>
                          {isSelected && <FaCheckCircle size={12} />}
                          {coupon.coupon_code}
                        </>
                      )}
                    </button>
                    <span className="compact-coupon-deal">
                      {getCouponText(coupon)}
                    </span>
                  </div>

                  {coupon.min_purchase_amount && (
                    <div className="compact-coupon-min-purchase">
                      Minimum purchase: ${coupon.min_purchase_amount.toFixed(2)}
                    </div>
                  )}

                  {coupon.valid_until && (
                    <div className="compact-coupon-expiration">
                      <FaCalendar size={10} />
                      <span>
                        Expires: {formatExpirationDate(coupon.valid_until)}
                      </span>
                    </div>
                  )}
                </div>
                <FaChevronDown
                  size={10}
                  className={`compact-expand-icon ${isExpanded ? "expanded" : ""}`}
                />
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div
                  className="compact-coupon-details"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Guest sign-in notice — replaces all coupon details for unauthenticated users */}
                  {!isAuthenticated ? (
                    <div className="compact-guest-notice">
                      <FaLock size={13} />
                      <span>
                        Coupons are only applicable for signed-in users.{" "}
                        <button
                          className="compact-guest-login-link"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/login");
                          }}
                        >
                          Sign in to redeem
                        </button>
                      </span>
                    </div>
                  ) : (
                    <>
                      {coupon.description && (
                        <p className="compact-coupon-description">
                          {coupon.description}
                        </p>
                      )}

                      {/* Max discount info */}
                      {coupon.discount_type === "percentage" &&
                        coupon.max_discount_amount && (
                          <div className="compact-coupon-info-note">
                            <FaInfoCircle size={12} />
                            <span>
                              Maximum discount: $
                              {coupon.max_discount_amount.toFixed(2)}
                            </span>
                          </div>
                        )}

                      {/* BOGO Explanation */}
                      {isBogo && (
                        <div className="compact-bogo-explanation">
                          <div className="compact-bogo-title">
                            <FaInfoCircle size={12} />
                            <span>How this works</span>
                          </div>
                          <p className="compact-bogo-text">
                            Add the required quantities to your cart. The
                            discount will automatically apply at cart.
                          </p>
                        </div>
                      )}

                      {/* Eligible Products */}
                      {coupon.applies_to_type !== "variant" && (
                        <div className="compact-eligible-section">
                          <div className="compact-eligible-header">
                            <div className="compact-eligible-title">
                              <FaBoxOpen size={12} />
                              <span>
                                Applies to: {getAppliesDescription(coupon)}
                              </span>
                            </div>
                            {coupon.applies_to_type === "all" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewAllProducts(coupon);
                                }}
                                className="compact-view-all"
                              >
                                View all →
                              </button>
                            )}
                          </div>

                          {/* Only show products if NOT "all" */}
                          {coupon.applies_to_type !== "all" && (
                            <>
                              {isLoading ? (
                                <div className="compact-loading">
                                  <div className="spinner-border spinner-border-sm" />
                                </div>
                              ) : products.length > 0 ? (
                                <div className="compact-products-preview">
                                  {products.map((product: EligibleProduct) => (
                                    <div
                                      key={product.variant_id}
                                      className="compact-product-card"
                                      onClick={(e) =>
                                        handleProductClick(
                                          e,
                                          product.variant_id,
                                        )
                                      }
                                    >
                                      <img
                                        src={product.primary_image}
                                        alt={product.name}
                                        className="compact-product-image"
                                      />
                                      <div className="compact-product-name">
                                        {product.name}
                                      </div>
                                      <div className="compact-product-price">
                                        ${Number(product.price).toFixed(2)}{" "}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </>
                          )}
                        </div>
                      )}

                      {coupon.usage_limit_total && (
                        <div className="compact-usage-info">
                          {coupon.usage_limit_total - coupon.usage_count_total}{" "}
                          uses remaining
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="compact-footer">
        <FaTag size={10} /> Codes apply at checkout
      </div>
    </div>
  );
};

export default CouponBanner;
