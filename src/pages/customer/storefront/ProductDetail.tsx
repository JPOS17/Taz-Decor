import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { useCart } from "../../../context/CartContext";
import { useAuth } from "../../../context/AuthContext";
import {
  FaRegHeart,
  FaHeart,
  FaExclamationTriangle,
  FaWarehouse,
  FaWeight,
  FaRulerCombined,
  FaLock,
  FaArrowLeft,
  FaSearchPlus,
  FaShoppingCart,
} from "react-icons/fa";
import { fetchProductDetail, type ProductDetail } from "../../../api/listings";
import { fetchProductStats, type ProductStats } from "../../../api/reviews";
import {
  fetchApplicableCouponsForVariant,
  type ProductCoupon,
  calculateDiscount,
  shouldShowDiscountedPrice,
} from "../../../api/couponCustomer";

import MiniCart from "../../../components/customer/MiniCart";
import ReviewSection from "../../../components/customer/ReviewSection";

import CouponBanner from "../../../components/customer/catalog/CouponBanner";
import VariantSelector from "../../../components/customer/catalog/ProductVariantSelector";
import Lightbox from "../../../components/customer/catalog/ImageLightbox";

import LoadingSpinner from "../../../components/shared/LoadingSpinner";

const IndividualListing = () => {
  const { variantId } = useParams<{ variantId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    addToCart,
    addToWishlist,
    isInWishlist,
    isInCart,
    updateWishlistCoupon,
    updateCartCoupon,
    wishlistItems,
    cartItems,
  } = useCart();
  const { user } = useAuth();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Product & stats data
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [stats, setStats] = useState<ProductStats | null>(null);

  // Coupon data
  const [coupons, setCoupons] = useState<ProductCoupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<ProductCoupon | null>(
    null,
  );

  // Image gallery state
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Mini cart state
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [justAddedItem, setJustAddedItem] = useState<any>(null);
  const [isNewItem, setIsNewItem] = useState(false);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isEmailVerified = user?.isEmailVerified ?? false;

  // ============================================================================
  // HELPERS
  // ============================================================================

  // Normalizes the back-navigation path — defaults to /items if coming from another product page
  const getFromPath = () => {
    const fromState = location.state?.from;
    if (typeof fromState === "string" && fromState.startsWith("/items/")) {
      return "/items";
    }
    return fromState || "/items";
  };

  const from = getFromPath();

  // Derived product state flags
  const isProductInWishlist = product ? isInWishlist(Number(variantId)) : false;
  const isLowStock = !!(
    product &&
    product.quantity > 0 &&
    product.quantity <= 3
  );
  const isOutOfStock = !!(product && product.quantity === 0);

  // ============================================================================
  // PRICE CALCULATIONS
  // ============================================================================

  // Returns the effective display price after applying any active coupon discount
  const getDisplayedPrice = () => {
    if (!product || !selectedCoupon) return product?.price || 0;

    if (shouldShowDiscountedPrice(selectedCoupon) && isEmailVerified) {
      const { discountedPrice } = calculateDiscount(
        product.price,
        selectedCoupon,
      );
      return discountedPrice;
    }

    return product.price;
  };

  const displayedPrice = getDisplayedPrice();
  const hasDiscount =
    selectedCoupon &&
    shouldShowDiscountedPrice(selectedCoupon) &&
    selectedCoupon.discount_type !== "bogo" &&
    isEmailVerified;

  // Amount saved by the selected coupon, shown next to the sale price
  const savings = hasDiscount && product ? product.price - displayedPrice : 0;

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  // Force scroll to top when variant changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [variantId]);

  // Fetches product details, stats, and applicable coupons on mount or variant change
  useEffect(() => {
    const loadProduct = async () => {
      if (!variantId) return;
      try {
        setLoading(true);
        setError(null);
        const data = await fetchProductDetail(Number(variantId));
        setProduct(data);
        setSelectedImage(data.images[0] || "");

        const [statsData, couponsData] = await Promise.all([
          fetchProductStats(Number(variantId)),
          fetchApplicableCouponsForVariant(
            Number(variantId),
            data.product_id,
            data.category_id,
            data.product_type_id,
          ),
        ]);

        setStats(statsData);
        setCoupons(couponsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [variantId]);

  // Restores the previously selected coupon from cart or wishlist when either changes (no spinner)
  useEffect(() => {
    if (!coupons || coupons.length === 0) return;

    if (isInCart(Number(variantId))) {
      const cartItem = cartItems.find(
        (item) => item.variant_id === Number(variantId),
      );
      if (cartItem?.selected_coupon_id) {
        const savedCoupon = coupons.find(
          (c) => c.coupon_id === cartItem.selected_coupon_id,
        );
        setSelectedCoupon(savedCoupon || null);
      } else {
        setSelectedCoupon(null);
      }
    } else if (isInWishlist(Number(variantId))) {
      const wishlistItem = wishlistItems.find(
        (item) => item.variant_id === Number(variantId),
      );
      if (wishlistItem?.selected_coupon_id) {
        const savedCoupon = coupons.find(
          (c) => c.coupon_id === wishlistItem.selected_coupon_id,
        );
        setSelectedCoupon(savedCoupon || null);
      } else {
        setSelectedCoupon(null);
      }
    } else {
      setSelectedCoupon(null);
    }
  }, [variantId, cartItems, wishlistItems, coupons]);

  // ============================================================================
  // EVENT HANDLERS — IMAGE GALLERY
  // ============================================================================

  // Opens the lightbox at the given image index
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  // Advances to the next image, wrapping around at the end
  const nextLightboxImage = () => {
    if (product) {
      setLightboxIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  // Goes back to the previous image, wrapping around at the beginning
  const prevLightboxImage = () => {
    if (product) {
      setLightboxIndex(
        (prev) => (prev - 1 + product.images.length) % product.images.length,
      );
    }
  };

  // ============================================================================
  // EVENT HANDLERS — PRODUCT ACTIONS
  // ============================================================================

  // Navigates to the selected variant's listing page
  const handleVariantChange = (newVariantId: number) => {
    navigate(`/items/${newVariantId}`, { state: { from: "/items" } });
  };

  // Adds the current variant to the cart and opens the mini cart flyout
  const handleAddToCart = () => {
    if (!product) return;

    const cartItem = {
      variant_id: Number(variantId),
      product_id: product.product_id,
      category_id: product.category_id,
      product_type_id: product.product_type_id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      color: product.color,
      size: product.size,
      category: product.category,
    };

    const wasNewlyAdded = addToCart(cartItem, selectedCoupon?.coupon_id);

    setJustAddedItem(cartItem);
    setIsNewItem(wasNewlyAdded);
    setIsMiniCartOpen(true);
  };

  // Toggles the current variant in or out of the wishlist
  const handleToggleWishlist = () => {
    if (!product) return;

    const wishlistItem = {
      variant_id: Number(variantId),
      product_id: product.product_id,
      category_id: product.category_id,
      product_type_id: product.product_type_id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      color: product.color,
      size: product.size,
      category: product.category,
    };

    addToWishlist(wishlistItem, selectedCoupon?.coupon_id);
  };

  // Updates the selected coupon and syncs it to the cart or wishlist if the item is already saved
  const handleCouponSelect = (coupon: ProductCoupon | null) => {
    setSelectedCoupon(coupon);

    // If item is already in wishlist, update its coupon immediately
    if (isInWishlist(Number(variantId))) {
      updateWishlistCoupon(Number(variantId), coupon?.coupon_id || null);
    }

    // If item is already in cart, update its coupon immediately
    if (isInCart(Number(variantId))) {
      updateCartCoupon(Number(variantId), coupon?.coupon_id || null);
    }
  };

  // Redirects the user to their profile page to verify their email
  const handleVerifyEmailClick = () => {
    navigate("/profile");
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="product-detail-page product-detail-loading-state">
        <LoadingSpinner message="Loading product details..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-container">
          <div className="product-detail-error-container" role="alert">
            <div className="product-detail-error-alert">
              Error: {error || "Product not found"}
            </div>
            <button
              type="button"
              className="product-detail-error-back-btn"
              onClick={() => navigate("/items")}
            >
              Back to Items
            </button>
          </div>
        </div>
      </div>
    );
  }

  const backLabel =
    from === "/cart" ? "Cart" : from === "/saved" ? "Saved" : "Items";
  const hasDimensions = !!(
    product.length_in &&
    product.width_in &&
    product.height_in
  );
  const hasSpecs = !!(
    product.color ||
    product.size ||
    product.weight_oz ||
    hasDimensions
  );
  const hasPopularity =
    !!stats && (stats.wishlistCount > 0 || stats.cartCount > 0);

  return (
    <>
      <div className="product-detail-page">
        <div className="product-detail-container">
          {/* Back Button */}
          <button
            type="button"
            className="product-detail-back-btn"
            onClick={() => navigate(from)}
          >
            <FaArrowLeft size={12} aria-hidden="true" />
            Back to {backLabel}
          </button>

          {/* Main Product Layout */}
          <div className="product-detail-product-layout">
            {/* Image Section */}
            <div className="product-detail-image-section">
              {/* Main image — click opens lightbox */}
              <button
                type="button"
                className="product-detail-main-image-container"
                onClick={() =>
                  openLightbox(product.images.indexOf(selectedImage))
                }
                aria-label="View full size image"
              >
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="product-detail-main-image"
                />
                <span className="product-detail-zoom-hint" aria-hidden="true">
                  <FaSearchPlus size={14} />
                </span>
              </button>

              {/* Thumbnail strip */}
              {product.images.length > 1 && (
                <div
                  className="product-detail-thumbnail-gallery"
                  role="group"
                  aria-label="Product images"
                >
                  {product.images.map((img, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`product-detail-thumbnail-btn${selectedImage === img ? " product-detail-thumbnail-active" : ""}`}
                      onMouseEnter={() => setSelectedImage(img)}
                      onFocus={() => setSelectedImage(img)}
                      onClick={() => setSelectedImage(img)}
                      aria-label={`Show image ${index + 1} of ${product.images.length}`}
                      aria-pressed={selectedImage === img}
                    >
                      <img
                        src={img}
                        alt=""
                        className="product-detail-thumbnail-img"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info Section */}
            <div className="product-detail-info-section">
              {/* Title block */}
              <div className="product-detail-header-main">
                {/* Category */}
                <p className="product-detail-category-badge">
                  {product.category}
                </p>

                {/* Product Title */}
                <h1 className="product-detail-product-title">{product.name}</h1>

                {/* Price */}
                {hasDiscount ? (
                  <div className="product-detail-product-price">
                    <span className="product-detail-price-sale">
                      ${displayedPrice.toFixed(2)}
                    </span>
                    <span className="product-detail-price-original">
                      ${product.price.toFixed(2)}
                    </span>
                    {savings > 0 && (
                      <span className="product-detail-price-save">
                        Save ${savings.toFixed(2)}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="product-detail-product-price">
                    <span>${displayedPrice.toFixed(2)}</span>
                    {/* Lock icon shown when coupon requires email verification */}
                    {selectedCoupon?.requires_verified_email &&
                      !isEmailVerified && (
                        <FaLock
                          size={14}
                          className="product-detail-lock-icon"
                          title="Login or verify email to use this coupon"
                        />
                      )}
                  </div>
                )}

                {/* Stock status */}
                {isOutOfStock && (
                  <div
                    className="product-detail-stock-alert product-detail-stock-alert-danger"
                    role="status"
                  >
                    <FaExclamationTriangle aria-hidden="true" />
                    <span>Out of Stock</span>
                  </div>
                )}
                {isLowStock && (
                  <div
                    className="product-detail-stock-alert product-detail-stock-alert-warning"
                    role="status"
                  >
                    <FaExclamationTriangle aria-hidden="true" />
                    <span>Only {product.quantity} left!</span>
                  </div>
                )}
                {!isOutOfStock && !isLowStock && (
                  <p className="product-detail-stock-ok">
                    <span
                      className="product-detail-stock-ok-dot"
                      aria-hidden="true"
                    />
                    In stock
                  </p>
                )}

                {/* Popularity Stats — wishlist and cart counts */}
                {hasPopularity && stats && (
                  <ul className="product-detail-popularity-stats">
                    {stats.wishlistCount > 0 && (
                      <li className="product-detail-popularity-stat">
                        <FaHeart
                          className="product-detail-popularity-icon"
                          aria-hidden="true"
                        />
                        <span>
                          {stats.wishlistCount}
                          {stats.wishlistCount === 1
                            ? " person has "
                            : " people have "}
                          this in their wishlist
                        </span>
                      </li>
                    )}
                    {stats.cartCount > 0 && (
                      <li className="product-detail-popularity-stat">
                        <FaShoppingCart
                          className="product-detail-popularity-icon"
                          aria-hidden="true"
                        />
                        <span>
                          {stats.cartCount}
                          {stats.cartCount === 1
                            ? " person has "
                            : " people have "}
                          this in their cart
                        </span>
                      </li>
                    )}
                  </ul>
                )}
              </div>

              {/* Variant Selector — renders nothing for single-variant products */}
              {product.variants && (
                <VariantSelector
                  variants={product.variants}
                  selectedVariantId={Number(variantId)}
                  onVariantChange={handleVariantChange}
                />
              )}

              {/* Coupons Section */}
              {coupons.length > 0 && (
                <div className="product-detail-coupons">
                  <CouponBanner
                    coupons={coupons}
                    productPrice={product.price}
                    isEmailVerified={isEmailVerified}
                    onVerifyEmailClick={handleVerifyEmailClick}
                    onCouponSelect={handleCouponSelect}
                    selectedCoupon={selectedCoupon}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="product-detail-product-actions">
                <button
                  type="button"
                  className="product-detail-btn-add-to-cart"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                >
                  {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                </button>
                <button
                  type="button"
                  className={`product-detail-btn-wishlist${isProductInWishlist ? " product-detail-btn-wishlist-active" : ""}`}
                  onClick={handleToggleWishlist}
                  aria-pressed={isProductInWishlist}
                  aria-label={
                    isProductInWishlist
                      ? "Remove from wishlist"
                      : "Add to wishlist"
                  }
                >
                  {isProductInWishlist ? (
                    <FaHeart className="product-detail-wishlist-icon-active" />
                  ) : (
                    <FaRegHeart />
                  )}
                </button>
              </div>

              {/* Description */}
              {product.description && (
                <section className="product-detail-section">
                  <h2 className="product-detail-section-title">Description</h2>
                  <p className="product-detail-description">
                    {product.description}
                  </p>
                </section>
              )}

              {/* Product Details */}
              {hasSpecs && (
                <section className="product-detail-section">
                  <h2 className="product-detail-section-title">Details</h2>
                  <dl className="product-detail-specs">
                    {product.color && (
                      <div className="product-detail-spec-row">
                        <dt>Color</dt>
                        <dd>{product.color}</dd>
                      </div>
                    )}
                    {product.size && (
                      <div className="product-detail-spec-row">
                        <dt>Size</dt>
                        <dd>{product.size}</dd>
                      </div>
                    )}
                    {product.weight_oz && (
                      <div className="product-detail-spec-row">
                        <dt>
                          <FaWeight
                            className="product-detail-info-icon"
                            aria-hidden="true"
                          />
                          Weight
                        </dt>
                        <dd>{product.weight_oz} oz</dd>
                      </div>
                    )}
                    {hasDimensions && (
                      <div className="product-detail-spec-row">
                        <dt>
                          <FaRulerCombined
                            className="product-detail-info-icon"
                            aria-hidden="true"
                          />
                          Dimensions
                        </dt>
                        <dd>
                          {product.length_in}" × {product.width_in}" ×{" "}
                          {product.height_in}"
                        </dd>
                      </div>
                    )}
                  </dl>
                </section>
              )}

              {/* Shipping Info */}
              <div className="product-detail-shipping-info">
                <FaWarehouse
                  className="product-detail-shipping-icon"
                  aria-hidden="true"
                />
                <span>
                  <strong>Ships from:</strong> {product.location_city},{" "}
                  {product.location_state}
                </span>
              </div>
            </div>
          </div>

          {/* Reviews Section — only shown when at least one review exists */}
          {stats && stats.reviewCount > 0 && (
            <div className="product-detail-reviews-section">
              <ReviewSection
                productId={product.product_id}
                averageRating={stats.averageRating}
                reviewCount={stats.reviewCount}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mini Cart Modal */}
      <MiniCart
        isOpen={isMiniCartOpen}
        onClose={() => {
          setIsMiniCartOpen(false);
          setJustAddedItem(null);
        }}
        justAddedItem={justAddedItem}
        isNewItem={isNewItem}
        fromPath={from}
      />

      {/* Lightbox Modal */}
      <Lightbox
        isOpen={isLightboxOpen}
        images={product.images}
        currentIndex={lightboxIndex}
        productName={product.name}
        onClose={closeLightbox}
        onNext={nextLightboxImage}
        onPrev={prevLightboxImage}
        onSelectIndex={setLightboxIndex}
      />
    </>
  );
};

export default IndividualListing;