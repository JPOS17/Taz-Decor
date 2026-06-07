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
} from "react-icons/fa";
import { fetchProductDetail, type ProductDetail } from "../../../api/listings";
import { fetchProductStats, type ProductStats } from "../../../api/reviews";
import {
  fetchApplicableCouponsForVariant,
  type ProductCoupon,
  findBestCoupon,
  calculateDiscount,
  shouldShowDiscountedPrice,
} from "../../../api/couponCustomer";

import MiniCart from "../../../components/customerInterface/MiniCart";
import ReviewSection from "../../../components/customerInterface/ReviewSection";

import CouponBanner from "../../../components/customerInterface/items/CouponBanner";
import VariantSelector from "../../../components/customerInterface/items/ProductVariant";
import Lightbox from "../../../components/customerInterface/items/ImageLightbox";

import LoadingSpinner from "../../../components/universalComponents/LoadingSpinner";

import "../../../styles/pages/customerInterface/Tokens.css";
import "../../../styles/pages/customerInterface/main/Listing.css";

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
      <div className="listing-page listing-loading-state">
        <LoadingSpinner message="Loading product details..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="listing-page">
        <div className="listing-error-container">
          <div className="listing-error-alert">
            Error: {error || "Product not found"}
          </div>
          <button
            className="listing-error-back-btn"
            onClick={() => navigate("/items")}
          >
            Back to Items
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="listing-page">
        <div className="listing-container">
          {/* Back Button */}
          <button className="listing-back-btn" onClick={() => navigate(from)}>
            ← Back to{" "}
            {from === "/cart" ? "Cart" : from === "/saved" ? "Saved" : "Items"}
          </button>

          {/* Main Product Layout */}
          <div className="listing-product-layout">
            {/* Image Section */}
            <div className="listing-image-section">
              {/* Main image — click opens lightbox */}
              <div
                className="listing-main-image-container"
                onClick={() =>
                  openLightbox(product.images.indexOf(selectedImage))
                }
              >
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="listing-main-image"
                />
                <div className="listing-zoom-hint">Click to view full size</div>
              </div>

              {/* Thumbnail strip — only shown when there are multiple images */}
              {product.images.length > 1 && (
                <div className="listing-thumbnail-gallery">
                  {product.images.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`${product.name} - ${index + 1}`}
                      className={`listing-thumbnail-img${selectedImage === img ? " active" : ""}`}
                      onMouseEnter={() => setSelectedImage(img)}
                      onClick={() => setSelectedImage(img)}
                    />
                  ))}
                </div>
              )}

              {/* Variant Selector */}
              <div className="listing-variant-selector-wrapper">
                {product.variants && (
                  <VariantSelector
                    variants={product.variants}
                    selectedVariantId={Number(variantId)}
                    onVariantChange={handleVariantChange}
                  />
                )}
              </div>
            </div>

            {/* Product Info Section */}
            <div className="listing-info-section">
              <div className="listing-header-row">
                <div className="listing-header-main">
                  {/* Category Badge */}
                  <div className="listing-category-badge">
                    {product.category}
                  </div>

                  {/* Product Title */}
                  <h1 className="listing-product-title">{product.name}</h1>

                  {/* Price — shows original crossed out alongside discounted price when a coupon is active */}
                  {hasDiscount ? (
                    <div className="listing-product-price listing-product-price-discounted">
                      <span className="listing-price-original">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="listing-price-sale">
                        ${displayedPrice.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <div className="listing-product-price">
                      ${displayedPrice.toFixed(2)}
                      {/* Lock icon shown when coupon requires email verification */}
                      {selectedCoupon?.requires_verified_email &&
                        !isEmailVerified && (
                          <FaLock
                            size={14}
                            className="listing-lock-icon"
                            title="Login or verify email to use this coupon"
                          />
                        )}
                    </div>
                  )}

                  {/* Stock Alerts */}
                  {isOutOfStock && (
                    <div className="listing-stock-alert listing-stock-alert-danger">
                      <FaExclamationTriangle />
                      <span>Out of Stock</span>
                    </div>
                  )}
                  {isLowStock && (
                    <div className="listing-stock-alert listing-stock-alert-warning">
                      <FaExclamationTriangle />
                      <span>Only {product.quantity} left!</span>
                    </div>
                  )}

                  {/* Popularity Stats — wishlist and cart counts */}
                  {stats &&
                    (stats.wishlistCount > 0 || stats.cartCount > 0) && (
                      <div className="listing-popularity-stats">
                        {stats.wishlistCount > 0 && (
                          <div className="listing-popularity-stat">
                            ❤️
                            <span>
                              {stats.wishlistCount}
                              {stats.wishlistCount === 1
                                ? " person has "
                                : " people have "}
                              this in their wishlist
                            </span>
                          </div>
                        )}
                        {stats.cartCount > 0 && (
                          <div className="listing-popularity-stat">
                            🛒
                            <span>
                              {stats.cartCount}
                              {stats.cartCount === 1
                                ? " person has "
                                : " people have "}
                              this in their cart
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                </div>

                {/* Coupons Section — only rendered when coupons are available */}
                {coupons.length > 0 && (
                  <div className="listing-header-coupons">
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
              </div>

              {/* Action Buttons — add to cart and wishlist toggle */}
              <div className="listing-product-actions">
                <button
                  className="listing-btn-add-to-cart"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                >
                  {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                </button>
                <button
                  className={`listing-btn-wishlist${isProductInWishlist ? " active" : ""}`}
                  onClick={handleToggleWishlist}
                >
                  {isProductInWishlist ? (
                    <FaHeart className="listing-wishlist-icon-active" />
                  ) : (
                    <FaRegHeart />
                  )}
                </button>
              </div>

              {/* Product Information Table */}
              <div className="listing-info-table">
                <h2 className="listing-info-table-title">
                  Product Information
                </h2>
                <table className="table table-bordered">
                  <tbody>
                    {product.description && (
                      <tr>
                        <th scope="row">Description</th>
                        <td>{product.description}</td>
                      </tr>
                    )}
                    {product.color && (
                      <tr>
                        <th scope="row">Color</th>
                        <td>{product.color}</td>
                      </tr>
                    )}
                    {product.size && (
                      <tr>
                        <th scope="row">Size</th>
                        <td>{product.size}</td>
                      </tr>
                    )}
                    {product.weight_oz && (
                      <tr>
                        <th scope="row">
                          <FaWeight className="me-2" />
                          Weight
                        </th>
                        <td>{product.weight_oz} oz</td>
                      </tr>
                    )}
                    {product.length_in &&
                      product.width_in &&
                      product.height_in && (
                        <tr>
                          <th scope="row">
                            <FaRulerCombined className="me-2" />
                            Dimensions
                          </th>
                          <td>
                            {product.length_in}" × {product.width_in}" ×{" "}
                            {product.height_in}"
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>

              {/* Shipping Info */}
              <div className="listing-shipping-info">
                <div className="listing-shipping-item">
                  <FaWarehouse className="listing-shipping-icon" />
                  <span>
                    <strong>Ships from:</strong> {product.location_city},{" "}
                    {product.location_state}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section — only shown when at least one review exists */}
          {stats && stats.reviewCount > 0 && (
            <div className="listing-reviews-section">
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
