import React, { useState } from "react";
import "../../../styles/pages/customerInterface/Tokens.css";
import "../../../styles/pages/customerInterface/main/About.css";
import {
  FaCross,
  FaEnvelope,
  FaPrayingHands,
  FaHeart,
  FaStar,
  FaShoppingBag,
} from "react-icons/fa";

const About = () => {
  const [copied, setCopied] = useState(false);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  // Copies the shop email to clipboard; falls back to execCommand for older browsers
  const handleEmailCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    const email = "tazdecorcatholiccompany@gmail.com";
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = email;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="about-page">
      {/* Page Header */}
      <div className="about-header">
        <div className="about-header-inner">
          <h1 className="about-title">About Us</h1>
          <p className="about-subtitle">
            A family rooted in faith, sharing it with yours.
          </p>
          <a
            href="mailto:tazdecorcatholiccompany@gmail.com"
            className="about-email-pill"
          >
            <FaEnvelope /> tazdecorcatholiccompany@gmail.com
          </a>
        </div>
      </div>

      <div className="about-body">
        {/* Our Story */}
        <section className="about-section">
          <div className="about-section-label">Our Story</div>
          <div className="about-story-layout">
            <div className="about-story-text">
              <h2 className="about-section-heading">
                Born from Faith, Built with Love
              </h2>
              <p>
                As a family deeply rooted in our Catholic faith, we found
                ourselves constantly searching for beautiful, meaningful items
                that could bring that faith into our everyday home and life.
              </p>
              <p>
                What began as a personal passion became something we felt called
                to share. We started curating pieces that moved us, that
                reminded us of the beauty of our faith, and we thought: maybe
                others are searching for the same thing.
              </p>
              <p>
                That's how Taz Decor's Catholic Shop was born. A family wanting
                to help other families and individuals showcase their love for
                the faith.
              </p>
            </div>
            {/* <div className="about-story-aside">
              <div className="about-story-card">
                <div className="about-story-stat">
                  <span className="about-stat-number">540</span>
                  <span className="about-stat-label">Sales</span>
                </div>
                <div className="about-story-divider">
                  <FaCross />
                </div>
                <div className="about-story-stat">
                  <span className="about-stat-number">2022</span>
                  <span className="about-stat-label">Sharing faith since</span>
                </div>
                <div className="about-story-divider">
                  <FaCross />
                </div>
                <div className="about-story-stat">
                  <span className="about-stat-number">100%</span>
                  <span className="about-stat-label">Family-run with love</span>
                </div>
              </div>
            </div> */}
          </div>
        </section>

        {/* Section Divider */}
        <div className="about-divider">
          <span className="about-divider-line" />
          <span className="about-divider-cross">
            <FaCross />
          </span>
          <span className="about-divider-line" />
        </div>

        {/* Our Mission */}
        <section className="about-section">
          <div className="about-section-label">Our Mission</div>
          <h2 className="about-section-heading centered">What We Stand For</h2>

          {/* Mission cards — Faith First, Made for You, Quality & Care */}
          <div className="about-mission-cards">
            <div className="about-mission-card">
              <div className="about-mission-icon">
                {" "}
                <FaPrayingHands />
              </div>
              <h3>Faith First</h3>
              <p>
                Every item we carry is chosen with intention. We ask ourselves:
                Does it inspire devotion? If the answer is yes, it earns a place
                in our shop.
              </p>
            </div>
            <div className="about-mission-card">
              <div className="about-mission-icon">
                <FaHeart />
              </div>
              <h3>Made for You</h3>
              <p>
                We're not a big corporation. We're a family — and we treat every
                customer like one too. Your questions, your needs, and your
                stories matter deeply to us.
              </p>
            </div>
            <div className="about-mission-card">
              <div className="about-mission-icon">
                {" "}
                <FaStar />
              </div>
              <h3>Quality & Care</h3>
              <p>
                We hand-pick every piece so you don't have to wonder. Whether
                it's a gift or something for your own home, you can trust that
                it was chosen with care.
              </p>
            </div>
          </div>
        </section>

        {/* Section Divider */}
        <div className="about-divider">
          <span className="about-divider-line" />
          <span className="about-divider-cross">
            <FaCross />
          </span>
          <span className="about-divider-line" />
        </div>

        {/* Contact */}
        <section className="about-section">
          <div className="about-section-label">Get in Touch</div>
          <h2 className="about-section-heading centered">
            We'd Love to Hear from You
          </h2>
          <p className="about-contact-intro">
            Have a question, a special request, or just want to say hello? We're
            a real family behind this shop and we always enjoy connecting with
            our customers. Don't hesitate to reach out — we will be happy to
            answer.
          </p>

          {/* Contact cards — email copy button and shop link */}
          <div className="about-contact-cards">
            <button onClick={handleEmailCopy} className="about-contact-card">
              <div className="about-contact-icon">
                <FaEnvelope />
              </div>
              <div className="about-contact-title">Send us an Email</div>
              <div className="about-contact-email">
                tazdecorcatholiccompany@gmail.com
              </div>
              {/* Toggles between copy prompt and confirmation message */}
              <div className="about-contact-sub">
                {copied
                  ? "📋 Copied to clipboard!"
                  : "Click to copy our email address"}
              </div>
            </button>
            <a href="/items" className="about-contact-card">
              <div className="about-contact-icon">
                {" "}
                <FaShoppingBag />
              </div>
              <div className="about-contact-title">Visit Our Shop</div>
              <div className="about-contact-sub">
                Browse our full collection
              </div>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
