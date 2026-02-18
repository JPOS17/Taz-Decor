import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaTag,
  FaTruck,
  FaPercent,
  FaDollarSign,
  FaCheckCircle,
  FaShieldAlt,
  FaGift,
  FaChevronDown,
  FaInfoCircle,
  FaBoxOpen,
  FaCalendar,
  FaShoppingCart,
} from "react-icons/fa";
import {
  type ProductCoupon,
  calculateDiscount,
  isCartLevelCoupon,
} from "../../../api/couponCustomer";
import { fetchCouponPreview } from "../../../api/couponManagement";
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

  if (coupons.length === 0) return null;

  const getCouponIcon = (coupon: ProductCoupon) => {
    if (coupon.discount_type === "bogo") {
      return <FaGift className="text-warning" size={14} />;
    }
    if (coupon.free_shipping)
      return <FaTruck className="text-info" size={14} />;
    if (coupon.discount_type === "percentage")
      return <FaPercent className="text-success" size={14} />;
    if (coupon.discount_type === "fixed")
      return <FaDollarSign className="text-success" size={14} />;
    return <FaTag className="text-primary" size={14} />;
  };

  const getCouponText = (coupon: ProductCoupon) => {
    const { discountAmount } = calculateDiscount(productPrice, coupon);

    let text = "";

    if (coupon.discount_type === "free_shipping_only") {
      text = "Free Shipping";
    } else if (
      coupon.discount_type === "percentage" &&
      coupon.discount_value !== null
    ) {
      text = `${coupon.discount_value}% off - Save $${discountAmount.toFixed(2)}`;
    } else if (
      coupon.discount_type === "fixed" &&
      coupon.discount_value !== null
    ) {
      text = `$${coupon.discount_value.toFixed(2)} off cart`;
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

    // Don't add free shipping here - it will be on separate line
    return text;
  };

  // Check if coupon has only free shipping (no discount)
  const isFreeShippingOnly = (coupon: ProductCoupon) => {
    return coupon.discount_type === "free_shipping_only";
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
      const data = await fetchCouponPreview(coupon.coupon_id);
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
    // Don't allow selection of cart-level coupons
    if (isCartLevelCoupon(coupon)) {
      return;
    }

    if (onCouponSelect) {
      // Always select the clicked coupon, even if it's already selected
      // This prevents accidental deselection when clicking the same coupon
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

  // Sort all coupons by best value
  const sortedCoupons = sortCouponsByValue(coupons);

  return (
    <div className="coupon-banner-compact">
      <div className="coupon-banner-header-compact">
        <FaTag size={12} />
        <span>Offers ({coupons.length})</span>
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
          const freeShippingOnly = isFreeShippingOnly(coupon);
          const isSelected = selectedCoupon?.coupon_id === coupon.coupon_id;
          const isCartLevel = isCartLevelCoupon(coupon);

          return (
            <div
              key={coupon.coupon_id}
              className={`compact-coupon-item ${isSelected ? "selected" : ""} ${isCartLevel ? "cart-level-coupon" : ""}`}
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
                      className={`compact-coupon-code ${isCartLevel ? "cart-level" : ""} ${isSelected ? "selected" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isCartLevel) {
                          copyCode(coupon.coupon_code);
                          setClickedCode(coupon.coupon_code);
                          handleCouponClick(coupon);
                        }
                      }}
                      disabled={isCartLevel}
                      title={
                        isCartLevel
                          ? "This coupon applies at checkout to your entire cart"
                          : "Click to select this coupon"
                      }
                    >
                      {isCartLevel ? (
                        <>
                          <FaShoppingCart size={12} /> {coupon.coupon_code}
                        </>
                      ) : copiedCode === coupon.coupon_code ? (
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
                      {freeShippingOnly
                        ? "Free Shipping"
                        : getCouponText(coupon)}
                    </span>
                  </div>

                  {/* Cart-level badge */}
                  {isCartLevel && (
                    <div className="compact-coupon-cart-level-badge">
                      <span>Applied at checkout to entire cart</span>
                    </div>
                  )}

                  {/* Free shipping on separate line if there's also a discount */}
                  {!freeShippingOnly && coupon.free_shipping && (
                    <div className="compact-coupon-free-shipping">
                      + Free Shipping
                    </div>
                  )}

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
                  {coupon.description && (
                    <p className="compact-coupon-description">
                      {coupon.description}
                    </p>
                  )}

                  {/* Cart-level explanation */}
                  {isCartLevel && (
                    <div className="compact-coupon-info-note cart-level-note">
                      <FaInfoCircle size={12} />
                      <span>
                        This discount will be automatically applied to your
                        entire cart at checkout when minimum requirements are
                        met.
                      </span>
                    </div>
                  )}

                  {/* Email verification requirement */}
                  {coupon.requires_verified_email && (
                    <div className="compact-coupon-info-note">
                      <FaShieldAlt size={12} />
                      <span>Requires email verification</span>
                    </div>
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
                        Add the required quantities to your cart. The discount
                        will automatically apply at checkout.
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
                                    handleProductClick(e, product.variant_id)
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
                                    ${product.price.toFixed(2)}
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
                      {coupon.usage_limit_total - coupon.usage_count_total} uses
                      remaining
                    </div>
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
