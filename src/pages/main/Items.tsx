import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fetchProductPreview, type ProductPreview } from "../../api/listings";
import { fetchCategories, type Category } from "../../api/categories";
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
import CartCouponBanner from "../../components/customerInterface/items/CartCouponBanner";
import Pagination from "../../components/customerInterface/items/Pagination";

import LoadingSpinner from "../../components/universalComponents/LoadingSpinner";
import "../../styles/pages/main/Items.css";
import "../../styles/pages/main/Listing.css";

const ITEMS_PER_PAGE = 20;

// ============================================================================
// ITEMS COMPONENT
// ============================================================================

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

  // Fetch products and coupons
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

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

  // Scroll to top after React re-renders with the new page
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  // ============================================================================
  // COUPON LOGIC
  // ============================================================================

  // Get the get best coupon for a product
  const getBestCouponForProduct = (
    product: ProductPreview,
  ): ProductCoupon | null => {
    if (!coupons) return null;

    const applicableCoupons: ProductCoupon[] = [];

    // Helper function to check if coupon applies to this product's location
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

  // Format the category badge text
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

  // Sort products by effective (post-discount) price when price sort is active.
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

  // Pagination derived values
  const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);
  // Clamp currentPage in case filters reduce total pages
  const safePage = Math.min(Math.max(1, currentPage), totalPages || 1);
  const paginatedProducts = sortedProducts.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

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

  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    if (page === 1) {
      newParams.delete("page");
    } else {
      newParams.set("page", page.toString());
    }
    setSearchParams(newParams);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="items-page items-loading-state">
        <LoadingSpinner message="Loading products..." />
      </div>
    );
  }

  return (
    <div className="items-page">
      <div className="items-container">
        {/* Sidebar - Hidden on small screens, visible on medium+ */}
        <div className="items-sidebar-wrapper">
          <SideBar
            activeCategoryId={activeCategoryId}
            onSelectCategory={handleSelectCategory}
            categories={categories}
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
          <CartCouponBanner coupons={coupons ? coupons.all : []} />

          {/* Header with category name and filters */}
          <div className="items-header">
            <div className="items-header-left">
              <h3 className="items-category-title">{activeCategoryName}</h3>

              {/* Category Coupon Badge */}
              {categoryCoupon && (
                <div className="items-category-coupon-badge">
                  {getCategoryBadgeText(categoryCoupon) && (
                    <span className="items-discount-badge">
                      {getCategoryBadgeText(categoryCoupon)}
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
          {error ? (
            <div className="items-error-state">
              <p>Error: {error}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="items-empty-state">
              <p>No products found in this category.</p>
            </div>
          ) : (
            <>
              <div className="items-products-grid">
                {paginatedProducts.map((product) => {
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
