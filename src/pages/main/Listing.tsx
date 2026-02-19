import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import {
  FaRegHeart,
  FaHeart,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
  FaShippingFast,
  FaWarehouse,
  FaWeight,
  FaRulerCombined,
  FaLock,
} from "react-icons/fa";
import { fetchProductDetail, type ProductDetail } from "../../api/listings";
import { fetchProductStats, type ProductStats } from "../../api/statistics";
import {
  fetchApplicableCouponsForVariant,
  type ProductCoupon,
  findBestCoupon,
  calculateDiscount,
  shouldShowDiscountedPrice,
} from "../../api/couponCustomer";

import MiniCart from "../../components/customerInterface/MiniCart";
import ReviewSection from "../../components/customerInterface/ReviewSection";

import CouponBanner from "../../components/customerInterface/items/CouponBanner";
import VariantSelector from "../../components/customerInterface/items/ProductVariant";
import Lightbox from "../../components/customerInterface/items/ImageLightbox";

import "../../styles/pages/main/Listing.css";

const IndividualListing = () => {
  const { variantId } = useParams<{ variantId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Force scroll to top when variant changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [variantId]);

  // FIX: Normalize the from path - ensure it's always a valid route
  const getFromPath = () => {
    const fromState = location.state?.from;

    // If from is a string that starts with /items/ (a product page), default to /items
    if (typeof fromState === "string" && fromState.startsWith("/items/")) {
      return "/items";
    }

    // Otherwise use the from state or default to /items
    return fromState || "/items";
  };

  const from = getFromPath();

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

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [stats, setStats] = useState<ProductStats | null>(null);

  const [coupons, setCoupons] = useState<ProductCoupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<ProductCoupon | null>(
    null,
  );
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [justAddedItem, setJustAddedItem] = useState<any>(null);
  const [isNewItem, setIsNewItem] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isEmailVerified = user?.isEmailVerified ?? false;

  useEffect(() => {
    const loadProduct = async () => {
      if (!variantId) return;
      try {
        setLoading(true);
        setError(null);

        const data = await fetchProductDetail(Number(variantId));
        setProduct(data);
        setSelectedImage(data.images[0] || "");

        const statsData = await fetchProductStats(Number(variantId));
        setStats(statsData);

        const couponsData = await fetchApplicableCouponsForVariant(
          Number(variantId),
          data.product_id,
          data.category_id,
          data.product_type_id,
        );
        setCoupons(couponsData);

        // Check if item is in cart and has a saved coupon (prioritize cart over wishlist)
        if (isInCart(Number(variantId))) {
          const cartItem = cartItems.find(
            (item) => item.variant_id === Number(variantId),
          );

          if (cartItem?.selected_coupon_id) {
            // Find the saved coupon from the available coupons
            const savedCoupon = couponsData.find(
              (c) => c.coupon_id === cartItem.selected_coupon_id,
            );
            setSelectedCoupon(savedCoupon || null);
          } else {
            // Item is in cart but no coupon saved, don't auto-select
            setSelectedCoupon(null);
          }
        }
        // Check if item is in wishlist and has a saved coupon
        else if (isInWishlist(Number(variantId))) {
          const wishlistItem = wishlistItems.find(
            (item) => item.variant_id === Number(variantId),
          );

          if (wishlistItem?.selected_coupon_id) {
            // Find the saved coupon from the available coupons
            const savedCoupon = couponsData.find(
              (c) => c.coupon_id === wishlistItem.selected_coupon_id,
            );
            setSelectedCoupon(savedCoupon || null);
          } else {
            // Item is in wishlist but no coupon saved, don't auto-select
            setSelectedCoupon(null);
          }
        } else {
          // Item not in cart or wishlist, don't auto-select any coupon
          setSelectedCoupon(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [variantId, wishlistItems, cartItems]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const nextLightboxImage = () => {
    if (product) {
      setLightboxIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevLightboxImage = () => {
    if (product) {
      setLightboxIndex(
        (prev) => (prev - 1 + product.images.length) % product.images.length,
      );
    }
  };

  const prevMainImage = () => {
    if (product) {
      const currentIndex = product.images.indexOf(selectedImage);
      const prevIndex =
        (currentIndex - 1 + product.images.length) % product.images.length;
      setSelectedImage(product.images[prevIndex]);
    }
  };

  const nextMainImage = () => {
    if (product) {
      const currentIndex = product.images.indexOf(selectedImage);
      const nextIndex = (currentIndex + 1) % product.images.length;
      setSelectedImage(product.images[nextIndex]);
    }
  };

  const handleVariantChange = (newVariantId: number) => {
    // FIX: Always preserve /items as the from path when navigating between variants
    navigate(`/items/${newVariantId}`, { state: { from: "/items" } });
  };

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

    // Pass the selected coupon ID when adding to cart
    const wasNewlyAdded = addToCart(cartItem, selectedCoupon?.coupon_id);

    setJustAddedItem(cartItem);
    setIsNewItem(wasNewlyAdded);
    setIsMiniCartOpen(true);
  };

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

    // addToWishlist toggles - if item exists it removes, if not it adds
    addToWishlist(wishlistItem, selectedCoupon?.coupon_id);
  };

  const handleVerifyEmailClick = () => {
    navigate("/profile");
  };

  const isProductInWishlist = product ? isInWishlist(Number(variantId)) : false;

  const isLowStock = !!(
    product &&
    product.quantity > 0 &&
    product.quantity <= 3
  );
  const isOutOfStock = !!(product && product.quantity === 0);

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

  // ADD THESE NEW FUNCTIONS before "if (loading)":
  // Calculate displayed price based on selected coupon
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

  if (loading) {
    return (
      <div className="individual-listing-page">
        <div className="loading-container">
          <p className="loading-text">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="individual-listing-page">
        <div className="error-container">
          <div className="error-alert">
            Error: {error || "Product not found"}
          </div>
          <button
            className="error-back-button"
            onClick={() => navigate("/items")}
          >
            Back to Items
          </button>
        </div>
      </div>
    );
  }

  const currentImageIndex = product.images.indexOf(selectedImage);

  return (
    <>
      <div className="individual-listing-page">
        <div className="individual-listing-container">
          {/* Back Button */}
          <button className="back-button" onClick={() => navigate(from)}>
            ← Back to{" "}
            {from === "/cart" ? "Cart" : from === "/saved" ? "Saved" : "Items"}
          </button>

          {/* Main Product Layout */}
          <div className="product-layout">
            {/* Image Section */}
            <div className="product-image-section">
              {/* Thumbnail Gallery */}
              {product.images.length > 1 && (
                <div className="thumbnail-gallery">
                  {product.images.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`${product.name} - ${index + 1}`}
                      className={`thumbnail-image ${selectedImage === img ? "active" : ""}`}
                      onMouseEnter={() => setSelectedImage(img)}
                      onClick={() => setSelectedImage(img)}
                    />
                  ))}
                </div>
              )}

              {/* Main Image */}
              <div className="main-image-wrapper">
                <div
                  className="main-image-container"
                  onClick={() => openLightbox(currentImageIndex)}
                >
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="main-image"
                  />
                  <div className="zoom-hint">Click to view full size</div>

                  {/* Navigation Arrows */}
                  {product.images.length > 1 && (
                    <>
                      <button
                        className="image-nav-button image-nav-prev"
                        onClick={(e) => {
                          e.stopPropagation();
                          prevMainImage();
                        }}
                      >
                        <FaChevronLeft />
                      </button>
                      <button
                        className="image-nav-button image-nav-next"
                        onClick={(e) => {
                          e.stopPropagation();
                          nextMainImage();
                        }}
                      >
                        <FaChevronRight />
                      </button>
                    </>
                  )}
                </div>

                {/* Variant Selector */}
                {product.variants && product.variants.length > 1 && (
                  <VariantSelector
                    variants={product.variants}
                    selectedVariantId={Number(variantId)}
                    onVariantChange={handleVariantChange}
                  />
                )}
              </div>
            </div>

            {/* Product Info Section */}
            <div className="product-info-section">
              <div className="product-header-row">
                <div className="product-header-main">
                  {/* Category Badge */}
                  <div className="product-category-badge">
                    {product.category}
                  </div>

                  {/* Product Title */}
                  <h1 className="product-title">{product.name}</h1>

                  {/* Price */}
                  {hasDiscount ? (
                    <div
                      className="product-price"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <span
                        style={{
                          textDecoration: "line-through",
                          color: "#999",
                          fontSize: "24px",
                        }}
                      >
                        ${product.price.toFixed(2)}
                      </span>
                      <span
                        style={{
                          color: "#e74c3c",
                          fontSize: "32px",
                          fontWeight: "700",
                        }}
                      >
                        ${displayedPrice.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <div className="product-price">
                      ${displayedPrice.toFixed(2)}
                      {selectedCoupon?.requires_verified_email &&
                        !isEmailVerified && (
                          <FaLock
                            size={14}
                            style={{ marginLeft: "8px", color: "#f39c12" }}
                            title="Login or verify email to use this coupon"
                          />
                        )}
                    </div>
                  )}

                  {/* Stock Alerts */}
                  {isOutOfStock && (
                    <div className="stock-alert stock-alert-danger">
                      <FaExclamationTriangle />
                      <span>Out of Stock</span>
                    </div>
                  )}
                  {isLowStock && (
                    <div className="stock-alert stock-alert-warning">
                      <FaExclamationTriangle />
                      <span>Only {product.quantity} left!</span>
                    </div>
                  )}

                  {/* Popularity Stats */}
                  {stats &&
                    (stats.wishlistCount > 0 || stats.cartCount > 0) && (
                      <div className="popularity-stats">
                        {stats.wishlistCount > 0 && (
                          <div className="popularity-stat">
                            ❤️{" "}
                            <span>
                              {stats.wishlistCount}{" "}
                              {stats.wishlistCount === 1
                                ? "person has"
                                : "people have"}{" "}
                              this in their wishlist
                            </span>
                          </div>
                        )}
                        {stats.cartCount > 0 && (
                          <div className="popularity-stat">
                            🛒{" "}
                            <span>
                              {stats.cartCount}{" "}
                              {stats.cartCount === 1
                                ? "person has"
                                : "people have"}{" "}
                              this in their cart
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                </div>

                {/* Coupons Section - Compact, alongside header */}
                {coupons.length > 0 && (
                  <div className="product-header-coupons">
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

              {/* Action Buttons */}
              <div className="product-actions">
                <button
                  className="btn-add-to-cart"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                >
                  {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                </button>
                <button
                  className={`btn-wishlist ${isProductInWishlist ? "active" : ""}`}
                  onClick={handleToggleWishlist}
                >
                  {isProductInWishlist ? (
                    <FaHeart className="wishlist-icon-active" />
                  ) : (
                    <FaRegHeart />
                  )}
                </button>
              </div>

              {/* Product Information Table */}
              <div className="product-info-table">
                <h2 className="product-info-table-title">
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
              <div className="shipping-info">
                <div className="shipping-item">
                  <FaWarehouse className="shipping-icon" />
                  <span>
                    <strong>Ships from:</strong> {product.location_name},{" "}
                    {product.location_state}
                  </span>
                </div>
                {coupons.some((c) => c.free_shipping) && (
                  <div className="shipping-item">
                    <FaShippingFast className="shipping-icon" />
                    <span>Free shipping available with coupon!</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          {stats && stats.reviewCount > 0 && (
            <div className="reviews-section">
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
