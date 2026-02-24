import React, { useState } from "react";
import "../../styles/pages/main/About.css";

const About = () => {
  const [copied, setCopied] = useState(false);

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
  return (
    <div className="about-page">
      {/* Page Header */}
      <div className="about-header">
        <div className="about-header-inner">
          <span className="about-cross">✝</span>
          <h1 className="about-title">About Us</h1>
          <p className="about-subtitle">
            A family rooted in faith, sharing it with yours.
          </p>
          <button onClick={handleEmailCopy} className="about-email-pill">
            {copied
              ? "📋 Email copied to clipboard!"
              : "✉️ tazdecorcatholiccompany@gmail.com"}
          </button>
        </div>
      </div>

      <div className="about-body">
        {/* Our Story */}
        <section className="about-section story-section">
          <div className="section-label">Our Story</div>
          <div className="story-layout">
            <div className="story-text">
              <h2 className="section-heading">
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
                That's how Taz Decor's Catholic Company was born. A family
                wanting to help other families and individuals showcase their
                love for the faith.
              </p>
            </div>
            <div className="story-aside">
              <div className="story-card">
                <div className="story-stat">
                  <span className="stat-number">540</span>
                  <span className="stat-label">Sales</span>
                </div>
                <div className="story-divider">✝</div>
                <div className="story-stat">
                  <span className="stat-number">2022</span>
                  <span className="stat-label">Sharing faith since</span>
                </div>
                <div className="story-divider">✝</div>
                <div className="story-stat">
                  <span className="stat-number">100%</span>
                  <span className="stat-label">Family-run with love</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="about-divider">
          <span className="divider-line" />
          <span className="divider-cross">✝</span>
          <span className="divider-line" />
        </div>

        {/* Mission */}
        <section className="about-section mission-section">
          <div className="section-label">Our Mission</div>
          <h2 className="section-heading centered">What We Stand For</h2>
          <div className="mission-cards">
            <div className="mission-card">
              <div className="mission-icon">🙏</div>
              <h3>Faith First</h3>
              <p>
                Every item we carry is chosen with intention. We ask ourselves:
                Does it inspire devotion? If the answer is yes, it earns a place
                in our shop.
              </p>
            </div>
            <div className="mission-card">
              <div className="mission-icon">❤️</div>
              <h3>Made for You</h3>
              <p>
                We're not a big corporation. We're a family — and we treat every
                customer like one too. Your questions, your needs, and your
                stories matter deeply to us.
              </p>
            </div>
            <div className="mission-card">
              <div className="mission-icon">✨</div>
              <h3>Quality & Care</h3>
              <p>
                We hand-pick every piece so you don't have to wonder. Whether
                it's a gift or something for your own home, you can trust that
                it was chosen with care.
              </p>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="about-divider">
          <span className="divider-line" />
          <span className="divider-cross">✝</span>
          <span className="divider-line" />
        </div>

        {/* Contact */}
        <section className="about-section contact-section">
          <div className="section-label">Get in Touch</div>
          <h2 className="section-heading centered">
            We'd Love to Hear from You
          </h2>
          <p className="contact-intro">
            Have a question, a special request, or just want to say hello? We're
            a real family behind this shop and we always enjoy connecting with
            our customers. Don't hesitate to reach out — we will be happy to
            answer.
          </p>
          <div className="contact-cards">
            <button onClick={handleEmailCopy} className="contact-card">
              <div className="contact-icon">✉️</div>
              <div className="contact-card-title">Send us an Email</div>
              <div className="contact-card-email">
                tazdecorcatholiccompany@gmail.com
              </div>
              <div className="contact-card-sub">
                {copied
                  ? "📋 Copied to clipboard!"
                  : "Click to copy our email address"}
              </div>
            </button>
            <a href="/items" className="contact-card">
              <div className="contact-icon">🛍️</div>
              <div className="contact-card-title">Visit Our Shop</div>
              <div className="contact-card-sub">
                Browse our full Catholic collection
              </div>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
