import "../../styles/pages/main/Reviews.css";

// ============================================================================
// REVIEWS COMPONENT
// ============================================================================

const Reviews = () => {
  return (
    <div className="reviews-page">
      <div className="reviews-container">
        <div className="reviews-header">
          <h1 className="reviews-title">Reviews</h1>
        </div>

        <div className="reviews-coming-soon">
          <div className="coming-soon-icon">⭐</div>
          <h2 className="coming-soon-title">Reviews Coming Soon</h2>
          <p className="coming-soon-text">
            We're working hard to bring you customer reviews. Check back soon to
            see what our customers have to say!
          </p>
          <div className="coming-soon-badge">Stay Tuned</div>
        </div>
      </div>
    </div>
  );
};

export default Reviews;
