import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import {
  fetchProductPreview,
  type ProductPreview,
} from "../../../api/listings";
import { fetchCategories, type Category } from "../../../api/categories";
import {
  checkCustomGroupCoupons,
  fetchProductCouponsPreview,
  findBestCoupon,
  formatBogoBadge,
  calculateDiscount,
  shouldShowDiscountedPrice,
  type GroupedCoupons,
  type ProductCoupon,
} from "../../../api/couponCustomer";

import CategoryDropDown from "../../../components/customer/catalog/CategoryDropdown";
import SideBar from "../../../components/customer/catalog/ProductFilterSidebar";
import ItemListings from "../../../components/customer/catalog/ProductCard";
import CartCouponBanner from "../../../components/customer/catalog/CartCouponBanner";
import Pagination from "../../../components/customer/catalog/Pagination";
import {
  getPriceLabel,
  getSortLabel,
} from "../../../utils/catalogFilterOptions";

import LoadingSpinner from "../../../components/shared/LoadingSpinner";

const ITEMS_PER_PAGE = 20;

const Items = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { user } = useAuth();

  // ============================================================================
  // DERIVED URL PARAMS
  // ============================================================================

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
  const currentPage = searchParams.get("page")
    ? Number(searchParams.get("page"))
    : 1;

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Product & category data
  const [products, setProducts] = useState<ProductPreview[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Coupon data
  const [coupons, setCoupons] = useState<GroupedCoupons | null>(null);
  const [customGroupMap, setCustomGroupMap] = useState<
    Record<number, number[]>
  >({});
  const [categoryCoupon, setCategoryCoupon] = useState<ProductCoupon | null>(
    null,
  );

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  // Fetches products, coupons, and categories in parallel; builds custom group coupon map if needed
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch products, coupons, and categories concurrently
        const [productsData, couponsData, categoriesData] = await Promise.all([
          fetchProductPreview({
            categoryId: activeCategoryId,
            minPrice,
            maxPrice,
            sortBy,
            onSaleOnly,
          }),
          fetchProductCouponsPreview(),
          fetchCategories(false),
        ]);

        setProducts(productsData);
        setCoupons(couponsData);
        setCategories(categoriesData);

        // Fire the custom group mapping fetch concurrently with the state updates above
        if (couponsData.custom_group.length > 0 && productsData.length > 0) {
          const variantIds = productsData.map((p) => p.variant_id);
          checkCustomGroupCoupons(variantIds)
            .then((mapping) => setCustomGroupMap(mapping))
            .catch((err) =>
              console.error("Error loading custom group coupons:", err),
            );
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

  // Scroll to top when the category or results page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeCategoryId, currentPage]);

  // ============================================================================
  // COUPON LOGIC
  // ============================================================================

  // Returns the best applicable coupon for a given product across all coupon types
  const getBestCouponForProduct = (
    product: ProductPreview,
  ): ProductCoupon | null => {
    if (!coupons) return null;

    const applicableCoupons: ProductCoupon[] = [];

    // Helper that checks if a coupon applies to the product's location
    const couponMatchesLocation = (coupon: ProductCoupon): boolean => {
      if (
        !coupon.location_ids ||
        coupon.location_ids.length === 0 ||
        !product.location_id
      ) {
        return true;
      }
      return coupon.location_ids.includes(product.location_id);
    };

    // Add 'all' coupons
    const allCoupons = coupons.all.filter((c) => couponMatchesLocation(c));
    applicableCoupons.push(...allCoupons);

    // Add category coupons
    if (product.category_id) {
      const categoryCoupons = coupons.category.filter(
        (c) =>
          c.applies_to_id === product.category_id && couponMatchesLocation(c),
      );
      applicableCoupons.push(...categoryCoupons);
    }

    // Add product_type coupons
    if (product.product_type_id) {
      const productTypeCoupons = coupons.product_type.filter(
        (c) =>
          c.applies_to_id === product.product_type_id &&
          couponMatchesLocation(c),
      );
      applicableCoupons.push(...productTypeCoupons);
    }

    // Add product-specific coupons
    if (product.product_id) {
      const productCoupons = coupons.product.filter(
        (c) =>
          c.applies_to_id === product.product_id && couponMatchesLocation(c),
      );
      applicableCoupons.push(...productCoupons);
    }

    // Add variant-specific coupons
    const variantCoupons = coupons.variant.filter(
      (c) => c.applies_to_id === product.variant_id && couponMatchesLocation(c),
    );
    applicableCoupons.push(...variantCoupons);

    // Add custom_group coupons using the map
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

  // Formats the category-level coupon badge text based on discount type
  const getCategoryBadgeText = (coupon: ProductCoupon): string | null => {
    if (coupon.discount_type === "percentage" && coupon.discount_value) {
      return `${coupon.discount_value}% OFF`;
    } else if (coupon.discount_type === "fixed" && coupon.discount_value) {
      return `$${coupon.discount_value} OFF`;
    } else if (coupon.discount_type === "bogo") {
      return formatBogoBadge(coupon);
    }
    return null;
  };

  // ============================================================================
  // PRICE CALCULATIONS
  // ============================================================================

  // Sorts products by effective (post-discount) price when a price sort is active
  const sortedProducts = useMemo(() => {
    if (sortBy !== "price-asc" && sortBy !== "price-desc") {
      return products;
    }

    return [...products].sort((a, b) => {
      const couponA = getBestCouponForProduct(a);
      const couponB = getBestCouponForProduct(b);

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

  // ============================================================================
  // PAGINATION
  // ============================================================================

  const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);
  const safePage = Math.min(Math.max(1, currentPage), totalPages || 1);
  const paginatedProducts = sortedProducts.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  // ============================================================================
  // ACTIVE FILTERS
  // ============================================================================

  const hasPriceFilter = minPrice !== null || maxPrice !== null;
  const hasActiveFilters = hasPriceFilter || !!sortBy || onSaleOnly;

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  // Updates the category filter and resets to page 1
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

    // Reset to page 1 when category changes
    newParams.delete("page");
    setSearchParams(newParams);
  };

  // Updates the price range filter and resets to page 1
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

    // Reset to page 1 when filters change
    newParams.delete("page");
    setSearchParams(newParams);
  };

  // Updates the sort order and resets to page 1
  const handleSortChange = (sort: string | null) => {
    const newParams = new URLSearchParams(searchParams);

    if (sort === null) {
      newParams.delete("sortBy");
    } else {
      newParams.set("sortBy", sort);
    }

    // Reset to page 1 when sort changes
    newParams.delete("page");
    setSearchParams(newParams);
  };

  // Toggles the on-sale filter and resets to page 1
  const handleSaleFilterChange = (onSale: boolean) => {
    const newParams = new URLSearchParams(searchParams);

    if (onSale) {
      newParams.set("onSale", "true");
    } else {
      newParams.delete("onSale");
    }

    // Reset to page 1 when filter changes
    newParams.delete("page");
    setSearchParams(newParams);
  };

  // Navigates to a specific page without touching other params
  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    if (page === 1) {
      newParams.delete("page");
    } else {
      newParams.set("page", page.toString());
    }
    setSearchParams(newParams);
  };

  // Clears all filters and sort params, returning to the default view
  const handleReset = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("minPrice");
    newParams.delete("maxPrice");
    newParams.delete("sortBy");
    newParams.delete("onSale");
    newParams.delete("page");
    setSearchParams(newParams);
  };

  // Removable chips summarising every active filter, shown under the page title
  const activeFilterChips: { key: string; label: string; onRemove: () => void }[] = [];
  if (hasPriceFilter) {
    activeFilterChips.push({
      key: "price",
      label: getPriceLabel(minPrice, maxPrice),
      onRemove: () => handlePriceChange(null, null),
    });
  }
  const sortLabel = getSortLabel(sortBy);
  if (sortBy && sortLabel) {
    activeFilterChips.push({
      key: "sort",
      label: sortLabel,
      onRemove: () => handleSortChange(null),
    });
  }
  if (onSaleOnly) {
    activeFilterChips.push({
      key: "sale",
      label: "On sale",
      onRemove: () => handleSaleFilterChange(false),
    });
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="product-catalog-page product-catalog-loading-state">
        <LoadingSpinner message="Loading products..." />
      </div>
    );
  }

  return (
    <div className="product-catalog-page">
      <div className="product-catalog-container">
        {/* Sidebar — hidden on small screens, visible on medium+ */}
        <SideBar
          activeCategoryId={activeCategoryId}
          onSelectCategory={handleSelectCategory}
          categories={categories}
          currentMinPrice={minPrice}
          currentMaxPrice={maxPrice}
          currentSortBy={sortBy}
          currentOnSaleOnly={onSaleOnly}
          onPriceChange={handlePriceChange}
          onSortChange={handleSortChange}
          onSaleFilterChange={handleSaleFilterChange}
          onReset={handleReset}
        />

        <div className="product-catalog-main-content">
          {/* Category dropdown — only visible on small screens */}
          <div className="product-catalog-category-dropdown-mobile">
            <CategoryDropDown
              activeCategoryId={activeCategoryId}
              activeCategoryName={activeCategoryName}
              onSelectCategory={handleSelectCategory}
              categories={categories}
            />
          </div>

          {/* Site-wide cart coupon banner */}
          <CartCouponBanner coupons={coupons ? coupons.all : []} />

          {/* Header — category title, result count, coupon badge, active filters */}
          <header className="product-catalog-header">
            <div className="product-catalog-header-top">
              <div className="product-catalog-header-text">
                <h1 className="product-catalog-category-title">
                  {activeCategoryName}
                </h1>
                {!error && (
                  <p className="product-catalog-result-count">
                    {sortedProducts.length}{" "}
                    {sortedProducts.length === 1 ? "item" : "items"}
                  </p>
                )}
              </div>

              {/* Category-level coupon badge */}
              {categoryCoupon && (
                <div className="product-catalog-category-coupon-badge">
                  {getCategoryBadgeText(categoryCoupon) && (
                    <span className="product-catalog-discount-badge">
                      {getCategoryBadgeText(categoryCoupon)}
                    </span>
                  )}
                  {categoryCoupon.requires_verified_email &&
                    !user?.isEmailVerified && (
                      <span className="product-catalog-verification-badge">
                        Login Required
                      </span>
                    )}
                </div>
              )}
            </div>

            {/* Active filter chips */}
            {activeFilterChips.length > 0 && (
              <div className="product-catalog-active-filters">
                {activeFilterChips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    className="product-catalog-filter-chip"
                    onClick={chip.onRemove}
                    aria-label={`Remove filter: ${chip.label}`}
                  >
                    {chip.label}
                    <svg
                      className="product-catalog-filter-chip-icon"
                      width="10"
                      height="10"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <line x1="2" y1="2" x2="10" y2="10" />
                      <line x1="10" y1="2" x2="2" y2="10" />
                    </svg>
                  </button>
                ))}
                <button
                  type="button"
                  className="product-catalog-clear-filters"
                  onClick={handleReset}
                >
                  Clear all
                </button>
              </div>
            )}
          </header>

          {/* Content states */}
          {error ? (
            <div className="product-catalog-error-state" role="alert">
              <p>Error: {error}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="product-catalog-empty-state">
              <h2 className="product-catalog-empty-title">No products found</h2>
              <p className="product-catalog-empty-text">
                {hasActiveFilters
                  ? "Try adjusting or clearing your filters."
                  : "There are no products in this category yet."}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  className="product-catalog-empty-action"
                  onClick={handleReset}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Product grid */}
              <div className="product-catalog-products-grid">
                {paginatedProducts.map((product) => {
                  const bestCoupon = getBestCouponForProduct(product);
                  return (
                    <ItemListings
                      key={product.variant_id}
                      product={product}
                      coupon={bestCoupon}
                      fromPath={`/product-catalog${location.search}`}
                    />
                  );
                })}
              </div>

              {/* Pagination controls */}
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={sortedProducts.length}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Items;
