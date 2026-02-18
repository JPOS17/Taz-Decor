import { useState, useEffect } from "react";
import {
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaCheckCircle,
} from "react-icons/fa";
import { fetchProductReviews, type Review } from "../../api/reviews";

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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

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

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="text-warning" />);
    }

    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-warning" />);
    }

    const remainingStars = 5 - stars.length;
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-warning" />);
    }

    return stars;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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
                  <div className="d-flex align-items-center mb-1">
                    {renderStars(review.rating)}
                    {review.is_verified_purchase && (
                      <span className="badge bg-success ms-2 d-flex align-items-center">
                        <FaCheckCircle className="me-1" size={12} />
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  {review.review_title && (
                    <h6 className="mb-1">{review.review_title}</h6>
                  )}
                </div>
                <small className="text-muted">
                  {formatDate(review.created_at)}
                </small>
              </div>

              {review.review_text && (
                <p className="mb-2">{review.review_text}</p>
              )}

              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="text-muted">
                    By {review.user_name}
                    {review.variant_details && ` • ${review.variant_details}`}
                  </small>
                </div>
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
