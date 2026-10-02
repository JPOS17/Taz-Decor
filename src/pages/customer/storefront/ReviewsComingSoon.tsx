import { Link } from "react-router-dom";
import { FaStar } from "react-icons/fa";

// ============================================================================
// REVIEWS COMPONENT
// ============================================================================

const Reviews = () => {
  return (
    <div className="reviews-coming-soon-page">
      <div className="reviews-coming-soon-container">
        <header className="reviews-coming-soon-header">
          <h1 className="reviews-coming-soon-title">Reviews</h1>
        </header>

        <section className="reviews-coming-soon">
          <span className="reviews-coming-soon-icon-wrap" aria-hidden="true">
            <FaStar className="reviews-coming-soon-icon" />
          </span>
          <span className="reviews-coming-soon-badge">Stay Tuned</span>
          <h2 className="reviews-coming-soon-heading">Reviews Coming Soon</h2>
          <p className="reviews-coming-soon-text">
            We're working hard to bring you customer reviews. Check back soon to
            see what our customers have to say!
          </p>
          <Link to="/product-catalog" className="reviews-coming-soon-btn">
            Browse Our Collection
          </Link>
        </section>
      </div>
    </div>
  );
};

export default Reviews;