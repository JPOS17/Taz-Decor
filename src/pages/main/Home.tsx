import React from "react";
import "../../styles/pages/main/Home.css";
import PrimaryImage from "../../../public/PrimaryImage.jpeg";

import { FaCross } from "react-icons/fa";

// ============================================================================
// HOME COMPONENT
// ============================================================================

const Home = () => {
  return (
    <div className="home-page">
      {/* Hero Image Banner */}
      <div className="home-hero">
        <img
          src={PrimaryImage}
          alt="Taz Decor Catholic Shop — Saints illustration"
          className="home-hero-image"
        />
        <div className="home-hero-overlay" />
      </div>

      {/* Welcome Section */}
      <div className="home-content">
        <div className="home-content-inner">
          <div className="home-cross-divider">
            <span className="cross-symbol">
              <FaCross />
            </span>
          </div>

          <h1 className="home-title">Welcome to Taz Decor's Catholic Shop</h1>

          <p className="home-description">
            Each one of our items has been carefully chosen to share our
            Catholic Faith with you. We hope you like them as much as we do. If
            you want a specific item of one of our Saints, let us know and we
            will make it happen for you. Please feel free to message us if you
            have any question — we will be happy to answer.
          </p>

          <p className="home-tagline">Thank you for your visit. God bless.</p>

          <div className="home-cta">
            <a href="/items" className="home-shop-button">
              Browse Our Collection
              <span className="btn-arrow">→</span>
            </a>
          </div>

          <div className="home-cross-divider">
            <span className="cross-symbol">
              <FaCross />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
