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

  // Renders a 5-star row for a given rating, using full, half, and empty star icons
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    // Show a half star when the decimal portion is 0.5 or above
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="text-warning" />);
    }

    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-warning" />);
    }

    // Fill the remaining slots up to 5 with empty stars
    const remainingStars = 5 - stars.length;
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-warning" />);
    }

    return stars;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (reviewCount === 0) {
    return (
      <div className="mt-5">
        <h4>Customer Reviews</h4>
        <p className="text-muted">
          No reviews yet. Be the first to review this product!
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <h4>Customer Reviews</h4>

      {/* Average Rating Summary */}
      {averageRating && (
        <div className="d-flex align-items-center mb-4">
          <div className="me-3">
            <h2 className="mb-0">{averageRating.toFixed(1)}</h2>
          </div>
          <div>
            <div className="d-flex mb-1">{renderStars(averageRating)}</div>
            {/* Pluralizes "review" correctly based on count */}
            <p className="text-muted mb-0">
              {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
            </p>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <p>Loading reviews...</p>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => (
            <div key={review.review_id} className="border-bottom pb-3 mb-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  {/* Star rating row with optional verified purchase badge */}
                  <div className="d-flex align-items-center mb-1">
                    {renderStars(review.rating)}
                    {review.is_verified_purchase && (
                      <span className="badge bg-success ms-2 d-flex align-items-center">
                        <FaCheckCircle className="me-1" size={12} />
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  {/* Review title */}
                  {review.review_title && (
                    <h6 className="mb-1">{review.review_title}</h6>
                  )}
                </div>
                <small className="text-muted">
                  {formatDate(review.created_at)}
                </small>
              </div>

              {/* Review body text */}
              {review.review_text && (
                <p className="mb-2">{review.review_text}</p>
              )}

              <div className="d-flex justify-content-between align-items-center">
                {/* Reviewer name and variant details */}
                <div>
                  <small className="text-muted">
                    By {review.user_name}
                    {review.variant_details && ` • ${review.variant_details}`}
                  </small>
                </div>
                {/* Helpful count */}
                {review.helpful_count > 0 && (
                  <small className="text-muted">
                    {review.helpful_count}{" "}
                    {review.helpful_count === 1 ? "person" : "people"} found
                    this helpful
                  </small>
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
