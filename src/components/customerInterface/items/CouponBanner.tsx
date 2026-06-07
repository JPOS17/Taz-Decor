import { useState, useEffect } from "react";
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
  fetchUserCouponUsage,
} from "../../../api/couponCustomer";
import { useAuth } from "../../../context/AuthContext";
import { formatDate } from "../../../utils/formatDate";

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
  // When provided by a parent (e.g. CouponModal), skips the internal fetch entirely
  userCouponUsage?: Record<number, number>;
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
  userCouponUsage: userCouponUsageProp,
}: CouponBannerProps) => {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading } = useAuth();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Internal usage map — only populated when the parent has not passed one down
  const [internalUsage, setInternalUsage] = useState<Record<number, number>>(
    {},
  );

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

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  // Fetch usage internally only when the parent hasn't provided it
  useEffect(() => {
    if (userCouponUsageProp !== undefined) return;
    if (isLoading) return;
    if (!user) {
      setInternalUsage({});
      return;
    }

    const loadUserUsage = async () => {
      try {
        const usage = await fetchUserCouponUsage();
        setInternalUsage(usage);
      } catch (error) {
        console.error("Error loading user coupon usage:", error);
      }
    };

    loadUserUsage();
  }, [user?.userId, isLoading, userCouponUsageProp]);

  // Prop takes precedence; fall back to internally fetched data
  const userCouponUsage = userCouponUsageProp ?? internalUsage;

  // ============================================================================
  // HELPERS
  // ============================================================================

  // Returns the appropriate icon for a coupon based on its discount type
  const getCouponIcon = (coupon: ProductCoupon) => {
    if (coupon.discount_type === "bogo") {
      return <FaGift className="text-warning" size={14} />;
    }
    if (coupon.discount_type === "percentage")
      return <FaPercent className="text-success" size={14} />;
    return <FaTag className="text-primary" size={14} />;
  };

  // Returns the human-readable discount description for a coupon row
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

  // Handles copying code to clipboard and showing temporary feedback
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Sorts coupons descending by computed discount value against the current product price
  const sortCouponsByValue = (couponsToSort: ProductCoupon[]) => {
    return [...couponsToSort].sort((a, b) => {
      const discountA = calculateDiscount(productPrice, a).discountAmount;
      const discountB = calculateDiscount(productPrice, b).discountAmount;
      return discountB - discountA;
    });
  };

  // Expands a coupon row and lazily fetches its eligible products on first open
  const toggleCouponExpand = async (couponId: number) => {
    const newExpanded = new Set(expandedCoupons);

    if (newExpanded.has(couponId)) {
      newExpanded.delete(couponId);
    } else {
      newExpanded.add(couponId);

      const coupon = coupons.find((c) => c.coupon_id === couponId);
      if (coupon && !eligibleProducts[couponId]) {
        await fetchEligibleProducts(coupon);
      }
    }

    setExpandedCoupons(newExpanded);
  };

  // Fetches up to 10 eligible products for a coupon and caches them in state
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

  // Returns a human-readable scope label for a coupon's applies_to_type
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

  // Returns false if the user is unauthenticated or has exceeded their per-user usage limit
  const isEligible = (coupon: ProductCoupon) => {
    if (!isAuthenticated) return false;
    if (coupon.usage_limit_per_user != null) {
      const timesUsed = userCouponUsage[coupon.coupon_id] ?? 0;
      if (timesUsed >= coupon.usage_limit_per_user) return false;
    }
    return true;
  };

  // Returns the user-facing explanation for why a coupon is not eligible
  const getIneligibilityReason = (coupon: ProductCoupon) => {
    if (!isAuthenticated) return "Sign in to redeem";
    if (coupon.usage_limit_per_user != null) {
      const timesUsed = userCouponUsage[coupon.coupon_id] ?? 0;
      if (timesUsed >= coupon.usage_limit_per_user)
        return `You've already used this coupon ${timesUsed}/${coupon.usage_limit_per_user} times`;
    }
    return "";
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  // Handles selecting coupon
  const handleCouponClick = (coupon: ProductCoupon) => {
    if (onCouponSelect) {
      onCouponSelect(coupon);
      setClickedCode(coupon.coupon_code);
    }
  };

  // Navigates to the relevant product listing filtered by the coupon's scope
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

  // Navigates to a product page
  const handleProductClick = (e: React.MouseEvent, variantId: number) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/items/${variantId}`);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  // Only show item-level coupons — cart-wide coupons are handled by CartCouponBanner
  const itemLevelCoupons = coupons.filter((c) => c.applies_to_type !== "all");
  const sortedCoupons = sortCouponsByValue(itemLevelCoupons);

  if (sortedCoupons.length === 0) return null;

  return (
    <div className="coupon-banner-compact">
      <div className="coupon-banner-header-compact">
        <FaTag size={12} />
        <span>Offers ({sortedCoupons.length})</span>
      </div>

      <div
        className={[
          "coupon-banner-list",
          sortedCoupons.length > 2 ? "coupon-banner-list-scrollable" : "",
          expandedCoupons.size > 0 ? "coupon-banner-list-has-expanded" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {sortedCoupons.map((coupon) => {
          const isExpanded = expandedCoupons.has(coupon.coupon_id);
          const isBogo = coupon.discount_type === "bogo";
          const products = eligibleProducts[coupon.coupon_id] || [];
          const isLoading = loadingProducts.has(coupon.coupon_id);
          const isSelected = selectedCoupon?.coupon_id === coupon.coupon_id;
          const eligible = isEligible(coupon);
          const ineligibilityReason = !eligible
            ? getIneligibilityReason(coupon)
            : "";

          return (
            <div
              key={coupon.coupon_id}
              className={[
                "coupon-banner-item",
                isSelected ? "coupon-banner-item-selected" : "",
                !eligible && isAuthenticated
                  ? "coupon-banner-item-ineligible"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={(e) => {
                e.stopPropagation();
                toggleCouponExpand(coupon.coupon_id);
              }}
            >
              <div className="coupon-banner-item-header">
                <div className="coupon-banner-icon">
                  {getCouponIcon(coupon)}
                </div>
                <div className="coupon-banner-content">
                  <div className="coupon-banner-first-line">
                    {/* Coupon code button */}
                    <button
                      className={[
                        "coupon-banner-code",
                        isSelected ? "coupon-banner-code-selected" : "",
                        !eligible && isAuthenticated
                          ? "coupon-banner-code-ineligible"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isAuthenticated) {
                          toggleCouponExpand(coupon.coupon_id);
                          return;
                        }
                        if (!eligible) return;
                        copyCode(coupon.coupon_code);
                        setClickedCode(coupon.coupon_code);
                        handleCouponClick(coupon);
                      }}
                      disabled={!eligible && isAuthenticated}
                      title={
                        !isAuthenticated
                          ? "Sign in to use this coupon"
                          : !eligible
                            ? ineligibilityReason
                            : "Click to select this coupon"
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
                    <span className="coupon-banner-deal">
                      {getCouponText(coupon)}
                    </span>
                  </div>

                  {coupon.min_purchase_amount && (
                    <div className="coupon-banner-min-purchase">
                      Minimum purchase: ${coupon.min_purchase_amount.toFixed(2)}
                    </div>
                  )}

                  {coupon.valid_until && (
                    <div className="coupon-banner-expiration">
                      <FaCalendar size={10} />
                      <span>
                        Expires:{" "}
                        {formatDate(coupon.valid_until, false, "short")}
                      </span>
                    </div>
                  )}
                </div>
                <FaChevronDown
                  size={10}
                  className={[
                    "coupon-banner-expand-icon",
                    isExpanded ? "coupon-banner-expand-icon-expanded" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                />
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div
                  className="coupon-banner-details"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!isAuthenticated ? (
                    <div className="coupon-banner-guest-notice">
                      <FaLock size={13} />
                      <span>
                        Coupons are only applicable for signed-in users.{" "}
                        <button
                          className="coupon-banner-guest-login-link"
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
                      {!eligible && (
                        <div className="coupon-banner-ineligible-reason">
                          {ineligibilityReason}
                        </div>
                      )}

                      {coupon.description && (
                        <p className="coupon-banner-description">
                          {coupon.description}
                        </p>
                      )}

                      {coupon.discount_type === "percentage" &&
                        coupon.max_discount_amount && (
                          <div className="coupon-banner-info-note">
                            <FaInfoCircle size={12} />
                            <span>
                              Maximum discount: $
                              {coupon.max_discount_amount.toFixed(2)}
                            </span>
                          </div>
                        )}

                      {/* BOGO explanation */}
                      {isBogo && (
                        <div className="coupon-banner-bogo-explanation">
                          <div className="coupon-banner-bogo-title">
                            <FaInfoCircle size={12} />
                            <span>How this works</span>
                          </div>
                          <p className="coupon-banner-bogo-text">
                            Add the required quantities to your cart. The
                            discount will automatically apply at cart.
                          </p>
                        </div>
                      )}

                      {/* Eligible product preview */}
                      {coupon.applies_to_type !== "variant" && (
                        <div className="coupon-banner-eligible-section">
                          <div className="coupon-banner-eligible-header">
                            <div className="coupon-banner-eligible-title">
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
                                className="coupon-banner-view-all"
                              >
                                View all →
                              </button>
                            )}
                          </div>

                          {coupon.applies_to_type !== "all" && (
                            <>
                              {isLoading ? (
                                <div className="coupon-banner-loading" />
                              ) : products.length > 0 ? (
                                <div className="coupon-banner-products-preview">
                                  {products.map((product: EligibleProduct) => (
                                    <div
                                      key={product.variant_id}
                                      className="coupon-banner-product-card"
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
                                        className="coupon-banner-product-image"
                                      />
                                      <div className="coupon-banner-product-name">
                                        {product.name}
                                      </div>
                                      <div className="coupon-banner-product-price">
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
                        <div className="coupon-banner-usage-info">
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

      <div className="coupon-banner-footer">
        <FaTag size={10} /> Codes apply at checkout
      </div>
    </div>
  );
};

export default CouponBanner;
