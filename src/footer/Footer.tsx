import React from "react";
import { Link } from "react-router-dom";
import "../styles/footer/footer.css";

const Footer: React.FC = () => {
  const links = [
    { label: "Privacy Policy", to: "/privacy-policy" },
    { label: "Terms & Conditions", to: "/terms-and-conditions" },
    { label: "Return Policy", to: "/return-policy" },
    { label: "Shipping Policy", to: "/shipping-policy" },
  ];

  return (
    <footer className="footer">
      <nav aria-label="Legal links">
        <ul className="footer__nav">
          {links.map(({ label, to }, i, arr) => (
            <React.Fragment key={to}>
              <li>
                <Link
                  to={to}
                  className="footer__link"
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                >
                  {label}
                </Link>
              </li>
              {i < arr.length - 1 && (
                <li aria-hidden="true" className="footer__divider">
                  |
                </li>
              )}
            </React.Fragment>
          ))}
        </ul>
      </nav>
      <p className="footer__copyright">
        &copy; {new Date().getFullYear()} Taz Decor. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
