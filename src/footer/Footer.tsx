import React from "react";
import { Link } from "react-router-dom";

const CONTACT_EMAIL = "tazdecorcatholiccompany@gmail.com";

const columns = [
  {
    heading: "Help",
    links: [
      { label: "Shipping Policy", to: "/shipping-policy" },
      { label: "Return Policy", to: "/return-policy" },
    ],
    email: true,
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", to: "/privacy-policy" },
      { label: "Terms & Conditions", to: "/terms-and-conditions" },
    ],
  },
];

const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__top">
          <div className="footer__brand">
            <p className="footer__brand-name">Taz Decor</p>
            <p className="footer__brand-tagline">
              Catholic decor and gifts for your home.
            </p>
          </div>

          <nav className="footer__columns" aria-label="Footer">
            {columns.map(({ heading, links, email }) => (
              <div className="footer__column" key={heading}>
                <h2 className="footer__heading">{heading}</h2>
                <ul className="footer__list">
                  {links.map(({ label, to }) => (
                    <li key={to}>
                      <Link
                        to={to}
                        className="footer__link"
                        onClick={scrollToTop}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                  {email && (
                    <li>
                      <a
                        href={`mailto:${CONTACT_EMAIL}`}
                        className="footer__link"
                      >
                        Contact us
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="footer__bottom">
          <p className="footer__copyright">
            &copy; {new Date().getFullYear()} Taz Decor. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;