import { Link } from "react-router-dom";
import { FaCross } from "react-icons/fa";
import PrimaryImage from "../../../../public/PrimaryImage.jpeg";

const Home = () => {
  return (
    <div className="home-page">
      {/* Hero Image Banner */}
      <section className="home-hero">
        <img
          src={PrimaryImage}
          alt="Taz Decor Catholic Shop — Saints illustration"
          className="home-hero-image"
          fetchPriority="high"
        />
        <div className="home-hero-overlay" aria-hidden="true" />
      </section>

      {/* Welcome Section — a card that overlaps the bottom of the hero */}
      <section className="home-content">
        <div className="home-card">
          {/* Cross divider icon */}
          <div className="home-cross-divider" aria-hidden="true">
            <span className="home-cross-symbol">
              <FaCross />
            </span>
          </div>

          <p className="home-eyebrow">Catholic Gifts &amp; Home Décor</p>

          <h1 className="home-title">Welcome to Taz Decor's Catholic Shop</h1>

          <p className="home-description">
            Each one of our items has been carefully chosen to share our
            Catholic Faith with you. We hope you like them as much as we do. If
            you want a specific item of one of our Saints, let us know and we
            will make it happen for you. Please feel free to message us if you
            have any question — we will be happy to answer.
          </p>

          <p className="home-tagline">Thank you for your visit. God bless.</p>

          {/* Calls to action */}
          <div className="home-cta">
            <Link to="/product-catalog" className="home-shop-btn">
              Browse Our Collection
              <span className="home-btn-arrow" aria-hidden="true">
                →
              </span>
            </Link>
            <Link to="/about" className="home-secondary-btn">
              Our Story
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;