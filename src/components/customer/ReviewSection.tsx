import { useState, useEffect } from "react";
import {
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaCheckCircle,
} from "react-icons/fa";
import { fetchProductReviews, type Review } from "../../api/reviews";
import { formatDate } from "../../utils/formatDate";

interface ReviewSectionProps {
  productId: number;
  averageRating: number | null;
  reviewCount: number;
}

const ReviewSection = ({
  productId,
  averageRating,
  reviewCount,
}: ReviewSectionProps) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  // Fetches all reviews for the product on mount or when the productId changes
  useEffect(() => {
    const loadReviews = async () => {
      try {
        const data = await fetchProductReviews(productId);
        setReviews(data);
      } catch (error) {
        console.error("Error loading reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [productId]);

  // ============================================================================
  // HELPERS
  // ============================================================================

  // Renders a 5-star row for a given rating, using full, half, and empty star icons.
  // The row is exposed to assistive tech as a single labelled image.
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    // Show a half star when the decimal portion is 0.5 or above
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <FaStar key={`full-${i}`} className="review-section-star" aria-hidden="true" />,
      );
    }

    if (hasHalfStar) {
      stars.push(
        <FaStarHalfAlt key="half" className="review-section-star" aria-hidden="true" />,
      );
    }

    // Fill the remaining slots up to 5 with empty stars
    const remainingStars = 5 - stars.length;
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <FaRegStar key={`empty-${i}`} className="review-section-star" aria-hidden="true" />,
      );
    }

    return (
      <span
        className="review-section-stars"
        role="img"
        aria-label={`${rating} out of 5 stars`}
      >
        {stars}
      </span>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (reviewCount === 0) {
    return (
      <div className="review-section">
        <h2 className="review-section-heading">Customer Reviews</h2>
        <p className="review-section-muted">
          No reviews yet. Be the first to review this product!
        </p>
      </div>
    );
  }

  return (
    <div className="review-section">
      <h2 className="review-section-heading">Customer Reviews</h2>

      {/* Average Rating Summary */}
      {averageRating && (
        <div className="review-section-summary">
          <div className="review-section-summary-score-wrap">
            <p className="review-section-summary-score">{averageRating.toFixed(1)}</p>
          </div>
          <div>
            <div className="review-section-summary-stars">{renderStars(averageRating)}</div>
            {/* Pluralizes "review" correctly based on count */}
            <p className="review-section-summary-count">
              {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
            </p>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <p className="review-section-muted">Loading reviews...</p>
      ) : (
        <div className="review-section-list">
          {reviews.map((review) => (
            <div key={review.review_id} className="review-section-review-item">
              <div className="review-section-review-item-top">
                <div>
                  {/* Star rating row with optional verified purchase badge */}
                  <div className="review-section-review-stars-row">
                    {renderStars(review.rating)}
                    {review.is_verified_purchase && (
                      <span className="review-section-verified-badge">
                        <FaCheckCircle className="review-section-verified-icon" size={12} />
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  {/* Review title */}
                  {review.review_title && (
                    <h3 className="review-section-review-title">{review.review_title}</h3>
                  )}
                </div>
                <time className="review-section-date">
                  {formatDate(review.created_at)}
                </time>
              </div>

              {/* Review body text */}
              {review.review_text && (
                <p className="review-section-review-text">{review.review_text}</p>
              )}

              <div className="review-section-review-item-bottom">
                {/* Reviewer name and variant details */}
                <div>
                  <span className="review-section-meta">
                    By {review.user_name}
                    {review.variant_details && ` • ${review.variant_details}`}
                  </span>
                </div>
                {/* Helpful count */}
                {review.helpful_count > 0 && (
                  <span className="review-section-meta">
                    {review.helpful_count}{" "}
                    {review.helpful_count === 1 ? "person" : "people"} found
                    this helpful
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;