import { useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import {
  FaCross,
  FaEnvelope,
  FaPrayingHands,
  FaHeart,
  FaStar,
  FaShoppingBag,
} from "react-icons/fa";

const SHOP_EMAIL = "tazdecorcatholiccompany@gmail.com";

const About = () => {
  const [copied, setCopied] = useState(false);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  // Copies the shop email to clipboard; falls back to execCommand for older browsers
  const handleEmailCopy = async (e: MouseEvent) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(SHOP_EMAIL);
    } catch {
      // Fallback for older browsers — the helper class keeps the textarea off-screen
      const ta = document.createElement("textarea");
      ta.value = SHOP_EMAIL;
      ta.className = "about-clipboard-fallback";
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
      <header className="about-header">
        <div className="about-header-inner">
          <h1 className="about-title">About Us</h1>
          <p className="about-subtitle">
            A family rooted in faith, sharing it with yours.
          </p>
          <a href={`mailto:${SHOP_EMAIL}`} className="about-email-pill">
            <FaEnvelope aria-hidden="true" /> {SHOP_EMAIL}
          </a>
        </div>
      </header>

      <div className="about-body">
        {/* Our Story */}
        <section className="about-section">
          <div className="about-section-label">Our Story</div>
          <div className="about-story-layout">
            <div className="about-story-text">
              <h2 className="about-section-heading">
                Born from Faith, Built with Love
              </h2>
              <p className="about-story-lead">
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
          </div>
        </section>

        {/* Section Divider */}
        <div className="about-divider" aria-hidden="true">
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

          {/* Mission cards */}
          <ul className="about-mission-cards">
            <li className="about-mission-card">
              <div className="about-mission-icon" aria-hidden="true">
                <FaPrayingHands />
              </div>
              <h3>Faith First</h3>
              <p>
                Every item we carry is chosen with intention. We ask ourselves:
                Does it inspire devotion? If the answer is yes, it earns a place
                in our shop.
              </p>
            </li>
            <li className="about-mission-card">
              <div className="about-mission-icon" aria-hidden="true">
                <FaHeart />
              </div>
              <h3>Made for You</h3>
              <p>
                We're not a big corporation. We're a family — and we treat every
                customer like one too. Your questions, your needs, and your
                stories matter deeply to us.
              </p>
            </li>
            <li className="about-mission-card">
              <div className="about-mission-icon" aria-hidden="true">
                <FaStar />
              </div>
              <h3>Quality & Care</h3>
              <p>
                We hand-pick every piece so you don't have to wonder. Whether
                it's a gift or something for your own home, you can trust that
                it was chosen with care.
              </p>
            </li>
          </ul>
        </section>

        {/* Section Divider */}
        <div className="about-divider" aria-hidden="true">
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

          {/* Contact cards */}
          <div className="about-contact-cards">
            <button
              type="button"
              onClick={handleEmailCopy}
              className="about-contact-card"
            >
              <span className="about-contact-icon" aria-hidden="true">
                <FaEnvelope />
              </span>
              <span className="about-contact-title">Send us an Email</span>
              <span className="about-contact-email">{SHOP_EMAIL}</span>
              {/* Toggles between copy prompt and confirmation message */}
              <span className="about-contact-sub" role="status">
                {copied
                  ? "Copied to clipboard!"
                  : "Click to copy our email address"}
              </span>
            </button>
            <Link to="/product-catalog" className="about-contact-card">
              <span className="about-contact-icon" aria-hidden="true">
                <FaShoppingBag />
              </span>
              <span className="about-contact-title">Visit Our Shop</span>
              <span className="about-contact-sub">
                Browse our full collection
              </span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;