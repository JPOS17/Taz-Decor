import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fetchProductPreview, type ProductPreview } from "../../api/listings";
import {
  checkCustomGroupCoupons,
  fetchProductCouponsPreview,
  findBestCoupon,
  formatBogoBadge,
  calculateDiscount,
  shouldShowDiscountedPrice,
  isItemLevelCoupon,
  type GroupedCoupons,
  type ProductCoupon,
} from "../../api/couponCustomer";

import CategoryDropDown from "../../components/customerInterface/items/CategoryDropDown";
import SideBar from "../../components/customerInterface/items/SideBar";
import ItemFilters from "../../components/customerInterface/items/ItemFilters";
import ItemListings from "../../components/customerInterface/items/ItemListings";

import "../../styles/pages/main/Items.css";
import "../../styles/pages/main/Listing.css";

const Items = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { user } = useAuth();

  const activeCategoryId = searchParams.get("categoryId")
    ? Number(searchParams.get("categoryId"))
    : null;
  const activeCategoryName = searchParams.get("categoryName") || "All";
  const minPrice = searchParams.get("minPrice")
    ? Number(searchParams.get("minPrice"))
    : null;
  const maxPrice = searchParams.get("maxPrice")
    ? Number(searchParams.get("maxPrice"))
    : null;
  const sortBy = searchParams.get("sortBy") || null;
  const onSaleOnly = searchParams.get("onSale") === "true";

  const [products, setProducts] = useState<ProductPreview[]>([]);
  const [coupons, setCoupons] = useState<GroupedCoupons | null>(null);
  const [customGroupMap, setCustomGroupMap] = useState<
    Record<number, number[]>
  >({});
  const [categoryCoupon, setCategoryCoupon] = useState<ProductCoupon | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products and coupons
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [productsData, couponsData] = await Promise.all([
          fetchProductPreview({
            categoryId: activeCategoryId,
            minPrice,
            maxPrice,
            sortBy,
            onSaleOnly,
          }),
          fetchProductCouponsPreview(),
        ]);

        setProducts(productsData);
        setCoupons(couponsData);

        // If there are custom_group coupons, fetch the mapping BY VARIANT
        if (couponsData.custom_group.length > 0 && productsData.length > 0) {
          const variantIds = productsData.map((p) => p.variant_id);
          const mapping = await checkCustomGroupCoupons(variantIds);
          setCustomGroupMap(mapping);
        }

        // Find category-specific coupon if viewing a category
        if (activeCategoryId && couponsData.category) {
          const catCoupon = couponsData.category.find(
            (c) => c.applies_to_id === activeCategoryId,
          );
          setCategoryCoupon(catCoupon || null);
        } else {
          setCategoryCoupon(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeCategoryId, minPrice, maxPrice, sortBy, onSaleOnly]);

  const handleSelectCategory = (
    categoryId: number | null,
    categoryName: string,
  ) => {
    const newParams = new URLSearchParams(searchParams);

    if (categoryId === null) {
      newParams.delete("categoryId");
      newParams.delete("categoryName");
    } else {
      newParams.set("categoryId", categoryId.toString());
      newParams.set("categoryName", categoryName);
    }

    setSearchParams(newParams);
  };

  const handlePriceChange = (min: number | null, max: number | null) => {
    const newParams = new URLSearchParams(searchParams);

    if (min === null) {
      newParams.delete("minPrice");
    } else {
      newParams.set("minPrice", min.toString());
    }

    if (max === null) {
      newParams.delete("maxPrice");
    } else {
      newParams.set("maxPrice", max.toString());
    }

    setSearchParams(newParams);
  };

  const handleSortChange = (sort: string | null) => {
    const newParams = new URLSearchParams(searchParams);

    if (sort === null) {
      newParams.delete("sortBy");
    } else {
      newParams.set("sortBy", sort);
    }

    setSearchParams(newParams);
  };

  const handleSaleFilterChange = (onSale: boolean) => {
    const newParams = new URLSearchParams(searchParams);

    if (onSale) {
      newParams.set("onSale", "true");
    } else {
      newParams.delete("onSale");
    }

    setSearchParams(newParams);
  };

  // Helper to get best coupon for a product
  // NOTE: This now automatically excludes cart-level coupons via findBestCoupon
  const getBestCouponForProduct = (
    product: ProductPreview,
  ): ProductCoupon | null => {
    if (!coupons) return null;

    const applicableCoupons: ProductCoupon[] = [];

    // Helper function to check if coupon applies to this product's location
    const couponMatchesLocation = (coupon: ProductCoupon): boolean => {
      // If coupon has no location_ids or product has no location_id, allow it (backwards compatibility)
      if (
        !coupon.location_ids ||
        coupon.location_ids.length === 0 ||
        !product.location_id
      ) {
        return true;
      }
      // Check if product's location is in the coupon's allowed locations
      return coupon.location_ids.includes(product.location_id);
    };

    // Add 'all' coupons (filtered by location)
    const allCoupons = coupons.all.filter((c) => couponMatchesLocation(c));
    applicableCoupons.push(...allCoupons);

    // Add category coupons (filtered by location)
    if (product.category_id) {
      const categoryCoupons = coupons.category.filter(
        (c) =>
          c.applies_to_id === product.category_id && couponMatchesLocation(c),
      );
      applicableCoupons.push(...categoryCoupons);
    }

    // Add product_type coupons (filtered by location)
    if (product.product_type_id) {
      const productTypeCoupons = coupons.product_type.filter(
        (c) =>
          c.applies_to_id === product.product_type_id &&
          couponMatchesLocation(c),
      );
      applicableCoupons.push(...productTypeCoupons);
    }

    // Add product-specific coupons (filtered by location)
    if (product.product_id) {
      const productCoupons = coupons.product.filter(
        (c) =>
          c.applies_to_id === product.product_id && couponMatchesLocation(c),
      );
      applicableCoupons.push(...productCoupons);
    }

    // Add variant-specific coupons (filtered by location)
    const variantCoupons = coupons.variant.filter(
      (c) => c.applies_to_id === product.variant_id && couponMatchesLocation(c),
    );
    applicableCoupons.push(...variantCoupons);

    // Add custom_group coupons using the map (filtered by location)
    if (customGroupMap[product.variant_id]) {
      const applicableCouponIds = customGroupMap[product.variant_id];
      const customGroupCoupons = coupons.custom_group.filter(
        (c) =>
          applicableCouponIds.includes(c.coupon_id) && couponMatchesLocation(c),
      );
      applicableCoupons.push(...customGroupCoupons);
    }

    return findBestCoupon(applicableCoupons, product.price);
  };

  // Helper to format category badge text
  const getCategoryBadgeText = (coupon: ProductCoupon): string | null => {
    if (coupon.discount_type === "percentage" && coupon.discount_value) {
      return `${coupon.discount_value}% OFF`;
    } else if (coupon.discount_type === "fixed" && coupon.discount_value) {
      return `$${coupon.discount_value} OFF`;
    } else if (coupon.discount_type === "bogo") {
      return formatBogoBadge(coupon);
    }
    // Don't return anything for free shipping only - it will be handled separately
    return null;
  };

  // Sort products by effective (post-discount) price when price sort is active.
  // For all other sort modes, backend ORDER BY is already correct – pass through as-is.
  const sortedProducts = useMemo(() => {
    if (sortBy !== "price-asc" && sortBy !== "price-desc") {
      return products;
    }

    return [...products].sort((a, b) => {
      const couponA = getBestCouponForProduct(a);
      const couponB = getBestCouponForProduct(b);

      // Compute effective price the same way ItemListings displays it:
      // only percentage/fixed actually change the shown price.
      const effectivePriceOf = (
        product: ProductPreview,
        coupon: ProductCoupon | null,
      ): number => {
        if (coupon && shouldShowDiscountedPrice(coupon)) {
          const { discountedPrice } = calculateDiscount(product.price, coupon);
          return discountedPrice;
        }
        return product.price;
      };

      const priceA = effectivePriceOf(a, couponA);
      const priceB = effectivePriceOf(b, couponB);

      return sortBy === "price-asc" ? priceA - priceB : priceB - priceA;
    });
  }, [products, coupons, customGroupMap, sortBy]);

  return (
    <div className="items-page">
      <div className="items-container">
        {/* Sidebar - Hidden on small screens, visible on medium+ */}
        <div className="items-sidebar-wrapper">
          <SideBar
            activeCategoryId={activeCategoryId}
            onSelectCategory={handleSelectCategory}
          />
        </div>

        <div className="items-main-content">
          {/* Category dropdown - Only visible on small screens */}
          <div className="items-category-dropdown-mobile">
            <CategoryDropDown
              activeCategoryId={activeCategoryId}
              activeCategoryName={activeCategoryName}
              onSelectCategory={handleSelectCategory}
            />
          </div>

          {/* Header with category name and filters */}
          <div className="items-header">
            <div className="items-header-left">
              <h3 className="items-category-title">{activeCategoryName}</h3>

              {/* Category Coupon Badge */}
              {categoryCoupon && (
                <div className="items-category-coupon-badge">
                  {/* Only show discount badge if there's an actual discount */}
                  {getCategoryBadgeText(categoryCoupon) && (
                    <span className="items-discount-badge">
                      {getCategoryBadgeText(categoryCoupon)}
                    </span>
                  )}

                  {/* Always show free shipping badge if applicable */}
                  {categoryCoupon.free_shipping && (
                    <span className="items-free-shipping-badge">
                      Free Shipping
                    </span>
                  )}

                  {categoryCoupon.requires_verified_email &&
                    !user?.isEmailVerified && (
                      <span className="items-verification-badge">
                        🔒 Login Required
                      </span>
                    )}
                </div>
              )}
            </div>

            <div className="items-filter-wrapper">
              <ItemFilters
                onPriceChange={handlePriceChange}
                onSortChange={handleSortChange}
                onSaleFilterChange={handleSaleFilterChange}
                currentMinPrice={minPrice}
                currentMaxPrice={maxPrice}
                currentSortBy={sortBy}
                currentOnSaleOnly={onSaleOnly}
              />
            </div>
          </div>

          {/* Content States */}
          {loading ? (
            <div className="items-loading-state">
              <p>Loading products...</p>
            </div>
          ) : error ? (
            <div className="items-error-state">
              <p>Error: {error}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="items-empty-state">
              <p>No products found in this category.</p>
            </div>
          ) : (
            <div className="items-products-grid">
              {sortedProducts.map((product) => {
                const bestCoupon = getBestCouponForProduct(product);
                return (
                  <ItemListings
                    key={product.variant_id}
                    product={product}
                    coupon={bestCoupon}
                    fromPath={`/items${location.search}`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Items;
